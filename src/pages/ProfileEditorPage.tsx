import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { DataTable, TableScroll } from '../components/DataTable.tsx'
import { SectionForm } from '../components/editor/SectionForm.tsx'
import { Button, ErrorText, Field, Input, Muted, Notice, PageTitle, Panel, PanelTitle, Row, Select, TextArea } from '../components/ui.tsx'
import {
  api,
  ApiError,
  errorText,
  PROFILE_LIMITS,
  type Adoption,
  type ProfileAccess,
  type ProfileInput,
  type SystemProfile,
} from '../lib/api.ts'
import { formatCall } from '../lib/calls.ts'
import { formatDateTime } from '../lib/format.ts'
import {
  addNote,
  editNote,
  findRowOverride,
  findSection,
  flatSections,
  grouped,
  inheritedAdoption,
  inputProblems,
  parentContent,
  parentsOf,
  removeNote,
  removeRowOverride,
  removeSectionOverride,
  responseRows,
  rowHere,
  rowOverrides,
  sameInput,
  sectionHere,
  sectionOverrides,
  setAdoption,
  setRowOverride,
  setSectionOverride,
  toInput,
  type InputProblem,
  type RowRef,
} from '../lib/profileEdit.ts'
import { summaryChain, type ResolvedConvention } from '../lib/profiles.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { strings } from '../strings.ts'
import type { Section } from '../types/convention.ts'
import { Frame, Gate } from './Frame.tsx'
import { profileEdit as t } from './profileEditStrings.ts'

/**
 * 編輯制度集 (/profiles/:id/edit, E1 e1-t14, AC-1.5 AC-1.6): which conventions the profile plays,
 * the rows it reads otherwise (改成…), the sections it replaces (換成…) and its private notes, all
 * kept as one `ProfileInput` and saved together against the version loaded, so a save never
 * overwrites someone else's (409 `profileConflict`). The handbook's text is only shown, never
 * changed (CLAUDE.md rule 1). Members without `access.edit` see it read-only.
 */
export function ProfileEditorPage() {
  return (
    <Frame title={t.title}>
      <Gate need="member">
        <Editor />
      </Gate>
    </Frame>
  )
}

interface Loaded {
  profile: SystemProfile
  access: ProfileAccess | undefined
  /** From the club down to the parent */
  parents: SystemProfile[]
  /** Every convention as the parent shows it */
  base: ResolvedConvention[]
}

