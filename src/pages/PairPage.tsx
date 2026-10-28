import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, ErrorText, Field, Muted, Notice, PageTitle, Panel, PanelTitle, Row, Select } from '../components/ui.tsx'
import {
  api,
  CLUB_PROFILE_ID,
  errorText,
  type ClubMember,
  type ClubTeam,
  type Partnership,
  type ProfileAccess,
  type ProfileSummary,
  type SystemProfile,
} from '../lib/api.ts'
import { formatDateTime } from '../lib/format.ts'
import { copyProfile, copySources, isFresh, pairName, profileDiff } from '../lib/teams.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { strings } from '../strings.ts'
import { Frame, Gate } from './Frame.tsx'
import { Badge, MemberChip, Plain, ProfileEntries, Stack } from './TeamBlocks.tsx'
import { teamStrings as t } from './teamStrings.ts'

/**
 * 搭檔頁 (/pairs/:id, e2-t06, AC-2.5): the two partners, their team, and the partnership's profile:
 * what it changes, the ways into it, and copying another team's or partnership's into it (e2-t09,
 * AC-2.7). A pending invitation is answered here (the table's notification links to this page).
 */
export function PairPage() {
  return (
    <Frame>
      <Gate need="member">
        <Pair />
      </Gate>
    </Frame>
  )
}

interface Loaded {
  id: string
  pair: Partnership
  members: ClubMember[]
  team?: ClubTeam
  profile: SystemProfile | null
  access?: ProfileAccess
  summaries: ProfileSummary[]
}

async function fetchPair(id: string): Promise<Loaded> {
  const [pair, members, teams] = await Promise.all([api.club.pair(id), api.club.members(), api.club.teams()])
  const [own, summaries] = pair.profileId
    ? await Promise.all([api.book.profileWithAccess(pair.profileId).catch(() => null), api.book.profiles().catch(() => [])])
    : [null, []]
  return {
    id,
    pair,
    members,
    team: teams.find((team) => team.id === pair.teamId),
    profile: own?.profile ?? null,
    access: own?.access,
    summaries,
  }
}

function Pair() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState<Loaded | { id: string; error: string } | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Bumped after a change, to load the partnership again
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let current = true
    fetchPair(id).then(
      (next) => current && setLoaded(next),
      (e) => current && setLoaded({ id, error: errorText(e) }),
    )
    return () => {
      current = false
    }
  }, [id, tick])

  const ready = loaded && loaded.id === id && 'pair' in loaded ? loaded : null
  usePageTitle(ready ? pairName(ready.members, ready.pair.userIds) : t.pairTitle)

  const run = async (work: () => Promise<unknown>, done?: string) => {
    setError('')
    setNotice('')
    try {
      await work()
      setTick((n) => n + 1)
      if (done) setNotice(done)
    } catch (e) {
      setError(errorText(e))
    }
  }

  // A declined or withdrawn invitation is gone, so the member goes back to their partnerships
  const leave = async (work: () => Promise<unknown>) => {
    setError('')
    try {
      await work()
      navigate('/account#my-teams', { replace: true })
    } catch (e) {
      setError(errorText(e))
    }
  }

  if (!loaded || loaded.id !== id) return <Muted role="status">{strings.loading}</Muted>
  if ('error' in loaded) return <ErrorText role="alert">{loaded.error}</ErrorText>
  const { pair, members, team, profile, access, summaries } = loaded
  const name = pairName(members, pair.userIds)
  const [inviterId, inviteeId] = pair.userIds
  const isMember = !!user && pair.userIds.includes(user.id)
  const date = (ms?: number) => (ms ? formatDateTime(ms) : '')

  return (
    <>
      <Row>
        <PageTitle>{name}</PageTitle>
        <Badge>{t.status[pair.status]}</Badge>
      </Row>

      <Panel aria-labelledby="pair-who">
        <PanelTitle id="pair-who">{t.pairTitle}</PanelTitle>
        <Stack>
          <Plain aria-label={t.pairTitle}>
            {pair.userIds.map((userId) => (
              <li key={userId}>
                <MemberChip members={members} id={userId} />
              </li>
            ))}
          </Plain>
          <Muted>
            {t.team}：{team ? <Link to={`/teams/${encodeURIComponent(team.id)}`}>{team.name}</Link> : t.noTeam}
          </Muted>
          {pair.acceptedAt && <Muted>{t.since(date(pair.acceptedAt))}</Muted>}
          {pair.endedAt && <Muted>{t.endedAt(date(pair.endedAt))}</Muted>}
          {error && <ErrorText role="alert">{error}</ErrorText>}
          {notice && <Notice role="status">{notice}</Notice>}

          {pair.status === 'pending' && user?.id === inviteeId && (
            <>
              <Muted>{t.invitedYou(pairName(members, [inviterId]))}</Muted>
              <Row>
                <Button type="button" $variant="primary" onClick={() => void run(() => api.club.accept(pair.id))}>
                  {t.accept}
                </Button>
                <Button type="button" onClick={() => void leave(() => api.club.decline(pair.id))}>
                  {t.decline}
                </Button>
              </Row>
            </>
          )}
          {pair.status === 'pending' && user?.id === inviterId && (
            <>
              <Muted>{t.waiting(pairName(members, [inviteeId]))}</Muted>
              <Row>
                <Button type="button" onClick={() => void leave(() => api.club.end(pair.id))}>
                  {t.withdraw}
                </Button>
              </Row>
            </>
          )}
          {pair.status === 'active' && isMember && (
            <Row>
              <Button
                type="button"
                $variant="danger"
                onClick={() => {
                  if (window.confirm(t.endConfirm)) void run(() => api.club.end(pair.id))
                }}
              >
                {t.end}
              </Button>
            </Row>
          )}
        </Stack>
      </Panel>

      {pair.profileId && (
        <Panel aria-labelledby="pair-profile">
          <PanelTitle id="pair-profile">{t.summary}</PanelTitle>
          {profile ? (
            <Stack>
              <Summary profile={profile} summaries={summaries} />
              {pair.status === 'ended' && <Muted>{t.endedNote}</Muted>}
              <ProfileEntries profileId={profile.id} name={profile.name} access={access} />
            </Stack>
          ) : (
            <Muted>{t.hidden}</Muted>
          )}
        </Panel>
      )}

      {profile && access?.edit && pair.status === 'active' && (
        <CopyPanel profile={profile} summaries={summaries} onCopied={(from) => run(async () => {}, t.copied(from))} />
      )}
    </>
  )
}

