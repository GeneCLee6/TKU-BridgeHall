/** Call and suit helpers shared by the renderer and the search index. */

export type SuitLetter = 'S' | 'H' | 'D' | 'C'

export const SUIT_SYMBOL: Record<SuitLetter, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
export const SUIT_NAME: Record<SuitLetter, string> = { S: '黑桃', H: '紅心', D: '方塊', C: '梅花' }
export const SYMBOL_TO_LETTER: Record<string, SuitLetter> = { '♠': 'S', '♥': 'H', '♦': 'D', '♣': 'C' }

export interface CallParts {
  /** What to show before the suit symbol: "2" for 2♦; or the whole call: "1NT", "Pass", "X" */
  text: string
  suit?: SuitLetter
  /** Spoken label for screen readers, e.g. "2 方塊" */
  label: string
}

/** Split a compact call ('2D', '1NT', 'X', 'P', '---', '?') into displayable parts */
export function parseCall(call: string): CallParts {
  const trimmed = call.trim()
  const bid = /^([1-7])(C|D|H|S|NT)$/i.exec(trimmed)
  if (bid) {
    const level = bid[1]
    const strain = bid[2].toUpperCase()
    if (strain === 'NT') return { text: `${level}NT`, label: `${level} 無王` }
    const suit = strain as SuitLetter
    return { text: level, suit, label: `${level} ${SUIT_NAME[suit]}` }
  }
  const upper = trimmed.toUpperCase()
  if (upper === 'P' || upper === 'PASS') return { text: 'Pass', label: 'Pass' }
  if (upper === 'X') return { text: 'X', label: '賭倍 X' }
  if (upper === 'XX') return { text: 'XX', label: '再賭倍 XX' }
  if (/^-{2,}$/.test(trimmed)) return { text: '—', label: '原文標示為 ---' }
  if (/^[?？]+$/.test(trimmed)) return { text: '?', label: '待決定的叫品' }
  return { text: trimmed, label: trimmed }
}

/** 2D -> 2♦, 1NT -> 1NT: a plain-text form for titles and search */
export function formatCall(call: string): string {
  const parts = parseCall(call)
  return parts.suit ? `${parts.text}${SUIT_SYMBOL[parts.suit]}` : parts.text
}

/** Replace suit symbols with letters so "2♦" and "2D" match the same text */
export function toAsciiSuits(text: string): string {
  return text.replace(/[♠♥♦♣]/g, (s) => SYMBOL_TO_LETTER[s])
}
