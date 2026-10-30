import { existsSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

/**
 * The club's built-in conventions are not in this repository (2026-10-30): they are in the private
 * GeneCLee6/TKU-BridgeHall-content, checked out into src/content-private/ (CONTENT_GUIDE.md §0).
 * The tests on the real text (待確認 counts, the seed payload, the system spec snapshot…) live there
 * and run as the Vitest project `content` when it is checked out; here they are only reported.
 */
const checkedOut = existsSync('src/content-private/index.ts')

describe('the private content (src/content-private)', () => {
  test.skipIf(checkedOut)('is not checked out: the tests on the real conventions are skipped (CONTENT_GUIDE.md §0)', () => {
    expect(checkedOut).toBe(false)
  })
  test.runIf(checkedOut)('is checked out: the project `content` runs its tests', () => {
    expect(existsSync('src/content-private/conventions')).toBe(true)
  })
})
