import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { DataTable, TableScroll } from '../components/DataTable.tsx'
import {
  Button,
  ErrorText,
  Field,
  Muted,
  Notice,
  PageTitle,
  Panel,
  PanelTitle,
  Row,
  Select,
} from '../components/ui.tsx'
import {
  api,
  CLUB_PROFILE_ID,
  errorText,
  type ProfileSummary,
  type RobotMeaningsItem,
  type SystemSpecStatus,
} from '../lib/api.ts'
import { formatCall } from '../lib/calls.ts'
import { formatDateTime } from '../lib/format.ts'
import {
  FILLABLE,
  filledTargets,
  unresolvedTarget,
  type ConditionsTarget,
} from '../lib/handConditions.ts'
import { resolveProfile, summaryChain } from '../lib/profiles.ts'
import {
  batches,
  compareSpec,
  meaningQueries,
  sameSpec,
  unresolvedByReason,
  type Mismatch,
} from '../lib/specReport.ts'
import {
  SPEC_ANY,
  toSystemSpec,
  type SpecRange,
  type SpecShows,
  type SpecSuit,
  type SystemSpec,
} from '../lib/systemSpec.ts'
import { SYSTEM_SPEC_LIMITS, tableSync } from '../lib/tableSync.ts'
import { useContent } from '../state/ContentContext.tsx'
import { Frame, Gate } from './Frame.tsx'
import { HandConditionsForm } from './HandConditionsForm.tsx'
import { tableReport as t } from './tableReportStrings.ts'

/**
 * 牌桌整合 (/integrations/table, E7 e7-t03 e7-t04, AC-7.2): an editor picks a system profile; the
 * page turns its conventions (the club's content, bundled and online, with the profile applied)
 * into the robot's rules with `toSystemSpec`, syncs them to the table on request, and lists the
 * rules TKB's own rules disagree with or lack (asked a few auctions at a time) and the rows that
 * did not become rules. It shows what the conversion gives, word for word, and changes nothing in
 * the handbook (CLAUDE.md rule 1).
 */
export function TableReportPage() {
  return (
    <Frame title={t.title}>
      <PageTitle>{t.title}</PageTitle>
      <Gate need="bookEdit">
        <Report />
      </Gate>
    </Frame>
  )
}

type Compare = { done: number; all: number; answers: RobotMeaningsItem[]; error?: string }

