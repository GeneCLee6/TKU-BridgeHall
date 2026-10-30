import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { loadThemeFonts } from '../styles/fonts.ts'
import {
  createTheme,
  densities,
  fontChoices,
  isStyleLoaded,
  isStyleName,
  loadStyle,
  suitColorChoices,
  textSizes,
  type Density,
  type FontChoice,
  type StyleName,
  type SuitColors,
  type TextSize,
  type ThemeMode,
} from '../styles/tokens.ts'

/**
 * Per-viewer display preferences (個人設定, e9-t15, DESIGN-V2.md §10.5): the theme (follow the
 * system, light or dark), 風格, 版面, 字體, 字級, 花色顏色 and 密度. Remembered in localStorage
 * under `tku-bridgebook:prefs` when it is available; the app works the same without it. A stored
 * value this version does not know falls back to the default, which is today's look: 「一般」,
 * 整本一頁, the style's font, 中, four colours, 舒適.
 */

/** What the reader picked in 閱讀設定: 'system' follows prefers-color-scheme */
export type ThemeChoice = 'system' | ThemeMode
// oxlint-disable-next-line react/only-export-components
export const themeChoices: readonly ThemeChoice[] = ['system', 'light', 'dark']

/**
 * 版面: the shell of the reading pages. 整本一頁 is the default and today's (catalogue on the left,
 * 本頁 on the right when there is room); 三欄閱讀 keeps 本頁 beside the text from tablet width;
 * 專注單欄 hides the catalogue for one centred column; 卡片總覽 opens on tiles (e9-t17). Phones
 * always get one column and the bottom toolbar.
 */
export type LayoutName = 'whole' | 'three' | 'focus' | 'cards'
// oxlint-disable-next-line react/only-export-components
export const layoutNames: readonly LayoutName[] = ['whole', 'three', 'focus', 'cards']

/** 入門版 hides 進階 and 高階 sections (e4-t02); 完整版 shows everything */
export type ReadingMode = 'full' | 'basic'
// oxlint-disable-next-line react/only-export-components
export const readingModes: readonly ReadingMode[] = ['full', 'basic']

export interface DisplayPrefs {
  theme: ThemeChoice
  style: StyleName
  layout: LayoutName
  font: FontChoice
  textSize: TextSize
  suitColors: SuitColors
  density: Density
  reading: ReadingMode
  /** 「你是新生嗎？」 has been answered or closed (e4-t03); 個人設定's reset keeps it */
  newcomerAsked: boolean
  /**
   * 傳送匿名使用統計 (e10-t07): null until the reader chooses, which means on unless the browser
   * sends Global Privacy Control or Do Not Track (`analyticsOn`). Not a display setting, so
   * 個人設定's reset keeps it
   */
  analytics: boolean | null
}

// oxlint-disable-next-line react/only-export-components
export const defaultPrefs: DisplayPrefs = {
  theme: 'system',
  style: 'general',
  layout: 'whole',
  font: 'style',
  textSize: 'medium',
  suitColors: 'four',
  density: 'comfortable',
  reading: 'full',
  newcomerAsked: false,
  analytics: null,
}

interface Preferences extends DisplayPrefs {
  /** The mode in effect */
  mode: ThemeMode
  themeChoice: ThemeChoice
  setThemeChoice: (choice: ThemeChoice) => void
  setTextSize: (size: TextSize) => void
  setStyle: (style: StyleName) => void
  /** Changes any of the settings at once */
  update: (changes: Partial<DisplayPrefs>) => void
  /** Back to the defaults */
  reset: () => void
}

const PreferencesContext = createContext<Preferences | null>(null)

const STORAGE_KEY = 'tku-bridgebook:prefs'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const oneOf =
  <T,>(choices: readonly T[]) =>
  (value: unknown): value is T =>
    choices.includes(value as T)

const valid: { [K in keyof DisplayPrefs]: (value: unknown) => boolean } = {
  theme: oneOf(themeChoices),
  style: isStyleName,
  layout: oneOf(layoutNames),
  font: oneOf(fontChoices),
  textSize: (value) => typeof value === 'string' && Object.hasOwn(textSizes, value),
  suitColors: oneOf(suitColorChoices),
  density: oneOf(densities),
  reading: oneOf(readingModes),
  newcomerAsked: (value) => typeof value === 'boolean',
  analytics: (value) => value === null || typeof value === 'boolean',
}

/** The stored settings, each checked; `mode` is how light/dark was stored before 跟隨系統 existed */
// oxlint-disable-next-line react/only-export-components
export function readStoredPrefs(): DisplayPrefs {
  let stored: Record<string, unknown> = {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    if (parsed && typeof parsed === 'object') stored = parsed as Record<string, unknown>
    // Settings stored before 「你是新生嗎？」 existed belong to someone who has been here before
    if (raw && !('newcomerAsked' in stored)) stored = { ...stored, newcomerAsked: true }
  } catch {
    // Unreadable: the defaults
  }
  const prefs = { ...defaultPrefs }
  const theme = stored.theme ?? stored.mode
  const pick = <K extends keyof DisplayPrefs>(key: K, value: unknown) => {
    if (valid[key](value)) prefs[key] = value as DisplayPrefs[K]
  }
  pick('theme', theme)
  for (const key of [
    'style',
    'layout',
    'font',
    'textSize',
    'suitColors',
    'density',
    'reading',
    'newcomerAsked',
    'analytics',
  ] as const)
    pick(key, stored[key])
  return prefs
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
  const [prefs, setPrefs] = useState<DisplayPrefs>(readStoredPrefs)
  // Bumped when a style's tokens arrive, so the theme is made again with them
  const [, setStyleArrived] = useState(0)
  const system = useSystemMode()
  const { style } = prefs

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      // Private mode or blocked storage: the preference simply is not remembered.
    }
  }, [prefs])

  useEffect(() => {
    if (isStyleLoaded(style)) return
    let live = true
    loadStyle(style)
      .then(() => live && setStyleArrived((n) => n + 1))
      // Offline and never loaded: 「一般」 until the next visit
      .catch(() => {})
    return () => {
      live = false
    }
  }, [style])

  const ready = isStyleLoaded(style)
  const theme = useMemo(() => {
    const options = { font: prefs.font, suitColors: prefs.suitColors, density: prefs.density }
    const probe = createTheme('light', prefs.textSize, style, options)
    const mode = prefs.theme === 'system' ? (probe.prefersDark ? 'dark' : system) : prefs.theme
    return mode === 'light' ? probe : createTheme(mode, prefs.textSize, style, options)
    // `ready` makes the theme again once the style's tokens have arrived
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs, style, system, ready])

  useEffect(() => loadThemeFonts(theme), [theme])

  const value = useMemo<Preferences>(() => {
    const update = (changes: Partial<DisplayPrefs>) => setPrefs((now) => ({ ...now, ...changes }))
    return {
      ...prefs,
      mode: theme.mode,
      themeChoice: prefs.theme,
      setThemeChoice: (theme) => update({ theme }),
      setTextSize: (textSize) => update({ textSize }),
      setStyle: (style) => update({ style }),
      update,
      reset: () => setPrefs((now) => ({ ...defaultPrefs, newcomerAsked: now.newcomerAsked, analytics: now.analytics })),
    }
  }, [prefs, theme.mode])

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
