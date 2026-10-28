/**
 * Editing a system profile (制度集, E1 e1-t14): the pure steps the editor page takes on the
 * `ProfileInput` it will save. No storage and no React; every function returns a new input and
 * never changes its arguments.
 *
 * The editor works against what the profile's parent shows (`parentContent`): a profile's
 * overrides apply on top of its parent's, so rows are picked, and found again, by position in the
 * parent's version of each section (ARCHITECTURE.md §3, 制度集). The editor only stores what the
 * member typed; it never touches the handbook's own text (CLAUDE.md rule 1).
 */

import {
  CLUB_PROFILE_ID,
  PROFILE_LIMITS,
  type Adoption,
  type ProfileInput,
  type ProfileNote,
  type ProfileOverride,
  type SystemProfile,
} from './api.ts'
import { resolveProfile, type ResolvedConvention, type ResolvedRow, type ResolvedSection } from './profiles.ts'
import type { Category, Convention, ResponseRow, Section } from '../types/convention.ts'

export type RowOverride = Extract<ProfileOverride, { kind: 'row' }>
export type SectionOverride = Extract<ProfileOverride, { kind: 'section' }>

/** Where a response row is: the section's own `blockIndex`, then the row in that block */
export interface RowRef {
  slug: string
  sectionId: string
  blockIndex: number
  rowIndex: number
}

/** What a profile saves, taken from the loaded profile */
export const toInput = ({ name, scope, parentId, visibility, adopted, overrides, notes }: SystemProfile): ProfileInput => ({
  name,
  scope,
  ...(parentId !== undefined && { parentId }),
  ...(visibility !== undefined && { visibility }),
  adopted,
  overrides,
  notes,
})

/** Whether two inputs would save the same profile (key order aside, which the editor keeps) */
export const sameInput = (a: ProfileInput, b: ProfileInput) => JSON.stringify(a) === JSON.stringify(b)

// Adoption

/**
 * Whether the parents play a convention, `parents` from the club down to the parent: the deepest
 * that lists it decides, and a convention nobody lists is played
 */
export function inheritedAdoption(parents: readonly SystemProfile[], slug: string): Adoption {
  let value: Adoption = 'on'
  for (const p of parents) value = p.adopted[slug] ?? value
  return value
}

/** Sets the profile's own choice; undefined follows the parent again */
export function setAdoption(input: ProfileInput, slug: string, value: Adoption | undefined): ProfileInput {
  const { [slug]: _, ...rest } = input.adopted
  return { ...input, adopted: value ? { ...rest, [slug]: value } : rest }
}

// What the parent shows

/**
 * The club's content as the profile's parent shows it, every convention included (adoption is
 * the editor's own question, so a convention the parent drops can still be adopted and changed
 * here). `parents` runs from the club down to the parent; empty when editing the club's own
 */
export function parentContent(parents: readonly SystemProfile[], content: readonly Convention[]): ResolvedConvention[] {
  const parent = parents[parents.length - 1]
  if (!parent) return [...content]
  const playAll = parents.map((p) => ({ ...p, adopted: {} }))
  return resolveProfile(playAll, parent.id, content).conventions
}

/** The parents from the club down to `profile`'s parent, out of the chain the page fetched */
export const parentsOf = (chain: readonly SystemProfile[], profile: SystemProfile): SystemProfile[] =>
  profile.id === CLUB_PROFILE_ID ? [] : chain.filter((p) => p.id !== profile.id)

/** Conventions by catalogue group, in the handbook's order; a group the list lacks comes last */
export function grouped<T extends { category: string }>(
  categories: readonly Category[],
  conventions: readonly T[],
): { category: Category | undefined; conventions: T[] }[] {
  const groups = categories
    .map((category) => ({ category: category as Category | undefined, conventions: conventions.filter((c) => c.category === category.id) }))
    .filter((g) => g.conventions.length)
  const known = new Set(categories.map((c) => c.id))
  const rest = conventions.filter((c) => !known.has(c.category))
  return rest.length ? [...groups, { category: undefined, conventions: rest }] : groups
}

// Sections and rows

/** Every section, depth first, with how deep it is (0 at the top) */
export function flatSections<T extends { id: string; children?: T[] }>(sections: readonly T[], depth = 0): { section: T; depth: number }[] {
  return sections.flatMap((section) => [{ section, depth }, ...flatSections(section.children ?? [], depth + 1)])
}

export function findSection<T extends { id: string; children?: T[] }>(sections: readonly T[], id: string): T | undefined {
  return flatSections(sections).find((s) => s.section.id === id)?.section
}

/** The rows of the section's own `responses` blocks (not its children's), with their places */
export function responseRows(section: Pick<Section, 'blocks'>): { blockIndex: number; rowIndex: number; row: ResponseRow; caption?: string }[] {
  return (section.blocks ?? []).flatMap((block, blockIndex) =>
    block.kind === 'responses' ? block.rows.map((row, rowIndex) => ({ blockIndex, rowIndex, row, caption: block.caption })) : [],
  )
}

/** A resolved section as plain content: the parent's `origin` marks are not part of an override */
export function plainSection(section: ResolvedSection): Section {
  const { blocks, children, ...rest } = section
  delete rest.origin
  return {
    ...rest,
    ...(blocks && { blocks: blocks.map((b) => (b.kind === 'responses' ? { ...b, rows: b.rows.map(plainRow) } : b)) }),
    ...(children && { children: children.map(plainSection) }),
  }
}

