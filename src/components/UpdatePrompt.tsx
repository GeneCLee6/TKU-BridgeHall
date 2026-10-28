import { useState } from 'react'
import styled from 'styled-components'
import { useUpdate } from '../lib/pwa.ts'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'
import { Button } from './ui.tsx'

/** Offers the new version of the site once it has downloaded in the background (lib/pwa.ts) */
export function UpdatePrompt() {
  const { available, reload } = useUpdate()
  const [later, setLater] = useState(false)
  if (!available || later) return null
  return (
    <Toast role="status" data-print="hide">
      <span>{strings.updateAvailable}</span>
      <Button type="button" $variant="primary" $small onClick={reload}>
        {strings.updateReload}
      </Button>
      <Button type="button" $variant="ghost" $small onClick={() => setLater(true)}>
        {strings.updateLater}
      </Button>
    </Toast>
  )
}

const Toast = styled.div`
  position: fixed;
  z-index: 70;
  right: ${({ theme }) => theme.space(4)};
  bottom: ${({ theme }) => theme.space(4)};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.popover};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.shadows.panel};

  span {
    margin-right: ${({ theme }) => theme.space(1)};
  }

  ${mobile} {
    left: ${({ theme }) => theme.space(4)};
  }
`
