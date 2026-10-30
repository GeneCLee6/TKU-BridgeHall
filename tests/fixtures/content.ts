import type { Convention } from '../../src/types/convention.ts'
import { fixtureAlpha } from './conventions/fixture-alpha.ts'
import { fixtureBeta } from './conventions/fixture-beta.ts'
import { fixtureSystem } from './conventions/fixture-system.ts'

/**
 * The tests' built-in conventions: three made-up ones (tests/fixtures/conventions), NOT the club's.
 * The club's are in the private repository GeneCLee6/TKU-BridgeHall-content, checked out into
 * src/content-private/ when you have access (CONTENT_GUIDE.md §0); the tests that need them live
 * there and run as the Vitest project `content`. tests/setup.ts serves these as the Worker would.
 */
export const conventions: Convention[] = [fixtureAlpha, fixtureBeta, fixtureSystem]

export const conventionBySlug = (slug: string): Convention | undefined => conventions.find((c) => c.slug === slug)

export { categories } from '../../src/content/categories.ts'
export { references } from '../../src/content/references.ts'
