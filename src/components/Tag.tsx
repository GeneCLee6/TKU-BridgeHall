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
  border: 1px solid ${({ theme }) => theme.colors.tagBorder};
  border-radius: ${({ theme }) => theme.shape.tag};
  background: ${({ theme }) => theme.colors.tagBg};
  color: ${({ theme }) => theme.colors.tagText};
  font-size: 0.8125rem;
  line-height: 1.75rem;
`
