import { useId, useRef, useState, type KeyboardEvent } from 'react'
import styled from 'styled-components'
import { SUIT_NAME } from '../../lib/calls.ts'
import { bySuit, RANKS, rankLabel, SUITS, type Card } from '../../lib/board.ts'
import { strings } from '../../strings.ts'
import { mobile } from '../../styles/tokens.ts'
import { Suit } from '../Suit.tsx'

/** One hand as four suits, ♠ ♥ ♦ ♣; a void shows a dash */
export function HandSuits({ cards, inline = false }: { cards: readonly Card[]; inline?: boolean }) {
  const suits = bySuit(cards)
  return (
    <SuitList $inline={inline}>
      {SUITS.map((suit) => (
        <li key={suit}>
          <Suit suit={suit} />
          <span>
            {suits[suit].length
              ? suits[suit].map((card) => rankLabel(card[1])).join(' ')
              : strings.board.void}
          </span>
        </li>
      ))}
    </SuitList>
  )
}

const SuitList = styled.ul<{ $inline: boolean }>`
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-variant-numeric: tabular-nums;
  display: ${({ $inline }) => ($inline ? 'flex' : 'grid')};
  flex-wrap: wrap;
  column-gap: ${({ theme }) => theme.space(3)};

  li {
    display: flex;
    gap: ${({ theme }) => theme.space(1)};
    white-space: nowrap;
  }
`

export interface CardKey {
  /** Shown as pressed: the card belongs to what is being entered */
  pressed: boolean
  /** Cannot be chosen now (still focusable, so the arrow keys keep moving through the panel) */
  disabled?: boolean
  /** Who holds the card, shown small in its corner and read after its name */
  owner?: string
}

const CARDS = SUITS.flatMap((suit) => [...RANKS].map((rank) => suit + rank))

/**
 * The 4×13 card panel, ♠ ♥ ♦ ♣ rows, A to 2. One tab stop: the arrow keys move between cards,
 * Home and End jump to the ends of a row, Enter or Space chooses.
 */
export function CardPanel({ keyOf, onToggle }: { keyOf: (card: Card) => CardKey; onToggle: (card: Card) => void }) {
  const [focus, setFocus] = useState(0)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const hintId = useId()

  const move = (index: number) => {
    setFocus(index)
    refs.current[index]?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const row = Math.floor(index / 13)
    const col = index % 13
    const target = {
      ArrowRight: row * 13 + Math.min(12, col + 1),
      ArrowLeft: row * 13 + Math.max(0, col - 1),
      ArrowDown: Math.min(3, row + 1) * 13 + col,
      ArrowUp: Math.max(0, row - 1) * 13 + col,
      Home: row * 13,
      End: row * 13 + 12,
    }[event.key]
    if (target === undefined) return
    event.preventDefault()
    move(target)
  }

  return (
    <Panel role="group" aria-label={strings.board.cardPanel} aria-describedby={hintId}>
      <span id={hintId} className="visually-hidden">
        {strings.board.cardPanelHint}
      </span>
      {SUITS.map((suit, row) => (
        <SuitRow key={suit} role="group" aria-label={SUIT_NAME[suit]}>
          <span aria-hidden>
            <Suit suit={suit} />
          </span>
          {[...RANKS].map((rank, col) => {
            const index = row * 13 + col
            const card = CARDS[index]
            const key = keyOf(card)
            const name = strings.board.cardName(SUIT_NAME[suit], rankLabel(rank))
            return (
              <Key
                key={card}
                ref={(el) => {
                  refs.current[index] = el
                }}
                type="button"
                tabIndex={index === focus ? 0 : -1}
                aria-pressed={key.pressed}
                aria-disabled={key.disabled || undefined}
                aria-label={key.owner ? strings.board.heldBy(name, key.owner) : name}
                $pressed={key.pressed}
                $held={!!key.owner && !key.pressed}
                onFocus={() => setFocus(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
                onClick={() => {
                  if (!key.disabled) onToggle(card)
                }}
              >
                {rankLabel(rank)}
                {key.owner && <Owner aria-hidden>{key.owner}</Owner>}
              </Key>
            )
          })}
        </SuitRow>
      ))}
    </Panel>
  )
}

const Panel = styled.div`
  position: relative;
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
  max-width: 40rem;
`

const SuitRow = styled.div`
  display: grid;
  grid-template-columns: 1.5rem repeat(13, minmax(0, 1fr));
  align-items: center;
  gap: 2px;
  font-size: 1.125rem;
`

const Key = styled.button<{ $pressed: boolean; $held: boolean }>`
  position: relative;
  min-width: 0;
  min-height: 2.5rem;
  padding: 0;
  border: ${({ theme }) => theme.borders.control}
    ${({ theme, $pressed }) => ($pressed ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme, $pressed, $held }) =>
    $pressed ? theme.colors.primary : $held ? theme.colors.surfaceAlt : theme.colors.surface};
  color: ${({ theme, $pressed, $held }) =>
    $pressed ? theme.colors.onPrimary : $held ? theme.colors.textMuted : theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;

  &[aria-disabled='true'] {
    opacity: 0.45;
    cursor: not-allowed;
  }

  ${mobile} {
    min-height: 40px;
    font-size: 0.8125rem;
  }
`

const Owner = styled.span`
  position: absolute;
  right: 2px;
  bottom: 1px;
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1;
`
