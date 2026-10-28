import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import type { SearchFn } from '../lib/search.ts'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'
import { LogoMark } from './Logo.tsx'
import { SearchBar } from './SearchBar.tsx'

/**
 * The header v2 (e9-t03, DESIGN-V2 §5.1): four things only, the logo, the system profile, search
 * and the account. Theme, 字級, expand / collapse and print live in the 閱讀設定 panel. On phones
 * the catalogue opens from the bottom toolbar (e9-t09, MobileToolbar). Pages other than the
 * handbook leave out the search, and may add `actions` of their own.
 */
export function AppHeader({
  search,
  onSearchFocus,
  profile,
  actions,
  account,
}: {
  search?: SearchFn
  onSearchFocus?: () => void
  /** The system profile pill or menu, next to the logo */
  profile?: ReactNode
  actions?: ReactNode
  account?: ReactNode
}) {
  return (
    <Bar data-print="hide">
      {/* Named by its visible words (WCAG 2.5.3), plus 首頁 for screen readers */}
      <Brand to="/">
        <LogoMark size={40} />
        <BrandText>
          <strong lang="en">{strings.appNameEn}</strong>
          <span>
            {strings.appNameZh}
            <Tagline>・{strings.tagline}</Tagline>
          </span>
          <span className="visually-hidden">{` ${strings.pages.home}`}</span>
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
  /* Off screen but still read: on a phone the logo link is named by these words too */
  ${mobile} {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
`

const Tagline = styled.span`
  font-weight: 400 !important;
  color: ${({ theme }) => theme.colors.textMuted} !important;
  @media (max-width: 1200px) {
    display: none;
  }
`
