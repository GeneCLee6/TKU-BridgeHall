import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 開叫1♦（自然制講義） — from the club's old handbook 淡江大學-我們的制度(修訂版) (2010, 13-point
 * openings). Transcribed verbatim from docs/淡江大學-我們的制度(修訂版).doc; bids and suit letters use
 * suit symbols. Notes marked 現行制度 apply the current system (12-point openings, 1NT 15-17,
 * 2NT 20-21, 2♣ 22+, 1NT forcing, 2/1 game forcing); notes marked 以特約為準 point to the
 * convention that overrides the handbook. Generated from a hand-cleaned transcription.
 */

const seats0: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']

export const systemOneDiamond: Convention = {
  slug: 'system-one-diamond',
  nameZh: '開叫1♦（自然制講義）',
  nameEn: '1♦ Opening (Natural System)',
  aliases: ['開叫1D', '1D開叫', '1♦', '第四門新花', '倒叫', 'negative double'],
  category: 'system',
  kind: 'system',
  level: 'basic',
  tags: ['舊講義', '1♦ 開叫', '答叫', '再叫', '第四門新花', '倒叫', '遭插叫'],
  summary:
    '第三章：開叫 1♦（13-21 點，保證 4 張♦↑）的答叫、開叫者再叫、答叫者迫叫與第四門新花、倒叫、遭插叫或賭倍後的叫法、低花反序。',
  source: {
    title: '淡江大學-我們的制度(修訂版)',
    note: '第三章 開叫 1♦',
  },
  updated: '2026-10-22',
  sections: [
    {
      id: 'responses',
      title: '答叫：1♦ ?',
      originalTitle: '第 三 章 開叫 1♦ 13-21點，保證4張♦↑',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**現行制度**：12 點開叫；答叫 2♣ 為 2 蓋 1，迫叫成局，之後雙方報牌型。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1D', '', '?'],
          },
          rows: [
            {
              call: '1H/S',
              meaning: '6點↑，4張↑牌組，4-4牌型從最低的花色牌組叫起；4-4以上從較長的花色牌組先叫。',
            },
            {
              call: '1NT',
              meaning: '6-9點，無四張高花。',
            },
            {
              call: '2C',
              meaning: '10點↑，4張↑♣。',
            },
            {
              call: '2D',
              meaning: '6-9點，4張↑♦。',
            },
            {
              call: '2H/S/3C',
              meaning: '5點以下，6或7張所叫牌組之弱叫，保證有一大牌（指A、K、Q）且5點時絕無A。',
            },
            {
              call: '2NT',
              meaning: '10-12點，平均牌型邀請3NT，無4張高花。',
            },
            {
              call: '3D',
              meaning: '10-12點，4張↑方塊牌組。',
            },
            {
              call: '3NT',
              meaning: '13-15點，平均牌型。無高花。',
            },
            {
              call: '4D/5D',
              meaning: '6張↑♦，9點↓，阻塞性叫品，敵方有插叫亦同。',
              pending: '現行 2 蓋 1 迫叫成局，2♣ 的點力下限（本表 10 點↑）與張數待確認。',
            },
          ],
        },
      ],
    },
    {
      id: 'rebids',
      title: '開叫1♦之後續發展',
      originalTitle: '開叫1D之後續發展',
      children: [
        {
          id: 'after-1h',
          title: '(1) 1♦ 1♥ ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1D', '', '1H', '', '?'],
              },
              rows: [
                {
                  call: '1S',
                  meaning: '13-18點，4張 ♠。',
                },
                {
                  call: '2C',
                  meaning: '13-18點，5張♦＋4張♣',
                },
                {
                  call: '1NT',
                  meaning: '13-15點，無4張♠，平均牌型。',
                },
                {
                  call: '2D',
                  meaning: '13-15點，6張↑♦。',
                },
                {
                  call: '2S/3C',
                  meaning: '19-21點，5張↑♦＋4張♠/♣以上，跳叫新花迫叫成局。牌型可能5-4或6-5以上。',
                },
                {
                  call: '2NT',
                  meaning: '19點，平均牌型。',
                },
                {
                  call: '3D',
                  meaning: '16-18點，6張↑♦。',
                },
                {
                  call: '3H',
                  meaning: '16-18點，4張♥。',
                },
                {
                  call: '3S/4C',
                  meaning: 'Splinter，19-21點，4張♥配合。',
                },
                {
                  call: '3NT',
                  meaning: '19-21點。TO PLAY',
                },
                {
                  call: '4H',
                  meaning: '19-21點，4張♥支持，無單張或缺門。',
                },
              ],
            },
          ],
        },
        {
          id: 'after-1s',
          title: '(2) 1♦ 1♠ ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1D', '', '1S', '', '?'],
              },
              rows: [
                {
                  call: '1NT',
                  meaning: '13-15點，無4張♠，平均牌型。',
                },
                {
                  call: '2C',
                  meaning: '13-18點，5張↑♦＋4張↑♣，不平均牌型。',
                },
                {
                  call: '2D',
                  meaning: '13-15點，6張↑♦，不平均牌型。',
                },
                {
                  call: '2H',
                  meaning: '16-21點，倒叫，5張↑♦＋4張↑♥。',
                },
                {
                  call: '2S',
                  meaning: '13-15點，4張♠。',
                },
                {
                  call: '2NT',
                  meaning: '19點，平均牌型。',
                },
                {
                  call: '3C',
                  meaning: '19-21點，跳叫新花 梅花牌組不保證。',
                },
                {
                  call: '3D',
                  meaning: '16-18點，6張↑♦。',
                },
                {
                  call: '3S',
                  meaning: '16-18點， 4張♠。',
                },
                {
                  call: '3NT',
                  meaning: '19-21點，TO PLAY。',
                },
                {
                  call: '4C/H',
                  meaning: 'Splinter，19-21點，4張♠配合。',
                },
                {
                  call: '4S',
                  meaning: '19-21點，4張♠支持，無單張或缺門。',
                },
              ],
            },
          ],
        },
        {
          id: 'after-1nt',
          title: '(3) 1♦ 1NT ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1D', '', '1NT', '', '?'],
              },
              rows: [
                {
                  call: '2C',
                  meaning: '13-18點，5張↑♦＋4張↑♣，不平均牌型。',
                },
                {
                  call: '2D',
                  meaning: '13-15點，6張↑♦，不平均牌型。',
                },
                {
                  call: '2H/S',
                  meaning: '16-21點，倒叫，5張↑♦＋4張♥/♠以上。',
                },
                {
                  call: '2NT',
                  meaning: '16-18點，邀請3NT',
                },
                {
                  call: '3C',
                  meaning: '19-21點，跳叫新花 梅花不保證牌組',
                },
                {
                  call: '3D',
                  meaning: '16-18點，6張↑♦。',
                },
                {
                  call: '3NT',
                  meaning: '19-21點，束叫。',
                },
              ],
            },
          ],
        },
        {
          id: 'after-2c',
          title: '(4) 1♦ 2♣ ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1D', '', '2C', '', '?'],
              },
              rows: [
                {
                  call: '2D',
                  meaning: '通常是低限，5張↑♦，不平均牌型。',
                },
                {
                  call: '2H/S',
                  meaning: '16-21點，倒叫，5張↑♦＋4張♥/♠以上。',
                },
                {
                  call: '2NT',
                  meaning: '13-15點，平均牌型，高花有擋張。',
                },
                {
                  call: '3C',
                  meaning: '16點↑，3張↑♣支持。',
                },
                {
                  call: '3D',
                  meaning: '16點↑，6張↑♦。',
                  pending:
                    '現行 1♦ 2♣ 為 2 蓋 1 迫叫成局、之後雙方報牌型；此表的再叫（如 2♥/♠ 倒叫 16-21 點）是否沿用待確認。',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'responder-forcing',
      title: '答叫者迫叫',
      originalTitle: '答叫者迫叫',
      blocks: [
        {
          kind: 'rules',
          items: [
            {
              text: '新花迫叫：迫叫一圈',
            },
            {
              text: '再叫時跳叫：至少“強烈邀請”成局',
            },
            {
              text: '第四門新花迫叫成局：',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: 'EX)',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '1♦ 1♥ 1♠ 2♣（＊）',
            },
          ],
        },
        {
          kind: 'rules',
          items: [
            {
              text: '詢問高花三張之支持',
            },
            {
              text: '此門有擋叫NT',
            },
            {
              text: '澄清牌型及點力範圍',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '唯一例外：',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '1♣ 1♦ 1♥ 1♠（＊僅迫叫一圈）',
            },
          ],
        },
      ],
    },
    {
      id: 'opener-strong',
      title: '開叫者強叫',
      originalTitle: '開叫者強叫',
      blocks: [
        {
          kind: 'paragraph',
          text: '倒叫：16-21點。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1D', '', '1S', '', '2H', '', '?'],
          },
          rows: [
            {
              call: '2S',
              meaning: '6-9點，不迫叫，5張↑♠。',
            },
            {
              call: '2NT',
              meaning: 'Leb 轉換3c',
            },
            {
              call: '3C',
              meaning: '第四門新花迫叫成局，10點↑。',
            },
            {
              call: '3D',
              meaning: '10點↑，方塊三張以上支持 迫叫成局',
            },
            {
              call: '3H',
              meaning: '6-9點，4張♥，邀請。',
            },
            {
              call: '3S',
              meaning: '10點↑，迫叫成局，6張↑♠。',
            },
            {
              call: '3NT',
              meaning: '9-10點，未叫花色有擋。',
            },
            {
              call: '4D',
              meaning: '13點↑，迫叫，♦fit（配合）。',
            },
            {
              call: '4H',
              meaning: '10-14點，4張♥ 沒有滿貫可能SIGN OFF（束叫）。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '跳叫新花：19-21點，迫叫成局。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1D', '', '1H', '', '?'],
          },
          rows: [
            {
              call: '2S',
              meaning: '5♦↑＋4♠。',
            },
          ],
        },
      ],
    },
    {
      id: 'overcall',
      title: '遭受敵方插叫之後',
      originalTitle: '遭受敵方插叫之後',
      blocks: [
        {
          kind: 'paragraph',
          text: '同伴開叫 1♦，敵方蓋叫 1♠，輪到你：',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '加一支持：6-9點，最少4張。',
            },
            {
              text: '加二支持：10-12點，最好5張。',
            },
            {
              text: '示叫敵叫組：13點以上，最少4張支持，迫叫成局。',
            },
            {
              text: '二階新花答叫：10點↑，迫叫，5張↑牌組。',
            },
            {
              text: '回答 1NT：6-9點，♠有擋。',
            },
            {
              text: '2NT：10-12點，♠有擋。',
            },
            {
              text: '3NT：13-15點，♠有擋。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1D', '1S', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: 'Negative，4張♥↑。（可能10點↓，4張♥牌組）',
            },
            {
              call: '2D',
              meaning: '6-9點。',
            },
            {
              call: '3D',
              meaning: '10-12點。',
            },
            {
              call: '2S',
              meaning: '13點以上，迫叫成局。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1C/D', '1H', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '通常4張♠。（直接叫1♠，5張↑）',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1C', '1D', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '兩門高花4-4。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1D', '2C', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '高花至少4-3。',
              pending: '現行遭插叫後二階新花答叫（本講義 10 點↑迫叫）是否仍只迫叫一圈，待確認。',
            },
          ],
        },
      ],
    },
    {
      id: 'after-double',
      title: '在敵方迫叫賭倍之後',
      originalTitle: '在敵方迫叫賭倍之後',
      blocks: [
        {
          kind: 'paragraph',
          text: '同伴 1♣/♦，敵方 X，輪到你：',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '一線新花迫叫：一階上叫出新花為迫叫（視同未賭倍）。',
            },
            {
              text: '二階叫牌組（無跳叫）：不迫叫5-9點，好牌組',
            },
            {
              text: '跳新花：跳叫新花竄叫表示長門及一手弱牌，通常3-7點，6張牌組。',
            },
            {
              text: '1NT：6-9點。',
            },
            {
              text: 'XX：10點↑。',
            },
            {
              text: '加一支持：6-9點，防禦力量，♣/♦配合。',
            },
            {
              text: '加二支持：搶先阻塞叫，無防禦力量，♣/♦配合。',
            },
            {
              text: '2NT：10-12點，有限加叫，至少4張王牌支持',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: 'EX)',
        },
        {
          kind: 'hand',
          hand: {
            spades: 'Kxx',
            hearts: 'xx',
            diamonds: 'AQxxx',
            clubs: 'xxx',
          },
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1D', 'X', '?'],
          },
          rows: [
            {
              call: '2NT',
              meaning: '10-12點，♦fit，邀請牌力。',
            },
          ],
        },
      ],
    },
    {
      id: 'inverted-minors',
      title: '低花反序',
      originalTitle: '☆☆低花反序REVERSED MINORS☆☆',
      summary: '新生請先忽略這段',
      blocks: [
        {
          kind: 'paragraph',
          text: '(新生請先忽略這段)',
        },
      ],
      children: [
        {
          id: 'inverted-opener',
          title: '(1) 1♦ 2♦ ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1D', '', '2D', '', '?'],
              },
              rows: [
                {
                  call: '2H/S/3C',
                  meaning: '非低限開叫，所叫花色有擋。',
                },
                {
                  call: '2NT',
                  meaning: '13-14點，平均牌型。',
                },
                {
                  call: '3D',
                  meaning: '低限，不平均牌型。',
                },
                {
                  call: '3H/S/4C',
                  meaning: '15點↑，Splinter。',
                },
                {
                  call: '3NT',
                  meaning: '19-21點，平均牌型。',
                  pending:
                    '1♣ 2♣ 低花反序時 3NT 為 18-19 點，此處 1♦ 2♦ 為 19-21 點，是否一致待確認。',
                },
              ],
            },
          ],
        },
        {
          id: 'inverted-responder',
          title: '(2) 1♦ 2♦ 2♥ ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1D', '', '2D', '', '2H', '', '?'],
              },
              rows: [
                {
                  call: '2S/3C/H',
                  meaning: '非低限答叫，所叫花色有擋。',
                },
                {
                  call: '2NT',
                  meaning: '10-12點，低限支持。',
                },
                {
                  call: '3D',
                  meaning: '低限答叫，不平均牌型。',
                },
                {
                  call: '3S/4C',
                  meaning: 'Splinter。',
                },
                {
                  call: '3NT',
                  meaning: '束叫。',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
