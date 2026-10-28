import { expect, test, type Page } from '@playwright/test'
import type { DisplayPrefs } from '../../src/state/PreferencesContext.tsx'
import { DESKTOP, open, PHONE, styles, type Size } from './fixtures.ts'

/**
 * Visual regression (e9-t12, AC-9.7): the four reading pages in 「一般」 on a computer and a phone,
 * light and dark; every other style on a convention page (light and dark) and the phone's home
 * page; the other three layouts; the phone toolbar's drawer and panel. Compared with the baselines
 * in __screenshots__ (playwright.config.ts says how to update them).
 *
 * On a computer, long pages are shot to a fixed height: the top of a page shows its layout, and a
 * whole book in one picture would fail on any wording change. On a phone only the screen is shot:
 * the bottom toolbar is fixed, and a full-page picture would draw it halfway down.
 */

const sizes = { desktop: DESKTOP, phone: PHONE } as const
const modes = ['light', 'dark'] as const

const pages = [
  { name: 'home', path: '/' },
  { name: 'convention', path: '/c/jacoby-2nt' },
  { name: 'book', path: '/book' },
  { name: 'settings', path: '/settings' },
]

/** At most this tall, so a long page is cut instead of growing with the content */
const MAX_HEIGHT = 1600

async function shot(page: Page, name: string) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  const { width } = page.viewportSize()!
  if (width < 900) return expect(page).toHaveScreenshot(`${name}.png`)
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: true,
    clip: height > MAX_HEIGHT ? { x: 0, y: 0, width, height: MAX_HEIGHT } : undefined,
  })
}

async function view(page: Page, path: string, size: Size, prefs: Partial<DisplayPrefs>) {
  await open(page, path, size, prefs)
}

for (const { name, path } of pages)
  for (const [sizeName, size] of Object.entries(sizes))
    for (const mode of modes)
      test(`一般 · ${name} · ${sizeName} · ${mode}`, async ({ page }) => {
        await view(page, path, size, { theme: mode })
        await shot(page, `general-${name}-${sizeName}-${mode}`)
      })

for (const style of styles.filter((s) => s !== 'general')) {
  for (const mode of modes)
    test(`${style} · convention · desktop · ${mode}`, async ({ page }) => {
      await view(page, '/c/jacoby-2nt', DESKTOP, { style, theme: mode })
      await shot(page, `${style}-convention-desktop-${mode}`)
    })

  test(`${style} · home · phone`, async ({ page }) => {
    await view(page, '/', PHONE, { style, theme: 'light' })
    await shot(page, `${style}-home-phone-light`)
  })
}

test('卡片總覽 · desktop', async ({ page }) => {
  await view(page, '/', DESKTOP, { layout: 'cards', theme: 'light' })
  await shot(page, 'layout-cards-desktop')
})

test('卡片總覽 · phone', async ({ page }) => {
  await view(page, '/', PHONE, { layout: 'cards', theme: 'light' })
  await shot(page, 'layout-cards-phone')
})

for (const layout of ['three', 'focus'] as const)
  test(`版面 ${layout} · convention · desktop`, async ({ page }) => {
    await view(page, '/c/jacoby-2nt', { width: 1000, height: 800 }, { layout, theme: 'light' })
    await shot(page, `layout-${layout}-convention`)
  })

test('手機工具列 · 目錄抽屜', async ({ page }) => {
  await view(page, '/c/jacoby-2nt', PHONE, { theme: 'light' })
  await page.getByRole('navigation', { name: '工具列' }).getByRole('button', { name: '目錄' }).click()
  await expect(page.locator('#catalogue')).toBeVisible()
  await expect(page).toHaveScreenshot('toolbar-catalogue-phone.png')
})

test('手機工具列 · 閱讀設定', async ({ page }) => {
  await view(page, '/c/jacoby-2nt', PHONE, { theme: 'light' })
  await page.getByRole('navigation', { name: '工具列' }).getByRole('button', { name: '閱讀設定' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page).toHaveScreenshot('toolbar-reading-phone.png')
})
