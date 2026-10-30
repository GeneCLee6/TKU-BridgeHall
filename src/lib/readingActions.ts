import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'

/** What a page lets the 閱讀設定 panel do to it; the ones left out do not show */
export interface ReadingActions {
  onExpandAll?: () => void
  onCollapseAll?: () => void
  onPrint?: () => void
  /** 列印本頁 by default; the whole book says 印整本 */
  printLabel?: string
}

/**
 * The 閱讀設定 button lives in the header on every page (2026-10-30), so a page hands its own
 * expand / collapse / print to it through this store rather than rendering a button of its own.
 */
let current: ReadingActions = {}
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function publish(actions: ReadingActions) {
  current = actions
  for (const listener of listeners) listener()
}

/** The actions of the page now shown, for the header's 閱讀設定 */
export function useReadingActions(): ReadingActions {
  return useSyncExternalStore(subscribe, () => current, () => current)
}

/**
 * A page offers its actions while it is shown. The functions may change every render; the panel
 * always calls the latest ones, and only which of them exist (and the print label) re-publishes.
 */
export function usePageReadingActions(actions: ReadingActions) {
  const latest = useRef(actions)
  useLayoutEffect(() => {
    latest.current = actions
  })
  const { onExpandAll, onCollapseAll, onPrint, printLabel } = actions
  const shape = [!!onExpandAll, !!onCollapseAll, !!onPrint, printLabel ?? ''].join('|')
  useEffect(() => {
    const now = latest.current
    const entry: ReadingActions = {
      onExpandAll: now.onExpandAll && (() => latest.current.onExpandAll?.()),
      onCollapseAll: now.onCollapseAll && (() => latest.current.onCollapseAll?.()),
      onPrint: now.onPrint && (() => latest.current.onPrint?.()),
      printLabel: now.printLabel,
    }
    publish(entry)
    return () => {
      if (current === entry) publish({})
    }
  }, [shape])
}
