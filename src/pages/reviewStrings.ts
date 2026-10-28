import type { AuditAction, BookDraft } from '../lib/api.ts'

/**
 * Text for drafts, review and the audit log (E8 e8-t01, e8-t02, e8-t09). Only the editor and the
 * admin page import it (both lazy), so it stays out of the home page's JavaScript.
 */
export const review = {
  // Editor buttons
  saveDraft: '儲存草稿',
  saveDraftShort: '草稿',
  submit: '送審',
  publish: '直接發布',
  publishDraft: '發布',
  publishHint: '審核者可以不送審直接發布',
  saving: '儲存中…',
  discard: '捨棄草稿',
  discardConfirm: '確定捨棄這份草稿？已發布的內容不受影響。',
  discarded: '草稿已捨棄。',
  confirm: '確定',
  cancel: '取消',
  reload: '重新載入',
  // After a save
  draftSaved: '已儲存草稿。讀者還看不到，送審並發布後才會出現在橋譜。',
  submitted: '已送審，等審核者發布。',
  published: (n: number) => `已發布（第 ${n} 版）。`,
  rejected: '已退回草稿給編輯者。',
  // Where the draft is
  stateDraft: '草稿',
  stateInReview: '送審中',
  draftInfo: (d: BookDraft, at: string) => `這是草稿（${d.updatedBy} 在 ${at} 儲存），只有編輯者與審核者看得到。`,
  inReviewInfo: (d: BookDraft, at: string) => `送審中：${d.reviewRequestedBy ?? d.updatedBy} 在 ${at} 送審，等審核者發布或退回。`,
  sentBack: (by: string, at: string) => `${by} 在 ${at} 退回`,
  sentBackNoReason: '（沒有寫理由）',
  stale: (base: number, now: number) =>
    base === 0
      ? `這份草稿從內建版本開始，之後已經發布了第 ${now} 版；發布草稿會取代它。`
      : `這份草稿從第 ${base} 版開始，之後已經發布了第 ${now} 版；發布草稿會取代它。`,
  editorOnly: '你可以儲存草稿與送審；發布要由審核者（「審核發布」權限）按。',
  rejectReason: '退回理由',
  rejectReasonHint: '例如：點力範圍和社團原文不符',
  reject: '退回',
  // Admin page: drafts
  draftsTitle: '草稿與送審',
  draftsIntro: '還沒發布的修改。送審中的在前；審核者打開後可以發布或退回。',
  draftsEmpty: '目前沒有草稿。',
  convention: '特約',
  status: '狀態',
  updated: '最後儲存',
  open: '打開',
  // Admin page: audit log
  auditTitle: '審計紀錄',
  auditIntro: '最近 200 筆內容變更：誰在何時改了什麼。',
  auditEmpty: '還沒有紀錄。',
  when: '時間',
  who: '誰',
  what: '動作',
  target: '對象',
  version: '版本',
  note: '說明',
  versionN: (n: number) => `第 ${n} 版`,
  actions: {
    'book:draft': '存草稿',
    'book:submit': '送審',
    'book:reject': '退回',
    'book:discard': '捨棄草稿',
    'book:publish': '發布',
    'book:hide': '隱藏',
    'book:reset': '改回內建',
    'book:categories': '改分類',
    'profile:create': '新增制度集',
    'profile:save': '儲存制度集',
    'profile:delete': '刪除制度集',
    'article:publish': '發布文章',
    'article:hide': '隱藏文章',
    'quiz:fix': '修改練習題',
    'quiz:unfix': '刪除練習題的修正',
  } satisfies Record<AuditAction, string>,
  categories: '分類',
}
