import * as Accordion from '@radix-ui/react-accordion'
import { ChevronRight, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import {
  allKeys,
  conventionDomId,
  conventionKey,
  conventionPath,
  pendingNotes,
  pendingPath,
} from '../lib/sections.ts'
import { useConvention } from '../state/ContentContext.tsx'
import { useExpansion } from '../state/ExpansionContext.tsx'
import { strings } from '../strings.ts'
import type { Convention, ConventionMeta } from '../types/convention.ts'
import { CopyLinkButton, IconButton } from './CopyLinkButton.tsx'
import { Badge } from './PendingNote.tsx'
import { SectionAccordion } from './SectionAccordion.tsx'
import { RichText } from './Suit.tsx'
import { Tag, TagList } from './Tag.tsx'

/**
 * A Swagger-style operation block: one convention, collapsed to its name, tags and summary.
 * `editPath` adds an edit button for members who may edit; `online` notes who changed it online.
 * The collapsed card comes from the manifest; the sections load the first time it opens. Given a
 * whole Convention (the editor's preview) it shows that instead.
 */
export function ConventionCard({
  convention,
  editPath,
  online,
}: {
  convention: ConventionMeta | Convention
  editPath?: string
  online?: string
}) {
  const { openAmong, setLevel, open, close } = useExpansion()
  const key = conventionKey(convention.slug)
  const given = 'sections' in convention ? convention : undefined
  const pending = given ? pendingNotes(given) : (convention as ConventionMeta).pending
  const isOpen = openAmong([key]).length > 0
  const fetched = useConvention(convention.slug, isOpen && !given)
  const loaded = given ?? fetched.convention
  const { failed, retry } = fetched

  return (
    <Accordion.Root
      type="multiple"
      value={openAmong([key])}
      onValueChange={(v) => setLevel([key], v)}
    >
      <Card value={key} id={conventionDomId(convention.slug)} data-print="card">
        <Accordion.Header asChild>
          <Header>
            <Trigger>
              <Chevron size={22} aria-hidden />
              <Names>
                <NameZh>{convention.nameZh}</NameZh>
                <NameEn lang="en">{convention.nameEn}</NameEn>
              </Names>
            </Trigger>
            {editPath && (
              <EditLink as={Link} to={editPath} aria-label={strings.online.edit(convention.nameZh)} title={strings.online.edit(convention.nameZh)} data-print="hide">
                <Pencil size={16} aria-hidden />
              </EditLink>
            )}
            <CopyLinkButton path={conventionPath(convention.slug)} label={convention.nameZh} />
          </Header>
        </Accordion.Header>
        <Meta>
          <Summary>
            <RichText text={convention.summary} />
          </Summary>
          <MetaRow>
            <TagList aria-label="標籤">
              {convention.tags.map((t) => (
                <Tag key={t} label={t} />
              ))}
            </TagList>
            {pending.length > 0 && (
              <PendingLink
                to={pendingPath(convention.slug, pending[0].sectionId, pending[0].index)}
                title={strings.pendingJump}
              >
                {strings.pendingCount(pending.length)}
              </PendingLink>
            )}
          </MetaRow>
        </Meta>
        <Body forceMount data-accordion-content>
          <Toolbar data-print="hide">
            <TextButton type="button" onClick={() => open(allKeys(convention))}>
              {strings.expandConvention}
            </TextButton>
            <TextButton type="button" onClick={() => close(allKeys(convention).slice(1))}>
              {strings.collapseConvention}
            </TextButton>
          </Toolbar>
          {loaded ? (
            <SectionAccordion slug={convention.slug} sections={loaded.sections} />
          ) : failed ? (
            <Loading role="alert">
              {strings.online.loadFailed}
              <TextButton type="button" onClick={retry}>
                {strings.online.retry}
              </TextButton>
            </Loading>
          ) : (
            isOpen && <Loading role="status">{strings.loading}</Loading>
          )}
          <Source>
            {strings.source}：{convention.source.title}
            {convention.source.note && `（${convention.source.note}）`}・{strings.updated}：
            {convention.updated}
            {online && `・${online}`}
          </Source>
        </Body>
      </Card>
    </Accordion.Root>
  )
}

const Card = styled(Accordion.Item)`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow};
  scroll-margin-top: calc(${({ theme }) => theme.layout.headerHeight} + 16px);
  overflow: hidden;
  /* Cards off screen skip layout and paint until scrolled to, which keeps expand-all fast */
  content-visibility: auto;
  contain-intrinsic-size: auto 160px;
`

const Header = styled.h2`
  display: flex;
  align-items: center;
  margin: 0;
  padding-right: ${({ theme }) => theme.space(3)};
  background: ${({ theme }) => theme.colors.primarySoft};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const EditLink = styled(IconButton)`
  text-decoration: none;
`

const Chevron = styled(ChevronRight)`
  flex: none;
  color: ${({ theme }) => theme.colors.primary};
  transition: transform 150ms ease;
`

const Trigger = styled(Accordion.Trigger)`
  flex: 1;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  min-height: 56px;
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &[data-state='open'] ${Chevron} {
    transform: rotate(90deg);
  }
`

const Names = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: ${({ theme }) => theme.space(3)};
`

const NameZh = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryStrong};
`

const NameEn = styled.span`
  font-size: 0.9375rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Meta = styled.div`
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
`

const Summary = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(2)};
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`

const Body = styled(Accordion.Content)`
  padding: 0 ${({ theme }) => theme.space(4)} ${({ theme }) => theme.space(4)};
`

const Toolbar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(2)};
  justify-content: flex-end;
  margin-bottom: ${({ theme }) => theme.space(2)};
`

export const TextButton = styled.button`
  min-height: 36px;
  padding: 0 ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`

const PendingLink = styled(Badge).attrs({ as: Link })`
  text-decoration: none;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    filter: brightness(0.92);
    text-decoration: underline;
  }
`

const Source = styled.p`
  margin: ${({ theme }) => theme.space(4)} 0 0;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Loading = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
`
