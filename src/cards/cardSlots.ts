// A convention's `cardSlots` (E1 keeps them as plain strings, so the Worker and the editor need no
// change): where on a convention card the convention goes, and what fills the place.
//
//   <slot>[ = <value>][ <- <ref>]
//
// - `slot`: a slot id from src/cards/slots.ts, e.g. `wbf.openings.1NT.responses`.
// - `ref`: where the text comes from, in the same convention, so every filled cell points back to
//   the handbook. `*` is the whole convention; `<sectionId>` a section with everything under it;
//   `<sectionId>#<block>` one of the section's own blocks (from 0); `<sectionId>#<block>:<row>` one
//   row of a `responses` block or one item of a `rules` block.
// - `value`: fixed text instead of the ref's text (English written by the officers for the WBF
//   card), `✓` for a tick, or the option id of a `choice`. A `check` needs no value: the ref ticks it.
//
// Every entry needs a slot and at least one of the two. Examples:
//   wbf.openings.1NT.responses <- responses#0
//   ctcba-simple.nt.stayman <- responses#0:0
//   ctcba-simple.signals.discard-suit = odd-even <- suit-discards#0

import type { Origin, ResolvedBlock, ResolvedConvention, ResolvedSection } from '../lib/profiles.ts'
import { formatCall } from '../lib/calls.ts'
import type { Auction, RuleItem } from '../types/convention.ts'

export type CardSlotRef =
  | { kind: 'convention' }
  | { kind: 'section'; sectionId: string; block?: number; row?: number }

export interface CardSlotEntry {
  slot: string
  value?: string
  ref?: CardSlotRef
}

/** The tick a value can ask for */
export const TICK = '✓'

