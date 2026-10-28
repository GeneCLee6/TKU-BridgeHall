import { conventions } from '../../src/content/index.ts'
import { drawQuizzes, filterQuizzes, generateQuizzes, quizBlockIndex, shuffle, CHOICES } from '../../src/lib/quiz.ts'
import { walkSections } from '../../src/lib/sections.ts'
import type { Convention, ResponseRow, Section } from '../../src/types/convention.ts'

/** Every response row of a convention by question id, with whether it sits in a pending section */
function rowsById(c: Convention) {
  const rows = new Map<string, { row: ResponseRow; pending: boolean; section: Section }>()
  const pendingSections = new Set<string>()
  walkSections(c.sections, (s, ancestors) => {
    if (s.pending || ancestors.some((a) => pendingSections.has(a.id))) pendingSections.add(s.id)
    s.blocks?.forEach((b, bi) => {
      if (b.kind !== 'responses') return
      b.rows.forEach((row, ri) =>
        rows.set(`${c.slug}/${s.id}/${bi}/${ri}`, {
          row,
          pending: pendingSections.has(s.id) || Boolean(row.pending),
          section: s,
        }),
      )
    })
  })
  return rows
}

const strip = (t: string) => t.replace(/\s+/g, ' ').trim().replace(/[。.]+$/, '')

