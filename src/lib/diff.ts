import type { Auction, Block, Convention, Hand, ResponseRow, RuleItem, Section } from '../types/convention.ts'
import { formatCall } from './calls.ts'

/**
 * Paragraph-level differences between two versions of a convention (E8 e8-t03, AC-8.3). Sections
 * are matched by id wherever they are in the tree; inside a section every block becomes lines (a
 * paragraph, a rule, a row's meaning…) and the lines are matched in order, a response row by its
 * `call`. Only what differs is returned: added, removed or changed lines, words left to the page.
 *
 * Nothing here judges the content: it reports the words exactly as the two versions have them.
 */

export type DiffOp = 'added' | 'removed' | 'changed'

export type MetaField =
  | 'slug'
  | 'nameZh'
  | 'nameEn'
  | 'aliases'
  | 'category'
  | 'kind'
  | 'level'
  | 'prerequisites'
  | 'cardSlots'
  | 'brownSticker'
  | 'tags'
  | 'summary'
  | 'source'
  | 'updated'

export const metaFields: readonly MetaField[] = [
  'slug',
  'nameZh',
  'nameEn',
  'aliases',
  'category',
  'kind',
  'level',
  'prerequisites',
  'cardSlots',
  'brownSticker',
  'tags',
  'summary',
  'source',
  'updated',
]

/** Where a line is; the page puts it into words */
export type DiffPlace =
  | { at: 'meta'; field: MetaField }
  /** `place`: the parent section changed; `order`: its place among its siblings changed */
  | { at: 'section'; field: 'title' | 'originalTitle' | 'summary' | 'pending' | 'level' | 'place' | 'order' }
  | { at: 'paragraph' }
  | { at: 'note'; tone: 'info' | 'warning' }
  | { at: 'hand' }
  | { at: 'caption' }
  | { at: 'auction' }
  /** A paragraph's or a rule's 待確認 note */
  | { at: 'pending' }
  | { at: 'intro'; part: 'why' | 'when' | 'pitfall' }
  | { at: 'rule'; depth: number }
  | { at: 'row'; call: string; part: 'meaning' | 'note' | 'pending' | 'conditions' }

export interface DiffLine {
  op: DiffOp
  place: DiffPlace
  /** Absent when added */
  before?: string
  /** Absent when removed */
  after?: string
}

export interface SectionDiff {
  id: string
  /** Section titles from the top down to this one, in the newer version (the older when removed) */
  trail: string[]
  /** added or removed: the whole section; changed: something in it */
  op: DiffOp
  lines: DiffLine[]
}

export interface ConventionDiff {
  meta: DiffLine[]
  sections: SectionDiff[]
}

/** True when the two versions read the same */
export const isEmptyDiff = (d: ConventionDiff) => !d.meta.length && !d.sections.length

/** How many lines were added, removed and changed */
export function countDiff(d: ConventionDiff) {
  const counts = { added: 0, removed: 0, changed: 0 }
  for (const line of [...d.meta, ...d.sections.flatMap((s) => s.lines)]) counts[line.op]++
  return counts
}

// ---------------------------------------------------------------------------------------------
// Text

const list = (values: readonly string[] | undefined) => (values?.length ? values.join('、') : undefined)

function metaText(c: Convention, field: MetaField): string | undefined {
  switch (field) {
    case 'aliases':
    case 'prerequisites':
    case 'cardSlots':
    case 'tags':
      return list(c[field])
    case 'source':
      return c.source ? [c.source.title, c.source.note].filter(Boolean).join('／') || undefined : undefined
    default:
      return c[field] || undefined
  }
}

const auctionText = (a: Auction) =>
  `${a.seats.join(' ')}：${a.calls
    .map((c) => (typeof c === 'string' ? formatCall(c) || '—' : `${formatCall(c.call) || '—'}${c.note ? `（${c.note}）` : ''}`))
    .join(' ')}`

const handText = (h: Hand) => `♠${h.spades || '—'} ♥${h.hearts || '—'} ♦${h.diamonds || '—'} ♣${h.clubs || '—'}`

