import { describe, expect, it } from 'vitest'
import { toHalfWidth } from '../../src/lib/halfwidth.ts'

describe('full-width ASCII to half-width', () => {
  it('turns what a full-width input method types into ASCII, and the ideographic space into a space', () => {
    expect(toHalfWidth('ＡＢＣ１２３')).toBe('ABC123')
    expect(toHalfWidth('ｇｅｎｅ．ｌｅｅ＠ｍａｉｌ．ｃｏｍ')).toBe('gene.lee@mail.com')
    expect(toHalfWidth(`ａ${String.fromCharCode(0x3000)}ｂ`)).toBe('a b')
  })

  it('covers exactly U+FF01 to U+FF5E and leaves everything else alone', () => {
    for (let code = 0x21; code <= 0x7e; code++) expect(toHalfWidth(String.fromCharCode(code + 0xfee0))).toBe(String.fromCharCode(code))
    expect(toHalfWidth('｟｠ｱ淡江橋藝 abc-123')).toBe('｟｠ｱ淡江橋藝 abc-123')
  })
})
