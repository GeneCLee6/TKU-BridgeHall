import { levels, type Level, type Section } from '../types/convention.ts'

/**
 * 入門版 (e4-t02, AC-4.2): which sections a reader in basic mode sees. A section's level is its
 * own `level`, else its parent's, else the convention's (CONTENT_GUIDE.md §2.1). Basic mode shows
 * 入門 sections and those without a level; 進階 and 高階 ones are hidden with their children. Only
 * the view changes: the content is never altered. Imported by the lazy reading pages only.
 */

/** A level this version knows, or undefined */
const known = (level: unknown): Level | undefined =>
  levels.includes(level as Level) ? (level as Level) : undefined

/** The section's level, from itself or what it inherits */
export const sectionLevel = (
  section: Pick<Section, 'level'>,
  inherited?: string,
): Level | undefined => known(section.level) ?? known(inherited)

/** Whether a section at this level is shown in 入門版 */
export const shownInBasic = (level: Level | undefined) => level === undefined || level === 'basic'

/** Ids of every section 入門版 hides, children of hidden sections included */
export function basicHiddenIds(sections: readonly Section[], inherited?: string): Set<string> {
  const hidden = new Set<string>()
  const visit = (list: readonly Section[], parent: Level | undefined, parentHidden: boolean) => {
    for (const s of list) {
      const level = sectionLevel(s, parent)
      const isHidden = parentHidden || !shownInBasic(level)
      if (isHidden) hidden.add(s.id)
      if (s.children) visit(s.children, level, isHidden)
    }
  }
  visit(sections, known(inherited), false)
  return hidden
}
