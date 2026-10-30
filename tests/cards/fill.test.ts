import { describe, expect, it } from 'vitest'
import { formatCardSlot, parseCardSlot } from '../../src/cards/cardSlots.ts'
import { fillCard, slotSpaces, textWidth } from '../../src/cards/fill.ts'
import { templateSlots } from '../../src/cards/slots.ts'
import { cardTemplates } from '../../src/cards/templates/index.ts'
import { ctcbaSimple } from '../../src/cards/templates/ctcba-simple.ts'
import { ctcbaSimple2p } from '../../src/cards/templates/ctcba-simple-2p.ts'
import { wbf } from '../../src/cards/templates/wbf.ts'
import type { CardTemplate } from '../../src/cards/types.ts'
import { conventions as bundled } from '../../src/content/index.ts'
import type { SystemProfile } from '../../src/lib/api.ts'
import { resolveProfile } from '../../src/lib/profiles.ts'
import type { Convention } from '../../src/types/convention.ts'

const profile = (p: Partial<SystemProfile> & Pick<SystemProfile, 'id' | 'scope'>): SystemProfile => ({
  name: p.id,
  adopted: {},
  overrides: [],
  notes: [],
  version: 1,
  updatedAt: 0,
  updatedBy: 'u',
  ...p,
})

const club = (content: Convention[] = bundled, profiles: SystemProfile[] = []) => resolveProfile(profiles, 'club', content)

// A small card: a two-line text block, a one-line table and a check, 100 pt wide at 10 pt
// (so 18 half-width characters a line: 8.5 pt goes to the cell's padding)
const mini: CardTemplate = {
  id: 'wbf',
  name: 'Mini',
  year: 2000,
  publisher: 'Test',
  paper: 'A4-portrait',
  language: 'en',
  printWidth: 100,
  fontSize: 10,
  pages: [
    {
      id: 'p',
      columns: [
        {
          id: 'c',
          width: 100,
          blocks: [
            { kind: 'cells', id: 'box', title: 'BOX', lines: 2 },
            {
              kind: 'table',
              id: 't',
              rowHeader: { label: '', width: 50 },
              columns: [{ id: 'x', label: 'X', width: 50 }],
              rows: [{ id: 'r', label: 'R' }],
            },
            { kind: 'check', id: 'tick', label: 'Tick' },
            { kind: 'choice', id: 'pick', label: 'Pick', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] },
          ],
        },
      ],
    },
  ],
}

const sample = (cardSlots: string[], slug = 'sample'): Convention => ({
  slug,
  nameZh: '範例特約',
  nameEn: 'Sample',
  category: 'notrump',
  tags: [],
  summary: '',
  source: { title: 'Word' },
  updated: '2026-01-01',
  cardSlots,
  sections: [
    {
      id: 'top',
      title: '上層',
      blocks: [
        { kind: 'paragraph', text: '**短**' },
        {
          kind: 'responses',
          auction: { seats: ['N', 'E', 'S', 'W'], calls: ['1NT', '', '?'] },
          rows: [
            { call: '2C', meaning: 'stayman' },
            { call: '2D', meaning: 'transfer', pending: '原文不清楚' },
          ],
        },
        { kind: 'rules', items: [{ text: '一', children: [{ text: '二' }] }, { text: '三' }] },
      ],
      children: [{ id: 'inner', title: '下層', blocks: [{ kind: 'paragraph', text: 'inner text' }] }],
    },
  ],
})

describe('cardSlots entries', () => {
  it('reads the slot, the value and the ref', () => {
    expect(parseCardSlot('wbf.openings.1NT.responses <- responses#0')).toEqual({
      slot: 'wbf.openings.1NT.responses',
      ref: { kind: 'section', sectionId: 'responses', block: 0 },
    })
    expect(parseCardSlot('ctcba-simple.nt.stayman <- responses#0:3')).toEqual({
      slot: 'ctcba-simple.nt.stayman',
      ref: { kind: 'section', sectionId: 'responses', block: 0, row: 3 },
    })
    expect(parseCardSlot('wbf.summary.special-bids <- *')).toEqual({
      slot: 'wbf.summary.special-bids',
      ref: { kind: 'convention' },
    })
    expect(parseCardSlot('ctcba-simple.signals.discard-suit = odd-even <- suit-discards#0')).toEqual({
      slot: 'ctcba-simple.signals.discard-suit',
      value: 'odd-even',
      ref: { kind: 'section', sectionId: 'suit-discards', block: 0 },
    })
    expect(parseCardSlot('wbf.summary.general = 5-card majors; 1NT 15-17')).toEqual({
      slot: 'wbf.summary.general',
      value: '5-card majors; 1NT 15-17',
    })
  })

  it('rejects what is not an entry', () => {
    for (const bad of ['', 'wbf', 'wbf.summary.general', 'wbf.x <- ', 'wbf.x <- Bad Id', 'wbf.x <- a#b', 'wbf.x =  <- a', 'x y <- a'])
      expect(parseCardSlot(bad), bad).toBeNull()
  })

  it('writes an entry back the way it reads it', () => {
    for (const entry of [
      'wbf.openings.1NT.responses <- responses#0',
      'ctcba-simple.nt.stayman <- responses#0:3',
      'wbf.summary.special-bids <- *',
      'ctcba-simple.signals.table.count.suit-standard = ✓ <- suit-contract#0',
      'wbf.summary.general = text',
    ])
      expect(formatCardSlot(parseCardSlot(entry)!)).toBe(entry)
  })
})

