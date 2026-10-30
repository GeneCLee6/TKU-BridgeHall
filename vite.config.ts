/// <reference types="vitest/config" />
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Stamps the deployed commit into index.html so the post-deploy smoke test can confirm
// production is serving the commit it was triggered for. Vercel provides VERCEL_GIT_COMMIT_SHA.
const appVersion = (): Plugin => ({
  name: 'app-version',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { name: 'app-version', content: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local' },
      injectTo: 'head',
    },
  ],
})

// public/sw.js is copied as it is; stamping a hash of the build into it makes every build a new
// service worker, which is what lets an open page notice a new version (src/lib/pwa.ts).
const stampServiceWorker = (): Plugin => {
  let outDir = 'dist'
  return {
    name: 'stamp-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const read = (file: string) => readFileSync(join(outDir, file), 'utf8')
      const hash = createHash('sha256').update(read('index.html')).digest('hex').slice(0, 12)
      const sw = join(outDir, 'sw.js')
      writeFileSync(sw, read('sw.js').replace('__BUILD__', hash))
    },
  }
}

// Accounts and online content live in TKU BridgeTable's Worker. In production vercel.json
// forwards /api there; in development this proxy does the same, to a local BridgeTable
// (`npm run dev` in TKU-BridgeTable) unless TABLE_URL points elsewhere.
const tableUrl = process.env.TABLE_URL ?? 'http://localhost:5173'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), appVersion(), stampServiceWorker()],
  // dist/.vite/manifest.json maps chunks to source modules for scripts/check-budget.mjs
  build: {
    manifest: true,
    // Everything the first page loads goes in one chunk. Left to itself the bundler cuts it into a
    // dozen pieces by which lazy page shares which module, and each piece costs its own request and
    // compresses worse; the home page has a JS budget (scripts/check-budget.mjs).
    rolldownOptions: {
      output: { codeSplitting: { groups: [{ name: 'app', tags: ['$initial'] }] } },
    },
  },
  server: {
    // 5173 is TKU BridgeTable's dev server
    port: 5174,
    proxy: { '/api': { target: tableUrl, changeOrigin: true } },
  },
  preview: { proxy: { '/api': { target: tableUrl, changeOrigin: true } } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // 'Expand all' renders every convention at once, which is slow in jsdom as the handbook grows
    testTimeout: 15_000,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
})
