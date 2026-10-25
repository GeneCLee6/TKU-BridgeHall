/**
 * System profiles (制度集, PRD E1): resolving a profile's layers into the conventions its readers
 * see. Pure functions, no storage and no React; ProfileContext (e1-t11) will call resolveProfile
 * with the profiles from the Worker and the content ContentContext already merged.
 *
 * The rules (ARCHITECTURE.md §3, 制度集):
 * - The chain runs from the club down to the chosen profile: club ← team ← partnership. The club is
 *   always its root, even when the profile list does not have it (an empty one stands in), and a
 *   profile without `parentId` inherits the club.
 * - `adopted`: the deepest profile that lists a slug decides; unlisted conventions are played.
 *   A convention that ends up 'off' is left out, and its overrides and notes wait unused.
 * - Overrides apply from the club down, so a child's override wins over its parent's. Within one
 *   profile, section overrides go first, then rows, then meta, so a row override can point into a
 *   section the same profile replaced.
 * - Whatever an override changed carries `origin`, the scope of the profile whose override it is;
 *   anything without `origin` is the handbook's own content. With no overrides the result is the
 *   content itself (the same objects), so an empty profile looks exactly like the handbook.
 * - Nothing is dropped silently: a missing profile or parent, a loop, and an override, note or
 *   adoption that points at nothing come back in `problems` (the compare page lists them, e1-t15).
 */

import {
  CLUB_PROFILE_ID,
  type ProfileNote,
  type ProfileOverride,
  type ProfileScope,
  type SystemProfile,
} from './api.ts'
import { strings } from '../strings.ts'
import type { Block, Convention, ResponseRow, Section } from '../types/convention.ts'

/** Which layer an overridden part comes from */
export type Origin = ProfileScope

export interface ResolvedRow extends ResponseRow {
  origin?: Origin
}

export type ResolvedBlock =
  | Exclude<Block, { kind: 'responses' }>
  | (Omit<Extract<Block, { kind: 'responses' }>, 'rows'> & { rows: ResolvedRow[] })

export interface ResolvedSection extends Omit<Section, 'blocks' | 'children'> {
  origin?: Origin
  blocks?: ResolvedBlock[]
  children?: ResolvedSection[]
}

/** A convention as a profile sees it; still a Convention, with `origin` where it was overridden */
export interface ResolvedConvention extends Omit<Convention, 'sections'> {
  /** Set when the summary or tags were overridden */
  origin?: Origin
  sections: ResolvedSection[]
}

/** A note together with the profile it belongs to */
export interface ResolvedNote extends ProfileNote {
  profileId: string
  origin: Origin
}

type RowOverride = Extract<ProfileOverride, { kind: 'row' }>

export type ProfileProblem =
  /** The chosen profile is not in the list; the club is shown instead */
  | { kind: 'missingProfile'; profileId: string }
  /** A profile's parent is not in the list; the profile inherits the club directly */
  | { kind: 'missingParent'; profileId: string; parentId: string }
  /** Following parents leads back to `profileId`; the chain stops there and goes to the club */
  | { kind: 'cycle'; profileId: string; parentId: string }
  /** `adopted` lists a slug the handbook does not have */
  | { kind: 'unknownAdoption'; profileId: string; slug: string }
  /** The override's convention, section or row (a `responses` block's row) does not exist */
  | { kind: 'brokenOverride'; profileId: string; override: ProfileOverride; missing: 'convention' | 'section' | 'row' }
  /** The note's convention or section does not exist */
  | { kind: 'brokenNote'; profileId: string; note: ProfileNote; missing: 'convention' | 'section' }

export interface ProfileResolution {
  /** The chosen profile, or the club when it was not found */
  profile: SystemProfile
  /** From the club down to `profile` */
  chain: SystemProfile[]
  /** The conventions this profile plays, in the content's order */
  conventions: ResolvedConvention[]
  /** Notes from every profile in the chain on the conventions played, club first */
  notes: ResolvedNote[]
  problems: ProfileProblem[]
}

/** The club profile when the Worker has none yet: plays everything, changes nothing */
export const emptyClubProfile = (): SystemProfile => ({
  id: CLUB_PROFILE_ID,
  name: strings.profiles.club,
  scope: 'club',
  adopted: {},
  overrides: [],
  notes: [],
  version: 0,
  updatedAt: 0,
  updatedBy: '',
})

/** The profiles from the club down to `id`, and what went wrong on the way */
export function profileChain(
  profiles: readonly SystemProfile[],
  id: string,
): { chain: SystemProfile[]; problems: ProfileProblem[] } {
  const byId = new Map(profiles.map((p) => [p.id, p]))
  const club = byId.get(CLUB_PROFILE_ID) ?? emptyClubProfile()
  const problems: ProfileProblem[] = []
  let current = id === CLUB_PROFILE_ID ? club : byId.get(id)
  if (!current) {
    problems.push({ kind: 'missingProfile', profileId: id })
    current = club
  }
  const below: SystemProfile[] = []
  const seen = new Set<string>()
  while (current.id !== CLUB_PROFILE_ID) {
    below.unshift(current)
    seen.add(current.id)
    const parentId = current.parentId ?? CLUB_PROFILE_ID
    if (parentId === CLUB_PROFILE_ID) break
    if (seen.has(parentId)) {
      problems.push({ kind: 'cycle', profileId: current.id, parentId })
      break
    }
    const parent = byId.get(parentId)
    if (!parent) {
      problems.push({ kind: 'missingParent', profileId: current.id, parentId })
      break
    }
    current = parent
  }
  return { chain: [club, ...below], problems }
}

/**
 * Replaces the section with this id anywhere in the tree, copying only the path down to it; null
 * when there is no such section or `change` gives null
 */
