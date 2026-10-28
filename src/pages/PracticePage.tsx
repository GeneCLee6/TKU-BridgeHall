import { Check, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { AuctionTable } from '../components/AuctionTable.tsx'
import { BlockView } from '../components/BlockView.tsx'
import { CallLabel, RichText } from '../components/Suit.tsx'
import { Button, ErrorText, Field, Muted, Notice, PageTitle, Panel, PanelTitle, Row, Select } from '../components/ui.tsx'
import { drawQuizzes, filterQuizzes, generateQuizzes, quizBlockIndex, type Quiz } from '../lib/quiz.ts'
import { sectionPath, walkSections } from '../lib/sections.ts'
import { useContent } from '../state/ContentContext.tsx'
import { useProfiles } from '../state/ProfileContext.tsx'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'
import { levels, type Block, type Convention, type Level } from '../types/convention.ts'
import { Frame } from './Frame.tsx'
import { practiceStrings as s } from './practiceStrings.ts'

/**
 * 練習 (/practice, E6 e6-t02 e6-t03): meaning questions drawn from the reader's system profile.
 * Inside ProfiledContent, so the content is what the profile resolves to (ARCHITECTURE.md §3.1)
 * and the questions are made from it in the browser (lib/quiz.ts). `?c=<slug>` starts with only
 * that convention chosen (練這個特約, e6-t09). Nothing is recorded yet (e6-t04).
 */

const COUNTS = [5, 10, 20]

type Answer = { quiz: Quiz; picked: string }

export function PracticePage() {
  const content = useContent()
  const { list, activeId, choose } = useProfiles()
  const [params] = useSearchParams()
  const only = params.get('c')

  // Every convention's content, then its questions; again when the profile or the content changes
  const { loadAll } = content
  const contentKey = content.conventions.map((c) => `${c.slug}:${content.changed(c.slug) ?? ''}`).join('|')
  const total = content.conventions.length
  const [result, setResult] = useState<{ key: string; all: Convention[]; partial: boolean }>()
  useEffect(() => {
    let live = true
    loadAll().then(
      (all) => live && setResult({ key: contentKey, all, partial: all.length < total }),
      () => live && setResult({ key: contentKey, all: [], partial: true }),
    )
    return () => {
      live = false
    }
  }, [loadAll, contentKey, total])
  // What was loaded for other content (another profile) is not shown while the new one loads
  const loaded = result?.key === contentKey ? result.all : undefined
  const partial = Boolean(result?.partial)

  const quizzes = useMemo(() => (loaded ? generateQuizzes(loaded, activeId).quizzes : []), [loaded, activeId])
  const perConvention = useMemo(() => {
    const counts = new Map<string, number>()
    quizzes.forEach((q) => counts.set(q.slug, (counts.get(q.slug) ?? 0) + 1))
    return counts
  }, [quizzes])
  const askable = content.conventions.filter((c) => perConvention.has(c.slug))

  const [chosen, setChosen] = useState<Set<string> | undefined>()
  const picked = chosen ?? new Set(only && perConvention.has(only) ? [only] : askable.map((c) => c.slug))
  const [level, setLevel] = useState<Level | ''>('')
  const [count, setCount] = useState(COUNTS[1])
  const pool = filterQuizzes(quizzes, { slugs: [...picked], level: level || undefined })

  const [round, setRound] = useState<Quiz[]>()
  const [answers, setAnswers] = useState<Answer[]>([])
  const start = () => {
    setAnswers([])
    setRound(drawQuizzes(pool, count))
  }

  const toggle = (slug: string) => {
    const next = new Set(picked)
    if (next.has(slug)) next.delete(slug)
    else next.add(slug)
    setChosen(next)
  }

  const byId = useMemo(() => new Map((loaded ?? []).map((c) => [c.slug, c])), [loaded])

  if (round) {
    const done = answers.length === round.length && round.length > 0
    return (
      <Frame title={s.title}>
        {done ? (
          <Summary
            answers={answers}
            names={byId}
            onAgain={start}
            onChange={() => setRound(undefined)}
          />
        ) : (
          <Question
            key={round[answers.length].id}
            quiz={round[answers.length]}
            convention={byId.get(round[answers.length].slug)}
            index={answers.length}
            total={round.length}
            right={answers.filter((a) => a.picked === a.quiz.answer).length}
            onAnswer={(a) => setAnswers((all) => [...all, a])}
            onQuit={() => setRound(undefined)}
          />
        )}
      </Frame>
    )
  }

  return (
    <Frame title={s.title}>
      <PageTitle>{s.title}</PageTitle>
      <Muted>{s.intro}</Muted>
      <Panel aria-labelledby="practice-setup">
        <PanelTitle id="practice-setup">{s.setup}</PanelTitle>
        <Settings>
          {list.length > 1 ? (
            <Field>
              {s.profile}
              <Select value={activeId} onChange={(e) => choose(e.target.value)}>
                {list.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <small>{s.profileHint}</small>
            </Field>
          ) : (
            <Field as="div">
              {s.profile}
              <ProfileName>{list.find((p) => p.id === activeId)?.name ?? s.clubName}</ProfileName>
            </Field>
          )}
          <Field>
            {s.level}
            <Select value={level} onChange={(e) => setLevel(e.target.value as Level | '')}>
              <option value="">{s.allLevels}</option>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {strings.levels[l]}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            {s.count}
            <Select value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {COUNTS.map((n) => (
                <option key={n} value={n}>
                  {s.countOption(n)}
                </option>
              ))}
            </Select>
          </Field>
        </Settings>

        {!loaded ? (
          <Muted role="status">{s.loading}</Muted>
        ) : !askable.length ? (
          <Notice>{s.noQuestions}</Notice>
        ) : (
          <>
            {partial && <ErrorText role="alert">{s.loadFailed}</ErrorText>}
            <Conventions>
              <legend>{s.conventions}</legend>
              <Row>
                <Button type="button" $small $variant="ghost" onClick={() => setChosen(new Set(askable.map((c) => c.slug)))}>
                  {s.selectAll}
                </Button>
                <Button type="button" $small $variant="ghost" onClick={() => setChosen(new Set())}>
                  {s.selectNone}
                </Button>
              </Row>
              <Checks>
                {askable.map((c) => (
                  <li key={c.slug}>
                    <label>
                      <input type="checkbox" checked={picked.has(c.slug)} onChange={() => toggle(c.slug)} />
                      <span>{c.nameZh}</span>
                      <small>{s.conventionCount(perConvention.get(c.slug) ?? 0)}</small>
                    </label>
                  </li>
                ))}
              </Checks>
            </Conventions>
            <Row>
              <Button type="button" $variant="primary" disabled={!pool.length} onClick={start}>
                {s.start}
              </Button>
              <Muted role="status">{pool.length ? s.pool(pool.length) : s.poolEmpty}</Muted>
            </Row>
          </>
        )}
      </Panel>
    </Frame>
  )
}

/** The table a question came from, as the handbook shows it */
function sourceBlock(convention: Convention | undefined, quiz: Quiz): Block | undefined {
  let block: Block | undefined
  if (convention)
    walkSections(convention.sections, (section) => {
      if (section.id === quiz.sectionId) block = section.blocks?.[quizBlockIndex(quiz)]
    })
  return block?.kind === 'responses' ? block : undefined
}

function Question({
  quiz,
  convention,
  index,
  total,
  right,
  onAnswer,
  onQuit,
}: {
  quiz: Quiz
  convention?: Convention
  index: number
  total: number
  right: number
  onAnswer: (answer: Answer) => void
  onQuit: () => void
}) {
  const [picked, setPicked] = useState<string>()
  const heading = useRef<HTMLHeadingElement>(null)
  const result = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  useEffect(() => {
    if (picked !== undefined) result.current?.focus()
  }, [picked])

  const correct = picked === quiz.answer
  const block = picked !== undefined ? sourceBlock(convention, quiz) : undefined
  const last = index + 1 === total

  return (
    <>
      <PageTitle>{s.title}</PageTitle>
      <Progress>
        <span>{s.progress(index + 1, total)}</span>
        <span>{s.score(right + (picked !== undefined && correct ? 1 : 0))}</span>
        <Button type="button" $small $variant="ghost" onClick={onQuit}>
          {s.quit}
        </Button>
      </Progress>
      <Panel aria-labelledby="practice-question">
        <Context>
          {convention?.nameZh}
          {quiz.trail.length > 0 && ` › ${quiz.trail.join(' › ')}`}
        </Context>
        {quiz.caption && <Muted>{quiz.caption}</Muted>}
        {quiz.auction && <AuctionTable auction={quiz.auction} />}
        <Ask id="practice-question" ref={heading} tabIndex={-1}>
          <span className="visually-hidden">{s.call}</span>
          <BigCall>
            <CallLabel call={quiz.call ?? ''} />
          </BigCall>
          {quiz.auction ? s.question : s.questionNoAuction}
        </Ask>
        <Choices aria-label={s.choices}>
          {quiz.choices?.map((choice, i) => {
            const state =
              picked === undefined ? undefined : choice === quiz.answer ? 'right' : choice === picked ? 'wrong' : 'other'
            return (
              <li key={i}>
                <Choice
                  type="button"
                  $state={state}
                  aria-disabled={picked !== undefined}
                  onClick={() => picked === undefined && setPicked(choice)}
                >
                  {/* One flex item, so the suit symbols stay inside the sentence */}
                  <span>
                    <RichText text={choice} />
                  </span>
                  {state === 'right' && (
                    <Mark>
                      <Check size={16} aria-hidden />
                      {s.rightAnswer}
                    </Mark>
                  )}
                  {state === 'wrong' && (
                    <Mark>
                      <X size={16} aria-hidden />
                      {s.yourAnswer}
                    </Mark>
                  )}
                </Choice>
              </li>
            )
          })}
        </Choices>
      </Panel>

      {picked !== undefined && (
        <Panel aria-labelledby="practice-result">
          <Verdict id="practice-result" ref={result} tabIndex={-1} $right={correct}>
            {correct ? s.right : s.wrong}
          </Verdict>
          <PanelTitle as="h3">
            {s.source}：{convention?.nameZh}
            {quiz.trail.length > 0 && ` › ${quiz.trail.join(' › ')}`}
          </PanelTitle>
          {block && (
            // Focusable, so a keyboard can scroll a long table (WCAG 2.1.1)
            <Preview tabIndex={0} role="region" aria-label={s.sourceTable}>
              <BlockView block={block} />
            </Preview>
          )}
          <Row>
            <Button type="button" $variant="primary" onClick={() => onAnswer({ quiz, picked })}>
              {last ? s.finish : s.next}
            </Button>
            <Button as={Link} to={sectionPath(quiz.slug, quiz.sectionId)}>
              {s.readSource}
            </Button>
          </Row>
        </Panel>
      )}
    </>
  )
}

function Summary({
  answers,
  names,
  onAgain,
  onChange,
}: {
  answers: Answer[]
  names: Map<string, Convention>
  onAgain: () => void
  onChange: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  const missed = answers.filter((a) => a.picked !== a.quiz.answer)
  return (
    <>
      <PageTitle ref={heading} tabIndex={-1}>
        {s.done}
      </PageTitle>
      <Panel aria-labelledby="practice-score">
        <PanelTitle id="practice-score">{s.result(answers.length - missed.length, answers.length)}</PanelTitle>
        {missed.length ? (
          <>
            <h3>{s.missed}</h3>
            <Missed>
              {missed.map(({ quiz }) => (
                <li key={quiz.id}>
                  <Link to={sectionPath(quiz.slug, quiz.sectionId)}>
                    {names.get(quiz.slug)?.nameZh}
                    {quiz.trail.length > 0 && ` › ${quiz.trail.join(' › ')}`}
                  </Link>
                  <div>
                    <CallLabel call={quiz.call ?? ''} />：<RichText text={quiz.answer} />
                  </div>
                </li>
              ))}
            </Missed>
          </>
        ) : (
          <Muted>{s.allRight}</Muted>
        )}
        <Row>
          <Button type="button" $variant="primary" onClick={onAgain}>
            {s.again}
          </Button>
          <Button type="button" onClick={onChange}>
            {s.change}
          </Button>
        </Row>
      </Panel>
    </>
  )
}

const Settings = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: ${({ theme }) => theme.space(4)};
  margin-bottom: ${({ theme }) => theme.space(4)};
`

const ProfileName = styled.span`
  font-size: 1rem;
  font-weight: 400;
`

const Conventions = styled.fieldset`
  margin: 0 0 ${({ theme }) => theme.space(4)};
  padding: 0;
  border: 0;
  display: grid;
  gap: ${({ theme }) => theme.space(2)};

  legend {
    margin-bottom: ${({ theme }) => theme.space(2)};
    font-size: 0.8125rem;
    font-weight: 600;
  }
`

const Checks = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(4)};

  label {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.space(2)};
    min-height: 2.25rem;
    cursor: pointer;
  }
  small {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const Progress = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(4)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 600;

  & > button {
    margin-left: auto;
  }
`

const Context = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(2)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`

const Ask = styled.h2`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.space(3)};
  margin: ${({ theme }) => theme.space(4)} 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.125rem;
`

const BigCall = styled.span`
  font-size: 1.75rem;
`

const Choices = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
`

const Choice = styled.button<{ $state?: 'right' | 'wrong' | 'other' }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(2)};
  width: 100%;
  min-height: 3rem;
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border: 2px solid
    ${({ theme, $state }) =>
      $state === 'right' ? theme.colors.primary : $state === 'wrong' ? theme.colors.seal : theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme, $state }) => ($state === 'right' ? theme.colors.primarySoft : theme.colors.surface)};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  line-height: 1.6;
  text-align: left;
  cursor: ${({ $state }) => ($state ? 'default' : 'pointer')};
  opacity: ${({ $state }) => ($state === 'other' ? 0.7 : 1)};

  &:hover {
    border-color: ${({ theme, $state }) => ($state ? undefined : theme.colors.structure)};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`

const Mark = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  font-size: 0.8125rem;
  font-weight: 700;
  white-space: nowrap;
`

const Verdict = styled.h2<{ $right: boolean }>`
  margin: 0 0 ${({ theme }) => theme.space(3)};
  font-size: 1.25rem;
  color: ${({ theme, $right }) => ($right ? theme.colors.primaryStrong : theme.colors.seal)};
`

/* position: relative keeps the tables' visually hidden captions inside the scroll box (CLAUDE.md) */
const Preview = styled.div`
  position: relative;
  max-height: 50vh;
  overflow: auto;
  margin-bottom: ${({ theme }) => theme.space(4)};
  padding: 0 ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.note};
  background: ${({ theme }) => theme.colors.bg};

  ${mobile} {
    max-height: 40vh;
    padding: 0 ${({ theme }) => theme.space(2)};
  }
`

const Missed = styled.ul`
  margin: 0 0 ${({ theme }) => theme.space(4)};
  padding-left: 1.25em;
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  line-height: 1.6;
`
