import type { CardBlock, CardTemplate } from './types.ts'

/** A fillable place on a card: `${templateId}.${blockId}`, plus `.${rowId}.${columnId}` in tables */
export interface CardSlot {
  id: string
  block: CardBlock
  page: string
}

/**
 * Every block of a template in print order, groups and splits flattened (the container comes
 * first); a table's inset follows the table
 */
export function templateBlocks(template: CardTemplate): { block: CardBlock; page: string }[] {
  const out: { block: CardBlock; page: string }[] = []
  const visit = (blocks: CardBlock[], page: string) => {
    for (const block of blocks) {
      out.push({ block, page })
      if (block.kind === 'group') visit(block.blocks, page)
      if (block.kind === 'split') for (const part of block.parts) visit(part.blocks, page)
      if (block.kind === 'table' && block.inset) visit([block.inset.block], page)
    }
  }
  for (const page of template.pages) for (const column of page.columns) visit(column.blocks, page.id)
  return out
}

/** The slots `fillCard` can write; headings, banners, notes, groups and splits hold no content */
export function templateSlots(template: CardTemplate): CardSlot[] {
  const slots: CardSlot[] = []
  for (const { block, page } of templateBlocks(template)) {
    const base = `${template.id}.${block.id}`
    switch (block.kind) {
      case 'heading':
      case 'banner':
      case 'note':
      case 'group':
      case 'split':
        break
      case 'table': {
        const insetFrom = block.inset ? block.rows.findIndex((r) => r.id === block.inset!.fromRow) : -1
        block.rows.forEach((row, i) => {
          for (const column of block.columns) {
            if (insetFrom >= 0 && i >= insetFrom && block.inset!.columns.includes(column.id)) continue
            slots.push({ id: `${base}.${row.id}.${column.id}`, block, page })
          }
        })
        break
      }
      default:
        slots.push({ id: base, block, page })
    }
  }
  return slots
}
