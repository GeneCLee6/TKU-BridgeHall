import Fuse from 'fuse.js'
import type { Convention } from '../types/convention.ts'
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
 */
export function buildRecords(conventions: Convention[]): SearchRecord[] {
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
    walkSections(c.sections, (section, ancestors) => {
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

/** Added to an old-handbook match's score (Fuse scores run 0 = exact … 1 = no match) */
const LEGACY_PENALTY = 0.2

export type SearchFn = (query: string, limit?: number) => SearchRecord[]

export function createSearch(conventions: Convention[]): SearchFn {
  const fuse = new Fuse(buildRecords(conventions), {
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
