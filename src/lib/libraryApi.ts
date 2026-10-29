import { request, send, type ArticleList, type ArticleSeries, type ArticleSeriesList } from './api.ts'
import { articleRecords } from './search.ts'

/**
 * The library's calls that only lazy pages make (E5 e5-t06, e5-t13; TKU-BridgeTable
 * worker/articles.ts): kept out of api.ts so the home page's JavaScript does not carry them.
 * Types are in api.ts with the rest of the protocol.
 */
export const libraryApi = {
  /** The article list with every article's words (`text`), for search */
  articlesWithText: () => request<ArticleList>('/api/book/articles?text=1'),
  /**
   * Replaces the whole list of series (add, rename, reorder, remove); `order` follows the list.
   * 409 `seriesConflict` when someone saved since `baseVersion`, `seriesInUse` when a removed one
   * still has an article.
   */
  saveSeries: (series: Omit<ArticleSeries, 'order'>[], baseVersion: number) =>
    send<ArticleSeriesList>('PUT', '/api/book/series', { series, baseVersion }),
}

/**
 * The articles' records for the search box (e5-t13; state/useSearch.ts); none when the Worker
 * cannot be reached. Here rather than in search.ts, which the build's index script also runs.
 */
export const loadArticleRecords = () => libraryApi.articlesWithText().then(articleRecords, () => [])
