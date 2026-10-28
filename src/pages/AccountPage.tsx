import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import styled from 'styled-components'
import { Avatar } from '../components/Avatar.tsx'
import { AvatarCropper } from '../components/AvatarCropper.tsx'
import { DisplaySettings } from '../components/DisplaySettings.tsx'
import { Button, ErrorText, Field, Muted, Notice, PageTitle, Panel, PanelTitle, PasswordInput } from '../components/ui.tsx'
import { accountApi, AVATAR_INPUT_TYPES } from '../lib/account.ts'
import { api, errorText, LIMITS, type Me, TABLE_SITE } from '../lib/api.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { settingsStrings } from '../settingsStrings.ts'
import { accountStrings } from '../strings-account.ts'
import { strings } from '../strings.ts'
import { Frame, Gate } from './Frame.tsx'
import { MyTeams } from './MyTeams.tsx'

/** 我的帳號: what this member may do here, their avatar, 顯示 (個人設定), and changing the password (shared with 淡江牌桌) */
export function AccountPage() {
  return (
    <Frame title={strings.me.title}>
      <PageTitle>{strings.me.title}</PageTitle>
      <Gate need="member">
        <AccountBody />
      </Gate>
    </Frame>
  )
}

function AccountBody() {
  const { user } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const change = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      await api.changePassword(current, next)
      setCurrent('')
      setNext('')
      setNotice(strings.saved)
    } catch (e) {
      setError(errorText(e))
    }
  }

  if (!user) return null
  return (
    <>
      <Panel>
        <Who>
          <Avatar id={user.id} name={user.profile?.displayName || user.username} size={48} avatar={user.avatar} />
          <PanelTitle>{user.profile?.displayName || user.username}</PanelTitle>
        </Who>
        <Muted>
          {strings.me.permissions}：
          {user.admin
            ? strings.me.admin
            : user.permissions.length
              ? user.permissions.map((p) => strings.permission[p]).join('、')
              : strings.me.none}
        </Muted>
        <TableLink href={TABLE_SITE} target="_blank" rel="noreferrer">
          {strings.me.toTable}
          {strings.opensInNewTab}
        </TableLink>
      </Panel>
      <MyTeams user={user} />
      <AvatarPanel user={user} />
      {/* 我的帳號 › 顯示 (e9-t15): the same choices as the 個人設定 page */}
      <Panel aria-labelledby="account-display">
        <PanelTitle id="account-display">{settingsStrings.display}</PanelTitle>
        <Muted>{settingsStrings.intro}</Muted>
        <DisplaySettings />
      </Panel>
      <Panel>
        <PanelTitle>{strings.me.changePassword}</PanelTitle>
        <Form onSubmit={change} aria-label={strings.me.changePassword}>
          <Field>
            {strings.me.currentPassword}
            <PasswordInput value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
          </Field>
          <Field>
            {strings.auth.newPassword}
            <PasswordInput
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              minLength={LIMITS.passwordMin}
              required
            />
            <small>{strings.auth.passwordHint(LIMITS.passwordMin)}</small>
          </Field>
          {error && <ErrorText role="alert">{error}</ErrorText>}
          {notice && <Notice role="status">{notice}</Notice>}
          <div>
            <Button type="submit" $variant="primary">
              {strings.save}
            </Button>
          </div>
        </Form>
      </Panel>
    </>
  )
}

/**
 * 頭像 (e11-t03): pick a picture and crop it (`AvatarCropper`), or go back to the default avatar.
 * The same picture as on 淡江牌桌: both sites read `/api/avatar/:id`
 */
function AvatarPanel({ user }: { user: Me }) {
  const { refresh } = useAuth()
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const choose = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    // The same file can be picked again after a cancel
    e.target.value = ''
    setError('')
    setNotice('')
    if (!picked) return
    if (!(AVATAR_INPUT_TYPES as readonly string[]).includes(picked.type)) return setError(accountStrings.avatarBadFormat)
    setFile(picked)
  }

  const saved = async () => {
    setFile(null)
    await refresh()
    setNotice(accountStrings.avatarSaved)
  }

  const remove = async () => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await accountApi.removeAvatar()
      await refresh()
      setNotice(accountStrings.avatarRemoved)
    } catch (e) {
      setError(errorText(e))
    }
    setBusy(false)
  }

  return (
    <Panel>
      <PanelTitle>{accountStrings.avatar}</PanelTitle>
      <Muted>{accountStrings.avatarHint}</Muted>
      <AvatarRow>
        <Avatar id={user.id} name={user.profile?.displayName || user.username} size={64} avatar={user.avatar} />
        <Button type="button" onClick={() => input.current?.click()}>
          {accountStrings.avatarChoose}
        </Button>
        {user.avatar ? (
          <Button type="button" $variant="ghost" disabled={busy} onClick={() => void remove()}>
            {accountStrings.avatarRemove}
          </Button>
        ) : null}
        <input ref={input} type="file" accept={AVATAR_INPUT_TYPES.join(',')} hidden onChange={choose} />
      </AvatarRow>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {notice && <Notice role="status">{notice}</Notice>}
      {file && <AvatarCropper file={file} onClose={() => setFile(null)} onSaved={() => void saved()} />}
    </Panel>
  )
}

const Who = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};

  & > h2 {
    margin: 0;
  }
`

const AvatarRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  margin-top: ${({ theme }) => theme.space(3)};
`

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  max-width: 420px;
`

const TableLink = styled.a`
  display: inline-block;
  margin-top: ${({ theme }) => theme.space(3)};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
`
