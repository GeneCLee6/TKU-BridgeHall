import { IdCard, Pencil } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { AuctionTable } from '../components/AuctionTable.tsx'
import { BlockView } from '../components/BlockView.tsx'
import { OriginMark } from '../components/ProfileMarks.tsx'
import { ResponseTable } from '../components/ResponseTable.tsx'
import { RichText } from '../components/Suit.tsx'
import { Button, ErrorText, Muted, Notice, PageTitle, Panel, PanelTitle } from '../components/ui.tsx'
import { api, CLUB_PROFILE_ID, errorText, type ProfileOverride, type SystemProfile } from '../lib/api.ts'
import {
  changesNothing,
  compareProfile,
  type AdoptionChange,
  type Change,
  type ProfileComparison,
} from '../lib/profileCompare.ts'
import { summaryChain, type ProfileProblem, type ResolvedSection } from '../lib/profiles.ts'
import { noticeApi } from '../lib/noticeApi.ts'
import { conventionPath, sectionPath } from '../lib/sections.ts'
import { overrideRef, withoutOverride } from '../lib/teams.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { strings } from '../strings.ts'
import type { Block } from '../types/convention.ts'
import { Frame, Gate } from './Frame.tsx'
import { WithSectionNav } from '../components/SectionNav.tsx'
import { profileCompare as t } from './profileCompareStrings.ts'

/**
 * 與母制度集比較 (/profiles/:id/compare, E1 e1-t15, AC-1.7): what a system profile changes
 * relative to its parent (lib/profileCompare.ts): the conventions it turns off or on, each
 * override with the parent's text next to the overridden one and a link to the place, and every
 * override or note that points at nothing. The club's own content is shown word for word.
 *
 * 建議統一 (e2-t08, AC-2.6): opened from the team page (`?team=&pair=`), the team's captain (or an
 * editor) has a button by each override that tells the partners; their notification opens this page
 * with `?unify=<ref>`, which shows that override on top with a button that drops it.
 */
export function ProfileComparePage() {
  return (
    <Frame title={t.title}>
      <PageTitle>{t.title}</PageTitle>
      <Gate need="member">
        <Compare />
      </Gate>
    </Frame>
  )
}

/** Kept with the id it is for, so another id shows as loading until its own result comes */
type Loaded = { id: string; comparison: ProfileComparison; canEdit: boolean } | { id: string; error: string }

