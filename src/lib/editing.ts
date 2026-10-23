import type { AuctionCall, Block, CategoryId, Convention, RuleItem, Section } from '../types/convention.ts'

/**
 * Pure helpers for the online editor: changing the section tree by id, and the small text forms
 * the editor uses for lists, auction cells and pasted response tables. Every function returns new
 * objects and never changes its input.
 */

// ── Section tree ──────────────────────────────────────────────────────────────────────────────

/** Where a section sits: its parent's id (null at the top) and its index among its siblings */
export interface SectionPlace {
  parentId: string | null
  index: number
  section: Section
}

export function findPlace(sections: Section[], id: string, parentId: string | null = null): SectionPlace | null {
  for (const [index, section] of sections.entries()) {
    if (section.id === id) return { parentId, index, section }
    const inside = findPlace(section.children ?? [], id, section.id)
    if (inside) return inside
  }
  return null
}

export const findSection = (sections: Section[], id: string) => findPlace(sections, id)?.section ?? null

/** Replaces the children of `parentId` (the top level when null) */
function withChildren(sections: Section[], parentId: string | null, change: (children: Section[]) => Section[]): Section[] {
  if (parentId === null) return change(sections)
  return sections.map((s) => {
    if (s.id === parentId) {
      const children = change(s.children ?? [])
      const rest = { ...s }
      delete rest.children
      return children.length ? { ...rest, children } : rest
    }
    return s.children ? { ...s, children: withChildren(s.children, parentId, change) } : s
  })
}

export function updateSection(sections: Section[], id: string, change: (section: Section) => Section): Section[] {
  return sections.map((s) => {
    if (s.id === id) return change(s)
    return s.children ? { ...s, children: updateSection(s.children, id, change) } : s
  })
}

export function removeSection(sections: Section[], id: string): Section[] {
  const place = findPlace(sections, id)
  if (!place) return sections
  return withChildren(sections, place.parentId, (children) => children.filter((s) => s.id !== id))
}

/** Inserts a section among the children of `parentId`, after `afterId` (or at the end) */
export function insertSection(sections: Section[], parentId: string | null, section: Section, afterId?: string): Section[] {
  return withChildren(sections, parentId, (children) => {
    const after = afterId ? children.findIndex((s) => s.id === afterId) : -1
    const at = after < 0 ? children.length : after + 1
    return [...children.slice(0, at), section, ...children.slice(at)]
  })
}

/** Moves a section up (-1) or down (+1) among its siblings */
export function moveSection(sections: Section[], id: string, delta: -1 | 1): Section[] {
  const place = findPlace(sections, id)
  if (!place) return sections
  return withChildren(sections, place.parentId, (children) => {
    const to = place.index + delta
    if (to < 0 || to >= children.length) return children
    const next = [...children]
    ;[next[place.index], next[to]] = [next[to], next[place.index]]
    return next
  })
}

/** Makes a section the last child of the sibling above it */
export function indentSection(sections: Section[], id: string): Section[] {
  const place = findPlace(sections, id)
  if (!place || place.index === 0) return sections
  const siblings = place.parentId === null ? sections : (findSection(sections, place.parentId)?.children ?? [])
  const newParent = siblings[place.index - 1]
  return insertSection(removeSection(sections, id), newParent.id, place.section)
}

/** Moves a section out of its parent, to just after the parent */
export function outdentSection(sections: Section[], id: string): Section[] {
  const place = findPlace(sections, id)
  if (!place || place.parentId === null) return sections
  const parent = findPlace(sections, place.parentId)!
  return insertSection(removeSection(sections, id), parent.parentId, place.section, parent.section.id)
}

export function sectionIds(sections: Section[]): string[] {
  return sections.flatMap((s) => [s.id, ...sectionIds(s.children ?? [])])
}

/** A new section id that is not used yet: sec-1, sec-2, … */
export function newSectionId(sections: Section[]): string {
  const used = new Set(sectionIds(sections))
  let n = 1
  while (used.has(`sec-${n}`)) n++
  return `sec-${n}`
}

// ── Blank content ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SEATS: [string, string, string, string] = ['開叫者', '敵方', '答叫者', '敵方']

export function blankBlock(kind: Block['kind']): Block {
  switch (kind) {
    case 'paragraph':
      return { kind: 'paragraph', text: '' }
    case 'rules':
      return { kind: 'rules', items: [{ text: '' }] }
    case 'responses':
      return { kind: 'responses', auction: { seats: [...DEFAULT_SEATS], calls: ['?'] }, rows: [{ call: '', meaning: '' }] }
    case 'note':
      return { kind: 'note', tone: 'info', text: '' }
    case 'hand':
      return { kind: 'hand', hand: { spades: '', hearts: '', diamonds: '', clubs: '' } }
  }
}

