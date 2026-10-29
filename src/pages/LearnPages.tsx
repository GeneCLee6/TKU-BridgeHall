import { Check } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button, ErrorText, Muted, PageTitle, Panel, PanelTitle, Row } from '../components/ui.tsx'
import { today } from '../lib/format.ts'
import {
  LEARN_PATH,
  lessonPage,
  lessonPracticePath,
  outlineTrail,
  pathEditPage,
  pathPage,
  pathProgress,
  usePathProgress,
  useLearningPaths,
  type LessonReading,
  type ShownPath,
} from '../lib/learning.ts'
import { conventionPath, sectionPath } from '../lib/sections.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { strings } from '../strings.ts'
import { Frame } from './Frame.tsx'
import { learnStrings as t } from './learnStrings.ts'

/**
 * 學習路徑 (E4 e4-t09, e4-t11, AC-4.3, AC-4.6): the paths (/learn), one path's lessons
 * (/learn/:pathId) and one lesson (/learn/:pathId/:lessonId) with its goal, what to read, its
 * questions and checklist. Signed in, a member marks lessons done and sees the share done. Inside
 * ProfiledContent, so a reading the reader's profile does not play says so.
 */

const date = (ms: number) => today(new Date(ms))
const loginTo = () => `/login?next=${encodeURIComponent(window.location.pathname)}`

/** 已完成 n／m 課 for a signed-in member; a way to sign in for a visitor */
function ProgressLine({ path, done }: { path: ShownPath; done: string[] | undefined }) {
  const { user } = useAuth()
  if (user === undefined) return null
  if (user === null)
    return (
      <Muted>
        {t.signInForProgress} <Link to={loginTo()}>{t.signIn}</Link>
      </Muted>
    )
  const p = pathProgress(path, done)
  return (
    <ProgressBox>
      <span>{t.progress(p.done, p.total, p.percent)}</span>
      <progress aria-label={t.progressLabel} max={p.total} value={p.done} />
    </ProgressBox>
  )
}

/** /learn: every path */
export function LearnIndexPage() {
  const { paths } = useLearningPaths()
  const { user } = useAuth()
  const { progress } = usePathProgress(Boolean(user))
  return (
    <Frame title={t.title}>
      <PageTitle>{t.title}</PageTitle>
      <Muted>{t.intro}</Muted>
      <Lessons>
        {paths.map((path) => (
          <li key={path.id}>
            <Link to={pathPage(path.id)}>
              <strong>{path.name}</strong>
              <span>
                {t.lessonCount(path.lessons.length)}
                {progress && ` · ${t.progress(...progressArgs(path, progress.get(path.id)))}`}
              </span>
            </Link>
          </li>
        ))}
      </Lessons>
    </Frame>
  )
}

const progressArgs = (path: ShownPath, done: string[] | undefined) => {
  const p = pathProgress(path, done)
  return [p.done, p.total, p.percent] as const
}

/** The path the address names, or what to show instead */
function usePath() {
  const { pathId = '' } = useParams()
  const { paths, loaded } = useLearningPaths()
  return { path: paths.find((p) => p.id === pathId), loaded }
}

function Missing({ loaded, text }: { loaded: boolean; text: string }) {
  return (
    <Frame title={t.title}>
      <PageTitle>{t.title}</PageTitle>
      {loaded ? <ErrorText role="alert">{text}</ErrorText> : <Muted role="status">{strings.loading}</Muted>}
      <Link to={LEARN_PATH}>{t.title}</Link>
    </Frame>
  )
}

