// The search index of the built-in conventions (ARCHITECTURE.md §4). It is not in the site any more
// (L0, e10-t20): scripts/seed-builtin.ts sends it to the Worker with the conventions, and the
// search box fetches it from GET /api/book/search-index, members only.
import { conventions } from '../src/content/index.ts'
import { buildSearchIndex } from '../src/lib/search.ts'

export const searchIndexJson = () => JSON.stringify(buildSearchIndex(conventions))
