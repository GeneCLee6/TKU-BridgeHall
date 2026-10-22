import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 競叫篇與技光（自然制講義） — from the club's old handbook 淡江大學-我們的制度(修訂版) (2010, 13-point
 * openings). Transcribed verbatim from docs/淡江大學-我們的制度(修訂版).doc; bids and suit letters use
 * suit symbols. Notes marked 現行制度 apply the current system (12-point openings, 1NT 15-17,
 * 2NT 20-21, 2♣ 22+, 1NT forcing, 2/1 game forcing); notes marked 以特約為準 point to the
 * convention that overrides the handbook. Generated from a hand-cleaned transcription.
 */

const seats0: Auction['seats'] = ['敵方', '你', '敵方', '同伴']
const seats1: Auction['seats'] = ['敵方', '同伴', '敵方', '你']
const seats2: Auction['seats'] = ['同伴', '敵方', '我', '敵方']
const seats3: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']

export const systemCompetition: Convention = {
  slug: 'system-competition',
  nameZh: '競叫篇與技光（自然制講義）',
  nameEn: 'Competitive Bidding and Ghestem-style Twos (Natural System)',
  aliases: ['競叫', '蓋叫', 'overcall', '平衡叫', 'balancing', '輕開叫', '搶先叫', '技光', '埋伏'],
  category: 'system',
  tags: ['舊講義', '競叫', '蓋叫', '平衡叫', '搶先叫', '技光'],
  summary:
    '第十一章：蓋叫的目的、原則與答叫、埋伏、平衡叫、第三家輕開叫、搶先叫與答叫，以及「技光」開叫與對抗方法。',
  source: {
    title: '淡江大學-我們的制度(修訂版)',
    note: '第十一章 競叫篇、何謂技光',
  },
  updated: '2026-10-22',
  sections: [
    {
      id: 'overcalls',
      title: '蓋叫',
      originalTitle: '第 十 一 章 競 叫 篇',
      blocks: [
        {
          kind: 'paragraph',
          text: '蓋叫之目的：',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '指示首攻',
            },
            {
              text: '搶合約',
            },
            {
              text: '阻止敵方叫牌',
            },
            {
              text: '尋找犧牲',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '蓋叫之原則：',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '叫牌線位 → 一線至少4張，二線至少5張',
            },
            {
              text: '牌組之強度',
            },
            {
              text: '身價',
            },
            {
              text: '敵叫組之長度（敵叫組短必定要加入叫牌）',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['1D', '?'],
          },
          rows: [
            {
              call: '1H/S/2C',
              meaning: '8-15點，5張↑牌組',
            },
            {
              call: '1NT',
              meaning: '16-18點，視同1NT開叫 敵叫組有擋',
              pending: '開叫 1NT 現為 15-17 點，蓋叫 1NT 是否仍為 16-18 點待確認。',
            },
            {
              call: '2H/S',
              meaning: '視同WEAK TWO（弱二）',
            },
          ],
        },
      ],
    },
    {
      id: 'advancing',
      title: '同伴蓋叫後的答叫',
      originalTitle: '敵 伴 敵 你',
      blocks: [
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['1D', '1S', '---', '?'],
          },
          rows: [
            {
              call: '1NT',
              meaning: '10-12點，♦有擋。',
            },
            {
              call: '2C/H',
              meaning: '9-12點，5張↑牌組，不迫叫。',
            },
            {
              call: '2D',
              meaning: 'Cue-Bid一圈，13點↑。',
            },
            {
              call: '2S',
              meaning: '8-10點，3張↑♠。',
            },
            {
              call: '2NT',
              meaning: '13-15點，邀請，平均牌型。',
            },
            {
              call: '3C/H',
              meaning: '11-13點，邀請，好牌組。',
            },
            {
              call: '3D',
              meaning: '11-13點，4張↑♠，邀請4♠。',
            },
            {
              call: '3S/4S',
              meaning: '阻塞，4/5張↑♠。',
            },
            {
              call: '3NT',
              meaning: '16-18點，平均牌型。',
            },
            {
              call: '4C/D/H',
              meaning: 'Splinter，16點↑，4張↑♠。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['2H', '2S', '---', '?'],
          },
          rows: [
            {
              call: '3C',
              meaning: '對抗敵方搶先叫之蓋叫，改叫新花為迫叫。',
            },
          ],
        },
        {
          kind: 'responses',
          auction: {
            seats: seats0,
            calls: ['2H', '?'],
          },
          rows: [
            {
              call: '3S',
              meaning: '敵方為弱二，我則是強跳叫 16點↑，6張↑♠。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '**☆如對抗敵方開叫4♠ a. X表示力量 處罰 b. 4NT→迫伴，保證4張♥↑。埋伏**',
        },
        {
          kind: 'paragraph',
          text: '不適合賭倍、蓋叫，卻有力量之牌，已知牌組為敵方所叫，此時做陷阱式PASS。',
        },
        {
          kind: 'hand',
          label: 'EX) 敵方開叫1H，手持',
          hand: {
            spades: 'KJX',
            hearts: 'KJXX',
            diamonds: 'QXXX',
            clubs: 'AXX',
          },
        },
      ],
    },
    {
      id: 'balancing',
      title: '平衡叫',
      originalTitle: '平衡叫',
      blocks: [
        {
          kind: 'paragraph',
          text: '為了保護同伴之埋伏，第四家位置稱之。',
        },
        {
          kind: 'paragraph',
          text: '叫牌可分',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '迫伴賭倍',
            },
            {
              text: '蓋叫',
            },
            {
              text: '叫牌組',
            },
            {
              text: '叫NT（1-3NT）',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '平衡原因',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '推高敵人合約',
            },
            {
              text: '爭取自己的部分合約',
            },
            {
              text: '指示攻牌，以告知同伴你的牌情',
            },
            {
              text: '預防同伴埋伏PASS',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '平衡叫原則',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '敵方一階的牌組PASS到你，80%應叫牌',
            },
            {
              text: '敵方牌組加叫到二階PASS到你，70%應叫牌',
            },
            {
              text: '敵方可能有配合，60%應叫牌 EX) 1♦ ─ 1NT ─ 2♦ ─ ─ ？',
            },
            {
              text: '敵方沒有配合，30%應叫牌 EX) 1♥ ─ 1NT ─ 2♥ ─ ─ ？',
            },
            {
              text: '敵方停在1NT，30%應叫牌 EX) 具有牌型及高花',
            },
            {
              text: '對抗竄叫的平衡要保守',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '平衡時最常用之叫品 → 賭倍',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '可保留最多的選擇',
            },
            {
              text: '同伴可以罰放',
            },
          ],
        },
        {
          kind: 'hand',
          label: 'EX) 1H ─ ─ ？ 叫 X；之後 1S、2C',
          hand: {
            spades: 'KQ87',
            hearts: '42',
            diamonds: 'A2',
            clubs: 'T7654',
          },
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['1H', '---', '---', '?'],
          },
          rows: [
            {
              call: '1S',
              meaning: '4張♠↑，10點以下。',
            },
            {
              call: 'X',
              meaning: '11點↑。',
            },
            {
              call: '1NT',
              meaning: '12-15點，♥有擋。',
            },
            {
              call: '2C/D',
              meaning: '5張↑牌組，10點以下。',
            },
            {
              call: '2S',
              meaning: '13-15點，6張↑♠牌組。',
            },
            {
              call: '3C/D',
              meaning: '13-15點，6張↑牌組。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '賭倍後再叫NT為16-19點',
        },
        {
          kind: 'paragraph',
          text: '敵花長，不應平衡，可能會幫敵方修正至最佳合約',
        },
        {
          kind: 'paragraph',
          text: '再平衡理論：當敵方有一門八張配合，我方通常亦有一門八張之配合。故當敵方停在二線上，顯示力量並不充沛時；依總墩數定律，我方應有部分合約（有無之間）。',
        },
        {
          kind: 'responses',
          auction: {
            seats: seats1,
            calls: ['1H', '---', '2H', '---', '---', '?'],
          },
          rows: [
            {
              call: '2S',
              meaning: '5張↑♠',
            },
            {
              call: 'X',
              meaning: '3或4張♠',
            },
          ],
        },
        {
          kind: 'rules',
          items: [
            {
              text: '1♥ ─ 1NT ─ 2♥（不應平衡，敵方無配合，我方亦無配合）',
            },
          ],
        },
      ],
    },
    {
      id: 'light-opening',
      title: '輕開叫',
      originalTitle: '輕開叫',
      blocks: [
        {
          kind: 'paragraph',
          text: '於第三家（兩家PASS到你），可以9-12點開叫',
          pending: '社團現在 12 點開叫，第三家輕開叫的點力（本講義 9-12 點）待確認。',
        },
        {
          kind: 'paragraph',
          text: '輕開叫之目的：',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '直接開叫，阻塞敵方',
            },
            {
              text: '指示首攻',
            },
            {
              text: '搶部分合約',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '輕開叫之原則：需輕開叫強度夠強之花色，但之後避免再叫，以免誤會。',
        },
      ],
    },
    {
      id: 'preempts',
      title: '搶先叫',
      originalTitle: '搶先叫',
      blocks: [
        {
          kind: 'paragraph',
          text: '搶先叫原則（三線）',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '不到開牌力量',
            },
            {
              text: '低於10點以下',
            },
            {
              text: '牌組品質（不要以AKQXXXX做三線搶先叫；3NT除外）',
            },
            {
              text: '身價方面（依照二、三定律）',
            },
            {
              text: '牌型分配（7-3-3-0 ＞ 7-3-2-1 ＞ 7-2-2-2）',
            },
            {
              text: '避免旁門大牌點過多',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '搶先叫之答叫',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '詢問叫',
            },
            {
              text: '新花迫叫（或有配合之指示首攻）',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: 'EX) 同伴開叫3♠',
        },
        {
          kind: 'hand',
          label: '叫4H',
          hand: {
            spades: '-',
            hearts: 'KQJ87543',
            diamonds: 'KQJ',
            clubs: '84',
          },
        },
        {
          kind: 'hand',
          label: 'PASS',
          hand: {
            spades: 'Q',
            hearts: 'AQ64',
            diamonds: 'K53',
            clubs: 'QJ643',
          },
        },
        {
          kind: 'hand',
          label: '叫4NT',
          hand: {
            spades: 'K86',
            hearts: 'KQ7',
            diamonds: 'AK84',
            clubs: 'AK4',
          },
        },
        {
          kind: 'hand',
          label: 'PASS!',
          hand: {
            spades: '-',
            hearts: 'KQJ5',
            diamonds: 'KQ732',
            clubs: 'KQ85',
          },
        },
        {
          kind: 'hand',
          label: '叫3NT!!',
          hand: {
            spades: '3',
            hearts: 'A4',
            diamonds: 'AKQJ9654',
            clubs: 'K2',
          },
        },
        {
          kind: 'hand',
          label: 'PASS!!!',
          hand: {
            spades: '5',
            hearts: 'KJ7',
            diamonds: 'AKJ9876',
            clubs: '32',
          },
        },
      ],
    },
    {
      id: 'ghestem',
      title: '何謂技光',
      originalTitle: '何 謂 "技 光" ？(新生請忽略這段)',
      blocks: [
        {
          kind: 'note',
          tone: 'warning',
          text: '**以特約為準**：現行 2♦ 開叫以「2♦ 開叫」特約為準；2♥/2♠ 開叫見「開叫2♣、弱二與阻塞叫」的弱二。',
        },
        {
          kind: 'paragraph',
          text: '所謂"技光"式一種複合式的特約叫法，基本上是屬於破壞性的特約。詳述如下：（ m 是低花，M 是高花）',
        },
        {
          kind: 'paragraph',
          text: '**☆ 開叫：**',
        },
        {
          kind: 'rules',
          items: [
            {
              text: '2♦ → 紅心6 張 或 黑桃＋m 5-5 ↑。',
            },
            {
              text: '2♥ → 黑桃6 張 或 紅心＋m 5-5 ↑。',
            },
            {
              text: '2♠ → 兩高或兩低 5-5 ↑。',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: '以上開叫者通常為 6-11 點 以內。當然視身價的變化而有區別。例如：在無身價對有身價時，由於純屬干擾性質，力量可以少至 4-6 點。',
        },
      ],
      pending:
        '「技光」的 2♥（♠6 張或♥＋低花 5-5）、2♠（兩高或兩低 5-5）現在是否還在使用，待確認。',
      children: [
        {
          id: 'ghestem-responses',
          title: '技光的答叫',
          originalTitle: '☆ 答叫：',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats2,
                calls: ['2D', '---', '?'],
              },
              rows: [
                {
                  call: 'PASS',
                  meaning: '罕見的叫品，一長串方塊。',
                },
                {
                  call: '2H',
                  meaning: 'SEMI-AUTOMATIC（半自動答叫）。',
                },
                {
                  call: '2S',
                  meaning:
                    'SEMI-FORCING（半迫叫）紅心配合。若開叫者是黑桃＋低花時，需PASS否則應叫其短門(EX:2NT為黑桃短)或叫回3♥。',
                },
                {
                  call: '2NT',
                  meaning: '詢問叫，通常迫叫成局『答叫請見下頁』',
                },
                {
                  call: '3C/D',
                  meaning: '同伴如為黑桃＋低花時，則PASS，否則叫3♥',
                },
                {
                  call: '3H',
                  meaning: '邀請4♥ 或叫 3♠',
                },
                {
                  call: '3S',
                  meaning: '同伴如為黑桃請PASS或叫4♠ 同伴如為紅心請叫4♥',
                },
                {
                  call: '4H',
                  meaning: '同伴如為黑桃請叫4♠ 同伴如為紅心請PASS',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: seats2,
                calls: ['2H', '---', '?'],
              },
              rows: [
                {
                  call: 'PASS',
                  meaning: '一串紅心。',
                },
                {
                  call: '2S',
                  meaning: 'SEMI-AUTOMATIC',
                },
                {
                  call: '2NT',
                  meaning: '詢問叫(強牌)',
                },
                {
                  call: '3C/D',
                  meaning: '同伴如為紅心＋低花時，則PASS，否則叫3♠',
                },
                {
                  call: '3H',
                  meaning: '邀請4♥ 或叫 3♠',
                },
                {
                  call: '3S',
                  meaning: '同伴如為黑桃請PASS或叫4♠ 同伴如為紅心＋低花，請叫4♥',
                },
                {
                  call: '4H',
                  meaning: '同伴如為黑桃請叫4♠ 同伴如為紅心＋低花，請PASS',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: seats2,
                calls: ['2S', '---', '?'],
              },
              rows: [
                {
                  call: '2NT',
                  meaning: '詢問叫（NGF）',
                },
                {
                  call: '3C/D/H',
                  meaning: '7張↑好牌組梅花/方塊/紅心',
                },
              ],
            },
          ],
        },
        {
          id: 'ghestem-ask',
          title: '2NT 詢問後開叫者再叫',
          originalTitle: '☆ 開叫"技光"後，答叫人回答2NT(詢問叫)，開叫者再叫之意義',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats3,
                calls: ['2D', 'P', '2NT', 'P', '?'],
              },
              rows: [
                {
                  call: '3C',
                  meaning: '黑桃＋梅花(可在 3♣之後，以 3♦再迫叫)',
                },
                {
                  call: '3D',
                  meaning: '黑桃＋方塊(可在 3♦之後，以 3♥再迫叫)',
                },
                {
                  call: '3H',
                  meaning: '6張紅心↑，低限，6-9 點',
                },
                {
                  call: '3S',
                  meaning: '6張紅心↑，高限，10-11 點',
                },
                {
                  call: '3NT',
                  meaning: '6張紅心↑(SOLID)，AKQXXX',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: seats3,
                calls: ['2H', 'P', '2NT', 'P', '?'],
              },
              rows: [
                {
                  call: '3C',
                  meaning: '紅心＋梅花',
                },
                {
                  call: '3D',
                  meaning: '紅心＋方塊',
                },
                {
                  call: '3H',
                  meaning: '6張黑桃↑，高限，10-11 點',
                },
                {
                  call: '3S',
                  meaning: '6張黑桃↑，低限，6-9 點',
                },
                {
                  call: '3NT',
                  meaning: '6張黑桃↑(SOLID)，AKQXXX',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '* 注意',
            },
            {
              kind: 'responses',
              auction: {
                seats: seats3,
                calls: ['2H', 'P', '2S', 'P', '?'],
              },
              rows: [
                {
                  call: '3C',
                  meaning: '紅心＋梅花',
                },
                {
                  call: '3D',
                  meaning: '紅心＋方塊',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: seats3,
                calls: ['2S', 'P', '2NT', 'P', '?'],
              },
              rows: [
                {
                  call: '3C',
                  meaning: '兩低，低限，6-9 點。',
                },
                {
                  call: '3D',
                  meaning: '兩高，低限，6-9 點。',
                },
                {
                  call: '3H',
                  meaning: '兩高，高限，10-11 點。',
                },
                {
                  call: '3S',
                  meaning: '兩低，高限，短黑桃，10-11 點。',
                },
                {
                  call: '3NT',
                  meaning: '兩低，高限，短紅心，10-11 點。',
                },
              ],
            },
          ],
        },
        {
          id: 'defending-ghestem',
          title: '如何對抗技光',
          originalTitle: '☆ 如何對抗"技光"？',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['2D', '?'],
              },
              rows: [
                {
                  call: 'X',
                  meaning: '至少有弱無王以上的力量，13-15 點(通常為平均牌型)。',
                },
                {
                  call: '2H',
                  meaning:
                    '視同 CUE-BID，此處為(TAKE-OUT)迫伴賭倍，通常為不平均牌型，13點↑，紅心短。',
                },
                {
                  call: '2S/3C/D',
                  meaning: '好的5張↑牌組，13點↑。',
                },
                {
                  call: '2NT',
                  meaning: '16-19 點，平均牌型，紅心有1½擋↑。',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: seats1,
                calls: ['2D', '2H', 'P', '?'],
              },
              rows: [
                {
                  call: '2S/3C/D',
                  meaning: '0-9點，束叫',
                },
                {
                  call: '3S',
                  meaning: '邀請上4♠，10-12點',
                },
                {
                  call: '3NT',
                  meaning: '13點↑，平均牌型或長低花組，紅心有擋',
                },
              ],
            },
            {
              kind: 'paragraph',
              text: '若叫牌過程為「2♦」 Ｘ ─ ？ 此時可以將叫牌過程視為2♥賭倍後之後續發展。並可視搭檔間使用何種答叫方式而定(如賴本索)',
            },
            {
              kind: 'responses',
              auction: {
                seats: seats1,
                calls: ['2D', 'X', '---', '?'],
              },
              rows: [
                {
                  call: '2NT',
                  meaning: '0-9點或10-12點之LEBENSOHL',
                },
                {
                  call: '2H/S',
                  meaning: '0-9點，束叫，4張以上牌組',
                },
                {
                  call: '3H/S',
                  meaning: '5張牌組，邀請成局，10-12點',
                },
                {
                  call: '3NT',
                  meaning: '束叫，13 點↑',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: seats1,
                calls: [
                  '2D',
                  'X',
                  'P',
                  {
                    call: '2NT',
                    note: 'LEBENSOHL',
                  },
                  'P',
                  '3C',
                  'P',
                  '?',
                ],
              },
              rows: [
                {
                  call: 'P',
                  meaning: '梅花5張↑牌組，0-9點',
                },
                {
                  call: '3D',
                  meaning: '0-9點，方塊5張↑牌組',
                },
                {
                  call: '3H/S',
                  meaning: '10-12點，4張牌組',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['2H', '?'],
              },
              rows: [
                {
                  call: 'X',
                  meaning: '13-15 點，平均牌型，視同對敵開叫2♠之迫伴賭倍',
                },
                {
                  call: '2S',
                  meaning: '黑桃短門之 TAKE-OUT，13點以上',
                },
                {
                  call: '2NT',
                  meaning: '強無王16-19 點，黑桃有1擋↑',
                },
                {
                  call: '3C/D',
                  meaning: '好的五張↑牌組/方塊',
                },
                {
                  call: '3NT',
                  meaning: '20 點↑或 gambling',
                },
              ],
            },
            {
              kind: 'responses',
              auction: {
                seats: seats0,
                calls: ['2S', '?'],
              },
              rows: [
                {
                  call: 'X',
                  meaning: '兩高5-4以上，13-15 點',
                },
                {
                  call: '2NT',
                  meaning: '強無王16-19 點',
                },
                {
                  call: '3NT',
                  meaning: '20 點↑或 gambling',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