/** /learn/:pathId: the lessons in order, which are done, and the share done */
export function PathPage() {
  const { path, loaded } = usePath()
  const { user, can } = useAuth()
  const { progress, failed } = usePathProgress(Boolean(user))
  if (!path) return <Missing loaded={loaded} text={t.notFound} />
  const done = new Set(progress?.get(path.id))
  const first = path.lessons[0]

  return (
    <Frame title={path.name}>
      <Eyebrow>
        <Link to={LEARN_PATH}>{t.title}</Link>
      </Eyebrow>
      <PageTitle>{path.name}</PageTitle>
      <Muted>{t.intro}</Muted>
      {path.saved && <Muted>{t.online(path.saved.by, date(path.saved.at))}</Muted>}
      <ProgressLine path={path} done={progress?.get(path.id)} />
      {failed && <ErrorText role="alert">{t.progressFailed}</ErrorText>}
      <Row>
        {first && (
          <Button as={Link} to={lessonPage(path.id, first.id)} $variant="primary">
            {t.start}
          </Button>
        )}
        {can('bookEdit') && (
          <Button as={Link} to={pathEditPage(path.id)}>
            {t.edit}
          </Button>
        )}
      </Row>
      <h2 className="visually-hidden">{t.lessons}</h2>
      <Lessons>
        {path.lessons.map((lesson, i) => (
          <li key={lesson.id}>
            <Link to={lessonPage(path.id, lesson.id)}>
              <small>
                {t.lesson(i + 1)}
                {done.has(lesson.id) && (
                  <Done>
                    <Check size={14} aria-hidden />
                    {t.done}
                  </Done>
                )}
              </small>
              <strong>{lesson.title}</strong>
              {lesson.goal && <span>{lesson.goal}</span>}
            </Link>
          </li>
        ))}
      </Lessons>
    </Frame>
  )
}

/** One place to read: the convention (and section) as the reader's profile has it */
function Reading({ reading }: { reading: LessonReading }) {
  const { bySlug, bundledBySlug } = useContent()
  const meta = bySlug(reading.slug)
  if (!meta)
    return (
      <li>
        {bundledBySlug(reading.slug)?.nameZh ?? reading.slug}
        <Muted as="span">{t.readingUnavailable}</Muted>
      </li>
    )
  const trail = reading.sectionId ? outlineTrail(meta.outline, reading.sectionId) : undefined
  return (
    <li>
      <Link to={trail && reading.sectionId ? sectionPath(meta.slug, reading.sectionId) : conventionPath(meta.slug)}>
        {[meta.nameZh, ...(trail ?? [])].join(' › ')}
      </Link>
      {reading.sectionId && !trail && <Muted as="span">{t.sectionGone}</Muted>}
    </li>
  )
}

