import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 開叫2♣、弱二與阻塞叫（自然制講義） — from the club's old handbook 淡江大學-我們的制度(修訂版) (2010, 13-point
 * openings). Transcribed verbatim from docs/淡江大學-我們的制度(修訂版).doc; bids and suit letters use
 * suit symbols. Notes marked 現行制度 apply the current system (12-point openings, 1NT 15-17,
 * 2NT 20-21, 2♣ 22+, 1NT forcing, 2/1 game forcing); notes marked 以特約為準 point to the
 * convention that overrides the handbook. Generated from a hand-cleaned transcription.
 */

const seats0: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']

export const systemStrongAndPreempts: Convention = {
  slug: 'system-strong-and-preempts',
  nameZh: '開叫2♣、弱二與阻塞叫（自然制講義）',
  nameEn: '2♣ Opening, Weak Twos and Preempts (Natural System)',
  aliases: [
    '開叫2C',
    '2C開叫',
    '弱二',
    'weak two',
    '阻塞叫',
    '搶先叫',
    '賭博性3NT',
    'gambling 3NT',
  ],
  category: 'system',
  kind: 'system',
  level: 'basic',
  tags: ['舊講義', '2♣ 開叫', '弱二', '阻塞叫', '賭博性 3NT'],
  summary:
    '第六～九章：開叫 2♣（22 點↑）與遭插叫、2♥/♠ 弱二與 2NT 問短門、三線阻塞叫、賭博性 3NT。',
  source: {
    title: '淡江大學-我們的制度(修訂版)',
    note: '第六章 開叫2♣、第七章 開叫2♥/♠（弱二）、第九章 開叫3♣/♦/♥/♠',
  },
  updated: '2026-10-22',
  sections: [
    {
      id: 'two-clubs',
      title: '開叫2♣',
      originalTitle: '第 六 章 開叫2♣ 22點↑ ANY CASE',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**現行制度**：開叫 2♣ 為 22 點以上。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['2C', '', '?'],
          },
          rows: [
            {
              call: '2D',
              meaning: 'Waiting',
            },
            {
              call: '2H',
              meaning: '0-3點。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['2C', '', '2D', '', '?'],
          },
          rows: [
            {
              call: '2NT',
              meaning: '22-24點，平均牌型。',
            },
            {
              call: '3NT',
              meaning: '25-27點，平均牌型。',
            },
            {
              call: '4NT',
              meaning: '28-30點，平均牌行 。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['2C', '', '2D', '', '2S', '', '?'],
          },
          rows: [
            {
              call: '2NT',
              meaning: '黑桃不配合 平均牌型',
            },
            {
              call: '3S',
              meaning: '3張↑♠支持，有一、二張有用的牌。有滿貫興趣',
            },
            {
              call: '4S',
              meaning: '束叫。',
            },
            {
              call: '3D/H',
              meaning: '5張↑牌組，♠不配合 尋求合約',
            },
            {
              call: '4C/D/H',
              meaning: 'Splinter，♠配合。',
            },
          ],
        },
      ],
    },
    {
      id: 'two-clubs-interference',
      title: '開叫2♣被敵方插叫之後',
      originalTitle: '被敵方插叫之後',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['2C', '2D', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '對方塊的T/O',
            },
            {
              call: 'PASS',
              meaning: '想處罰 強迫同伴db',
            },
          ],
        },
        {
          kind: 'rules',
          items: [
            {
              text: '新花：好的5張牌組，迫叫成局。',
            },
            {
              text: '＊3♦：Cue-Bid，敵叫組短＋其他三門牌組好支持 要求同伴選合約。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['2C', 'X', '?'],
          },
          rows: [
            {
              call: 'XX',
              meaning: '♣牌組，想打此好合約。',
            },
          ],
        },
        {
          kind: 'rules',
          items: [
            {
              text: '新花：好的5張牌組，迫叫成局。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['2C', 'X', '?'],
          },
          rows: [
            {
              call: 'PASS',
              meaning: '等同於2♦ waiting。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['2C', '4H', '?'],
          },
          rows: [
            {
              call: 'X',
              meaning: '沒什麼力量。',
            },
            {
              call: 'PASS',
              meaning: '鼓勵再叫。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['2C', '---', '2D', '3C', '?'],
          },
          rows: [
            {
              call: 'PASS',
              meaning: '迫叫',
            },
            {
              call: 'X',
              meaning: '處罰',
            },
          ],
        },
        {
          kind: 'rules',
          items: [
            {
              text: '新花：迫叫成局',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '注意事項：',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '開叫2♣之後遭插叫，任一方PASS皆為迫叫。',
            },
            {
              text: 'XX表示要打。',
            },
            {
              text: '低階之X表示T/O，高階之X表示「沒什麼好叫」',
            },
            {
              text: '叫新花表示好牌組',
            },
            {
              text: 'Cue-Bid 表示敵叫組短＋其他三門牌組，迫叫成局。',
            },
          ],
        },
      ],
    },
    {
      id: 'weak-two',
      title: '開叫2♥/♠（弱二）',
      originalTitle: '第 七 章 開 叫 2♥/♠（弱二）',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：2♦ 開叫見「2♦ 開叫」特約。',
        },
        {
          kind: 'paragraph',
          text: '阻塞性叫品 ─ Preemptive（弱二以上之竄叫）',
        },
        {
          kind: 'paragraph',
          text: '弱跳叫（依二、三定律）：',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '不能有另一門4張↑好的牌組（尤其是高花）',
            },
            {
              text: '通常要有兩張大牌（A、K、Q）在牌組上',
            },
            {
              text: '全手未達11 點（不符合20定律開叫）',
              pending: '社團現在 12 點開叫，弱二的點力上限（本講義全手未達 11 點）是否調整待確認。',
            },
            {
              text: '第四家不得弱叫',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '*二、三定律（500定律）：不論是有身價或無身價最多只能掉500分',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['2H/S', '', '?'],
          },
          rows: [
            {
              call: '2S/3C/D',
              meaning: '新花迫叫一圈，15點↑，6張↑強牌組',
            },
            {
              call: '2NT',
              meaning: '問短門，13點↑，有支持',
            },
            {
              call: '3H/S',
              meaning: '加強阻塞',
            },
            {
              call: '3NT/4H/S',
              meaning: '束叫',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: [
              '2H/S',
              '',
              {
                call: '2NT',
                note: '問短門',
              },
              '',
              '?',
            ],
          },
          rows: [
            {
              call: '3C',
              meaning: '♣短門，單張',
            },
            {
              call: '3D',
              meaning: '♦短門，單張',
            },
            {
              call: '3H',
              meaning: '♥短門，單張',
            },
            {
              call: '3S',
              meaning: '無短門',
            },
          ],
        },
      ],
    },
    {
      id: 'three-level',
      title: '開叫3♣/♦/♥/♠',
      originalTitle: '第 九 章 開叫 3♣/♦/♥/♠ 阻塞性叫品',
      blocks: [
        {
          kind: 'paragraph',
          text: '開叫：',
        },
        {
          kind: 'paragraph',
          text: '3♣/♦/♥/♠：6-11點，7張↑牌組，依照二三定律。',
        },
        {
          kind: 'paragraph',
          text: '注意：',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '一次叫足，除非同伴forcing，否則不可再叫',
            },
            {
              text: '符合二三定律',
            },
            {
              text: '不可以有兩張A',
            },
            {
              text: '不符合20定律開叫',
            },
          ],
        },
      ],
    },
    {
      id: 'gambling',
      title: '開叫3NT（賭博性）',
      originalTitle: '開 叫 3NT Gambling，一門堅強低花',
      blocks: [
        {
          kind: 'paragraph',
          text: '開叫3NT為一門堅強低花可吃穿，賭博性3NT，7-11點，若被double還有4線低花可逃。',
          pending: '本講義開叫總表寫 3NT 為 12-15 點，此處寫 7-11 點，現行範圍待確認。',
        },
        {
          kind: 'paragraph',
          text: '旁門不得有Ace 至多一頭K',
        },
        {
          kind: 'hand',
          label: 'EX) 可開3NT',
          hand: {
            spades: 'Qx',
            hearts: 'x',
            diamonds: 'AKQxxxxx',
            clubs: 'xx',
          },
        },
        {
          kind: 'hand',
          label: '可開3NT',
          hand: {
            spades: 'xx',
            hearts: 'Qx',
            diamonds: 'xx',
            clubs: 'AKQxxxx',
          },
        },
        {
          kind: 'hand',
          label: '可開3NT',
          hand: {
            spades: 'x',
            hearts: 'x',
            diamonds: 'AKxxxxxxx',
            clubs: 'xx',
          },
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['3NT', '', '?'],
          },
          rows: [
            {
              call: '4C',
              meaning: '2-2低花↑，最多2張A；2張A時無單張或缺門 同伴♣牌組，Pass；否則叫4♦。',
            },
            {
              call: '4D',
              meaning: '詢問叫。',
            },
            {
              call: '4H/S',
              meaning: '束叫。',
            },
            {
              call: '5C',
              meaning: '2-2低花↑，兩門有第一控制＋一門有第二控制。同伴若♣牌組則Pass，否則叫5♦。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: [
              '3NT',
              '',
              {
                call: '4D',
                note: '持3張A↑之詢問叫，問短門',
              },
              '',
              '?',
            ],
          },
          rows: [
            {
              call: '4H',
              meaning: '♥短門，單張',
            },
            {
              call: '4S',
              meaning: '♠短門，單張',
            },
            {
              call: '4NT',
              meaning: '無短門',
            },
            {
              call: '5C',
              meaning: '♣牌組，可能♦短門',
            },
            {
              call: '5D',
              meaning: '♦牌組，可能♣短門',
            },
          ],
        },
      ],
    },
  ],
}
