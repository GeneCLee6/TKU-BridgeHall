import type {
  Block,
  Convention,
  ConventionMeta,
  PendingNote,
  RuleItem,
  Section,
  SectionOutline,
} from '../types/convention.ts'

export type { PendingNote }

/** Accordion item keys: a convention is its slug, a section is "slug/sectionId" */
export const conventionKey = (slug: string) => slug
export const sectionKey = (slug: string, sectionId: string) => `${slug}/${sectionId}`

/** DOM ids, used as scroll targets for deep links */
export const conventionDomId = (slug: string) => `c-${slug}`
export const sectionDomId = (slug: string, sectionId: string) => `c-${slug}--${sectionId}`

export const conventionPath = (slug: string) => `/c/${slug}`
export const sectionPath = (slug: string, sectionId: string) => `/c/${slug}/${sectionId}`
/** Deep link to the index-th 待確認 note that belongs directly to a section */
export const pendingPath = (slug: string, sectionId: string, index: number) =>
  `${sectionPath(slug, sectionId)}?pending=${index}`

/** Depth-first walk over every section, with its ancestors */
export function walkSections<T extends SectionOutline>(
  sections: T[],
  visit: (section: T, ancestors: T[]) => void,
  ancestors: T[] = [],
): void {
  for (const section of sections) {
    visit(section, ancestors)
    if (section.children) walkSections(section.children as T[], visit, [...ancestors, section])
  }
}

/** A loaded convention's sections, or a manifest entry's outline */
const tree = (convention: Convention | ConventionMeta): SectionOutline[] =>
  'sections' in convention ? convention.sections : convention.outline

/** The section and its ancestors, root first; empty when the id does not exist */
export function findSectionPath(convention: Convention | ConventionMeta, sectionId: string): SectionOutline[] {
  let found: SectionOutline[] = []
  walkSections(tree(convention), (section, ancestors) => {
    if (section.id === sectionId) found = [...ancestors, section]
  })
  return found
}

/** Every accordion key in a convention, the convention itself included */
export function allKeys(convention: Convention | ConventionMeta): string[] {
  const keys = [conventionKey(convention.slug)]
  walkSections(tree(convention), (s) => keys.push(sectionKey(convention.slug, s.id)))
  return keys
}

/** Just the ids, titles and nesting of the sections */
export function outline(sections: Section[]): SectionOutline[] {
  return sections.map((s) => ({
    id: s.id,
    title: s.title,
    ...(s.children?.length && { children: outline(s.children) }),
  }))
}

/** The manifest entry for a convention: everything but its content and card slots */
export function conventionMeta(convention: Convention): ConventionMeta {
  // Card slots stay out of the manifest: only the card pages use them, and those load the content
  const { sections, cardSlots: _cardSlots, ...rest } = convention
  return { ...rest, outline: outline(sections), pending: pendingNotes(convention) }
}

function flattenRules(items: RuleItem[]): RuleItem[] {
  return items.flatMap((i) => [i, ...flattenRules(i.children ?? [])])
}

/** All the text a block contains, for search */
export function blockText(block: Block): string {
  switch (block.kind) {
    case 'paragraph':
    case 'note':
      return block.text
    case 'rules':
      return flattenRules(block.items)
        .map((i) => i.text)
        .join(' ')
    case 'responses':
      return block.rows.map((r) => `${r.meaning} ${r.note ?? ''}`).join(' ')
    case 'hand':
      return block.label ?? ''
    case 'intro':
      return [block.why, block.when, ...(block.pitfalls ?? [])].filter(Boolean).join(' ')
  }
}

/** Every 待確認 note in a convention, in page order */
export function pendingNotes(convention: Convention): PendingNote[] {
  const notes: PendingNote[] = []
  walkSections(convention.sections, (section, ancestors) => {
    let index = 0
    const trail = [...ancestors, section].map((s) => s.title)
    const add = (text?: string) =>
      text && notes.push({ sectionId: section.id, index: index++, trail, text })
    add(section.pending)
    for (const block of section.blocks ?? []) {
      if (block.kind === 'paragraph') add(block.pending)
      if (block.kind === 'responses') block.rows.forEach((r) => add(r.pending))
      if (block.kind === 'rules') flattenRules(block.items).forEach((i) => add(i.pending))
    }
  })
  return notes
}
