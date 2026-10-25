import {
  addCall,
  auctionProblem,
  auctionRows,
  dealerOf,
  dealProblems,
  emptyDeal,
  emptyHands,
  fillRemaining,
  fullDeck,
  handProblems,
  isAuctionComplete,
  isCompleteDeal,
  isCompleteHand,
  isLegalAuction,
  lastSeatToFill,
  legalCalls,
  seatToFill,
  toggleCard,
  toTableAuction,
  vulnerabilityOf,
  withDealer,
  type Auction,
  type AuctionCall,
  type Call,
  type Deal,
  type Seat,
} from '../../src/lib/board.ts'

const deck = fullDeck()
/** Spades to North, hearts to East, diamonds to South, clubs to West */
const suitDeal = (): Deal => ({
  hands: { N: deck.slice(0, 13), E: deck.slice(13, 26), S: deck.slice(26, 39), W: deck.slice(39) },
  dealer: 'N',
  vul: 'None',
})

/** Build an auction from compact calls, seats following the dealer */
function auction(dealer: Seat, calls: Call[]): Auction {
  return calls.reduce<Auction>((a, call) => {
    const next = addCall(a, call)
    if (next === a) throw new Error(`illegal ${call}`)
    return next
  }, { dealer, calls: [] })
}

describe('deals', () => {
  it('accepts the four hands of a full pack', () => {
    expect(deck).toHaveLength(52)
    expect(new Set(deck).size).toBe(52)
    expect(dealProblems(suitDeal())).toEqual([])
    expect(isCompleteDeal(suitDeal())).toBe(true)
  })

  it('reports short hands, duplicated and invalid cards, dealer and vulnerability', () => {
    const deal = suitDeal()
    deal.hands.E = [...deal.hands.E.slice(1), 'SA'] // ♥A is missing, ♠A is held twice
    expect(dealProblems(deal)).toEqual([{ kind: 'duplicate', card: 'SA', seats: ['N', 'E'] }])

    const short = suitDeal()
    short.hands.W = short.hands.W.slice(0, 12)
    expect(dealProblems(short)).toEqual([{ kind: 'count', seat: 'W', count: 12 }])

    const bad = { ...suitDeal(), dealer: 'X', vul: 'All' } as unknown as Deal
    bad.hands.S = [...bad.hands.S.slice(1), 'Z9']
    expect(dealProblems(bad)).toEqual([
      { kind: 'dealer' },
      { kind: 'vul' },
      { kind: 'invalid', seat: 'S', card: 'Z9' },
    ])
    expect(isCompleteDeal(emptyDeal())).toBe(false)
  })

  it('moves a clicked card to the chosen seat, or back to the pack', () => {
    let hands = toggleCard(emptyHands(), 'N', 'C2')
    hands = toggleCard(hands, 'N', 'SA')
    expect(hands.N).toEqual(['SA', 'C2']) // sorted ♠ first
    hands = toggleCard(hands, 'E', 'SA')
    expect(hands.N).toEqual(['C2'])
    expect(hands.E).toEqual(['SA'])
    hands = toggleCard(hands, 'E', 'SA')
    expect(hands.E).toEqual([])
  })

  it('never gives a seat a fourteenth card', () => {
    const hands = suitDeal().hands
    expect(toggleCard(hands, 'N', 'H2')).toBe(hands)
  })

  it('moves on to the next seat with room and fills the last one', () => {
    const hands = { ...emptyHands(), N: deck.slice(0, 13) }
    expect(seatToFill(hands, 'N')).toBe('E')
    expect(seatToFill(hands, 'W')).toBe('W')
    expect(lastSeatToFill(hands)).toBeUndefined()

    const three = { ...suitDeal().hands, S: [] }
    expect(lastSeatToFill(three)).toBe('S')
    expect(fillRemaining(three, 'S').S).toEqual(deck.slice(26, 39))
  })

  it('follows the duplicate board cycle', () => {
    expect([1, 2, 3, 4, 5].map(dealerOf)).toEqual(['N', 'E', 'S', 'W', 'N'])
    expect([1, 2, 3, 4, 5, 16, 17].map(vulnerabilityOf)).toEqual(['None', 'NS', 'EW', 'Both', 'NS', 'EW', 'None'])
  })
})

describe('hands', () => {
  it('checks a single hand', () => {
    expect(isCompleteHand(deck.slice(0, 13))).toBe(true)
    expect(handProblems(deck.slice(0, 12))).toEqual([{ kind: 'count', count: 12 }])
    expect(handProblems([...deck.slice(0, 12), 'SA'])).toEqual([{ kind: 'duplicate', card: 'SA' }])
    expect(handProblems([...deck.slice(0, 12), '10'])).toEqual([{ kind: 'invalid', card: '10' }])
  })
})

