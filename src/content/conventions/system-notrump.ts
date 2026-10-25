import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 開叫1NT/2NT（自然制講義） — from the club's old handbook 淡江大學-我們的制度(修訂版) (2010, 13-point
 * openings). Transcribed verbatim from docs/淡江大學-我們的制度(修訂版).doc; bids and suit letters use
 * suit symbols. Notes marked 現行制度 apply the current system (12-point openings, 1NT 15-17,
 * 2NT 20-21, 2♣ 22+, 1NT forcing, 2/1 game forcing); notes marked 以特約為準 point to the
 * convention that overrides the handbook. Generated from a hand-cleaned transcription.
 */

const seats0: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']
const seats1: Auction['seats'] = ['同伴', '敵方', '你', '敵方']
const seats2: Auction['seats'] = ['敵方', '我', '敵方', '同伴']

export const systemNotrump: Convention = {
  slug: 'system-notrump',
  nameZh: '開叫1NT/2NT（自然制講義）',
  nameEn: '1NT/2NT Openings (Natural System)',
  aliases: [
    '開叫1NT',
    '開叫2NT',
    'Stayman',
    'Jacoby transfer',
    'Texas',
    'Gerber',
    '哥柏',
    'CAPP',
    '賴本索',
  ],
  category: 'system',
  kind: 'system',
  level: 'basic',
  cardSlots: [
    'wbf.defence.vs-nt <- capp',
    'ctcba-simple.vs-nt.table.double.strong <- capp#0:0',
    'ctcba-simple.vs-nt.table.2C.strong <- capp#0:1',
    'ctcba-simple.vs-nt.table.2D.strong <- capp#0:2',
    'ctcba-simple.vs-nt.table.2H.strong <- capp#0:3',
    'ctcba-simple.vs-nt.table.2S.strong <- capp#0:4',
  ],
  tags: ['舊講義', '1NT 開叫', '2NT 開叫', 'Stayman', '轉換', 'Gerber', 'CAPP'],
  summary:
    '第五章：開叫 1NT、2NT 的答叫、Stayman、轉換叫、Gerber、1NT 遭蓋叫的賴本索，以及對抗敵方 1NT 的 CAPP。答叫以「1NT的答叫」「開叫2NT及答叫」「雷本索特約」為準。',
  source: {
    title: '淡江大學-我們的制度(修訂版)',
    note: '第五章 開叫1NT/2NT',
  },
  updated: '2026-10-22',
  sections: [
    {
      id: 'one-notrump',
      title: '答叫：1NT ?',
      originalTitle: '第 五 章 開叫1NT 16-18點 平均牌型',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**現行制度**：開叫 1NT 為 15-17 點（本章標題寫 16-18 點，本講義開叫總表寫 15-17 點）。',
        },
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：1NT 開叫後的答叫以「1NT的答叫」特約為準。',
        },
        {
          kind: 'paragraph',
          text: '開叫1NT為16-18點平均牌型，如4-3-3-3，4-4-3-2及5-3-3-2，。',
        },
        {
          kind: 'hand',
          label: 'EX) 皆可開叫1NT',
          hand: {
            spades: 'AQ5',
            hearts: '97542',
            diamonds: 'AK',
            clubs: 'KJ7',
          },
        },
        {
          kind: 'hand',
          label: '皆可開叫1NT',
          hand: {
            spades: 'Ax',
            hearts: 'Kx',
            diamonds: 'AKQxxx',
            clubs: 'xxx',
          },
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '?'],
          },
          rows: [
            {
              call: '2C',
              meaning: 'Stayman，8點以上，詢問高花，迫叫成局。',
            },
            {
              call: '2D',
              meaning:
                'Jacoby transfer to 2♥，5張↑♥（可強可弱）。（有例外！答叫者若再叫3線新花為迫叫，且至少4張以上）',
            },
            {
              call: '2H',
              meaning: 'Jacoby transfer 2♠，5張↑♠（可強可弱）。例外同2♦。',
            },
            {
              call: '2S',
              meaning:
                '4-6點 5-5兩低or一門六張 後續開叫者答2NT表示方塊比梅花好 答3♣ 表示梅花比方塊好 or 一樣好(差)',
            },
            {
              call: '2NT',
              meaning: '邀請3NT 8-9個點 無4張高花',
            },
            {
              call: '3C',
              meaning: '梅花牌組6張以上，5-7點。如點力低牌組要好',
            },
            {
              call: '3D',
              meaning: '方塊牌組6張以上，5-7點。如點力低牌組要好',
            },
            {
              call: '3NT',
              meaning: '束叫，好的9點到爛的14點。',
            },
            {
              call: '4C',
              meaning: 'Gerber問A。後續為04 1 2 3',
            },
            {
              call: '4D',
              meaning: 'Texas transfer 4♥，6張↑♥，力量不一定usually 8+',
            },
            {
              call: '4H',
              meaning: 'Texas transfer 4♠，6張↑♠，力量不一定 usually 8+',
            },
            {
              call: '4NT',
              meaning: '邀請6NT，15-16點，且無4張↑高花，接受邀請則由最低階的4張↑低花叫起。',
            },
            {
              call: '5NT',
              meaning: '邀請7NT，19-20點，無4張↑高花，接受邀請則同4NT；不接受邀請則叫6NT。',
            },
            {
              call: '6NT',
              meaning: '束叫，17-18點。',
            },
            {
              call: '7NT',
              meaning: '21-24點。',
            },
          ],
        },
      ],
    },
    {
      id: 'two-notrump',
      title: '答叫：2NT ?',
      originalTitle: '開 叫 2NT 21-22點 平均牌型',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**現行制度**：開叫 2NT 為 20-21 點（本節標題寫 21-22 點，內文寫 20-21 點）。',
        },
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：2NT 開叫後的答叫以「開叫2NT及答叫」特約為準（Puppet Stayman 等）。',
        },
        {
          kind: 'paragraph',
          text: '開叫2NT為20-21點平均牌型，如4-3-3-3，4-4-3-2及5-3-3-2，如為5張牌組，應為5張低花。不可拿5張高花20-21點開叫2NT。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['2NT', '', '?'],
          },
          rows: [
            {
              call: '3C',
              meaning: 'Stayman，5點以上，詢問高花，迫叫成局。',
            },
            {
              call: '3D',
              meaning: 'Jacoby transfer to 3♥，5張↑♥（可強可弱）。',
            },
            {
              call: '3H',
              meaning: 'Jacoby transfer to 3♠，5張↑♠（可強可弱）。',
            },
            {
              call: '3S',
              meaning:
                '詢問，可能為（１）兩門低花5-5↑。（２）一門低花6張↑。開叫者♣較長叫4♣，♦較長叫4♦答叫者再叫4♦或5♣/♦為束叫。',
            },
            {
              call: '3NT',
              meaning: '束叫，4-10點。',
            },
            {
              call: '4C',
              meaning: 'Gerber問A。',
            },
            {
              call: '4D/H',
              meaning: 'Texas transfer to 4♥/♠，6張↑牌組，5點↑。',
            },
            {
              call: '4NT',
              meaning: '邀請6NT，11-12點。',
            },
            {
              call: '5NT',
              meaning: '邀請7NT，15點；不接受邀請則叫6NT。',
            },
            {
              call: '6NT',
              meaning: '束叫，13-14點。',
            },
            {
              call: '7NT',
              meaning: '16-19點。',
            },
          ],
        },
      ],
    },
    {
      id: 'gerber',
      title: 'Gerber哥柏問A',
      originalTitle: 'Gerber哥柏問A',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: [
              '1NT',
              '',
              {
                call: '4C',
                note: '問A',
              },
              '',
              '?',
            ],
          },
          rows: [
            {
              call: '4D',
              meaning: '0或4個A',
            },
            {
              call: '4H',
              meaning: '1個A',
            },
            {
              call: '4S',
              meaning: '2個A',
            },
            {
              call: '4NT',
              meaning: '3個A',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '開叫者 1NT(2NT)，問 4♣*。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: [
              '1NT/2NT',
              '',
              {
                call: '4C',
                note: 'Gerber',
              },
              '',
              {
                call: '',
                note: '4X（回答）',
              },
              '',
              '?',
            ],
          },
          rows: [
            {
              call: '4NT',
              meaning: '問K',
            },
            {
              call: '5C/D',
              meaning: '束叫',
            },
          ],
        },
      ],
    },
    {
      id: 'stayman',
      title: 'Stayman特約',
      originalTitle: 'Stayman特約',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：以「1NT的答叫」特約為準。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '2C', '', '?'],
          },
          rows: [
            {
              call: '2D',
              meaning: '無4張高花',
            },
            {
              call: '2H/S',
              meaning: '4張♥/♠（4-4先叫♥）',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: [
              '1NT',
              '',
              '2C',
              '',
              {
                call: '',
                note: '2X',
              },
              '',
              '?',
            ],
          },
          rows: [
            {
              call: '2NT',
              meaning: '8-9點，邀請3NT。',
            },
            {
              call: '3NT',
              meaning: '9-14點，束叫。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '2C', '', '2D', '', '?'],
          },
          rows: [
            {
              call: '4NT',
              meaning: '15-16點，邀請6NT。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '2C', '', '2H/S', '', '?'],
          },
          rows: [
            {
              call: '4NT',
              meaning: '15-16點，邀請6NT',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '2C', '', '2D', '', '?'],
          },
          rows: [
            {
              call: '3C/D',
              meaning: '否定stayman，13點↑ 6+梅花/方塊 對滿貫有興趣',
            },
            {
              call: '2H/S',
              meaning: '兩門高花5-4以上 所叫為5張 8+',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '2C', '', '2H', '', '?'],
          },
          rows: [
            {
              call: '2NT',
              meaning: '8-9點，邀請3NT or 4♥。',
            },
            {
              call: '3C/D',
              meaning: '否定stayman，13點↑ 6+梅花/方塊 對滿貫有興趣',
            },
            {
              call: '3H',
              meaning: '8點↑，6+的紅心 邀請4♥',
            },
            {
              call: '3NT',
              meaning: '9-14點，束叫。',
            },
            {
              call: '3S/4C/D',
              meaning: 'Splinter。',
            },
            {
              call: '4NT',
              meaning: '邀請6NT',
            },
            {
              call: '5NT',
              meaning: '邀請7NT 至少打6NT',
            },
            {
              call: '6NT',
              meaning: 'TO PLAY',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '2C', '', '2S', '', '?'],
          },
          rows: [
            {
              call: '2NT',
              meaning: '8點，邀請3NT。',
            },
            {
              call: '3C/D',
              meaning: '4張♥＋5張↑低花，8點↑，迫叫。',
            },
            {
              call: '3S',
              meaning: '8點↑，請選擇4♠ or 3NT or pass。',
            },
            {
              call: '3NT',
              meaning: '9-14點，束叫。',
            },
            {
              call: '4C/D/H',
              meaning: 'Splinter。',
            },
            {
              call: '4NT',
              meaning: '邀請6NT',
            },
            {
              call: '5NT',
              meaning: '邀請7NT 至少打6NT',
            },
            {
              call: '6NT',
              meaning: 'TO PLAY',
            },
          ],
        },
      ],
    },
    {
      id: 'transfers',
      title: '轉換叫',
      originalTitle: '轉換叫',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：以「1NT的答叫」特約為準；1NT 遭插叫以「雷本索特約」為準。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '?'],
          },
          rows: [
            {
              call: '2D/H',
              meaning: '轉換2♥/♠',
            },
            {
              call: '4D/H',
              meaning: '轉換4♥/♠',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '1NT被插叫 二線叫出不迫叫 三線叫出迫叫成局',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: [
              '1NT',
              {
                call: '',
                note: '2X',
              },
              '?',
            ],
          },
          rows: [
            {
              call: '2D/H/S',
              meaning: '非轉換，6-8點，5張↑牌組，不迫叫。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '3C', '?'],
          },
          rows: [
            {
              call: '4D/H',
              meaning: '仍然轉換成4♥/♠。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '2D', '', '2H', '', '?'],
          },
          rows: [
            {
              call: '2S',
              meaning: '5-4↑高花，8點↑，迫叫。',
            },
            {
              call: '2NT',
              meaning: '8點↑，邀請3NT or 4♥。',
            },
            {
              call: '3C/D',
              meaning: '5張↑♥＋4張↑♣/♦，迫叫成局。有滿貫意味',
            },
            {
              call: '3H',
              meaning: '6張↑♥，邀請，8點。',
            },
            {
              call: '3NT',
              meaning: '5-3-3-2，9-14點。',
            },
            {
              call: '3S/4C/D',
              meaning: 'Splinter，(♥ fit），6張↑♥。同伴叫4NT為R.K.C.B.問A，♥為王牌。',
            },
            {
              call: '4NT',
              meaning: '15-16點，邀請6♥ or 6NT。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '2H', '', '2S', '', '?'],
          },
          rows: [
            {
              call: '2NT',
              meaning: '8點，邀請3NT or 4♥。',
            },
            {
              call: '3C/D/H',
              meaning: '5張↑♠＋4張↑♣/♦/♥，迫叫成局。有滿貫意味',
            },
            {
              call: '3S',
              meaning: '6張↑♠，邀請4♠，8點。',
            },
            {
              call: '3NT',
              meaning: '9-14點 TO PLAY。',
            },
            {
              call: '4C/D/H',
              meaning: 'Splinter，(♠ fit），6張↑♠。同伴叫4NT為R.K.C.B.問A，♠為王牌。',
            },
            {
              call: '4NT',
              meaning: '15-16點，邀請6♠ or 6NT。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '2S', '', '?'],
          },
          rows: [
            {
              call: '2NT',
              meaning: '方塊比梅花好',
            },
            {
              call: '3C',
              meaning: '梅花比方塊好 或一樣好(差)',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '2S', '', '2NT', '', '?'],
          },
          rows: [
            {
              call: '3C',
              meaning: '6張↑♣牌組，3-7點，束叫。',
            },
            {
              call: '3D',
              meaning: '6張↑♦牌組，3-7點，束叫。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '2S', '', '3C', '', '?'],
          },
          rows: [
            {
              call: 'PASS',
              meaning: 'TO PLAY',
            },
            {
              call: '3D',
              meaning: '6張↑♦牌組，3-7點，束叫。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '4D/H', '', '4H/S', '', '?'],
          },
          rows: [
            {
              call: '4NT',
              meaning: '(邀請6♥ or 6NT)',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '2D/H', '', '2H/S', '', '?'],
          },
          rows: [
            {
              call: '4H/S',
              meaning: '有滿貫企圖，好的6張牌組',
            },
            {
              call: 'Pass',
              meaning: '16點。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: 'CUE-BID：17-18點。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '2D', '', '2H', '', '3C', '', '?'],
          },
          rows: [
            {
              call: '3H',
              meaning: '同意紅心為王牌，可能好牌也可能低限。',
            },
            {
              call: '3NT',
              meaning: '紅心跟梅花都沒什麼配合。',
            },
            {
              call: '4C',
              meaning: '同意梅花為王牌，可能好牌也可能低限。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '---', '2D', 'X', '?'],
          },
          rows: [
            {
              call: 'XX',
              meaning: '方塊牌組，建議打。',
            },
            {
              call: 'PASS',
              meaning: '2張♥',
            },
            {
              call: '2H',
              meaning: '3張♥',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '---', '2D', 'X', '---', '---', '?'],
          },
          rows: [
            {
              call: 'XX',
              meaning: '要求轉換。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '?NT：♦有擋，自然。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: [
              '2NT',
              '',
              {
                call: '3S',
                note: '5-5低花或6張以上低花牌組',
              },
              '',
              '?',
            ],
          },
          rows: [
            {
              call: '3NT',
              meaning: '4-4-3-2兩門高花的平均牌型。',
            },
            {
              call: '4C',
              meaning: '4張↑♣。',
            },
            {
              call: '4D',
              meaning: '4張↑♦。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['2NT', '', '3S', '', '3NT', '', '?'],
          },
          rows: [
            {
              call: '4C',
              meaning: '6張↑♣牌組，不平均牌型，3-4點，不迫叫。',
            },
            {
              call: '4D',
              meaning: '6張↑♦牌組，不平均牌型，3-4點，不迫叫。',
            },
            {
              call: '5C/D',
              meaning: '5-10點，束叫。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['2NT', '', '3S', '', '4C', '', '?'],
          },
          rows: [
            {
              call: '4D',
              meaning: '6張↑♦牌組，不平均牌型，3-4點，♣不fit，不迫叫。',
            },
            {
              call: '5C',
              meaning: '5-10點，束叫。',
            },
            {
              call: '4H/S',
              meaning: 'Cue-bid，♣ fit。',
            },
            {
              call: '4NT',
              meaning: 'R.K.C.B.',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['2NT', '', '3S', '', '4D', '', '?'],
          },
          rows: [
            {
              call: '5C',
              meaning: '5-10點，6張↑♣牌組。',
            },
            {
              call: '5D',
              meaning: '5-10點，束叫。',
            },
            {
              call: '4H/S',
              meaning: 'Cue-bid，♦ fit。',
            },
            {
              call: '4NT',
              meaning: 'R.K.C.B.',
            },
          ],
        },
      ],
    },
    {
      id: 'super-accept',
      title: '拒絕轉換之特殊情形',
      originalTitle: '拒絕轉換之特殊情形 ～ 通常是高限及良好支持',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1NT', '', '2D', '', '?'],
          },
          rows: [
            {
              call: '2H',
              meaning: 'Normal（低限）',
            },
            {
              call: '3H',
              meaning: '4張♥，高限點18點',
            },
          ],
        },
        {
          kind: 'hand',
          label: 'EX) 1NT 2D 3H：2張♦',
          hand: {
            spades: 'KQJX',
            hearts: 'KQXX',
            diamonds: 'XX',
            clubs: 'AKX',
          },
        },
      ],
    },
    {
      id: 'short-clubs',
      title: '當1NT開叫之後：制度確認',
      originalTitle: '當1NT開叫之後 制度確認',
      blocks: [
        {
          kind: 'paragraph',
          text: '同伴開叫1NT後，如果你持短梅花之牌，不管力量多少（甚至低於8點），都需以Stayman詢問，不管同伴回答任何叫品，皆可PASS。',
        },
        {
          kind: 'paragraph',
          text: '此為2♣的特殊撇步 非正規 但是好用',
        },
        {
          kind: 'hand',
          label: 'EX) 同伴 1NT，你 2C，同伴 2X，你 PASS',
          hand: {
            spades: 'T875',
            hearts: '9754',
            diamonds: 'T9832',
            clubs: '-',
          },
        },
      ],
    },
    {
      id: 'lebensohl',
      title: '同伴開叫1NT遭敵人蓋叫：賴本索',
      originalTitle: '同伴開叫1NT遭敵人蓋叫之處置 賴本索特約=LEB',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：以「雷本索特約」為準。',
        },
        {
          kind: 'paragraph',
          text: '口訣為 二線叫出不迫叫 三線叫出迫叫成局',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: [
              '1NT',
              {
                call: '',
                note: '2X',
              },
              '?',
            ],
          },
          rows: [
            {
              call: '2NT',
              meaning: '賴本索（LEBENSOHL）迫開叫人叫3♣',
            },
            {
              call: 'X',
              meaning: '處罰',
            },
            {
              call: '2D/H/S',
              meaning: '不迫叫，5張↑牌組，6-8。',
            },
            {
              call: '3C/D/H',
              meaning: '迫叫成局，5張↑牌組，9點↑',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '巧叫(Cue-Bid)：持四張未叫的高花，通常敵叫組有半擋張以上。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: [
              '1NT',
              {
                call: '',
                note: '2X',
              },
              '?',
            ],
          },
          rows: [
            {
              call: '3NT',
              meaning: '敵叫組無擋之平均牌型，9-14點',
            },
            {
              call: '4D/H',
              meaning: 'TEXAS轉換，6張↑牌組，9點↑。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: [
              '1NT',
              {
                call: '',
                note: '2X',
              },
              '2NT',
              '---',
              '3C',
              '---',
              '?',
            ],
          },
          rows: [
            {
              call: '3D/H/S',
              meaning: '視敵叫組而定，在兩線可叫出而用賴本索即邀請；只能三線叫出，用賴本索即束叫。',
            },
            {
              call: '3NT',
              meaning: '敵叫組有擋（直接叫3NT是無擋）',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: 'Cue-Bid：敵叫組有擋之詢問高花。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['1NT', '2H', '2NT', '---', '3C', '---', '?'],
          },
          rows: [
            {
              call: '3S',
              meaning: '8-9點，5張↑黑桃，邀請3NT或4♠。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['1NT', '2S', '2NT', '---', '3C', '---', '?'],
          },
          rows: [
            {
              call: '3H',
              meaning: '直接叫3♥為9點↑，5張↑♥，迫叫 此例為5-8點，5張↑♥，束叫',
            },
            {
              call: '3S',
              meaning: 'Cue-Bid，且黑桃有擋張。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['1NT', '2S', '3S', '?'],
          },
          rows: [
            {
              call: '3NT',
              meaning: '無4張♥',
            },
            {
              call: '4H',
              meaning: '4張♥',
            },
          ],
        },
      ],
    },
    {
      id: 'capp',
      title: '敵方開叫1NT後的防禦叫（CAPP）',
      originalTitle: '敵方開叫1NT後，我方之防禦叫（CAPP特約）',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: seats2,
            calls: ['1NT', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '力量與開叫1NT者相若或更高，強烈暗示處罰',
            },
            {
              call: '2C',
              meaning: '一門六張以上，迫同伴叫出2♦ waiting',
            },
            {
              call: '2D',
              meaning: '兩門高花5-4以上',
            },
            {
              call: '2H',
              meaning: '紅心帶一門低花 即♥+m 5-4以上',
            },
            {
              call: '2S',
              meaning: '黑桃帶一門低花 即♠+m 5-4以上',
            },
            {
              call: '2NT',
              meaning: '低花5-5↑，10-13點，點力集中在這兩門上，請同伴選擇較長之低花。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '使用CAPP 之例子：',
        },
        {
          kind: 'hand',
          label: 'EX1) 敵方 1NT，你 2C*，敵方 P，同伴 2D，P P P P；*2C：一門長牌組，6張↑。',
          hand: {
            spades: 'T8',
            hearts: 'K75',
            diamonds: 'AKJ832',
            clubs: '74',
          },
        },
        {
          kind: 'hand',
          label: 'EX2) 敵方 1NT，你 X，敵方 P，同伴 P，P',
          hand: {
            spades: 'AQJ7',
            hearts: 'AKQ74',
            diamonds: '75',
            clubs: 'Q8',
          },
        },
        {
          kind: 'hand',
          label: 'EX3) 敵方 1NT，你 2D*，敵方 P，同伴 2S，P P P；*2D 兩門高花5-4以上',
          hand: {
            spades: 'QJT97',
            hearts: 'AKQ74',
            diamonds: '5',
            clubs: '28',
          },
        },
      ],
    },
  ],
}
