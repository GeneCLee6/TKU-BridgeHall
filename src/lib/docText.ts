import * as cfbModule from 'cfb'

// cfb is CommonJS: bundlers give its functions as named exports, Node only as the default export
const CFB = (cfbModule as unknown as { default?: typeof cfbModule }).default ?? cfbModule
type Container = ReturnType<typeof CFB.read>

/**
 * Text out of Word files, in the browser, for AI import. The club's documents are mostly Word
 * 97-2003 (.doc): an OLE compound file whose WordDocument stream holds the characters, found
 * through the piece table, and whose character runs (CHPX) say which are bold. Bold comes out as
 * **…**, table cells as | … |, so the AI sees the structure. .docx files are read from their XML.
 *
 * Reference: [MS-DOC] (FIB, Clx/PlcPcd, PlcBteChpx/ChpxFkp) and [MS-DOCX]/ECMA-376 (w:p, w:r).
 */

export class DocTextError extends Error {}

const u16 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8)
const u32 = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0

/** Symbol-font characters (as Word stores them) that are the four suits */
const SYMBOL_SUITS: Record<number, string> = { 0xa7: '♣', 0xa8: '♦', 0xa9: '♥', 0xaa: '♠' }

/** The text of a Word 97-2003 document: body, footnotes, endnotes and text boxes */
export function docToText(bytes: Uint8Array): string {
  let container: Container
  try {
    container = CFB.read(bytes, { type: 'array' })
  } catch {
    throw new DocTextError('讀不懂這個 .doc 檔，請在 Word 另存為 .docx 或 PDF 再匯入')
  }
  const wordDocument = CFB.find(container, 'WordDocument')?.content as Uint8Array | undefined
  if (!wordDocument) throw new DocTextError('這不是 Word 檔')
  const wd = Uint8Array.from(wordDocument)
  if (u16(wd, 0) !== 0xa5ec) throw new DocTextError('這不是 Word 檔')
  const flags = u16(wd, 0x0a)
  if (flags & 0x0100) throw new DocTextError('這個檔案有密碼保護，請先取消密碼')
  if (u16(wd, 2) < 101) throw new DocTextError('這是 Word 6／95 的舊格式，請在 Word 另存為 .docx 再匯入')
  const tableStream = CFB.find(container, flags & 0x0200 ? '1Table' : '0Table')?.content as Uint8Array | undefined
  if (!tableStream) throw new DocTextError('讀不懂這個 .doc 檔，請另存為 .docx 或 PDF 再匯入')
  const table = Uint8Array.from(tableStream)

  // FIB: FibBase (32 bytes), then the counted arrays fibRgW, fibRgLw and fibRgFcLcb
  let o = 32
  o += 2 + u16(wd, o) * 2
  const lw = o + 2
  o += 2 + u16(wd, o) * 4
  const fcLcb = o + 2
  const pair = (i: number) => [u32(wd, fcLcb + i * 8), u32(wd, fcLcb + i * 8 + 4)] as const
  // Character counts of the sub-documents, in the order they follow each other
  const [ccpText, ccpFtn, ccpHdd, ccpMcr, ccpAtn, ccpEdn, ccpTxbx] = [3, 4, 5, 6, 7, 8, 9].map((i) => u32(wd, lw + i * 4))

  // Piece table: which file offsets hold which characters (CP)
  const [fcClx] = pair(33)
  let p = fcClx
  while (table[p] === 0x01) p += 3 + u16(table, p + 1)
  if (table[p] !== 0x02) throw new DocTextError('讀不懂這個 .doc 檔，請另存為 .docx 或 PDF 再匯入')
  const lcb = u32(table, p + 1)
  p += 5
  const n = (lcb - 4) / 12
  const pieces = Array.from({ length: n }, (_, i) => {
    const raw = u32(table, p + (n + 1) * 4 + i * 8 + 2)
    const compressed = (raw & 0x40000000) !== 0
    const fc = raw & 0x3fffffff
    return { cpStart: u32(table, p + i * 4), cpEnd: u32(table, p + (i + 1) * 4), compressed, fc: compressed ? fc / 2 : fc }
  })

  // Character runs: bold, and symbol characters stored apart from the text (sprmCSymbol)
  const [fcChpx, lcbChpx] = pair(12)
  const bold: [number, number][] = []
  const symbols = new Map<number, number>()
  const m = (lcbChpx - 4) / 8
  for (let i = 0; i < m; i++) {
    const page = u32(table, fcChpx + (m + 1) * 4 + i * 4) * 512
    const runs = wd[page + 511]
    for (let r = 0; r < runs; r++) {
      const start = u32(wd, page + r * 4)
      const end = u32(wd, page + (r + 1) * 4)
      const offset = wd[page + (runs + 1) * 4 + r] * 2
      if (!offset) continue
      let q = page + offset + 1
      const stop = q + wd[page + offset]
      while (q + 2 <= stop) {
        const sprm = u16(wd, q)
        q += 2
        const size = [1, 1, 2, 4, 2, 2, -1, 3][sprm >> 13]
        const len = size === -1 ? wd[q] + 1 : size
        // sprmCFBold: 1 on, 0x81 the opposite of the style (styles are rarely bold)
        if (sprm === 0x0835 && (wd[q] === 1 || wd[q] === 0x81)) bold.push([start, end])
        if (sprm === 0x6a09) symbols.set(start, u16(wd, q + 2))
        q += len
      }
    }
  }
  bold.sort((a, b) => a[0] - b[0])
  const isBold = (fc: number) => {
    let lo = 0
    let hi = bold.length - 1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (fc < bold[mid][0]) hi = mid - 1
      else if (fc >= bold[mid][1]) lo = mid + 1
      else return true
    }
    return false
  }

  const read = (from: number, to: number) => {
    const chars: { code: number; bold: boolean }[] = []
    for (const piece of pieces) {
      for (let cp = Math.max(from, piece.cpStart); cp < Math.min(to, piece.cpEnd); cp++) {
        const fc = piece.fc + (cp - piece.cpStart) * (piece.compressed ? 1 : 2)
        let code = piece.compressed ? cp1252(wd[fc]) : u16(wd, fc)
        const symbol = symbols.get(fc)
        if (symbol !== undefined && code === 0x28) code = symbol
        chars.push({ code, bold: isBold(fc) })
      }
    }
    return chars
  }

  const parts = [read(0, ccpText)]
  let at = ccpText
  const footnotes = read(at, at + ccpFtn)
  at += ccpFtn + ccpHdd + ccpMcr + ccpAtn
  const endnotes = read(at, at + ccpEdn)
  at += ccpEdn
  const textBoxes = read(at, at + ccpTxbx)
  for (const extra of [footnotes, endnotes, textBoxes]) if (extra.some((c) => c.code > 32)) parts.push(extra)
  return parts.map(charsToText).join('\n\n').trim()
}

