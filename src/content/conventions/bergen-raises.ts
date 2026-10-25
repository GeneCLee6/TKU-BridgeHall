import type {
  Auction,
  AuctionCall,
  Block,
  Convention,
  ResponseRow,
  Section,
} from '../../types/convention.ts'

/**
 * BERGEN(松濤版) (Bergen raises)
 * Source: the club's Word file "Bergen".
 * Transcribed verbatim; only bids and suit letters were rewritten with suit symbols (3C -> 3♣,
 * "4+S" -> "4+♠"). Text that is red in the source is kept as **bold**. Where the source lists
 * several hand types for one call, they are joined with "／". The source shows no opponents'
 * calls, so their seats are left empty.
 */

const seats: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']
const SUIT: Record<string, string> = { C: '♣', D: '♦', H: '♥', S: '♠' }

/** Our side's calls in order (opener first), with the opponents' seats left empty, ending in '?' */
const seq = (...calls: AuctionCall[]): Auction => ({
  seats,
  calls: [...calls.flatMap((c) => [c, '']), '?'],
})

const show = (c: AuctionCall) =>
  (typeof c === 'string' ? c : c.call).replace(/^(\d)([CDHS])$/, (_, n, s) => n + SUIT[s])

/** Notes longer than this read badly inside the narrow auction diagram, so they become a caption */
const LONG_NOTE = 8

/** One auction as its own dropdown: the title is the auction so far, then the possible calls */
const branch = (
  id: string,
  calls: AuctionCall[],
  rows: ResponseRow[],
  extra: { pending?: string; blocks?: Block[] } = {},
): Section => {
  const isLong = (c: AuctionCall) => typeof c !== 'string' && (c.note?.length ?? 0) > LONG_NOTE
  const caption = calls
    .filter(isLong)
    .map((c) => `${show(c)}：${typeof c === 'string' ? '' : c.note}`)
    .join('　')
  const auction = seq(...calls.map((c) => (isLong(c) && typeof c !== 'string' ? c.call : c)))
  return {
    id,
    title: `${calls.map(show).join(' ')} ?`,
    pending: extra.pending,
    blocks: [
      { kind: 'responses', caption: caption || undefined, auction, rows },
      ...(extra.blocks ?? []),
    ],
  }
}

