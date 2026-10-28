import type { Convention } from '../types/convention.ts'
import { request, send } from './api.ts'
import { sameText, type Quiz } from './quiz.ts'
import { walkSections } from './sections.ts'

/**
 * 練習's records (E6): a reader's results (e6-t04, e6-t05) and the editors' fixes to the questions
 * (e6-t06). The types mirror TKU-BridgeTable's `shared/quiz.ts` (CLAUDE.md rule 10; checked in
 * parity/table-types.ts).
 *
 * Results: signed in, every finished round goes to the account (`/api/book/quiz/rounds`); signed out,
 * only to this browser (`tku-bridgebook:quizRounds`, if storage works). The two are never merged:
 * a shared computer's rounds do not end up on whoever signs in next.
 *
 * Fixes are an editor's explicit act (CLAUDE.md rule 1): nothing here changes a question by itself.
 * A fix to a made question names the call and answer it was written against (`basis`); when the
 * handbook's text has changed since, the fix no longer applies and the fix page lists it as stale.
 */

// ── Mirrored from TKU-BridgeTable shared/quiz.ts ──────────────────────────────────────────────

export const QUIZ_LIMITS = {
  /** Rounds kept for each member: an older one is dropped when a new one comes */
  roundsKept: 100,
  /** Questions in one round */
  answersMax: 50,
  idMax: 200,
  /** Characters of one meaning, choice or call */
  textMax: 2000,
  choicesMin: 2,
  choicesMax: 6,
  noteMax: 500,
  trailMax: 10,
  callsMax: 60,
  /** Fixes and hand-made questions together */
  fixesMax: 2000,
} as const

export interface QuizAnswer {
  id: string
  slug: string
  right: boolean
}

export interface QuizRoundInput {
  profileId: string
  answers: QuizAnswer[]
}

export interface QuizRound extends QuizRoundInput {
  id: string
  at: number
}

export interface QuizBasis {
  call: string
  answer: string
}

export interface QuizHand {
  spades: string
  hearts: string
  diamonds: string
  clubs: string
}

export interface QuizAuction {
  seats: [string, string, string, string]
  calls: (string | { call: string; note?: string })[]
}

export interface ManualQuiz {
  kind: 'meaning' | 'call'
  profileId: string
  slug: string
  sectionId: string
  auction?: QuizAuction
  call?: string
  hand?: QuizHand
  answer: string
  choices: string[]
  level?: 'basic' | 'intermediate' | 'advanced'
  caption?: string
}

export interface AutoQuizFixInput {
  source: 'auto'
  id: string
  basis: QuizBasis
  disabled?: boolean
  answer?: string
  choices?: string[]
  note?: string
}

export interface ManualQuizFixInput {
  source: 'manual'
  id: string
  quiz: ManualQuiz
  disabled?: boolean
  note?: string
}

export type QuizFixInput = AutoQuizFixInput | ManualQuizFixInput

export type QuizFix = QuizFixInput & { by: string; at: number }

// ── API ───────────────────────────────────────────────────────────────────────────────────────

export const quizApi = {
  rounds: () => request<{ rounds: QuizRound[] }>('/api/book/quiz/rounds').then((r) => r.rounds),
  addRound: (round: QuizRoundInput) => send<{ round: QuizRound }>('POST', '/api/book/quiz/rounds', { round }).then((r) => r.round),
  clearRounds: () => send<{ ok: true }>('DELETE', '/api/book/quiz/rounds'),
  fixes: () => request<{ fixes: QuizFix[] }>('/api/book/quiz/fixes').then((r) => r.fixes),
  saveFix: (fix: QuizFixInput) => send<{ fix: QuizFix }>('PUT', '/api/book/quiz/fixes', { fix }).then((r) => r.fix),
  removeFix: (id: string) => send<{ ok: true }>('DELETE', '/api/book/quiz/fixes', { id }),
}

// ── Results kept in this browser (signed out) ─────────────────────────────────────────────────

const LOCAL_KEY = 'tku-bridgebook:quizRounds'

