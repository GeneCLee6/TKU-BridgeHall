import type { Term } from '../types/glossary.ts'
import { glossaryStrings as t } from './strings.ts'

/** The Worker's limits (TKU-BridgeTable worker/glossary.ts GLOSSARY_LIMITS) */
export const GLOSSARY_MAX = 500
export const TERM_MAX = 40
export const DEFINITION_MAX = 1000

export type Draft = { key: number; term: string; aliases: string; definition: string; see: string }

export const toDraft = (term: Term, key: number): Draft => ({
  key,
  term: term.term,
  aliases: term.aliases.join(', '),
  definition: term.definition,
  see: term.see ?? '',
})

/** The drafts as terms to save; a message when one is incomplete or a name is used twice */
export function draftsToTerms(rows: readonly Omit<Draft, 'key'>[]): Term[] | string {
  const names = new Set<string>()
  const terms: Term[] = []
  for (const row of rows) {
    const term = row.term.trim()
    const definition = row.definition.trim()
    if (!term || !definition) return t.incomplete
    const aliases = [...new Set(row.aliases.split(/[,，、]/).map((a) => a.trim()).filter(Boolean))]
    for (const name of [term, ...aliases]) {
      if (names.has(name.toLowerCase())) return t.duplicate(name)
      names.add(name.toLowerCase())
    }
    terms.push({ term, aliases, definition, ...(row.see && { see: row.see }) })
  }
  if (terms.length > GLOSSARY_MAX) return t.tooMany(GLOSSARY_MAX)
  return terms
}
