/**
 * Cards, deals and auctions for the forum's deal and auction blocks (E11). Pure functions only.
 *
 * The types and the rules mirror 淡江牌桌's `shared/cards.ts`, `shared/board.ts` and
 * `shared/auction.ts` so a deal or an auction posted here can be read by the table (and moved
 * there in e11-t21) without conversion. Change them together with the table.
 *
 * - A card is two letters, suit then rank: 'SA' (♠A), 'HT' (♥10), 'C2' (♣2).
 * - A call is a bid '1C' … '7N' ('N' is notrump), or 'P', 'X', 'XX'.
 *
 * The table has no single `Deal` type: a board is its `Hands` plus `dealerOf` and
 * `vulnerabilityOf`. `Deal` bundles those three fields under the table's own names.
 */

import type { Auction as TableAuction } from '../types/convention.ts'

export type Suit = 'S' | 'H' | 'D' | 'C'
export type Strain = Suit | 'N'
export type Seat = 'N' | 'E' | 'S' | 'W'
export type Side = 'NS' | 'EW'
export type Card = string
/** Table `shared/cards.ts` `Hands` */
export type Hands = Record<Seat, Card[]>
/** Table `shared/board.ts` `Vulnerability` */
export type Vulnerability = 'None' | 'NS' | 'EW' | 'Both'
/** Table `shared/auction.ts` `Call` */
export type Call = string

/** Table `shared/auction.ts` `AuctionCall` (without the robot-only fields) */
export interface AuctionCall {
  seat: Seat
  call: Call
  /** The call was alerted; the text is the explanation (may be empty) */
  alert?: string
}

/** Four hands, the dealer and the vulnerability */
export interface Deal {
  hands: Hands
  dealer: Seat
  vul: Vulnerability
}

/** An auction and who started it; each call's seat follows from the dealer */
export interface Auction {
  dealer: Seat
  calls: AuctionCall[]
}

/** ♠ ♥ ♦ ♣, the order hands are shown in */
export const SUITS: readonly Suit[] = ['S', 'H', 'D', 'C']
/** High to low; 'T' is the ten */
export const RANKS = 'AKQJT98765432'
/** Clockwise */
export const SEATS: readonly Seat[] = ['N', 'E', 'S', 'W']
export const VULNERABILITIES: readonly Vulnerability[] = ['None', 'NS', 'EW', 'Both']
/** Strains low to high, as bids rank */
export const STRAINS: readonly Strain[] = ['C', 'D', 'H', 'S', 'N']
export const LEVELS = [1, 2, 3, 4, 5, 6, 7] as const

export const suitOf = (card: Card) => card[0] as Suit
export const rankOf = (card: Card) => card[1]
/** 'T' is shown as '10' */
export const rankLabel = (rank: string) => (rank === 'T' ? '10' : rank)
const rankValue = (rank: string) => 14 - RANKS.indexOf(rank)

export const nextSeat = (seat: Seat, steps = 1): Seat => SEATS[(SEATS.indexOf(seat) + steps) % 4]
export const sideOf = (seat: Seat): Side => (seat === 'N' || seat === 'S' ? 'NS' : 'EW')
export const sameSide = (a: Seat, b: Seat) => sideOf(a) === sideOf(b)

export function fullDeck(): Card[] {
  return SUITS.flatMap((suit) => [...RANKS].map((rank) => suit + rank))
}

export function isCard(value: unknown): value is Card {
  return (
    typeof value === 'string' &&
    value.length === 2 &&
    SUITS.includes(value[0] as Suit) &&
    RANKS.includes(value[1])
  )
}

export function isSeat(value: unknown): value is Seat {
  return typeof value === 'string' && SEATS.includes(value as Seat)
}

