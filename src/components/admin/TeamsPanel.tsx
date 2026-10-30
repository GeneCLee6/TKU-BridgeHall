import { Plus, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import styled from 'styled-components'
import { api, errorText, TEAM_LIMITS, type ClubMember, type ClubTeam, type Partnership } from '../../lib/api.ts'
import { formatDateTime } from '../../lib/format.ts'
import { strings } from '../../strings.ts'
import { mobile } from '../../styles/tokens.ts'
import { Button, ErrorText, Field, Input, Muted, Notice, Panel, PanelTitle, Row, Select } from '../ui.tsx'

import { teamsStrings } from './teamsStrings.ts'

const t = teamsStrings

/**
 * 隊伍 on the admin page (e2-t07, e2-t10): every team with its captain, members and partnerships,
 * for the editors. Make a team, pick a new captain, add or take off members, let the members edit
 * the team's profile, archive. The Worker checks each change (TKU-BridgeTable worker/teams.ts);
 * the team page for captains is C4's.
 */
export function TeamsPanel() {
  const [teams, setTeams] = useState<ClubTeam[] | null>(null)
  const [members, setMembers] = useState<ClubMember[]>([])
  const [draft, setDraft] = useState({ name: '', captainId: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(
    () =>
      Promise.all([api.club.teams(), api.club.members()]).then(([list, people]) => {
        setTeams(list)
        setMembers(people)
      }, (e) => setError(errorText(e))),
    [],
  )

  useEffect(() => {
    void load()
  }, [load])

  const run = async (work: () => Promise<unknown>) => {
    setError('')
    setNotice('')
    try {
      await work()
      setNotice(strings.saved)
      await load()
    } catch (e) {
      setError(errorText(e))
    }
  }

  const create = (event: FormEvent) => {
    event.preventDefault()
    void run(async () => {
      await api.club.createTeam({ name: draft.name.trim(), captainId: draft.captainId })
      setDraft({ name: '', captainId: '' })
    })
  }

  const nameOf = (id: string) => members.find((m) => m.id === id)?.username ?? id

  return (
    <Panel aria-labelledby="teams">
      <PanelTitle id="teams">{t.title}</PanelTitle>
      <Stack>
        <Muted>{t.intro}</Muted>
        {error && <ErrorText role="alert">{error}</ErrorText>}
        {notice && <Notice role="status">{notice}</Notice>}
        {!teams ? (
          !error && <Muted role="status">{strings.loading}</Muted>
        ) : !teams.length ? (
          <Muted>{t.none}</Muted>
        ) : (
          <List aria-label={t.title}>
            {teams.map((team) => (
              <TeamItem key={team.id} team={team} members={members} nameOf={nameOf} run={run} />
            ))}
          </List>
        )}

        <CreateForm onSubmit={create} aria-label={t.create}>
          <Field>
            {t.newName}
            <Input value={draft.name} maxLength={TEAM_LIMITS.nameMax} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field>
            {t.captain}
            <Select value={draft.captainId} onChange={(e) => setDraft({ ...draft, captainId: e.target.value })}>
              <option value="">{t.pick}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.username}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" disabled={!draft.name.trim() || !draft.captainId}>
            <Plus size={16} aria-hidden />
            {t.create}
          </Button>
        </CreateForm>
      </Stack>
    </Panel>
  )
}

interface ItemProps {
  team: ClubTeam
  members: ClubMember[]
  nameOf: (id: string) => string
  run: (work: () => Promise<unknown>) => Promise<void>
}

function TeamItem({ team, members, nameOf, run }: ItemProps) {
  const [adding, setAdding] = useState('')
  const [pairs, setPairs] = useState<Partnership[] | null>(null)
  const [open, setOpen] = useState(false)
  const update = (patch: Parameters<typeof api.club.updateTeam>[1]) => void run(() => api.club.updateTeam(team.id, patch))
  const outside = members.filter((m) => !team.memberIds.includes(m.id))
  const full = team.memberIds.length >= TEAM_LIMITS.membersMax
  const locked = !!team.archived
  // 隊長 and 隊員可編輯制度集 wait for 儲存 (2026-10-30)
  const [captainId, setCaptainId] = useState(team.captainId)
  const [membersEdit, setMembersEdit] = useState(!!team.membersEdit)
  const dirty = captainId !== team.captainId || membersEdit !== !!team.membersEdit
  const discard = () => {
    setCaptainId(team.captainId)
    setMembersEdit(!!team.membersEdit)
  }

  const togglePairs = () => {
    setOpen(!open)
    if (!open && !pairs) api.club.team(team.id).then((r) => setPairs(r.pairs), () => setPairs([]))
  }

  return (
    <Item>
      <Head>
        <Name>
          {team.name}
          {locked && <Small>{t.archived}</Small>}
        </Name>
        <Small>{t.count(team.memberIds.length, TEAM_LIMITS.membersMax)}</Small>
      </Head>

      <Grid>
        <Field>
          {t.captain}
          <Select
            value={captainId}
            disabled={locked}
            aria-label={t.captainOf(team.name)}
            onChange={(e) => setCaptainId(e.target.value)}
          >
            {team.memberIds.map((id) => (
              <option key={id} value={id}>
                {nameOf(id)}
              </option>
            ))}
          </Select>
        </Field>
        <Check>
          <input
            type="checkbox"
            checked={membersEdit}
            disabled={locked}
            onChange={(e) => setMembersEdit(e.target.checked)}
          />
          {t.membersEdit}
        </Check>
      </Grid>
      {!locked && (
        <Row>
          <Button
            type="button"
            $small
            $variant="primary"
            disabled={!dirty}
            onClick={() => update({ ...(captainId !== team.captainId && { captainId }), ...(membersEdit !== !!team.membersEdit && { membersEdit }) })}
          >
            {strings.save}
          </Button>
          <Button type="button" $small disabled={!dirty} onClick={discard}>
            {strings.cancel}
          </Button>
          {dirty && <Small role="status">{t.unsaved}</Small>}
        </Row>
      )}

      <div>
        <Small>{t.members}</Small>
        <Chips>
          {team.memberIds.map((id) => (
            <Chip key={id}>
              {nameOf(id)}
              {id !== team.captainId && !locked && (
                <Button
                  type="button"
                  $small
                  $variant="ghost"
                  aria-label={t.remove(nameOf(id), team.name)}
                  onClick={() => {
                    if (window.confirm(t.confirmRemove(nameOf(id), team.name))) void run(() => api.club.removeMember(team.id, id))
                  }}
                >
                  <X size={14} aria-hidden />
                </Button>
              )}
            </Chip>
          ))}
        </Chips>
      </div>

      <Row>
        {!locked && (
          <>
            <Select value={adding} disabled={full} aria-label={t.addTo(team.name)} onChange={(e) => setAdding(e.target.value)}>
              <option value="">{t.pick}</option>
              {outside.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.username}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              $small
              disabled={!adding || full}
              onClick={() => void run(() => api.club.addMember(team.id, adding)).then(() => setAdding(''))}
            >
              {t.add}
            </Button>
          </>
        )}
        <Button type="button" $small aria-expanded={open} onClick={togglePairs}>
          {t.pairs(team.name)}
        </Button>
        <Button type="button" $small $variant={locked ? undefined : 'danger'} onClick={() => {
            if (window.confirm(locked ? t.confirmUnarchive(team.name) : t.confirmArchive(team.name))) update({ archived: !locked })
          }}
        >
          {locked ? t.unarchive : t.archive}
        </Button>
      </Row>

      {open &&
        (!pairs ? (
          <Muted role="status">{strings.loading}</Muted>
        ) : !pairs.length ? (
          <Muted>{t.noPairs}</Muted>
        ) : (
          <ul aria-label={t.pairs(team.name)}>
            {pairs.map((p) => (
              <li key={p.id}>
                {p.userIds.map(nameOf).join('＋')}
                {p.acceptedAt && <Small as="span"> · {formatDateTime(p.acceptedAt)}</Small>}
              </li>
            ))}
          </ul>
        ))}
    </Item>
  )
}

const Stack = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(4)};
`

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`

const Item = styled.li`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(3)} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ul {
    margin: 0;
    padding-left: ${({ theme }) => theme.space(5)};
  }
`

const Head = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space(3)};
`

const Name = styled.strong`
  display: inline-flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space(2)};
`

const Small = styled.small`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 14rem) auto;
  align-items: end;
  gap: ${({ theme }) => theme.space(4)};

  ${mobile} {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Check = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  min-height: 2.5rem;
`

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2)};
  margin-top: ${({ theme }) => theme.space(1)};
`

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  padding: 0 ${({ theme }) => theme.space(2)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.tag};
  min-height: 2rem;
`

const CreateForm = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 14rem) minmax(0, 14rem) auto;
  align-items: end;
  gap: ${({ theme }) => theme.space(2)};

  ${mobile} {
    grid-template-columns: minmax(0, 1fr);
  }
`
