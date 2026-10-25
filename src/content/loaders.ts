import type { Convention } from '../types/convention.ts'

/**
 * The bundled conventions' content, one chunk per file, downloaded when first needed. The file
 * name is the slug (checked by tests/content). The catalogue works from manifest.ts until then.
 */
const modules = import.meta.glob<Record<string, Convention>>('./conventions/*.ts')

export function loadBundled(slug: string): Promise<Convention | undefined> {
  const load = modules[`./conventions/${slug}.ts`]
  if (!load) return Promise.resolve(undefined)
  return load().then((m) => Object.values(m).find((c) => c.slug === slug))
}
