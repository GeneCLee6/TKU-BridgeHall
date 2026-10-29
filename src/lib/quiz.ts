import type { Auction, Call, Convention, Hand, Level, ResponseRow, Section } from '../types/convention.ts'

/**
 * Practice questions made from the handbook (E6, e6-t01). A 意義題 (`meaning`) asks what a call
 * means after an auction, with four meanings to choose from. Everything in a question is the
 * convention's own text, word for word (CLAUDE.md rule 1): the auction, the call, the right meaning
 * and the wrong ones, which are other rows' meanings from the same table, or the same convention's
 * other tables when the table is short. Nothing is made up from general bridge knowledge.
 *
 * A row whose meaning is only 同上 (as the row above) is not asked either, nor offered as a choice.
 *
 * Rows marked 待確認 (`pending`, or inside a section marked so) are neither asked nor used as wrong
 * answers: what they say may not be what the club plays. Questions are made in the browser from
 * the content the reader's profile resolves to, so a profile's overrides are what gets asked.
 *
 * A 叫品題 (`call`, e6-t07) shows a hand and asks for the call. It is made only from the handbook's
 * worked examples, where the text itself says what to call with that hand: a hand block whose label
 * is a call (叫4H, 應叫1H, PASS!, 應叫2C，絕不可叫1NT), under a paragraph that sets the example out
 * ([原文已移除]). The paragraph is shown word for word as the question, the
 * label's call is the answer, and the reader answers on a bidding box: no wrong calls are made up
 * as choices. Labels that are not a call (何手牌較佳？, 可開3NT) ask nothing. Editors can also write
 * call questions by hand (e6-t06, lib/quizRecords.ts), as they can take a question out or change
 * its answer.
 */

export interface Quiz {
  /** `slug/sectionId/blockIndex/rowIndex`: the same question has the same id on every device */
  id: string
  kind: 'meaning' | 'call'
  profileId: string
  slug: string
  sectionId: string
  /** The table's auction; absent when the table has none (its caption and section say the context) */
  auction?: Auction
  /** The call asked about (meaning) */
  call?: Call
  hand?: Hand
  /** meaning: the row's meaning; call: the call, in compact notation (4H, 1NT, P) */
  answer: string
  /**
   * meaning: four meanings, the answer among them, in a fixed order (shuffle when showing); call:
   * the calls to choose from when an editor wrote them, else absent and answered on a bidding box
   */
  choices?: string[]
  /** call (made): the example's paragraph, word for word, which sets out the auction */
  prompt?: string
  /** The section's level, or the convention's; absent when neither is classified */
  level?: Level
  source: 'auto' | 'manual'
  disabled?: boolean
  note?: string
  /** The table's caption, as written above it */
  caption?: string
  /** Section titles from the top down to the one the table is in */
  trail: string[]
}

export type SkipReason =
  | 'pending'
  | 'emptyMeaning'
  | 'emptyCall'
  | 'refersBack'
  | 'fewChoices'
  /** A hand whose label is not a call: nothing says what to call with it */
  | 'noCall'
  /** A hand whose label is a call, without an example paragraph (EX) …) above it */
  | 'noPrompt'

/** A row no question was made from, and why */
export interface SkippedRow {
  id: string
  reason: SkipReason
}

export interface QuizSet {
  quizzes: Quiz[]
  skipped: SkippedRow[]
}

/** How many choices a meaning question has */
export const CHOICES = 4

interface Row {
  id: string
  slug: string
  sectionId: string
  blockIndex: number
  row: ResponseRow
  /** Pending itself or inside a pending section */
  pending: boolean
  auction?: Auction
  caption?: string
  trail: string[]
  level?: Level
  /** Which table: rows with the same key share one */
  table: string
  /** The auction as text, to tell which tables ask the same thing */
  auctionKey: string
}

/** Text as compared: spacing and a closing full stop do not make two meanings different */
export const sameText = (a: string) =>
  a
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[。.]+$/, '')

/** A meaning that only points at the row above (同上) says nothing on its own */
const refersBack = (meaning: string) => /^同上$/.test(sameText(meaning))

