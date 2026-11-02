import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { GoogleButton, GoogleCodeStep } from '../components/GoogleSignIn.tsx'
import { LogoMark } from '../components/Logo.tsx'
import { Button, ErrorText, Field, Input, Muted, Notice, Panel, PasswordInput } from '../components/ui.tsx'
import { api, ApiError, errorText, LIMITS } from '../lib/api.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { strings } from '../strings.ts'
import { Frame } from './Frame.tsx'

type Mode = 'login' | 'register' | 'reset'

/** Only paths on this site, so ?next= cannot send anyone elsewhere */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/')

/**
 * 登入、註冊、忘記密碼, with TKU BridgeTable's accounts. A registration waits for an admin to
 * approve it (only the club's first account signs in at once). An account with 兩步驟登入
 * (TKU-BridgeTable e11-t31) gets 401 `twoFactorNeeded` after the right password: the form then
 * shows a 驗證碼 field and sends the same name and password again with the code.
 */
export function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  /** Back from Google for an account with 兩步驟登入 (TKU-BridgeTable e1-t31): only the code is asked */
  const googleCode = params.get('google') === 'code'
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [note, setNote] = useState('')
  /** 兩步驟登入: the Worker asked for a code after the right password */
  const [needCode, setNeedCode] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [busy, setBusy] = useState(false)
  const t = strings.auth
  const title = mode === 'register' ? t.register : mode === 'reset' ? t.reset : t.login

  const switchTo = (next: Mode) => {
    setMode(next)
    setError('')
    setDone('')
    setPassword('')
    setRepeat('')
    setNeedCode(false)
    setCode('')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (mode === 'reset' && password !== repeat) return setError(t.passwordMismatch)
    setBusy(true)
    try {
      if (mode === 'register') {
        const result = await register(username, password, inviteCode, note)
        if ('pending' in result) setDone(t.applicationSent(result.username))
        else navigate(safeNext(params.get('next')), { replace: true })
      } else if (mode === 'reset') {
        await api.resetPassword(username, inviteCode, password)
        switchTo('login')
        setDone(t.resetDone)
      } else {
        await login(username, password, needCode ? code : undefined)
        navigate(safeNext(params.get('next')), { replace: true })
      }
    } catch (e) {
      // The password was right and the account has 兩步驟登入: ask for the code, no error yet
      if (mode === 'login' && e instanceof ApiError && e.code === 'twoFactorNeeded') {
        setNeedCode(true)
        return
      }
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Frame title={title}>
      <Box>
        <Brand>
          <LogoMark size={56} />
          <h1>{title}</h1>
          <Muted>{mode === 'reset' ? t.resetIntro : t.intro}</Muted>
        </Brand>
        {googleCode ? (
          <GoogleCodeStep onCancel={() => setParams(params.get('next') ? { next: params.get('next')! } : {}, { replace: true })} />
        ) : done && mode === 'register' ? (
          <>
            <Notice role="status">{done}</Notice>
            <Button type="button" $variant="primary" onClick={() => switchTo('login')}>
              {t.backToLogin}
            </Button>
          </>
        ) : (
          <Form onSubmit={submit} aria-label={title}>
            {done && <Notice role="status">{done}</Notice>}
            <Field>
              {t.username}
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                minLength={LIMITS.usernameMin}
                maxLength={LIMITS.usernameMax}
              />
              {mode === 'register' && <small>{t.usernameHint(LIMITS.usernameMin, LIMITS.usernameMax)}</small>}
            </Field>
            <Field>
              {mode === 'reset' ? t.newPassword : t.password}
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'login' ? undefined : LIMITS.passwordMin}
              />
              {mode !== 'login' && <small>{t.passwordHint(LIMITS.passwordMin)}</small>}
            </Field>
            {mode === 'login' && needCode && (
              <Field>
                {t.code}
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={20}
                  required
                />
                <small>{t.codeHint}</small>
              </Field>
            )}
            {mode === 'reset' && (
              <Field>
                {t.confirmPassword}
                <PasswordInput value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" required />
              </Field>
            )}
            {mode !== 'login' && (
              <Field>
                {t.inviteCode}
                <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} autoComplete="off" />
                <small>{t.inviteHint}</small>
              </Field>
            )}
            {mode === 'register' && (
              <Field>
                {t.note}
                <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={LIMITS.noteMax} autoComplete="off" />
                <small>{t.noteHint}</small>
              </Field>
            )}
            {error && <ErrorText role="alert">{error}</ErrorText>}
            <Button type="submit" $variant="primary" disabled={busy}>
              {title}
            </Button>
            {mode === 'login' && (
              <Button type="button" $variant="ghost" $small onClick={() => switchTo('reset')}>
                {t.forgot}
              </Button>
            )}
          </Form>
        )}
        {mode === 'login' && !googleCode && <GoogleButton next={safeNext(params.get('next'))} />}
        <Switch>
          {mode === 'reset' ? (
            <Button type="button" $variant="ghost" $small onClick={() => switchTo('login')}>
              {t.backToLogin}
            </Button>
          ) : (
            <>
              {mode === 'register' ? t.haveAccount : t.noAccount}
              <Button type="button" $variant="ghost" $small onClick={() => switchTo(mode === 'register' ? 'login' : 'register')}>
                {mode === 'register' ? t.login : t.register}
              </Button>
            </>
          )}
        </Switch>
        <Footnote>{t.shared}</Footnote>
      </Box>
    </Frame>
  )
}

const Box = styled(Panel)`
  width: min(100%, 420px);
  margin: 0 auto;
  display: grid;
  gap: ${({ theme }) => theme.space(4)};
`

const Brand = styled.div`
  display: grid;
  justify-items: center;
  gap: ${({ theme }) => theme.space(1)};
  text-align: center;

  h1 {
    margin: ${({ theme }) => theme.space(1)} 0 0;
    font-size: 1.375rem;
    color: ${({ theme }) => theme.colors.primaryStrong};
  }
`

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`

const Switch = styled.p`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  margin: 0;
  font-size: 0.875rem;
`

const Footnote = styled(Muted)`
  text-align: center;
  font-size: 0.8125rem;
`
