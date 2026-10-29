import { conventions } from '../../src/content/index.ts'
import { countDiff, diffConventions, inlineDiff, isEmptyDiff } from '../../src/lib/diff.ts'
import type { Convention } from '../../src/types/convention.ts'

const base: Convention = {
  slug: 'demo',
  nameZh: '示範',
  nameEn: 'Demo',
  category: 'notrump',
  tags: ['a'],
  summary: '摘要',
  source: { title: '原檔' },
  updated: '2026-10-01',
  sections: [
    {
      id: 'one',
      title: '開叫1NT時',
      blocks: [
        { kind: 'paragraph', text: '15-17點。' },
        {
          kind: 'responses',
          rows: [
            { call: '2C', meaning: '問高花' },
            { call: '2D', meaning: '轉換紅心' },
            { call: '2H', meaning: '轉換黑桃' },
          ],
        },
      ],
      children: [{ id: 'one-a', title: '答叫', blocks: [{ kind: 'rules', items: [{ text: '甲' }, { text: '乙', children: [{ text: '乙一' }] }] }] }],
    },
    { id: 'two', title: '其他', blocks: [{ kind: 'note', tone: 'info', text: '注意' }] },
  ],
}
const clone = (): Convention => structuredClone(base)

describe('diffConventions', () => {
  it('finds nothing between a version and itself', () => {
    expect(isEmptyDiff(diffConventions(base, clone()))).toBe(true)
    for (const c of conventions) expect(isEmptyDiff(diffConventions(c, structuredClone(c)))).toBe(true)
  })

  it('matches response rows by their call', () => {
    const after = clone()
    const rows = (after.sections[0].blocks![1] as Extract<NonNullable<Convention['sections'][0]['blocks']>[0], { kind: 'responses' }>).rows
    // 2D changes meaning, 2H goes, 2S comes, and 2C moves down: still matched by its call
    rows.splice(0, 3, { call: '2D', meaning: '轉換紅心，5張以上' }, { call: '2C', meaning: '問高花' }, { call: '2S', meaning: '低花' })
    const d = diffConventions(base, after)
    expect(d.meta).toEqual([])
    expect(d.sections).toHaveLength(1)
    const lines = d.sections[0].lines
    expect(lines).toContainEqual({ op: 'changed', place: { at: 'row', call: '2D', part: 'meaning' }, before: '轉換紅心', after: '轉換紅心，5張以上' })
    expect(lines).toContainEqual({ op: 'removed', place: { at: 'row', call: '2H', part: 'meaning' }, before: '轉換黑桃' })
    expect(lines).toContainEqual({ op: 'added', place: { at: 'row', call: '2S', part: 'meaning' }, after: '低花' })
    expect(lines.some((l) => l.place.at === 'row' && l.place.call === '2C' && l.op === 'changed')).toBe(false)
  })

  it('pairs a rewritten paragraph or rule as changed, and keeps new ones added', () => {
    const after = clone()
    after.sections[0].blocks![0] = { kind: 'paragraph', text: '15-17點，平均牌型。', pending: '要問' }
    after.sections[0].children![0].blocks = [{ kind: 'rules', items: [{ text: '甲' }, { text: '乙', children: [{ text: '乙二' }] }, { text: '丙' }] }]
    const d = diffConventions(base, after)
    expect(d.sections.map((s) => [s.id, s.op])).toEqual([
      ['one', 'changed'],
      ['one-a', 'changed'],
    ])
    expect(d.sections[0].lines).toEqual([
      { op: 'changed', place: { at: 'paragraph' }, before: '15-17點。', after: '15-17點，平均牌型。' },
      { op: 'added', place: { at: 'pending' }, after: '要問' },
    ])
    expect(d.sections[1].lines).toEqual([
      { op: 'changed', place: { at: 'rule', depth: 1 }, before: '乙一', after: '乙二' },
      { op: 'added', place: { at: 'rule', depth: 0 }, after: '丙' },
    ])
    expect(countDiff(d)).toEqual({ added: 2, removed: 0, changed: 2 })
  })

  it('reports added, removed, moved and retitled sections, each in its place', () => {
    const after = clone()
    const [one, two] = after.sections
    one.title = '開叫 1NT'
    // one-a moves to the top level after two; a new section comes first
    const child = one.children!.pop()!
    after.sections = [{ id: 'zero', title: '前言', summary: '新的' }, one, two, child]
    const d = diffConventions(base, after)
    expect(d.sections.map((s) => [s.id, s.op])).toEqual([
      ['zero', 'added'],
      ['one', 'changed'],
      ['one-a', 'changed'],
    ])
    expect(d.sections[0].lines).toEqual([{ op: 'added', place: { at: 'section', field: 'summary' }, after: '新的' }])
    expect(d.sections[1].lines).toEqual([{ op: 'changed', place: { at: 'section', field: 'title' }, before: '開叫1NT時', after: '開叫 1NT' }])
    expect(d.sections[2].lines[0]).toEqual({ op: 'removed', place: { at: 'section', field: 'place' }, before: '開叫1NT時' })

    const gone = clone()
    gone.sections = [gone.sections[1]]
    const removed = diffConventions(base, gone)
    expect(removed.sections.map((s) => [s.id, s.op])).toEqual([
      ['one', 'removed'],
      ['one-a', 'removed'],
    ])
    expect(removed.sections[0].lines.map((l) => l.before)).toEqual(['15-17點。', '問高花', '轉換紅心', '轉換黑桃'])
  })

  it('reports siblings swapped as out of order', () => {
    const after = clone()
    after.sections.reverse()
    const d = diffConventions(base, after)
    expect(d.sections).toHaveLength(1)
    expect(d.sections[0].lines).toEqual([{ op: 'changed', place: { at: 'section', field: 'order' }, before: expect.any(String), after: expect.any(String) }])
  })

  it('compares the card fields and treats a missing version as empty', () => {
    const after = { ...clone(), tags: ['a', 'b'], level: 'basic' as const }
    expect(diffConventions(base, after).meta).toEqual([
      { op: 'added', place: { at: 'meta', field: 'level' }, after: 'basic' },
      { op: 'changed', place: { at: 'meta', field: 'tags' }, before: 'a', after: 'a、b' },
    ])
    const fresh = diffConventions(null, base)
    expect(fresh.sections.every((s) => s.op === 'added')).toBe(true)
    expect(fresh.sections).toHaveLength(3)
  })

  it('handles every bundled convention against an emptied copy', () => {
    for (const c of conventions) {
      const d = diffConventions(c, { ...c, sections: [] })
      expect(d.sections.every((s) => s.op === 'removed')).toBe(true)
    }
  })
})

describe('inlineDiff', () => {
  it('marks the characters that differ', () => {
    expect(inlineDiff('12-14點', '11-14點')).toEqual([
      { op: 'same', text: '1' },
      { op: 'removed', text: '2' },
      { op: 'added', text: '1' },
      { op: 'same', text: '-14點' },
    ])
    expect(inlineDiff('', '新')).toEqual([{ op: 'added', text: '新' }])
    expect(inlineDiff('同', '同')).toEqual([{ op: 'same', text: '同' }])
  })

  it('keeps suit symbols whole and gives the words back unchanged', () => {
    const before = '開叫1♠後，同伴2♥'
    const after = '開叫1♥後，同伴2♠，邀請'
    const parts = inlineDiff(before, after)
    expect(parts.filter((p) => p.op !== 'added').map((p) => p.text).join('')).toBe(before)
    expect(parts.filter((p) => p.op !== 'removed').map((p) => p.text).join('')).toBe(after)
  })
})
