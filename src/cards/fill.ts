// Filling a convention card (E3, e3-t03): a pure function from a template and a resolved system
// profile to what each cell says. The preview page (e3-t05), print styles and .docx output render
// the result; nothing here knows about React or storage.
//
// Three sources, later ones winning:
// 1. The conventions' `cardSlots` (src/cards/cardSlots.ts): the profile's conventions as
//    `resolveProfile` gives them, so a convention the profile does not play fills nothing and an
//    overridden row or section fills its overridden text.
// 2. That covers profile overrides: the cell carries the overriding layer's `origin`.
// 3. Hand edits (`CardEdits`, to be kept as `profile.cardEdits` by e3-t06): replace the cell, with
//    the profile's own scope as `origin`.
//
// Condensing: a ref's rows become `call=meaning`, rules and paragraphs their text, joined with
// "; " on a one-line cell and one entry per line on a multi-line one. What does not fit (judged
// from the cell's width in points and the card's font size) is replaced, longest first, by
// "<convention name> [Note n]", and the full text goes to the supplementary pages (`notes`),
// numbered in print order.

import type { Origin, ProfileResolution, ResolvedConvention } from '../lib/profiles.ts'
import {
  type CardSlotEntry,
  type MissingRef,
  type SourceText,
  TICK,
  deeperOrigin,
  parseCardSlot,
  sourceText,
} from './cardSlots.ts'
import { templateSlots } from './slots.ts'
import type { CardBlock, CardTemplate, CardTemplateId } from './types.ts'

/** A hand edit of one cell; fields left out keep what the conventions filled */
export interface CardEdit {
  text?: string
  checked?: boolean
  option?: string
  /** Marked for the partnership to look at */
  flagged?: boolean
}

/** Hand edits by slot id */
export type CardEdits = Record<string, CardEdit>

/** Where a cell's content came from: a convention's `cardSlots` entry */
export interface CellSource {
  slug: string
  /** The entry as written in `cardSlots` */
  entry: string
  /** The section the entry points at, for the 「§」 link back */
  sectionId?: string
}

export interface FilledCell {
  slot: string
  /** Cell text; lines separated by "\n" on a multi-line cell */
  text?: string
  /** A ticked check, or a check-like table cell */
  checked?: boolean
  /** The chosen option of a `choice` */
  option?: string
  sources: CellSource[]
  /** Supplementary note numbers the text refers to */
  notes?: number[]
  /** The profile layer whose override or edit this is; absent when it is the handbook's own */
  origin?: Origin
  /** Some of the source is marked 待確認 in the handbook */
  pending?: true
  /** Still longer than the cell after moving everything it could to notes */
  overflow?: true
  edited?: true
  flagged?: true
}

/** A supplementary page entry: the full text a cell refers to as [Note n] */
export interface CardNote {
  n: number
  slot: string
  slug: string
  sectionId?: string
  /** The convention's name in the card's language, then the section's title when it is one section */
  title: string
  lines: string[]
  pending?: true
  origin?: Origin
}

export type FillProblem =
  /** Not a `cardSlots` entry at all */
  | { kind: 'badEntry'; slug: string; entry: string }
  /** Names this card but a slot it does not have */
  | { kind: 'unknownSlot'; slug: string; entry: string }
  /** Points at a section, block or row the convention does not have (after the profile's overrides) */
  | { kind: 'brokenRef'; slug: string; entry: string; missing: MissingRef }
  /** A value the cell cannot take: an option a choice does not have, or no value for a choice */
  | { kind: 'badValue'; slug: string; entry: string }
  /** A hand edit for a slot the card does not have */
  | { kind: 'unknownEdit'; slot: string }

export interface FilledCard {
  templateId: CardTemplateId
  profileId: string
  /** Filled cells by slot id, in print order; a cell nobody filled is left out */
  cells: Record<string, FilledCell>
  notes: CardNote[]
  problems: FillProblem[]
}

/** Width of a text in half-width characters: CJK, full-width forms and suit symbols count two */
export function textWidth(text: string): number {
  let width = 0
  for (const ch of text) width += /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦♠♥♦♣]/u.test(ch) ? 2 : 1
  return width
}

/** How much a slot holds: printed lines, half-width characters per line, and a label sharing the first line */
export interface SlotSpace {
  lines: number
  chars: number
  label: number
}

