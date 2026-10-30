import { conventions } from '../fixtures/content.ts'
import {
  cellCall,
  cellText,
  findPlace,
  indentSection,
  insertSection,
  moveSection,
  newSectionId,
  normaliseCall,
  outdentSection,
  parseResponseLines,
  removeSection,
  rulesToText,
  sectionIds,
  splitList,
  suitSymbols,
  textToRules,
} from '../../src/lib/editing.ts'
import { walkSections } from '../../src/lib/sections.ts'
import type { Section } from '../../src/types/convention.ts'

const tree: Section[] = [
  { id: 'a', title: 'A', children: [{ id: 'a1', title: 'A1' }, { id: 'a2', title: 'A2' }] },
  { id: 'b', title: 'B' },
  { id: 'c', title: 'C' },
]
const shape = (sections: Section[]): unknown => sections.map((s) => (s.children ? { [s.id]: shape(s.children) } : s.id))

describe('the section tree', () => {
  it('finds a section with its parent and position', () => {
    expect(findPlace(tree, 'a2')).toMatchObject({ parentId: 'a', index: 1 })
    expect(findPlace(tree, 'c')).toMatchObject({ parentId: null, index: 2 })
    expect(findPlace(tree, 'zz')).toBeNull()
  })

  it('moves, indents, outdents, inserts and removes without touching the input', () => {
    const before = JSON.stringify(tree)
    expect(shape(moveSection(tree, 'b', -1))).toEqual(['b', { a: ['a1', 'a2'] }, 'c'])
    expect(shape(moveSection(tree, 'a1', -1))).toEqual(shape(tree))
    expect(shape(indentSection(tree, 'b'))).toEqual([{ a: ['a1', 'a2', 'b'] }, 'c'])
    expect(shape(indentSection(tree, 'a2'))).toEqual([{ a: [{ a1: ['a2'] }] }, 'b', 'c'])
    expect(shape(outdentSection(tree, 'a1'))).toEqual([{ a: ['a2'] }, 'a1', 'b', 'c'])
    // The last child leaving takes the empty children list with it
    expect(outdentSection(outdentSection(tree, 'a1'), 'a2')[0]).not.toHaveProperty('children')
    expect(shape(insertSection(tree, 'a', { id: 'n', title: 'N' }, 'a1'))).toEqual([{ a: ['a1', 'n', 'a2'] }, 'b', 'c'])
    expect(shape(insertSection(tree, null, { id: 'n', title: 'N' }))).toEqual([{ a: ['a1', 'a2'] }, 'b', 'c', 'n'])
    expect(shape(removeSection(tree, 'a'))).toEqual(['b', 'c'])
    expect(JSON.stringify(tree)).toBe(before)
  })

  it('makes new section ids that are not used yet', () => {
    expect(sectionIds(tree)).toEqual(['a', 'a1', 'a2', 'b', 'c'])
    expect(newSectionId(tree)).toBe('sec-1')
    expect(newSectionId([{ id: 'sec-1', title: '' }, { id: 'sec-2', title: '' }])).toBe('sec-3')
  })
})

describe('text forms of content', () => {
  it('turns every bundled list into text and back unchanged', () => {
    let lists = 0
    for (const c of conventions)
      walkSections(c.sections, (s) => {
        for (const b of s.blocks ?? [])
          if (b.kind === 'rules') {
            lists++
            expect(textToRules(rulesToText(b.items)), `${c.slug}/${s.id}`).toEqual(b.items)
          }
      })
    expect(lists).toBeGreaterThan(0)
  })

  it('reads lists typed by hand', () => {
    expect(textToRules('- 第一條\n  - 子項\n    - 孫項\n- 第二條 〔待確認：點力？〕\n\n第三條')).toEqual([
      { text: '第一條', children: [{ text: '子項', children: [{ text: '孫項' }] }] },
      { text: '第二條', pending: '點力？' },
      { text: '第三條' },
    ])
    // Too deep an indent only goes one level down
    expect(textToRules('- a\n      - b')).toEqual([{ text: 'a', children: [{ text: 'b' }] }])
  })

  it('turns every bundled auction cell into text and back unchanged', () => {
    for (const c of conventions)
      walkSections(c.sections, (s) => {
        for (const b of s.blocks ?? [])
          if (b.kind === 'responses' && b.auction)
            for (const call of b.auction.calls) expect(cellCall(cellText(call)), `${c.slug}/${s.id}`).toEqual(call)
      })
  })

  it('reads auction cells and calls as people type them', () => {
    expect(cellCall('2c（測試註記）')).toEqual({ call: '2C', note: '測試註記' })
    expect(cellCall('2♦(詢問)')).toEqual({ call: '2D', note: '詢問' })
    expect(cellCall('2C（')).toBe('2C（')
    expect(['1nt', 'pass', 'x', '？', '3♠', '---', ''].map(normaliseCall)).toEqual(['1NT', 'pass', 'x', '?', '3S', '---', ''])
  })

  it('reads pasted response lines in the handouts’ styles', () => {
    const lines = '2H=P/C\n3C --- 6張F\n2nt：詢問\n4♠ － to play\nX – 處罰\n  PASS - 測試用的意義\n1NT 2D ??'
    expect(parseResponseLines(lines)).toEqual([
      { call: '2H', meaning: 'P/C' },
      { call: '3C', meaning: '6張F' },
      { call: '2NT', meaning: '詢問' },
      { call: '4S', meaning: 'to play' },
      { call: 'X', meaning: '處罰' },
      { call: 'PASS', meaning: '測試用的意義' },
    ])
  })

  it('turns suit letters into symbols, leaving words and card letters alone', () => {
    expect(suitSymbols('迫叫至3H，H不fit，問A，S VOID，HCP 2NT')).toBe('迫叫至3♥，♥不fit，問A，S VOID，HCP 2NT')
  })

  it('splits tags and aliases on 、, commas and line breaks', () => {
    expect(splitList('1NT、stayman, transfer，Texas transfer\n gerber\n\n')).toEqual(['1NT', 'stayman', 'transfer', 'Texas transfer', 'gerber'])
  })
})
