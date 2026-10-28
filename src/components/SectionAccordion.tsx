import * as Accordion from '@radix-ui/react-accordion'
import styled, { useTheme } from 'styled-components'
import { sectionNumber } from '../lib/sectionNumber.ts'
import { sectionDomId, sectionKey, sectionPath } from '../lib/sections.ts'
import { useExpansion } from '../state/ExpansionContext.tsx'
import { strings } from '../strings.ts'
import type { Origin, ResolvedSection } from '../lib/profiles.ts'
import { BlockView } from './BlockView.tsx'
import { CopyLinkButton } from './CopyLinkButton.tsx'
import { PendingNote } from './PendingNote.tsx'
import { originColor, OriginMark, ProfileNotes } from './ProfileMarks.tsx'
import { RichText } from './Suit.tsx'

type HeadingTag = 'h3' | 'h4' | 'h5' | 'h6'

/**
 * One level of collapsible sections; renders itself again for children, so nesting depth is
 * whatever the content needs. Open state lives in ExpansionContext.
 *
 * v2 (e9-t06, DESIGN-V2.md §5.4): sections read like the sections of a book, not boxes. The top
 * level is numbered (§1, or 一、 where the style says so) and hangs from a 2px rail in the
 * structure colour; deeper levels have a thin rail. A section the reader's profile overrode
 * draws its rail in the override's colour, next to the words that say whose it is.
 */
export function SectionAccordion({
  slug,
  sections,
  depth = 0,
}: {
  slug: string
  /** With `origin` where the reader's profile replaced a section (e1-t13) */
  sections: ResolvedSection[]
  depth?: number
}) {
  const { openAmong, setLevel } = useExpansion()
  const theme = useTheme()
  const keys = sections.map((s) => sectionKey(slug, s.id))
  const heading = (['h3', 'h4', 'h5', 'h6'] as const)[Math.min(depth, 3)] as HeadingTag

  return (
    <Root $depth={depth} type="multiple" value={openAmong(keys)} onValueChange={(open) => setLevel(keys, open)}>
      {sections.map((section, index) => (
        <Item
          key={section.id}
          value={sectionKey(slug, section.id)}
          id={sectionDomId(slug, section.id)}
          data-section
          $depth={depth}
          $origin={section.origin}
        >
          <Accordion.Header asChild>
            <HeaderRow as={heading}>
              <Trigger $depth={depth}>
                {depth === 0 && <SectionNo aria-hidden>{sectionNumber(theme.sectionNumbers, index + 1)}</SectionNo>}
                <TitleBlock>
                  <Title>
                    <RichText text={section.title} />
                    <OriginMark origin={section.origin} />
                  </Title>
                  {section.summary && (
                    <Summary>
                      <RichText text={section.summary} />
                    </Summary>
                  )}
                </TitleBlock>
                <Caret aria-hidden />
              </Trigger>
              <CopyLinkButton path={sectionPath(slug, section.id)} label={section.title} />
            </HeaderRow>
          </Accordion.Header>
          <Content forceMount data-accordion-content>
            {section.originalTitle && (
              <Original>
                {strings.originalTitle}：{section.originalTitle}
              </Original>
            )}
            <ProfileNotes slug={slug} sectionId={section.id} />
            {section.pending && <PendingNote text={section.pending} />}
            {section.blocks?.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
            {section.children && (
              <SectionAccordion slug={slug} sections={section.children} depth={depth + 1} />
            )}
          </Content>
        </Item>
      ))}
    </Root>
  )
}

const Root = styled(Accordion.Root)<{ $depth: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme, $depth }) => theme.space($depth === 0 ? 5 : 1)};
`

const Item = styled(Accordion.Item)<{ $depth: number; $origin?: Origin }>`
  /* Book sections: no box and no corners, only a rail down the left */
  padding-left: ${({ theme, $depth }) => theme.space($depth === 0 ? 3.5 : 3)};
  border-left: ${({ $depth }) => ($depth === 0 ? 2 : 1)}px solid
    ${({ theme, $depth, $origin }) =>
      $origin ? originColor(theme, $origin) : $depth === 0 ? theme.colors.structure : theme.colors.border};
  scroll-margin-top: calc(${({ theme }) => theme.layout.headerHeight} + 16px);
`

const HeaderRow = styled.h3`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  margin: 0;
`

/** A thin triangle: right when closed, down when open */
const Caret = styled.span`
  flex: none;
  align-self: center;
  width: 0;
  height: 0;
  margin-left: auto;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 6px solid ${({ theme }) => theme.colors.textMuted};
  transition: transform 150ms ease;
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const SectionNo = styled.span`
  flex: none;
  min-width: 1.75em;
  color: ${({ theme }) => theme.colors.structure};
  font-size: 0.9375rem;
  font-variant-numeric: tabular-nums;
`

const Trigger = styled(Accordion.Trigger)<{ $depth: number }>`
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space(2)};
  min-height: 44px;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(2)}
    ${({ theme }) => theme.space(2)} 0;
  border: none;
  background: transparent;
  color: inherit;
  font-family: ${({ theme, $depth }) => ($depth === 0 ? theme.fonts.heading : theme.fonts.body)};
  font-size: ${({ $depth }) => ($depth === 0 ? '1.125rem' : '1rem')};
  text-align: left;
  cursor: pointer;

  &[data-state='open'] ${Caret} {
    transform: rotate(90deg);
  }
  &:hover ${Caret} {
    border-left-color: ${({ theme }) => theme.colors.primary};
  }
`

const TitleBlock = styled.span`
  display: flex;
  flex-direction: column;
`

const Title = styled.span`
  font-weight: ${({ theme }) => theme.headingWeight};
  line-height: 1.4;
`

const Summary = styled.span`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.875rem;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Content = styled(Accordion.Content)`
  padding: 0 0 ${({ theme }) => theme.space(3)};
  overflow-x: auto;
`

const Original = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(1)};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`