/** /learn/:pathId/:lessonId: the lesson's goal, readings, questions and checklist; marking it done */
export function LessonPage() {
  const { lessonId = '' } = useParams()
  const { path, loaded } = usePath()
  const { user } = useAuth()
  const { progress, failed, mark } = usePathProgress(Boolean(user))
  const index = path ? path.lessons.findIndex((l) => l.id === lessonId) : -1
  if (!path) return <Missing loaded={loaded} text={t.notFound} />
  if (index < 0) return <Missing loaded={loaded} text={t.lessonNotFound} />
  const lesson = path.lessons[index]
  const previous = path.lessons[index - 1]
  const next = path.lessons[index + 1]
  const done = Boolean(progress?.get(path.id)?.includes(lesson.id))

  return (
    <Frame title={`${lesson.title} · ${path.name}`}>
      <Eyebrow>
        <Link to={pathPage(path.id)}>{path.name}</Link> · {t.lesson(index + 1)}
      </Eyebrow>
      <PageTitle>{lesson.title}</PageTitle>

      <Panel aria-labelledby="lesson-goal">
        <PanelTitle id="lesson-goal">{t.goal}</PanelTitle>
        {lesson.goal ? <Text>{lesson.goal}</Text> : <Muted>{t.goalMissing}</Muted>}
      </Panel>

      <Panel aria-labelledby="lesson-readings">
        <PanelTitle id="lesson-readings">{t.readings}</PanelTitle>
        {lesson.readings.length ? (
          <ol>
            {lesson.readings.map((r, i) => (
              <Reading key={`${r.slug}/${r.sectionId ?? ''}/${i}`} reading={r} />
            ))}
          </ol>
        ) : (
          <Muted>{t.readingsNone}</Muted>
        )}
      </Panel>

      {(Boolean(lesson.quizIds?.length) || lesson.readings.length > 0) && (
        <Panel aria-labelledby="lesson-quizzes">
          <PanelTitle id="lesson-quizzes">{t.quizzes}</PanelTitle>
          <Muted>{lesson.quizIds?.length ? t.quizCount(lesson.quizIds.length) : t.quizFromReadings}</Muted>
          <Row>
            <Button as={Link} to={lessonPracticePath(path.id, lesson.id)} $variant="primary">
              {t.practise}
            </Button>
          </Row>
        </Panel>
      )}

      <Panel aria-labelledby="lesson-checklist">
        <PanelTitle id="lesson-checklist">{t.checklist}</PanelTitle>
        {lesson.checklist.length ? (
          <ul>
            {lesson.checklist.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <Muted>{t.checklistMissing}</Muted>
        )}
      </Panel>

      {user === null && (
        <Muted>
          {t.signInForProgress} <Link to={loginTo()}>{t.signIn}</Link>
        </Muted>
      )}
      {user && progress && (
        <Row>
          <Button type="button" aria-pressed={done} onClick={() => void mark(path.id, lesson.id, !done)} $variant={done ? undefined : 'primary'}>
            {done && <Check size={16} aria-hidden />}
            {done ? t.done : t.markDone}
          </Button>
          {done && (
            <Button type="button" $variant="ghost" $small onClick={() => void mark(path.id, lesson.id, false)}>
              {t.markUndone}
            </Button>
          )}
        </Row>
      )}
      {failed && <ErrorText role="alert">{t.progressFailed}</ErrorText>}

      <Neighbours aria-label={t.neighbours}>
        {previous ? (
          <Link to={lessonPage(path.id, previous.id)}>
            ← {t.previous}：{previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={lessonPage(path.id, next.id)}>
            {t.next}：{next.title} →
          </Link>
        ) : (
          <Link to={pathPage(path.id)}>{t.backToPath(path.name)}</Link>
        )}
      </Neighbours>
    </Frame>
  )
}

/** 我的帳號 › 學習進度 (e4-t11, AC-4.6): the share of each path done */
export function MyPathProgress() {
  const { paths } = useLearningPaths()
  const { progress } = usePathProgress(true)
  const started = paths.filter((p) => pathProgress(p, progress?.get(p.id)).done > 0)
  return (
    <Panel aria-labelledby="account-learning">
      <PanelTitle id="account-learning">{t.myProgress}</PanelTitle>
      {!progress ? (
        <Muted role="status">{strings.loading}</Muted>
      ) : started.length ? (
        <ul>
          {started.map((p) => (
            <li key={p.id}>
              <Link to={pathPage(p.id)}>{p.name}</Link> {t.progress(...progressArgs(p, progress.get(p.id)))}
            </li>
          ))}
        </ul>
      ) : (
        <Muted>
          {t.myProgressNone} <Link to={LEARN_PATH}>{t.title}</Link>
        </Muted>
      )}
    </Panel>
  )
}

const Eyebrow = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`

const Text = styled.p`
  margin: 0;
  white-space: pre-line;
`

const ProgressBox = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  margin: ${({ theme }) => theme.space(2)} 0;

  progress {
    flex: 1 1 10rem;
    max-width: 20rem;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`

const Lessons = styled.ol`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  margin: ${({ theme }) => theme.space(4)} 0 0;
  padding: 0;
  list-style: none;

  a {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space(1)};
    padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
    border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.shape.panel};
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;
  }
  a:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  small {
    display: flex;
    gap: ${({ theme }) => theme.space(2)};
    color: ${({ theme }) => theme.colors.structure};
    font-weight: 600;
  }
  span {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.textMuted};
    white-space: pre-line;
  }
`

const Done = styled.b`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 600;
`

const Neighbours = styled.nav`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
  margin-top: ${({ theme }) => theme.space(6)};
`
