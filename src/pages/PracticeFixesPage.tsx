import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { AuctionTable } from '../components/AuctionTable.tsx'
import { Hand } from '../components/Hand.tsx'
import { CallLabel, RichText } from '../components/Suit.tsx'
import { Button, ErrorText, Field, Input, Muted, Notice, PageTitle, Panel, PanelTitle, Row, Select, TextArea } from '../components/ui.tsx'
import { errorText } from '../lib/api.ts'
import { cellCall, cellText, DEFAULT_SEATS, normaliseCall } from '../lib/editing.ts'
import type { Quiz } from '../lib/quiz.ts'
import {
  basisOf,
  fixPath,
  FIXES_PATH,
  isManualId,
  manualId,
  QUIZ_LIMITS,
  quizApi,
  type ManualQuiz,
  type QuizFix,
  type QuizFixInput,
  type QuizHand,
} from '../lib/quizRecords.ts'
import { sectionPath, walkSections } from '../lib/sections.ts'
import { useProfiles } from '../state/ProfileContext.tsx'
import { strings } from '../strings.ts'
import { levels, type Convention, type Level } from '../types/convention.ts'
import { Frame, Gate } from './Frame.tsx'
import { usePracticeQuizzes } from './practiceData.ts'
import { practiceStrings as p } from './practiceStrings.ts'

/**
 * 修題 (/practice/fixes, E6 e6-t06, AC-6.6), for editors (bookEdit): take a made question out,
 * change its answer or choices, or write a question by hand (a meaning, or a hand and the call it
 * makes). Every change is the editor's own, typed here (CLAUDE.md rule 1); nothing is suggested.
 * A fix to a made question keeps the call and answer it was written against, so it stops applying
 * when the handbook's text changes (listed here as not applied). Inside ProfiledContent: the
 * questions are the active profile's, and a hand-made question belongs to that profile.
 * `?id=<question id>` opens one question.
 */

const s = p.fixesPage

export function PracticeFixesPage() {
  return (
    <Frame title={s.title}>
      <Gate need="bookEdit">
        <Fixes />
      </Gate>
    </Frame>
  )
}

