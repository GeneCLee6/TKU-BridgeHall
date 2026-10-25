import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 賭倍性叫品（自然制講義） — from the club's old handbook 淡江大學-我們的制度(修訂版) (2010, 13-point
 * openings). Transcribed verbatim from docs/淡江大學-我們的制度(修訂版).doc; bids and suit letters use
 * suit symbols. Notes marked 現行制度 apply the current system (12-point openings, 1NT 15-17,
 * 2NT 20-21, 2♣ 22+, 1NT forcing, 2/1 game forcing); notes marked 以特約為準 point to the
 * convention that overrides the handbook. Generated from a hand-cleaned transcription.
 */

const seats0: Auction['seats'] = ['敵方', '同伴', '敵方', '你']
const seats1: Auction['seats'] = ['開叫者', '敵方', '你', '敵方']
const seats2: Auction['seats'] = ['你', '敵方', '同伴', '敵方']
const seats3: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']
const seats4: Auction['seats'] = ['敵方', '同伴', '敵方', '我']
const seats5: Auction['seats'] = ['我', '敵方', '同伴', '敵方']
const seats6: Auction['seats'] = ['敵方', '你', '敵方', '同伴']
const seats7: Auction['seats'] = ['同伴', '敵方', '我', '敵方']
const seats8: Auction['seats'] = ['同伴', '敵方', '你', '敵方']

