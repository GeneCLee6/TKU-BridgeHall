import type { Convention } from '../../types/convention.ts'

/**
 * 橋牌防守信號 (Defensive signals)
 * Source: docs/橋牌防守信號.doc, written from the text the club provided on 2026-10-21.
 * Transcribed verbatim. Card play, not bidding, so it uses rules and notes only (no auctions).
 */

export const defensiveSignals: Convention = {
  slug: 'defensive-signals',
  nameZh: '橋牌防守信號',
  nameEn: 'Defensive Signals',
  aliases: ['信號', '防守信號', '張數', '態度', '墊牌', 'O/E', '奇正偶轉', '全轉換', 'Smith Echo'],
  category: 'signals',
  kind: 'signal',
  level: 'intermediate',
  tags: ['拔牌信號', '張數', '態度', '墊牌', 'Smith Echo'],
  summary: '拔牌信號、王牌／無王合約的張數與態度、墊牌（奇正偶轉、全轉換）與 Smith Echo。',
  source: { title: '橋牌防守信號' },
  updated: '2026-10-21',
  sections: [
    {
      id: 'lead-signals',
      title: '一、拔牌信號',
      summary: 'A、Q 看態度；K 看張數。',
      blocks: [{ kind: 'rules', items: [{ text: 'A、Q：看態度' }, { text: 'K：看張數' }] }],
    },
    {
      id: 'suit-contract',
      title: '二、王牌合約',
      summary: '張數：正；態度：反。',
      blocks: [
        { kind: 'paragraph', text: '**【張數：正】**' },
        { kind: 'rules', items: [{ text: '先大後小＝偶數張' }, { text: '先小後大＝奇數張' }] },
        { kind: 'paragraph', text: '**【態度：反】**' },
        { kind: 'rules', items: [{ text: '小牌＝歡迎' }, { text: '大牌＝不歡迎' }] },
      ],
    },
    {
      id: 'notrump-contract',
      title: '三、無王合約',
      summary: '張數：正；態度：反。',
      blocks: [
        { kind: 'paragraph', text: '**【張數：正】**' },
        { kind: 'rules', items: [{ text: '先大後小＝偶數張' }, { text: '先小後大＝奇數張' }] },
        { kind: 'paragraph', text: '**【態度：反】**' },
        { kind: 'rules', items: [{ text: '小牌＝歡迎' }, { text: '大牌＝不歡迎' }] },
      ],
    },
    {
      id: 'suit-discards',
      title: '四、王牌合約墊牌',
      summary: 'O/E：奇正偶轉。',
      blocks: [
        { kind: 'paragraph', text: '**【O/E：奇正偶轉】**' },
        {
          kind: 'rules',
          items: [
            { text: '奇數牌＝歡迎本門（通常表示較強烈的歡迎）' },
            { text: '偶數牌＝轉換，不歡迎本門' },
          ],
        },
        {
          kind: 'rules',
          items: [
            { text: '偶數大牌＝歡迎另外兩門較高的花色' },
            { text: '偶數小牌＝歡迎另外兩門較低的花色' },
          ],
        },
      ],
    },
    {
      id: 'notrump-discards',
      title: '五、無王合約墊牌',
      summary: '全轉換：不論奇偶，只看大小。',
      blocks: [
        { kind: 'paragraph', text: '**【全轉換】**' },
        {
          kind: 'rules',
          items: [
            { text: '大牌＝歡迎另外兩門較高的花色' },
            { text: '小牌＝歡迎另外兩門較低的花色' },
          ],
        },
        { kind: 'note', tone: 'info', text: '※ 不論奇偶，只看大小。' },
      ],
    },
    {
      id: 'smith-echo',
      title: '六、無王防守：Smith Echo',
      summary: '莊家第一輪打的花色，用跟牌大小表達對首攻花色的態度。',
      blocks: [
        {
          kind: 'paragraph',
          text: '第一輪莊家打出的花色，兩個防家跟牌的大小都用來表達對首攻花色的態度。',
        },
        {
          kind: 'rules',
          items: [{ text: '小牌＝歡迎首攻花色' }, { text: '大牌＝不歡迎首攻花色' }],
        },
        { kind: 'note', tone: 'warning', text: '※ 兩個防家都要跟Echo' },
      ],
    },
  ],
}
