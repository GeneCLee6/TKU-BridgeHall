import { useState, type FormEvent } from 'react'
import styled from 'styled-components'
import { Button, ErrorText, Field, Muted, Notice, PageTitle, Panel, PanelTitle, PasswordInput } from '../components/ui.tsx'
import { api, errorText, LIMITS, TABLE_SITE } from '../lib/api.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { strings } from '../strings.ts'
import { Frame, Gate } from './Frame.tsx'

/** 我的帳號: what this member may do here, and changing the password (shared with 淡江牌桌) */
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
        <PanelTitle>{user.username}</PanelTitle>
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
