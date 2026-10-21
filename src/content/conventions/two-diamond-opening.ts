import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 2D 開叫 (一高弱二): 2♦ showing a weak two in one major
 * Source: docs/2D開叫(一高弱二).doc, written from the text the club provided on 2026-10-21.
 * Transcribed verbatim; only bids and suit letters were rewritten with suit symbols (2N -> 2NT,
 * "H低限" -> "♥低限"). The source shows no opponents' calls, so their seats are left empty.
 */

const seats: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']

export const twoDiamondOpening: Convention = {
  slug: 'two-diamond-opening',
  nameZh: '2D 開叫（一高弱二）',
  nameEn: '2♦ Opening (Weak Two in One Major)',
  aliases: ['2D', '2D開叫', '一高弱二', '弱二', 'multi', 'P/C'],
  category: 'suit-openings',
  tags: ['2♦ 開叫', '一高弱二', 'P/C', '2NT 詢問'],
  summary:
    '2♦ 開叫表示一門高花弱二：答叫者的叫品（P/C、2NT 詢問、6 張迫叫），以及 2NT 詢問後開叫者的回答。',
  source: { title: '2D 開叫 (一高弱二)' },
  updated: '2026-10-21',
  sections: [
    {
      id: 'responses',
      title: '答叫：2♦ ?',
      summary: 'P 打 2♦、P/C、2NT 詢問、三線低花 6 張迫叫。',
      blocks: [
        {
          kind: 'responses',
          auction: { seats, calls: ['2D', '', '?'] },
          rows: [
            { call: 'P', meaning: '♦ to play' },
            { call: '2H', meaning: 'P/C' },
            { call: '2S', meaning: 'P/C' },
            { call: '2NT', meaning: '詢問' },
            { call: '3C', meaning: '6張F' },
            { call: '3D', meaning: '6張F' },
            { call: '3H', meaning: 'P/C' },
            { call: '3S', meaning: 'P/C' },
            { call: '4H', meaning: 'P/C' },
          ],
        },
      ],
    },
    {
      id: 'after-2nt',
      title: '開叫者回答：2♦ 2NT ?',
      summary: '報出高花與高低限；高限時叫另一門高花以避免定莊。',
      blocks: [
        {
          kind: 'responses',
          auction: { seats, calls: ['2D', '', '2NT', '', '?'] },
          rows: [
            { call: '3C', meaning: '♥低限' },
            { call: '3D', meaning: '♠低限' },
            { call: '3H', meaning: '♠高限(避免定莊)' },
            { call: '3S', meaning: '♥高限(避免定莊)' },
          ],
        },
      ],
    },
  ],
}
