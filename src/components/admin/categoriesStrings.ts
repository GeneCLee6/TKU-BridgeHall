/** The admin page's 分類 panel copy (split out of src/strings.ts so the first page does not carry it, e10-t21) */
// 社團管理 → 分類 (editors with bookEdit too)
export const categoriesStrings = {
  title: '分類',
  intro:
    '目錄與首頁依這裡的分類分組，編輯器的分類選單也是這一份。改名、排序、新增或刪除之後按「儲存分類」，大家重新整理就會看到。',
  bundled: '目前用的是網站內建的分類；第一次儲存後改用線上這一份。',
  updated: (name: string, time: string) => `最後由 ${name} 在 ${time} 修改`,
  name: '名稱',
  description: '說明',
  conventions: '特約數',
  order: '排序',
  nameOf: (label: string) => `「${label || '新分類'}」的名稱`,
  descriptionOf: (label: string) => `「${label || '新分類'}」的說明`,
  up: (label: string) => `把「${label}」往上移`,
  down: (label: string) => `把「${label}」往下移`,
  remove: (label: string) => `刪除「${label}」`,
  inUse: (n: number) => `裡面還有 ${n} 個特約，先在編輯器把它們改到別的分類才能刪除`,
  add: '新增分類',
  newName: '新分類的名稱',
  newDescription: '說明（選填）',
  save: '儲存分類',
  undo: '放棄修改',
  unsaved: '有尚未儲存的修改。',
  nameRequired: '每個分類都要有名稱。',
  tooMany: (max: number) => `分類最多 ${max} 個。`,
  reload: '重新載入',
} as const
