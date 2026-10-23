import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useState } from 'react'
import styled from 'styled-components'
import { cellCall, cellText, DEFAULT_SEATS, normaliseCall, parseResponseLines, rulesToText, suitSymbols, textToRules } from '../../lib/editing.ts'
import { strings } from '../../strings.ts'
import type { AuctionCall, Block, ResponseRow } from '../../types/convention.ts'
import { Button, Field, Input, Row, Select } from '../ui.tsx'
import { AutoTextArea, MiniButton } from './fields.tsx'

type Of<K extends Block['kind']> = Extract<Block, { kind: K }>

const t = strings.editor

/** One content block in the editor: its kind's fields, plus move and delete */
export function BlockEditor({
  block,
  index,
  count,
  onChange,
  onMove,
  onRemove,
}: {
  block: Block
  index: number
  count: number
  onChange: (block: Block) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
}) {
  return (
    <Box aria-label={`${t.blockNames[block.kind]} ${index + 1}`}>
      <Head>
        <Kind>{t.blockNames[block.kind]}</Kind>
        <Row>
          <MiniButton type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={t.moveUp} title={t.moveUp}>
            <ArrowUp size={16} aria-hidden />
          </MiniButton>
          <MiniButton type="button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={t.moveDown} title={t.moveDown}>
            <ArrowDown size={16} aria-hidden />
          </MiniButton>
          <MiniButton type="button" onClick={onRemove} aria-label={t.deleteBlock} title={t.deleteBlock}>
            <Trash2 size={16} aria-hidden />
          </MiniButton>
        </Row>
      </Head>
      {block.kind === 'paragraph' && <ParagraphEditor block={block} onChange={onChange} />}
      {block.kind === 'note' && <NoteEditor block={block} onChange={onChange} />}
      {block.kind === 'rules' && <RulesEditor block={block} onChange={onChange} />}
      {block.kind === 'responses' && <ResponsesEditor block={block} onChange={onChange} />}
      {block.kind === 'hand' && <HandEditor block={block} onChange={onChange} />}
    </Box>
  )
}

function ParagraphEditor({ block, onChange }: { block: Of<'paragraph'>; onChange: (b: Block) => void }) {
  return (
    <>
      <Field>
        {t.text}
        <AutoTextArea minRows={3} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
        <small>{t.textHint}</small>
      </Field>
      <PendingField value={block.pending ?? ''} onChange={(pending) => onChange({ ...block, pending })} />
    </>
  )
}

function NoteEditor({ block, onChange }: { block: Of<'note'>; onChange: (b: Block) => void }) {
  return (
    <>
      <Field>
        {t.tone}
        <Select value={block.tone} onChange={(e) => onChange({ ...block, tone: e.target.value as 'info' | 'warning' })}>
          <option value="info">{t.toneInfo}</option>
          <option value="warning">{t.toneWarning}</option>
        </Select>
      </Field>
      <Field>
        {t.text}
        <AutoTextArea value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
      </Field>
    </>
  )
}

/** Lists are edited as indented text; the text is kept while typing so the cursor never jumps */
function RulesEditor({ block, onChange }: { block: Of<'rules'>; onChange: (b: Block) => void }) {
  const [text, setText] = useState(() => rulesToText(block.items))
  return (
    <>
      <Check>
        <input type="checkbox" checked={!!block.ordered} onChange={(e) => onChange({ ...block, ordered: e.target.checked })} />
        {t.ordered}
      </Check>
      <Field>
        {t.blockNames.rules}
        <AutoTextArea
          minRows={3}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            onChange({ ...block, items: textToRules(e.target.value) })
          }}
        />
        <small>{t.rulesHint}</small>
      </Field>
    </>
  )
}

