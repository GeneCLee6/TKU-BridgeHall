/**
 * Interface copy that only the lazily loaded reading pages use. It lives apart from strings.ts so
 * the home page's bundle does not carry it (strings.ts is part of every page's first load, and the
 * home page has a JS budget, scripts/check-budget.mjs). Same rule as strings.ts: every word on the
 * screen comes from a strings module, never from a component.
 */
export const pageStrings = {
  /** The convention page's neighbours (e9-t05) */
  neighbours: '上一個與下一個特約',
  previous: '上一個',
  next: '下一個',
  previousLabel: (name: string) => `上一個特約：${name}`,
  nextLabel: (name: string) => `下一個特約：${name}`,
  /** The convention page's 本頁 column and, on narrower screens, its fold-out list */
  onThisPage: '本頁',
  sectionCount: (n: number) => `${n} 節`,
}
