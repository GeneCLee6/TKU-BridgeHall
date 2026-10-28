import { request, send, type AuditEntry, type BookDraft, type BookDraftSummary } from './api.ts'

/**
 * Drafts, review and the audit log (E8 e8-t01, e8-t02, e8-t09; TKU-BridgeTable worker/book.ts and
 * worker/audit.ts). Kept out of api.ts so the home page's JavaScript does not carry them: only the
 * editor and the admin page (both lazy) use them. Types are in api.ts with the rest of the protocol.
 */
export const reviewApi = {
  /** The convention's draft; null when it has none */
  draftOf: (slug: string) => request<{ draft: BookDraft | null }>(`/api/book/conventions/${slug}/draft`).then((r) => r.draft),
  /**
   * Saves the draft, and with `submit` sends it for review. The first save checks `baseVersion`
   * as publishing does; later ones `draftRevision` (409 `bookDraftConflict`).
   */
  saveDraft: (
    slug: string,
    body: { convention: unknown; baseVersion: number; draftRevision: number; bundledUpdated?: string; note?: string; submit?: boolean },
  ) => send<{ draft: BookDraft }>('PUT', `/api/book/conventions/${slug}/draft`, body).then((r) => r.draft),
  discardDraft: (slug: string, draftRevision: number) =>
    send<{ ok: true }>('DELETE', `/api/book/conventions/${slug}/draft`, { draftRevision }),
  /** Sends a draft in review back, with why (a reviewer's) */
  reject: (slug: string, draftRevision: number, note: string) =>
    send<{ draft: BookDraft }>('POST', `/api/book/conventions/${slug}/reject`, { draftRevision, note }).then((r) => r.draft),
  /** Every draft, the ones in review first */
  drafts: () => request<{ drafts: BookDraftSummary[] }>('/api/book/reviews').then((r) => r.drafts),
  /** The newest 200 changes */
  audit: () => request<{ entries: AuditEntry[] }>('/api/book/audit').then((r) => r.entries),
}
