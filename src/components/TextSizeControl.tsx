import styled from 'styled-components'
import { usePreferences } from '../state/PreferencesContext.tsx'
import { strings } from '../strings.ts'
import type { TextSize } from '../styles/tokens.ts'

const SIZES: TextSize[] = ['small', 'medium', 'large', 'xlarge']

/** 字級 小／中／大／特大: four buttons that resize all text, remembered on this device */
export function TextSizeControl() {
  const { textSize, setTextSize } = usePreferences()
  return (
    <Group role="group" aria-label={strings.textSize} title={strings.textSize}>
      {SIZES.map((size) => (
        <Option
          key={size}
          type="button"
          $size={size}
          aria-pressed={textSize === size}
          aria-label={`${strings.textSize}：${strings.textSizeNames[size]}`}
          onClick={() => setTextSize(size)}
        >
          {strings.textSizeNames[size]}
        </Option>
      ))}
    </Group>
  )
}

const Group = styled.div`
  flex: none;
  display: inline-flex;
  padding: 2px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.surface};
`

/** Sized in px, not rem, so the switch itself stays put while the text around it changes */
const Option = styled.button<{ $size: TextSize }>`
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 28px;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ $size }) => ({ small: '12px', medium: '14px', large: '16px', xlarge: '18px' })[$size]};
  font-weight: 600;
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
  &[aria-pressed='true'] {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
  }
`
