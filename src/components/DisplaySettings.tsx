import { useId, useState, type FormEvent, type ReactNode } from 'react'
import styled from 'styled-components'
import { settingsStrings as text } from '../settingsStrings.ts'
import { defaultPrefs, layoutNames, themeChoices, type DisplayPrefs } from '../state/PreferencesContext.tsx'
import { useDisplayDraft } from '../state/useDisplayDraft.ts'
import { strings } from '../strings.ts'
import { densities, fontChoices, styleNames, suitColorChoices, textSizes, type TextSize } from '../styles/tokens.ts'
import { Button, Muted, Notice } from './ui.tsx'

type Labels<T extends string> = Record<T, string | readonly [string, string]>

const sizes = Object.keys(textSizes) as TextSize[]

/**
 * 個人設定's display choices (e9-t15, DESIGN-V2.md §10.5): one group of radio buttons per setting.
 * A choice shows at once as a preview; 儲存 keeps it, 取消變更 (or leaving) puts back what was
 * stored (2026-10-30). Used by the settings page and by 我的帳號 › 顯示.
 */
export function DisplaySettings() {
  const draft = useDisplayDraft()
  const prefs = draft.value
  const [notice, setNotice] = useState('')
  const set = (changes: Partial<DisplayPrefs>) => {
    setNotice('')
    draft.set(changes)
  }

  return (
    <Groups
      as="form"
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        draft.save()
        setNotice(strings.saved)
      }}
    >
      <Choices name="style" values={styleNames} labels={text.styles} value={prefs.style} onChange={(style) => set({ style })} />
      <Choices name="layout" values={layoutNames} labels={text.layouts} value={prefs.layout} onChange={(layout) => set({ layout })}>
        <Muted>{text.phoneNote}</Muted>
      </Choices>
      <Choices name="theme" values={themeChoices} labels={strings.reading.themes} value={prefs.theme} onChange={(theme) => set({ theme })} />
      <Choices name="font" values={fontChoices} labels={text.fonts} value={prefs.font} onChange={(font) => set({ font })} />
      <Choices name="textSize" values={sizes} labels={strings.textSizeNames} value={prefs.textSize} onChange={(textSize) => set({ textSize })} />
      <Choices name="suitColors" values={suitColorChoices} labels={text.suitColors} value={prefs.suitColors} onChange={(suitColors) => set({ suitColors })} />
      <Choices name="density" values={densities} labels={text.densities} value={prefs.density} onChange={(density) => set({ density })} />
      <SaveBar>
        <Button type="submit" $variant="primary" disabled={!draft.dirty}>
          {strings.save}
        </Button>
        <Button
          type="button"
          disabled={!draft.dirty}
          onClick={() => {
            draft.cancel()
            setNotice('')
          }}
        >
          {text.discard}
        </Button>
        <Button
          type="button"
          $variant="ghost"
          onClick={() => {
            const { newcomerAsked: _asked, analytics: _analytics, ...display } = defaultPrefs
            set(display)
            setNotice(text.resetPreview)
          }}
        >
          {text.reset}
        </Button>
        {draft.dirty ? (
          <Muted role="status">{notice || text.unsaved}</Muted>
        ) : (
          notice && <Notice role="status">{notice}</Notice>
        )}
      </SaveBar>
    </Groups>
  )
}

function Choices<T extends string>({
  name,
  values,
  labels,
  value,
  onChange,
  children,
}: {
  name: keyof typeof text.groups
  values: readonly T[]
  labels: Labels<T>
  value: T
  onChange: (value: T) => void
  children?: ReactNode
}) {
  const id = useId()
  const compact = values.every((v) => typeof labels[v] === 'string')
  return (
    <Group>
      <legend>{text.groups[name]}</legend>
      <Options $compact={compact}>
        {values.map((v) => {
          const label = labels[v]
          const [title, hint] = typeof label === 'string' ? [label, undefined] : label
          return (
            <Option key={v} $on={value === v}>
              <input type="radio" name={`${id}-${name}`} value={v} checked={value === v} onChange={() => onChange(v)} />
              <span>
                <strong>{title}</strong>
                {hint && <small>{hint}</small>}
              </span>
            </Option>
          )
        })}
      </Options>
      {children}
    </Group>
  )
}

const Groups = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(5)};
`

/** Stays in view at the bottom while the reader scrolls the choices */
const SaveBar = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(3)} 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};

  p {
    margin: 0;
  }
`

const Group = styled.fieldset`
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;

  legend {
    padding: 0;
    margin-bottom: ${({ theme }) => theme.space(2)};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-weight: ${({ theme }) => theme.headingWeight};
  }
`

const Options = styled.div<{ $compact: boolean }>`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${({ $compact }) => ($compact ? '6rem' : '13rem')}, 1fr));
  gap: ${({ theme }) => theme.space(2)};
  margin-bottom: ${({ theme }) => theme.space(1)};
`

const Option = styled.label<{ $on: boolean }>`
  display: flex;
  gap: ${({ theme }) => theme.space(2)};
  align-items: flex-start;
  min-height: 44px;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border: ${({ theme }) => theme.borders.control}
    ${({ theme, $on }) => ($on ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme, $on }) => ($on ? theme.colors.primarySoft : theme.colors.surface)};
  cursor: pointer;

  input {
    margin: 0.3rem 0 0;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
  span {
    display: grid;
  }
  strong {
    font-weight: 600;
  }
  small {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.8125rem;
    line-height: 1.5;
  }
  &:has(input:focus-visible) {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`
