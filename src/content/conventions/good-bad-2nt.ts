import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 好壞2NT (Good/Bad 2NT, 松濤版)
 * Source: docs/好壞2NT的約定叫品(松濤20160226).doc (the club's Word file), transcribed verbatim; only bids and suit letters
 * were rewritten with suit symbols (3C -> 3♣, "H fit" -> "♥ fit").
 * The source writes out all four seats, so auctions keep every call.
 * Generated from the Word text, then checked against the source section by section.
 */

const openerFirst: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']

export const goodBad2nt: Convention = {
  slug: 'good-bad-2nt',
  nameZh: '好壞2NT（松濤版）',
  nameEn: 'Good/Bad 2NT',
  aliases: ['好壞2NT', 'good bad 2NT', 'good-bad 2NT', 'Lebensohl 2NT'],
  category: 'competitive',
  kind: 'convention',
  level: 'advanced',
  tags: ['好壞2NT', '競叫', '開叫者再叫', '問擋'],
  summary:
    '開叫 1♥／1♦／1♣ 後在 2 線競叫時，開叫者三線直接叫 15-17，叫 2NT 為 11-14 或 18↑；含啟動條件與各開叫的範例。',
  source: {
    title: '好壞2NT的約定叫品(松濤20160226)',
    note: '文件標題：開叫者好壞2NT的約定叫品',
  },
  updated: '2026-10-21',
  sections: [
    {
      id: 'conditions',
      title: '啟動好壞2NT的條件',
      originalTitle: '※ 啟動好壞2NT的條件：(一定要記熟)',
      blocks: [
        {
          kind: 'paragraph',
          text: '1.開叫者開叫1♥、1♦及1♣。',
        },
        {
          kind: 'paragraph',
          text: '2.叫牌空間已超過開叫2線花色且未超過2NT。',
        },
        {
          kind: 'paragraph',
          text: '例如以下CASE並不是好壞2NT',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '1♣   P   1♥   1♠',
            },
            {
              text: '2NT',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '3.答叫者假如有叫牌時，其叫品為1線(含1NT)或是X。(所以FIT後就不是)，',
        },
        {
          kind: 'paragraph',
          text: '例如以下CASE並不是好壞2NT',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '1♦   1♠   2♣   2♥',
            },
            {
              text: '2NT',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '4.前一家叫花色者為敵方(X不算)。',
        },
        {
          kind: 'paragraph',
          text: '5.開叫牌組6張↑，或是55兩門，或是FIT答叫者花色。',
        },
      ],
    },
    {
      id: 'opener-rules',
      title: '開叫者的叫牌原則',
      originalTitle: '啟動好壞2NT後，開叫者的叫牌原則：',
      blocks: [
        {
          kind: 'paragraph',
          text: '1.三線直接叫牌為15-17。',
        },
        {
          kind: 'paragraph',
          text: '2.叫2NT為11-14或是18↑，非強即弱',
        },
      ],
    },
    {
      id: 'responder-rules',
      title: '2NT 後答叫者的叫牌原則',
      originalTitle: '2NT後答叫者的叫牌原則：',
      blocks: [
        {
          kind: 'paragraph',
          text: '1.回答開叫者開叫花色3線以下(含)大部份是低限(開叫1♥少部份不是，低花都是低限)',
        },
        {
          kind: 'paragraph',
          text: '2.越過開叫者3線開叫花色是INVITE↑。',
        },
        {
          kind: 'paragraph',
          text: '3.答叫者叫回3線自己的王牌為低限',
        },
        {
          kind: 'paragraph',
          text: '4.低限♣有牌組回答3♣，低限且同伴花色有3張以上則叫回同伴花色',
        },
      ],
    },
    {
      id: 'one-heart',
      title: '開叫1♥',
      blocks: [
        {
          kind: 'paragraph',
          text: '範例：(沒有全部叫品，其他自己照邏輯推)',
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1H', '1S', 'X', '2S', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '15-17，平均牌有力量，♠通常有擋',
            },
            {
              call: '2NT',
              meaning: '好壞2NT',
            },
            {
              call: '3C',
              meaning: '5張♥↑，4張♣↑，15-17',
            },
            {
              call: '3D',
              meaning: '5張♥↑，4張♣↑，15-17',
              pending: '與 3♣ 同寫「4張♣↑」，疑應為「4張♦↑」（1♥ 2♠ P P 之後的 3♦ 寫 4張♦↑）。',
            },
            {
              call: '3H',
              meaning: '6張♥↑，15-17',
            },
            {
              call: '3S',
              meaning: '♠問擋',
            },
            {
              call: '3NT',
              meaning: 'to play',
            },
            {
              call: '4H',
              meaning: 'to play',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1H', '1S', 'X', '2S', '2NT', 'P', '?'],
          },
          rows: [
            {
              call: '3C',
              meaning: '4張♣低限waiting',
            },
            {
              call: '3D',
              meaning: '4張♦，沒有4張♣ waiting',
            },
            {
              call: '3H',
              meaning: '♥ fit GF(不可能♥ fit低限第一圈選擇x，原本邀請的牌在2nt後也可以GF)',
            },
            {
              call: '3S',
              meaning: '問擋 GF',
            },
            {
              call: '4C',
              meaning: '4張♦，5張♣↑，INVITE，有2張♥',
            },
            {
              call: '4D',
              meaning: '5張♦↑，4張♣，INVITE，有2張♥',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1H', '1S', 'X', '2S', '2NT', 'P', '3C', 'P', '?'],
          },
          rows: [
            {
              call: '3D',
              meaning: '5張♥，4張♦，12-14',
            },
            {
              call: '3H',
              meaning: '6張♥↑，11-14',
            },
            {
              call: '3S',
              meaning: '問♠擋',
            },
            {
              call: '3NT',
              meaning: 'to play',
            },
            {
              call: '4H',
              meaning: 'to play，18-20',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1H', '2S', 'P', 'P', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: 'T/O',
            },
            {
              call: '2NT',
              meaning: '好壞2NT',
            },
            {
              call: '3C',
              meaning: '5張♥↑，4張♣↑，15-17',
            },
            {
              call: '3D',
              meaning: '5張♥↑，4張♦↑，15-17',
            },
            {
              call: '3H',
              meaning: '6張♥↑，15-17',
            },
            {
              call: '3S',
              meaning: '♠問擋',
            },
            {
              call: '3NT',
              meaning: 'to play',
            },
            {
              call: '4H',
              meaning: 'to play',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1H', '2S', 'P', 'P', '2NT', 'P', '?'],
          },
          rows: [
            {
              call: '3C',
              meaning: '低限3張♣↑，waiting(♥ 2張↓)',
            },
            {
              call: '3D',
              meaning: '低限3張♦↑，waiting(♥ 2張↓)',
            },
            {
              call: '3H',
              meaning: '低限3張♥↑',
            },
            {
              call: '3S',
              meaning: '問擋 GF',
            },
            {
              call: '3NT',
              meaning: 'to play(原本可能要等待罰放的牌)',
            },
          ],
        },
      ],
    },
    {
      id: 'one-diamond',
      title: '開叫1♦',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1D', '1S', 'X', '2S', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: 'T/O，3張♥，2張♠↓，15↑，5張♦↑',
            },
            {
              call: '2NT',
              meaning: '好壞2NT',
            },
            {
              call: '3C',
              meaning: '5張♦↑，4張♣↑，15-17',
            },
            {
              call: '3D',
              meaning: '6張♦↑，15-17',
            },
            {
              call: '3H',
              meaning: '4張♦↑，4張♥，15-16',
            },
            {
              call: '3S',
              meaning: '♠問擋',
            },
            {
              call: '3NT',
              meaning: 'to play',
            },
            {
              call: '4D',
              meaning: 'invite 5♦',
            },
            {
              call: '4H',
              meaning: 'to play',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1D', '1S', 'X', '2S', '2NT', 'P', '?'],
          },
          rows: [
            {
              call: '3C',
              meaning: '4張♣↑，低限waiting',
            },
            {
              call: '3D',
              meaning: '沒有4張♣，2張♦↑，waiting',
            },
            {
              call: '3H',
              meaning: '6-9點，6張♥↑',
            },
            {
              call: '3S',
              meaning: '問擋 GF',
            },
            {
              call: '4C',
              meaning: '4張♥，5張♣↑，INVITE，有2張♦',
            },
            {
              call: '4D',
              meaning: '3張♦↑，邀請5♦',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1D', '1S', 'X', '2S', '2NT', 'P', '3C', 'P', '?'],
          },
          rows: [
            {
              call: '3D',
              meaning: '11-14↑，6張♦↑',
            },
            {
              call: '3H',
              meaning: '12-14，4張♥',
            },
            {
              call: '3S',
              meaning: '迫叫，通常是4張♥，短♠，17↑',
            },
            {
              call: '3NT',
              meaning: 'to play',
            },
            {
              call: '4H',
              meaning: '18↑，4張♥',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1D', '2H', 'P', 'P', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: 'T/O',
            },
            {
              call: '2S',
              meaning: '4張♠，15↑，不適合T/O的牌',
            },
            {
              call: '2NT',
              meaning: '好壞2NT',
            },
            {
              call: '3C',
              meaning: '5張♦↑，4張♣↑，15-17',
            },
            {
              call: '3D',
              meaning: '6張♦↑，15-17',
            },
            {
              call: '3H',
              meaning: '6張♥↑，15-17',
            },
            {
              call: '3S',
              meaning: '♠問擋',
            },
            {
              call: '3NT',
              meaning: 'to play',
            },
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'P.S.18-19平均牌選擇X或是3NT',
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1D', '2H', 'P', 'P', '2NT', 'P', '?'],
          },
          rows: [
            {
              call: '3C',
              meaning: '低限3張♣↑，waiting(♦ 2張↓)',
            },
            {
              call: '3D',
              meaning: '低限2張♦↑，waiting',
            },
          ],
        },
      ],
    },
    {
      id: 'one-club',
      title: '開叫1♣',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1C', '1S', 'X', '2S', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: 'T/O，3張♥，2張♠↓，15↑，5張♣↑',
            },
            {
              call: '2NT',
              meaning: '好壞2NT',
            },
            {
              call: '3C',
              meaning: '6張♣↑，15-17',
            },
            {
              call: '3D',
              meaning: '5張♣↑，4張♦↑，15-17',
            },
            {
              call: '3H',
              meaning: '4張♦↑，4張♥，15-17',
              pending: '開叫 1♣，此處寫「4張♦↑」，與 1♦ 開叫時相同，待確認。',
            },
            {
              call: '3S',
              meaning: '♠問擋',
            },
            {
              call: '3NT',
              meaning: 'to play',
            },
            {
              call: '4D',
              meaning: 'invite 5♦',
              pending: '開叫 1♣，此處寫「invite 5♦」，與 1♦ 開叫時相同，待確認。',
            },
            {
              call: '4H',
              meaning: 'to play',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1C', '1S', 'X', '2S', '2NT', 'P', '?'],
          },
          rows: [
            {
              call: '3C',
              meaning: 'waiting',
            },
            {
              call: '3D',
              meaning: '6-9點，6張♦↑',
            },
            {
              call: '3H',
              meaning: '6-9點，6張♥↑',
            },
            {
              call: '3S',
              meaning: '問擋 GF',
            },
            {
              call: '3NT',
              meaning: 'to play',
            },
            {
              call: '4C',
              meaning: '3張♣↑，INVITE',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1C', '1S', 'X', '2S', '2NT', 'P', '3C', '?'],
          },
          rows: [
            {
              call: 'pass',
              meaning: '11-14↑，6張♣↑',
            },
            {
              call: '3D',
              meaning: '5張♣↑，4張♦↑，18↑(X不一定有♦，所以一定要高限)',
            },
            {
              call: '3H',
              meaning: '12-14，4張♥',
            },
            {
              call: '3S',
              meaning: '迫叫，通常是4張♥，短♠，17↑',
            },
            {
              call: '3NT',
              meaning: 'to play',
            },
            {
              call: '4C',
              meaning: '18↑，6張♣↑，♠通常沒擋',
            },
            {
              call: '4H',
              meaning: '18↑，4張♥，通常平均牌',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1C', '2S', 'P', 'P', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: 'T/O',
            },
            {
              call: '2NT',
              meaning: '好壞2NT',
            },
            {
              call: '3C',
              meaning: '6張♣↑，15-17',
            },
            {
              call: '3D',
              meaning: '5張♣↑，5張♦↑，15-17',
            },
            {
              call: '3H',
              meaning: '6張♣↑，4張♥，15-17',
            },
            {
              call: '3S',
              meaning: '♠問擋',
            },
            {
              call: '3NT',
              meaning: 'to play',
            },
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'P.S.18-19平均牌選擇X或是3NT',
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['1C', '2S', 'P', 'P', '2NT', 'P', '?'],
          },
          rows: [
            {
              call: '3C',
              meaning: 'relay',
            },
            {
              call: '3D',
              meaning: '6張♦↑，1張♣↓，6-9',
            },
            {
              call: '3H',
              meaning: '6張♥↑，1張♣↓，6↓',
            },
          ],
        },
      ],
    },
  ],
}
