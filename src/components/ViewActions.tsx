import { ALargeSmall, ChevronsDownUp, ChevronsUpDown, Moon, Printer, Smartphone, Sun } from 'lucide-react'
import { useState } from 'react'
import styled from 'styled-components'
import { isStandalone, useInstallOffer } from '../lib/pwa.ts'
import { usePreferences } from '../state/PreferencesContext.tsx'
import { strings } from '../strings.ts'
import { IconButton } from './CopyLinkButton.tsx'
import { InstallHelp } from './InstallHelp.tsx'
import { TextSizeControl } from './TextSizeControl.tsx'

/**
 * 字級, expand all / collapse all / theme / install as an app (and print on desktop).
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

  // Install: the browser's own dialog when it offers one, otherwise the home-screen steps.
  // Hidden inside the installed app.
  const offer = useInstallOffer()
  const [helpOpen, setHelpOpen] = useState(false)
  const showInstall = !isStandalone()
  const install = () => (offer.available ? void offer.install() : setHelpOpen(true))
  const help = <InstallHelp open={helpOpen} onClose={() => setHelpOpen(false)} />

  if (variant === 'menu') {
    return (
      <MenuGroup role="group" aria-label={strings.viewOptions}>
        <SizeRow>
          <ALargeSmall size={18} aria-hidden />
          {strings.textSize}
          <TextSizeControl />
        </SizeRow>
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
        {showInstall && (
          <MenuItem type="button" onClick={install}>
            <Smartphone size={18} aria-hidden />
            {strings.installApp}
          </MenuItem>
        )}
        {help}
      </MenuGroup>
    )
  }

  return (
    <Bar>
      <TextSizeControl />
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
      {showInstall && (
        <IconButton
          type="button"
          onClick={install}
          aria-label={strings.installApp}
          title={strings.installApp}
        >
          <Smartphone size={18} aria-hidden />
        </IconButton>
      )}
      {help}
    </Bar>
  )
}

const Bar = styled.div`
  display: flex;
  align-items: center;
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

/** The 字級 switch as a drawer row: icon and label like the buttons, the switch at the end */
const SizeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  min-height: 44px;
  padding: 0 ${({ theme }) => theme.space(3)};
  font-size: 0.9375rem;

  & > svg {
    flex: none;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  & > [role='group'] {
    margin-left: auto;
  }
`
