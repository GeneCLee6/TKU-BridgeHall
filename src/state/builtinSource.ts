import { api, ApiError } from '../lib/api.ts'
import type { Convention, ConventionMeta } from '../types/convention.ts'

/**
 * Where the built-in conventions come from (L0, e10-t20): the Worker, members only. The site no
 * longer ships them: the catalogue is the manifest's `builtin` and each convention's content is
 * `GET /api/book/builtin/:slug`. The component tests replace this module (tests/setup.ts) with the
 * conventions in src/content, as the Worker would serve them once seeded.
 */
export const builtinSource: {
  /** The catalogue until a manifest with `builtin` arrives (none: the site has nothing of its own) */
  fallback: ConventionMeta[]
  load: (slug: string) => Promise<Convention | undefined>
} = {
  fallback: [],
  // Gone since the manifest was fetched: missing, like an unknown slug; anything else is a failure to retry
  load: (slug) => api.book.builtin(slug).catch((e) => (e instanceof ApiError && e.status === 404 ? undefined : Promise.reject(e))),
}
