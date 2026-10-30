/**
 * Design tokens. Every colour in the app comes from here or from a style in `styles/themes/`
 * (DESIGN.md §2 explains each one). Components read them through the
 * styled-components theme, never as raw hex values.
 */

export type ThemeMode = 'light' | 'dark'

/** The reader's 字級 choice */
export type TextSize = 'small' | 'medium' | 'large' | 'xlarge'

/**
 * Root font size for each 字級. Percentages keep the browser's own text-size setting; everything
 * sized in rem (text, form controls, the sidebar's width) follows the choice.
 */
export const textSizes: Record<TextSize, string> = {
  small: '87.5%',
  medium: '100%',
  large: '112.5%',
  xlarge: '125%',
}

/**
 * A style (風格) is one complete set of tokens: colours, shapes, lines, shadows and fonts.
 * Components read only tokens and never ask which style is on (DESIGN-V2.md §10.5). 「一般」 is
 * today's look and the default, and the only one in the first download; the other five are in
 * `styles/themes/` and load when a reader picks one (`loadStyle`). Their values follow the
 * `.demo[data-style=…]` blocks of `docs/design/pitch.html`.
 */
export type StyleName = 'general' | 'chinese' | 'soft' | 'night' | 'suits' | 'plain'

export const styleNames: readonly StyleName[] = ['general', 'chinese', 'soft', 'night', 'suits', 'plain']

/** 字體: the style's own, serif headings, all sans, or the system's font (no web font downloaded) */
export type FontChoice = 'style' | 'serif' | 'sans' | 'system'
export const fontChoices: readonly FontChoice[] = ['style', 'serif', 'sans', 'system']

/** 花色顏色: the four-colour deck, or two colours (♦ like ♥, ♣ like ♠) as on 淡江牌桌's 牌樣式 */
export type SuitColors = 'four' | 'two'
export const suitColorChoices: readonly SuitColors[] = ['four', 'two']

/** 密度: 緊湊 tightens spacing and line height everywhere */
export type Density = 'comfortable' | 'compact'
export const densities: readonly Density[] = ['comfortable', 'compact']

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

export interface StyleTokens {
  colors: Record<ThemeMode, Palette>
  /** Four-colour deck: ♠ dark, ♥ red, ♦ orange, ♣ green */
  suits: Record<ThemeMode, Suits>
  fonts: { body: string; heading: string; mono: string }
  headingWeight: number
  /** The body text's line height */
  lineHeight: number
  /** Corner radius by role; `popover` is for menus, search results and floating notices */
  shape: { control: string; panel: string; popover: string; tag: string; badge: string; note: string }
  /** Border width and line style by role; components add the colour */
  borders: { control: string; panel: string }
  shadows: Record<ThemeMode, { panel: string }>
  /** The 「待確認」 badge: a pill in 「一般」, a slightly turned seal in 中國風 */
  pendingBadge: { borderWidth: string; rotate: string; serif: boolean }
  /** How top-level sections are numbered: 「§1」 or 「一、」 (DESIGN-V2.md §10.5) */
  sectionNumbers: 'sign' | 'han'
  /** 夜讀 opens dark when the reader follows the system (DESIGN-V2.md §10.5) */
  prefersDark?: boolean
}

/**
 * 淡江牌桌's bidding box colours (its `table.bidPass`, `bidDouble`, `bidRedouble`), the same in
 * every style so a call looks the same on both sites. In dark mode Pass is a shade darker, so the
 * white text keeps 4.5:1 and the key still stands out from the dark surface (3:1).
 */
export const calls: Record<ThemeMode, Pick<Palette, 'callPass' | 'callDouble' | 'callRedouble' | 'onCall'>> = {
  light: { callPass: '#2f9e44', callDouble: '#d9372b', callRedouble: '#2b6fd6', onCall: '#ffffff' },
  dark: { callPass: '#28863a', callDouble: '#d9372b', callRedouble: '#2b6fd6', onCall: '#ffffff' },
}

export const fontStacks = {
  sans: `'Noto Sans TC Variable', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif`,
  mono: `ui-monospace, 'Cascadia Mono', Consolas, 'Noto Sans TC Variable', monospace`,
  /** Loaded on demand (styles/fonts.ts), only when the headings are serif */
  serif: `'Noto Serif TC', 'Songti TC', 'PMingLiU', serif`,
  /** 系統字型: nothing to download */
  system: `system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Microsoft JhengHei', sans-serif`,
}

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
  fonts: { body: fontStacks.sans, heading: fontStacks.sans, mono: fontStacks.mono },
  headingWeight: 700,
  lineHeight: 1.7,
  shape: { control: '6px', panel: '14px', popover: '10px', tag: '999px', badge: '999px', note: '6px' },
  borders: { control: '1px solid', panel: '1px solid' },
  shadows: {
    light: { panel: '0 1px 2px rgba(15, 40, 80, 0.06), 0 2px 8px rgba(15, 40, 80, 0.06)' },
    dark: { panel: '0 1px 2px rgba(0, 0, 0, 0.4)' },
  },
  pendingBadge: { borderWidth: '1px', rotate: '0deg', serif: false },
  sectionNumbers: 'sign',
}

/** The styles loaded so far; 「一般」 always is */
const loaded = new Map<StyleName, StyleTokens>([['general', general]])