/** ♠ ♥ ♦ ♣, high to low within a suit */
export function sortHand(cards: readonly Card[]): Card[] {
  return [...cards].sort(
    (a, b) =>
      SUITS.indexOf(suitOf(a)) - SUITS.indexOf(suitOf(b)) || rankValue(rankOf(b)) - rankValue(rankOf(a)),
  )
}

export function bySuit(cards: readonly Card[]): Record<Suit, Card[]> {
  const groups: Record<Suit, Card[]> = { S: [], H: [], D: [], C: [] }
  for (const card of sortHand(cards)) groups[suitOf(card)].push(card)
  return groups
}

/** High-card points: A 4, K 3, Q 2, J 1 */
export function hcp(cards: readonly Card[]): number {
  const points: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 }
  return cards.reduce((sum, card) => sum + (points[rankOf(card)] ?? 0), 0)
}

/** Board 1 is dealt by North, 2 by East, … (table `dealerOf`) */
export function dealerOf(boardNo: number): Seat {
  return SEATS[(boardNo - 1) % 4]
}

const VUL_CYCLE: Vulnerability[] = [
  'None', 'NS', 'EW', 'Both',
  'NS', 'EW', 'Both', 'None',
  'EW', 'Both', 'None', 'NS',
  'Both', 'None', 'NS', 'EW',
]

/** The 16-board duplicate cycle (table `vulnerabilityOf`) */
export function vulnerabilityOf(boardNo: number): Vulnerability {
  return VUL_CYCLE[(boardNo - 1) % 16]
}

export function isVulnerable(vul: Vulnerability, seat: Seat): boolean {
  return vul === 'Both' || vul === sideOf(seat)
}

// ---------------------------------------------------------------------------------------------
// Hands and deals

export const HAND_SIZE = 13

export const emptyHands = (): Hands => ({ N: [], E: [], S: [], W: [] })

export const emptyDeal = (dealer: Seat = 'N', vul: Vulnerability = 'None'): Deal => ({
  hands: emptyHands(),
  dealer,
  vul,
})

/** Which seat holds a card, if any */
export function ownerOf(hands: Hands, card: Card): Seat | undefined {
  return SEATS.find((seat) => hands[seat].includes(card))
}

/** Cards no seat holds yet, in display order */
export function unassignedCards(hands: Hands): Card[] {
  const held = new Set(SEATS.flatMap((seat) => hands[seat]))
  return fullDeck().filter((card) => !held.has(card))
}

/**
 * A click on a card in the deal panel while `seat` is chosen: a card the seat holds goes back to
 * the pack; any other card moves to the seat, unless the seat already has thirteen.
 */
export function toggleCard(hands: Hands, seat: Seat, card: Card): Hands {
  const owner = ownerOf(hands, card)
  if (owner === seat) return { ...hands, [seat]: hands[seat].filter((c) => c !== card) }
  if (hands[seat].length >= HAND_SIZE) return hands
  const next = { ...hands, [seat]: sortHand([...hands[seat], card]) }
  if (owner) next[owner] = hands[owner].filter((c) => c !== card)
  return next
}

/** The seat to fill next: `seat` while it has room, else the next one clockwise that has room */
export function seatToFill(hands: Hands, seat: Seat): Seat {
  for (let i = 0; i < 4; i++) {
    const candidate = nextSeat(seat, i)
    if (hands[candidate].length < HAND_SIZE) return candidate
  }
  return seat
}

/** When exactly one seat is short, that seat; the rest of the pack is exactly its missing cards */
export function lastSeatToFill(hands: Hands): Seat | undefined {
  const short = SEATS.filter((seat) => hands[seat].length < HAND_SIZE)
  return short.length === 1 ? short[0] : undefined
}

/** Give every card nobody holds to `seat` (up to thirteen) */
export function fillRemaining(hands: Hands, seat: Seat): Hands {
  const room = HAND_SIZE - hands[seat].length
  if (room <= 0) return hands
  return { ...hands, [seat]: sortHand([...hands[seat], ...unassignedCards(hands).slice(0, room)]) }
}

