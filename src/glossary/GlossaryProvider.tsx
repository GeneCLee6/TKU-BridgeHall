import { BookOpen } from 'lucide-react'
import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { RichText } from '../components/Suit.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { GlossaryContext, type GlossaryMarker } from '../state/glossaryContext.ts'
import type { Term } from '../types/glossary.ts'
import { compileGlossary, splitTerms, termAnchor } from './match.ts'
import { glossaryStrings as t } from './strings.ts'
import { useGlossary } from './useGlossary.ts'

/**
 * Marks glossary terms in the reading pages' text (e4-t06): RichText with `glossary` set asks the
 * context to split its text. Without any terms nothing is provided, so the text renders as before.
 */
export function GlossaryProvider({ children }: { children: ReactNode }) {
  const { terms } = useGlossary()
  const marker = useMemo<GlossaryMarker | null>(() => {
    const compiled = compileGlossary(terms)
    if (!compiled.pattern) return null
    return (text, seen, plain) =>
      splitTerms(text, compiled, seen).map((piece, i) =>
        piece.term ? (
          <TermMark key={i} term={piece.term}>
            {plain(piece.text)}
          </TermMark>
        ) : (
          <Fragment key={i}>{plain(piece.text)}</Fragment>
        ),
      )
  }, [terms])
  return <GlossaryContext.Provider value={marker}>{children}</GlossaryContext.Provider>
}

/**
 * A term in the text: a button with a dotted underline that opens its explanation. Enter or Space
 * opens it (it is a button), Escape or a tap elsewhere closes it, and focus goes back to the term.
 */
export function TermMark({ term, children }: { term: Term; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const wrap = useRef<HTMLSpanElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const pop = useRef<HTMLSpanElement>(null)
  const { conventions } = useContent()
  const see = term.see ? conventions.find((c) => c.slug === term.see) : undefined

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  // Keep the box on the screen: shift it left when the term is near the right edge
  useLayoutEffect(() => {
    const box = pop.current
    if (!open || !box) return
    box.style.left = '0px'
    const overflow = box.getBoundingClientRect().right - (document.documentElement.clientWidth - 8)
    if (overflow > 0) box.style.left = `${-overflow}px`
  }, [open])

  return (
    <Wrap ref={wrap}>
      <Mark
        ref={button}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? id : undefined}
        data-glossary-term={term.term}
        onClick={() => setOpen((o) => !o)}
      >
        {children}
      </Mark>
      {open && (
        <Pop ref={pop} id={id} role="dialog" aria-label={t.termButton(term.term)}>
          <PopTitle>
            <BookOpen size={14} aria-hidden />
            {term.term}
          </PopTitle>
          <PopText>
            {/* No terms inside an explanation: one box at a time */}
            <GlossaryContext.Provider value={null}>
              <RichText text={term.definition} />
            </GlossaryContext.Provider>
          </PopText>
          <PopLinks>
            {see && (
              <Link to={`/c/${see.slug}`}>
                {t.see}：{see.nameZh}
              </Link>
            )}
            <Link to={`/glossary#${termAnchor(term.term)}`}>{t.openPage}</Link>
          </PopLinks>
        </Pop>
      )}
    </Wrap>
  )
}

const Wrap = styled.span`
  position: relative;
`

const Mark = styled.button`
  display: inline;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: inherit;
  cursor: help;
  text-decoration: underline dotted ${({ theme }) => theme.colors.primary};
  text-decoration-thickness: 1.5px;
  text-underline-offset: 0.2em;

  &[aria-expanded='true'] {
    background: ${({ theme }) => theme.colors.primarySoft};
  }

  @media print {
    text-decoration: none;
  }
`

const Pop = styled.span`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 30;
  display: block;
  width: max-content;
  max-width: min(22rem, calc(100vw - 2rem));
  padding: ${({ theme }) => theme.space(3)};
  border: ${({ theme }) => theme.borders.control} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.panel};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9375rem;
  font-weight: 400;
  line-height: 1.6;
  text-align: left;
  white-space: normal;

  @media print {
    display: none;
  }
`

const PopTitle = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryStrong};
`

const PopText = styled.span`
  display: block;
  margin-top: ${({ theme }) => theme.space(1)};
  white-space: pre-line;
`

const PopLinks = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(3)};
  margin-top: ${({ theme }) => theme.space(2)};
  font-size: 0.875rem;
`