function Fixes() {
  const data = usePracticeQuizzes()
  const { list, activeId } = useProfiles()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const id = params.get('id')
  const [creating, setCreating] = useState(false)

  const madeById = useMemo(() => new Map(data.made.map((q) => [q.id, q])), [data.made])
  const fixById = useMemo(() => new Map(data.fixes.map((f) => [f.id, f])), [data.fixes])
  const staleIds = useMemo(() => new Set(data.stale.map((f) => f.id)), [data.stale])
  const profileName = list.find((x) => x.id === activeId)?.name ?? p.clubName

  const done = () => {
    setCreating(false)
    void data.reloadFixes()
    navigate(FIXES_PATH)
  }

  if (!data.loaded) return <Muted role="status">{p.loading}</Muted>

  const fix = id ? fixById.get(id) : undefined
  const made = id ? madeById.get(id) : undefined

  return (
    <>
      <PageTitle>{s.title}</PageTitle>
      <Muted>{s.intro(profileName)}</Muted>
      {data.fixesFailed && <ErrorText role="alert">{s.loadFailed}</ErrorText>}

      {id && (
        <Panel aria-labelledby="fix-one">
          <PanelTitle id="fix-one">{s.editing}</PanelTitle>
          {isManualId(id) ? (
            fix?.source === 'manual' ? (
              <ManualForm key={id} id={id} fix={fix} conventions={data.loaded} profileId={fix.quiz.profileId} onDone={done} />
            ) : (
              <Notice>{s.noSuchQuestion}</Notice>
            )
          ) : made ? (
            <AutoForm
              key={id}
              quiz={made}
              convention={data.byId.get(made.slug)}
              fix={fix?.source === 'auto' ? fix : undefined}
              stale={staleIds.has(id)}
              onDone={done}
            />
          ) : (
            <>
              <Notice>{s.notMade}</Notice>
              {fix && <RemoveFix id={id} onDone={done} />}
            </>
          )}
        </Panel>
      )}

      <Panel aria-labelledby="fix-new">
        <PanelTitle id="fix-new">{s.newTitle}</PanelTitle>
        {creating ? (
          <ManualForm conventions={data.loaded} profileId={activeId} onDone={done} onCancel={() => setCreating(false)} />
        ) : (
          <>
            <Muted>{s.newHint(profileName)}</Muted>
            <Row>
              <Button type="button" $variant="primary" onClick={() => setCreating(true)}>
                {s.newButton}
              </Button>
            </Row>
          </>
        )}
      </Panel>

      <Panel aria-labelledby="fix-list">
        <PanelTitle id="fix-list">{s.list(data.fixes.length)}</PanelTitle>
        {!data.fixes.length ? (
          <Muted>{s.none}</Muted>
        ) : (
          <FixList>
            {[...data.fixes]
              .sort((a, b) => b.at - a.at)
              .map((f) => (
                <li key={f.id}>
                  <Link to={fixPath(f.id)}>
                    {data.byId.get(f.id.split('/')[0])?.nameZh ?? f.id.split('/')[0]} · <code>{f.id}</code>
                  </Link>
                  <div>
                    {describe(f)}
                    {staleIds.has(f.id) && <Stale> · {s.stale}</Stale>}
                    {f.source === 'manual' && f.quiz.profileId !== activeId && (
                      <Muted as="span"> · {s.otherProfile(list.find((x) => x.id === f.quiz.profileId)?.name ?? f.quiz.profileId)}</Muted>
                    )}
                  </div>
                  <Muted as="div">
                    {s.by(f.by, new Date(f.at).toLocaleString('zh-TW', { dateStyle: 'short', timeStyle: 'short' }))}
                    {f.note && ` · ${f.note}`}
                  </Muted>
                </li>
              ))}
          </FixList>
        )}
      </Panel>
    </>
  )
}

function describe(fix: QuizFix): string {
  if (fix.source === 'manual') return fix.disabled ? `${s.kindManual}（${s.disabled}）` : s.kindManual
  const parts = [
    fix.disabled && s.disabled,
    fix.answer !== undefined && s.answerChanged,
    fix.choices !== undefined && s.choicesChanged,
  ].filter(Boolean)
  return parts.join('、')
}

const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

/** The choices as kept: the answer first (the practice page shuffles them), each once */
const choicesOf = (answer: string, others: string[]) => [answer, ...others.filter((o) => o !== answer)]

function SaveRow({ busy, error, onCancel }: { busy: boolean; error?: string; onCancel?: () => void }) {
  return (
    <>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      <Row>
        <Button type="submit" $variant="primary" disabled={busy}>
          {s.save}
        </Button>
        {onCancel && (
          <Button type="button" $variant="ghost" onClick={onCancel}>
            {s.cancel}
          </Button>
        )}
      </Row>
    </>
  )
}

function useSave(onDone: () => void) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const save = (fix: QuizFixInput) => {
    setBusy(true)
    setError(undefined)
    quizApi.saveFix(fix).then(onDone, (e: unknown) => {
      setError(errorText(e))
      setBusy(false)
    })
  }
  return { busy, error, setError, save }
}

function RemoveFix({ id, onDone, label = s.remove }: { id: string; onDone: () => void; label?: string }) {
  const [error, setError] = useState<string>()
  return (
    <>
      <Row>
        <Button
          type="button"
          $variant="danger"
          onClick={() => quizApi.removeFix(id).then(onDone, (e: unknown) => setError(errorText(e)))}
        >
          {label}
        </Button>
      </Row>
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </>
  )
}

