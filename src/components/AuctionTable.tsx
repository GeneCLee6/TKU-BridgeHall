import styled from 'styled-components'
import type { Auction, AuctionCall } from '../types/convention.ts'
import { strings } from '../strings.ts'
import { CallLabel } from './Suit.tsx'

/** The handouts write a pass as --- (or --); drawn as a line, the content keeps the text */
const isDash = (call: string) => /^-{2,}$/.test(call.trim())

/** A four-column bidding diagram, filled row by row in the source document's seat order */
export function AuctionTable({ auction }: { auction: Auction }) {
  const rows: AuctionCall[][] = []
  for (let i = 0; i < auction.calls.length; i += 4) rows.push(auction.calls.slice(i, i + 4))

  return (
    <Table data-print="keep">
      <caption className="visually-hidden">{strings.auction}</caption>
      <thead>
        <tr>
          {auction.seats.map((seat, i) => (
            <th key={i} scope="col">
              {seat}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {[0, 1, 2, 3].map((c) => {
              const entry = row[c]
              const call = typeof entry === 'string' ? entry : entry?.call
              const note = typeof entry === 'object' ? entry.note : undefined
              return (
                <Cell key={c} $decide={call === '?'}>
                  {call && isDash(call) ? (
                    <PassLine role="img" aria-label={strings.auctionDash} title={strings.auctionDash} />
                  ) : call ? (
                    <CallLabel call={call} />
                  ) : null}
                  {note && <CallNote>（{note}）</CallNote>}
                </Cell>
              )
            })}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

const Table = styled.table`
  border-collapse: collapse;
  margin: ${({ theme }) => theme.space(2)} 0 ${({ theme }) => theme.space(3)};
  min-width: min(100%, 360px);
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ theme }) => theme.radius.sm};
  overflow: hidden;
  font-size: 0.9375rem;

  th,
  td {
    padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(3)};
    text-align: center;
    width: 25%;
  }
  th {
    font-size: 0.8125rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textMuted};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`

const PassLine = styled.span`
  display: inline-block;
  width: 1.5em;
  vertical-align: middle;
  border-top: 2px solid currentColor;
`

const CallNote = styled.span`
  display: block;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Cell = styled.td<{ $decide: boolean }>`
  color: ${({ theme, $decide }) => ($decide ? theme.colors.primary : 'inherit')};
`
