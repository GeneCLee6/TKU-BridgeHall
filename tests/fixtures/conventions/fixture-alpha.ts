import type { Convention } from '../../../src/types/convention.ts'

/**
 * A made-up convention for the tests: NOT the club's content, and not meant as bridge advice. Every
 * text here is a placeholder written for the tests (the club's built-in conventions are in the private
 * repository GeneCLee6/TKU-BridgeHall-content; CONTENT_GUIDE.md §0). It has every kind of block, a
 * nested section, a 待確認 row and a worked example, so the pages and libraries have something of each.
 */
export const fixtureAlpha: Convention = {
  slug: 'fixture-alpha',
  nameZh: '測試特約甲（虛構）',
  nameEn: 'Fixture Alpha (made up for tests)',
  aliases: ['測試甲'],
  category: 'notrump',
  kind: 'convention',
  level: 'basic',
  cardSlots: [
    'wbf.openings.1NT.responses <- responses#0',
    'ctcba-simple.nt.stayman <- responses#0:0',
    'ctcba-simple.nt.transfer-2 <- responses#0:1',
  ],
  tags: ['測試', '虛構'],
  summary: '測試用的虛構特約，不是社團制度：一張佔位的答叫表',
  source: { title: '測試資料（虛構）', note: '只給自動測試用' },
  updated: '2026-10-30',
  sections: [
    {
      id: 'intro',
      title: '前言（測試）',
      blocks: [
        { kind: 'paragraph', text: '**測試用**的佔位文字：這個特約是虛構的，只用來測試網站的排版與功能。' },
        {
          kind: 'intro',
          why: '測試導讀的「為什麼用它」。',
          when: '測試導讀的「什麼時候用」。',
          pitfalls: ['測試用的常見錯誤一', '測試用的常見錯誤二'],
        },
      ],
    },
    {
      id: 'responses',
      title: '佔位答叫表（測試）',
      summary: '測試用的段落摘要',
      blocks: [
        {
          kind: 'responses',
          auction: { seats: ['開叫者', '敵方', '答叫者', '敵方'], calls: ['1NT', 'P', '?'] },
          caption: '1NT ?（測試表）',
          rows: [
            { call: '2C', meaning: '測試意義甲：8點以上，問四張高花' },
            { call: '2D', meaning: '測試意義乙：轉換到♥，5張以上♥' },
            { call: '2H', meaning: '測試意義丙：轉換到♠，5張以上♠' },
            { call: '2S', meaning: '測試意義丁：虛構的待確認列', pending: '測試用的待確認說明：這一列是虛構的。' },
            { call: '3NT', meaning: '測試意義戊：10-15點，想打3NT', note: '測試用的附註' },
          ],
        },
      ],
      children: [
        {
          id: 'after-2c',
          title: '2♣ 之後（測試）',
          blocks: [
            {
              kind: 'responses',
              auction: { seats: ['開叫者', '敵方', '答叫者', '敵方'], calls: ['1NT', 'P', '2C', 'P', '?'] },
              rows: [
                { call: '2D', meaning: '測試回答甲：沒有四張高花' },
                { call: '2H', meaning: '測試回答乙：4張♥' },
                { call: '2S', meaning: '測試回答丙：4張♠，沒有四張♥' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'rules',
      title: '佔位規則（測試）',
      level: 'intermediate',
      blocks: [
        {
          kind: 'rules',
          ordered: true,
          items: [
            { text: '測試規則一：**粗體**與花色 ♠♥♦♣。' },
            {
              text: '測試規則二：有子項目。',
              children: [{ text: '測試子項目甲。' }, { text: '測試子項目乙。', pending: '測試用：這個子項目待確認。' }],
            },
          ],
        },
        { kind: 'note', tone: 'warning', text: '測試用的注意事項：這裡的內容都是虛構的。' },
        { kind: 'paragraph', text: 'EX) 測試牌例：同伴開叫 1NT，你？' },
        { kind: 'hand', label: '叫2H', hand: { spades: 'KQJ32', hearts: '32', diamonds: 'A32', clubs: '432' } },
      ],
    },
  ],
}
