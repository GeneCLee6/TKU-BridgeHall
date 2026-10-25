import { useTheme } from 'styled-components'

/**
 * The arch mark (public/logo-mark.svg) inline: a gold roof line over a blue arch with the four
 * suits inside. Its colours come from the theme (accent, primary and the four-colour deck), so it
 * follows the light and dark header. The lantern belongs to TKU BridgeTable (淡江牌桌); the arch
 * keeps the two apps apart on a phone's home screen (DESIGN.md §8).
 */
export function LogoMark({ size = 40 }: { size?: number }) {
  const { colors, suits } = useTheme()
  const line = { fill: 'none', strokeWidth: 4, strokeLinecap: 'round' } as const
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden focusable="false">
      <path d="M6 27C16 16 24 12 32 12s16 4 26 15" stroke={colors.accent} {...line} />
      <path d="M48 55V37a16 16 0 0 0-32 0v18" stroke={colors.primary} {...line} />
      <path d="M7 55h50" stroke={colors.primary} {...line} />
      <path
        transform="translate(19.5 28.5) scale(.5)"
        d="M12 2C8.5 6.5 5 9.2 5 13a4 4 0 0 0 6.2 3.3L10 21h4l-1.2-4.7A4 4 0 0 0 19 13c0-3.8-3.5-6.5-7-11z"
        fill={suits.S}
      />
      <path
        transform="translate(33 28.5) scale(.5)"
        d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"
        fill={suits.H}
      />
      <path transform="translate(19.5 41) scale(.5)" d="M12 2l7.5 10L12 22 4.5 12z" fill={suits.D} />
      <path
        transform="translate(33 41) scale(.5)"
        d="M12 2a4 4 0 0 0-3.3 6.2A4 4 0 1 0 10.4 15L9.3 21h5.4l-1.1-6a4 4 0 1 0 1.7-6.8A4 4 0 0 0 12 2z"
        fill={suits.C}
      />
    </svg>
  )
}
