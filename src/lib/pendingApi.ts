import { request, send, type PendingList, type PendingMeta, type PendingStatus } from './api.ts'

/**
 * The 待確認 panel's calls (E8 e8-t06; TKU-BridgeTable worker/pending.ts). Kept out of api.ts so the
 * home page's JavaScript does not carry them: only the panel (lazy) uses them.
 */
export const pendingApi = {
  list: () => request<PendingList>('/api/book/pending'),
  /** An editor's: 已確認 is not set here, publishing the convention without the note closes it */
  save: (
    at: { slug: string; sectionId: string; index: number },
    body: { text: string; status: Exclude<PendingStatus, 'confirmed'>; assignee?: string; note?: string; resolution?: string },
  ) =>
    send<{ meta: PendingMeta }>('PUT', `/api/book/pending/${at.slug}/${at.sectionId}/${at.index}`, body).then((r) => r.meta),
}
