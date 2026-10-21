/**
 * Design tokens. Every colour in the app comes from here (DESIGN.md §2 explains each one).
 * Components read them through the styled-components theme, never as raw hex values.
 */

export type ThemeMode = 'light' | 'dark'

const palette = {
  light: {
    bg: '#f4f6fa',
    surface: '#ffffff',
    surfaceAlt: '#eef2f8',
    border: '#d5dce8',
    text: '#1a2233',
    textMuted: '#4f5a70',
    primary: '#0f3d7a',
    primaryStrong: '#0a2b57',
    primarySoft: '#e3ecf8',
    onPrimary: '#ffffff',
    lantern: '#d9a330',
    vermilion: '#b8321f',
    focus: '#2f6fd6',
    pendingBg: '#fff4d6',
    pendingBorder: '#d79a00',
    pendingText: '#5e4100',
    warningBg: '#fdeceb',
    warningBorder: '#d9534f',
    overlay: 'rgba(10, 20, 40, 0.45)',
  },
  dark: {
    bg: '#0d1320',
    surface: '#151d2c',
    surfaceAlt: '#1c2637',
    border: '#2c3850',
    text: '#e6ebf3',
    textMuted: '#a3afc4',
    primary: '#8db8ff',
    primaryStrong: '#b5d0ff',
    primarySoft: '#1b2c4a',
    onPrimary: '#0d1320',
    lantern: '#e7b850',
    vermilion: '#ff8a70',
    focus: '#8db8ff',
    pendingBg: '#3a2f10',
    pendingBorder: '#c99a2e',
    pendingText: '#ffe2a0',
    warningBg: '#3b1d1d',
    warningBorder: '#e57373',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const

/** Four-colour deck: ♠ dark, ♥ red, ♦ orange, ♣ green */
const suits = {
  light: { S: '#1a2233', H: '#c8102e', D: '#b34700', C: '#1b7a33' },
  dark: { S: '#e6ebf3', H: '#ff6b6b', D: '#ffa04d', C: '#5fd27a' },
} as const

export const fonts = {
  body: `'Noto Sans TC Variable', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif`,
  mono: `ui-monospace, 'Cascadia Mono', Consolas, 'Noto Sans TC Variable', monospace`,
}

export const layout = {
  headerHeight: '60px',
  sidebarWidth: '280px',
  contentMax: '960px',
  mobileBreakpoint: '900px',
}

/** 4px spacing scale: space(2) === '8px' */
export const space = (n: number) => `${n * 4}px`

export function createTheme(mode: ThemeMode) {
  return {
    mode,
    colors: palette[mode],
    suits: suits[mode],
    fonts,
    layout,
    space,
    radius: { sm: '6px', md: '10px', lg: '14px', pill: '999px' },
    shadow:
      mode === 'light'
        ? '0 1px 2px rgba(15, 40, 80, 0.06), 0 2px 8px rgba(15, 40, 80, 0.06)'
        : '0 1px 2px rgba(0, 0, 0, 0.4)',
  }
}

export type AppTheme = ReturnType<typeof createTheme>

/** The phone layout breakpoint, for useMediaQuery */
export const mobileQuery = `(max-width: ${layout.mobileBreakpoint})`

/** Media query helper: `${mobile} { ... }` */
export const mobile = `@media ${mobileQuery}`
