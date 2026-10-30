import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { AuctionTable } from '../../src/components/AuctionTable.tsx'
import { boardStrings } from '../../src/components/board/boardStrings.ts'
import { DealDiagram } from '../../src/components/board/DealDiagram.tsx'
import { CallLabel, Suit } from '../../src/components/Suit.tsx'
import { SEATS, toBookAuction, toLabelCall, type Seat } from '../../src/lib/board.ts'
import { createTheme } from '../../src/styles/tokens.ts'
import { AUCTION, CALLS, DEAL, SUITS } from '../shared-display/cases.ts'

/**
 * 淡江橋館 draws suits, calls, an auction and a deal as 淡江牌桌 does (e7-t07, AC-7.5): the cases in
 * tests/shared-display/cases.ts, the same file in both repositories (`npm run parity` checks the
 * two copies). Calls and cards come in the table's notation, as the forum's blocks keep them
 */

const wrap = (ui: ReactNode) => render(<ThemeProvider theme={createTheme('light')}>{ui}</ThemeProvider>)

describe('the display shared with 淡江牌桌', () => {
  it('draws each suit with its symbol and name', () => {
    for (const { suit, symbol, name } of SUITS) {
      const { unmount } = wrap(<Suit suit={suit} />)
      expect(screen.getByRole('img', { name })).toHaveTextContent(symbol)
      unmount()
    }
  })

  it('draws every call the same', () => {
    for (const [call, text] of CALLS) {
      const { container, unmount } = wrap(<CallLabel call={toLabelCall(call)} />)
      expect(container.textContent).toBe(text)
      unmount()
    }
  })

  it('draws an auction in the same rows, West to South', () => {
    const start = SEATS.indexOf(AUCTION.dealer)
    const calls = AUCTION.calls.map((call, i) => ({ seat: SEATS[(start + i) % 4], call }))
    wrap(<AuctionTable auction={toBookAuction({ dealer: AUCTION.dealer, calls }, boardStrings.seatNames)} />)
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows.map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent))).toEqual(AUCTION.rows)
  })

  it('draws each hand of a deal suit by suit, a void as a dash', () => {
    const hands = Object.fromEntries(SEATS.map((seat) => [seat, [...DEAL.hands[seat]]])) as Record<Seat, string[]>
    wrap(<DealDiagram deal={{ hands, dealer: 'N', vul: 'None' }} />)
    expect(boardStrings.void).toBe(DEAL.void)
    for (const seat of SEATS) {
      const hand = screen.getByRole('group', { name: boardStrings.seatHand(boardStrings.seatNames[seat]) })
      const drawn: Record<string, string[]> = {}
      for (const item of within(hand).getAllByRole('listitem')) {
        const suit = SUITS.find((s) => s.name === within(item).getByRole('img').getAttribute('aria-label'))!.suit
        const ranks = item.querySelector('span:last-child')!.textContent!
        drawn[suit] = ranks === DEAL.void ? [] : ranks.split(' ')
      }
      expect(drawn).toEqual(DEAL.drawn[seat])
    }
  })
})
