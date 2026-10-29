import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { CallLabel, RichText } from '../components/Suit.tsx'
import { Button, ErrorText, Field, Input, Muted, Notice, PageTitle, Row, Select, TextArea } from '../components/ui.tsx'
import { errorText } from '../lib/api.ts'
import { today } from '../lib/format.ts'
import {
  LEARNING_LIMITS,
  learningApi,
  newLessonId,
  outlineSections,
  pathPage,
  readingQuizzes,
  tidyPath,
  useLearningPaths,
  type LearningPath,
  type Lesson,
  type ShownPath,
} from '../lib/learning.ts'
import { generateQuizzes, type Quiz } from '../lib/quiz.ts'
import { useContent } from '../state/ContentContext.tsx'
import type { Convention } from '../types/convention.ts'
import { Frame, Gate } from './Frame.tsx'
import { learnStrings } from './learnStrings.ts'

const t = learnStrings.editor

/**
 * 編輯學習路徑 (/learn/:pathId/edit, e4-t12, AC-4.3): editors change a path's name and lessons:
 * each lesson's title, goal, what to read (a convention of the club's handbook, or one of its
 * sections), the practice questions (e4-t10: chosen from those its readings make; none chosen
 * practises them all), and checklist. Saving keeps it online (TKU-BridgeTable `PUT /api/book/paths`) and it
 * replaces the bundled path at once; 還原為內建版本 removes the online one. What a lesson says is the
 * editors' (CLAUDE.md rule 1). Outside ProfiledContent: readings choose from the club's content.
 */
export function LearnEditorPage() {
  return (
    <Frame title={learnStrings.title}>
      <Gate need="bookEdit">
        <Loaded />
      </Gate>
    </Frame>
  )
}

function Loaded() {
  const { pathId = '' } = useParams()
  const { paths, loaded, reload } = useLearningPaths()
  // Kept here: the form starts again after a save
  const [notice, setNotice] = useState('')
  const path = paths.find((p) => p.id === pathId)
  if (!loaded) return <Muted role="status">{t.loading}</Muted>
  if (!path)
    return (
      <>
        <PageTitle>{learnStrings.title}</PageTitle>
        <ErrorText role="alert">{learnStrings.notFound}</ErrorText>
      </>
    )
  // A new form when the path is saved or reset, so it starts from what is kept now
  return <PathForm key={`${path.id}:${path.saved?.at ?? 0}`} path={path} reload={reload} notice={notice} setNotice={setNotice} />
}

const blankLesson = (path: LearningPath): Lesson => ({ id: newLessonId(path), title: '', goal: '', readings: [], checklist: [] })

interface FormProps {
  path: ShownPath
  reload: () => Promise<void>
  notice: string
  setNotice: (notice: string) => void
}

