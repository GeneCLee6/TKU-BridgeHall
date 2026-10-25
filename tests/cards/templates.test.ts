import { templateBlocks, templateSlots } from '../../src/cards/slots.ts'
import { cardTemplates } from '../../src/cards/templates/index.ts'
import type { CardBlock, CardTemplate } from '../../src/cards/types.ts'
import { wbf } from '../../src/cards/templates/wbf.ts'
import { ctcbaSimple } from '../../src/cards/templates/ctcba-simple.ts'
import { ctcbaSimple2p } from '../../src/cards/templates/ctcba-simple-2p.ts'

const byId = (t: CardTemplate) => [t.id, t] as const
const ID = /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*(\.[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*)*$/
const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0)

/** Printed lines a block takes in its column; titles count as one line */
function lines(block: CardBlock): number {
  switch (block.kind) {
    case 'heading':
      return block.lines ?? 1
    case 'note':
    case 'check':
    case 'choice':
      return 1
    case 'banner':
    case 'text':
      return block.lines
    case 'cells':
      return 1 + block.lines
    case 'table':
      return (block.title ? 1 : 0) + 1 + sum(block.rows.map((r) => r.lines ?? 1))
    case 'group':
      return sum(block.blocks.map(lines))
    case 'split':
      return Math.max(...block.parts.map((p) => sum(p.blocks.map(lines))))
  }
}

/** Every label printed on the card: what must be non-empty */
function labels(block: CardBlock): string[] {
  switch (block.kind) {
    case 'heading':
    case 'banner':
    case 'cells':
      return [block.title]
    case 'note':
      return [block.text]
    case 'check':
      return [block.label, ...(block.blank ? [block.blank.label] : [])]
    case 'choice':
      return [block.label, ...block.options.map((o) => o.label)]
    case 'text':
    case 'group':
      return [block.label]
    case 'split':
      return []
    case 'table':
      return [...block.columns.map((c) => c.label), ...block.rows.map((r) => r.label)]
  }
}

describe('card templates', () => {
  it('registers every template file once, named after its id', () => {
    const files = Object.keys(import.meta.glob('../../src/cards/templates/*.ts'))
      .map((p) => p.split('/').pop()!.replace(/\.ts$/, ''))
      .filter((name) => name !== 'index')
      .sort()
    const ids = cardTemplates.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect([...ids].sort()).toEqual(files)
  })

  it.each(cardTemplates.map(byId))('%s has its metadata and at least one page', (_, t) => {
    expect(t.name.trim()).not.toBe('')
    expect(t.publisher.trim()).not.toBe('')
    expect(t.year).toBeGreaterThanOrEqual(2000)
    expect(t.pages.length).toBeGreaterThan(0)
    expect(new Set(t.pages.map((p) => p.id)).size).toBe(t.pages.length)
  })

  it.each(cardTemplates.map(byId))('%s has unique, well-formed block and slot ids', (_, t) => {
    const ids = templateBlocks(t).map(({ block }) => block.id)
    ids.forEach((id) => expect(id).toMatch(ID))
    expect(new Set(ids).size).toBe(ids.length)
    const slots = templateSlots(t).map((s) => s.id)
    expect(slots.length).toBeGreaterThan(0)
    slots.forEach((id) => expect(id.startsWith(`${t.id}.`)).toBe(true))
    expect(new Set(slots).size).toBe(slots.length)
  })

  it.each(cardTemplates.map(byId))('%s labels every cell', (_, t) => {
    for (const { block } of templateBlocks(t)) {
      // Row-label header cells may be blank on the printed form; everything else has text
      labels(block).forEach((label) => expect(label.trim(), block.id).not.toBe(''))
      if (block.kind === 'table')
        expect(new Set(block.rows.map((r) => r.id)).size, block.id).toBe(block.rows.length)
      if (block.kind === 'table')
        expect(new Set(block.columns.map((c) => c.id)).size, block.id).toBe(block.columns.length)
      if (block.kind === 'choice') {
        expect(block.options.length, block.id).toBeGreaterThan(1)
        expect(new Set(block.options.map((o) => o.id)).size, block.id).toBe(block.options.length)
      }
      if (block.kind === 'group') expect(block.blocks.length, block.id).toBeGreaterThan(0)
    }
  })

  it.each(cardTemplates.map(byId))('%s has widths that add up to the page and table width', (_, t) => {
    for (const page of t.pages) {
      expect(new Set(page.columns.map((c) => c.id)).size).toBe(page.columns.length)
      const gaps = page.gaps ?? []
      expect(gaps.length, page.id).toBe(page.gaps ? page.columns.length - 1 : 0)
      expect(sum([...page.columns.map((c) => c.width), ...gaps])).toBeCloseTo(100, 5)
    }
    for (const { block } of templateBlocks(t)) {
      let widths: number[] | undefined
      if (block.kind === 'table') widths = [block.rowHeader.width, ...block.columns.map((c) => c.width)]
      if (block.kind === 'split') widths = block.parts.map((p) => p.width)
      if (block.kind === 'group' && block.widths) {
        widths = block.widths
        expect(widths.length, block.id).toBe(block.columns + 1)
      }
      if (!widths) continue
      widths.forEach((w) => expect(w, block.id).toBeGreaterThan(0))
      expect(sum(widths), block.id).toBeCloseTo(100, 5)
    }
  })

  it.each(cardTemplates.map(byId))('%s cites the source of every help text', (_, t) => {
    for (const { block } of templateBlocks(t)) {
      const helps = [
        'help' in block ? block.help : undefined,
        ...(block.kind === 'table' ? [block.rowHeader.help, ...block.columns.map((c) => c.help)] : []),
      ]
      for (const help of helps) {
        if (!help) continue
        expect(help.text.trim(), block.id).not.toBe('')
        expect(help.source, block.id).toMatch(/, p\. \d+(–\d+)?$/)
      }
    }
  })

  it.each(cardTemplates.map(byId))('%s puts a table inset over existing rows and columns', (_, t) => {
    for (const { block } of templateBlocks(t)) {
      if (block.kind !== 'table' || !block.inset) continue
      expect(block.rows.map((r) => r.id), block.id).toContain(block.inset.fromRow)
      block.inset.columns.forEach((c) => expect(block.columns.map((col) => col.id), block.id).toContain(c))
    }
  })

  it('marks every unverified layout as pending', () => {
    // Update when a template is checked against the original file (then drop its `pending`).
    // WBF: the layout follows the blank .doc; which edition to file is still open.
    expect(cardTemplates.filter((t) => t.pending).map((t) => t.id)).toEqual(['wbf'])
  })
})