function replaceSection(
  sections: ResolvedSection[],
  sectionId: string,
  change: (section: ResolvedSection) => ResolvedSection | null,
): ResolvedSection[] | null {
  for (const [i, section] of sections.entries()) {
    let updated: ResolvedSection | null = null
    if (section.id === sectionId) {
      updated = change(section)
      if (!updated) return null
    } else if (section.children) {
      const children = replaceSection(section.children, sectionId, change)
      if (children) updated = { ...section, children }
    }
    if (updated) return sections.map((s, j) => (j === i ? updated : s))
  }
  return null
}

function hasSection(sections: readonly ResolvedSection[], sectionId: string): boolean {
  return sections.some((s) => s.id === sectionId || (!!s.children && hasSection(s.children, sectionId)))
}

/** A copy of a profile's replacement section with every section in it marked */
function markSection(section: Section, origin: Origin): ResolvedSection {
  return { ...section, origin, ...(section.children && { children: section.children.map((c) => markSection(c, origin)) }) }
}

function changeRow(section: ResolvedSection, override: RowOverride, origin: Origin): ResolvedSection | null {
  const block = section.blocks?.[override.blockIndex]
  if (!block || block.kind !== 'responses') return null
  const row = block.rows[override.rowIndex]
  if (!row) return null
  // The overridden meaning is the profile's, so the source's 待確認 note on the old one no longer applies
  const note = override.note === undefined ? row.note : override.note || undefined
  const next: ResolvedRow = { call: row.call, meaning: override.meaning, ...(note !== undefined && { note }), origin }
  const rows = block.rows.map((r, i) => (i === override.rowIndex ? next : r))
  const blocks = section.blocks!.map((b, i) => (i === override.blockIndex ? { ...block, rows } : b))
  return { ...section, blocks }
}

const STEP: Record<ProfileOverride['kind'], number> = { section: 0, row: 1, meta: 2 }

/** Applies one profile's overrides to a convention; problems for the ones that point at nothing */
function applyOverrides(
  convention: ResolvedConvention,
  profile: SystemProfile,
  overrides: ProfileOverride[],
  problems: ProfileProblem[],
): ResolvedConvention {
  const origin = profile.scope
  let result = convention
  for (const override of [...overrides].sort((a, b) => STEP[a.kind] - STEP[b.kind])) {
    if (override.kind === 'meta') {
      result = {
        ...result,
        ...(override.summary !== undefined && { summary: override.summary }),
        ...(override.tags !== undefined && { tags: override.tags }),
        origin,
      }
      continue
    }
    if (!hasSection(result.sections, override.sectionId)) {
      problems.push({ kind: 'brokenOverride', profileId: profile.id, override, missing: 'section' })
      continue
    }
    const sections = replaceSection(result.sections, override.sectionId, (section) =>
      override.kind === 'section'
        ? markSection({ ...override.section, id: override.sectionId }, origin)
        : changeRow(section, override, origin),
    )
    if (sections) result = { ...result, sections }
    else problems.push({ kind: 'brokenOverride', profileId: profile.id, override, missing: 'row' })
  }
  return result
}

/**
 * The conventions profile `id` sees, given every profile the reader may see and the club's content
 * (bundled plus online edits). Never changes its arguments
 */
export function resolveProfile(
  profiles: readonly SystemProfile[],
  id: string,
  content: readonly Convention[],
): ProfileResolution {
  const { chain, problems } = profileChain(profiles, id)
  const slugs = new Set(content.map((c) => c.slug))

  const adopted = new Map<string, 'on' | 'off'>()
  for (const profile of chain) {
    for (const [slug, value] of Object.entries(profile.adopted)) {
      if (slugs.has(slug)) adopted.set(slug, value)
      else problems.push({ kind: 'unknownAdoption', profileId: profile.id, slug })
    }
  }
  const plays = (slug: string) => adopted.get(slug) !== 'off'

  // Overrides by convention and profile; the ones for a convention the handbook lacks are reported
  const bySlug = new Map<string, Map<SystemProfile, ProfileOverride[]>>()
  for (const profile of chain) {
    for (const override of profile.overrides) {
      if (!slugs.has(override.slug)) {
        problems.push({ kind: 'brokenOverride', profileId: profile.id, override, missing: 'convention' })
        continue
      }
      const forSlug = bySlug.get(override.slug) ?? new Map<SystemProfile, ProfileOverride[]>()
      bySlug.set(override.slug, forSlug)
      forSlug.set(profile, [...(forSlug.get(profile) ?? []), override])
    }
  }

  const conventions: ResolvedConvention[] = []
  for (const convention of content) {
    if (!plays(convention.slug)) continue
    let resolved: ResolvedConvention = convention
    for (const profile of chain) {
      const overrides = bySlug.get(convention.slug)?.get(profile)
      if (overrides) resolved = applyOverrides(resolved, profile, overrides, problems)
    }
    conventions.push(resolved)
  }

  const resolvedBySlug = new Map(conventions.map((c) => [c.slug, c]))
  const notes: ResolvedNote[] = []
  for (const profile of chain) {
    for (const note of profile.notes) {
      if (!slugs.has(note.slug)) {
        problems.push({ kind: 'brokenNote', profileId: profile.id, note, missing: 'convention' })
        continue
      }
      const target = resolvedBySlug.get(note.slug)
      if (!target) continue // not played: the note waits until the convention is adopted again
      if (note.sectionId !== undefined && !hasSection(target.sections, note.sectionId)) {
        problems.push({ kind: 'brokenNote', profileId: profile.id, note, missing: 'section' })
        continue
      }
      notes.push({ ...note, profileId: profile.id, origin: profile.scope })
    }
  }

  return { profile: chain[chain.length - 1]!, chain, conventions, notes, problems }
}
