import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 2D 開叫 (2♦ opening: weak two in a major, 20-21 balanced, or 22+ with a long minor)
 * Source: docs/2D open(ppq20131029).doc (the club's Word file), transcribed verbatim; only bids and suit letters
 * were rewritten with suit symbols (3C -> 3♣, "H fit" -> "♥ fit").
 * Replaces the shorter 2D開叫(一高弱二) version; the 2NT ask answers are the same.
 * Generated from the Word text, then checked against the source section by section.
 */

const openerFirst: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']

export const twoDiamondOpening: Convention = {
  slug: 'two-diamond-opening',
  nameZh: '2D 開叫',
  nameEn: '2♦ Opening',
  aliases: ['2D', '2D開叫', '2D open', '一高弱二', '弱二', 'multi', 'P/C'],
  category: 'suit-openings',
  kind: 'system',
  level: 'intermediate',
  cardSlots: [
    'wbf.openings.2D.description <- hands',
    'wbf.openings.2D.responses <- responses#0',
    'wbf.openings.2D.subsequent <- after-2h',
    'wbf.openings.2D.subsequent <- after-2s',
    'wbf.openings.2D.subsequent <- after-2nt',
    'ctcba-simple.other.more <- hands',
  ],
  tags: ['2♦ 開叫', '弱二', '20-21 平均牌', '22↑ 低花', 'P/C', '2NT 詢問'],
  summary:
    '2♦ 開叫包括弱二♥、弱二♠、20-21 平均牌、22↑帶 5 張低花：答叫者 P/C 與 2NT 詢問，以及 2♦ 2♥ 之後的完整後續。',
  source: {
    title: '2D open(ppq20131029)',
    note: '取代較早的「2D開叫(一高弱二)」',
  },
  updated: '2026-10-21',
  sections: [
    {
      id: 'hands',
      title: '2♦ 開叫的四種牌',
      originalTitle: '2D開叫包括下面4個case：',
      summary: '弱二♥、弱二♠、20-21 平均牌、22↑帶 5 張↑低花。',
      blocks: [
        {
          kind: 'paragraph',
          text: '1.weak 2♥',
        },
        {
          kind: 'paragraph',
          text: '2.weak 2♠',
        },
        {
          kind: 'paragraph',
          text: '3.20-21平均牌',
        },
        {
          kind: 'paragraph',
          text: '4.22↑，5張↑低花帶一門4張牌組(高低花都有可能)，5431或是64以上(55以上開2♣)',
        },
      ],
    },
    {
      id: 'responses',
      title: '答叫：2♦ ?',
      summary: 'P/C、2NT 詢問、三線 6 張↑ F 一圈。',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2D', '', '?'],
          },
          rows: [
            {
              call: '2H',
              meaning: 'P/C，可能是♥ suit的強牌',
            },
            {
              call: '2S',
              meaning: 'P/C',
            },
            {
              call: '2NT',
              meaning: '詢問，至少有邀請weak 2的力量',
            },
            {
              call: '3C',
              meaning: '6張↑♣，F一圈',
            },
            {
              call: '3D',
              meaning: '6張↑♦，F一圈',
            },
            {
              call: '3H',
              meaning: '6張↑♥，F一圈',
            },
            {
              call: '3S',
              meaning: '6張↑♠，F一圈',
            },
          ],
        },
      ],
    },
    {
      id: 'after-2h',
      title: '2♦ 2♥ 之後',
      summary: '開叫者表示弱二♠、20-21 平均牌，或 22↑帶 5 張低花。',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2D', '', '2H', '', '?'],
          },
          rows: [
            {
              call: '2S',
              meaning: 'weak 2♠',
            },
            {
              call: '2NT',
              meaning: '20-21 bal，後續叫品詳原2NT open',
            },
            {
              call: '3C',
              meaning: '22↑，5張↑♣帶一門4張牌組',
            },
            {
              call: '3D',
              meaning: '22↑，5張↑♦帶一門4張牌組',
            },
          ],
        },
      ],
      children: [
        {
          id: 'weak-2s',
          title: '弱二♠：2♦ 2♥ 2♠ ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '2S', '', '?'],
              },
              rows: [
                {
                  call: '3S',
                  meaning: 'invite',
                },
                {
                  call: '4S',
                  meaning: 'to play',
                },
              ],
            },
          ],
        },
        {
          id: 'clubs',
          title: '22↑ 帶 5 張♣：2♦ 2♥ 3♣',
          summary: '3♦ 詢問 4 張、3♥／3♠ 5 張高花，以及之後的 fit 與滿貫叫品。',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3C', '', '?'],
              },
              rows: [
                {
                  call: '3D',
                  meaning: '詢問4張，♦不保證',
                },
                {
                  call: '3H',
                  meaning: '5張♥↑，♣可能fit',
                },
                {
                  call: '3S',
                  meaning: '5張♠↑，沒有4張♥，♣可能fit',
                },
                {
                  call: '3NT',
                  meaning: '3343，沒滿貫興趣',
                },
                {
                  call: '4C',
                  meaning: '♣ fit，無其他牌組',
                },
                {
                  call: '4D',
                  meaning: '♣ fit，短♦，之後4♥為RKCB',
                },
                {
                  call: '4H',
                  meaning: '♣ fit，短♥，之後4♠為RKCB',
                },
                {
                  call: '4S',
                  meaning: '♣ fit，短♠，之後4NT為RKCB',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3C', '', '3D', '', '?'],
              },
              rows: [
                {
                  call: '3H',
                  meaning: '4張♥',
                },
                {
                  call: '3S',
                  meaning: '4張♠',
                },
                {
                  call: '3NT',
                  meaning: '4張♣',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3C', '', '3H', '', '?'],
              },
              rows: [
                {
                  call: '3S',
                  meaning: '4張♠，♥不fit',
                },
                {
                  call: '3NT',
                  meaning: '♥不fit，3145 or 2146牌型',
                },
                {
                  call: '4C',
                  meaning: '6張↑♣，4♦',
                },
                {
                  call: '4D',
                  meaning: '♦短，♥ fit',
                },
                {
                  call: '4H',
                  meaning: '♥ fit，低限，可能是2張♥的6421',
                },
                {
                  call: '4S',
                  meaning: '♥ RKCB(captain是開叫者)',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3C', '', '3H', '', '3S', '', '?'],
              },
              rows: [
                {
                  call: '3NT',
                  meaning: 'to play',
                },
                {
                  call: '4C',
                  meaning: '♣ fit，好牌',
                },
                {
                  call: '4D',
                  meaning: '♠ fit好牌',
                },
                {
                  call: '4H',
                  meaning: 'to play',
                },
                {
                  call: '4S',
                  meaning: '♠ fit爛牌',
                },
                {
                  call: '4NT',
                  meaning: 'invite 6NT',
                },
                {
                  call: '5C',
                  meaning: '♣ fit，爛牌',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3C', '', '3H', '', '3NT', '', '?'],
              },
              rows: [
                {
                  call: '4C',
                  meaning: '♣ fit，好牌',
                },
                {
                  call: '4D',
                  meaning: '♦ fit，好牌',
                },
                {
                  call: '4H',
                  meaning: 'to play',
                },
                {
                  call: '4S',
                  meaning: '♦ fit，短♠',
                },
                {
                  call: '4NT',
                  meaning: 'invite 6NT',
                },
                {
                  call: '5C',
                  meaning: '♣ fit，爛牌',
                },
                {
                  call: '5D',
                  meaning: '♦ fit，爛牌',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3C', '', '3H', '', '4C', '', '?'],
              },
              rows: [
                {
                  call: '4D',
                  meaning: '♦ fit，好牌',
                },
                {
                  call: '4H',
                  meaning: 'to play',
                },
                {
                  call: '4S',
                  meaning: '♣ fit，好牌',
                },
                {
                  call: '4NT',
                  meaning: 'invite 6NT',
                },
                {
                  call: '5C',
                  meaning: '♣ fit，爛牌',
                },
                {
                  call: '5D',
                  meaning: '♦ fit，爛牌',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3C', '', '3S', '', '?'],
              },
              rows: [
                {
                  call: '3NT',
                  meaning: '♠不fit',
                },
                {
                  call: '4C',
                  meaning: '6張↑♣',
                },
                {
                  call: '4D',
                  meaning: '♠ fit，♦短',
                },
                {
                  call: '4H',
                  meaning: '♠ fit，♥短',
                },
                {
                  call: '4S',
                  meaning: '♠ fit，低限，可能有單張大牌的爛牌或是2張♠的6421',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3C', '', '3S', '', '3NT', '', '?'],
              },
              rows: [
                {
                  call: '4C',
                  meaning: '♣ fit，好牌',
                },
                {
                  call: '4S',
                  meaning: 'to play',
                },
                {
                  call: '4NT',
                  meaning: 'invite 6NT',
                },
                {
                  call: '5C',
                  meaning: '♣ fit，爛牌',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3C', '', '3S', '', '4C', '', '?'],
              },
              rows: [
                {
                  call: '4D',
                  meaning: '♣ fit，好牌',
                },
                {
                  call: '4S',
                  meaning: 'to play',
                },
                {
                  call: '4NT',
                  meaning: 'invite 6NT',
                },
                {
                  call: '5C',
                  meaning: '♣ fit，爛牌',
                },
              ],
            },
          ],
        },
        {
          id: 'diamonds',
          title: '22↑ 帶 5 張♦：2♦ 2♥ 3♦',
          summary: '3♥／3♠ 4 張↑高花，以及之後的 fit 與滿貫叫品。',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3D', '', '?'],
              },
              rows: [
                {
                  call: '3H',
                  meaning: '4張♥↑，♦可能fit',
                },
                {
                  call: '3S',
                  meaning: '4張♠↑，沒有4張♥，♦可能fit',
                },
                {
                  call: '3NT',
                  meaning: '沒有高花，♦ fit的話一定是低限',
                },
                {
                  call: '4C',
                  meaning: '6張♣↑，不適合打NT的牌',
                },
                {
                  call: '4D',
                  meaning: '♦ fit，好牌waiting，沒短',
                },
                {
                  call: '4H',
                  meaning: '♦ fit，短♥，之後4♠為RKCB',
                },
                {
                  call: '4S',
                  meaning: '♦ fit，短♠，之後4NT為RKCB',
                },
                {
                  call: '4NT',
                  meaning: '沒有4張高花，邀請6NT',
                },
                {
                  call: '5D',
                  meaning: '♦ fit爛牌',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3D', '', '3H', '', '?'],
              },
              rows: [
                {
                  call: '3S',
                  meaning: '4張♠，♥不fit',
                },
                {
                  call: '3NT',
                  meaning: '3154 or 2164 ♠好擋',
                },
                {
                  call: '4C',
                  meaning: '6張↑♦，4張♣',
                },
                {
                  call: '4D',
                  meaning: '3~4張♥ fit，好牌(6張♦+4張♣要叫4♣)',
                },
                {
                  call: '4H',
                  meaning: '♥ fit，低限，可能是3張♥或是4張♥有單張大牌',
                },
                {
                  call: '4S',
                  meaning: '♥ RKCB(captain是開叫者)',
                },
                {
                  call: '4NT',
                  meaning: '♥ fit，♠ EKB',
                },
                {
                  call: '5C',
                  meaning: '♥ fit，♣ EKB',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3D', '', '3S', '', '?'],
              },
              rows: [
                {
                  call: '3NT',
                  meaning: '♠不fit',
                },
                {
                  call: '4C',
                  meaning: '6張↑♦，4張♣',
                },
                {
                  call: '4D',
                  meaning: '6張↑♦，4張♥',
                },
                {
                  call: '4H',
                  meaning: '♠ fit，好牌',
                },
                {
                  call: '4S',
                  meaning: '3-4張♠，低限，可能有單張大牌的爛牌或是3張♠的5431',
                },
                {
                  call: '4NT',
                  meaning: '♠ RKCB',
                },
                {
                  call: '5C',
                  meaning: '♠ fit，♣ EKB',
                },
                {
                  call: '5D',
                  meaning: '♠ fit，♥ EKB',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3D', '', '3S', '', '3NT', '', '?'],
              },
              rows: [
                {
                  call: '4C',
                  meaning: '4張♣↑，check',
                },
                {
                  call: '4D',
                  meaning: '♦ fit，好牌(沒短)',
                },
                {
                  call: '4S',
                  meaning: 'to play',
                },
                {
                  call: '4NT',
                  meaning: 'invite 6NT',
                },
                {
                  call: '5D',
                  meaning: '♦ fit，爛牌',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3D', '', '3S', '', '3NT', '', '4C', '', '?'],
              },
              rows: [
                {
                  call: '4D',
                  meaning: '♣ fit，RKCB(2♦的人是captain)',
                },
                {
                  call: '4NT',
                  meaning: '1453',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3D', '', '3S', '', '4C', '', '?'],
              },
              rows: [
                {
                  call: '4D',
                  meaning: '♦ fit，好牌(沒短)',
                },
                {
                  call: '4H',
                  meaning: '♣ fit，好牌',
                },
                {
                  call: '4S',
                  meaning: 'to play',
                },
                {
                  call: '4NT',
                  meaning: 'invite 6NT',
                  pending:
                    '4NT（1453）是開叫者在 4♣ 之後的另一個叫品，還是對 4♦ RKCB 的回答，待確認。',
                },
                {
                  call: '5C',
                  meaning: '♣ fit，爛牌',
                },
                {
                  call: '5D',
                  meaning: '♦ fit，爛牌',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2D', '', '2H', '', '3D', '', '3S', '', '4D', '', '?'],
              },
              rows: [
                {
                  call: '4H',
                  meaning: '♦ fit，好牌(沒短)，♥牌組的話會先叫3♥',
                },
                {
                  call: '4S',
                  meaning: 'to play',
                },
                {
                  call: '4NT',
                  meaning: 'invite 6NT',
                },
                {
                  call: '5D',
                  meaning: '♦ fit，爛牌',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'after-2s',
      title: '2♦ 2♠ 之後',
      summary: '答叫者 P/C 叫 2♠ 後開叫者的再叫。',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2D', '', '2S', '', '?'],
          },
          rows: [
            {
              call: '2NT',
              meaning: '20-21 bal，後續叫品詳原2NT open',
            },
            {
              call: '3C',
              meaning: '22↑，5張↑♣帶一門4張牌組(後續同2♥之後)',
            },
            {
              call: '3D',
              meaning: '22↑，5張↑♦帶一門4張牌組(後續同2♥之後)',
            },
            {
              call: '3H',
              meaning: 'weak 2♥',
            },
          ],
        },
      ],
    },
    {
      id: 'after-2nt',
      title: '2NT 詢問：2♦ 2NT ?',
      summary: '報出高花與高低限，或 3NT 20-21。',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2D', '', '2NT', '', '?'],
          },
          rows: [
            {
              call: '3C',
              meaning: 'weak ♥低限',
            },
            {
              call: '3D',
              meaning: 'weak ♠ 低限',
            },
            {
              call: '3H',
              meaning: 'weak ♠ 高限',
            },
            {
              call: '3S',
              meaning: 'weak ♥高限',
            },
            {
              call: '3NT',
              meaning: '20-21',
            },
          ],
        },
      ],
    },
  ],
}
