import { defineConfig } from '@playwright/test'

/**
 * Browser tests (e9-t12, e9-t13, AC-9.7): the real app on Vite's dev server, its API answered by
 * fixtures (tests/browser/fixtures.ts) as a signed-out reader with the bundled content.
 *
 * - tests/browser/visual.spec.ts: screenshots compared with the baselines in
 *   tests/browser/__screenshots__. Baselines are made on Linux in Playwright's container (the CI
 *   job `browser`): fonts differ by system, so screenshots taken elsewhere are only for looking at.
 * - tests/browser/a11y.spec.ts: axe on the new pages in every style, and keyboard walks. These do
 *   not depend on fonts and run anywhere.
 *
 * Updating the baselines after a change meant to look different:
 * - The failed CI job uploads a `browser` artifact with the diffs (test-results/) and a fresh set
 *   of baselines (tests/browser/__screenshots__/); check the diffs, copy the new baselines in and
 *   commit them: `gh run download <run id> -n browser -D tmp/browser` and copy
 *   tmp/browser/tests/browser/__screenshots__ over tests/browser/__screenshots__.
 * - Or, with Docker:
 *   docker run --rm -v "$PWD":/work -w /work mcr.microsoft.com/playwright:v1.64.0-noble \
 *     sh -c "npm ci && npx playwright test --update-snapshots"
 * - Locally without Docker, `PW_CHANNEL=msedge npm run test:browser` draws the screens with the
 *   installed Edge; `--update-snapshots` writes them, to look at only: do not commit those.
 */
const PORT = 4180

export default defineConfig({
  testDir: 'tests/browser',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled', caret: 'hide', scale: 'css' },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    browserName: 'chromium',
    // Locally, `PW_CHANNEL=msedge` uses the installed Edge instead of downloading Chromium
    channel: process.env.PW_CHANNEL || undefined,
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
