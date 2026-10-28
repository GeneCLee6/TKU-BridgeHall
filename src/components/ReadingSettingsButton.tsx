import { SlidersHorizontal } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from 'react'
import styled from 'styled-components'
import { toolbarEvents } from '../lib/toolbar.ts'
import { useMediaQuery } from '../lib/useMediaQuery.ts'
import { strings } from '../strings.ts'
import { mobileQuery } from '../styles/tokens.ts'
import { Button } from './ui.tsx'

const ReadingSettings = lazy(() =>
  import('./ReadingSettings.tsx').then((m) => ({ default: m.ReadingSettings })),
)

/** What a page lets the 閱讀設定 panel do to it; the ones left out do not show */
export interface ReadingActions {
  onExpandAll?: () => void
  onCollapseAll?: () => void
  onPrint?: () => void
  /** 列印本頁 by default; the whole book says 印整本 */
  printLabel?: string
}

/**
 * The 閱讀設定 button and its panel (e9-t03). The panel's code loads on first open. Esc, × or a
 * click outside closes it; Esc and × put the focus back on the button. On phones the button is the
 * bottom toolbar's (e9-t09), which toggles the panel with a window event.
 */
export function ReadingSettingsButton(actions: ReadingActions) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const phone = useMediaQuery(mobileQuery)

  const close = useCallback(() => {
    setOpen(false)
    ;(button.current ?? document.querySelector<HTMLElement>('[data-toolbar="reading"]'))?.focus()
  }, [])

  useEffect(() => {
    const toggle = () => setOpen((o) => !o)
    window.addEventListener(toolbarEvents.reading, toggle)
    return () => window.removeEventListener(toolbarEvents.reading, toggle)
  }, [])

  useEffect(() => {
    if (!open) return
    const outside = (e: PointerEvent) => {
      const target = e.target as Element
      if (!wrap.current?.contains(target) && !target.closest?.('[data-toolbar="reading"]'))
        setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  return (
    <Wrap
      ref={wrap}
      data-print="hide"
      onKeyDown={(e) => {
        // The install steps are a dialog of their own inside the panel; Esc there closes only it
        if (e.key === 'Escape' && open && !(e.target as Element).closest('dialog')) {
          e.stopPropagation()
          close()
        }
      }}
    >
      {!phone && (
        <Button
          ref={button}
          type="button"
          $small
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen((o) => !o)}
        >
          <SlidersHorizontal size={16} aria-hidden />
          {strings.reading.open}
        </Button>
      )}
      {open && (
        <Suspense fallback={null}>
          <ReadingSettings id={panelId} onClose={close} {...actions} />
        </Suspense>
      )}
    </Wrap>
  )
}

const Wrap = styled.div`
  position: relative;
  flex: none;
`
