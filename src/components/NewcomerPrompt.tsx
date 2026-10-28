import { X } from 'lucide-react'
import { useId } from 'react'
import styled from 'styled-components'
import { pageStrings } from '../pageStrings.ts'
import { usePreferences, type ReadingMode } from '../state/PreferencesContext.tsx'
import { IconButton } from './CopyLinkButton.tsx'
import { Button } from './ui.tsx'

/**
 * 「你是新生嗎？」 (e4-t03, AC-4.2): asked once, on a signed-out reader's first visit, above the
 * page rather than over it. Yes picks 入門版, no keeps 完整版, × just closes it; whichever it is,
 * it is not asked again on this device. Loaded only while it is to be shown (HandbookShell).
 */
export function NewcomerPrompt() {
  const { update } = usePreferences()
  const titleId = useId()
  const s = pageStrings.newcomer
  const answer = (reading?: ReadingMode) =>
    update({ newcomerAsked: true, ...(reading && { reading }) })

  return (
    <Box role="region" aria-labelledby={titleId} data-print="hide">
      <Text>
        <strong id={titleId}>{s.title}</strong>
        <span>{s.body}</span>
      </Text>
      <Actions>
        <Button type="button" $variant="primary" $small onClick={() => answer('basic')}>
          {s.yes}
        </Button>
        <Button type="button" $small onClick={() => answer('full')}>
          {s.no}
        </Button>
        <IconButton type="button" onClick={() => answer()} aria-label={s.close} title={s.close}>
          <X size={18} aria-hidden />
        </IconButton>
      </Actions>
    </Box>
  )
}

const Box = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
  margin-bottom: ${({ theme }) => theme.space(5)};
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid ${({ theme }) => theme.colors.structure};
  border-radius: ${({ theme }) => theme.shape.note};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`

const Text = styled.p`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1)};
  margin: 0;
  flex: 1 1 18rem;

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.9375rem;
  }
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`