export const systemDoubles: Convention = {
  slug: 'system-doubles',
  nameZh: '賭倍性叫品（自然制講義）',
  nameEn: 'Doubles (Natural System)',
  aliases: [
    '賭倍',
    'take-out double',
    'T/O',
    '迫伴賭倍',
    '負性賭倍',
    'negative double',
    '示弱賭倍',
    '合作性賭倍',
    'SOS',
  ],
  category: 'system',
  kind: 'system',
  level: 'intermediate',
  cardSlots: [
    'wbf.doubles.takeout <- take-out',
    'wbf.doubles.takeout <- after-double',
    'wbf.doubles.special <- negative',
    'wbf.doubles.special <- penalty',
    'wbf.doubles.special <- optional',
    'wbf.doubles.special <- maximal',
    'wbf.doubles.special <- sos',
    'wbf.defence.vs-takeout-double <- opponents-double',
    'wbf.defence.vs-takeout-double <- after-redouble',
    'ctcba-simple.comp.takeout-double <- take-out',
    'ctcba-simple.comp.negative-double <- negative',
  ],
  tags: ['舊講義', '賭倍', '迫伴賭倍', '負性賭倍', '合作性賭倍', '再賭倍'],
  summary:
    '第十章：迫伴賭倍與答叫、回答性賭倍、負性賭倍、處罰與合作性賭倍、高限賭倍、S.O.S. 再賭倍，以及敵方賭倍後我方的叫法。',
  source: {
    title: '淡江大學-我們的制度(修訂版)',
    note: '第十章 賭倍性叫品',
  },
  updated: '2026-10-22',
  sections: [
    {
      id: 'take-out',
      title: '迫伴賭倍',
      originalTitle: 'A、賭倍',
      blocks: [
        {
          kind: 'paragraph',
          text: '迫伴賭倍(Take-Out Double)分配力量（非大牌點）。',
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'PS：除非持很好的牌，否則未叫高花要有長度。',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '一般型：牌型要對，無五張未叫牌組。未叫牌組須有三張↑，迫同伴於一階回答。11點↑，每高一階加2點。',
            },
            {
              text: '強力型：16點↑，有一門獨立牌組，即double後再叫。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1D', 'X', '---', '?'],
          },
          rows: [
            {
              call: '1H/S/2C',
              meaning: '0-8點，4張↑牌組。',
            },
            {
              call: '1NT',
              meaning: '8-10點，未叫花色均無四張，敵叫組有一擋；否則叫三張高花。',
            },
            {
              call: '2D',
              meaning: '12點↑，迫叫一圈。',
            },
            {
              call: '2H/S/3C',
              meaning: '9-11點，4張↑牌組。',
            },
            {
              call: '2NT',
              meaning: '10-12點，未叫花色均無四張，敵叫組有一擋。',
            },
            {
              call: '3H/S',
              meaning: '9-11點，6張↑堅強牌組。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: 'EX) 1♦ X 1♠ ？',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '自由答叫：一階 → 7-9點',
            },
            {
              text: '二階 → 8-10點',
            },
            {
              text: '三階 → 8-11點',
            },
          ],
        },
      ],
    },
    {
      id: 'responsive',
      title: '回答性賭倍',
      originalTitle: '回答性賭倍(Responsive Double)',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：以「回答性賭倍」特約為準。',
        },
        {
          kind: 'paragraph',
          text: '敵方在3♦以下作直接加叫時，X*是迫伴',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1D', 'X', '2D', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '通常7-10點，高花4-4↑',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1S', 'X', '2S', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '對高花作反賭倍通常沒有另一高花4張，此例為4-4低花',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1D', '---', '1S', 'X', '2S', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '4♥＋4♣',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1D', 'X', '2H', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '處罰，否則可以直接加叫2♠或3♣',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1H', 'X', '3H', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '處罰，超過3♦，不是回答性賭倍',
            },
          ],
        },
      ],
    },
    {
      id: 'negative',
      title: '示弱賭倍（負性賭倍）',
      originalTitle: '示弱賭倍(Negative Double)又稱負性賭倍',
      blocks: [
        {
          kind: 'paragraph',
          text: '在同伴開叫，而敵方蓋叫於3♦以下均可使用，保證未叫花色四張。',
        },
        {
          kind: 'paragraph',
          text: '一線8點↑，二線10點↑。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['1C', '1D', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '高花4-4',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['1C/D', '1H', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '4張♠（叫1♠為5張）',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['1C/D', '1S', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '4張♥',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['1H', '1S', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '2張♥支持，低花牌組；或比叫2♥更好的牌',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['1D', '2C', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '通常為4-3高花',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['1S', '2C', 'X', 'PASS', '?'],
          },
          rows: [
            {
              call: '2D/H',
              meaning: '通常4張 但可能3張，避免5♠張連叫兩次。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats2,
            calls: ['1H', '1S', 'X', 'PASS', '?'],
          },
          rows: [
            {
              call: '2C/D',
              meaning: '通常4張 但可能3張，避免5張♥連叫兩次。',
            },
            {
              call: '2H',
              meaning: '2張♥，6-9點。',
            },
            {
              call: '3C/D',
              meaning: '5張以上牌組支持，6-9點，',
            },
          ],
        },
      ],
    },
    {
      id: 'penalty',
      title: '處罰賭倍',
      originalTitle: '處罰賭倍',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: seats3,
            calls: ['1D', '---', '1NT', '---', '---', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '處罰建議首攻♦。',
            },
          ],
        },
      ],
    },
    {
      id: 'optional',
      title: '合作性賭倍',
      originalTitle: '合作性賭倍(Optional Double)又稱兩用賭倍(或建議處罰)',
      blocks: [
        {
          kind: 'paragraph',
          text: '通常為平均牌型，有足夠之大牌點可以擊垮敵方之合約，且在叫過之花色中（含同伴叫過之牌組）皆能支持。同伴不一定要持有王牌贏墩時才可PASS，也可叫回原叫過之牌組。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats4,
            calls: ['2H', 'X', '4H', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '合作性賭倍，處罰意味較濃，若想叫牌，可直接競叫。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats4,
            calls: ['1S', 'X', '2D', '---', '4S', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '合作性賭倍',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats5,
            calls: ['1D', '4H', '---', '---', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '合作性賭倍，因為同伴未曾叫牌或賭倍。',
            },
          ],
        },
      ],
    },
    {
      id: 'maximal',
      title: '高限賭倍',
      originalTitle: '高限賭倍(Maximal Overcall Double)',
      blocks: [
        {
          kind: 'paragraph',
          text: '適用於競叫中，敵方之叫牌線位使開叫人無法作成局試探。',
        },
        {
          kind: 'paragraph',
          text: '(a)',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats5,
            calls: ['1S', '2H', '2S', '3C', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '處罰，梅花有兩個贏墩以上，14-15點左右。',
            },
            {
              call: '3D/H',
              meaning: '示叫敵叫組為邀請上4♠，16-18',
            },
            {
              call: '3S',
              meaning: '競叫，12-15點。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '(b)',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats5,
            calls: ['1S', '2H', '2S', '3H', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '16-18點，邀請上4♠，如不接受邀請即叫3♠或PASS轉為處罰。',
            },
            {
              call: '3S',
              meaning: '競叫，12-15點。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '在敵方競叫過程中，如敵方所叫花色相同如例(b)，則我方之X則為“邀請”。如敵方所叫花色為不同花色，如例(a)則我方之X即為“處罰”。',
        },
      ],
    },
    {
      id: 'sos',
      title: '求救再賭倍',
      originalTitle: '求救再賭倍(S. O. S. Redouble)',
      blocks: [
        {
          kind: 'paragraph',
          text: '用於合約被敵方或敵方的同伴處罰時，覺得無法做成合約時使用。',
        },
        {
          kind: 'paragraph',
          text: '(a)',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats2,
            calls: ['1C', 'X', '---', '---', '?'],
          },
          rows: [
            {
              call: 'XX',
              meaning: '(S.O.S.)，此S.O.S.持短梅花',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '(b)',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats6,
            calls: ['2H', '2S', 'X', '---', '---', '?'],
          },
          rows: [
            {
              call: 'XX',
              meaning: '♠-O-♠ Redouble請同伴叫3♣/♦，4張↑牌組（2♥ 為弱二，X 為處罰）',
            },
          ],
        },
        {
          kind: 'hand',
          label: '牌型可能如右',
          hand: {
            spades: 'AJ865',
            hearts: '-',
            diamonds: 'KQT4',
            clubs: 'QJ93',
          },
        },
      ],
    },
    {
      id: 'after-double',
      title: '賭倍之後',
      originalTitle: 'B、賭倍之後',
      blocks: [
        {
          kind: 'paragraph',
          text: '同伴迫伴賭倍後之答叫',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '簡單答叫：0-8點',
            },
            {
              text: '跳叫新花：9-11點',
            },
            {
              text: 'Cue-Bid ：12點↑',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats7,
            calls: ['1H', '2C', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '負性賭倍。',
            },
            {
              call: '2H',
              meaning: '6-9點，3張紅心支持。',
            },
            {
              call: '3H',
              meaning: '10-12點，4張（或3張帶大牌）支持，邀請成局。',
            },
            {
              call: '4H',
              meaning: '束叫，5張↑紅心支持，有阻塞意味。',
            },
            {
              call: '2NT',
              meaning: '10-12點，敵叫組有擋。',
            },
            {
              call: '2D/S',
              meaning: '10點↑，5張↑牌組，迫叫。',
            },
            {
              call: '3C',
              meaning: '13點↑，迫叫成局，開始Cue-Bid。',
            },
            {
              call: '3D',
              meaning: '3-5點，7張↑♦，紅心不配合。',
            },
            {
              call: '3NT',
              meaning: '束叫，13-15點。',
            },
            {
              call: '3S/4C/D',
              meaning: 'Splinter，4張↑♥支持，13點↑，單張或缺門。',
              pending:
                '第四章同一個叫牌過程寫 4♥ 為「4張↑紅心支持」、3♦ 為「7張↑♦弱牌」，此處寫 5 張↑與 3-5 點，以何者為準待確認。',
            },
          ],
        },
      ],
      children: [
        {
          id: 'examples',
          title: '迫伴賭倍後的答叫例',
          blocks: [
            {
              kind: 'paragraph',
              text: 'EX1) 左敵 1♦，同伴 X，右敵 PASS，你？',
            },
            {
              kind: 'hand',
              label: '(i) 應叫1H',
              hand: {
                spades: 'T4',
                hearts: '9863',
                diamonds: '9762',
                clubs: '753',
              },
            },
            {
              kind: 'hand',
              label: '(ii) 應叫1H',
              hand: {
                spades: 'Q93',
                hearts: 'KJT93',
                diamonds: '762',
                clubs: '52',
              },
            },
            {
              kind: 'paragraph',
              text: 'EX2) 左敵 1♠，同伴 X，右敵 PASS，你？',
            },
            {
              kind: 'hand',
              label: '(iii) 應叫2C，絕不可叫1NT',
              hand: {
                spades: 'QT97',
                hearts: '64',
                diamonds: '764',
                clubs: '9763',
              },
            },
            {
              kind: 'paragraph',
              text: 'EX) 左敵 1♦，同伴 X，右敵 PASS，你？',
            },
            {
              kind: 'hand',
              label: '叫2H',
              hand: {
                spades: '94',
                hearts: 'KJT8',
                diamonds: '7542',
                clubs: 'AQ9',
              },
            },
            {
              kind: 'hand',
              label: '叫2D，Cue-Bid',
              hand: {
                spades: 'Q2',
                hearts: 'K832',
                diamonds: 'AT72',
                clubs: 'A92',
              },
            },
            {
              kind: 'hand',
              label: '叫1NT',
              hand: {
                spades: 'Q32',
                hearts: 'Q5',
                diamonds: 'KJ74',
                clubs: '9742',
              },
            },
            {
              kind: 'hand',
              label: '叫1NT',
              hand: {
                spades: 'A6',
                hearts: '762',
                diamonds: 'A9742',
                clubs: '942',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'opponents-double',
      title: '當敵方迫伴，我方之後續叫牌',
      originalTitle: '當敵方迫伴，我方之後續叫牌',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: seats8,
            calls: ['1H', 'X', '?'],
          },
          rows: [
            {
              call: 'XX',
              meaning: '11點↑，欲追殺，敵方不能停在二線上主打未遭賭倍的合約。',
            },
            {
              call: '2H',
              meaning: '加一支持，0-9點。三張支持',
            },
            {
              call: '1S/2C/D',
              meaning: '6-10點，高花4張低花5張↑牌組。',
            },
            {
              call: '1NT',
              meaning: '8-10點，有1½擋張。',
            },
            {
              call: '2S/3C/D',
              meaning: '0-5點，阻塞，6張↑牌組，♥不配合。',
            },
            {
              call: '3H/4H',
              meaning: '阻塞，4+ 5+牌組。',
            },
            {
              call: '2NT',
              meaning: '邀請4♥（原本1♥ – 3♥）。',
            },
            {
              call: '3NT',
              meaning: '強力王牌支持，4張↑♥。',
            },
            {
              call: '3S/4C/D',
              meaning: 'Splinter，♥配合。',
            },
          ],
        },
      ],
    },
    {
      id: 'after-redouble',
      title: '再賭倍示強後之發展',
      originalTitle: '當敵方迫伴，我方再賭倍示強後之發展',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: seats3,
            calls: ['1S', 'X', 'XX', '---', '---', '2C', '?'],
          },
          rows: [
            {
              call: '2S',
              meaning: '11-12點，3張↑♠。',
            },
            {
              call: '3S',
              meaning: '13-15點，3張↑♠。',
            },
          ],
        },
        {
          kind: 'rules',
          items: [
            {
              text: '新花：11點↑，5張↑牌組，迫叫。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats3,
            calls: ['1S', 'X', 'XX', '---', '---', '2C', '?'],
          },
          rows: [
            {
              call: '2NT',
              meaning: '11-12點，邀請。',
            },
            {
              call: 'X',
              meaning: '♣牌組。',
            },
          ],
        },
      ],
    },
  ],
}
