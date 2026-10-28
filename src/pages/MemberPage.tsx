import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Avatar } from '../components/Avatar.tsx'
import { ErrorText, Muted, PageTitle, Panel, PanelTitle, Row } from '../components/ui.tsx'
import { accountApi, type MemberProfile, type MemberTeams } from '../lib/account.ts'
import { api, ApiError, errorText, type ClubMember } from '../lib/api.ts'
import { memberName } from '../lib/teams.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { accountStrings as t } from '../strings-account.ts'
import { strings } from '../strings.ts'
import { Frame, Gate } from './Frame.tsx'
import { Badge, Plain, Stack } from './TeamBlocks.tsx'

/**
 * 他人檔案頁 (/u/:id, e11-t04, AC-11.1): a member's avatar, name, level, usual system and bio, the
 * same profile 淡江牌桌's card shows, with their teams and active partnerships. Only signed-in
 * members see it, like every other page about the club's people (the forum is members-only in M1).
 * Their latest posts join it with the forum (G3); their boards stay on the table's card.
 */
export function MemberPage() {
  return (
    <Frame>
      <Gate need="member">
        <Member />
      </Gate>
    </Frame>
  )
}

type Loaded = { id: string; member: MemberProfile; teams: MemberTeams; members: ClubMember[] } | { id: string; error: string }

function Member() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    let current = true
    Promise.all([accountApi.member(id), accountApi.memberTeams(id), api.club.members()]).then(
      ([member, teams, members]) => current && setLoaded({ id, member, teams, members }),
      (e) => current && setLoaded({ id, error: e instanceof ApiError && e.status === 404 ? t.memberGone : errorText(e) }),
    )
    return () => {
      current = false
    }
  }, [id])

  const ready = loaded && loaded.id === id ? loaded : null
  const name = ready && 'member' in ready ? ready.member.profile.displayName || ready.member.username : undefined
  usePageTitle(name ?? t.memberTitle)

  if (!ready) return <Muted role="status">{strings.loading}</Muted>
  if ('error' in ready) return <ErrorText role="alert">{ready.error}</ErrorText>
  const { member, teams, members } = ready
  const { profile } = member
  const mine = user?.id === member.id
  const live = teams.teams.filter((team) => !team.archived)
  const archived = teams.teams.filter((team) => team.archived)

  return (
    <>
      <Header>
        <Avatar id={member.id} name={name!} size={96} avatar={member.avatar} />
        <div>
          <Title>
            {name}
            {mine && <Muted as="span">{t.you}</Muted>}
          </Title>
          {profile.displayName && <Muted>{t.username(member.username)}</Muted>}
          <Facts>
            {profile.level && (
              <div>
                <dt>{t.level}</dt>
                <dd>{t.levels[profile.level]}</dd>
              </div>
            )}
            {profile.system && (
              <div>
                <dt>{t.system}</dt>
                <dd>{profile.system}</dd>
              </div>
            )}
          </Facts>
        </div>
      </Header>
      {mine && (
        <Muted>
          <Link to="/account">{t.editMine}</Link>
        </Muted>
      )}

      <Panel aria-labelledby="member-bio">
        <PanelTitle id="member-bio">{t.bio}</PanelTitle>
        {profile.bio ? <Bio>{profile.bio}</Bio> : <Muted>{t.noBio}</Muted>}
      </Panel>

      <Panel aria-labelledby="member-teams">
        <PanelTitle id="member-teams">{t.teams}</PanelTitle>
        <Stack>
          {teams.teams.length ? (
            <Plain aria-label={t.teams}>
              {[...live, ...archived].map((team) => (
                <li key={team.id}>
                  <Row>
                    <Link to={`/teams/${encodeURIComponent(team.id)}`}>{team.name}</Link>
                    {team.captainId === member.id && <Badge>{t.captain}</Badge>}
                    {team.archived && <Badge>{t.archived}</Badge>}
                  </Row>
                </li>
              ))}
            </Plain>
          ) : (
            <Muted>{t.noTeams}</Muted>
          )}
        </Stack>
      </Panel>

      <Panel aria-labelledby="member-pairs">
        <PanelTitle id="member-pairs">{t.pairs}</PanelTitle>
        {teams.pairs.length ? (
          <Plain aria-label={t.pairs}>
            {teams.pairs.map((pair) => {
              const partner = pair.userIds.find((u) => u !== member.id) ?? pair.userIds[0]
              const team = teams.teams.find((x) => x.id === pair.teamId)
              return (
                <li key={pair.id}>
                  <Link to={`/pairs/${encodeURIComponent(pair.id)}`}>{t.pairWith(memberName(members, partner))}</Link>
                  {team && t.pairTeam(team.name)}
                </li>
              )
            })}
          </Plain>
        ) : (
          <Muted>{t.noPairs}</Muted>
        )}
      </Panel>

      <Muted>{t.postsLater}</Muted>
    </>
  )
}

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(4)};
  margin-bottom: ${({ theme }) => theme.space(4)};

  & p {
    margin: 0;
  }
`

const Title = styled(PageTitle)`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.space(2)};
  margin-bottom: ${({ theme }) => theme.space(1)};
  font-family: ${({ theme }) => theme.fonts.heading};
`

const Facts = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(4)};
  margin: ${({ theme }) => theme.space(2)} 0 0;

  & > div {
    display: flex;
    gap: ${({ theme }) => theme.space(2)};
  }

  & dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  & dd {
    margin: 0;
    font-weight: 600;
  }
`

const Bio = styled.p`
  margin: 0;
  white-space: pre-line;
  overflow-wrap: anywhere;
`