function ResponsesEditor({ block, onChange }: { block: Of<'responses'>; onChange: (b: Block) => void }) {
  const [paste, setPaste] = useState<string | null>(null)
  const pasted = paste ? parseResponseLines(paste) : []
  const setRows = (rows: ResponseRow[]) => onChange({ ...block, rows })
  const setRow = (i: number, row: ResponseRow) => setRows(block.rows.map((r, j) => (j === i ? row : r)))
  const moveRow = (i: number, delta: -1 | 1) => {
    const to = i + delta
    if (to < 0 || to >= block.rows.length) return
    const rows = [...block.rows]
    ;[rows[i], rows[to]] = [rows[to], rows[i]]
    setRows(rows)
  }

  return (
    <>
      <Field>
        {t.caption}
        <Input value={block.caption ?? ''} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
      </Field>
      {block.auction ? (
        <AuctionEditor
          seats={block.auction.seats}
          calls={block.auction.calls}
          onChange={(auction) => onChange({ ...block, auction })}
          onRemove={() => {
            const next = { ...block }
            delete next.auction
            onChange(next)
          }}
        />
      ) : (
        <div>
          <Button type="button" $small onClick={() => onChange({ ...block, auction: { seats: [...DEFAULT_SEATS], calls: ['?'] } })}>
            {t.addAuction}
          </Button>
        </div>
      )}
      <Rows role="list" aria-label={t.blockNames.responses}>
        {block.rows.map((row, i) => (
          <RowEditor
            key={i}
            row={row}
            first={i === 0}
            last={i === block.rows.length - 1}
            onChange={(r) => setRow(i, r)}
            onMove={(delta) => moveRow(i, delta)}
            onRemove={() => setRows(block.rows.filter((_, j) => j !== i))}
          />
        ))}
      </Rows>
      <Row>
        <Button type="button" $small onClick={() => setRows([...block.rows, { call: '', meaning: '' }])}>
          {t.addRow}
        </Button>
        <Button type="button" $small onClick={() => setPaste(paste === null ? '' : null)} aria-expanded={paste !== null}>
          {t.pasteRows}
        </Button>
        <Button
          type="button"
          $small
          onClick={() => setRows(block.rows.map((r) => ({ ...r, meaning: suitSymbols(r.meaning) })))}
        >
          {t.convertSuits}
        </Button>
      </Row>
      {paste !== null && (
        <Field>
          {t.pasteRows}
          <AutoTextArea minRows={4} value={paste} onChange={(e) => setPaste(e.target.value)} />
          <small>{t.pasteHint}</small>
          <div>
            <Button
              type="button"
              $small
              $variant="primary"
              disabled={!pasted.length}
              onClick={() => {
                const kept = block.rows.filter((r) => r.call || r.meaning)
                setRows([...kept, ...pasted])
                setPaste(null)
              }}
            >
              {t.pasteAdd(pasted.length)}
            </Button>
          </div>
        </Field>
      )}
    </>
  )
}

function RowEditor({
  row,
  first,
  last,
  onChange,
  onMove,
  onRemove,
}: {
  row: ResponseRow
  first: boolean
  last: boolean
  onChange: (row: ResponseRow) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
}) {
  const [more, setMore] = useState(Boolean(row.note || row.pending))
  return (
    <RowBox role="listitem">
      <RowMain>
        <CallInput
          value={row.call}
          onChange={(e) => onChange({ ...row, call: normaliseCall(e.target.value) })}
          aria-label={t.call}
          placeholder={t.call}
        />
        <AutoTextArea
          minRows={1}
          value={row.meaning}
          onChange={(e) => onChange({ ...row, meaning: e.target.value })}
          aria-label={`${row.call || t.call} ${t.meaning}`}
          placeholder={t.meaning}
        />
        <RowTools>
          <MiniButton type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} aria-label={t.more} title={t.more}>
            {more ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
          </MiniButton>
          <MiniButton type="button" onClick={() => onMove(-1)} disabled={first} aria-label={t.moveUp} title={t.moveUp}>
            <ArrowUp size={16} aria-hidden />
          </MiniButton>
          <MiniButton type="button" onClick={() => onMove(1)} disabled={last} aria-label={t.moveDown} title={t.moveDown}>
            <ArrowDown size={16} aria-hidden />
          </MiniButton>
          <MiniButton type="button" onClick={onRemove} aria-label={t.deleteRow} title={t.deleteRow}>
            <Trash2 size={16} aria-hidden />
          </MiniButton>
        </RowTools>
      </RowMain>
      {more && (
        <RowMore>
          <Field>
            {t.rowNote}
            <Input value={row.note ?? ''} onChange={(e) => onChange({ ...row, note: e.target.value })} />
          </Field>
          <PendingField value={row.pending ?? ''} onChange={(pending) => onChange({ ...row, pending })} />
        </RowMore>
      )}
    </RowBox>
  )
}