function Compare() {
  const { id = '' } = useParams()
  const content = useContent()
  const { can, user } = useAuth()
  const [params] = useSearchParams()
  const unifyRef = params.get('unify')
  const teamId = params.get('team')
  const pairId = params.get('pair')
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  // Bumped after dropping an override, to compare again
  const [generation, setGeneration] = useState(0)
  /** The team whose captain is looking at one of its partnerships, so may suggest (e2-t08) */
  const [captainOf, setCaptainOf] = useState<{ teamId: string; pairId: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')
  const load = useRef(content.loadAll)
  useEffect(() => {
    load.current = content.loadAll
  })
  const editor = can('bookEdit')

  // The profile, the profiles above it (one that cannot be read is left out, and the comparison
  // says so) and every convention
  useEffect(() => {
    let current = true
    void (async () => {
      try {
        const [all, summaries, { profile, access }] = await Promise.all([
          load.current(),
          api.book.profiles(),
          api.book.profileWithAccess(id),
        ])
        const above =
          profile.id === CLUB_PROFILE_ID ? [] : summaryChain(summaries, profile.parentId ?? CLUB_PROFILE_ID)
        const parents = await Promise.all(above.map((s) => api.book.profile(s.id).catch(() => null)))
        const profiles = [...parents.filter((p): p is SystemProfile => !!p), profile]
        if (current)
          setLoaded({ id, comparison: compareProfile(profiles, profile.id, all), canEdit: access?.edit ?? editor })
      } catch (e) {
        if (current) setLoaded({ id, error: errorText(e) })
      }
    })()
    return () => {
      current = false
    }
  }, [id, editor, generation])

  useEffect(() => {
    if (!teamId || !pairId) return
    let current = true
    api.club.team(teamId).then(
      ({ team, pairs }) => {
        const mine = !team.archived && (editor || team.captainId === user?.id)
        if (current && mine && pairs.some((p) => p.id === pairId && p.profileId === id)) setCaptainOf({ teamId, pairId })
      },
      () => {},
    )
    return () => {
      current = false
    }
  }, [teamId, pairId, id, editor, user?.id])

  if (!loaded || loaded.id !== id) return <Muted role="status">{t.loading}</Muted>
  if ('error' in loaded) return <ErrorText role="alert">{loaded.error}</ErrorText>
  const { comparison, canEdit } = loaded
  const { profile, parent, adoptions, conventions, problems } = comparison
  const name = (slug: string) => content.bySlug(slug)?.nameZh ?? slug
  const off = adoptions.filter((a) => a.value === 'off')
  const on = adoptions.filter((a) => a.value === 'on')

  const act = async (work: () => Promise<string>) => {
    setBusy(true)
    setMessage('')
    setFailure('')
    try {
      setMessage(await work())
    } catch (e) {
      setFailure(errorText(e))
    } finally {
      setBusy(false)
    }
  }
  const suggest =
    captainOf &&
    ((change: Change) =>
      act(async () => {
        const ref = overrideRef(change.override)
        await noticeApi.suggestUnify(captainOf.teamId, { pairId: captainOf.pairId, ref, name: name(change.override.slug) })
        return t.unify.suggested
      }))
  // The override the captain suggested dropping, when it is still there
  const suggested = unifyRef
    ? conventions.flatMap((c) => c.changes.map((change) => ({ slug: c.slug, change }))).find((x) => overrideRef(x.change.override) === unifyRef)
    : undefined
  const revert = () =>
    act(async () => {
      await api.book.saveProfile(profile.id, withoutOverride(profile, unifyRef ?? ''), profile.version, t.unify.revertNote)
      setGeneration((n) => n + 1)
      return t.unify.reverted
    })

  return (
    <>
      <WithSectionNav>
        <Panel aria-labelledby="profile">
          <PanelTitle id="profile">{profile.name}</PanelTitle>
          <Facts>
            <dt>{t.scope}</dt>
            <dd>{strings.profiles.scopes[profile.scope]}</dd>
            <dt>{t.parent}</dt>
            <dd>{parent ? <Link to={`/profiles/${parent.id}/compare`}>{parent.name}</Link> : t.handbook}</dd>
          </Facts>
          <Muted>{t.intro}</Muted>
          <Muted>{t.linkNote}</Muted>
          <Links>
            {canEdit && (
              <Button as={Link} to={`/profiles/${profile.id}/edit`} $small>
                <Pencil size={16} aria-hidden />
                {t.edit}
              </Button>
            )}
            <Button as={Link} to={`/cards/${encodeURIComponent(profile.id)}/wbf`} $small>
              <IdCard size={16} aria-hidden />
              {t.card}
            </Button>
          </Links>
        </Panel>

        {(message || failure) && (
          <div aria-live="polite">
            {message && <Notice role="status">{message}</Notice>}
            {failure && <ErrorText role="alert">{failure}</ErrorText>}
          </div>
        )}

        {unifyRef && !message && (
          <Panel aria-labelledby="unify">
            <PanelTitle id="unify">{t.unify.title}</PanelTitle>
            {suggested ? (
              <>
                <Muted>{t.unify.intro}</Muted>
                <ChangeView slug={suggested.slug} change={suggested.change} />
                {canEdit ? (
                  <Button type="button" $variant="primary" disabled={busy} onClick={revert}>
                    {t.unify.revert(parent?.name ?? t.handbook)}
                  </Button>
                ) : (
                  <Muted>{t.unify.readOnly}</Muted>
                )}
              </>
            ) : (
              <Muted>{t.unify.gone}</Muted>
            )}
          </Panel>
        )}

        {changesNothing(comparison) && <Notice role="status">{t.empty}</Notice>}

        {problems.length > 0 && (
          <Panel aria-labelledby="problems">
            <PanelTitle id="problems">{t.problemsTitle}</PanelTitle>
            <Muted>{t.problemsIntro}</Muted>
            <List>
              {problems.map((p, i) => (
                <li key={i}>
                  <ProblemText problem={p} profiles={[profile, ...(parent ? [parent] : [])]} name={name} />
                </li>
              ))}
            </List>
          </Panel>
        )}

        {adoptions.length > 0 && (
          <Panel aria-labelledby="adoptions">
            <PanelTitle id="adoptions">{t.adoptionsTitle}</PanelTitle>
            <Adoptions title={t.off} list={off} />
            <Adoptions title={t.on} list={on} />
          </Panel>
        )}

        {conventions.length > 0 && (
          <Panel aria-labelledby="overrides">
            <PanelTitle id="overrides">{t.overridesTitle}</PanelTitle>
            {suggest && <Muted>{t.unify.captainIntro}</Muted>}
            {conventions.map((c) => (
              <section key={c.slug} aria-labelledby={`compare-${c.slug}`}>
                <SubTitle id={`compare-${c.slug}`}>
                  <Link to={conventionPath(c.slug)}>{c.name}</Link>
                </SubTitle>
                {!c.played && <Muted>{t.notPlayed}</Muted>}
                {c.changes.map((change, i) => (
                  <ChangeView key={i} slug={c.slug} change={change} suggest={suggest ? () => suggest(change) : undefined} busy={busy} />
                ))}
              </section>
            ))}
          </Panel>
        )}
      </WithSectionNav>
    </>
  )
}

function Adoptions({ title, list }: { title: string; list: AdoptionChange[] }) {
  if (!list.length) return null
  return (
    <section>
      <SubTitle>{title}</SubTitle>
      <List>
        {list.map((a) => (
          <li key={a.slug}>
            <Link to={conventionPath(a.slug)}>{a.name}</Link>
            {a.parentPlays === (a.value === 'on') && <Muted as="span"> {t.sameAsParent}</Muted>}
          </li>
        ))}
      </List>
    </section>
  )
}

function ChangeView({
  slug,
  change,
  suggest,
  busy,
}: {
  slug: string
  change: Change
  /** 建議統一 (e2-t08): the team's captain tells the partners */
  suggest?: () => void
  busy?: boolean
}) {
  const link =
    change.kind === 'meta' ? (
      <Link to={conventionPath(slug)}>{t.goToConvention}</Link>
    ) : (
      <Link to={sectionPath(slug, change.override.sectionId)}>{t.goTo}</Link>
    )
  const heading =
    change.kind === 'meta'
      ? t.overrideKind.meta
      : [...change.trail, ...(change.kind === 'section' ? [change.after.title] : [])].join(' › ')

  return (
    <Item>
      <ItemHead>
        <strong>
          {change.kind !== 'meta' && <Kind>{t.overrideKind[change.kind]}</Kind>}
          <RichText text={heading} />
        </strong>
        <span>
          {link}
          {suggest && (
            <Suggest type="button" $small disabled={busy} onClick={suggest} aria-label={t.unify.suggestLabel(heading)}>
              {t.unify.suggest}
            </Suggest>
          )}
        </span>
      </ItemHead>
      {change.kind === 'row' && (
        <>
          {change.caption && (
            <p>
              <RichText text={change.caption} />
            </p>
          )}
          {change.auction && <AuctionTable auction={change.auction} />}
          <Sides>
            <Side label={t.before}>
              {change.before ? <ResponseTable rows={[change.before]} /> : <Muted>{t.inReplaced}</Muted>}
            </Side>
            <Side label={t.after}>
              <ResponseTable rows={[change.after]} />
            </Side>
          </Sides>
        </>
      )}
      {change.kind === 'section' && (
        <Sides>
          <Side label={t.before}>{change.before ? <SectionText section={change.before} /> : <Muted>{t.noSection}</Muted>}</Side>
          <Side label={t.after}>
            <SectionText section={change.after} />
          </Side>
        </Sides>
      )}
      {change.kind === 'meta' && (
        <Sides>
          {(
            [
              [t.before, change.before],
              [t.after, change.after],
            ] as const
          ).map(([label, meta]) => (
            <Side key={label} label={label}>
              <Facts>
                <dt>{t.summary}</dt>
                <dd>
                  <RichText text={meta.summary} />
                </dd>
                <dt>{t.tags}</dt>
                <dd>{meta.tags.length ? meta.tags.join('、') : t.noTags}</dd>
              </Facts>
            </Side>
          ))}
        </Sides>
      )}
    </Item>
  )
}

function Side({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <BoxLabel>{label}</BoxLabel>
      {children}
    </Box>
  )
}

/** A section with everything in it, open and without accordions */
function SectionText({ section }: { section: ResolvedSection }) {
  return (
    <div>
      <SectionTitle>
        <RichText text={section.title} />
        <OriginMark origin={section.origin} />
      </SectionTitle>
      {section.summary && (
        <Muted>
          <RichText text={section.summary} />
        </Muted>
      )}
      {section.blocks?.map((block, i) => <BlockView key={i} block={block as Block} />)}
      {section.children && (
        <Nested>
          {section.children.map((child) => (
            <SectionText key={child.id} section={child} />
          ))}
        </Nested>
      )}
    </div>
  )
}

/** What went wrong, and where the override or note pointed */
function ProblemText({
  problem: p,
  profiles,
  name,
}: {
  problem: ProfileProblem
  profiles: SystemProfile[]
  name: (slug: string) => string
}) {
  const profileName = (id: string) => profiles.find((x) => x.id === id)?.name ?? id
  switch (p.kind) {
    case 'missingProfile':
      return t.problem.missingProfile(p.profileId)
    case 'missingParent':
      return t.problem.missingParent(profileName(p.profileId), p.parentId)
    case 'cycle':
      return t.problem.cycle(profileName(p.profileId), p.parentId)
    case 'unknownAdoption':
      return t.problem.unknownAdoption(p.slug)
    case 'brokenOverride':
      return (
        <>
          <strong>{t.problem.brokenOverride[p.missing]}</strong>：{t.overrideKind[p.override.kind]} ·{' '}
          <Place slug={p.override.slug} override={p.override} missing={p.missing === 'convention'} name={name} />
          {p.override.kind === 'row' && (
            <>
              {' '}
              → <RichText text={p.override.meaning} />
            </>
          )}
        </>
      )
    case 'brokenNote':
      return (
        <>
          <strong>{t.problem.brokenNote[p.missing]}</strong>：
          <Place slug={p.note.slug} missing={p.missing === 'convention'} name={name} sectionId={p.note.sectionId} /> ·{' '}
          {p.note.text}
        </>
      )
  }
}

function Place({
  slug,
  override,
  sectionId = override && override.kind !== 'meta' ? override.sectionId : undefined,
  missing,
  name,
}: {
  slug: string
  override?: ProfileOverride
  sectionId?: string
  missing: boolean
  name: (slug: string) => string
}) {
  const row = override?.kind === 'row' ? override : undefined
  return (
    <>
      {missing ? slug : <Link to={conventionPath(slug)}>{name(slug)}</Link>}
      {sectionId !== undefined && ` · ${t.place(sectionId, row?.blockIndex, row?.rowIndex)}`}
    </>
  )
}

const Links = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(4)};
  margin: 0;