function rowsOf(convention: Convention): Row[] {
  const rows: Row[] = []
  const walk = (sections: Section[], trail: string[], pending: boolean, level?: Level) => {
    for (const section of sections) {
      const here = [...trail, section.title]
      const pendingHere = pending || Boolean(section.pending)
      const levelHere = section.level ?? level
      ;(section.blocks ?? []).forEach((block, blockIndex) => {
        if (block.kind !== 'responses') return
        const table = `${section.id}/${blockIndex}`
        block.rows.forEach((row, rowIndex) =>
          rows.push({
            id: `${convention.slug}/${table}/${rowIndex}`,
            slug: convention.slug,
            sectionId: section.id,
            blockIndex,
            row,
            pending: pendingHere || Boolean(row.pending),
            auction: block.auction,
            caption: block.caption,
            trail: here,
            level: levelHere,
            table,
            auctionKey: JSON.stringify([block.auction ?? null, block.caption ?? '']),
          }),
        )
      })
      if (section.children) walk(section.children, here, pendingHere, levelHere)
    }
  }
  walk(convention.sections, [], false, convention.level)
  return rows
}

/**
 * Up to `CHOICES - 1` wrong meanings for `question`: other rows of its table first, then the
 * convention's other tables, each group the closest in length first so no choice stands out. A
 * meaning is left out when it reads the same as the answer or another choice, when the row is
 * pending, and when it is the same call in a table with the same auction (it would be right too).
 */
function distractors(question: Row, rows: Row[]): string[] {
  const answer = sameText(question.row.meaning)
  const length = answer.length
  const usable = rows.filter(
    (r) =>
      r !== question &&
      !r.pending &&
      sameText(r.row.meaning) !== '' &&
      !refersBack(r.row.meaning) &&
      !(sameText(r.row.call) === sameText(question.row.call) && r.auctionKey === question.auctionKey),
  )
  const byLength = (list: Row[]) =>
    list
      .map((r, order) => ({ r, order, gap: Math.abs(sameText(r.row.meaning).length - length) }))
      .sort((a, b) => a.gap - b.gap || a.order - b.order)
      .map(({ r }) => r.row.meaning)
  const ordered = [
    ...byLength(usable.filter((r) => r.table === question.table)),
    ...byLength(usable.filter((r) => r.table !== question.table)),
  ]
  const picked: string[] = []
  const seen = new Set([answer])
  for (const meaning of ordered) {
    if (picked.length === CHOICES - 1) break
    if (seen.has(sameText(meaning))) continue
    seen.add(sameText(meaning))
    picked.push(meaning)
  }
  return picked
}

/** A call as a label writes it: 4H, 4♥, 1NT, 3N, PASS, P, X, XX */
const CALL = String.raw`(PASS|P|XX|X|[1-7](?:NT|N|[CDHS♣♦♥♠]))`

/**
 * The call a hand's label says to make, in compact notation, or undefined when the label says
 * something else. Only a label that is nothing but the call counts — after an optional (i)/(ii)
 * numbering, 叫 or 應叫, and emphasis (!) — or the call then a comma and the reason
 * (叫2D，Cue-Bid; 應叫2C，絕不可叫1NT). 可開3NT, [原文已移除] and the like say no.
 */
export function labelCall(label: string | undefined): Call | undefined {
  if (!label) return undefined
  const match = new RegExp(String.raw`^(?:\([ivx]+\)\s*)?(?:應叫|叫)?\s*${CALL}\s*[!！]*(?:\s*[，,].*)?$`, 'i').exec(
    label.trim(),
  )
  if (!match) return undefined
  const call = match[1].toUpperCase().replace(/[♣♦♥♠]/, (suit) => ({ '♣': 'C', '♦': 'D', '♥': 'H', '♠': 'S' })[suit]!)
  if (call === 'PASS') return 'P'
  return /^[1-7]N$/.test(call) ? `${call}T` : call
}

/** A paragraph that sets out a worked example: EX) …, EX1) … */
const isExample = (text: string) => /^\s*EX\s*\d*\s*\)/i.test(text)

/** Call questions from a convention's worked examples (e6-t07), and the hands none came from */
function callQuizzes(convention: Convention, profileId: string): QuizSet {
  const quizzes: Quiz[] = []
  const skipped: SkippedRow[] = []
  const walk = (sections: Section[], trail: string[], pending: boolean, level?: Level) => {
    for (const section of sections) {
      const here = [...trail, section.title]
      const pendingHere = pending || Boolean(section.pending)
      const levelHere = section.level ?? level
      const blocks = section.blocks ?? []
      blocks.forEach((block, blockIndex) => {
        if (block.kind !== 'hand') return
        const id = `${convention.slug}/${section.id}/${blockIndex}/hand`
        const call = labelCall(block.label)
        // The example's paragraph: the first block above that is not another of its hands
        let above = blockIndex - 1
        while (above >= 0 && blocks[above].kind === 'hand') above--
        const prompt = blocks[above]
        const reason: SkipReason | undefined = !call
          ? 'noCall'
          : prompt?.kind !== 'paragraph' || !isExample(prompt.text)
            ? 'noPrompt'
            : pendingHere || prompt.pending
              ? 'pending'
              : undefined
        if (reason || !call || prompt?.kind !== 'paragraph') {
          skipped.push({ id, reason: reason ?? 'noPrompt' })
          return
        }
        quizzes.push({
          id,
          kind: 'call',
          profileId,
          slug: convention.slug,
          sectionId: section.id,
          hand: block.hand,
          answer: call,
          ...(levelHere && { level: levelHere }),
          source: 'auto',
          prompt: prompt.text,
          trail: here,
        })
      })
      if (section.children) walk(section.children, here, pendingHere, levelHere)
    }
  }
  walk(convention.sections, [], false, convention.level)
  return { quizzes, skipped }
}