/** Every slot's space, from the template's widths, print width and font size */
export function slotSpaces(template: CardTemplate): Map<string, SlotSpace> {
  const perPercent = template.printWidth / 100 / (template.fontSize / 2)
  const chars = (percent: number) => Math.max(1, Math.floor(percent * perPercent))
  const spaces = new Map<string, SlotSpace>()
  const visit = (blocks: CardBlock[], width: number) => {
    for (const block of blocks) {
      const id = `${template.id}.${block.id}`
      switch (block.kind) {
        case 'heading':
        case 'banner':
        case 'note':
          break
        case 'cells':
          spaces.set(id, { lines: block.lines, chars: chars(width), label: 0 })
          break
        case 'text':
          spaces.set(id, {
            lines: block.lines,
            chars: chars(width),
            label: textWidth(block.label) + 1 + (block.suffix ? textWidth(block.suffix) + 1 : 0),
          })
          break
        case 'check':
        case 'choice':
          spaces.set(id, { lines: 1, chars: chars(width), label: 0 })
          break
        case 'group': {
          const columns = block.columns
          block.blocks.forEach((child, j) => {
            const w = block.widths ? (width * block.widths[1 + (j % columns)]!) / 100 : width / columns
            visit([child], w)
          })
          break
        }
        case 'split':
          for (const part of block.parts) visit(part.blocks, (width * part.width) / 100)
          break
        case 'table': {
          const insetFrom = block.inset ? block.rows.findIndex((r) => r.id === block.inset!.fromRow) : -1
          block.rows.forEach((row, r) => {
            for (const column of block.columns) {
              if (insetFrom >= 0 && r >= insetFrom && block.inset!.columns.includes(column.id)) continue
              spaces.set(`${id}.${row.id}.${column.id}`, {
                lines: row.lines ?? 1,
                chars: chars((width * column.width) / 100),
                label: 0,
              })
            }
          })
          if (block.inset) {
            const insetWidth = block.columns
              .filter((c) => block.inset!.columns.includes(c.id))
              .reduce((sum, c) => sum + (width * c.width) / 100, 0)
            visit([block.inset.block], insetWidth)
          }
          break
        }
      }
    }
  }
  for (const page of template.pages) for (const column of page.columns) visit(column.blocks, column.width)
  return spaces
}

/** One thing written into a cell */
type Piece =
  | { kind: 'text'; text: string }
  | { kind: 'source'; text: string; source: SourceText; name: string; slug: string; sectionId?: string; note?: true }

interface Contribution {
  convention: ResolvedConvention
  entry: string
  parsed: CardSlotEntry
  source?: SourceText
}

/** Lines a set of pieces takes in a slot */
function linesNeeded(pieces: string[], space: SlotSpace): number {
  if (space.lines > 1) {
    return pieces.reduce((sum, text, i) => sum + Math.ceil((textWidth(text) + (i === 0 ? space.label : 0)) / space.chars), 0)
  }
  const total = space.label + textWidth(pieces.join('; '))
  return Math.ceil(total / space.chars)
}

const noteLabel = (name: string, n: number | string, bare: boolean) => (bare ? `[Note ${n}]` : `${name} [Note ${n}]`)

type SourcePiece = Extract<Piece, { kind: 'source' }>

/** A piece as the cell shows it, with a placeholder note number while fitting */
const shownText = (p: Piece, bare: boolean) => (p.kind === 'source' && p.note ? noteLabel(p.name, 99, bare) : p.text)

/**
 * What `template` says for the profile `resolution` describes: the cells its conventions fill, then
 * `edits` on top. Never changes its arguments; the same input gives the same card.
 */
