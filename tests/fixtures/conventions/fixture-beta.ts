import type { Convention } from '../../../src/types/convention.ts'

/**
 * A second made-up convention for the tests (see fixture-alpha.ts): NOT the club's content. A
 * defence with a prerequisite, an annotated call in its auction and a whole section marked 待確認.
 */
export const fixtureBeta: Convention = {
  slug: 'fixture-beta',
  nameZh: '測試特約乙（虛構）',
  nameEn: 'Fixture Beta (made up for tests)',
  aliases: ['測試乙'],
  category: 'competitive',
  kind: 'defense',
  level: 'intermediate',
  prerequisites: ['fixture-alpha'],
  tags: ['測試', '競叫'],
  summary: '第二個測試用的虛構特約：敵方插叫之後的佔位叫品',
  source: { title: '測試資料（虛構）' },
  updated: '2026-10-30',
  sections: [
    {
      id: 'overview',
      title: '佔位概要（測試）',
      blocks: [
        { kind: 'paragraph', text: '測試用的段落：敵方插叫之後，下表是虛構的叫品意義。' },
        {
          kind: 'responses',
          auction: { seats: ['同伴', '右敵', '我', '左敵'], calls: ['1NT', { call: '2C', note: '測試註記' }, '?'] },
          rows: [
            { call: 'X', meaning: '測試：處罰性，8點以上' },
            { call: '2D', meaning: '測試：自然，5張以上♦，不迫叫' },
            { call: '3NT', meaning: '測試：想打3NT，有♣擋張' },
          ],
        },
      ],
    },
    {
      id: 'later',
      title: '佔位後續（測試）',
      pending: '測試用：整段都待確認。',
      blocks: [{ kind: 'paragraph', text: '測試用的後續說明，整段標了待確認。' }],
    },
  ],
}
