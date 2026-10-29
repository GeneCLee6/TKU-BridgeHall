import type { ConventionMeta, PendingNote } from '../types/convention.ts'
import type { PendingMeta, PendingStatus } from './api.ts'

/**
 * The 待確認 panel's rows (e8-t06, e8-t07): every note in the content, in catalogue order, with its
 * record from the panel's data when it has one. The note itself is always the content's (`pending`
 * on a section, paragraph, call row or rule); a record finds its note by section and text, so a
 * reworded note is 未處理 again. Of two notes with the same text the one at the record's place wins.
 */
export interface PendingRow {
  slug: string
  nameZh: string
  note: PendingNote
  meta?: PendingMeta
  status: PendingStatus
}

export function pendingRows(conventions: ConventionMeta[], records: PendingMeta[]): PendingRow[] {
  const rows: PendingRow[] = []
  for (const c of conventions) {
    const mine = records.filter((m) => m.slug === c.slug)
    const taken = new Set<PendingMeta>()
    const find = (note: PendingNote) => {
      const same = mine.filter((m) => !taken.has(m) && m.sectionId === note.sectionId && m.text === note.text)
      const meta = same.find((m) => m.index === note.index) ?? same[0]
      if (meta) taken.add(meta)
      return meta
    }
    // Records at their own place first, so a moved twin does not take another note's record
    const exact = new Map(c.pending.map((n) => [n, mine.find((m) => m.sectionId === n.sectionId && m.index === n.index && m.text === n.text)]))
    for (const meta of exact.values()) if (meta) taken.add(meta)
    for (const note of c.pending) {
      const meta = exact.get(note) ?? find(note)
      rows.push({ slug: c.slug, nameZh: c.nameZh, note, meta, status: meta?.status ?? 'open' })
    }
  }
  return rows
}

