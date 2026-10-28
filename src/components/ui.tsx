import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'
import styled, { css } from 'styled-components'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'

/**
 * Form controls and page frames for the account, admin, editor and import pages, drawn from the
 * style's tokens (DESIGN-V2.md §5.9, e9-t11): fields on the panel's surface with the structure
 * colour on focus, panels with the style's frame, corners and shadow. Controls are
 * sized in rem so they follow the 字級; on phones they stay at least 40px tall with 16px text
 * (smaller text makes iOS zoom into the field).
 */

export const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'ghost'; $small?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space(2)};
  min-height: ${({ $small }) => ($small ? '2rem' : '2.25rem')};
  padding: 0 ${({ theme, $small }) => theme.space($small ? 3 : 4)};
  border: ${({ theme }) => theme.borders.control} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ $small }) => ($small ? '0.875rem' : '0.9375rem')};
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  ${mobile} {
    min-height: ${({ $small }) => ($small ? '32px' : '40px')};
  }

  ${({ $variant, theme }) =>
    $variant === 'primary' &&
    css`
      border-color: ${theme.colors.primary};
      background: ${theme.colors.primary};
      color: ${theme.colors.onPrimary};
      &:hover:not(:disabled) {
        background: ${theme.colors.primaryStrong};
        border-color: ${theme.colors.primaryStrong};
        color: ${theme.colors.onPrimary};
      }
    `}
  ${({ $variant, theme }) =>
    $variant === 'danger' &&
    css`
      border-color: ${theme.colors.seal};
      color: ${theme.colors.seal};
      &:hover:not(:disabled) {
        background: ${theme.colors.warningBg};
        border-color: ${theme.colors.seal};
        color: ${theme.colors.seal};
      }
    `}
  ${({ $variant, theme }) =>
    $variant === 'ghost' &&
    css`
      border-color: transparent;
      background: transparent;
      color: ${theme.colors.primary};
      &:hover:not(:disabled) {
        border-color: transparent;
        background: ${theme.colors.primarySoft};
      }
    `}
`

const control = css`
  width: 100%;
  min-height: 2.25rem;
  padding: 0.3125rem 0.625rem;
  border: ${({ theme }) => theme.borders.control} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 400;
  line-height: 1.5;

  &:focus {
    border-color: ${({ theme }) => theme.colors.structure};
  }

  ${mobile} {
    min-height: 40px;
    font-size: max(1rem, 16px);
  }
`

export const Input = styled.input`
  ${control}
`

export const TextArea = styled.textarea`
  ${control}
  min-height: 4.5rem;
  line-height: 1.6;
  resize: vertical;
`

export const Select = styled.select`
  ${control}
  padding-top: 0;
  padding-bottom: 0;
`

/**
 * A label around a control, with an optional <small> hint under it. Rows start at the top, so a
 * field beside one with a hint keeps its control level with the other's instead of stretching.
 */
export const Field = styled.label`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.space(1)};
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.5;

  & > small {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.75rem;
    font-weight: 400;
  }
`

export const Panel = styled.section`
  padding: ${({ theme }) => theme.space(5)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.panel};

  ${mobile} {
    padding: ${({ theme }) => theme.space(4)};
  }
`

export const PanelTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space(3)};
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.primaryStrong};
`

/** The frame of a page other than the handbook itself */
export const PageMain = styled.main`
  width: min(100%, 1040px);
  margin: 0 auto;
  padding: ${({ theme }) => theme.space(6)} ${({ theme }) => theme.space(6)} ${({ theme }) => theme.space(16)};
  display: grid;
  /* minmax(0, …) so a wide table scrolls inside its panel instead of widening the page */
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space(5)};
  align-content: start;

  ${mobile} {
    padding: ${({ theme }) => theme.space(4)} ${({ theme }) => theme.space(4)} ${({ theme }) => theme.space(12)};
  }
`

export const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.primaryStrong};
`

export const Muted = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.6;
`

export const ErrorText = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-left: 4px solid ${({ theme }) => theme.colors.warningBorder};
  border-radius: ${({ theme }) => theme.shape.note};
  background: ${({ theme }) => theme.colors.warningBg};
  line-height: 1.6;
  white-space: pre-line;
`

export const Notice = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.shape.note};
  background: ${({ theme }) => theme.colors.primarySoft};
  line-height: 1.6;
`

export const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`

/** A password field with a button that shows or hides what was typed */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [shown, setShown] = useState(false)
  const label = shown ? strings.auth.hidePassword : strings.auth.showPassword
  return (
    <PasswordWrap>
      <Input {...props} type={shown ? 'text' : 'password'} />
      <EyeButton type="button" onClick={() => setShown((s) => !s)} aria-label={label} aria-pressed={shown} title={label}>
        {shown ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </EyeButton>
    </PasswordWrap>
  )
}

const PasswordWrap = styled.span`
  position: relative;
  display: grid;

  & > input {
    padding-right: 44px;
  }
`

const EyeButton = styled.button`
  position: absolute;
  top: 50%;
  right: 4px;
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  transform: translateY(-50%);
  border: 0;
  border-radius: ${({ theme }) => theme.shape.control};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.primary};
  }
`
