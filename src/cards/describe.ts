import type { FilledCell } from './fill.ts'
import { templateBlocks } from './slots.ts'
import type { CardBlock, CardHelp, CardTableColumn, CardTableRow, CardTemplate } from './types.ts'

/** What the card page says about one slot: its printed label, its help and what it holds */
export interface SlotInfo {
  id: string
  /** The printed label, with the table's row and column for a table cell */
  label: string
  help?: CardHelp
  /** What the hand edit offers: free text, a tick (with a fill-in when `blank`), or options */
  kind: 'text' | 'check' | 'choice' | 'cell'
  block: CardBlock
  row?: CardTableRow
  column?: CardTableColumn
}

const tableLabel = (title: string | undefined, row: CardTableRow, column: CardTableColumn) =>
  [title, `${row.group ? `${row.group} ` : ''}${row.label}`, column.group ? `${column.group} ${column.label}` : column.label]
    .filter(Boolean)
    .join(' · ')

/** Every slot of a template, by id (the same ids `templateSlots` gives) */
export function describeSlots(template: CardTemplate): Map<string, SlotInfo> {
  const out = new Map<string, SlotInfo>()
  for (const { block } of templateBlocks(template)) {
    const id = `${template.id}.${block.id}`
    switch (block.kind) {
      case 'cells':
        out.set(id, { id, label: block.title, ...(block.help && { help: block.help }), kind: 'text', block })
        break
      case 'text':
        out.set(id, { id, label: block.label, ...(block.help && { help: block.help }), kind: 'text', block })
        break
      case 'check':
        out.set(id, { id, label: block.label, ...(block.help && { help: block.help }), kind: 'check', block })
        break
      case 'choice': {
        const label = block.scope ? `${block.scope} ${block.label}` : block.label
        out.set(id, { id, label, ...(block.help && { help: block.help }), kind: 'choice', block })
        break
      }
      case 'table': {
        const insetFrom = block.inset ? block.rows.findIndex((r) => r.id === block.inset!.fromRow) : -1
        block.rows.forEach((row, i) => {
          for (const column of block.columns) {
            if (insetFrom >= 0 && i >= insetFrom && block.inset!.columns.includes(column.id)) continue
            const slot = `${id}.${row.id}.${column.id}`
            const help = column.help ?? block.help
            out.set(slot, {
              id: slot,
              label: tableLabel(block.title, row, column),
              ...(help && { help }),
              kind: 'cell',
              block,
              row,
              column,
            })
          }
        })
        break
      }
      default:
        break
    }
  }
  return out
}

/** Printable width of an A4 sheet at the margins the card page prints with, in points */
export const PAPER_WIDTH = { 'A4-landscape': 806, 'A4-portrait': 559 } as const

/** What a filled cell says, as plain text (its accessible name, the card page's summary) */
export function cellSummary(info: SlotInfo, cell: FilledCell | undefined, words: { checked: string; empty: string }): string {
  const parts: string[] = []
  if (cell?.checked) parts.push(words.checked)
  if (cell?.option && info.block.kind === 'choice') {
    parts.push(info.block.options.find((o) => o.id === cell.option)?.label ?? cell.option)
  }
  if (cell?.text) parts.push(cell.text)
  return parts.join('，') || words.empty
}
