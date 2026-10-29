// Brown Sticker announcement forms (E3 e3-t12, AC-3.8). A form is not a card every profile has:
// each convention the profile plays that is marked `brownSticker` gets one form of the matching
// template, filled from that convention alone. Its cells come from the convention's `cardSlots`
// like any card (`bsc-opening.shows <- …`); a convention with no entries for its form gets the
// whole convention as Detailed Description, which moves to the supplementary pages as [Note n].
// Hand edits are kept per convention: `bsc-opening.<slug>.<cell>` in `profile.cardEdits`.

import type { ProfileResolution, ResolvedConvention } from '../lib/profiles.ts'
import { parseCardSlot } from './cardSlots.ts'
import { cardTemplates } from './templates/index.ts'
import type { CardTemplate } from './types.ts'

/** A form on a profile's card page: the template and the convention it announces */
export interface BrownStickerForm {
  template: CardTemplate
  convention: ResolvedConvention
}

/** The template of a convention's form, if it is marked */
export const formTemplate = (convention: Pick<ResolvedConvention, 'brownSticker'>): CardTemplate | undefined =>
  convention.brownSticker ? cardTemplates.find((t) => t.brownSticker === convention.brownSticker) : undefined

/** The forms a profile needs: one per convention it plays that is marked, in the content's order */
export function brownStickerForms(resolution: ProfileResolution): BrownStickerForm[] {
  return resolution.conventions.flatMap((convention) => {
    const template = formTemplate(convention)
    return template ? [{ template, convention }] : []
  })
}

/** What a form says when its convention names none of its cells */
export const DEFAULT_FORM_SLOTS = ['description <- *']

/**
 * The resolution a form is filled from: `slug` alone, with the default entries when it names
 * none of the form's cells; undefined when the profile does not play it or it is not marked for
 * this form.
 */
export function formResolution(
  resolution: ProfileResolution,
  template: CardTemplate,
  slug: string,
): ProfileResolution | undefined {
  const convention = resolution.conventions.find((c) => c.slug === slug)
  if (!convention || !template.brownSticker || convention.brownSticker !== template.brownSticker) return undefined
  const own = (convention.cardSlots ?? []).some((entry) => parseCardSlot(entry)?.slot.startsWith(`${template.id}.`))
  const cardSlots = own
    ? convention.cardSlots
    : [...(convention.cardSlots ?? []), ...DEFAULT_FORM_SLOTS.map((entry) => `${template.id}.${entry}`)]
  return { ...resolution, conventions: [{ ...convention, cardSlots }] }
}
