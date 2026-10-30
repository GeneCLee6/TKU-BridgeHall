import { conventions } from '../fixtures/content.ts'
import { generateQuizzes, type Quiz } from '../../src/lib/quiz.ts'
import type { Convention } from '../../src/types/convention.ts'
import {
  BANK_CATEGORY,
  bankCall,
  bankFile,
  bankHand,
  bankId,
  checkAuction,
  diagramAuction,
  exportQuizzes,
  spokenAuction,
} from '../../src/lib/quizExport.ts'

/** Made-up worked examples (not the club's): one the bank can take, one with x for small cards */
const examples: Convention = {
  slug: 'fixture-examples',
  nameZh: '測試牌例（虛構）',
  nameEn: 'Fixture examples (made up for tests)',
  category: 'system',
  tags: [],
  summary: '測試用',
  source: { title: '測試資料（虛構）' },
  updated: '2026-10-30',
  sections: [
    {
      id: 'examples',
      title: '測試牌例',
      blocks: [
        { kind: 'paragraph', text: 'EX) 左敵 1♣，同伴 X，右敵 PASS，你？' },
        { kind: 'hand', label: '叫1H', hand: { spades: 'T42', hearts: 'K9863', diamonds: 'Q76', clubs: '53' } },
        { kind: 'hand', label: '叫1S', hand: { spades: 'AKXX', hearts: 'XX', diamonds: 'XXX', clubs: 'XXXX' } },
      ],
    },
  ],
}
const bundled = [...conventions, examples]
const names = new Map(bundled.map((c) => [c.slug, c.nameZh]))

describe('the table question bank format (e6-t08, AC-6.1)', () => {
  it('writes a hand S.H.D.C high to low, and only one of 13 cards named by rank', () => {
    expect(bankHand({ spades: 'T4', hearts: '9863', diamonds: '9762', clubs: '753' })).toBe('T4.9863.9762.753')
    expect(bankHand({ spades: '-', hearts: 'KQJ87543', diamonds: 'KQJ', clubs: '84' })).toBe('.KQJ87543.KQJ.84')
    expect(bankHand({ spades: '4T', hearts: '9863', diamonds: '9762', clubs: '10 53' })).toBe('T4.9863.9762.T53')
    // Small cards as x are not cards the robot can hold
    expect(bankHand({ spades: 'AKXXXX', hearts: 'XX', diamonds: 'X', clubs: 'XXX' })).toBeUndefined()
    expect(bankHand({ spades: 'AK', hearts: 'Q', diamonds: 'J', clubs: '2' })).toBeUndefined()
    expect(bankHand({ spades: 'AAKQJ', hearts: '5432', diamonds: '32', clubs: '22' })).toBeUndefined()
  })

  it('writes calls as the bank does', () => {
    expect(['1NT', '3N', 'PASS', 'P', 'X', 'XX', '2♦', '7S'].map(bankCall)).toEqual(['1N', '3N', 'P', 'P', 'X', 'XX', '2D', '7S'])
    expect(['1H/S', '---', '?', '8C', ''].map(bankCall)).toEqual([undefined, undefined, undefined, undefined, undefined])
  })

  it('checks an auction by the laws: higher bids, doubles of the opponents only, the end', () => {
    expect(checkAuction([])).toEqual({ legal: true, over: false })
    expect(checkAuction(['1D', 'X', 'P'])).toEqual({ legal: true, over: false })
    expect(checkAuction(['1D', 'X', 'P', '1H'])).toEqual({ legal: true, over: false })
    expect(checkAuction(['1S', 'P', 'P', 'P'])).toEqual({ legal: true, over: true })
    expect(checkAuction(['P', 'P', 'P', 'P'])).toEqual({ legal: true, over: true })
    expect(checkAuction(['1S', 'P', 'P', 'P', '2C']).legal).toBe(false)
    expect(checkAuction(['1H', '1D']).legal).toBe(false)
    expect(checkAuction(['1H', 'P', 'X']).legal).toBe(false)
    expect(checkAuction(['1H', 'X', 'XX']).legal).toBe(true)
    expect(checkAuction(['1H', 'P', 'P', 'X']).legal).toBe(true)
    expect(checkAuction(['X']).legal).toBe(false)
  })

  it('reads an example written seat by seat, and nothing else', () => {
    expect(spokenAuction('EX) 左敵 1♣，同伴 X，右敵 PASS，你？')).toEqual({ calls: ['1C', 'X', 'P'], first: 1 })
    expect(spokenAuction('EX2) 同伴 1♠，右敵 2♥，你？')).toEqual({ calls: ['1S', '2H'], first: 2 })
    expect(spokenAuction('EX) 同伴開叫3♥')).toBeUndefined()
    expect(spokenAuction('EX) 1♣ 1♥ 2♣ 2♥ 3♣ ？')).toBeUndefined()
    // Not seat by seat
    expect(spokenAuction('EX) 左敵 1♣，右敵 PASS，你？')).toBeUndefined()
    expect(spokenAuction('左敵 1♣，同伴 X，右敵 PASS，你？')).toBeUndefined()
  })

  it('reads an auction diagram from the dealer to the seat asked', () => {
    expect(diagramAuction({ seats: ['W', 'N', 'E', 'S'], calls: ['', '1NT', 'P', '?'] })).toEqual(['1N', 'P'])
    expect(diagramAuction({ seats: ['W', 'N', 'E', 'S'], calls: ['1D', { call: 'X', note: '技術性' }, 'P'] })).toEqual([
      '1D',
      'X',
      'P',
    ])
    expect(diagramAuction({ seats: ['W', 'N', 'E', 'S'], calls: ['1H/S', 'P', '?'] })).toBeUndefined()
  })

  it('makes ids the bank takes', () => {
    expect(bankId('fixture-examples/examples/4/hand')).toBe('book-fixture-examples-examples-4-hand')
    expect(bankId('fixture-alpha/after-x/m-0abc12de')).toBe('book-fixture-alpha-after-x-m-0abc12de')
  })
})