/** One line of a section: `key` matches it with the other version's */
interface Unit {
  key: string
  place: DiffPlace
  text: string
}

/** A unit matched only by being identical: its key is its place and its words */
const plain = (place: DiffPlace, text: string): Unit => ({ key: `${JSON.stringify(place)}|${text}`, place, text })

function ruleUnits(items: RuleItem[], depth: number, out: Unit[]) {
  for (const item of items) {
    out.push(plain({ at: 'rule', depth }, item.text))
    if (item.pending) out.push(plain({ at: 'pending' }, item.pending))
    if (item.children?.length) ruleUnits(item.children, depth + 1, out)
  }
}

function rowUnits(rows: ResponseRow[], table: number, out: Unit[]) {
  const seen = new Map<string, number>()
  for (const row of rows) {
    const n = seen.get(row.call) ?? 0
    seen.set(row.call, n + 1)
    // Matched by its call (the n-th row with that call in the section's table-th table)
    const key = `row|${table}|${row.call}|${n}`
    const call = row.call
    out.push({ key: `${key}|meaning`, place: { at: 'row', call, part: 'meaning' }, text: row.meaning })
    if (row.note) out.push({ key: `${key}|note`, place: { at: 'row', call, part: 'note' }, text: row.note })
    if (row.pending) out.push({ key: `${key}|pending`, place: { at: 'row', call, part: 'pending' }, text: row.pending })
    if (row.conditions)
      out.push({ key: `${key}|conditions`, place: { at: 'row', call, part: 'conditions' }, text: JSON.stringify(row.conditions) })
  }
}

function sectionUnits(section: Section): Unit[] {
  const out: Unit[] = []
  let table = 0
  for (const b of section.blocks ?? []) blockUnits(b, () => table++, out)
  return out
}

