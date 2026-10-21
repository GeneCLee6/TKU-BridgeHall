import styled from 'styled-components'
import type { ResponseRow } from '../types/convention.ts'
import { strings } from '../strings.ts'
import { PendingNote } from './PendingNote.tsx'
import { CallLabel, RichText } from './Suit.tsx'

/** The call → meaning table under an auction diagram */
export function ResponseTable({ rows }: { rows: ResponseRow[] }) {
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
            <td>
              <RichText text={row.meaning} />
              {row.note && (
                <Note>
                  <RichText text={row.note} />
                </Note>
              )}
              {row.pending && <PendingNote text={row.pending} />}
            </td>
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
