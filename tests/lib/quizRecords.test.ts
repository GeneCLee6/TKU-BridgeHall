import { conventionBySlug } from '../fixtures/content.ts'
import { generateQuizzes, type Quiz } from '../../src/lib/quiz.ts'
import {
  addLocalRound,
  applyFixes,
  basisOf,
  clearLocalRounds,
  isManualId,
  localRounds,
  manualId,
  QUIZ_LIMITS,
  quizStats,
  roundOf,
  type QuizFix,
  type QuizRound,
} from '../../src/lib/quizRecords.ts'

const alpha = conventionBySlug('fixture-alpha')!
const made = generateQuizzes([alpha], 'club').quizzes
const first = made[0]

const round = (at: number, answers: [string, boolean][], profileId = 'club'): QuizRound => ({
  id: `r${at}`,
  at,
  profileId,
  answers: answers.map(([id, right]) => ({ id, slug: id.split('/')[0], right })),
})

describe('quizStats (成績與錯題本, e6-t05)', () => {
  it('counts the share right overall and by convention, weakest first', () => {
    const stats = quizStats([
      round(2, [
        ['a/s/0/0', true],
        ['b/s/0/0', false],
      ]),
      round(1, [
        ['a/s/0/1', true],
        ['b/s/0/1', true],
        ['c/s/0/0', true],
      ]),
    ])
    expect(stats).toMatchObject({ rounds: 2, answered: 5, right: 4 })
    expect(stats.bySlug.map((s) => [s.slug, s.answered, s.right])).toEqual([
      ['b', 2, 1],
      ['a', 2, 2],
      ['c', 1, 1],
    ])
  })

  it('keeps a question in 錯題本 while its last answer is wrong', () => {
    const stats = quizStats([
      round(3, [['a/s/0/0', true]]),
      round(2, [
        ['a/s/0/0', false],
        ['a/s/0/1', false],
      ]),
      round(1, [['a/s/0/2', false]]),
    ])
    // Answered right last time, so out; the most recent first
    expect(stats.wrong.map((w) => w.id)).toEqual(['a/s/0/1', 'a/s/0/2'])
  })
})

describe('rounds kept in this browser (signed out)', () => {
  beforeEach(() => clearLocalRounds())

  it('keeps the newest rounds and reads them back', () => {
    for (let i = 0; i < QUIZ_LIMITS.roundsKept + 2; i++) addLocalRound({ profileId: 'club', answers: [{ id: 'a/s/0/0', slug: 'a', right: true }] }, 1000 + i)
    const kept = localRounds()
    expect(kept).toHaveLength(QUIZ_LIMITS.roundsKept)
    expect(kept[0].at).toBe(1000 + QUIZ_LIMITS.roundsKept + 1)
  })

  it('reads nothing from storage that holds something else', () => {
    localStorage.setItem('tku-bridgebook:quizRounds', '{"not":"rounds"}')
    expect(localRounds()).toEqual([])
    localStorage.setItem('tku-bridgebook:quizRounds', '[{"id":1}]')
    expect(localRounds()).toEqual([])
  })

  it('makes a round from the answers', () => {
    expect(roundOf('club', [{ quiz: first, picked: first.answer }, { quiz: made[1], picked: 'x' }])).toEqual({
      profileId: 'club',
      answers: [
        { id: first.id, slug: 'fixture-alpha', right: true },
        { id: made[1].id, slug: 'fixture-alpha', right: false },
      ],
    })
  })
})

