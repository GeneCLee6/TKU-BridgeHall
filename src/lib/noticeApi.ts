import { request, send, type BookFollow, type SuggestUnifyInput } from './api.ts'

/**
 * Following a convention and 建議統一 (E8 e8-t10, E2 e2-t08; TKU-BridgeTable
 * worker/book-notices.ts). The notifications themselves are shown in 淡江牌桌's notification centre.
 * Kept out of api.ts so the home page's JavaScript does not carry them; types are in api.ts.
 */
export const noticeApi = {
  /** Whether the member follows (關注) a convention */
  following: (slug: string) => request<BookFollow>(`/api/book/follows/${encodeURIComponent(slug)}`).then((r) => r.following),
  setFollowing: (slug: string, following: boolean) =>
    send<BookFollow>('PUT', `/api/book/follows/${encodeURIComponent(slug)}`, { following } satisfies BookFollow).then((r) => r.following),
  /** The captain (or an editor) suggests a partnership drop an override; both partners are told */
  suggestUnify: (teamId: string, input: SuggestUnifyInput) =>
    send<{ ok: true }>('POST', `/api/club/teams/${encodeURIComponent(teamId)}/suggest-unify`, input),
}
