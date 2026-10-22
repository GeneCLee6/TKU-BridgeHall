import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { isAppleMobile } from '../lib/pwa.ts'
import { strings } from '../strings.ts'
import { IconButton } from './CopyLinkButton.tsx'

/**
 * How to put the handbook on the home screen, for browsers that make no install offer of their
 * own (Safari on iPhone and iPad, Firefox). The phone's own steps come first.
 */
export function InstallHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal?.()
    if (!open && dialog.open) dialog.close?.()
  }, [open])

  const steps = isAppleMobile()
    ? [strings.installIos, strings.installAndroid]
    : [strings.installAndroid, strings.installIos]

  return (
    <Dialog ref={ref} onClose={onClose} aria-labelledby="install-title" data-print="hide">
      <Head>
        <h2 id="install-title">{strings.installTitle}</h2>
        <IconButton type="button" onClick={onClose} aria-label={strings.installClose}>
          <X size={18} aria-hidden />
        </IconButton>
      </Head>
      <p>{strings.installIntro}</p>
      <ul>
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </Dialog>
  )
}

const Dialog = styled.dialog`
  width: min(420px, calc(100vw - 32px));
  padding: ${({ theme }) => theme.space(5)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.shadow};
  line-height: 1.6;

  &::backdrop {
    background: ${({ theme }) => theme.colors.overlay};
  }
  p {
    margin: 0 0 ${({ theme }) => theme.space(3)};
  }
  ul {
    margin: 0;
    padding-left: ${({ theme }) => theme.space(5)};
  }
  li + li {
    margin-top: ${({ theme }) => theme.space(2)};
  }
`

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space(2)};

  h2 {
    margin: 0;
    font-size: 1.125rem;
  }
`
