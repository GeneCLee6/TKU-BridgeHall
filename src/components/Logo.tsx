/**
 * The open-book mark (public/logo-mark.svg) inline. Its colours are fixed: the cream pages and
 * gold cover read on both the light and the dark header. The lantern belongs to TKU BridgeTable
 * (淡江牌桌); the book keeps the two apps apart on a phone's home screen (DESIGN.md §8).
 */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden focusable="false">
      <path
        d="M32 19.6c-6-4.2-17-4.9-26-2.7V51c9-2.2 20-1.2 26 3 6-4.2 17-5.2 26-3V16.9c-9-2.2-20-1.5-26 2.7z"
        fill="#f2b84b"
      />
      <path d="M31 20.5c-5.6-3.6-14-4.4-22-2.6v30c8-1.8 16.4-1 22 2.6z" fill="#fff8e6" />
      <path d="M33 20.5c5.6-3.6 14-4.4 22-2.6v30c-8-1.8-16.4-1-22 2.6z" fill="#fff8e6" />
      <path
        transform="translate(15 23.5)"
        d="M5 0C3.5 2 0 3.6 0 6c0 1.4 1.1 2.3 2.3 2.3.7 0 1.3-.3 1.7-.7L3.3 10h3.4L6 7.6c.4.4 1 .7 1.7.7C8.9 8.3 10 7.4 10 6 10 3.6 6.5 2 5 0z"
        fill="#0f3d7a"
      />
      <path
        transform="translate(15 36)"
        d="M5 9.5 1 5.5C-.6 3.9.2.8 2.6.8c1.1 0 1.9.7 2.4 1.6.5-.9 1.3-1.6 2.4-1.6 2.4 0 3.2 3.1 1.6 4.7z"
        fill="#c8102e"
      />
      <path transform="translate(39 23.5)" d="M5 0l4 5-4 5-4-5z" fill="#d35400" />
      <g transform="translate(39 36)" fill="#1b7a33">
        <circle cx="5" cy="2.6" r="2.4" />
        <circle cx="2.4" cy="5.7" r="2.4" />
        <circle cx="7.6" cy="5.7" r="2.4" />
        <path d="M5 3.5 6.6 6.3H3.4z" />
        <path d="M4.3 5h1.4l1 4.8H3.3z" />
      </g>
      <path d="M29.6 50.5h4.8V61L32 58.4 29.6 61z" fill="#c8102e" />
    </svg>
  )
}
