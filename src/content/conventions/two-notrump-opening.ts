import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 開叫2NT及答叫 (2NT opening and responses, ppq 終極版)
 * Source: docs/開叫2NT答叫(ppq終極版20130511).doc (the club's Word file), transcribed verbatim; only bids and suit letters
 * were rewritten with suit symbols (3C -> 3♣, "H fit" -> "♥ fit").
 * The 4NT/5NT continuation tables start with responder's call, so those auctions start with responder.
 * Generated from the Word text, then checked against the source section by section.
 */

const openerFirst: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']
const responderFirst: Auction['seats'] = ['答叫者', '敵方', '開叫者', '敵方']

export const twoNotrumpOpening: Convention = {
  slug: 'two-notrump-opening',
  nameZh: '開叫2NT及答叫',
  nameEn: '2NT Opening and Responses',
  aliases: ['2NT', '2NT開叫', '開叫2NT', 'puppet', '轉換'],
  category: 'notrump',
  kind: 'system',
  level: 'intermediate',
  cardSlots: [
    'wbf.openings.2NT.description <- opening#0',
    'wbf.openings.2NT.responses <- responses#0',
    'wbf.openings.2NT.subsequent <- puppet',
  ],
  tags: ['2NT 開叫', 'Puppet', '轉換', '短門詢問', 'RKCB'],
  summary:
    '開叫 2NT（20~21 平均牌）：Puppet Stayman、高花與低花轉換、高花 55、4NT 邀請與 5NT 迫叫，以及各叫品的詳細後續。',
  source: {
    title: '開叫2NT答叫(ppq終極版20130511)',
    note: '文件標題：開叫2NT及答叫',
  },
  updated: '2026-10-21',
  sections: [
    {
      id: 'opening',
      title: '開叫2NT',
      blocks: [
        {
          kind: 'paragraph',
          text: '開叫2NT：20~21平均牌型（可以為高花之5332或是低花之5332、6322）',
        },
      ],
    },
    {
      id: 'rules',
      title: 'Rule 說明',
      originalTitle: 'Rule說明:',
      summary: '依答叫者牌型（一門高花、一門低花、兩門高花、高低花、兩門低花）的叫法。',
      children: [
        {
          id: 'one-major',
          title: '一門高花',
          originalTitle: '※ 一門高花：',
          blocks: [
            {
              kind: 'rules',
              items: [
                {
                  text: '轉換後pass為束叫',
                },
                {
                  text: '轉換後叫NT表示5張',
                },
                {
                  text: '轉換後叫4線王牌為束叫',
                },
                {
                  text: '轉換後叫新花表示6張牌組的單張花色',
                },
                {
                  text: '轉換後叫4NT為小滿邀請(後續答叫詳後述)',
                },
                {
                  text: '轉換後叫5NT為至少迫叫至6NT(後續答叫詳後述)',
                },
              ],
            },
          ],
        },
        {
          id: 'one-minor',
          title: '一門低花',
          originalTitle: '※ 一門低花：',
          blocks: [
            {
              kind: 'rules',
              items: [
                {
                  text: '轉換後pass為束叫',
                },
                {
                  text: '轉換後叫5線王牌為束叫',
                },
                {
                  text: '轉換後加一為RKCB',
                },
                {
                  text: '轉換後其他新花及NT為短門邀請',
                },
                {
                  text: '3♣後叫4♥或4♠為5張低花的邀請',
                },
                {
                  text: '轉換後叫5NT為至少迫叫至6NT(後續答叫詳後述)',
                },
              ],
            },
          ],
        },
        {
          id: 'two-majors',
          title: '二門高花',
          originalTitle: '※ 二門高花',
          blocks: [
            {
              kind: 'paragraph',
              text: '**◎ 44高花**',
            },
            {
              kind: 'rules',
              items: [
                {
                  text: '無滿貫興趣：3♣後回答3♦時叫4♦',
                },
                {
                  text: '有滿貫興趣：3♣ >> 3♦後叫3NT詢問fit花色及高低限',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '**◎ 5張高花↑＋另一門高花4張**',
            },
            {
              kind: 'rules',
              items: [
                {
                  text: '5張♥↑＋4張♠：3♦後叫3♠',
                },
                {
                  text: '5張♠↑＋4張♥：直接答叫3♠',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '**◎ 55↑高花(含65,66)**',
            },
            {
              kind: 'rules',
              items: [
                {
                  text: '無滿貫興趣：3♦後叫3♠，若同伴回答3NT時，再叫4♠表示無滿貫興趣',
                },
                {
                  text: '有滿貫興趣：直接答叫3♠，若同伴回答3NT時，再叫4♥表示有滿貫興趣',
                },
              ],
            },
          ],
        },
        {
          id: 'major-and-minor',
          title: '一門高花＋一門低花',
          originalTitle: '※ 一門高花＋一門低花',
          blocks: [
            {
              kind: 'paragraph',
              text: '**◎ 5張高花↑＋另一門低花4張：**',
            },
            {
              kind: 'rules',
              items: [
                {
                  text: '無滿貫興趣：當一門高花叫',
                },
                {
                  text: '邀請滿貫：轉換高花後叫4NT為邀請(後續答叫詳後述)',
                },
                {
                  text: '滿貫迫叫：轉換高花後叫5NT(後續答叫詳後述)',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '**◎ 4張高花＋另一門低花5張↑**',
            },
            {
              kind: 'paragraph',
              text: '**○ 4張高花＋另一門低花5張：**',
            },
            {
              kind: 'rules',
              items: [
                {
                  text: '無滿貫興趣當一門4張高花叫',
                },
                {
                  text: '有滿貫興趣：3♣後若沒有對到高花，叫4♥ or 4♠表示5張低花的邀請',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '**○ 4張高花＋另一門低花6張↑：**',
            },
            {
              kind: 'rules',
              items: [
                {
                  text: '無滿貫興趣：3♣後若沒有對到高花，選擇3NT或是連叫6張的花色到5線',
                },
                {
                  text: '有滿貫興趣：3♣後若沒有對到高花，叫4線6張的花色表示滿貫興趣',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '**◎ 5張高花↑＋另一門低花5張↑**',
            },
            {
              kind: 'rules',
              items: [
                {
                  text: '無滿貫興趣：3線轉換高花後叫3NT或是選擇叫4♦或4♥再束叫5線低花',
                },
                {
                  text: '有滿貫興趣：直接選擇叫4♦或4♥詢問FIT花色以及高低限',
                },
              ],
            },
          ],
        },
        {
          id: 'two-minors',
          title: '二門低花',
          originalTitle: '※ 二門低花：',
          blocks: [
            {
              kind: 'rules',
              items: [
                {
                  text: '無滿貫興趣：44及54選擇當平均牌叫，64選擇3NT或是5線低花',
                },
                {
                  text: '有滿貫興趣：64選擇6張的牌組叫，44以及54選擇3♣後4NT or 5NT',
                },
              ],
            },
          ],
        },
        {
          id: 'after-4nt-5nt',
          title: '4NT 邀請及 5NT 迫叫後',
          originalTitle: '※ 4NT邀請及5NT迫叫後，開叫者後續答叫原則如下：',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: responderFirst,
                calls: ['4NT', '', '?'],
              },
              rows: [
                {
                  call: 'pass',
                  meaning: '謝謝再連絡',
                },
                {
                  call: '5C',
                  meaning: '5張♣，接受邀請',
                },
                {
                  call: '5D',
                  meaning: '5張♦，接受邀請',
                },
                {
                  call: '5H',
                  meaning: '接受邀請，沒有4張♣或是4張♦，詢問答叫者有無5張低花',
                },
                {
                  call: '5NT',
                  meaning: '接受邀請，詢問答叫者4張低花',
                },
                {
                  call: '6C',
                  meaning: '6張♣，接受邀請',
                },
                {
                  call: '6D',
                  meaning: '6張♦，接受邀請',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: responderFirst,
                calls: ['5NT', '', '?'],
              },
              rows: [
                {
                  call: '6C',
                  meaning: '4張♣↑',
                },
                {
                  call: '6D',
                  meaning: '4張♦↑，沒有4張♣',
                },
                {
                  call: '6H',
                  meaning: '3張♥，沒有4張♣或是4張♦(fit同伴叫過之高花)',
                },
                {
                  call: '6S',
                  meaning: '3張♠，沒有4張♣或是4張♦(fit同伴叫過之高花)',
                },
                {
                  call: '6NT',
                  meaning: '沒有4張♣或是4張♦，同伴高花也沒fit',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'responses',
      title: '答叫：2NT ?',
      originalTitle: '詳細叫品如下',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '?'],
          },
          rows: [
            {
              call: '3C',
              meaning: 'puppet stayman',
            },
            {
              call: '3D',
              meaning: '轉叫3♥， 5張♥↑（♥一門或是＋4張♠，或是高花55低限）',
            },
            {
              call: '3H',
              meaning: '轉叫3♠， 5張♠↑（♠一門）',
            },
            {
              call: '3S',
              meaning: '5張♠↑＋4~5張♥，GF(高花55的好牌)',
            },
            {
              call: '3NT',
              meaning: '轉叫4♣ ，6張♣↑',
            },
            {
              call: '4C',
              meaning: '轉叫4♦ ，6張♦↑',
            },
            {
              call: '4D',
              meaning: '5張♥＋一門5張↑低花，邀請以上',
            },
            {
              call: '4H',
              meaning: '5張♠＋一門5張↑低花，邀請以上',
            },
            {
              call: '4S',
              meaning: '低花55↑，詢問低花',
            },
            {
              call: '4NT',
              meaning: '2254 or 2245邀請6NT（否則一定有3張高花，還是要先3c check有無5張高花）',
            },
            {
              call: '5NT',
              meaning: '54低花(2245 or 2254)邀請7NT',
            },
          ],
        },
      ],
    },
    {
      id: 'puppet',
      title: 'Puppet：2NT 3♣',
      children: [
        {
          id: 'puppet-replies',
          title: '開叫者回答：2NT 3♣ ?',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '?'],
              },
              rows: [
                {
                  call: '3D',
                  meaning: '沒有5張高花，至少有一門4張的高花',
                },
                {
                  call: '3H',
                  meaning: '5張♥',
                },
                {
                  call: '3S',
                  meaning: '5張♠',
                },
                {
                  call: '3NT',
                  meaning: '沒有5張或4張的高花',
                },
              ],
            },
          ],
        },
        {
          id: 'after-3d-3h',
          title: '2NT 3♣ 3♦ 3♥ 之後',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3D', '', '?'],
              },
              rows: [
                {
                  call: '3H',
                  meaning: '沒有♥，可能有♠(不保證有♠)',
                },
                {
                  call: '3S',
                  meaning: '沒有♠，有4張♥',
                },
                {
                  call: '3NT',
                  meaning: '44高花，slam try，詢問牌組及高低限',
                },
                {
                  call: '4D',
                  meaning: '兩高44，選一門打，低限或是很多點想推莊的牌',
                },
                {
                  call: '4H',
                  meaning: '5張♣，5332，邀請以上(開叫者直接選擇束叫)',
                },
                {
                  call: '4S',
                  meaning: '5張♦，5332，邀請以上(開叫者直接選擇束叫)',
                },
                {
                  call: '4NT',
                  meaning: '兩低44或54，邀請(後續答叫詳最前面)',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3D', '', '3H', '', '?'],
              },
              rows: [
                {
                  call: '3S',
                  meaning: '有4張♠',
                },
                {
                  call: '3NT',
                  meaning: '4張♥，沒有4張♠',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3D', '', '3H', '', '3S', '', '?'],
              },
              rows: [
                {
                  call: '3NT',
                  meaning: 'sign off',
                },
                {
                  call: '4C',
                  meaning:
                    '♠ fit，♣短詢問，好牌4♦ or 4♥，爛牌4♠（不會是6張♣帶一門高花，這樣♠就fit了，假如只有一門低花的話，應該要直接轉換）',
                },
                {
                  call: '4D',
                  meaning: '♠ fit，♦短詢問（好牌4♥，爛牌4♠）',
                },
                {
                  call: '4H',
                  meaning: '♠ fit，♥短詢問（好牌4NT，爛牌4♠）',
                },
                {
                  call: '4S',
                  meaning: 'sign off',
                },
                {
                  call: '4NT',
                  meaning: '♠ fit，♥的EKB(想要♠的rkcb先假叫短門)',
                },
                {
                  call: '5C',
                  meaning: 'EKB',
                },
                {
                  call: '5D',
                  meaning: 'EKB',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: 'P.S.',
            },
            {
              kind: 'paragraph',
              text: '1.3♠後若想對♠的RKCB，先假叫4♣或4♦即可',
            },
            {
              kind: 'paragraph',
              text: '2.短門詢問後，2NT開叫者有18+的有用點須當好牌叫',
            },
            {
              kind: 'paragraph',
              text: '3.答叫者短邀後，開叫者已告知好牌，此時答叫者叫回4♠為反邀請',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3D', '', '3H', '', '3NT', '', '?'],
              },
              rows: [
                {
                  call: 'pass',
                  meaning: 'to play',
                },
                {
                  call: '4C',
                  meaning: '以♣為王牌，6張♣↑＋4張♠，答叫4♦為relay，5♣為最爛牌',
                },
                {
                  call: '4D',
                  meaning: '以♦為王牌，6張♦↑＋4張♠，答叫4♥為relay，5♦為最爛',
                },
                {
                  call: '4H',
                  meaning: '4張♠＋5張♣，邀請以上(開叫者直接選擇束叫)',
                },
                {
                  call: '4S',
                  meaning: '4張♠＋5張♦，邀請以上(開叫者直接選擇束叫)',
                },
                {
                  call: '4NT',
                  meaning: '邀請6NT(後續答叫詳最前面)',
                },
                {
                  call: '5C',
                  meaning: '6張♣↑＋4張♠，sign off（有點slam興趣的牌要先4♣再5♣）',
                },
                {
                  call: '5D',
                  meaning: '6張♦↑＋4張♠，sign off（有點slam興趣的牌要先4♦再5♦）',
                },
                {
                  call: '5NT',
                  meaning: '邀請7NT(後續答叫詳最前面)',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '2NT',
                  '',
                  '3C',
                  '',
                  '3D',
                  '',
                  '3H',
                  '',
                  '3NT',
                  '',
                  '4C',
                  '',
                  '4D',
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '4H',
                  meaning: 'RKCB for ♣',
                },
                {
                  call: '4S',
                  meaning: '短♦滿貫邀請',
                },
                {
                  call: '4NT',
                  meaning: '短♥滿貫邀請',
                },
                {
                  call: '5C',
                  meaning: '開叫要高限好牌才能move',
                },
              ],
            },
            {
              kind: 'note',
              tone: 'info',
              text: 'P.S.短門詢問方式為直接叫該短門花色，當二門花色都表示不出來時，例如4♦後，因為答叫者短門為♦跟♥，扣掉4♥ rkcb的叫品，剩下4♠及4NT，♠不可能是短門，因此這時候較低階叫品表示較低花色短門(♦)',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '2NT',
                  '',
                  '3C',
                  '',
                  '3D',
                  '',
                  '3H',
                  '',
                  '3NT',
                  '',
                  '4D',
                  '',
                  '4H',
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '4S',
                  meaning: 'RKCB for ♦',
                },
                {
                  call: '4NT',
                  meaning: '短♥滿貫邀請(♣短可以自然表示，因此表示♥短)',
                },
                {
                  call: '5C',
                  meaning: '短♣滿貫邀請',
                },
                {
                  call: '5D',
                  meaning: '開叫要高限好牌才能move',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3D', '', '3H', '', '3NT', '', '4H', '', '?'],
              },
              rows: [
                {
                  call: '4NT',
                  meaning: '3442，♣不fit',
                },
                {
                  call: '5C',
                  meaning: '♣ fit，爛牌',
                },
                {
                  call: '6C',
                  meaning: '♣ fit，好牌',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3D', '', '3H', '', '3NT', '', '4S', '', '?'],
              },
              rows: [
                {
                  call: '4NT',
                  meaning: '3424，♦不fit',
                },
                {
                  call: '5D',
                  meaning: '♦ fit爛牌',
                },
                {
                  call: '6D',
                  meaning: '♦ fit好牌',
                },
              ],
            },
          ],
        },
        {
          id: 'after-3d-3s',
          title: '2NT 3♣ 3♦ 3♠ 之後',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3D', '', '3S', '', '?'],
              },
              rows: [
                {
                  call: '3NT',
                  meaning: '4張♠，沒有4張♥',
                },
                {
                  call: '4C',
                  meaning: '有4張♥的牌，好牌',
                },
                {
                  call: '4H',
                  meaning: '有4張♥的牌，爛牌',
                },
              ],
            },
            {
              kind: 'note',
              tone: 'info',
              text: 'P.S.沒空間讓答叫者叫出短門，所以只能報出高低限',
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3D', '', '3S', '', '3NT', '', '?'],
              },
              rows: [
                {
                  call: 'pass',
                  meaning: 'to play',
                },
                {
                  call: '4C',
                  meaning: '以♣為王牌，6張♣↑＋4張♥，答叫4♦為relay，5♣為最爛牌',
                },
                {
                  call: '4D',
                  meaning: '以♦為王牌，6張♦↑＋4張♥，答叫4♥為relay，5♦為最爛',
                },
                {
                  call: '4H',
                  meaning: '4張♥＋5張♣，邀請以上(開叫者直接選擇束叫)',
                },
                {
                  call: '4S',
                  meaning: '4張♥＋5張♦，邀請以上(開叫者直接選擇束叫)',
                },
                {
                  call: '4NT',
                  meaning: '邀請6NT(後續答叫詳最前面)',
                },
                {
                  call: '5C',
                  meaning: '6張♣↑＋4張♥，sign off（有點slam興趣的牌要先4♣再5♣）',
                },
                {
                  call: '5D',
                  meaning: '6張♦↑＋4張♥，sign off（有點slam興趣的牌要先4♦再5♦）',
                },
                {
                  call: '5NT',
                  meaning: '邀請7NT(後續答叫詳最前面)',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '2NT',
                  '',
                  '3C',
                  '',
                  '3D',
                  '',
                  '3S',
                  '',
                  '3NT',
                  '',
                  '4C',
                  '',
                  '4D',
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '4H',
                  meaning: 'RKCB for ♣',
                },
                {
                  call: '4S',
                  meaning: '短♠滿貫邀請',
                },
                {
                  call: '4NT',
                  meaning: '短♦滿貫邀請',
                },
                {
                  call: '5C',
                  meaning: '開叫要高限好牌才能move',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '2NT',
                  '',
                  '3C',
                  '',
                  '3D',
                  '',
                  '3S',
                  '',
                  '3NT',
                  '',
                  '4D',
                  '',
                  '4H',
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '4S',
                  meaning: 'RKCB for ♦',
                },
                {
                  call: '4NT',
                  meaning: '短♠滿貫邀請(♣短可以自然表示，因此表示♠短)',
                },
                {
                  call: '5C',
                  meaning: '短♣滿貫邀請',
                },
                {
                  call: '5D',
                  meaning: '開叫要高限好牌才能move',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3D', '', '3S', '', '3NT', '', '4H', '', '?'],
              },
              rows: [
                {
                  call: '4NT',
                  meaning: '4342，♣不fit',
                },
                {
                  call: '5C',
                  meaning: '♣ fit，爛牌',
                },
                {
                  call: '6C',
                  meaning: '♣ fit，好牌',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3D', '', '3S', '', '3NT', '', '4S', '', '?'],
              },
              rows: [
                {
                  call: '4NT',
                  meaning: '4324，♦不fit',
                },
                {
                  call: '5D',
                  meaning: '♦ fit爛牌',
                },
                {
                  call: '6D',
                  meaning: '♦ fit好牌',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3D', '', '3S', '', '4C', '', '?'],
              },
              rows: [
                {
                  call: '4D',
                  meaning: '轉4♥，可能要轉莊束叫或是準備RKCB(不可能是反邀請，因為4♣已經是高限點了)',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3D', '', '3S', '', '4C', '', '4D', '', '4H', '', '?'],
              },
              rows: [
                {
                  call: '4S',
                  meaning: 'RKCB',
                },
                {
                  call: '4NT',
                  meaning: '短♠邀請滿貫',
                },
                {
                  call: '5C',
                  meaning: '短♣邀請滿貫',
                },
                {
                  call: '5D',
                  meaning: '短♦邀請滿貫',
                },
              ],
            },
            {
              kind: 'note',
              tone: 'info',
              text: 'P.S.答叫者點力不多，不可能是要求第二控去6線，因此為短門邀請',
            },
          ],
        },
        {
          id: 'after-3h',
          title: '5張♥：2NT 3♣ 3♥ 之後',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3H', '', '?'],
              },
              rows: [
                {
                  call: '3S',
                  meaning: '♥ fit，slam try，詢問2張的花色',
                },
                {
                  call: '3NT',
                  meaning: '♥不fit，束叫',
                },
                {
                  call: '4C',
                  meaning: '6♣↑＋4♠，確定以♣為王(一般牌先叫4♦，很爛的牌5♣)',
                },
                {
                  call: '4D',
                  meaning: '6♦↑＋4♠，確定以♦為王(一般牌先叫4♥，很爛的牌5♦)',
                },
                {
                  call: '4H',
                  meaning: '束叫',
                },
                {
                  call: '4S',
                  meaning: '♥ fit,EKB(RKCB先叫3♠)',
                },
                {
                  call: '4NT',
                  meaning: '邀請6NT(後續答叫詳最前面)',
                },
                {
                  call: '5C',
                  meaning: '♥ fit,EKB',
                },
                {
                  call: '5D',
                  meaning: '♥ fit,EKB',
                },
                {
                  call: '5NT',
                  meaning: 'F to 6NT(後續答叫詳最前面)',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3H', '', '3S', '', '?'],
              },
              rows: [
                {
                  call: '3NT',
                  meaning: '2張♠',
                },
                {
                  call: '4C',
                  meaning: '2張♣',
                },
                {
                  call: '4D',
                  meaning: '2張♦',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '2NT',
                  '',
                  '3C',
                  '',
                  '3H',
                  '',
                  '3S',
                  '',
                  '3NT',
                  '',
                  {
                    call: '4C',
                    note: '反邀請',
                  },
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '4D',
                  meaning: '好牌',
                },
                {
                  call: '4H',
                  meaning: '爛牌',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '2NT',
                  '',
                  '3C',
                  '',
                  '3H',
                  '',
                  '3S',
                  '',
                  '4C',
                  '',
                  {
                    call: '4D',
                    note: '反邀請',
                  },
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '4H',
                  meaning: '爛牌',
                },
                {
                  call: '4S',
                  meaning: '好牌(captain為答叫者)',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '2NT',
                  '',
                  '3C',
                  '',
                  '3H',
                  '',
                  {
                    call: '4C',
                    note: '♣＋♠',
                  },
                  '',
                  '4D',
                  '',
                  '?',
                ],
              },
              rows: [
                {
                  call: '4H',
                  meaning: 'RKCB',
                },
                {
                  call: '4S',
                  meaning: '♦單張，短門邀請(較低花色短門)',
                },
                {
                  call: '4NT',
                  meaning: '♥單張，短門邀請(較高花色短門)',
                },
                {
                  call: '5C',
                  meaning: '束叫',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: [
                  '2NT',
                  '',
                  '3C',
                  '',
                  '3H',
                  '',
                  {
                    call: '4D',
                    note: '♦＋♠',
                  },
                  '',
                  '4H',
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
                  meaning: '♥單張，短門邀請(只剩♥短門花色無法表示)',
                },
                {
                  call: '5C',
                  meaning: '♣單張，短門邀請',
                },
                {
                  call: '5D',
                  meaning: '束叫',
                },
              ],
            },
          ],
        },
        {
          id: 'after-3s',
          title: '5張♠：2NT 3♣ 3♠ 之後',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3S', '', '?'],
              },
              rows: [
                {
                  call: '3NT',
                  meaning: '♠不fit',
                },
                {
                  call: '4C',
                  meaning: '♠ fit，slam try，詢問2張的花色',
                },
                {
                  call: '4D',
                  meaning: '6♦↑＋4♥，確定以♦為王(一般牌先叫4♥，很爛的牌5♦)',
                },
                {
                  call: '4H',
                  meaning:
                    '6♣↑＋4♥，確定以♣為王(沒空間表示，故4♠是高限好牌，5♣是爛牌，4♠後面4NT RKCB，5♣ 束叫)',
                },
                {
                  call: '4S',
                  meaning: '束叫',
                },
                {
                  call: '4NT',
                  meaning: '邀請6NT(後續答叫詳最前面)',
                },
                {
                  call: '5C',
                  meaning: '♠ fit,EKB',
                },
                {
                  call: '5D',
                  meaning: '♠ fit,EKB',
                },
                {
                  call: '5H',
                  meaning: '♠ fit,EKB',
                },
                {
                  call: '5NT',
                  meaning: 'F to 6NT(後續答叫詳最前面)',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3S', '', '4C', '', '?'],
              },
              rows: [
                {
                  call: '4D',
                  meaning: '2張♦',
                },
                {
                  call: '4H',
                  meaning: '2張♥',
                },
                {
                  call: '4S',
                  meaning: '2張♣',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3S', '', '4D', '', '4H', '', '?'],
              },
              rows: [
                {
                  call: '4S',
                  meaning: 'RKCB',
                },
                {
                  call: '4NT',
                  meaning: '♠單張，短門邀請(只剩♠短門花色無法表示)',
                },
                {
                  call: '5C',
                  meaning: '♣單張，短門邀請',
                },
                {
                  call: '5D',
                  meaning: '束叫',
                },
              ],
            },
          ],
        },
        {
          id: 'after-3nt',
          title: '沒有高花：2NT 3♣ 3NT 之後',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3NT', '', '?'],
              },
              rows: [
                {
                  call: '4C',
                  meaning: '6♣↑＋一門高花4張，確定以♣為王(一般牌先叫4♦，很爛的牌5♣)',
                },
                {
                  call: '4D',
                  meaning: '6♦↑＋一門高花4張，確定以♦為王(一般牌先叫4♥，很爛的牌5♦)',
                },
                {
                  call: '4H',
                  meaning: '5張♣＋一門高花4張，邀請以上(開叫者直接選擇束叫)',
                },
                {
                  call: '4S',
                  meaning: '5張♦＋一門高花4張，邀請以上(開叫者直接選擇束叫)',
                },
                {
                  call: '4NT',
                  meaning: '邀請6NT(後續答叫詳最前面)',
                },
                {
                  call: '5C',
                  meaning: '6♣↑＋一門高花4張，to play',
                },
                {
                  call: '5D',
                  meaning: '6♦↑＋一門高花4張，to play',
                },
                {
                  call: '5NT',
                  meaning: 'F to 6NT(後續答叫詳最前面)',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: openerFirst,
                calls: ['2NT', '', '3C', '', '3NT', '', '4C', '', '4D', '', '?'],
              },
              rows: [
                {
                  call: '4H',
                  meaning: 'RKCB',
                },
                {
                  call: '4S',
                  meaning: '♠短check',
                },
                {
                  call: '4NT',
                  meaning: '♦短check(無法表示的短門裡面較低花色)',
                },
                {
                  call: '5C',
                  meaning: '♥短check(無法表示的短門裡面較高花色)',
                },
              ],
            },
            {
              kind: 'note',
              tone: 'info',
              text: 'P.S.答叫4♣之後，其4張高花無法得知，故此時其他三門皆有可能短門',
            },
          ],
        },
      ],
    },
    {
      id: 'transfer-hearts',
      title: '轉換♥：2NT 3♦',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '3D', '', '?'],
          },
          rows: [
            {
              call: '3H',
              meaning: '遵命',
            },
            {
              call: '3S',
              meaning: '4張♥↑＋高限控制好牌',
            },
            {
              call: '3NT',
              meaning: '3張♥ fit，5張♦，高限控制好牌(之後4♦為轉叫4♥)',
            },
            {
              call: '4C',
              meaning: '3張♥ fit，5張♣，高限控制好牌(之後4♦為轉叫4♥)',
            },
            {
              call: '4H',
              meaning: '4張♥↑＋高限好牌(點力品質不好)',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '3D', '', '3H', '', '?'],
          },
          rows: [
            {
              call: '3S',
              meaning: '5張♥↑＋4張♠(或是55的爛牌)',
            },
            {
              call: '3NT',
              meaning: '5張♥，pass或是4♥',
            },
            {
              call: '4C',
              meaning: '6張♥↑，♣短詢問（好牌4♦，爛牌4♥）',
            },
            {
              call: '4D',
              meaning: '6張♥↑，♦短詢問（好牌4♠，爛牌4♥，captain是答叫者）',
            },
            {
              call: '4H',
              meaning: '6張♥↑，束叫',
            },
            {
              call: '4S',
              meaning: '♥為王的♠ EKB（若是對♥的RKCB，先假叫4♣後再叫4♠）',
            },
            {
              call: '4NT',
              meaning: '5張♥的邀請6NT(可能有4張低花，後續答叫詳最前面)',
            },
            {
              call: '5C',
              meaning: '♥為王的EKB',
            },
            {
              call: '5D',
              meaning: '♥為王的EKB',
            },
            {
              call: '5NT',
              meaning: '5張♥，迫叫至6NT，後續答叫詳最前面',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '3D', '', '3H', '', '3S', '', '?'],
          },
          rows: [
            {
              call: '3NT',
              meaning: '高花都不ift',
              pending: '原文「不ift」，疑為「不fit」。',
            },
            {
              call: '4C',
              meaning: '♥ fit高限好牌(沒有轉莊問題，所以之後4♦為反邀請)',
            },
            {
              call: '4D',
              meaning: '♠ fit高限好牌(沒有轉莊問題，所以之後4♥為反邀請)',
            },
            {
              call: '4H',
              meaning: '♥ fit低限爛牌',
            },
            {
              call: '4S',
              meaning: '♠ fit低限爛牌',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '3D', '', '3H', '', '3S', '', '3NT', '', '?'],
          },
          rows: [
            {
              call: '4C',
              meaning: '短♣詢問，6張♥↑＋4張♠（好牌叫4♦，爛牌叫4♥）',
            },
            {
              call: '4D',
              meaning: '短♦詢問，6張♥↑＋4張♠（好牌叫4♠，爛牌叫4♥）',
            },
            {
              call: '4H',
              meaning: '6張♥↑＋4張♠，束叫',
            },
            {
              call: '4S',
              meaning: '55高花爛牌，束叫(55好牌應先叫3♠)',
            },
            {
              call: '4NT',
              meaning: '邀請6NT(後續答叫詳最前面)',
            },
            {
              call: '5C',
              meaning: '♥為王的EKB',
            },
            {
              call: '5D',
              meaning: '♥為王的EKB',
            },
            {
              call: '5NT',
              meaning: 'F to 6NT(後續答叫詳最前面)',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '3D', '', '3S', '', '?'],
          },
          rows: [
            {
              call: '3NT',
              meaning: '♠短check',
            },
            {
              call: '4C',
              meaning: '♣短check',
            },
            {
              call: '4D',
              meaning: '轉叫4♥準備束叫，或是再叫5♦短門邀請',
            },
            {
              call: '4S',
              meaning: 'RKCB',
            },
            {
              call: '4NT',
              meaning: '♥為王的♠ EKB',
            },
            {
              call: '5C',
              meaning: '♥為王的EKB',
            },
            {
              call: '5D',
              meaning: '♥為王的EKB',
            },
          ],
        },
      ],
    },
    {
      id: 'transfer-spades',
      title: '轉換♠：2NT 3♥',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '3H', '', '?'],
          },
          rows: [
            {
              call: '3S',
              meaning: '遵命',
            },
            {
              call: '3NT',
              meaning: '4張♠↑＋高限控制好牌',
            },
            {
              call: '4C',
              meaning: '3張♥ fit，5張♣，高限控制好牌(之後4♥為轉叫4♠)',
            },
            {
              call: '4D',
              meaning: '3張♥ fit，5張♦，高限控制好牌(之後4♥為轉叫4♠)',
            },
            {
              call: '4S',
              meaning: '4張♠↑＋高限好牌(點力品質不好)',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '3H', '', '3S', '', '?'],
          },
          rows: [
            {
              call: '3NT',
              meaning: '5張♠，pass或是4♠',
            },
            {
              call: '4C',
              meaning: '6張♠↑，♣短詢問（最好牌4♦、次好牌4♥，爛牌4♠）',
            },
            {
              call: '4D',
              meaning: '6張♠↑，♦短詢問（好牌4♥，爛牌4♠）',
            },
            {
              call: '4H',
              meaning: '6張♠↑，♥短詢問（好牌4NT，爛牌4♠，captain是答叫者）',
            },
            {
              call: '4S',
              meaning: '束叫',
            },
            {
              call: '4NT',
              meaning: '邀請6NT(可能有4張低花，後續答叫詳最前面)',
            },
            {
              call: '5C',
              meaning: '♠為王的EKB',
            },
            {
              call: '5D',
              meaning: '♠為王的EKB',
            },
            {
              call: '5H',
              meaning: '♠為王的EKB',
            },
            {
              call: '5NT',
              meaning: 'F to 6NT(可能有4張低花，後續答叫詳最前面)',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '3H', '', '3NT', '', '?'],
          },
          rows: [
            {
              call: '4C',
              meaning: '♣短check',
            },
            {
              call: '4D',
              meaning: '♦短check',
            },
            {
              call: '4H',
              meaning: '轉叫4♠準備束叫，或是再叫5♥短門邀請',
            },
            {
              call: '4NT',
              meaning: 'RKCB',
            },
            {
              call: '5C',
              meaning: '♠為王的EKB',
            },
            {
              call: '5C',
              meaning: '♠為王的EKB',
              pending: '與上一列同為 5♣，疑應為 5♦。',
            },
            {
              call: '5H',
              meaning: '♠為王的EKB',
            },
          ],
        },
      ],
    },
    {
      id: 'major-55',
      title: '高花55的好牌：2NT 3♠',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '3S', '', '?'],
          },
          rows: [
            {
              call: '3NT',
              meaning: '都不fit',
            },
            {
              call: '4C',
              meaning: '4張♥↑fit，高限好牌(之後4♦為轉叫4♥定莊)',
            },
            {
              call: '4D',
              meaning: '3張♠↑fit，高限好牌(沒有4張♥，之後4♥為反邀請)',
            },
            {
              call: '4H',
              meaning: '4張♥↑fit爛牌',
            },
            {
              call: '4S',
              meaning: '3張♠↑fit，爛牌(沒有4張♥)',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '3S', '', '3NT', '', '?'],
          },
          rows: [
            {
              call: '4C',
              meaning: '5張♠↑＋5張♥，確定以♥為王，slam try check',
            },
            {
              call: '4D',
              meaning: '6張♠↑＋4張♥，短♦詢問',
            },
            {
              call: '4H',
              meaning: '6張♠↑＋4張♥，短♣詢問(不然55高花好牌會沒辦法check；之後爛牌叫4♠，好牌叫4NT)',
            },
            {
              call: '4S',
              meaning: '6張♠↑＋4張♥，束叫',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '3S', '', '3NT', '', '4C', '', '?'],
          },
          rows: [
            {
              call: '4D',
              meaning: '♥ fit好牌高限',
            },
            {
              call: '4H',
              meaning: '♥ fit爛牌',
            },
          ],
        },
      ],
    },
    {
      id: 'minor-transfers',
      title: '轉換低花：2NT 3NT／4♣',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '3NT', '', '4C', '', '?'],
          },
          rows: [
            {
              call: '4D',
              meaning: 'RKCB',
            },
            {
              call: '4H',
              meaning: '短♥詢問',
            },
            {
              call: '4S',
              meaning: '短♠詢問',
            },
            {
              call: '4NT',
              meaning: '短♦詢問',
            },
            {
              call: '5C',
              meaning: '束叫',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '4C', '', '4D', '', '?'],
          },
          rows: [
            {
              call: '4H',
              meaning: 'RKCB',
            },
            {
              call: '4S',
              meaning: '短♠詢問',
            },
            {
              call: '4NT',
              meaning: '短♥詢問',
            },
            {
              call: '5C',
              meaning: '短♣詢問',
            },
            {
              call: '5D',
              meaning: '束叫',
            },
          ],
        },
      ],
    },
    {
      id: 'major-minor-55',
      title: '5張高花＋5張低花：2NT 4♦／4♥',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '4D', '', '?'],
          },
          rows: [
            {
              call: '4H',
              meaning: '♥ fit一般牌',
            },
            {
              call: '4S',
              meaning: '4張♥ fit，控制高限好點',
            },
            {
              call: '4NT',
              meaning: '低花有支持，控制高限好點',
            },
            {
              call: '5C',
              meaning: 'pass or correct',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: openerFirst,
            calls: ['2NT', '', '4H', '', '?'],
          },
          rows: [
            {
              call: '4S',
              meaning: '♠ fit一般牌',
            },
            {
              call: '4NT',
              meaning: '4張♠ fit，控制高限好點',
            },
            {
              call: '5C',
              meaning: 'pass or correct',
            },
            {
              call: '5D',
              meaning: '低花都有支持，控制高限好點',
            },
          ],
        },
      ],
    },
  ],
}
