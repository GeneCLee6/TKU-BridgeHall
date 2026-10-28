/**
 * The hand conditions editors fill in on the report page /integrations/table (E7 e7-t08, AC-7.1):
 * finding the club's response rows a converted row came from, writing `conditions` on them, and
 * the form's text fields. The conditions sit beside the row's words and never change them
 * (CLAUDE.md rule 1); `toSystemSpec` turns a row that has them into rules (docs/SYSTEM-SPEC.md §8).
 * Only the lazy report page imports this.
 */

import type { Convention, RowConditions, Section } from '../types/convention.ts'
import {
  SPEC_ANY,
  auctionPatterns,
  conditionsProblem,
  expandCall,
  type SpecRef,
  type SpecRule,
  type SpecShows,
  type SpecSuit,
  type SystemSpec,
  type Unresolved,
  type UnresolvedReason,
} from './systemSpec.ts'

/** The reasons conditions can mend: the auction and call were read, the words were not */
export const FILLABLE: ReadonlySet<UnresolvedReason> = new Set(['alternatives', 'bracketed', 'noConditions'])

export const SUITS: readonly SpecSuit[] = ['S', 'H', 'D', 'C']

/**
 * A row to fill in: where it is, its words and auction, and which of the row's calls it covers.
 * `call` is the handbook's ('3C/D') for an unresolved row, the robot's ('3C') for a filled rule.
 */
export interface ConditionsTarget {
  ref: SpecRef
  text: string
  after: string[]
  /** The call as the report shows it */
  call: string
  matches: (rowCall: string) => boolean
  /** What the row shows now: its conditions, or what the patterns read */
  shows?: SpecShows
}

export const unresolvedTarget = (u: Unresolved): ConditionsTarget | null =>
  FILLABLE.has(u.reason) && u.after
    ? { ref: u.ref, text: u.text, after: u.after, call: u.call, matches: (c) => c === u.call, shows: u.shows }
    : null

/** The rows the editors filled in, once each (a '3C/D' row is two rules) */
export function filledTargets(spec: SystemSpec): Array<ConditionsTarget & { rules: SpecRule[] }> {
  const byRow = new Map<string, SpecRule[]>()
  for (const rule of spec.rules) {
    if (!rule.filled) continue
    const key = JSON.stringify([rule.ref, rule.after, rule.text, rule.shows])
    byRow.set(key, [...(byRow.get(key) ?? []), rule])
  }
  return [...byRow.values()].map((rules) => {
    const [first] = rules
    const calls = rules.map((r) => r.call)
    return {
      ref: first.ref,
      text: first.text,
      after: first.after,
      call: calls.join('/'),
      matches: (c) => {
        const expanded = expandCall(c)
        return !!expanded && calls.every((call) => expanded.includes(call))
      },
      shows: first.shows,
      rules,
    }
  })
}

export interface RowPlace {
  blockIndex: number
  rowIndex: number
}

function findSection(sections: readonly Section[], id: string): Section | undefined {
  for (const s of sections) {
    if (s.id === id) return s
    const child = s.children && findSection(s.children, id)
    if (child) return child
  }
  return undefined
}

/**
 * Where the target's row is in the club's convention: the same section, call and words, under the
 * same auction. Empty when the club's row reads differently (a profile changed it, or it was edited
 * since); more than one only for rows that are the same in every way.
 */
export function findRows(convention: Convention, target: ConditionsTarget): RowPlace[] {
  const section = findSection(convention.sections, target.ref.sectionId)
  const places: RowPlace[] = []
  const after = JSON.stringify(target.after)
  section?.blocks?.forEach((block, blockIndex) => {
    if (block.kind !== 'responses' || !block.auction) return
    const read = auctionPatterns(block.auction.calls)
    if (!('after' in read) || JSON.stringify(read.after) !== after) return
    block.rows.forEach((row, rowIndex) => {
      if (row.meaning === target.text && target.matches(row.call)) places.push({ blockIndex, rowIndex })
    })
  })
  return places
}

/** A copy of the convention with the rows' conditions set, or removed when `conditions` is null */
export function withConditions(
  convention: Convention,
  sectionId: string,
  places: readonly RowPlace[],
  conditions: RowConditions | null,
): Convention {
  const next = structuredClone(convention)
  const section = findSection(next.sections, sectionId)
  for (const { blockIndex, rowIndex } of places) {
    const block = section?.blocks?.[blockIndex]
    const row = block?.kind === 'responses' ? block.rows[rowIndex] : undefined
    if (!row) continue
    if (conditions) row.conditions = structuredClone(conditions)
    else delete row.conditions
  }
  return next
}

// ── The form ───────────────────────────────────────────────────────────────────────────────

export interface RangeDraft {
  low: string
  high: string
}

export interface ConditionsDraft {
  hcp: RangeDraft
  len: Record<SpecSuit, RangeDraft>
  forcing: '' | 'oneRound' | 'game'
}

const rangeDraft = (r?: readonly [number, number]): RangeDraft =>
  r ? { low: String(r[0]), high: r[1] >= SPEC_ANY ? '' : String(r[1]) } : { low: '', high: '' }

/** The form for what the row shows now (an empty top is no upper limit) */
export function draftFrom(shows?: SpecShows): ConditionsDraft {
  return {
    hcp: rangeDraft(shows?.hcp),
    len: { S: rangeDraft(shows?.len?.S), H: rangeDraft(shows?.len?.H), D: rangeDraft(shows?.len?.D), C: rangeDraft(shows?.len?.C) },
    forcing: shows?.forcing ?? '',
  }
}

/**
 * The conditions the form says, or the problem with them in words. A range with only a top starts
 * at 0; with only a bottom it has no upper limit.
 */
export function conditionsFrom(draft: ConditionsDraft): { conditions: RowConditions } | { problem: string } {
  const read = (r: RangeDraft): [number, number] | null | 'bad' => {
    const [low, high] = [r.low.trim(), r.high.trim()]
    if (!low && !high) return null
    const n = (s: string) => (/^\d{1,2}$/.test(s) ? Number(s) : NaN)
    const range: [number, number] = [low ? n(low) : 0, high ? n(high) : SPEC_ANY]
    return range.some(Number.isNaN) ? 'bad' : range
  }
  const conditions: RowConditions = {}
  const hcp = read(draft.hcp)
  if (hcp === 'bad') return { problem: '點力要填整數' }
  if (hcp) conditions.hcp = hcp
  for (const suit of SUITS) {
    const len = read(draft.len[suit])
    if (len === 'bad') return { problem: '張數要填整數' }
    if (len) conditions.len = { ...conditions.len, [suit]: len }
  }
  if (draft.forcing) conditions.forcing = draft.forcing
  const problem = conditionsProblem(conditions)
  return problem ? { problem } : { conditions }
}