/** A made question: what the handbook says, and the editor's change over it */
function AutoForm({
  quiz,
  convention,
  fix,
  stale,
  onDone,
}: {
  quiz: Quiz
  convention?: Convention
  fix?: Extract<QuizFix, { source: 'auto' }>
  /** The fix was written against other text and does not apply */
  stale: boolean
  onDone: () => void
}) {
  const madeOthers = (quiz.choices ?? []).filter((c) => c !== quiz.answer)
  const start = fix && !stale ? fix : undefined
  const [disabled, setDisabled] = useState(Boolean(start?.disabled))
  const [answer, setAnswer] = useState(start?.answer ?? quiz.answer)
  const [others, setOthers] = useState((start?.choices?.filter((c) => c !== (start.answer ?? quiz.answer)) ?? madeOthers).join('\n'))
  const [note, setNote] = useState(start?.note ?? '')
  const { busy, error, setError, save } = useSave(onDone)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const a = answer.trim()
    const rest = lines(others)
    if (!a) return setError(s.answerRequired)
    const choices = choicesOf(a, rest)
    if (choices.length < QUIZ_LIMITS.choicesMin || choices.length > QUIZ_LIMITS.choicesMax)
      return setError(s.choicesCount(QUIZ_LIMITS.choicesMin, QUIZ_LIMITS.choicesMax))
    const answerChanged = a !== quiz.answer
    const choicesChanged = rest.join('\n') !== madeOthers.join('\n')
    if (!disabled && !answerChanged && !choicesChanged) return setError(s.nothingChanged)
    save({
      source: 'auto',
      id: quiz.id,
      basis: basisOf(quiz),
      ...(disabled && { disabled: true }),
      ...(answerChanged && { answer: a }),
      ...(choicesChanged && { choices }),
      ...(note.trim() && { note: note.trim() }),
    })
  }

  return (
    <form onSubmit={submit}>
      <p>
        <Link to={sectionPath(quiz.slug, quiz.sectionId)}>
          {convention?.nameZh}
          {quiz.trail.length > 0 && ` › ${quiz.trail.join(' › ')}`}
        </Link>
      </p>
      {quiz.caption && <Muted>{quiz.caption}</Muted>}
      {quiz.auction && <AuctionTable auction={quiz.auction} />}
      <Source>
        <dt>{p.call}</dt>
        <dd>
          <CallLabel call={quiz.call ?? ''} />
        </dd>
        <dt>{s.madeAnswer}</dt>
        <dd>
          <RichText text={quiz.answer} />
        </dd>
        <dt>{s.madeOthers}</dt>
        <dd>
          <ul>
            {madeOthers.map((c, i) => (
              <li key={i}>
                <RichText text={c} />
              </li>
            ))}
          </ul>
        </dd>
      </Source>
      {stale && <Notice>{s.staleHere}</Notice>}
      <Check>
        <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />
        {s.disable}
      </Check>
      <Field>
        {s.answer}
        <TextArea rows={3} value={answer} maxLength={QUIZ_LIMITS.textMax} onChange={(e) => setAnswer(e.target.value)} />
      </Field>
      <Field>
        {s.others}
        <TextArea rows={4} value={others} onChange={(e) => setOthers(e.target.value)} />
        <small>{s.othersHint}</small>
      </Field>
      <Field>
        {s.note}
        <Input value={note} maxLength={QUIZ_LIMITS.noteMax} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <SaveRow busy={busy} error={error} />
      {fix && <RemoveFix id={fix.id} onDone={onDone} label={s.restore} />}
    </form>
  )
}

const SUITS = [
  ['spades', '♠'],
  ['hearts', '♥'],
  ['diamonds', '♦'],
  ['clubs', '♣'],
] as const

