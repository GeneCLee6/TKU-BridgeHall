import type { TextareaHTMLAttributes } from 'react'
import styled from 'styled-components'
import { strings } from '../../strings.ts'
import { TextArea } from '../ui.tsx'

/** A textarea that grows with its text (rows by line count; field-sizing where supported) */
export function AutoTextArea({ minRows = 2, value, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number; value: string }) {
  const rows = Math.min(16, Math.max(minRows, value.split('\n').length + Math.floor(value.length / 60)))
  return <Grow {...props} value={value} rows={rows} />
}

const Grow = styled(TextArea)`
  min-height: 0;
  field-sizing: content;
`

const SUITS = ['♠', '♥', '♦', '♣'] as const

/**
 * Buttons that type ♠ ♥ ♦ ♣ into the field that has focus, for phones and keyboards without an
 * easy way to type them. The buttons keep the focus in the field (mousedown is cancelled).
 */
export function SuitPalette() {
  const insert = (symbol: string) => {
    const el = document.activeElement
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return
    if (el instanceof HTMLInputElement && !['text', 'search', ''].includes(el.type)) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    // React tracks the value itself: set it through the native setter, then report the input
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')?.set
    setter?.call(el, el.value.slice(0, start) + symbol + el.value.slice(end))
    el.setSelectionRange(start + symbol.length, start + symbol.length)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  return (
    <Palette role="group" aria-label={strings.editor.suitInsert}>
      <span>{strings.editor.suitInsert}</span>
      {SUITS.map((s) => (
        <SuitKey
          key={s}
          type="button"
          $red={s === '♥' || s === '♦'}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insert(s)}
          aria-label={`${strings.editor.suitInsert} ${s}`}
        >
          {s}
        </SuitKey>
      ))}
    </Palette>
  )
}

const Palette = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const SuitKey = styled.button<{ $red: boolean }>`
  width: 32px;
  height: 32px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme, $red }) => ($red ? theme.suits.H : theme.suits.S)};
  font-size: 1.05rem;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

/** The small square buttons on blocks, rows and sections (move, delete…) */
export const MiniButton = styled.button`
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`
