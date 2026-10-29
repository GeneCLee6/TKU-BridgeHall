import type { ArticleMeta, ArticleSeries } from '../types/article.ts'
import type { Level } from '../types/convention.ts'

/**
 * The library's series (E5 e5-t06): the shelves of /library. Edited online as one list
 * (PUT /api/book/series, like the catalogue's categories); until the first save the built-in ones
 * below apply. They are the series the PRD names (docs/PRD/e5-library-articles-ebooks.md 目標),
 * each with an id that never changes, whatever it is renamed to.
 */
export const BUILTIN_SERIES: readonly ArticleSeries[] = [
  { id: 'declarer-play', label: '主打', description: '', order: 0 },
  { id: 'squeeze', label: '擠牌', description: '', order: 1 },
  { id: 'defence', label: '防守', description: '', order: 2 },
  { id: 'bidding-theory', label: '叫牌理論', description: '', order: 3 },
  { id: 'club-lessons', label: '社課講義', description: '', order: 4 },
  { id: 'club-history', label: '社史', description: '', order: 5 },
]

/** An article's page in the library (e5-t05) */
export const articlePath = (slug: string) => `/library/${slug}`

/** The Worker's limits (TKU-BridgeTable worker/articles.ts SERIES_LIMITS) */
export const SERIES_LIMITS = { max: 30, idMax: 40, labelMax: 40, descriptionMax: 200 } as const

/** The series as shown: the online list when it was ever saved, the built-in ones otherwise */
export const resolveSeries = (online: readonly ArticleSeries[] | undefined): ArticleSeries[] =>
  online?.length ? [...online].sort((a, b) => a.order - b.order) : [...BUILTIN_SERIES]

/** How many articles are in each series */
export function seriesUsage(articles: readonly Pick<ArticleMeta, 'series'>[]): Map<string, number> {
  const usage = new Map<string, number>()
  for (const a of articles) usage.set(a.series, (usage.get(a.series) ?? 0) + 1)
  return usage
}

/** An id for a series added online */
export const newSeriesId = (taken: readonly string[], now = Date.now()) => {
  let id = `s-${now.toString(36)}`
  for (let n = 2; taken.includes(id); n++) id = `s-${now.toString(36)}-${n}`
  return id
}

/** What the shelves are narrowed to; an empty value is 全部 */
export interface ShelfFilter {
  series: string
  level: Level | ''
  author: string
}

export const noFilter: ShelfFilter = { series: '', level: '', author: '' }

export function filterArticles(articles: readonly ArticleMeta[], filter: ShelfFilter): ArticleMeta[] {
  return articles.filter(
    (a) =>
      (!filter.series || a.series === filter.series) &&
      (!filter.level || a.level === filter.level) &&
      (!filter.author || a.authors.includes(filter.author)),
  )
}

/** Every author, in the order the library's articles name them first */
export const authorsOf = (articles: readonly ArticleMeta[]) => [...new Set(articles.flatMap((a) => a.authors))]

export interface Shelf {
  /** Null for the articles whose series is not in the list (removed before an article moved, say) */
  series: ArticleSeries | null
  articles: ArticleMeta[]
}

/**
 * The shelves in series order, newest article first on each; empty series are left out. Articles
 * in a series the list does not have are kept on a last shelf, so none drops out of the library.
 */
export function shelves(series: readonly ArticleSeries[], articles: readonly ArticleMeta[]): Shelf[] {
  const newest = (list: ArticleMeta[]) => [...list].sort((a, b) => b.published.localeCompare(a.published))
  const known = new Set(series.map((s) => s.id))
  const list: Shelf[] = series
    .map((s) => ({ series: s, articles: newest(articles.filter((a) => a.series === s.id)) }))
    .filter((s) => s.articles.length)
  const others = articles.filter((a) => !known.has(a.series))
  return others.length ? [...list, { series: null, articles: newest(others) }] : list
}

/** A colour for a series' generated covers, the same every time (an index into the cover colours) */
export function seriesColorIndex(id: string, colors: number): number {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return hash % colors
}
