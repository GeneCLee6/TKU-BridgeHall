import type { Block, Convention, RuleItem, Section } from '../types/convention.ts'

/** Accordion item keys: a convention is its slug, a section is "slug/sectionId" */
export const conventionKey = (slug: string) => slug
export const sectionKey = (slug: string, sectionId: string) => `${slug}/${sectionId}`

/** DOM ids, used as scroll targets for deep links */
export const conventionDomId = (slug: string) => `c-${slug}`
export const sectionDomId = (slug: string, sectionId: string) => `c-${slug}--${sectionId}`

export const conventionPath = (slug: string) => `/c/${slug}`
export const sectionPath = (slug: string, sectionId: string) => `/c/${slug}/${sectionId}`

/** Depth-first walk over every section, with its ancestors */
export function walkSections(
  sections: Section[],
  visit: (section: Section, ancestors: Section[]) => void,
  ancestors: Section[] = [],
): void {
  for (const section of sections) {
    visit(section, ancestors)
    if (section.children) walkSections(section.children, visit, [...ancestors, section])
  }
}

/** The section and its ancestors, root first; empty when the id does not exist */
export function findSectionPath(convention: Convention, sectionId: string): Section[] {
  let found: Section[] = []
  walkSections(convention.sections, (section, ancestors) => {
    if (section.id === sectionId) found = [...ancestors, section]
  })
  return found
}

/** Every accordion key in a convention, the convention itself included */
export function allKeys(convention: Convention): string[] {
  const keys = [conventionKey(convention.slug)]
  walkSections(convention.sections, (s) => keys.push(sectionKey(convention.slug, s.id)))
  return keys
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
  }
}

export interface PendingNote {
  sectionId: string
  text: string
}

/** Every 待確認 note in a convention */
export function pendingNotes(convention: Convention): PendingNote[] {
  const notes: PendingNote[] = []
  walkSections(convention.sections, (section) => {
    const add = (text?: string) => text && notes.push({ sectionId: section.id, text })
    add(section.pending)
    for (const block of section.blocks ?? []) {
      if (block.kind === 'paragraph') add(block.pending)
      if (block.kind === 'responses') block.rows.forEach((r) => add(r.pending))
      if (block.kind === 'rules') flattenRules(block.items).forEach((i) => add(i.pending))
    }
  })
  return notes
}
