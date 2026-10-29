import { createContext, Fragment, useContext, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components'
import type { Origin } from '../lib/profiles.ts'
import { cardColors as c } from '../styles/tokens.ts'
import { cellSummary, PAPER_WIDTH, type SlotInfo } from './describe.ts'
import type { FilledCard } from './fill.ts'
import type { CardBlock, CardCellsBlock, CardPage, CardTemplate } from './types.ts'

/**
 * A convention card drawn like the official form (E3 e3-t05, DESIGN-V2.md §5.10): white paper,
 * black rules, the template's widths in points and its font size, so the screen and the printed
 * page (e3-t07) are the same sheet. The site adds a 「§」 link back to the handbook in the corner
 * of every filled cell and a pale ground on a team's or partnership's cells (both hidden in
 * print, where the ground becomes an underline). Every cell is a button that selects it; the page
 * shows the selected cell's help, sources and hand edit (e3-t06).
 *
 * A template printed n-up (the two-sided simple card) draws its other copies for print only.
 */

export interface CardSheetProps {
  template: CardTemplate
  card: FilledCard
  slots: Map<string, SlotInfo>
  selected?: string
  onSelect?: (slot: string) => void
  /** Where a cell's source is in the handbook, and what to call it */
  sourceLink: (source: { slug: string; sectionId?: string }) => { to: string; name: string }
  /** Text of the 「§」 links and the supplementary notes' heading */
  labels: { toSection: string; notes: string; pending: string }
}

interface Ctx extends CardSheetProps {
  /** Not the first copy of an n-up sheet: drawn for print only, with no buttons or links */
  extra: boolean
}

const SheetContext = createContext<Ctx | null>(null)
const useSheet = () => useContext(SheetContext)!

export function CardSheet(props: CardSheetProps) {
  const { template, card, labels, sourceLink } = props
  const copies = Array.from({ length: template.nUp ?? 1 }, (_, i) => i)
  const paper = PAPER_WIDTH[template.paper]
  return (
    <>
      {template.pages.map((page) => (
        <Paper
          key={page.id}
          data-card-paper
          style={{ width: `${paper}pt`, fontSize: `${template.fontSize}pt`, ...lineHeight(template, page) }}
        >
          {copies.map((i) => (
            <SheetContext.Provider key={i} value={{ ...props, extra: i > 0 }}>
              <Copy
                style={{ width: `${template.printWidth}pt` }}
                {...(i > 0 && { 'data-card-extra': true, 'aria-hidden': true, inert: true })}
              >
                <PageView page={page} />
              </Copy>
            </SheetContext.Provider>
          ))}
        </Paper>
      ))}
      {card.notes.length > 0 && (
        <Paper data-card-paper data-card-notes style={{ width: `${paper}pt`, fontSize: `${Math.max(template.fontSize, 9)}pt` }}>
          <NotesBox>
            <NotesTitle>{labels.notes}</NotesTitle>
            {card.notes.map((note) => {
              const link = sourceLink(note)
              return (
                <NoteItem key={note.n} id={`card-note-${note.n}`}>
                  <NoteHead>
                    <strong>
                      [Note {note.n}] <Ink text={note.title} />
                    </strong>
                    {note.pending && <PendingTag>{labels.pending}</PendingTag>}
                    <SourceLinkInline to={link.to} data-print="hide">
                      § {labels.toSection}
                    </SourceLinkInline>
                  </NoteHead>
                  {note.lines.map((line, i) => (
                    <NoteLine key={i}>
                      <Ink text={line} />
                    </NoteLine>
                  ))}
                </NoteItem>
              )
            })}
          </NotesBox>
        </Paper>
      )}
    </>
  )
}

const lineHeight = (template: CardTemplate, page: CardPage) =>
  ({ '--lh': `${page.lineHeight ?? template.fontSize * 1.5}pt` }) as CSSProperties

function PageView({ page }: { page: CardPage }) {
  return (
    <Columns>
      {page.columns.map((column, i) => (
        <Column
          key={column.id}
          style={{ width: `${column.width}%`, ...(i > 0 && page.gaps?.[i - 1] && { marginLeft: `${page.gaps[i - 1]}%` }) }}
        >
          <Blocks blocks={column.blocks} />
        </Column>
      ))}
    </Columns>
  )
}

function Blocks({ blocks }: { blocks: CardBlock[] }) {
  return blocks.map((block) => <BlockView key={block.id} block={block} />)
}

function BlockView({ block }: { block: CardBlock }) {
  const { template } = useSheet()
  const id = `${template.id}.${block.id}`
  switch (block.kind) {
    case 'heading':
      return (
        <Heading $shaded={!!block.shaded} style={rows(block.lines ?? 1)}>
          {block.title}
        </Heading>
      )
    case 'banner':
      return (
        <Banner $shaded={!!block.shaded} style={rows(block.lines)}>
          {block.title}
        </Banner>
      )
    case 'note':
      return <NoteText>{block.text}</NoteText>
    case 'cells':
      return <CellsView block={block} />
    case 'text':
      return (
        <Boxed>
          <Slot slot={id} lines={block.lines} label={block.label} alert={block.alert} suffix={block.suffix} />
        </Boxed>
      )
    case 'check':
      return <Slot slot={id} lines={1} />
    case 'choice':
      return <Slot slot={id} lines={1} />
    case 'group':
      return <GroupView block={block} />
    case 'split':
      return (
        <Split>
          {block.parts.map((part, i) => (
            <SplitPart key={i} style={{ width: `${part.width}%` }}>
              <Blocks blocks={part.blocks} />
            </SplitPart>
          ))}
        </Split>
      )
    case 'table':
      return <TableView block={block} />
  }
}

function CellsView({ block }: { block: CardCellsBlock }) {
  const { template } = useSheet()
  return (
    <Boxed>
      <CellsTitle style={rows(1)}>{block.title}</CellsTitle>
      <Slot slot={`${template.id}.${block.id}`} lines={block.lines} />
    </Boxed>
  )
}

function GroupView({ block }: { block: Extract<CardBlock, { kind: 'group' }> }) {
  const { template } = useSheet()
  const side = !!block.widths
  const inner = block.widths ? block.widths.slice(1) : Array.from({ length: block.columns }, () => 100 / block.columns)
  const innerTotal = inner.reduce((a, b) => a + b, 0)
  const grid = (
    <GroupGrid style={{ gridTemplateColumns: inner.map((w) => `${(w / innerTotal) * 100}%`).join(' ') }}>
      {block.blocks.map((child) => (
        <GroupItem key={child.id} style={child.kind === 'text' && child.lines > 1 ? { gridRow: `span ${child.lines}` } : undefined}>
          <BlockView block={child} />
        </GroupItem>
      ))}
    </GroupGrid>
  )
  if (!side)
    return (
      <GroupBox>
        <GroupTop style={rows(1)}>{block.label}</GroupTop>
        {grid}
      </GroupBox>
    )
  return (
    <GroupBox $row>
      <GroupSide style={{ width: `${block.widths![0]}%` }} $vertical={template.language === 'zh'}>
        {block.label}
      </GroupSide>
      <div style={{ width: `${100 - block.widths![0]!}%` }}>{grid}</div>
    </GroupBox>
  )
}

function TableView({ block }: { block: Extract<CardBlock, { kind: 'table' }> }) {
  const { template } = useSheet()
  const base = `${template.id}.${block.id}`
  const groups = block.columns.some((col) => col.group)
  const insetFrom = block.inset ? block.rows.findIndex((r) => r.id === block.inset!.fromRow) : -1
  const insetColumns = block.inset?.columns ?? []
  const firstInset = block.columns.findIndex((col) => insetColumns.includes(col.id))
  const groupSpans: { label: string; span: number }[] = []
  for (const col of block.columns) {
    const last = groupSpans[groupSpans.length - 1]
    if (last && col.group && last.label === col.group) last.span++
    else groupSpans.push({ label: col.group ?? '', span: 1 })
  }
  return (
    <Table>
      {block.title && <Caption style={rows(1)}>{block.title}</Caption>}
      <colgroup>
        <col style={{ width: `${block.rowHeader.width}%` }} />
        {block.columns.map((col) => (
          <col key={col.id} style={{ width: `${col.width}%` }} />
        ))}
      </colgroup>
      <thead>
        {groups && (
          <tr style={rows(1)}>
            <th rowSpan={2} scope="col" title={block.rowHeader.help?.text}>
              {block.rowHeader.label}
            </th>
            {groupSpans.map((g, i) => (
              <th key={i} colSpan={g.span} scope="colgroup">
                {g.label}
              </th>
            ))}
          </tr>
        )}
        <tr style={rows(1)}>
          {!groups && (
            <th scope="col" title={block.rowHeader.help?.text}>
              {block.rowHeader.label}
            </th>
          )}
          {block.columns.map((col) => (
            <Th key={col.id} scope="col" title={col.help?.text} $default={!!col.default}>
              {col.label}
              {col.alert && '*'}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {block.rows.map((row, r) => {
          const prev = block.rows[r - 1]
          const lines = row.lines ?? 1
          return (
            <tr key={row.id} style={rows(lines)}>
              <th scope="row">
                {row.group && row.group !== prev?.group ? `${row.group} ` : ''}
                <Ink text={row.label} />
              </th>
              {block.columns.map((col, i) => {
                const inInset = insetFrom >= 0 && r >= insetFrom && insetColumns.includes(col.id)
                if (inInset) {
                  if (r !== insetFrom || i !== firstInset) return null
                  return (
                    <td key="inset" colSpan={insetColumns.length} rowSpan={block.rows.length - insetFrom}>
                      <CellsTitle style={rows(1)}>{block.inset!.block.title}</CellsTitle>
                      <Slot slot={`${template.id}.${block.inset!.block.id}`} lines={block.inset!.block.lines} />
                    </td>
                  )
                }
                const tick = col.default !== undefined || col.alert !== undefined
                return (
                  <td key={col.id}>
                    <Slot slot={`${base}.${row.id}.${col.id}`} lines={lines} tick={tick} bare />
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </Table>
  )
}

const rows = (n: number) => ({ minHeight: `calc(var(--lh) * ${n})`, height: `calc(var(--lh) * ${n})` }) as CSSProperties

/** Text with the red suits in red */
export function Ink({ text }: { text: string }) {
  const parts = text.split(/([♥♦])/u)
  return parts.map((part, i) => (part === '♥' || part === '♦' ? <Red key={i}>{part}</Red> : <Fragment key={i}>{part}</Fragment>))
}

/** A tick box as printed: an outlined square, ✓ when ticked */
function TickBox({ checked }: { checked?: boolean }) {
  return <Tick aria-hidden="true">{checked ? '✓' : ''}</Tick>
}

function Slot({
  slot,
  lines,
  label,
  alert,
  suffix,
  tick,
  bare,
}: {
  slot: string
  lines: number
  /** A text block's label, printed at the start of its first line */
  label?: string
  alert?: boolean
  /** Printed after the fill-in, a blank's width away when it is empty */
  suffix?: string
  /** A table column of tick boxes */
  tick?: boolean
  /** Inside a table cell, which has its own rules */
  bare?: boolean
}) {
  const { card, slots, selected, onSelect, sourceLink, labels, extra } = useSheet()
  const info = slots.get(slot)
  const cell = card.cells[slot]
  if (!info) return null
  const block = info.block
  const content: ReactNode = (() => {
    if (block.kind === 'check')
      return (
        <>
          <TickBox checked={cell?.checked} />{' '}
          <Marked $default={!!block.default}>
            {block.label}
            {block.alert && '*'}
          </Marked>
          {block.blank && (
            <>
              {' '}
              <Blank>
                <Ink text={cell?.text ?? ''} />
              </Blank>
            </>
          )}
        </>
      )
    if (block.kind === 'choice')
      return (
        <>
          <Marked $default={false}>{block.label}</Marked>
          {block.options.map((o) => (
            <Fragment key={o.id}>
              {' '}
              <TickBox checked={cell?.option === o.id} />
              <Marked $default={!!o.default}>
                {o.label}
                {o.alert && '*'}
              </Marked>
            </Fragment>
          ))}
        </>
      )
    if (tick)
      return (
        <>
          <TickBox checked={cell?.checked} />
          {cell?.text && (
            <>
              {' '}
              <Ink text={cell.text} />
            </>
          )}
        </>
      )
    return (
      <>
        {label && (
          <Label>
            {label}
            {alert && '*'}
          </Label>
        )}
        {label && cell?.text && ' '}
        {cell?.text ? <Ink text={cell.text} /> : cell?.checked ? '✓' : null}
        {suffix && (
          <>
            {cell?.text ? ' ' : <Gap aria-hidden="true" />}
            <Label>{suffix}</Label>
          </>
        )}
      </>
    )
  })()

  const first = cell?.sources[0]
  const link = first && sourceLink(first)
  const marks = {
    $origin: cell?.origin,
    $flagged: !!cell?.flagged,
    $pending: !!cell?.pending,
    $selected: !extra && selected === slot,
    $bare: !!bare,
    $center: !!tick,
  }
  return (
    <SlotBox
      {...marks}
      style={{ minHeight: `calc(var(--lh) * ${lines})` }}
      data-card-slot
      {...(cell?.origin && cell.origin !== 'club' && { 'data-origin': cell.origin })}
    >
      {extra || !onSelect ? (
        <SlotText title={info.help?.text}>{content}</SlotText>
      ) : (
        <SlotButton
          type="button"
          title={info.help?.text}
          aria-label={`${info.label}：${cellSummary(info, cell, { checked: '✓', empty: '' }) || '—'}`}
          aria-pressed={selected === slot}
          onClick={() => onSelect(slot)}
          $center={!!tick}
        >
          <span>{content}</span>
        </SlotButton>
      )}
      {!extra && link && (
        <SourceLink to={link.to} aria-label={`${labels.toSection}：${link.name}`} title={link.name} data-print="hide">
          §
        </SourceLink>
      )}
    </SlotBox>
  )
}

// ── Styles: cardColors only (styles/tokens.ts), sizes in points like the form ───────────────────

const rule = `0.5pt solid ${c.rule}`

const Paper = styled.div`
  position: relative;
  box-sizing: border-box;
  display: flex;
  justify-content: space-evenly;
  margin: 0 auto;
  padding: 0;
  color: ${c.ink};
  background: ${c.paper};
  font-family: Arial, 'Helvetica Neue', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
  line-height: var(--lh);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;

  & + & {
    margin-top: 24px;
  }
`

const Copy = styled.div`
  box-sizing: border-box;
  flex: none;

  &[data-card-extra] {
    display: none;
  }
`

const Columns = styled.div`
  display: flex;
  align-items: flex-start;
`

const Column = styled.div`
  box-sizing: border-box;
  border: ${rule};
  & + & {
    border-left: none;
  }
`

const shaded = css<{ $shaded: boolean }>`
  background: ${({ $shaded }) => ($shaded ? c.shade : 'transparent')};
`

const Heading = styled.div<{ $shaded: boolean }>`
  ${shaded}
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: ${rule};
  font-weight: 700;
  text-align: center;
  overflow: hidden;
`

const Banner = styled(Heading)`
  font-size: 1.5em;
  line-height: 1.2;
`

const NoteText = styled.div`
  box-sizing: border-box;
  min-height: var(--lh);
  padding: 0 1.5pt;
  border-bottom: ${rule};
  font-size: 0.85em;
`

const Boxed = styled.div`
  box-sizing: border-box;
  border-bottom: ${rule};
`

const CellsTitle = styled.div`
  box-sizing: border-box;
  padding: 0 1.5pt;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Split = styled.div`
  display: flex;
  align-items: stretch;
  border-bottom: ${rule};
`

const SplitPart = styled.div`
  box-sizing: border-box;
  & + & {
    border-left: ${rule};
  }
`

const GroupBox = styled.div<{ $row?: boolean }>`
  box-sizing: border-box;
  display: ${({ $row }) => ($row ? 'flex' : 'block')};
  border-bottom: ${rule};
`

const GroupTop = styled.div`
  padding: 0 1.5pt;
  font-weight: 700;
`

const GroupSide = styled.div<{ $vertical: boolean }>`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: ${rule};
  font-weight: 700;
  ${({ $vertical }) => $vertical && 'writing-mode: vertical-rl; letter-spacing: 0.2em;'}
`

const GroupGrid = styled.div`
  display: grid;
  grid-auto-rows: minmax(var(--lh), auto);
`

const GroupItem = styled.div`
  min-width: 0;
  & > div {
    border-bottom: none;
  }
`

const Table = styled.table`
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  border-bottom: ${rule};

  th,
  td {
    box-sizing: border-box;
    padding: 0;
    border: ${rule};
    vertical-align: top;
    font-weight: 400;
    text-align: left;
    overflow: hidden;
  }
  tr > :first-child {
    border-left: none;
  }
  tr > :last-child {
    border-right: none;
  }
  thead th {
    padding: 0 1.5pt;
    font-weight: 700;
    text-align: center;
    vertical-align: middle;
  }
  tbody th {
    padding: 0 1.5pt;
  }
`

const Th = styled.th<{ $default: boolean }>`
  ${({ $default }) => $default && 'font-style: italic;'}
`

const Caption = styled.caption`
  box-sizing: border-box;
  padding: 0 1.5pt;
  border-bottom: ${rule};
  font-weight: 700;
  text-align: left;
`

const Red = styled.span`
  color: ${c.red};
`

const Tick = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 0.95em;
  height: 0.95em;
  border: 0.75pt solid ${c.ink};
  font-size: 1em;
  line-height: 1;
  vertical-align: -0.12em;
`

const Marked = styled.span<{ $default: boolean }>`
  ${({ $default }) => $default && 'font-weight: 700; font-style: italic;'}
`

const Blank = styled.span`
  display: inline-block;
  min-width: 3em;
  border-bottom: 0.5pt solid ${c.ink};
  line-height: 1.2;
`

const Gap = styled.span`
  display: inline-block;
  width: 6em;
`

const Label = styled.span`
  font-weight: 700;
`

const originGround = (origin?: Origin) =>
  origin === 'team' ? c.team : origin === 'partnership' ? c.partnership : 'transparent'

const SlotBox = styled.div<{
  $origin?: Origin
  $flagged: boolean
  $pending: boolean
  $selected: boolean
  $bare: boolean
  $center: boolean
}>`
  position: relative;
  box-sizing: border-box;
  ${({ $bare }) => $bare && 'height: 100%;'}
  background: ${({ $origin }) => originGround($origin)};
  background-image: ${({ $bare }) =>
    $bare ? 'none' : `repeating-linear-gradient(to bottom, transparent 0, transparent calc(var(--lh) - 0.5pt), ${c.muted}55 calc(var(--lh) - 0.5pt), ${c.muted}55 var(--lh))`};
  ${({ $center }) => $center && 'text-align: center;'}
  ${({ $pending }) => $pending && `box-shadow: inset 0 0 0 1px ${c.pending};`}
  ${({ $flagged }) => $flagged && `box-shadow: inset 0 0 0 2px ${c.flag};`}
  ${({ $selected }) => $selected && `outline: 2px solid ${c.selected}; outline-offset: -1px; z-index: 1;`}
`

const slotText = css`
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-height: inherit;
  height: 100%;
  margin: 0;
  padding: 0 7pt 0 1.5pt;
  color: inherit;
  font: inherit;
  line-height: var(--lh);
  text-align: inherit;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`

const SlotText = styled.span`
  ${slotText}
`

/** Content at the top like the printed text, not centred as a button's would be */
const SlotButton = styled.button<{ $center: boolean }>`
  ${slotText}
  display: flex;
  align-items: flex-start;
  justify-content: ${({ $center }) => ($center ? 'center' : 'flex-start')};
  border: 0;
  border-radius: 0;
  background: transparent;
  cursor: pointer;

  &:hover {
    background: ${c.selected}14;
  }
  &:focus-visible {
    outline: 2px solid ${c.selected};
    outline-offset: -2px;
  }
`

const SourceLink = styled(Link)`
  position: absolute;
  top: 0;
  right: 0;
  padding: 0 1pt;
  color: ${c.link};
  font-size: 0.85em;
  line-height: 1.1;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`

const SourceLinkInline = styled(Link)`
  margin-left: auto;
  color: ${c.link};
  font-size: 0.9em;
  font-weight: 400;
`

const PendingTag = styled.span`
  color: ${c.pending};
  font-size: 0.9em;
`

const NotesBox = styled.div`
  box-sizing: border-box;
  width: 100%;
  padding: 12pt 4pt;
  line-height: 1.5;
`

const NotesTitle = styled.h2`
  margin: 0 0 8pt;
  font-size: 1.3em;
  text-align: center;
`

const NoteItem = styled.section`
  margin: 0 0 8pt;
  break-inside: avoid;
`

const NoteHead = styled.div`
  display: flex;
  gap: 6pt;
  align-items: baseline;
  border-bottom: ${rule};
`

const NoteLine = styled.p`
  margin: 2pt 0 0;
  white-space: pre-wrap;
`