function blockUnits(b: Block, nextTable: () => number, out: Unit[]) {
  switch (b.kind) {
    case 'paragraph':
      out.push(plain({ at: 'paragraph' }, b.text))
      if (b.pending) out.push(plain({ at: 'pending' }, b.pending))
      return
    case 'note':
      out.push(plain({ at: 'note', tone: b.tone }, b.text))
      return
    case 'hand':
      out.push(plain({ at: 'hand' }, [b.label, handText(b.hand)].filter(Boolean).join(' ')))
      return
    case 'intro':
      if (b.why) out.push(plain({ at: 'intro', part: 'why' }, b.why))
      if (b.when) out.push(plain({ at: 'intro', part: 'when' }, b.when))
      for (const p of b.pitfalls ?? []) out.push(plain({ at: 'intro', part: 'pitfall' }, p))
      return
    case 'rules':
      ruleUnits(b.items, 0, out)
      return
    case 'responses': {
      const table = nextTable()
      if (b.caption) out.push({ key: `caption|${table}`, place: { at: 'caption' }, text: b.caption })
      if (b.auction) out.push({ key: `auction|${table}`, place: { at: 'auction' }, text: auctionText(b.auction) })
      rowUnits(b.rows, table, out)
      return
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Matching

/** The longest common subsequence of two key lists, as pairs of indexes in order */
function lcs<T>(a: readonly T[], b: readonly T[]): [number, number][] {
  const n = a.length
  const m = b.length
  // Common start and end first: most versions differ in a few places
  let start = 0
  while (start < n && start < m && a[start] === b[start]) start++
  let end = 0
  while (end < n - start && end < m - start && a[n - 1 - end] === b[m - 1 - end]) end++
  const pairs: [number, number][] = []
  for (let i = 0; i < start; i++) pairs.push([i, i])
  const rows = n - start - end
  const cols = m - start - end
  if (rows > 0 && cols > 0) {
    const width = cols + 1
    const table = new Uint32Array((rows + 1) * width)
    for (let i = rows - 1; i >= 0; i--)
      for (let j = cols - 1; j >= 0; j--)
        table[i * width + j] =
          a[start + i] === b[start + j]
            ? table[(i + 1) * width + j + 1] + 1
            : Math.max(table[(i + 1) * width + j], table[i * width + j + 1])
    let i = 0
    let j = 0
    while (i < rows && j < cols) {
      if (a[start + i] === b[start + j]) {
        pairs.push([start + i, start + j])
        i++
        j++
      } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) i++
      else j++
    }
  }
  for (let k = end; k > 0; k--) pairs.push([n - k, m - k])
  return pairs
}

/**
 * Two lines of the same sort that took each other's place are one changed line; rows never are,
 * since a row is its call (a row with another call is another row)
 */
const sameSort = (a: DiffPlace, b: DiffPlace) =>
  a.at === b.at && a.at !== 'row' && (a.at !== 'rule' || b.at !== 'rule' || a.depth === b.depth)

function diffUnits(before: Unit[], after: Unit[]): DiffLine[] {
  const pairs = lcs(
    before.map((u) => u.key),
    after.map((u) => u.key),
  )
  const lines: DiffLine[] = []
  let i = 0
  let j = 0
  const gap = (toI: number, toJ: number) => {
    const removed = before.slice(i, toI)
    const added = after.slice(j, toJ)
    const used = new Set<number>()
    for (const r of removed) {
      const k = added.findIndex((a, n) => !used.has(n) && sameSort(r.place, a.place))
      if (k < 0) lines.push({ op: 'removed', place: r.place, before: r.text })
      else {
        used.add(k)
        lines.push({ op: 'changed', place: added[k].place, before: r.text, after: added[k].text })
      }
    }
    added.forEach((a, n) => used.has(n) || lines.push({ op: 'added', place: a.place, after: a.text }))
  }
  for (const [pi, pj] of pairs) {
    gap(pi, pj)
    // Matched by key: a row with the same call, which may mean something else now
    if (before[pi].text !== after[pj].text)
      lines.push({ op: 'changed', place: after[pj].place, before: before[pi].text, after: after[pj].text })
    i = pi + 1
    j = pj + 1
  }
  gap(before.length, after.length)
  return lines
}

interface Flat {
  section: Section
  trail: string[]
  parent: string | null
}

function flatten(sections: Section[], trail: string[] = [], parent: string | null = null, out: Flat[] = []) {
  for (const s of sections) {
    const here = [...trail, s.title]
    out.push({ section: s, trail: here, parent })
    if (s.children?.length) flatten(s.children, here, s.id, out)
  }
  return out
}

/** Every line of a section that is wholly added or removed */
function wholeSection(s: Section, op: 'added' | 'removed'): DiffLine[] {
  const side = op === 'added' ? 'after' : 'before'
  const fields = (['summary', 'pending'] as const)
    .filter((f) => s[f])
    .map((field): DiffLine => ({ op, place: { at: 'section', field }, [side]: s[field] }))
  return [...fields, ...sectionUnits(s).map((u): DiffLine => ({ op, place: u.place, [side]: u.text }))]
}

function fieldLine(place: DiffPlace, before: string | undefined, after: string | undefined): DiffLine[] {
  if (before === after) return []
  if (before === undefined) return [{ op: 'added', place, after }]
  if (after === undefined) return [{ op: 'removed', place, before }]
  return [{ op: 'changed', place, before, after }]
}

/** Where each section is among its siblings, from 1 */
function siblingIndex(flat: Flat[]) {
  const counts = new Map<string | null, number>()
  const index = new Map<string, number>()
  for (const f of flat) {
    const n = (counts.get(f.parent) ?? 0) + 1
    counts.set(f.parent, n)
    index.set(f.section.id, n)
  }
  return index
}

/**
 * What changed from `before` to `after`. Either may be null: a convention new in `after` is all
 * added, one gone all removed.
 */
export function diffConventions(before: Convention | null, after: Convention | null): ConventionDiff {
  const meta = metaFields.flatMap((field) =>
    fieldLine({ at: 'meta', field }, before ? metaText(before, field) : undefined, after ? metaText(after, field) : undefined),
  )
  const old = flatten(before?.sections ?? [])
  const now = flatten(after?.sections ?? [])
  const oldById = new Map(old.map((f) => [f.section.id, f]))
  const nowIds = new Set(now.map((f) => f.section.id))
  // Sections kept but out of their order: not part of the longest run kept in order
  const common = (list: Flat[], other: Set<string> | Map<string, Flat>) => list.map((f) => f.section.id).filter((id) => other.has(id))
  const oldCommon = common(old, nowIds)
  const nowCommon = common(now, oldById)
  const inOrder = new Set(lcs(oldCommon, nowCommon).map(([i]) => oldCommon[i]))
  const oldIndex = siblingIndex(old)
  const nowIndex = siblingIndex(now)

  // Removed sections go right after the section before them in the older version
  const nowAt = new Map(now.map((f, i) => [f.section.id, i]))
  const placed: { at: number; diff: SectionDiff }[] = []
  let anchor = -1
  let behind = 0
  for (const f of old) {
    const at = nowAt.get(f.section.id)
    if (at !== undefined) {
      anchor = at
      behind = 0
    } else
      placed.push({
        at: anchor + ++behind / (old.length + 1),
        diff: { id: f.section.id, trail: f.trail, op: 'removed', lines: wholeSection(f.section, 'removed') },
      })
  }
  now.forEach((f, at) => {
    const id = f.section.id
    const was = oldById.get(id)
    if (!was) {
      placed.push({ at, diff: { id, trail: f.trail, op: 'added', lines: wholeSection(f.section, 'added') } })
      return
    }
    const s = f.section
    const o = was.section
    const lines = [
      ...fieldLine({ at: 'section', field: 'title' }, o.title, s.title),
      ...fieldLine({ at: 'section', field: 'originalTitle' }, o.originalTitle, s.originalTitle),
      ...(was.parent !== f.parent
        ? fieldLine({ at: 'section', field: 'place' }, was.trail.slice(0, -1).join(' › ') || undefined, f.trail.slice(0, -1).join(' › ') || undefined)
        : !inOrder.has(id)
          ? fieldLine({ at: 'section', field: 'order' }, String(oldIndex.get(id)), String(nowIndex.get(id)))
          : []),
      ...fieldLine({ at: 'section', field: 'level' }, o.level, s.level),
      ...fieldLine({ at: 'section', field: 'summary' }, o.summary || undefined, s.summary || undefined),
      ...fieldLine({ at: 'section', field: 'pending' }, o.pending || undefined, s.pending || undefined),
      ...diffUnits(sectionUnits(o), sectionUnits(s)),
    ]
    if (lines.length) placed.push({ at, diff: { id, trail: f.trail, op: 'changed', lines } })
  })
  const result = placed.sort((x, y) => x.at - y.at).map((p) => p.diff)
  return { meta, sections: result }
}

// ---------------------------------------------------------------------------------------------
// Words

export interface TextPart {
  op: 'same' | 'added' | 'removed'
  text: string
}

/** Beyond this many characters squared, a changed line is shown whole rather than character by character */
const INLINE_LIMIT = 250_000

/**
 * The characters that differ between two versions of a line, for marking them: the parts in
 * order, `removed` ones from `before` and `added` ones from `after`.
 */
export function inlineDiff(before: string, after: string): TextPart[] {
  const a = Array.from(before)
  const b = Array.from(after)
  const parts: TextPart[] = []
  const push = (op: TextPart['op'], text: string) => {
    if (!text) return
    const last = parts[parts.length - 1]
    if (last?.op === op) last.text += text
    else parts.push({ op, text })
  }
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let end = 0
  while (end < a.length - start && end < b.length - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end++
  const midA = a.slice(start, a.length - end)
  const midB = b.slice(start, b.length - end)
  push('same', a.slice(0, start).join(''))
  if (midA.length * midB.length > INLINE_LIMIT) {
    push('removed', midA.join(''))
    push('added', midB.join(''))
  } else {
    let i = 0
    let j = 0
    for (const [pi, pj] of lcs(midA, midB)) {
      push('removed', midA.slice(i, pi).join(''))
      push('added', midB.slice(j, pj).join(''))
      push('same', midA[pi])
      i = pi + 1
      j = pj + 1
    }
    push('removed', midA.slice(i).join(''))
    push('added', midB.slice(j).join(''))
  }
  push('same', a.slice(a.length - end).join(''))
  return parts
}