/** Two calls are the same call: 1NT and 1nt, P and PASS, 4♥ and 4H */
export const sameCall = (a: string, b: string) => {
  const norm = (c: string) => labelCall(c) ?? sameText(c).toUpperCase()
  return norm(a) === norm(b)
}

/** Whether `picked` answers the question: a meaning word for word, a call as the same call */
export const isRight = (quiz: Pick<Quiz, 'kind' | 'answer'>, picked: string) =>
  quiz.kind === 'call' ? sameCall(picked, quiz.answer) : picked === quiz.answer

/** A position for the answer among the choices that does not depend on the meanings' order */
function answerSlot(id: string): number {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return hash % CHOICES
}

/**
 * Meaning questions from every response table of the given conventions (as the reader's profile
 * resolves them), then call questions from their worked examples, with the rows and hands no
 * question could be made from. Pure: the same content gives the same questions, ids and choices.
 */
export function generateQuizzes(conventions: readonly Convention[], profileId: string): QuizSet {
  const quizzes: Quiz[] = []
  const skipped: SkippedRow[] = []
  for (const convention of conventions) {
    const rows = rowsOf(convention)
    for (const r of rows) {
      const reason: SkipReason | undefined = r.pending
        ? 'pending'
        : !sameText(r.row.call)
          ? 'emptyCall'
          : !sameText(r.row.meaning)
            ? 'emptyMeaning'
            : refersBack(r.row.meaning)
              ? 'refersBack'
              : undefined
      if (reason) {
        skipped.push({ id: r.id, reason })
        continue
      }
      const wrong = distractors(r, rows)
      if (wrong.length < CHOICES - 1) {
        skipped.push({ id: r.id, reason: 'fewChoices' })
        continue
      }
      const choices = [...wrong]
      choices.splice(answerSlot(r.id), 0, r.row.meaning)
      quizzes.push({
        id: r.id,
        kind: 'meaning',
        profileId,
        slug: r.slug,
        sectionId: r.sectionId,
        ...(r.auction && { auction: r.auction }),
        call: r.row.call,
        answer: r.row.meaning,
        choices,
        ...(r.level && { level: r.level }),
        source: 'auto',
        ...(r.caption && { caption: r.caption }),
        trail: r.trail,
      })
    }
    const calls = callQuizzes(convention, profileId)
    quizzes.push(...calls.quizzes)
    skipped.push(...calls.skipped)
  }
  return { quizzes, skipped }
}

/** Whether a convention has a table questions can be made from (練這個特約, e6-t09) */
export const hasQuestions = (convention: Convention): boolean =>
  generateQuizzes([convention], '').quizzes.length > 0

/** The practice page with only this convention chosen */
export const practicePath = (slug?: string): string =>
  slug ? `/practice?c=${encodeURIComponent(slug)}` : '/practice'

/** Where a question's id says its table is: the block index inside its section */
export function quizBlockIndex(quiz: Quiz): number {
  return Number(quiz.id.split('/').at(-2))
}

/** What a practice round draws from */
export interface QuizFilter {
  slugs?: readonly string[]
  /** Only questions of this level; questions without a level come only when there is no filter */
  level?: Level
  /** Only 意義題 or only 叫品題 */
  kind?: Quiz['kind']
}

export function filterQuizzes(quizzes: readonly Quiz[], { slugs, level, kind }: QuizFilter): Quiz[] {
  const wanted = slugs && new Set(slugs)
  return quizzes.filter(
    (q) => !q.disabled && (!wanted || wanted.has(q.slug)) && (!level || q.level === level) && (!kind || q.kind === kind),
  )
}

/** Fisher–Yates with a random source tests can fix */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** `count` questions drawn at random, each with its choices in a random order */
export function drawQuizzes(quizzes: readonly Quiz[], count: number, random: () => number = Math.random): Quiz[] {
  return shuffle(quizzes, random)
    .slice(0, count)
    .map((q) => (q.choices ? { ...q, choices: shuffle(q.choices, random) } : q))
}
