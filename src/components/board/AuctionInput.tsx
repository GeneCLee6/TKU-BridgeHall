import { useId, useState, type KeyboardEvent } from 'react'
import styled, { css } from 'styled-components'
import { parseCall, SUIT_NAME } from '../../lib/calls.ts'
import {
  addCall,
  isAuctionComplete,
  legalCalls,
  LEVELS,
  SEATS,
  seatToCall,
  STRAINS,
  toLabelCall,
  toBookAuction,
  withDealer,
  type TableAuction,
  type Call,
  type Seat,
  type Strain,
} from '../../lib/board.ts'
import { strings } from '../../strings.ts'
import { mobile } from '../../styles/tokens.ts'
import { AuctionTable } from '../AuctionTable.tsx'
import { Suit } from '../Suit.tsx'
import { Button, Field, Input, Row, Select } from '../ui.tsx'

const STRAIN_KEYS: Record<string, Strain> = { c: 'C', d: 'D', h: 'H', s: 'S', n: 'N' }

/**
 * The table's two-row bidding box: Pass and the levels 1–7 on top; X, XX, the strains and 加註
 * below. Choose a level, then a strain, and the bid is made. Only legal calls are enabled, so the
 * auction is always a legal sequence. The keyboard works too: `1`–`7` then `c d h s n`, `p` for
 * Pass, `x` for X or XX, `Esc` to drop the chosen level.
 *
 * With `dealerFixed` the dealer comes from elsewhere (a deal in the same post) and is not shown.
 */
export function AuctionInput({
  value,
  onChange,
  dealerFixed = false,
}: {
  value: TableAuction
  onChange: (auction: TableAuction) => void
  dealerFixed?: boolean
}) {
  const b = strings.board
  const [level, setLevel] = useState<number | null>(null)
  const [alerting, setAlerting] = useState(false)
  const [alert, setAlert] = useState('')
  const hintId = useId()

  const legal = legalCalls(value.calls, value.dealer)
  const ended = isAuctionComplete(value.calls)
  const canBidAt = (n: number) => STRAINS.some((strain) => legal.has(`${n}${strain}`))

  const make = (call: Call) => {
    if (!legal.has(call)) return
    onChange(addCall(value, call, alerting ? alert.trim() : undefined))
    setLevel(null)
    setAlerting(false)
    setAlert('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement || event.altKey || event.ctrlKey || event.metaKey) return
    const key = event.key.toLowerCase()
    if (/^[1-7]$/.test(key) && canBidAt(Number(key))) setLevel(Number(key))
    else if (STRAIN_KEYS[key] && level) make(`${level}${STRAIN_KEYS[key]}`)
    else if (key === 'p') make('P')
    else if (key === 'x') make(legal.has('XX') ? 'XX' : 'X')
    else if (key === 'escape') setLevel(null)
    else return
    event.preventDefault()
  }

  const strainLabel = (strain: Strain) =>
    level ? parseCall(toLabelCall(`${level}${strain}`)).label : strain === 'N' ? b.notrumpName : SUIT_NAME[strain]

  return (
    <Wrap>
      {!dealerFixed && (
        <Field>
          {b.dealer}
          <Select value={value.dealer} onChange={(e) => onChange(withDealer(value, e.target.value as Seat))}>
            {SEATS.map((s) => (
              <option key={s} value={s}>
                {b.seatNames[s]}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <AuctionTable auction={toBookAuction(value, b.seatNames)} />
      <Status role="status">
        {ended ? b.auctionEnded : b.nextToCall(b.seatNames[seatToCall(value.dealer, value.calls.length)])}
      </Status>

      <Box role="group" aria-label={b.auctionBox} aria-describedby={hintId} onKeyDown={onKeyDown}>
        <span id={hintId} className="visually-hidden">
          {b.auctionBoxHint}
        </span>
        <Key type="button" $wide $tone="pass" disabled={!legal.has('P')} onClick={() => make('P')}>
          {parseCall('P').text}
        </Key>
        {LEVELS.map((n) => (
          <Key
            key={n}
            type="button"
            aria-label={b.level(n)}
            aria-pressed={level === n}
            $selected={level === n}
            disabled={!canBidAt(n)}
            onClick={() => setLevel(level === n ? null : n)}
          >
            {n}
          </Key>
        ))}
        <Key
          type="button"
          aria-label={parseCall('X').label}
          $tone="double"
          disabled={!legal.has('X')}
          onClick={() => make('X')}
        >
          {parseCall('X').text}
        </Key>
        <Key
          type="button"
          aria-label={parseCall('XX').label}
          $tone="redouble"
          disabled={!legal.has('XX')}
          onClick={() => make('XX')}
        >
          {parseCall('XX').text}
        </Key>
        {STRAINS.map((strain) => (
          <Key
            key={strain}
            type="button"
            aria-label={strainLabel(strain)}
            disabled={!level || !legal.has(`${level}${strain}`)}
            onClick={() => level && make(`${level}${strain}`)}
          >
            <span aria-hidden>{strain === 'N' ? b.notrump : <Suit suit={strain} />}</span>
          </Key>
        ))}
        <Key
          type="button"
          $wide
          aria-pressed={alerting}
          $selected={alerting}
          disabled={ended}
          onClick={() => setAlerting(!alerting)}
        >
          {b.alert}
        </Key>
      </Box>

      {alerting && (
        <Field>
          {b.alert}
          <Input value={alert} placeholder={b.alertPlaceholder} onChange={(e) => setAlert(e.target.value)} />
        </Field>
      )}

      <Row>
        <Button
          type="button"
          $small
          disabled={!value.calls.length}
          onClick={() => onChange({ ...value, calls: value.calls.slice(0, -1) })}
        >
          {b.undo}
        </Button>
        <Button
          type="button"
          $small
          $variant="ghost"
          disabled={!value.calls.length}
          onClick={() => onChange({ ...value, calls: [] })}
        >
          {b.clearAuction}
        </Button>
      </Row>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  justify-items: start;

  & > label {
    width: min(100%, 12rem);
  }
`

const Status = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`

const Box = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space(1)};
  width: min(100%, 28rem);
  padding: ${({ theme }) => theme.space(2)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`

const Key = styled.button<{ $wide?: boolean; $selected?: boolean; $tone?: 'pass' | 'double' | 'redouble' }>`
  ${({ $wide }) => $wide && 'grid-column: span 2;'}
  min-width: 0;
  min-height: 2.5rem;
  padding: 0 2px;
  border: ${({ theme }) => theme.borders.control} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  /* Pass, X and XX are filled in the table's colours */
  ${({ $tone, theme }) => {
    if (!$tone) return ''
    const fill = { pass: theme.colors.callPass, double: theme.colors.callDouble, redouble: theme.colors.callRedouble }[$tone]
    return css`
      border-color: ${fill};
      background: ${fill};
      color: ${theme.colors.onCall};
    `
  }}

  ${({ $selected, theme }) =>
    $selected &&
    css`
      border-color: ${theme.colors.primary};
      background: ${theme.colors.primary};
      color: ${theme.colors.onPrimary};
    `}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  ${mobile} {
    min-height: 40px;
  }
`
