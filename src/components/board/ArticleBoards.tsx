import { useId, useMemo, useState } from 'react'
import styled from 'styled-components'
import { rankLabel, rankOf, suitOf, toLabelCall, type Card, type Seat } from '../../lib/board.ts'
import {
  parseContract,
  playedTricks,
  trickCount,
  type PlayedCard,
  type Trick,
} from '../../lib/play.ts'
import { libraryStrings } from '../../libraryStrings.ts'
import { mobile } from '../../styles/tokens.ts'
import type { DealBlock, PlayBlock } from '../../types/article.ts'
import { CallLabel, RichText, Suit } from '../Suit.tsx'
import { Button } from '../ui.tsx'
import { DealDiagram } from './DealDiagram.tsx'
import { boardStrings } from './boardStrings.ts'

/**
 * An article's bridge blocks (E5 e5-t02, e5-t03), loaded only when an article has one (BlockView
 * imports this lazily, so the home page carries none of it).
 */

/** 牌例: the forum's `DealDiagram` with the article's caption under it */
export function DealBlockView({ block }: { block: DealBlock }) {
  return (
    <Figure data-block="deal">
      <DealDiagram deal={block.deal} />
      {block.caption?.trim() && (
        <figcaption>
          <RichText text={block.caption} />
        </figcaption>
      )}
    </Figure>
  )
}

const seatName = (seat: Seat) => boardStrings.seatNames[seat]

/** ♠K: the suit (read as its name) and the rank */
function CardLabel({ card }: { card: Card }) {
  return (
    <span>
      <Suit suit={suitOf(card)} />
      {rankLabel(rankOf(card))}
    </span>
  )
}

/**
 * 出牌過程: one trick at a time around the table (the leader and the winner marked in words, not
 * only by weight), the tricks each side has won so far, and a table of every trick that opens on
 * request and is always printed.
 */
export function PlayBlockView({ block }: { block: PlayBlock }) {
  const s = libraryStrings.play
  const tricks = useMemo(() => playedTricks(block.contract, block.declarer, block.tricks), [block])
  const [step, setStep] = useState(0)
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const tableId = useId()
  const contract = parseContract(block.contract)
  const current = tricks[Math.min(step, tricks.length - 1)]
  const tally = trickCount(tricks, block.declarer, step + 1)

  if (!current) return null
  return (
    <Box data-block="play" role="group" aria-labelledby={titleId}>
      <Head id={titleId}>
        <strong>{s.title}</strong>
        <span>
          {s.contract}{' '}
          {contract ? (
            <CallLabel call={toLabelCall(`${contract.level}${contract.strain}`)} />
          ) : (
            block.contract
          )}
          {contract?.doubled && ` ${contract.doubled}`}
        </span>
        <span>{s.declarer(seatName(block.declarer))}</span>
      </Head>

      <Stepper data-print="hide" role="group" aria-label={s.stepper}>
        <Button
          type="button"
          $small
          $variant="ghost"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
        >
          {s.prev}
        </Button>
        <output aria-live="polite">{s.trickOf(current.number, tricks.length)}</output>
        <Button
          type="button"
          $small
          $variant="ghost"
          onClick={() => setStep(step + 1)}
          disabled={step >= tricks.length - 1}
        >
          {s.next}
        </Button>
      </Stepper>

      <Cross data-print="hide">
        {(['N', 'W', 'E', 'S'] as const).map((seat) => (
          <TrickSeat key={seat} trick={current} seat={seat} />
        ))}
        <Tally>{s.tally(tally.declarer, tally.defenders)}</Tally>
      </Cross>

      <Toggle data-print="hide">
        <Button
          type="button"
          $small
          $variant="ghost"
          aria-expanded={open}
          aria-controls={tableId}
          onClick={() => setOpen(!open)}
        >
          {open ? s.hideAll : s.showAll(tricks.length)}
        </Button>
      </Toggle>
      <TableScroll id={tableId} hidden={!open}>
        <TrickTable>
          <caption className="visually-hidden">{s.table}</caption>
          <thead>
            <tr>
              <th scope="col">{s.trick}</th>
              {[1, 2, 3, 4].map((i) => (
                <th key={i} scope="col">
                  {s.card(i)}
                </th>
              ))}
              <th scope="col">{s.winner}</th>
            </tr>
          </thead>
          <tbody>
            {tricks.map((trick) => (
              <tr key={trick.number}>
                <th scope="row">{trick.number}</th>
                {[0, 1, 2, 3].map((i) => (
                  <td key={i}>
                    {trick.cards[i] && (
                      <PlayedCell
                        played={trick.cards[i]}
                        won={trick.winner === trick.cards[i].seat}
                      />
                    )}
                  </td>
                ))}
                <td>{trick.winner ? seatName(trick.winner) : s.notPlayed}</td>
              </tr>
            ))}
          </tbody>
        </TrickTable>
      </TableScroll>

      {block.caption?.trim() && (
        <Caption>
          <RichText text={block.caption} />
        </Caption>
      )}
    </Box>
  )
}

