import type { Article, ArticleBlock } from '../types/article.ts'
import type { Block, CategoryId, Convention, RuleItem, Section } from '../types/convention.ts'
import { blankArticle, contractFromText, handFromSuits, RESERVED_ARTICLE_SLUGS, trickFromText } from './articleEdit.ts'
import { articleProblems } from './articles.ts'
import { isSeat, VULNERABILITIES, type Deal, type Vulnerability } from './board.ts'
import { conventionProblems, SECTION_ID_PATTERN, SLUG_PATTERN } from './content.ts'
import { normaliseCall } from './editing.ts'

/**
 * AI import's reply, and the drafts made from it. Claude answers in the flat shape of
 * TKU-BridgeTable's worker/importer.ts (structured outputs cannot describe a tree): sections
 * point to their parent with `parentId`, list items carry a `level`. This turns that back into
 * conventions. The two files change together. Articles (e5-t08) are at the end.
 */

interface FlatBlockBase {
  kind: Block['kind']
}
interface FlatParagraph extends FlatBlockBase {
  kind: 'paragraph'
  text: string
  pending: string
}
interface FlatRules extends FlatBlockBase {
  kind: 'rules'
  ordered: boolean
  items: { level: number; text: string; pending: string }[]
}
interface FlatResponses extends FlatBlockBase {
  kind: 'responses'
  caption: string
  seats: string[]
  calls: { call: string; note: string }[]
  rows: { call: string; meaning: string; note: string; pending: string }[]
}
interface FlatNote extends FlatBlockBase {
  kind: 'note'
  tone: 'info' | 'warning'
  text: string
}
interface FlatHand extends FlatBlockBase {
  kind: 'hand'
  label: string
  spades: string
  hearts: string
  diamonds: string
  clubs: string
}
type FlatBlock = FlatParagraph | FlatRules | FlatResponses | FlatNote | FlatHand

interface FlatSection {
  id: string
  parentId: string
  title: string
  originalTitle: string
  summary: string
  pending: string
  blocks: FlatBlock[]
}

export interface FlatConvention {
  action: 'new' | 'update'
  replaces: string
  slug: string
  nameZh: string
  nameEn: string
  aliases: string[]
  category: string
  tags: string[]
  summary: string
  sourceTitle: string
  sourceNote: string
  sections: FlatSection[]
}

/** One convention the AI made from a file, ready for the editor */
export interface ImportedItem {
  /** The existing convention it updates, if any */
  replaces: string
  convention: Convention
  /** Why it cannot be saved as it is (the editor shows these too) */
  problems: string[]
}

export interface ImportResult {
  items: ImportedItem[]
  reviewNotes: string
}

const str = (value: unknown) => (typeof value === 'string' ? value : '')
const arr = <T>(value: unknown) => (Array.isArray(value) ? (value as T[]) : [])
const opt = (value: unknown) => {
  const text = str(value).trim()
  return text ? text : undefined
}

/** A URL-safe slug from whatever the AI suggested */
export function slugify(text: string, fallback: string) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return SLUG_PATTERN.test(slug) ? slug : fallback
}

function rulesFrom(items: FlatRules['items']): RuleItem[] {
  const root: RuleItem[] = []
  const stack: RuleItem[] = []
  for (const flat of items) {
    const item: RuleItem = { text: str(flat.text) }
    const pending = opt(flat.pending)
    if (pending) item.pending = pending
    const depth = Math.max(0, Math.min(Math.floor(Number(flat.level) || 0), stack.length))
    if (depth === 0) root.push(item)
    else stack[depth - 1].children = [...(stack[depth - 1].children ?? []), item]
    stack.length = depth
    stack.push(item)
  }
  return root
}

function blockFrom(flat: FlatBlock): Block | null {
  switch (flat.kind) {
    case 'paragraph':
      return { kind: 'paragraph', text: str(flat.text), ...(opt(flat.pending) && { pending: opt(flat.pending) }) }
    case 'rules':
      return { kind: 'rules', items: rulesFrom(arr(flat.items)), ...(flat.ordered && { ordered: true }) }
    case 'note':
      return { kind: 'note', tone: flat.tone === 'warning' ? 'warning' : 'info', text: str(flat.text) }
    case 'hand':
      return {
        kind: 'hand',
        ...(opt(flat.label) && { label: opt(flat.label) }),
        hand: { spades: str(flat.spades), hearts: str(flat.hearts), diamonds: str(flat.diamonds), clubs: str(flat.clubs) },
      }
    case 'responses': {
      const seats = arr<string>(flat.seats).map(str)
      const calls = arr<{ call: string; note: string }>(flat.calls).map((c) => {
        const call = normaliseCall(str(c.call))
        const note = opt(c.note)
        return note ? { call, note } : call
      })
      return {
        kind: 'responses',
        ...(seats.length === 4 && { auction: { seats: seats as [string, string, string, string], calls } }),
        ...(opt(flat.caption) && { caption: opt(flat.caption) }),
        rows: arr<FlatResponses['rows'][number]>(flat.rows).map((r) => ({
          call: normaliseCall(str(r.call)),
          meaning: str(r.meaning),
          ...(opt(r.note) && { note: opt(r.note) }),
          ...(opt(r.pending) && { pending: opt(r.pending) }),
        })),
      }
    }
    default:
      return null
  }
}