/** The auction as a grid of four columns, filled row by row like the rendered table */
function AuctionEditor({
  seats,
  calls,
  onChange,
  onRemove,
}: {
  seats: [string, string, string, string]
  calls: AuctionCall[]
  onChange: (auction: { seats: [string, string, string, string]; calls: AuctionCall[] }) => void
  onRemove: () => void
}) {
  // Cells are edited as text, kept while typing a note such as 2C（一門
  const [texts, setTexts] = useState<string[]>(() => calls.map(cellText))
  const [shownRows, setShownRows] = useState(() => Math.max(1, Math.ceil(calls.length / 4)))
  const rows = Math.max(shownRows, Math.ceil(texts.length / 4))
  const setCell = (i: number, text: string) => {
    const next = [...texts]
    while (next.length <= i) next.push('')
    next[i] = text
    setTexts(next)
    const parsed = next.map(cellCall)
    // Empty cells at the end would draw an empty row
    while (parsed.length && parsed[parsed.length - 1] === '') parsed.pop()
    onChange({ seats, calls: parsed })
  }
  return (
    <Fieldset>
      <legend>{t.auction}</legend>
      <Grid role="group" aria-label={t.seats}>
        {seats.map((seat, i) => (
          <SeatInput
            key={i}
            value={seat}
            aria-label={`${t.seats} ${i + 1}`}
            onChange={(e) => {
              const next = [...seats] as [string, string, string, string]
              next[i] = e.target.value
              onChange({ seats: next, calls })
            }}
          />
        ))}
      </Grid>
      <Grid role="group" aria-label={t.auction}>
        {Array.from({ length: rows * 4 }, (_, i) => (
          <Input
            key={i}
            value={texts[i] ?? ''}
            onChange={(e) => setCell(i, e.target.value)}
            aria-label={`${t.auction} ${Math.floor(i / 4) + 1}-${(i % 4) + 1}`}
          />
        ))}
      </Grid>
      <small>{t.auctionHint}</small>
      <Row>
        <Button type="button" $small onClick={() => setShownRows(rows + 1)}>
          {t.addAuctionRow}
        </Button>
        <Button type="button" $small $variant="ghost" onClick={onRemove}>
          {t.removeAuction}
        </Button>
      </Row>
    </Fieldset>
  )
}

function HandEditor({ block, onChange }: { block: Of<'hand'>; onChange: (b: Block) => void }) {
  const suits = [
    ['spades', '♠'],
    ['hearts', '♥'],
    ['diamonds', '♦'],
    ['clubs', '♣'],
  ] as const
  return (
    <>
      <Field>
        {t.handLabel}
        <Input value={block.label ?? ''} onChange={(e) => onChange({ ...block, label: e.target.value })} />
      </Field>
      <Grid>
        {suits.map(([key, symbol]) => (
          <Field key={key}>
            {symbol}
            <Input
              value={block.hand[key]}
              onChange={(e) => onChange({ ...block, hand: { ...block.hand, [key]: e.target.value.toUpperCase().replace('10', 'T') } })}
              aria-label={symbol}
            />
          </Field>
        ))}
      </Grid>
    </>
  )
}

/** The optional 待確認 note of a paragraph, row or section */
export function PendingField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field>
      {t.pending}
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={t.pendingHint} />
    </Field>
  )
}

const Box = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 4px solid ${({ theme }) => theme.colors.lantern};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
`

const Head = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`

const Kind = styled.span`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryStrong};
`

const Check = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  font-size: 0.875rem;
`

const Rows = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
`

const RowBox = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`

const RowMain = styled.div`
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto;
  gap: ${({ theme }) => theme.space(2)};
  align-items: start;

  @media (max-width: 560px) {
    grid-template-columns: 72px minmax(0, 1fr);
  }
`

const RowTools = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(1)};

  @media (max-width: 560px) {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
`

const RowMore = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.space(2)};
`

const CallInput = styled(Input)`
  font-variant-numeric: tabular-nums;
  font-weight: 700;
`

const Fieldset = styled.fieldset`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  margin: 0;
  padding: ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};

  legend {
    padding: 0 ${({ theme }) => theme.space(1)};
    font-size: 0.875rem;
    font-weight: 700;
  }
  small {
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.5;
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space(1)};
`

const SeatInput = styled(Input)`
  background: ${({ theme }) => theme.colors.surfaceAlt};
  font-weight: 600;
  text-align: center;
`
