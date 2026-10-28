import * as Accordion from '@radix-ui/react-accordion'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { levels, type Category, type ConventionMeta, type Level, type Reference } from '../types/convention.ts'
import { conventionPath, pendingPath } from '../lib/sections.ts'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'
import { KindLevel } from './KindLevel.tsx'
import { RichText } from './Suit.tsx'

/**
 * The catalogue v2 (e9-t07, DESIGN-V2.md §5.7): 全書目錄 with a level filter on top, then the
 * categories (open by default, each can fold) and their conventions. Sections are no longer
 * listed here; the convention page has them in its 本頁 column. The convention in the URL is
 * marked (● and the seal colour) and its category unfolds by itself. The 待確認 group and the
 * outside references come last.
 */
export function Sidebar({
  categories,
  conventions,
  references,
  open,
  onNavigate,
  actions,
}: {
  categories: Category[]
  conventions: ConventionMeta[]
  /** Outside websites, listed after the categories */
  references: Reference[]
  open: boolean
  onNavigate: () => void
  /** View actions shown at the top of the drawer on phones */
  actions?: ReactNode
}) {
  const { slug } = useParams()
  const [level, setLevel] = useState<Level | 'all'>('all')
  const pending = conventions
    .map((c) => ({ convention: c, notes: c.pending }))
    .filter((p) => p.notes.length > 0)
  const pendingTotal = pending.reduce((n, p) => n + p.notes.length, 0)
  const [openGroups, setOpenGroups] = useState<string[]>(() => [
    ...categories.map((c) => c.id),
    REFERENCES_GROUP,
  ])

  // Categories that arrive later (edited online) start open like the others
  const [seenGroups, setSeenGroups] = useState(() => categories.map((c) => c.id))
  const freshGroups = categories.map((c) => c.id).filter((id) => !seenGroups.includes(id))
  if (freshGroups.length) {
    setSeenGroups((s) => [...s, ...freshGroups])
    setOpenGroups((g) => [...g, ...freshGroups])
  }

  // When the URL moves to another convention, unfold its category (adjusting state during
  // render, the React-recommended alternative to an effect).
  const [seenSlug, setSeenSlug] = useState(slug)
  if (slug !== seenSlug) {
    setSeenSlug(slug)
    const current = conventions.find((c) => c.slug === slug)
    if (current && !openGroups.includes(current.category)) setOpenGroups((g) => [...g, current.category])
  }

  const shown = level === 'all' ? conventions : conventions.filter((c) => c.level === level)

  return (
    <Nav id="catalogue" aria-label={strings.catalogue} $open={open} data-print="hide">
      {actions}
      <Title>
        <Link to="/book" onClick={onNavigate}>
          {strings.pages.book}
        </Link>
      </Title>
      <Filter role="group" aria-label={strings.levelFilter}>
        {(['all', ...levels] as const).map((l) => (
          <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)}>
            {l === 'all' ? strings.allLevels : strings.levels[l]}
          </button>
        ))}
      </Filter>
      <Accordion.Root type="multiple" value={openGroups} onValueChange={setOpenGroups}>
        {categories.map((category) => {
          const items = shown.filter((c) => c.category === category.id)
          if (!items.length) return null
          return (
            <Group key={category.id} value={category.id}>
              <Accordion.Header asChild>
                <h2>
                  <GroupTrigger title={category.description}>
                    <ChevronBox>
                      <Chevron size={14} aria-hidden />
                    </ChevronBox>
                    {category.label}
                    <Count aria-label={strings.conventionCount(items.length)}>{items.length}</Count>
                  </GroupTrigger>
                </h2>
              </Accordion.Header>
              <Accordion.Content>
                <Branch>
                  {items.map((c) => (
                    <li key={c.slug}>
                      <ConventionLink to={conventionPath(c.slug)} onClick={onNavigate}>
                        <Name>
                          {c.nameZh}
                          <small lang="en">{c.nameEn}</small>
                          <KindLevel kind={c.kind} level={c.level} $small />
                        </Name>
                      </ConventionLink>
                    </li>
                  ))}
                </Branch>
              </Accordion.Content>
            </Group>
          )
        })}
        {shown.length === 0 && <Empty>{strings.searchEmpty}</Empty>}
        {pendingTotal > 0 && (
          <Group value={PENDING_GROUP} $apart>
            <Accordion.Header asChild>
              <h2>
                <GroupTrigger title={strings.pendingAllHint}>
                  <ChevronBox>
                    <Chevron size={14} aria-hidden />
                  </ChevronBox>
                  {strings.pendingAll}
                  <PendingCount aria-label={strings.pendingCount(pendingTotal)}>
                    {pendingTotal}
                  </PendingCount>
                </GroupTrigger>
              </h2>
            </Accordion.Header>
            <Accordion.Content>
              <Branch>
                {pending.map(({ convention, notes }) => (
                  <li key={convention.slug}>
                    <PendingConvention>{convention.nameZh}</PendingConvention>
                    <Branch>
                      {notes.map((n, i) => (
                        <li key={i}>
                          <PendingItem
                            to={pendingPath(convention.slug, n.sectionId, n.index)}
                            onClick={onNavigate}
                          >
                            <strong>
                              <RichText text={n.trail[n.trail.length - 1]} />
                            </strong>
                            <span>{n.text}</span>
                          </PendingItem>
                        </li>
                      ))}
                    </Branch>
                  </li>
                ))}
              </Branch>
            </Accordion.Content>
          </Group>
        )}
        {references.length > 0 && (
          <Group value={REFERENCES_GROUP}>
            <Accordion.Header asChild>
              <h2>
                <GroupTrigger title={strings.referencesHint}>
                  <ChevronBox>
                    <Chevron size={14} aria-hidden />
                  </ChevronBox>
                  {strings.references}
                  <Count>{references.length}</Count>
                </GroupTrigger>
              </h2>
            </Accordion.Header>
            <Accordion.Content>
              <Branch>
                {references.map((r) => (
                  <li key={r.url}>
                    <ReferenceLink href={r.url} target="_blank" rel="noopener noreferrer">
                      <Name>
                        {r.title}
                        <small>{r.description}</small>
                      </Name>
                      <ExternalLink size={14} aria-hidden />
                      <span className="visually-hidden">{strings.opensInNewTab}</span>
                    </ReferenceLink>
                  </li>
                ))}
              </Branch>
            </Accordion.Content>
          </Group>
        )}
      </Accordion.Root>
    </Nav>
  )
}

