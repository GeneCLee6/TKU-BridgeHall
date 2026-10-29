import type { PendingStatus } from '../lib/api.ts'

/**
 * Text for the 待確認 panel (E8 e8-t06, e8-t07, e8-t08). Only the panel imports it (lazy), so it
 * stays out of the home page's JavaScript.
 */
export const pendingText = {
  title: '待確認面板',
  intro:
    '原文有疑義、等幹部確認的地方都在這裡。待確認寫在特約內容裡；這裡記誰負責、進度與備註。要關閉一則待確認，先寫下關閉依據，再到編輯器修改內容並送審，審核者發布後就會自動關閉。',
  status: {
    open: '未處理',
    working: '處理中',
    confirmed: '已確認',
    parked: '擱置',
  } satisfies Record<PendingStatus, string>,
  filterStatus: '狀態',
  filterAll: '全部',
  filterMine: '只看指派給我的',
  shown: (n: number, total: number) => (n === total ? `共 ${total} 則` : `顯示 ${n} 則，共 ${total} 則`),
  empty: '沒有待確認。',
  emptyFiltered: '沒有符合篩選的待確認。',
  where: '位置',
  question: '問題',
  assignee: '負責人',
  nobody: '（未指派）',
  note: '備註',
  resolution: '關閉依據',
  resolutionHint: '例如：社長 10/28 練習時確認、以 2011 版講義為準。關閉時會跟著版本記錄下來。',
  updated: (by: string, at: string) => `${by} 更新於 ${at}`,
  edit: '更新',
  editOf: (where: string) => `更新：${where}`,
  save: '儲存',
  saving: '儲存中…',
  cancel: '取消',
  saved: '已儲存。',
  close: '寫依據並修改內容',
  closeHint: '先存下依據，再打開編輯器：拿掉這則待確認（必要時修改原文）並送審，發布後自動關閉。',
  closeNeedsResolution: '請先寫關閉依據。',
  closedTitle: '最近關閉',
  closedBy: (by: string, at: string, version?: number) => `${by} 於 ${at} 發布${version ? `第 ${version} 版` : ''}時關閉`,
  closedEmpty: '還沒有關閉過的待確認。',
  readOnly: '有編輯權限的幹部可以指派與更新進度。',
}
