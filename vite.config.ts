/// <reference types="vitest/config" />
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { SEARCH_INDEX_FILE, searchIndexJson } from './scripts/search-index.ts'

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

// The search index is built from the bundled conventions: written into dist with the build, and
// served fresh from the current content by the dev server.
const searchIndex = (): Plugin => ({
  name: 'search-index',
  configureServer(server) {
    server.middlewares.use(`/${SEARCH_INDEX_FILE}`, (_req, res, next) => {
      server
        .ssrLoadModule('/scripts/search-index.ts')
        .then((m) => {
          res.setHeader('Content-Type', 'application/json')
          res.end((m as { searchIndexJson: () => string }).searchIndexJson())
        })
        .catch(next)
    })
  },
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: SEARCH_INDEX_FILE, source: searchIndexJson() })
  },
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
      const hash = createHash('sha256')
        .update(read('index.html'))
        .update(read(SEARCH_INDEX_FILE))
        .digest('hex')
        .slice(0, 12)
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
  plugins: [react(), appVersion(), searchIndex(), stampServiceWorker()],
  // dist/.vite/manifest.json maps chunks to source modules for scripts/check-budget.mjs
  build: { manifest: true },
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
