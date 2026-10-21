import type { Convention } from '../types/convention.ts'
import { defenseVsUnusual2nt } from './conventions/defense-vs-unusual-2nt.ts'
import { lebensohl } from './conventions/lebensohl.ts'

/**
 * The registry. To add a convention: create src/content/conventions/<slug>.ts exporting a
 * Convention, import it here and add it to this list (see CONTENT_GUIDE.md).
 */
export const conventions: Convention[] = [lebensohl, defenseVsUnusual2nt]

export const conventionBySlug = (slug: string): Convention | undefined =>
  conventions.find((c) => c.slug === slug)

export { categories } from './categories.ts'