describe('WBF card', () => {
  const titles = (page: number) =>
    wbf.pages[page].columns.flatMap((c) =>
      c.blocks.map((b) => ('title' in b ? b.title : b.kind === 'text' ? b.label : b.id)),
    )

  it('is two landscape pages: three columns, then the opening bid table', () => {
    expect(wbf.paper).toBe('A4-landscape')
    expect(wbf.pages.map((p) => p.columns.map((c) => c.id))).toEqual([
      ['defence', 'leads', 'summary'],
      ['openings'],
    ])
  })

  it('has every section of page 1, in print order, as printed on the blank .doc', () => {
    expect(titles(0)).toEqual([
      'DEFENSIVE AND COMPETITIVE BIDDING',
      'OVERCALLS (Style: Responses: 1 / 2  Level; Reopening)',
      '1NT OVERCALL (2nd/4th Live; Responses; Reopening)',
      'JUMP OVERCALLS (Style; Responses; Unusual NT)',
      'Reopen:',
      'DIRECT & JUMP CUE BIDS (Style; Response; Reopen)',
      'VS. NT (vs. Strong/Weak; Reopening;PH)',
      'VS.PREEMTS (Doubles; Cue-bids; Jumps; NT Bids)',
      'VS. ARTIFICIAL STRONG OPENINGS- i.e. 1♣ or 2♣',
      'OVER OPPONENTS’ TAKEOUT DOUBLE',
      'LEADS AND SIGNALS',
      'OPENING LEADS STYLE',
      'Other:',
      'LEADS',
      'SIGNALS IN ORDER OF PRIORITY',
      'Signals (including Trumps):',
      'DOUBLES',
      'TAKEOUT DOUBLES (Style; Responses; Reopening)',
      'SPECIAL, ARTIFICIAL & COMPETITIVE DBLS/RDLS',
      'W B F CONVENTION CARD',
      'CATEGORY:',
      'NCBO:',
      'PLAYERS:',
      'SYSTEM SUMMARY',
      'GENERAL APPROACH AND STYLE',
      'SPECIAL BIDS THAT MAY REQUIRE DEFENSE',
      'SPECIAL FORCING PASS SEQUENCES',
      'IMPORTANT NOTES',
      'PSYCHICS:',
    ])
  })

  it('has page 1 columns of equal height (the 43 rows of the .doc table)', () => {
    for (const column of wbf.pages[0].columns) expect(sum(column.blocks.map(lines)), column.id).toBe(43)
  })

  it('has the .doc widths in twips: 5068 | 203 | 5629 | 184 | 4819', () => {
    const [p1] = wbf.pages
    const total = 15903
    expect(p1.columns.map((c) => Math.round((c.width * total) / 100))).toEqual([5068, 5629, 4819])
    expect(p1.gaps!.map((g) => Math.round((g * total) / 100))).toEqual([203, 184])
  })

  it('has the opening bid table with high level bidding inset on page 2', () => {
    expect(titles(1)).toEqual(['openings'])
    const table = wbf.pages[1].columns[0].blocks[0]
    if (table.kind !== 'table') throw new Error('expected a table')
    expect([table.rowHeader.label, ...table.columns.map((c) => c.label)]).toEqual([
      'OPENING',
      'TICK IF ARTIFICIAL',
      'MIN. NO. OF CARDS',
      'NEG.DBL THRU',
      'DESCRIPTION',
      'RESPONSES',
      'SUBSEQUENT ACTION',
      'PASSED HAND BIDDING',
    ])
    expect([table.rowHeader.width, ...table.columns.map((c) => c.width)].map((w) => Math.round(w * 161.26))).toEqual(
      [959, 725, 842, 843, 2551, 3969, 3544, 2693],
    )
    expect(table.rows.map((r) => r.label).join(' ')).toBe(
      '1♣ 1♦ 1♥ 1♠ 1NT 2♣ 2♦ 2♥ 2♠ 2NT 3♣ 3♦ 3♥ 3♠ 3NT 4♣ 4♦ 4♥ 4♠ 4NT 5♣ 5♦ 5♥ 5♠',
    )
    // The .doc's 39 body rows, less the three thin filler rows under 5♠
    expect(sum(table.rows.map((r) => r.lines ?? 1))).toBe(36)
    expect(table.inset?.block.title).toBe('HIGH LEVEL BIDDING')
  })

  it('has the slot ids the fill rules refer to', () => {
    const slots = templateSlots(wbf).map((s) => s.id)
    expect(slots).toContain('wbf.summary.general')
    expect(slots).toContain('wbf.openings.1H.responses')
    expect(slots).toContain('wbf.leads.leads.king.nt')
    expect(slots).toContain('wbf.leads.signals.suit-1.partner')
    expect(slots).toContain('wbf.high-level')
    expect(slots).toContain('wbf.openings.5C.responses')
    expect(slots).not.toContain('wbf.openings.5C.subsequent')
    expect(slots).not.toContain('wbf.openings.5S.passed-hand')
    expect(slots).toContain('wbf.openings.4NT.passed-hand')
  })

  it('has help from the 2017 guide on every fill-in', () => {
    for (const { block } of templateBlocks(wbf)) {
      if (block.kind === 'cells' || block.kind === 'text' || block.kind === 'table')
        expect(block.help?.source, block.id).toMatch(/^Guide to Completion of the WBF System Card \(2017\)/)
    }
  })
})

