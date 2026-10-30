import { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { errorText, type BookAnalyticsView, type BookAnalyticsWeek, type BookClientError } from '../../lib/api.ts'
import { formatDateTime } from '../../lib/format.ts'
import { telemetryApi } from '../../lib/telemetryApi.ts'
import { useAuth } from '../../state/AuthContext.tsx'
import { useContent } from '../../state/ContentContext.tsx'
import { strings } from '../../strings.ts'
import { mobile } from '../../styles/tokens.ts'
import { DataTable, TableScroll } from '../DataTable.tsx'
import { Button, ErrorText, Muted, Notice, Panel, PanelTitle, Row } from '../ui.tsx'
import { telemetryStrings as t } from './telemetryStrings.ts'

/**
 * 錯誤回報 (e10-t06) on the admin page: the browsers' errors the Worker kept, newest first, each
 * with how often it came in; the stack opens under the message. Editors and admins clear them.
 */
export function ErrorsPanel() {
  const [errors, setErrors] = useState<BookClientError[] | null>(null)
  // Loading failed: said quietly, as a panel among many; a failed action is an alert
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [confirming, setConfirming] = useState(false)

  const load = useCallback(
    () =>
      telemetryApi.errors().then(
        (list) => setErrors(list),
        (e) => setLoadError(errorText(e)),
      ),
    [],
  )
  useEffect(() => {
    void load()
  }, [load])

  const clear = async () => {
    setError('')
    try {
      await telemetryApi.clearErrors()
      setConfirming(false)
      setErrors([])
      setNotice(t.cleared)
    } catch (e) {
      setError(errorText(e))
    }
  }

  return (
    <Panel aria-labelledby="admin-errors">
      <PanelTitle id="admin-errors">{t.errorsTitle}</PanelTitle>
      <Muted>{t.errorsIntro}</Muted>
      {loadError && <ErrorText>{loadError}</ErrorText>}
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {notice && <Notice role="status">{notice}</Notice>}
      {!errors && !loadError && <Muted role="status">{strings.loading}</Muted>}
      {errors && !errors.length && <Muted>{t.noErrors}</Muted>}
      {errors && errors.length > 0 && (
        <>
          <TableScroll>
            <DataTable>
              <thead>
                <tr>
                  <th>{t.at}</th>
                  <th>{t.kind}</th>
                  <th>{t.message}</th>
                  <th>{t.count}</th>
                  <th>{t.page}</th>
                  <th>{t.version}</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((e) => (
                  <tr key={e.id}>
                    <NoWrap>{formatDateTime(e.at)}</NoWrap>
                    <NoWrap>{t.kinds[e.kind] ?? e.kind}</NoWrap>
                    <Message>
                      {e.stack ? (
                        <details>
                          <summary>{e.message}</summary>
                          <Stack aria-label={t.stack}>{e.stack}</Stack>
                        </details>
                      ) : (
                        e.message
                      )}
                      {e.source && (
                        <Small>
                          {t.source}
                          {e.source}
                        </Small>
                      )}
                    </Message>
                    <td>{e.count}</td>
                    <Code>{e.page ?? strings.never}</Code>
                    <Code title={e.version}>{e.version?.slice(0, 7) ?? strings.never}</Code>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </TableScroll>
          {confirming ? (
            <Row>
              <span>{t.confirmClear}</span>
              <Button type="button" $small $variant="danger" onClick={() => void clear()}>
                {strings.confirm}
              </Button>
              <Button type="button" $small onClick={() => setConfirming(false)}>
                {strings.cancel}
              </Button>
            </Row>
          ) : (
            <div>
              <Button type="button" $small onClick={() => (setNotice(''), setConfirming(true))}>
                {t.clear}
              </Button>
            </div>
          )}
        </>
      )}
    </Panel>
  )
}

/**
 * 使用統計 (e10-t07): weekly readers and page views, the conventions opened and the searches made
 * most in the last 28 days, profile switches and practice answers. Admins also get the club's
 * switch, which turns collecting off for everyone.
 */
export function AnalyticsPanel() {
  const { user } = useAuth()
  const { conventions } = useContent()
  const [view, setView] = useState<BookAnalyticsView | null>(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    telemetryApi.analytics().then(setView, (e) => setLoadError(errorText(e)))
  }, [])

  const toggle = async (enabled: boolean) => {
    setError('')
    setBusy(true)
    try {
      setView(await telemetryApi.setAnalytics(enabled))
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  const name = (slug: string) => conventions.find((c) => c.slug === slug)?.nameZh ?? slug

  return (
    <Panel aria-labelledby="admin-analytics">
      <PanelTitle id="admin-analytics">{t.analyticsTitle}</PanelTitle>
      <Muted>{t.analyticsIntro}</Muted>
      {loadError && <ErrorText>{loadError}</ErrorText>}
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {!view && !loadError && <Muted role="status">{strings.loading}</Muted>}
      {view && (
        <>
          {user?.admin && (
            <div>
              <label>
                <input type="checkbox" checked={view.enabled} disabled={busy} onChange={(e) => void toggle(e.target.checked)} />{' '}
                {t.clubSwitch}
              </label>
              <Muted>{t.clubSwitchHint}</Muted>
            </div>
          )}
          {!view.enabled && <Notice>{t.analyticsOff}</Notice>}

          <Charts>
            <WeekBars title={`${t.weekly}${t.visitors}`} weeks={view.weeks} value={(w) => w.visitors} />
            <WeekBars title={`${t.weekly}${t.pages}`} weeks={view.weeks} value={(w) => w.pages} />
          </Charts>
          <Muted>{t.visitorsHint}</Muted>
          <details>
            <summary>{`${t.weekly}${t.visitors}與${t.pages}（表格）`}</summary>
            <TableScroll>
              <DataTable>
                <thead>
                  <tr>
                    <th>{t.week}</th>
                    <th>{t.visitors}</th>
                    <th>{t.pages}</th>
                  </tr>
                </thead>
                <tbody>
                  {view.weeks.map((w) => (
                    <tr key={w.week}>
                      <td>{w.week}</td>
                      <td>{w.visitors}</td>
                      <td>{w.pages}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </TableScroll>
          </details>

          <Subtitle>{t.last28}</Subtitle>
          <Facts>
            <div>
              <dt>{t.profileSwitches}</dt>
              <dd>{t.timesCount(view.profileSwitches)}</dd>
            </div>
            <div>
              <dt>{t.quiz}</dt>
              <dd>{t.quizSummary(view.quiz.answered, view.quiz.correct)}</dd>
            </div>
          </Facts>
          <Lists>
            <Ranked
              caption={t.topConventions}
              head={[strings.kinds.convention, t.views]}
              rows={view.topConventions.map((c) => [name(c.slug), c.views])}
            />
            <Ranked caption={t.topSearches} head={[t.query, t.times]} rows={view.topSearches.map((s) => [s.query, s.count])} />
          </Lists>
        </>
      )}
    </Panel>
  )
}

/** One measure a week as columns; the numbers are in the table under the charts and in each column's title */
function WeekBars({ title, weeks, value }: { title: string; weeks: BookAnalyticsWeek[]; value: (w: BookAnalyticsWeek) => number }) {
  const max = Math.max(1, ...weeks.map(value))
  const last = weeks.at(-1)
  return (
    <Figure>
      <figcaption>
        {title}
        {last && <strong>{value(last)}</strong>}
      </figcaption>
      <Bars aria-hidden="true">
        {weeks.map((w) => (
          <Column key={w.week} title={`${t.weekOf(w.week)}：${value(w)}`}>
            <span style={{ height: `${(value(w) / max) * 100}%` }} />
          </Column>
        ))}
      </Bars>
      {weeks.length > 0 && (
        <Axis aria-hidden="true">
          <span>{t.weekOf(weeks[0].week)}</span>
          <span>{t.weekOf(weeks[weeks.length - 1].week)}</span>
        </Axis>
      )}
    </Figure>
  )
}

function Ranked({ caption, head, rows }: { caption: string; head: [string, string]; rows: [string, number][] }) {
  return (
    <div>
      <Subtitle as="h4">{caption}</Subtitle>
      {rows.length ? (
        <DataTable>
          <thead>
            <tr>
              <th>{head[0]}</th>
              <th>{head[1]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, n]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>{n}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      ) : (
        <Muted>{t.none}</Muted>
      )}
    </div>
  )
}

const NoWrap = styled.td`
  white-space: nowrap;
`

const Message = styled.td`
  min-width: 16rem;
  overflow-wrap: anywhere;

  summary {
    cursor: pointer;
  }
`

const Code = styled.td`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.8125rem;
  overflow-wrap: anywhere;
`

const Stack = styled.pre`
  max-height: 16rem;
  overflow: auto;
  margin: ${({ theme }) => theme.space(2)} 0 0;
  padding: ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.75rem;
  white-space: pre-wrap;
`

const Small = styled.small`
  display: block;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.75rem;
`

const Charts = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space(5)};

  ${mobile} {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Figure = styled.figure`
  margin: 0;

  figcaption {
    display: flex;
    justify-content: space-between;
    margin-bottom: ${({ theme }) => theme.space(2)};
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.875rem;
  }
  strong {
    color: ${({ theme }) => theme.colors.text};
    font-variant-numeric: tabular-nums;
  }
`

/** Thin columns with a 2px gap, rounded at the top, on a quiet baseline */
const Bars = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 8rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Column = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-end;
  height: 100%;

  span {
    width: 100%;
    min-height: 1px;
    border-radius: 4px 4px 0 0;
    background: ${({ theme }) => theme.colors.primary};
  }
  &:hover span {
    background: ${({ theme }) => theme.colors.primaryStrong};
  }
`

const Axis = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.space(1)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.75rem;
`

const Subtitle = styled.h3`
  margin: ${({ theme }) => theme.space(4)} 0 ${({ theme }) => theme.space(2)};
  font-size: 0.9375rem;
`

const Facts = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(5)};
  margin: 0;

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.8125rem;
  }
  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }
`

const Lists = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space(5)};

  ${mobile} {
    grid-template-columns: minmax(0, 1fr);
  }
`
