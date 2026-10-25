// The search index (/search-index.json) from the bundled conventions (ARCHITECTURE.md §5).
// vite.config.ts writes it into dist at build time and serves it in development, so it is never
// out of date and never committed.
import { conventions } from '../src/content/index.ts'
import { buildSearchIndex } from '../src/lib/search.ts'

export const SEARCH_INDEX_FILE = 'search-index.json'

export const searchIndexJson = () => JSON.stringify(buildSearchIndex(conventions))
