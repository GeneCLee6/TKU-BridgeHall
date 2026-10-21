import styled from 'styled-components'
import { strings } from '../strings.ts'

/** A visible 「待確認」 note: the source text is ambiguous and an officer should confirm it */
export function PendingNote({ text }: { text: string }) {
  return (
    <Note role="note" data-print="keep">
      <Badge>{strings.pending}</Badge>
      <span>{text}</span>
    </Note>
  )
}

export const Badge = styled.span`
  flex: none;
  display: inline-block;
  padding: 0 ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.pendingBorder};
  color: ${({ theme }) => (theme.mode === 'light' ? '#ffffff' : '#1a1200')};
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.6rem;
  white-space: nowrap;
`

const Note = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(2)};
  align-items: flex-start;
  margin: ${({ theme }) => theme.space(2)} 0;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-left: 4px solid ${({ theme }) => theme.colors.pendingBorder};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.pendingBg};
  color: ${({ theme }) => theme.colors.pendingText};
  font-size: 0.875rem;
  line-height: 1.6;
`