/** Each style beyond 「一般」 is a chunk of its own, downloaded when a reader picks it */
const loaders: Record<Exclude<StyleName, 'general'>, () => Promise<{ default: StyleTokens }>> = {
  chinese: () => import('./themes/chinese.ts'),
  soft: () => import('./themes/soft.ts'),
  night: () => import('./themes/night.ts'),
  suits: () => import('./themes/suits.ts'),
  plain: () => import('./themes/plain.ts'),
}

export const isStyleLoaded = (style: StyleName) => loaded.has(style)

/** Downloads a style's tokens; createTheme shows 「一般」 until they are here */
export async function loadStyle(style: StyleName): Promise<void> {
  if (loaded.has(style) || style === 'general') return
  const { default: tokens } = await loaders[style]()
  loaded.set(style, tokens)
}

export const isStyleName = (value: unknown): value is StyleName =>
  typeof value === 'string' && (styleNames as readonly string[]).includes(value)

/** Whether a loaded style's headings need the serif web font, which is then loaded (styles/fonts.ts) */
export const usesSerif = (style: StyleName) => loaded.get(style)?.fonts.heading === fontStacks.serif

export const layout = {
  headerHeight: '60px',
  /** The phone's bottom toolbar (DESIGN-V2.md §7) */
  toolbarHeight: '56px',
  /** In rem so a larger 字級 widens the catalogue instead of wrapping more names */
  sidebarWidth: '19rem',
  /** A reading page's column: the text's measure and its 本頁 beside it */
  contentMax: '70rem',
  /** Pages of lists, tiles and panels (home, 叢書, account, admin) use more of a wide screen */
  pageMax: '84rem',
  mobileBreakpoint: '900px',
  /** From this width the convention page shows its 本頁 column (DESIGN-V2.md §4) */
  wideBreakpoint: '1100px',
}

/** Print is black on white in every style (DESIGN-V2.md §8; the suits keep their own red) */
export const printColors = { ink: '#000', paper: '#fff', rule: '#888' }

/**
 * The convention card sheet (E3, DESIGN-V2.md §5.10): white paper, black rules and grey shading
 * in every style and mode, like the official form. On screen a team's override or edit has a
 * pale blue ground and a partnership's a pale vermilion one (printed as an underline instead);
 * `flag` marks a cell for the partnership to look at, `pending` a cell with 待確認 source text
 */
export const cardColors = {
  ink: '#000',
  paper: '#fff',
  rule: '#000',
  shade: '#d9d9d9',
  muted: '#4b4b4b',
  red: '#c00000',
  team: '#e2ecf8',
  partnership: '#fbe3da',
  flag: '#b45309',
  pending: '#8a6100',
  link: '#1d4ed8',
  selected: '#1d4ed8',
}

/** 4px spacing scale: space(2) === '8px' */
export const space = (n: number) => `${n * 4}px`
/** 緊湊: a 3px scale */
const compactSpace = (n: number) => `${n * 3}px`

export interface ThemeOptions {
  font?: FontChoice
  suitColors?: SuitColors
  density?: Density
}

/**
 * The theme for one set of choices. A style that has not been loaded yet (`loadStyle`) falls back
 * to 「一般」, and `style` then says 'general'. The options default to the style's own look.
 */
export function createTheme(
  mode: ThemeMode,
  textSize: TextSize = 'medium',
  requested: StyleName = 'general',
  { font = 'style', suitColors = 'four', density = 'comfortable' }: ThemeOptions = {},
) {
  const style: StyleName = loaded.has(requested) ? requested : 'general'
  const tokens = loaded.get(style)!
  const colors = tokens.colors[mode]
  const shadows = tokens.shadows[mode]
  const deck = tokens.suits[mode]
  const fonts =
    font === 'serif'
      ? { ...tokens.fonts, heading: fontStacks.serif }
      : font === 'sans'
        ? { ...tokens.fonts, heading: tokens.fonts.body }
        : font === 'system'
          ? { body: fontStacks.system, heading: fontStacks.system, mono: tokens.fonts.mono }
          : tokens.fonts
  const serifHeadings = fonts.heading === fontStacks.serif
  const headingWeight = serifHeadings ? Math.min(tokens.headingWeight, 600) : Math.max(tokens.headingWeight, 700)
  const compact = density === 'compact'
  return {
    mode,
    textSize,
    style,
    density,
    colors,
    suits: suitColors === 'two' ? { ...deck, D: deck.H, C: deck.S } : deck,
    fonts,
    headingWeight: font === 'style' ? tokens.headingWeight : headingWeight,
    lineHeight: compact ? Math.round((tokens.lineHeight - 0.15) * 100) / 100 : tokens.lineHeight,
    shape: tokens.shape,
    borders: tokens.borders,
    shadows,
    pendingBadge: tokens.pendingBadge,
    sectionNumbers: tokens.sectionNumbers,
    prefersDark: tokens.prefersDark ?? false,
    layout,
    space: compact ? compactSpace : space,
  }
}

export type AppTheme = ReturnType<typeof createTheme>

/** The phone layout breakpoint, for useMediaQuery */
export const mobileQuery = `(max-width: ${layout.mobileBreakpoint})`

/** Media query helper: `${mobile} { ... }` */
export const mobile = `@media ${mobileQuery}`

// The default avatars' colours (e11-t03) are in `styles/avatarColors.ts`: a module of their own, so
// the chunk that carries these tokens to the home page does not carry them too