function PathForm({ path, reload, notice, setNotice }: FormProps) {
  const { conventions } = useContent()
  const [draft, setDraft] = useState<LearningPath>(() => ({ id: path.id, name: path.name, lessons: path.lessons }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const setLesson = (i: number, change: Partial<Lesson>) =>
    setDraft((d) => ({ ...d, lessons: d.lessons.map((l, j) => (j === i ? { ...l, ...change } : l)) }))
  const move = (i: number, by: -1 | 1) =>
    setDraft((d) => {
      const lessons = [...d.lessons]
      ;[lessons[i], lessons[i + by]] = [lessons[i + by], lessons[i]]
      return { ...d, lessons }
    })
  const remove = (i: number) => setDraft((d) => ({ ...d, lessons: d.lessons.filter((_, j) => j !== i) }))

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const tidy = tidyPath(draft)
    if (!tidy.name || tidy.lessons.some((l) => !l.title)) return setError(t.blank)
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await learningApi.save(tidy)
      setNotice(t.saved)
      await reload()
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    if (!window.confirm(t.resetConfirm)) return
    setBusy(true)
    setError('')
    try {
      await learningApi.reset(path.id)
      setNotice(t.resetDone)
      await reload()
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save}>
      <PageTitle>{t.title(path.name)}</PageTitle>
      <Muted>{t.intro}</Muted>
      <Muted>{path.saved ? learnStrings.online(path.saved.by, today(new Date(path.saved.at))) : t.builtIn}</Muted>
      <Field>
        {t.name}
        <Input value={draft.name} maxLength={LEARNING_LIMITS.nameMax} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
      </Field>

      {draft.lessons.map((lesson, i) => {
        const n = i + 1
        return (
          <LessonBox key={lesson.id}>
            <legend>{learnStrings.lesson(n)}</legend>
            <Field>
              {t.lessonTitle}
              <Input value={lesson.title} maxLength={LEARNING_LIMITS.titleMax} onChange={(e) => setLesson(i, { title: e.target.value })} required />
            </Field>
            <Field>
              {t.goal}
              <TextArea rows={2} value={lesson.goal} maxLength={LEARNING_LIMITS.textMax} onChange={(e) => setLesson(i, { goal: e.target.value })} />
            </Field>
            <Readings>
              <span>{t.readings}</span>
              {lesson.readings.map((r, k) => {
                const meta = conventions.find((c) => c.slug === r.slug)
                const update = (change: { slug?: string; sectionId?: string }) =>
                  setLesson(i, { readings: lesson.readings.map((x, j) => (j === k ? { ...x, ...change } : x)) })
                return (
                  <Row key={k}>
                    <Select aria-label={`${learnStrings.lesson(n)} ${t.convention} ${k + 1}`} value={r.slug} onChange={(e) => update({ slug: e.target.value, sectionId: undefined })}>
                      <option value="">{t.chooseConvention}</option>
                      {conventions.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.nameZh}
                        </option>
                      ))}
                    </Select>
                    <Select
                      aria-label={`${learnStrings.lesson(n)} ${t.section} ${k + 1}`}
                      value={r.sectionId ?? ''}
                      disabled={!meta}
                      onChange={(e) => update({ sectionId: e.target.value || undefined })}
                    >
                      <option value="">{t.wholeConvention}</option>
                      {meta &&
                        outlineSections(meta.outline).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.trail.join(' › ')}
                          </option>
                        ))}
                    </Select>
                    <Button type="button" $small $variant="ghost" onClick={() => setLesson(i, { readings: lesson.readings.filter((_, j) => j !== k) })}>
                      {t.removeReading(k + 1)}
                    </Button>
                  </Row>
                )
              })}
              {lesson.readings.length < LEARNING_LIMITS.readingsMax && (
                <Row>
                  <Button type="button" $small onClick={() => setLesson(i, { readings: [...lesson.readings, { slug: '' }] })}>
                    {t.addReading}
                  </Button>
                </Row>
              )}
            </Readings>
            <LessonQuizzes lesson={lesson} label={learnStrings.lesson(n)} onChange={(quizIds) => setLesson(i, { quizIds })} />
            <Field>
              {t.checklist}
              <TextArea rows={3} value={lesson.checklist.join('\n')} onChange={(e) => setLesson(i, { checklist: e.target.value.split('\n') })} />
            </Field>
            <Row>
              <Button type="button" $small disabled={i === 0} onClick={() => move(i, -1)}>
                {t.moveUp(n)}
              </Button>
              <Button type="button" $small disabled={i === draft.lessons.length - 1} onClick={() => move(i, 1)}>
                {t.moveDown(n)}
              </Button>
              <Button type="button" $small $variant="danger" disabled={draft.lessons.length === 1} onClick={() => remove(i)}>
                {t.removeLesson(n)}
              </Button>
            </Row>
          </LessonBox>
        )
      })}

      {draft.lessons.length < LEARNING_LIMITS.lessonsMax && (
        <Row>
          <Button type="button" onClick={() => setDraft((d) => ({ ...d, lessons: [...d.lessons, blankLesson(d)] }))}>
            {t.addLesson}
          </Button>
        </Row>
      )}

      {error && <ErrorText role="alert">{error}</ErrorText>}
      {notice && <Notice role="status">{notice}</Notice>}
      <Row>
        <Button type="submit" $variant="primary" disabled={busy}>
          {busy ? t.saving : t.save}
        </Button>
        {path.saved && path.bundled && (
          <Button type="button" $variant="danger" disabled={busy} onClick={() => void reset()}>
            {t.reset}
          </Button>
        )}
        <Link to={pathPage(path.id)}>{learnStrings.backToPath(path.name)}</Link>
      </Row>
    </form>
  )
}

