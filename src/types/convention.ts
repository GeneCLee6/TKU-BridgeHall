/**
 * The content model. Every convention is plain typed data: adding one means adding a file under
 * src/content/conventions and registering it in src/content/index.ts. No component changes.
 *
 * Text fields are rendered by RichText, which understands two things only:
 *   - the suit symbols ♠ ♥ ♦ ♣ (coloured, and announced to screen readers by name)
 *   - **bold** for emphasis that was bold in the source document
 */

/**
 * A call in compact ASCII notation, rendered with suit symbols by formatCall:
 * '1NT', '2D', '3S', 'X' (double), 'XX' (redouble), 'P' (pass), '?' (the call being decided),
 * '---' (written as --- in the source), or '' (an empty seat).
 */
export type Call = string

/** A call inside an auction diagram, optionally annotated, e.g. 2C with 一門未知牌組 */
export interface AnnotatedCall {
  call: Call
  note?: string
}

export type AuctionCall = Call | AnnotatedCall

/** A bidding diagram: four seat labels, then the calls in order, filled row by row from seat 0 */
export interface Auction {
  seats: [string, string, string, string]
  calls: AuctionCall[]
}

/** One row of a response table: the call and what it means */
export interface ResponseRow {
  call: Call
  meaning: string
  /** An extra remark shown under the meaning */
  note?: string
  /** Present when the source is ambiguous: rendered as a visible 待確認 note */
  pending?: string
}

export interface RuleItem {
  text: string
  pending?: string
  children?: RuleItem[]
}

/** Thirteen cards by suit, using AKQJT98765432; '-' or '' for a void */
export interface Hand {
  spades: string
  hearts: string
  diamonds: string
  clubs: string
}

export type Block =
  | { kind: 'paragraph'; text: string; pending?: string }
  | { kind: 'rules'; items: RuleItem[]; ordered?: boolean }
  | { kind: 'responses'; auction?: Auction; caption?: string; rows: ResponseRow[] }
  | { kind: 'note'; tone: 'info' | 'warning'; text: string }
  | { kind: 'hand'; label?: string; hand: Hand }

export interface Section {
  /** Unique within its convention; used in deep links (/c/:slug/:sectionId) */
  id: string
  title: string
  /** The heading exactly as written in the source document, when the title differs */
  originalTitle?: string
  summary?: string
  pending?: string
  blocks?: Block[]
  children?: Section[]
}

export type CategoryId = 'notrump' | 'suit-openings' | 'competitive' | 'signals'

export interface Category {
  id: CategoryId
  label: string
  description: string
}

export interface Convention {
  /** URL-safe and unique: /c/:slug */
  slug: string
  nameZh: string
  nameEn: string
  /** Other names people search for */
  aliases?: string[]
  category: CategoryId
  tags: string[]
  /** One line, shown on the collapsed card */
  summary: string
  /** Where the content came from */
  source: { title: string; note?: string }
  /** ISO date of the last content review */
  updated: string
  sections: Section[]
}
