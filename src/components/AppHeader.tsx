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
 * The header v2 (e9-t03, DESIGN-V2 §5.1): four things only, the logo, the system profile, search
 * and the account. Theme, 字級, expand / collapse and print live in the 閱讀設定 panel. On phones
 * a menu button opens the catalogue drawer (where the profile menu goes too). Pages other than the
 * handbook leave out the search and the menu, and may add `actions` of their own.
 */
export function AppHeader({
  search,
  onSearchFocus,
  menuOpen = false,
  onToggleMenu,
  profile,
  actions,
  account,
}: {
  search?: SearchFn
  onSearchFocus?: () => void
  menuOpen?: boolean
  onToggleMenu?: () => void
  /** The system profile pill or menu, next to the logo */
  profile?: ReactNode
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
      <Brand to="/" aria-label={`${strings.appNameEn} ${strings.appNameZh} ${strings.pages.home}`}>
        <LogoMark size={40} />
        <BrandText>
          <strong lang="en">{strings.appNameEn}</strong>
          <span>
            {strings.appNameZh}
            <Tagline>・{strings.tagline}</Tagline>
          </span>
        </BrandText>
      </Brand>
      {profile}
      {search ? <SearchBar search={search} onFocus={onSearchFocus} /> : <Spacer />}
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
