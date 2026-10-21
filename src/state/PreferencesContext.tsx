import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { createTheme, type ThemeMode } from '../styles/tokens.ts'

/**
 * Per-viewer display preferences: light/dark and the four-colour deck.
 * Remembered in localStorage when it is available; the app works the same without it.
 */

interface Preferences {
  mode: ThemeMode
  fourColour: boolean
  toggleMode: () => void
  toggleFourColour: () => void
}

const PreferencesContext = createContext<Preferences | null>(null)

const STORAGE_KEY = 'tku-bridgebook:prefs'

function readStored(): Partial<{ mode: ThemeMode; fourColour: boolean }> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function systemMode(): ThemeMode {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => readStored().mode ?? systemMode())
  const [fourColour, setFourColour] = useState<boolean>(() => readStored().fourColour ?? false)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, fourColour }))
    } catch {
      // Private mode or blocked storage: the preference simply is not remembered.
    }
  }, [mode, fourColour])

  const toggleMode = useCallback(() => setMode((m) => (m === 'light' ? 'dark' : 'light')), [])
  const toggleFourColour = useCallback(() => setFourColour((f) => !f), [])

  const theme = useMemo(() => createTheme(mode, fourColour), [mode, fourColour])
  const value = useMemo(
    () => ({ mode, fourColour, toggleMode, toggleFourColour }),
    [mode, fourColour, toggleMode, toggleFourColour],
  )

  return (
    <PreferencesContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </PreferencesContext.Provider>
  )
}

// The hook belongs next to its provider; fast refresh of this file reloads the page, which is fine.
// oxlint-disable-next-line react/only-export-components
export function usePreferences(): Preferences {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider')
  return ctx
}