/** The few bytes where Windows-1252 differs from Latin-1, for "compressed" 8-bit pieces */
function cp1252(byte: number) {
  const map: Record<number, number> = { 0x80: 0x20ac, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014 }
  return map[byte] ?? byte
}

/**
 * Word's characters as plain text: paragraph marks become new lines, cell marks become | … |,
 * field codes are dropped (their results kept), pictures and anchors are dropped, bold is **…**.
 */
export function charsToText(chars: { code: number; bold: boolean }[]): string {
  const lines: string[] = []
  let line = ''
  let cells: string[] | null = null
  let boldOpen = false
  /** One entry per open field: true while in its code, false once in its result */
  const fields: boolean[] = []
  const closeBold = () => {
    if (boldOpen) line += '**'
    boldOpen = false
  }
  for (let i = 0; i < chars.length; i++) {
    const { code, bold } = chars[i]
    if (code === 0x13) fields.push(true)
    else if (code === 0x14) fields[fields.length - 1] = false
    else if (code === 0x15) fields.pop()
    if (code === 0x13 || code === 0x14 || code === 0x15 || fields.includes(true)) continue
    if (code === 0x0d || code === 0x0b || code === 0x0c) {
      closeBold()
      lines.push(line)
      line = ''
      continue
    }
    if (code === 0x07) {
      closeBold()
      // Each cell ends with a cell mark, and the row with one more
      if (chars[i - 1]?.code === 0x07 && cells) {
        lines.push(`| ${cells.join(' | ')} |`)
        cells = null
      } else {
        ;(cells ??= []).push(line.trim())
        line = ''
      }
      continue
    }
    // Non-breaking hyphen; optional hyphens, pictures, drawn objects and note references go
    let ch = code === 0x1e ? '-' : code < 0x20 && code !== 0x09 ? '' : code === 0xa0 ? ' ' : String.fromCharCode(code)
    if (code >= 0xf000 && code <= 0xf0ff) ch = SYMBOL_SUITS[code - 0xf000] ?? ''
    if (!ch) continue
    if (ch.trim() && bold !== boldOpen) {
      line += '**'
      boldOpen = bold
    }
    line += ch
  }
  closeBold()
  if (line) lines.push(line)
  if (cells) lines.push(`| ${cells.join(' | ')} |`)
  return tidyText(lines.join('\n'))
}

