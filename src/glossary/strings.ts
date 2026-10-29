/**
 * The glossary's interface copy (e4-t05–t07). Apart from strings.ts so the home page's bundle does
 * not carry it (same rule as pageStrings.ts).
 */
export const glossaryStrings = {
  title: '名詞解釋',
  intro: '手冊裡用到的名詞與縮寫。內文中有解釋的名詞會加上點線底線，點一下就能看解釋。',
  empty: '還沒有名詞解釋。名詞由幹部撰寫，寫好後會出現在這裡。',
  filter: '找名詞',
  filterPlaceholder: '輸入名詞、別名或解釋裡的字',
  noMatch: '沒有符合的名詞。',
  count: (n: number) => `共 ${n} 條`,
  aliases: '又稱',
  see: '相關特約',
  edit: '編輯名詞表',
  /** The popover in the text (e4-t06) */
  termButton: (term: string) => `名詞解釋：${term}`,
  close: '關閉',
  openPage: '看名詞頁',
  /** The editor (e4-t07) */
  editTitle: '編輯名詞表',
  editIntro: '整份一起儲存。名詞與別名不分大小寫不能重複；別名用逗號分開。解釋要是社團的說法，不要從別處抄。',
  bundled: '目前用的是內建名詞表（沒有在線上改過）。',
  updated: (by: string, at: string) => `${by} 在 ${at} 最後修改`,
  term: '名詞',
  aliasesField: '別名（逗號分開）',
  definition: '解釋',
  seeField: '相關特約（可不填）',
  seeNone: '（無）',
  add: '新增名詞',
  remove: (term: string) => `刪除「${term || '未命名'}」`,
  save: '儲存名詞表',
  saving: '儲存中…',
  reload: '重新載入',
  back: '回名詞頁',
  incomplete: '每個名詞都要有名稱與解釋。',
  duplicate: (name: string) => `名詞或別名重複：${name}`,
  tooMany: (n: number) => `名詞最多 ${n} 條`,
}