describe('built-in cardSlots', () => {
  const prefixes = cardTemplates.map((t) => t.id)

  it('are all well-formed and name a card the handbook has', () => {
    for (const c of bundled)
      for (const entry of c.cardSlots ?? []) {
        const parsed = parseCardSlot(entry)
        expect(parsed, `${c.slug}: ${entry}`).not.toBeNull()
        expect(parsed!.ref, `${c.slug}: ${entry} points back to the source`).toBeDefined()
        expect(prefixes, `${c.slug}: ${entry}`).toContain(parsed!.slot.split('.')[0])
      }
  })

  it.each(cardTemplates.map((t) => [t.id, t] as const))('fill %s without a problem', (_, t) => {
    expect(fillCard(t, club()).problems).toEqual([])
  })

  it('write no fixed text of their own: only ticks and option ids', () => {
    for (const c of bundled)
      for (const entry of c.cardSlots ?? []) {
        const value = parseCardSlot(entry)!.value
        if (value !== undefined) expect(['✓', 'gf', 'odd-even'], `${c.slug}: ${entry}`).toContain(value)
      }
  })

  it('fill the WBF card from the club default', () => {
    const card = fillCard(wbf, club())
    const filled = Object.keys(card.cells)
    for (const slot of [
      'wbf.summary.general',
      'wbf.summary.1nt',
      'wbf.summary.special-bids',
      'wbf.openings.1NT.responses',
      'wbf.openings.2D.description',
      'wbf.defence.vs-nt',
      'wbf.leads.signals-trumps',
      'wbf.doubles.takeout',
      'wbf.doubles.special',
      'wbf.high-level',
    ])
      expect(filled, slot).toContain(slot)
    const responses = card.cells['wbf.openings.1NT.responses']!
    expect(responses.sources).toEqual([
      { slug: 'notrump-responses', entry: 'wbf.openings.1NT.responses <- responses#0', sectionId: 'responses' },
    ])
    // Sixteen rows do not fit one line: the full table goes to a note
    expect(responses.text).toMatch(/^Responses to 1NT \[Note \d+\]$/)
    const note = card.notes.find((n) => n.n === responses.notes![0])!
    expect(note).toMatchObject({ slot: 'wbf.openings.1NT.responses', slug: 'notrump-responses', sectionId: 'responses' })
    expect(note.lines[0]).toMatch(/^2♣=stayman/)
    expect(card.notes.map((n) => n.n)).toEqual(card.notes.map((_, i) => i + 1))
  })

  it('tick the simple card from the club default, the same on both editions', () => {
    const one = fillCard(ctcbaSimple, club())
    expect(one.cells['ctcba-simple.nt.stayman']).toMatchObject({ checked: true })
    expect(one.cells['ctcba-simple.signals.discard-suit']).toMatchObject({ option: 'odd-even' })
    expect(one.cells['ctcba-simple.signals.table.attitude.suit-reverse']).toMatchObject({ checked: true })
    const two = fillCard(ctcbaSimple2p, club())
    const strip = (cells: object, id: string) =>
      Object.fromEntries(Object.entries(cells).map(([k, v]) => [k.slice(id.length), { ...v, slot: v.slot.slice(id.length) }]))
    expect(strip(two.cells, 'ctcba-simple-2p')).toEqual(strip(one.cells, 'ctcba-simple'))
  })

  it('gives the same card twice', () => {
    expect(fillCard(wbf, club())).toEqual(fillCard(wbf, club()))
  })
})

