import type { Auction, Hand } from '../types/convention.ts'
import { labelCall, type Quiz } from './quiz.ts'

/**
 * 匯出給牌桌題庫 (E6 e6-t08, AC-6.1, AC-6.5): the handbook's call questions in the format of
 * TKU-BridgeTable's bidding question bank (`eval/quiz.ts`, `tests/bidding-quiz/*.json`, its e5-t23),
 * which the table's robot answers on every pull request. Meaning questions have no hand, so only
 * call questions go.
 *
 * Nothing is added to what the handbook says (CLAUDE.md rule 1). The bank needs a dealer, a
 * vulnerability and the auction as calls; a question goes only when its auction is there to read:
 * an auction diagram (hand-made questions), or an example written seat by seat, 左敵 1♦，同伴 X，
 * 右敵 PASS，你？. The first seat named is taken as the dealer, and as the handbook never says
 * who is vulnerable, every question is exported 無身價 (`None`) and says so in its note. Every
 * question goes as `pending`, for the club's officers to check in the table's bank. A hand with
 * small cards written as x, an auction that is not legal, or a call the bank cannot read is left
 * out and reported.
 *
 * Types mirror the table's eval/quiz.ts (CLAUDE.md rule 10; checked in parity/table-types.ts).
 */

// ── Mirrored from TKU-BridgeTable eval/quiz.ts ────────────────────────────────────────────────

export type TableSeat = 'N' | 'E' | 'S' | 'W'
export type TableVulnerability = 'None' | 'NS' | 'EW' | 'Both'
export type TableRobotKind = 'tku' | 'gib'
export type TableQuizStatus = 'pending' | 'reviewed'

export interface TableQuizQuestion {
  id: string
  system: TableRobotKind
  dealer: TableSeat
  vul: TableVulnerability
  /** `S.H.D.C` high to low; a void is empty */
  hand: string
  /** From the dealer: `1C`…`7N`, `P`, `X`, `XX` */
  auction: string[]
  answer: string
  accepted?: string[]
  source: string
  reviewer: string | null
  status: TableQuizStatus
  note?: string
}

export interface TableQuizFile {
  category: string
  title: string
  questions: TableQuizQuestion[]
}

// ── Conversion ────────────────────────────────────────────────────────────────────────────────

export type ExportSkipReason =
  /** A meaning question: no hand to call with */
  | 'meaning'
  /** Not 13 different cards written by rank (small cards as x, a missing card) */
  | 'hand'
  /** No auction to read: neither a diagram nor an example written seat by seat */
  | 'noAuction'
  /** A call the bank has no notation for (1H/S, ---), or an auction that is not legal */
  | 'auction'
  | 'disabled'

export interface QuizExport {
  questions: TableQuizQuestion[]
  skipped: { id: string; reason: ExportSkipReason }[]
}

/** The file name and category the export goes in, in the table's tests/bidding-quiz */
export const BANK_CATEGORY = 'book'
export const BANK_TITLE = '淡江橋館叫品題'

const SEATS: TableSeat[] = ['N', 'E', 'S', 'W']
const RANKS = 'AKQJT98765432'
const STRAINS = ['C', 'D', 'H', 'S', 'N']

/** A hand as the bank writes it, or undefined unless it is 13 different cards named by rank */
export function bankHand(hand: Hand): string | undefined {
  const suits = [hand.spades, hand.hearts, hand.diamonds, hand.clubs].map((s) =>
    s.trim() === '-' ? '' : s.replace(/\s+/g, '').replace(/10/g, 'T').toUpperCase(),
  )
  for (const suit of suits) {
    if ([...suit].some((rank) => !RANKS.includes(rank))) return undefined
    if (new Set(suit).size !== suit.length) return undefined
  }
  if (suits.join('').length !== 13) return undefined
  // High to low within each suit
  return suits.map((s) => [...s].sort((a, b) => RANKS.indexOf(a) - RANKS.indexOf(b)).join('')).join('.')
}

/** A call as the bank writes it (1NT → 1N, PASS → P), or undefined for anything else */
export function bankCall(call: string): string | undefined {
  const compact = labelCall(call.trim())
  if (!compact) return undefined
  return compact.endsWith('NT') ? compact.slice(0, -1) : compact
}

const rank = (call: string) => (Number(call[0]) - 1) * 5 + STRAINS.indexOf(call.slice(1))

/** Whether each call is legal after the ones before it, and whether the auction is over after them */
export function checkAuction(calls: readonly string[]): { legal: boolean; over: boolean } {
  let lastBid = -1
  /** Where the last call other than a pass is */
  let lastAt = -1
  let last: 'bid' | 'X' | 'XX' | undefined
  let passes = 0
  const over = () => (lastBid >= 0 ? passes >= 3 : passes >= 4)
  for (let i = 0; i < calls.length; i++) {
    if (over()) return { legal: false, over: true }
    const call = calls[i]
    // That call was an opponent's when it is an odd number of calls back
    const byOpponent = lastAt >= 0 && (i - lastAt) % 2 === 1
    if (call === 'P') {
      passes++
      continue
    }
    if (call === 'X') {
      if (last !== 'bid' || !byOpponent) return { legal: false, over: false }
      last = 'X'
    } else if (call === 'XX') {
      if (last !== 'X' || !byOpponent) return { legal: false, over: false }
      last = 'XX'
    } else {
      if (!/^[1-7][CDHSN]$/.test(call) || rank(call) <= lastBid) return { legal: false, over: false }
      lastBid = rank(call)
      last = 'bid'
    }
    lastAt = i
    passes = 0
  }
  return { legal: true, over: over() }
}

