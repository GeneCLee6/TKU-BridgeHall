/**
 * One glossary term (E4 e4-t05, AC-4.4): the name, other spellings that mean the same, the club's
 * explanation, and optionally the convention that covers it (its slug). The same shape is stored
 * online (TKU-BridgeTable worker/glossary.ts GlossaryTerm).
 */
export interface Term {
  term: string
  aliases: string[]
  definition: string
  see?: string
}
