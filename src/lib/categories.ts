import type { Category } from '../types/convention.ts'

/**
 * Which categories the catalogue shows (ARCHITECTURE.md §4.5): the list edited online when there
 * is one, otherwise the bundled one. A bundled category that is missing from the online list but
 * still has a convention in it (one added to the repo after the list was edited, say) is kept at
 * the end, so no convention ever drops out of the catalogue.
 */
export function resolveCategories(
  bundled: readonly Category[],
  online: readonly Category[] | undefined,
  conventions: readonly { category: string }[],
): Category[] {
  if (!online?.length) return [...bundled]
  const list = [...online].sort((a, b) => a.order - b.order)
  const known = new Set(list.map((c) => c.id))
  const used = new Set(conventions.map((c) => c.category))
  for (const c of bundled) if (!known.has(c.id) && used.has(c.id)) list.push({ ...c, order: list.length })
  return list
}

/**
 * The ids a convention may be in: the online list and the bundled one together, so a convention is
 * checked against the same categories `resolveCategories` can show
 */
export const knownCategoryIds = (bundled: readonly Category[], online: readonly Category[] | undefined) => [
  ...new Set([...(online ?? []), ...bundled].map((c) => c.id)),
]

/** How many conventions are in each category */
export function categoryUsage(conventions: readonly { category: string }[]): Map<string, number> {
  const usage = new Map<string, number>()
  for (const c of conventions) usage.set(c.category, (usage.get(c.category) ?? 0) + 1)
  return usage
}

/** An id for a category added online; categories keep it for good, whatever they are renamed to */
export const newCategoryId = (taken: readonly string[], now = Date.now()) => {
  let id = `c-${now.toString(36)}`
  for (let n = 2; taken.includes(id); n++) id = `c-${now.toString(36)}-${n}`
  return id
}