function Editor() {
  const { id = '' } = useParams()
  const content = useContent()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [input, setInput] = useState<ProfileInput | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [conflict, setConflict] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveNote, setSaveNote] = useState('')
  const loadAll = useRef(content.loadAll)
  useEffect(() => {
    loadAll.current = content.loadAll
  })

  // Sets state only after the first answer arrives, so the effect below starts it without a render
  const load = useCallback(async () => {
    try {
      const [{ profile, access }, summaries, all] = await Promise.all([
        api.book.profileWithAccess(id),
        api.book.profiles(),
        loadAll.current(),
      ])
      const above = summaryChain(summaries, id).filter((s) => s.id !== profile.id)
      const fetched = await Promise.all(above.reverse().map((s) => api.book.profile(s.id)))
      const parents = parentsOf(fetched, profile)
      setLoaded({ profile, access, parents, base: parentContent(parents, all) })
      setInput(toInput(profile))
      setConflict(false)
      setError('')
    } catch (e) {
      setError(errorText(e))
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const dirty = !!loaded && !!input && !sameInput(input, toInput(loaded.profile))
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = t.leaveWarning
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  if (!loaded || !input)
    return (
      <>
        <PageTitle>{t.title}</PageTitle>
        {error ? <ErrorText role="alert">{error}</ErrorText> : <Muted role="status">{t.loading}</Muted>}
      </>
    )

  const { profile, access, parents, base } = loaded
  const editable = !!access?.edit
  const parent = parents[parents.length - 1]
  const change = (next: ProfileInput) => {
    setInput(next)
    setNotice('')
  }

  const save = async () => {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const saved = await api.book.saveProfile(profile.id, input, profile.version, saveNote.trim() || undefined)
      setLoaded({ ...loaded, profile: saved })
      setInput(toInput(saved))
      setSaveNote('')
      setNotice(t.savedVersion(saved.version))
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setConflict(true)
      else setError(errorText(e))
    } finally {
      setSaving(false)
    }
  }

  const problems = inputProblems(input)
  return (
    <>
      <PageTitle>{t.titleOf(profile.name)}</PageTitle>
      <Muted>
        {strings.profiles.scopes[profile.scope]}・{parent ? t.parent(parent.name) : t.noParent}{' '}
        <Link to={`/profiles/${encodeURIComponent(profile.id)}/compare`}>{t.compare}</Link>
      </Muted>
      <Muted>{t.intro}</Muted>
      {!editable && <Notice role="status">{t.readOnly}</Notice>}
      <Fields disabled={!editable}>
        <AdoptionPanel input={input} parents={parents} onChange={change} />
        <RowPanel input={input} base={base} onChange={change} />
        <SectionPanel input={input} base={base} onChange={change} />
        <NotesPanel input={input} base={base} onChange={change} />
      </Fields>
      {editable && (
        <Panel aria-labelledby="profile-save">
          <PanelTitle id="profile-save">{t.saveTitle}</PanelTitle>
          <Stack>
            <Field>
              {t.saveNote}
              <Input value={saveNote} onChange={(e) => setSaveNote(e.target.value)} />
            </Field>
            {problems.length > 0 && (
              <ErrorText role="alert">{problems.map(problemText).join('\n')}</ErrorText>
            )}
            <Row>
              <Button
                type="button"
                $variant="primary"
                disabled={saving || !dirty || problems.length > 0 || conflict}
                onClick={() => void save()}
              >
                {saving ? t.saving : t.save}
              </Button>
              <Muted role="status">{dirty ? t.unsaved : !notice && t.noChanges}</Muted>
            </Row>
            {conflict && (
              <ErrorText role="alert">
                {t.conflict}{' '}
                <Button type="button" $small onClick={() => void load()}>
                  {t.reload}
                </Button>
              </ErrorText>
            )}
            {notice && <Notice role="status">{notice}</Notice>}
          </Stack>
        </Panel>
      )}
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </>
  )
}

function problemText(problem: InputProblem): string {
  switch (problem.kind) {
    case 'tooManyOverrides':
      return t.problems.tooManyOverrides(problem.count)
    case 'noteTooLong':
      return t.problems.noteTooLong(problem.index + 1)
    case 'emptyNote':
      return t.problems.emptyNote(problem.index + 1)
    case 'emptyMeaning':
      return t.problems.emptyMeaning(problem.index + 1)
    case 'tooLarge':
      return t.problems.tooLarge
  }
}

type Change = (next: ProfileInput) => void

/** 採用的特約: each convention follows the parent, or is played or not by this profile itself */
function AdoptionPanel({ input, parents, onChange }: { input: ProfileInput; parents: SystemProfile[]; onChange: Change }) {
  const { categories, conventions } = useContent()
  const own = Object.values(input.adopted)
  return (
    <Panel aria-labelledby="profile-adoption">
      <PanelTitle id="profile-adoption">{t.adoptionTitle}</PanelTitle>
      <Stack>
        <Muted>{t.adoptionIntro}</Muted>
        <Muted>{t.adoptionCount(own.filter((v) => v === 'on').length, own.filter((v) => v === 'off').length)}</Muted>
        {grouped(categories, conventions).map(({ category, conventions: items }) => (
          <Group key={category?.id ?? ''}>
            <GroupTitle>{category?.label ?? t.otherCategory}</GroupTitle>
            {items.map((c) => {
              const inherited = inheritedAdoption(parents, c.slug)
              const value = input.adopted[c.slug]
              return (
                <AdoptionRow key={c.slug} $off={(value ?? inherited) === 'off'}>
                  <span id={`adopt-${c.slug}`}>{c.nameZh}</span>
                  <Select
                    aria-labelledby={`adopt-${c.slug}`}
                    value={value ?? ''}
                    onChange={(e) => onChange(setAdoption(input, c.slug, (e.target.value || undefined) as Adoption | undefined))}
                  >
                    <option value="">{parents.length ? t.follow(inherited === 'on') : t.defaultOn}</option>
                    <option value="on">{t.on}</option>
                    <option value="off">{t.off}</option>
                  </Select>
                </AdoptionRow>
              )
            })}
          </Group>
        ))}
      </Stack>
    </Panel>
  )
}

/** A convention, then one of its sections (or the whole convention, with `whole`) */
function Place({
  base,
  slug,
  sectionId,
  onChange,
  whole,
  children,
}: {
  base: ResolvedConvention[]
  slug: string
  sectionId: string
  onChange: (slug: string, sectionId: string) => void
  whole?: boolean
  children?: ReactNode
}) {
  const convention = base.find((c) => c.slug === slug)
  return (
    <Picks>
      <Field>
        {t.convention}
        <Select value={slug} onChange={(e) => onChange(e.target.value, '')}>
          <option value="">{t.pickConvention}</option>
          {base.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.nameZh}
            </option>
          ))}
        </Select>
      </Field>
      {convention && (
        <Field>
          {t.section}
          <Select value={sectionId} onChange={(e) => onChange(slug, e.target.value)}>
            <option value="">{whole ? t.wholeConvention : t.pickSection}</option>
            {flatSections(convention.sections).map(({ section, depth }) => (
              <option key={section.id} value={section.id}>
                {'　'.repeat(depth)}
                {section.title}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {children}
    </Picks>
  )
}

const nameOf = (base: ResolvedConvention[], slug: string) => base.find((c) => c.slug === slug)?.nameZh ?? slug
const titleOf = (base: ResolvedConvention[], slug: string, sectionId: string) => {
  const convention = base.find((c) => c.slug === slug)
  return (convention && findSection(convention.sections, sectionId)?.title) ?? sectionId
}

type RowDraft = { slug: string; sectionId: string; row: string; meaning: string; note: string }
const emptyRow: RowDraft = { slug: '', sectionId: '', row: '', meaning: '', note: '' }
const rowKey = (ref: Pick<RowRef, 'blockIndex' | 'rowIndex'>) => `${ref.blockIndex}:${ref.rowIndex}`

/** 改成…: a response row means something else in this profile */
function RowPanel({ input, base, onChange }: { input: ProfileInput; base: ResolvedConvention[]; onChange: Change }) {
  const [draft, setDraft] = useState<RowDraft>(emptyRow)
  const convention = base.find((c) => c.slug === draft.slug)
  const section = draft.sectionId ? sectionHere(convention, input, draft.slug, draft.sectionId) : undefined
  const rows = section ? responseRows(section) : []
  const ref = useMemo((): RowRef | null => {
    if (!draft.row) return null
    const [blockIndex, rowIndex] = draft.row.split(':').map(Number) as [number, number]
    return { slug: draft.slug, sectionId: draft.sectionId, blockIndex, rowIndex }
  }, [draft.slug, draft.sectionId, draft.row])
  const original = ref ? rowHere(convention, input, ref) : undefined

  /** Picks a row and fills in this profile's override of it, or the original */
  const pick = (next: RowRef) => {
    const existing = findRowOverride(input, next)
    const row = rowHere(base.find((c) => c.slug === next.slug), input, next)
    setDraft({
      slug: next.slug,
      sectionId: next.sectionId,
      row: rowKey(next),
      meaning: existing?.meaning ?? row?.meaning ?? '',
      note: existing?.note ?? row?.note ?? '',
    })
  }

  const apply = () => {
    if (!ref || !draft.meaning.trim()) return
    // The note as it was keeps the row's own; an emptied one clears it
    const note = draft.note === (original?.note ?? '') ? undefined : draft.note
    onChange(setRowOverride(input, ref, draft.meaning.trim(), note?.trim()))
    setDraft(emptyRow)
  }

  const list = rowOverrides(input)
  return (
    <Panel aria-labelledby="profile-rows">
      <PanelTitle id="profile-rows">{t.rowTitle}</PanelTitle>
      <Stack>
        <Muted>{t.rowIntro}</Muted>
        {list.length ? (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <th>{t.convention}</th>
                  <th>{t.section}</th>
                  <th>{t.row}</th>
                  <th>{t.original}</th>
                  <th>{t.newMeaning}</th>
                  <th>
                    <span className="visually-hidden">{t.edit}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => {
                  const row = rowHere(base.find((c) => c.slug === o.slug), input, o)
                  return (
                    <tr key={`${o.slug}/${o.sectionId}/${rowKey(o)}`}>
                      <td>{nameOf(base, o.slug)}</td>
                      <td>{titleOf(base, o.slug, o.sectionId)}</td>
                      <NoWrap>{row ? formatCall(row.call) : ''}</NoWrap>
                      <td>{row ? row.meaning : t.missingRow}</td>
                      <td>
                        {o.meaning}
                        {o.note && <Small>{o.note}</Small>}
                      </td>
                      <td>
                        <Row>
                          <Button type="button" $small onClick={() => pick(o)}>
                            {t.edit}
                          </Button>
                          <Button type="button" $small $variant="danger" onClick={() => onChange(removeRowOverride(input, o))}>
                            {t.remove}
                          </Button>
                        </Row>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </TableScroll>
        ) : (
          <Muted>{t.noRowOverrides}</Muted>
        )}
        <Place base={base} slug={draft.slug} sectionId={draft.sectionId} onChange={(slug, sectionId) => setDraft({ ...emptyRow, slug, sectionId })}>
          {section &&
            (rows.length ? (
              <Field>
                {t.row}
                <Select
                  value={draft.row}
                  onChange={(e) => {
                    const [blockIndex, rowIndex] = e.target.value.split(':').map(Number) as [number, number]
                    if (e.target.value) pick({ slug: draft.slug, sectionId: draft.sectionId, blockIndex, rowIndex })
                    else setDraft({ ...draft, row: '' })
                  }}
                >
                  <option value="">{t.pickRow}</option>
                  {rows.map(({ blockIndex, rowIndex, row }) => (
                    <option key={rowKey({ blockIndex, rowIndex })} value={rowKey({ blockIndex, rowIndex })}>
                      {formatCall(row.call)}　{short(row.meaning)}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Muted>{t.noRows}</Muted>
            ))}
        </Place>
        {ref && original && (
          <Stack>
            <Original>
              <strong>{t.original}</strong>
              <span>
                {formatCall(original.call)}　{original.meaning}
              </span>
              {original.note && (
                <span>
                  {t.originalNote}：{original.note}
                </span>
              )}
            </Original>
            <Field>
              {t.newMeaning}
              <TextArea value={draft.meaning} onChange={(e) => setDraft({ ...draft, meaning: e.target.value })} />
            </Field>
            <Field>
              {t.newNote}
              <Input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
              <small>{t.newNoteHint}</small>
            </Field>
            <Row>
              <Button type="button" $variant="primary" disabled={!draft.meaning.trim()} onClick={apply}>
                {findRowOverride(input, ref) ? t.updateRow : t.addRow}
              </Button>
              <Button type="button" onClick={() => setDraft(emptyRow)}>
                {strings.cancel}
              </Button>
            </Row>
          </Stack>
        )}
      </Stack>
    </Panel>
  )
}

const short = (text: string) => (text.length > 30 ? `${text.slice(0, 30)}…` : text)

type Replacing = { slug: string; sectionId: string; section: Section }

/** 換成…: a whole section replaced by this profile's own version, edited with the editor's form */
function SectionPanel({ input, base, onChange }: { input: ProfileInput; base: ResolvedConvention[]; onChange: Change }) {
  const [place, setPlace] = useState({ slug: '', sectionId: '' })
  const [replacing, setReplacing] = useState<Replacing | null>(null)
  const open = (slug: string, sectionId: string) => {
    const section = sectionHere(base.find((c) => c.slug === slug), input, slug, sectionId)
    if (section) setReplacing({ slug, sectionId, section })
  }
  const done = () => {
    if (!replacing) return
    onChange(setSectionOverride(input, replacing.slug, replacing.sectionId, replacing.section))
    setReplacing(null)
    setPlace({ slug: '', sectionId: '' })
  }
  const list = sectionOverrides(input)
  return (
    <Panel aria-labelledby="profile-sections">
      <PanelTitle id="profile-sections">{t.sectionTitle}</PanelTitle>
      <Stack>
        <Muted>{t.sectionIntro}</Muted>
        {list.length ? (
          <Items>
            {list.map((o) => (
              <li key={`${o.slug}/${o.sectionId}`}>
                <span>
                  {nameOf(base, o.slug)}・{titleOf(base, o.slug, o.sectionId)}
                  {o.section.title !== titleOf(base, o.slug, o.sectionId) && ` → ${o.section.title}`}
                </span>
                <Row>
                  <Button type="button" $small onClick={() => open(o.slug, o.sectionId)}>
                    {t.edit}
                  </Button>
                  <Button type="button" $small $variant="danger" onClick={() => onChange(removeSectionOverride(input, o.slug, o.sectionId))}>
                    {t.revert}
                  </Button>
                </Row>
              </li>
            ))}
          </Items>
        ) : (
          <Muted>{t.noSectionOverrides}</Muted>
        )}
        {replacing ? (
          <Replacement aria-label={t.replacedSection(titleOf(base, replacing.slug, replacing.sectionId))}>
            <strong>{t.replacedSection(titleOf(base, replacing.slug, replacing.sectionId))}</strong>
            <SectionForm
              key={`${replacing.slug}/${replacing.sectionId}`}
              section={replacing.section}
              can={{ up: false, down: false, indent: false, outdent: false }}
              takenIds={[]}
              onChange={(section) => setReplacing({ ...replacing, section })}
              onAction={() => {}}
              replacing
            />
            <Row>
              <Button type="button" $variant="primary" onClick={done}>
                {t.done}
              </Button>
              <Button type="button" onClick={() => setReplacing(null)}>
                {strings.cancel}
              </Button>
            </Row>
          </Replacement>
        ) : (
          <Place base={base} slug={place.slug} sectionId={place.sectionId} onChange={(slug, sectionId) => setPlace({ slug, sectionId })}>
            {place.sectionId && (
              <Button type="button" onClick={() => open(place.slug, place.sectionId)}>
                {t.replace}
              </Button>
            )}
          </Place>
        )}
      </Stack>
    </Panel>
  )
}

const now = () => Date.now()

type NoteDraft = { index: number | null; slug: string; sectionId: string; text: string }
const emptyNote: NoteDraft = { index: null, slug: '', sectionId: '', text: '' }

/** 備忘: private notes on a convention or a section, for the profile's members */
function NotesPanel({ input, base, onChange }: { input: ProfileInput; base: ResolvedConvention[]; onChange: Change }) {
  const { user } = useAuth()
  const [draft, setDraft] = useState<NoteDraft>(emptyNote)
  const text = draft.text.trim()
  const valid = !!draft.slug && !!text && text.length <= PROFILE_LIMITS.noteMax
  const apply = () => {
    if (!valid || !user) return
    const at = now()
    onChange(
      draft.index === null
        ? addNote(input, { slug: draft.slug, ...(draft.sectionId && { sectionId: draft.sectionId }), text, by: user.id, at })
        : editNote(input, draft.index, text, user.id, at),
    )
    setDraft(emptyNote)
  }
  const author = (by: string) => (by === user?.id ? user.username : by)
  return (
    <Panel aria-labelledby="profile-notes">
      <PanelTitle id="profile-notes">{t.notesTitle}</PanelTitle>
      <Stack>
        <Muted>{t.notesIntro}</Muted>
        {input.notes.length ? (
          <Items>
            {input.notes.map((note, i) => (
              <li key={i}>
                <div>
                  <strong>
                    {nameOf(base, note.slug)}
                    {note.sectionId && `・${titleOf(base, note.slug, note.sectionId)}`}
                  </strong>
                  <NoteText>{note.text}</NoteText>
                  <Small>{t.noteBy(author(note.by), formatDateTime(note.at))}</Small>
                </div>
                <Row>
                  <Button
                    type="button"
                    $small
                    onClick={() => setDraft({ index: i, slug: note.slug, sectionId: note.sectionId ?? '', text: note.text })}
                  >
                    {t.edit}
                  </Button>
                  <Button type="button" $small $variant="danger" onClick={() => onChange(removeNote(input, i))}>
                    {t.remove}
                  </Button>
                </Row>
              </li>
            ))}
          </Items>
        ) : (
          <Muted>{t.noNotes}</Muted>
        )}
        {draft.index === null ? (
          <Place
            base={base}
            slug={draft.slug}
            sectionId={draft.sectionId}
            onChange={(slug, sectionId) => setDraft({ ...draft, slug, sectionId })}
            whole
          />
        ) : (
          <Muted>
            {nameOf(base, draft.slug)}
            {draft.sectionId && `・${titleOf(base, draft.slug, draft.sectionId)}`}
          </Muted>
        )}
        {draft.slug && (
          <>
            <Field>
              {t.noteText}
              <TextArea
                value={draft.text}
                aria-invalid={text.length > PROFILE_LIMITS.noteMax}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              />
              <small>{t.noteCount(text.length)}</small>
            </Field>
            <Row>
              <Button type="button" $variant="primary" disabled={!valid} onClick={apply}>
                {draft.index === null ? t.addNote : t.updateNote}
              </Button>
              <Button type="button" onClick={() => setDraft(emptyNote)}>
                {strings.cancel}
              </Button>
            </Row>
          </>
        )}
      </Stack>
    </Panel>
  )
}

/** Disables every control inside when the member may only read */
const Fields = styled.fieldset`
  display: grid;
  gap: ${({ theme }) => theme.space(5)};
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
`

const Stack = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`

const Group = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
`

const GroupTitle = styled.h3`
  margin: ${({ theme }) => theme.space(2)} 0 0;
  font-size: 0.9375rem;
`

const AdoptionRow = styled.div<{ $off: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 14rem);
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(1)} 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme, $off }) => ($off ? theme.colors.textMuted : theme.colors.text)};
`

const Picks = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  align-items: end;
  gap: ${({ theme }) => theme.space(3)};
`

const Original = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  font-size: 0.875rem;
  white-space: pre-wrap;
`

const Replacement = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
`

const Items = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: ${({ theme }) => theme.space(2)};
    padding: ${({ theme }) => theme.space(2)} 0;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`

const NoteText = styled.p`
  margin: ${({ theme }) => theme.space(0.5)} 0;
  white-space: pre-wrap;
`

const Small = styled.small`
  display: block;
  color: ${({ theme }) => theme.colors.textMuted};
`

/** Top-aligned: a meaning can run to several lines */
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