export type HandProblem =
  | { kind: 'invalid'; card: unknown }
  | { kind: 'duplicate'; card: Card }
  | { kind: 'count'; count: number }

/** Problems with a single thirteen-card hand; empty when it is complete and valid */
export function handProblems(cards: readonly unknown[]): HandProblem[] {
  const problems: HandProblem[] = []
  const seen = new Set<Card>()
  for (const card of cards) {
    if (!isCard(card)) problems.push({ kind: 'invalid', card })
    else if (seen.has(card)) problems.push({ kind: 'duplicate', card })
    else seen.add(card)
  }
  if (cards.length !== HAND_SIZE) problems.push({ kind: 'count', count: cards.length })
  return problems
}

export const isCompleteHand = (cards: readonly unknown[]) => handProblems(cards).length === 0

export type DealProblem =
  | { kind: 'invalid'; seat: Seat; card: unknown }
  | { kind: 'duplicate'; card: Card; seats: Seat[] }
  | { kind: 'count'; seat: Seat; count: number }
  | { kind: 'dealer' }
  | { kind: 'vul' }

/**
 * Problems with a deal; empty when every seat holds thirteen valid cards, no card is held twice
 * (so the four hands are exactly the 52-card pack) and the dealer and vulnerability are valid.
 */
export function dealProblems(deal: Deal): DealProblem[] {
  const problems: DealProblem[] = []
  if (!isSeat(deal.dealer)) problems.push({ kind: 'dealer' })
  if (!VULNERABILITIES.includes(deal.vul)) problems.push({ kind: 'vul' })
  const holders = new Map<Card, Seat[]>()
  for (const seat of SEATS) {
    const cards: readonly unknown[] = deal.hands?.[seat] ?? []
    for (const card of cards) {
      if (!isCard(card)) problems.push({ kind: 'invalid', seat, card })
      else holders.set(card, [...(holders.get(card) ?? []), seat])
    }
    if (cards.length !== HAND_SIZE) problems.push({ kind: 'count', seat, count: cards.length })
  }
  for (const [card, seats] of holders) if (seats.length > 1) problems.push({ kind: 'duplicate', card, seats })
  return problems
}

export const isCompleteDeal = (deal: Deal) => dealProblems(deal).length === 0

// ---------------------------------------------------------------------------------------------
// Auctions (the table's `shared/auction.ts` rules)

export const isBid = (call: Call) => /^[1-7][CDHSN]$/.test(call)
export const isCall = (call: unknown): call is Call =>
  typeof call === 'string' && (isBid(call) || call === 'P' || call === 'X' || call === 'XX')

const levelOf = (bid: Call) => Number(bid[0])
const strainOf = (bid: Call) => bid[1] as Strain
/** 0 for 1♣ up to 34 for 7NT */
export const bidIndex = (bid: Call) => (levelOf(bid) - 1) * 5 + STRAINS.indexOf(strainOf(bid))

/** The seat whose turn it is after `count` calls */
export function seatToCall(dealer: Seat, count: number): Seat {
  return nextSeat(dealer, count % 4)
}

/** Four passes to start, or three passes after any bid, end the auction */
export function isAuctionComplete(calls: readonly AuctionCall[]): boolean {
  return calls.length >= 4 && calls.slice(-3).every((c) => c.call === 'P')
}

/** Every call the next seat may make */
export function legalCalls(calls: readonly AuctionCall[], dealer: Seat): Set<Call> {
  const legal = new Set<Call>()
  if (isAuctionComplete(calls)) return legal
  const seat = seatToCall(dealer, calls.length)
  legal.add('P')
  const highest = calls.findLast((c) => isBid(c.call))
  const from = highest ? bidIndex(highest.call) + 1 : 0
  for (let i = from; i < 35; i++) legal.add(`${Math.floor(i / 5) + 1}${STRAINS[i % 5]}`)
  const lastAction = calls.findLast((c) => c.call !== 'P')
  if (lastAction && !sameSide(lastAction.seat, seat)) {
    if (isBid(lastAction.call)) legal.add('X')
    if (lastAction.call === 'X') legal.add('XX')
  }
  return legal
}