describe('auctions', () => {
  it('allows only higher bids, doubles of an opponent and redoubles of a double', () => {
    const opened = auction('N', ['1H'])
    const legal = legalCalls(opened.calls, 'N')
    expect(legal.has('1S')).toBe(true)
    expect(legal.has('1D')).toBe(false)
    expect(legal.has('1H')).toBe(false)
    expect(legal.has('X')).toBe(true)
    expect(legal.has('XX')).toBe(false)

    // Partner may not double partner's bid
    const passed = auction('N', ['1H', 'P'])
    expect(legalCalls(passed.calls, 'N').has('X')).toBe(false)
    const doubled = auction('N', ['1H', 'X'])
    expect(legalCalls(doubled.calls, 'N').has('XX')).toBe(true)
    expect(legalCalls(auction('N', ['1H', 'X', 'P']).calls, 'N').has('XX')).toBe(false)
    expect(legalCalls(auction('N', ['1H', 'X', 'P', 'P']).calls, 'N').has('XX')).toBe(true)
    expect(legalCalls(auction('N', ['1H', 'P', 'P']).calls, 'N').has('X')).toBe(true)
  })

  it('ends after four passes, or three passes after a bid', () => {
    expect(isAuctionComplete(auction('E', ['P', 'P', 'P', 'P']).calls)).toBe(true)
    expect(isAuctionComplete(auction('E', ['P', 'P', 'P']).calls)).toBe(false)
    expect(isAuctionComplete(auction('E', ['1C', 'P', 'P', 'P']).calls)).toBe(true)
    expect(legalCalls(auction('E', ['1C', 'P', 'P', 'P']).calls, 'E').size).toBe(0)
    expect(isAuctionComplete(auction('E', ['P', '1C', 'P', 'P']).calls)).toBe(false)
  })

  it('validates a whole sequence and names the first problem', () => {
    const good = auction('S', ['1D', 'P', '1S', '2H', '4S', 'P', 'P', 'P'])
    expect(isLegalAuction(good)).toBe(true)
    expect(isLegalAuction({ dealer: 'N', calls: [] })).toBe(true)

    const at = (calls: AuctionCall[], dealer: Seat = 'N') => auctionProblem({ dealer, calls })
    expect(at([{ seat: 'N', call: '1D' }, { seat: 'E', call: '1C' }])).toEqual({ kind: 'illegal', index: 1 })
    expect(at([{ seat: 'N', call: '1D' }, { seat: 'E', call: 'P' }, { seat: 'S', call: 'X' }])).toEqual({
      kind: 'illegal',
      index: 2,
    })
    expect(at([{ seat: 'E', call: '1D' }])).toEqual({ kind: 'seat', index: 0 })
    expect(at([{ seat: 'N', call: '1NT' }])).toEqual({ kind: 'call', index: 0 })
    expect(at([{ seat: 'N', call: 'XX' }])).toEqual({ kind: 'illegal', index: 0 })
    const passedOut = auction('N', ['P', 'P', 'P', 'P']).calls
    expect(at([...passedOut, { seat: 'N', call: '1C' }])).toEqual({ kind: 'afterEnd', index: 4 })
    expect(auctionProblem({ dealer: 'Q' as Seat, calls: [] })).toEqual({ kind: 'dealer' })
  })

  it('refuses an illegal call and keeps an alert', () => {
    const a = auction('W', ['1N'])
    expect(addCall(a, '1S')).toBe(a)
    expect(addCall(a, '2C', 'Stayman').calls[1]).toEqual({ seat: 'N', call: '2C', alert: 'Stayman' })
  })

  it('re-seats the calls when the dealer changes and stays legal', () => {
    const a = auction('N', ['1H', 'X', 'XX'])
    const b = withDealer(a, 'W')
    expect(b.calls.map((c) => c.seat)).toEqual(['W', 'N', 'E'])
    expect(isLegalAuction(b)).toBe(true)
  })

  it('lays the calls out in 西 北 東 南 columns', () => {
    const a = auction('N', ['1D', 'P', '1S', '2H'])
    expect(auctionRows(a).map((row) => row.map((c) => c?.call ?? null))).toEqual([
      [null, '1D', 'P', '1S'],
      ['2H', null, null, null],
    ])
    const table = toTableAuction(addCall(a, '2N', '平衡'), { N: '北', E: '東', S: '南', W: '西' })
    expect(table.seats).toEqual(['西', '北', '東', '南'])
    expect(table.calls).toEqual(['', '1D', 'P', '1S', '2H', { call: '2NT', note: '平衡' }])
  })
})
