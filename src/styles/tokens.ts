/**
 * Design tokens. Every colour in the app comes from here (DESIGN.md §2 explains each one of
 * 「一般」). Components read them through the styled-components theme, never as raw hex values.
 */

export type ThemeMode = 'light' | 'dark'

/** The reader's 字級 choice */
export type TextSize = 'small' | 'medium' | 'large'

/**
 * Root font size for each 字級. Percentages keep the browser's own text-size setting; everything
 * sized in rem (text, form controls, the sidebar's width) follows the choice.
 */
export const textSizes: Record<TextSize, string> = { small: '87.5%', medium: '100%', large: '112.5%' }

/**
 * A style (風格) is one complete set of tokens: colours, shapes, lines, shadows and fonts.
 * Components read only tokens and never ask which style is on (DESIGN-V2.md §10.5). 「一般」 is
 * today's look and the default; the other styles take their values from the
 * `.demo[data-style=…]` blocks of `docs/design/pitch.html`. The remaining four arrive in e9-t16.
 */
export type StyleName = 'general' | 'chinese'

export const styleNames: readonly StyleName[] = ['general', 'chinese']

/** Colours every style defines, for light and dark */
export interface Palette {
  bg: string
  surface: string
  surfaceAlt: string
  border: string
  text: string
  textMuted: string
  primary: string
  primaryStrong: string
  primarySoft: string
  onPrimary: string
  /** Lantern gold: thin lines and small marks, never large areas */
  accent: string
  /** Section numbers and section rails */
  structure: string
  /** Seal red: danger text and the 「待確認」 seal */
  seal: string
  focus: string
  pendingBg: string
  pendingBorder: string
  pendingText: string
  warningBg: string
  warningBorder: string
  tagBg: string
  tagBorder: string
  tagText: string
  overlay: string
  /** The bidding box's Pass, X and XX keys, filled like 淡江牌桌's (BBO's) */
  callPass: string
  callDouble: string
  callRedouble: string
  /** Text on the three call colours */
  onCall: string
}

type Suits = Record<'S' | 'H' | 'D' | 'C', string>

interface StyleTokens {
  colors: Record<ThemeMode, Palette>
  /** Four-colour deck: ♠ dark, ♥ red, ♦ orange, ♣ green */
  suits: Record<ThemeMode, Suits>
  fonts: { body: string; heading: string; mono: string }
  headingWeight: number
  /** Corner radius by role */
  shape: { control: string; panel: string; tag: string; badge: string; note: string }
  /** Border width and line style by role; components add the colour */
  borders: { control: string; panel: string }
  shadows: Record<ThemeMode, { panel: string }>
  /** The 「待確認」 badge: a pill in 「一般」, a slightly turned seal in 中國風 */
  pendingBadge: { borderWidth: string; rotate: string; serif: boolean }
}

/**
 * 淡江牌桌's bidding box colours (its `table.bidPass`, `bidDouble`, `bidRedouble`), the same in
 * every style so a call looks the same on both sites. In dark mode Pass is a shade darker, so the
 * white text keeps 4.5:1 and the key still stands out from the dark surface (3:1).
 */
const calls: Record<ThemeMode, Pick<Palette, 'callPass' | 'callDouble' | 'callRedouble' | 'onCall'>> = {
  light: { callPass: '#2f9e44', callDouble: '#d9372b', callRedouble: '#2b6fd6', onCall: '#ffffff' },
  dark: { callPass: '#28863a', callDouble: '#d9372b', callRedouble: '#2b6fd6', onCall: '#ffffff' },
}

const sans = `'Noto Sans TC Variable', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif`
const mono = `ui-monospace, 'Cascadia Mono', Consolas, 'Noto Sans TC Variable', monospace`
/** Loaded on demand (styles/fonts.ts), only by a style whose headings are serif */
const serif = `'Noto Serif TC', 'Songti TC', 'PMingLiU', serif`

const general: StyleTokens = {
  colors: {
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
      accent: '#d9a330',
      structure: '#0f3d7a',
      seal: '#b8321f',
      focus: '#2f6fd6',
      pendingBg: '#fff4d6',
      pendingBorder: '#d79a00',
      pendingText: '#5e4100',
      warningBg: '#fdeceb',
      warningBorder: '#d9534f',
      tagBg: '#eef2f8',
      tagBorder: '#d5dce8',
      tagText: '#4f5a70',
      overlay: 'rgba(10, 20, 40, 0.45)',
      ...calls.light,
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
      accent: '#e7b850',
      structure: '#8db8ff',
      seal: '#ff8a70',
      focus: '#8db8ff',
      pendingBg: '#3a2f10',
      pendingBorder: '#c99a2e',
      pendingText: '#ffe2a0',
      warningBg: '#3b1d1d',
      warningBorder: '#e57373',
      tagBg: '#1c2637',
      tagBorder: '#2c3850',
      tagText: '#a3afc4',
      overlay: 'rgba(0, 0, 0, 0.6)',
      ...calls.dark,
    },
  },
  suits: {
    light: { S: '#1a2233', H: '#c8102e', D: '#b34700', C: '#1b7a33' },
    dark: { S: '#e6ebf3', H: '#ff6b6b', D: '#ffa04d', C: '#5fd27a' },
  },
  fonts: { body: sans, heading: sans, mono },
  headingWeight: 700,
  shape: { control: '6px', panel: '14px', tag: '999px', badge: '999px', note: '6px' },
  borders: { control: '1px solid', panel: '1px solid' },
  shadows: {
    light: { panel: '0 1px 2px rgba(15, 40, 80, 0.06), 0 2px 8px rgba(15, 40, 80, 0.06)' },
    dark: { panel: '0 1px 2px rgba(0, 0, 0, 0.4)' },
  },
  pendingBadge: { borderWidth: '1px', rotate: '0deg', serif: false },
}