/** Width of the chevron column; child levels hang from its centre */
const CHEVRON = 24

/** Accordion value of the 待確認 group (closed by default; categories start open) */
const PENDING_GROUP = '__pending'

/** Accordion value of the 外部參考 group (open by default, like the categories) */
const REFERENCES_GROUP = '__references'

const Nav = styled.nav<{ $open: boolean }>`
  position: sticky;
  top: ${({ theme }) => theme.layout.headerHeight};
  align-self: start;
  width: ${({ theme }) => theme.layout.sidebarWidth};
  height: calc(100vh - ${({ theme }) => theme.layout.headerHeight});
  overflow-y: auto;
  padding: ${({ theme }) => theme.space(5)} ${({ theme }) => theme.space(3)};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  ${mobile} {
    position: fixed;
    z-index: 40;
    left: 0;
    width: min(85vw, 320px);
    box-shadow: ${({ theme }) => theme.shadow};
    transform: translateX(${({ $open }) => ($open ? '0' : '-100%')});
    visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
    transition:
      transform 200ms ease,
      visibility 200ms;
  }
`

const Chevron = styled(ChevronRight)`
  transition: transform 150ms ease;
`

const ChevronBox = styled.span`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${CHEVRON}px;
  height: ${CHEVRON}px;
`

