import * as Accordion from '@radix-ui/react-accordion'
import { ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import styled from 'styled-components'
import type { Category, Convention } from '../types/convention.ts'
import { conventionPath, sectionPath } from '../lib/sections.ts'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'
import { RichText } from './Suit.tsx'

/**
 * The catalogue as a tree: categories (open by default) → conventions (closed by default) →
 * top-level sections. Every expandable row has its chevron on the left, and each level is
 * indented under its parent's chevron with a guide line, so the hierarchy reads at a glance.
 * The convention in the URL is opened automatically so the reader always sees where they are.
 */
export function Sidebar({
  categories,
  conventions,
  open,
  onNavigate,
  actions,
}: {
  categories: Category[]
  conventions: Convention[]
  open: boolean
  onNavigate: () => void
  /** View actions shown at the top of the drawer on phones */
  actions?: ReactNode
}) {
  const { slug } = useParams()
  const [openGroups, setOpenGroups] = useState<string[]>(() => categories.map((c) => c.id))
  const [openItems, setOpenItems] = useState<string[]>(() => (slug ? [slug] : []))

  // When the URL moves to another convention, unfold it (adjusting state during render,
  // the React-recommended alternative to an effect).
  const [seenSlug, setSeenSlug] = useState(slug)
  if (slug !== seenSlug) {
    setSeenSlug(slug)
    const current = conventions.find((c) => c.slug === slug)
    if (current) {
      setOpenGroups((g) => (g.includes(current.category) ? g : [...g, current.category]))
      setOpenItems((i) => (i.includes(current.slug) ? i : [...i, current.slug]))
    }
  }

  return (
    <Nav id="catalogue" aria-label={strings.catalogue} $open={open} data-print="hide">
      {actions}
      <Accordion.Root type="multiple" value={openGroups} onValueChange={setOpenGroups}>
        {categories.map((category) => {
          const items = conventions.filter((c) => c.category === category.id)
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
                <Accordion.Root
                  type="multiple"
                  value={openItems}
                  onValueChange={setOpenItems}
                  asChild
                >
                  <Branch>
                    {items.map((c) => (
                      <Accordion.Item key={c.slug} value={c.slug} asChild>
                        <li>
                          <Row>
                            <Accordion.Header asChild>
                              <div>
                                <ItemTrigger aria-label={strings.toggleSections(c.nameZh)}>
                                  <Chevron size={14} aria-hidden />
                                </ItemTrigger>
                              </div>
                            </Accordion.Header>
                            <ConventionLink to={conventionPath(c.slug)} onClick={onNavigate} end>
                              {c.nameZh}
                              <small lang="en">{c.nameEn}</small>
                            </ConventionLink>
                          </Row>
                          <Accordion.Content>
                            <Branch>
                              {c.sections.map((s) => (
                                <li key={s.id}>
                                  <SectionLink to={sectionPath(c.slug, s.id)} onClick={onNavigate}>
                                    <RichText text={s.title} />
                                  </SectionLink>
                                </li>
                              ))}
                            </Branch>
                          </Accordion.Content>
                        </li>
                      </Accordion.Item>
                    ))}
                  </Branch>
                </Accordion.Root>
              </Accordion.Content>
            </Group>
          )
        })}
      </Accordion.Root>
    </Nav>
  )
}

/** Width of the chevron column; child levels hang from its centre */
const CHEVRON = 24

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

const Group = styled(Accordion.Item)`
  margin-bottom: ${({ theme }) => theme.space(3)};

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

const Row = styled.div`
  display: flex;
  align-items: flex-start;
`

const ItemTrigger = styled(Accordion.Trigger)`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${CHEVRON}px;
  height: ${CHEVRON}px;
  margin-top: 6px;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.primary};
  }
  &[data-state='open'] ${Chevron} {
    transform: rotate(90deg);
  }
`

const ConventionLink = styled(NavLink)`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.space(1.5)} ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.text};
  font-weight: 700;
  text-decoration: none;
  line-height: 1.4;

  small {
    font-weight: 400;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  &:hover,
  &.active {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primaryStrong};
  }
`

const SectionLink = styled(NavLink)`
  display: block;
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
  text-decoration: none;
  line-height: 1.5;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
  &.active {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 700;
  }
`
