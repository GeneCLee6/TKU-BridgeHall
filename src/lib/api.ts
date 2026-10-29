/**
 * HTTP calls to the club's backend. Accounts and the content edited online live in TKU BridgeTable
 * (淡江牌桌)'s Worker; this site reaches it at /api, which vercel.json (and the dev server's proxy)
 * forwards there, so the session cookie belongs to this site. The types mirror the Worker's
 * shared/protocol.ts and worker/book.ts in TKU-BridgeTable; change them together.
 */

import type { ArticleMeta, ArticleSeries } from '../types/article.ts'
import type { ConventionMeta, Section } from '../types/convention.ts'
import type { Term } from '../types/glossary.ts'
import type { Profile } from './account.ts'
import type { SpecShows, SystemSpec } from './systemSpec.ts'

export type { ArticleSeries }

/** TKU BridgeTable (淡江牌桌), whose Worker holds the accounts */
export const TABLE_SITE = 'https://tku-bridge-table.genelee-pro.workers.dev'

/** Limits the Worker checks too (TKU-BridgeTable shared/protocol.ts LIMITS) */
export const LIMITS = { usernameMin: 2, usernameMax: 16, passwordMin: 6, noteMax: 60 }

/**
 * `bookEdit`: drafts and sending them for review; `bookReview` (e8-t01): publishing, sending drafts
 * back, hiding, going back to the bundled one. A reviewer is always an editor too (the Worker adds
 * `bookEdit` when it stores `bookReview`).
 */
export type Permission = 'bookEdit' | 'bookReview' | 'bookImport'
export const PERMISSIONS: Permission[] = ['bookEdit', 'bookReview', 'bookImport']

