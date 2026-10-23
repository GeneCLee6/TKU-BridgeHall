import * as cfbModule from 'cfb'
import { charsToText, DocTextError, docToText, docxToText } from '../../src/lib/docText.ts'

const CFB = (cfbModule as unknown as { default?: typeof cfbModule }).default ?? cfbModule

/** Word characters from text: `*` toggles bold; \r, \x07 and the field marks pass through */
function chars(text: string) {
  let bold = false
  const out: { code: number; bold: boolean }[] = []
  for (const ch of text) {
    if (ch === '*') bold = !bold
    else out.push({ code: ch.charCodeAt(0), bold })
  }
  return out
}

describe('text out of .doc characters', () => {
  it('turns paragraph marks into lines and keeps bold as **…**', () => {
    expect(charsToText(chars('*標題*\r1NT 2D ??\rPASS – 什麼都沒有\r'))).toBe('**標題**\n1NT 2D ??\nPASS – 什麼都沒有')
    // Bold over several paragraphs is marked line by line
    expect(charsToText(chars('*一\r二*\r'))).toBe('**一**\n**二**')
  })

  it('writes table rows as | … |', () => {
    expect(charsToText(chars('開叫 1C\x07：\x0713-21點\x07\x07開叫 1D\x07：\x07\x07'))).toBe('| 開叫 1C | ： | 13-21點 |\n| 開叫 1D | ： |')
  })

  it('drops field codes but keeps their results, and drops pictures and anchors', () => {
    expect(charsToText(chars('見\x13 HYPERLINK "x" \x14網站\x15。\x01\x08\r'))).toBe('見網站。')
    expect(charsToText(chars('\x13 PAGE \x15頁\r'))).toBe('頁')
  })

  it('maps Symbol-font suits and special characters', () => {
    const symbols = [0xf0aa, 0xf0a9, 0xf0a8, 0xf0a7].map((code) => ({ code, bold: false }))
    expect(charsToText([...symbols, ...chars(' a\u001eb\u001fc')])).toBe('♠♥♦♣ a-bc')
  })

  it('refuses files that are not Word 97-2003', () => {
    expect(() => docToText(new Uint8Array([1, 2, 3]))).toThrow(DocTextError)
  })
})

describe('text out of .docx', () => {
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
  function docx(body: string) {
    const zip = CFB.utils.cfb_new({ type: 'zip' } as never)
    const add = (name: string, xml: string) => CFB.utils.cfb_add(zip, name, new TextEncoder().encode(xml))
    add('[Content_Types].xml', '<Types/>')
    add('word/document.xml', `<w:document ${W}><w:body>${body}</w:body></w:document>`)
    add(
      'word/styles.xml',
      `<w:styles ${W}><w:style w:styleId="1"><w:name w:val="heading 1"/></w:style><w:style w:styleId="2"><w:name w:val="heading 2"/></w:style></w:styles>`,
    )
    return new Uint8Array(CFB.write(zip, { fileType: 'zip', type: 'array' }) as ArrayLike<number>)
  }
  const p = (inner: string, props = '') => `<w:p>${props ? `<w:pPr>${props}</w:pPr>` : ''}${inner}</w:p>`
  const r = (text: string, bold = false) => `<w:r>${bold ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t xml:space="preserve">${text}</w:t></w:r>`

  it('marks headings, list items, bold and tables', () => {
    const body = [
      p(r('1NT的答叫'), '<w:pStyle w:val="1"/>'),
      p(r('答叫原則'), '<w:pStyle w:val="2"/>'),
      p(r('二線新花為5張+不迫叫') + r('，敵叫花色無擋', true)),
      p(r('pass束叫'), '<w:numPr><w:ilvl w:val="1"/><w:numId w:val="3"/></w:numPr>'),
      p(`<w:r><w:sym w:font="Symbol" w:char="F0AA"/></w:r>${r('K')}`),
      `<w:tbl><w:tr><w:tc>${p(r('2H'))}</w:tc><w:tc>${p(r('P/C'))}</w:tc></w:tr></w:tbl>`,
    ].join('')
    expect(docxToText(docx(body))).toBe(
      '# 1NT的答叫\n## 答叫原則\n二線新花為5張+不迫叫**，敵叫花色無擋**\n  - pass束叫\n♠K\n| 2H | P/C |',
    )
  })
})
