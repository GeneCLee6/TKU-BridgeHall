import { BookOpen, GraduationCap, Library, MessagesSquare, Target, Users, type LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'

type Place = { to: string; label: string; icon: LucideIcon; match: string[] }

/** The site's sections, in the order the header lists them; `match` are the paths that are "here" */
// oxlint-disable-next-line react/only-export-components
export const places: Place[] = [
  { to: '/', label: strings.nav.book, icon: BookOpen, match: ['/', '/book', '/c/', '/glossary', '/pending'] },
  { to: '/library', label: strings.nav.library, icon: Library, match: ['/library'] },
  { to: '/learn', label: strings.nav.learn, icon: GraduationCap, match: ['/learn'] },
  { to: '/practice', label: strings.nav.practice, icon: Target, match: ['/practice'] },
  { to: '/forum', label: strings.nav.forum, icon: MessagesSquare, match: ['/forum'] },
  { to: '/teams', label: strings.nav.teams, icon: Users, match: ['/teams', '/pairs'] },
]

// oxlint-disable-next-line react/only-export-components
export function isHere(place: Place, path: string) {
  return place.match.some((m) => (m === '/' ? path === '/' : path === m || path.startsWith(m.endsWith('/') ? m : `${m}/`)))
}

/**
 * The header's links to the site's sections (橋譜, 叢書, 學習, 練習, 討論區, 隊伍), the one where the
 * reader is marked with `aria-current`. Desktop only: phones reach them from the account menu.
 */
export function SiteNav() {
  const path = useLocation().pathname
  return (
    <Nav aria-label={strings.nav.label}>
      {places.map((place) => {
        const here = isHere(place, path)
        const Icon = place.icon
        return (
          <Item key={place.to} to={place.to} aria-current={here ? 'page' : undefined}>
            <Icon size={16} aria-hidden />
            <span>{place.label}</span>
          </Item>
        )
      })}
    </Nav>
  )
}

const Nav = styled.nav`
  display: flex;
  align-items: stretch;
  align-self: stretch;
  gap: ${({ theme }) => theme.space(1)};
  flex: none;

  ${mobile} {
    display: none;
  }
`

const Item = styled(Link)`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1.5)};
  padding: 0 ${({ theme }) => theme.space(2.5)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9375rem;
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;

  /* The bar under the section the reader is in, sitting on the header's bottom line */
  &::after {
    content: '';
    position: absolute;
    left: ${({ theme }) => theme.space(2)};
    right: ${({ theme }) => theme.space(2)};
    bottom: -1px;
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: transparent;
  }
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
  &:hover::after {
    background: ${({ theme }) => theme.colors.border};
  }
  &[aria-current='page'] {
    color: ${({ theme }) => theme.colors.primaryStrong};
  }
  &[aria-current='page']::after {
    background: ${({ theme }) => theme.colors.primary};
  }

  /* Narrower desktops keep the words and drop the pictures */
  @media (max-width: 1400px) {
    padding: 0 ${({ theme }) => theme.space(2)};
    svg {
      display: none;
    }
  }
`
