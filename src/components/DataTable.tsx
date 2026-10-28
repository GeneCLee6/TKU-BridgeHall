import styled from 'styled-components'

/**
 * The lists of members, invitations and table reports (e9-t11), drawn like the book's tables
 * (DESIGN-V2.md §5.5): a rule above and below, the head ruled off, faint rules between rows, no
 * stripes. Only the admin and table-report pages use it, so it stays out of the home page's
 * download (components/ui.tsx is in it).
 */
export const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.9375rem;
  font-variant-numeric: tabular-nums;

  th,
  td {
    padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
    text-align: left;
    vertical-align: middle;
  }
  thead th {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.8125rem;
    font-weight: 600;
    white-space: nowrap;
  }
  tbody tr + tr > * {
    border-top: 1px solid color-mix(in srgb, ${({ theme }) => theme.colors.border} 50%, transparent);
  }
`

/** A wide table scrolls inside its panel; positioned, so `.visually-hidden` stays inside it */
export const TableScroll = styled.div`
  position: relative;
  overflow-x: auto;
`
