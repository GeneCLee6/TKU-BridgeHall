import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { createTheme, textSizes, type TextSize, type ThemeMode } from '../styles/tokens.ts'

/**
 * Per-viewer display preferences: light/dark and the 字級 (text size). (Suits always use the
 * four-colour deck.) Remembered in localStorage when it is available; the app works the same
 * without it.
 */

interface Preferences {
  mode: ThemeMode
  toggleMode: () => void
  textSize: TextSize
  setTextSize: (size: TextSize) => void
}

const PreferencesContext = createContext<Preferences | null>(null)

const STORAGE_KEY = 'tku-bridgebook:prefs'

function readStored(): Partial<{ mode: ThemeMode; textSize: TextSize }> {
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
  const [textSize, setTextSize] = useState<TextSize>(() => {
    const stored = readStored().textSize
    return stored && stored in textSizes ? stored : 'medium'
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, textSize }))
    } catch {
      // Private mode or blocked storage: the preference simply is not remembered.
    }
  }, [mode, textSize])

  const toggleMode = useCallback(() => setMode((m) => (m === 'light' ? 'dark' : 'light')), [])

  const theme = useMemo(() => createTheme(mode, textSize), [mode, textSize])
  const value = useMemo(() => ({ mode, toggleMode, textSize, setTextSize }), [mode, toggleMode, textSize])

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
