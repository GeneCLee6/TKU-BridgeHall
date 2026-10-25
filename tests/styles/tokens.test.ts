import { createTheme, styleNames, usesSerif, type ThemeMode } from '../../src/styles/tokens.ts'

/** The tokens before styles existed: 「一般」 must keep every one of them (DESIGN-V2.md §10.5) */
const before = {
  light: {
    colors: {
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
    suits: { S: '#1a2233', H: '#c8102e', D: '#b34700', C: '#1b7a33' },
    shadow: '0 1px 2px rgba(15, 40, 80, 0.06), 0 2px 8px rgba(15, 40, 80, 0.06)',
  },
  dark: {
    colors: {
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
    suits: { S: '#e6ebf3', H: '#ff6b6b', D: '#ffa04d', C: '#5fd27a' },
    shadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
  },
}

/** WCAG relative luminance of a #rrggbb colour */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const modes: ThemeMode[] = ['light', 'dark']

describe('style tokens', () => {
  it.each(modes)('keeps today’s %s tokens as the 「一般」 style', (mode) => {
    const theme = createTheme(mode)
    expect(theme.style).toBe('general')
    expect(theme.colors).toMatchObject(before[mode].colors)
    expect(theme.suits).toEqual(before[mode].suits)
    expect(theme.shadow).toBe(before[mode].shadow)
    expect(theme.radius).toEqual({ sm: '6px', md: '10px', lg: '14px', pill: '999px' })
    expect(theme.shape).toMatchObject({ control: '6px', panel: '14px', tag: '999px', badge: '999px' })
    expect(theme.fonts.heading).toBe(theme.fonts.body)
    expect(usesSerif('general')).toBe(false)
  })

  it('gives 中國風 serif headings, square corners and a turned seal', () => {
    const theme = createTheme('light', 'medium', 'chinese')
    expect(usesSerif('chinese')).toBe(true)
    expect(theme.fonts.heading).toMatch(/^'Noto Serif TC'/)
    expect(theme.shape.panel).toBe('2px')
    expect(theme.pendingBadge.rotate).toBe('-3deg')
  })

  describe.each(styleNames.flatMap((style) => modes.map((mode) => [style, mode] as const)))(
    '%s, %s',
    (style, mode) => {
      const { colors } = createTheme(mode, 'medium', style)

      it('has text that reads (WCAG AA)', () => {
        for (const ground of [colors.surface, colors.bg, colors.surfaceAlt]) {
          expect(contrast(colors.text, ground)).toBeGreaterThanOrEqual(4.5)
          expect(contrast(colors.textMuted, ground)).toBeGreaterThanOrEqual(4.5)
        }
        expect(contrast(colors.primary, colors.surface)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(colors.primaryStrong, colors.surface)).toBeGreaterThanOrEqual(4.5)
      })

      it('has a readable 「待確認」 and readable tags', () => {
        // A translucent ground sits on the surface; check the text against the surface itself
        const pendingGround = colors.pendingBg.startsWith('#') ? colors.pendingBg : colors.surface
        expect(contrast(colors.pendingText, pendingGround)).toBeGreaterThanOrEqual(4.5)
        const tagGround = colors.tagBg.startsWith('#') ? colors.tagBg : colors.surface
        expect(contrast(colors.tagText, tagGround)).toBeGreaterThanOrEqual(4.5)
      })
    },
  )
})
