import { ChevronsDownUp, ChevronsUpDown, Printer, Settings2, Smartphone, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { isStandalone, useInstallOffer } from '../lib/pwa.ts'
import { themeChoices, usePreferences } from '../state/PreferencesContext.tsx'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'
import { IconButton } from './CopyLinkButton.tsx'
import { InstallHelp } from './InstallHelp.tsx'
import type { ReadingActions } from './ReadingSettingsButton.tsx'
import { TextSizeControl } from './TextSizeControl.tsx'

/**
 * The 閱讀設定 panel (e9-t03, DESIGN-V2 §5.2): theme, 字級, this page's expand / collapse and
 * print, and installing the app. What the page cannot do (the home page has nothing to expand)
 * is left out; the rest of 個人設定 is a link away. Loaded only when the reader opens it; ReadingSettingsButton owns opening, closing,
 * Esc and clicks outside.
 */
export function ReadingSettings({
  id,
  onClose,
  onExpandAll,
  onCollapseAll,
  onPrint,
  printLabel = strings.reading.printPage,
  aboveToolbar = false,
}: ReadingActions & { id: string; onClose: () => void; aboveToolbar?: boolean }) {
  const { themeChoice, setThemeChoice } = usePreferences()
  const titleId = useId()
  const themeId = useId()
  const ref = useRef<HTMLDivElement>(null)

  // Keyboard users land in the panel; Esc or × takes them back to the button
  useEffect(() => ref.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus(), [])

  // Install: the browser's own dialog when it offers one, otherwise the home-screen steps.
  // Hidden inside the installed app.
  const offer = useInstallOffer()
  const [helpOpen, setHelpOpen] = useState(false)
  const install = () => (offer.available ? void offer.install() : setHelpOpen(true))
  const then = (action: () => void) => () => {
    action()
    onClose()
  }

  return (
    <Panel ref={ref} id={id} role="dialog" aria-labelledby={titleId} data-print="hide" $aboveToolbar={aboveToolbar}>
      <Head>
        <h2 id={titleId}>{strings.reading.open}</h2>
        <IconButton
          type="button"
          onClick={onClose}
          aria-label={strings.reading.close}
          title={strings.reading.close}
        >
          <X size={18} aria-hidden />
        </IconButton>
      </Head>
      <Row>
        <span id={themeId}>{strings.reading.theme}</span>
        <Segments role="group" aria-labelledby={themeId}>
          {themeChoices.map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={themeChoice === choice}
              onClick={() => setThemeChoice(choice)}
            >
              {strings.reading.themes[choice]}
            </button>
          ))}
        </Segments>
      </Row>
      <Row>
        <span aria-hidden>{strings.textSize}</span>
        <TextSizeControl />
      </Row>
      {/* 風格、版面、字體、花色顏色、密度 are on the 個人設定 page (e9-t15) */}
      <Actions>
        <Item as={Link} to="/settings" onClick={onClose}>
          <Settings2 size={18} aria-hidden />
          {strings.reading.more}
        </Item>
      </Actions>
      {(onExpandAll || onCollapseAll || onPrint) && (
        <Actions role="group" aria-label={strings.reading.thisPage}>
          {onExpandAll && (
            <Item type="button" onClick={then(onExpandAll)}>
              <ChevronsUpDown size={18} aria-hidden />
              {strings.expandAll}
            </Item>
          )}
          {onCollapseAll && (
            <Item type="button" onClick={then(onCollapseAll)}>
              <ChevronsDownUp size={18} aria-hidden />
              {strings.collapseAll}
            </Item>
          )}
          {onPrint && (
            <Item type="button" onClick={then(onPrint)}>
              <Printer size={18} aria-hidden />
              {printLabel}
            </Item>
          )}
        </Actions>
      )}
      {!isStandalone() && (
        <Actions>
          <Item type="button" onClick={install}>
            <Smartphone size={18} aria-hidden />
            {strings.installApp}
          </Item>
        </Actions>
      )}
      <InstallHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Panel>
  )
}

const Panel = styled.div<{ $aboveToolbar: boolean }>`
  position: absolute;
  top: calc(100% + ${({ theme }) => theme.space(2)});
  right: 0;
  z-index: 40;
  width: 20rem;
  max-width: calc(100vw - ${({ theme }) => theme.space(8)});
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)}
    ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.panel};
  animation: reading-in 120ms ease-out;

  @keyframes reading-in {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
  }

  /* Phones: a sheet above the bottom toolbar, which opens it (DESIGN-V2.md §7) */
  ${mobile} {
    position: fixed;
    top: auto;
    left: 0;
    right: 0;
    bottom: ${({ theme, $aboveToolbar }) => ($aboveToolbar ? theme.layout.toolbarHeight : '0')};
    z-index: 44;
    width: auto;
    max-width: none;
    max-height: calc(
      100vh - ${({ theme }) => theme.layout.headerHeight} -
        ${({ theme }) => theme.layout.toolbarHeight}
    );
    overflow-y: auto;
    border-width: 1px 0 0;
    border-radius: ${({ theme }) => theme.shape.panel} ${({ theme }) => theme.shape.panel} 0 0;
  }
`

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space(2)};

  h2 {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 1rem;
    font-weight: ${({ theme }) => theme.headingWeight};
  }
`

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
  min-height: 44px;
  font-size: 0.9375rem;

  & > span {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

/** Same look as the 字級 switch next to it */
const Segments = styled.div`
  display: inline-flex;
  padding: 2px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.surface};

  button {
    height: 28px;
    padding: 0 ${({ theme }) => theme.space(2)};
    border: 0;
    border-radius: ${({ theme }) => theme.radius.pill};
    background: transparent;
    color: ${({ theme }) => theme.colors.textMuted};
    font: inherit;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
  }
  button:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
  button[aria-pressed='true'] {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
  }
`

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: ${({ theme }) => theme.space(2)};
  padding-top: ${({ theme }) => theme.space(2)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Item = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  width: 100%;
  min-height: 44px;
  padding: 0 ${({ theme }) => theme.space(2)};
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 0.9375rem;
  text-align: left;
  text-decoration: none;
  cursor: pointer;

  svg {
    flex: none;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.primary};
  }

  ${mobile} {
    font-size: 1rem;
  }
`
