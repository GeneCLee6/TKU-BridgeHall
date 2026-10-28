import { expect, type Page } from '@playwright/test'
import type { StyleName } from '../../src/styles/tokens.ts'
import type { DisplayPrefs } from '../../src/state/PreferencesContext.tsx'

/**
 * A fixed reader for the browser tests (e9-t12, e9-t13): signed out, nothing edited online, so the
 * pages show the bundled content, the same every time. The API is answered here; no Worker runs.
 */

export const DESKTOP = { width: 1280, height: 800 }
export const PHONE = { width: 390, height: 844 }

export type Size = { width: number; height: number }

export const styles: readonly StyleName[] = ['general', 'chinese', 'soft', 'night', 'suits', 'plain']

/** A date for 「最近更新」 and anything else that reads the clock */
const NOW = new Date('2026-10-28T12:00:00+08:00')

async function serve(page: Page) {
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/book/manifest') return route.fulfill({ json: { version: 0, entries: [], categories: [] } })
    if (path === '/api/book/categories') return route.fulfill({ json: { version: 0, categories: [] } })
    return route.fulfill({ status: 401, json: { error: 'unauthorized' } })
  })
}

/** Opens a page with these display settings (stored as 個人設定 would store them) */
export async function open(page: Page, path: string, size: Size, prefs: Partial<DisplayPrefs> = {}) {
  await page.setViewportSize(size)
  await page.emulateMedia({ colorScheme: prefs.theme === 'dark' ? 'dark' : 'light' })
  await page.clock.setFixedTime(NOW)
  await page.addInitScript((stored) => {
    window.localStorage.setItem('tku-bridgebook:prefs', JSON.stringify(stored))
  }, prefs)
  await serve(page)
  await page.goto(path)
  await page.locator('main').first().waitFor()
  await page.waitForLoadState('networkidle')
  // Lazy pages show 「載入中…」 until their chunk is here; every page has one level-1 heading
  await expect(page.getByText('載入中…')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  // The home page's blocks are lazy too
  if (path === '/' && prefs.layout !== 'cards') await expect(page.getByText('第一次來？從這裡開始')).toBeVisible()
  if (path === '/' && prefs.layout === 'cards') await expect(page.getByText(/^\d+ 個特約$/)).toBeVisible()
  // The handbook pages have the phone toolbar; 個人設定 and 練習 do not
  if (path !== '/settings' && !path.startsWith('/practice') && size.width < 900)
    await expect(page.getByRole('navigation', { name: '工具列' })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
}