/** Rebuilds the section tree; unusable or repeated ids are replaced so links stay unique */
function sectionsFrom(flats: FlatSection[]): Section[] {
  const top: Section[] = []
  const byFlatId = new Map<string, Section>()
  const used = new Set<string>()
  let n = 0
  const freshId = (wanted: string) => {
    let id = SECTION_ID_PATTERN.test(wanted) ? wanted : ''
    while (!id || used.has(id)) id = `sec-${++n}`
    used.add(id)
    return id
  }
  for (const flat of flats) {
    const blocks = arr<FlatBlock>(flat.blocks)
      .map(blockFrom)
      .filter((b): b is Block => b !== null)
    const section: Section = {
      id: freshId(str(flat.id)),
      title: str(flat.title),
      ...(opt(flat.originalTitle) && { originalTitle: opt(flat.originalTitle) }),
      ...(opt(flat.summary) && { summary: opt(flat.summary) }),
      ...(opt(flat.pending) && { pending: opt(flat.pending) }),
      ...(blocks.length && { blocks }),
    }
    const parent = byFlatId.get(str(flat.parentId))
    if (parent) parent.children = [...(parent.children ?? []), section]
    else top.push(section)
    if (!byFlatId.has(str(flat.id))) byFlatId.set(str(flat.id), section)
  }
  return top
}

/** Conventions from the AI's reply (already parsed from JSON) */
export function fromAiReply(reply: unknown, categories: string[], updated: string): ImportResult {
  const value = (reply ?? {}) as { conventions?: unknown; reviewNotes?: unknown }
  const items = arr<FlatConvention>(value.conventions).map((flat, i): ImportedItem => {
    const replaces = flat.action === 'update' ? str(flat.replaces) : ''
    const category = categories.includes(str(flat.category)) ? str(flat.category) : categories[0]
    const convention: Convention = {
      slug: replaces || slugify(str(flat.slug) || str(flat.nameEn), `imported-${i + 1}`),
      nameZh: str(flat.nameZh),
      nameEn: str(flat.nameEn),
      ...(arr<string>(flat.aliases).filter((a) => str(a).trim()).length && {
        aliases: arr<string>(flat.aliases).map(str).filter((a) => a.trim()),
      }),
      category: category as CategoryId,
      tags: arr<string>(flat.tags).map(str).filter((t) => t.trim()),
      summary: str(flat.summary),
      source: { title: str(flat.sourceTitle), ...(opt(flat.sourceNote) && { note: opt(flat.sourceNote) }) },
      updated,
      sections: sectionsFrom(arr(flat.sections)),
    }
    return { replaces, convention, problems: conventionProblems(convention, categories) }
  })
  return { items, reviewNotes: str(value.reviewNotes) }
}

/** The items kept in a saved import draft (the draft stores ImportResult as `result`) */
export function importedItems(stored: unknown): ImportResult {
  const value = (stored ?? {}) as { conventions?: unknown; reviewNotes?: unknown }
  const items = arr<ImportedItem>(value.conventions).filter(
    (item) => item && typeof item === 'object' && item.convention && typeof item.convention === 'object',
  )
  return { items, reviewNotes: str(value.reviewNotes) }
}

/** What a draft is saved as: the server wants the list under `conventions` */
export const draftBody = (result: ImportResult) => ({ conventions: result.items, reviewNotes: result.reviewNotes })

// ── Articles (e5-t08) ──────────────────────────────────────────────────────────────────────────
// The same upload can make articles for the library: TKU-BridgeTable worker/importer.ts
// articleImportSchema. The shared blocks are the conventions' above; an article adds a heading, a
// quote, a deal and a play. What the AI wrote is kept as written: cards it got wrong become cards
// the article's check names, never cards dropped.

