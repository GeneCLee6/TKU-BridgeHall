import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'
import styled, { css } from 'styled-components'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'

/** Form controls and page frames for the account, admin, editor and import pages */

export const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'ghost'; $small?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space(2)};
  min-height: ${({ $small }) => ($small ? '32px' : '40px')};
  padding: 0 ${({ theme, $small }) => theme.space($small ? 3 : 4)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
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
      border-color: ${theme.colors.warningBorder};
      color: ${theme.colors.vermilion};
      &:hover:not(:disabled) {
        background: ${theme.colors.warningBg};
        border-color: ${theme.colors.warningBorder};
        color: ${theme.colors.vermilion};
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
  min-height: 40px;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 1rem;
  font-weight: 400;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

export const Input = styled.input`
  ${control}
`

export const TextArea = styled.textarea`
  ${control}
  min-height: 72px;
  line-height: 1.6;
  resize: vertical;
`

export const Select = styled.select`
  ${control}
`

/** A label around a control, with an optional <small> hint under it */
export const Field = styled.label`
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
  font-size: 0.875rem;
  font-weight: 600;

  & > small {
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 400;
    line-height: 1.5;
  }
`

export const Panel = styled.section`
  padding: ${({ theme }) => theme.space(5)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow};

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
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.warningBg};
  line-height: 1.6;
  white-space: pre-line;
`

export const Notice = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.sm};
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
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.primary};
  }
`
