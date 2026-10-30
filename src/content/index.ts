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
import { systemOverview } from './conventions/system-overview.ts'
import { systemOneClub } from './conventions/system-one-club.ts'
import { systemOneDiamond } from './conventions/system-one-diamond.ts'
import { systemOneMajor } from './conventions/system-one-major.ts'
import { systemNotrump } from './conventions/system-notrump.ts'
import { systemStrongAndPreempts } from './conventions/system-strong-and-preempts.ts'
import { systemDoubles } from './conventions/system-doubles.ts'
import { systemCompetition } from './conventions/system-competition.ts'
import { systemConcepts } from './conventions/system-concepts.ts'
import { twoDiamondOpening } from './conventions/two-diamond-opening.ts'
import { twoNotrumpOpening } from './conventions/two-notrump-opening.ts'

/**
 * The registry: every built-in convention, in catalogue order. To add one: create
 * src/content/conventions/<slug>.ts exporting a Convention, import it here, add it to this list
 * and seed it into TKU BridgeTable's Worker with `npm run seed-builtin` (CONTENT_GUIDE.md §4).
 *
 * Only the tests and scripts import this module (seed-builtin, search-index, check-budget). The
 * site has no content of its own since L0 (2026-10-29): members read the built-in conventions from
 * the Worker, and `npm run budget` fails if any of their text is in dist (ARCHITECTURE.md §4).
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
  systemOverview,
  systemOneClub,
  systemOneDiamond,
  systemOneMajor,
  systemNotrump,
  systemStrongAndPreempts,
  systemDoubles,
  systemCompetition,
  systemConcepts,
]

export const conventionBySlug = (slug: string): Convention | undefined =>
  conventions.find((c) => c.slug === slug)

export { categories } from './categories.ts'
export { references } from './references.ts'
