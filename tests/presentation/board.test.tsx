import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactNode } from 'react'
import { ThemeProvider } from 'styled-components'
import { AuctionInput } from '../../src/components/board/AuctionInput.tsx'
import { DealDiagram } from '../../src/components/board/DealDiagram.tsx'
import { DealInput } from '../../src/components/board/DealInput.tsx'
import { HandInput } from '../../src/components/board/HandInput.tsx'
import { emptyDeal, fullDeck, type TableAuction, type Card, type Deal } from '../../src/lib/board.ts'
import { createTheme } from '../../src/styles/tokens.ts'

const themed = (node: ReactNode) => render(<ThemeProvider theme={createTheme('light')}>{node}</ThemeProvider>)

const deck = fullDeck()

describe('DealDiagram', () => {
  it('names each seat and reads suits in Chinese', () => {
    const deal: Deal = {
      hands: { N: deck.slice(0, 13), E: deck.slice(13, 26), S: deck.slice(26, 39), W: deck.slice(39) },
      dealer: 'E',
      vul: 'Both',
    }
    themed(<DealDiagram deal={deal} />)
    const figure = screen.getByRole('group', { name: '牌例' })
    const north = within(figure).getByRole('group', { name: '北家' })
    const spades = within(north).getAllByRole('listitem')[0]
    expect(within(spades).getByRole('img', { name: '黑桃' })).toBeInTheDocument()
    expect(spades).toHaveTextContent('A K Q J 10 9 8 7 6 5 4 3 2')
    expect(within(north).getAllByRole('listitem')[1]).toHaveTextContent('—')
    expect(within(figure).getByRole('group', { name: '西家' })).toBeInTheDocument()
    expect(figure).toHaveTextContent('發牌：東')
    expect(figure).toHaveTextContent('雙有身價')
  })
})

function DealHarness({ onDeal }: { onDeal: (deal: Deal) => void }) {
  const [deal, setDeal] = useState(emptyDeal())
  return (
    <DealInput
      value={deal}
      onChange={(next) => {
        setDeal(next)
        onDeal(next)
      }}
    />
  )
}