function PlayedCell({ played, won }: { played: PlayedCard; won: boolean }) {
  const Cell = won ? Won : 'span'
  return (
    <Cell>
      <SeatTag>{seatName(played.seat)}</SeatTag> <CardLabel card={played.card} />
    </Cell>
  )
}

function TrickSeat({ trick, seat }: { trick: Trick; seat: Seat }) {
  const s = libraryStrings.play
  const played = trick.cards.find((c) => c.seat === seat)
  const won = trick.winner === seat
  return (
    <SeatSpot $seat={seat} $won={won}>
      <SeatTag>{s.seatCard(seatName(seat))}</SeatTag>
      <span>{played ? <CardLabel card={played.card} /> : s.notPlayed}</span>
      {trick.leader === seat && <Mark>{s.lead}</Mark>}
      {won && <Mark>{s.won}</Mark>}
    </SeatSpot>
  )
}

const Figure = styled.figure`
  margin: ${({ theme }) => theme.space(4)} 0;

  figcaption {
    margin-top: ${({ theme }) => theme.space(1)};
    text-align: center;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const Box = styled.div`
  margin: ${({ theme }) => theme.space(4)} 0;
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border-radius: ${({ theme }) => theme.shape.note};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  ${mobile} {
    padding: ${({ theme }) => theme.space(3)};
  }
`

const Head = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(4)};
  align-items: baseline;
  margin: 0 0 ${({ theme }) => theme.space(2)};
`

const Stepper = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(3)};
  align-items: center;
  justify-content: center;

  output {
    min-width: 8em;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
`

const AREA: Record<Seat, string> = { N: 'north', E: 'east', S: 'south', W: 'west' }

const Cross = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, max-content));
  grid-template-areas:
    '. north .'
    'west tally east'
    '. south .';
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(4)};
  margin: ${({ theme }) => theme.space(3)} 0;
  font-family: ${({ theme }) => theme.fonts.mono};

  ${mobile} {
    gap: ${({ theme }) => theme.space(2)};
  }
`

const SeatSpot = styled.div<{ $seat: Seat; $won: boolean }>`
  grid-area: ${({ $seat }) => AREA[$seat]};
  display: flex;
  gap: ${({ theme }) => theme.space(1)};
  align-items: baseline;
  justify-content: center;
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(2)};
  border: 1px solid ${({ theme, $won }) => ($won ? theme.colors.structure : theme.colors.border)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surface};
  font-weight: ${({ $won }) => ($won ? 700 : 400)};
  white-space: nowrap;
`

const SeatTag = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 400;
`

const Mark = styled.span`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.75rem;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.structure};
`

const Tally = styled.div`
  grid-area: tally;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`

const Toggle = styled.div`
  text-align: center;
`

const TrickTable = styled.table`
  width: 100%;
  margin-top: ${({ theme }) => theme.space(2)};
  border-collapse: collapse;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;

  th,
  td {
    padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(2)};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    text-align: left;
    white-space: nowrap;
  }
  thead th {
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 600;
  }

  ${mobile} {
    th,
    td {
      padding: ${({ theme }) => theme.space(1)};
    }
  }
`

/** Scrolls sideways on narrow phones; positioned for the table's visually hidden caption */
const TableScroll = styled.div`
  position: relative;
  overflow-x: auto;

  @media print {
    &[hidden] {
      display: block !important;
    }
  }
`

const Won = styled.strong`
  font-weight: 700;
`

const Caption = styled.p`
  margin: ${({ theme }) => theme.space(2)} 0 0;
  text-align: center;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`