export const bergenRaises: Convention = {
  slug: 'bergen-raises',
  nameZh: 'Bergen加叫（松濤版）',
  nameEn: 'Bergen Raises',
  aliases: ['Bergen', 'BERGEN(松濤版)', '松濤版', '跳叫答叫', '高花加叫'],
  category: 'suit-openings',
  kind: 'convention',
  level: 'advanced',
  cardSlots: [
    'wbf.openings.1H.responses <- heart-raises#0',
    'wbf.openings.1S.responses <- spade-raises#0',
  ],
  tags: ['高花開叫', '跳叫答叫', '加叫', '短門', 'splinter'],
  summary:
    '開叫 1♠／1♥ 後答叫者以跳叫表示支持與牌力（依牌值分段），以及開叫者詢問短門、好壞牌的後續。',
  source: { title: 'Bergen', note: '文件標題：BERGEN(松濤版)' },
  updated: '2026-10-21',
  sections: [
    {
      id: 'spade-raises',
      title: '開叫1♠之跳叫答叫',
      summary: '3♣ 10-11、3♦ 8-9、3♥ 6-7、3♠ 4-5（牌值）；3NT／4♣／4♦／4♥ 12-13 短門。',
      blocks: [
        {
          kind: 'responses',
          auction: seq('1S'),
          rows: [
            {
              call: '3C',
              meaning:
                '10-11 hcp，4張+♠，無短門（不能是4333）／10-11 hcp，3張♠帶5張牌組↑及一門單張／10-11 hcp，4+♠，一門單張／10-11 hcp，4+♠，一門void',
            },
            {
              call: '3D',
              meaning:
                '8-9 hcp，4+♠，無短門（4432、5332）或6-7 HCP，4+♠，一門單張，即牌值為8~9的牌／8-9 hcp，4+♠，一門單張／8-9 hcp，4+♠，一門void',
            },
            {
              call: '3H',
              meaning:
                '6-7 hcp，4+♠，無短門（4432、5332）或4-5 HCP，4+♠，一門單張，即牌值為6~7的牌／6-7 hcp，4+♠，一門void',
            },
            { call: '3S', meaning: '4-5 hcp，4+♠，即牌值為4~5的牌' },
            { call: '3NT', meaning: '12-13 hcp，4+♠，一門void' },
            { call: '4C', meaning: '12-13 hcp，4+♠，♣單張' },
            { call: '4D', meaning: '12-13 hcp，4+♠，♦單張' },
            { call: '4H', meaning: '12-13 hcp，4+♠，♥單張' },
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'P.S.1.比以上的牌更好者，一律叫2NT。　2.四張王配合之4333者，當3張王答叫。',
        },
      ],
    },
    {
      id: 'spade-3c',
      title: '1♠ - 3♣後續答叫',
      children: [
        branch(
          's3c',
          ['1S', '3C'],
          [
            { call: '3D', meaning: '14+牌力，詢問同伴是那一種牌' },
            { call: '3H', meaning: '長門♥，64或55以上的牌型（好牌叫旁門最低控，壞牌叫3♠）' },
            { call: '3S', meaning: '最低限牌力' },
            { call: '4C', meaning: '長門♣，64或55以上的牌型（好牌叫旁門最低控，壞牌叫4♠）' },
            { call: '4D', meaning: '長門♦，64或55以上的牌型（好牌叫4♥，壞牌叫4♠）' },
          ],
        ),
        branch(
          's3c-3d',
          ['1S', '3C', '3D'],
          [
            { call: '3H', meaning: '10-11 hcp，3張♠帶5張牌組及一門單張' },
            { call: '3S', meaning: '10-11 hcp，4+♠，無短門（4432、5332）' },
            { call: '3NT', meaning: '10-11 hcp，4+♠，一門void（開叫人一定要叫4♣詢問）' },
            { call: '4C', meaning: '10-11 hcp，4+♠，♣單張' },
            { call: '4D', meaning: '10-11 hcp，4+♠，♦單張' },
            { call: '4H', meaning: '10-11 hcp，4+♠，♥單張' },
          ],
        ),
        branch(
          's3c-3d-3h',
          ['1S', '3C', '3D', { call: '3H', note: '10-11 hcp，3張♠帶5張牌組及一門單張' }],
          [
            { call: '3S', meaning: '詢問' },
            { call: '3NT', meaning: 'void一門，答叫者一定要回答4♣' },
            { call: '4C', meaning: '♣單張，詢問好壞牌（好牌叫旁門最低控，壞牌叫4♠）' },
            { call: '4D', meaning: '♦單張，詢問好壞牌（好牌叫4♥，壞牌叫4♠）' },
            { call: '4H', meaning: '♥單張，詢問好壞牌（好牌叫4NT，壞牌叫4♠）' },
            { call: '4S', meaning: '束叫' },
          ],
        ),
        branch(
          's3c-3d-3h-3s',
          ['1S', '3C', '3D', '3H', '3S'],
          [
            { call: '3NT', meaning: '短門花色及下一階級長門花色(1+1)，4♣為詢問' },
            { call: '4C', meaning: '3張♠＋♣短＋5張♥↑（短門＋下二級長門花色1+2）' },
            { call: '4D', meaning: '3張♠＋♦短＋5張♣↑（短門＋下二級長門花色1+2）' },
            { call: '4H', meaning: '**3張♠＋♥短＋5張♦↑（短門＋下二級長門花色1+2）高限**' },
            { call: '4S', meaning: '**3張♠＋♥短＋5張♦↑（短門＋下二級長門花色1+2）低限**' },
          ],
        ),
        branch(
          's3c-3d-3h-3s-3nt',
          ['1S', '3C', '3D', '3H', '3S', '3NT', '4C'],
          [
            { call: '4D', meaning: '3張♠＋♦短＋5張♥↑（短門＋下一級長門花色）' },
            { call: '4H', meaning: '3張♠＋♥短＋5張♣↑（短門＋下一級長門花色）' },
            { call: '4S', meaning: '3張♠＋♣短＋5張♦↑（短門＋下一級長門花色）' },
          ],
        ),
        branch(
          's3c-3d-3h-3nt',
          ['1S', '3C', '3D', '3H', '3NT', '4C'],
          [
            { call: '4D', meaning: '♦ void，詢問好壞牌（好牌叫4♥，壞牌叫4♠）' },
            { call: '4H', meaning: '♥ void，詢問好壞牌（好牌叫4NT，壞牌叫4♠）' },
            { call: '4S', meaning: '♣ void，詢問好壞牌（好牌叫4NT，壞牌pass）' },
          ],
        ),
        branch(
          's3c-3d-3s',
          ['1S', '3C', '3D', '3S'],
          [
            { call: '3NT', meaning: 'void一門，答叫者一定要回答4♣' },
            { call: '4C', meaning: '♣單張，詢問好壞牌（好牌叫旁門最低控，壞牌叫4♠）' },
            { call: '4D', meaning: '♦單張，詢問好壞牌（好牌叫4♥，壞牌叫4♠）' },
            { call: '4H', meaning: '♥單張，詢問好壞牌（好牌叫4NT，壞牌叫4♠）' },
          ],
        ),
        branch(
          's3c-3d-3s-3nt',
          ['1S', '3C', '3D', '3S', '3NT', '4C'],
          [
            { call: '4D', meaning: '♦ void，詢問好壞牌（好牌叫4♥，壞牌叫4♠）' },
            { call: '4H', meaning: '♥ void，詢問好壞牌（好牌叫4NT，壞牌叫4♠）' },
            { call: '4S', meaning: '♣ void，詢問好壞牌（好牌叫4NT，壞牌pass）' },
          ],
        ),
        branch(
          's3c-3d-3nt',
          ['1S', '3C', '3D', '3NT', '4C'],
          [
            { call: '4D', meaning: '♦ void' },
            { call: '4H', meaning: '♥ void' },
            { call: '4S', meaning: '♣ void' },
          ],
        ),
        branch(
          's3c-3h',
          ['1S', '3C', '3H'],
          [
            { call: '3S', meaning: 'WAITING，詢問短門' },
            { call: '3NT', meaning: '10-11 hcp，4+♠，一門void（開叫人一定要叫4♣詢問）' },
            { call: '4C', meaning: '10-11 hcp，4+♠，♣單張' },
            { call: '4D', meaning: '10-11 hcp，4+♠，♦單張' },
            { call: '4H', meaning: '10-11 hcp，4+♠，♥單張' },
            { call: '4S', meaning: '爛牌低限(短門都廢點)' },
          ],
        ),
        branch(
          's3c-3s',
          ['1S', '3C', '3S'],
          [
            { call: '3NT', meaning: '一門void（開叫人叫4♣為詢問）' },
            { call: '4S', meaning: '高限，束叫' },
          ],
        ),
      ],
    },
    {
      id: 'spade-3d',
      title: '1♠ - 3♦後續答叫',
      children: [
        branch(
          's3d',
          ['1S', '3D'],
          [
            { call: '3H', meaning: '15+，詢問牌型' },
            { call: '3S', meaning: '14 hcp以下，低限' },
            { call: '4C', meaning: '16+，長門♣，64或55以上的牌型（好牌叫旁門控，壞牌叫4♠）' },
            { call: '4D', meaning: '16+，長門♦，64或55以上的牌型（好牌叫4♥，壞牌叫4♠）' },
            { call: '4H', meaning: '16+，長門♥，64或55以上的牌型（好牌叫4NT，壞牌叫4♠）' },
          ],
        ),
        branch(
          's3d-3h',
          ['1S', '3D', '3H'],
          [
            { call: '3S', meaning: '8-9 hcp，4+♠，無短門（4432、5332）' },
            { call: '3NT', meaning: '8-9 hcp，4+♠，一門void（開叫人一定要叫4♣詢問）' },
            { call: '4C', meaning: '8-9 hcp，4+♠，♣單張' },
            { call: '4D', meaning: '8-9 hcp，4+♠，♦單張' },
            { call: '4H', meaning: '8-9 hcp，4+♠，♥單張' },
          ],
        ),
        branch(
          's3d-3h-3s',
          ['1S', '3D', '3H', { call: '3S', note: '8-9 hcp，4+♠，無短門' }],
          [
            { call: '3NT', meaning: '14+，void一門，答叫者回答4♣為詢問' },
            { call: '4C', meaning: '17+，♣單張，詢問好壞牌（好牌叫旁門控，壞牌叫4♠）' },
            { call: '4D', meaning: '17+，♦單張，詢問好壞牌（好牌叫4♥，壞牌叫4♠）' },
            { call: '4H', meaning: '17+，♥單張，詢問好壞牌（好牌叫4NT，壞牌叫4♠）' },
            { call: '4S', meaning: '束叫' },
          ],
        ),
        branch(
          's3d-3s',
          ['1S', '3D', '3S'],
          [
            { call: '3NT', meaning: '一門void（開叫人叫4♣為詢問）' },
            { call: '4S', meaning: '高限，束叫' },
          ],
        ),
      ],
    },
    {
      id: 'spade-3h',
      title: '1♠ - 3♥後續答叫',
      children: [
        branch(
          's3h',
          ['1S', '3H'],
          [
            { call: '3S', meaning: '16 hcp以下的牌' },
            { call: '3NT', meaning: '17 hcp以上，詢問牌型' },
            {
              call: '4C',
              meaning: '19+ HCP，長門♣，64或55以上的牌型（好牌叫旁門最低控，壞牌叫4♠）',
            },
            { call: '4D', meaning: '19+ HCP，長門♦，64或55以上的牌型（好牌叫4♥，壞牌叫4♠）' },
            { call: '4H', meaning: '19+ HCP，長門♥，64或55以上的牌型（好牌叫4NT，壞牌叫4♠）' },
          ],
        ),
        branch(
          's3h-3nt',
          ['1S', '3H', '3NT'],
          [
            { call: '4C', meaning: '♣ void' },
            { call: '4D', meaning: '♦ void' },
            { call: '4H', meaning: '♥ void' },
            { call: '4S', meaning: '6-7平均牌' },
          ],
        ),
      ],
    },
    {
      id: 'spade-3nt',
      title: '1♠ - 3NT後續答叫',
      children: [
        branch(
          's3nt',
          ['1S', '3NT', { call: '4C', note: '詢問' }],
          [
            { call: '4D', meaning: '♦ void' },
            { call: '4H', meaning: '♥ void' },
            { call: '4S', meaning: '♣ void' },
          ],
        ),
      ],
    },
    {
      id: 'heart-raises',
      title: '開叫1♥之跳叫答叫',
      summary: '2NT 10-11、3♣ 8-9、3♦ 6-7、3♥ 4-5（牌值）；3♠／3NT／4♣／4♦ 12-13 短門。',
      blocks: [
        {
          kind: 'responses',
          auction: seq('1H'),
          rows: [
            {
              call: '2NT',
              meaning:
                '10-11 hcp，4張+♥，無短門（4432、5332）／10-11 hcp，3張♥帶5張牌組及一門單張／10-11 hcp，4+♥，一門void／10-11 hcp，4+♥，一門單張',
            },
            {
              call: '3C',
              meaning:
                '8-9 hcp，4+♥，無短門（4432、5332）或6-7 HCP，4+♥，一門單張，即牌值為8~9的牌／8-9 hcp，4+♥，一門單張／8-9 hcp，4+♥，一門void',
            },
            {
              call: '3D',
              meaning:
                '6-7 hcp，4+♥，無短門（4432、5332）或4-5 HCP，4+♥，一門單張，即牌值為6~7的牌／6-7 hcp，4+♥，一門void',
            },
            { call: '3H', meaning: '4+♥，牌值為4~5的牌' },
            { call: '3S', meaning: '12-13 hcp，4+♥，一門void' },
            { call: '3NT', meaning: '12-13 hcp，4+♥，♠單張' },
            { call: '4C', meaning: '12-13 hcp，4+♥，♣單張' },
            { call: '4D', meaning: '12-13 hcp，4+♥，♦單張' },
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'P.S.1.比以上的牌更好者，一律叫2♠。　2.四張王配合之4333者，當3張王答叫。',
        },
      ],
    },
    {
      id: 'heart-2nt',
      title: '1♥ - 2NT後續答叫',
      children: [
        branch(
          'h2nt',
          ['1H', '2NT'],
          [
            { call: '3C', meaning: '14+牌力，詢問同伴是那一種牌' },
            { call: '3D', meaning: '長門♦，64或55以上的牌型（好牌叫旁門最低控，壞牌叫3♥）' },
            { call: '3H', meaning: '最低限牌力' },
            { call: '3NT', meaning: '長門♠，64或55以上的牌型（好牌叫旁門最低控，壞牌叫4♥）' },
            { call: '4C', meaning: '長門♣，64或55以上的牌型（好牌叫4♦，壞牌叫4♥）' },
            {
              call: '4D',
              meaning: '（原文空白）',
              pending: '原文「4D ----」後面沒有寫意義，請補充。',
            },
          ],
        ),
        branch(
          'h2nt-3c',
          ['1H', '2NT', '3C'],
          [
            { call: '3D', meaning: '10-11 hcp，3張♥帶5張牌組及一門單張' },
            { call: '3H', meaning: '10-11 hcp，4+♥，無短門（4333、4432、5332）' },
            { call: '3S', meaning: '10-11 hcp，4+♥，一門void（開叫人一定要叫3NT詢問）' },
            { call: '3NT', meaning: '10-11 hcp，4+♥，♠單張' },
            { call: '4C', meaning: '10-11 hcp，4+♥，♣單張' },
            { call: '4D', meaning: '10-11 hcp，4+♥，♦單張' },
          ],
        ),
        branch(
          'h2nt-3c-3d',
          ['1H', '2NT', '3C', { call: '3D', note: '10-11 hcp，3張♥帶5張牌組及一門單張' }],
          [
            { call: '3H', meaning: '詢問' },
            { call: '3S', meaning: 'void一門，答叫者叫3NT為詢問' },
            { call: '3NT', meaning: '♠單張，詢問好壞牌（好牌叫旁門最低控，壞牌叫4♥）' },
            { call: '4C', meaning: '♣單張，詢問好壞牌（好牌叫4♦，壞牌叫4♥）' },
            { call: '4D', meaning: '♦單張，詢問好壞牌（好牌叫4♠，壞牌叫4♥）' },
            { call: '4H', meaning: '束叫' },
          ],
        ),
        branch(
          'h2nt-3c-3d-3h',
          ['1H', '2NT', '3C', '3D', '3H'],
          [
            { call: '3S', meaning: '短門花色及下一階級長門花色，3NT為詢問' },
            { call: '3NT', meaning: '3張♥＋♠短＋5張♦↑（短門＋下二級長門花色）' },
            { call: '4C', meaning: '3張♥＋♣短＋5張♠↑（短門＋下二級長門花色）' },
            { call: '4D', meaning: '3張♥＋♦短＋5張♣↑（短門＋下二級長門花色）' },
          ],
        ),
        branch(
          'h2nt-3c-3d-3h-3s',
          [
            '1H',
            '2NT',
            '3C',
            '3D',
            '3H',
            { call: '3S', note: '短門花色及下一階級長門花色，3NT為詢問' },
            '3NT',
          ],
          [
            { call: '4C', meaning: '3張♥＋♣短＋5張♦↑（短門＋下一級長門花色）' },
            { call: '4D', meaning: '3張♥＋♦短＋5張♠↑（短門＋下一級長門花色）' },
            { call: '4H', meaning: '3張♥＋♠短＋5張♣↑（短門＋下一級長門花色）' },
          ],
        ),
        branch(
          'h2nt-3c-3d-3s',
          ['1H', '2NT', '3C', '3D', '3S', '3NT'],
          [
            { call: '4C', meaning: '♣ void，詢問好壞牌（好牌叫4♦，壞牌叫4♥）' },
            { call: '4D', meaning: '♦ void，詢問好壞牌（好牌叫4♠，壞牌叫4♥）' },
            { call: '4H', meaning: '♠ void，詢問好壞牌（好牌叫4♠，壞牌pass）' },
          ],
        ),
        branch(
          'h2nt-3c-3h',
          ['1H', '2NT', '3C', { call: '3H', note: '10-11 hcp，4+♥，無短門4432、5332' }],
          [
            { call: '3S', meaning: 'void一門，答叫者叫3NT為詢問' },
            { call: '3NT', meaning: '♠單張，詢問好壞牌（好牌叫旁門最低控，壞牌叫4♥）' },
            { call: '4C', meaning: '♣單張，詢問好壞牌（好牌叫4♦，壞牌叫4♥）' },
            { call: '4D', meaning: '♦單張，詢問好壞牌（好牌叫4♠，壞牌叫4♥）' },
          ],
        ),
        branch(
          'h2nt-3c-3h-3s',
          ['1H', '2NT', '3C', '3H', '3S', '3NT'],
          [
            { call: '4C', meaning: '♣ void，詢問好壞牌（好牌叫4♦，壞牌叫4♥）' },
            { call: '4D', meaning: '♦ void，詢問好壞牌（好牌叫4♠，壞牌叫4♥）' },
            {
              call: '4H',
              meaning: '♥ void，詢問好壞牌（好牌叫4♠，壞牌pass）',
              pending: '♥是王牌，「H void」疑應為「♠ void」（上一組同位置寫S void），請確認。',
            },
          ],
        ),
        branch(
          'h2nt-3c-3s',
          ['1H', '2NT', '3C', { call: '3S', note: '10-11 hcp，4+♥，一門void' }, '3NT'],
          [
            { call: '4C', meaning: '♣ void' },
            { call: '4D', meaning: '♦ void' },
            { call: '4H', meaning: '♠ void' },
          ],
        ),
        branch(
          'h2nt-3d',
          ['1H', '2NT', '3D'],
          [
            { call: '3H', meaning: 'WAITING，詢問短門' },
            { call: '3S', meaning: '10-11 hcp，4+♥，一門void（開叫人一定要叫3NT詢問）' },
            { call: '3NT', meaning: '10-11 hcp，4+♥，♠單張' },
            { call: '4C', meaning: '10-11 hcp，4+♥，♣單張' },
            { call: '4D', meaning: '10-11 hcp，4+♥，♦單張' },
            { call: '4H', meaning: '束叫' },
          ],
        ),
        branch(
          'h2nt-3h',
          ['1H', '2NT', '3H'],
          [
            { call: '3S', meaning: '10-11 hcp，4+♥，一門void（開叫人叫3NT為詢問）' },
            { call: '4H', meaning: '高限，束叫' },
          ],
        ),
      ],
    },
    {
      id: 'heart-3c',
      title: '1♥ - 3♣後續答叫',
      children: [
        branch(
          'h3c',
          ['1H', '3C'],
          [
            { call: '3D', meaning: '15+，詢問牌型' },
            { call: '3H', meaning: '14 hcp以下，低限' },
            { call: '3NT', meaning: '16+，長門♠，64或55以上的牌型（好牌叫旁門控，壞牌叫4♥）' },
            { call: '4C', meaning: '16+，長門♣，64或55以上的牌型（好牌叫4♦，壞牌叫4♥）' },
            { call: '4D', meaning: '16+，長門♦，64或55以上的牌型（好牌叫4♠，壞牌叫4♥）' },
          ],
        ),
        branch(
          'h3c-3d',
          ['1H', '3C', '3D'],
          [
            { call: '3H', meaning: '8-9 hcp，4+♥，無短門（4432、5332）' },
            { call: '3S', meaning: '8-9 hcp，4+♥，一門void（開叫人一定要叫3NT詢問）' },
            { call: '3NT', meaning: '8-9 hcp，4+♥，♠單張' },
            { call: '4C', meaning: '8-9 hcp，4+♥，♣單張' },
            { call: '4D', meaning: '8-9 hcp，4+♥，♦單張' },
          ],
        ),
        branch(
          'h3c-3d-3h',
          ['1H', '3C', '3D', { call: '3H', note: '8-9 hcp，4+♠，無短門' }],
          [
            { call: '3S', meaning: '15+，void一門，答叫者叫3NT為詢問' },
            { call: '3NT', meaning: '17+，♠單張，詢問好壞牌（好牌叫旁門控，壞牌叫4♥）' },
            { call: '4C', meaning: '17+，♣單張，詢問好壞牌（好牌叫4♦，壞牌叫4♥）' },
            { call: '4D', meaning: '17+，♦單張，詢問好壞牌（好牌叫4♠，壞牌叫4♥）' },
            { call: '4H', meaning: '束叫' },
          ],
          { pending: '叫牌圖中 3♥ 的說明原文寫「4+S」，這段王牌是♥，疑應為「4+H」，請確認。' },
        ),
        branch(
          'h3c-3h',
          ['1H', '3C', '3H'],
          [
            {
              call: '3S',
              meaning: '8-9 hcp，4+♠，一門void（開叫人叫3NT為詢問）',
              pending: '原文寫「4+S」，這段王牌是♥，疑應為「4+H」，請確認。',
            },
            { call: '4H', meaning: '高限，束叫' },
          ],
        ),
      ],
    },
    {
      id: 'heart-3d',
      title: '1♥ - 3♦後續答叫',
      children: [
        branch(
          'h3d',
          ['1H', '3D'],
          [
            { call: '3H', meaning: '16 hcp以下的牌' },
            { call: '3S', meaning: '17 hcp以上，詢問牌型' },
            {
              call: '3NT',
              meaning: '19+ HCP，長門♠，64或55以上的牌型（好牌叫旁門最低控，壞牌叫4♥）',
            },
            { call: '4C', meaning: '19+ HCP，長門♣，64或55以上的牌型（好牌叫4♦，壞牌叫4♥）' },
            { call: '4D', meaning: '19+ HCP，長門♦，64或55以上的牌型（好牌叫4♠，壞牌叫4♥）' },
          ],
        ),
        branch(
          'h3d-3s',
          ['1H', '3D', '3S'],
          [
            { call: '3NT', meaning: '♠ void' },
            { call: '4C', meaning: '♣ void' },
            { call: '4D', meaning: '♦ void' },
            { call: '4H', meaning: '6-7平均牌' },
          ],
        ),
      ],
    },
    {
      id: 'heart-3s',
      title: '1♥ - 3♠後續答叫',
      children: [
        branch(
          'h3s',
          ['1H', '3S', { call: '3NT', note: '詢問' }],
          [
            { call: '4C', meaning: '11-12 hcp，4+♥，♣ void' },
            { call: '4D', meaning: '11-12 hcp，4+♥，♦ void' },
            { call: '4H', meaning: '11-12 hcp，4+♥，♠ void' },
          ],
          { pending: '這裡寫 11-12 hcp，但開叫1♥之跳叫答叫表中 3♠ 為 12-13 hcp，請確認。' },
        ),
      ],
    },
  ],
}
