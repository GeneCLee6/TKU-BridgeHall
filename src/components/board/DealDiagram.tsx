import styled from 'styled-components'
import { isVulnerable, SEATS, type Deal, type Seat } from '../../lib/board.ts'
import { mobile } from '../../styles/tokens.ts'
import { HandSuits } from './parts.tsx'
import { boardStrings } from './boardStrings.ts'

/**
 * Four hands in the usual cross (North on top, West left), the dealer and vulnerability in the
 * middle; on phones one hand per row, North, East, South, West. A vulnerable seat's name is in
 * the seal colour, and the vulnerability is also written out, so colour is never the only cue.
 * A seat with no cards shows only its name: an article's deal often leaves the defenders out.
 */
export function DealDiagram({ deal, label }: { deal: Deal; label?: string }) {
  const b = boardStrings
  return (
    <Figure role="group" aria-label={label ?? b.deal} data-print="keep">
      {SEATS.map((seat) => (
        <SeatHand key={seat} $seat={seat} role="group" aria-label={b.seatHand(b.seatNames[seat])}>
          <SeatName aria-hidden $vulnerable={isVulnerable(deal.vul, seat)}>
            {b.seatNames[seat]}
          </SeatName>
          {deal.hands[seat].length > 0 && <HandSuits cards={deal.hands[seat]} />}
        </SeatHand>
      ))}
      <Info>
        <span>{b.dealerLine(b.seatNames[deal.dealer])}</span>
        <span>{b.vulNames[deal.vul]}</span>
      </Info>
    </Figure>
  )
}

const AREA: Record<Seat, string> = { N: 'north', E: 'east', S: 'south', W: 'west' }

const Figure = styled.div`
  display: grid;
  grid-template-columns: repeat(3, max-content);
  grid-template-areas:
    '. north .'
    'west info east'
    '. south .';
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(4)};
  width: fit-content;
  max-width: 100%;
  margin: ${({ theme }) => theme.space(2)} auto;
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border-radius: ${({ theme }) => theme.shape.note};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  ${mobile} {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'north' 'east' 'south' 'west' 'info';
    width: 100%;
  }
`

const SeatHand = styled.div<{ $seat: Seat }>`
  grid-area: ${({ $seat }) => AREA[$seat]};
  display: flex;
  gap: ${({ theme }) => theme.space(2)};
  align-items: baseline;

  ${mobile} {
    & > ul {
      display: flex;
      flex-wrap: wrap;
    }
  }
`

const SeatName = styled.span<{ $vulnerable: boolean }>`
  min-width: 1.25em;
  font-weight: 700;
  color: ${({ theme, $vulnerable }) => ($vulnerable ? theme.colors.seal : theme.colors.textMuted)};
`

const Info = styled.div`
  grid-area: info;
  display: grid;
  justify-items: center;
  padding: ${({ theme }) => theme.space(2)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
  white-space: nowrap;

  ${mobile} {
    display: flex;
    gap: ${({ theme }) => theme.space(3)};
    justify-content: start;
    border: 0;
    background: transparent;
    padding: 0;
  }
`