describe('DealInput', () => {
  it('gives clicked cards to the chosen seat and moves on after thirteen', async () => {
    const user = userEvent.setup()
    let deal = emptyDeal()
    themed(<DealHarness onDeal={(d) => (deal = d)} />)
    const panel = screen.getByRole('group', { name: '選牌' })
    const spades = within(panel).getByRole('group', { name: '黑桃' })

    for (const button of within(spades).getAllByRole('button')) await user.click(button)
    expect(deal.hands.N).toEqual(deck.slice(0, 13))
    expect(screen.getByRole('radio', { name: '東 0／13' })).toBeChecked()
    expect(within(panel).getByRole('button', { name: '黑桃A（北家）' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(within(panel).getByRole('button', { name: '紅心A' }))
    expect(deal.hands.E).toEqual(['HA'])
    // A card East holds goes back to the pack
    await user.click(within(panel).getByRole('button', { name: '紅心A（東家）' }))
    expect(deal.hands.E).toEqual([])
  })

  it('is operable from the keyboard', async () => {
    const user = userEvent.setup()
    let deal = emptyDeal()
    themed(<DealHarness onDeal={(d) => (deal = d)} />)
    const panel = screen.getByRole('group', { name: '選牌' })
    const first = within(panel).getByRole('button', { name: '黑桃A' })
    expect(first).toHaveAttribute('tabindex', '0')
    expect(within(panel).getByRole('button', { name: '黑桃K' })).toHaveAttribute('tabindex', '-1')

    first.focus()
    await user.keyboard('{ArrowRight}{ArrowDown}{Enter}')
    expect(within(panel).getByRole('button', { name: /^紅心K/ })).toHaveFocus()
    expect(deal.hands.N).toEqual(['HK'])
    await user.keyboard('{End}[Space]')
    expect(deal.hands.N).toEqual(['HK', 'H2'])

    await user.click(screen.getByRole('radio', { name: '西 0／13' }))
    expect(screen.getByRole('radio', { name: '西 0／13' })).toBeChecked()
  })

  it('fills the last hand and sets dealer and vulnerability', async () => {
    const user = userEvent.setup()
    let deal = emptyDeal()
    themed(<DealHarness onDeal={(d) => (deal = d)} />)
    const panel = screen.getByRole('group', { name: '選牌' })
    for (const suit of ['黑桃', '紅心', '方塊'])
      for (const button of within(within(panel).getByRole('group', { name: suit })).getAllByRole('button'))
        await user.click(button)
    expect(screen.getByRole('status')).toHaveTextContent('還差 13 張')
    await user.click(screen.getByRole('button', { name: '剩下的牌給西家' }))
    expect(deal.hands.W).toEqual(deck.slice(39))
    expect(screen.getByRole('status')).toHaveTextContent('四家牌都齊了')

    await user.selectOptions(screen.getByRole('combobox', { name: '發牌' }), '南')
    await user.selectOptions(screen.getByRole('combobox', { name: '身價' }), '東西有身價')
    expect(deal).toMatchObject({ dealer: 'S', vul: 'EW' })
  })
})

function HandHarness({ onHand }: { onHand: (cards: Card[]) => void }) {
  const [cards, setCards] = useState<Card[]>([])
  return (
    <HandInput
      value={cards}
      onChange={(next) => {
        setCards(next)
        onHand(next)
      }}
    />
  )
}

describe('HandInput', () => {
  it('picks up to thirteen cards and counts points', async () => {
    const user = userEvent.setup()
    let cards: Card[] = []
    themed(<HandHarness onHand={(c) => (cards = c)} />)
    const panel = screen.getByRole('group', { name: '選牌' })
    await user.click(within(panel).getByRole('button', { name: '梅花A' }))
    await user.click(within(panel).getByRole('button', { name: '黑桃K' }))
    expect(cards).toEqual(['SK', 'CA'])
    expect(within(panel).getByRole('button', { name: '黑桃K' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('已選 2／13 · 7 點')

    for (const button of within(within(panel).getByRole('group', { name: '紅心' })).getAllByRole('button'))
      await user.click(button)
    expect(cards).toHaveLength(13) // the last two hearts did not fit
    const extra = within(panel).getByRole('button', { name: '方塊A' })
    expect(extra).toHaveAttribute('aria-disabled', 'true')
    await user.click(extra)
    expect(cards).toHaveLength(13)

    await user.click(screen.getByRole('button', { name: '清除' }))
    expect(cards).toEqual([])
  })
})

function AuctionHarness({ onAuction }: { onAuction: (a: TableAuction) => void }) {
  const [auction, setAuction] = useState<TableAuction>({ dealer: 'N', calls: [] })
  return (
    <AuctionInput
      value={auction}
      onChange={(next) => {
        setAuction(next)
        onAuction(next)
      }}
    />
  )
}

describe('AuctionInput', () => {
  it('makes bids from a level and a strain and only allows legal calls', async () => {
    const user = userEvent.setup()
    let auction: TableAuction = { dealer: 'N', calls: [] }
    themed(<AuctionHarness onAuction={(a) => (auction = a)} />)
    const box = screen.getByRole('group', { name: '叫牌盒' })
    expect(within(box).getByRole('button', { name: '賭倍 X' })).toBeDisabled()
    expect(within(box).getByRole('button', { name: '黑桃' })).toBeDisabled()

    await user.click(within(box).getByRole('button', { name: '1 階' }))
    expect(within(box).getByRole('button', { name: '1 階' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(box).getByRole('button', { name: '1 紅心' }))
    expect(auction.calls).toEqual([{ seat: 'N', call: '1H' }])
    expect(screen.getByRole('status')).toHaveTextContent('輪到東家')

    // East may double; nobody may bid 1♦ any more
    expect(within(box).getByRole('button', { name: '賭倍 X' })).toBeEnabled()
    await user.click(within(box).getByRole('button', { name: '1 階' }))
    expect(within(box).getByRole('button', { name: '1 方塊' })).toBeDisabled()
    expect(within(box).getByRole('button', { name: '1 黑桃' })).toBeEnabled()
    await user.click(within(box).getByRole('button', { name: '賭倍 X' }))
    expect(within(box).getByRole('button', { name: '再賭倍 XX' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: '收回一口' }))
    expect(auction.calls).toHaveLength(1)
  })

  it('takes calls from the keyboard, with an alert, and ends after three passes', async () => {
    const user = userEvent.setup()
    let auction: TableAuction = { dealer: 'N', calls: [] }
    themed(<AuctionHarness onAuction={(a) => (auction = a)} />)
    const box = screen.getByRole('group', { name: '叫牌盒' })
    within(box).getByRole('button', { name: 'Pass' }).focus()
    await user.keyboard('1n')
    await user.click(within(box).getByRole('button', { name: '加註' }))
    await user.type(screen.getByRole('textbox', { name: '加註' }), '15–17')
    within(box).getByRole('button', { name: 'Pass' }).focus()
    await user.keyboard('x')
    await user.keyboard('ppp')
    expect(auction.calls.map((c) => c.call)).toEqual(['1N', 'X', 'P', 'P', 'P'])
    expect(auction.calls[1]).toEqual({ seat: 'E', call: 'X', alert: '15–17' })
    expect(screen.getByRole('status')).toHaveTextContent('叫牌結束')
    expect(within(box).getByRole('button', { name: 'Pass' })).toBeDisabled()

    // The diagram starts in West's column with an empty cell
    const table = screen.getByRole('table', { name: '叫牌過程' })
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['西', '北', '東', '南'])
    expect(within(table).getAllByRole('cell')[1]).toHaveTextContent('1NT')
  })

  it('re-seats the calls when the dealer changes', async () => {
    const user = userEvent.setup()
    let auction: TableAuction = { dealer: 'N', calls: [] }
    themed(<AuctionHarness onAuction={(a) => (auction = a)} />)
    await user.click(screen.getByRole('button', { name: 'Pass' }))
    await user.selectOptions(screen.getByRole('combobox', { name: '發牌' }), '西')
    expect(auction).toEqual({ dealer: 'W', calls: [{ seat: 'W', call: 'P' }] })
  })
})