export type AuctionProblem =
  | { kind: 'dealer' }
  | { kind: 'call'; index: number }
  | { kind: 'seat'; index: number }
  | { kind: 'illegal'; index: number }
  | { kind: 'afterEnd'; index: number }

/**
 * The first problem in an auction, or null when every call is legal in turn. An auction that
 * has not ended yet is fine: a post may stop at the call being discussed.
 */
export function auctionProblem(auction: Auction): AuctionProblem | null {
  if (!isSeat(auction.dealer)) return { kind: 'dealer' }
  const calls = auction.calls
  for (let index = 0; index < calls.length; index++) {
    const { call, seat } = calls[index]
    if (!isCall(call)) return { kind: 'call', index }
    if (seat !== seatToCall(auction.dealer, index)) return { kind: 'seat', index }
    const before = calls.slice(0, index)
    if (isAuctionComplete(before)) return { kind: 'afterEnd', index }
    if (!legalCalls(before, auction.dealer).has(call)) return { kind: 'illegal', index }
  }
  return null
}

export const isLegalAuction = (auction: Auction) => auctionProblem(auction) === null

/** Add the next seat's call; the auction is returned unchanged when the call is not legal */
export function addCall(auction: Auction, call: Call, alert?: string): Auction {
  if (!legalCalls(auction.calls, auction.dealer).has(call)) return auction
  const entry: AuctionCall = { seat: seatToCall(auction.dealer, auction.calls.length), call }
  if (alert !== undefined) entry.alert = alert
  return { ...auction, calls: [...auction.calls, entry] }
}

/**
 * The same calls started by another dealer. Who may double depends only on which side acted
 * last, so a legal auction stays legal.
 */
export function withDealer(auction: Auction, dealer: Seat): Auction {
  return {
    dealer,
    calls: auction.calls.map((c, i) => ({ ...c, seat: seatToCall(dealer, i) })),
  }
}

/** Table column order for diagrams, as the club's handouts and BBO draw them */
export const AUCTION_COLUMNS: readonly Seat[] = ['W', 'N', 'E', 'S']

/** A table call ('1N', 'P') in the handbook's call notation ('1NT', 'P') for `CallLabel` */
export const toLabelCall = (call: Call) => (isBid(call) && call[1] === 'N' ? `${call[0]}NT` : call)

/**
 * The auction in the shape `AuctionTable` draws: columns 西 北 東 南, blank cells before the
 * dealer, an alert's explanation as the call's note.
 */
export function toTableAuction(auction: Auction, seatNames: Record<Seat, string>): TableAuction {
  const cells = auctionRows(auction).flat()
  while (cells.length && cells[cells.length - 1] === null) cells.pop()
  return {
    seats: AUCTION_COLUMNS.map((seat) => seatNames[seat]) as TableAuction['seats'],
    calls: cells.map((cell) => {
      if (!cell) return ''
      const call = toLabelCall(cell.call)
      return cell.alert ? { call, note: cell.alert } : call
    }),
  }
}

/**
 * Rows of four cells in `AUCTION_COLUMNS` order; cells before the dealer are empty (null).
 */
export function auctionRows(auction: Auction): (AuctionCall | null)[][] {
  const lead = AUCTION_COLUMNS.indexOf(auction.dealer)
  const cells: (AuctionCall | null)[] = [...Array<null>(lead).fill(null), ...auction.calls]
  const rows: (AuctionCall | null)[][] = []
  for (let i = 0; i < cells.length; i += 4) {
    const row = cells.slice(i, i + 4)
    while (row.length < 4) row.push(null)
    rows.push(row)
  }
  return rows
}
