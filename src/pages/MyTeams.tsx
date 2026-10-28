import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, ErrorText, Field, Muted, Panel, PanelTitle, Row, Select } from '../components/ui.tsx'
import { api, errorText, TEAM_LIMITS, type ClubMember, type ClubTeam, type Me, type Partnership } from '../lib/api.ts'
import { memberName, pairName } from '../lib/teams.ts'
import { strings } from '../strings.ts'
import { Badge, Plain, Stack } from './TeamBlocks.tsx'
import { teamStrings as t } from './teamStrings.ts'

/**
 * 我的帳號 › 我的隊伍與搭檔 (e2-t06, AC-2.5): the teams the member is in, their partnerships and
 * invitations, and inviting a partner. The partnership's page answers an invitation and, once it
 * is accepted, offers to copy another profile into the new one (e2-t09).
 */
export function MyTeams({ user }: { user: Me }) {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState<{ teams: ClubTeam[]; pairs: Partnership[]; members: ClubMember[] } | null>(null)
  const [error, setError] = useState('')
  // Not an alert: the rest of the account page works without the teams
  const [loadError, setLoadError] = useState('')
  const [partnerId, setPartnerId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    () =>
      Promise.all([api.club.teams(), api.club.pairs(), api.club.members()]).then(
        ([teams, pairs, members]) => setLoaded({ teams, pairs, members }),
        (e) => setLoadError(errorText(e)),
      ),
    [],
  )

  useEffect(() => {
    void load()
  }, [load])

  const teams = loaded?.teams.filter((team) => !team.archived && team.memberIds.includes(user.id)) ?? []
  const pairs = loaded?.pairs ?? []
  const members = loaded?.members ?? []
  const others = members.filter((m) => m.id !== user.id)
  // A team both partners are in
  const shared = teams.filter((team) => partnerId && team.memberIds.includes(partnerId))
  const current = pairs.filter((p) => p.status !== 'ended').length

  const invite = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const pair = await api.club.invite(teamId ? { partnerId, teamId } : { partnerId })
      navigate(`/pairs/${encodeURIComponent(pair.id)}`)
    } catch (e) {
      setError(errorText(e))
      setBusy(false)
    }
  }

  const status = (pair: Partnership) =>
    pair.status === 'pending' && pair.userIds[1] === user.id ? t.reply : t.status[pair.status]

  return (
    <Panel aria-labelledby="my-teams-title" id="my-teams">
      <PanelTitle id="my-teams-title">{t.myTitle}</PanelTitle>
      <Stack>
        <Muted>{t.myIntro}</Muted>
        {error && <ErrorText role="alert">{error}</ErrorText>}
        {loadError && <ErrorText>{loadError}</ErrorText>}
        {!loaded ? (
          !loadError && <Muted role="status">{strings.loading}</Muted>
        ) : (
          <>
            <h3>{t.myTeams}</h3>
            {teams.length ? (
              <Plain aria-label={t.myTeams}>
                {teams.map((team) => (
                  <li key={team.id}>
                    <Row>
                      <Link to={`/teams/${encodeURIComponent(team.id)}`}>{team.name}</Link>
                      {team.captainId === user.id && <Badge>{t.captain}</Badge>}
                    </Row>
                  </li>
                ))}
              </Plain>
            ) : (
              <Muted>{t.noMyTeams}</Muted>
            )}
            <Muted>
              <Link to="/teams">{t.allTeams}</Link>
            </Muted>

            <h3>{t.myPairs}</h3>
            {pairs.length ? (
              <Plain aria-label={t.myPairs}>
                {pairs.map((pair) => {
                  const team = loaded.teams.find((x) => x.id === pair.teamId)
                  return (
                    <li key={pair.id}>
                      <Row>
                        <Link to={`/pairs/${encodeURIComponent(pair.id)}`}>{pairName(members, pair.userIds)}</Link>
                        {team && <span>{team.name}</span>}
                        <Badge>{status(pair)}</Badge>
                      </Row>
                    </li>
                  )
                })}
              </Plain>
            ) : (
              <Muted>{t.noMyPairs}</Muted>
            )}

            <form onSubmit={(e) => void invite(e)} aria-label={t.invite}>
              <Stack>
                <Row>
                  <Field>
                    {t.partner}
                    <Select
                      value={partnerId}
                      onChange={(e) => {
                        setPartnerId(e.target.value)
                        setTeamId('')
                      }}
                    >
                      <option value="">{t.pickPartner}</option>
                      {others.map((m) => (
                        <option key={m.id} value={m.id}>
                          {memberName(members, m.id)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field>
                    {t.pairTeam}
                    <Select value={teamId} disabled={!shared.length} onChange={(e) => setTeamId(e.target.value)}>
                      <option value="">{t.pairNoTeam}</option>
                      {shared.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button type="submit" disabled={!partnerId || busy || current >= TEAM_LIMITS.pairsMax}>
                    {t.sendInvite}
                  </Button>
                </Row>
                <Muted>{t.pairLimit(TEAM_LIMITS.pairsMax)}</Muted>
              </Stack>
            </form>
          </>
        )}
      </Stack>
    </Panel>
  )
}
