// What scripts/seed-builtin.ts sends to the Worker, and how it checks what the Worker serves back
// (L0, e10-t20). Kept apart from the script so the tests can check both (tests/content/builtin.test.ts
// on the made-up conventions; the private repository's tests on the club's). It takes the list: the
// club's conventions are not in this repository (scripts/content-source.ts).
import { buildSearchIndex, type SearchIndex } from '../src/lib/search.ts'
import type { Convention } from '../src/types/convention.ts'

export interface BuiltinPayload {
  /** In catalogue order: src/content-private/index.ts's */
  conventions: Convention[]
  searchIndex: SearchIndex
}

export const builtinPayload = (list: Convention[]): BuiltinPayload => ({
  conventions: list,
  searchIndex: buildSearchIndex(list),
})

/**
 * Where what the Worker serves differs from `list` (the source): `served` is the text of
 * GET /api/book/builtin (the list), `index` of GET /api/book/search-index. Each convention is
 * compared as JSON text, so a changed character, a field gone or added, or another order of
 * fields all show. An empty list means byte-identical.
 */
export function compareBuiltin(served: string, index: string, list: Convention[]): string[] {
  const problems: string[] = []
  const got = JSON.parse(served) as unknown[]
  const want = builtinPayload(list)
  const gotSlugs = got.map((c) => (c as Convention | null)?.slug)
  const wantSlugs = want.conventions.map((c) => c.slug)
  if (gotSlugs.join() !== wantSlugs.join()) problems.push(`order or set differs: served [${gotSlugs.join(', ')}], source [${wantSlugs.join(', ')}]`)
  for (const convention of want.conventions) {
    const match = got.find((c) => (c as Convention | null)?.slug === convention.slug)
    if (!match) problems.push(`${convention.slug}: not served`)
    else if (JSON.stringify(match) !== JSON.stringify(convention)) problems.push(`${convention.slug}: content differs`)
  }
  if (index !== JSON.stringify(want.searchIndex)) problems.push('search index differs')
  return problems
}
