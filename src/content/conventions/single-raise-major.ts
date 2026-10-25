import type { Auction, Convention, Section } from '../../types/convention.ts'

/**
 * 1H 2H（淡江用）: after opener raises responder's one-level major to two
 * Source: the club's Word file "1H 2H(淡江用)".
 * Transcribed verbatim; only bids and suit letters were rewritten with suit symbols (3H -> 3♥,
 * "C短門" -> "♣短門"). The source shows no opponents' calls, so their seats are left empty.
 */

const seats: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']

const SUIT_SYMBOL = { C: '♣', D: '♦', H: '♥', S: '♠' } as const
type Suit = keyof typeof SUIT_SYMBOL

/** 1{opening} — 1{major} — 2{major}, then '?' for responder, or 2NT then '?' for opener */
const auction = (opening: Suit, major: Suit, asked = false): Auction => ({
  seats,
  calls: ['1' + opening, '', '1' + major, '', '2' + major, '', ...(asked ? ['2NT', ''] : []), '?'],
})

const sequence = (opening: Suit, major: Suit) =>
  `1${SUIT_SYMBOL[opening]} 1${SUIT_SYMBOL[major]} 2${SUIT_SYMBOL[major]}`

const situation = (
  id: string,
  opening: Suit,
  major: Suit,
  rebids: { rows: { call: string; meaning: string }[]; notes: string[] },
  answers: { rows: { call: string; meaning: string }[] },
): Section => ({
  id,
  title: `1${SUIT_SYMBOL[opening]} 1${SUIT_SYMBOL[major]} 2${SUIT_SYMBOL[major]}`,
  originalTitle: `1${opening}  1${major} / 2${major}`,
  children: [
    {
      id: `${id}-rebids`,
      title: `答叫者再叫：${sequence(opening, major)} ?`,
      blocks: [
        { kind: 'responses', auction: auction(opening, major), rows: rebids.rows },
        ...rebids.notes.map((text) => ({ kind: 'note' as const, tone: 'info' as const, text })),
      ],
    },
    {
      id: `${id}-2nt`,
      title: `開叫者回答牌型：${sequence(opening, major)} 2NT ?`,
      blocks: [
        { kind: 'responses', auction: auction(opening, major, true), rows: answers.rows },
        {
          kind: 'note',
          tone: 'info',
          text: 'P.S.開叫者3線報完牌型後，答叫者加一花色為要求報控。',
        },
      ],
    },
  ],
})

