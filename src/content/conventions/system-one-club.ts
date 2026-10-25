import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 開叫1♣（自然制講義） — from the club's old handbook 淡江大學-我們的制度(修訂版) (2010, 13-point
 * openings). Transcribed verbatim from docs/淡江大學-我們的制度(修訂版).doc; bids and suit letters use
 * suit symbols. Notes marked 現行制度 apply the current system (12-point openings, 1NT 15-17,
 * 2NT 20-21, 2♣ 22+, 1NT forcing, 2/1 game forcing); notes marked 以特約為準 point to the
 * convention that overrides the handbook. Generated from a hand-cleaned transcription.
 */

const seats0: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']

export const systemOneClub: Convention = {
  slug: 'system-one-club',
  nameZh: '開叫1♣（自然制講義）',
  nameEn: '1♣ Opening (Natural System)',
  aliases: ['開叫1C', '1C開叫', '1♣'],
  category: 'system',
  kind: 'system',
  level: 'basic',
  tags: ['舊講義', '1♣ 開叫', '答叫', '再叫', '低花反序'],
  summary:
    '第二章：開叫 1♣（13-21 點，保證 2 張♣↑）的答叫、開叫者再叫、低花修正叫、強支持與低花反序。',
  source: {
    title: '淡江大學-我們的制度(修訂版)',
    note: '第二章 開叫 1♣',
  },
  updated: '2026-10-22',
  sections: [
    {
      id: 'responses',
      title: '答叫：1♣ ?',
      originalTitle: '第 二 章 開叫 1♣ 13-21點，保證2張♣↑',
      summary: '6 點↑一線新花、1NT 6-9、2♣ 6-9、跳叫弱、2NT/3♣ 邀請、3NT 13-15',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**現行制度**：12 點開叫；1♣ 的牌組長度與答叫意義照本講義。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1C', '', '?'],
          },
          rows: [
            {
              call: '1D/H/S',
              meaning:
                '6點↑，4張↑牌組；答叫者為高花4-4時先答叫♥；高花5-4，先答叫較長花色；高花5-5（6-9或12+先叫♥，9-11先叫♠）；答叫者倒叫為迫叫成局。',
            },
            {
              call: '1NT',
              meaning: '6-9點，平均牌型（至少會有4張↑梅花）。',
            },
            {
              call: '2C',
              meaning: '6-9點，5張♣↑牌組',
            },
            {
              call: '2D/H/S',
              meaning: '5點以下，6張牌組之弱叫',
            },
            {
              call: '2NT',
              meaning: '10-12點，平均牌型，邀請3NT。',
            },
            {
              call: '3C',
              meaning: '10-12點，5張↑牌組。',
            },
            {
              call: '3D/H/S',
              meaning: '5點以下，7張以上牌組之弱叫',
            },
            {
              call: '3NT',
              meaning: '13-15點，平均牌型。',
              pending:
                '本表 2♣ 為 6-9 點；本章後段「低花反序」的 1♣ 2♣ 為 10 點以上迫叫至 2NT，現行採用哪一種待確認。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '13-15點4-4低花時，開叫1♣；5-4低花開叫較長之花色。',
        },
        {
          kind: 'paragraph',
          text: '例：低花4-4平均牌型時',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '1♣ 1♠ 1NT',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '1NT：13-15點，無4張♠，平均牌型，可能有四張♣。',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '2♣ ：為13-15點，5張以上的梅花牌組，',
            },
          ],
        },
      ],
    },
    {
      id: 'splinter',
      title: 'Splinter',
      summary: '二級跳叫新花：迫叫成局、8 張↑配合、所叫花色單張或缺門',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Splinter：對同伴開叫花色做二級跳叫，代表有迫叫成局的點力，對同伴所叫花色加起來有八張以上的支持，所叫花色為單張或缺門。',
        },
        {
          kind: 'hand',
          label: 'Ex) 自己',
          hand: {
            spades: 'AQJ4',
            hearts: 'AJ73',
            diamonds: '6',
            clubs: 'AK64',
          },
        },
        {
          kind: 'paragraph',
          text: '自己 1♣，同伴 1♥，自己 4♦＊（＊Splinter）',
        },
      ],
    },
    {
      id: 'rebids',
      title: '開叫1♣之後續發展',
      originalTitle: '☆開叫1C之後續發展',
      children: [
        {
          id: 'after-1d',
          title: '(1) 1♣ 1♦ ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1C', '', '1D', '', '?'],
              },
              rows: [
                {
                  call: '1H/S',
                  meaning: '13-18點，4張♥/♠。',
                },
                {
                  call: '1NT',
                  meaning: '13-14點，無4張♥或♠，平均牌型。',
                },
                {
                  call: '2C',
                  meaning: '13-15點，5張↑♣，不平均牌型。',
                },
                {
                  call: '2D',
                  meaning: '13-15點，4張↑♦。',
                },
                {
                  call: '2H/S',
                  meaning: '19-21點，5張↑♣＋4張♥/♠。(跳叫新花)',
                },
                {
                  call: '2NT',
                  meaning: '18-19點，平均牌型。注: (15-17開叫1NT. 20-21開叫2NT)',
                },
                {
                  call: '3C',
                  meaning: '16-18點，6張↑♣。',
                },
                {
                  call: '3D',
                  meaning: '16-18點，4張↑♦。',
                },
                {
                  call: '3H/S',
                  meaning: 'Splinter，19-21點，4張↑♦配合。',
                },
                {
                  call: '3NT',
                  meaning: '13~18點，堅強♣牌組6張↑。',
                },
              ],
            },
          ],
        },
        {
          id: 'after-1h',
          title: '(2) 1♣ 1♥ ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1C', '', '1H', '', '?'],
              },
              rows: [
                {
                  call: '1S',
                  meaning: '13-18點，4張↑♠。',
                },
                {
                  call: '1NT',
                  meaning: '13-14點，否認有4張♠，也沒有4張♥。',
                },
                {
                  call: '2C',
                  meaning: '13-15點，5張↑♣，不平均牌型。',
                },
                {
                  call: '2D',
                  meaning: '16-18點，4張↑♦，倒叫。',
                },
                {
                  call: '2H',
                  meaning: '13-15點，4張♥。',
                },
                {
                  call: '2S',
                  meaning: '19-21點，5張↑♣＋4♠。',
                },
                {
                  call: '2NT',
                  meaning: '18-19點，平均牌型，若為20-21點平均牌型可開叫2NT。',
                },
                {
                  call: '3C',
                  meaning: '16-18點，6張↑♣。',
                },
                {
                  call: '3D',
                  meaning: '19-21點，4張↑♦，跳叫。',
                },
                {
                  call: '3H',
                  meaning: '16-18點，4張♥。',
                },
                {
                  call: '3NT',
                  meaning: '13~18點，堅強♣牌組6張↑。',
                },
                {
                  call: '3S/4D',
                  meaning: 'Splinter，19-21點，4張♥配合。',
                },
                {
                  call: '4H',
                  meaning: '19-21點，4張♥支持，沒有單張或缺門。',
                },
              ],
            },
          ],
        },
        {
          id: 'after-1s',
          title: '(3) 1♣ 1♠ ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1C', '', '1S', '', '?'],
              },
              rows: [
                {
                  call: '1NT',
                  meaning: '13-14點，無4張♠。',
                },
                {
                  call: '2C',
                  meaning: '13-15點，5張↑♣，不平均牌型。',
                },
                {
                  call: '2D/H',
                  meaning: '16-18點，4張↑♦/♥，倒叫。',
                },
                {
                  call: '2S',
                  meaning: '13-15點，4張♠。',
                },
                {
                  call: '2NT',
                  meaning: '18-19點，平均牌型。',
                },
                {
                  call: '3C',
                  meaning: '16-18點，6張♣↑。',
                },
                {
                  call: '3D/H',
                  meaning: '19-21點，4張↑，跳叫。',
                },
                {
                  call: '3S',
                  meaning: '16-18點，4張♠。',
                },
                {
                  call: '3NT',
                  meaning: '13~18點，堅強♣牌組6張↑。',
                },
                {
                  call: '4D/H',
                  meaning: 'Splinter，19-21點，4張♠。所叫牌組為單張or缺門。',
                },
                {
                  call: '4S',
                  meaning: '19-21點，4張♠支持，沒有單張或缺門。',
                },
              ],
            },
          ],
        },
        {
          id: 'after-1nt',
          title: '(4) 1♣ 1NT ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1C', '', '1NT', '', '?'],
              },
              rows: [
                {
                  call: '2C',
                  meaning: '13-15點，5張♣↑。',
                },
                {
                  call: '2D/H/S',
                  meaning: '16-18點，倒叫，5張↑♣＋4張♦/♥/♠以上。',
                },
                {
                  call: '2NT',
                  meaning: '16-18邀請3NT',
                },
                {
                  call: '3D/H/S',
                  meaning: '19-21點，跳叫，5張↑♣＋4張♦/♥/♠以上。',
                },
                {
                  call: '3NT',
                  meaning: '束叫。',
                },
              ],
            },
          ],
        },
        {
          id: 'after-2nt',
          title: '(5) 1♣ 2NT ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1C', '', '2NT', '', '?'],
              },
              rows: [
                {
                  call: '3D/H/S',
                  meaning: '5♣＋4♦/♥/♠不平均牌型，16+，try slam（♣一定有fit）',
                },
                {
                  call: '3C',
                  meaning: '低限，5張♣↑，不迫叫。',
                },
                {
                  call: '3NT',
                  meaning: '高限，束叫。',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'minor-correction',
      title: '低花修正叫',
      originalTitle: '☆低花修正叫',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1C', '', '1H', '', '1S', '', '?'],
          },
          rows: [
            {
              call: '2C',
              meaning: '6-9點，4張♥↑，4張♣↑，不迫叫。',
            },
            {
              call: '3C',
              meaning: '10-12點，邀請，4張♥，5張♣。',
            },
          ],
        },
      ],
    },
    {
      id: 'strong-raise',
      title: '開叫者的強支持',
      originalTitle: '☆開叫者的強支持',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1C', '', '1H', '', '3H', '', '?'],
          },
          rows: [
            {
              call: '3S/4C/D',
              meaning: 'CUE BID好牌，表示控制。',
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
            seats: seats0,
            calls: ['1C', '', '1S', '', '3S', '', '?'],
          },
          rows: [
            {
              call: '4C/D/H',
              meaning: 'CUE BID好牌，表示控制。',
            },
            {
              call: '4S',
              meaning: '束叫。',
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
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1C', '', '?'],
          },
          rows: [
            {
              call: '2C',
              meaning: '10點以上，通常五張，且無四張高花，迫叫到2NT。',
            },
            {
              call: '3C',
              meaning: '阻塞，6-9點，5張↑支持。',
            },
            {
              call: '4C',
              meaning: '阻塞，6張↑支持。',
            },
          ],
        },
      ],
      children: [
        {
          id: 'inverted-opener',
          title: '(1) 1♣ 2♣ ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1C', '', '2C', '', '?'],
              },
              rows: [
                {
                  call: '2D/H/S',
                  meaning: '4張牌組，非低限開叫。',
                },
                {
                  call: '2NT',
                  meaning: '13-14點，3張↑♣，平均牌型低限。',
                },
                {
                  call: '3C',
                  meaning: '低限，不平均牌型。',
                },
                {
                  call: '3D/H/S',
                  meaning: '15點↑，Splinter。',
                },
                {
                  call: '3NT',
                  meaning: '18-19點，平均牌型。',
                },
              ],
            },
          ],
        },
        {
          id: 'inverted-responder',
          title: '(2) 1♣ 2♣ 2♦ ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['1C', '', '2C', '', '2D', '', '?'],
              },
              rows: [
                {
                  call: '2H/S/3D',
                  meaning: '牌組，GF。',
                },
                {
                  call: '2NT',
                  meaning: '10-12點，低限支持，5張↑♣。',
                },
                {
                  call: '3C',
                  meaning: '低限答叫，不平均牌型。',
                },
                {
                  call: '3H/S/4D',
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
