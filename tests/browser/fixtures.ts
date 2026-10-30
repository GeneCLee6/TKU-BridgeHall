import { expect, type Page } from '@playwright/test'
import { builtinPayload } from '../../scripts/builtin-payload.ts'
import { conventionMeta } from '../../src/lib/sections.ts'
import type { StyleName } from '../../src/styles/tokens.ts'
import type { DisplayPrefs } from '../../src/state/PreferencesContext.tsx'

/**
 * A fixed reader for the browser tests (e9-t12, e9-t13): a plain member (the whole site needs an
 * account, 2026-10-29) with no picture, nothing edited online, so the pages show the built-in
 * content, the same every time. The API is answered here as a seeded Worker would (L0: the built-in
 * conventions, their manifest and search index); no Worker runs. `signedOut` gets the login page instead.
 */

const builtin = builtinPayload()
const manifest = { version: 0, entries: [], categories: [], builtin: builtin.conventions.map(conventionMeta) }

export const DESKTOP = { width: 1280, height: 800 }
export const PHONE = { width: 390, height: 844 }

export type Size = { width: number; height: number }

export const styles: readonly StyleName[] = ['general', 'chinese', 'soft', 'night', 'suits', 'plain']

/** A date for 「最近更新」 and anything else that reads the clock */
const NOW = new Date('2026-10-28T12:00:00+08:00')

/** The member every page is opened as; no avatar, so the header shows their initials */
const READER = { id: 'reader', username: 'reader', admin: false, permissions: [], profile: { displayName: '淡江社員' } }

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
