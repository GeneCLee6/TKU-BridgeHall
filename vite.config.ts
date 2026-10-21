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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), appVersion()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
})
