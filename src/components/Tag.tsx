import styled from 'styled-components'
import { RichText } from './Suit.tsx'

export function Tag({ label }: { label: string }) {
  return (
    <Pill>
      <RichText text={label} />
    </Pill>
  )
}

export const TagList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1.5)};
  margin: 0;
  padding: 0;
  list-style: none;
`

const Pill = styled.li`
  padding: 0 ${({ theme }) => theme.space(2.5)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
  line-height: 1.75rem;
`
