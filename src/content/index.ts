import type { Convention } from '../types/convention.ts'
import { bergenRaises } from './conventions/bergen-raises.ts'
import { defenseVsUnusual2nt } from './conventions/defense-vs-unusual-2nt.ts'
import { defensiveSignals } from './conventions/defensive-signals.ts'
import { jacoby2nt } from './conventions/jacoby-2nt.ts'
import { lebensohl } from './conventions/lebensohl.ts'
import { notrumpResponses } from './conventions/notrump-responses.ts'
import { singleRaiseMajor } from './conventions/single-raise-major.ts'
import { twoDiamondOpening } from './conventions/two-diamond-opening.ts'

/**
 * The registry. To add a convention: create src/content/conventions/<slug>.ts exporting a
 * Convention, import it here and add it to this list (see CONTENT_GUIDE.md).
 */
export const conventions: Convention[] = [
  notrumpResponses,
  lebensohl,
  singleRaiseMajor,
  jacoby2nt,
  bergenRaises,
  twoDiamondOpening,
  defenseVsUnusual2nt,
  defensiveSignals,
]

export const conventionBySlug = (slug: string): Convention | undefined =>
  conventions.find((c) => c.slug === slug)

export { categories } from './categories.ts'
