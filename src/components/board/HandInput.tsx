import styled from 'styled-components'
import { HAND_SIZE, hcp, sortHand, type Card } from '../../lib/board.ts'
import { strings } from '../../strings.ts'
import { Button, Row } from '../ui.tsx'
import { CardPanel, HandSuits } from './parts.tsx'

/** Enter one hand: click up to thirteen cards; clicking a chosen card puts it back */
export function HandInput({ value, onChange }: { value: Card[]; onChange: (cards: Card[]) => void }) {
  const b = strings.board
  const full = value.length >= HAND_SIZE

  const toggle = (card: Card) => {
    if (value.includes(card)) onChange(value.filter((c) => c !== card))
    else if (!full) onChange(sortHand([...value, card]))
  }

  return (
    <Wrap>
      <CardPanel
        keyOf={(card) => {
          const pressed = value.includes(card)
          return { pressed, disabled: !pressed && full }
        }}
        onToggle={toggle}
      />
      <Row>
        <Status role="status">
          {b.handStatus(value.length, hcp(value))}
        </Status>
        <Button type="button" $small $variant="ghost" onClick={() => onChange([])} disabled={!value.length}>
          {b.clearHand}
        </Button>
      </Row>
      <Preview role="group" aria-label={b.hand}>
        <HandSuits cards={value} inline />
      </Preview>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`

const Status = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
`

const Preview = styled.div`
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.shape.note};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`
