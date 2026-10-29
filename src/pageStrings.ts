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
  /** The convention page's 本頁 column and, on narrower screens, its fold-out list */
  onThisPage: '本頁',
  sectionCount: (n: number) => `${n} 節`,
  /** The convention page's way into 練習 (e6-t09) */
  practice: '練這個特約',
  /** 關注 a convention (e8-t10): news of it comes to 淡江牌桌's notification centre */
  follow: {
    follow: '關注這個特約',
    following: '已關注',
    hint: '有新版本時會在淡江牌桌的通知中心告訴你',
    followingHint: '有新版本時會通知你；再按一次取消關注',
  },
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
    practice: '練習叫牌',
    library: '叢書',
    firstTime: '第一次來？從這裡開始',
    lesson: (n: number) => `第 ${n} 課`,
    wholePath: (name: string, n: number) => `看「${name}」全部 ${n} 課`,
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
  /** 入門版／完整版 (e4-t02) */
  levels: {
    more: (n: number) => `入門版：還有 ${n} 段進階或高階內容沒有顯示。`,
    showAll: '這頁顯示全部',
    mode: '版本',
    modes: { full: '完整版', basic: '入門版' },
  },
  /** 「你是新生嗎？」 on the first visit (e4-t03) */
  newcomer: {
    title: '你是新生嗎？',
    body: '入門版只顯示新生先要會的段落，進階與高階的段落先收起來。之後隨時可以在「閱讀設定」切換。',
    yes: '是，用入門版',
    no: '不是，看完整版',
    close: '關閉，不再詢問',
  },
  /** 導讀, the intro block (e4-t04) */
  intro: {
    name: '導讀',
    why: '為什麼用它',
    when: '什麼時候用',
    pitfalls: '常見錯誤',
    pitfallsHint: '一行一項。',
    hint: '給新生看的導讀，由社團撰寫（不是原文轉錄）；三項都可以只填一部分。',
  },
  /** The blocks only articles have (e5-t01, e5-t12) */
  article: {
    /** Shown in place of a picture without an address: the bucket is not set up, or it expired */
    pictureMissing: (alt: string) => (alt.trim() ? `圖片暫時無法顯示：${alt}` : '圖片暫時無法顯示'),
  },
  /** The printed book's cover and contents pages (e9-t10) */
  print: {
    club: '淡江橋藝社',
    book: '橋譜',
    profile: (name: string) => `制度集：${name}`,
    printed: (date: string) => `列印日期：${date}`,
    contents: '目錄',
    /** The running head of a printed page */
    head: (app: string, name: string) => `${app} · ${name}`,
  },
  /** 卡片總覽, the fourth 版面 (e9-t17) */
  overview: {
    title: '卡片總覽',
    intro: '點一張卡片在右側預覽，再打開整頁。',
    tabs: '依分類',
    all: '全部',
    tiles: (n: number) => `${n} 個特約`,
    overrides: (n: number) => `${n} 處覆寫`,
    preview: '預覽',
    pick: '點選左邊的特約，這裡會顯示摘要與段落。',
    sections: '段落',
    tags: '標籤',
    open: '打開特約',
    close: '關閉預覽',
    toBook: '全書目錄',
  },
}