/** One nested level: indented to hang from the parent's chevron, with a guide line */
const Branch = styled.ul`
  margin: 2px 0 ${({ theme }) => theme.space(2)} ${CHEVRON / 2}px !important;
  padding-left: ${({ theme }) => theme.space(3)} !important;
  border-left: 1px solid
    color-mix(in srgb, ${({ theme }) => theme.colors.textMuted} 40%, transparent);
`

const Group = styled(Accordion.Item)<{ $apart?: boolean }>`
  margin-bottom: ${({ theme }) => theme.space(3)};
  ${({ theme, $apart }) => $apart && `margin-top: ${theme.space(6)};`}

  h2 {
    margin: 0;
  }
`

const GroupTrigger = styled(Accordion.Trigger)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  width: 100%;
  min-height: 32px;
  padding: 0 ${({ theme }) => theme.space(1)} 0 0;
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  font: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-align: left;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
  &[data-state='open'] ${Chevron} {
    transform: rotate(90deg);
  }
`

const Count = styled.span`
  margin-left: auto;
  padding: 0 ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  font-weight: 600;
  letter-spacing: 0;
`

/** A convention; the one on screen is marked with ● and the seal colour */
const ConventionLink = styled(NavLink)`
  position: relative;
  display: flex;
  align-items: flex-start;
  min-height: 36px;
  padding: ${({ theme }) => theme.space(1.5)} ${({ theme }) => theme.space(2)}
    ${({ theme }) => theme.space(1.5)} ${({ theme }) => theme.space(4)};
  border-radius: ${({ theme }) => theme.shape.control};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9375rem;
  font-weight: 500;
  text-decoration: none;
  line-height: 1.4;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.primary};
  }
  &.active {
    color: ${({ theme }) => theme.colors.seal};
    font-weight: 700;
  }
  &.active::before {
    content: '●';
    position: absolute;
    left: ${({ theme }) => theme.space(1)};
    top: 0.85em;
    font-size: 0.5rem;
    line-height: 1;
  }
`

const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space(3)};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1rem;
  font-weight: ${({ theme }) => theme.headingWeight};

  a {
    color: ${({ theme }) => theme.colors.primaryStrong};
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
`

/** 全部／入門／進階／高階 as one row of toggles */
const Filter = styled.div`
  display: flex;
  margin-bottom: ${({ theme }) => theme.space(4)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  overflow: hidden;

  button {
    flex: 1;
    min-height: 32px;
    padding: 0 ${({ theme }) => theme.space(1)};
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.colors.textMuted};
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }
  button + button {
    border-left: 1px solid ${({ theme }) => theme.colors.border};
  }
  button:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
  button[aria-pressed='true'] {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primaryStrong};
    font-weight: 700;
  }
`

const Empty = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(3)};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Name = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;

  small {
    font-size: 0.75rem;
    font-weight: 400;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  small + span {
    margin-top: ${({ theme }) => theme.space(0.5)};
  }
`

const PendingCount = styled(Count)`
  background: ${({ theme }) => theme.colors.pendingBorder};
  color: ${({ theme }) => (theme.mode === 'light' ? '#ffffff' : '#1a1200')};
`

const PendingConvention = styled.p`
  margin: ${({ theme }) => theme.space(1)} 0 0;
  padding: 0 ${({ theme }) => theme.space(2)};
  font-size: 0.8125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`

/** One note: the section it is in, then the note itself cut to two lines */
const PendingItem = styled(Link)`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
  line-height: 1.45;
  text-decoration: none;

  strong {
    color: ${({ theme }) => theme.colors.pendingText};
    font-weight: 600;
  }
  > span {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  &:hover {
    background: ${({ theme }) => theme.colors.pendingBg};
  }
`

/** An outside link, with a new-tab icon at the end */
const ReferenceLink = styled.a`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.5;
  text-decoration: none;

  svg {
    flex: none;
    margin-top: 0.3em;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
`
