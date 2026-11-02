import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { GoogleButton, GoogleCodeStep } from '../components/GoogleSignIn.tsx'
import { LogoMark } from '../components/Logo.tsx'
import { Button, ErrorText, Field, Input, Muted, Notice, Panel, PasswordInput } from '../components/ui.tsx'
import { api, ApiError, errorText, LIMITS } from '../lib/api.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { strings } from '../strings.ts'
import { Frame } from './Frame.tsx'

/**
 * 忘記密碼 as on 淡江牌桌: `reset` asks the admins with the invite code, `resetCode` sets the password
 * with the one-time code an admin handed over (TKU-BridgeTable e1-t36); `emailReset` mails a link to
 * the account's verified address (e1-t30), offered only when the club sends mail
 */
type Mode = 'login' | 'register' | 'reset' | 'resetCode' | 'emailReset'

/** Only paths on this site, so ?next= cannot send anyone elsewhere */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/')

/**
 * 登入、註冊、忘記密碼, with TKU BridgeTable's accounts. A registration waits for an admin to
 * approve it (only the club's first account signs in at once). An account with 兩步驟登入
 * (TKU-BridgeTable e11-t31) gets 401 `twoFactorNeeded` after the right password: the form then
 * shows a 驗證碼 field and sends the same name and password again with the code. 忘記密碼 follows
 * the table's login page: by email when `GET /api/email` says the club sends mail, otherwise (and
 * for accounts without a verified address) a request to the admins, then the code they hand over.
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
  /** The one-time reset code an admin handed over (mode resetCode) */
  const [resetCode, setResetCode] = useState('')
  const [note, setNote] = useState('')
  /** 兩步驟登入: the Worker asked for a code after the right password */
  const [needCode, setNeedCode] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [busy, setBusy] = useState(false)
  /** Whether the club sends mail (TKU-BridgeTable e1-t29): only then is there 忘記密碼 by email */
  const [emailOn, setEmailOn] = useState(false)
  useEffect(() => {
    let live = true
    api
      .emailStatus()
      .then(({ enabled }) => live && setEmailOn(enabled === true))
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [])
  const t = strings.auth
  const resetting = mode === 'reset'
  const withCode = mode === 'resetCode'
  const emailing = mode === 'emailReset'
  const title =
    mode === 'register' ? t.register : resetting ? t.reset : withCode ? t.enterResetCode : emailing ? t.emailResetTitle : t.login
  const intro = resetting ? t.resetIntro : withCode ? t.resetCodeIntro : emailing ? t.emailResetIntro : t.intro
  const submitLabel = resetting ? t.resetRequestButton : emailing ? t.sendLink : title
  /** Asking for a reset types no password; signing in, registering and the reset code do */
  const needsPassword = !resetting && !emailing
  const newPassword = mode === 'register' || withCode

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
    if (withCode && password !== repeat) return setError(t.passwordMismatch)
    setBusy(true)
    try {
      if (mode === 'register') {
        const result = await register(username, password, inviteCode, note)
        if ('pending' in result) setDone(t.applicationSent(result.username))
        else navigate(safeNext(params.get('next')), { replace: true })
      } else if (resetting) {
        await api.requestPasswordReset(username, inviteCode)
        setDone(t.resetRequested)
      } else if (emailing) {
        await api.requestEmailReset(username)
        setDone(t.linkSent)
      } else if (withCode) {
        await api.resetPassword(username, resetCode, password)
        switchTo('login')
        setResetCode('')
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
          <Muted>{intro}</Muted>
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
              {emailing ? t.emailAccount : t.username}
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete={emailing ? 'email' : 'username'}
                required
                minLength={emailing ? undefined : LIMITS.usernameMin}
                maxLength={emailing ? 254 : LIMITS.usernameMax}
              />
              {mode === 'register' && <small>{t.usernameHint(LIMITS.usernameMin, LIMITS.usernameMax)}</small>}
            </Field>
            {withCode && (
              <Field>
                {t.resetCode}
                <Input
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  autoComplete="one-time-code"
                  required
                  maxLength={20}
                />
                <small>{t.resetCodeHint}</small>
              </Field>
            )}
            {needsPassword && (
              <Field>
                {withCode ? t.newPassword : t.password}
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={newPassword ? 'new-password' : 'current-password'}
                  required
                  minLength={newPassword ? LIMITS.passwordMin : undefined}
                />
                {newPassword && <small>{t.passwordHint(LIMITS.passwordMin)}</small>}
              </Field>
            )}
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
            {withCode && (
              <Field>
                {t.confirmPassword}
                <PasswordInput value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" required />
              </Field>
            )}
            {(mode === 'register' || resetting) && (
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
              {submitLabel}
            </Button>
            {mode === 'login' && (
              <Button type="button" $variant="ghost" $small onClick={() => switchTo(emailOn ? 'emailReset' : 'reset')}>
                {t.forgot}
              </Button>
            )}
          </Form>
        )}
        {mode === 'login' && !googleCode && <GoogleButton next={safeNext(params.get('next'))} />}
        <Switch>
          {resetting || withCode || emailing ? (
            <ResetLinks>
              {emailing && (
                <Button type="button" $variant="ghost" $small onClick={() => switchTo('reset')}>
                  {t.byAdmin}
                </Button>
              )}
              {resetting && emailOn && (
                <span>
                  {t.haveEmail}
                  <Button type="button" $variant="ghost" $small onClick={() => switchTo('emailReset')}>
                    {t.resetByEmail}
                  </Button>
                </span>
              )}
              {resetting && (
                <span>
                  {t.haveResetCode}
                  <Button type="button" $variant="ghost" $small onClick={() => switchTo('resetCode')}>
                    {t.enterResetCode}
                  </Button>
                </span>
              )}
              <Button type="button" $variant="ghost" $small onClick={() => switchTo('login')}>
                {t.backToLogin}
              </Button>
            </ResetLinks>
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

/** 忘記密碼's other ways and 回到登入, wrapping on narrow screens */
const ResetLinks = styled.span`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(3)};

  & > span {
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.space(1)};
  }
`

const Footnote = styled(Muted)`
  text-align: center;
  font-size: 0.8125rem;
`
