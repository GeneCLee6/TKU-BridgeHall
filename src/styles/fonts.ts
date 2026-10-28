import { fontStacks } from './tokens.ts'

/**
 * Web fonts a theme needs beyond the body font (Noto Sans TC, loaded in main.tsx; the browser
 * downloads its files only while some text uses it, so 系統字型 downloads none). The serif heading
 * font is only weight 600 and split by unicode-range, so a page downloads just the characters its
 * headings use; its stylesheet is a separate chunk that 「一般」 never requests.
 */
let serif: Promise<unknown> | undefined

export function loadThemeFonts(theme: { fonts: { heading: string } }): void {
  if (theme.fonts.heading === fontStacks.serif)
    serif ??= import('@fontsource/noto-serif-tc/600.css').catch(() => (serif = undefined))
}
