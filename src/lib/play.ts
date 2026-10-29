import {
  isCard,
  isSeat,
  nextSeat,
  rankOf,
  RANKS,
  sameSide,
  suitOf,
  type Card,
  type Seat,
  type Strain,
  type Suit,
} from './board.ts'

/**
 * An article's card play (E5 e5-t03, `PlayBlock`): the contract, declarer and the tricks in order.
 * Pure functions only. The Worker checks the same shape (TKU-BridgeTable worker/articles.ts
 * checkPlayBlock); the winner of a trick follows the table's `trickWinner` (shared/game.ts).
 *
 * - The contract is in the table's call notation with its doubling: '4S', '3N', '4HX', '6NXX'.
 * - Each trick lists its cards from the leader on. The opening lead is declarer's left-hand
 *   opponent's; every later trick is led by whoever won the one before.
 * - Only the last trick may stop part-way (an article may stop at the card being discussed).
 */

export const CONTRACT = /^[1-7][CDHSN](X|XX)?$/

export interface Contract {
  level: number
  strain: Strain
  doubled: '' | 'X' | 'XX'
}

export function parseContract(contract: string): Contract | null {
  if (!CONTRACT.test(contract)) return null
  return {
    level: Number(contract[0]),
    strain: contract[1] as Strain,
    doubled: contract.slice(2) as Contract['doubled'],
  }
}

export interface PlayedCard {
  seat: Seat
  card: Card
}

export interface Trick {
  /** 1 to 13 */
  number: number
  leader: Seat
  cards: PlayedCard[]
  /** Only when all four have played */
  winner?: Seat
}

const rankValue = (card: Card) => RANKS.length - RANKS.indexOf(rankOf(card))

/** Highest trump wins, otherwise the highest card of the suit led (table `trickWinner`) */
export function trickWinner(cards: readonly PlayedCard[], trump: Suit | null): Seat {
  let best = cards[0]
  for (const played of cards.slice(1)) {
    const suit = suitOf(played.card)
    const bestSuit = suitOf(best.card)
    const beats =
      suit === bestSuit
        ? rankValue(played.card) > rankValue(best.card)
        : suit === trump && bestSuit !== trump
    if (beats) best = played
  }
  return best.seat
}

/** Who played each card and who won each trick, from the contract and declarer */
export function playedTricks(
  contract: string,
  declarer: Seat,
  tricks: readonly (readonly Card[])[],
): Trick[] {
  const strain = parseContract(contract)?.strain
  const trump = !strain || strain === 'N' ? null : strain
  let leader = nextSeat(declarer)
  return tricks.map((cards, i) => {
    const trick: Trick = {
      number: i + 1,
      leader,
      cards: cards.map((card, j) => ({ seat: nextSeat(leader, j), card })),
    }
    if (cards.length === 4) {
      trick.winner = trickWinner(trick.cards, trump)
      leader = trick.winner
    }
    return trick
  })
}

/** Tricks won so far by declarer's side and by the defenders, counting tricks 1 to `upTo` */
export function trickCount(tricks: readonly Trick[], declarer: Seat, upTo = tricks.length) {
  let declarerSide = 0
  let defenders = 0
  for (const trick of tricks.slice(0, upTo)) {
    if (!trick.winner) continue
    if (sameSide(trick.winner, declarer)) declarerSide++
    else defenders++
  }
  return { declarer: declarerSide, defenders }
}

/** Why a value is not a card-play sequence, worded for editors; empty when it is one */
export function playProblems(contract: unknown, declarer: unknown, tricks: unknown): string[] {
  const problems: string[] = []
  if (typeof contract !== 'string' || !CONTRACT.test(contract))
    problems.push('合約要像 4S、3N、4HX')
  if (!isSeat(declarer)) problems.push('要有莊家')
  if (!Array.isArray(tricks) || !tricks.length || tricks.length > 13)
    return [...problems, '要有 1 到 13 墩']
  const seen = new Set<Card>()
  tricks.forEach((trick: unknown, i) => {
    if (!Array.isArray(trick) || !trick.length || trick.length > 4) {
      problems.push(`第 ${i + 1} 墩要有 1 到 4 張牌`)
      return
    }
    if (trick.length < 4 && i < tricks.length - 1)
      problems.push(`第 ${i + 1} 墩少了牌：只有最後一墩可以沒出完`)
    for (const card of trick as unknown[]) {
      if (!isCard(card)) problems.push(`不認得的牌：${String(card)}`)
      else if (seen.has(card)) problems.push(`${card} 出現了兩次`)
      else seen.add(card)
    }
  })
  return problems
}
