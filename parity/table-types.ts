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
import type * as Sync from '../src/lib/tableSync.ts'
import type * as Account from '../src/lib/account.ts'
import type * as TableProfile from '@table/shared/profile.ts'
import type * as TableAvatar from '@table/shared/avatar.ts'
import type * as TableFiles from '@table/shared/files.ts'
import type * as Ebooks from '../src/lib/ebooks.ts'
import type * as TableEbooks from '@table/shared/ebooks.ts'
import type * as Forum from '../src/lib/forum.ts'
import type * as TableForum from '@table/shared/forum.ts'
import type * as Handbook from '../src/types/convention.ts'
import type * as Protocol from '@table/shared/protocol.ts'
import type * as Worker from '@table/worker/book.ts'
import type * as Audit from '@table/worker/audit.ts'
import type * as TablePending from '@table/worker/pending.ts'
import type * as TableGlossary from '@table/worker/glossary.ts'
import type * as Glossary from '../src/types/glossary.ts'
import type * as TableArticles from '@table/worker/articles.ts'
import type * as Articles from '../src/lib/articles.ts'
import type * as Library from '../src/types/article.ts'
import type * as Series from '../src/lib/series.ts'
import type * as QuizRecords from '../src/lib/quizRecords.ts'
import type * as TableQuiz from '@table/shared/quiz.ts'
import type * as Learning from '../src/lib/learning.ts'
import type * as TableLearning from '@table/shared/learning.ts'

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
  // The glossary (e4-t05, e4-t07)
  Check<Same<Glossary.Term, TableGlossary.GlossaryTerm>>,
  Check<Same<Book.BookGlossary, TableGlossary.BookGlossary>>,
  // `categories` is optional in the handbook: a manifest cached before categories were data has none
  Check<Reads<Book.BookManifest, Worker.BookManifest>>,
  Check<Same<Omit<Book.BookManifest, 'categories'>, Omit<Worker.BookManifest, 'categories'>>>,
  Check<Reads<Book.BookRevision, Worker.BookRevision>>,
  Check<Same<Omit<Book.BookRevision, 'convention'>, Omit<Worker.BookRevision, 'convention'>>>,
  Check<Same<Book.ImportDraftSummary, Worker.ImportDraftSummary>>,
  Check<Same<Book.ImportDraft, Worker.ImportDraft>>,
  // Review (e8-t01, e8-t02) and the audit log (e8-t09)
  Check<Same<Book.BookEntryStatus, Worker.BookEntryStatus>>,
  Check<Reads<Book.BookDraft, Worker.BookDraft>>,
  Check<Same<Omit<Book.BookDraft, 'convention'>, Omit<Worker.BookDraft, 'convention'>>>,
  Check<Same<Book.BookDraftSummary, Worker.BookDraftSummary>>,
  Check<Same<Book.AuditAction, Audit.AuditAction>>,
  Check<Same<Book.AuditEntry, Audit.AuditEntry>>,
  // The 待確認 panel (e8-t06)
  Check<Same<Book.PendingStatus, TablePending.PendingStatus>>,
  Check<Same<Book.PendingMeta, TablePending.PendingMeta>>,
  // The library's articles (e5-t01, e5-t04); `article` is `unknown` here: lib/articles.ts checks it
  Check<Same<Library.License, TableArticles.ArticleLicense>>,
  Check<Same<Library.ArticleMeta, TableArticles.ArticleMeta>>,
  Check<Reads<Book.ArticleEntry, TableArticles.ArticleEntry>>,
  Check<Same<Omit<Book.ArticleEntry, 'article'>, Omit<TableArticles.ArticleEntry, 'article'>>>,
  Check<Same<Book.ArticleEntrySummary, TableArticles.ArticleEntrySummary>>,
  Check<Same<Book.ArticleFiles, TableArticles.ArticleList['files']>>,
  Check<Same<Book.ArticleList, TableArticles.ArticleList>>,
  Check<Reads<Book.ArticleResponse, TableArticles.ArticleResponse>>,
  Check<Reads<Book.ArticleRevision, TableArticles.ArticleRevision>>,
  Check<Same<Omit<Book.ArticleRevision, 'article'>, Omit<TableArticles.ArticleRevision, 'article'>>>,
  Check<Same<typeof Articles.ARTICLE_TITLE_MAX, typeof TableArticles.ARTICLE_LIMITS.titleMax>>,
  // The library's series (e5-t06)
  Check<Same<Library.ArticleSeries, TableArticles.ArticleSeries>>,
  Check<Same<Book.ArticleSeriesList, TableArticles.ArticleSeriesList>>,
  Check<Same<typeof Series.SERIES_LIMITS, typeof TableArticles.SERIES_LIMITS>>,

  // ── Practice results and question fixes (shared/quiz.ts, E6 e6-t04 e6-t06) ───────────────────
  Check<Same<typeof QuizRecords.QUIZ_LIMITS, typeof TableQuiz.QUIZ_LIMITS>>,
  Check<Same<QuizRecords.QuizAnswer, TableQuiz.QuizAnswer>>,
  Check<Same<QuizRecords.QuizRoundInput, TableQuiz.QuizRoundInput>>,
  Check<Same<QuizRecords.QuizRound, TableQuiz.QuizRound>>,
  Check<Same<QuizRecords.QuizBasis, TableQuiz.QuizBasis>>,
  Check<Same<QuizRecords.QuizHand, TableQuiz.QuizHand>>,
  Check<Same<QuizRecords.QuizAuction, TableQuiz.QuizAuction>>,
  Check<Same<QuizRecords.ManualQuiz, TableQuiz.ManualQuiz>>,
  Check<Same<QuizRecords.QuizFixInput, TableQuiz.QuizFixInput>>,
  Check<Same<QuizRecords.QuizFix, TableQuiz.QuizFix>>,

  // ── 學習路徑 (shared/learning.ts, e4-t08 e4-t11) ─────────────────────────────────────────────
  Check<Same<typeof Learning.LEARNING_LIMITS, typeof TableLearning.LEARNING_LIMITS>>,
  Check<Same<Learning.LessonReading, TableLearning.LessonReading>>,
  Check<Same<Learning.Lesson, TableLearning.Lesson>>,
  Check<Same<Learning.LearningPath, TableLearning.LearningPath>>,
  Check<Same<Learning.SavedLearningPath, TableLearning.SavedLearningPath>>,
  Check<Same<Learning.PathProgress, TableLearning.PathProgress>>,
  Check<Same<Learning.PathProgressInput, TableLearning.PathProgressInput>>,

  // ── System profiles (shared/protocol.ts) ─────────────────────────────────────────────────────
  // The one difference: the Worker keeps a replaced section as Record<string, unknown>, the
  // handbook types it as its Section (tests/lib/profileTypes.test.ts)
  Check<Same<Book.ProfileScope, Protocol.ProfileScope>>,
  Check<Same<Book.Adoption, Protocol.Adoption>>,
  Check<Same<Book.ProfileNote, Protocol.ProfileNote>>,
  Check<Same<Book.ProfileCardEdit, Protocol.ProfileCardEdit>>,
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
  // Convention card versions (e3-t09)
  Check<Same<Book.CardSnapshotMeta, Protocol.CardSnapshotMeta>>,
  Check<Same<Book.CardSnapshot, Protocol.CardSnapshot>>,
  Check<Same<Book.CardSnapshotInput, Protocol.CardSnapshotInput>>,
  Check<Same<typeof Book.CARD_SNAPSHOT_LIMITS, typeof Protocol.CARD_SNAPSHOT_LIMITS>>,

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

  // ── The handbook → TKB (shared/protocol.ts, E7 e7-t03 e7-t04) ────────────────────────────────
  // The constant is in lib/tableSync.ts, which only the report page loads
  Check<Same<Book.SyncedSystemSpec, Protocol.SyncedSystemSpec>>,
  Check<Same<Book.SystemSpecStatus, Protocol.SystemSpecStatus>>,
  Check<Same<Book.SystemSpecInput, Protocol.SystemSpecInput>>,
  Check<Same<Book.RobotMeaningsQuery, Protocol.RobotMeaningsQuery>>,
  Check<Same<Book.RobotShows, Protocol.RobotShows>>,
  Check<Same<Book.RobotMeaningsItem, Protocol.RobotMeaningsItem>>,
  Check<Same<Book.RobotMeanings, Protocol.RobotMeanings>>,
  Check<Same<typeof Sync.SYSTEM_SPEC_LIMITS, typeof Protocol.SYSTEM_SPEC_LIMITS>>,

  // ── Profiles, avatars and files (shared/profile.ts, avatar.ts, files.ts; E11) ──────────────────
  Check<Same<Account.Profile, TableProfile.Profile>>,
  Check<Same<Account.ProfileLevel, TableProfile.ProfileLevel>>,
  Check<Same<typeof Account.PROFILE_FIELD_LIMITS, typeof TableProfile.PROFILE_LIMITS>>,
  Check<Same<typeof Account.AVATAR_PIXELS, typeof TableAvatar.AVATAR_PIXELS>>,
  Check<Same<Account.FileType, TableFiles.FileType>>,
  Check<Same<Account.FilePurpose, TableFiles.FilePurpose>>,
  Check<Same<typeof Account.FILE_LIMITS, typeof TableFiles.FILE_LIMITS>>,
  Check<Same<Account.FileTicketRequest, TableFiles.FileTicketRequest>>,
  Check<Same<Account.FileTicket, TableFiles.FileTicket>>,
  Check<Same<Account.UploadedFile, TableFiles.UploadedFile>>,
  Check<Same<Account.FileUrls, TableFiles.FileUrls>>,
  // E-books (shared/ebooks.ts, E5 e5-t09 e5-t11 e5-t15): a copy, so every type is the same
  Check<Same<Ebooks.EbookLicense, TableEbooks.EbookLicense>>,
  Check<Same<typeof Ebooks.EBOOK_LIMITS, typeof TableEbooks.EBOOK_LIMITS>>,
  Check<Same<typeof Ebooks.STORAGE_LIMITS, typeof TableEbooks.STORAGE_LIMITS>>,
  Check<Same<Ebooks.FileUsage, TableEbooks.FileUsage>>,
  Check<Same<Ebooks.EbookTicketRequest, TableEbooks.EbookTicketRequest>>,
  Check<Same<Ebooks.EbookInput, TableEbooks.EbookInput>>,
  Check<Same<Ebooks.Ebook, TableEbooks.Ebook>>,
  Check<Same<Ebooks.EbookFiles, TableEbooks.EbookFiles>>,
  Check<Same<Ebooks.EbookList, TableEbooks.EbookList>>,
  Check<Same<Ebooks.EbookResponse, TableEbooks.EbookResponse>>,
  // The handbook leaves out `recent` (the member's latest boards)
  Check<Reads<Account.MemberProfile, TableProfile.MemberProfile>>,
  Check<Same<Account.MemberProfile, Omit<TableProfile.MemberProfile, 'recent'>>>,
  Check<Same<Account.MemberTeams, Protocol.MemberTeams>>,

  // ── The forum (shared/forum.ts, E11 e11-t05): a copy, so every type is the same ─────────────
  Check<Same<Forum.BoardPostPolicy, TableForum.BoardPostPolicy>>,
  Check<Same<typeof Forum.BOARD_POST_POLICIES, typeof TableForum.BOARD_POST_POLICIES>>,
  Check<Same<Forum.Board, TableForum.Board>>,
  Check<Same<typeof Forum.BUILTIN_BOARDS, typeof TableForum.BUILTIN_BOARDS>>,
  Check<Same<typeof Forum.NEWS_BOARD_ID, typeof TableForum.NEWS_BOARD_ID>>,
  Check<Same<Forum.ForumDeal, TableForum.ForumDeal>>,
  Check<Same<Forum.ForumAuctionCall, TableForum.ForumAuctionCall>>,
  Check<Same<Forum.ForumAuction, TableForum.ForumAuction>>,
  Check<Same<Forum.ForumRuleItem, TableForum.ForumRuleItem>>,
  Check<Same<Forum.PostBlock, TableForum.PostBlock>>,
  Check<Same<typeof Forum.POST_BLOCK_KINDS, typeof TableForum.POST_BLOCK_KINDS>>,
  Check<Same<Forum.CommentBlock, TableForum.CommentBlock>>,
  Check<Same<typeof Forum.COMMENT_BLOCK_KINDS, typeof TableForum.COMMENT_BLOCK_KINDS>>,
  Check<Same<typeof Forum.REACTION_EMOJIS, typeof TableForum.REACTION_EMOJIS>>,
  Check<Same<Forum.Reactions, TableForum.Reactions>>,
  Check<Same<Forum.Reaction, TableForum.Reaction>>,
  Check<Same<Forum.Post, TableForum.Post>>,
  Check<Same<Forum.Comment, TableForum.Comment>>,
  Check<Same<typeof Forum.REPORT_STATUSES, typeof TableForum.REPORT_STATUSES>>,
  Check<Same<Forum.Report, TableForum.Report>>,
  Check<Same<typeof Forum.FORUM_LIMITS, typeof TableForum.FORUM_LIMITS>>,
  // Requests and answers of worker/forum.ts (e11-t06, e11-t07)
  Check<Same<Forum.BoardInput, TableForum.BoardInput>>,
  Check<Same<Forum.PostInput, TableForum.PostInput>>,
  Check<Same<Forum.CommentInput, TableForum.CommentInput>>,
  Check<Same<Forum.BoardPage, TableForum.BoardPage>>,
  Check<Same<Forum.PostThread, TableForum.PostThread>>,
  Check<Same<Forum.ForumLatest, TableForum.ForumLatest>>,
]