/** 中國風: rice paper, ink, vermilion, blue-and-white and gold; double-line frames, serif headings */
const chinese: StyleTokens = {
  colors: {
    light: {
      bg: '#efe4cc',
      surface: '#f9f1dd',
      surfaceAlt: '#ecdfc2',
      border: '#c9b282',
      text: '#241e19',
      textMuted: '#6d5e4a',
      primary: '#b5261e',
      primaryStrong: '#241e19',
      primarySoft: '#f4dccb',
      onPrimary: '#fff6e6',
      accent: '#c9a227',
      structure: '#1f4e8c',
      seal: '#a0251a',
      focus: '#1f4e8c',
      pendingBg: 'rgba(160, 37, 26, 0.06)',
      pendingBorder: '#a0251a',
      pendingText: '#a0251a',
      warningBg: '#f4dccb',
      warningBorder: '#a0251a',
      tagBg: 'transparent',
      tagBorder: '#b5261e',
      tagText: '#b5261e',
      overlay: 'rgba(36, 30, 25, 0.45)',
      ...calls.light,
    },
    dark: {
      bg: '#1a1512',
      surface: '#241d18',
      surfaceAlt: '#2e261f',
      border: '#5a4a33',
      text: '#efe3c9',
      textMuted: '#b8a68a',
      primary: '#e2574a',
      primaryStrong: '#efe3c9',
      primarySoft: '#3d231d',
      onPrimary: '#1a1512',
      accent: '#d8b64a',
      structure: '#8fb0e8',
      seal: '#ff8f7a',
      focus: '#8fb0e8',
      pendingBg: 'rgba(255, 143, 122, 0.08)',
      pendingBorder: '#ff8f7a',
      pendingText: '#ff8f7a',
      warningBg: '#3d231d',
      warningBorder: '#ff8f7a',
      tagBg: 'transparent',
      tagBorder: '#e2574a',
      tagText: '#e2574a',
      overlay: 'rgba(0, 0, 0, 0.6)',
      ...calls.dark,
    },
  },
  suits: {
    light: { S: '#241e19', H: '#c8102e', D: '#b34700', C: '#1b6b3a' },
    dark: { S: '#efe3c9', H: '#ff6b6b', D: '#ffa04d', C: '#5fd27a' },
  },
  fonts: { body: sans, heading: serif, mono },
  headingWeight: 600,
  shape: { control: '2px', panel: '2px', tag: '2px', badge: '3px', note: '2px' },
  borders: { control: '1px solid', panel: '3px double' },
  shadows: { light: { panel: 'none' }, dark: { panel: 'none' } },
  pendingBadge: { borderWidth: '2px', rotate: '-3deg', serif: true },
}

const styles: Record<StyleName, StyleTokens> = { general, chinese }

/** Whether a style's headings need the serif web font, which is then loaded (styles/fonts.ts) */
export const usesSerif = (style: StyleName) => styles[style].fonts.heading === serif

export const layout = {
  headerHeight: '60px',
  /** In rem so a larger 字級 widens the catalogue instead of wrapping more names */
  sidebarWidth: '19rem',
  contentMax: '60rem',
  mobileBreakpoint: '900px',
}

/** 4px spacing scale: space(2) === '8px' */
export const space = (n: number) => `${n * 4}px`

export function createTheme(mode: ThemeMode, textSize: TextSize = 'medium', style: StyleName = 'general') {
  const tokens = styles[style]
  const colors = tokens.colors[mode]
  const shadows = tokens.shadows[mode]
  return {
    mode,
    textSize,
    style,
    colors: {
      ...colors,
      /** Old names, removed in e9-t14 */
      lantern: colors.accent,
      vermilion: colors.seal,
    },
    suits: tokens.suits[mode],
    fonts: tokens.fonts,
    headingWeight: tokens.headingWeight,
    shape: tokens.shape,
    borders: tokens.borders,
    shadows,
    pendingBadge: tokens.pendingBadge,
    layout,
    space,
    /** Old names, removed in e9-t14 once every component reads `shape` and `shadows` */
    radius:
      style === 'general'
        ? { sm: '6px', md: '10px', lg: '14px', pill: '999px' }
        : { sm: tokens.shape.control, md: tokens.shape.panel, lg: tokens.shape.panel, pill: tokens.shape.tag },
    shadow: shadows.panel,
  }
}

export type AppTheme = ReturnType<typeof createTheme>

/** The phone layout breakpoint, for useMediaQuery */
export const mobileQuery = `(max-width: ${layout.mobileBreakpoint})`

/** Media query helper: `${mobile} { ... }` */
export const mobile = `@media ${mobileQuery}`

// The default avatars' colours (e11-t03) are in `styles/avatarColors.ts`: a module of their own, so
// the chunk that carries these tokens to the home page does not carry them too
