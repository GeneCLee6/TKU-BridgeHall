import { SUITS, emptyDeal, type Card, type Suit } from './board.ts'
import { blankBlock } from './editing.ts'
import type { Article, ArticleBlock } from '../types/article.ts'
import type { Block } from '../types/convention.ts'

/**
 * The article editor's helpers (E5 e5-t07): blank articles and blocks, and cards typed as text
 * (a trick of the play, a hand from AI import). Only the lazy editor and import pages use them.
 */

/** Addresses under /library that are pages, not articles: an article may not take them as its slug */
export const RESERVED_ARTICLE_SLUGS: readonly string[] = ['new', 'book', 'edit']

/** The kinds an article may add; 導讀 is the conventions' */
export type ArticleBlockKind = Exclude<ArticleBlock['kind'], 'intro'>

/** The kinds an article's editor offers, in the order of its menu; 導讀 is the conventions' */
export const ARTICLE_BLOCK_KINDS: readonly ArticleBlockKind[] = [
  'heading',
  'paragraph',
  'rules',
  'quote',
  'note',
  'image',
  'deal',
  'play',
  'hand',
  'responses',
]

/**
 * A new article. Its license starts as 僅社內 (members-only), the safe choice the PRD asks for
 * (e5 風險與對策): the editor changes it when the club wrote it or has permission.
 */
export function blankArticle(series: string, date: string): Article {
  return {
    slug: '',
    title: '',
    authors: [],
    series,
    summary: '',
    blocks: [{ kind: 'paragraph', text: '' }],
    published: date,
    updated: date,
    license: 'members-only',
  }
}

export function blankArticleBlock(kind: ArticleBlockKind): ArticleBlock {
  switch (kind) {
    case 'heading':
      return { kind: 'heading', level: 2, text: '' }
    case 'quote':
      return { kind: 'quote', text: '' }
    case 'image':
      return { kind: 'image', src: '', alt: '' }
    case 'deal':
      return { kind: 'deal', deal: emptyDeal() }
    case 'play':
      return { kind: 'play', contract: '', declarer: 'S', tricks: [] }
    default:
      return blankBlock(kind as Block['kind'])
  }
}

const SUIT_SYMBOLS: Record<string, Suit> = { '♠': 'S', '♥': 'H', '♡': 'H', '♦': 'D', '♢': 'D', '♣': 'C', '♧': 'C', '♤': 'S' }

/**
 * One card typed as text: `SA`, `♠A`, `s10`, `HT`. Anything else comes back as typed (upper-cased),
 * so the article's check names it instead of losing it.
 */
export function cardFromText(token: string): Card {
  const raw = token.trim()
  const suit = SUIT_SYMBOLS[raw[0]] ?? raw[0]?.toUpperCase()
  const rank = raw.slice(1).toUpperCase().replace(/^10$/, 'T')
  return `${suit}${rank}`
}

/** A trick typed as text, cards apart by spaces or commas, from the card led */
export const trickFromText = (text: string): Card[] =>
  text
    .split(/[\s,，、]+/)
    .filter(Boolean)
    .map(cardFromText)

export const trickText = (cards: readonly Card[]) => cards.join(' ')

/** The tricks as lines of text, and back; blank lines are dropped */
export const tricksText = (tricks: readonly Card[][]) => tricks.map(trickText).join('\n')
export const tricksFromText = (text: string): Card[][] =>
  text
    .split('\n')
    .map(trickFromText)
    .filter((trick) => trick.length > 0)

/**
 * One suit's cards written as ranks (`AKT52`, `AK1052`; `-` or empty for none), as AI import gives
 * a deal's hands. A character that is not a rank is kept as a card of that suit, so the check names it.
 */
export function suitCards(suit: Suit, text: string): Card[] {
  const ranks = text
    .toUpperCase()
    .replace(/10/g, 'T')
    .replace(/[\s\-—–－]/g, '')
  return [...ranks].map((rank) => `${suit}${rank}`)
}

/** A seat's hand from its four suits' ranks */
export const handFromSuits = (suits: Record<'spades' | 'hearts' | 'diamonds' | 'clubs', string>): Card[] =>
  SUITS.flatMap((suit) => suitCards(suit, suits[({ S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' } as const)[suit]] ?? ''))

/** A contract as typed: `4s` → `4S`, `3NT` → `3N`, `4 H X` → `4HX` */
export const contractFromText = (text: string) =>
  text
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/^([1-7])NT/, '$1N')
    .replace(/^([1-7])([♠♥♦♣])/, (_, level: string, symbol: string) => level + SUIT_SYMBOLS[symbol])
