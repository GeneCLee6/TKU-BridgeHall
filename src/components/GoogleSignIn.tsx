import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { ApiError, errorText, request, send, type Me } from '../lib/api.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { Button, ErrorText, Field, Input, Muted } from './ui.tsx'
import { googleStrings as t } from './googleStrings.ts'

/**
 * 用 Google 登入 (TKU-BridgeTable e1-t31; ARCHITECTURE.md §4.2). The flow runs on the table's
 * Worker through this site's `/api/*` (Vercel passes it on), so the cookies stay on this domain:
 * the page asks for Google's address with its own origin (the Worker accepts only this site's
 * and the table's), Google sends the browser back to `/api/auth/google/callback` here, and the
 * Worker answers with a redirect to `next`, or to `/login?google=code` (兩步驟登入: Google never
 * replaces the code) or `/login?google=error&code=…`. Only accounts already bound to Google on
 * 淡江牌桌 sign in; applying with Google is on 淡江牌桌 only.
 */

/** The button, with what went wrong on the way back from Google; nothing when the club has no Google sign-in */
export function GoogleButton({ next }: { next: string }) {
  const [params, setParams] = useSearchParams()
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(() =>
    params.get('google') === 'error' ? (t.errors[params.get('code') ?? ''] ?? t.error) : '',
  )

  useEffect(() => {
    let live = true
    request<{ enabled: boolean }>('/api/auth/google')
      .then((status) => live && setEnabled(status.enabled))
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [])

  // The error is shown once; the address bar keeps only ?next=
  useEffect(() => {
    if (params.get('google') !== 'error') return
    const kept = new URLSearchParams(params)
    kept.delete('google')
    kept.delete('code')
    setParams(kept, { replace: true })
  }, [params, setParams])

  const start = async () => {
    setError('')
    setBusy(true)
    try {
      const { url } = await send<{ url: string }>('POST', '/api/auth/google/start', { origin: window.location.origin, returnTo: next })
      window.location.assign(url)
    } catch (e) {
      setError(errorText(e))
      setBusy(false)
    }
  }

  if (!enabled && !error) return null
  return (
    <>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {enabled && (
        <>
          <Or>{t.or}</Or>
          <Button type="button" disabled={busy} onClick={() => void start()}>
            {t.signIn}
          </Button>
        </>
      )}
    </>
  )
}

/** The code step after Google, for an account with 兩步驟登入 */
export function GoogleCodeStep({ onCancel }: { onCancel: () => void }) {
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
      const { returnTo } = await send<{ user: Me; returnTo: string }>('POST', '/api/auth/google/code', { code })
      await refresh()
      navigate(returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/', { replace: true })
    } catch (e) {
      // The step ran out (5 minutes) or was used: back to the sign-in form
      if (e instanceof ApiError && e.code === 'googleFailed') return onCancel()
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Form onSubmit={submit} aria-label={t.codeTitle}>
      <Muted>{t.codeIntro}</Muted>
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

const Form = styled.form`
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
