import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import { AuctionTable } from '../../src/components/AuctionTable.tsx'
import { strings } from '../../src/strings.ts'
import { createTheme } from '../../src/styles/tokens.ts'

describe('AuctionTable', () => {
  it('draws the handouts’ --- and -- as a line read as pass', () => {
    render(
      <ThemeProvider theme={createTheme('light')}>
        <AuctionTable auction={{ seats: ['開叫者', '敵方', '答叫者', '敵方'], calls: ['1NT', '---', '2D', '--', '?'] }} />
      </ThemeProvider>,
    )
    expect(screen.getAllByRole('img', { name: strings.auctionDash })).toHaveLength(2)
    expect(screen.queryByText('—')).toBeNull()
    expect(screen.getByText('?')).toBeInTheDocument()
  })
})
