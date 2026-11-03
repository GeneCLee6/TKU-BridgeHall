/**
 * Full-width ASCII to half-width (社長 2026-11-03). A Chinese or Japanese input method in full-width
 * mode types ＡＢＣ１２３ where the member meant ABC123; sign-in names, passwords, codes and email
 * addresses are always the half-width ones. The sign-in forms convert as the member types
 * (src/lib/useHalfWidth.ts) and TKU BridgeTable's server converts again before it checks
 * anything (its shared/halfwidth.ts has the same function).
 *
 * Only U+FF01–U+FF5E (the full-width forms of `!` to `~`) and U+3000 (the ideographic space)
 * change; everything else, Chinese characters included, stays as it is. Each character maps to one
 * character, so the length and a caret position stay the same.
 */
const FULL_WIDTH = /[\uFF01-\uFF5E\u3000]/g
const OFFSET = 0xff01 - 0x21

export function toHalfWidth(text: string): string {
  return text.replace(FULL_WIDTH, (c) => (c === '\u3000' ? ' ' : String.fromCharCode(c.charCodeAt(0) - OFFSET)))
}