describe('exportQuizzes (e6-t08, AC-6.5)', () => {
  const { quizzes } = generateQuizzes(bundled, 'club')
  const { questions, skipped } = exportQuizzes(quizzes, names)

  it('exports the bundled examples whose auction and hand can be read, as pending', () => {
    expect(questions.map((q) => [q.id, q.dealer, q.auction.join(' '), q.answer])).toEqual([
      ['book-fixture-examples-examples-1-hand', 'W', '1C X P', '1H'],
    ])
    for (const q of questions) {
      expect(q).toMatchObject({ system: 'tku', vul: 'None', reviewer: null, status: 'pending' })
      expect(q.note).toMatch(/身價原文未寫/)
      expect(q.source).toMatch(/^淡江橋館：測試牌例（虛構）/)
      // The hand is the example's own
      const made = quizzes.find((x) => bankId(x.id) === q.id)!
      expect(q.hand).toBe(bankHand(made.hand!))
    }
    const reasons = Object.fromEntries(skipped.filter((s) => s.reason !== 'meaning').map((s) => [s.id, s.reason]))
    expect(reasons).toEqual({
      // fixture-alpha's example says 同伴開叫 1NT, not seat by seat
      'fixture-alpha/rules/3/hand': 'noAuction',
      'fixture-examples/examples/2/hand': 'hand',
    })
    expect(bankFile(questions)).toMatchObject({ category: BANK_CATEGORY, questions })
  })

  it('exports an editor’s call question from its diagram, and leaves out what cannot go', () => {
    const manual: Quiz = {
      id: 'fixture-alpha/a/m-0000abcd',
      kind: 'call',
      profileId: 'club',
      slug: 'fixture-alpha',
      sectionId: 'a',
      auction: { seats: ['西', '北', '東', '南'], calls: ['', '1NT', '2H', '?'] },
      hand: { spades: 'KQ2', hearts: '32', diamonds: 'J9832', clubs: 'Q32' },
      answer: '2NT',
      choices: ['2NT', '3D'],
      source: 'manual',
      trail: ['A'],
    }
    const out = exportQuizzes(
      [
        manual,
        { ...manual, id: 'x/a/m-1', disabled: true },
        { ...manual, id: 'x/a/m-2', answer: '2D' },
        { ...manual, id: 'x/a/m-3', auction: undefined },
      ],
      names,
    )
    // North dealt; East overcalled; South to call
    expect(out.questions).toEqual([
      expect.objectContaining({ id: 'book-fixture-alpha-a-m-0000abcd', dealer: 'N', auction: ['1N', '2H'], answer: '2N', hand: 'KQ2.32.J9832.Q32' }),
    ])
    expect(out.skipped).toEqual([
      { id: 'x/a/m-1', reason: 'disabled' },
      { id: 'x/a/m-2', reason: 'auction' },
      { id: 'x/a/m-3', reason: 'noAuction' },
    ])
  })
})
