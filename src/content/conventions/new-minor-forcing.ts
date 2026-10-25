import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 新低花迫叫 (New Minor Forcing)
 * Source: docs/NMF.doc (the club's Word file), transcribed verbatim; only bids and suit letters
 * were rewritten with suit symbols (3C -> 3♣, "H fit" -> "♥ fit").
 * A leading "--" in an auction is a passed hand, so those auctions start with responder.
 * Generated from the Word text, then checked against the source section by section.
 */

const openerFirst: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']
const responderFirst: Auction['seats'] = ['答叫者', '敵方', '開叫者', '敵方']

export const newMinorForcing: Convention = {
  slug: 'new-minor-forcing',
  nameZh: '新低花迫叫',
  nameEn: 'New Minor Forcing',
  aliases: ['NMF', 'new minor forcing', '新低花', '第四門新花'],
  category: 'suit-openings',
  kind: 'convention',
  level: 'intermediate',
  tags: ['NMF', '1NT 再叫', '迫叫', 'pass-hand'],
  summary:
    '開叫者再叫 1NT 或 2 線低花後，答叫者叫最低的新低花為邀請以上的迫叫；含 pass-hand 的 NMF 與第四門新花。',
  source: {
    title: 'NMF',
    note: '文件標題：新低花迫叫（new minor forcing）之答叫方式',
  },
  updated: '2026-10-21',
  sections: [
    {
      id: 'principles',
      title: '使用原則',
      originalTitle: '使用原則如下：',
      blocks: [
        {
          kind: 'paragraph',
          text: '1.答叫者叫出2線最低的新低花為邀請點以上，該花色不保證，至少迫叫至2NT',
        },
        {
          kind: 'paragraph',
          text: '2.除了最低的新低花外，答叫者叫出其他花色皆為牌組不迫叫（54，6~9 hcp）',
        },
        {
          kind: 'paragraph',
          text: '3.答叫者叫回2線開叫者花色時，為44↑不迫叫（後續叫品詳後述）',
        },
        {
          kind: 'paragraph',
          text: '4.開叫者回答時，從最低的高花叫起。',
        },
      ],
    },
    {
      id: 'one-club-1nt',
      title: '1♣ 1♠ 1NT 之後',
      summary: '2♦ 為 NMF；2♣ 為 4♠＋4♣ 不迫叫。',
      blocks: [
        {
          kind: 'paragraph',
          text: '詳細叫品之舉例說明',
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1C', '', '1S', '', '1NT', '', '?'],
          },
          rows: [
            {
              call: '2C',
              meaning: '4張♠↑＋4張♣↑，6~9（當開叫者♠、♣為33時，一律修正為2♠）',
            },
            {
              call: '2D',
              meaning: 'NMF新低花迫叫',
            },
            {
              call: '2H',
              meaning: '5張♠↑＋4張♥↑，6~9，不迫叫',
            },
            {
              call: '2S',
              meaning: '5張♠↑，6~9，不迫叫',
            },
            {
              call: '2NT',
              meaning: '邀請3NT（無5張♠）',
            },
            {
              call: '3C',
              meaning: '4張♠＋5張♣↑，邀請',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1C', '', '1S', '', '1NT', '', '2D', '', '?'],
          },
          rows: [
            {
              call: '2H',
              meaning: '4張♥，可能有3張♠',
            },
            {
              call: '2S',
              meaning: '3張♠，沒有4張♥',
            },
            {
              call: '2NT',
              meaning: '2344（沒有4張♥及3張♠）',
            },
            {
              call: '3C',
              meaning: '2335（沒有4張♥及3張♠）',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1C', '', '1S', '', '1NT', '', '2C', '', '?'],
          },
          rows: [
            {
              call: 'Pass',
              meaning: '4張♣↑',
            },
            {
              call: '2S',
              meaning: '3433（答叫者若為4張♠＋5張♣，可以修正為3♣）',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1C', '', '1S', '', '1NT', '', '2D', '', '3D', '', '?'],
          },
          rows: [
            {
              call: '3H',
              meaning: 'GF，55選擇4♥ or 3NT',
            },
          ],
        },
      ],
    },
    {
      id: 'one-club-2c',
      title: '1♣ 1♠ 2♣ 之後',
      summary: '2♦ 為新低花迫叫，迫叫至 2NT。',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: [
              '1C',
              '',
              '1S',
              '',
              '2C',
              '',
              {
                call: '2D',
                note: '新低花迫叫',
              },
              '',
              '?',
            ],
          },
          rows: [
            {
              call: '2H',
              meaning: '4張♥ waiting，可能有3張♠',
            },
            {
              call: '2S',
              meaning: '3張♠，沒有4張♥',
            },
            {
              call: '2NT',
              meaning: '沒有4張♥及3張♠（2335或是1345）',
            },
            {
              call: '3C',
              meaning: '6張♣，沒有4張♥及3張♠',
            },
            {
              call: '3D',
              meaning: '5張♣↑，4張♦（高限14~15）',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1C', '', '1S', '', '2C', '', '2D', '', '2H', '', '?'],
          },
          rows: [
            {
              call: '2S',
              meaning: '5張♠，check ♠張數，迫叫（因為之前2♦已經迫叫至2NT了）',
            },
            {
              call: '2NT',
              meaning: '♥ fit的slam try，詢問控制',
            },
            {
              call: '3C',
              meaning: '♣ fit的slam try，詢問控制',
            },
            {
              call: '3D',
              meaning: '55 邀請，不迫叫',
            },
            {
              call: '3H',
              meaning: '邀請4♥',
            },
            {
              call: '3S',
              meaning: '6張♠邀請',
            },
            {
              call: '3NT',
              meaning: '5張♠半束叫（開叫者有3張♠須改回4♠）',
            },
            {
              call: '4C',
              meaning: '♥ fit，splinter',
            },
            {
              call: '4D',
              meaning: '♥ fit，splinter',
            },
            {
              call: '4H',
              meaning: '束叫',
            },
            {
              call: '4S',
              meaning: '束叫',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1C', '', '1S', '', '2C', '', '2D', '', '2H', '', '2S', '', '?'],
          },
          rows: [
            {
              call: '2NT',
              meaning: '低限，沒有3張♠（2425或1435）',
            },
            {
              call: '3C',
              meaning: '6張♣，4張♥，沒有3張♠ ，waiting',
            },
            {
              call: '3D',
              meaning: '♠ fit高限，♦有控（♦單張）',
            },
            {
              call: '3H',
              meaning: '♠ fit高限，♥有控（♦單張）',
            },
            {
              call: '3S',
              meaning: '♠ fit低限（♦單張）',
            },
            {
              call: '3NT',
              meaning: '高限14-15，沒有3張♠（2425或1435）',
            },
          ],
        },
      ],
    },
    {
      id: 'one-diamond',
      title: '1♦ 1♠ 1NT 2♣ 之後',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1D', '', '1S', '', '1NT', '', '2C', '', '?'],
          },
          rows: [
            {
              call: '2D',
              meaning: '5張♦ waiting（2353，沒有4張♥及3張♠）',
            },
            {
              call: '2H',
              meaning: '4張♥，可能有3張♠',
            },
            {
              call: '2S',
              meaning: '3張♠，沒有4張♥',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1D', '', '1S', '', '1NT', '', '2C', '', '2D', '', '?'],
          },
          rows: [
            {
              call: '2H',
              meaning: '55高花，確認♥為王牌，詢問高低限（回3♥為低限，其他為高限控制）',
            },
            {
              call: '2S',
              meaning: '6張♠，確認以♠為王牌，詢問高低限（回3♠為低限，其他為高限控制）',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1D', '', '1S', '', '1NT', '', '2C', '', '2H', '', '?'],
          },
          rows: [
            {
              call: '2S',
              meaning: '5張♠，check ♠張數，迫叫',
            },
            {
              call: '2NT',
              meaning: '確認以♥為王牌，詢問高低限',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1D', '', '1S', '', '1NT', '', '2C', '', '2D', '', '?'],
          },
          rows: [
            {
              call: '2H',
              meaning: '55邀請以上',
            },
          ],
        },
      ],
    },
    {
      id: 'passed-hand',
      title: 'pass-hand 的 NMF',
      originalTitle: '◎ pass-hand的NMF',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: responderFirst,
            calls: ['--', '', '1C', '', '1S', '', '1NT', '', '2D', '', '?'],
          },
          rows: [
            {
              call: '2H',
              meaning: '4張♥，低限無成局點力，沒有3張♠',
            },
            {
              call: '2S',
              meaning: '3張♠，低限無成局點力',
            },
            {
              call: '2NT',
              meaning: '無4張♥及3張♠，低限無成局點力',
            },
            {
              call: '3H',
              meaning: '4張♥，接受邀請，可能有3張♠',
            },
            {
              call: '3S',
              meaning: '3張♠，接受邀請',
            },
            {
              call: '3NT',
              meaning: '14點，無高花，接受邀請',
            },
          ],
        },
      ],
    },
    {
      id: 'passed-hand-fourth-suit',
      title: 'pass-hand 的第四門新花',
      originalTitle: '◎ pass-hand的第四門新花為迫叫一圈之邀請',
      summary: '第四門新花為迫叫一圈之邀請。',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: responderFirst,
            calls: ['--', '', '1D', '', '1H', '', '1S', '', '2C', '', '?'],
          },
          rows: [
            {
              call: '2D',
              meaning: '5張♦低限無成局點力',
            },
            {
              call: '2H',
              meaning: '3張♥低限無成局點力',
            },
            {
              call: '2S',
              meaning: '4243低限無成局點力',
            },
            {
              call: '3H',
              meaning: '3張♥，接受邀請',
            },
            {
              call: '3NT',
              meaning: '接受邀請',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: responderFirst,
            calls: ['--', '', '1D', '', '1H', '', '1S', '', '2C', '', '2D', '', '?'],
          },
          rows: [
            {
              call: '2H',
              meaning: '6張♥邀請，不迫叫',
            },
            {
              call: '2S',
              meaning: '4張♠邀請，不迫叫',
            },
            {
              call: '2NT',
              meaning: '5張♥之邀請',
            },
          ],
        },
      ],
    },
  ],
}
