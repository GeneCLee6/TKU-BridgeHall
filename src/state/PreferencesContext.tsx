import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { loadStyleFonts } from '../styles/fonts.ts'
import { createTheme, styleNames, textSizes, type StyleName, type TextSize, type ThemeMode } from '../styles/tokens.ts'

/**
 * Per-viewer display preferences: the theme (follow the system, light or dark), the 字級 (text
 * size) and the 風格 (style; no control for it yet, that comes with the settings panel in e9-t15).
 * (Suits always use the four-colour deck.) Remembered in localStorage when it is available; the
 * app works the same without it.
 */

/** What the reader picked in 閱讀設定: 'system' follows prefers-color-scheme */
export type ThemeChoice = 'system' | ThemeMode
// oxlint-disable-next-line react/only-export-components
export const themeChoices: readonly ThemeChoice[] = ['system', 'light', 'dark']

interface Preferences {
  /** The mode in effect */
  mode: ThemeMode
  themeChoice: ThemeChoice
  setThemeChoice: (choice: ThemeChoice) => void
  textSize: TextSize
  setTextSize: (size: TextSize) => void
  style: StyleName
  setStyle: (style: StyleName) => void
}

const PreferencesContext = createContext<Preferences | null>(null)

const STORAGE_KEY = 'tku-bridgebook:prefs'
const DARK_QUERY = '(prefers-color-scheme: dark)'

/** `mode` is how the light/dark choice was stored before 跟隨系統 existed (e9-t03) */
function readStored(): Partial<{ theme: ThemeChoice; mode: ThemeMode; textSize: TextSize; style: StyleName }> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function darkQuery(): MediaQueryList | undefined {
  try {
    return window.matchMedia(DARK_QUERY)
  } catch {
    return undefined
  }
}

/** The system's light/dark, kept current while the page is open */
function useSystemMode(): ThemeMode {
  const [mode, setMode] = useState<ThemeMode>(() => (darkQuery()?.matches ? 'dark' : 'light'))
  useEffect(() => {
    const query = darkQuery()
    if (!query) return
    const onChange = () => setMode(query.matches ? 'dark' : 'light')
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [])
  return mode
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(() => {
    const stored = readStored()
    const choice = stored.theme ?? stored.mode
    return choice && themeChoices.includes(choice) ? choice : 'system'
  })
  const [textSize, setTextSize] = useState<TextSize>(() => {
    const stored = readStored().textSize
    return stored && stored in textSizes ? stored : 'medium'
  })
  const [style, setStyle] = useState<StyleName>(() => {
    const stored = readStored().style
    return stored && styleNames.includes(stored) ? stored : 'general'
  })
  const system = useSystemMode()
  const mode = themeChoice === 'system' ? system : themeChoice

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: themeChoice, textSize, style }))
    } catch {
      // Private mode or blocked storage: the preference simply is not remembered.
    }
  }, [themeChoice, textSize, style])

  useEffect(() => loadStyleFonts(style), [style])

  const theme = useMemo(() => createTheme(mode, textSize, style), [mode, textSize, style])
  const value = useMemo(
    () => ({ mode, themeChoice, setThemeChoice, textSize, setTextSize, style, setStyle }),
    [mode, themeChoice, textSize, style],
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