/** A hand-made question, new or saved */
function ManualForm({
  id,
  fix,
  conventions,
  profileId,
  onDone,
  onCancel,
}: {
  id?: string
  fix?: Extract<QuizFix, { source: 'manual' }>
  conventions: Convention[]
  profileId: string
  onDone: () => void
  onCancel?: () => void
}) {
  const q = fix?.quiz
  const [slug, setSlug] = useState(q?.slug ?? conventions[0]?.slug ?? '')
  const convention = conventions.find((c) => c.slug === slug)
  const sections = useMemo(() => {
    const out: { id: string; title: string }[] = []
    if (convention)
      walkSections(convention.sections, (section, ancestors) =>
        out.push({ id: section.id, title: [...ancestors.map((a) => a.title), section.title].join(' › ') }),
      )
    return out
  }, [convention])
  const [sectionId, setSectionId] = useState(q?.sectionId ?? '')
  const section = sections.some((x) => x.id === sectionId) ? sectionId : (sections[0]?.id ?? '')
  const [kind, setKind] = useState<ManualQuiz['kind']>(q?.kind ?? 'meaning')
  const [seats, setSeats] = useState((q?.auction?.seats ?? DEFAULT_SEATS).join(' '))
  const [auction, setAuction] = useState(q?.auction ? q.auction.calls.map(cellText).join(' ') : '')
  const [call, setCall] = useState(q?.call ?? '')
  const [hand, setHand] = useState<QuizHand>(q?.hand ?? { spades: '', hearts: '', diamonds: '', clubs: '' })
  const [answer, setAnswer] = useState(q?.answer ?? '')
  const [others, setOthers] = useState(q ? q.choices.filter((c) => c !== q.answer).join('\n') : '')
  const [level, setLevel] = useState<Level | ''>(q?.level ?? '')
  const [caption, setCaption] = useState(q?.caption ?? '')
  const [disabled, setDisabled] = useState(Boolean(fix?.disabled))
  const [note, setNote] = useState(fix?.note ?? '')
  const { busy, error, setError, save } = useSave(onDone)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!slug || !section) return setError(s.placeRequired)
    const isCall = kind === 'call'
    const a = isCall ? normaliseCall(answer) : answer.trim()
    if (!a) return setError(s.answerRequired)
    const rest = lines(others).map((o) => (isCall ? normaliseCall(o) : o))
    const choices = choicesOf(a, rest)
    if (choices.length < QUIZ_LIMITS.choicesMin || choices.length > QUIZ_LIMITS.choicesMax)
      return setError(s.choicesCount(QUIZ_LIMITS.choicesMin, QUIZ_LIMITS.choicesMax))
    const seatList = seats.trim().split(/\s+/)
    const calls = auction.trim() ? auction.trim().split(/\s+/).map(cellCall) : []
    if (calls.length && seatList.length !== 4) return setError(s.seatsCount)
    if (!isCall && !call.trim()) return setError(s.callRequired)
    if (isCall && !SUITS.some(([k]) => hand[k].trim())) return setError(s.handRequired)
    const quiz: ManualQuiz = {
      kind,
      profileId,
      slug,
      sectionId: section,
      ...(calls.length && { auction: { seats: seatList as [string, string, string, string], calls } }),
      ...(isCall ? { hand } : { call: normaliseCall(call) }),
      answer: a,
      choices,
      ...(level && { level }),
      ...(caption.trim() && { caption: caption.trim() }),
    }
    // A saved question moved to another section gets a new id (the id names its place)
    const keepId = id && fix && fix.quiz.slug === slug && fix.quiz.sectionId === section ? id : manualId(slug, section)
    save({ source: 'manual', id: keepId, quiz, ...(disabled && { disabled: true }), ...(note.trim() && { note: note.trim() }) })
  }

  const preview = kind === 'call' && SUITS.some(([k]) => hand[k].trim())
  const previewAuction = auction.trim() && seats.trim().split(/\s+/).length === 4

  return (
    <form onSubmit={submit}>
      <Grid>
        <Field>
          {s.convention}
          <Select value={slug} onChange={(e) => setSlug(e.target.value)}>
            {conventions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nameZh}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          {s.section}
          <Select value={section} onChange={(e) => setSectionId(e.target.value)}>
            {sections.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          {s.kind}
          <Select value={kind} onChange={(e) => setKind(e.target.value as ManualQuiz['kind'])}>
            <option value="meaning">{s.kindMeaning}</option>
            <option value="call">{s.kindCall}</option>
          </Select>
        </Field>
        <Field>
          {p.level}
          <Select value={level} onChange={(e) => setLevel(e.target.value as Level | '')}>
            <option value="">{s.noLevel}</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {strings.levels[l]}
              </option>
            ))}
          </Select>
        </Field>
      </Grid>
      <Field>
        {s.caption}
        <Input value={caption} maxLength={QUIZ_LIMITS.textMax} onChange={(e) => setCaption(e.target.value)} />
      </Field>
      <Grid>
        <Field>
          {s.seats}
          <Input value={seats} onChange={(e) => setSeats(e.target.value)} />
        </Field>
        <Field>
          {s.auction}
          <Input value={auction} onChange={(e) => setAuction(e.target.value)} />
          <small>{s.auctionHint}</small>
        </Field>
      </Grid>
      {previewAuction && (
        <AuctionTable
          auction={{ seats: seats.trim().split(/\s+/) as [string, string, string, string], calls: auction.trim().split(/\s+/).map(cellCall) }}
        />
      )}
      {kind === 'meaning' ? (
        <Field>
          {p.call}
          <Input value={call} onChange={(e) => setCall(e.target.value)} />
        </Field>
      ) : (
        <>
          <Grid role="group" aria-label={p.yourHand}>
            {SUITS.map(([key, symbol]) => (
              <Field key={key}>
                {symbol}
                <Input
                  value={hand[key]}
                  maxLength={20}
                  aria-label={symbol}
                  onChange={(e) => setHand({ ...hand, [key]: e.target.value.toUpperCase().replace('10', 'T') })}
                />
              </Field>
            ))}
          </Grid>
          {preview && <Hand hand={hand} label={p.yourHand} />}
        </>
      )}
      <Field>
        {kind === 'call' ? s.answerCall : s.answer}
        {kind === 'call' ? (
          <Input value={answer} onChange={(e) => setAnswer(e.target.value)} />
        ) : (
          <TextArea rows={3} value={answer} maxLength={QUIZ_LIMITS.textMax} onChange={(e) => setAnswer(e.target.value)} />
        )}
      </Field>
      <Field>
        {s.others}
        <TextArea rows={4} value={others} onChange={(e) => setOthers(e.target.value)} />
        <small>{kind === 'call' ? s.othersCallHint : s.othersHint}</small>
      </Field>
      <Check>
        <input type="checkbox" checked={disabled} onChange={(e) => setDisabled(e.target.checked)} />
        {s.disable}
      </Check>
      <Field>
        {s.note}
        <Input value={note} maxLength={QUIZ_LIMITS.noteMax} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <SaveRow busy={busy} error={error} onCancel={onCancel} />
      {fix && id && <RemoveFix id={id} onDone={onDone} label={s.removeManual} />}
    </form>
  )
}

const Source = styled.dl`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(4)};
  margin: ${({ theme }) => theme.space(4)} 0;
  line-height: 1.6;

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.8125rem;
  }
  dd {
    margin: 0;
  }
  ul {
    margin: 0;
    padding-left: 1.25em;
  }
`

const Check = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  min-height: 2.25rem;
  margin-bottom: ${({ theme }) => theme.space(3)};
  cursor: pointer;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: ${({ theme }) => theme.space(3)};
`

const FixList = styled.ul`
  margin: 0;
  padding-left: 1.25em;
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  line-height: 1.6;

  code {
    font-size: 0.8125rem;
  }
`

const Stale = styled.span`
  color: ${({ theme }) => theme.colors.seal};
  font-weight: 600;
`
