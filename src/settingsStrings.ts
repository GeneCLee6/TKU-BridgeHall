/**
 * Interface copy of 個人設定 (e9-t15, DESIGN-V2.md §10.5). Only the lazily loaded settings page
 * and 我的帳號 import it, so the home page's bundle does not carry it (scripts/check-budget.mjs).
 * Each choice is a name and, where it helps, one line on what it looks like.
 */
export const settingsStrings = {
  title: '個人設定',
  intro: '風格、版面與文字都可以照自己的習慣調，只改變你看到的樣子，不影響別人。選了會先預覽，按「儲存」才會保留；設定存在這台裝置的瀏覽器。',
  display: '顯示',
  displayIntro: '風格、版面、字體、字級、花色顏色與密度。',
  toSettings: '打開個人設定',
  phoneNote: '手機一律單欄＋底部工具列，版面在電腦與平板生效。',
  reset: '全部恢復預設',
  resetPreview: '已換成預設值，按「儲存」才會套用。',
  discard: '取消變更',
  unsavedPlain: '還沒儲存。',
  unsaved: '預覽中：還沒儲存，離開這頁會恢復原本的設定。',
  groups: {
    style: '風格',
    layout: '版面',
    theme: '明暗',
    font: '字體',
    textSize: '字級',
    suitColors: '花色顏色',
    density: '密度',
  },
  styles: {
    general: ['一般', '現在的配色與圓角（預設）'],
    chinese: ['中國風', '宣紙、墨、朱紅；襯線標題、雙線框'],
    soft: ['圓潤', '湖水青與芒果；大圓角、無框、浮起'],
    night: ['夜讀', '石墨與琥珀，跟隨系統時一律深色'],
    suits: ['四色', '純白墨黑、粗線，花色四色當點綴'],
    plain: ['極簡', '黑白灰、直角細線、字小行緊'],
  },
  layouts: {
    whole: ['整本一頁', '目錄在左，寬螢幕時「本頁」在右（預設）'],
    three: ['三欄閱讀', '平板寬度起「本頁」就固定在右欄'],
    focus: ['專注單欄', '收起目錄，正文置中'],
    cards: ['卡片總覽', '首頁是特約卡片，點一下在右側預覽'],
  },
  fonts: {
    style: ['跟隨風格', '風格自己的字體'],
    serif: ['襯線標題', '標題用明體，內文不變'],
    sans: ['無襯線', '標題與內文都用黑體'],
    system: ['系統字型', '用裝置內建字型，不下載網頁字型'],
  },
  suitColors: {
    four: ['四色', '♥ 紅、♦ 橘、♣ 綠、♠ 黑'],
    two: ['雙色', '♥♦ 紅、♣♠ 黑，和牌桌的雙色牌一樣'],
  },
  densities: {
    comfortable: ['舒適', '預設的間距'],
    compact: ['緊湊', '間距與行高收緊，一頁看得更多'],
  },
  // 隱私 (e10-t06, e10-t07)
  privacy: '隱私',
  analytics: '傳送匿名使用統計',
  analyticsHint:
    '幫幹部知道哪些特約、搜尋與練習最常用。只送：開了哪一頁（不含網址參數，社員、隊伍與制度集的編號會拿掉）、停下來的搜尋詞、切換到哪一種制度集（社團、隊伍或搭檔，不含是哪一個）、練習答對或答錯。不送帳號、名字或任何能認出你的資料；統計用的隨機代號每週換一個。',
  analyticsSignal: '你的瀏覽器要求網站不要追蹤（Global Privacy Control 或 Do Not Track），所以預設不傳送；要幫忙可以自己打開。',
  analyticsClub: '社團管理員也可以替所有人關閉。',
  errors:
    '另外，網站出錯時會自動回報錯誤訊息、出錯的頁面（不含網址參數與編號）與網站版本給幹部修正，不含帳號或你輸入的內容；這和上面的開關無關。',
} as const
