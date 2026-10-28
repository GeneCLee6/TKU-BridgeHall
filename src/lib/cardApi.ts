import {
  request,
  send,
  type CardSnapshot,
  type CardSnapshotInput,
  type CardSnapshotMeta,
} from './api.ts'

/**
 * Convention card versions and their share links (E3 e3-t09, AC-3.7; TKU-BridgeTable
 * worker/card-snapshots.ts). Kept out of api.ts so the home page's JavaScript does not carry them:
 * only the card pages (lazy) use them. Types are in api.ts with the rest of the protocol.
 */

/** A convention card version's API path; its Word file is at `${path}/docx` */
export const cardSnapshotPath = (profileId: string, templateId: string, n: number) =>
  `/api/book/cards/${encodeURIComponent(profileId)}/${encodeURIComponent(templateId)}/${n}`

export const cardApi = {
  /** A profile's versions on every template, newest first: whoever may read the profile */
  list: (profileId: string) =>
    request<{ snapshots: CardSnapshotMeta[] }>(
      `/api/book/cards/${encodeURIComponent(profileId)}`,
    ).then((r) => r.snapshots),
  /** Publishes a version: whoever may save the profile */
  publish: (profileId: string, input: CardSnapshotInput) =>
    send<{ snapshot: CardSnapshotMeta }>(
      'POST',
      `/api/book/cards/${encodeURIComponent(profileId)}`,
      input,
    ).then((r) => r.snapshot),
  /** One version; anyone may read it while it is shared */
  get: (profileId: string, templateId: string, n: number) =>
    request<{ snapshot: CardSnapshot }>(cardSnapshotPath(profileId, templateId, n)).then(
      (r) => r.snapshot,
    ),
  /** Turns the version's link on or off: whoever may set who reads the profile */
  share: (profileId: string, templateId: string, n: number, shared: boolean) =>
    send<{ snapshot: CardSnapshotMeta }>('PATCH', cardSnapshotPath(profileId, templateId, n), {
      shared,
    }).then((r) => r.snapshot),
  remove: (profileId: string, templateId: string, n: number) =>
    send<{ ok: true }>('DELETE', cardSnapshotPath(profileId, templateId, n)),
}
