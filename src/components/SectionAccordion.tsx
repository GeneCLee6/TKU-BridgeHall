import * as Accordion from '@radix-ui/react-accordion'
import { ChevronRight } from 'lucide-react'
import styled from 'styled-components'
import { sectionDomId, sectionKey, sectionPath } from '../lib/sections.ts'
import { useExpansion } from '../state/ExpansionContext.tsx'
import { strings } from '../strings.ts'
import type { ResolvedSection } from '../lib/profiles.ts'
import { BlockView } from './BlockView.tsx'
import { CopyLinkButton } from './CopyLinkButton.tsx'
import { PendingNote } from './PendingNote.tsx'
import { OriginMark, ProfileNotes } from './ProfileMarks.tsx'
import { RichText } from './Suit.tsx'

type HeadingTag = 'h3' | 'h4' | 'h5' | 'h6'

/**
 * One level of collapsible sections; renders itself again for children, so nesting depth is
 * whatever the content needs. Open state lives in ExpansionContext.
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
  const keys = sections.map((s) => sectionKey(slug, s.id))
  const heading = (['h3', 'h4', 'h5', 'h6'] as const)[Math.min(depth, 3)] as HeadingTag

  return (
    <Root type="multiple" value={openAmong(keys)} onValueChange={(open) => setLevel(keys, open)}>
      {sections.map((section) => (
        <Item
          key={section.id}
          value={sectionKey(slug, section.id)}
          id={sectionDomId(slug, section.id)}
          data-section
          $depth={depth}
        >
          <Accordion.Header asChild>
            <HeaderRow as={heading}>
              <Trigger>
                <Chevron size={18} aria-hidden />
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

const Root = styled(Accordion.Root)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
`

const Item = styled(Accordion.Item)<{ $depth: number }>`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 4px solid
    ${({ theme, $depth }) => ($depth === 0 ? theme.colors.primary : theme.colors.lantern)};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme, $depth }) =>
    $depth % 2 === 0 ? theme.colors.surface : theme.colors.surfaceAlt};
  scroll-margin-top: calc(${({ theme }) => theme.layout.headerHeight} + 16px);
`

const HeaderRow = styled.h3`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  margin: 0;
  padding-right: ${({ theme }) => theme.space(2)};
  font-size: 1rem;
`

const Chevron = styled(ChevronRight)`
  flex: none;
  margin-top: 3px;
  color: ${({ theme }) => theme.colors.textMuted};
  transition: transform 150ms ease;
`

const Trigger = styled(Accordion.Trigger)`
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space(2)};
  min-height: 48px;
  padding: ${({ theme }) => theme.space(2.5)} ${({ theme }) => theme.space(3)};
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &[data-state='open'] ${Chevron} {
    transform: rotate(90deg);
  }
  &:hover ${Chevron} {
    color: ${({ theme }) => theme.colors.primary};
  }
`

const TitleBlock = styled.span`
  display: flex;
  flex-direction: column;
`

const Title = styled.span`
  font-weight: 700;
  line-height: 1.5;
`

const Summary = styled.span`
  font-size: 0.875rem;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Content = styled(Accordion.Content)`
  padding: 0 ${({ theme }) => theme.space(4)} ${({ theme }) => theme.space(4)}
    ${({ theme }) => theme.space(4)};
  overflow-x: auto;
`

const Original = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(1)};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`
