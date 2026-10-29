// Hand edits of convention cards (E3, e3-t06), kept with the system profile as
// `profile.cardEdits` (TKU-BridgeTable shared/protocol.ts `ProfileCardEdit`). Like adoptions and
// overrides they inherit: a team's card shows the club's edits, the team's own replace them slot
// by slot, and a partnership's replace both. Removing an edit (重設) shows the parent's again, or
// what the conventions filled.
//
// Edits are kept under the slot ids of the template that owns the cells: the two-sided simple
// card shares the single-sided card's cells (`sameSlotsAs`), so an edit made on either shows on
// both. A Brown Sticker form is one per convention (cards/bsc.ts): its edits are kept under the
// template id and the convention's slug, `bsc-opening.<slug>.<cell>`.

import type { ProfileCardEdit, SystemProfile } from '../lib/api.ts'
import type { Origin, ProfileResolution } from '../lib/profiles.ts'
import { formResolution } from './bsc.ts'
import { type CardEdit, type CardEdits, type FilledCard, fillCard } from './fill.ts'
import type { CardTemplate } from './types.ts'

/** The prefix edits on this card are kept under; `form` is a Brown Sticker form's convention */
export const editPrefix = (template: CardTemplate, form?: string) =>
  form ? `${template.id}.${form}` : (template.sameSlotsAs ?? template.id)

/** A slot id on this card as kept in `cardEdits` */
export function storedSlot(template: CardTemplate, slot: string, form?: string): string {
  const prefix = `${template.id}.`
  return slot.startsWith(prefix) ? `${editPrefix(template, form)}.${slot.slice(prefix.length)}` : slot
}

/** The edits that belong to this card, by its own slot ids */
export function editsFor(
  template: CardTemplate,
  stored: Record<string, ProfileCardEdit> = {},
  form?: string,
): CardEdits {
  const prefix = `${editPrefix(template, form)}.`
  const edits: CardEdits = {}
  for (const [slot, edit] of Object.entries(stored)) {
    if (slot.startsWith(prefix)) edits[`${template.id}.${slot.slice(prefix.length)}`] = edit
  }
  return edits
}

/** Whether an edit changes nothing (then it is not kept) */
export const emptyEdit = (edit: CardEdit) =>
  edit.text === undefined && edit.checked === undefined && edit.option === undefined && !edit.flagged

/**
 * `stored` with one slot's edit replaced, or removed when `edit` is undefined or changes nothing;
 * undefined when no edits are left. Never changes its arguments.
 */
export function setCardEdit(
  stored: Record<string, ProfileCardEdit> | undefined,
  slot: string,
  edit: CardEdit | undefined,
): Record<string, ProfileCardEdit> | undefined {
  const next = { ...stored }
  delete next[slot]
  if (edit && !emptyEdit(edit)) {
    const kept: ProfileCardEdit = {}
    if (edit.text !== undefined) kept.text = edit.text
    if (edit.checked !== undefined) kept.checked = edit.checked
    if (edit.option !== undefined) kept.option = edit.option
    if (edit.flagged) kept.flagged = true
    next[slot] = kept
  }
  return Object.keys(next).length ? next : undefined
}

/**
 * Fills `template` for a resolved profile with the edits of every profile in its chain, club
 * first, then `own` for the profile itself (by default the ones it has saved; the card page
 * passes the ones being edited). Each edited cell's `origin` is the layer whose edit it shows.
 * A Brown Sticker form is filled for the convention `form` (cards/bsc.ts); undefined when the
 * profile does not play it marked for this form.
 */
export function fillProfileCard(
  template: CardTemplate,
  resolution: ProfileResolution,
  own?: Record<string, ProfileCardEdit>,
): FilledCard
export function fillProfileCard(
  template: CardTemplate,
  resolution: ProfileResolution,
  own: Record<string, ProfileCardEdit> | undefined,
  form: string,
): FilledCard | undefined
export function fillProfileCard(
  template: CardTemplate,
  resolution: ProfileResolution,
  own: Record<string, ProfileCardEdit> | undefined = resolution.profile.cardEdits,
  form?: string,
): FilledCard | undefined {
  const source = form === undefined ? resolution : formResolution(resolution, template, form)
  if (!source) return undefined
  const layers: { scope: Origin; edits: CardEdits }[] = resolution.chain.map((p: SystemProfile) => ({
    scope: p.scope,
    edits: editsFor(template, p.id === resolution.profile.id ? own : p.cardEdits, form),
  }))
  const edits: CardEdits = {}
  const origins = new Map<string, Origin>()
  for (const layer of layers) {
    for (const [slot, edit] of Object.entries(layer.edits)) {
      edits[slot] = edit
      origins.set(slot, layer.scope)
    }
  }
  const card = fillCard(template, source, edits)
  for (const [slot, origin] of origins) {
    const cell = card.cells[slot]
    if (cell) cell.origin = origin
  }
  return card
}
