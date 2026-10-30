import { request, send, type ArticleDraft, type ArticleDraftSummary, type BookDraftSummary } from './api.ts'

/**
 * An article's draft and review (E5 e5-t07; TKU-BridgeTable worker/articles.ts), as reviewApi.ts
 * for conventions. Kept out of api.ts so the home page's JavaScript does not carry them; only the
 * article editor and the review page (both lazy) use them. Types are in api.ts with the rest of
 * the protocol. Publishing is api.book.saveArticle (with `draftRevision` to publish the draft).
 */
export const articleEditApi = {
  /** The article's draft; null when it has none */
  draftOf: (slug: string) => request<{ draft: ArticleDraft | null }>(`/api/book/articles/${slug}/draft`).then((r) => r.draft),
  /**
   * Saves the draft, and with `submit` sends it for review. The first save checks `baseVersion`
   * (409 `articleConflict`); later ones `draftRevision` (409 `bookDraftConflict`).
   */
  saveDraft: (slug: string, body: { article: unknown; baseVersion: number; draftRevision: number; note?: string; submit?: boolean }) =>
    send<{ draft: ArticleDraft }>('PUT', `/api/book/articles/${slug}/draft`, body).then((r) => r.draft),
  discardDraft: (slug: string, draftRevision: number) =>
    send<{ ok: true }>('DELETE', `/api/book/articles/${slug}/draft`, { draftRevision }),
  /** Sends a draft in review back, with why (a reviewer's) */
  reject: (slug: string, draftRevision: number, note: string) =>
    send<{ draft: ArticleDraft }>('POST', `/api/book/articles/${slug}/reject`, { draftRevision, note }).then((r) => r.draft),
  /** Every convention's and article's draft, the ones in review first (the review list, /review) */
  reviews: () => request<{ drafts: BookDraftSummary[]; articles?: ArticleDraftSummary[] }>('/api/book/reviews'),
}
