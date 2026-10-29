import { Fragment, memo, useContext, type ReactNode } from 'react'
import styled from 'styled-components'
import {
  SUIT_NAME,
  SUIT_SYMBOL,
  SYMBOL_TO_LETTER,
  splitCall,
  type SuitLetter,
} from '../lib/calls.ts'
import { GlossaryContext } from '../state/glossaryContext.ts'

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
  const calls = splitCall(call)
  return (
    <CallText title={calls.map((parts) => parts.label).join('、')}>
      {calls.map((parts, i) => (
        <Fragment key={i}>
          {i > 0 && '/'}
          {parts.text}
          {parts.suit && <Suit suit={parts.suit} />}
        </Fragment>
      ))}
    </CallText>
  )
}

const CallText = styled.span`
  font-weight: 700;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`

/**
 * Text with suit symbols coloured and **bold** honoured; nothing else is interpreted. With
 * `glossary`, inside a glossary provider (the reading pages), the first mention of each term is
 * marked (e4-t06); the words themselves never change.
 */
export const RichText = memo(function RichText({ text, glossary }: { text: string; glossary?: boolean }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  const mark = useContext(GlossaryContext)
  const seen = new Set<string>()
  const show = glossary && mark ? (s: string) => mark(s, seen, withSuits) : withSuits
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{show(part.slice(2, -2))}</strong>
        ) : (
          <Fragment key={i}>{show(part)}</Fragment>
        ),
      )}
    </>
  )
})

function withSuits(text: string): ReactNode[] {
  return text
    .split(/([♠♥♦♣])/g)
    .map((piece, i) =>
      SYMBOL_TO_LETTER[piece] ? <Suit key={i} suit={SYMBOL_TO_LETTER[piece]} /> : piece,
    )
}
