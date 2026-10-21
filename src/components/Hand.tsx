import styled from 'styled-components'
import type { Hand as HandData } from '../types/convention.ts'
import type { SuitLetter } from '../lib/calls.ts'
import { Suit } from './Suit.tsx'

const ORDER: { suit: SuitLetter; key: keyof HandData }[] = [
  { suit: 'S', key: 'spades' },
  { suit: 'H', key: 'hearts' },
  { suit: 'D', key: 'diamonds' },
  { suit: 'C', key: 'clubs' },
]

/** A thirteen-card hand, one suit per line (for example hands in future conventions) */
export function Hand({ hand, label }: { hand: HandData; label?: string }) {
  return (
    <Figure data-print="keep">
      {label && <figcaption>{label}</figcaption>}
      <dl>
        {ORDER.map(({ suit, key }) => (
          <div key={suit}>
            <dt>
              <Suit suit={suit} />
            </dt>
            <dd>{hand[key] && hand[key] !== '-' ? hand[key].split('').join(' ') : '—'}</dd>
          </div>
        ))}
      </dl>
    </Figure>
  )
}

const Figure = styled.figure`
  display: inline-block;
  margin: ${({ theme }) => theme.space(2)} 0;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(4)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-family: ${({ theme }) => theme.fonts.mono};

  figcaption {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  dl {
    margin: 0;
  }
  div {
    display: flex;
    gap: ${({ theme }) => theme.space(2)};
  }
  dd {
    margin: 0;
    letter-spacing: 0.05em;
  }
`
