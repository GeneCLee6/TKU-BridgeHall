import { Fragment, type ReactNode } from 'react'
import styled from 'styled-components'
import { SUIT_NAME, SUIT_SYMBOL, SYMBOL_TO_LETTER, parseCall, type SuitLetter } from '../lib/calls.ts'

/**
 * A suit symbol. The glyph shape already tells suits apart, so colour is never the only cue;
 * screen readers hear the Chinese suit name.
 */
export function Suit({ suit }: { suit: SuitLetter }) {
  return (
    <SuitGlyph role="img" aria-label={SUIT_NAME[suit]} title={SUIT_NAME[suit]} $suit={suit}>
      {SUIT_SYMBOL[suit]}
    </SuitGlyph>
  )
}

const SuitGlyph = styled.span<{ $suit: SuitLetter }>`
  color: ${({ theme, $suit }) => theme.suits[$suit]};
  font-family: 'Segoe UI Symbol', 'Apple Symbols', ${({ theme }) => theme.fonts.body};
  padding: 0 0.04em;
  @media print {
    color: ${({ $suit }) => ($suit === 'H' || $suit === 'D' ? '#c8102e' : '#000')};
  }
`

/** A call such as 2♦, 1NT, X or Pass */
export function CallLabel({ call }: { call: string }) {
  const parts = parseCall(call)
  return (
    <CallText title={parts.label}>
      {parts.text}
      {parts.suit && <Suit suit={parts.suit} />}
    </CallText>
  )
}

const CallText = styled.span`
  font-weight: 700;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`

/** Text with suit symbols coloured and **bold** honoured; nothing else is interpreted */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{withSuits(part.slice(2, -2))}</strong>
        ) : (
          <Fragment key={i}>{withSuits(part)}</Fragment>
        ),
      )}
    </>
  )
}

function withSuits(text: string): ReactNode[] {
  return text
    .split(/([♠♥♦♣])/g)
    .map((piece, i) =>
      SYMBOL_TO_LETTER[piece] ? <Suit key={i} suit={SYMBOL_TO_LETTER[piece]} /> : piece,
    )
}