`

const Facts = styled.dl`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(3)};
  margin: 0 0 ${({ theme }) => theme.space(3)};

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }
  dd {
    margin: 0;
  }
`

const List = styled.ul`
  margin: 0 0 ${({ theme }) => theme.space(3)};
  padding-left: ${({ theme }) => theme.space(5)};

  li + li {
    margin-top: ${({ theme }) => theme.space(1)};
  }
`

const SubTitle = styled.h3`
  margin: ${({ theme }) => theme.space(4)} 0 ${({ theme }) => theme.space(2)};
  font-size: 1.0625rem;
`

const Item = styled.article`
  margin: 0 0 ${({ theme }) => theme.space(4)};
  padding-top: ${({ theme }) => theme.space(3)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const ItemHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space(2)};
`

const Suggest = styled(Button)`
  margin-left: ${({ theme }) => theme.space(3)};
`

const Kind = styled.span`
  margin-right: ${({ theme }) => theme.space(2)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
  font-weight: 500;
`

/** Before and after side by side where there is room, one above the other on a phone */
const Sides = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: ${({ theme }) => theme.space(3)};
`

const Box = styled.div`
  min-width: 0;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  overflow-x: auto;
`

const BoxLabel = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(1)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
  font-weight: 600;
`

const SectionTitle = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(1)};
  font-weight: 600;
`

const Nested = styled.div`
  margin-top: ${({ theme }) => theme.space(2)};
  padding-left: ${({ theme }) => theme.space(3)};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
`
