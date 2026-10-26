/**
 * Type parity with TKU-BridgeTable (e10-t09, CLAUDE.md rule 10). Not part of the normal build:
 * `npm run parity` (scripts/check-table-parity.mjs) type-checks this file with `@table/*` pointing
 * at a checkout of TKU-BridgeTable, and CI does the same against its main branch.
 *
 * Every type src/lib/api.ts mirrors from the Worker's shared/protocol.ts and worker/book.ts is
 * listed here, with one of two checks:
 * - `Same`: the two types are identical (requests, and the shapes both sides write).
 * - `Reads`: what the Worker sends can be read as the handbook's type, and the handbook names no
 *   field the Worker does not have. The handbook may type a field more loosely (`unknown`) or
 *   leave out fields it does not use.
 * The differences that are on purpose are spelled out next to their check. A new type in api.ts
 * that mirrors the Worker gets a line here.
 */

import type * as Book from '../src/lib/api.ts'
import type * as Handbook from '../src/types/convention.ts'
import type * as Protocol from '@table/shared/protocol.ts'
import type * as Worker from '@table/worker/book.ts'

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Assignable<From, To> = [From] extends [To] ? true : false
/** Every key the handbook names exists on the Worker's side */
type KnownKeys<B, T> = [Exclude<keyof B, keyof T>] extends [never] ? true : false
type Reads<B, T> = Assignable<T, B> extends true ? KnownKeys<B, T> : false
type Same<B, T> = Equal<B, T>
type Check<T extends true> = T

export type Checks = [
  // ── Accounts (shared/protocol.ts) ────────────────────────────────────────────────────────────
  // The handbook knows only its own two permissions; `boardCurate` is the table's (e4-t28)
  Check<Assignable<Book.Permission, Protocol.Permission>>,
  Check<Equal<Extract<Protocol.Permission, `book${string}`>, Book.Permission>>,
  // `Me` and `AdminUser` with the permissions set aside (checked above); the handbook leaves out
  // the table's robot and notification fields
  Check<Reads<Omit<Book.Me, 'permissions'>, Omit<Protocol.Me, 'permissions'>>>,
  Check<Same<Omit<Book.AdminUser, 'permissions'>, Omit<Protocol.AdminUser, 'permissions'>>>,
  Check<Same<Book.Application, Protocol.Application>>,
  Check<Same<Book.ClubSettings, Protocol.ClubSettings>>,
  Check<Same<Extract<Book.RegisterResult, { pending: true }>, Extract<Protocol.RegisterResult, { pending: true }>>>,

  // ── Online content (worker/book.ts) ──────────────────────────────────────────────────────────
  // `convention` is `unknown` in the handbook: lib/content.ts checks its shape before using it
  Check<Reads<Book.BookEntry, Worker.BookEntry>>,
  Check<Same<Omit<Book.BookEntry, 'convention'>, Omit<Worker.BookEntry, 'convention'>>>,
  Check<Reads<Book.BookEntrySummary, Worker.BookEntrySummary>>,
  Check<Reads<Handbook.ConventionMeta, Worker.ConventionMeta>>,
  Check<Reads<Handbook.SectionOutline, Worker.SectionOutline>>,
  Check<Same<Handbook.PendingNote, Worker.PendingNoteRef>>,
  Check<Same<Book.BookCategory, Worker.BookCategory>>,
  Check<Same<Book.BookCategories, Worker.BookCategories>>,
  // `categories` is optional in the handbook: a manifest cached before categories were data has none
  Check<Reads<Book.BookManifest, Worker.BookManifest>>,
  Check<Same<Omit<Book.BookManifest, 'categories'>, Omit<Worker.BookManifest, 'categories'>>>,
  Check<Reads<Book.BookRevision, Worker.BookRevision>>,
  Check<Same<Omit<Book.BookRevision, 'convention'>, Omit<Worker.BookRevision, 'convention'>>>,
  Check<Same<Book.ImportDraftSummary, Worker.ImportDraftSummary>>,
  Check<Same<Book.ImportDraft, Worker.ImportDraft>>,

  // ── System profiles (shared/protocol.ts) ─────────────────────────────────────────────────────
  // The one difference: the Worker keeps a replaced section as Record<string, unknown>, the
  // handbook types it as its Section (tests/lib/profileTypes.test.ts)
  Check<Same<Book.ProfileScope, Protocol.ProfileScope>>,
  Check<Same<Book.Adoption, Protocol.Adoption>>,
  Check<Same<Book.ProfileNote, Protocol.ProfileNote>>,
  Check<Same<Exclude<Book.ProfileOverride, { kind: 'section' }>, Exclude<Protocol.ProfileOverride, { kind: 'section' }>>>,
  Check<Same<keyof Extract<Book.ProfileOverride, { kind: 'section' }>, keyof Extract<Protocol.ProfileOverride, { kind: 'section' }>>>,
  Check<Same<Omit<Book.SystemProfile, 'overrides'>, Omit<Protocol.SystemProfile, 'overrides'>>>,
  Check<Same<Book.ProfileSummary, Protocol.ProfileSummary>>,
  Check<Same<Omit<Book.ProfileRevision, 'profile'>, Omit<Protocol.ProfileRevision, 'profile'>>>,
  Check<Same<Omit<Book.ProfileInput, 'overrides'>, Omit<Protocol.ProfileInput, 'overrides'>>>,
  Check<Same<Book.ProfileVisibility, Protocol.ProfileVisibility>>,
  Check<Same<Book.ProfileAccess, Protocol.ProfileAccess>>,
  Check<Same<typeof Book.PROFILE_VISIBILITIES, typeof Protocol.PROFILE_VISIBILITIES>>,
  Check<Same<typeof Book.CLUB_PROFILE_ID, typeof Protocol.CLUB_PROFILE_ID>>,
  Check<Same<typeof Book.PROFILE_SCOPES, typeof Protocol.PROFILE_SCOPES>>,
  Check<Same<typeof Book.PROFILE_LIMITS, typeof Protocol.PROFILE_LIMITS>>,

  // ── Teams and partnerships (shared/protocol.ts, E2) ──────────────────────────────────────────
  Check<Same<Book.ClubTeam, Protocol.ClubTeam>>,
  Check<Same<Book.PairStatus, Protocol.PairStatus>>,
  Check<Same<Book.Partnership, Protocol.Partnership>>,
  Check<Same<Book.TeamInput, Protocol.TeamInput>>,
  Check<Same<Book.TeamPatch, Protocol.TeamPatch>>,
  Check<Same<Book.PairInvite, Protocol.PairInvite>>,
  Check<Same<Book.ClubMember, Protocol.ClubMember>>,
  Check<Same<typeof Book.TEAM_LIMITS, typeof Protocol.TEAM_LIMITS>>,
  Check<Same<typeof Book.PAIR_STATUSES, typeof Protocol.PAIR_STATUSES>>,
]
