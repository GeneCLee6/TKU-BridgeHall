import { calls, fontStacks, type StyleTokens } from '../tokens.ts'

/**
 * 夜讀: graphite and amber, dark first (跟隨系統 opens it dark); the light version is graphite
 * paper with amber. The demo's glass panels are translucent; here they are their solid colours
 * over the page, so text contrast can be checked.
 */
const night: StyleTokens = {
  prefersDark: true,
  colors: {
    light: {
      bg: '#e6e8ec',
      surface: '#f4f5f7',
      surfaceAlt: '#dcdfe5',
      border: '#c6cad3',
      text: '#15171c',
      textMuted: '#4f5564',
      primary: '#8a560a',
      primaryStrong: '#15171c',
      primarySoft: '#f3e4c6',
      onPrimary: '#ffffff',
      accent: '#a66a12',
      structure: '#8a560a',
      seal: '#a82c27',
      focus: '#a66a12',
      pendingBg: '#f3e4c6',
      pendingBorder: '#a66a12',
      pendingText: '#5e3c06',
      warningBg: '#f6dcda',
      warningBorder: '#b7322c',
      tagBg: '#dcdfe5',
      tagBorder: 'transparent',
      tagText: '#474c59',
      overlay: 'rgba(14, 16, 20, 0.45)',
      ...calls.light,
    },
    dark: {
      bg: '#0e1014',
      surface: '#1c1f26',
      surfaceAlt: '#23262d',
      border: '#363941',
      text: '#e8e6e1',
      textMuted: '#a2a4ae',
      primary: '#f2b35c',
      primaryStrong: '#ffd38a',
      primarySoft: '#2e2619',
      onPrimary: '#0e1014',
      accent: '#f2b35c',
      structure: '#f2b35c',
      seal: '#ff7b6b',
      focus: '#f2b35c',
      pendingBg: '#2e2619',
      pendingBorder: '#f2b35c',
      pendingText: '#ffd38a',
      warningBg: '#3a1f1d',
      warningBorder: '#ff7b6b',
      tagBg: '#23262d',
      tagBorder: 'transparent',
      tagText: '#b0b2bb',
      overlay: 'rgba(0, 0, 0, 0.6)',
      ...calls.dark,
    },
  },
  suits: {
    light: { S: '#15171c', H: '#d62839', D: '#c4650f', C: '#2e8b57' },
    dark: { S: '#e8e6e1', H: '#ff6b6b', D: '#ffa04d', C: '#5fd27a' },
  },
  fonts: { body: fontStacks.sans, heading: fontStacks.sans, mono: fontStacks.mono },
  headingWeight: 700,
  lineHeight: 1.7,
  shape: { control: '8px', panel: '12px', tag: '999px', badge: '999px', note: '8px' },
  borders: { control: '1px solid', panel: '1px solid' },
  shadows: {
    light: { panel: '0 1px 0 rgba(255, 255, 255, 0.5) inset, 0 8px 24px rgba(0, 0, 0, 0.08)' },
    dark: { panel: '0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 12px 32px rgba(0, 0, 0, 0.5)' },
  },
  pendingBadge: { borderWidth: '1px', rotate: '0deg', serif: false },
  sectionNumbers: 'sign',
}

export default night
