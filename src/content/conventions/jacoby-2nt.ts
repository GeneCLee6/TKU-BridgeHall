import type { Auction, AuctionCall, Convention } from '../../types/convention.ts'

/**
 * 開叫高花之滿貫詢問叫 (Jacoby 2NT, and 1H-2S as its heart version)
 * Source: the club's Word file "J2N".
 * Transcribed verbatim; only bids and suit letters were rewritten with suit symbols (3C -> 3♣,
 * "H短" -> "♥短"). Text that is red or bold in the source is kept as **bold**.
 * The source shows no opponents' calls, so their seats are left empty.
 */

const seats: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']

/** Our side's calls in order (opener first), with the opponents' seats left empty, ending in '?' */
const seq = (...calls: AuctionCall[]): Auction => ({
  seats,
  calls: [...calls.flatMap((c) => [c, '']), '?'],
})

const ask = (call: string, note = '詢問'): AuctionCall => ({ call, note })

export const jacoby2nt: Convention = {
  slug: 'jacoby-2nt',
  nameZh: '開叫高花之滿貫詢問叫',
  nameEn: 'Jacoby 2NT',
  aliases: ['J2N', 'Jacoby', 'Jacoby 2NT', '滿貫詢問', '1S 2NT', '1H 2S'],
  category: 'suit-openings',
  kind: 'convention',
  level: 'advanced',
  cardSlots: [
    'wbf.openings.1H.responses <- heart-responses#0',
    'wbf.openings.1S.responses <- spade-responses#0',
    'ctcba-simple.major.jacoby-2nt <- intro',
  ],
  tags: ['高花開叫', '滿貫詢問', '短門', 'EKB', 'RKCB', '報控'],
  summary:
    '同伴開叫高花、我方 3 張↑支持且有成局點時的滿貫詢問：1♠ 2NT、1♥ 2♠，含開叫者報牌型、加一詢問與後續 check。',
  source: { title: 'J2N', note: '文件標題：開叫高花之滿貫詢問叫' },
  updated: '2026-10-21',
  sections: [
    {
      id: 'intro',
      title: '前言',
      originalTitle: '◎ 前言：',
      summary: '1♠ 用 2NT、1♥ 用 2♠；3 張需 13 點↑，4 張↑需 12 點↑。',
      blocks: [
        { kind: 'paragraph', text: 'Fit同伴開叫高花之滿貫詢問答叫有二種' },
        { kind: 'rules', items: [{ text: '1♠  >>  2NT' }, { text: '1♥  >>  2♠' }] },
        {
          kind: 'paragraph',
          text: '使用此詢問叫的要求是3張↑支持以及成局的點力(不包括分配點)，亦即3張的話需要13點↑，4張↑的話需要12點↑',
        },
      ],
    },
    {
      id: 'principles',
      title: '此詢問叫之通則',
      originalTitle: '◎ 此詢問叫之通則：',
      summary: '何時必須使用、短門滿貫判斷、EKB、captain、加一詢問與短門 check。',
      blocks: [
        {
          kind: 'rules',
          ordered: true,
          items: [
            {
              text: '同伴開叫之高花有3張↑，有成局點力時，必須無條件使用此詢問叫，也就是說其他迫叫成局叫品都不會有3張↑支持，例如2/1。',
            },
            {
              text: '短門滿貫的判斷原則：',
              children: [
                {
                  text: '單張：9張王↑，扣掉單張的那門，其他三門要有25點以上；8張王，長王的單張的話，扣掉單張的那門，其他三門要有27-28點，短王的單張的話，其他三門要有26點以上；同伴單張花色持A並非廢點，但其他三門的點力需求僅能扣除2點，例如9張王時，其他三門仍需要23點以上，滿貫期望值才符合。',
                },
                {
                  text: '缺門：9張王↑，扣掉缺門的那門，其他三門要有23點以上；長王的缺門的話，扣掉缺門的那門，其他三門要有25-26點以上，短王的缺門的話，其他三門要有24點以上。',
                },
              ],
            },
            { text: '單張或缺門的點力微調：當同伴有單張或缺門時，那門花色越長越好，越短越不好。' },
            {
              text: '同伴滿貫詢問後，開叫者有單K時，當做Kx叫牌；有單Q時，扣掉Q的點力，當作單張叫牌。',
            },
            {
              text: '滿貫詢問叫後，開叫者或答叫者**跳叫**超過四線王牌以上時，均為EKB(除外問A)，EKB答叫方式同RKCB。',
            },
            {
              text: '滿貫詢問後，除非開叫者直接RKCB(EKB)或是叫牌過程中叫回4線王牌，不然，答叫者永遠是captain，即使已經越過四線王牌。',
            },
            {
              text: '當開叫者牌型及點力未知時，加一叫品均為詢問，加二以上叫品均為短門check，要注意的是，3線王牌+1的叫品是VOID一門(♠的3NT以及♥的3♠)，另外當♥為王牌時，3NT即表示♠短，3♠表示一門void',
            },
          ],
        },
        {
          kind: 'responses',
          caption: 'EX.',
          auction: seq('1S', '2NT', '3C'),
          rows: [
            { call: '3H', meaning: '♥短' },
            { call: '3S', meaning: '♦短(空叫品，用來代表著其他門叫品最高的花色以節省空間)' },
            { call: '3NT', meaning: '旁門有void(之後4♣詢問)' },
            { call: '4C', meaning: '♣短' },
          ],
        },
        {
          kind: 'responses',
          auction: seq('1H', '2S', '2NT'),
          rows: [
            { call: '3D', meaning: '♦短' },
            {
              call: '3H',
              meaning: '♣短',
              pending:
                '原文3♥與4♣都寫「C短」；對照1♠的例子，3♥（王牌）應為空叫品，代表的花色請確認。',
            },
            { call: '3S', meaning: '旁門有void(之後3NT詢問)' },
            { call: '3NT', meaning: '♠短' },
            { call: '4C', meaning: '♣短' },
          ],
        },
      ],
    },
    {
      id: 'spade',
      title: '開叫1♠時的滿貫詢問叫（2NT）',
      originalTitle: '※ 開叫1S時的滿貫詢問叫（2NT）',
      summary: '1♠ 2NT 之後開叫者報牌型，以及加一詢問、3♠／3NT／四線之後的後續。',
      children: [
        {
          id: 'spade-rebids',
          title: '開叫者回答：1♠ 2NT ?',
          blocks: [
            {
              kind: 'responses',
              caption: '2NT：12↑，4張♠↑或13點↑，3張♠',
              auction: seq('1S', '2NT'),
              rows: [
                {
                  call: '3C',
                  meaning:
                    '1.短門♣，12-21　2.5張♠ + 4張♣，5224的牌型，12-21　3.有長有短之畸型牌5521、6511(或是約定♠＋長門10張↑，亦即知道單張及雙張的花色為何)',
                },
                { call: '3D', meaning: '短門♦ or 15-17平均牌型(15-17的5332或是14-16的6322)' },
                { call: '3H', meaning: '短門♥ or 18~19平均牌型(18-19的5332或是17-20的6322)' },
                { call: '3S', meaning: '5422牌型，12~15' },
                { call: '3NT', meaning: '5422牌型，16~21' },
                { call: '4C', meaning: '♣ void' },
                { call: '4D', meaning: '♦ void' },
                {
                  call: '4H',
                  meaning: '♥ void高限(點力範圍看身價及牌型，至少比最低開牌力量多2點以上)',
                },
                { call: '4S', meaning: '**♥ void 低限**' },
                { call: '4NT', meaning: '**♥ EKB**' },
                { call: '5C', meaning: 'EKB' },
                { call: '5D', meaning: 'EKB' },
              ],
            },
          ],
        },
        {
          id: 'spade-relay',
          title: '開叫者3♣、3♦、3♥之後續詢問答叫',
          originalTitle: '◎ 開叫者3C、3D、3H之後續詢問答叫',
          blocks: [
            {
              kind: 'paragraph',
              text: '加一花色為詢問，回答原則下面有說明，加二以上之旁花色為短門詢問（大部份是以加一詢問為優先叫品）',
            },
          ],
          children: [
            {
              id: 'spade-relay-3c',
              title: '1♠ 2NT 3♣ 之後加一詢問',
              blocks: [
                {
                  kind: 'paragraph',
                  text: '**3♣加一詢問之答叫方式，+1為5521，+2為平均牌型，+3以上皆是短門報法：**',
                },
                {
                  kind: 'rules',
                  items: [
                    { text: '+1  5521、6421、6511(♠＋長門10張↑)' },
                    { text: '+2  平均牌型(5332、6322、7222)' },
                    { text: '+3  5張♠，12~15，單張♣' },
                    { text: '+4  6張♠↑，11~14，單張♣' },
                    { text: '+5  5張♠，16~18，單張♣' },
                    { text: '+6  6張♠↑，15~17，單張♣' },
                    { text: '+7  5張♠，19~21，單張♣' },
                    { text: '+8  6張♠↑，18~20，單張♣' },
                  ],
                },
                {
                  kind: 'responses',
                  caption: '例如：',
                  auction: seq('1S', '2NT', '3C', ask('3D')),
                  rows: [
                    { call: '3H', meaning: '♠＋長門10張↑（答叫方式詳後述）' },
                    { call: '3S', meaning: '12~14平均牌型' },
                    { call: '3NT', meaning: '5張♠，12~15，單張♣' },
                    { call: '4C', meaning: '6張♠↑，11~14，單張♣' },
                    { call: '4D', meaning: '5張♠，16~18，單張♣' },
                    { call: '4H', meaning: '6張♠↑，15~17，單張♣' },
                    { call: '4S', meaning: '5張♠，19~21，單張♣' },
                    { call: '4NT', meaning: '6張♠↑，18~20，單張♣' },
                  ],
                },
              ],
            },
            {
              id: 'spade-relay-3d',
              title: '1♠ 2NT 3♦ 之後加一詢問',
              blocks: [
                {
                  kind: 'paragraph',
                  text: '**3♦後加一詢問之答叫方式，+1為平均牌型，+2以上皆是短門報法：**',
                },
                {
                  kind: 'rules',
                  items: [
                    { text: '+1  平均牌型(5332、6322、7222)' },
                    { text: '+2  5張♠，12~15，單張♦' },
                    { text: '+3  6張♠↑，11~14，單張♦' },
                    { text: '+4  5張♠，16~18，單張♦' },
                    { text: '+5  6張♠↑，15~17，單張♦' },
                    { text: '+6  5張♠，19~21，單張♦' },
                    { text: '+7  6張♠↑，18~20，單張♦' },
                  ],
                },
                {
                  kind: 'responses',
                  caption: '例如：',
                  auction: seq('1S', '2NT', '3D', ask('3H')),
                  rows: [
                    { call: '3S', meaning: '平均牌型15~17' },
                    { call: '3NT', meaning: '5張♠，12~15，單張♦' },
                    { call: '4C', meaning: '6張♠↑，11~14，單張♦' },
                    { call: '4D', meaning: '5張♠，16~18，單張♦' },
                    { call: '4H', meaning: '6張♠↑，15~17，單張♦' },
                    { call: '4S', meaning: '5張♠，19~21，單張♦' },
                    { call: '4NT', meaning: '6張♠↑，18~20，單張♦' },
                  ],
                },
              ],
            },
            {
              id: 'spade-relay-3h',
              title: '1♠ 2NT 3♥ 之後加一詢問',
              blocks: [
                {
                  kind: 'paragraph',
                  text: '**3♥後加一詢問之答叫方式，+1為平均牌型，+2以上皆是短門報法：**',
                },
                {
                  kind: 'rules',
                  items: [
                    { text: '+1  平均牌型(5332、6322、7222)' },
                    { text: '+2  5張♠，12~15，單張♥' },
                    { text: '+3  6張♠↑，11~14，單張♥' },
                    { text: '+4  5張♠，16~18，單張♥' },
                    { text: '+5  6張♠↑，15~17，單張♥' },
                    { text: '+6  5張♠，19~21，單張♥' },
                    { text: '+7  6張♠↑，18~20，單張♥' },
                  ],
                },
                {
                  kind: 'responses',
                  caption: '例如：',
                  auction: seq('1S', '2NT', '3H', ask('3S')),
                  rows: [
                    { call: '3NT', meaning: '平均牌型18~19(5332、6322、7222)' },
                    { call: '4C', meaning: '5張♠，12~15，單張♥' },
                    { call: '4D', meaning: '6張♠↑，11~14，單張♥' },
                    { call: '4H', meaning: '5張♠，16~18，單張♥' },
                    { call: '4S', meaning: '6張♠↑，15~17，單張♥' },
                    { call: '4NT', meaning: '5張♠，19~21，單張♥' },
                    { call: '5C', meaning: '6張♠↑，18~20，單張♥' },
                  ],
                },
              ],
            },
            {
              id: 'spade-relay-two-suiter',
              title: '3♣後回答3♥之有長有短的報法',
              blocks: [
                {
                  kind: 'responses',
                  auction: seq('1S', '2NT', '3C', ask('3D'), '3H', ask('3S')),
                  rows: [
                    { call: '3NT', meaning: '短門花色及下一階級長門花色，4♣為詢問' },
                    { call: '4C', meaning: '♣短＋5張♥↑（短門＋下二級長門花色）' },
                    { call: '4D', meaning: '♦短＋5張♣↑（短門＋下二級長門花色）' },
                    { call: '4H', meaning: '♥短＋5張♦↑（短門＋下二級長門花色）' },
                  ],
                },
                {
                  kind: 'responses',
                  auction: seq('1S', '2NT', '3C', ask('3D'), '3H', ask('3S'), '3NT', ask('4C')),
                  rows: [
                    { call: '4D', meaning: '♦短＋5張♥↑（短門＋下一級長門花色）' },
                    { call: '4H', meaning: '♥短＋5張♣↑（短門＋下一級長門花色）' },
                    { call: '4S', meaning: '♣短＋5張♦↑（短門＋下一級長門花色）' },
                  ],
                },
                {
                  kind: 'note',
                  tone: 'info',
                  text: '**P.S.口訣是加一是1+1(短門再加下一級長門)，直接叫是1+2(短門再加下二級長門)**',
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
              text: '1.當開叫者為平均牌型時，答叫者加一為詢問王牌張數及高低限，加二以上之新花為短門詢問，回答原則如下：',
            },
            {
              kind: 'rules',
              items: [
                { text: '+1 - 5332，低限' },
                { text: '+2 - 6322，低限' },
                { text: '+3 - 5332，高限' },
                { text: '+4 - 6332，高限', pending: '「6332」共14張，疑為「6322」，請確認。' },
              ],
            },
            {
              kind: 'responses',
              caption: '例如：',
              auction: seq('1S', '2NT', '3C', ask('3D', '詢問牌型及點力'), '3S', ask('3NT')),
              rows: [
                { call: '4C', meaning: '5332，12~13-' },
                { call: '4D', meaning: '6322，11~12-' },
                { call: '4H', meaning: '5332，13+~14' },
                {
                  call: '4S',
                  meaning: '6332，12+~13',
                  pending: '「6332」共14張，疑為「6322」，請確認。',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '2.7張以上的♠幾乎不太可能，萬一真的有，看點力好壞決定是否高叫。',
            },
            { kind: 'paragraph', text: '3.答叫者越過RKCB(♠是4NT)，5線其他花色為要求第二控去6線。' },
            {
              kind: 'responses',
              caption: '例如：',
              auction: seq('1S', '2NT', '3H', ask('3S', '詢問牌型及點力'), '4D'),
              rows: [{ call: '5C', meaning: '要求♣第二控去6♠' }],
            },
            {
              kind: 'paragraph',
              text: '4.開叫者回答時若已越過4♠時，答叫者加一即為RKCB，回叫方式同',
              pending: '原文此句到「回叫方式同」就結束，推測為「同RKCB」，請確認。',
            },
            {
              kind: 'responses',
              caption: '例如：',
              auction: seq(
                '1S',
                '2NT',
                '3H',
                ask('3S', '詢問牌型及點力'),
                '4NT',
                ask('5C', 'RKCB'),
              ),
              rows: [
                { call: '5D', meaning: '14' },
                { call: '5H', meaning: '03' },
                { call: '5S', meaning: '25沒王Q' },
                { call: '5NT', meaning: '25有王Q' },
              ],
            },
            { kind: 'paragraph', text: '5.越過RKCB(4NT)的跳叫均為EKB(除外問A)，報法同RKCB' },
            {
              kind: 'responses',
              caption: '例如：',
              auction: seq('1S', '2NT', '3C', '3D', '3S'),
              rows: [{ call: '5C', meaning: 'EKB' }],
            },
            {
              kind: 'paragraph',
              text: '6.captain永遠是答叫者，除了開叫者2NT後直接4NT，或是答叫者叫回4♠。',
            },
            {
              kind: 'paragraph',
              text: '7.當開叫者有短門時（已經報過點力及王牌張數），答叫者之加一新花為check高低限，高低限的報法依空間而定，4♠為最低限牌力，越接近4♠越爛，以此類推。',
            },
            {
              kind: 'responses',
              caption: '例如：',
              auction: seq('1S', '2NT', '3C', '3D', '4C'),
              rows: [{ call: '4D', meaning: 'check高低限(高限回答4♥，低限叫回4♠)' }],
            },
            {
              kind: 'responses',
              auction: seq('1S', '2NT', '3C', '3D', '3NT'),
              rows: [{ call: '4C', meaning: 'check高低限(最高限=4♦，中間牌力=4♥，最低限=4♠)' }],
            },
            {
              kind: 'responses',
              auction: seq('1S', '2NT', '3C', '3D', '4D'),
              rows: [{ call: '4H', meaning: 'check(因為沒有空間，高限4NT，低限叫回4♠)' }],
            },
            { kind: 'paragraph', text: '8.越過RKCB，跳叫5NT是詢問4張的牌組' },
            {
              kind: 'responses',
              caption: '例如：',
              auction: seq('1S', '2NT', '3C', '3D', '3NT', '4C', '4D'),
              rows: [{ call: '5NT', meaning: '詢問4張牌組(3NT一定是5431)' }],
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
              text: '加一之3NT為詢問4張之牌組，加二以上新花為短門詢問（點力14↑，不然1♠後直接使用splinter即可）：',
            },
            {
              kind: 'responses',
              auction: seq('1S', '2NT', '3S'),
              rows: [
                { call: '3NT', meaning: '詢問4張之牌組' },
                { call: '4C', meaning: '♣短門，CHECK好壞牌' },
                { call: '4D', meaning: '♦短門，CHECK好壞牌' },
                { call: '4H', meaning: '♥短門，CHECK好壞牌' },
              ],
            },
            { kind: 'note', tone: 'info', text: 'P.S.開叫者好牌時，依序報，4♠最低限' },
            {
              kind: 'responses',
              caption: '例如：',
              auction: seq('1S', '2NT', '3S', '4D'),
              rows: [
                { call: '4H', meaning: '好牌，♦沒廢點' },
                { call: '4S', meaning: '爛牌，♦有廢點' },
              ],
            },
            {
              kind: 'responses',
              auction: seq('1S', '2NT', '3S', '4H'),
              rows: [
                { call: '4S', meaning: '爛牌，♥有廢點' },
                { call: '4NT', meaning: '好牌，♥沒廢點' },
              ],
            },
            {
              kind: 'responses',
              auction: seq('1S', '2NT', '3S', '4H', '4NT'),
              rows: [
                { call: '5C', meaning: 'RKCB' },
                { call: '5D', meaning: '要求♦有第二控去6♠' },
                {
                  call: '5H',
                  meaning: '♥ VOID邀請4♥',
                  pending:
                    '原文「邀請4H」；對照開叫1♥時同位置寫「邀請6H」，疑應為「邀請6♠」，請確認。',
                },
                { call: '5S', meaning: '要求♣有第二控去6♠' },
              ],
            },
            {
              kind: 'responses',
              auction: seq('1S', '2NT', '3S', '3NT'),
              rows: [
                { call: '4C', meaning: '5224(4♦詢問高低限，之後4♥=高限，4♠=低限)' },
                { call: '4D', meaning: '5242(4♥詢問高低限，之後4NT=高限，4♠=低限)' },
                { call: '4H', meaning: '5422高限' },
                { call: '4S', meaning: '5422低限' },
              ],
            },
          ],
        },
        {
          id: 'spade-after-3nt',
          title: '開叫者3NT之後續答叫',
          originalTitle: '◎ 開叫者3NT之後續答叫',
          blocks: [
            {
              kind: 'paragraph',
              text: '原則同3♠後續叫品，不過捨棄♣短門詢問的叫品，加一之4♣為詢問4張之牌組，加二以上新花為短門詢問：',
            },
            {
              kind: 'responses',
              auction: seq('1S', '2NT', '3NT'),
              rows: [
                { call: '4C', meaning: '詢問4張之牌組' },
                { call: '4D', meaning: '♦短門，CHECK好壞牌' },
                { call: '4H', meaning: '♥短門，CHECK好壞牌' },
              ],
            },
            {
              kind: 'responses',
              auction: seq('1S', '2NT', '3NT', '4C'),
              rows: [
                { call: '4D', meaning: '5242' },
                { call: '4H', meaning: '5422' },
                { call: '4S', meaning: '5224(低限)' },
                { call: '4NT', meaning: '5224(高限)' },
              ],
            },
            {
              kind: 'note',
              tone: 'info',
              text: 'P.S.4♦、4♥高低限未知，反正還沒到4♠，高限也不用擔心被pass',
            },
          ],
        },
        {
          id: 'spade-after-four-level',
          title: '開叫者4♣、4♦、4♥之後續答叫',
          originalTitle: '◎ 開叫者4C、4D、4H之後續答叫',
          blocks: [
            { kind: 'paragraph', text: '叫新花為check高低限，4♠為爛牌，4NT為RKCB' },
            {
              kind: 'responses',
              auction: seq('1S', '2NT', '4C'),
              rows: [
                { call: '4D', meaning: 'check高低限(4♥=高限14↑牌力，4♠=低限)' },
                { call: '4S', meaning: '低限' },
                { call: '4NT', meaning: 'RKCB' },
              ],
            },
            {
              kind: 'responses',
              auction: seq('1S', '2NT', '4D'),
              rows: [
                { call: '4H', meaning: 'check高低限(4NT=高限14↑牌力，4♠=低限)' },
                { call: '4S', meaning: '低限' },
                { call: '4NT', meaning: 'RKCB' },
              ],
            },
            {
              kind: 'responses',
              auction: seq('1S', '2NT', '4H'),
              rows: [
                { call: '4S', meaning: '低限' },
                { call: '4NT', meaning: 'RKCB' },
                { call: '5S', meaning: '邀請高限14↑牌力去6♠' },
              ],
            },
          ],
        },
        {
          id: 'spade-responses',
          title: '開叫1♠的答叫',
          originalTitle: '◎ 開叫1S的答叫',
          blocks: [
            {
              kind: 'responses',
              auction: seq('1S'),
              rows: [
                { call: '1NT', meaning: '6-12，F一圈' },
                { call: '2C', meaning: '12+↑，GF，4張♣↑' },
                { call: '2D', meaning: '12+↑，GF，4張♦↑' },
                { call: '2H', meaning: '12+↑，GF，5張♥↑' },
                { call: '2S', meaning: '3張♠，8-10(4張♠的4333，8-10)' },
                { call: '2NT', meaning: '♠ fit GF' },
                { call: '3C', meaning: 'muti，♠ invite↑' },
                { call: '3D', meaning: 'muti，4張♠，8-9' },
                { call: '3H', meaning: 'muti，4張♠，6-7' },
                { call: '3S', meaning: 'muti，4張♠，3-5' },
                { call: '3NT', meaning: '4張♠↑，12-13，void一門(4♣詢問)' },
                { call: '4C', meaning: '4張♠↑，12-13，♣單張' },
                { call: '4D', meaning: '4張♠↑，12-13，♦單張' },
                { call: '4H', meaning: '4張♠↑，12-13，♥單張' },
                { call: '4S', meaning: '4張♠↑，4-7，畸型牌型' },
                { call: '4NT', meaning: '♥ EKB(RKCB須先假叫其他叫品)' },
                { call: '5C', meaning: '♣ EKB' },
                { call: '5D', meaning: '♦ EKB' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'heart',
      title: '開叫1♥時的滿貫詢問叫（2♠）',
      originalTitle: '開叫1H時的滿貫詢問叫（2S）',
      summary: '1♥ 2♠ 之後開叫者報牌型，以及加一詢問、3♥／3♠／3NT 以上的後續。',
      children: [
        {
          id: 'heart-rebids',
          title: '開叫者回答：1♥ 2♠ ?',
          blocks: [
            {
              kind: 'responses',
              caption: '2♠：12↑，4張♥↑或13點↑，3張♥',
              auction: seq('1H', '2S'),
              rows: [
                {
                  call: '2NT',
                  meaning:
                    '1.短門♠，12~21　2.12~14平均牌型(12-14的5332或是11-13的6322)　3.有長有短之畸型牌5521、6511(或是約定♥＋長門10張↑，亦即知道單張及雙張的花色為何)',
                },
                { call: '3C', meaning: '短門♣ or 15-17平均牌型(15-17的5332或是14-16的6322)' },
                { call: '3D', meaning: '短門♦ or 18~19平均牌型(18-19的5332或是17-20的6322)' },
                { call: '3H', meaning: '5422牌型，12~15' },
                { call: '3S', meaning: '5422牌型，16~21' },
                { call: '3NT', meaning: '♠ void' },
                { call: '4C', meaning: '♣ void' },
                {
                  call: '4D',
                  meaning: '♦ void高限(點力範圍看身價及牌型，至少比最低開牌力量多2點以上)',
                },
                { call: '4H', meaning: '♦ void低限' },
                { call: '4S', meaning: '♠ EKB' },
                { call: '4NT', meaning: '♦ EKB' },
                { call: '5C', meaning: '♣ EKB' },
              ],
            },
            {
              kind: 'note',
              tone: 'info',
              text: 'P.S.2NT假如約定5521或是6511才能用時，那6421或7321就當短門報，',
            },
          ],
        },
        {
          id: 'heart-relay',
          title: '開叫者2NT、3♣、3♦後之後續答叫',
          originalTitle: '◎ 開叫者2NT or 3C or 3D後之後續答叫',
          blocks: [
            {
              kind: 'paragraph',
              text: '加一花色為詢問，回答原則下面有說明，加二以上之旁花色為短門詢問（大部份是以加一詢問為優先叫品）',
            },
          ],
          children: [
            {
              id: 'heart-relay-2nt',
              title: '1♥ 2♠ 2NT 之後加一詢問',
              blocks: [
                {
                  kind: 'paragraph',
                  text: '2NT加一詢問之答叫方式，+1為5521，+2為平均牌型，+3以上皆是短門報法：',
                },
                {
                  kind: 'rules',
                  items: [
                    { text: '+1  5521、6421、6511(♥＋長門10張↑)' },
                    { text: '+2  平均牌型(5332、6322、7222)' },
                    { text: '+3  5張♥，12~15，單張♠' },
                    { text: '+4  6張♥↑，11~14，單張♠' },
                    { text: '+5  5張♥，16~18，單張♠' },
                    { text: '+6  6張♥↑，15~17，單張♠' },
                    { text: '+7  5張♥，19~21，單張♠' },
                    { text: '+8  6張♥↑，18~20，單張♠' },
                  ],
                },
                {
                  kind: 'responses',
                  caption: '例如：',
                  auction: seq('1H', '2S', '2NT', ask('3C')),
                  rows: [
                    { call: '3D', meaning: '♥＋長門10張↑（答叫方式詳後述）' },
                    { call: '3H', meaning: '12~14平均牌型' },
                    { call: '3S', meaning: '5張♥，12~15，單張♠' },
                    { call: '3NT', meaning: '6張♥↑，11~14，單張♠' },
                    { call: '4C', meaning: '5張♥，16~18，單張♠' },
                    { call: '4D', meaning: '6張♥↑，15~17，單張♠' },
                    { call: '4H', meaning: '5張♥，19~21，單張♠' },
                    { call: '4S', meaning: '6張♥↑，18~20，單張♠' },
                  ],
                },
              ],
            },
            {
              id: 'heart-relay-3c',
              title: '1♥ 2♠ 3♣ 之後加一詢問',
              blocks: [
                {
                  kind: 'paragraph',
                  text: '3♣後加一詢問之答叫方式，+1為平均牌型，+2以上皆是短門報法：',
                },
                {
                  kind: 'rules',
                  items: [
                    { text: '+1  平均牌型(5332、6322、7222)' },
                    { text: '+2  5張♥，12~15，單張♣' },
                    { text: '+3  6張♥↑，11~14，單張♣' },
                    { text: '+4  5張♥，16~18，單張♣' },
                    { text: '+5  6張♥↑，15~17，單張♣' },
                    { text: '+6  5張♥，19~21，單張♣' },
                    { text: '+7  6張♥↑，18~20，單張♣' },
                  ],
                },
                {
                  kind: 'responses',
                  caption: '例如：',
                  auction: seq('1H', '2S', '3C', '3D'),
                  rows: [
                    { call: '3H', meaning: '平均牌型15~17' },
                    { call: '3S', meaning: '5張♥，12~15，單張♣' },
                    { call: '3NT', meaning: '6張♥↑，11~14，單張♣' },
                    { call: '4C', meaning: '5張♥，16~18，單張♣' },
                    { call: '4D', meaning: '6張♥↑，15~17，單張♣' },
                    { call: '4H', meaning: '5張♥，19~21，單張♣' },
                    { call: '4S', meaning: '6張♥↑，18~20，單張♣' },
                  ],
                },
              ],
            },
            {
              id: 'heart-relay-3d',
              title: '1♥ 2♠ 3♦ 之後加一詢問',
              blocks: [
                {
                  kind: 'paragraph',
                  text: '3♦後加一詢問之答叫方式，+1為平均牌型，+2以上皆是短門報法：',
                },
                {
                  kind: 'rules',
                  items: [
                    { text: '+1  平均牌型(5332、6322、7222)' },
                    { text: '+2  5張♥，12~15，單張♦' },
                    { text: '+3  6張♥↑，11~14，單張♦' },
                    { text: '+4  5張♥，16~18，單張♦' },
                    { text: '+5  6張♥↑，15~17，單張♦' },
                    { text: '+6  5張♥，19~21，單張♦' },
                    { text: '+7  6張♥↑，18~20，單張♦' },
                  ],
                },
                {
                  kind: 'responses',
                  caption: '例如：',
                  auction: seq('1H', '2S', '3D', ask('3H')),
                  rows: [
                    { call: '3S', meaning: '平均牌型18~19(5332、6322、7222)' },
                    { call: '3NT', meaning: '5張♥，12~15，單張♦' },
                    {
                      call: '4D',
                      meaning: '6張♥↑，11~14，單張♦',
                      pending:
                        '依上方 +1～+7 的規則，3NT之後應依序為4♣、4♦…；原文從3NT直接跳到4♦、最後到5♣，似乎漏了4♣，請確認。',
                    },
                    { call: '4H', meaning: '5張♥，16~18，單張♦' },
                    { call: '4S', meaning: '6張♥↑，15~17，單張♦' },
                    { call: '4NT', meaning: '5張♥，19~21，單張♦' },
                    { call: '5C', meaning: '6張♥↑，18~20，單張♦' },
                  ],
                },
              ],
            },
            {
              id: 'heart-relay-two-suiter',
              title: '2NT後回答3♦之有長有短的報法',
              blocks: [
                {
                  kind: 'responses',
                  auction: seq('1H', '2S', '2NT', ask('3C'), '3D', ask('3H')),
                  rows: [
                    {
                      call: '3S',
                      meaning: '短門花色及下一階級長門花色，4♣為詢問',
                      pending:
                        '下一個例子用3NT詢問（3♠ 3NT），原文此處卻寫「4C為詢問」（與1♠段落相同），疑應為「3NT為詢問」，請確認。',
                    },
                    { call: '3NT', meaning: '♠短＋5張♦↑（短門＋下二級長門花色）' },
                    { call: '4C', meaning: '♣短＋5張♠↑（短門＋下二級長門花色）' },
                    { call: '4D', meaning: '♦短＋5張♣↑（短門＋下二級長門花色）' },
                  ],
                },
                {
                  kind: 'responses',
                  auction: seq('1H', '2S', '2NT', ask('3C'), '3D', ask('3H'), '3S', ask('3NT')),
                  rows: [
                    { call: '4C', meaning: '♣短＋5張♦↑（短門＋下一級長門花色）' },
                    { call: '4D', meaning: '♦短＋5張♠↑（短門＋下一級長門花色）' },
                    { call: '4H', meaning: '♠短＋5張♣↑（短門＋下一級長門花色）' },
                  ],
                },
                {
                  kind: 'note',
                  tone: 'info',
                  text: 'P.S.口訣是加一是1+1(短門再加下一級長門)，直接叫是1+2(短門再加下二級長門)',
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
              text: '1.當開叫者為平均牌型時，答叫者加一為詢問王牌張數及高低限，加二以上之新花為短門詢問，回答原則如下：',
            },
            {
              kind: 'rules',
              items: [
                { text: '+1 - 5332，低限' },
                { text: '+2 - 6322，低限' },
                { text: '+3 - 5332，高限' },
                { text: '+4 - 6332，高限', pending: '「6332」共14張，疑為「6322」，請確認。' },
              ],
            },
            {
              kind: 'responses',
              caption: '例如：',
              auction: seq('1H', '2S', '2NT', ask('3C', '詢問牌型及點力'), '3H', ask('3S')),
              rows: [
                { call: '3NT', meaning: '5332，12~13-' },
                {
                  call: '4C',
                  meaning: '6332，11~12-',
                  pending: '「6332」共14張，依規則+2應為「6322」，請確認。',
                },
                { call: '4D', meaning: '5332，13+~14' },
                { call: '4H', meaning: '6322，12+~13' },
              ],
            },
            {
              kind: 'paragraph',
              text: '2. 7張以上的♥幾乎不太可能，萬一真的有，看點力好壞決定是否高叫。',
            },
            {
              kind: 'paragraph',
              text: '3.**♥為王牌時，這時的RKCB為4♠，不是4NT**，答叫者越過4♠，其他花色為要求第二控去6線。',
            },
            {
              kind: 'responses',
              caption: '例如：',
              auction: seq('1H', '2S', '3H', ask('3S'), '4D'),
              rows: [
                { call: '4S', meaning: 'RKCB' },
                { call: '4NT', meaning: '要求♠有第二控去6♥' },
                { call: '5C', meaning: '要求♣第二控去6♥' },
                { call: '5D', meaning: '要求♦第二控去6♥' },
              ],
            },
            {
              kind: 'paragraph',
              text: '4.開叫者回答時若已越過4♥時，答叫者加一即為RKCB，回叫方式同',
              pending: '原文此句到「回叫方式同」就結束，推測為「同RKCB」，請確認。',
            },
            {
              kind: 'responses',
              caption: '例如：',
              auction: seq('1H', '2S', '3D', ask('3H', '詢問牌型及點力'), '4S', ask('4NT', 'RKCB')),
              rows: [
                { call: '5C', meaning: '14' },
                { call: '5D', meaning: '03' },
                { call: '5H', meaning: '25沒王Q' },
                { call: '5S', meaning: '25有王Q' },
              ],
            },
            { kind: 'paragraph', text: '5.越過RKCB(4♠)的跳叫均為EKB' },
            {
              kind: 'responses',
              caption: '例如：',
              auction: seq('1H', '2S', '2NT', '3C', '3H'),
              rows: [{ call: '4NT', meaning: 'EKB ♠' }],
            },
            {
              kind: 'paragraph',
              text: '6.captain永遠是答叫者，除了開叫者2♠後直接4♠，或是答叫者叫回4♥。',
            },
            {
              kind: 'paragraph',
              text: '7.當開叫者有短門時（已經報過點力及王牌張數），答叫者之加一新花為check高低限，高低限的報法依空間而定，4♥為最低限牌力，越接近4♥越爛，以此類推。',
            },
            {
              kind: 'responses',
              caption: '例如：',
              auction: seq('1H', '2S', '2NT', '3C', '3NT'),
              rows: [{ call: '4C', meaning: 'check高低限(高限回答4♦，低限叫回4♥)' }],
            },
            {
              kind: 'responses',
              auction: seq('1H', '2S', '2NT', '3C', '4C'),
              rows: [{ call: '4D', meaning: 'check高低限(因為沒有空間，高限4♠，低限叫回4♥)' }],
            },
            { kind: 'paragraph', text: '8.越過RKCB，跳叫5NT是詢問4張的牌組' },
            {
              kind: 'responses',
              caption: '例如：',
              auction: seq('1H', '2S', '2NT', '3C', '3S', '3NT', '4C'),
              rows: [{ call: '5NT', meaning: '詢問4張牌組(3♠一定是5431)' }],
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
              text: '加一之3♠為詢問4張之牌組，加二以上為短門詢問（點力14↑，不然1♥後直接使用splinter即可）：',
            },
            {
              kind: 'responses',
              auction: seq('1H', '2S', '3H'),
              rows: [
                { call: '3S', meaning: '詢問4張之牌組' },
                { call: '3NT', meaning: '♠短門，CHECK好壞牌' },
                { call: '4C', meaning: '♣短門，CHECK好壞牌' },
                { call: '4D', meaning: '♦短門，CHECK好壞牌' },
              ],
            },
            { kind: 'note', tone: 'info', text: 'P.S. 開叫者好牌時，依序報，4♥最低限' },
            {
              kind: 'responses',
              caption: '例如：',
              auction: seq('1H', '2S', '3H', '4C'),
              rows: [
                { call: '4D', meaning: '好牌，♣沒廢點' },
                { call: '4H', meaning: '爛牌，♣有廢點' },
              ],
            },
            {
              kind: 'responses',
              auction: seq('1H', '2S', '3H', '4D'),
              rows: [
                { call: '4H', meaning: '爛牌，♦有廢點' },
                { call: '4S', meaning: '好牌，♦沒廢點' },
              ],
            },
            {
              kind: 'responses',
              auction: seq('1H', '2S', '3H', '4D', '4S'),
              rows: [
                { call: '4NT', meaning: 'RKCB' },
                { call: '5C', meaning: '要求♣第二控去6♥' },
                { call: '5D', meaning: '♦ VOID邀請6♥' },
                { call: '5H', meaning: '要求♠第二控去6♥' },
              ],
            },
            {
              kind: 'responses',
              auction: seq('1H', '2S', '3H', '3S'),
              rows: [
                { call: '3NT', meaning: '4522(4♣詢問高低限，之後4♦=高限，4♥=低限)' },
                { call: '4C', meaning: '2524(4♦詢問高低限，之後4♠=高限，4♥=低限)' },
                { call: '4D', meaning: '2542高限' },
                { call: '4H', meaning: '2542低限' },
              ],
            },
          ],
        },
        {
          id: 'heart-after-3s',
          title: '開叫者3♠之後續答叫',
          originalTitle: '◎ 開叫者3S之後續答叫',
          blocks: [
            {
              kind: 'paragraph',
              text: '原則同3♥後續叫品，不過捨棄♠短門詢問的叫品，加一之3NT為詢問4張之牌組，加二以上新花為短門詢問：',
            },
            {
              kind: 'responses',
              auction: seq('1H', '2S', '3S'),
              rows: [
                { call: '3NT', meaning: '詢問4張之牌組' },
                { call: '4C', meaning: '♣短門，CHECK好壞牌' },
                { call: '4D', meaning: '♦短門，CHECK好壞牌' },
              ],
            },
            {
              kind: 'responses',
              auction: seq('1H', '2S', '3S', '3NT'),
              rows: [
                { call: '4C', meaning: '2524' },
                { call: '4D', meaning: '2542' },
                { call: '4H', meaning: '4522(低限)' },
                { call: '4S', meaning: '4522(高限)' },
              ],
            },
            {
              kind: 'note',
              tone: 'info',
              text: 'P.S.4♣、4♦高低限未知，反正還沒到4♥，高限也不用擔心被pass',
            },
          ],
        },
        {
          id: 'heart-after-3nt-and-up',
          title: '開叫者3NT、4♣、4♦之後續答叫',
          originalTitle: '◎ 開叫者3NT、4C、4D之後續答叫',
          blocks: [
            {
              kind: 'paragraph',
              text: '叫新花為check高低限，4♥為爛牌，4NT為RKCB',
              pending:
                '依注意事項第3點，♥為王牌時RKCB為4♠，下方例子也都用4♠ RKCB；此處寫「4NT為RKCB」，請確認。',
            },
            {
              kind: 'responses',
              auction: seq('1H', '2S', '3NT'),
              rows: [
                { call: '4C', meaning: 'check高低限(4♦=高限14↑牌力，4♥=低限)' },
                { call: '4H', meaning: '低限' },
                { call: '4S', meaning: 'RKCB' },
              ],
            },
            {
              kind: 'responses',
              auction: seq('1H', '2S', '4C'),
              rows: [
                { call: '4D', meaning: 'check高低限(4♠=高限14↑牌力，4♥=低限)' },
                { call: '4H', meaning: '低限' },
                { call: '4S', meaning: 'RKCB' },
              ],
            },
            {
              kind: 'responses',
              auction: seq('1H', '2S', '4D'),
              rows: [
                { call: '4H', meaning: '低限' },
                { call: '4S', meaning: 'RKCB' },
                { call: '5H', meaning: '邀請高限14↑牌力去6♥' },
              ],
            },
          ],
        },
        {
          id: 'heart-responses',
          title: '開叫1♥的答叫',
          originalTitle: '◎ 開叫1H的答叫',
          blocks: [
            {
              kind: 'responses',
              auction: seq('1H'),
              rows: [
                { call: '1S', meaning: '6↑，F' },
                { call: '1NT', meaning: '6-12，F一圈' },
                { call: '2C', meaning: '12+↑，GF，4張♣↑' },
                { call: '2D', meaning: '12+↑，GF，5張♦↑' },
                { call: '2H', meaning: '3張♥，8-10(4張♥的3433，8-10)' },
                { call: '2S', meaning: '♥ fit GF' },
                { call: '2NT', meaning: 'muti，♥ invite↑' },
                { call: '3C', meaning: 'muti，4張♥，8-9' },
                { call: '3D', meaning: 'muti，4張♥，6-7' },
                { call: '3H', meaning: 'muti，4張♥，3-5' },
                { call: '3S', meaning: '4張♥↑，12-13，void一門(3NT詢問)' },
                { call: '3NT', meaning: '4張♥↑，12-13，♠單張' },
                { call: '4C', meaning: '4張♥↑，12-13，♣單張' },
                { call: '4D', meaning: '4張♥↑，12-13，♦單張' },
                { call: '4H', meaning: '4張♥↑，4-7，畸型牌型' },
                { call: '4S', meaning: '♠ EKB(RKCB須先假叫其他叫品)' },
                { call: '4NT', meaning: '♦ EKB' },
                { call: '5C', meaning: '♣ EKB' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
