import type { Convention } from '../types/convention.ts'
import { bergenRaises } from './conventions/bergen-raises.ts'
import { defenseVsUnusual2nt } from './conventions/defense-vs-unusual-2nt.ts'
import { defensiveSignals } from './conventions/defensive-signals.ts'
import { jacoby2nt } from './conventions/jacoby-2nt.ts'
import { goodBad2nt } from './conventions/good-bad-2nt.ts'
import { lebensohl } from './conventions/lebensohl.ts'
import { majorSlamAsk2011 } from './conventions/major-slam-ask-2011.ts'
import { newMinorForcing } from './conventions/new-minor-forcing.ts'
import { notrumpResponses } from './conventions/notrump-responses.ts'
import { responsiveDouble } from './conventions/responsive-double.ts'
import { singleRaiseMajor } from './conventions/single-raise-major.ts'
import { twoDiamondOpening } from './conventions/two-diamond-opening.ts'
import { twoNotrumpOpening } from './conventions/two-notrump-opening.ts'

/**
 * The registry. To add a convention: create src/content/conventions/<slug>.ts exporting a
 * Convention, import it here and add it to this list (see CONTENT_GUIDE.md).
 */
export const conventions: Convention[] = [
  notrumpResponses,
  twoNotrumpOpening,
  lebensohl,
  singleRaiseMajor,
  newMinorForcing,
  jacoby2nt,
  majorSlamAsk2011,
  bergenRaises,
  twoDiamondOpening,
  defenseVsUnusual2nt,
  goodBad2nt,
  responsiveDouble,
  defensiveSignals,
]

export const conventionBySlug = (slug: string): Convention | undefined =>
  conventions.find((c) => c.slug === slug)

export { categories } from './categories.ts'
export { references } from './references.ts'