describe('applyFixes (幹部修題, e6-t06)', () => {
  const by = { by: 'ed', at: 1 }
  const find = (quizzes: Quiz[], id: string) => quizzes.find((q) => q.id === id)!

  it('leaves the questions as made without fixes', () => {
    expect(applyFixes(made, [], [alpha], 'club')).toEqual({ quizzes: made, stale: [] })
  })

  it('takes a question out, or changes its answer while the text is as it was', () => {
    const fixes: QuizFix[] = [
      { source: 'auto', id: first.id, basis: basisOf(first), disabled: true, ...by },
      { source: 'auto', id: made[1].id, basis: basisOf(made[1]), answer: '幹部改的正解', ...by },
    ]
    const { quizzes, stale } = applyFixes(made, fixes, [alpha], 'club')
    expect(stale).toEqual([])
    expect(find(quizzes, first.id).disabled).toBe(true)
    const changed = find(quizzes, made[1].id)
    expect(changed.answer).toBe('幹部改的正解')
    // The new answer takes the old one's place among the choices
    expect(changed.choices).toContain('幹部改的正解')
    expect(changed.choices).not.toContain(made[1].answer)
    expect(changed.choices).toHaveLength(made[1].choices!.length)
    // Nothing else changes
    expect(quizzes.filter((q) => q.id !== first.id && q.id !== made[1].id)).toEqual(made.slice(2))
  })

  it('does not apply a fix written against other text, or to a question no longer made', () => {
    const old: QuizFix = { source: 'auto', id: first.id, basis: { call: first.call!, answer: '舊的原文' }, disabled: true, ...by }
    const gone: QuizFix = { source: 'auto', id: 'fixture-alpha/nope/0/0', basis: { call: '2C', answer: 'x' }, disabled: true, ...by }
    const { quizzes, stale } = applyFixes(made, [old, gone], [alpha], 'club')
    expect(find(quizzes, first.id)).toEqual(first)
    expect(stale.map((f) => f.id)).toEqual([first.id, gone.id])
  })

  it('adds a hand-made question only in its profile, while its section is there', () => {
    const sectionId = first.sectionId
    const manual: QuizFix = {
      source: 'manual',
      id: `fixture-alpha/${sectionId}/m-ab12cd34`,
      quiz: {
        kind: 'call',
        profileId: 'club',
        slug: 'fixture-alpha',
        sectionId,
        hand: { spades: 'KQ43', hearts: 'J54', diamonds: 'A32', clubs: '432' },
        answer: '2NT',
        choices: ['2NT', '3C'],
      },
      ...by,
    }
    const here = applyFixes(made, [manual], [alpha], 'club')
    const added = here.quizzes.at(-1)!
    expect(added).toMatchObject({ id: manual.id, kind: 'call', source: 'manual', answer: '2NT', hand: { spades: 'KQ43' } })
    expect(added.trail).toEqual(first.trail)
    expect(applyFixes(made, [manual], [alpha], 'team-1').quizzes).toEqual(made)
    const moved = { ...manual, quiz: { ...manual.quiz, sectionId: 'no-such-section' } } as QuizFix
    expect(applyFixes(made, [moved], [alpha], 'club').stale).toEqual([moved])
  })

  it('names a hand-made question by its place', () => {
    const id = manualId('fixture-alpha', 'basic', () => 0.5)
    expect(id).toMatch(/^fixture-alpha\/basic\/m-[a-z0-9]{8}$/)
    expect(isManualId(id)).toBe(true)
    expect(isManualId(first.id)).toBe(false)
  })
})

describe('fixes to call questions (e6-t07)', () => {
  it('writes a fix against the example’s hand and answer, and stops applying it when either changes', async () => {
    const { generateQuizzes } = await import('../../src/lib/quiz.ts')
    const { conventions } = await import('../fixtures/content.ts')
    const { applyFixes, basisOf } = await import('../../src/lib/quizRecords.ts')
    const made = generateQuizzes(conventions, 'club').quizzes.filter((q) => q.kind === 'call')
    const quiz = made[0]
    expect(basisOf(quiz)).toEqual({ call: 'KQJ32.32.A32.432', answer: '2H' })
    const fix = { source: 'auto' as const, id: quiz.id, basis: basisOf(quiz), answer: '1S', by: 'ed', at: 1 }
    expect(applyFixes([quiz], [fix], conventions, 'club').quizzes[0].answer).toBe('1S')
    const otherHand = { ...quiz, hand: { ...quiz.hand!, clubs: '752' } }
    const out = applyFixes([otherHand], [fix], conventions, 'club')
    expect(out.quizzes[0].answer).toBe('2H')
    expect(out.stale).toEqual([fix])
  })
})
