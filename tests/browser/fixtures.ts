import { expect, type Page } from '@playwright/test'
import { builtinPayload } from '../../scripts/builtin-payload.ts'
import { conventions } from '../fixtures/content.ts'
import { conventionMeta } from '../../src/lib/sections.ts'
import { BUILTIN_BOARDS, type Post } from '../../src/lib/forum.ts'
import type { StyleName } from '../../src/styles/tokens.ts'
import type { DisplayPrefs } from '../../src/state/PreferencesContext.tsx'

/**
 * A fixed reader for the browser tests (e9-t12, e9-t13): a plain member (the whole site needs an
 * account, 2026-10-29) with no picture, nothing edited online, so the pages show the built-in
 * content, the same every time; the forum has the same few posts. The API is answered here as a
 * seeded Worker would (L0: the built-in conventions, their manifest and search index); no Worker
 * runs. `signedOut` gets the login page instead.
 */

const builtin = builtinPayload(conventions)
const manifest = { version: 0, entries: [], categories: [], builtin: builtin.conventions.map(conventionMeta) }

export const DESKTOP = { width: 1280, height: 800 }
export const PHONE = { width: 390, height: 844 }

export type Size = { width: number; height: number }

export const styles: readonly StyleName[] = ['general', 'chinese', 'soft', 'night', 'suits', 'plain']

/** A date for 「最近更新」 and anything else that reads the clock */
const NOW = new Date('2026-10-28T12:00:00+08:00')

/** The member every page is opened as; no avatar, so the header shows their initials */
const READER = { id: 'reader', username: 'reader', admin: false, permissions: [], profile: { displayName: '淡江社員' } }

/** Two members and a few posts, for the forum and the home page's 社團新聞 and 最新討論 (e11-t15, e11-t16) */
const MEMBERS = [
  { id: 'reader', username: 'reader', displayName: '淡江社員' },
  { id: 'bob', username: 'bob', displayName: '陳小柏' },
]
const post = (id: string, boardId: string, hoursAgo: number, extra: Partial<Post>): Post => ({
  id,
  boardId,
  authorId: 'bob',
  blocks: [],
  createdAt: NOW.getTime() - hoursAgo * 3_600_000,
  reactions: {},
  commentCount: 0,
  ...extra,
})
const POSTS: Post[] = [
  post('p3', 'deals', 2, {
    title: '今天社課這副 4♠ 怎麼做？',
    blocks: [
      { kind: 'paragraph', text: '西家首攻 ♥K，你會怎麼做？' },
      { kind: 'hand', cards: ['SK', 'ST', 'S9', 'S7', 'S6', 'HA', 'H6', 'H3', 'DA', 'D2', 'CT', 'C7', 'C3'], label: '南家' },
    ],
    reactions: { '👍': ['reader'] },
    commentCount: 2,
  }),
  post('p2', 'systems', 26, { blocks: [{ kind: 'paragraph', text: '1NT 開叫後 2♣ 問牌，對方賭倍怎麼辦？' }] }),
  post('p1', 'news', 50, { title: '大專盃報名開始', pinned: true, blocks: [{ kind: 'paragraph', text: '11/2 截止，請找幹部報名。' }] }),
]
const FORUM: Record<string, unknown> = {
  '/api/forum/boards': { boards: BUILTIN_BOARDS.map((b) => ({ ...b, pinnedPostIds: b.id === 'news' ? ['p1'] : [] })) },
  '/api/club/members': { members: MEMBERS },
  '/api/forum/latest': { news: POSTS.filter((p) => p.boardId === 'news'), discussions: POSTS.filter((p) => p.boardId !== 'news') },
  '/api/forum/feed': { posts: POSTS, page: 1, pages: 1 },
  // The forum's search page (e11-t18): whatever is asked, the posts with 1NT
  '/api/forum/search': { posts: POSTS.filter((p) => p.id === 'p2'), page: 1, pages: 1, query: '1NT', total: 1 },
}

async function serve(page: Page, signedOut: boolean) {
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/me' && !signedOut) return route.fulfill({ json: { user: READER } })
    const signedIn = !signedOut
    if (signedIn && path === '/api/book/manifest') return route.fulfill({ json: manifest })
    if (signedIn && path === '/api/book/search-index') return route.fulfill({ json: builtin.searchIndex })
    const slug = path.match(/^\/api\/book\/builtin\/([\w-]+)$/)?.[1]
    const convention = signedIn && builtin.conventions.find((c) => c.slug === slug)
    if (convention) return route.fulfill({ json: { convention } })
    if (path === '/api/book/categories') return route.fulfill({ json: { version: 0, categories: [] } })
    if (!signedOut && FORUM[path]) return route.fulfill({ json: FORUM[path] })
    return route.fulfill({ status: 401, json: { error: 'unauthorized' } })
  })
}

/** Opens a page with these display settings (stored as 個人設定 would store them) */
export async function open(page: Page, path: string, size: Size, prefs: Partial<DisplayPrefs> = {}, signedOut = false) {
  await page.setViewportSize(size)
  await page.emulateMedia({ colorScheme: prefs.theme === 'dark' ? 'dark' : 'light' })
  await page.clock.setFixedTime(NOW)
  await page.addInitScript((stored) => {
    window.localStorage.setItem('tku-bridgebook:prefs', JSON.stringify(stored))
  }, prefs)
  await serve(page, signedOut)
  await page.goto(path)
  await page.locator('main').first().waitFor()
  await page.waitForLoadState('networkidle')
  // Lazy pages show 「載入中…」 until their chunk is here; every page has one level-1 heading
  await expect(page.getByText('載入中…')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  if (signedOut) {
    await expect(page.getByRole('heading', { level: 1, name: '登入' })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    return
  }
  // The home page's blocks are lazy too
  if (path === '/' && prefs.layout !== 'cards') await expect(page.getByText('第一次來？從這裡開始')).toBeVisible()
  if (path === '/' && prefs.layout === 'cards') await expect(page.getByText(/^\d+ 個特約$/)).toBeVisible()
  // The handbook pages have the phone toolbar; 個人設定, 練習 and 學習路徑 do not
  if (path !== '/settings' && !path.startsWith('/practice') && !path.startsWith('/learn') && size.width < 900)
    await expect(page.getByRole('navigation', { name: '工具列' })).toBeVisible()
  // A convention page's 「在制度卡的位置」 lines are a lazy chunk (e3-t10)
  await expect(page.locator('[data-card-places-pending]')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
}
