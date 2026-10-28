import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { CallLabel, RichText } from '../components/Suit.tsx'
import { Button, ErrorText, Muted, PageTitle, Panel, PanelTitle, Row } from '../components/ui.tsx'
import { percent, quizStats, WRONG_PATH } from '../lib/quizRecords.ts'
import { practicePath } from '../lib/quiz.ts'
import { sectionPath } from '../lib/sections.ts'
import { useProfiles } from '../state/ProfileContext.tsx'
import { Frame } from './Frame.tsx'
import { usePracticeQuizzes, useQuizRounds } from './practiceData.ts'
import { practiceStrings as p } from './practiceStrings.ts'

/**
 * 成績與錯題本 (/practice/scores, E6 e6-t05, AC-6.4): the reader's share right, overall and by
 * convention (weakest first), and 錯題本: every question whose last answer was wrong, with its
 * answer and the source. Results are the account's when signed in, else this browser's
 * (practiceData.ts). Inside ProfiledContent, so the questions shown are the reader's profile's.
 */

const RECENT = 10

export function PracticeScoresPage() {
  const records = useQuizRounds()
  const { quizzes, byId, loaded } = usePracticeQuizzes()
  const { list } = useProfiles()
  const stats = useMemo(() => quizStats(records.rounds ?? []), [records.rounds])
  const quizById = useMemo(() => new Map(quizzes.map((q) => [q.id, q])), [quizzes])
  const [confirming, setConfirming] = useState(false)
  const [clearFailed, setClearFailed] = useState(false)

  const name = (slug: string) => byId.get(slug)?.nameZh ?? slug
  const profileName = (id: string) => list.find((x) => x.id === id)?.name ?? id
  const s = p.scoresPage

  const clear = () =>
    records.clear().then(
      () => {
        setConfirming(false)
        setClearFailed(false)
      },
      () => setClearFailed(true),
    )

  return (
    <Frame title={s.title}>
      <PageTitle>{s.title}</PageTitle>
      <Muted>{records.where === 'account' ? p.keptInAccount : p.keptOnDevice}</Muted>
      {!records.rounds ? (
        <Muted role="status">{p.recordLoading}</Muted>
      ) : (
        <>
          {records.failed && <ErrorText role="alert">{p.recordFailed}</ErrorText>}
          <Panel aria-labelledby="scores-total">
            <PanelTitle id="scores-total">{s.total}</PanelTitle>
            {stats.answered ? (
              <Totals>
                <div>
                  <dt>{s.rounds}</dt>
                  <dd>{stats.rounds}</dd>
                </div>
                <div>
                  <dt>{s.answered}</dt>
                  <dd>{stats.answered}</dd>
                </div>
                <div>
                  <dt>{s.accuracy}</dt>
                  <dd>{percent(stats.right, stats.answered)}%</dd>
                </div>
              </Totals>
            ) : (
              <Muted>{p.recordNone}</Muted>
            )}
            <Row>
              <Button as={Link} to={practicePath()} $variant="primary">
                {s.practise}
              </Button>
            </Row>
          </Panel>

          {stats.bySlug.length > 0 && (
            <Panel aria-labelledby="scores-by-convention">
              <PanelTitle id="scores-by-convention">{s.byConvention}</PanelTitle>
              <Muted>{s.byConventionHint}</Muted>
              <Scroll>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">{s.convention}</th>
                      <th scope="col">{s.answered}</th>
                      <th scope="col">{s.accuracy}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.bySlug.map((c) => (
                      <tr key={c.slug}>
                        <th scope="row">
                          <Link to={practicePath(c.slug)}>{name(c.slug)}</Link>
                        </th>
                        <td>{c.answered}</td>
                        <td>{percent(c.right, c.answered)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Scroll>
            </Panel>
          )}

          <Panel aria-labelledby="scores-wrong">
            <PanelTitle id="scores-wrong">{s.wrong(stats.wrong.length)}</PanelTitle>
            {!stats.wrong.length ? (
              <Muted>{s.noWrong}</Muted>
            ) : (
              <>
                <Muted>{s.wrongHint}</Muted>
                <Row>
                  <Button as={Link} to={WRONG_PATH} $variant="primary">
                    {s.practiseWrong}
                  </Button>
                </Row>
                {!loaded ? (
                  <Muted role="status">{p.loading}</Muted>
                ) : (
                  <Wrong>
                    {stats.wrong.map(({ id, slug }) => {
                      const quiz = quizById.get(id)
                      const [, sectionId] = id.split('/')
                      return (
                        <li key={id}>
                          <Link to={sectionPath(slug, quiz?.sectionId ?? sectionId)}>
                            {name(slug)}
                            {quiz && quiz.trail.length > 0 && ` › ${quiz.trail.join(' › ')}`}
                          </Link>
                          {!quiz ? (
                            <Muted>{s.gone}</Muted>
                          ) : quiz.kind === 'call' ? (
                            <div>
                              <CallLabel call={quiz.answer} />
                            </div>
                          ) : (
                            <div>
                              <CallLabel call={quiz.call ?? ''} />：<RichText text={quiz.answer} />
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </Wrong>
                )}
              </>
            )}
          </Panel>

          {stats.rounds > 0 && (
            <Panel aria-labelledby="scores-recent">
              <PanelTitle id="scores-recent">{s.recent}</PanelTitle>
              <Recent>
                {[...(records.rounds ?? [])]
                  .sort((a, b) => b.at - a.at)
                  .slice(0, RECENT)
                  .map((r) => (
                    <li key={r.id}>
                      {s.recentRow(
                        new Date(r.at).toLocaleString('zh-TW', { dateStyle: 'short', timeStyle: 'short' }),
                        profileName(r.profileId),
                        r.answers.filter((a) => a.right).length,
                        r.answers.length,
                      )}
                    </li>
                  ))}
              </Recent>
              {confirming ? (
                <Row>
                  <span>{s.clearConfirm}</span>
                  <Button type="button" $small $variant="danger" onClick={clear}>
                    {s.clearYes}
                  </Button>
                  <Button type="button" $small $variant="ghost" onClick={() => setConfirming(false)}>
                    {s.clearNo}
                  </Button>
                </Row>
              ) : (
                <Row>
                  <Button type="button" $small $variant="ghost" onClick={() => setConfirming(true)}>
                    {s.clear}
                  </Button>
                </Row>
              )}
              {clearFailed && <ErrorText role="alert">{s.clearFailed}</ErrorText>}
            </Panel>
          )}
        </>
      )}
    </Frame>
  )
}

const Totals = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(6)};
  margin: 0 0 ${({ theme }) => theme.space(4)};

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.8125rem;
  }
  dd {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }
`

const Scroll = styled.div`
  position: relative;
  overflow-x: auto;

  table {
    border-collapse: collapse;
    min-width: 100%;
  }
  th,
  td {
    padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    text-align: left;
  }
  td {
    font-variant-numeric: tabular-nums;
  }
  thead th {
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const Wrong = styled.ul`
  margin: ${({ theme }) => theme.space(4)} 0 0;
  padding-left: 1.25em;
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  line-height: 1.6;
`

const Recent = styled.ul`
  margin: 0 0 ${({ theme }) => theme.space(4)};
  padding-left: 1.25em;
  line-height: 1.8;
  font-variant-numeric: tabular-nums;
`