const SLOT = /^[a-z][a-z0-9-]*(\.[A-Za-z0-9][A-Za-z0-9-]*)+$/
const REF = /^([a-z0-9][a-z0-9-]*)(?:#(\d+)(?::(\d+))?)?$/

/** Reads one `cardSlots` entry; null when it is not one */
export function parseCardSlot(entry: string): CardSlotEntry | null {
  let rest = entry.trim()
  let ref: CardSlotRef | undefined
  const arrow = rest.lastIndexOf(' <- ')
  if (arrow >= 0) {
    const text = rest.slice(arrow + 4).trim()
    rest = rest.slice(0, arrow).trim()
    if (text === '*') ref = { kind: 'convention' }
    else {
      const m = REF.exec(text)
      if (!m) return null
      ref = {
        kind: 'section',
        sectionId: m[1]!,
        ...(m[2] !== undefined && { block: Number(m[2]) }),
        ...(m[3] !== undefined && { row: Number(m[3]) }),
      }
    }
  }
  let value: string | undefined
  const equals = rest.indexOf(' = ')
  if (equals >= 0) {
    value = rest.slice(equals + 3).trim()
    rest = rest.slice(0, equals).trim()
    if (!value) return null
  }
  if (!SLOT.test(rest) || (!ref && value === undefined)) return null
  return { slot: rest, ...(value !== undefined && { value }), ...(ref && { ref }) }
}

/** Writes an entry back as `parseCardSlot` reads it */
export function formatCardSlot(entry: CardSlotEntry): string {
  const ref = !entry.ref
    ? ''
    : entry.ref.kind === 'convention'
      ? ' <- *'
      : ` <- ${entry.ref.sectionId}${entry.ref.block === undefined ? '' : `#${entry.ref.block}`}${entry.ref.row === undefined ? '' : `:${entry.ref.row}`}`
  return `${entry.slot}${entry.value === undefined ? '' : ` = ${entry.value}`}${ref}`
}

/** What a ref points at, as card text */
export interface SourceText {
  /** One entry per row, rule item or paragraph, in order; the card joins them, a note page lists them */
  lines: string[]
  /** The section's title (or the convention's name for `*`), for the note page */
  title: string
  /** Something in it is marked 待確認 in the handbook */
  pending: boolean
  /** The deepest profile layer that overrode any of it; absent when it is the handbook's own */
  origin?: Origin
}

const DEPTH: Record<Origin, number> = { club: 0, team: 1, partnership: 2 }

/** The more specific of two origins */
export function deeperOrigin(a: Origin | undefined, b: Origin | undefined): Origin | undefined {
  if (!a) return b
  if (!b) return a
  return DEPTH[b] > DEPTH[a] ? b : a
}

/** Card text: the source's **bold** marks dropped, white space collapsed */
const plain = (text: string) => text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()

const auctionText = (auction: Auction) =>
  auction.calls
    .map((c) => (typeof c === 'string' ? c : c.call))
    .filter((c) => c !== '')
    .map((c) => (c === '?' || c === '---' ? c : formatCall(c)))
    .join(' ')

function ruleLines(items: RuleItem[]): string[] {
  return items.map((item) => {
    const children = item.children?.length ? ` (${ruleLines(item.children).join('; ')})` : ''
    return plain(item.text) + children
  })
}

const rulePending = (items: RuleItem[]): boolean =>
  items.some((i) => !!i.pending || (!!i.children && rulePending(i.children)))

interface Collected {
  lines: string[]
  pending: boolean
  origin?: Origin
}

/** A block as card lines; `heading` adds the auction or caption before a table (note pages only) */
function blockLines(block: ResolvedBlock, heading: boolean): Collected {
  switch (block.kind) {
    case 'paragraph':
      return { lines: [plain(block.text)], pending: !!block.pending }
    case 'note':
      return { lines: [plain(block.text)], pending: false }
    case 'rules':
      return { lines: ruleLines(block.items), pending: rulePending(block.items) }
    case 'hand':
      return { lines: [], pending: false }
    case 'responses': {
      const head = heading && block.auction ? [auctionText(block.auction)] : heading && block.caption ? [plain(block.caption)] : []
      let origin: Origin | undefined
      for (const row of block.rows) origin = deeperOrigin(origin, row.origin)
      return {
        lines: [...head, ...block.rows.map((r) => `${formatCall(r.call)}=${plain(r.meaning)}`)],
        pending: block.rows.some((r) => !!r.pending),
        ...(origin && { origin }),
      }
    }
  }
}

function sectionLines(section: ResolvedSection, withTitle: boolean): Collected {
  const out: Collected = {
    lines: withTitle ? [`【${plain(section.title)}】`] : [],
    pending: !!section.pending,
    ...(section.origin && { origin: section.origin }),
  }
  for (const block of section.blocks ?? []) {
    const b = blockLines(block, true)
    out.lines.push(...b.lines)
    out.pending ||= b.pending
    out.origin = deeperOrigin(out.origin, b.origin)
  }
  for (const child of section.children ?? []) {
    const c = sectionLines(child, true)
    out.lines.push(...c.lines)
    out.pending ||= c.pending
    out.origin = deeperOrigin(out.origin, c.origin)
  }
  return out
}

function findSection(sections: readonly ResolvedSection[], id: string): ResolvedSection | undefined {
  for (const s of sections) {
    if (s.id === id) return s
    const found = s.children && findSection(s.children, id)
    if (found) return found
  }
  return undefined
}

export type MissingRef = 'section' | 'block' | 'row'

/** The text a ref points at in a (resolved) convention, or what is missing */
export function sourceText(
  convention: ResolvedConvention,
  ref: CardSlotRef,
  name: string,
): SourceText | { missing: MissingRef } {
  if (ref.kind === 'convention') {
    const all: Collected = { lines: [], pending: false, origin: convention.origin }
    for (const section of convention.sections) {
      const s = sectionLines(section, true)
      all.lines.push(...s.lines)
      all.pending ||= s.pending
      all.origin = deeperOrigin(all.origin, s.origin)
    }
    return { title: name, ...withoutEmptyOrigin(all) }
  }
  const section = findSection(convention.sections, ref.sectionId)
  if (!section) return { missing: 'section' }
  const title = plain(section.title)
  if (ref.block === undefined) return { title, ...withoutEmptyOrigin(sectionLines(section, false)) }
  const block = section.blocks?.[ref.block]
  if (!block) return { missing: 'block' }
  if (ref.row === undefined) {
    const b = blockLines(block, false)
    return { title, ...withoutEmptyOrigin({ ...b, origin: deeperOrigin(section.origin, b.origin) }) }
  }
  if (block.kind === 'responses') {
    const row = block.rows[ref.row]
    if (!row) return { missing: 'row' }
    const origin = deeperOrigin(section.origin, row.origin)
    return {
      title,
      lines: [`${formatCall(row.call)}=${plain(row.meaning)}`],
      pending: !!row.pending,
      ...(origin && { origin }),
    }
  }
  if (block.kind === 'rules') {
    const item = block.items[ref.row]
    if (!item) return { missing: 'row' }
    return {
      title,
      lines: ruleLines([item]),
      pending: rulePending([item]),
      ...(section.origin && { origin: section.origin }),
    }
  }
  return { missing: 'row' }
}

function withoutEmptyOrigin<T extends { origin?: Origin }>(value: T): T {
  if (value.origin) return value
  const { origin: _origin, ...rest } = value
  return rest as T
}
