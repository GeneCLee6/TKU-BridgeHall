import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 對抗不尋常2NT (Defense vs. Unusual 2NT)
 * Source: the club's Word file "如何對抗弱跳叫2NT兩低".
 * Transcribed verbatim; only bids and suit letters were rewritten with suit symbols (1H -> 1♥,
 * "H不fit" -> "♥不fit"). Seat orders follow the source's own diagrams.
 */

const openerFirst: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']
const responderFirst: Auction['seats'] = ['答叫者', '敵方', '開叫者', '敵方']

const after = (opening: '1H' | '1S', ...calls: string[]): Auction => ({
  seats: responderFirst,
  calls: ['', '', opening, '2NT', ...calls],
})

export const defenseVsUnusual2nt: Convention = {
  slug: 'defense-vs-unusual-2nt',
  nameZh: '對抗不尋常2NT',
  nameEn: 'Defense vs. Unusual 2NT',
  aliases: ['如何對抗弱跳叫2NT兩低', 'Unusually 2NT', 'Unusual 2NT', '兩低', '不尋常2NT'],
  category: 'competitive',
  tags: ['高花開叫', '2NT 插叫', '兩低', 'mini splinter', '短門', 'slam try'],
  summary: '我方開 1♥／1♠ 遭敵方 2NT（兩低）插叫時的答叫與後續；附我方使用 Unusual 2NT 的條件。',
  source: { title: '如何對抗弱跳叫2NT兩低' },
  updated: '2026-10-21',
  sections: [
    {
      id: 'our-overcall',
      title: '我方使用：Unusual 2NT',
      originalTitle: 'Unusually 2NT對抗特約',
      summary: '兩門低花 5-5↑，直接蓋叫 2NT。',
      blocks: [
        {
          kind: 'paragraph',
          text: '對抗敵方一線高花開叫時，手持兩門低花5-5↑，直接蓋叫 2NT，有身價為8~10 HCP，無身價為6~8 HCP。',
        },
      ],
    },
    {
      id: 'defense',
      title: '如何對抗敵方Unusual 2NT',
      summary: '開高花遭 2NT（兩低）插叫時，答叫者與開叫者的叫法。',
      blocks: [
        {
          kind: 'paragraph',
          text: '開高花（1♥、1♠）被插叫2NT（兩低）時，答叫人答叫方式如下：',
        },
      ],
      children: [
        {
          id: 'vs-1h',
          title: '開叫1♥時',
          children: [
            {
              id: 'vs-1h-responses',
              title: '答叫者首輪：1♥ (2NT) ?',
              blocks: [
                {
                  kind: 'responses',
                  auction: { seats: openerFirst, calls: ['1H', '2NT', '?'] },
                  rows: [
                    { call: 'X', meaning: '平均牌型，♥不fit，至少有邀請點↑，建議處罰敵方的合約。' },
                    { call: '3C', meaning: '♥ fit，至少有邀請點↑，迫叫至3♥。' },
                    { call: '3D', meaning: '5張♠↑，至少有成局點（♥通常不fit）。' },
                    {
                      call: '3H',
                      meaning: '3張♥，8-10點或4張♥，6-8點（也就是6-9裡的好牌）。',
                      pending: '點力範圍「8-10點」「6-8點」與括號中「6-9裡的好牌」不一致，請確認。',
                    },
                    { call: '3S', meaning: '5張♠，10-12或6張♠↑，8-10，nonforcing。' },
                    {
                      call: '3NT',
                      meaning:
                        '12-15，雙低花都有1.5-2檔（通常是身價不利，否則趨向於X 2NT，並沿路追殺敵方合約）',
                    },
                    { call: '4C', meaning: 'mini splinter' },
                    { call: '4D', meaning: 'mini splinter' },
                    { call: '4H', meaning: '通常是牌型牌，4張♥↑，6~9（好牌先叫3♣）' },
                  ],
                },
              ],
            },
            {
              id: 'vs-1h-after-3c',
              title: '開叫者再叫：1♥ (2NT) 3♣ ?',
              blocks: [
                {
                  kind: 'responses',
                  auction: after('1H', '3C', '---', '?'),
                  rows: [
                    {
                      call: '3D',
                      meaning: 'waiting，至少是接受邀請的點力，詢問同伴有無短門（無短門叫回3♥）',
                    },
                    { call: '3H', meaning: '沒興趣，再聯絡。' },
                    { call: '3S', meaning: '短門，slam try。' },
                    { call: '4C', meaning: '短門，slam try。' },
                    { call: '4D', meaning: '短門，slam try。' },
                    { call: '4H', meaning: '接受邀請（低花有浪費力量，有別於3♦）' },
                  ],
                },
              ],
            },
            {
              id: 'vs-1h-after-3d',
              title: '開叫者再叫：1♥ (2NT) 3♦ ?',
              blocks: [
                {
                  kind: 'responses',
                  auction: after('1H', '3D', '---', '?'),
                  rows: [
                    { call: '3H', meaning: '♠不fit，waiting bid。' },
                    { call: '3S', meaning: '♠ fit，F（非最低限，無短門）。' },
                    { call: '3NT', meaning: '雙低花有檔，♠不fit。' },
                    { call: '4C', meaning: '♣短，♠ fit。' },
                    { call: '4D', meaning: '♦短，♠ fit。' },
                    { call: '4H', meaning: '6張♥↑，低限爛牌，♠不fit（通常沒有2張）。' },
                    { call: '4S', meaning: '♠ fit（開叫低限，無短門，通常低花有廢點）。' },
                  ],
                },
              ],
            },
            {
              id: 'vs-1h-after-3h',
              title: '開叫者再叫：1♥ (2NT) 3♥ ?',
              blocks: [
                {
                  kind: 'responses',
                  auction: after('1H', '3H', '---', '?'),
                  rows: [
                    { call: '3S', meaning: '♠短門，slam try' },
                    { call: '3NT', meaning: '雙低花有檔，建議打' },
                    { call: '4C', meaning: '短門，slam try。' },
                    { call: '4D', meaning: '短門，slam try。' },
                    { call: '4H', meaning: '束叫。' },
                  ],
                },
              ],
            },
            {
              id: 'vs-1h-after-3s',
              title: '開叫者再叫：1♥ (2NT) 3♠ ?',
              blocks: [
                {
                  kind: 'responses',
                  auction: after('1H', '3S', '---', '?'),
                  rows: [
                    { call: 'P', meaning: '低限爛牌。' },
                    { call: '3NT', meaning: '雙低花有檔，♠不fit。' },
                    { call: '4C', meaning: '短門，♠ fit，高限。' },
                    { call: '4D', meaning: '短門，♠ fit，高限。' },
                    { call: '4H', meaning: '束叫。' },
                    { call: '4S', meaning: '束叫。' },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'vs-1s',
          title: '開叫1♠時',
          children: [
            {
              id: 'vs-1s-responses',
              title: '答叫者首輪：1♠ (2NT) ?',
              blocks: [
                {
                  kind: 'responses',
                  auction: after('1S', '?'),
                  rows: [
                    {
                      call: 'X',
                      meaning: '平均牌型，♠不fit，至少有邀請點↑，建議處罰敵方的合約。',
                    },
                    { call: '3C', meaning: '5張♥↑，至少有成局點（♠通常不fit）。' },
                    { call: '3D', meaning: '♠ fit，至少有邀請點↑，迫叫至3♠。' },
                    { call: '3H', meaning: '5張♥，10-12或6張♥↑，8-10，nonforcing。' },
                    {
                      call: '3S',
                      meaning: '3張♠，8-10點或4張♠，6-8點（也就是6-9裡的好牌）。',
                      pending: '點力範圍「8-10點」「6-8點」與括號中「6-9裡的好牌」不一致，請確認。',
                    },
                    {
                      call: '3NT',
                      meaning:
                        '12-15，雙低花都有1.5-2檔（通常是身價不利，否則趨向於X 2NT，並沿路追殺敵方合約）',
                    },
                    { call: '4C', meaning: 'mini splinter' },
                    { call: '4D', meaning: 'mini splinter' },
                    { call: '4H', meaning: 'mini splinter' },
                    { call: '4S', meaning: '通常是牌型牌，4張♠↑，6~9（好牌先叫3♦）' },
                  ],
                },
              ],
            },
            {
              id: 'vs-1s-after-3c',
              title: '開叫者再叫：1♠ (2NT) 3♣ ?',
              blocks: [
                {
                  kind: 'responses',
                  auction: after('1S', '3C', '---', '?'),
                  rows: [
                    { call: '3D', meaning: '♥不fit，waiting bid。' },
                    { call: '3H', meaning: '♥ fit（非最低限，無短門）。' },
                    { call: '3S', meaning: '6張♠，♥單張或缺門。' },
                    {
                      call: '3NT',
                      meaning: '雙低花都有好檔，♥不fit，通常♥是單張或缺門，2張♥先叫3♦ waiting。',
                    },
                    { call: '4C', meaning: '♣短，♥ fit。' },
                    { call: '4D', meaning: '♦短，♥ fit。' },
                    { call: '4H', meaning: '♥ fit（開叫低限或低花有廢點）。' },
                    { call: '4S', meaning: '6張♠↑，低限爛牌，♥不fit（通常沒有2張）。' },
                  ],
                },
              ],
            },
            {
              id: 'vs-1s-after-3c-3d',
              title: '答叫者再叫：1♠ (2NT) 3♣ (—) 3♦ ?',
              blocks: [
                {
                  kind: 'responses',
                  auction: after('1S', '3C', '---', '3D', '', '?'),
                  rows: [
                    { call: '3H', meaning: '6張♥ forcing，check ♥張數。' },
                    { call: '3S', meaning: '♠ fit forcing，check短門（4♠無短門，4♣、4♦、4♥短門）。' },
                    {
                      call: '3NT',
                      meaning:
                        '12-15，雙低花都有1.5-2檔（通常是身價不利，否則趨向於X 2NT，並沿路追殺敵方合約）',
                      pending:
                        '此句與答叫者首輪直接叫3NT的說明完全相同；答叫者已先叫3♣（至少成局點），此處意義是否相同，請確認。',
                    },
                    { call: '4C', meaning: '♥ fit，♣短，好牌' },
                    {
                      call: '4D',
                      meaning: '♥ fit，♦短，好牌',
                    },
                    { call: '4H', meaning: '6張束叫。' },
                  ],
                },
              ],
            },
            {
              id: 'vs-1s-after-3d',
              title: '開叫者再叫：1♠ (2NT) 3♦ ?',
              blocks: [
                {
                  kind: 'responses',
                  auction: after('1S', '3D', '---', '?'),
                  rows: [
                    { call: '3H', meaning: '高限接受邀請，詢問短門。' },
                    { call: '3S', meaning: '沒興趣，再聯絡。' },
                    { call: '4C', meaning: '短門，slam try。' },
                    { call: '4D', meaning: '短門，slam try。' },
                    { call: '4H', meaning: '短門，slam try。' },
                    { call: '4S', meaning: '接受邀請（低花有浪費力量，有別於3♥）' },
                  ],
                },
              ],
            },
            {
              id: 'vs-1s-after-3h',
              title: '開叫者再叫：1♠ (2NT) 3♥ ?',
              blocks: [
                {
                  kind: 'responses',
                  auction: after('1S', '3H', '---', '?'),
                  rows: [
                    { call: '3S', meaning: '6張♠↑，修正合約，通常♥是單張或缺門。' },
                    { call: '3NT', meaning: '16↑，雙低花有檔，♥不fit。' },
                    { call: '4C', meaning: '短門，♥ fit。' },
                    { call: '4D', meaning: '短門，♥ fit。' },
                    { call: '4H', meaning: '束叫。' },
                    { call: '4S', meaning: '束叫。' },
                  ],
                },
              ],
            },
            {
              id: 'vs-1s-after-3s',
              title: '開叫者再叫：1♠ (2NT) 3♠ ?',
              blocks: [
                {
                  kind: 'responses',
                  auction: after('1S', '3S', '---', '?'),
                  rows: [
                    { call: '4C', meaning: '短門，slam try。' },
                    { call: '4D', meaning: '短門，slam try。' },
                    { call: '4H', meaning: '短門，slam try。' },
                    { call: '4S', meaning: '束叫' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
