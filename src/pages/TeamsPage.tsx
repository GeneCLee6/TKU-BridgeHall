import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DataTable, TableScroll } from '../components/DataTable.tsx'
import { ErrorText, Muted, PageTitle, Panel, PanelTitle, Row } from '../components/ui.tsx'
import {
  api,
  errorText,
  TEAM_LIMITS,
  type ClubMember,
  type ClubTeam,
  type Partnership,
  type ProfileAccess,
  type SystemProfile,
} from '../lib/api.ts'
import { memberName, pairName, profileDiff, type ProfileDiff } from '../lib/teams.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { strings } from '../strings.ts'
import { Frame, Gate } from './Frame.tsx'
import { Badge, MemberChip, Plain, ProfileEntries, Stack } from './TeamBlocks.tsx'
import { teamStrings as t } from './teamStrings.ts'

/** 隊伍 (/teams, e2-t05): every team with its captain and members, the member's own first */
export function TeamsPage() {
  return (
    <Frame title={t.teamsTitle}>
      <PageTitle>{t.teamsTitle}</PageTitle>
      <Gate need="member">
        <TeamList />
      </Gate>
    </Frame>
  )
}

function TeamList() {
  const { user } = useAuth()
  const [loaded, setLoaded] = useState<{ teams: ClubTeam[]; members: ClubMember[] } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    Promise.all([api.club.teams(), api.club.members()]).then(
      ([teams, members]) => current && setLoaded({ teams, members }),
      (e) => current && setError(errorText(e)),
    )
    return () => {
      current = false
    }
  }, [])

  if (error) return <ErrorText role="alert">{error}</ErrorText>
  if (!loaded) return <Muted role="status">{strings.loading}</Muted>
  const { teams, members } = loaded
  const mine = (team: ClubTeam) => !!user && team.memberIds.includes(user.id)
  const open = teams.filter((team) => !team.archived).sort((a, b) => Number(mine(b)) - Number(mine(a)))
  const archived = teams.filter((team) => team.archived)

  const list = (shown: ClubTeam[], label: string) => (
    <TableScroll>
      <DataTable aria-label={label}>
        <thead>
          <tr>
            <th>{t.teamsTitle}</th>
            <th>{t.captain}</th>
            <th>{t.members}</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((team) => (
            <tr key={team.id}>
              <td>
                <Row>
                  <Link to={`/teams/${encodeURIComponent(team.id)}`}>{team.name}</Link>
                  {mine(team) && <Badge>{t.mine}</Badge>}
                </Row>
              </td>
              <td>{memberName(members, team.captainId)}</td>
              <td>{t.count(team.memberIds.length, TEAM_LIMITS.membersMax)}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </TableScroll>
  )

  return (
    <>
      <Panel aria-labelledby="teams-list">
        <PanelTitle id="teams-list">{t.teamsTitle}</PanelTitle>
        <Stack>
          <Muted>{t.teamsIntro}</Muted>
          {open.length ? list(open, t.teamsTitle) : <Muted>{t.noTeams}</Muted>}
          <Muted>
            <Link to="/account#my-teams">{t.toMine}</Link>
          </Muted>
        </Stack>
      </Panel>
      {archived.length > 0 && (
        <Panel aria-labelledby="teams-archived">
          <PanelTitle id="teams-archived">{t.archivedTeams}</PanelTitle>
          {list(archived, t.archivedTeams)}
        </Panel>
      )}
    </>
  )
}

/** 隊伍頁 (/teams/:id, e2-t05, AC-2.4): members, the team's profile, and each partnership's own changes */
export function TeamPage() {
  return (
    <Frame>
      <Gate need="member">
        <Team />
      </Gate>
    </Frame>
  )
}

interface PairRow {
  pair: Partnership
  /** What the partnership's profile changes over the team's; null when the member may not read it */
  diff: ProfileDiff | null
}

type Loaded =
  | {
      id: string
      team: ClubTeam
      members: ClubMember[]
      profile: SystemProfile | null
      access?: ProfileAccess
      pairs: PairRow[]
    }
  | { id: string; error: string }

function Team() {
  const { id = '' } = useParams()
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    let current = true
    void (async () => {
      try {
        const [{ team, pairs }, members] = await Promise.all([api.club.team(id), api.club.members()])
        const [own, rows] = await Promise.all([
          api.book.profileWithAccess(team.profileId).catch(() => null),
          Promise.all(
            pairs.map(async (pair): Promise<PairRow> => {
              const profile = pair.profileId ? await api.book.profile(pair.profileId).catch(() => null) : null
              return { pair, diff: profile && profileDiff(profile) }
            }),
          ),
        ])
        if (current)
          setLoaded({ id, team, members, profile: own?.profile ?? null, access: own?.access, pairs: rows })
      } catch (e) {
        if (current) setLoaded({ id, error: errorText(e) })
      }
    })()
    return () => {
      current = false
    }
  }, [id])

  const title = loaded && loaded.id === id && 'team' in loaded ? loaded.team.name : t.teamsTitle
  usePageTitle(title)

  if (!loaded || loaded.id !== id) return <Muted role="status">{strings.loading}</Muted>
  if ('error' in loaded) return <ErrorText role="alert">{loaded.error}</ErrorText>
  const { team, members, profile, access, pairs } = loaded

  return (
    <>
      <Row>
        <PageTitle>{team.name}</PageTitle>
        {team.archived && <Badge>{t.archived}</Badge>}
      </Row>
      <Muted>
        <Link to="/teams">{t.teamsTitle}</Link>
      </Muted>

      <Panel aria-labelledby="team-members">
        <PanelTitle id="team-members">
          {t.members}（{t.count(team.memberIds.length, TEAM_LIMITS.membersMax)}）
        </PanelTitle>
        <Plain aria-label={t.members}>
          {team.memberIds.map((memberId) => (
            <li key={memberId}>
              <MemberChip members={members} id={memberId} role={memberId === team.captainId ? t.captain : undefined} />
            </li>
          ))}
        </Plain>
      </Panel>

      <Panel aria-labelledby="team-profile">
        <PanelTitle id="team-profile">{t.profileTitle}</PanelTitle>
        <Stack>
          {profile ? (
            <>
              <Muted>
                {profile.name} · {team.membersEdit ? t.membersEdit : t.captainOnly}
              </Muted>
              <ProfileEntries profileId={team.profileId} name={profile.name} access={access} />
            </>
          ) : (
            <Muted>{t.hidden}</Muted>
          )}
        </Stack>
      </Panel>

      <Panel aria-labelledby="team-pairs">
        <PanelTitle id="team-pairs">{t.pairsTitle}</PanelTitle>
        <Stack>
          <Muted>{t.pairsIntro}</Muted>
          {pairs.length ? (
            <TableScroll>
              <DataTable aria-label={t.pairsTitle}>
                <thead>
                  <tr>
                    <th>{t.pair}</th>
                    <th>{t.overrides}</th>
                    <th>{t.off}</th>
                    <th>{t.on}</th>
                    <th>
                      <span className="visually-hidden">{t.compare}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pairs.map(({ pair, diff }) => {
                    const name = pairName(members, pair.userIds)
                    return (
                      <tr key={pair.id} aria-label={t.diffOf(name)}>
                        <td>
                          <Link to={`/pairs/${encodeURIComponent(pair.id)}`} aria-label={t.openPair(name)}>
                            {name}
                          </Link>
                        </td>
                        <td>{diff ? diff.overrides : t.unknown}</td>
                        <td>{diff ? diff.off : t.unknown}</td>
                        <td>{diff ? diff.on : t.unknown}</td>
                        <td>
                          {diff && (
                            <Link to={`/profiles/${encodeURIComponent(pair.profileId)}/compare`} aria-label={t.compareOf(name)}>
                              {t.compare}
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </DataTable>
            </TableScroll>
          ) : (
            <Muted>{t.noPairs}</Muted>
          )}
        </Stack>
      </Panel>
    </>
  )
}