const isRound = (value: unknown): value is QuizRound => {
  const r = value as QuizRound
  return (
    typeof r === 'object' &&
    r !== null &&
    typeof r.id === 'string' &&
    typeof r.at === 'number' &&
    typeof r.profileId === 'string' &&
    Array.isArray(r.answers) &&
    r.answers.every((a) => a && typeof a.id === 'string' && typeof a.slug === 'string' && typeof a.right === 'boolean')
  )
}

/** This browser's rounds, newest first; none when storage is unavailable or holds something else */
export function localRounds(): QuizRound[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isRound) : []
  } catch {
    return []
  }
}

/** Keeps a round in this browser (the newest QUIZ_LIMITS.roundsKept); false when storage fails */
export function addLocalRound(input: QuizRoundInput, now = Date.now()): QuizRound {
  const round: QuizRound = { id: `local-${now.toString(36)}`, at: now, ...input }
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify([round, ...localRounds()].slice(0, QUIZ_LIMITS.roundsKept)))
  } catch {
    // Private windows and full storage: the round is still shown, only not kept
  }
  return round
}

export function clearLocalRounds() {
  try {
    localStorage.removeItem(LOCAL_KEY)
  } catch {
    // Nothing kept, nothing to clear
  }
}

/** A finished round as the Worker takes it (at most QUIZ_LIMITS.answersMax questions) */
export const roundOf = (profileId: string, answers: { quiz: Quiz; picked: string }[]): QuizRoundInput => ({
  profileId,
  answers: answers
    .slice(0, QUIZ_LIMITS.answersMax)
    .map(({ quiz, picked }) => ({ id: quiz.id, slug: quiz.slug, right: picked === quiz.answer })),
})

// ── 成績 and 錯題本 (e6-t05) ────────────────────────────────────────────────────────────────────

export interface ConventionScore {
  slug: string
  answered: number
  right: number
}

export interface QuizStats {
  rounds: number
  answered: number
  right: number
  /** Weakest first: the lowest share right, then the most answered */
  bySlug: ConventionScore[]
  /** Questions whose last answer was wrong, the most recent first (錯題本) */
  wrong: { id: string; slug: string; at: number }[]
}

/** Totals over the rounds (newest first, as kept); 錯題本 is each question's last answer */
export function quizStats(rounds: readonly QuizRound[]): QuizStats {
  const bySlug = new Map<string, ConventionScore>()
  const last = new Map<string, { slug: string; right: boolean; at: number }>()
  let answered = 0
  let right = 0
  const newestFirst = [...rounds].sort((a, b) => b.at - a.at)
  for (const round of newestFirst) {
    for (const a of round.answers) {
      answered++
      if (a.right) right++
      const score = bySlug.get(a.slug) ?? { slug: a.slug, answered: 0, right: 0 }
      score.answered++
      if (a.right) score.right++
      bySlug.set(a.slug, score)
      if (!last.has(a.id)) last.set(a.id, { slug: a.slug, right: a.right, at: round.at })
    }
  }
  const share = (s: ConventionScore) => s.right / s.answered
  return {
    rounds: rounds.length,
    answered,
    right,
    bySlug: [...bySlug.values()].sort((a, b) => share(a) - share(b) || b.answered - a.answered || a.slug.localeCompare(b.slug)),
    wrong: [...last].filter(([, v]) => !v.right).map(([id, v]) => ({ id, slug: v.slug, at: v.at })),
  }
}

/** A share as a whole percentage */
export const percent = (right: number, answered: number) => (answered ? Math.round((right / answered) * 100) : 0)

// ── Fixes (e6-t06) ────────────────────────────────────────────────────────────────────────────

/** A made question's call and answer as they are now: what a new fix is written against */
export const basisOf = (quiz: Quiz): QuizBasis => ({ call: quiz.call ?? '', answer: quiz.answer })

const matches = (quiz: Quiz, basis: QuizBasis) =>
  sameText(quiz.call ?? '') === sameText(basis.call) && sameText(quiz.answer) === sameText(basis.answer)

