import { Check, Link2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { strings } from '../strings.ts'

/** Copies the absolute deep link for a convention or section */
export function CopyLinkButton({ path, label }: { path: string; label: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (status === 'idle') return
    const t = window.setTimeout(() => setStatus('idle'), 2000)
    return () => window.clearTimeout(t)
  }, [status])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).toString())
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <>
      <IconButton
        type="button"
        onClick={copy}
        aria-label={`${strings.copyLink}：${label}`}
        title={strings.copyLink}
        data-print="hide"
      >
        {status === 'copied' ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}
      </IconButton>
      <span className="visually-hidden" role="status">
        {status === 'copied' ? strings.copied : status === 'failed' ? strings.copyFailed : ''}
      </span>
    </>
  )
}

export const IconButton = styled.button`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.shape.control};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.primary};
  }
`
