import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 開叫1♥/1♠（自然制講義） — from the club's old handbook 淡江大學-我們的制度(修訂版) (2010, 13-point
 * openings). Transcribed verbatim from docs/淡江大學-我們的制度(修訂版).doc; bids and suit letters use
 * suit symbols. Notes marked 現行制度 apply the current system (12-point openings, 1NT 15-17,
 * 2NT 20-21, 2♣ 22+, 1NT forcing, 2/1 game forcing); notes marked 以特約為準 point to the
 * convention that overrides the handbook. Generated from a hand-cleaned transcription.
 */

const seats0: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']
const seats1: Auction['seats'] = ['問', '答', '問', '答']
const seats2: Auction['seats'] = ['同伴', '敵方', '我', '敵方']

export const systemOneMajor: Convention = {
  slug: 'system-one-major',
  nameZh: '開叫1♥/1♠（自然制講義）',
  nameEn: '1♥/1♠ Opening (Natural System)',
  aliases: [
    '開叫1H',
    '開叫1S',
    '1H開叫',
    '1S開叫',
    '高花開叫',
    '1NT迫叫',
    'forcing 1NT',
    'RKCB',
    '黑木',
  ],
  category: 'system',
  kind: 'system',
  level: 'basic',
  cardSlots: [
    'wbf.high-level <- rkcb#2',
    'ctcba-simple.other.rkcb <- rkcb',
  ],
  tags: ['舊講義', '高花開叫', '1NT 迫叫', '2 蓋 1', 'RKCB', '遭插叫'],
  summary:
    '第四章：開叫 1♥/1♠（13-21 點，保證 5 張）的答叫、1NT 迫叫後的再叫、開叫者再叫、RKCB 與黑木問 A、遭插叫與不尋常 2NT。',
  source: {
    title: '淡江大學-我們的制度(修訂版)',
    note: '第四章 開叫1♥/1♠',
  },
  updated: '2026-10-22',
  sections: [
    {
      id: 'responses-1h',
      title: '答叫：1♥ ?',
      originalTitle: '第 四 章 開叫1♥/1♠ 13-21點，保證5張牌組',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**現行制度**：12 點開叫；答叫 1NT 為迫叫；二線新花（2♣/2♦）為 2 蓋 1 迫叫成局，之後雙方報牌型。',
        },
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：2NT 答叫見「開叫高花之滿貫詢問叫（Jacoby 2NT）」；加叫見「1♥ 2♥（淡江用）」與「Bergen加叫（松濤版）」。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1H', '', '?'],
          },
          rows: [
            {
              call: '1S',
              meaning: '6點以上，4張以上♠牌組。',
            },
            {
              call: '1NT',
              meaning: '6-9點。',
            },
            {
              call: '2C/D',
              meaning: '10點以上，4張以上♣/♦。',
            },
            {
              call: '2H',
              meaning: '6-9點，有3張↑♥配合，簡單加一支持。',
            },
            {
              call: '2NT',
              meaning: '10-12點，邀請3NT',
            },
            {
              call: '2S/3C/D',
              meaning:
                '為5點以下，6或7張牌組之弱叫，所叫之牌組保證有一大牌（指A、K、Q）且5點時絕無A。',
            },
            {
              call: '3H',
              meaning: '10-12點，3張↑♥支持，邀請4♥',
            },
            {
              call: '3NT',
              meaning: '13-15點，平均牌型，未叫花色均有擋，♥無三張支持。',
            },
            {
              call: '3S/4C/D',
              meaning: 'Splinter，13點↑，王牌♥配合，所叫為單張或缺門。',
            },
            {
              call: '4H',
              meaning: '束叫，10點以下。五張以上王牌配合',
              pending:
                '本表 1NT 為 6-9 點；本章後段「1NT迫叫」為 6-12 點迫叫一圈（現行 1NT forcing），範圍待確認。',
            },
          ],
        },
      ],
    },
    {
      id: 'responses-1s',
      title: '答叫：1♠ ?',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1S', '', '?'],
          },
          rows: [
            {
              call: '1NT',
              meaning: '6-9點。',
            },
            {
              call: '2C/D',
              meaning: '10點以上 4張以上♣/♦',
            },
            {
              call: '2H',
              meaning: '10點以上5張以上♥',
            },
            {
              call: '2S',
              meaning: '6-9點，有3張↑♠配合，簡單加一支持。',
            },
            {
              call: '2NT',
              meaning: '10-12點，邀請3NT',
            },
            {
              call: '3C/D/H',
              meaning:
                '為5點以下，6或7張牌組之弱叫，所叫之牌組保證有一大牌（指A、K、Q）且5點時絕無A。',
            },
            {
              call: '3S',
              meaning: '10-12點，3張↑♠支持，邀請4♠',
            },
            {
              call: '3NT',
              meaning: '13-15點，平均牌型，未叫花色均有擋，♠無三張支持。',
            },
            {
              call: '4C/D/H',
              meaning: 'Splinter，13個大牌點↑，至少4張王牌♠支持，所叫花色，為單張或缺門。',
            },
            {
              call: '4S',
              meaning: '束叫，10點以下，至少4張♠支持。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '5-5高花先開叫1♠；6-5高花先開叫較長之花色',
        },
        {
          kind: 'paragraph',
          text: '6-5高花時，分配力量強，不強調高低限',
        },
        {
          kind: 'paragraph',
          text: 'EX)',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1H', '', '2C', '', '2S', '', '2NT', '', '3S', '', '?'],
          },
          rows: [
            {
              call: '4H/S',
              meaning: '（很容易決定最後合約）（1♥ 2♣ 迫叫成局！；3♠ 6-5!）',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '或',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1H', '', '1NT', '', '2S', '', '3C', '', '3S', '', '?'],
          },
          rows: [
            {
              call: '3NT/4H/S',
              meaning: '（同伴可以判斷最佳合約）（3♠ 6-5!!）',
            },
          ],
        },
      ],
    },
    {
      id: 'rkcb',
      title: '關於R.K.C.B.問A',
      originalTitle: '關於R.K.C.B.問A（於王牌合約使用）',
      blocks: [
        {
          kind: 'paragraph',
          text: '兩門皆支持時，務必跟同伴約定王牌是什麼！',
        },
        {
          kind: 'paragraph',
          text: 'R.K.C.B. 總共有5個關鍵張，為4個A及王牌K。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['4NT', '?'],
          },
          rows: [
            {
              call: '5C',
              meaning: '0或3個關鍵張',
            },
            {
              call: '5D',
              meaning: '1或4個關鍵張',
            },
            {
              call: '5H',
              meaning: '2個關鍵張，無王牌Q',
            },
            {
              call: '5S',
              meaning: '2個關鍵張，有王牌Q',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: 'EX1)',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '1♥ 3♥ 4NT（R.K.C.B.）',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '4NT：R.K.C.B. 同意♥為王牌。',
        },
        {
          kind: 'paragraph',
          text: 'EX2)',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '1♠ 2♣ 3♣ 3♠ 4NT（R.K.C.B.）',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '4NT：R.K.C.B. 以最後同意王牌為準（♠）。',
        },
        {
          kind: 'paragraph',
          text: 'EX3)',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '2♥/3♥ 4NT（同意♥之R.K.C.B.）',
            },
          ],
        },
      ],
    },
    {
      id: 'blackwood',
      title: '關於黑木問A',
      originalTitle: '關於黑木(Blackwood)問A（於無王合約使用）',
      blocks: [
        {
          kind: 'paragraph',
          text: '用於沒有互相支持王牌時',
        },
        {
          kind: 'paragraph',
          text: 'EX)',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '1♥ 1♠ 2♣ 4NT（Blackwood問A）',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['4NT', '?'],
          },
          rows: [
            {
              call: '5C',
              meaning: '0或4個A',
            },
            {
              call: '5D',
              meaning: '1個A',
            },
            {
              call: '5H',
              meaning: '2個A',
            },
            {
              call: '5S',
              meaning: '3個A',
            },
          ],
        },
      ],
    },
    {
      id: 'forcing-1nt',
      title: '1NT迫叫之後開叫者再叫',
      originalTitle: '1NT迫叫之後開叫者再叫(新生請先忽略這段)',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**現行制度**：社團現在打 1NT forcing。',
        },
      ],
      children: [
        {
          id: 'after-1h-1nt',
          title: '1♥ 1NT ?',
          blocks: [
            {
              kind: 'paragraph',
              text: '1NT*：6-12點，迫叫一圈。',
            },
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1H', '', '1NT', '', '?'],
              },
              rows: [
                {
                  call: '2C/D',
                  meaning: '13-15點，3張以上之♣/♦。',
                },
                {
                  call: '2H',
                  meaning: '13-15點，6張↑♥牌組。',
                },
                {
                  call: '2S',
                  meaning: '倒叫，16-21點，5張↑♥＋4張↑♠。',
                },
                {
                  call: '2NT',
                  meaning: '16-18點，平均牌型，邀請3NT。',
                },
                {
                  call: '3C/D',
                  meaning: '19-21點，牌型5-4以上。',
                },
                {
                  call: '3H',
                  meaning: '16-18點，6張↑堅強紅心牌組。',
                },
                {
                  call: '3NT',
                  meaning: '19-21點，5-3-3-2。',
                },
                {
                  call: '4H',
                  meaning: '19-21點，6張↑紅心牌組或有8個↑贏墩。',
                },
              ],
            },
          ],
        },
        {
          id: 'responder-1h',
          title: '對1♥答叫1NT者之再叫',
          blocks: [
            {
              kind: 'paragraph',
              text: '1NT*：6-9點',
            },
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1H', '', '1NT', '', '2C', '', '?'],
              },
              rows: [
                {
                  call: '2D',
                  meaning: '修正合約，6-9點，6張以上♦，無2張♥。',
                },
                {
                  call: '2H',
                  meaning: '2張♥，6-9點（若有3張♥，6-9點，可叫2♥）。',
                },
                {
                  call: '3C',
                  meaning: '8-9點，維持叫品 4張以上♣支持',
                  pending:
                    '1NT 迫叫為 6-12 點，此處答叫者再叫只列 6-9 點的牌，10-12 點的再叫待確認。',
                },
              ],
            },
          ],
        },
        {
          id: 'after-1s-1nt',
          title: '1♠ 1NT ?',
          blocks: [
            {
              kind: 'paragraph',
              text: '1NT*：6-12點，迫叫一圈。',
            },
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1S', '', '1NT', '', '?'],
              },
              rows: [
                {
                  call: '2C/D',
                  meaning: '13-15點，3張以上♣/♦。',
                },
                {
                  call: '2H',
                  meaning: '13-18點，5張↑♠＋4張↑♥牌組。',
                },
                {
                  call: '2S',
                  meaning: '13-15點，6張↑♠牌組。',
                },
                {
                  call: '2NT',
                  meaning: '16-18點，平均牌型，邀請3NT。（可能5-4-2-2 4張必須是低花）。',
                },
                {
                  call: '3C/D/H',
                  meaning: '19-21點，牌型5-4以上。',
                },
                {
                  call: '3S',
                  meaning: '16-18點，6張↑堅強黑桃牌組。',
                },
                {
                  call: '3NT',
                  meaning: '19-21點，5-3-3-2。',
                },
                {
                  call: '4S',
                  meaning: '19-21點，6張↑黑桃牌組或有8個↑贏墩。',
                },
              ],
            },
          ],
        },
        {
          id: 'responder-1s',
          title: '對1♠答叫1NT者之再叫',
          blocks: [
            {
              kind: 'paragraph',
              text: '1NT*：6-9個點',
            },
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1S', '', '1NT', '', '2C', '', '?'],
              },
              rows: [
                {
                  call: '2D',
                  meaning: '修正合約，6-9點，6張以上♦，無2張♠。',
                },
                {
                  call: '2H',
                  meaning:
                    '修正合約，6-9點，6張以上♥，無2張♠。（若♠為單張或缺門，♥可以允許只有5張）',
                },
                {
                  call: '2S',
                  meaning: '6-9點，2張♠。',
                },
                {
                  call: '3C',
                  meaning: '8-9點，維持叫品，4張以上♣支持',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1S', '', '1NT', '', '2H', '', '?'],
              },
              rows: [
                {
                  call: '2S',
                  meaning: '修正合約（2張♠），6-9點。',
                },
                {
                  call: '3C/D',
                  meaning: '修正合約，6張以上♣/♦。6-9點',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'other',
      title: '其他類型',
      originalTitle: '其他類型',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: [
              '1H',
              '',
              '1S',
              '',
              '2C',
              '',
              {
                call: '2D',
                note: '＊第四門新花迫叫成局',
              },
              '',
              '2NT',
              '',
              '?',
            ],
          },
          rows: [
            {
              call: '3H',
              meaning: '延後支持，超級好牌。',
            },
          ],
        },
      ],
    },
    {
      id: 'opener-rebids',
      title: '開叫者之再叫',
      originalTitle: '開叫者之再叫',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1H', '', '1S/NT', '', '?'],
          },
          rows: [
            {
              call: '3H',
              meaning: '不一定是好牌組，6張↑♥，16-18點。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1H', '', '1S', '', '?'],
          },
          rows: [
            {
              call: '2NT',
              meaning: '16-18點。',
            },
            {
              call: '3NT',
              meaning: '19-21點。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1H/S', '', '2C/D', '', '?'],
          },
          rows: [
            {
              call: '2H/S',
              meaning: '13-15點，低限，保證5張牌組（不保證6張）。',
            },
            {
              call: '2NT',
              meaning: '16-21點，平均牌型。',
            },
            {
              call: '3C/D',
              meaning: '16-21點，迫叫成局，4張↑♣/♦ fit。',
            },
            {
              call: '2D/H',
              meaning: '簡單新花2♦/2♥：4張↑牌組13-18。',
            },
            {
              call: '3H/S',
              meaning: '16-18點，6張以上牌組。',
              pending:
                '現行 1♥/♠ 2♣/♦ 為 2 蓋 1 迫叫成局、之後雙方報牌型；此表開叫者再叫的點力分段是否沿用待確認。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: [
              '1H',
              '',
              {
                call: '2H',
                note: '6-9點，有3張↑♥支持',
              },
              '',
              '?',
            ],
          },
          rows: [
            {
              call: '2S/3C/D',
              meaning:
                '同意高花王牌後，開叫者開新花為15-18點示大牌力量所在之牌組。要求同伴在此門短，或是此門為長門且有大牌(AK/KQ/AQ)，叫上一局！稱為HELP SUIT',
            },
            {
              call: '2NT',
              meaning: '16-18點，平均牌型，邀請上4♥/3NT。',
            },
            {
              call: '3NT',
              meaning: '19-21點，5-3-3-2。',
            },
            {
              call: '4H',
              meaning: '束叫，19-21點的牌值。',
            },
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：1♥ 2♥ 之後的再叫以「1♥ 2♥（淡江用）」特約為準。',
        },
      ],
    },
    {
      id: 'overcall',
      title: '遭敵方插叫時',
      originalTitle: '遭敵方插叫時',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: seats2,
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
              meaning: '束叫，4張↑紅心支持，有阻塞意味。',
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
              meaning: '7張↑♦弱牌，紅心不配合。',
            },
            {
              call: '3NT',
              meaning: '束叫，13-15點。',
            },
            {
              call: '3S/4C/D',
              meaning: 'Splinter，4張↑♥支持，13點↑，單張或缺門。',
            },
          ],
        },
      ],
    },
    {
      id: 'unusual-2nt',
      title: '對抗不尋常無王',
      originalTitle: '當開叫1線高花，敵方使用不尋常無王（Unusual Notrump）表示兩低時',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：以「對抗不尋常2NT」特約為準。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats2,
            calls: [
              '1H',
              {
                call: '2NT',
                note: '不尋常無王，兩門低花5-5以上',
              },
              '?',
            ],
          },
          rows: [
            {
              call: 'X',
              meaning: '11點↑。如果同伴有4張↑的低花，建議同伴處罰敵方的低花合約。',
            },
            {
              call: '3C',
              meaning: '11點↑，3張↑♥支持，最少邀請4♥。',
            },
            {
              call: '3D',
              meaning: '13點↑，5張↑♠牌組，迫叫成局。',
            },
            {
              call: '3H',
              meaning: '競叫性叫牌，可能只有8-10點，或更弱，不迫叫。',
            },
            {
              call: '3NT',
              meaning: '13-15點，4張♥支持，無單張或缺門。',
            },
            {
              call: '4C/D',
              meaning: 'Splinter，13點↑，所叫為單張或缺門。',
            },
            {
              call: '4H',
              meaning: '束叫。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats2,
            calls: ['1S', '2NT', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '11點↑，力量充足，建議同伴處罰敵方合約。',
            },
            {
              call: '3C',
              meaning: '11點↑，3張↑♠支持，最少邀請4♠。',
            },
            {
              call: '3D',
              meaning: '13點↑，5張↑♥牌組，迫叫成局。',
            },
            {
              call: '3S',
              meaning: '可能只有8-10點，非邀請性質，不迫叫。',
            },
            {
              call: '3NT',
              meaning: '13-15點，4張支持♠，無單張或缺門。',
            },
            {
              call: '4C/D',
              meaning: 'Splinter，13點↑，所叫為單張或缺門。',
            },
            {
              call: '4S',
              meaning: '束叫。',
            },
          ],
        },
      ],
    },
  ],
}