/** Seats in an example, by how far clockwise from you */
const SPOKEN: Record<string, number> = { 你: 0, 左敵: 1, 同伴: 2, 右敵: 3 }

/**
 * The calls of an example written seat by seat, from the first seat named, and how many seats
 * clockwise from you that seat is: 「EX) 左敵 1♦，同伴 X，右敵 PASS，你？」 → 1♦ X P from your
 * left-hand opponent. Undefined for anything written otherwise.
 */
export function spokenAuction(prompt: string): { calls: string[]; first: number } | undefined {
  const body = /^\s*EX\s*\d*\s*\)\s*(.+)$/i.exec(prompt)?.[1]
  if (!body) return undefined
  const parts = body.split(/[，,]/).map((p) => p.trim())
  const ask = parts.pop()
  if (!ask || !/^你\s*[?？]$/.test(ask) || !parts.length) return undefined
  const calls: string[] = []
  let first = -1
  for (const [i, part] of parts.entries()) {
    const match = /^(左敵|同伴|右敵|你)\s*(\S+)$/.exec(part)
    const call = match && bankCall(match[2])
    if (!match || !call) return undefined
    const seat = SPOKEN[match[1]]
    if (i === 0) first = seat
    // Seat by seat, clockwise, ending on the seat before yours
    else if (seat !== (first + i) % 4) return undefined
    calls.push(call)
  }
  if ((first + parts.length) % 4 !== 0) return undefined
  return { calls, first }
}

/**
 * The calls of an auction diagram from the dealer up to the seat asked (`?`, else the next one).
 * Leading empty seats are before the dealer.
 */
export function diagramAuction(auction: Auction): string[] | undefined {
  const raw = auction.calls.map((c) => (typeof c === 'string' ? c : c.call).trim())
  const asked = raw.findIndex((c) => /^[?？]+$/.test(c))
  const upTo = asked >= 0 ? asked : raw.length
  let dealer = 0
  while (dealer < upTo && raw[dealer] === '') dealer++
  const calls: string[] = []
  for (const call of raw.slice(dealer, upTo)) {
    const bank = bankCall(call)
    if (!bank) return undefined
    calls.push(bank)
  }
  return calls
}

/** The bank's id for a question: lower case letters, digits and dashes */
export const bankId = (id: string) =>
  `book-${id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`

/**
 * The call questions as the table's bank takes them, the one asking always South. `names` gives
 * each convention's name for the question's source.
 */
export function exportQuizzes(quizzes: readonly Quiz[], names: ReadonlyMap<string, string>): QuizExport {
  const questions: TableQuizQuestion[] = []
  const skipped: QuizExport['skipped'] = []
  for (const quiz of quizzes) {
    const skip = (reason: ExportSkipReason) => skipped.push({ id: quiz.id, reason })
    if (quiz.disabled) {
      skip('disabled')
      continue
    }
    if (quiz.kind !== 'call' || !quiz.hand) {
      skip('meaning')
      continue
    }
    const hand = bankHand(quiz.hand)
    if (!hand) {
      skip('hand')
      continue
    }
    // The calls from the dealer to South
    let read: { calls: string[] } | undefined
    let unreadable = false
    if (quiz.auction) {
      const calls = diagramAuction(quiz.auction)
      read = calls && { calls }
      unreadable = !calls
    } else if (quiz.prompt) {
      const spoken = spokenAuction(quiz.prompt)
      read = spoken && { calls: spoken.calls }
    }
    if (!read) {
      skip(unreadable ? 'auction' : 'noAuction')
      continue
    }
    const answer = bankCall(quiz.answer)
    const before = checkAuction(read.calls)
    if (!answer || !before.legal || before.over || !checkAuction([...read.calls, answer]).legal) {
      skip('auction')
      continue
    }
    // South calls next, so the dealer sits that many seats before South
    const dealer = SEATS[(((2 - read.calls.length) % 4) + 4) % 4]
    const where = [names.get(quiz.slug) ?? quiz.slug, ...quiz.trail].join(' › ')
    questions.push({
      id: bankId(quiz.id),
      system: 'tku',
      dealer,
      vul: 'None',
      hand,
      auction: read.calls,
      answer,
      source: `淡江橋館：${where}（${quiz.source === 'manual' ? '幹部出題' : '原文例題'} ${quiz.id}）`,
      reviewer: null,
      status: 'pending',
      note: [quiz.prompt, '身價原文未寫，匯出為無身價。'].filter(Boolean).join(' '),
    })
  }
  return { questions, skipped }
}

/** The export as one file of the table's bank */
export const bankFile = (questions: TableQuizQuestion[]): TableQuizFile => ({
  category: BANK_CATEGORY,
  title: BANK_TITLE,
  questions,
})
