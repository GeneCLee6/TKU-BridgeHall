import {
  createTheme,
  isStyleLoaded,
  loadStyle,
  styleNames,
  textSizes,
  usesSerif,
  type ThemeMode,
} from '../../src/styles/tokens.ts'

// Only 「一般」 is in the first download; createTheme shows it until a style has been loaded
expect(isStyleLoaded('general')).toBe(true)
expect(createTheme('light', 'medium', 'soft').style).toBe('general')
await Promise.all(styleNames.map(loadStyle))

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

  it.each(styleNames)('colours %s’s bidding box like 淡江牌桌 (its table.bidPass, bidDouble, bidRedouble)', (style) => {
    const { colors } = createTheme('light', 'medium', style)
    expect([colors.callPass, colors.callDouble, colors.callRedouble, colors.onCall]).toEqual([
      '#2f9e44',
      '#d9372b',
      '#2b6fd6',
      '#ffffff',
    ])
  })

  it('gives 中國風 serif headings, square corners and a turned seal', () => {
    const theme = createTheme('light', 'medium', 'chinese')
    expect(usesSerif('chinese')).toBe(true)
    expect(theme.fonts.heading).toMatch(/^'Noto Serif TC'/)
    expect(theme.shape.panel).toBe('2px')
    expect(theme.pendingBadge.rotate).toBe('-3deg')
  })

  it('gives each style its own look (docs/design/pitch.html)', () => {
    const light = (style: (typeof styleNames)[number]) => createTheme('light', 'medium', style)
    expect(light('soft').shape.panel).toBe('22px')
    expect(light('soft').borders.panel).toBe('0 solid')
    expect(light('night').prefersDark).toBe(true)
    expect(light('suits').borders.panel).toBe('2px solid')
    expect(light('suits').shadows.panel).toBe('4px 4px 0 #141416')
    expect(light('suits').headingWeight).toBe(800)
    expect(light('plain').shape).toMatchObject({ panel: '0px', control: '0px', tag: '0px' })
    expect(light('plain').lineHeight).toBeLessThan(light('general').lineHeight)
    expect(new Set(styleNames.map((s) => light(s).colors.primary)).size).toBe(styleNames.length)
  })

  it('applies 字體, 花色顏色, 密度 and 特大 on any style', () => {
    const general = createTheme('light')
    expect(createTheme('light', 'medium', 'general', { font: 'serif' }).fonts.heading).toMatch(/^'Noto Serif TC'/)
    expect(createTheme('light', 'medium', 'chinese', { font: 'sans' }).fonts.heading).toBe(general.fonts.body)
    const system = createTheme('light', 'medium', 'general', { font: 'system' }).fonts
    expect(system.body).toMatch(/^system-ui/)
    expect(system.body).not.toMatch(/Noto/)
    const two = createTheme('light', 'medium', 'general', { suitColors: 'two' }).suits
    expect(two).toEqual({ S: general.suits.S, H: general.suits.H, D: general.suits.H, C: general.suits.S })
    const compact = createTheme('light', 'medium', 'general', { density: 'compact' })
    expect(compact.space(4)).toBe('12px')
    expect(general.space(4)).toBe('16px')
    expect(compact.lineHeight).toBeLessThan(general.lineHeight)
    expect(textSizes.xlarge).toBe('125%')
    // The defaults are today's look
    expect(createTheme('light', 'medium', 'general', {})).toEqual(general)
    expect(general.lineHeight).toBe(1.7)
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

      it('has bidding box keys that read and stand out', () => {
        for (const fill of [colors.callPass, colors.callDouble, colors.callRedouble]) {
          // Light mode keeps 淡江牌桌's colours, whose Pass is 3.45:1 under white bold text
          expect(contrast(colors.onCall, fill)).toBeGreaterThanOrEqual(mode === 'dark' ? 4.5 : 3)
          if (mode === 'dark') expect(contrast(fill, colors.surface)).toBeGreaterThanOrEqual(3)
        }
      })
    },
  )
})
