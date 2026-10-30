// The search index of the built-in conventions (ARCHITECTURE.md §4). It is not in the site any more
// (L0, e10-t20): scripts/seed-builtin.ts sends it to the Worker with the conventions, and the
// search box fetches it from GET /api/book/search-index, members only.
import { buildSearchIndex } from '../src/lib/search.ts'
import type { Convention } from '../src/types/convention.ts'

/** The index of these conventions as the Worker serves it (the tests pass the made-up ones or the club's) */
export const searchIndexJson = (conventions: Convention[]) => JSON.stringify(buildSearchIndex(conventions))
