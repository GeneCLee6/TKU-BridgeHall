import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { DESKTOP, open, PHONE, styles } from './fixtures.ts'

/**
 * Accessibility regression (e9-t13, AC-9.7). axe (WCAG 2.1 A and AA, colour contrast included) on
 * the new pages: home, a convention page, the whole book, 個人設定, 卡片總覽 and the phone toolbar
 * with its drawer and panel open; the convention page and the home page in each of the six styles,
 * light and dark, as the contrast check on real pages (tests/styles/tokens.test.ts checks the
 * token pairs). Then keyboard walks through the header, 閱讀設定 and the toolbar.
 */

async function audit(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const summary = violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    nodes: v.nodes.slice(0, 5).map((n) => `${n.target.join(' ')}: ${n.failureSummary?.split('\n')[1]?.trim() ?? ''}`),
  }))
  expect(summary).toEqual([])
}

const pages = [
  { name: 'home', path: '/' },
  { name: 'convention', path: '/c/jacoby-2nt' },
  { name: 'book', path: '/book' },
  { name: 'settings', path: '/settings' },
]

test.describe('axe', () => {
  for (const { name, path } of pages)
    for (const [sizeName, size] of [
      ['desktop', DESKTOP],
      ['phone', PHONE],
    ] as const)
      test(`${name} · ${sizeName}`, async ({ page }) => {
        await open(page, path, size, { theme: 'light' })
        await audit(page)
      })

  for (const style of styles)
    for (const theme of ['light', 'dark'] as const) {
      test(`${style} · ${theme} · convention`, async ({ page }) => {
        await open(page, '/c/jacoby-2nt', DESKTOP, { style, theme })
        await audit(page)
      })
      test(`${style} · ${theme} · home`, async ({ page }) => {
        await open(page, '/', DESKTOP, { style, theme })
        await audit(page)
      })
    }

  test('卡片總覽 with a preview open', async ({ page }) => {
    await open(page, '/', DESKTOP, { layout: 'cards', theme: 'light' })
    await audit(page)
    await page.getByRole('button', { name: /^1NT的答叫/ }).first().click()
    await audit(page)
  })

  test('卡片總覽 · phone, dark', async ({ page }) => {
    await open(page, '/', PHONE, { layout: 'cards', theme: 'dark' })
    await audit(page)
  })

  test('phone toolbar: the catalogue drawer and 閱讀設定', async ({ page }) => {
    await open(page, '/c/jacoby-2nt', PHONE, { theme: 'light' })
    const toolbar = page.getByRole('navigation', { name: '工具列' })
    await toolbar.getByRole('button', { name: '目錄' }).click()
    await expect(page.locator('#catalogue')).toBeVisible()
    await audit(page)
    await toolbar.getByRole('button', { name: '目錄' }).click()
    await toolbar.getByRole('button', { name: '閱讀設定' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await audit(page)
  })
})

test.describe('keyboard', () => {
  test('the first Tab reaches 「跳到主要內容」, which moves the focus to the page', async ({ page }) => {
    await open(page, '/', DESKTOP, { theme: 'light' })
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: '跳到主要內容' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#/)
  })

  test('閱讀設定 opens with the keyboard, Esc closes it and the focus goes back', async ({ page }) => {
    await open(page, '/c/jacoby-2nt', DESKTOP, { theme: 'light' })
    const button = page.getByRole('button', { name: '閱讀設定' }).first()
    await button.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(button).toBeFocused()
  })

  test('every control on the convention page is reachable by Tab and shows its focus', async ({ page }) => {
    await open(page, '/c/jacoby-2nt', DESKTOP, { theme: 'light' })
    const seen = new Set<string>()
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        if (!el || el === document.body) return null
        const style = getComputedStyle(el)
        const ring = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
        return { key: `${el.tagName}:${el.textContent?.slice(0, 30)}:${el.getAttribute('aria-label') ?? ''}`, ring, shadow: style.boxShadow }
      })
      expect(focused).not.toBeNull()
      expect(focused!.ring || focused!.shadow !== 'none', `${focused!.key} shows no focus`).toBe(true)
      seen.add(focused!.key)
    }
    // The header, the catalogue and the page's own controls: many distinct stops, no trap
    expect(seen.size).toBeGreaterThan(30)
  })

  test('the phone toolbar works from the keyboard', async ({ page }) => {
    await open(page, '/c/jacoby-2nt', PHONE, { theme: 'light' })
    const catalogue = page.getByRole('navigation', { name: '工具列' }).getByRole('button', { name: '目錄' })
    await catalogue.focus()
    await page.keyboard.press('Enter')
    await expect(catalogue).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('#catalogue')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(catalogue).toHaveAttribute('aria-expanded', 'false')
    await expect(catalogue).toBeFocused()
  })
})
