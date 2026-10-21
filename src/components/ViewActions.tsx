import { ChevronsDownUp, ChevronsUpDown, Moon, Printer, Sun } from 'lucide-react'
import styled from 'styled-components'
import { usePreferences } from '../state/PreferencesContext.tsx'
import { strings } from '../strings.ts'
import { IconButton } from './CopyLinkButton.tsx'

/**
 * Expand all / collapse all / theme (and print on desktop).
 * 'bar' renders icon buttons for the desktop header; 'menu' renders labelled rows for the
 * mobile drawer, so the phone header stays down to menu, logo and search.
 */
export function ViewActions({
  variant,
  onExpandAll,
  onCollapseAll,
}: {
  variant: 'bar' | 'menu'
  onExpandAll: () => void
  onCollapseAll: () => void
}) {
  const { mode, toggleMode } = usePreferences()
  const themeLabel = mode === 'light' ? strings.themeToDark : strings.themeToLight
  const ThemeIcon = mode === 'light' ? Moon : Sun

  if (variant === 'menu') {
    return (
      <MenuGroup role="group" aria-label={strings.viewOptions}>
        <MenuItem type="button" onClick={onExpandAll}>
          <ChevronsUpDown size={18} aria-hidden />
          {strings.expandAll}
        </MenuItem>
        <MenuItem type="button" onClick={onCollapseAll}>
          <ChevronsDownUp size={18} aria-hidden />
          {strings.collapseAll}
        </MenuItem>
        <MenuItem type="button" onClick={toggleMode}>
          <ThemeIcon size={18} aria-hidden />
          {themeLabel}
        </MenuItem>
      </MenuGroup>
    )
  }

  return (
    <Bar>
      <IconButton
        type="button"
        onClick={onExpandAll}
        aria-label={strings.expandAll}
        title={strings.expandAll}
      >
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
      <IconButton type="button" onClick={toggleMode} aria-label={themeLabel} title={themeLabel}>
        <ThemeIcon size={18} aria-hidden />
      </IconButton>
      <IconButton
        type="button"
        onClick={() => window.print()}
        aria-label={strings.print}
        title={strings.print}
      >
        <Printer size={18} aria-hidden />
      </IconButton>
    </Bar>
  )
}

const Bar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(1)};
  margin-left: auto;
`

const MenuGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1)};
  margin-bottom: ${({ theme }) => theme.space(5)};
  padding-bottom: ${({ theme }) => theme.space(4)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  width: 100%;
  min-height: 44px;
  padding: 0 ${({ theme }) => theme.space(3)};
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;

  svg {
    flex: none;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.primary};
  }
`