describe('fillCard', () => {
  it('condenses a table to call=meaning on a one-line cell', () => {
    const card = fillCard({ ...mini, printWidth: 1000 }, club([sample(['wbf.t.r.x <- top#1'])]))
    expect(card.cells['wbf.t.r.x']).toEqual({
      slot: 'wbf.t.r.x',
      text: '2♣=stayman; 2♦=transfer',
      sources: [{ slug: 'sample', entry: 'wbf.t.r.x <- top#1', sectionId: 'top' }],
      pending: true,
    })
  })

  it('takes one row, one rule item, a block or a whole section', () => {
    const wide = { ...mini, printWidth: 4000 }
    const text = (ref: string) => fillCard(wide, club([sample([`wbf.box <- ${ref}`])])).cells['wbf.box']!.text
    expect(text('top#1:0')).toBe('2♣=stayman')
    expect(text('top#2:0')).toBe('一 (二)')
    expect(text('top#0')).toBe('短')
    expect(text('top')).toBe('短; 1NT ?; 2♣=stayman; 2♦=transfer; 一 (二); 三; 【下層】; inner text')
  })

  it('moves what does not fit to a numbered note with the full text', () => {
    const card = fillCard(mini, club([sample(['wbf.box <- top#0', 'wbf.box <- top', 'wbf.t.r.x <- top#1'])]))
    // Box: 2 lines of 18; "短" fits, the whole section does not
    expect(card.cells['wbf.box']!.text).toBe('短\nSample [Note 1]')
    expect(card.cells['wbf.box']!.notes).toEqual([1])
    // The table cell is 8 characters wide: even "Sample [Note 2]" is too long, so the name goes
    expect(card.cells['wbf.t.r.x']!.text).toBe('[Note 2]')
    expect(card.notes).toEqual([
      {
        n: 1,
        slot: 'wbf.box',
        slug: 'sample',
        sectionId: 'top',
        title: 'Sample: 上層',
        lines: ['短', '1NT ?', '2♣=stayman', '2♦=transfer', '一 (二)', '三', '【下層】', 'inner text'],
        pending: true,
      },
      {
        n: 2,
        slot: 'wbf.t.r.x',
        slug: 'sample',
        sectionId: 'top',
        title: 'Sample: 上層',
        lines: ['2♣=stayman', '2♦=transfer'],
        pending: true,
      },
    ])
  })

  it('runs the entries of a multi-line cell on when one a line does not fit, even as notes', () => {
    const card = fillCard(mini, club([sample(['wbf.box = A', 'wbf.box <- top', 'wbf.box = C'])]))
    // One a line would take 3 lines of the box's 2
    expect(card.cells['wbf.box']!.text).toBe('A; Sample [Note 1]; C')
    expect(card.cells['wbf.box']!.overflow).toBeUndefined()
    expect(card.notes.map((n) => n.n)).toEqual([1])
    // Too much even run on: flagged
    const full = fillCard(mini, club([sample(['wbf.box = AAAAAAAAAAAAAAAAAAAA', 'wbf.box = BBBBBBBBBBBBBBBBBBBB'])]))
    expect(full.cells['wbf.box']).toMatchObject({ text: 'AAAAAAAAAAAAAAAAAAAA; BBBBBBBBBBBBBBBBBBBB', overflow: true })
  })

  it('ticks checks, picks choices and writes fixed values', () => {
    const card = fillCard(
      mini,
      club([sample(['wbf.tick <- top#0', 'wbf.pick = b <- top', 'wbf.t.r.x = ✓ <- top#1:0', 'wbf.box = Fixed'])]),
    )
    expect(card.cells['wbf.tick']).toMatchObject({ checked: true })
    expect(card.cells['wbf.tick']!.text).toBeUndefined()
    expect(card.cells['wbf.pick']).toMatchObject({ option: 'b' })
    expect(card.cells['wbf.t.r.x']).toMatchObject({ checked: true })
    expect(card.cells['wbf.box']).toMatchObject({ text: 'Fixed' })
  })

  it('fills nothing from a convention the profile does not play', () => {
    const content = [sample(['wbf.box <- top#0'])]
    const off = profile({ id: 'club', scope: 'club', adopted: { sample: 'off' } })
    expect(fillCard(mini, resolveProfile([off], 'club', content)).cells).toEqual({})
    const teamOff = profile({ id: 't', scope: 'team', adopted: { 'notrump-responses': 'off' } })
    const card = fillCard(ctcbaSimple, resolveProfile([teamOff], 't', bundled))
    expect(card.cells['ctcba-simple.nt.stayman']).toBeUndefined()
    expect(card.cells['ctcba-simple.minor.nmf']).toBeDefined()
  })

  it('fills the overridden text, marked with the overriding layer', () => {
    const team = profile({
      id: 't',
      scope: 'team',
      overrides: [{ kind: 'row', slug: 'sample', sectionId: 'top', blockIndex: 1, rowIndex: 0, meaning: 'puppet' }],
    })
    const card = fillCard({ ...mini, printWidth: 1000 }, resolveProfile([team], 't', [sample(['wbf.t.r.x <- top#1'])]))
    expect(card.cells['wbf.t.r.x']).toMatchObject({ text: '2♣=puppet; 2♦=transfer', origin: 'team' })
    const partnership = profile({
      id: 'p',
      scope: 'partnership',
      parentId: 't',
      overrides: [{ kind: 'section', slug: 'sample', sectionId: 'inner', section: { id: 'inner', title: '下層', blocks: [] } }],
    })
    const deep = fillCard({ ...mini, printWidth: 4000 }, resolveProfile([team, partnership], 'p', [sample(['wbf.box <- top'])]))
    expect(deep.cells['wbf.box']!.origin).toBe('partnership')
  })

  it('applies hand edits on top, as the profile', () => {
    const team = profile({ id: 't', scope: 'team' })
    const card = fillCard(mini, resolveProfile([team], 't', [sample(['wbf.box <- top', 'wbf.tick <- top'])]), {
      'wbf.box': { text: 'By hand', flagged: true },
      'wbf.tick': { checked: false },
      'wbf.pick': { option: 'a' },
      'wbf.nowhere': { text: 'x' },
    })
    expect(card.cells['wbf.box']).toMatchObject({ text: 'By hand', edited: true, flagged: true, origin: 'team' })
    expect(card.cells['wbf.box']!.notes).toBeUndefined()
    expect(card.notes).toEqual([])
    expect(card.cells['wbf.tick']).toMatchObject({ checked: false, edited: true })
    expect(card.cells['wbf.pick']).toEqual({ slot: 'wbf.pick', sources: [], option: 'a', edited: true, origin: 'team' })
    expect(card.problems).toEqual([{ kind: 'unknownEdit', slot: 'wbf.nowhere' }])
  })

  it('reports entries it cannot use and skips other cards', () => {
    const card = fillCard(
      mini,
      club([
        sample([
          'not an entry',
          'wbf.missing <- top',
          'wbf.box <- nowhere',
          'wbf.box <- top#9',
          'wbf.box <- top#0:0',
          'wbf.pick = c <- top',
          'ctcba-simple.nt.stayman <- top',
        ]),
      ]),
    )
    expect(card.problems).toEqual([
      { kind: 'badEntry', slug: 'sample', entry: 'not an entry' },
      { kind: 'unknownSlot', slug: 'sample', entry: 'wbf.missing <- top' },
      { kind: 'brokenRef', slug: 'sample', entry: 'wbf.box <- nowhere', missing: 'section' },
      { kind: 'brokenRef', slug: 'sample', entry: 'wbf.box <- top#9', missing: 'block' },
      { kind: 'brokenRef', slug: 'sample', entry: 'wbf.box <- top#0:0', missing: 'row' },
      { kind: 'badValue', slug: 'sample', entry: 'wbf.pick = c <- top' },
    ])
    expect(card.cells).toEqual({})
  })

  it('never changes its arguments', () => {
    const content = [sample(['wbf.box <- top'])]
    const before = structuredClone(content)
    const resolution = club(content)
    fillCard(mini, resolution, { 'wbf.box': { text: 'x' } })
    expect(content).toEqual(before)
  })
})

describe('slot space', () => {
  it('counts CJK and suit symbols as two', () => {
    expect(textWidth('1NT')).toBe(3)
    expect(textWidth('開叫1♠')).toBe(7)
  })

  it.each(cardTemplates.map((t) => [t.id, t] as const))('%s has a space for every slot', (_, t) => {
    const spaces = slotSpaces(t)
    expect([...spaces.keys()].sort()).toEqual(templateSlots(t).map((s) => s.id).sort())
    for (const [id, space] of spaces) {
      expect(space.lines, id).toBeGreaterThan(0)
      expect(space.chars, id).toBeGreaterThan(0)
    }
  })

  it('measures the WBF cells from the 2.19 widths at 7 pt', () => {
    const spaces = slotSpaces(wbf)
    // (268.35 pt - 8.5 pt padding) / 3.5 pt
    expect(spaces.get('wbf.defence.overcalls')).toEqual({ lines: 6, chars: 74, label: 0 })
    // (241.7 pt - 8.5 pt) / 3.5 pt
    expect(spaces.get('wbf.openings.1NT.responses')!.chars).toBe(66)
  })
})
