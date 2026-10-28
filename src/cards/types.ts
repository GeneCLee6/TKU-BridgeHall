// Convention card templates (E3, e3-t01). A template is data: the official form's pages,
// columns and cells, with the labels copied from the printed card. Filling (e3-t03), the
// preview page (e3-t05), print styles and .docx output all read these structures; adding a
// template means adding one file under src/cards/templates/ and registering it there.
//
// Widths are always percentages (of the page, a table or a group), worked out from the
// original file's twips or PDF points; each template file keeps the source measurements.
//
// Not imported by the site yet; when the card page lands it must be lazy-loaded so the home
// page budget (scripts/check-budget.mjs) is unaffected.

export type CardTemplateId = 'wbf' | 'ctcba-simple' | 'ctcba-simple-2p' | 'bsc-opening' | 'bsc-overcall'

export interface CardTemplate {
  id: CardTemplateId
  /** Name as printed on the form */
  name: string
  nameZh?: string
  /** Form version as printed (e.g. WBF "2.19"); the year is the edition the file follows */
  version?: string
  year: number
  /** Who publishes the form, printed in its header or footer */
  publisher: string
  paper: 'A4-landscape' | 'A4-portrait'
  /** Language of the printed labels: what `fillCard` writes in labels of its own ([Note n] names) */
  language: 'en' | 'zh'
  /** Printable width of one copy, in points, measured from the source file */
  printWidth: number
  /** Body font size of the source file, in points (with `printWidth`, how much text a cell holds) */
  fontSize: number
  /**
   * The template whose slot ids this one shares under its own prefix (the two-sided simple card
   * has the single-sided card's cells): conventions' `cardSlots` written for that template fill
   * this one as well
   */
  sameSlotsAs?: CardTemplateId
  /**
   * Copies printed side by side on one sheet (the two-sided simple card is printed two-up and
   * cut in half); a page then describes one copy and its widths are percent of the copy
   */
  nUp?: number
  pages: CardPage[]
  /**
   * Layout details that still need checking against the original file (shown as 待確認
   * wherever the template is listed). Undefined once the template has been verified.
   */
  pending?: string
}

export interface CardPage {
  id: string
  /** Side by side, left to right */
  columns: CardColumn[]
  /**
   * Blank gutters between adjacent columns, percent of the printable width (one fewer than
   * the columns); the columns plus the gutters add up to 100
   */
  gaps?: number[]
  /** Height of one printed line, in points, measured from the source file (default 1.5 × `fontSize`) */
  lineHeight?: number
}

export interface CardColumn {
  id: string
  /** Percent of the printable width (see `CardPage.gaps`) */
  width: number
  /** Top to bottom */
  blocks: CardBlock[]
}

/** What a cell asks for, quoted or closely excerpted from the publisher's own guide */
export interface CardHelp {
  text: string
  /** Where the text comes from, e.g. "Guide to Completion of the WBF System Card (2017), p. 11" */
  source: string
}

/** A column of a table; `width` is a percent of the table width (row header included) */
export interface CardTableColumn {
  id: string
  label: string
  width: number
  /** Header spanning several adjacent columns (e.g. 王牌合約 over 正序／反序) */
  group?: string
  /** Printed bold italic: the default when nothing is ticked */
  default?: boolean
  /** Printed with an asterisk: must be alerted */
  alert?: boolean
  help?: CardHelp
}

export interface CardTableRow {
  id: string
  label: string
  /** Printed lines this row occupies (default 1) */
  lines?: number
  /** Label shared by several adjacent rows (WBF signals: "Suit" beside lines 1–3) */
  group?: string
}

/** An option of a `choice`; same marks as a check */
export interface CardOption {
  id: string
  label: string
  default?: boolean
  alert?: boolean
}

/** A titled run of free-text lines (WBF: OVERCALLS, GENERAL APPROACH AND STYLE…) */
export interface CardCellsBlock {
  kind: 'cells'
  id: string
  title: string
  titleZh?: string
  lines: number
  help?: CardHelp
}

export type CardBlock =
  /** Column or section title with no cells of its own (DEFENSIVE AND COMPETITIVE BIDDING, 開叫約定) */
  | { kind: 'heading'; id: string; title: string; shaded?: boolean; /** Printed lines (default 1) */ lines?: number }
  /** The form's own title area (WBF "W B F CONVENTION CARD", 國橋 簡易制度卡) */
  | { kind: 'banner'; id: string; title: string; lines: number; shaded?: boolean }
  /** Fixed explanatory text printed on the form */
  | { kind: 'note'; id: string; text: string }
  | CardCellsBlock
  /** A grid: opening bid descriptions, leads, signals */
  | {
      kind: 'table'
      id: string
      title?: string
      /** Header of the row-label column; `label` may be empty */
      rowHeader: { label: string; width: number; help?: CardHelp }
      columns: CardTableColumn[]
      rows: CardTableRow[]
      /**
       * A free-text block printed inside the table's bottom-right corner (WBF: HIGH LEVEL
       * BIDDING over Subsequent action and Passed hand from the 5♣ row down); rows from
       * `fromRow` on have no cells in `columns`
       */
      inset?: { fromRow: string; columns: string[]; block: CardCellsBlock }
      help?: CardHelp
    }
  /** A tick box (簡易卡); `blank` is a fill-in printed after the label, e.g. 點力 ___ */
  | {
      kind: 'check'
      id: string
      label: string
      alert?: boolean
      default?: boolean
      blank?: { label: string }
      help?: CardHelp
    }
  /** One of several printed options; `scope` names the table column it sits under, if any */
  | { kind: 'choice'; id: string; label: string; options: CardOption[]; scope?: string; help?: CardHelp }
  /** A labelled fill-in of one or more lines (CATEGORY:, PSYCHICS:, 使用人, 其他特約) */
  | { kind: 'text'; id: string; label: string; lines: number; alert?: boolean; help?: CardHelp }
  /**
   * A boxed group with a label (簡易卡 無王／高花… at the side, 首攻 on top); `columns` lays its
   * blocks out row-major. `widths`, when given, are percent of the group: the side label, then
   * each column (a label and its tick box count as one column)
   */
  | { kind: 'group'; id: string; label: string; columns: number; widths?: number[]; blocks: CardBlock[] }
  /** Blocks side by side inside a column (簡易卡: title beside 使用人; 首攻 beside 防禦訊號) */
  | { kind: 'split'; id: string; parts: { width: number; blocks: CardBlock[] }[] }

export type CardBlockKind = CardBlock['kind']
