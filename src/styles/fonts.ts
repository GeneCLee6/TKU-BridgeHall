import { usesSerif, type StyleName } from './tokens.ts'

/**
 * Web fonts a style needs beyond the body font (Noto Sans TC, loaded in main.tsx). The serif
 * heading font is only weight 600 and split by unicode-range, so a page downloads just the
 * characters its headings use; its stylesheet is a separate chunk that 「一般」 never requests.
 */
let serif: Promise<unknown> | undefined

export function loadStyleFonts(style: StyleName): void {
  if (usesSerif(style)) serif ??= import('@fontsource/noto-serif-tc/600.css').catch(() => (serif = undefined))
}
