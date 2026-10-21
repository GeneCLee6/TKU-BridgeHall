import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 開叫高花之滿貫詢問叫（舊版）: 1S 2NT and 1H 2S, the 2011 version
 * Source: docs/1S 2NT舊版(doblue 20110719).doc (the club's Word file), transcribed verbatim; only bids and suit letters
 * were rewritten with suit symbols (3C -> 3♣, "H fit" -> "♥ fit").
 * Kept separately from jacoby-2nt (the current version).
 * Generated from the Word text, then checked against the source section by section.
 */

const openerFirst: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']

export const majorSlamAsk2011: Convention = {
  slug: 'major-slam-ask-2011',
  nameZh: '開叫高花之滿貫詢問叫（舊版）',
  nameEn: 'Major Slam Ask (2011 version)',
  aliases: ['1S 2NT舊版', '1S 2NT', '1H 2S', '舊版J2N', 'doblue'],
  category: 'suit-openings',
  tags: ['高花開叫', '滿貫詢問', '舊版', '短門', 'RKCB'],
  summary:
    '2011 年的舊版：1♠ 2NT、1♥ 2♠ 的滿貫詢問，開叫者報短門／平均牌型，加一詢問點力與牌型。新版見「開叫高花之滿貫詢問叫」。',
  source: {
    title: '1S 2NT舊版(doblue 20110719)',
  },
  updated: '2026-10-21',
  sections: [
    {
      id: 'one-spade',
      title: '開叫1♠：1♠ 2NT',
      originalTitle: '開叫1S時的滿貫詢問叫（2NT）',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: [
              '1S',
              '',
              {
                call: '2NT',
                note: '12+，4張♠+或13點+，3張♠',
              },
              '',
              '?',
            ],
          },
          rows: [
            {
              call: '3C',
              meaning: '短門♣ or 13~15平均牌型 or 5521、6511',
            },
            {
              call: '3D',
              meaning: '短門♦ or 16-18平均牌型',
            },
            {
              call: '3H',
              meaning: '短門♥ or 19~21平均牌型',
            },
            {
              call: '3S',
              meaning: '5422牌型，13~15',
            },
            {
              call: '3NT',
              meaning: '5422牌型，16~21',
            },
            {
              call: '4C',
              meaning: '♣ void',
            },
            {
              call: '4D',
              meaning: '♦ void',
            },
            {
              call: '4H',
              meaning: '♥ void',
            },
          ],
        },
      ],
      children: [
        {
          id: 'spade-relay',
          title: '開叫者3♣、3♦、3♥之後續詢問答叫',
          originalTitle: '◎ 開叫者3C or 3D or 3H之後續詢問答叫',
          blocks: [
            {
              kind: 'paragraph',
              text: '加一花色為詢問，回答原則下面有說明，加二以上之旁花色為短門詢問',
            },
            {
              kind: 'paragraph',
              text: '（絕大部份還是以加一詢問為優先叫品）',
            },
            {
              kind: 'paragraph',
              text: '3♣加一詢問之答叫方式，+1為5521，+2為平均牌型，+3以上皆是短門報法：',
            },
            {
              kind: 'rules',
              items: [
                {
                  text: '+1  5521 or 6511',
                },
                {
                  text: '+2  平均牌型',
                },
                {
                  text: '+3  5張♠，13~15，5431',
                },
                {
                  text: '+4  6張♠，13~15，6331 or 6421',
                },
                {
                  text: '+5  5張♠，16~18，5431',
                },
                {
                  text: '+6  6張♠，16~18，6331 or 6421',
                },
                {
                  text: '+7  5張♠，19~21，5431',
                },
                {
                  text: '+8  6張♠，19~21，6331 or 6421',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '例如：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '1S',
                  '',
                  '2NT',
                  '',
                  '3C',
                  '',
                  {
                    call: '3D',
                    note: '詢問',
                  },
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '3H',
                  meaning: '5521 or 6511（答叫方式詳後述）',
                },
                {
                  call: '3S',
                  meaning: '13~15平均牌型',
                },
                {
                  call: '3NT',
                  meaning: '5張♠，13~15，5431',
                },
                {
                  call: '4C',
                  meaning: '6張♠，13~15，6331 or 6421',
                },
                {
                  call: '4D',
                  meaning: '5張♠，16~18，5431',
                },
                {
                  call: '4H',
                  meaning: '6張♠，16~18，6331 or 6421',
                },
                {
                  call: '4S',
                  meaning: '5張♠，19~21，5431',
                },
                {
                  call: '4NT',
                  meaning: '6張♠，19~21，6331 or 6421',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '3♦後加一詢問之答叫方式，+1為平均牌型，+2以上皆是短門報法：',
            },
            {
              kind: 'rules',
              items: [
                {
                  text: '+1  平均牌型',
                },
                {
                  text: '+2  5張♠，13~15，5431',
                },
                {
                  text: '+3  6張♠，13~15，6331 or 6421',
                },
                {
                  text: '+4  5張♠，16~18，5431',
                },
                {
                  text: '+5  6張♠，16~18，6331 or 6421',
                },
                {
                  text: '+6  5張♠，19~21，5431',
                },
                {
                  text: '+7  6張♠，19~21，6331 or 6421',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '例如：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '1S',
                  '',
                  '2NT',
                  '',
                  '3D',
                  '',
                  {
                    call: '3H',
                    note: '詢問',
                  },
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '3S',
                  meaning: '平均牌型16~18',
                },
                {
                  call: '3NT',
                  meaning: '5張♠，13~15，5431',
                },
                {
                  call: '4C',
                  meaning: '6張♠，13~15，6331 or 6421',
                },
                {
                  call: '4D',
                  meaning: '5張♠，16~18，5431',
                },
                {
                  call: '4H',
                  meaning: '6張♠，16~18，6331 or 6421',
                },
                {
                  call: '4S',
                  meaning: '5張♠，19~21，5431',
                },
                {
                  call: '4NT',
                  meaning: '6張♠，19~21，6331 or 6421',
                },
              ],
            },
          ],
        },
        {
          id: 'spade-notes',
          title: '其他注意事項',
          originalTitle: '※ 其他注意事項',
          blocks: [
            {
              kind: 'paragraph',
              text: '1.當開叫者答叫為平均牌型時，答叫者加一為詢問王牌張數（+1為5張，+2為6張，+3為7張），加二以上之新花為短門詢問。',
            },
            {
              kind: 'paragraph',
              text: '例如：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '1S',
                  '',
                  '2NT',
                  '',
                  '3C',
                  '',
                  {
                    call: '3D',
                    note: '詢問牌型及點力',
                  },
                  '',
                  '3S',
                  '',
                  {
                    call: '3NT',
                    note: '詢問♠張數',
                  },
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '4C',
                  meaning: '5張♠',
                },
                {
                  call: '4D',
                  meaning: '6張♠',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '2.7張以上的♠幾乎不太可能，萬一真的有，看點力高低限決定是否高叫，例如13~15的好牌7張可以選擇當16~18叫。',
            },
            {
              kind: 'paragraph',
              text: '3.答叫者越過4NT，5線其他花色為要求第二控去6線。',
            },
            {
              kind: 'paragraph',
              text: '例如：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '1S',
                  '',
                  '2NT',
                  '',
                  '3H',
                  '',
                  {
                    call: '3S',
                    note: '詢問牌型及點力',
                  },
                  '',
                  '4D',
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '5C',
                  meaning: '要求♣第二控去6♠',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '4.開叫者回答時若已越過4♠時，答叫者加一即為RKCB，回叫方式同',
              pending: '句子未完，推測為「回叫方式同 RKCB」。',
            },
            {
              kind: 'paragraph',
              text: '例如：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '1S',
                  '',
                  '2NT',
                  '',
                  '3H',
                  '',
                  {
                    call: '3S',
                    note: '詢問牌型及點力',
                  },
                  '',
                  '4NT',
                  '',
                  {
                    call: '5C',
                    note: 'RKCB',
                  },
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '5D',
                  meaning: '14',
                },
                {
                  call: '5H',
                  meaning: '03',
                },
                {
                  call: '5S',
                  meaning: '25沒王Q',
                },
                {
                  call: '5NT',
                  meaning: '25有王Q',
                },
              ],
            },
          ],
        },
        {
          id: 'spade-5521',
          title: '5521之答叫方式',
          originalTitle: '○ 5521之答叫方式',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '1S',
                  '',
                  '2NT',
                  '',
                  '3C',
                  '',
                  {
                    call: '3D',
                    note: '詢問',
                  },
                  '',
                  '3H',
                  '',
                  {
                    call: '3S',
                    note: '詢問',
                  },
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '3NT',
                  meaning: '短門花色及下一階級長門花色，4♣為詢問',
                },
                {
                  call: '4C',
                  meaning: '♣短＋5張♥↑（短門＋下二級長門花色）',
                },
                {
                  call: '4D',
                  meaning: '♦短＋5張♣↑（短門＋下二級長門花色）',
                },
                {
                  call: '4H',
                  meaning: '♥短＋5張♦↑（短門＋下二級長門花色）',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '1S',
                  '',
                  '2NT',
                  '',
                  '3C',
                  '',
                  {
                    call: '3D',
                    note: '詢問',
                  },
                  '',
                  '3H',
                  '',
                  {
                    call: '3S',
                    note: '詢問',
                  },
                  '',
                  '3NT',
                  '',
                  {
                    call: '4C',
                    note: '詢問',
                  },
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '4D',
                  meaning: '♦短＋5張♥↑',
                },
                {
                  call: '4H',
                  meaning: '♥短＋5張♣↑',
                },
                {
                  call: '4S',
                  meaning: '♣短＋5張♦↑',
                },
              ],
            },
          ],
        },
        {
          id: 'spade-after-3s',
          title: '開叫者3♠之後續答叫',
          originalTitle: '◎ 開叫者3S之後續答叫',
          blocks: [
            {
              kind: 'paragraph',
              text: '加一之3NT為詢問4張之牌組，加二以上新花為短門詢問（點力不會是低限，不然1♠後直接使用splinter即可）：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['1S', '', '2NT', '', '3S', '', '?'],
              },
              rows: [
                {
                  call: '3NT',
                  meaning: '詢問4張之牌組',
                },
                {
                  call: '4C',
                  meaning: '♣短門，CHECK好壞牌',
                },
                {
                  call: '4D',
                  meaning: '♦短門，CHECK好壞牌',
                },
                {
                  call: '4H',
                  meaning: '♥短門，CHECK好壞牌',
                },
              ],
            },
            {
              kind: 'note',
              tone: 'info',
              text: 'P.S.開叫者好牌時，從最低新花叫起',
            },
            {
              kind: 'paragraph',
              text: '例如：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['1S', '', '2NT', '', '3S', '', '4D', '', '?'],
              },
              rows: [
                {
                  call: '4H',
                  meaning: '-- 好牌，♦沒廢點',
                },
                {
                  call: '4S',
                  meaning: '-- 爛牌，♦有廢點',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['1S', '', '2NT', '', '3S', '', '4H', '', '?'],
              },
              rows: [
                {
                  call: '4S',
                  meaning: '-- 爛牌，♥有廢點',
                },
                {
                  call: '4NT',
                  meaning: '- 好牌，♥沒廢點',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['1S', '', '2NT', '', '3S', '', '4H', '', '4NT', '', '?'],
              },
              rows: [
                {
                  call: '5C',
                  meaning: 'RKCB',
                },
              ],
            },
          ],
        },
        {
          id: 'spade-after-3nt',
          title: '開叫者3NT、4♣、4♦、4♥之後續答叫',
          originalTitle: '◎ 開叫者3NT之後續答叫',
          blocks: [
            {
              kind: 'paragraph',
              text: '原則同3♠後續叫品，不過捨棄♣短門詢問的叫品，加一之4♣為詢問4張之牌組，加二以上新花為短門詢問：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['1S', '', '2NT', '', '3NT', '', '?'],
              },
              rows: [
                {
                  call: '4C',
                  meaning: '詢問4張之牌組',
                },
                {
                  call: '4D',
                  meaning: '♦短門，CHECK好壞牌',
                },
                {
                  call: '4H',
                  meaning: '♥短門，CHECK好壞牌',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '**◎ 開叫者4♣、4♦、4♥之後續答叫**',
            },
            {
              kind: 'paragraph',
              text: '叫新花為好牌（不適合RKCB的牌），4♠為爛牌，4NT為RKCB',
            },
          ],
        },
      ],
    },
    {
      id: 'one-heart',
      title: '開叫1♥：1♥ 2♠',
      originalTitle: '開叫1H時的滿貫詢問叫（2S）',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: [
              '1H',
              '',
              {
                call: '2S',
                note: '12+，4張♥+或13點+，3張♥',
              },
              '',
              '?',
            ],
          },
          rows: [
            {
              call: '2NT',
              meaning: '短門♠ or 13~15平均牌型or 5521、6511',
            },
            {
              call: '3C',
              meaning: '短門♣ or 16-18平均牌型',
            },
            {
              call: '3D',
              meaning: '短門♦ or 19~21平均牌型',
            },
            {
              call: '3H',
              meaning: '5422牌型，13~15',
            },
            {
              call: '3S',
              meaning: '5422牌型，16~21',
            },
            {
              call: '3NT',
              meaning: '♠ void',
            },
            {
              call: '4C',
              meaning: '♣ void',
            },
            {
              call: '4D',
              meaning: '♦ void',
            },
          ],
        },
      ],
      children: [
        {
          id: 'heart-relay',
          title: '開叫者2NT、3♣、3♦之後續答叫',
          originalTitle: '◎ 開叫者2NT or 3C or 3D後之後續答叫',
          blocks: [
            {
              kind: 'paragraph',
              text: '加一花色為詢問，回答原則下面有說明，加二以上之旁花色為短門詢問',
            },
            {
              kind: 'paragraph',
              text: '（絕大部份還是以加一詢問為優先叫品）',
            },
            {
              kind: 'paragraph',
              text: '2NT加一詢問之答叫方式，+1為5521，+2為平均牌型，+3以上皆是短門報法：',
              pending:
                '開叫 1♥，+3～+8 寫的是 5／6 張♠，疑應為♥（3♣ 後的說明寫♥）；下方例子的 3♠～4♠ 同樣待確認。',
            },
            {
              kind: 'rules',
              items: [
                {
                  text: '+1  5521 or 6511',
                },
                {
                  text: '+2  平均牌型',
                },
                {
                  text: '+3  5張♠，13~15，5431',
                },
                {
                  text: '+4  6張♠，13~15，6331 or 6421',
                },
                {
                  text: '+5  5張♠，16~18，5431',
                },
                {
                  text: '+6  6張♠，16~18，6331 or 6421',
                },
                {
                  text: '+7  5張♠，19~21，5431',
                },
                {
                  text: '+8  6張♠，19~21，6331 or 6421',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '例如：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '1H',
                  '',
                  '2S',
                  '',
                  '2NT',
                  '',
                  {
                    call: '3C',
                    note: '詢問',
                  },
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '3D',
                  meaning: '5521 or 6511（答叫方式詳後述）',
                },
                {
                  call: '3H',
                  meaning: '13~15平均牌型',
                },
                {
                  call: '3S',
                  meaning: '5張♠，13~15，5431',
                },
                {
                  call: '3NT',
                  meaning: '6張♠，13~15，6331 or 6421',
                },
                {
                  call: '4C',
                  meaning: '5張♠，16~18，5431',
                },
                {
                  call: '4D',
                  meaning: '6張♠，16~18，6331 or 6421',
                },
                {
                  call: '4H',
                  meaning: '5張♠，19~21，5431',
                },
                {
                  call: '4S',
                  meaning: '6張♠，19~21，6331 or 6421',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '3♣後加一詢問之答叫方式，+1為平均牌型，+2以上皆是短門報法：',
            },
            {
              kind: 'rules',
              items: [
                {
                  text: '+1  平均牌型',
                },
                {
                  text: '+2  5張♥，13~15，5431',
                },
                {
                  text: '+3  6張♥，13~15，6331 or 6421',
                },
                {
                  text: '+4  5張♥，16~18，5431',
                },
                {
                  text: '+5  6張♥，16~18，6331 or 6421',
                },
                {
                  text: '+6  5張♥，19~21，5431',
                },
                {
                  text: '+7  6張♥，19~21，6331 or 6421',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '例如：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['1H', '', '2S', '', '3C', '', '3D', '', '?'],
              },
              rows: [
                {
                  call: '3H',
                  meaning: '平均牌型16~18',
                },
                {
                  call: '3S',
                  meaning: '5張♥，13~15，5431',
                },
                {
                  call: '3NT',
                  meaning: '6張♥，13~15，6331 or 6421',
                },
                {
                  call: '4C',
                  meaning: '5張♥，16~18，5431',
                },
                {
                  call: '4D',
                  meaning: '6張♥，16~18，6331 or 6421',
                },
                {
                  call: '4H',
                  meaning: '5張♥，19~21，5431',
                },
                {
                  call: '4S',
                  meaning: '6張♥，19~21，6331 or 6421',
                },
              ],
            },
          ],
        },
        {
          id: 'heart-notes',
          title: '其他注意事項',
          originalTitle: '※ 其他注意事項',
          blocks: [
            {
              kind: 'paragraph',
              text: '1.當開叫者答叫為平均牌型時，答叫者加一為詢問王牌張數（+1為5張，+2為6張，+3為7張），加二以上之新花為短門詢問。',
            },
            {
              kind: 'paragraph',
              text: '例如：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '1H',
                  '',
                  '2S',
                  '',
                  '2NT',
                  '',
                  {
                    call: '3C',
                    note: '詢問牌型及點力',
                  },
                  '',
                  '3H',
                  '',
                  {
                    call: '3S',
                    note: '詢問♥張數',
                  },
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '3NT',
                  meaning: '5張♥',
                },
                {
                  call: '4C',
                  meaning: '6張♥',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '2.7張以上的♥幾乎不太可能，萬一真的有，看點力高低限決定是否高叫，例如13~15的好牌7張可以選擇當16~18叫。',
            },
            {
              kind: 'paragraph',
              text: '3.H為王牌時，這時的RKCB為4♠，不是4NT，答叫者越過4♠，其他花色為要求第二控去6線。',
            },
            {
              kind: 'paragraph',
              text: '例如：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '1H',
                  '',
                  '2S',
                  '',
                  '3H',
                  '',
                  {
                    call: '3S',
                    note: '詢問',
                  },
                  '',
                  '4D',
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '4S',
                  meaning: 'RKCB',
                },
                {
                  call: '4NT',
                  meaning: '要求♠有第二控去6♥',
                },
                {
                  call: '5C',
                  meaning: '要求♣第二控去6♥',
                },
                {
                  call: '5D',
                  meaning: '要求♦第二控去6♥',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '4.開叫者回答時若已越過4♥時，答叫者加一即為RKCB，回叫方式同',
              pending: '句子未完，推測為「回叫方式同 RKCB」。',
            },
            {
              kind: 'paragraph',
              text: '例如：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '1H',
                  '',
                  '2S',
                  '',
                  '3D',
                  '',
                  {
                    call: '3H',
                    note: '詢問牌型及點力',
                  },
                  '',
                  '4S',
                  '',
                  {
                    call: '4NT',
                    note: 'RKCB',
                  },
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '5C',
                  meaning: '14',
                },
                {
                  call: '5D',
                  meaning: '03',
                },
                {
                  call: '5H',
                  meaning: '25沒王Q',
                },
                {
                  call: '5S',
                  meaning: '25有王Q',
                },
              ],
            },
          ],
        },
        {
          id: 'heart-5521',
          title: '5521之答叫方式',
          originalTitle: '○ 5521之答叫方式',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '1H',
                  '',
                  '2S',
                  '',
                  '2NT',
                  '',
                  {
                    call: '3C',
                    note: '詢問',
                  },
                  '',
                  '3D',
                  '',
                  {
                    call: '3H',
                    note: '詢問',
                  },
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '3S',
                  meaning: '短門花色及下一階級長門花色，3NT為詢問',
                },
                {
                  call: '3NT',
                  meaning: '♠短＋5張♦↑（短門＋下二級長門花色）',
                },
                {
                  call: '4C',
                  meaning: '♣短＋5張♠↑（短門＋下二級長門花色）',
                },
                {
                  call: '4D',
                  meaning: '♦短＋5張♣↑（短門＋下二級長門花色）',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '1H',
                  '',
                  '2S',
                  '',
                  '2NT',
                  '',
                  {
                    call: '3C',
                    note: '詢問',
                  },
                  '',
                  '3D',
                  '',
                  {
                    call: '3H',
                    note: '詢問',
                  },
                  '',
                  '3S',
                  '',
                  {
                    call: '3NT',
                    note: '詢問',
                  },
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '4C',
                  meaning: '♣短＋5張♦↑',
                },
                {
                  call: '4D',
                  meaning: '♦短＋5張♠↑',
                },
                {
                  call: '4H',
                  meaning: '♠短＋5張♣↑',
                },
              ],
            },
          ],
        },
        {
          id: 'heart-after-3h',
          title: '開叫者3♥之後續答叫',
          originalTitle: '◎ 開叫者3H之後續答叫',
          blocks: [
            {
              kind: 'paragraph',
              text: '加一之3♠為詢問4張之牌組，加二以上為短門詢問（點力不會是低限，不然1♥後直接使用splinter即可）：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['1H', '', '2S', '', '3H', '', '?'],
              },
              rows: [
                {
                  call: '3S',
                  meaning: '詢問4張之牌組',
                },
                {
                  call: '3NT',
                  meaning: '♠短門，CHECK好壞牌',
                },
                {
                  call: '4C',
                  meaning: '♣短門，CHECK好壞牌',
                },
                {
                  call: '4D',
                  meaning: '♦短門，CHECK好壞牌',
                },
              ],
            },
            {
              kind: 'note',
              tone: 'info',
              text: 'P.S.開叫者好牌時，從最低新花叫起',
            },
            {
              kind: 'paragraph',
              text: '例如：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['1H', '', '2S', '', '3H', '', '4C', '', '?'],
              },
              rows: [
                {
                  call: '4D',
                  meaning: '-- 好牌，♣沒廢點',
                },
                {
                  call: '4H',
                  meaning: '-- 爛牌，♣有廢點',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['1H', '', '2S', '', '3H', '', '4D', '', '?'],
              },
              rows: [
                {
                  call: '4H',
                  meaning: '-- 爛牌，♦有廢點',
                },
                {
                  call: '4S',
                  meaning: '-- 好牌，♦沒廢點',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['1H', '', '2S', '', '3H', '', '4D', '', '4S', '', '?'],
              },
              rows: [
                {
                  call: '4NT',
                  meaning: 'RKCB',
                },
                {
                  call: '5C',
                  meaning: '要求♣第二控去6♠',
                  pending: '♥ 為王牌，「去6♠」疑應為「去6♥」，下一列 5♦ 同。',
                },
                {
                  call: '5D',
                  meaning: '要求♦第二控去6♠',
                },
              ],
            },
          ],
        },
        {
          id: 'heart-after-3s',
          title: '開叫者3♠、3NT、4♣、4♦之後續答叫',
          originalTitle: '◎ 開叫者3S之後續答叫',
          blocks: [
            {
              kind: 'paragraph',
              text: '原則同3♥後續叫品，不過捨棄♠短門詢問的叫品，加一之3NT為詢問4張之牌組，加二以上新花為短門詢問：',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['1H', '', '2S', '', '3S', '', '?'],
              },
              rows: [
                {
                  call: '3NT',
                  meaning: '詢問4張之牌組',
                },
                {
                  call: '4C',
                  meaning: '♣短門，CHECK好壞牌',
                },
                {
                  call: '4D',
                  meaning: '♦短門，CHECK好壞牌',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '**◎ 開叫者3NT、4♣、4♦之後續答叫**',
            },
            {
              kind: 'paragraph',
              text: '新花為好牌（不適合RKCB的牌），4♥為爛牌，4♠為RKCB',
            },
          ],
        },
      ],
    },
  ],
}
