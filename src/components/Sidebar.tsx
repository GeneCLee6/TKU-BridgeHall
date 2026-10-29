import * as Accordion from '@radix-ui/react-accordion'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'
import {
  levels,
  type Category,
  type ConventionMeta,
  type Level,
  type Reference,
} from '../types/convention.ts'
import { conventionPath } from '../lib/sections.ts'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'
import { KindLevel } from './KindLevel.tsx'

/**
 * The catalogue v2 (e9-t07, DESIGN-V2.md §5.7): 全書目錄 with a level filter on top, then the
 * categories (open by default, each can fold) and their conventions. Sections are no longer
 * listed here; the convention page has them in its 本頁 column. The convention in the URL is
 * marked (● and the seal colour) and its category unfolds by itself. The link to the 待確認 panel and the
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
  // Every note still in the content; the panel (/pending, e8-t07) lists them with their status
  const pendingTotal = conventions.reduce((n, c) => n + c.pending.length, 0)
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
    if (current && !openGroups.includes(current.category))
      setOpenGroups((g) => [...g, current.category])
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
          <PendingGroup>
            <h2>
              <PendingLink to="/pending" title={strings.pendingAllHint} onClick={onNavigate}>
                <ChevronBox>
                  <Chevron size={14} aria-hidden />
                </ChevronBox>
                {strings.pendingAll}
                <PendingCount aria-label={strings.pendingCount(pendingTotal)}>
                  {pendingTotal}
                </PendingCount>
              </PendingLink>
            </h2>
          </PendingGroup>
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

  /* Phones: a drawer that slides up above the bottom toolbar (DESIGN-V2.md §7) */
  ${mobile} {
    position: fixed;
    z-index: 40;
    top: auto;
    left: 0;
    right: 0;
    bottom: ${({ theme }) => theme.layout.toolbarHeight};
    width: auto;
    height: min(
      75vh,
      calc(
        100vh - ${({ theme }) => theme.layout.headerHeight} -
          ${({ theme }) => theme.layout.toolbarHeight}
      )
    );
    border-right: none;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.shape.panel} ${({ theme }) => theme.shape.panel} 0 0;
    box-shadow: ${({ theme }) => theme.shadows.panel};
    transform: translateY(
      ${({ $open, theme }) => ($open ? '0' : `calc(100% + ${theme.layout.toolbarHeight})`)}
    );
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

/** The look of a group's heading: the categories' triggers and the 待確認 link */
const groupHeading = css`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  width: 100%;
  min-height: 32px;
  ${mobile} {
    min-height: 44px;
  }
  padding: 0 ${({ theme }) => theme.space(1)} 0 0;
  border: none;
  border-radius: ${({ theme }) => theme.shape.control};
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
`

const GroupTrigger = styled(Accordion.Trigger)`
  ${groupHeading}
  &[data-state='open'] ${Chevron} {
    transform: rotate(90deg);
  }
`

/** 待確認: a link to the panel (e8-t07), set apart from the categories like a group */
const PendingGroup = styled.div`
  margin: ${({ theme }) => theme.space(6)} 0 ${({ theme }) => theme.space(3)};

  h2 {
    margin: 0;
  }
`

const PendingLink = styled(Link)`
  ${groupHeading}
  text-decoration: none;
`

const Count = styled.span`
  margin-left: auto;
  padding: 0 ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.shape.tag};
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
  ${mobile} {
    min-height: 44px;
  }
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
    ${mobile} {
      min-height: 44px;
    }
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

/** Coloured like the 「待確認」 badges: white on the amber line was 2.5:1, under AA (e9-t13) */
const PendingCount = styled(Count)`
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.pendingBorder};
  background: ${({ theme }) => theme.colors.pendingBg};
  color: ${({ theme }) => theme.colors.pendingText};
`

/** An outside link, with a new-tab icon at the end */
const ReferenceLink = styled.a`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.shape.control};
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
