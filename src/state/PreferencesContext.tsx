import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { loadStyleFonts } from '../styles/fonts.ts'
import { createTheme, styleNames, textSizes, type StyleName, type TextSize, type ThemeMode } from '../styles/tokens.ts'

/**
 * Per-viewer display preferences: light/dark, the 字級 (text size) and the 風格 (style; no
 * control for it yet, that comes with the settings panel in e9-t15). (Suits always use the
 * four-colour deck.) Remembered in localStorage when it is available; the app works the same
 * without it.
 */

interface Preferences {
  mode: ThemeMode
  toggleMode: () => void
  textSize: TextSize
  setTextSize: (size: TextSize) => void
  style: StyleName
  setStyle: (style: StyleName) => void
}

const PreferencesContext = createContext<Preferences | null>(null)

const STORAGE_KEY = 'tku-bridgebook:prefs'

function readStored(): Partial<{ mode: ThemeMode; textSize: TextSize; style: StyleName }> {
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
  const [style, setStyle] = useState<StyleName>(() => {
    const stored = readStored().style
    return stored && styleNames.includes(stored) ? stored : 'general'
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, textSize, style }))
    } catch {
      // Private mode or blocked storage: the preference simply is not remembered.
    }
  }, [mode, textSize, style])

  useEffect(() => loadStyleFonts(style), [style])

  const toggleMode = useCallback(() => setMode((m) => (m === 'light' ? 'dark' : 'light')), [])

  const theme = useMemo(() => createTheme(mode, textSize, style), [mode, textSize, style])
  const value = useMemo(
    () => ({ mode, toggleMode, textSize, setTextSize, style, setStyle }),
    [mode, toggleMode, textSize, style],
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
