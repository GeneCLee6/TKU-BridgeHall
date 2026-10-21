import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import type { Category, Convention } from '../types/convention.ts'
import { conventionPath, sectionPath } from '../lib/sections.ts'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'
import { RichText } from './Suit.tsx'

/** The catalogue: categories, their conventions, and each convention's top-level sections */
export function Sidebar({
  categories,
  conventions,
  open,
  onNavigate,
}: {
  categories: Category[]
  conventions: Convention[]
  open: boolean
  onNavigate: () => void
}) {
  return (
    <Nav id="catalogue" aria-label={strings.catalogue} $open={open} data-print="hide">
      {categories.map((category) => {
        const items = conventions.filter((c) => c.category === category.id)
        if (!items.length) return null
        return (
          <Group key={category.id}>
            <GroupTitle title={category.description}>{category.label}</GroupTitle>
            <ul>
              {items.map((c) => (
                <li key={c.slug}>
                  <ConventionLink to={conventionPath(c.slug)} onClick={onNavigate} end>
                    {c.nameZh}
                    <small lang="en">{c.nameEn}</small>
                  </ConventionLink>
                  <SectionList>
                    {c.sections.map((s) => (
                      <li key={s.id}>
                        <SectionLink to={sectionPath(c.slug, s.id)} onClick={onNavigate}>
                          <RichText text={s.title} />
                        </SectionLink>
                      </li>
                    ))}
                  </SectionList>
                </li>
              ))}
            </ul>
          </Group>
        )
      })}
    </Nav>
  )
}

const Nav = styled.nav<{ $open: boolean }>`
  position: sticky;
  top: ${({ theme }) => theme.layout.headerHeight};
  align-self: start;
  width: ${({ theme }) => theme.layout.sidebarWidth};
  height: calc(100vh - ${({ theme }) => theme.layout.headerHeight});
  overflow-y: auto;
  padding: ${({ theme }) => theme.space(5)} ${({ theme }) => theme.space(4)};
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
    transition: transform 200ms ease, visibility 200ms;
  }
`

const Group = styled.section`
  margin-bottom: ${({ theme }) => theme.space(6)};
`

const GroupTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space(2)};
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.textMuted};
`

const ConventionLink = styled(NavLink)`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
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

const SectionList = styled.ul`
  margin: ${({ theme }) => theme.space(1)} 0 ${({ theme }) => theme.space(3)}
    ${({ theme }) => theme.space(3)} !important;
  border-left: 2px solid ${({ theme }) => theme.colors.border};
`

const SectionLink = styled(NavLink)`
  display: block;
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(3)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
  text-decoration: none;
  line-height: 1.5;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
  &.active {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 700;
  }
`
