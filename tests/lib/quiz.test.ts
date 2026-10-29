import { conventions } from '../../src/content/index.ts'
import {
  drawQuizzes,
  filterQuizzes,
  generateQuizzes,
  isRight,
  labelCall,
  quizBlockIndex,
  sameCall,
  shuffle,
  CHOICES,
} from '../../src/lib/quiz.ts'
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
      const quizzes = all.quizzes.filter((q) => q.slug === slug && q.kind === 'meaning')
      const skipped = all.skipped.filter((s) => s.id.startsWith(`${slug}/`) && !s.id.endsWith('/hand'))
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
    const asked = new Set(all.quizzes.filter((q) => q.kind === 'meaning').map((q) => q.slug))
    const withTables = conventions.filter((c) => [...rowsById(c).values()].some((r) => !r.pending))
    expect(withTables.map((c) => c.slug).filter((slug) => !asked.has(slug))).toEqual([])
    expect(withTables.length).toBe(19)
  })

  it('gives every question a unique id from its place in the content', () => {
    const ids = all.quizzes.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    all.quizzes.forEach((q) =>
      expect(q.id).toMatch(q.kind === 'call' ? /^[a-z0-9-]+\/[^/]+\/\d+\/hand$/ : /^[a-z0-9-]+\/[^/]+\/\d+\/\d+$/),
    )
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

describe('call questions from the worked examples (e6-t07, AC-6.2)', () => {
  const all = generateQuizzes(conventions, 'club')
  const calls = all.quizzes.filter((q) => q.kind === 'call')

  it('reads the call a hand label says to make, and nothing else', () => {
    const said = ['叫4H', 'PASS', '叫4NT', 'PASS!', '叫3NT!!', 'PASS!!!', '(i) 應叫1H', '[原文已移除]', '叫2D，Cue-Bid', '叫1NT', '2♠', 'X', 'XX', '3N']
    expect(said.map(labelCall)).toEqual(['4H', 'P', '4NT', 'P', '3NT', 'P', '1H', '2C', '2D', '1NT', '2S', 'X', 'XX', '3NT'])
    const other = [undefined, '', '可開3NT', 'EX) 可開3NT', '皆可開叫1NT', '[原文已移除]', '(EX) 何手牌較佳？', 'a.', '上', '牌型可能如右', '[原文已移除]', '8H']
    for (const label of other) expect(labelCall(label), String(label)).toBeUndefined()
  })

  it('asks exactly the bundled examples that say what to call, word for word', () => {
    expect(calls.map((q) => q.id).sort()).toEqual(
      [
        'system-doubles/examples/1/hand',
        'system-doubles/examples/2/hand',
        'system-doubles/examples/4/hand',
        'system-doubles/examples/6/hand',
        'system-doubles/examples/7/hand',
        'system-doubles/examples/8/hand',
        'system-doubles/examples/9/hand',
        'system-competition/preempts/5/hand',
        'system-competition/preempts/6/hand',
        'system-competition/preempts/7/hand',
        'system-competition/preempts/8/hand',
        'system-competition/preempts/9/hand',
        'system-competition/preempts/10/hand',
        'system-concepts/fit/18/hand',
      ].sort(),
    )
    for (const q of calls) {
      const c = conventions.find((x) => x.slug === q.slug)!
      let blocks: Section['blocks']
      walkSections(c.sections, (s) => {
        if (s.id === q.sectionId) blocks = s.blocks
      })
      const index = quizBlockIndex(q)
      const block = blocks![index]
      expect(block.kind).toBe('hand')
      if (block.kind !== 'hand') continue
      // The hand, the answer and the example's paragraph are the source's own
      expect(q.hand).toEqual(block.hand)
      expect(q.answer).toBe(labelCall(block.label))
      let above = index - 1
      while (blocks![above].kind === 'hand') above--
      const prompt = blocks![above]
      expect(prompt.kind === 'paragraph' && prompt.text).toBe(q.prompt)
      expect(q.prompt).toMatch(/^EX\d*\)/)
      // Answered on a bidding box: no wrong calls are made up
      expect(q.choices).toBeUndefined()
      expect(q.source).toBe('auto')
    }
    expect(calls.find((q) => q.id === 'system-doubles/examples/4/hand')).toMatchObject({
      prompt: '[原文已移除]',
      answer: '2C',
    })
  })

  it('reports the hands it asks nothing about', () => {
    const hands = all.skipped.filter((s) => s.id.endsWith('/hand'))
    expect(hands.find((s) => s.id === 'system-concepts/hand-evaluation/2/hand')?.reason).toBe('noCall')
    expect(hands.find((s) => s.id === 'system-concepts/fit/16/hand')?.reason).toBe('noCall')
    expect(hands.find((s) => s.id === 'system-strong-and-preempts/gambling/3/hand')?.reason).toBe('noCall')
  })

  const example = (blocks: NonNullable<Section['blocks']>, extra: Partial<Section> = {}): Convention => ({
    slug: 'ex',
    nameZh: '例',
    nameEn: 'Ex',
    category: 'x',
    tags: [],
    summary: 's',
    source: { title: 't' },
    updated: '2026-10-29',
    sections: [{ id: 'a', title: 'A', ...extra, blocks }],
  })
  const hand = { spades: 'AK2', hearts: 'Q32', diamonds: 'J432', clubs: '432' }
  const ask = { kind: 'paragraph', text: 'EX) 同伴 1NT，你？' } as const

  it('needs an example paragraph above, and nothing pending', () => {
    const asked = generateQuizzes(
      [example([ask, { kind: 'hand', label: '叫2C', hand }, { kind: 'hand', label: 'PASS', hand }])],
      'club',
    )
    expect(asked.quizzes.map((q) => [q.id, q.answer, q.prompt])).toEqual([
      ['ex/a/1/hand', '2C', 'EX) 同伴 1NT，你？'],
      ['ex/a/2/hand', 'P', 'EX) 同伴 1NT，你？'],
    ])
    const noPrompt = generateQuizzes(
      [example([{ kind: 'paragraph', text: '牌例如下' }, { kind: 'hand', label: '叫2C', hand }])],
      'club',
    )
    expect(noPrompt.skipped).toEqual([{ id: 'ex/a/1/hand', reason: 'noPrompt' }])
    const pendingPrompt = generateQuizzes(
      [example([{ ...ask, pending: '原文不清' }, { kind: 'hand', label: '叫2C', hand }])],
      'club',
    )
    expect(pendingPrompt.skipped).toEqual([{ id: 'ex/a/1/hand', reason: 'pending' }])
    const pendingSection = generateQuizzes(
      [example([ask, { kind: 'hand', label: '叫2C', hand }], { pending: '整段待確認' })],
      'club',
    )
    expect(pendingSection.skipped).toEqual([{ id: 'ex/a/1/hand', reason: 'pending' }])
  })

  it('takes the same call written another way as right', () => {
    expect(sameCall('1NT', '1N')).toBe(true)
    expect(sameCall('PASS', 'P')).toBe(true)
    expect(sameCall('4♥', '4H')).toBe(true)
    expect(sameCall('4S', '4H')).toBe(false)
    expect(isRight({ kind: 'call', answer: 'P' }, 'Pass')).toBe(true)
    expect(isRight({ kind: 'meaning', answer: '問高花' }, '問高花')).toBe(true)
    expect(isRight({ kind: 'meaning', answer: '問高花' }, '問高花。')).toBe(false)
  })

  it('filters by kind', () => {
    expect(filterQuizzes(all.quizzes, { kind: 'call' })).toHaveLength(14)
    expect(filterQuizzes(all.quizzes, { kind: 'meaning' }).every((q) => q.kind === 'meaning')).toBe(true)
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
