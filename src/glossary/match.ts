import type { BookGlossary } from '../lib/api.ts'
import type { Term } from '../types/glossary.ts'

/**
 * Which glossary applies: the online list once it has been saved (version > 0, even if every term
 * was removed), otherwise the bundled one. Sorted by term for the glossary page.
 */
export function resolveGlossary(bundled: readonly Term[], online: BookGlossary | null | undefined): Term[] {
  const list = online && online.version > 0 ? online.terms : bundled
  return [...list].sort((a, b) => a.term.localeCompare(b.term, 'zh-Hant'))
}

/** The glossary compiled once for marking text (PRD E4: one regular expression, one pass a paragraph) */
export interface CompiledGlossary {
  pattern: RegExp | null
  /** A name or alias, lower-cased, to its term */
  byName: Map<string, Term>
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const WORD = /[A-Za-z0-9]/

/**
 * One regular expression for every name and alias, longest first so 「Jacoby 2NT」 wins over
 * 「2NT」. A name that starts or ends with a letter or digit only matches as a whole word (no
 * letter or digit next to it), so 「GF」 is not found inside 「GFX」; Chinese names have no word
 * boundaries and match anywhere. Case is ignored.
 */
export function compileGlossary(terms: readonly Term[]): CompiledGlossary {
  const byName = new Map<string, Term>()
  for (const t of terms)
    for (const name of [t.term, ...t.aliases]) {
      const key = name.trim().toLowerCase()
      if (key && !byName.has(key)) byName.set(key, t)
    }
  const names = [...byName.keys()].sort((a, b) => b.length - a.length)
  if (!names.length) return { pattern: null, byName }
  const parts = names.map(
    (n) => `${WORD.test(n[0]) ? '(?<![A-Za-z0-9])' : ''}${escape(n)}${WORD.test(n[n.length - 1]) ? '(?![A-Za-z0-9])' : ''}`,
  )
  return { pattern: new RegExp(parts.join('|'), 'gi'), byName }
}

export type Piece = { text: string; term?: Term }

/**
 * Splits `text` into plain pieces and the first mention of each term not yet in `seen` (which is
 * updated). Joining the pieces' text gives back `text` unchanged: marking never alters the words.
 */
export function splitTerms(text: string, glossary: CompiledGlossary, seen: Set<string>): Piece[] {
  const { pattern, byName } = glossary
  if (!pattern || !text) return [{ text }]
  const pieces: Piece[] = []
  let last = 0
  for (const match of text.matchAll(pattern)) {
    const term = byName.get(match[0].toLowerCase())
    if (!term || seen.has(term.term)) continue
    seen.add(term.term)
    if (match.index > last) pieces.push({ text: text.slice(last, match.index) })
    pieces.push({ text: match[0], term })
    last = match.index + match[0].length
  }
  if (last < text.length || !pieces.length) pieces.push({ text: text.slice(last) })
  return pieces
}

/** The glossary page's anchor for a term */
export const termAnchor = (term: string) => `term-${encodeURIComponent(term.toLowerCase()).replace(/%/g, '')}`

/** Terms whose name, aliases or definition contain `query` (case ignored), for the glossary page's filter */
export function filterTerms(terms: readonly Term[], query: string): Term[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...terms]
  return terms.filter((t) => [t.term, ...t.aliases, t.definition].some((s) => s.toLowerCase().includes(q)))
}
