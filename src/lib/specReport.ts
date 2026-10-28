/**
 * The report page's sums (E7 e7-t04, AC-7.2): the handbook's rules (`toSystemSpec`) set beside what
 * TKB's rules say the same call shows after the same auction (POST /api/book/robot-meanings). Only
 * the parts the handbook's words state are compared (docs/SYSTEM-SPEC.md §5): points, lengths,
 * balanced, forcing and the convention's name; what the robot adds on its own is not a difference.
 * Nothing here changes either side: the report only shows them.
 */

import type { RobotMeaningsItem, RobotMeaningsQuery, RobotShows } from './api.ts'
import {
  SPEC_ANY,
  type SpecRange,
  type SpecRule,
  type SpecSuit,
  type SystemSpec,
  type Unresolved,
  type UnresolvedReason,
} from './systemSpec.ts'

/** A part of what a call shows: 'hcp', 'len' (with its suit), 'balanced', 'forcing', 'name' */
export type ShowsField = 'hcp' | 'balanced' | 'forcing' | 'name' | `len${SpecSuit}`

export interface Mismatch {
  rule: SpecRule
  /** The auction (a `Book.after` pattern) of the rule that differs */
  after: string
  /** TKB's meaning; null when none of its rules makes the call after this auction */
  robot: RobotShows | null
  /** What differs; empty when `robot` is null */
  fields: ShowsField[]
}

/** The auctions to ask about, each once, with every call the handbook has after it */
export function meaningQueries(spec: SystemSpec): RobotMeaningsQuery['items'] {
  const calls = new Map<string, Set<string>>()
  for (const rule of spec.rules)
    for (const after of rule.after) {
      const set = calls.get(after) ?? new Set<string>()
      set.add(rule.call)
      calls.set(after, set)
    }
  return [...calls].map(([after, set]) => ({ after, calls: [...set] }))
}

/** `items` in batches of `size` */
export function batches<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

const SUITS: readonly SpecSuit[] = ['S', 'H', 'D', 'C']

/** A range with every open top written the same way (13 cards, 37 points) */
const open = ([low, high]: SpecRange, top: number): string =>
  `${Math.max(0, low)}-${high >= top ? SPEC_ANY : high}`
const sameRange = (a: SpecRange | undefined, b: SpecRange | undefined, top: number) =>
  !!a && !!b && open(a, top) === open(b, top)

/** The parts the handbook states that TKB's meaning says otherwise or leaves out */
export function differences(rule: SpecRule, robot: RobotShows): ShowsField[] {
  const book = rule.shows
  const fields: ShowsField[] = []
  if (book.hcp && !sameRange(book.hcp, robot.hcp, 37)) fields.push('hcp')
  for (const suit of SUITS)
    if (book.len?.[suit] && !sameRange(book.len[suit], robot.len?.[suit], 13))
      fields.push(`len${suit}`)
  if (book.balanced && robot.balanced !== true) fields.push('balanced')
  if (book.forcing && robot.forcing !== book.forcing) fields.push('forcing')
  if (book.name && robot.name !== book.name) fields.push('name')
  return fields
}

/**
 * Every rule whose call TKB has no rule for after that auction, or whose meaning differs. An
 * auction the answers do not cover is left out (not asked yet)
 */
export function compareSpec(spec: SystemSpec, answers: readonly RobotMeaningsItem[]): Mismatch[] {
  const byAfter = new Map(answers.map((a) => [a.after, a.meanings]))
  const out: Mismatch[] = []
  for (const rule of spec.rules)
    for (const after of rule.after) {
      const meanings = byAfter.get(after)
      if (!meanings || !(rule.call in meanings)) continue
      const robot = meanings[rule.call]
      if (!robot) out.push({ rule, after, robot: null, fields: [] })
      else {
        const fields = differences(rule, robot)
        if (fields.length) out.push({ rule, after, robot, fields })
      }
    }
  return out
}

/** The unresolved rows by reason, the reasons in the order of the report */
export const REASONS: readonly UnresolvedReason[] = [
  'pending',
  'noAuction',
  'noQuestion',
  'auctionCell',
  'call',
  'alternatives',
  'bracketed',
  'noConditions',
]

export function unresolvedByReason(
  spec: SystemSpec,
): { reason: UnresolvedReason; rows: Unresolved[] }[] {
  return REASONS.map((reason) => ({
    reason,
    rows: spec.unresolved.filter((u) => u.reason === reason),
  })).filter((g) => g.rows.length)
}

/** Whether two specs say the same (the synced one and the one made now) */
export const sameSpec = (a: SystemSpec, b: SystemSpec) => JSON.stringify(a) === JSON.stringify(b)
