/**
 * The words of the compare page /profiles/:id/compare (E1 e1-t15, AC-1.7) and its links elsewhere.
 * Kept out of strings.ts, which is part of the home page's bundle (the JS budget, docs/NEXT.md).
 */
export const profileCompare = {
  title: '與母制度集比較',
  loading: '正在比較…',
  scope: '層級',
  parent: '母制度集',
  /** The club's parent: the handbook as the club keeps it */
  handbook: '社團版原文（內建內容與線上版本）',
  intro: '只列出這個制度集自己的改動；上層制度集的改動請看母制度集的比較頁。',
  linkNote: '「到該段」開啟的手冊頁顯示的是你目前選用的制度集。',
  edit: '編輯制度集',
  /** The profile's convention card (e3-t05) */
  card: '看制度卡',
  empty: '這個制度集和母制度集完全相同：沒有不採用的特約，也沒有覆寫。',

  problemsTitle: '失效的覆寫與其他問題',
  problemsIntro: '下列項目找不到要改的地方，目前沒有作用；請在編輯器修正或刪除。',
  problem: {
    missingProfile: (id: string) => `找不到制度集「${id}」，改和社團預設比較。`,
    missingParent: (name: string, parentId: string) =>
      `「${name}」的母制度集「${parentId}」不存在或無法讀取，改以社團預設為母制度集。`,
    cycle: (name: string, parentId: string) => `「${name}」的母制度集「${parentId}」又繼承回自己，繼承在這裡中斷。`,
    unknownAdoption: (slug: string) => `採用設定指到不存在的特約「${slug}」。`,
    brokenOverride: { convention: '特約已不存在', section: '段落已不存在', row: '這一列已不存在' },
    brokenNote: { convention: '備忘的特約已不存在', section: '備忘的段落已不存在' },
  },
  overrideKind: { row: '改叫品意義', section: '整段改寫', meta: '改摘要或標籤' },
  /** Where a broken override pointed: 「段落 top · 第 2 個區塊第 1 列」 */
  place: (sectionId: string, block?: number, row?: number) =>
    `段落 ${sectionId}${block === undefined ? '' : ` · 第 ${block + 1} 個區塊第 ${(row ?? 0) + 1} 列`}`,

  adoptionsTitle: '採用與不採用',
  off: '不採用',
  on: '重新採用（母制度集不採用）',
  sameAsParent: '（母制度集也是如此）',

  overridesTitle: '覆寫',
  notPlayed: '這個制度集不採用此特約，下列覆寫暫時不生效。',
  before: '原文（母制度集）',
  after: '覆寫後',
  goTo: '到該段',
  goToConvention: '到這個特約',
  /** A row inside a section the same profile replaced has no row of the parent's to set against */
  inReplaced: '這一列在本制度集整段改寫的段落裡，原文見上方的整段改寫。',
  noSection: '母制度集沒有這一段。',
  summary: '摘要',
  tags: '標籤',
  noTags: '（無）',
}
