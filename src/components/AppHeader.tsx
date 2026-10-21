import { ChevronsDownUp, ChevronsUpDown, Menu, Moon, Printer, Sun, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import type { SearchFn } from '../lib/search.ts'
import { usePreferences } from '../state/PreferencesContext.tsx'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'
import { IconButton } from './CopyLinkButton.tsx'
import { LogoMark } from './Logo.tsx'
import { SearchBar } from './SearchBar.tsx'

export function AppHeader({
  search,
  menuOpen,
  onToggleMenu,
  onExpandAll,
  onCollapseAll,
}: {
  search: SearchFn
  menuOpen: boolean
  onToggleMenu: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
}) {
  const { mode, fourColour, toggleMode, toggleFourColour } = usePreferences()

  return (
    <Bar data-print="hide">
      <MenuButton
        type="button"
        onClick={onToggleMenu}
        aria-expanded={menuOpen}
        aria-controls="catalogue"
        aria-label={menuOpen ? strings.closeMenu : strings.openMenu}
      >
        {menuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
      </MenuButton>
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
      <SearchBar search={search} />
      <Actions>
        <IconButton type="button" onClick={onExpandAll} aria-label={strings.expandAll} title={strings.expandAll}>
          <ChevronsUpDown size={18} aria-hidden />
        </IconButton>
        <IconButton
          type="button"
          onClick={onCollapseAll}
          aria-label={strings.collapseAll}
          title={strings.collapseAll}
        >
          <ChevronsDownUp size={18} aria-hidden />
        </IconButton>
        <SuitToggle
          type="button"
          onClick={toggleFourColour}
          aria-pressed={fourColour}
          title={fourColour ? strings.fourColourOn : strings.fourColourOff}
        >
          <span aria-hidden>♦♣</span>
          <span className="visually-hidden">四色牌</span>
        </SuitToggle>
        <IconButton
          type="button"
          onClick={toggleMode}
          aria-label={mode === 'light' ? strings.themeToDark : strings.themeToLight}
          title={mode === 'light' ? strings.themeToDark : strings.themeToLight}
        >
          {mode === 'light' ? <Moon size={18} aria-hidden /> : <Sun size={18} aria-hidden />}
        </IconButton>
        <HideOnMobile>
          <IconButton type="button" onClick={() => window.print()} aria-label={strings.print} title={strings.print}>
            <Printer size={18} aria-hidden />
          </IconButton>
        </HideOnMobile>
      </Actions>
    </Bar>
  )
}

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
    padding: 0 ${({ theme }) => theme.space(2)};
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

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(1)};
  margin-left: auto;
`

const HideOnMobile = styled.span`
  ${mobile} {
    display: none;
  }
`

const SuitToggle = styled(IconButton)`
  font-size: 0.875rem;
  &[aria-pressed='true'] {
    border-color: ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.primarySoft};
  }
  span:first-child {
    background: linear-gradient(90deg, ${({ theme }) => theme.suits.D} 50%, ${({ theme }) => theme.suits.C} 50%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
`
