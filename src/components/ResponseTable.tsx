import styled from 'styled-components'
import type { Origin, ResolvedRow } from '../lib/profiles.ts'
import { strings } from '../strings.ts'
import { originColor, OriginMark } from './ProfileMarks.tsx'
import { PendingNote } from './PendingNote.tsx'
import { CallLabel, RichText } from './Suit.tsx'

/**
 * The call → meaning table under an auction diagram. A row the reader's profile overrode
 * (`origin`, e1-t13) has a line down its meaning and says whose it is.
 */
export function ResponseTable({ rows }: { rows: ResolvedRow[] }) {
  return (
    <Table>
      <thead>
        <tr>
          <th scope="col">{strings.call}</th>
          <th scope="col">{strings.meaning}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={`${row.call}-${i}`}>
            <th scope="row">
              <CallLabel call={row.call} />
            </th>
            <Meaning $origin={row.origin}>
              <RichText text={row.meaning} />
              <OriginMark origin={row.origin} />
              {row.note && (
                <Note>
                  <RichText text={row.note} />
                </Note>
              )}
              {row.pending && <PendingNote text={row.pending} />}
            </Meaning>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;

  th,
  td {
    padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    text-align: left;
    vertical-align: top;
  }
  thead th {
    font-size: 0.8125rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  tbody th {
    width: 5.5rem;
    white-space: nowrap;
  }
  tbody tr:last-child > * {
    border-bottom: none;
  }
  tr {
    break-inside: avoid;
  }
`

const Note = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Meaning = styled.td<{ $origin?: Origin }>`
  ${({ theme, $origin }) => $origin && `box-shadow: inset 3px 0 0 ${originColor(theme, $origin)};`}
`
