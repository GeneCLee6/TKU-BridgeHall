import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Which accordion items are open, for every level at once. Keeping it in one place is what lets
 * the header's expand-all / collapse-all and deep links drive accordions they do not own.
 * Keys come from lib/sections.ts: "slug" for a convention, "slug/sectionId" for a section.
 */

interface Expansion {
  isOpen: (key: string) => boolean
  /** The open keys among `levelKeys`, as a Radix Accordion `value` */
  openAmong: (levelKeys: string[]) => string[]
  /** Replace the open keys of one accordion level, as Radix `onValueChange` reports them */
  setLevel: (levelKeys: string[], open: string[]) => void
  open: (keys: string[]) => void
  close: (keys: string[]) => void
  closeAll: () => void
}

const ExpansionContext = createContext<Expansion | null>(null)

export function ExpansionProvider({ children }: { children: ReactNode }) {
  const [openKeys, setOpenKeys] = useState<ReadonlySet<string>>(() => new Set())

  const isOpen = useCallback((key: string) => openKeys.has(key), [openKeys])
  const openAmong = useCallback(
    (levelKeys: string[]) => levelKeys.filter((k) => openKeys.has(k)),
    [openKeys],
  )
  const setLevel = useCallback((levelKeys: string[], open: string[]) => {
    setOpenKeys((prev) => {
      const next = new Set(prev)
      levelKeys.forEach((k) => next.delete(k))
      open.forEach((k) => next.add(k))
      return next
    })
  }, [])
  const open = useCallback((keys: string[]) => {
    setOpenKeys((prev) => new Set([...prev, ...keys]))
  }, [])
  const close = useCallback((keys: string[]) => {
    setOpenKeys((prev) => {
      const next = new Set(prev)
      keys.forEach((k) => next.delete(k))
      return next
    })
  }, [])
  const closeAll = useCallback(() => setOpenKeys(new Set()), [])

  const value = useMemo(
    () => ({ isOpen, openAmong, setLevel, open, close, closeAll }),
    [isOpen, openAmong, setLevel, open, close, closeAll],
  )
  return <ExpansionContext.Provider value={value}>{children}</ExpansionContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useExpansion(): Expansion {
  const ctx = useContext(ExpansionContext)
  if (!ctx) throw new Error('useExpansion must be used inside ExpansionProvider')
  return ctx
}
