import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { ApiError, errorText, request, send, type Me } from '../lib/api.ts'
import { PROVIDERS, providerBack, type Provider } from '../lib/oauth.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { Button, ErrorText, Field, Input, Muted } from './ui.tsx'
import { oauthStrings as t } from './oauthStrings.ts'

/**
 * 用 Google 登入 and 用 LINE 登入 (TKU-BridgeTable e1-t31, e1-t32; ARCHITECTURE.md §4.2). The flow
 * runs on the table's Worker through this site's `/api/*` (Vercel passes it on), so the cookies
 * stay on this domain: the page asks for the provider's address with its own origin (the Worker
 * accepts only this site's and the table's), the provider sends the browser back to
 * `/api/auth/<google|line>/callback` here, and the Worker answers with a redirect to `next`, or to
 * `/login?<provider>=code` (兩步驟登入: the provider never replaces the code) or
 * `/login?<provider>=error&code=…`. Only accounts already bound on 淡江牌桌 sign in; binding and
 * applying are on 淡江牌桌 only. The buttons follow Google's and LINE's brand guidelines, as on 淡江牌桌.
 */

/** The buttons, with what went wrong on the way back; nothing when the club has neither */
export function OAuthButtons({ next }: { next: string }) {
  const [params, setParams] = useSearchParams()
  const [enabled, setEnabled] = useState<Record<Provider, boolean>>({ google: false, line: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(() => {
    const back = providerBack(params)
    return back && params.get(back) === 'error' ? (t.errors[params.get('code') ?? ''] ?? t[back].error) : ''
  })

  useEffect(() => {
    let live = true
    for (const provider of PROVIDERS)
      request<{ enabled: boolean }>(`/api/auth/${provider}`)
        .then((status) => live && setEnabled((on) => ({ ...on, [provider]: status.enabled === true })))
        .catch(() => undefined)
    return () => {
      live = false
    }
  }, [])

  // The error is shown once; the address bar keeps only ?next=
  useEffect(() => {
    const back = providerBack(params)
    if (!back || params.get(back) !== 'error') return
    const kept = new URLSearchParams(params)
    kept.delete(back)
    kept.delete('code')
    setParams(kept, { replace: true })
  }, [params, setParams])

  const start = async (provider: Provider) => {
    setError('')
    setBusy(true)
    try {
      const { url } = await send<{ url: string }>('POST', `/api/auth/${provider}/start`, { origin: window.location.origin, returnTo: next })
      window.location.assign(url)
    } catch (e) {
      setError(errorText(e))
      setBusy(false)
    }
  }

  const shown = PROVIDERS.filter((p) => enabled[p])
  if (!shown.length && !error) return null
  return (
    <>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {shown.length > 0 && (
        <>
          <Or>{t.or}</Or>
          <Stack>
            {shown.map((provider) => (
              <SignInButton key={provider} provider={provider} disabled={busy} onClick={() => void start(provider)}>
                {t[provider].signIn}
              </SignInButton>
            ))}
          </Stack>
        </>
      )}
    </>
  )
}

/** The code step after Google or LINE, for an account with 兩步驟登入 */
export function OAuthCodeStep({ provider, onCancel }: { provider: Provider; onCancel: () => void }) {
  const { refresh } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { returnTo } = await send<{ user: Me; returnTo: string }>('POST', `/api/auth/${provider}/code`, { code })
      await refresh()
      navigate(returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/', { replace: true })
    } catch (e) {
      // The step ran out (5 minutes) or was used: back to the sign-in form
      if (e instanceof ApiError && e.code === `${provider}Failed`) return onCancel()
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Form onSubmit={submit} aria-label={t.codeTitle}>
      <Muted>{t[provider].codeIntro}</Muted>
      <Field>
        {t.code}
        <Input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" autoFocus maxLength={20} required />
      </Field>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      <Button type="submit" $variant="primary" disabled={busy}>
        {t.submit}
      </Button>
      <Button type="button" $variant="ghost" $small onClick={onCancel}>
        {t.usePassword}
      </Button>
    </Form>
  )
}

/**
 * A provider's own button, as its brand guidelines ask: Google's white (dark in dark mode) with a
 * gray edge and the four-colour "G"; LINE's green with the white LINE logo behind a thin line. The
 * logos are inline SVG (no images from other sites); the colours are `theme.brands`
 */
function SignInButton({ provider, children, ...rest }: { provider: Provider; children: ReactNode; disabled?: boolean; onClick: () => void }) {
  const Shell = provider === 'google' ? GoogleShell : LineShell
  return (
    <Shell type="button" {...rest}>
      {provider === 'google' ? (
        <Logo viewBox="0 0 48 48" aria-hidden="true" focusable="false" $google>
          <path className="r" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path className="b" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path className="y" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path className="g" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </Logo>
      ) : (
        <Logo viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"
          />
        </Logo>
      )}
      <Label>{children}</Label>
    </Shell>
  )
}

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`

const Stack = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`

const Or = styled.p`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`

const Logo = styled.svg<{ $google?: boolean }>`
  flex: none;
  width: 20px;
  height: 20px;
  ${({ $google, theme }) =>
    $google &&
    css`
      .r {
        fill: ${theme.brands.googleLogo.red};
      }
      .b {
        fill: ${theme.brands.googleLogo.blue};
      }
      .y {
        fill: ${theme.brands.googleLogo.yellow};
      }
      .g {
        fill: ${theme.brands.googleLogo.green};
      }
    `}
`

const Label = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

/** What both share: 40 high and the form's full width, the site's focus ring, dimmed when off */
const shell = css`
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 40px;
  font-family: Roboto, ${({ theme }) => theme.fonts.body};
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
`

/** Google: white (dark in dark mode), gray edge, radius 4, padding 12, 10 between the "G" and the words */
const GoogleShell = styled.button`
  ${shell}
  justify-content: center;
  gap: 10px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.brands.google.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.brands.google.bg};
  color: ${({ theme }) => theme.brands.google.text};
  font-weight: 500;

  &:hover:not(:disabled) {
    background-image: linear-gradient(${({ theme }) => theme.brands.google.hover}, ${({ theme }) => theme.brands.google.hover});
  }

  &:active:not(:disabled) {
    background-image: linear-gradient(${({ theme }) => theme.brands.google.pressed}, ${({ theme }) => theme.brands.google.pressed});
  }
`

/** LINE: LINE green, the logo at the left behind a thin line, the words centred in the rest */
const LineShell = styled.button`
  ${shell}
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: ${({ theme }) => theme.brands.line.bg};
  color: ${({ theme }) => theme.brands.line.text};
  font-weight: 700;

  ${Logo} {
    box-sizing: content-box;
    align-self: stretch;
    width: 22px;
    height: auto;
    padding: 0 10px;
    border-right: 1px solid ${({ theme }) => theme.brands.line.separator};
  }

  ${Label} {
    flex: 1;
    padding: 0 12px;
    text-align: center;
  }

  &:hover:not(:disabled) {
    background-image: linear-gradient(${({ theme }) => theme.brands.line.hover}, ${({ theme }) => theme.brands.line.hover});
  }

  &:active:not(:disabled) {
    background-image: linear-gradient(${({ theme }) => theme.brands.line.pressed}, ${({ theme }) => theme.brands.line.pressed});
  }
`
