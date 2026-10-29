import { useId, useState } from 'react'
import styled from 'styled-components'
import {
  emptyHands,
  fillRemaining,
  HAND_SIZE,
  lastSeatToFill,
  ownerOf,
  SEATS,
  seatToFill,
  toggleCard,
  unassignedCards,
  VULNERABILITIES,
  type Card,
  type Deal,
  type Seat,
  type Vulnerability,
} from '../../lib/board.ts'
import { Button, Field, Row, Select } from '../ui.tsx'
import { DealDiagram } from './DealDiagram.tsx'
import { CardPanel } from './parts.tsx'
import { boardStrings } from './boardStrings.ts'

/**
 * Enter four hands by clicking cards: each card goes to the chosen seat, and when that seat has
 * thirteen the next seat clockwise is chosen. Clicking a card the chosen seat holds puts it back;
 * clicking one another seat holds moves it. The dealer and vulnerability are chosen below.
 */
export function DealInput({ value, onChange }: { value: Deal; onChange: (deal: Deal) => void }) {
  const b = boardStrings
  const [seat, setSeat] = useState<Seat>('N')
  const radioName = useId()
  const hands = value.hands
  const last = lastSeatToFill(hands)
  const missing = unassignedCards(hands).length

  const setHands = (next: typeof hands) => {
    onChange({ ...value, hands: next })
    if (next[seat].length === HAND_SIZE && next[seat].length > hands[seat].length) setSeat(seatToFill(next, seat))
  }

  const toggle = (card: Card) => setHands(toggleCard(hands, seat, card))

  return (
    <Wrap>
      <Seats>
        <legend>{b.seatToFill}</legend>
        {SEATS.map((s) => (
          <SeatOption key={s} $checked={s === seat}>
            <input type="radio" name={radioName} value={s} checked={s === seat} onChange={() => setSeat(s)} />
            {b.seatCount(b.seatNames[s], hands[s].length)}
          </SeatOption>
        ))}
      </Seats>

      <CardPanel
        keyOf={(card) => {
          const owner = ownerOf(hands, card)
          return {
            pressed: owner === seat,
            disabled: owner !== seat && hands[seat].length >= HAND_SIZE,
            owner: owner && b.seatNames[owner],
          }
        }}
        onToggle={toggle}
      />

      <Row>
        <Field>
          {b.dealer}
          <Select value={value.dealer} onChange={(e) => onChange({ ...value, dealer: e.target.value as Seat })}>
            {SEATS.map((s) => (
              <option key={s} value={s}>
                {b.seatNames[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          {b.vul}
          <Select value={value.vul} onChange={(e) => onChange({ ...value, vul: e.target.value as Vulnerability })}>
            {VULNERABILITIES.map((v) => (
              <option key={v} value={v}>
                {b.vulNames[v]}
              </option>
            ))}
          </Select>
        </Field>
      </Row>

      <Row>
        <Status role="status">{missing ? b.dealIncomplete(missing) : b.dealComplete}</Status>
        {last && (
          <Button type="button" $small onClick={() => setHands(fillRemaining(hands, last))}>
            {b.fillRest(b.seatNames[last])}
          </Button>
        )}
        <Button
          type="button"
          $small
          $variant="ghost"
          onClick={() => {
            onChange({ ...value, hands: emptyHands() })
            setSeat('N')
          }}
        >
          {b.clearDeal}
        </Button>
      </Row>

      <DealDiagram deal={value} />
    </Wrap>
  )
}

const Wrap = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};

  ${Row} > label {
    flex: 1 1 10rem;
  }
`

const Seats = styled.fieldset`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2)};
  margin: 0;
  padding: 0;
  border: 0;

  legend {
    width: 100%;
    margin-bottom: ${({ theme }) => theme.space(1)};
    font-size: 0.8125rem;
    font-weight: 600;
  }
`

const SeatOption = styled.label<{ $checked: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  min-height: 2.25rem;
  padding: 0 ${({ theme }) => theme.space(3)};
  border: ${({ theme }) => theme.borders.control}
    ${({ theme, $checked }) => ($checked ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme, $checked }) => ($checked ? theme.colors.primarySoft : theme.colors.surface)};
  font-size: 0.9375rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  cursor: pointer;

  input {
    margin: 0;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`

const Status = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`
