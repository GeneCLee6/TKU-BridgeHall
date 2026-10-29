// A filled convention card as a Word file (E3 e3-t08, AC-3.5): the template's pages rebuilt as
// fixed-width tables (twips, never auto widths, so Word and LibreOffice lay it out alike), each
// page in a section of its own at the template's paper and margins, then the supplementary notes.
// WBF cards can be had in Gill Sans (the CTCBA download page has a Gill Sans .doc beside the
// plain one); the others are Arial with 微軟正黑體 for Chinese.
//
// The `docx` package is large: import this module only with a dynamic import() from the card
// pages (the home page budget, scripts/check-budget.mjs).

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  LineRuleType,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextDirection,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx'
import { cardColors } from '../styles/tokens.ts'
import { PAPER_WIDTH } from './describe.ts'
import type { FilledCard, FilledCell } from './fill.ts'
import type { CardBlock, CardCellsBlock, CardPage, CardTemplate } from './types.ts'

export type CardFont = 'arial' | 'gill-sans'

export interface CardDocxOptions {
  font?: CardFont
  /** Document title (file properties) */
  title: string
  /** Heading of the supplementary notes */
  notesTitle: string
}

/** Fonts by option: Latin, then Chinese */
export const CARD_FONTS: Record<CardFont, { latin: string; eastAsia: string }> = {
  arial: { latin: 'Arial', eastAsia: 'Microsoft JhengHei' },
  'gill-sans': { latin: 'Gill Sans MT', eastAsia: 'Microsoft JhengHei' },
}

/** Tick boxes, in a font every Windows and LibreOffice install has */
const BOX = { off: '☐', on: '☒' }
const SYMBOL_FONT = 'Segoe UI Symbol'

const TW = 20 // twips per point
const PAPER = { 'A4-landscape': { w: 842, h: 595 }, 'A4-portrait': { w: 595, h: 842 } } as const
const MARGIN_Y = 20 // points, as the card page prints (pages/CardPage.tsx PrintStyle)
const hex = (color: string) => {
  const c = color.replace('#', '')
  return c.length === 3 ? [...c].map((x) => x + x).join('') : c
}
const RULE = { style: BorderStyle.SINGLE, size: 4, color: hex(cardColors.rule) }
const NONE = { style: BorderStyle.NONE, size: 0, color: 'auto' }
const BOXED = {
  top: RULE,
  bottom: RULE,
  left: RULE,
  right: RULE,
  insideHorizontal: RULE,
  insideVertical: RULE,
}
const OPEN = {
  top: NONE,
  bottom: NONE,
  left: NONE,
  right: NONE,
  insideHorizontal: NONE,
  insideVertical: NONE,
}
const CELL_MARGIN = { top: 0, bottom: 0, left: 40, right: 40 }
const SHADE = { type: ShadingType.CLEAR, color: 'auto', fill: hex(cardColors.shade) }

interface Ctx {
  template: CardTemplate
  card: FilledCard
  /** Half-points */
  size: number
  /** Twips of one printed line */
  line: number
}

type Child = Paragraph | Table

/** Runs of a text with the red suits in red; lines of a multi-line text become breaks */
function runs(
  text: string,
  opts: { bold?: boolean; italics?: boolean; size?: number } = {},
): TextRun[] {
  const out: TextRun[] = []
  text.split('\n').forEach((line, i) => {
    let first = i > 0
    for (const part of line.split(/([♥♦☐☒])/u)) {
      if (!part && !first) continue
      const red = part === '♥' || part === '♦'
      const box = part === BOX.off || part === BOX.on
      const lineBreak = first
      first = false
      out.push(
        new TextRun({
          text: part,
          ...(lineBreak && { break: 1 }),
          ...(opts.bold && { bold: true }),
          ...(opts.italics && { italics: true }),
          ...(opts.size && { size: opts.size }),
          ...(red && { color: hex(cardColors.red) }),
          ...(box && { font: SYMBOL_FONT }),
        }),
      )
    }
  })
  return out
}

function para(
  ctx: Ctx,
  children: TextRun[],
  opts: { align?: 'center'; line?: number } = {},
): Paragraph {
  return new Paragraph({
    children,
    spacing: { before: 0, after: 0, line: opts.line ?? ctx.line, lineRule: LineRuleType.EXACT },
    ...(opts.align === 'center' && { alignment: AlignmentType.CENTER }),
  })
}