describe('CTCBA simple cards', () => {
  const checks = (t: CardTemplate) =>
    templateBlocks(t).flatMap(({ block }) => (block.kind === 'check' ? [block] : []))

  it('is one landscape page with the four sections', () => {
    expect(ctcbaSimple.paper).toBe('A4-landscape')
    expect(ctcbaSimple.pages).toHaveLength(1)
    const sections = templateBlocks(ctcbaSimple).flatMap(({ block }) =>
      block.kind === 'heading' ? [block.title] : block.kind === 'group' ? [block.label] : [],
    )
    expect(sections).toEqual([
      '開叫約定',
      '無王',
      '高花',
      '低花',
      '其他約定',
      '競叫約定',
      '對抗無王開叫',
      '防禦約定',
      '首攻',
      '防禦訊號',
    ])
  })

  it('never marks a check both default and alert', () => {
    for (const check of checks(ctcbaSimple)) expect(check.default && check.alert, check.id).toBeFalsy()
  })

  it('prints the defaults in bold italic as on the card', () => {
    expect(checks(ctcbaSimple).filter((c) => c.default).map((c) => c.label)).toEqual([
      '強無王(15-17)',
      'Stayman',
      '保證 5 張高花',
      '加二支持：邀請',
      '正序低花',
      '弱二開叫',
      '迫伴賭倍',
      '01 & 4th',
    ])
  })

  it('has the same cells on the two-sided card, front and back, printed two-up', () => {
    expect(ctcbaSimple2p.pages.map((p) => p.id)).toEqual(['front', 'back'])
    expect(ctcbaSimple2p.nUp).toBe(2)
    const ids = (t: CardTemplate) =>
      templateBlocks(t)
        .map(({ block }) => block.id)
        .filter((id) => !id.endsWith('.turn-over'))
    expect(ids(ctcbaSimple2p)).toEqual(ids(ctcbaSimple))
    expect(templateSlots(ctcbaSimple2p).map((s) => s.id.replace(/^[^.]+/, ''))).toEqual(
      templateSlots(ctcbaSimple).map((s) => s.id.replace(/^[^.]+/, '')),
    )
  })

  it('has the halves measured from the PDF (340 and 354 pt, 36 pt gutter)', () => {
    const [p1] = ctcbaSimple.pages
    expect(p1.columns.map((c) => Math.round(c.width * 7.3))).toEqual([340, 354])
    expect(p1.gaps!.map((g) => Math.round(g * 7.3))).toEqual([36])
  })
})
