/**
 * 與母制度集比較 (E1 e1-t15, AC-1.7): what a system profile changes relative to its parent. Pure
 * functions, no storage and no React; the compare page (pages/ProfileComparePage.tsx) shows the
 * result.
 *
 * - The parent is the profile above this one in its chain (lib/profiles.ts `profileChain`), with
 *   its own chain resolved; for the club it is the handbook itself. "Before" is always the text as
 *   the resolved parent shows it, "after" the text once this profile's overrides are applied too.
 * - Only this profile's own changes are listed; what the layers above changed is on their own
 *   compare pages.
 * - Overrides on a convention that ends up not played are listed as well (they wait unused), so
 *   both sides are worked out with every adoption ignored.
 * - Nothing is dropped silently: an override that points at nothing is left out of the changes and
 *   comes back in `problems`, with every other problem of this profile and of its chain.
 */

import type { ProfileOverride, SystemProfile } from './api.ts'
import {
  profileChain,
  resolveProfile,
  type ProfileProblem,
  type ResolvedConvention,
  type ResolvedRow,
  type ResolvedSection,
} from './profiles.ts'
import type { Auction, Convention } from '../types/convention.ts'

type RowOverride = Extract<ProfileOverride, { kind: 'row' }>
type SectionOverride = Extract<ProfileOverride, { kind: 'section' }>
type MetaOverride = Extract<ProfileOverride, { kind: 'meta' }>

export interface RowChange {
  kind: 'row'
  override: RowOverride
  /** Section titles from the top level down to the row's section, as the profile shows them */
  trail: string[]
  /** The auction diagram and caption above the row's table, when it has them */
  auction?: Auction
  caption?: string
  /** The parent's row; undefined when this profile also replaced the section the row is in */
  before?: ResolvedRow
  after: ResolvedRow
}

export interface SectionChange {
  kind: 'section'
  override: SectionOverride
  /** Section titles from the top level down to the section's parent */
  trail: string[]
  /** The parent's section; undefined when it does not exist in the parent */
  before?: ResolvedSection
  after: ResolvedSection
}

export interface MetaChange {
  kind: 'meta'
  override: MetaOverride
  before: { summary: string; tags: string[] }
  after: { summary: string; tags: string[] }
}

export type Change = RowChange | SectionChange | MetaChange

/** One convention's changes, meta first, then sections and rows in the profile's order */
export interface ConventionChanges {
  slug: string
  name: string
  /** Whether this profile plays the convention; when not, its overrides wait unused */
  played: boolean
  changes: Change[]
}

export interface AdoptionChange {
  slug: string
  name: string
  value: 'on' | 'off'
  /** Whether the parent plays it */
  parentPlays: boolean
}

export interface ProfileComparison {
  profile: SystemProfile
  /** The profile above; undefined for the club, whose parent is the handbook */
  parent?: SystemProfile
  /** The conventions this profile turns off or on, in the content's order */
  adoptions: AdoptionChange[]
  /** Grouped by convention, in the content's order */
  conventions: ConventionChanges[]
  problems: ProfileProblem[]
}

const STEP: Record<ProfileOverride['kind'], number> = { meta: 0, section: 1, row: 2 }

/** The section and its ancestors, root first; empty when there is no such section */
function sectionPath(sections: readonly ResolvedSection[], id: string): ResolvedSection[] {
  for (const section of sections) {
    if (section.id === id) return [section]
    const below = section.children ? sectionPath(section.children, id) : []
    if (below.length) return [section, ...below]
  }
  return []
}

const findSection = (convention: ResolvedConvention | undefined, id: string) =>
  convention ? sectionPath(convention.sections, id).at(-1) : undefined

function rowAt(section: ResolvedSection | undefined, override: RowOverride) {
  const block = section?.blocks?.[override.blockIndex]
  if (block?.kind !== 'responses') return undefined
  const row = block.rows[override.rowIndex]
  return row && { block, row }
}

/** Every profile as it is, but playing every convention */
const playingAll = (profiles: readonly SystemProfile[]) => profiles.map((p) => ({ ...p, adopted: {} }))

/**
 * What profile `id` changes relative to its parent, given every profile the reader may see and the
 * club's content (bundled plus online edits). Never changes its arguments
 */
