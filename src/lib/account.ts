import { type Me, request, send } from './api.ts'

/**
 * 個人檔案、頭像與圖片檔案（E11 `e11-t01`～`e11-t03`）: the calls and types that only the account
 * page, and later the forum, use. Kept out of `api.ts` so the home page's bundle does not carry
 * them. The types mirror TKU-BridgeTable `shared/profile.ts`, `shared/avatar.ts` and
 * `shared/files.ts` (`parity/table-types.ts`, `tests/lib/tableParity.test.ts`).
 */

// ── Profile (TKU-BridgeTable shared/profile.ts) ──────────────────────────────────────────────

/** Self-rated level, lowest first: 初學者, 大專, 公開組, 橋士組 (the table's names) */
export const PROFILE_LEVELS = ['beginner', 'college', 'open', 'master'] as const
export type ProfileLevel = (typeof PROFILE_LEVELS)[number]

/** What a member tells the club about themselves; every field optional, the same on both sites */
export interface Profile {
  /** What the club calls them, e.g. their real name; the username stays the sign-in name */
  displayName?: string
  level?: ProfileLevel
  /** 常用制度, free text such as "淡江制度" or "2/1" */
  system?: string
  /** 自我介紹 */
  bio?: string
}

/** The table's `PROFILE_LIMITS` (not the system profiles' limits in api.ts) */
export const PROFILE_FIELD_LIMITS = { displayNameMax: 16, systemMax: 40, bioMax: 300 } as const

// ── Avatars (TKU-BridgeTable shared/avatar.ts) ───────────────────────────────────────────────

/**
 * The square the browser sends, in pixels. The PRD said 512; the table already stored 256×256
 * pictures of at most 64 KB in the club's storage (e1-t34), and both sites read the same one
 */
export const AVATAR_PIXELS = 256
export const AVATAR_MAX_BYTES = 64 * 1024
export const AVATAR_INPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** Where a member's picture is; `version` is `Me.avatar` or `ClubMember.avatar` */
export const avatarUrl = (userId: string, version: number) => `/api/avatar/${encodeURIComponent(userId)}?v=${version}`

// ── Files (TKU-BridgeTable shared/files.ts) ──────────────────────────────────────────────────

export const FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type FileType = (typeof FILE_TYPES)[number]
export type FilePurpose = 'post' | 'article'

export const FILE_LIMITS = {
  maxBytes: 2 * 1024 * 1024,
  thumbMaxBytes: 256 * 1024,
  pixels: 2048,
  thumbPixels: 480,
  perDay: 30,
  ticketMs: 10 * 60 * 1000,
  urlMs: 60 * 60 * 1000,
  urlsMax: 50,
} as const

export interface FileTicketRequest {
  purpose: FilePurpose
  type: FileType
  size: number
}

export interface FileTicket {
  key: string
  uploadUrl: string
  thumbUrl: string
  expires: number
}

export interface UploadedFile {
  key: string
  type: FileType
  size: number
  url: string
  thumbUrl?: string
}

export interface FileUrls {
  urls: Record<string, { url: string; thumbUrl?: string }>
}

const upload = <T>(method: string, path: string, body: Blob) =>
  request<T>(path, { method, body, headers: { 'Content-Type': body.type || 'application/octet-stream' } })

export const accountApi = {
  /** `PATCH /api/account/profile`: the whole profile; an empty text clears that field */
  setProfile: (profile: Profile) => send<{ user: Me }>('PATCH', '/api/account/profile', profile),
  /** The picture as `AvatarCropper` made it (256×256, ≤ 64 KB) */
  uploadAvatar: (picture: Blob) => upload<{ user: Me }>('PUT', '/api/account/avatar', picture),
  removeAvatar: () => send<{ user: Me }>('DELETE', '/api/account/avatar'),

  files: {
    /** A single-use pass; 503 `filesOff` until the R2 bucket exists, 429 past 30 a day */
    ticket: (ticket: FileTicketRequest) => send<FileTicket>('POST', '/api/files/ticket', ticket),
    put: (url: string, body: Blob) => upload<{ file: UploadedFile }>('PUT', url, body).then((r) => r.file),
    urls: (keys: string[]) => send<FileUrls>('POST', '/api/files/urls', { keys }).then((r) => r.urls),
    remove: (key: string) => send<{ ok: true }>('DELETE', `/api/files/${key}`),
  },
}