export function blankConvention(category: CategoryId, updated: string): Convention {
  return {
    slug: '',
    nameZh: '',
    nameEn: '',
    category,
    tags: [],
    summary: '',
    source: { title: '' },
    updated,
    sections: [{ id: 'sec-1', title: '', blocks: [blankBlock('paragraph')] }],
  }
}

// ── Lists as indented text ────────────────────────────────────────────────────────────────────

const PENDING = /\s*〔待確認：(.*)〕\s*$/

/**
 * A list as text, one item per line: "- " starts an item, two spaces in front make it a sub-item,
 * and 〔待確認：…〕 at the end of a line is the item's doubt. textToRules reads it back.
 */
export function rulesToText(items: RuleItem[], depth = 0): string {
  return items
    .map((item) => {
      const line = `${'  '.repeat(depth)}- ${item.text}${item.pending ? ` 〔待確認：${item.pending}〕` : ''}`
      return item.children?.length ? `${line}\n${rulesToText(item.children, depth + 1)}` : line
    })
    .join('\n')
}

export function textToRules(text: string): RuleItem[] {
  const root: RuleItem[] = []
  // The newest item at each depth, to hang sub-items on
  const stack: RuleItem[] = []
  for (const raw of text.split('\n')) {
    if (!raw.trim()) continue
    const indent = raw.match(/^[ \t　]*/)![0].replace(/\t|　/g, '  ').length
    // An item can be at most one level deeper than the one before it
    const depth = Math.min(Math.floor(indent / 2), stack.length)
    const body = raw.trim().replace(/^[-•・*]\s?/, '')
    const pending = PENDING.exec(body)
    const item: RuleItem = { text: (pending ? body.slice(0, pending.index) : body).trim() }
    if (pending) item.pending = pending[1].trim()
    if (depth === 0) root.push(item)
    else {
      const parent = stack[depth - 1]
      parent.children = [...(parent.children ?? []), item]
    }
    stack.length = depth
    stack.push(item)
  }
  return root
}

// ── Auction cells ─────────────────────────────────────────────────────────────────────────────

/** An auction cell as text: the call, with its note in parentheses, e.g. 2C（一門未知牌組） */
export function cellText(call: AuctionCall): string {
  if (typeof call === 'string') return call
  return call.note ? `${call.call}（${call.note}）` : call.call
}

export function cellCall(text: string): AuctionCall {
  const trimmed = text.trim()
  const note = /^([^（(]*)[（(](.*)[）)]$/.exec(trimmed)
  if (note && note[2].trim()) return { call: normaliseCall(note[1]), note: note[2].trim() }
  return normaliseCall(trimmed)
}

const SUIT_LETTER: Record<string, string> = { '♠': 'S', '♥': 'H', '♦': 'D', '♣': 'C' }

/** 2♦ → 2D, 1nt → 1NT, ？ → ?; Pass and X are drawn the same in any case, so they stay as typed */
export function normaliseCall(text: string): string {
  const t = text.trim().replace(/[♠♥♦♣]/g, (s) => SUIT_LETTER[s])
  if (/^[1-7](c|d|h|s|nt)$/i.test(t)) return t.toUpperCase()
  if (/^[?？]+$/.test(t)) return '?'
  return t
}

// ── Pasted response tables ────────────────────────────────────────────────────────────────────

/**
 * Response rows from text as the club's handouts write them, one per line:
 * "2H=P/C", "3C --- 6張F", "X – 處罰", "2NT：詢問". Lines without a separator are left out.
 */
export function parseResponseLines(text: string): { call: string; meaning: string }[] {
  const rows: { call: string; meaning: string }[] = []
  for (const line of text.split('\n')) {
    const match = /^\s*(\S+?)\s*(?:=|＝|-+|－|–|—+|：|:)\s*(.+)$/.exec(line)
    if (match) rows.push({ call: normaliseCall(match[1]), meaning: match[2].trim() })
  }
  return rows
}

/**
 * Turns suit letters in a meaning into symbols, as the content guide asks: 3H → 3♥, H不fit →
 * ♥不fit. Letters inside English words (VOID, HCP) and card letters (問A) stay as they are.
 */
export function suitSymbols(text: string): string {
  const symbol: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
  return text
    .replace(/(\d)([CDHS])(?![a-z])/g, (_, level: string, suit: string) => level + symbol[suit])
    .replace(/(?<![A-Za-z])([CDHS])(?=[一-鿿])/g, (_, suit: string) => symbol[suit])
}

/** Splits 「a、b, c」 (or one per line) into ['a', 'b', 'c'] for tags and aliases */
export const splitList = (text: string) =>
  text
    .split(/[,，、\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
