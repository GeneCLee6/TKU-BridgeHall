import styled from 'styled-components'
import type { Origin, ResolvedRow } from '../lib/profiles.ts'
import { strings } from '../strings.ts'
import { originColor, OriginMark } from './ProfileMarks.tsx'
import { PendingNote } from './PendingNote.tsx'
import { CallLabel, RichText } from './Suit.tsx'

/**
 * The call → meaning table under an auction diagram. A row the reader's profile overrode
 * (`origin`, e1-t13) has a 2px line down its meaning and says whose it is.
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
              <RichText text={row.meaning} glossary />
              <OriginMark origin={row.origin} />
              {row.note && (
                <Note>
                  <RichText text={row.note} glossary />
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

/**
 * v2 (e9-t06, DESIGN-V2.md §5.5): a ruled table, no stripes and no corners; lines above and below,
 * fainter lines between rows; the call column fixed and right-aligned.
 */
const Table = styled.table`
  width: 100%;
  margin: ${({ theme }) => theme.space(2)} 0 ${({ theme }) => theme.space(3)};
  border-collapse: collapse;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.9375rem;
  line-height: 1.6;

  th,
  td {
    padding: ${({ theme }) => theme.space(1.5)} ${({ theme }) => theme.space(3)};
    border-bottom: 1px solid
      color-mix(in srgb, ${({ theme }) => theme.colors.border} 50%, transparent);
    text-align: left;
    vertical-align: top;
  }
  thead th {
    border-bottom-color: ${({ theme }) => theme.colors.border};
    font-size: 0.8125rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  thead th:first-child,
  tbody th {
    width: 5.5rem;
    text-align: right;
  }
  tbody th {
    white-space: nowrap;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  tbody tr:last-child > * {
    border-bottom: none;
  }
  tr {
    break-inside: avoid;
  }
`

const Note = styled.div`
  margin-top: ${({ theme }) => theme.space(0.5)};
  padding-left: ${({ theme }) => theme.space(3)};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Meaning = styled.td<{ $origin?: Origin }>`
  ${({ theme, $origin }) => $origin && `box-shadow: inset 2px 0 0 ${originColor(theme, $origin)};`}
`
