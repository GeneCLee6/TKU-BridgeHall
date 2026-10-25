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
      expect(sum(page.columns.map((c) => c.width))).toBeCloseTo(100, 5)
    }
    for (const { block } of templateBlocks(t)) {
      if (block.kind !== 'table') continue
      const widths = [block.rowHeader.width, ...block.columns.map((c) => c.width)]
      widths.forEach((w) => expect(w, block.id).toBeGreaterThan(0))
      expect(sum(widths), block.id).toBeCloseTo(100, 5)
    }
  })

  it('marks every unverified layout as pending', () => {
    // Update when a template is checked against the original file (then drop its `pending`)
    expect(cardTemplates.filter((t) => t.pending).map((t) => t.id)).toEqual([
      'wbf',
      'ctcba-simple',
      'ctcba-simple-2p',
    ])
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

  it('has every section of page 1, in print order', () => {
    expect(titles(0)).toEqual([
      'DEFENSIVE AND COMPETITIVE BIDDING',
      'OVERCALLS (Style; Responses; 1/2 Level; Reopening)',
      '1NT OVERCALL (2ND/4TH Live; Reopening)',
      'JUMP OVERCALLS (Style; Responses; Unusual NT)',
      'DIRECT AND JUMP CUE BIDS (Style; Responses; Reopen)',
      'VS. NT (vs. Strong / Weak; Reopening; PH)',
      'VS. PREEMPTS ( Doubles; Cue-bids; Jumps; NT bids)',
      'VS. ARTIFICIAL STRONG OPENINGS',
      "OVER OPPONENTS' TAKE OUT DOUBLE",
      'LEADS AND SIGNALS',
      'OPENING LEADS STYLE',
      'Other:',
      'LEADS',
      'SIGNALS IN ORDER OF PRIORITY',
      'Signals (including Trumps):',
      'DOUBLES',
      'TAKEOUT DOUBLES (Style; Responses; Reopening)',
      'SPECIAL, ARTIFICIAL AND COMPETITIVE DOUBLES/REDOUBLES',
      'WBF Convention Card 2.19',
      'Category:',
      'Country:',
      'Event:',
      'Players:',
      'SYSTEM SUMMARY',
      'GENERAL APPROACH AND STYLE',
      'SPECIAL BIDS THAT MAY REQUIRE DEFENCE',
      'SPECIAL FORCING PASS SEQUENCES',
      "IMPORTANT NOTES THAT DON'T FIT ELSEWHERE",
      'Psychics:',
    ])
  })

  it('has page 1 columns of equal height (45 printed lines)', () => {
    for (const column of wbf.pages[0].columns) expect(sum(column.blocks.map(lines)), column.id).toBe(45)
  })

  it('has the opening bid table and high level bidding on page 2', () => {
    expect(titles(1)).toEqual(['OPENING BID DESCRIPTIONS', 'HIGH LEVEL BIDDING'])
    const table = wbf.pages[1].columns[0].blocks[0]
    if (table.kind !== 'table') throw new Error('expected a table')
    expect([table.rowHeader.label, ...table.columns.map((c) => c.label)]).toEqual([
      'Opening',
      'Artificial',
      'Min.',
      'Neg Dbl thru',
      'Description',
      'Responses',
      'Subsequent Auction',
      'Passed Hand Bidding',
    ])
    expect(sum(table.rows.map((r) => r.lines ?? 1))).toBe(24)
  })

  it('has the slot ids the fill rules refer to', () => {
    const slots = templateSlots(wbf).map((s) => s.id)
    expect(slots).toContain('wbf.summary.general')
    expect(slots).toContain('wbf.openings.1H.responses')
    expect(slots).toContain('wbf.leads.leads.king.nt')
    expect(slots).toContain('wbf.leads.signals.suit-1.partner')
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

  it('has the same cells on the two-sided card, over two pages', () => {
    expect(ctcbaSimple2p.pages).toHaveLength(2)
    const ids = (t: CardTemplate) => templateBlocks(t).map(({ block }) => block.id)
    expect(ids(ctcbaSimple2p)).toEqual(ids(ctcbaSimple))
  })
})