export interface Me {
  id: string
  username: string
  admin: boolean
  /** Everything for an admin */
  permissions: Permission[]
  /** Admins only: registrations waiting for approval */
  applications?: number
  /** The system profile the member reads with, kept with the account (e1-t16); absent for the club's */
  bookProfile?: string
  /** Their uploaded picture's version (`avatarUrl` in lib/account.ts); none means the default avatar (e11-t03) */
  avatar?: number
  /** Their own profile (e11-t01), the same on both sites; empty until they fill it in */
  profile?: Profile
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

/** Where a convention's change is (e8-t01): its draft is `draft` or `in-review`; a BookEntry is `published` */
export type BookEntryStatus = 'draft' | 'in-review' | 'published'

/**
 * One convention as edited online and published; `convention` is null when it is hidden from the
 * handbook. Readers only ever get published entries; drafts are BookDraft.
 */
export interface BookEntry {
  slug: string
  version: number
  convention: unknown
  createdAt: number
  updatedAt: number
  updatedBy: string
  /** The `updated` date of the bundled convention the first online edit started from */
  bundledUpdated?: string
  /** Absent on entries saved before review existed (2026-10-28): they are published too */
  status?: 'published'
  /** Who sent the published draft for review; absent when a reviewer published straight away */
  reviewRequestedBy?: string
  reviewRequestedAt?: number
  /** The reviewer who published it */
  reviewedBy?: string
  reviewedAt?: number
}

/**
 * A convention's change that is not published yet (e8-t02; TKU-BridgeTable worker/book.ts): one per
 * convention, shared by the editors; only editors and reviewers see it.
 */
export interface BookDraft {
  slug: string
  status: Exclude<BookEntryStatus, 'published'>
  /** The published version it started from; 0 for the bundled convention or a new one */
  baseVersion: number
  /** Counts the draft's saves, from 1; sent back as `draftRevision` */
  revision: number
  convention: unknown
  bundledUpdated?: string
  /** What the editor says the change is; becomes the version's note when published */
  note: string
  createdAt: number
  createdBy: string
  updatedAt: number
  updatedBy: string
  /** Set while it is in review */
  reviewRequestedBy?: string
  reviewRequestedAt?: number
  /** Set when a reviewer sent it back, with why; cleared when it goes for review again */
  reviewedBy?: string
  reviewedAt?: number
  reviewNote?: string
}

/** GET /api/book/reviews: every draft without its content, plus the convention's name */
export type BookDraftSummary = Omit<BookDraft, 'convention'> & { nameZh: string }

/** TKU-BridgeTable worker/audit.ts: who changed what (e8-t09) */
export type AuditAction =
  | 'book:draft'
  | 'book:submit'
  | 'book:reject'
  | 'book:discard'
  | 'book:publish'
  | 'book:hide'
  | 'book:reset'
  | 'book:categories'
  | 'book:glossary'
  | 'article:publish'
  | 'article:hide'
  | 'article:series'
  | 'ebook:save'
  | 'ebook:remove'
  | 'profile:create'
  | 'profile:save'
  | 'profile:delete'
  | 'quiz:fix'
  | 'quiz:unfix'
  | 'card:publish'
  | 'card:delete'
  | 'path:save'
  | 'path:reset'

export interface AuditEntry {
  id: string
  at: number
  by: string
  action: AuditAction
  /** A convention's or an article's slug, a profile's id, `<profile>/<template>` for a card, 'categories' or 'series' */
  target: string
  version?: number
  /** The saved version's id (BookRevision.id), for publishing, hiding and resets */
  revisionId?: string
  note?: string
}

/** An online entry without its content: `meta` is the manifest entry, null when hidden */
export type BookEntrySummary = Omit<BookEntry, 'convention'> & { meta: ConventionMeta | null }

/**
 * A catalogue group as edited online (TKU-BridgeTable worker/book.ts BookCategory); the same shape
 * as the handbook's Category
 */
export interface BookCategory {
  id: string
  label: string
  description: string
  order: number
}

/**
 * GET /api/book/categories. An empty list means they were never edited online, so the bundled ones
 * apply; `version` is what a save sends back as `baseVersion`.
 */
export interface BookCategories {
  version: number
  categories: BookCategory[]
  updatedAt?: number
  updatedBy?: string
}

/**
 * GET /api/book/glossary (TKU-BridgeTable worker/glossary.ts BookGlossary, e4-t05). Version 0 means
 * it was never edited online, so the bundled glossary applies.
 */
export interface BookGlossary {
  version: number
  terms: Term[]
  updatedAt?: number
  updatedBy?: string
}

/** GET /api/book/manifest: every online entry, without content, and the online categories */
export interface BookManifest {
  version: number
  entries: BookEntrySummary[]
  /** Absent from a Worker (or a manifest cached) before categories were data */
  categories?: BookCategory[]
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

/**
 * One article in the library as published (e5-t04; TKU-BridgeTable worker/articles.ts): `article`
 * is null when it is hidden, which only editors get. lib/articles.ts checks its shape before use.
 */
export interface ArticleEntry {
  slug: string
  version: number
  article: unknown
  createdAt: number
  updatedAt: number
  updatedBy: string
  status: 'published'
  reviewedBy: string
  reviewedAt: number
}

export type ArticleEntrySummary = Omit<ArticleEntry, 'article'> & { meta: ArticleMeta | null }

/**
 * Signed, short-lived addresses for the file keys an article names (its cover and pictures); empty
 * while the R2 bucket is not set up (`filesOff`), when the page shows the pictures' descriptions
 */
export type ArticleFiles = Record<string, { url: string; thumbUrl?: string }>

/** The series as edited online; an empty list means never, so the built-in ones apply (lib/series.ts) */
export interface ArticleSeriesList {
  version: number
  series: ArticleSeries[]
  updatedAt?: number
  updatedBy?: string
}

/**
 * GET /api/book/articles: what the reader may see, without blocks, the covers' addresses and the
 * series; with `?text=1` (libraryApi.ts, for search, e5-t13) every article's words by slug
 */
export interface ArticleList {
  version: number
  entries: ArticleEntrySummary[]
  files: ArticleFiles
  series: ArticleSeriesList
  text?: Record<string, string>
}

/** GET /api/book/articles/:slug */
export interface ArticleResponse {
  entry: ArticleEntry
  files: ArticleFiles
}

export interface ArticleRevision {
  id: string
  slug: string
  version: number
  action: 'save' | 'hide'
  at: number
  by: string
  note: string
  article?: unknown
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

// System profiles (制度集, E1 e1-t07): mirrors the "System profiles" part of TKU-BridgeTable
// shared/protocol.ts, field for field; tests/lib/profileTypes.test.ts has the same checks there.
// The one difference: the Worker keeps a replaced section as Record<string, unknown>, typed here
// as the handbook's Section. lib/profiles.ts resolves the layers.

/** The club's own profile: always there, never deleted, the root every other profile inherits */
export const CLUB_PROFILE_ID = 'club'

/** Who a profile belongs to: the club, a team, or a partnership */
export const PROFILE_SCOPES = ['club', 'team', 'partnership'] as const
export type ProfileScope = (typeof PROFILE_SCOPES)[number]
export const isProfileScope = (value: unknown): value is ProfileScope => PROFILE_SCOPES.includes(value as ProfileScope)

/**
 * Limits the Worker checks on a saved profile: its JSON in UTF-8 bytes, how many overrides it may
 * hold, how many profiles the club may have besides its own, the name's length and a note's length
 */
export const PROFILE_LIMITS = { bytesMax: 200_000, overridesMax: 500, profilesMax: 100, nameMax: 40, noteMax: 2_000, cardEditsMax: 1_000 } as const

/**
 * Who may read a team's or partnership's profile (e2-t04): the whole club, the default, or only its
 * members (and the editors). The club's profile is the club's to read.
 */
export const PROFILE_VISIBILITIES = ['club', 'members'] as const
export type ProfileVisibility = (typeof PROFILE_VISIBILITIES)[number]

/** Whether a profile plays a convention; a convention it does not list follows the parent profile */
export type Adoption = 'on' | 'off'

/**
 * One place where a profile differs from its parent. Rows are found by position, the same as the
 * editor: `blockIndex` within the section's own blocks, `rowIndex` within that `responses` block
 */
export type ProfileOverride =
  /** A response row means something else; `note`, when present, replaces the row's note ('' clears it) */
  | { kind: 'row'; slug: string; sectionId: string; blockIndex: number; rowIndex: number; meaning: string; note?: string }
  /** The whole section is replaced (it keeps `sectionId` as its id) */
  | { kind: 'section'; slug: string; sectionId: string; section: Section }
  /** The convention's summary or tags, whichever is present */
  | { kind: 'meta'; slug: string; summary?: string; tags?: string[] }

/** A private note on a convention or one of its sections, shown only to the profile's members */
export interface ProfileNote {
  slug: string
  sectionId?: string
  text: string
  /** The user id that wrote it */
  by: string
  at: number
}

/**
 * A hand edit of one cell of a convention card (E3 e3-t06), kept by slot id such as
 * `wbf.openings.1H.responses`; the handbook fills the cards from the conventions and puts these
 * on top. Fields left out keep what the conventions filled; `text` is at most `noteMax` long
 */
export interface ProfileCardEdit {
  text?: string
  /** A tick box, or a tick-like table cell */
  checked?: boolean
  /** The chosen option of a choice */
  option?: string
  /** Marked for the partnership to look at */
  flagged?: boolean
}

export interface SystemProfile {
  /** CLUB_PROFILE_ID for the club; a random id for the others */
  id: string
  /** 「社團預設」「A 隊」「小明＋小華」 */
  name: string
  scope: ProfileScope
  /** The profile this one inherits; absent for the club, and taken as the club when absent on any other */
  parentId?: string
  /** 'members' when only its members (and the editors) may read it; absent for the whole club */
  visibility?: ProfileVisibility
  /** slug -> plays it or not; a slug left out follows the parent */
  adopted: Record<string, Adoption>
  overrides: ProfileOverride[]
  notes: ProfileNote[]
  /** Hand edits of its convention cards by slot id (e3-t06); a slot left out follows the parent */
  cardEdits?: Record<string, ProfileCardEdit>
  version: number
  updatedAt: number
  /** The user id that saved this version */
  updatedBy: string
}

/** GET /api/book/profiles: a profile without its adoptions, overrides and notes, which it counts instead */
export interface ProfileSummary {
  id: string
  name: string
  scope: ProfileScope
  parentId?: string
  visibility?: ProfileVisibility
  version: number
  updatedAt: number
  updatedBy: string
  counts: { adopted: number; overrides: number; notes: number }
}

/** A saved version of a profile, newest first in the list, which leaves out `profile` */
export interface ProfileRevision {
  profileId: string
  version: number
  at: number
  /** The user id that saved it */
  by: string
  note: string
  profile?: SystemProfile
}

/** What an editor sends to create or save a profile; the Worker sets the id, version and who saved it */
export type ProfileInput = Pick<SystemProfile, 'name' | 'scope' | 'parentId' | 'visibility' | 'adopted' | 'overrides' | 'notes' | 'cardEdits'>

/**
 * What the member asking may do with a profile (e2-t04), sent with GET /api/book/profiles/:id so the
 * handbook knows what to offer; the Worker checks again on every call. `notes`: sees its private
 * notes; `edit`: may save it; `share`: may change its visibility (a team's captain, not its members)
 */
export interface ProfileAccess {
  notes: boolean
  edit: boolean
  share: boolean
}

// Convention card versions (E3 e3-t09): mirrors the "Convention card versions" part of
// TKU-BridgeTable shared/protocol.ts. `card` is this site's FilledCard (src/cards/fill.ts), kept
// by the Worker as sent.

export const CARD_SNAPSHOT_LIMITS = { perProfile: 200, cardBytesMax: 800_000, docxBytesMax: 600_000, noteMax: 200 } as const

/** GET /api/book/cards/:profileId: a version without its card */
export interface CardSnapshotMeta {
  profileId: string
  templateId: string
  /** 1, 2, … for each profile and template */
  n: number
  at: number
  by: string
  byName?: string
  note: string
  profileName: string
  profileVersion: number
  /** Anyone with the link may read it, signed in or not */
  shared: boolean
  /** Has the Word file */
  docx: boolean
}

export interface CardSnapshot extends CardSnapshotMeta {
  card: Record<string, unknown>
}

/** POST /api/book/cards/:profileId */
export interface CardSnapshotInput {
  templateId: string
  profileVersion: number
  note?: string
  card: Record<string, unknown>
  /** The Word file, base64 */
  docx?: string
}

// Teams and partnerships (E2 e2-t01): mirrors the "Teams and partnerships" part of TKU-BridgeTable
// shared/protocol.ts, field for field (parity/table-types.ts). The team type is ClubTeam there
// because Team is a team match's side; the same name here keeps the two easy to compare.

/** Most members a team may have (its captain included); most partnerships, pending or active, one member may be in */
export const TEAM_LIMITS = { membersMax: 8, pairsMax: 10, nameMax: 40 } as const

export interface ClubTeam {
  id: string
  name: string
  /** A member of the team; manages it with the editors */
  captainId: string
  /** User ids, the captain's among them, in the order they joined */
  memberIds: string[]
  /** The team's system profile, made with the team */
  profileId: string
  createdAt: number
  /** Archived teams keep their members and profile but are left off the lists by the handbook */
  archived?: boolean
  /** The captain lets the members edit the team's profile too (e2-t10); absent when only the captain may */
  membersEdit?: boolean
}

export const PAIR_STATUSES = ['pending', 'active', 'ended'] as const
export type PairStatus = (typeof PAIR_STATUSES)[number]

export interface Partnership {
  id: string
  /** [who invited, who was invited] */
  userIds: [string, string]
  /** The team the two play for, when they do; both are its members */
  teamId?: string
  /** The partnership's system profile, made when the invitation is accepted: '' while pending */
  profileId: string
  createdAt: number
  status: PairStatus
  /** When the invitation was accepted, and when the partnership ended */
  acceptedAt?: number
  endedAt?: number
}

/** POST /api/club/teams: the captain is added to the members when left out */
export interface TeamInput {
  name: string
  captainId: string
  memberIds?: string[]
}

/** PATCH /api/club/teams/:id: whichever fields are present */
export interface TeamPatch {
  name?: string
  captainId?: string
  archived?: boolean
  membersEdit?: boolean
}

/** GET /api/club/members: who may be put on a team or invited as a partner, by username */
export interface ClubMember {
  id: string
  username: string
  /** Their profile's display name, when they set one (e11-t01) */
  displayName?: string
  /** Their uploaded picture's version; none means the default avatar (e11-t03) */
  avatar?: number
}

/** POST /api/club/pairs: invite `partnerId`, optionally as partners in a team both belong to */
export interface PairInvite {
  partnerId: string
  teamId?: string
}

// ── The handbook → TKB, the table's robot (E7: e7-t03, e7-t04) ─────────────────────────────────
// The calls and SYSTEM_SPEC_LIMITS are in lib/tableSync.ts, which only the report page loads

/**
 * A profile's rules as last synced to the table: the report page makes the `SystemSpec` from the
 * profile's conventions (`toSystemSpec`) and an editor sends it (PUT /api/book/system-spec/:id)
 */
export interface SyncedSystemSpec {
  spec: SystemSpec
  syncedAt: number
  /** The user id that synced it */
  syncedBy: string
  /** Their username, when the account still exists */
  syncedByName?: string
}

/** GET /api/book/system-spec?profileId=: the profile's synced rules, and which profile TKB follows */
export interface SystemSpecStatus {
  /** The profile whose rules TKB uses in the club's system (the table's `ClubConfig.systemProfileId`) */
  tableProfileId: string
  /** Null until the profile is synced */
  synced: SyncedSystemSpec | null
}

/** PUT /api/book/system-spec/:profileId */
export interface SystemSpecInput {
  spec: SystemSpec
}

/** POST /api/book/robot-meanings: the calls to look up, after each auction (a `Book.after` pattern) */
export interface RobotMeaningsQuery {
  items: { after: string; calls: string[] }[]
}

/** What the robot's rule shows, in the parts the handbook's patterns read, and in words */
export interface RobotShows extends Omit<SpecShows, 'name'> {
  /** The robot's convention name, which may be one the handbook's patterns do not read */
  name?: string
  /** The robot's explanation in Traditional Chinese */
  text: string
}

export interface RobotMeaningsItem {
  after: string
  /** Null when no rule of TKB in the club's system makes the call after this auction */
  meanings: Record<string, RobotShows | null>
}

/** The answer to POST /api/book/robot-meanings */
export interface RobotMeanings {
  items: RobotMeaningsItem[]
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

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
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

export const send = <T>(method: string, path: string, body: unknown = {}) =>
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
  /** Keeps the member's system profile with the account; '' for the club's (e1-t16) */
  setPreferences: (preferences: { bookProfile: string }) => post<{ user: Me }>('/api/account/preferences', preferences),

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

