/**
 * HTTP calls to the club's backend. Accounts and the content edited online live in TKU BridgeTable
 * (淡江牌桌)'s Worker; this site reaches it at /api, which vercel.json (and the dev server's proxy)
 * forwards there, so the session cookie belongs to this site. The types mirror the Worker's
 * shared/protocol.ts and worker/book.ts in TKU-BridgeTable; change them together.
 */

import type { ConventionMeta } from '../types/convention.ts'

/** TKU BridgeTable (淡江牌桌), whose Worker holds the accounts */
export const TABLE_SITE = 'https://tku-bridge-table.genelee-pro.workers.dev'

/** Limits the Worker checks too (TKU-BridgeTable shared/protocol.ts LIMITS) */
export const LIMITS = { usernameMin: 2, usernameMax: 16, passwordMin: 6, noteMax: 60 }

export type Permission = 'bookEdit' | 'bookImport'
export const PERMISSIONS: Permission[] = ['bookEdit', 'bookImport']

export interface Me {
  id: string
  username: string
  admin: boolean
  /** Everything for an admin */
  permissions: Permission[]
  /** Admins only: registrations waiting for approval */
  applications?: number
}

export type RegisterResult = { user: Me } | { pending: true; username: string }

export interface Application {
  id: string
  username: string
  note: string
  site: 'table' | 'book'
  createdAt: number
}

export interface AdminUser {
  id: string
  username: string
  admin: boolean
  createdAt: number
  lastLoginAt: number | null
  boards: number
  online: boolean
  permissions: Permission[]
  passwordResetAt: number | null
}

export interface ClubSettings {
  maxUsers: number
  inviteCode: string
}

/** One convention as edited online; `convention` is null when it is hidden from the handbook */
export interface BookEntry {
  slug: string
  version: number
  convention: unknown
  createdAt: number
  updatedAt: number
  updatedBy: string
  /** The `updated` date of the bundled convention the first online edit started from */
  bundledUpdated?: string
}

/** An online entry without its content: `meta` is the manifest entry, null when hidden */
export type BookEntrySummary = Omit<BookEntry, 'convention'> & { meta: ConventionMeta | null }

/** GET /api/book/manifest: every online entry, without content */
export interface BookManifest {
  version: number
  entries: BookEntrySummary[]
}

export interface BookRevision {
  id: string
  slug: string
  version: number
  action: 'save' | 'hide' | 'reset'
  at: number
  by: string
  note: string
  convention?: unknown
}

export interface ImportDraftSummary {
  id: string
  fileName: string
  createdAt: number
  createdBy: string
  conventions: number
}

export interface ImportDraft extends ImportDraftSummary {
  result: unknown
}

/** An error from the API, with the server's message (in Traditional Chinese) */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly params: Record<string, string | number>
  constructor(message: string, status: number, code = '', params: Record<string, string | number> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.params = params
  }
}

/** The text to show for anything a call threw */
export const errorText = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : '連不上伺服器，請確認網路後再試一次'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok)
    throw new ApiError(
      data.error ?? `伺服器回應 ${response.status}`,
      response.status,
      data.code ?? '',
      data.params ?? {},
    )
  return data as T
}

const send = <T>(method: string, path: string, body: unknown = {}) =>
  request<T>(path, { method, body: JSON.stringify(body) })
const post = <T>(path: string, body?: unknown) => send<T>('POST', path, body)

export const api = {
  me: () => request<{ user: Me }>('/api/me'),
  login: (username: string, password: string) => post<{ user: Me }>('/api/login', { username, password }),
  register: (username: string, password: string, inviteCode: string, note: string) =>
    post<RegisterResult>('/api/register', { username, password, inviteCode, note, site: 'book' }),
  logout: () => post<{ ok: true }>('/api/logout'),
  resetPassword: (username: string, inviteCode: string, password: string) =>
    post<{ ok: true }>('/api/password/reset', { username, inviteCode, password }),
  changePassword: (current: string, next: string) =>
    post<{ ok: true }>('/api/account/password', { current, next }),

  admin: {
    users: () => request<{ users: AdminUser[] }>('/api/admin/users'),
    applications: () => request<{ applications: Application[] }>('/api/admin/applications'),
    approve: (id: string) => post<{ user: Me }>(`/api/admin/applications/${id}/approve`),
    reject: (id: string) => send<{ ok: true }>('DELETE', `/api/admin/applications/${id}`),
    setPermissions: (id: string, permissions: Permission[]) =>
      post<{ ok: true }>(`/api/admin/users/${id}/permissions`, { permissions }),
    resetPassword: (id: string, password: string) =>
      post<{ ok: true }>(`/api/admin/users/${id}/password`, { password }),
    settings: () => request<{ settings: ClubSettings }>('/api/admin/settings'),
    saveSettings: (settings: Partial<ClubSettings>) =>
      post<{ settings: ClubSettings }>('/api/admin/settings', settings),
  },

  book: {
    manifest: () => request<BookManifest>('/api/book/manifest'),
    /** One convention's online entry; 404 when it was never changed online */
    entry: (slug: string) => request<{ entry: BookEntry }>(`/api/book/content/${slug}`).then((r) => r.entry),
    /** `baseVersion` is the version the edit started from: 0 for the bundled one or a new one */
    save: (slug: string, body: { convention: unknown; baseVersion: number; bundledUpdated?: string; note?: string }) =>
      send<{ entry: BookEntry }>('PUT', `/api/book/conventions/${slug}`, body),
    hide: (slug: string, baseVersion: number) =>
      post<{ entry: BookEntry }>(`/api/book/conventions/${slug}/hide`, { baseVersion }),
    /** Drops the online version, so the handbook shows its bundled one again */
    reset: (slug: string, baseVersion: number) =>
      post<{ ok: true }>(`/api/book/conventions/${slug}/reset`, { baseVersion }),
    revisions: (slug: string) =>
      request<{ revisions: BookRevision[] }>(`/api/book/conventions/${slug}/revisions`),
    revision: (slug: string, id: string) =>
      request<{ revision: BookRevision }>(`/api/book/conventions/${slug}/revisions/${id}`),
    importTicket: () => post<{ ticket: string; url: string; ready: boolean }>('/api/book/import/ticket'),
    drafts: () => request<{ drafts: ImportDraftSummary[] }>('/api/book/drafts'),
    draft: (id: string) => request<{ draft: ImportDraft }>(`/api/book/drafts/${id}`),
    saveDraft: (fileName: string, result: unknown) =>
      post<{ draft: ImportDraftSummary }>('/api/book/drafts', { fileName, result }),
    deleteDraft: (id: string) => send<{ ok: true }>('DELETE', `/api/book/drafts/${id}`),
  },
}
