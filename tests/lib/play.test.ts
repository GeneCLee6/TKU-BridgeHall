import { parseContract, playedTricks, playProblems, trickCount, trickWinner } from '../../src/lib/play.ts'

/** An article's card play (e5-t03). Test data only. */
describe('card play (e5-t03)', () => {
  it('reads contracts in the table’s notation', () => {
    expect(parseContract('4S')).toEqual({ level: 4, strain: 'S', doubled: '' })
    expect(parseContract('3N')).toEqual({ level: 3, strain: 'N', doubled: '' })
    expect(parseContract('6HXX')).toEqual({ level: 6, strain: 'H', doubled: 'XX' })
    for (const bad of ['4NT', '8S', '0C', '4SXXX', '4s', '']) expect(parseContract(bad)).toBeNull()
  })

  it('wins a trick with the highest card of the suit led, or the highest trump', () => {
    const trick = [
      { seat: 'W' as const, card: 'HK' },
      { seat: 'N' as const, card: 'H2' },
      { seat: 'E' as const, card: 'HA' },
      { seat: 'S' as const, card: 'S2' },
    ]
    expect(trickWinner(trick, null)).toBe('E')
    expect(trickWinner(trick, 'S')).toBe('S')
    expect(trickWinner(trick, 'D')).toBe('E')
    const offSuit = [
      { seat: 'N' as const, card: 'CT' },
      { seat: 'E' as const, card: 'C9' },
      { seat: 'S' as const, card: 'DA' },
      { seat: 'W' as const, card: 'CJ' },
    ]
    expect(trickWinner(offSuit, 'H')).toBe('W')
  })

  it('starts with the opening leader and lets the winner lead next', () => {
    const tricks = playedTricks('4S', 'S', [['HK', 'H2', 'HA', 'S2'], ['SA', 'S3', 'S4', 'S5'], ['D2']])
    expect(tricks.map((t) => t.leader)).toEqual(['W', 'S', 'S'])
    expect(tricks[0].cards.map((c) => c.seat)).toEqual(['W', 'N', 'E', 'S'])
    expect(tricks[1].cards.map((c) => c.seat)).toEqual(['S', 'W', 'N', 'E'])
    expect(tricks.map((t) => t.winner)).toEqual(['S', 'S', undefined])
    expect(trickCount(tricks, 'S')).toEqual({ declarer: 2, defenders: 0 })
    expect(trickCount(tricks, 'N', 1)).toEqual({ declarer: 1, defenders: 0 })
    expect(trickCount(tricks, 'E')).toEqual({ declarer: 0, defenders: 2 })
  })

  it('names what is wrong with a play', () => {
    expect(playProblems('3N', 'S', [['SA', 'SK', 'SQ', 'SJ'], ['ST']])).toEqual([])
    expect(playProblems('4NT', 'S', [['SA']])).toEqual(['合約要像 4S、3N、4HX'])
    expect(playProblems('3N', 'X', [['SA']])).toEqual(['要有莊家'])
    expect(playProblems('3N', 'S', [])).toEqual(['要有 1 到 13 墩'])
    expect(playProblems('3N', 'S', Array(14).fill(['SA']))).toEqual(['要有 1 到 13 墩'])
    expect(playProblems('3N', 'S', [['SA'], ['SK']])).toEqual(['第 1 墩少了牌：只有最後一墩可以沒出完'])
    expect(playProblems('3N', 'S', [['SA', 'SK', 'SQ', 'SJ', 'ST']])).toEqual(['第 1 墩要有 1 到 4 張牌'])
    expect(playProblems('3N', 'S', [['SA', 'SK', 'SQ', 'SA']])).toEqual(['SA 出現了兩次'])
    expect(playProblems('3N', 'S', [['S1']])).toEqual(['不認得的牌：S1'])
  })
})
