import { conventions } from '../../src/content/index.ts'
import { generateQuizzes, type Quiz } from '../../src/lib/quiz.ts'
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

const names = new Map(conventions.map((c) => [c.slug, c.nameZh]))

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
    expect(spokenAuction('[原文已移除]')).toEqual({ calls: ['1D', 'X', 'P'], first: 1 })
    expect(spokenAuction('EX2) 同伴 1♠，右敵 2♥，你？')).toEqual({ calls: ['1S', '2H'], first: 2 })
    expect(spokenAuction('EX) 同伴開叫3♠')).toBeUndefined()
    expect(spokenAuction('[原文已移除]')).toBeUndefined()
    // Not seat by seat
    expect(spokenAuction('EX) 左敵 1♦，右敵 PASS，你？')).toBeUndefined()
    expect(spokenAuction('左敵 1♦，同伴 X，右敵 PASS，你？')).toBeUndefined()
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
    expect(bankId('system-doubles/examples/4/hand')).toBe('book-system-doubles-examples-4-hand')
    expect(bankId('lebensohl/after-x/m-0abc12de')).toBe('book-lebensohl-after-x-m-0abc12de')
  })
})

describe('exportQuizzes (e6-t08, AC-6.5)', () => {
  const { quizzes } = generateQuizzes(conventions, 'club')
  const { questions, skipped } = exportQuizzes(quizzes, names)

  it('exports the bundled examples whose auction and hand can be read, as pending', () => {
    expect(questions.map((q) => [q.id, q.dealer, q.auction.join(' '), q.answer])).toEqual([
      ['book-system-doubles-examples-1-hand', 'W', '1D X P', '1H'],
      ['book-system-doubles-examples-2-hand', 'W', '1D X P', '1H'],
      ['book-system-doubles-examples-4-hand', 'W', '1S X P', '2C'],
      ['book-system-doubles-examples-6-hand', 'W', '1D X P', '2H'],
      ['book-system-doubles-examples-7-hand', 'W', '1D X P', '2D'],
      ['book-system-doubles-examples-8-hand', 'W', '1D X P', '1N'],
      ['book-system-doubles-examples-9-hand', 'W', '1D X P', '1N'],
    ])
    for (const q of questions) {
      expect(q).toMatchObject({ system: 'tku', vul: 'None', reviewer: null, status: 'pending' })
      expect(q.note).toMatch(/身價原文未寫/)
      expect(q.source).toMatch(/^淡江橋館：賭倍性叫品/)
      // The hand is the example's own
      const made = quizzes.find((x) => bankId(x.id) === q.id)!
      expect(q.hand).toBe(bankHand(made.hand!))
    }
    const reasons = Object.fromEntries(skipped.filter((s) => s.reason !== 'meaning').map((s) => [s.id, s.reason]))
    expect(reasons).toEqual({
      'system-competition/preempts/5/hand': 'noAuction',
      'system-competition/preempts/6/hand': 'noAuction',
      'system-competition/preempts/7/hand': 'noAuction',
      'system-competition/preempts/8/hand': 'noAuction',
      'system-competition/preempts/9/hand': 'noAuction',
      'system-competition/preempts/10/hand': 'noAuction',
      'system-concepts/fit/18/hand': 'hand',
    })
    expect(bankFile(questions)).toMatchObject({ category: BANK_CATEGORY, questions })
  })

  it('exports an editor’s call question from its diagram, and leaves out what cannot go', () => {
    const manual: Quiz = {
      id: 'lebensohl/a/m-0000abcd',
      kind: 'call',
      profileId: 'club',
      slug: 'lebensohl',
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
      expect.objectContaining({ id: 'book-lebensohl-a-m-0000abcd', dealer: 'N', auction: ['1N', '2H'], answer: '2N', hand: 'KQ2.32.J9832.Q32' }),
    ])
    expect(out.skipped).toEqual([
      { id: 'x/a/m-1', reason: 'disabled' },
      { id: 'x/a/m-2', reason: 'auction' },
      { id: 'x/a/m-3', reason: 'noAuction' },
    ])
  })
})