export const singleRaiseMajor: Convention = {
  slug: 'single-raise-major',
  nameZh: '1H 2H（淡江用）',
  nameEn: 'After a Single Raise of Responder’s Major',
  aliases: ['1H 2H', '1S 2S', '單加', '高花單加', '2NT 問牌型', 'try slam'],
  category: 'suit-openings',
  kind: 'convention',
  level: 'intermediate',
  tags: ['單加高花', '2NT 問牌型', '長門邀請', 'splinter', 'RKCB'],
  summary:
    '開叫者單加答叫者的一線高花後：答叫者的再叫（長門邀請、2NT 問牌型、splinter），以及 2NT 後開叫者報牌型。',
  source: { title: '1H 2H(淡江用)' },
  updated: '2026-10-21',
  sections: [
    situation(
      'c-h',
      'C',
      'H',
      {
        rows: [
          { call: '2S', meaning: '長門邀請，至少迫叫至3♥' },
          { call: '2NT', meaning: 'try slam，詢問牌型' },
          { call: '3C', meaning: '長門邀請，至少迫叫至3♥' },
          { call: '3D', meaning: '長門邀請，至少迫叫至3♥' },
          { call: '3H', meaning: '旁門無4張之邀請（4333 or 5332）' },
          { call: '3S', meaning: 'splinter' },
          { call: '4C', meaning: 'splinter' },
          { call: '4D', meaning: 'splinter' },
          { call: '4H', meaning: '束叫' },
          { call: '4NT', meaning: 'RKCB' },
        ],
        notes: ['P.S.長門邀請後，叫♣是高限的2425牌型，叫其他花色為好牌控制高限'],
      },
      {
        rows: [
          { call: '3C', meaning: '2425' },
          { call: '3D', meaning: '1435（3張♦）' },
          { call: '3H', meaning: '3433 or 3424 or 2434' },
          { call: '3S', meaning: '3415（3張♠）' },
          { call: '4D', meaning: '♦短門，♣至少6張以上' },
          { call: '4S', meaning: '♠短門，♣至少6張以上（較少用,因為會越過4♥）' },
        ],
      },
    ),
    situation(
      'c-s',
      'C',
      'S',
      {
        rows: [
          { call: '2NT', meaning: 'try slam，詢問牌型' },
          { call: '3C', meaning: '長門邀請，至少迫叫至3♠' },
          { call: '3D', meaning: '長門邀請，至少迫叫至3♠' },
          { call: '3H', meaning: '長門邀請，至少迫叫至3♠' },
          { call: '3S', meaning: '旁門無4張之邀請（4333 or 5332）' },
          { call: '4C', meaning: 'splinter' },
          { call: '4D', meaning: 'splinter' },
          { call: '4H', meaning: 'splinter' },
          { call: '4S', meaning: '束叫' },
          { call: '4NT', meaning: 'RKCB' },
        ],
        notes: ['P.S.長門邀請後，叫♣是高限的4225牌型，叫其他花色為好牌控制高限'],
      },
      {
        rows: [
          { call: '3C', meaning: '4225' },
          { call: '3D', meaning: '4135（3張♦）' },
          { call: '3H', meaning: '4315（3張♥）' },
          { call: '3S', meaning: '4333 or 4324 or 4234' },
          { call: '4D', meaning: '♦短門，♣至少6張以上' },
          { call: '4H', meaning: '♥短門，♣至少6張以上' },
        ],
      },
    ),
    situation(
      'd-h',
      'D',
      'H',
      {
        rows: [
          { call: '2S', meaning: '長門邀請，至少迫叫至3♥' },
          { call: '2NT', meaning: 'try slam，詢問牌型' },
          { call: '3C', meaning: '長門邀請，至少迫叫至3♥' },
          { call: '3D', meaning: '長門邀請，至少迫叫至3♥' },
          { call: '3H', meaning: '旁門無4張之邀請（4333 or 5332）' },
          { call: '3S', meaning: 'splinter' },
          { call: '4C', meaning: 'splinter' },
          { call: '4D', meaning: 'splinter' },
          { call: '4H', meaning: '束叫' },
          { call: '4NT', meaning: 'RKCB' },
        ],
        notes: ['P.S.長門邀請後，叫♦是高限的2452牌型，叫其他花色為好牌控制高限。'],
      },
      {
        rows: [
          { call: '3C', meaning: '1453（3張♣）' },
          { call: '3D', meaning: '2452' },
          { call: '3H', meaning: '3442 or 2443' },
          { call: '3S', meaning: '3451（3張♠）' },
          { call: '4C', meaning: '♣短門，♦至少6張以上' },
          { call: '4S', meaning: '♠短門，♦至少6張以上' },
        ],
      },
    ),
    situation(
      'd-s',
      'D',
      'S',
      {
        rows: [
          { call: '2NT', meaning: 'try slam，詢問牌型' },
          { call: '3C', meaning: '長門邀請，至少迫叫至3♠' },
          { call: '3D', meaning: '長門邀請，至少迫叫至3♠' },
          { call: '3H', meaning: '長門邀請，至少迫叫至3♠' },
          { call: '3S', meaning: '旁門無4張之邀請（4333 or 5332）' },
          { call: '4C', meaning: 'splinter' },
          { call: '4D', meaning: 'splinter' },
          { call: '4H', meaning: 'splinter' },
          { call: '4S', meaning: '束叫' },
          { call: '4NT', meaning: 'RKCB' },
        ],
        notes: ['P.S.長門邀請後，叫♦是高限的4252牌型，叫其他花色為好牌控制高限'],
      },
      {
        rows: [
          { call: '3C', meaning: '4153（3張♣）' },
          { call: '3D', meaning: '4252' },
          { call: '3H', meaning: '4351（3張♥）' },
          { call: '3S', meaning: '4342 or 4243' },
          { call: '4C', meaning: '♣短門，♦至少6張以上' },
          { call: '4H', meaning: '♥短門，♦至少6張以上' },
        ],
      },
    ),
    situation(
      'h-s',
      'H',
      'S',
      {
        rows: [
          { call: '2NT', meaning: 'try slam，詢問牌型' },
          { call: '3C', meaning: '長門邀請，至少迫叫至3♠' },
          { call: '3D', meaning: '長門邀請，至少迫叫至3♠' },
          { call: '3H', meaning: '以♥為王，try slam，詢問牌型。' },
          { call: '3S', meaning: '無旁門長門，邀請4♠（通常應為5332 or 4333）' },
          { call: '4C', meaning: 'splinter' },
          { call: '4D', meaning: 'splinter' },
          { call: '4H', meaning: 'splinter' },
          { call: '4S', meaning: '束叫' },
          { call: '4NT', meaning: 'RKCB' },
        ],
        notes: [
          'P.S.1.長門邀請後，叫♥是高限的4522牌型，叫其他花色為好牌控制高限。',
          '2.3♥後4522叫3NT，4♣為4513，4♦為4531，其後叫品為報控。',
        ],
      },
      {
        rows: [
          { call: '3C', meaning: '4513' },
          { call: '3D', meaning: '4531' },
          { call: '3H', meaning: '4522低限' },
          { call: '3S', meaning: '4522高限' },
          { call: '4C', meaning: '♣短門，♥至少6張以上' },
          { call: '4D', meaning: '♦短門，♥至少6張以上' },
        ],
      },
    ),
  ],
}
