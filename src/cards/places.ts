import { parseCardSlot } from './cardSlots.ts'
import { describeSlots, type SlotInfo } from './describe.ts'
import { cardTemplates } from './templates/index.ts'
import type { CardTemplate, CardTemplateId } from './types.ts'

/** Where a convention's section goes on a convention card (e3-t10, AC-3.6) */
export interface CardPlace {
  templateId: CardTemplateId
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
 * point at no section and are left out.
 */
export function cardPlaces(cardSlots: readonly string[] | undefined, target: string): CardPlace[] {
  const out: CardPlace[] = []
  const seen = new Set<string>()
  for (const entry of cardSlots ?? []) {
    const parsed = parseCardSlot(entry)
    if (!parsed?.ref) continue
    const at = parsed.ref.kind === 'convention' ? '*' : parsed.ref.sectionId
    if (at !== target || seen.has(parsed.slot)) continue
    const template = cardTemplates.find((t) => !t.sameSlotsAs && parsed.slot.startsWith(`${t.id}.`))
    if (!template) continue
    seen.add(parsed.slot)
    out.push({
      templateId: template.id,
      slot: parsed.slot,
      label: slotsOf(template).get(parsed.slot)?.label ?? parsed.slot,
    })
  }
  return out
}
