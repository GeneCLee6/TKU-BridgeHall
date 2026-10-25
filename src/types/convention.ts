/**
 * The content model. Every convention is plain typed data: adding one means adding a file under
 * src/content/conventions, registering it in src/content/index.ts and running `npm run manifest`.
 * No component changes.
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
  /** Set when this section is aimed at another level than its convention; otherwise inherited */
  level?: Level
  blocks?: Block[]
  children?: Section[]
}

/**
 * A category's id: lower-case letters, digits and hyphens. The bundled ones are in
 * content/categories.ts; editors can add more online (ARCHITECTURE.md §4.5), so any string may be one.
 */
export type CategoryId = string

/** A group in the catalogue; conventions point at it by `id`, which never changes */
export interface Category {
  id: CategoryId
  label: string
  description: string
  /** Place in the catalogue, from 0 */
  order: number
}

/** An outside website worth keeping at hand, listed under 外部參考 in the catalogue */
export interface Reference {
  title: string
  description: string
  url: string
}

/**
 * What a card is (CONTENT_GUIDE.md §2.1): a chapter of the bidding system, a convention, a
 * defensive signal, or a defence against the opponents' convention. A card without one is a
 * convention.
 */
export type ConventionKind = 'system' | 'convention' | 'signal' | 'defense'

export const conventionKinds: readonly ConventionKind[] = ['system', 'convention', 'signal', 'defense']

/** Who a card or section is for */
export type Level = 'basic' | 'intermediate' | 'advanced'

export const levels: readonly Level[] = ['basic', 'intermediate', 'advanced']

export interface Convention {
  /** URL-safe and unique: /c/:slug */
  slug: string
  nameZh: string
  nameEn: string
  /** Other names people search for */
  aliases?: string[]
  category: CategoryId
  /** Defaults to 'convention' */
  kind?: ConventionKind
  /** Absent when not yet classified */
  level?: Level
  /** Slugs of the conventions to read first (E4 learning paths) */
  prerequisites?: string[]
  /** Where the convention goes on the convention card (E3); the slot ids are defined there */
  cardSlots?: string[]
  tags: string[]
  /** One line, shown on the collapsed card */
  summary: string
  /** Where the content came from */
  source: { title: string; note?: string }
  /** ISO date of the last content review */
  updated: string
  sections: Section[]
}

/** A section's place in the outline: what the catalogue and deep links need, without the content */
export interface SectionOutline {
  id: string
  title: string
  children?: SectionOutline[]
}

export interface PendingNote {
  sectionId: string
  /** Position among the notes that belong directly to this section, in page order */
  index: number
  /** Section titles from the top level down to this section */
  trail: string[]
  text: string
}

/**
 * Everything about a convention except its content: the manifest entry the catalogue, the
 * collapsed card and deep links work from. The content is loaded when the card opens.
 */
export interface ConventionMeta extends Omit<Convention, 'sections'> {
  outline: SectionOutline[]
  /** Every 待確認 note, in page order */
  pending: PendingNote[]
}
