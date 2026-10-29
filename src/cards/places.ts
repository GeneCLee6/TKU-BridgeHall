import { parseCardSlot } from './cardSlots.ts'
import { describeSlots, type SlotInfo } from './describe.ts'
import { cardTemplates } from './templates/index.ts'
import type { Convention } from '../types/convention.ts'
import type { CardTemplate, CardTemplateId } from './types.ts'

/** Where a convention's section goes on a convention card (e3-t10, AC-3.6) */
export interface CardPlace {
  templateId: CardTemplateId
  /** The card's address under /cards/:profileId/: the template id, or `<id>/<slug>` for a Brown Sticker form */
  path: string
  /** The slot id, for the card page's `?cell=` */
  slot: string
  /** The cell's printed label (with a table's row and column) */
  label: string
}

const described = new Map<CardTemplateId, Map<string, SlotInfo>>()
const slotsOf = (template: CardTemplate) => {
  let slots = described.get(template.id)
  if (!slots) described.set(template.id, (slots = describeSlots(template)))
  return slots
}

/**
 * The cells a convention's `cardSlots` fill from `target`: a section id, or `*` for the entries
 * that take the whole convention. Entries for a template that shares another's cells (the
 * two-sided simple card) are listed under the template that owns them; fixed values with no ref
 * point at no section and are left out. A Brown Sticker form's cells are listed only when the
 * convention is marked for that form (cards/bsc.ts).
 */
export function cardPlaces(
  cardSlots: readonly string[] | undefined,
  target: string,
  convention?: Pick<Convention, 'slug' | 'brownSticker'>,
): CardPlace[] {
  const out: CardPlace[] = []
  const seen = new Set<string>()
  for (const entry of cardSlots ?? []) {
    const parsed = parseCardSlot(entry)
    if (!parsed?.ref) continue
    const at = parsed.ref.kind === 'convention' ? '*' : parsed.ref.sectionId
    if (at !== target || seen.has(parsed.slot)) continue
    const template = cardTemplates.find((t) => !t.sameSlotsAs && parsed.slot.startsWith(`${t.id}.`))
    if (!template) continue
    if (template.brownSticker && (!convention || convention.brownSticker !== template.brownSticker)) continue
    seen.add(parsed.slot)
    out.push({
      templateId: template.id,
      path: template.brownSticker ? `${template.id}/${convention!.slug}` : template.id,
      slot: parsed.slot,
      label: slotsOf(template).get(parsed.slot)?.label ?? parsed.slot,
    })
  }
  return out
}
