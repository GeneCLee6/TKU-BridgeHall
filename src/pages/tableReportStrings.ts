import type { ShowsField } from '../lib/specReport.ts'
import type { UnresolvedReason } from '../lib/systemSpec.ts'

/**
 * The words of the report page /integrations/table (E7 e7-t04) and its link on the admin page.
 * Kept here instead of strings.ts, which is part of the home page's bundle, so that they load
 * with the page (the home page's JS budget, docs/NEXT.md).
 */
export const tableReport = {
  title: '牌桌整合',
  adminLink: '牌桌整合：橋館與牌桌機器人的差異報告',
  intro:
    '淡江牌桌的機器人（TKB）用淡江制度時，叫品說明會附上這裡同步過去的橋館原文；叫牌仍照牌桌已驗證的規則。這一頁把制度集的叫品表轉成規則，列出和牌桌規則不一致、牌桌沒有規則與轉不出來的叫品。轉換只抽原文明寫的點力、張數、牌型、迫叫與特約名，不補、不改。',
  profile: '制度集',
  tableFollows: (name: string) =>
    `牌桌機器人目前跟著「${name}」的橋館文字（牌桌的 SYSTEM_PROFILE_ID 設定）。`,
  converting: '正在轉換制度集的叫品表…',
  neverSynced: '這個制度集還沒同步到牌桌。',
  synced: (at: string, by: string) => `最後同步：${at}（${by}）`,
  upToDate: '和現在的內容相同。',
  outOfDate: '內容在同步之後改過，牌桌用的還是舊的。',
  sync: '重新同步到牌桌',
  syncing: '同步中…',
  syncedNow: '已同步到牌桌。',
  summary: '總覽',
  counts: (rules: number, unresolved: number) => `轉出 ${rules} 條規則；${unresolved} 列轉不出來。`,
  comparing: (done: number, all: number) => `正在比對牌桌規則（${done} / ${all} 個叫牌過程）…`,
  compared: (differ: number, missing: number) =>
    `和牌桌規則不一致 ${differ} 條；牌桌沒有規則 ${missing} 條。`,
  compareFailed: '比對牌桌規則失敗：',
  retry: '再試一次',
  differTitle: '和牌桌規則不一致的叫品',
  differIntro: '只比橋館原文寫到的部分；牌桌規則多寫的不算不一致。',
  noDiffer: '沒有不一致的叫品。',
  missingTitle: '牌桌沒有規則的叫品',
  missingIntro: '牌桌機器人在這個叫牌過程不會叫這個叫品（或沒有任何規則），說明也就不會出現。',
  unresolvedTitle: '轉不出來的叫品',
  unresolvedIntro: '這些列沒有進規則，牌桌不會用到它們的文字。補上手牌條件的介面是 e7-t08。',
  rows: (n: number) => `${n} 列`,
  colConvention: '特約',
  colAuction: '叫牌過程',
  colCall: '叫品',
  colBook: '橋館',
  colRead: '讀到',
  colTable: '牌桌',
  colDiff: '不同處',
  colDetail: '說明',
  opening: '（開叫）',
  noRule: '沒有規則',
  field: {
    hcp: '點力',
    lenS: '♠張數',
    lenH: '♥張數',
    lenD: '♦張數',
    lenC: '♣張數',
    balanced: '平均牌型',
    forcing: '迫叫',
    name: '特約',
  } satisfies Record<ShowsField, string>,
  reason: {
    pending: '待確認',
    noAuction: '沒有叫牌過程',
    noQuestion: '叫牌過程沒有「?」（是例子）或不只一個',
    auctionCell: '叫牌過程的格子不是叫品',
    call: '叫品不是叫品',
    alternatives: '列出幾種牌（編號或「或」）',
    bracketed: '括號裡有手牌條件',
    noConditions: '讀不到點力、張數或牌型',
  } satisfies Record<UnresolvedReason, string>,
  shows: {
    hcp: (range: string) => `${range} 點`,
    balanced: '平均',
    game: '成局迫叫',
    oneRound: '迫叫一圈',
  },
} as const
