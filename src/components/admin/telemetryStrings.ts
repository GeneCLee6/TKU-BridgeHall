import type { BookClientError } from '../../lib/api.ts'

/**
 * Text of the admin page's 錯誤回報 (e10-t06) and 使用統計 (e10-t07) panels. Only the admin page
 * (lazy) imports it, so it stays out of the home page's JavaScript.
 */
export const telemetryStrings = {
  errorsTitle: '錯誤回報',
  errorsIntro: '讀者的瀏覽器出錯時自動回報，最近 100 筆、最新的在前；同樣的錯誤合併計次。不含帳號，頁面不含網址參數與編號。',
  noErrors: '目前沒有錯誤回報',
  at: '最後發生',
  kind: '種類',
  kinds: { error: '程式錯誤', rejection: '未處理的非同步錯誤', boundary: '頁面無法顯示' } satisfies Record<
    BookClientError['kind'],
    string
  >,
  message: '訊息',
  count: '次數',
  page: '頁面',
  version: '版本',
  source: '位置：',
  stack: '呼叫堆疊',
  clear: '清空',
  confirmClear: '確定清空全部錯誤回報？',
  cleared: '已清空',

  analyticsTitle: '使用統計',
  analyticsIntro: '匿名統計：不含帳號、制度集與隊伍；讀者可以在個人設定關閉，瀏覽器要求不追蹤時預設關閉。',
  analyticsOff: '社團已關閉匿名分析：讀者的瀏覽器不再收集新資料，下面是關閉前的統計。',
  clubSwitch: '社團開啟匿名分析',
  clubSwitchHint: '只有管理員能切換。關閉後伺服器丟掉所有新的使用事件；錯誤回報不受影響。',
  weekly: '每週',
  visitors: '活躍人數',
  pages: '瀏覽數',
  visitorsHint: '每個瀏覽器每週一個隨機代號，同一人換裝置會算兩次。',
  weekOf: (monday: string) => `${monday.slice(5).replace('-', '/')} 起`,
  week: '週（週一起）',
  last28: '最近 28 天',
  topConventions: '熱門特約',
  views: '瀏覽',
  topSearches: '熱門搜尋',
  query: '搜尋詞',
  times: '次數',
  none: '還沒有資料',
  profileSwitches: '制度集切換',
  quiz: '練習答題',
  quizSummary: (answered: number, correct: number) =>
    answered ? `${answered} 題，答對 ${correct} 題（${Math.round((correct / answered) * 100)}%）` : '0 題',
  timesCount: (n: number) => `${n} 次`,
}
