/// <reference types="vitest/config" />
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

// Accounts and online content live in TKU BridgeTable's Worker. In production vercel.json
// forwards /api there; in development this proxy does the same, to a local BridgeTable
// (`npm run dev` in TKU-BridgeTable) unless TABLE_URL points elsewhere.
const tableUrl = process.env.TABLE_URL ?? 'http://localhost:5173'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), appVersion()],
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