/** 這對的制度: what the profile adopts and overrides on its own, its parent, and when it was saved */
function Summary({ profile, summaries }: { profile: SystemProfile; summaries: ProfileSummary[] }) {
  const diff = profileDiff(profile)
  const parentId = profile.parentId ?? CLUB_PROFILE_ID
  const parent = summaries.find((s) => s.id === parentId)
  return (
    <Plain aria-label={t.summary}>
      <li>{profile.name}</li>
      <li>{t.parent(parent?.name ?? parentId)}</li>
      <li>{t.summaryAdopted(diff.on + diff.off)}</li>
      <li>{t.summaryOff(diff.off)}</li>
      <li>{t.summaryOverrides(diff.overrides)}</li>
      <li>{t.updated(formatDateTime(profile.updatedAt))}</li>
    </Plain>
  )
}

/**
 * 從別處複製制度集 (e2-t09, AC-2.7): the adoptions and overrides of a team's or another
 * partnership's profile replace this one's; the notes stay this partnership's own. A new
 * partnership that keeps its team's as they are needs nothing: it already inherits them.
 */
function CopyPanel({
  profile,
  summaries,
  onCopied,
}: {
  profile: SystemProfile
  summaries: ProfileSummary[]
  onCopied: (from: string) => Promise<void>
}) {
  const sources = copySources(summaries, profile)
  const [from, setFrom] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fresh = isFresh(profile)

  const copy = async (event: FormEvent) => {
    event.preventDefault()
    const source = sources.find((s) => s.id === from)
    if (!source || (!fresh && !window.confirm(t.copyReplace))) return
    setBusy(true)
    setError('')
    try {
      const full = await api.book.profile(source.id)
      await api.book.saveProfile(profile.id, copyProfile(profile, full), profile.version, t.copyNote(source.name))
      setFrom('')
      await onCopied(source.name)
    } catch (e) {
      setError(errorText(e))
    }
    setBusy(false)
  }

  return (
    <Panel aria-labelledby="pair-copy">
      <PanelTitle id="pair-copy">{t.copyTitle}</PanelTitle>
      <Stack>
        <Muted>{fresh ? t.copyFresh : t.copyIntro}</Muted>
        {sources.length ? (
          <form onSubmit={(e) => void copy(e)} aria-label={t.copyTitle}>
            <Row>
              <Field>
                {t.copyFrom}
                <Select value={from} onChange={(e) => setFrom(e.target.value)}>
                  <option value="">{t.copyPick}</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {t.copyScope[s.scope]}：{s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button type="submit" disabled={!from || busy}>
                {t.copy}
              </Button>
            </Row>
          </form>
        ) : (
          <Muted>{t.noSources}</Muted>
        )}
        {error && <ErrorText role="alert">{error}</ErrorText>}
      </Stack>
    </Panel>
  )
}
