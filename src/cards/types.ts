// Convention card templates (E3, e3-t01). A template is data: the official form's pages,
// columns and cells, with the labels copied from the printed card. Filling (e3-t03), the
// preview page (e3-t05), print styles and .docx output all read these structures; adding a
// template means adding one file under src/cards/templates/ and registering it there.
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
}

export interface CardColumn {
  id: string
  /** Percent of the printable width; a page's columns add up to 100 */
  width: number
  /** Top to bottom */
  blocks: CardBlock[]
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
}

export interface CardTableRow {
  id: string
  label: string
  /** Printed lines this row occupies (default 1) */
  lines?: number
}

/** An option of a `choice`; same marks as a check */
export interface CardOption {
  id: string
  label: string
  default?: boolean
  alert?: boolean
}

export type CardBlock =
  /** Column or section title with no cells of its own (DEFENSIVE AND COMPETITIVE BIDDING, 開叫約定) */
  | { kind: 'heading'; id: string; title: string; shaded?: boolean }
  /** The form's own title area (WBF logo and "WBF Convention Card 2.19") */
  | { kind: 'banner'; id: string; title: string; lines: number }
  /** Fixed explanatory text printed on the form */
  | { kind: 'note'; id: string; text: string }
  /** A titled run of free-text lines (WBF: OVERCALLS, GENERAL APPROACH AND STYLE…) */
  | { kind: 'cells'; id: string; title: string; titleZh?: string; lines: number; help?: string }
  /** A grid: opening bid descriptions, leads, signals */
  | {
      kind: 'table'
      id: string
      title?: string
      /** Header of the row-label column; `label` may be empty */
      rowHeader: { label: string; width: number }
      columns: CardTableColumn[]
      rows: CardTableRow[]
      help?: string
    }
  /** A tick box (簡易卡); `blank` is a fill-in printed after the label, e.g. 點力 ___ */
  | {
      kind: 'check'
      id: string
      label: string
      alert?: boolean
      default?: boolean
      blank?: { label: string }
      help?: string
    }
  /** One of several printed options; `scope` names the table column it sits under, if any */
  | { kind: 'choice'; id: string; label: string; options: CardOption[]; scope?: string; help?: string }
  /** A labelled fill-in of one or more lines (Category:, Psychics:, 使用人, 其他特約) */
  | { kind: 'text'; id: string; label: string; lines: number; alert?: boolean; help?: string }
  /** A boxed group with a side label (簡易卡 無王／高花…); `columns` lays its blocks out row-major */
  | { kind: 'group'; id: string; label: string; columns: number; blocks: CardBlock[] }

export type CardBlockKind = CardBlock['kind']
