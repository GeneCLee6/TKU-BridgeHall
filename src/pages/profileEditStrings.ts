import { PROFILE_LIMITS } from '../lib/api.ts'

/**
 * The words of the system profile editor /profiles/:id/edit (E1 e1-t14) and its links elsewhere.
 * Kept out of strings.ts, which is part of the home page's bundle (the JS budget, docs/NEXT.md).
 */
export const profileEdit = {
  title: '編輯制度集',
  titleOf: (name: string) => `編輯制度集：${name}`,
  loading: '正在載入制度集…',
  intro:
    '制度集只記下和母制度集不同的地方：採用哪些特約、哪個叫品改成什麼意思、哪個段落換成自己的版本，以及給成員看的備忘。橋館的原文不會被改動。',
  parent: (name: string) => `母制度集：${name}`,
  noParent: '這是社團的制度集，其他制度集都從這裡繼承。',
  compare: '與母制度集比較',
  readOnly: '你可以看這個制度集，但沒有編輯權限；要修改請找隊長或社團的編輯。',

  adoptionTitle: '採用的特約',
  adoptionIntro: '「跟隨母制度集」時，母制度集採用或不採用，這裡就跟著一樣。',
  follow: (on: boolean) => `跟隨母制度集（${on ? '採用' : '不採用'}）`,
  defaultOn: '預設（採用）',
  on: '採用',
  off: '不採用',
  otherCategory: '其他',
  adoptionCount: (on: number, off: number) => `這個制度集自己設定：採用 ${on} 個、不採用 ${off} 個。`,

  convention: '特約',
  section: '段落',
  row: '叫品',
  pickConvention: '選擇特約…',
  pickSection: '選擇段落…',
  pickRow: '選擇叫品…',
  noRows: '這個段落沒有叫品表。',
  wholeConvention: '整個特約',

  rowTitle: '叫品改寫（改成…）',
  rowIntro: '把某個叫品的意義改成這個制度集的約定。原文照舊保留，讀者會看到「覆寫」標記。',
  original: '原文',
  originalNote: '原本的備註',
  newMeaning: '改成',
  newNote: '備註（選填）',
  newNoteHint: '預設是原本的備註；清空就不顯示備註。',
  addRow: '加入改寫',
  updateRow: '更新改寫',
  noRowOverrides: '還沒有改寫任何叫品。',
  missingRow: '（找不到這個叫品，可能原文已經改過）',
  edit: '編輯',
  remove: '移除',

  sectionTitle: '段落替換（換成…）',
  sectionIntro: '把整個段落換成這個制度集自己的版本（包括其中的子段落）。移除替換就回到母制度集的版本。',
  replace: '換成…',
  editReplacement: '編輯替換內容',
  done: '完成',
  revert: '還原',
  noSectionOverrides: '還沒有替換任何段落。',
  replacedSection: (title: string) => `替換「${title}」`,

  notesTitle: '備忘',
  notesIntro: '只給這個制度集的成員看的私人備忘，可以寫在特約或某個段落上。',
  noteText: '備忘內容',
  noteCount: (n: number) => `${n} / ${PROFILE_LIMITS.noteMax} 字`,
  addNote: '新增備忘',
  updateNote: '更新備忘',
  noNotes: '還沒有備忘。',
  noteBy: (by: string, at: string) => `${by}・${at}`,

  saveTitle: '儲存',
  saveNote: '這次修改的說明（選填）',
  save: '儲存制度集',
  saving: '儲存中…',
  savedVersion: (n: number) => `已儲存（第 ${n} 版）。`,
  unsaved: '有尚未儲存的修改。',
  noChanges: '沒有修改。',
  leaveWarning: '制度集有尚未儲存的修改，確定要離開嗎？',
  conflict:
    '儲存失敗：在你載入之後，已經有人儲存了這個制度集。為了不蓋掉對方的修改，請重新載入最新版本後再改一次（重新載入會丟掉這裡還沒儲存的修改）。',
  reload: '重新載入最新版本',
  problems: {
    tooManyOverrides: (n: number) => `改寫與替換共 ${n} 處，超過上限 ${PROFILE_LIMITS.overridesMax} 處。`,
    noteTooLong: (n: number) => `第 ${n} 則備忘超過 ${PROFILE_LIMITS.noteMax} 字。`,
    emptyNote: (n: number) => `第 ${n} 則備忘是空的。`,
    emptyMeaning: (n: number) => `第 ${n} 處改寫沒有填新的意義。`,
    tooLarge: '制度集太大，請減少替換的段落或備忘。',
  },

  adminTitle: '制度集',
  adminIntro: '社團、隊伍與搭檔的制度集。',
  adminEmpty: '還沒有制度集。',
  scope: '範圍',
  name: '名稱',
  actions: '操作',
} as const