interface FlatSuits {
  spades: string
  hearts: string
  diamonds: string
  clubs: string
}
interface FlatHeading {
  kind: 'heading'
  level: number
  text: string
}
interface FlatQuote {
  kind: 'quote'
  text: string
  cite: string
}
interface FlatDeal {
  kind: 'deal'
  caption: string
  dealer: string
  vul: string
  north: FlatSuits
  east: FlatSuits
  south: FlatSuits
  west: FlatSuits
}
interface FlatPlay {
  kind: 'play'
  caption: string
  contract: string
  declarer: string
  tricks: string[]
}
type FlatArticleBlock = FlatBlock | FlatHeading | FlatQuote | FlatDeal | FlatPlay

export interface FlatArticle {
  action: 'new' | 'update'
  replaces: string
  slug: string
  title: string
  authors: string[]
  series: string
  summary: string
  blocks: FlatArticleBlock[]
}

/** One article the AI made from a file, ready for the article editor */
export interface ImportedArticle {
  /** The existing article it updates, if any */
  replaces: string
  article: Article
  problems: string[]
}

export interface ArticleImportResult {
  items: ImportedArticle[]
  reviewNotes: string
}

const suitsOf = (value: unknown): FlatSuits => {
  const v = (value ?? {}) as Partial<FlatSuits>
  return { spades: str(v.spades), hearts: str(v.hearts), diamonds: str(v.diamonds), clubs: str(v.clubs) }
}

function articleBlockFrom(flat: FlatArticleBlock): ArticleBlock | null {
  switch (flat.kind) {
    case 'heading':
      return { kind: 'heading', level: Number(flat.level) === 3 ? 3 : 2, text: str(flat.text) }
    case 'quote':
      return { kind: 'quote', text: str(flat.text), ...(opt(flat.cite) && { cite: opt(flat.cite) }) }
    case 'deal': {
      const deal: Deal = {
        hands: {
          N: handFromSuits(suitsOf(flat.north)),
          E: handFromSuits(suitsOf(flat.east)),
          S: handFromSuits(suitsOf(flat.south)),
          W: handFromSuits(suitsOf(flat.west)),
        },
        dealer: isSeat(flat.dealer) ? flat.dealer : 'N',
        vul: VULNERABILITIES.includes(flat.vul as Vulnerability) ? (flat.vul as Vulnerability) : 'None',
      }
      return { kind: 'deal', deal, ...(opt(flat.caption) && { caption: opt(flat.caption) }) }
    }
    case 'play':
      return {
        kind: 'play',
        contract: contractFromText(str(flat.contract)),
        declarer: isSeat(flat.declarer) ? flat.declarer : 'S',
        tricks: arr<string>(flat.tricks)
          .map((t) => trickFromText(str(t)))
          .filter((t) => t.length > 0),
        ...(opt(flat.caption) && { caption: opt(flat.caption) }),
      }
    default:
      return blockFrom(flat)
  }
}

/** Articles from the AI's reply (already parsed from JSON); `series` are the allowed series ids */
export function fromArticleReply(reply: unknown, series: string[], date: string): ArticleImportResult {
  const value = (reply ?? {}) as { articles?: unknown; reviewNotes?: unknown }
  const items = arr<FlatArticle>(value.articles).map((flat, i): ImportedArticle => {
    const replaces = flat.action === 'update' && SLUG_PATTERN.test(str(flat.replaces)) ? str(flat.replaces) : ''
    let slug = replaces || slugify(str(flat.slug), `imported-article-${i + 1}`)
    if (!replaces && RESERVED_ARTICLE_SLUGS.includes(slug)) slug = `${slug}-article`
    const article: Article = {
      ...blankArticle(series.includes(str(flat.series)) ? str(flat.series) : series[0], date),
      slug,
      title: str(flat.title),
      authors: arr<string>(flat.authors).map(str).filter((a) => a.trim()),
      summary: str(flat.summary),
      blocks: arr<FlatArticleBlock>(flat.blocks)
        .map(articleBlockFrom)
        .filter((b): b is ArticleBlock => b !== null),
    }
    return { replaces, article, problems: articleProblems(article) }
  })
  return { items, reviewNotes: str(value.reviewNotes) }
}

/** The articles kept in a saved import draft; none when the draft holds conventions */
export function importedArticles(stored: unknown): ArticleImportResult {
  const value = (stored ?? {}) as { articles?: unknown; reviewNotes?: unknown }
  const items = arr<ImportedArticle>(value.articles).filter(
    (item) => item && typeof item === 'object' && item.article && typeof item.article === 'object',
  )
  return { items, reviewNotes: str(value.reviewNotes) }
}

/** What an article import's draft is saved as: the server wants the list under `articles` */
export const articleDraftBody = (result: ArticleImportResult) => ({ articles: result.items, reviewNotes: result.reviewNotes })
