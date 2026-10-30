import type { Convention } from '../../../src/types/convention.ts'

/**
 * A made-up chapter of a bidding system for the tests (see fixture-alpha.ts): NOT the club's
 * system. An opening table without an auction and a hand example, at the basic level.
 */
export const fixtureSystem: Convention = {
  slug: 'fixture-system',
  nameZh: '測試制度（虛構）',
  nameEn: 'Fixture System (made up for tests)',
  category: 'system',
  kind: 'system',
  level: 'basic',
  cardSlots: ['wbf.summary.1nt <- openings#0:2'],
  tags: ['測試', '制度'],
  summary: '測試用的虛構制度章節：佔位的開叫表',
  source: { title: '測試講義（虛構）' },
  updated: '2026-10-30',
  sections: [
    {
      id: 'openings',
      title: '佔位開叫表（測試）',
      blocks: [
        {
          kind: 'responses',
          caption: '測試開叫總表',
          rows: [
            { call: '1C', meaning: '測試：12-21點，3張以上♣' },
            { call: '1H', meaning: '測試：12-21點，5張以上♥' },
            { call: '1NT', meaning: '測試：15-17點，平均牌型' },
          ],
        },
        { kind: 'note', tone: 'info', text: '測試用的說明：以上開叫都是虛構的。' },
      ],
    },
    {
      id: 'example',
      title: '佔位牌例（測試）',
      blocks: [
        { kind: 'paragraph', text: '測試牌例的說明文字。' },
        { kind: 'hand', label: '何手牌較佳？', hand: { spades: 'AK32', hearts: 'Q32', diamonds: 'J32', clubs: 'K32' } },
      ],
    },
  ],
}
