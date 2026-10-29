// @vitest-environment node
import { describe, expect, it } from 'vitest'
import * as account from '../../src/lib/account.ts'
import * as api from '../../src/lib/api.ts'
import * as ebooks from '../../src/lib/ebooks.ts'
import * as forum from '../../src/lib/forum.ts'
import { conventions } from '../../src/content/index.ts'
import { generateQuizzes } from '../../src/lib/quiz.ts'
import { bankFile, exportQuizzes } from '../../src/lib/quizExport.ts'

/**
 * The constants src/lib/api.ts copies from TKU-BridgeTable shared/protocol.ts (e10-t09). Runs only
 * with TABLE_DIR set to a table checkout: `npm run parity` sets it, along with the type checks in
 * parity/table-types.ts. Without it (plain `npm test`) the suite is skipped.
 */
// An absolute path (the script resolves it); the tests have no Node types, hence the cast
const tableDir = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.TABLE_DIR

describe.skipIf(!tableDir)('constants shared with TKU-BridgeTable', () => {
  const protocol = () => import(/* @vite-ignore */ `${tableDir!.replaceAll('\\', '/')}/shared/protocol.ts`)

  it('has the same form limits', async () => {
    const { LIMITS } = await protocol()
    expect(api.LIMITS).toEqual({
      usernameMin: LIMITS.usernameMin,
      usernameMax: LIMITS.usernameMax,
      passwordMin: LIMITS.passwordMin,
      // The registration note; the table calls it applicationNoteMax
      noteMax: LIMITS.applicationNoteMax,
    })
  })

  it('knows only permissions the table has, and every book one', async () => {
    const { PERMISSIONS } = await protocol()
    expect(api.PERMISSIONS).toEqual((PERMISSIONS as string[]).filter((p) => p.startsWith('book')))
  })

  it('has the same system profile constants', async () => {
    const { CLUB_PROFILE_ID, PROFILE_SCOPES, PROFILE_LIMITS } = await protocol()
    expect(api.CLUB_PROFILE_ID).toBe(CLUB_PROFILE_ID)
    expect(api.PROFILE_SCOPES).toEqual(PROFILE_SCOPES)
    expect(api.PROFILE_LIMITS).toEqual(PROFILE_LIMITS)
  })

  it('has the same team and partnership constants', async () => {
    const { TEAM_LIMITS, PAIR_STATUSES } = await protocol()
    expect(api.TEAM_LIMITS).toEqual(TEAM_LIMITS)
    expect(api.PAIR_STATUSES).toEqual(PAIR_STATUSES)
  })
})

describe.skipIf(!tableDir)('profile, avatar and file constants shared with TKU-BridgeTable (E11)', () => {
  const shared = (name: string) => import(/* @vite-ignore */ `${tableDir!.replaceAll('\\', '/')}/shared/${name}.ts`)

  it('has the same profile levels and limits', async () => {
    const { PROFILE_LEVELS, PROFILE_LIMITS } = await shared('profile')
    expect(account.PROFILE_LEVELS).toEqual(PROFILE_LEVELS)
    expect(account.PROFILE_FIELD_LIMITS).toEqual(PROFILE_LIMITS)
  })

  it('has the same avatar size, limit and address', async () => {
    const { AVATAR_PIXELS, AVATAR_MAX_BYTES, avatarUrl } = await shared('avatar')
    expect(account.AVATAR_PIXELS).toBe(AVATAR_PIXELS)
    expect(account.AVATAR_MAX_BYTES).toBe(AVATAR_MAX_BYTES)
    expect(account.avatarUrl('u 1', 7)).toBe(avatarUrl('u 1', 7))
  })

  it('has the same file types and limits', async () => {
    const { FILE_TYPES, FILE_PURPOSES, FILE_LIMITS } = await shared('files')
    expect(account.FILE_TYPES).toEqual(FILE_TYPES)
    expect(['post', 'article']).toEqual(FILE_PURPOSES)
    expect(account.FILE_LIMITS).toEqual(FILE_LIMITS)
  })

  it('has the same file key pattern (e5-t12)', async () => {
    const { FILE_KEY } = await shared('files')
    expect(account.FILE_KEY.source).toBe(FILE_KEY.source)
  })

  it('has the same e-book key, licenses and limits (e5-t09, e5-t15)', async () => {
    const table = await shared('ebooks')
    for (const name of ['EBOOK_TYPE', 'EBOOK_LICENSES', 'EBOOK_LIMITS', 'STORAGE_LIMITS'] as const) expect(ebooks[name], name).toEqual(table[name])
    expect(ebooks.EBOOK_KEY.source).toBe(table.EBOOK_KEY.source)
  })

  it('has the same forum boards, blocks, reactions and limits (e11-t05)', async () => {
    const table = await shared('forum')
    for (const name of [
      'BOARD_POST_POLICIES',
      'BUILTIN_BOARDS',
      'NEWS_BOARD_ID',
      'POST_BLOCK_KINDS',
      'COMMENT_BLOCK_KINDS',
      'REACTION_EMOJIS',
      'REPORT_STATUSES',
      'FORUM_LIMITS',
    ] as const)
      expect(forum[name], name).toEqual(table[name])
  })
})

describe.skipIf(!tableDir)('files shared with TKU-BridgeTable', () => {
  it('has the same toSystemSpec as the table (e7-t02)', async () => {
    const local = (await import('../../src/lib/systemSpec.ts?raw')).default
    const table = (
      await import(/* @vite-ignore */ `${tableDir!.replaceAll('\\', '/')}/shared/systemSpec.ts?raw`)
    ).default as string
    // Line endings may differ between checkouts
    expect(local.replaceAll('\r\n', '\n')).toBe(table.replaceAll('\r\n', '\n'))
  })
})

describe.skipIf(!tableDir)('the question bank export in the table (e6-t08, AC-6.5)', () => {
  it('passes the table’s own checks of its bidding question bank', async () => {
    const { bankProblems } = await import(/* @vite-ignore */ `${tableDir!.replaceAll('\\', '/')}/eval/quiz.ts`)
    const { quizzes } = generateQuizzes(conventions, 'club')
    const { questions } = exportQuizzes(quizzes, new Map(conventions.map((c) => [c.slug, c.nameZh])))
    expect(questions.length).toBeGreaterThan(0)
    expect(bankProblems([bankFile(questions)])).toEqual([])
  })
})