describe('generateQuizzes (e6-t01, AC-6.2)', () => {
  const all = generateQuizzes(conventions, 'club')

  it.each(conventions.map((c) => [c.slug, c] as const))(
    '%s: every response row is asked or reported, word for word from the source',
    (slug, c) => {
      const rows = rowsById(c)
      const quizzes = all.quizzes.filter((q) => q.slug === slug)
      const skipped = all.skipped.filter((s) => s.id.startsWith(`${slug}/`))
      // A convention with any usable table gets questions
      const usable = [...rows.values()].filter((r) => !r.pending && strip(r.row.meaning) !== '同上')
      if (usable.length) expect(quizzes.length).toBeGreaterThan(0)
      expect(quizzes.length + skipped.length).toBe(rows.size)

      const meanings = new Set([...rows.values()].filter((r) => !r.pending).map((r) => r.row.meaning))
      for (const q of quizzes) {
        const source = rows.get(q.id)
        expect(source, q.id).toBeDefined()
        expect(source!.pending).toBe(false)
        // The question is the row: its call and its meaning, unchanged
        expect(q.call).toBe(source!.row.call)
        expect(q.answer).toBe(source!.row.meaning)
        expect(q.sectionId).toBe(source!.section.id)
        expect(q.kind).toBe('meaning')
        expect(q.source).toBe('auto')
        expect(q.profileId).toBe('club')
        // Four different choices, the answer once, every one a non-pending meaning of this convention
        expect(q.choices).toHaveLength(CHOICES)
        expect(new Set(q.choices!.map(strip)).size).toBe(CHOICES)
        expect(q.choices!.filter((m) => m === q.answer)).toHaveLength(1)
        q.choices!.forEach((m) => expect(meanings.has(m), `${q.id}: ${m}`).toBe(true))
        expect(q.choices!.some((m) => strip(m) === '同上')).toBe(false)
      }
      // Pending rows are never asked
      for (const [id, r] of rows) if (r.pending) expect(skipped.find((s) => s.id === id)?.reason).toBe('pending')
    },
  )

  it('asks something of every bundled convention that has a response table', () => {
    const asked = new Set(all.quizzes.map((q) => q.slug))
    const withTables = conventions.filter((c) => [...rowsById(c).values()].some((r) => !r.pending))
    expect(withTables.map((c) => c.slug).filter((slug) => !asked.has(slug))).toEqual([])
    expect(withTables.length).toBe(19)
  })

  it('gives every question a unique id from its place in the content', () => {
    const ids = all.quizzes.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    all.quizzes.forEach((q) => expect(q.id).toMatch(/^[a-z0-9-]+\/[^/]+\/\d+\/\d+$/))
    expect(quizBlockIndex(all.quizzes[0])).toBe(Number(all.quizzes[0].id.split('/')[2]))
  })

  it('is deterministic', () => {
    expect(generateQuizzes(conventions, 'club')).toEqual(all)
  })

  const tiny = (rows: ResponseRow[], extra: Partial<Section> = {}): Convention => ({
    slug: 'tiny',
    nameZh: '小',
    nameEn: 'Tiny',
    category: 'x',
    tags: ['t'],
    summary: 's',
    source: { title: 't' },
    updated: '2026-10-28',
    level: 'basic',
    sections: [
      {
        id: 'a',
        title: 'A',
        ...extra,
        blocks: [{ kind: 'responses', auction: { seats: ['N', 'E', 'S', 'W'], calls: ['1NT', 'P', '?'] }, rows }],
      },
    ],
  })

  it('skips empty, back-referring and pending rows and reports them', () => {
    const { quizzes, skipped } = generateQuizzes(
      [
        tiny([
          { call: '2C', meaning: '問高花' },
          { call: '2D', meaning: '轉換♥' },
          { call: '2H', meaning: '轉換♠' },
          { call: '2S', meaning: '低花' },
          { call: '2NT', meaning: '' },
          { call: '3C', meaning: '同上' },
          { call: '3D', meaning: '猜的', pending: '原文不清' },
          { call: '', meaning: '沒有叫品' },
        ]),
      ],
      'club',
    )
    expect(quizzes.map((q) => q.call)).toEqual(['2C', '2D', '2H', '2S'])
    expect(skipped).toEqual([
      { id: 'tiny/a/0/4', reason: 'emptyMeaning' },
      { id: 'tiny/a/0/5', reason: 'refersBack' },
      { id: 'tiny/a/0/6', reason: 'pending' },
      { id: 'tiny/a/0/7', reason: 'emptyCall' },
    ])
    // Neither the pending meaning nor 同上 is offered as a wrong answer
    quizzes.forEach((q) => expect(q.choices).not.toContain('猜的'))
  })

  it('skips a table too short for four different meanings, and a pending section', () => {
    const short = generateQuizzes(
      [
        tiny([
          { call: '2C', meaning: '問高花' },
          { call: '2D', meaning: '轉換♥' },
          { call: '2H', meaning: '轉換♥。' },
          { call: '2S', meaning: '低花' },
        ]),
      ],
      'club',
    )
    expect(short.quizzes).toEqual([])
    expect(short.skipped.every((s) => s.reason === 'fewChoices')).toBe(true)

    const rows = [1, 2, 3, 4].map((n) => ({ call: `${n}C`, meaning: `意義${n}` }))
    const pending = generateQuizzes([tiny(rows, { pending: '整段待確認' })], 'club')
    expect(pending.quizzes).toEqual([])
    expect(pending.skipped.every((s) => s.reason === 'pending')).toBe(true)
  })

  it('does not offer the same call in the same auction as a wrong answer', () => {
    const { quizzes } = generateQuizzes(
      [
        tiny([
          { call: '2C', meaning: '問高花' },
          { call: '2C', meaning: '弱牌逃叫' },
          { call: '2D', meaning: '轉換♥' },
          { call: '2H', meaning: '轉換♠' },
          { call: '2S', meaning: '低花' },
        ]),
      ],
      'club',
    )
    const first = quizzes.find((q) => q.id === 'tiny/a/0/0')!
    expect(first.choices).not.toContain('弱牌逃叫')
  })
})

describe('filterQuizzes and drawQuizzes (e6-t02)', () => {
  const { quizzes } = generateQuizzes(conventions, 'club')

  it('filters by convention and level, and leaves out disabled questions', () => {
    const lebensohl = filterQuizzes(quizzes, { slugs: ['lebensohl'] })
    expect(lebensohl.length).toBeGreaterThan(0)
    expect(lebensohl.every((q) => q.slug === 'lebensohl')).toBe(true)
    const basic = filterQuizzes(quizzes, { level: 'basic' })
    expect(basic.every((q) => q.level === 'basic')).toBe(true)
    expect(filterQuizzes([{ ...quizzes[0], disabled: true }], {})).toEqual([])
  })

  it('draws the asked number of different questions with the choices reordered', () => {
    let seed = 1
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    const drawn = drawQuizzes(quizzes, 10, random)
    expect(drawn).toHaveLength(10)
    expect(new Set(drawn.map((q) => q.id)).size).toBe(10)
    for (const q of drawn) {
      const original = quizzes.find((o) => o.id === q.id)!
      expect([...q.choices!].sort()).toEqual([...original.choices!].sort())
    }
    expect(drawQuizzes(quizzes.slice(0, 3), 10)).toHaveLength(3)
    expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1])
  })
})
