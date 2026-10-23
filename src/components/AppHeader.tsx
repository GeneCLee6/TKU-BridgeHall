import { Menu, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import type { SearchFn } from '../lib/search.ts'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'
import { IconButton } from './CopyLinkButton.tsx'
import { LogoMark } from './Logo.tsx'
import { SearchBar } from './SearchBar.tsx'

/**
 * Desktop: brand, search, the view actions and the account menu. Mobile: menu button, logo mark,
 * search and the account menu; the view actions move into the menu drawer (HandbookPage passes
 * `actions` only on desktop). Pages other than the handbook leave out the search and the menu.
 */
export function AppHeader({
  search,
  menuOpen = false,
  onToggleMenu,
  actions,
  account,
}: {
  search?: SearchFn
  menuOpen?: boolean
  onToggleMenu?: () => void
  actions?: ReactNode
  account?: ReactNode
}) {
  return (
    <Bar data-print="hide">
      {onToggleMenu && (
        <MenuButton
          type="button"
          onClick={onToggleMenu}
          aria-expanded={menuOpen}
          aria-controls="catalogue"
          aria-label={menuOpen ? strings.closeMenu : strings.openMenu}
        >
          {menuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </MenuButton>
      )}
      <Brand to="/" aria-label={`${strings.appNameEn} ${strings.appNameZh} 首頁`}>
        <LogoMark size={40} />
        <BrandText>
          <strong lang="en">{strings.appNameEn}</strong>
          <span>
            {strings.appNameZh}
            <Tagline>・{strings.tagline}</Tagline>
          </span>
        </BrandText>
      </Brand>
      {search ? <SearchBar search={search} /> : <Spacer />}
      {actions}
      {account}
    </Bar>
  )
}

const Spacer = styled.span`
  flex: 1;
`

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(4)};
  height: ${({ theme }) => theme.layout.headerHeight};
  padding: 0 ${({ theme }) => theme.space(4)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};

  ${mobile} {
    gap: ${({ theme }) => theme.space(2)};
    padding: 0 ${({ theme }) => theme.space(3)};
  }
`

const MenuButton = styled(IconButton)`
  display: none;
  ${mobile} {
    display: inline-flex;
  }
`

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  flex: none;
`

const BrandText = styled.span`
  display: flex;
  flex-direction: column;
  line-height: 1.2;

  strong {
    font-size: 1.0625rem;
    letter-spacing: 0.01em;
  }
  span {
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.text};
    font-weight: 600;
  }
  ${mobile} {
    display: none;
  }
`

const Tagline = styled.span`
  font-weight: 400 !important;
  color: ${({ theme }) => theme.colors.textMuted} !important;
  @media (max-width: 1200px) {
    display: none;
  }
`