/** Drops trailing spaces, empty bold marks and runs of blank lines */
function tidyText(text: string) {
  return text
    // Within a line only: bold that goes on over several lines is marked line by line
    .replace(/\*\*([ \t　]*)\*\*/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
}

// ── .docx ─────────────────────────────────────────────────────────────────────────────────────

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

/** The text of a .docx: headings as #, list items as -, bold as **…**, tables as | … | */
export function docxToText(bytes: Uint8Array): string {
  let container: Container
  try {
    container = CFB.read(bytes, { type: 'array' })
  } catch {
    throw new DocTextError('讀不懂這個 .docx 檔')
  }
  const file = (name: string) => {
    const entry = container.FileIndex.find((_, i) => container.FullPaths[i].replace(/^[^/]*\//, '').toLowerCase() === name)
      ?? CFB.find(container, name)
    return entry?.content ? new TextDecoder().decode(Uint8Array.from(entry.content as ArrayLike<number>)) : null
  }
  const documentXml = file('word/document.xml')
  if (!documentXml) throw new DocTextError('讀不懂這個 .docx 檔')
  const parse = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml')
  const doc = parse(documentXml)
  const styles = file('word/styles.xml')
  const headingLevel = new Map<string, number>()
  if (styles)
    for (const style of Array.from(parse(styles).getElementsByTagNameNS(W, 'style'))) {
      const id = style.getAttributeNS(W, 'styleId') ?? ''
      const name = style.getElementsByTagNameNS(W, 'name')[0]?.getAttributeNS(W, 'val') ?? ''
      const level = /^(?:heading|標題)\s*(\d)$/i.exec(name.trim()) ?? /^Heading(\d)$/.exec(id)
      if (level) headingLevel.set(id, Number(level[1]))
    }

  const on = (el: Element | undefined) => {
    if (!el) return false
    const val = el.getAttributeNS(W, 'val')
    return val === null || !['0', 'false', 'none'].includes(val)
  }
  const child = (el: Element, name: string) => Array.from(el.children).find((c) => c.localName === name)

  const paragraph = (p: Element) => {
    let text = ''
    let boldOpen = false
    for (const run of Array.from(p.getElementsByTagNameNS(W, 'r'))) {
      const props = child(run, 'rPr')
      const bold = on(props ? child(props, 'b') : undefined)
      for (const part of Array.from(run.children)) {
        let piece = ''
        if (part.localName === 't') piece = part.textContent ?? ''
        else if (part.localName === 'tab') piece = '\t'
        else if (part.localName === 'br') piece = '\n'
        else if (part.localName === 'sym') {
          const code = parseInt(part.getAttributeNS(W, 'char') ?? '', 16)
          piece = SYMBOL_SUITS[code >= 0xf000 ? code - 0xf000 : code] ?? ''
        }
        if (!piece) continue
        if (piece.trim() && bold !== boldOpen) {
          text += '**'
          boldOpen = bold
        }
        text += piece
      }
    }
    if (boldOpen) text += '**'
    const props = child(p, 'pPr')
    const style = props ? child(props, 'pStyle')?.getAttributeNS(W, 'val') : undefined
    const level = style ? headingLevel.get(style) : undefined
    const list = props ? child(props, 'numPr') : undefined
    const indent = list ? Number(child(list, 'ilvl')?.getAttributeNS(W, 'val') ?? 0) : 0
    const clean = text.replace(/\*\*(\s*)\*\*/g, '$1')
    if (level && clean.trim()) return `${'#'.repeat(level)} ${clean.replace(/\*\*/g, '')}`
    if (list && clean.trim()) return `${'  '.repeat(indent)}- ${clean}`
    return clean
  }

  const lines: string[] = []
  const body = doc.getElementsByTagNameNS(W, 'body')[0]
  for (const el of Array.from(body?.children ?? [])) {
    if (el.localName === 'p') lines.push(paragraph(el))
    else if (el.localName === 'tbl')
      for (const row of Array.from(el.getElementsByTagNameNS(W, 'tr'))) {
        const cells = Array.from(row.children)
          .filter((c) => c.localName === 'tc')
          .map((cell) =>
            Array.from(cell.getElementsByTagNameNS(W, 'p'))
              .map(paragraph)
              .filter((s) => s.trim())
              .join(' / '),
          )
        lines.push(`| ${cells.join(' | ')} |`)
      }
  }
  return tidyText(lines.join('\n')).trim()
}