export function fillCard(template: CardTemplate, resolution: ProfileResolution, edits: CardEdits = {}): FilledCard {
  const slots = templateSlots(template)
  const blockOf = new Map(slots.map((s) => [s.id, s.block]))
  const spaces = slotSpaces(template)
  const prefixes = [template.id, ...(template.sameSlotsAs ? [template.sameSlotsAs] : [])]
  const problems: FillProblem[] = []
  const nameOf = (c: ResolvedConvention) => (template.language === 'en' ? c.nameEn || c.nameZh : c.nameZh)

  // 1. Collect what each convention puts where
  const bySlot = new Map<string, Contribution[]>()
  for (const convention of resolution.conventions) {
    for (const entry of convention.cardSlots ?? []) {
      const parsed = parseCardSlot(entry)
      if (!parsed) {
        problems.push({ kind: 'badEntry', slug: convention.slug, entry })
        continue
      }
      const prefix = prefixes.find((p) => parsed.slot.startsWith(`${p}.`))
      if (!prefix) continue // another card's slot
      const slot = `${template.id}${parsed.slot.slice(prefix.length)}`
      const block = blockOf.get(slot)
      if (!block) {
        problems.push({ kind: 'unknownSlot', slug: convention.slug, entry })
        continue
      }
      if (block.kind === 'choice' && !block.options.some((o) => o.id === parsed.value)) {
        problems.push({ kind: 'badValue', slug: convention.slug, entry })
        continue
      }
      let source: SourceText | undefined
      if (parsed.ref) {
        const found = sourceText(convention, parsed.ref, nameOf(convention))
        if ('missing' in found) {
          problems.push({ kind: 'brokenRef', slug: convention.slug, entry, missing: found.missing })
          continue
        }
        source = found
      }
      bySlot.set(slot, [...(bySlot.get(slot) ?? []), { convention, entry, parsed, ...(source && { source }) }])
    }
  }

  // 2. Build the cells in print order; text cells keep their pieces until notes are numbered
  const cells = new Map<string, FilledCell>()
  const pieces = new Map<string, Piece[]>()
  for (const { id } of slots) {
    const contributions = bySlot.get(id)
    if (!contributions) continue
    const block = blockOf.get(id)!
    let origin: Origin | undefined
    let pending = false
    const sources: CellSource[] = []
    for (const c of contributions) {
      origin = deeperOrigin(origin, c.source?.origin)
      pending ||= !!c.source?.pending
      const ref = c.parsed.ref
      sources.push({ slug: c.convention.slug, entry: c.entry, ...(ref?.kind === 'section' && { sectionId: ref.sectionId }) })
    }
    const cell: FilledCell = { slot: id, sources, ...(origin && { origin }), ...(pending && { pending: true as const }) }
    if (block.kind === 'check') {
      cell.checked = true
      const blank = contributions.map((c) => c.parsed.value).filter((v): v is string => !!v && v !== TICK)
      if (blank.length) cell.text = blank.join('; ')
    } else if (block.kind === 'choice') {
      cell.option = contributions[0]!.parsed.value!
    } else if (contributions.every((c) => c.parsed.value === TICK)) {
      cell.checked = true
    } else {
      pieces.set(
        id,
        contributions.map((c): Piece => {
          if (c.parsed.value !== undefined) return { kind: 'text', text: c.parsed.value }
          const ref = c.parsed.ref
          return {
            kind: 'source',
            text: c.source!.lines.join('; '),
            source: c.source!,
            name: nameOf(c.convention),
            slug: c.convention.slug,
            ...(ref?.kind === 'section' && { sectionId: ref.sectionId }),
          }
        }),
      )
    }
    cells.set(id, cell)
  }

  // 3. Hand edits replace what the conventions wrote
  for (const [slot, edit] of Object.entries(edits)) {
    if (!blockOf.has(slot)) {
      problems.push({ kind: 'unknownEdit', slot })
      continue
    }
    const cell: FilledCell = cells.get(slot) ?? { slot, sources: [] }
    if (edit.text !== undefined) {
      pieces.delete(slot)
      cell.text = edit.text
    }
    if (edit.checked !== undefined) cell.checked = edit.checked
    if (edit.option !== undefined) cell.option = edit.option
    if (edit.flagged) cell.flagged = true
    cell.edited = true
    cell.origin = resolution.profile.scope
    cells.set(slot, cell)
  }

  // 4. Fit the text, moving the longest pieces to notes until it fits; when even the labels are
  //    too long, the notes go without the convention's name
  const bare = new Set<string>()
  for (const [slot, list] of pieces) {
    const space = spaces.get(slot)!
    const fits = () => linesNeeded(list.map((p) => shownText(p, bare.has(slot))), space) <= space.lines
    for (;;) {
      if (fits()) break
      const candidates = list.filter((p): p is SourcePiece => p.kind === 'source' && !p.note)
      if (!candidates.length) break
      const longest = candidates.reduce((a, b) => (textWidth(b.text) > textWidth(a.text) ? b : a))
      longest.note = true
    }
    if (!fits() && list.some((p) => p.kind === 'source' && p.note)) bare.add(slot)
    if (!fits()) cells.get(slot)!.overflow = true
  }

  // 5. Number the notes in print order and write the text
  const notes: CardNote[] = []
  for (const { id } of slots) {
    const list = pieces.get(id)
    if (!list) continue
    const cell = cells.get(id)!
    const numbers: number[] = []
    const texts = list.map((p) => {
      if (p.kind === 'text' || !p.note) return p.text
      const n = notes.length + 1
      numbers.push(n)
      notes.push({
        n,
        slot: id,
        slug: p.slug,
        ...(p.sectionId && { sectionId: p.sectionId }),
        title: p.source.title === p.name ? p.name : `${p.name}: ${p.source.title}`,
        lines: p.source.lines,
        ...(p.source.pending && { pending: true as const }),
        ...(p.source.origin && { origin: p.source.origin }),
      })
      return noteLabel(p.name, n, bare.has(id))
    })
    cell.text = texts.join(spaces.get(id)!.lines > 1 ? '\n' : '; ')
    if (numbers.length) cell.notes = numbers
  }

  const ordered: Record<string, FilledCell> = {}
  for (const { id } of slots) {
    const cell = cells.get(id)
    if (cell) ordered[id] = cell
  }
  return { templateId: template.id, profileId: resolution.profile.id, cells: ordered, notes, problems }
}
