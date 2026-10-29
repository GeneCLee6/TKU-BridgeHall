import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

/**
 * The whole site is for signed-in members (2026-10-29), so every component test starts signed in
 * as a plain member: `/api/me` answers with one and any other request fails, as it did before the
 * sign-in gate (the pages fall back to the bundled content). A test that needs more, or a
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
