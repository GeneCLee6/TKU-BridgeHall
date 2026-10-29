import type { PendingMeta } from '../../src/lib/api.ts'
import { pendingRows } from '../../src/lib/pending.ts'
import type { ConventionMeta, PendingNote } from '../../src/types/convention.ts'

const note = (sectionId: string, index: number, text: string): PendingNote => ({ sectionId, index, trail: [sectionId], text })
const convention = (slug: string, pending: PendingNote[]) => ({ slug, nameZh: slug.toUpperCase(), pending }) as unknown as ConventionMeta
const meta = (slug: string, sectionId: string, index: number, text: string, extra: Partial<PendingMeta> = {}): PendingMeta => ({
  slug,
  sectionId,
  index,
  text,
  status: 'working',
  updatedAt: 1,
  updatedBy: 'amy',
  ...extra,
})

describe('the 待確認 panel’s rows (e8-t07)', () => {
  it('lists every note in catalogue order, 未處理 unless a record says otherwise', () => {
    const rows = pendingRows(
      [convention('a', [note('x', 0, '一'), note('x', 1, '二')]), convention('b', [note('y', 0, '三')])],
      [meta('a', 'x', 1, '二', { status: 'parked', assignee: 'ben' })],
    )
    expect(rows.map((r) => [r.slug, r.note.text, r.status, r.meta?.assignee])).toEqual([
      ['a', '一', 'open', undefined],
      ['a', '二', 'parked', 'ben'],
      ['b', '三', 'open', undefined],
    ])
  })

  it('finds a record by its section and text when the note moved, but not a reworded one', () => {
    const rows = pendingRows([convention('a', [note('x', 0, '二'), note('x', 1, '一（改寫）')])], [meta('a', 'x', 1, '二'), meta('a', 'x', 0, '一')])
    expect(rows.map((r) => r.status)).toEqual(['working', 'open'])
  })

  it('gives each of two notes with the same text its own record', () => {
    const rows = pendingRows(
      [convention('a', [note('x', 0, '同'), note('x', 1, '同')])],
      [meta('a', 'x', 1, '同', { status: 'parked' }), meta('a', 'x', 0, '同')],
    )
    expect(rows.map((r) => r.status)).toEqual(['working', 'parked'])
  })
})
