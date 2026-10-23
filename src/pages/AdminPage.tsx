import { useCallback, useEffect, useState, type FormEvent } from 'react'
import styled from 'styled-components'
import { Button, ErrorText, Field, Input, Muted, Notice, PageTitle, Panel, PanelTitle, Row } from '../components/ui.tsx'
import {
  api,
  errorText,
  LIMITS,
  PERMISSIONS,
  TABLE_SITE,
  type AdminUser,
  type Application,
  type ClubSettings,
  type Permission,
} from '../lib/api.ts'
import { formatDateTime } from '../lib/format.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { strings } from '../strings.ts'
import { Frame, Gate } from './Frame.tsx'

/**
 * 社團管理: registrations waiting for approval, members' BridgeBook permissions and passwords,
 * and the invite code. The accounts are TKU BridgeTable's; adding or deleting members, admins and
 * tables stay on its admin page.
 */
export function AdminPage() {
  return (
    <Frame title={strings.admin.title}>
      <PageTitle>{strings.admin.title}</PageTitle>
      <Gate need="admin">
        <AdminBody />
      </Gate>
    </Frame>
  )
}

type Pending = { id: string; action: 'reject' | 'password' } | null

function AdminBody() {
  const { refresh } = useAuth()
  const t = strings.admin
  const [applications, setApplications] = useState<Application[] | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [settings, setSettings] = useState<ClubSettings | null>(null)
  const [draft, setDraft] = useState({ maxUsers: '', inviteCode: '' })
  const [pending, setPending] = useState<Pending>(null)
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const reload = useCallback(
    () =>
      Promise.all([api.admin.applications(), api.admin.users(), api.admin.settings()])
        .then(([a, u, s]) => {
          setApplications(a.applications)
          setUsers(u.users)
          setSettings(s.settings)
          setDraft({ maxUsers: String(s.settings.maxUsers), inviteCode: s.settings.inviteCode })
          // The account menu shows how many are waiting
          void refresh()
        })
        .catch((e) => setError(errorText(e))),
    [refresh],
  )

  useEffect(() => {
    void reload()
  }, [reload])

  const run = async (work: () => Promise<unknown>) => {
    setError('')
    setNotice('')
    try {
      await work()
      setNotice(strings.saved)
      setPending(null)
      setNewPassword('')
      await reload()
    } catch (e) {
      setError(errorText(e))
    }
  }

  const toggle = (u: AdminUser, permission: Permission, on: boolean) =>
    void run(() =>
      api.admin.setPermissions(u.id, PERMISSIONS.filter((p) => (p === permission ? on : u.permissions.includes(p)))),
    )

  const saveSettings = (event: FormEvent) => {
    event.preventDefault()
    void run(() => api.admin.saveSettings({ maxUsers: Number(draft.maxUsers), inviteCode: draft.inviteCode }))
  }

  if (!applications || !settings)
    return error ? <ErrorText role="alert">{error}</ErrorText> : <Muted role="status">{strings.loading}</Muted>

  return (
    <>
      <Muted>{t.intro}</Muted>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {notice && <Notice role="status">{notice}</Notice>}

      <Panel aria-labelledby="applications">
        <PanelTitle id="applications">
          {t.applications}
          {applications.length > 0 && `（${applications.length}）`}
        </PanelTitle>
        {!applications.length ? (
          <Muted>{t.noApplications}</Muted>
        ) : (
          <Scroll>
            <Table>
              <thead>
                <tr>
                  <th>{strings.auth.username}</th>
                  <th>{t.about}</th>
                  <th>{t.applied}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.username}
                      <Small>{t.from(a.site)}</Small>
                    </td>
                    <td>{a.note || strings.never}</td>
                    <td>{formatDateTime(a.createdAt)}</td>
                    <td>
                      {pending?.id === a.id ? (
                        <Row>
                          <span>{t.confirmReject(a.username)}</span>
                          <Button type="button" $small $variant="danger" onClick={() => void run(() => api.admin.reject(a.id))}>
                            {strings.confirm}
                          </Button>
                          <Button type="button" $small onClick={() => setPending(null)}>
                            {strings.cancel}
                          </Button>
                        </Row>
                      ) : (
                        <Row>
                          <Button type="button" $small $variant="primary" onClick={() => void run(() => api.admin.approve(a.id))}>
                            {t.approve}
                          </Button>
                          <Button type="button" $small $variant="danger" onClick={() => setPending({ id: a.id, action: 'reject' })}>
                            {t.reject}
                          </Button>
                        </Row>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Scroll>
        )}
      </Panel>

      <Panel aria-labelledby="members">
        <PanelTitle id="members">
          {t.members}（{t.memberCount(users.length, settings.maxUsers)}）
        </PanelTitle>
        <Scroll>
          <Table>
            <thead>
              <tr>
                <th>{strings.auth.username}</th>
                <th>{t.role}</th>
                <th>{t.permissions}</th>
                <th>{t.lastLogin}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.username}
                    {u.passwordResetAt && <Small>{t.selfReset(formatDateTime(u.passwordResetAt))}</Small>}
                  </td>
                  <td>{u.admin ? t.adminRole : t.memberRole}</td>
                  <td title={u.admin ? t.adminHasAll : undefined}>
                    {PERMISSIONS.map((p) => (
                      <Check key={p}>
                        <input
                          type="checkbox"
                          checked={u.permissions.includes(p)}
                          disabled={u.admin}
                          onChange={(e) => toggle(u, p, e.target.checked)}
                          aria-label={`${u.username}：${strings.permission[p]}`}
                        />
                        {strings.permission[p]}
                      </Check>
                    ))}
                  </td>
                  <td>{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : strings.never}</td>
                  <td>
                    {pending?.id === u.id ? (
                      <Row>
                        <NarrowInput
                          type="password"
                          autoFocus
                          value={newPassword}
                          minLength={LIMITS.passwordMin}
                          onChange={(e) => setNewPassword(e.target.value)}
                          aria-label={t.newPasswordFor(u.username)}
                          placeholder={strings.auth.newPassword}
                        />
                        <Button type="button" $small $variant="primary" onClick={() => void run(() => api.admin.resetPassword(u.id, newPassword))}>
                          {strings.save}
                        </Button>
                        <Button type="button" $small onClick={() => setPending(null)}>
                          {strings.cancel}
                        </Button>
                      </Row>
                    ) : (
                      <Button type="button" $small onClick={() => setPending({ id: u.id, action: 'password' })}>
                        {t.resetPassword}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Scroll>
      </Panel>

      <Panel aria-labelledby="settings">
        <PanelTitle id="settings">{t.settings}</PanelTitle>
        <SettingsForm onSubmit={saveSettings} aria-label={t.settings}>
          <Field>
            {t.maxUsers}
            <Input
              type="number"
              min={2}
              max={100}
              value={draft.maxUsers}
              onChange={(e) => setDraft({ ...draft, maxUsers: e.target.value })}
            />
          </Field>
          <Field>
            {strings.auth.inviteCode}
            <Input value={draft.inviteCode} onChange={(e) => setDraft({ ...draft, inviteCode: e.target.value })} />
            <small>{t.inviteCodeHint}</small>
          </Field>
          <div>
            <Button type="submit" $variant="primary">
              {strings.save}
            </Button>
          </div>
        </SettingsForm>
      </Panel>

      <Muted>
        {t.more}{' '}
        <a href={`${TABLE_SITE}/admin`} target="_blank" rel="noreferrer">
          {t.tableAdmin}
          {strings.opensInNewTab}
        </a>
      </Muted>
    </>
  )
}

const Scroll = styled.div`
  overflow-x: auto;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;

  th,
  td {
    padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    text-align: left;
    vertical-align: middle;
  }
  th {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.8125rem;
    white-space: nowrap;
  }
`

const NarrowInput = styled(Input)`
  width: 160px;
`

const Small = styled.small`
  display: block;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.75rem;
`

const Check = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  margin-right: ${({ theme }) => theme.space(3)};
  white-space: nowrap;
`

const SettingsForm = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.space(3)};
  align-items: end;
`