export function compareProfile(
  profiles: readonly SystemProfile[],
  id: string,
  content: readonly Convention[],
): ProfileComparison {
  const { chain, problems: chainProblems } = profileChain(profiles, id)
  const profile = chain[chain.length - 1]!
  const above = chain.slice(0, -1)
  const parent = above.at(-1)
  const names = new Map(content.map((c) => [c.slug, c.nameZh]))

  // Both sides with every convention played; the club's parent is the handbook itself
  const before = new Map<string, ResolvedConvention>(
    (parent ? resolveProfile(playingAll(above), parent.id, content).conventions : content).map((c) => [c.slug, c]),
  )
  const resolved = resolveProfile(playingAll(chain), profile.id, content)
  const after = new Map(resolved.conventions.map((c) => [c.slug, c]))

  // Adoption: the deepest profile above that lists a slug decides; unlisted ones are played
  const parentAdopted = new Map<string, 'on' | 'off'>()
  for (const p of above) for (const [slug, value] of Object.entries(p.adopted)) parentAdopted.set(slug, value)
  const adoptions: AdoptionChange[] = content
    .filter((c) => profile.adopted[c.slug] !== undefined)
    .map((c) => ({
      slug: c.slug,
      name: c.nameZh,
      value: profile.adopted[c.slug]!,
      parentPlays: parentAdopted.get(c.slug) !== 'off',
    }))
  const plays = (slug: string) =>
    (profile.adopted[slug] ?? parentAdopted.get(slug)) !== 'off'

  // The resolution's own problems for this profile; the adoptions it cannot see with every
  // convention played are checked here
  const problems: ProfileProblem[] = [
    ...chainProblems,
    ...Object.keys(profile.adopted)
      .filter((slug) => !names.has(slug))
      .map((slug): ProfileProblem => ({ kind: 'unknownAdoption', profileId: profile.id, slug })),
    ...resolved.problems.filter((p) => p.profileId === profile.id && (p.kind === 'brokenOverride' || p.kind === 'brokenNote')),
  ]
  const broken = new Set(problems.flatMap((p) => (p.kind === 'brokenOverride' ? [p.override] : [])))

  const replaced = (override: RowOverride) =>
    profile.overrides.some(
      (o) =>
        o.kind === 'section' &&
        o.slug === override.slug &&
        (o.sectionId === override.sectionId || sectionPath([o.section], override.sectionId).length > 0),
    )

  const change = (override: ProfileOverride): Change | undefined => {
    const was = before.get(override.slug)
    const now = after.get(override.slug)
    if (!now || broken.has(override)) return undefined
    if (override.kind === 'meta')
      return {
        kind: 'meta',
        override,
        before: { summary: was?.summary ?? '', tags: was?.tags ?? [] },
        after: { summary: override.summary ?? was?.summary ?? '', tags: override.tags ?? was?.tags ?? [] },
      }
    const path = sectionPath(now.sections, override.sectionId)
    const section = path.at(-1)
    if (!section) return undefined
    if (override.kind === 'section')
      return {
        kind: 'section',
        override,
        trail: path.slice(0, -1).map((s) => s.title),
        before: findSection(was, override.sectionId),
        after: section,
      }
    const found = rowAt(section, override)
    if (!found) return undefined
    return {
      kind: 'row',
      override,
      trail: path.map((s) => s.title),
      ...(found.block.auction && { auction: found.block.auction }),
      ...(found.block.caption && { caption: found.block.caption }),
      before: replaced(override) ? undefined : rowAt(findSection(was, override.sectionId), override)?.row,
      after: found.row,
    }
  }

  const conventions: ConventionChanges[] = []
  for (const c of content) {
    const changes = profile.overrides
      .filter((o) => o.slug === c.slug)
      .sort((a, b) => STEP[a.kind] - STEP[b.kind])
      .map(change)
      .filter((x): x is Change => !!x)
    if (changes.length) conventions.push({ slug: c.slug, name: c.nameZh, played: plays(c.slug), changes })
  }

  return { profile, ...(parent && { parent }), adoptions, conventions, problems }
}

/** Whether the comparison has nothing to show at all */
export const changesNothing = (comparison: ProfileComparison): boolean =>
  !comparison.adoptions.length && !comparison.conventions.length && !comparison.problems.length
