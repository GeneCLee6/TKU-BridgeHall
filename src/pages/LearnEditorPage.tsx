import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button, ErrorText, Field, Input, Muted, Notice, PageTitle, Row, Select, TextArea } from '../components/ui.tsx'
import { errorText } from '../lib/api.ts'
import { today } from '../lib/format.ts'
import {
  LEARNING_LIMITS,
  learningApi,
  newLessonId,
  outlineSections,
  pathPage,
  tidyPath,
  useLearningPaths,
  type LearningPath,
  type Lesson,
  type ShownPath,
} from '../lib/learning.ts'
import { useContent } from '../state/ContentContext.tsx'
import { Frame, Gate } from './Frame.tsx'
import { learnStrings } from './learnStrings.ts'

const t = learnStrings.editor

/**
 * 編輯學習路徑 (/learn/:pathId/edit, e4-t12, AC-4.3): editors change a path's name and lessons:
 * each lesson's title, goal, what to read (a convention of the club's handbook, or one of its
 * sections), and checklist. Saving keeps it online (TKU-BridgeTable `PUT /api/book/paths`) and it
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
