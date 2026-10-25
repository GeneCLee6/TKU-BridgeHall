import type { CardBlock, CardTemplate } from './types.ts'

/** A fillable place on a card: `${templateId}.${blockId}`, plus `.${rowId}.${columnId}` in tables */
export interface CardSlot {
  id: string
  block: CardBlock
  page: string
}

/** Every block of a template in print order, groups flattened (the group itself comes first) */
export function templateBlocks(template: CardTemplate): { block: CardBlock; page: string }[] {
  const out: { block: CardBlock; page: string }[] = []
  const visit = (blocks: CardBlock[], page: string) => {
    for (const block of blocks) {
      out.push({ block, page })
      if (block.kind === 'group') visit(block.blocks, page)
    }
  }
  for (const page of template.pages) for (const column of page.columns) visit(column.blocks, page.id)
  return out
}

/** The slots `fillCard` can write; headings, banners, notes and groups hold no content */
export function templateSlots(template: CardTemplate): CardSlot[] {
  const slots: CardSlot[] = []
  for (const { block, page } of templateBlocks(template)) {
    const base = `${template.id}.${block.id}`
    switch (block.kind) {
      case 'heading':
      case 'banner':
      case 'note':
      case 'group':
        break
      case 'table':
        for (const row of block.rows)
          for (const column of block.columns) slots.push({ id: `${base}.${row.id}.${column.id}`, block, page })
        break
      default:
        slots.push({ id: base, block, page })
    }
  }
  return slots
}
