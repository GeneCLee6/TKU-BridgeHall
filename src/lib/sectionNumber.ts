import type { AppTheme } from '../styles/tokens.ts'

const HAN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

/**
 * A top-level section's number: 「§3」, or 「三、」 in a style that numbers the way Chinese books
 * do (DESIGN-V2.md §10.5). Past 99 it falls back to 「§」.
 */
export function sectionNumber(style: AppTheme['sectionNumbers'], n: number) {
  if (style === 'sign' || n > 99) return `§${n}`
  const tens = Math.floor(n / 10)
  return `${tens > 1 ? HAN[tens] : ''}${tens ? '十' : ''}${HAN[n % 10]}、`
}
