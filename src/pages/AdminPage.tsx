import { BookA, ExternalLink, FileBarChart, MessagesSquare } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { CategoriesPanel } from '../components/admin/CategoriesPanel.tsx'
import { ProfilesPanel } from '../components/admin/ProfilesPanel.tsx'
import { SeriesPanel } from '../components/admin/SeriesPanel.tsx'
import { AuditPanel, DraftsPanel } from '../components/admin/ReviewPanels.tsx'
import { TeamsPanel } from '../components/admin/TeamsPanel.tsx'
import { AnalyticsPanel, ErrorsPanel } from '../components/admin/TelemetryPanels.tsx'
import { DataTable, TableScroll } from '../components/DataTable.tsx'
import { WithSectionNav } from '../components/SectionNav.tsx'
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
import { glossaryStrings } from '../glossary/strings.ts'
import { formatDateTime } from '../lib/format.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'
import { Frame, Gate } from './Frame.tsx'
import { review } from './reviewStrings.ts'
import { tableReport } from './tableReportStrings.ts'

/**
 * 社團管理. Admins manage everything, accounts included; editors (bookEdit) everything else
 * (ARCHITECTURE.md §4.2, decided 2026-10-25). So the account panels (registrations waiting for
 * approval, members' permissions and passwords, the account limit and invite code) are admins';
 * every other panel (the drafts waiting for review, the handbook's categories, the teams, the system
 * profiles, the audit log, usage statistics and error reports) is for editors too; switching the
 * club's anonymous analytics on or off is an admin's (e10-t07). The accounts are TKU BridgeTable's; adding or deleting members, admins and tables stay on
 * its admin page.
 */
export function AdminPage() {
  return (
    <Frame title={strings.admin.title}>
      <PageTitle>{strings.admin.title}</PageTitle>
      <Gate need="bookEdit">
        <AdminOrEditor />
      </Gate>
    </Frame>
  )
}

function AdminOrEditor() {
  const { user } = useAuth()
  const t = strings.admin
  return (
    <WithSectionNav>
      {user?.admin ? <AccountPanels /> : <Muted>{t.editorIntro}</Muted>}
      {/* Not about accounts: editors' too */}
      <DraftsPanel />
      <CategoriesPanel />
      <SeriesPanel />
      <TeamsPanel />
      <ProfilesPanel />
      <AuditPanel />
      <AnalyticsPanel />
      <ErrorsPanel />
      <Panel aria-labelledby="admin-tools">
        <PanelTitle id="admin-tools">{t.tools}</PanelTitle>
        <Tools>
          <Button as={Link} to="/integrations/table" $small>
            <FileBarChart size={16} aria-hidden />
            {tableReport.adminLink}
          </Button>
          <Button as={Link} to="/glossary/edit" $small>
            <BookA size={16} aria-hidden />
            {glossaryStrings.editTitle}
          </Button>
          {(user?.admin || user?.permissions.includes('forumModerate')) && (
            <Button as={Link} to="/forum/manage" $small>
              <MessagesSquare size={16} aria-hidden />
              {review.forumManage}
            </Button>
          )}
        </Tools>
        {user?.admin && (
          <Tools>
            <Muted>{t.more}</Muted>
            <Button as="a" href={`${TABLE_SITE}/admin`} target="_blank" rel="noreferrer" $small>
              <ExternalLink size={16} aria-hidden />
              {t.tableAdmin}
              <span className="visually-hidden">{strings.opensInNewTab}</span>
            </Button>
          </Tools>
        )}
      </Panel>
    </WithSectionNav>
  )
}

type Pending = { id: string; action: 'reject' | 'password' } | null

/** Admins only: registrations, members and the club settings, which decide who may join */
function AccountPanels() {
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

  // Permission changes wait in a draft until 儲存 (2026-10-30): the table shows the draft
  const [permDraft, setPermDraft] = useState<Record<string, Permission[]>>({})
  const permsOf = (u: AdminUser) => permDraft[u.id] ?? u.permissions
  const changedUsers = users.filter(
    (u) =>
      permDraft[u.id] &&
      (permDraft[u.id].length !== u.permissions.length || permDraft[u.id].some((p) => !u.permissions.includes(p))),
  )

  // A reviewer is always an editor (e8-t01): reviewing brings editing, and no editing means no
  // reviewing. The table's own permissions (featuring boards, the club's robot) are not shown here
  // and stay as they are
  const toggle = (u: AdminUser, permission: Permission, on: boolean) => {
    const now = permsOf(u)
    setNotice('')
    setPermDraft((d) => ({
      ...d,
      [u.id]: [
        ...PERMISSIONS.filter((p) => {
          if (p === permission) return on
          if (p === 'bookEdit' && permission === 'bookReview' && on) return true
          if (p === 'bookReview' && permission === 'bookEdit' && !on) return false
          return now.includes(p)
        }),
        ...now.filter((p) => !PERMISSIONS.includes(p)),
      ],
    }))
  }

  const savePermissions = () =>
    void run(async () => {
      for (const u of changedUsers) await api.admin.setPermissions(u.id, permDraft[u.id])
      setPermDraft({})
    })

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
          <TableScroll>
            <DataTable>
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
            </DataTable>
          </TableScroll>
        )}
      </Panel>

      <Panel aria-labelledby="members">
        <PanelTitle id="members">
          {t.members}（{t.memberCount(users.length, settings.maxUsers)}）
        </PanelTitle>
        <TableScroll>
          <DataTable>
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
                  <NoWrap>{u.admin ? t.adminRole : t.memberRole}</NoWrap>
                  <td title={u.admin ? t.adminHasAll : undefined}>
                    {PERMISSIONS.map((p) => (
                      <Check key={p}>
                        <input
                          type="checkbox"
                          checked={permsOf(u).includes(p)}
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
          </DataTable>
        </TableScroll>
        <Row>
          <Button type="button" $variant="primary" disabled={!changedUsers.length} onClick={savePermissions}>
            {changedUsers.length ? t.savePermissions(changedUsers.length) : strings.save}
          </Button>
          <Button type="button" disabled={!changedUsers.length} onClick={() => setPermDraft({})}>
            {strings.cancel}
          </Button>
          {changedUsers.length > 0 && <Small role="status">{t.permissionsUnsaved}</Small>}
        </Row>
      </Panel>

      <Panel aria-labelledby="settings">
        <PanelTitle id="settings">{t.settings}</PanelTitle>
        <SettingsForm onSubmit={saveSettings} aria-label={t.settings}>
          <SettingsFields>
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
          </SettingsFields>
          <div>
            <Button type="submit" $variant="primary">
              {strings.save}
            </Button>
          </div>
        </SettingsForm>
      </Panel>

    </>
  )
}


const NoWrap = styled.td`
  white-space: nowrap;
`

/** As tall as the small buttons beside it */
const NarrowInput = styled(Input)`
  width: 10rem;
  min-height: 2rem;
  padding-top: 0;
  padding-bottom: 0;
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
  gap: ${({ theme }) => theme.space(4)};
`

/** Each field as wide as what it holds: a two-digit number, then a short code with its hint */
const SettingsFields = styled.div`
  display: grid;
  grid-template-columns: 8rem minmax(0, 22rem);
  gap: ${({ theme }) => theme.space(4)};

  ${mobile} {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Tools = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  & + & {
    margin-top: ${({ theme }) => theme.space(3)};
  }
`