function plainRow(resolved: ResolvedRow): ResponseRow {
  const row = { ...resolved }
  delete row.origin
  return row
}

/**
 * The section this profile works on: its own replacement when it has one (row overrides then
 * point into that), otherwise the parent's
 */
export function sectionHere(base: ResolvedConvention | undefined, input: ProfileInput, slug: string, sectionId: string): Section | undefined {
  const replaced = findSectionOverride(input, slug, sectionId)
  if (replaced) return { ...replaced.section, id: sectionId }
  const section = base && findSection(base.sections, sectionId)
  return section && plainSection(section)
}

/** The row an override points at, as the parent (or this profile's replacement section) has it */
export function rowHere(base: ResolvedConvention | undefined, input: ProfileInput, ref: RowRef): ResponseRow | undefined {
  const section = sectionHere(base, input, ref.slug, ref.sectionId)
  const block = section?.blocks?.[ref.blockIndex]
  return block?.kind === 'responses' ? block.rows[ref.rowIndex] : undefined
}

// Overrides

const sameRow = (o: ProfileOverride, ref: RowRef) =>
  o.kind === 'row' && o.slug === ref.slug && o.sectionId === ref.sectionId && o.blockIndex === ref.blockIndex && o.rowIndex === ref.rowIndex
const sameSection = (o: ProfileOverride, slug: string, sectionId: string) =>
  o.kind === 'section' && o.slug === slug && o.sectionId === sectionId

export const findRowOverride = (input: ProfileInput, ref: RowRef) =>
  input.overrides.find((o): o is RowOverride => sameRow(o, ref))

export const findSectionOverride = (input: ProfileInput, slug: string, sectionId: string) =>
  input.overrides.find((o): o is SectionOverride => sameSection(o, slug, sectionId))

export const rowOverrides = (input: ProfileInput) => input.overrides.filter((o): o is RowOverride => o.kind === 'row')
export const sectionOverrides = (input: ProfileInput) => input.overrides.filter((o): o is SectionOverride => o.kind === 'section')

/** Replaces the override in place, keeping the list's order, or adds it at the end */
function putOverride(input: ProfileInput, override: ProfileOverride, same: (o: ProfileOverride) => boolean): ProfileInput {
  const at = input.overrides.findIndex(same)
  const overrides = at < 0 ? [...input.overrides, override] : input.overrides.map((o, i) => (i === at ? override : o))
  return { ...input, overrides }
}

/**
 * The row means `meaning` in this profile. `note`: undefined keeps the row's own note, '' clears
 * it, anything else replaces it
 */
export function setRowOverride(input: ProfileInput, ref: RowRef, meaning: string, note?: string): ProfileInput {
  const override: RowOverride = { kind: 'row', ...ref, meaning, ...(note !== undefined && { note }) }
  return putOverride(input, override, (o) => sameRow(o, ref))
}

export const removeRowOverride = (input: ProfileInput, ref: RowRef): ProfileInput => ({
  ...input,
  overrides: input.overrides.filter((o) => !sameRow(o, ref)),
})

/** The whole section is replaced; it keeps its id, whatever the form says */
export function setSectionOverride(input: ProfileInput, slug: string, sectionId: string, section: Section): ProfileInput {
  const override: SectionOverride = { kind: 'section', slug, sectionId, section: { ...section, id: sectionId } }
  return putOverride(input, override, (o) => sameSection(o, slug, sectionId))
}

export const removeSectionOverride = (input: ProfileInput, slug: string, sectionId: string): ProfileInput => ({
  ...input,
  overrides: input.overrides.filter((o) => !sameSection(o, slug, sectionId)),
})

// Notes

export function addNote(input: ProfileInput, note: ProfileNote): ProfileInput {
  return { ...input, notes: [...input.notes, note] }
}

/** Changes the text of note `index`; who wrote it and when become the editor and now */
export function editNote(input: ProfileInput, index: number, text: string, by: string, at: number): ProfileInput {
  return { ...input, notes: input.notes.map((n, i) => (i === index ? { ...n, text, by, at } : n)) }
}

export const removeNote = (input: ProfileInput, index: number): ProfileInput => ({
  ...input,
  notes: input.notes.filter((_, i) => i !== index),
})

// Limits

export type InputProblem =
  | { kind: 'tooManyOverrides'; count: number }
  | { kind: 'noteTooLong'; index: number }
  | { kind: 'emptyNote'; index: number }
  | { kind: 'emptyMeaning'; index: number }
  | { kind: 'tooLarge'; bytes: number }

/** What the Worker would refuse (PROFILE_LIMITS), and empty texts, found before saving */
export function inputProblems(input: ProfileInput): InputProblem[] {
  const problems: InputProblem[] = []
  if (input.overrides.length > PROFILE_LIMITS.overridesMax) problems.push({ kind: 'tooManyOverrides', count: input.overrides.length })
  input.overrides.forEach((o, index) => {
    if (o.kind === 'row' && !o.meaning.trim()) problems.push({ kind: 'emptyMeaning', index })
  })
  input.notes.forEach((n, index) => {
    if (!n.text.trim()) problems.push({ kind: 'emptyNote', index })
    else if (n.text.length > PROFILE_LIMITS.noteMax) problems.push({ kind: 'noteTooLong', index })
  })
  const bytes = new TextEncoder().encode(JSON.stringify(input)).length
  if (bytes > PROFILE_LIMITS.bytesMax) problems.push({ kind: 'tooLarge', bytes })
  return problems
}
