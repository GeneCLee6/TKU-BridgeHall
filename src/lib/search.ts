import Fuse from 'fuse.js'
import type { Convention, ConventionMeta, Section } from '../types/convention.ts'
import { formatCall, toAsciiSuits } from './calls.ts'
import { blockText, walkSections } from './sections.ts'

export interface SearchRecord {
  slug: string
  /** Absent for the convention-level record */
  sectionId?: string
  /** e.g. "雷本索特約 › 遭自然牌組插叫 › 答叫原則" */
  label: string
  name: string
  tags: string
  bids: string
  text: string
  /** From the old handbook (category 'system'): ranked after the conventions, which override it */
  legacy?: boolean
}

/**
 * One record per convention (names, aliases, tags, summary) and one per section (title, bids,
 * meanings). All text goes through toAsciiSuits, so "2♦" and "2D" find the same rows.
 * A manifest entry stands in for a convention not loaded yet: its section titles are searchable.
 */
export function buildRecords(conventions: (Convention | ConventionMeta)[]): SearchRecord[] {
  const records: SearchRecord[] = []
  for (const c of conventions) {
    const legacy = c.category === 'system' || undefined
    records.push({
      legacy,
      slug: c.slug,
      label: `${c.nameZh}（${c.nameEn}）`,
      name: toAsciiSuits([c.nameZh, c.nameEn, ...(c.aliases ?? [])].join(' ')),
      tags: toAsciiSuits(c.tags.join(' ')),
      bids: '',
      text: toAsciiSuits(c.summary),
    })
    const sections: Section[] = 'sections' in c ? c.sections : c.outline
    walkSections(sections, (section, ancestors) => {
      const bids: string[] = []
      for (const block of section.blocks ?? []) {
        if (block.kind === 'responses') block.rows.forEach((r) => bids.push(formatCall(r.call)))
      }
      records.push({
        slug: c.slug,
        legacy,
        sectionId: section.id,
        label: [c.nameZh, ...ancestors.map((a) => a.title), section.title].join(' › '),
        name: toAsciiSuits(`${section.title} ${section.originalTitle ?? ''}`),
        tags: '',
        bids: toAsciiSuits(bids.join(' ')),
        text: toAsciiSuits(
          [section.summary ?? '', ...(section.blocks ?? []).map(blockText)].join(' '),
        ),
      })
    })
  }
  return records
}

/**
 * The search index file, /search-index.json: the records of every bundled convention, built with
 * the site (scripts/search-index.ts) so readers search without downloading the content. Fuse
 * takes the records as they are; indexing them in the browser takes a few milliseconds.
 * Articles and glossary terms can join as records of their own.
 */
export interface SearchIndex {
  version: typeof SEARCH_INDEX_VERSION
  records: SearchRecord[]
}

export const SEARCH_INDEX_VERSION = 1

export const buildSearchIndex = (conventions: Convention[]): SearchIndex => ({
  version: SEARCH_INDEX_VERSION,
  records: buildRecords(conventions),
})

export const isSearchIndex = (value: unknown): value is SearchIndex =>
  typeof value === 'object' &&
  value !== null &&
  (value as SearchIndex).version === SEARCH_INDEX_VERSION &&
  Array.isArray((value as SearchIndex).records)

/**
 * The records for the catalogue as shown: the index's records for a convention `fromIndex`
 * accepts (bundled and not changed online), and records built here for the others (changed or
 * added online; their content when loaded, their section titles until then). Catalogue order is
 * kept, so results rank as they would from the full content.
 */
export function mergeIndex(
  index: SearchIndex,
  catalogue: (Convention | ConventionMeta)[],
  fromIndex: (slug: string) => boolean,
): SearchRecord[] {
  const bySlug = new Map<string, SearchRecord[]>()
  for (const r of index.records) bySlug.set(r.slug, [...(bySlug.get(r.slug) ?? []), r])
  return catalogue.flatMap((c) => (fromIndex(c.slug) && bySlug.get(c.slug)) || buildRecords([c]))
}

/** Added to an old-handbook match's score (Fuse scores run 0 = exact … 1 = no match) */
const LEGACY_PENALTY = 0.2

export type SearchFn = (query: string, limit?: number) => SearchRecord[]

export const createSearch = (conventions: (Convention | ConventionMeta)[]): SearchFn =>
  searchRecords(buildRecords(conventions))

export function searchRecords(records: SearchRecord[]): SearchFn {
  const fuse = new Fuse(records, {
    keys: [
      { name: 'name', weight: 3 },
      { name: 'tags', weight: 2 },
      { name: 'bids', weight: 1.5 },
      { name: 'text', weight: 1 },
    ],
    ignoreLocation: true,
    includeScore: true,
    threshold: 0.3,
  })
  return (query, limit = 12) => {
    const q = toAsciiSuits(query.trim())
    if (!q) return []
    // Lower is better; the old handbook gives way to an equally good match in a convention
    const rank = (r: { item: SearchRecord; score?: number }) =>
      (r.score ?? 0) + (r.item.legacy ? LEGACY_PENALTY : 0)
    return fuse
      .search(q)
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, limit)
      .map((r) => r.item)
  }
}