/** A paragraph per line of the text (an empty one when there is none) */
function lines(ctx: Ctx, text: string | undefined, prefix: TextRun[] = []): Paragraph[] {
  const list = (text ?? '').split('\n')
  return list.map((line, i) => para(ctx, [...(i === 0 ? prefix : []), ...runs(line)]))
}

function cell(
  children: Child[],
  width: number,
  opts: Partial<ConstructorParameters<typeof TableCell>[0]> = {},
): TableCell {
  // A cell must end with a paragraph
  const kids =
    children.length && children[children.length - 1] instanceof Paragraph
      ? children
      : [...children, tiny()]
  return new TableCell({
    children: kids,
    width: { size: Math.round(width), type: WidthType.DXA },
    margins: CELL_MARGIN,
    ...opts,
  })
}

function table(rows: TableRow[], widths: number[], boxed = true): Table {
  const columnWidths = widths.map((w) => Math.round(w))
  return new Table({
    rows,
    columnWidths,
    width: { size: columnWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: boxed ? BOXED : OPEN,
    margins: CELL_MARGIN,
  })
}

/**
 * A row of the form, exactly as many printed lines high as the template says: like the paper
 * form, a cell does not grow, so a page never spills onto the next. Text longer than the cell is
 * cut off in Word; the card page lists such cells (放不下) and moves what it can to the notes.
 */
const row = (ctx: Ctx, children: TableCell[], lineCount = 1) =>
  new TableRow({
    children,
    cantSplit: true,
    height: { value: Math.round(ctx.line * lineCount), rule: HeightRule.EXACT },
  })

/** A 1-point paragraph: what Word needs after a table that ends a cell or a section */
const tiny = () =>
  new Paragraph({
    children: [new TextRun({ text: '', size: 2 })],
    spacing: { before: 0, after: 0, line: 2, lineRule: LineRuleType.EXACT },
  })

const cellOf = (ctx: Ctx, slot: string): FilledCell | undefined =>
  ctx.card.cells[`${ctx.template.id}.${slot}`]

function slotRuns(ctx: Ctx, block: CardBlock): TextRun[] {
  const c = cellOf(ctx, block.id)
  switch (block.kind) {
    case 'check': {
      const out = [
        ...runs(c?.checked ? BOX.on : BOX.off),
        ...runs(` ${block.label}${block.alert ? '*' : ''}`, {
          bold: !!block.default,
          italics: !!block.default,
        }),
      ]
      if (block.blank) out.push(...runs(` ${c?.text ?? '____'}`))
      return out
    }
    case 'choice': {
      const out = runs(block.label)
      for (const o of block.options) {
        out.push(
          ...runs(` ${c?.option === o.id ? BOX.on : BOX.off}`),
          ...runs(`${o.label}${o.alert ? '*' : ''}`, { bold: !!o.default, italics: !!o.default }),
        )
      }
      return out
    }
    default:
      return []
  }
}

/** One block as Word content `width` twips wide */
function block(ctx: Ctx, b: CardBlock, width: number): Child[] {
  switch (b.kind) {
    case 'heading':
    case 'banner': {
      const n = b.kind === 'banner' ? b.lines : (b.lines ?? 1)
      const p = para(
        ctx,
        runs(b.title, { bold: true, ...(b.kind === 'banner' && { size: ctx.size + 4 }) }),
        { align: 'center' },
      )
      return [
        table(
          [
            row(
              ctx,
              [
                cell([p], width, {
                  ...(b.shaded && { shading: SHADE }),
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
              n,
            ),
          ],
          [width],
        ),
      ]
    }
    case 'note':
      return [para(ctx, runs(b.text, { size: Math.max(ctx.size - 2, 10) }))]
    case 'cells':
      return [cellsTable(ctx, b, width)]
    case 'text': {
      const c = cellOf(ctx, b.id)
      const label = runs(`${b.label}${b.alert ? '*' : ''}${c?.text ? ' ' : ''}`, { bold: true })
      const paragraphs = lines(ctx, c?.text, label)
      if (b.suffix) {
        // After the text on its last line, or after a blank's width of spaces
        const last = paragraphs.length - 1
        const text = (c?.text ?? '').split('\n')
        paragraphs[last] = para(ctx, [
          ...(last === 0 ? label : []),
          ...runs(text[last] ?? ''),
          ...runs(c?.text ? ` ${b.suffix}` : `${' '.repeat(16)}${b.suffix}`, { bold: true }),
        ])
      }
      return [table([row(ctx, [cell(paragraphs, width)], b.lines)], [width])]
    }
    case 'check':
    case 'choice':
      return [para(ctx, slotRuns(ctx, b))]
    case 'group':
      return [groupTable(ctx, b, width)]
    case 'split': {
      const widths = b.parts.map((p) => (width * p.width) / 100)
      const cells = b.parts.map((p, i) =>
        cell(blocks(ctx, p.blocks, widths[i]!), widths[i]!, {
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        }),
      )
      return [table([new TableRow({ children: cells, cantSplit: true })], widths, false)]
    }
    case 'table':
      return [gridTable(ctx, b, width)]
  }
}

/** Printed lines a block takes: what a row of a group's grid must hold */
function blockLines(b: CardBlock): number {
  switch (b.kind) {
    case 'heading':
      return b.lines ?? 1
    case 'banner':
    case 'text':
      return b.lines
    case 'cells':
      return b.lines + 1
    case 'note':
    case 'check':
    case 'choice':
      return 1
    case 'group': {
      const rows: number[] = []
      for (let i = 0; i < b.blocks.length; i += b.columns)
        rows.push(Math.max(1, ...b.blocks.slice(i, i + b.columns).map(blockLines)))
      const grid = rows.reduce((a, x) => a + x, 0)
      return b.widths ? grid : grid + 1
    }
    case 'split':
      return Math.max(1, ...b.parts.map((p) => p.blocks.reduce((a, x) => a + blockLines(x), 0)))
    case 'table': {
      const head = (b.title ? 1 : 0) + (b.columns.some((c) => c.group) ? 2 : 1)
      return head + b.rows.reduce((a, r) => a + (r.lines ?? 1), 0)
    }
  }
}

function blocks(ctx: Ctx, list: CardBlock[], width: number): Child[] {
  return list.flatMap((b) => block(ctx, b, width))
}

function cellsTable(ctx: Ctx, b: CardCellsBlock, width: number): Table {
  const c = cellOf(ctx, b.id)
  return table(
    [
      row(ctx, [cell([para(ctx, runs(b.title, { bold: true }))], width)]),
      row(ctx, [cell(lines(ctx, c?.text), width)], b.lines),
    ],
    [width],
  )
}

function groupTable(ctx: Ctx, b: Extract<CardBlock, { kind: 'group' }>, width: number): Table {
  const inner = b.widths
    ? b.widths.slice(1)
    : Array.from({ length: b.columns }, () => 100 / b.columns)
  const total = inner.reduce((a, x) => a + x, 0)
  const gridWidth = b.widths ? (width * (100 - b.widths[0]!)) / 100 : width
  const colWidths = inner.map((w) => (gridWidth * w) / total)
  const rows: TableRow[] = []
  for (let i = 0; i < b.blocks.length; i += b.columns) {
    const kids = b.blocks.slice(i, i + b.columns)
    const cells = colWidths.map((w, j) => cell(kids[j] ? blocks(ctx, [kids[j]!], w - 80) : [], w))
    rows.push(row(ctx, cells, Math.max(1, ...kids.map(blockLines))))
  }
  const grid = table(
    rows.length
      ? rows
      : [
          row(
            ctx,
            colWidths.map((w) => cell([], w)),
          ),
        ],
    colWidths,
    false,
  )
  if (!b.widths) {
    return table(
      [
        row(ctx, [cell([para(ctx, runs(b.label, { bold: true }))], width)]),
        new TableRow({
          children: [cell([grid], width, { margins: { top: 0, bottom: 0, left: 0, right: 0 } })],
        }),
      ],
      [width],
    )
  }
  const side = (width * b.widths[0]!) / 100
  const vertical = ctx.template.language === 'zh'
  return table(
    [
      new TableRow({
        children: [
          cell([para(ctx, runs(b.label, { bold: true }), { align: 'center' })], side, {
            verticalAlign: VerticalAlign.CENTER,
            ...(vertical && { textDirection: TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT }),
          }),
          cell([grid], gridWidth, { margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
        ],
        cantSplit: true,
      }),
    ],
    [side, gridWidth],
  )
}

function gridTable(ctx: Ctx, b: Extract<CardBlock, { kind: 'table' }>, width: number): Table {
  const widths = [b.rowHeader.width, ...b.columns.map((c) => c.width)].map((w) => (width * w) / 100)
  const n = widths.length
  const rows: TableRow[] = []
  const head = (
    text: string,
    w: number,
    opts: Partial<ConstructorParameters<typeof TableCell>[0]> = {},
    emphasis = false,
  ) =>
    cell(
      [
        para(ctx, runs(text, { bold: true, ...(emphasis && { italics: true }) }), {
          align: 'center',
        }),
      ],
      w,
      { verticalAlign: VerticalAlign.CENTER, ...opts },
    )
  if (b.title) rows.push(row(ctx, [head(b.title, width, { columnSpan: n, shading: SHADE })]))
  const groups = b.columns.some((c) => c.group)
  if (groups) {
    const spans: { label: string; span: number; width: number }[] = []
    b.columns.forEach((c, i) => {
      const last = spans[spans.length - 1]
      if (last && c.group && last.label === c.group) {
        last.span++
        last.width += widths[i + 1]!
      } else spans.push({ label: c.group ?? '', span: 1, width: widths[i + 1]! })
    })
    rows.push(
      row(ctx, [
        head(b.rowHeader.label, widths[0]!, { rowSpan: 2 }),
        ...spans.map((s) => head(s.label, s.width, { columnSpan: s.span })),
      ]),
    )
  }
  rows.push(
    row(ctx, [
      ...(groups ? [] : [head(b.rowHeader.label, widths[0]!)]),
      ...b.columns.map((c, i) =>
        head(`${c.label}${c.alert ? '*' : ''}`, widths[i + 1]!, {}, !!c.default),
      ),
    ]),
  )
  const insetFrom = b.inset ? b.rows.findIndex((r) => r.id === b.inset!.fromRow) : -1
  const insetColumns = b.inset?.columns ?? []
  const firstInset = b.columns.findIndex((c) => insetColumns.includes(c.id))
  b.rows.forEach((r, ri) => {
    const prev = b.rows[ri - 1]
    const label = `${r.group && r.group !== prev?.group ? `${r.group} ` : ''}${r.label}`
    const cells: TableCell[] = [cell([para(ctx, runs(label, { bold: true }))], widths[0]!)]
    b.columns.forEach((c, ci) => {
      const inInset = insetFrom >= 0 && ri >= insetFrom && insetColumns.includes(c.id)
      if (inInset) {
        if (ri !== insetFrom || ci !== firstInset) return
        const insetWidth = b.columns.reduce(
          (sum, x, xi) => (insetColumns.includes(x.id) ? sum + widths[xi + 1]! : sum),
          0,
        )
        const inset = b.inset!.block
        const text = cellOf(ctx, inset.id)?.text
        cells.push(
          cell([para(ctx, runs(inset.title, { bold: true })), ...lines(ctx, text)], insetWidth, {
            columnSpan: insetColumns.length,
            rowSpan: b.rows.length - insetFrom,
          }),
        )
        return
      }
      const filled = cellOf(ctx, `${b.id}.${r.id}.${c.id}`)
      const tick = c.default !== undefined || c.alert !== undefined
      const content = tick
        ? [
            para(
              ctx,
              [
                ...runs(filled?.checked ? BOX.on : BOX.off),
                ...runs(filled?.text ? ` ${filled.text}` : ''),
              ],
              { align: 'center' },
            ),
          ]
        : lines(ctx, filled?.text ?? (filled?.checked ? '✓' : ''))
      cells.push(cell(content, widths[ci + 1]!))
    })
    rows.push(row(ctx, cells, r.lines ?? 1))
  })
  return table(rows, widths)
}

/** One page of the template (one copy of it; an n-up card repeats the copy across the sheet) */
function page(ctx: Ctx, p: CardPage, copyWidth: number): Table {
  const widths: number[] = []
  const cells: TableCell[] = []
  const none = { margins: { top: 0, bottom: 0, left: 0, right: 0 } }
  p.columns.forEach((column, i) => {
    const gap = i > 0 ? (p.gaps?.[i - 1] ?? 0) : 0
    if (gap > 0) {
      const w = (copyWidth * gap) / 100
      widths.push(w)
      cells.push(cell([], w, none))
    }
    const w = (copyWidth * column.width) / 100
    widths.push(w)
    cells.push(cell(blocks(ctx, column.blocks, w), w, none))
  })
  return table([new TableRow({ children: cells })], widths, false)
}

/** The Word document for a filled card */
export function cardDocument(
  template: CardTemplate,
  card: FilledCard,
  options: CardDocxOptions,
): Document {
  const font = CARD_FONTS[options.font ?? 'arial']
  const paper = PAPER[template.paper]
  const printable = PAPER_WIDTH[template.paper]
  const sideMargin = ((paper.w - printable) / 2) * TW
  const copyWidth = template.printWidth * TW
  const nUp = template.nUp ?? 1
  const properties = {
    page: {
      size: {
        width: PAPER['A4-portrait'].w * TW,
        height: PAPER['A4-portrait'].h * TW,
        orientation:
          template.paper === 'A4-landscape' ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
      },
      margin: {
        top: MARGIN_Y * TW,
        bottom: MARGIN_Y * TW,
        left: sideMargin,
        right: sideMargin,
        header: 0,
        footer: 0,
      },
    },
  }

  const sections = template.pages.map((p) => {
    const ctx: Ctx = {
      template,
      card,
      size: Math.round(template.fontSize * 2),
      line: Math.round((p.lineHeight ?? template.fontSize * 1.5) * TW),
    }
    const one = page(ctx, p, copyWidth)
    if (nUp === 1) return { properties, children: [one, tiny()] }
    // Copies side by side, the space left over between them
    const gap = (printable * TW - copyWidth * nUp) / (nUp - 1)
    const widths: number[] = []
    const cells: TableCell[] = []
    for (let i = 0; i < nUp; i++) {
      if (i > 0 && gap > 0) {
        widths.push(gap)
        cells.push(cell([], gap))
      }
      widths.push(copyWidth)
      cells.push(
        cell([i === 0 ? one : page(ctx, p, copyWidth)], copyWidth, {
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        }),
      )
    }
    return {
      properties,
      children: [table([new TableRow({ children: cells })], widths, false), tiny()],
    }
  })

  if (card.notes.length) {
    const size = Math.round(Math.max(template.fontSize, 9) * 2)
    const auto = { before: 0, after: 0 }
    const children: Paragraph[] = [
      new Paragraph({
        children: runs(options.notesTitle, { bold: true, size: size + 4 }),
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
      }),
    ]
    for (const note of card.notes) {
      children.push(
        new Paragraph({
          children: runs(`[Note ${note.n}] ${note.title}`, { bold: true, size }),
          spacing: { before: 120, after: 40 },
          keepNext: true,
        }),
      )
      for (const line of note.lines)
        children.push(
          new Paragraph({ children: runs(line, { size }), spacing: auto, indent: { left: 200 } }),
        )
    }
    sections.push({ properties, children } as (typeof sections)[number])
  }

  return new Document({
    title: options.title,
    creator: '淡江橋館 TKU BridgeHall',
    styles: {
      default: {
        document: {
          run: {
            font: { ascii: font.latin, hAnsi: font.latin, cs: font.latin, eastAsia: font.eastAsia },
            size: Math.round(template.fontSize * 2),
          },
          paragraph: { spacing: { before: 0, after: 0 } },
        },
      },
    },
    sections,
  })
}

/** The Word file for a filled card */
export async function cardDocx(
  template: CardTemplate,
  card: FilledCard,
  options: CardDocxOptions,
): Promise<Blob> {
  return Packer.toBlob(cardDocument(template, card, options))
}

/** The file name a downloaded card gets */
export function cardFileName(
  template: CardTemplate,
  profileName: string,
  font: CardFont = 'arial',
  version?: number,
): string {
  const safe = profileName.replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '') || 'card'
  return `${template.id}-${safe}${version ? `-v${version}` : ''}${font === 'gill-sans' ? '-gillsans' : ''}.docx`
}

/** Starts a download of `blob` as `name` */
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