function Report() {
  const content = useContent()
  const [profiles, setProfiles] = useState<ProfileSummary[] | null>(null)
  const [profileId, setProfileId] = useState<string>('')
  const [status, setStatus] = useState<SystemSpecStatus | null>(null)
  const [spec, setSpec] = useState<SystemSpec | null>(null)
  const [compare, setCompare] = useState<Compare | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [syncing, setSyncing] = useState(false)
  /** Bumped after hand conditions are saved, so the rules are made again (e7-t08) */
  const [revision, setRevision] = useState(0)
  /** The row whose hand conditions form is open */
  const [open, setOpen] = useState<string | null>(null)
  /** TKB's answers by query, so remaking the rules asks only about new auctions */
  const answered = useRef(new Map<string, RobotMeaningsItem>())
  const load = useRef(content.loadAll)
  useEffect(() => {
    load.current = content.loadAll
  })

  // The profiles, and the one TKB follows to start with
  useEffect(() => {
    let current = true
    Promise.all([api.book.profiles(), tableSync.status()]).then(
      ([list, first]) => {
        if (!current) return
        setProfiles(list)
        setProfileId(
          list.some((p) => p.id === first.tableProfileId) ? first.tableProfileId : CLUB_PROFILE_ID,
        )
      },
      (e) => current && setError(errorText(e)),
    )
    return () => {
      current = false
    }
  }, [])

  // The chosen profile's rules, made now, and what was last synced
  useEffect(() => {
    if (!profileId || !profiles) return
    let current = true
    const chain = summaryChain(profiles, profileId)
    Promise.all([
      load.current(),
      Promise.all(chain.map((s) => api.book.profile(s.id))),
      tableSync.status(profileId),
    ]).then(
      ([all, fetched, synced]) => {
        if (!current) return
        const resolution = resolveProfile(fetched, profileId, all)
        setSpec(toSystemSpec(resolution.conventions, resolution.profile))
        setStatus(synced)
      },
      (e) => current && setError(errorText(e)),
    )
    return () => {
      current = false
    }
  }, [profileId, profiles, revision])

  const choose = (id: string) => {
    setProfileId(id)
    setSpec(null)
    setStatus(null)
    setCompare(null)
    setNotice('')
    setError('')
  }

  // TKB's meanings for every auction, a few at a time
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!spec) return
    let current = true
    const cache = answered.current
    const queries = meaningQueries(spec)
    const answers = queries.flatMap((q) => cache.get(JSON.stringify(q)) ?? [])
    const asked = queries.filter((q) => !cache.has(JSON.stringify(q)))
    const groups = batches(asked, SYSTEM_SPEC_LIMITS.meaningItemsMax)
    const all = queries.length
    if (!groups.length) setCompare({ done: all, all, answers })
    void (async () => {
      for (const group of groups) {
        try {
          const got = await tableSync.robotMeanings(group)
          for (const q of group) {
            const item = got.find((a) => a.after === q.after)
            if (item) cache.set(JSON.stringify(q), item)
          }
          answers.push(...got)
        } catch (e) {
          if (current)
            setCompare({ done: answers.length, all, answers: [...answers], error: errorText(e) })
          return
        }
        if (!current) return
        setCompare({ done: answers.length, all, answers: [...answers] })
      }
    })()
    return () => {
      current = false
    }
  }, [spec, attempt])

  const sync = useCallback(async () => {
    if (!spec) return
    setSyncing(true)
    setError('')
    setNotice('')
    try {
      setStatus(await tableSync.sync(spec))
      setNotice(t.syncedNow)
    } catch (e) {
      setError(errorText(e))
    } finally {
      setSyncing(false)
    }
  }, [spec])

  const mismatches = useMemo(
    () => (spec && compare ? compareSpec(spec, compare.answers) : []),
    [spec, compare],
  )
  const differ = mismatches.filter((m) => m.robot)
  const missing = mismatches.filter((m) => !m.robot)
  const afters = useMemo(() => (spec ? meaningQueries(spec).length : 0), [spec])
  const retry = () => {
    setCompare(null)
    setAttempt((a) => a + 1)
  }
  const [filledNotice, setFilledNotice] = useState('')
  const conditionsSaved = async (message: string) => {
    setOpen(null)
    await content.reload()
    setFilledNotice(message)
    setRevision((r) => r + 1)
  }
  const filled = useMemo(() => (spec ? filledTargets(spec) : []), [spec])
  const conditionsForm = (key: string, target: ConditionsTarget, hasConditions: boolean, columns: number) =>
    open === key && (
      <tr>
        <td colSpan={columns}>
          <HandConditionsForm
            target={target}
            filled={hasConditions}
            onDone={(message) => void conditionsSaved(message)}
            onCancel={() => setOpen(null)}
          />
        </td>
      </tr>
    )
  const nameOf = (id: string) => profiles?.find((p) => p.id === id)?.name ?? id
  const conventionName = (slug: string) => content.bySlug(slug)?.nameZh ?? slug

  if (!profiles)
    return error ? (
      <ErrorText role="alert">{error}</ErrorText>
    ) : (
      <Muted role="status">{t.converting}</Muted>
    )

  return (
    <>
      <Muted>{t.intro}</Muted>
      <Panel aria-labelledby="sync">
        <PanelTitle id="sync">{t.profile}</PanelTitle>
        <Row>
          <Field>
            {t.profile}
            <Select value={profileId} onChange={(e) => choose(e.target.value)}>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        </Row>
        {status && <Muted>{t.tableFollows(nameOf(status.tableProfileId))}</Muted>}
        {!spec || !status ? (
          !error && <Muted role="status">{t.converting}</Muted>
        ) : (
          <>
            <p>
              {status.synced
                ? t.synced(
                    formatDateTime(status.synced.syncedAt),
                    status.synced.syncedByName ?? status.synced.syncedBy,
                  )
                : t.neverSynced}
              {status.synced && ` ${sameSpec(status.synced.spec, spec) ? t.upToDate : t.outOfDate}`}
            </p>
            <Row>
              <Button
                type="button"
                $variant="primary"
                disabled={syncing}
                onClick={() => void sync()}
              >
                {syncing ? t.syncing : t.sync}
              </Button>
            </Row>
          </>
        )}
        {notice && <Notice role="status">{notice}</Notice>}
        {error && <ErrorText role="alert">{error}</ErrorText>}
      </Panel>

      {spec && (
        <Panel aria-labelledby="summary">
          <PanelTitle id="summary">{t.summary}</PanelTitle>
          <p>{t.counts(spec.rules.length, spec.unresolved.length)}</p>
          <p role="status">
            {(compare ? compare.done < compare.all && !compare.error : afters > 0)
              ? t.comparing(compare?.done ?? 0, compare?.all ?? afters)
              : t.compared(differ.length, missing.length)}
          </p>
          {compare?.error && (
            <ErrorText role="alert">
              {t.compareFailed}
              {compare.error}{' '}
              <Button type="button" $small onClick={retry}>
                {t.retry}
              </Button>
            </ErrorText>
          )}
        </Panel>
      )}

      {spec && compare && (
        <Panel aria-labelledby="differ">
          <PanelTitle id="differ">{t.differTitle}</PanelTitle>
          <Muted>{t.differIntro}</Muted>
          {differ.length ? (
            <MismatchTable rows={differ} conventionName={conventionName} />
          ) : (
            <Muted>{t.noDiffer}</Muted>
          )}
          {missing.length > 0 && (
            <details>
              <summary>
                {t.missingTitle}（{t.rows(missing.length)}）
              </summary>
              <Muted>{t.missingIntro}</Muted>
              <MismatchTable rows={missing} conventionName={conventionName} />
            </details>
          )}
        </Panel>
      )}

      {filledNotice && (
        <Notice role="status">{filledNotice}</Notice>
      )}

      {spec && filled.length > 0 && (
        <Panel aria-labelledby="filled">
          <PanelTitle id="filled">{t.filledTitle}</PanelTitle>
          <Muted>{t.filledIntro}</Muted>
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <th>{t.colConvention}</th>
                  <th>{t.colAuction}</th>
                  <th>{t.colCall}</th>
                  <th>{t.colBook}</th>
                  <th>{t.colConditions}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filled.map((f, i) => (
                  <Fragment key={i}>
                    <tr>
                      <td>
                        <Link to={`/c/${f.ref.slug}/${f.ref.sectionId}`}>{conventionName(f.ref.slug)}</Link>
                      </td>
                      <NoWrap>{f.after.map(auctionText).join(' / ')}</NoWrap>
                      <NoWrap>{f.rules.map((r) => callText(r.call)).join('/')}</NoWrap>
                      <td>{f.text}</td>
                      <td>{f.shows && showsText(f.shows)}</td>
                      <td>
                        <Button
                          type="button"
                          $small
                          aria-label={`${t.edit}：${conventionName(f.ref.slug)} ${f.rules.map((r) => callText(r.call)).join('/')}`}
                          onClick={() => setOpen(`f${i}`)}
                        >
                          {t.edit}
                        </Button>
                      </td>
                    </tr>
                    {conditionsForm(`f${i}`, f, true, 6)}
                  </Fragment>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        </Panel>
      )}

      {spec && spec.unresolved.length > 0 && (
        <Panel aria-labelledby="unresolved">
          <PanelTitle id="unresolved">{t.unresolvedTitle}</PanelTitle>
          <Muted>{t.unresolvedIntro}</Muted>
          {unresolvedByReason(spec).map(({ reason, rows }) => (
            <details key={reason}>
              <summary>
                {t.reason[reason]}（{t.rows(rows.length)}）
              </summary>
              <TableScroll>
                <Table>
                  <thead>
                    <tr>
                      <th>{t.colConvention}</th>
                      <th>{t.colAuction}</th>
                      <th>{t.colCall}</th>
                      <th>{t.colBook}</th>
                      <th>{t.colDetail}</th>
                      {FILLABLE.has(reason) && <th />}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((u, i) => {
                      const target = unresolvedTarget(u)
                      return (
                        <Fragment key={i}>
                          <tr>
                            <td>
                              <Link to={`/c/${u.ref.slug}/${u.ref.sectionId}`}>
                                {conventionName(u.ref.slug)}
                              </Link>
                            </td>
                            <NoWrap>{u.after ? u.after.map(auctionText).join(' / ') : ''}</NoWrap>
                            <NoWrap>{formatCall(u.call)}</NoWrap>
                            <td>{u.text}</td>
                            <td>
                              {[u.detail, u.shows && showsText(u.shows)].filter(Boolean).join(' · ')}
                            </td>
                            {FILLABLE.has(reason) && (
                              <td>
                                {target && (
                                  <Button
                                    type="button"
                                    $small
                                    aria-label={`${t.fill}：${conventionName(u.ref.slug)} ${formatCall(u.call)}`}
                                    onClick={() => setOpen(`u${reason}${i}`)}
                                  >
                                    {t.fill}
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                          {target && conditionsForm(`u${reason}${i}`, target, false, 6)}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </Table>
              </TableScroll>
            </details>
          ))}
        </Panel>
      )}
    </>
  )
}

function MismatchTable({
  rows,
  conventionName,
}: {
  rows: Mismatch[]
  conventionName: (slug: string) => string
}) {
  return (
    <TableScroll>
      <Table>
        <thead>
          <tr>
            <th>{t.colConvention}</th>
            <th>{t.colAuction}</th>
            <th>{t.colCall}</th>
            <th>{t.colBook}</th>
            <th>{t.colRead}</th>
            <th>{t.colTable}</th>
            <th>{t.colDiff}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m, i) => (
            <tr key={i}>
              <td>
                <Link to={`/c/${m.rule.ref.slug}/${m.rule.ref.sectionId}`}>
                  {conventionName(m.rule.ref.slug)}
                </Link>
              </td>
              <NoWrap>{auctionText(m.after)}</NoWrap>
              <NoWrap>{callText(m.rule.call)}</NoWrap>
              <td>{m.rule.text}</td>
              <td>{showsText(m.rule.shows)}</td>
              <td>{m.robot ? m.robot.text : t.noRule}</td>
              <td>{m.fields.map((f) => t.field[f]).join('、')}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableScroll>
  )
}

const SUIT: Record<SpecSuit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }

/** '1N' → '1NT', '2S' → '2♠', 'P' → 'Pass'; the robot's notation */
function callText(call: string): string {
  if (call === 'P') return 'Pass'
  if (/^[1-7]N$/.test(call)) return `${call}T`
  const suit = call[1] as SpecSuit | undefined
  return /^[1-7][SHDC]$/.test(call) && suit ? `${call[0]}${SUIT[suit]}` : call
}

/** '1N (P)' → '1NT（Pass）', '' → （開叫） */
function auctionText(after: string): string {
  if (!after) return t.opening
  return after
    .split(' ')
    .map((token) =>
      token.startsWith('(') ? `（${callText(token.slice(1, -1))}）` : callText(token),
    )
    .join(' ')
}

const range = ([low, high]: SpecRange) =>
  high >= SPEC_ANY ? `${low}+` : low === high ? `${low}` : `${low}-${high}`

/** What the handbook's words were read as: '15-17 點 · ♥5+ · 平均' */
function showsText(shows: SpecShows): string {
  const parts: string[] = []
  if (shows.hcp) parts.push(t.shows.hcp(range(shows.hcp)))
  for (const suit of ['S', 'H', 'D', 'C'] as const) {
    const len = shows.len?.[suit]
    if (len) parts.push(`${SUIT[suit]}${range(len)}`)
  }
  if (shows.balanced) parts.push(t.shows.balanced)
  if (shows.forcing) parts.push(t.shows[shows.forcing])
  if (shows.name) parts.push(shows.name)
  return parts.join(' · ')
}


/** Smaller and top-aligned: a row's meaning can run to several lines */
const Table = styled(DataTable)`
  font-size: 0.875rem;

  th,
  td {
    padding: ${({ theme }) => theme.space(2)};
    vertical-align: top;
  }
`

const NoWrap = styled.td`
  white-space: nowrap;
`
