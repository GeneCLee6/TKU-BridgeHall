import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import styled from 'styled-components'
import { Avatar } from '../components/Avatar.tsx'
import { AvatarCropper } from '../components/AvatarCropper.tsx'
import { DisplaySettings } from '../components/DisplaySettings.tsx'
import { Link } from 'react-router-dom'
import { Button, ErrorText, Field, Input, Muted, Notice, PageTitle, Panel, PanelTitle, PasswordInput, Select, TextArea } from '../components/ui.tsx'
import { accountApi, AVATAR_INPUT_TYPES, PROFILE_FIELD_LIMITS, PROFILE_LEVELS, type Profile, type ProfileLevel } from '../lib/account.ts'
import { api, errorText, LIMITS, type Me, TABLE_SITE } from '../lib/api.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { settingsStrings } from '../settingsStrings.ts'
import { accountStrings } from '../strings-account.ts'
import { strings } from '../strings.ts'
import { Frame, Gate } from './Frame.tsx'
import { MyTeams } from './MyTeams.tsx'
import { MyPathProgress } from './LearnPages.tsx'
import { ContinueReading } from './ContinueReading.tsx'

/**
 * 我的帳號: what this member may do here, their profile and avatar (shared with 淡江牌桌), their teams,
 * 顯示 (個人設定), and changing the password
 */
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
        <Links>
          <Link to={`/u/${encodeURIComponent(user.id)}`}>{accountStrings.myPage}</Link>
          <a href={TABLE_SITE} target="_blank" rel="noreferrer">
            {strings.me.toTable}
            {strings.opensInNewTab}
          </a>
        </Links>
      </Panel>
      <ProfilePanel user={user} />
      <AvatarPanel user={user} />
      <MyTeams user={user} />
      <NoticesPanel user={user} />
      <ContinueReading />
      <MyPathProgress />
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
 * 通知 (F4 靜音): whether 淡江牌桌's bell says a convention the member's team or partnership plays
 * was published. Saved at once; on unless turned off
 */
function NoticesPanel({ user }: { user: Me }) {
  const { refresh } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const muted = user.bookAdoptedNotice === false

  const change = async (mute: boolean) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await api.setPreferences({ bookAdoptedNotice: !mute })
      await refresh()
      setNotice(accountStrings.noticesSaved)
    } catch (e) {
      setError(errorText(e))
    }
    setBusy(false)
  }

  return (
    <Panel aria-labelledby="account-notices">
      <PanelTitle id="account-notices">{accountStrings.notices}</PanelTitle>
      <Muted>{accountStrings.noticesHint}</Muted>
      <Check>
        <input
          type="checkbox"
          checked={muted}
          disabled={busy}
          onChange={(e) => void change(e.target.checked)}
          aria-describedby="account-mute-adopted-hint"
        />
        {accountStrings.muteAdopted}
      </Check>
      <Muted id="account-mute-adopted-hint">{accountStrings.muteAdoptedHint}</Muted>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {notice && <Notice role="status">{notice}</Notice>}
    </Panel>
  )
}

type ProfileForm = Required<Omit<Profile, 'level'>> & { level: ProfileLevel | '' }

/**
 * 個人檔案 (e11-t04, AC-11.1): the display name, self-rated level, usual system and bio, the same
 * on both sites. The Worker checks the limits again (`parseProfile`); an empty field clears it
 */
function ProfilePanel({ user }: { user: Me }) {
  const { refresh } = useAuth()
  const [form, setForm] = useState<ProfileForm>(() => ({
    displayName: user.profile?.displayName ?? '',
    level: user.profile?.level ?? '',
    system: user.profile?.system ?? '',
    bio: user.profile?.bio ?? '',
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const set = (patch: Partial<ProfileForm>) => {
    setForm((f) => ({ ...f, ...patch }))
    setNotice('')
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      // The whole profile each time: an empty text, or a level left out, clears that field
      const { level, ...texts } = form
      await accountApi.setProfile({ ...texts, ...(level && { level }) })
      await refresh()
      setNotice(accountStrings.profileSaved)
    } catch (e) {
      setError(errorText(e))
    }
    setBusy(false)
  }

  const limits = PROFILE_FIELD_LIMITS
  return (
    <Panel aria-labelledby="account-profile">
      <PanelTitle id="account-profile">{accountStrings.profile}</PanelTitle>
      <Muted>{accountStrings.profileHint}</Muted>
      <Form onSubmit={(e) => void save(e)} aria-label={accountStrings.profile}>
        <Field>
          {accountStrings.displayName}
          <Input value={form.displayName} maxLength={limits.displayNameMax} onChange={(e) => set({ displayName: e.target.value })} />
          <small>{accountStrings.displayNameHint(limits.displayNameMax)}</small>
        </Field>
        <Field>
          {accountStrings.level}
          <Select value={form.level} onChange={(e) => set({ level: e.target.value as ProfileLevel | '' })}>
            <option value="">{accountStrings.levelNone}</option>
            {PROFILE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {accountStrings.levels[level]}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          {accountStrings.system}
          <Input value={form.system} maxLength={limits.systemMax} onChange={(e) => set({ system: e.target.value })} />
          <small>{accountStrings.systemHint(limits.systemMax)}</small>
        </Field>
        <Field>
          {accountStrings.bio}
          <TextArea rows={4} value={form.bio} maxLength={limits.bioMax} onChange={(e) => set({ bio: e.target.value })} />
          <small>{accountStrings.bioCount([...form.bio].length, limits.bioMax)}</small>
        </Field>
        {error && <ErrorText role="alert">{error}</ErrorText>}
        {notice && <Notice role="status">{notice}</Notice>}
        <div>
          <Button type="submit" $variant="primary" disabled={busy}>
            {busy ? accountStrings.saving : strings.save}
          </Button>
        </div>
      </Form>
    </Panel>
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

const Check = styled.label`
  display: flex;
  gap: ${({ theme }) => theme.space(2)};
  align-items: center;
  margin-top: ${({ theme }) => theme.space(3)};
  font-size: 0.875rem;
  font-weight: 600;
`

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  max-width: 420px;
`

const Links = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(4)};
  margin: ${({ theme }) => theme.space(3)} 0 0;

  & > a {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }
`
