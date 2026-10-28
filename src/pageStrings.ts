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
  /** The home page's blocks (e9-t08, DESIGN-V2 §5.3); the categories stay in strings.ts */
  home: {
    profileEyebrow: (scope: string) => `目前的制度集 · ${scope}`,
    clubName: '社團預設制度',
    signedOutNote: '登入後可以切換到隊伍或搭檔的制度集。',
    signIn: '登入',
    inherits: '繼承',
    adopted: (n: number) => `採用 ${n} 個特約`,
    overrides: (n: number) => `覆寫 ${n} 條`,
    notes: (n: number) => `備忘 ${n} 則`,
    lastUpdated: (date: string, by: string) => `最後更新 ${date}${by ? ` ${by}` : ''}`,
    read: '讀制度',
    firstTime: '第一次來？從這裡開始',
    lesson: (n: number) => `第 ${n} 課`,
    categories: '全書',
    recent: '最近更新',
    recentEdited: '線上修改',
    recentAdded: '線上新增',
    recentBundled: '內建版本',
    recentEmpty: '還沒有更新紀錄。',
  },
  /** The phone's bottom toolbar (e9-t09, DESIGN-V2 §7) */
  toolbar: {
    label: '工具列',
    catalogue: '目錄',
    onThisPage: '本頁',
    search: '搜尋',
    reading: '閱讀設定',
    mine: '我的',
    closeOnThisPage: '關閉本頁清單',
  },
}