/**
 * A lesson's questions (e4-t10): the ones its readings make from the club's content, to tick. The
 * content is loaded only when the list is opened. Ids no longer made are kept (the practice page
 * skips them) so a change in the text does not quietly drop an editor's choice.
 */
function LessonQuizzes({ lesson, label, onChange }: { lesson: Lesson; label: string; onChange: (ids: string[]) => void }) {
  const content = useContent()
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<{ slugs: string; list: Convention[] }>()
  const slugs = [...new Set(lesson.readings.map((r) => r.slug).filter(Boolean))].join('|')
  const { load } = content
  useEffect(() => {
    if (!open) return
    let live = true
    Promise.all(slugs.split('|').filter(Boolean).map((slug) => load(slug).catch(() => undefined))).then(
      (list) => live && setResult({ slugs, list: list.filter((c): c is Convention => Boolean(c)) }),
    )
    return () => {
      live = false
    }
  }, [open, slugs, load])
  // What was loaded for other readings is not offered while the new ones load
  const loaded = result?.slugs === slugs ? result.list : undefined
  const offered = useMemo(
    () => (loaded ? readingQuizzes(lesson.readings, generateQuizzes(loaded, 'club').quizzes, loaded) : []),
    [loaded, lesson.readings],
  )
  const chosen = new Set(lesson.quizIds ?? [])
  const gone = loaded ? [...chosen].filter((id) => !offered.some((q) => q.id === id)).length : 0
  const toggle = (id: string) =>
    onChange(chosen.has(id) ? (lesson.quizIds ?? []).filter((x) => x !== id) : [...(lesson.quizIds ?? []), id])

  return (
    <Quizzes>
      <span>{t.quizzes}</span>
      <Muted>
        {t.quizzesHint} {t.quizzesChosen(chosen.size, LEARNING_LIMITS.quizzesMax)}
      </Muted>
      <Row>
        <Button type="button" $small aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? t.quizzesHide : t.quizzesShow(offered.length)}
        </Button>
        {chosen.size > 0 && (
          <Button type="button" $small $variant="ghost" onClick={() => onChange([])}>
            {t.quizzesClear}
          </Button>
        )}
      </Row>
      {open &&
        (!loaded ? (
          <Muted role="status">{t.quizzesLoading}</Muted>
        ) : !offered.length ? (
          <Muted>{t.quizzesNone}</Muted>
        ) : (
          <QuizList aria-label={`${label} ${t.quizzes}`}>
            {offered.map((q) => (
              <li key={q.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={chosen.has(q.id)}
                    disabled={!chosen.has(q.id) && chosen.size >= LEARNING_LIMITS.quizzesMax}
                    onChange={() => toggle(q.id)}
                  />
                  <QuizLine quiz={q} />
                </label>
              </li>
            ))}
          </QuizList>
        ))}
      {gone > 0 && <Muted>{t.quizzesGone(gone)}</Muted>}
    </Quizzes>
  )
}

function QuizLine({ quiz }: { quiz: Quiz }) {
  return (
    <span>
      <small>
        {quiz.kind === 'call' ? t.quizCall : t.quizMeaning} · {quiz.trail.join(' › ')}
      </small>
      <br />
      {quiz.kind === 'call' ? (
        <>
          <RichText text={quiz.prompt ?? ''} /> → <CallLabel call={quiz.answer} />
        </>
      ) : (
        <>
          <CallLabel call={quiz.call ?? ''} />：<RichText text={quiz.answer} />
        </>
      )}
    </span>
  )
}

const Quizzes = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
`

const QuizList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 24rem;
  overflow: auto;
  display: grid;
  gap: ${({ theme }) => theme.space(2)};

  label {
    display: flex;
    align-items: flex-start;
    gap: ${({ theme }) => theme.space(2)};
    line-height: 1.5;
    cursor: pointer;
  }
  small {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const LessonBox = styled.fieldset`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  margin: ${({ theme }) => theme.space(4)} 0;
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};

  legend {
    padding: 0 ${({ theme }) => theme.space(1)};
    font-weight: 600;
    color: ${({ theme }) => theme.colors.structure};
  }
`

const Readings = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};

  select {
    max-width: 100%;
  }
`