  /**
   * Teams and partnerships (E2). Any member reads them; editors make teams, which the captain and
   * the editors manage; a member invites a partner, and only the two answer or end it. A team gets
   * its profile when made, a partnership when accepted.
   */
  club: {
    /** Every member's id and username, for picking a team's members or a partner */
    members: () => request<{ members: ClubMember[] }>('/api/club/members').then((r) => r.members),
    teams: () => request<{ teams: ClubTeam[] }>('/api/club/teams').then((r) => r.teams),
    /** A team and its active partnerships; 404 `teamGone` */
    team: (id: string) => request<{ team: ClubTeam; pairs: Partnership[] }>(`/api/club/teams/${encodeURIComponent(id)}`),
    /** bookEdit; 409 `teamFull` past TEAM_LIMITS.membersMax */
    createTeam: (team: TeamInput) => post<{ team: ClubTeam }>('/api/club/teams', team).then((r) => r.team),
    /**
     * The captain or an editor; `membersEdit` lets the members edit the team's profile (e2-t10). An
     * archived team only takes `{ archived: false }` (409 `teamArchived`)
     */
    updateTeam: (id: string, patch: TeamPatch) =>
      send<{ team: ClubTeam }>('PATCH', `/api/club/teams/${encodeURIComponent(id)}`, patch).then((r) => r.team),
    addMember: (teamId: string, userId: string) =>
      post<{ team: ClubTeam }>(`/api/club/teams/${encodeURIComponent(teamId)}/members`, { userId }).then((r) => r.team),
    /** The captain or an editor, or the member leaving; never the captain */
    removeMember: (teamId: string, userId: string) =>
      send<{ team: ClubTeam }>('DELETE', `/api/club/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`).then(
        (r) => r.team,
      ),
    /** The member's own partnerships and invitations, ended ones too, newest first */
    pairs: () => request<{ pairs: Partnership[] }>('/api/club/pairs').then((r) => r.pairs),
    pair: (id: string) => request<{ pair: Partnership }>(`/api/club/pairs/${encodeURIComponent(id)}`).then((r) => r.pair),
    /** Notifies the partner; 409 `pairExists` or `pairLimit` */
    invite: (invite: PairInvite) => post<{ pair: Partnership }>('/api/club/pairs', invite).then((r) => r.pair),
    accept: (id: string) => post<{ pair: Partnership }>(`/api/club/pairs/${encodeURIComponent(id)}/accept`).then((r) => r.pair),
    decline: (id: string) => post<{ ok: true }>(`/api/club/pairs/${encodeURIComponent(id)}/decline`),
    /** Ends an active partnership (its profile stays); on a pending one, takes it back or declines it (then null) */
    end: (id: string) => post<{ pair: Partnership | null }>(`/api/club/pairs/${encodeURIComponent(id)}/end`).then((r) => r.pair),
  },

