import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

/**
 * The built-in conventions come from the Worker (L0, e10-t20); here they come from src/content as
 * the Worker serves them once seeded, whatever a test does with `fetch`: the catalogue is the
 * manifest's `builtin` when a test's manifest has one, and these otherwise.
 */
vi.mock('../src/state/builtinSource.ts', async () => {
  const { conventions } = await import('../src/content/index.ts')
  const { conventionMeta } = await import('../src/lib/sections.ts')
  return {
    builtinSource: {
      fallback: conventions.map(conventionMeta),
      load: (slug: string) => Promise.resolve(conventions.find((c) => c.slug === slug)),
    },
  }
})

/**
 * The whole site is for signed-in members (2026-10-29), so every component test starts signed in
 * as a plain member: `/api/me` answers with one and any other request fails, as it did before the
 * sign-in gate (the pages show the built-in content, above, with nothing changed online). A test that needs more, or a
 * signed-out visitor, stubs `fetch` itself (see tests/presentation/accounts.test.tsx).
 */
export const READER = { id: 'reader', username: 'reader', admin: false, permissions: [] }

beforeEach(() => {
  // As if they had signed in on this device before, so the pages render at once (AuthContext)
  try {
    window.localStorage.setItem('tku-bridgebook:me', JSON.stringify(READER))
  } catch {
    // Tests in the node environment have no window
  }
  vi.stubGlobal('fetch', (input: RequestInfo | URL) =>
    String(input) === '/api/me'
      ? Promise.resolve(new Response(JSON.stringify({ user: READER }), { headers: { 'Content-Type': 'application/json' } }))
      : Promise.reject(new TypeError('No API in component tests')),
  )
})

// Shared setup for component tests: jest-dom matchers and DOM cleanup between cases.
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  try {
    window.localStorage.clear()
  } catch {
    // Storage can be unavailable; tests must not depend on it.
  }
})