/** Section titles from the top down to `sectionId`, or undefined when the section is gone */
function trailOf(convention: Convention | undefined, sectionId: string): string[] | undefined {
  let trail: string[] | undefined
  if (convention)
    walkSections(convention.sections, (section, ancestors) => {
      if (section.id === sectionId) trail = [...ancestors.map((a) => a.title), section.title]
    })
  return trail
}

export function manualQuizOf(fix: ManualQuizFixInput, trail: string[]): Quiz {
  const { quiz } = fix
  return {
    id: fix.id,
    kind: quiz.kind,
    profileId: quiz.profileId,
    slug: quiz.slug,
    sectionId: quiz.sectionId,
    ...(quiz.auction && { auction: quiz.auction }),
    ...(quiz.call !== undefined && { call: quiz.call }),
    ...(quiz.hand && { hand: quiz.hand }),
    answer: quiz.answer,
    choices: quiz.choices,
    ...(quiz.level && { level: quiz.level }),
    source: 'manual',
    ...(fix.disabled && { disabled: true }),
    ...(fix.note && { note: fix.note }),
    ...(quiz.caption && { caption: quiz.caption }),
    trail,
  }
}

export interface FixedQuizzes {
  /** The made questions with the fixes that still apply, then the hand-made ones of this profile */
  quizzes: Quiz[]
  /** Fixes whose question has changed or is gone (made), or whose section is gone (hand-made) */
  stale: QuizFix[]
}

/**
 * The editors' fixes over the made questions (e6-t06). A fix to a made question applies only while
 * the row still reads as it did (`basis`); a hand-made question only in its own profile, and only
 * while its convention and section are in the content.
 */
export function applyFixes(
  quizzes: readonly Quiz[],
  fixes: readonly QuizFix[],
  conventions: readonly Convention[],
  profileId: string,
): FixedQuizzes {
  const auto = new Map<string, Extract<QuizFix, { source: 'auto' }>>()
  const manual: Extract<QuizFix, { source: 'manual' }>[] = []
  for (const fix of fixes) {
    if (fix.source === 'auto') auto.set(fix.id, fix)
    else manual.push(fix)
  }
  const stale: QuizFix[] = []
  const applied = new Set<string>()
  const out = quizzes.map((quiz) => {
    const fix = auto.get(quiz.id)
    if (!fix) return quiz
    applied.add(fix.id)
    if (!matches(quiz, fix.basis)) {
      stale.push(fix)
      return quiz
    }
    const answer = fix.answer ?? quiz.answer
    const choices = fix.choices ?? quiz.choices?.map((c) => (c === quiz.answer ? answer : c))
    return {
      ...quiz,
      answer,
      ...(choices && { choices }),
      ...(fix.disabled && { disabled: true }),
      ...(fix.note && { note: fix.note }),
    }
  })
  // A fix to a question no longer made (the row is gone, pending, or another profile's content)
  for (const fix of auto.values()) if (!applied.has(fix.id)) stale.push(fix)

  const bySlug = new Map(conventions.map((c) => [c.slug, c]))
  for (const fix of manual) {
    if (fix.quiz.profileId !== profileId) continue
    const trail = trailOf(bySlug.get(fix.quiz.slug), fix.quiz.sectionId)
    if (!trail) stale.push(fix)
    else out.push(manualQuizOf(fix, trail))
  }
  return { quizzes: out, stale }
}

/** A new hand-made question's id: `slug/sectionId/m-<random>` */
export const manualId = (slug: string, sectionId: string, random: () => number = Math.random) =>
  `${slug}/${sectionId}/m-${Math.floor(random() * 36 ** 8)
    .toString(36)
    .padStart(8, '0')}`

export const isManualId = (id: string) => /\/m-[a-z0-9]+$/.test(id)

// ── Pages ─────────────────────────────────────────────────────────────────────────────────────

/** 成績與錯題本 (e6-t05) */
export const SCORES_PATH = '/practice/scores'
/** 練錯題: the practice page with only the questions last answered wrong */
export const WRONG_PATH = '/practice?wrong=1'
/** 修題 (e6-t06), for editors */
export const FIXES_PATH = '/practice/fixes'
export const fixPath = (id: string) => `${FIXES_PATH}?id=${encodeURIComponent(id)}`