  book: {
    manifest: () => request<BookManifest>('/api/book/manifest'),
    /** One convention's online entry; 404 when it was never changed online */
    entry: (slug: string) => request<{ entry: BookEntry }>(`/api/book/content/${slug}`).then((r) => r.entry),
    /**
     * Publishes (a reviewer's, e8-t01). `baseVersion` is the published version the edit started
     * from: 0 for the bundled one or a new one. `draftRevision` when the edit started from the
     * convention's draft, which is then used up.
     */
    save: (slug: string, body: { convention: unknown; baseVersion: number; bundledUpdated?: string; note?: string; draftRevision?: number }) =>
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
    categories: () => request<BookCategories>('/api/book/categories'),
    /**
     * Replaces the whole list (add, rename, reorder, remove); `order` follows the list. 409
     * `categoryConflict` when someone saved since `baseVersion`, `categoryInUse` when a removed one
     * still has a convention edited online.
     */
    saveCategories: (categories: Omit<BookCategory, 'order'>[], baseVersion: number) =>
      send<BookCategories>('PUT', '/api/book/categories', { categories, baseVersion }),
    glossary: () => request<BookGlossary>('/api/book/glossary'),
    /** Replaces the whole glossary (e4-t07); 409 `glossaryConflict` when someone saved since `baseVersion` */
    saveGlossary: (terms: Term[], baseVersion: number) =>
      send<BookGlossary>('PUT', '/api/book/glossary', { terms, baseVersion }),
    /**
     * System profiles. Signed out, the list has the club's only and `profile` reads the club's
     * without its notes. Signed in, a member reads every profile but the members-only ones of teams
     * and partnerships they are not in (403 `noPermission`), and sees the notes of their own only.
     * Editors save any, a team's captain (and its members, when let) the team's, the two partners
     * theirs while it lasts (e2-t04, ARCHITECTURE.md §4.2); creating and deleting stay the editors'.
     * The club's exists before anyone saves it (version 0) and cannot be deleted.
     */
    profiles: () => request<{ profiles: ProfileSummary[] }>('/api/book/profiles').then((r) => r.profiles),
    profile: (id: string) =>
      request<{ profile: SystemProfile }>(`/api/book/profiles/${encodeURIComponent(id)}`).then((r) => r.profile),
    /** The same, with what the member may do with it (absent when signed out) */
    profileWithAccess: (id: string) =>
      request<{ profile: SystemProfile; access?: ProfileAccess }>(`/api/book/profiles/${encodeURIComponent(id)}`),
    /** A team's or partnership's profile; the Worker picks its id */
    createProfile: (profile: ProfileInput, note?: string) =>
      post<{ profile: SystemProfile }>('/api/book/profiles', { profile, note }).then((r) => r.profile),
    /** 409 `profileConflict` when someone saved since `baseVersion` (0 for the club's before its first save) */
    saveProfile: (id: string, profile: ProfileInput, baseVersion: number, note?: string) =>
      send<{ profile: SystemProfile }>('PUT', `/api/book/profiles/${encodeURIComponent(id)}`, { profile, baseVersion, note }).then(
        (r) => r.profile,
      ),
    /** 403 `profileProtected` for the club's; 409 `profileInUse` while another profile inherits it */
    deleteProfile: (id: string, baseVersion: number) =>
      send<{ ok: true }>('DELETE', `/api/book/profiles/${encodeURIComponent(id)}`, { baseVersion }),
    profileRevisions: (id: string) =>
      request<{ revisions: ProfileRevision[] }>(`/api/book/profiles/${encodeURIComponent(id)}/revisions`).then((r) => r.revisions),
    profileRevision: (id: string, version: number) =>
      request<{ revision: ProfileRevision }>(`/api/book/profiles/${encodeURIComponent(id)}/revisions/${version}`).then(
        (r) => r.revision,
      ),
    /**
     * The library's articles (e5-t04). Anyone reads them; signed out, `members-only` ones are left
     * out (404 `articleGone` for one), and only editors get hidden ones. Publishing and hiding are a
     * reviewer's (409 `articleConflict` when someone published since `baseVersion`, 0 for a new one).
     */
    articles: () => request<ArticleList>('/api/book/articles'),
    article: (slug: string) => request<ArticleResponse>(`/api/book/articles/${slug}`),
    saveArticle: (slug: string, body: { article: unknown; baseVersion: number; note?: string }) =>
      send<{ entry: ArticleEntry }>('PUT', `/api/book/articles/${slug}`, body).then((r) => r.entry),
    hideArticle: (slug: string, baseVersion: number, note?: string) =>
      post<{ entry: ArticleEntry }>(`/api/book/articles/${slug}/hide`, { baseVersion, note }).then((r) => r.entry),
    articleRevisions: (slug: string) =>
      request<{ revisions: ArticleRevision[] }>(`/api/book/articles/${slug}/revisions`).then((r) => r.revisions),
    articleRevision: (slug: string, id: string) =>
      request<{ revision: ArticleRevision }>(`/api/book/articles/${slug}/revisions/${id}`).then((r) => r.revision),
    importTicket: () => post<{ ticket: string; url: string; ready: boolean }>('/api/book/import/ticket'),
    drafts: () => request<{ drafts: ImportDraftSummary[] }>('/api/book/drafts'),
    draft: (id: string) => request<{ draft: ImportDraft }>(`/api/book/drafts/${id}`),
    saveDraft: (fileName: string, result: unknown) =>
      post<{ draft: ImportDraftSummary }>('/api/book/drafts', { fileName, result }),
    deleteDraft: (id: string) => send<{ ok: true }>('DELETE', `/api/book/drafts/${id}`),
  },
}
