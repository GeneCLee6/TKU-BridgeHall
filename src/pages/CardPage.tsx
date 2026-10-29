import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { brownStickerForms } from '../cards/bsc.ts'
import { CardSheet, Ink } from '../cards/CardSheet.tsx'
import { cellSummary, describeSlots, PAPER_WIDTH, type SlotInfo } from '../cards/describe.ts'
import { fillProfileCard, setCardEdit, storedSlot } from '../cards/edits.ts'
import type { CardEdit, FillProblem, FilledCard, FilledCell } from '../cards/fill.ts'
import { cardTemplates, profileTemplates } from '../cards/templates/index.ts'
import type { CardTemplate } from '../cards/types.ts'
import { fetchCard, type LoadedCard as Loaded } from '../cards/load.ts'
import { PrintStyle } from '../cards/PrintStyle.tsx'
import { OriginMark } from '../components/ProfileMarks.tsx'
import { Button, ErrorText, Field, Muted, Row, Select, TextArea } from '../components/ui.tsx'
import { ApiError, api, CLUB_PROFILE_ID, errorText, type ProfileCardEdit } from '../lib/api.ts'
import { toInput } from '../lib/profileEdit.ts'
import { resolveProfile } from '../lib/profiles.ts'
import { conventionPath, findSectionPath, sectionPath } from '../lib/sections.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { strings } from '../strings.ts'
import { cardColors, layout, mobile } from '../styles/tokens.ts'
import { CardTabs, CardVersions, WordDownload } from './CardOutputs.tsx'
import { CTCBA_CARDS_URL, cardStrings as t } from './cardStrings.ts'
import { Frame } from './Frame.tsx'

/**
 * 制度卡 (/cards/:profileId/:templateId, E3 e3-t05–t07): a system profile's convention card,
 * filled from the conventions it plays (cards/fill.ts) with the hand edits of every profile from
 * the club down (cards/edits.ts) on top. The template tabs switch the form; a cell shows its help
 * on hover, and selecting it shows the help, where the text comes from with links to the handbook,
 * and, for someone who may edit the profile, the hand edit: text, tick or option, a flag for the
 * partnership, and 重設. Edits are saved with the profile as `cardEdits`, the whole profile with
 * its `baseVersion` like the profile editor (409: reload). Printing (and 下載 PDF, which is the
 * browser's print to PDF) prints the sheets alone, black on white, on A4 at the form's size.
 *
 * Read the way the profile is readable: signed out, the club's only. When the Worker cannot be
 * reached the club's card is filled from the handbook's own content.
 *
 * A convention the profile plays that is marked Brown Sticker adds a tab for its announcement form
 * (/cards/:profileId/bsc-opening/:form, e3-t12, cards/bsc.ts), filled from that convention alone;
 * its hand edits are kept per convention, and it has no versions.
 */
export function CardPage() {
  const { profileId = CLUB_PROFILE_ID, templateId = '', form } = useParams()
  const template = cardTemplates.find((x) => x.id === templateId)
  if (!templateId) return <Navigate to={`/cards/${encodeURIComponent(profileId)}/${profileTemplates[0]!.id}`} replace />
  const known = template && !!template.brownSticker === (form !== undefined)
  return (
    <Frame wide>
      <Main id="main">
        {known ? <Card key={profileId} profileId={profileId} template={template} form={form} /> : <NotFound />}
      </Main>
    </Frame>
  )
}

function NotFound() {
  usePageTitle(t.title)
  return (
    <Toolbar>
      <h1>{t.title}</h1>
      <ErrorText role="alert">{t.notFound}</ErrorText>
    </Toolbar>
  )
}

function Card({ profileId, template, form }: { profileId: string; template: CardTemplate; form?: string }) {
  const content = useContent()
  const { user, can } = useAuth()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState<Loaded | { error: string } | null>(null)
  const [own, setOwn] = useState<Record<string, ProfileCardEdit> | undefined>(undefined)
  // A link from a section's 「在制度卡的位置」 (e3-t10) selects its cell
  const [searchParams] = useSearchParams()
  const [selected, setSelected] = useState<string | undefined>(() => searchParams.get('cell') ?? undefined)
  const [saving, setSaving] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const loadAll = useRef(content.loadAll)
  useEffect(() => {
    loadAll.current = content.loadAll
  })

  const apply = useCallback((next: Loaded | { error: string }) => {
    setLoaded(next)
    if ('chain' in next) setOwn(next.chain[next.chain.length - 1]!.cardEdits)
    setConflict(false)
    setNotice('')
    setError('')
  }, [])
  const reload = () => void fetchCard(profileId, loadAll.current).then(apply)

  useEffect(() => {
    let current = true
    void fetchCard(profileId, loadAll.current).then((next) => {
      if (current) apply(next)
    })
    return () => {
      current = false
    }
  }, [profileId, apply])

  const ready = loaded && 'chain' in loaded ? loaded : undefined
  const profile = ready?.chain[ready.chain.length - 1]
  const resolution = useMemo(
    () => (ready && profile ? resolveProfile(ready.chain, profile.id, ready.content) : undefined),
    [ready, profile],
  )
  const forms = useMemo(() => (resolution ? brownStickerForms(resolution) : []), [resolution])
  const card = useMemo(() => {
    if (!resolution) return undefined
    return form === undefined ? fillProfileCard(template, resolution, own) : fillProfileCard(template, resolution, own, form)
  }, [template, resolution, own, form])
  const slots = useMemo(() => describeSlots(template), [template])
  const formOf = form === undefined ? undefined : forms.find((f) => f.template.id === template.id && f.convention.slug === form)
  const name = formOf ? t.bsc.tab(template.nameZh ?? template.name, formOf.convention.nameZh) : (template.nameZh ?? template.name)
  usePageTitle(profile ? t.pageTitle(profile.name, name) : t.title)

  // Edits are kept per profile: switching templates keeps them; only the card's own ids count here
  const dirtySlots = useMemo(() => changedSlots(profile?.cardEdits, own), [profile, own])
  const dirty = dirtySlots.length > 0
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const sourceLink = useCallback(
    (source: { slug: string; sectionId?: string }) => {
      const convention = ready?.content.find((x) => x.slug === source.slug)
      const conventionName = convention?.nameZh ?? source.slug
      if (!source.sectionId) return { to: conventionPath(source.slug), name: conventionName }
      const trail = convention ? findSectionPath(convention, source.sectionId).map((s) => s.title) : []
      return {
        to: sectionPath(source.slug, source.sectionId),
        name: t.inspector.source(conventionName, trail.length ? trail.join(' › ') : undefined),
      }
    },
    [ready],
  )

  if (!loaded) return <Muted role="status">{t.loading}</Muted>
  if ('error' in loaded)
    return (
      <Toolbar>
        <h1>{t.title}</h1>
        <ErrorText role="alert">
          {t.failed}
          {loaded.error}
        </ErrorText>
      </Toolbar>
    )
  if (!ready || !profile || !resolution) return null
  const tabs = (
    <CardTabs
      current={form === undefined ? template.id : `${template.id}/${form}`}
      to={(key) => `/cards/${encodeURIComponent(profile.id)}/${key}`}
      forms={forms.map((f) => ({
        key: `${f.template.id}/${f.convention.slug}`,
        label: t.bsc.tab(f.template.nameZh ?? f.template.name, f.convention.nameZh),
      }))}
    />
  )
  if (!card)
    return (
      <Toolbar>
        <h1>
          {t.title} · {profile.name}
        </h1>
        {tabs}
        <Muted role="status">{t.bsc.none(template.nameZh ?? template.name)}</Muted>
        <Muted>
          <a href={CTCBA_CARDS_URL} target="_blank" rel="noreferrer">
            {t.bsc.policy}
          </a>
        </Muted>
      </Toolbar>
    )

  const access = ready.access
  // Saving sends the whole profile, so only someone who also reads its notes may save it
  const canEdit = !ready.offline && !!user && (access ? access.edit && access.notes : profile.id === CLUB_PROFILE_ID && can('bookEdit'))

  const save = async () => {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const { cardEdits: _old, ...rest } = toInput(profile)
      const saved = await api.book.saveProfile(profile.id, own ? { ...rest, cardEdits: own } : rest, profile.version, t.edit.title)
      setLoaded({ ...ready, chain: [...ready.chain.slice(0, -1), saved] })
      setOwn(saved.cardEdits)
      setNotice(t.edit.saved(saved.version))
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setConflict(true)
      else setError(errorText(e))
    } finally {
      setSaving(false)
    }
  }

  const overflow = Object.values(card.cells).filter((cell) => cell.overflow)
  const problemCount = card.problems.length + overflow.length

  return (
    <>
      <PrintStyle template={template} />
      <Toolbar data-print="hide">
        <Head>
          <h1>
            {t.title} · {profile.name}
          </h1>
          <Muted>
            {strings.profiles.scopes[profile.scope]}
            {profile.id !== CLUB_PROFILE_ID && (
              <>
                {' · '}
                <Link to={`/profiles/${encodeURIComponent(profile.id)}/compare`}>{t.back}</Link>
              </>
            )}
          </Muted>
        </Head>
        <Controls>
          {tabs}
          <Row>
            {ready.summaries.length > 1 && (
              <Field>
                {t.profile}
                <Select
                  value={profile.id}
                  onChange={(e) => {
                    if (dirty && !window.confirm(t.edit.leave)) return
                    navigate(`/cards/${encodeURIComponent(e.target.value)}/${template.id}${form === undefined ? '' : `/${form}`}`)
                  }}
                >
                  {ready.summaries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Button type="button" onClick={() => window.print()}>
              {t.print}
            </Button>
            <WordDownload template={template} card={card} profileName={form === undefined ? profile.name : `${profile.name}-${form}`} />
            <Button type="button" $variant="primary" onClick={() => window.print()} aria-describedby="card-pdf-hint">
              {t.pdf}
            </Button>
          </Row>
        </Controls>
        {formOf ? (
          <>
            <Muted>{t.bsc.intro(formOf.convention.nameZh, template.nameZh ?? template.name)}</Muted>
            <Muted>
              <a href={CTCBA_CARDS_URL} target="_blank" rel="noreferrer">
                {t.bsc.policy}
              </a>
              {' · '}
              {t.bsc.noVersions}
            </Muted>
          </>
        ) : (
          <Muted>{t.intro}</Muted>
        )}
        <Muted id="card-pdf-hint">{t.pdfHint(template.paper)}</Muted>
        {template.pending && (
          <Muted>
            <PendingWord>{t.pending}</PendingWord> {t.templatePending}
            {template.pending}
          </Muted>
        )}
        <Legend aria-label={t.legend.title}>
          <li>
            <Swatch $ground={cardColors.team} /> {t.legend.team}
          </li>
          <li>
            <Swatch $ground={cardColors.partnership} /> {t.legend.partnership}
          </li>
          <li>
            <Swatch $ring={cardColors.flag} /> {t.legend.flagged}
          </li>
          <li>
            <Swatch $ring={cardColors.pending} $thin /> {t.legend.pending}
          </li>
          <li>{t.legend.link}</li>
        </Legend>
        {problemCount > 0 && (
          <Problems>
            <summary>{t.problems.title(problemCount)}</summary>
            <Muted>{t.problems.intro}</Muted>
            <ul>
              {card.problems.map((p, i) => (
                <li key={i}>{problemText(p)}</li>
              ))}
              {overflow.map((cell) => (
                <li key={cell.slot}>{t.problems.overflow(slots.get(cell.slot)?.label ?? cell.slot)}</li>
              ))}
            </ul>
          </Problems>
        )}
      </Toolbar>

      {form === undefined && (
        <CardVersions
          template={template}
          profile={profile}
          card={card}
          signedIn={!!user && !ready.offline}
          canPublish={canEdit}
          dirty={dirty}
          canShare={!!access?.share || (profile.id === CLUB_PROFILE_ID && can('bookEdit'))}
        />
      )}

      <Layout>
        <SheetScroll aria-label={name} role="region" tabIndex={0} data-card-scroll>
          <SheetInner style={{ width: `${PAPER_WIDTH[template.paper]}pt` }}>
            <CardSheet
              template={template}
              card={card}
              slots={slots}
              selected={selected}
              onSelect={setSelected}
              sourceLink={sourceLink}
              labels={{ toSection: t.toSection, notes: t.notesTitle[template.language], pending: t.pending }}
            />
          </SheetInner>
        </SheetScroll>
        <Inspector aria-labelledby="card-inspector" data-print="hide">
          <h2 id="card-inspector">{t.inspector.title}</h2>
          {selected && slots.get(selected) ? (
            <CellPanel
              key={selected}
              info={slots.get(selected)!}
              cell={card.cells[selected]}
              card={card}
              own={own?.[storedSlot(template, selected, form)]}
              canEdit={canEdit}
              signedIn={!!user}
              sourceLink={sourceLink}
              onEdit={(edit) => {
                setNotice('')
                setOwn((prev) => setCardEdit(prev, storedSlot(template, selected, form), edit))
              }}
            />
          ) : (
            <Muted>{t.inspector.choose}</Muted>
          )}
          {canEdit && (
            <SaveBox>
              <Row>
                <Button
                  type="button"
                  $variant="primary"
                  disabled={saving || !dirty || conflict}
                  onClick={() => void save()}
                >
                  {saving ? t.edit.saving : t.edit.save}
                </Button>
                {dirty && (
                  <Button type="button" $small $variant="ghost" onClick={() => setOwn(profile.cardEdits)}>
                    {t.edit.discard}
                  </Button>
                )}
              </Row>
              <Muted role="status">{dirty ? t.edit.unsaved(dirtySlots.length) : notice}</Muted>
              {conflict && (
                <ErrorText role="alert">
                  {t.edit.conflict}{' '}
                  <Button type="button" $small onClick={reload}>
                    {t.edit.reload}
                  </Button>
                </ErrorText>
              )}
              {error && <ErrorText role="alert">{error}</ErrorText>}
            </SaveBox>
          )}
        </Inspector>
      </Layout>
    </>
  )
}

/** Slot ids whose edit differs between two sets of edits */
function changedSlots(a: Record<string, ProfileCardEdit> = {}, b: Record<string, ProfileCardEdit> = {}): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  return [...keys].filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
}

function problemText(p: FillProblem): string {
  switch (p.kind) {
    case 'badEntry':
      return t.problems.badEntry(p.slug, p.entry)
    case 'unknownSlot':
      return t.problems.unknownSlot(p.slug, p.entry)
    case 'brokenRef':
      return t.problems.brokenRef(p.slug, p.entry)
    case 'badValue':
      return t.problems.badValue(p.slug, p.entry)
    case 'unknownEdit':
      return t.problems.unknownEdit(p.slot)
  }
}

/** The selected cell: its help, its sources, and the hand edit */
function CellPanel({
  info,
  cell,
  card,
  own,
  canEdit,
  signedIn,
  sourceLink,
  onEdit,
}: {
  info: SlotInfo
  cell: FilledCell | undefined
  card: FilledCard
  own: ProfileCardEdit | undefined
  canEdit: boolean
  signedIn: boolean
  sourceLink: (source: { slug: string; sectionId?: string }) => { to: string; name: string }
  onEdit: (edit: CardEdit | undefined) => void
}) {
  const block = info.block
  const inherited = cell?.edited && !own ? cell.origin : undefined
  const change = (patch: CardEdit) => onEdit({ ...own, ...patch })
  const summary = cellSummary(info, cell, { checked: t.inspector.checked, empty: t.inspector.empty })
  const notes = cell?.notes?.length ? card.notes.filter((n) => cell.notes!.includes(n.n)) : []

  return (
    <Stack>
      <CellName>
        <Ink text={info.label} />
        {cell?.origin && cell.origin !== 'club' && <OriginMark origin={cell.origin} />}
      </CellName>
      <Current>
        <Ink text={summary} />
      </Current>
      {cell?.pending && <Muted>{t.inspector.pending}</Muted>}
      {cell?.overflow && <ErrorText>{t.inspector.overflow}</ErrorText>}
      {notes.length > 0 && (
        <Muted>
          <a href={`#card-note-${notes[0]!.n}`}>{t.inspector.notes(notes.map((n) => n.n))}</a>
        </Muted>
      )}

      {info.help && (
        <section aria-label={t.inspector.help}>
          <SubHead>{t.inspector.help}</SubHead>
          <HelpText lang="en">{info.help.text}</HelpText>
          <Muted>
            <small>{info.help.source}</small>
          </Muted>
        </section>
      )}

      <section aria-label={t.inspector.sources}>
        <SubHead>{t.inspector.sources}</SubHead>
        {cell?.sources.length ? (
          <Sources>
            {cell.sources.map((s, i) => {
              const link = sourceLink(s)
              return (
                <li key={i}>
                  <Link to={link.to}>
                    <Ink text={link.name} />
                  </Link>
                  <Entry>{s.entry}</Entry>
                </li>
              )
            })}
          </Sources>
        ) : (
          <Muted>{t.inspector.noSources}</Muted>
        )}
        {cell?.edited && cell.origin && (
          <Muted>{t.inspector.edited(strings.profiles.scopes[cell.origin])}</Muted>
        )}
      </section>

      <section aria-label={t.edit.title}>
        <SubHead>{t.edit.title}</SubHead>
        {!canEdit ? (
          <Muted>{signedIn ? t.edit.readOnly : t.edit.signIn}</Muted>
        ) : (
          <Stack>
            {inherited && <Muted>{t.edit.inherited(strings.profiles.scopes[inherited])}</Muted>}
            {(block.kind === 'check' || info.kind === 'cell') && (
              <Check>
                <input
                  type="checkbox"
                  checked={own?.checked ?? cell?.checked ?? false}
                  onChange={(e) => change({ checked: e.target.checked })}
                />
                {info.kind === 'cell' ? t.edit.tick : t.edit.checked}
              </Check>
            )}
            {block.kind === 'choice' && (
              <Field>
                {t.edit.option}
                <Select value={own?.option ?? cell?.option ?? ''} onChange={(e) => change({ option: e.target.value || undefined })}>
                  <option value="">{t.edit.noOption}</option>
                  {block.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            {(info.kind === 'text' || info.kind === 'cell' || (block.kind === 'check' && block.blank)) && (
              <Field>
                {block.kind === 'check' && block.blank ? block.blank.label : t.edit.text}
                <TextArea
                  value={own?.text ?? cell?.text ?? ''}
                  rows={Math.min(8, Math.max(2, block.kind === 'cells' || block.kind === 'text' ? block.lines + 1 : 2))}
                  onChange={(e) => change({ text: e.target.value })}
                />
              </Field>
            )}
            <Check>
              <input
                type="checkbox"
                checked={own?.flagged ?? cell?.flagged ?? false}
                onChange={(e) => change({ flagged: e.target.checked || undefined })}
              />
              {t.edit.flagged}
            </Check>
            <Row>
              <Button type="button" $small disabled={!own} onClick={() => onEdit(undefined)} aria-describedby="card-reset-hint">
                {t.edit.reset}
              </Button>
            </Row>
            <Muted id="card-reset-hint">
              <small>{t.edit.resetHint}</small>
            </Muted>
          </Stack>
        )}
      </section>
    </Stack>
  )
}

// Frame pieces: the site's own tokens around the sheet

const Main = styled.main`
  display: grid;
  gap: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => theme.space(5)} ${({ theme }) => theme.space(5)} ${({ theme }) => theme.space(12)};

  ${mobile} {
    padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)} ${({ theme }) => theme.space(12)};
  }
`

const Toolbar = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  max-width: 80rem;

  h1 {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 1.5rem;
  }
`

const Head = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
`

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(3)};
  align-items: end;
  justify-content: space-between;
`

const PendingWord = styled.strong`
  color: ${({ theme }) => theme.colors.pendingText};
`

const Legend = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(4)};
  margin: 0;
  padding: 0;
  list-style: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;

  li {
    display: inline-flex;
    gap: ${({ theme }) => theme.space(1)};
    align-items: center;
  }
`

const Swatch = styled.span<{ $ground?: string; $ring?: string; $thin?: boolean }>`
  display: inline-block;
  width: 1.1em;
  height: 1.1em;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $ground }) => $ground ?? cardColors.paper};
  ${({ $ring, $thin }) => $ring && `box-shadow: inset 0 0 0 ${$thin ? 1 : 2}px ${$ring};`}
`

const Problems = styled.details`
  font-size: 0.875rem;

  summary {
    cursor: pointer;
    color: ${({ theme }) => theme.colors.pendingText};
    font-weight: 600;
  }
  ul {
    margin: ${({ theme }) => theme.space(1)} 0 0;
    padding-left: ${({ theme }) => theme.space(5)};
  }
`

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space(4)};
  align-items: start;

  @media (min-width: 1400px) {
    grid-template-columns: minmax(0, 1fr) 22rem;
  }
`

/** Scrolls sideways on a narrow screen; positioned for the .visually-hidden inside (CLAUDE.md) */
const SheetScroll = styled.div`
  position: relative;
  overflow-x: auto;
  padding: ${({ theme }) => theme.space(4)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.structure};
  }

  [data-card-paper] {
    box-shadow: ${({ theme }) => theme.shadows.panel};
  }
`

const SheetInner = styled.div`
  margin: 0 auto;
`

const Inspector = styled.aside`
  position: sticky;
  top: calc(${layout.headerHeight} + ${({ theme }) => theme.space(3)});
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  max-height: calc(100vh - ${layout.headerHeight} - ${({ theme }) => theme.space(6)});
  overflow-y: auto;
  padding: ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};

  h2 {
    margin: 0;
    font-size: 1.0625rem;
    color: ${({ theme }) => theme.colors.primaryStrong};
  }

  @media (max-width: 1399px) {
    position: static;
    max-height: none;
  }
`

const Stack = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
`

const CellName = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2)};
  align-items: baseline;
  margin: 0;
  font-weight: 600;
`

const Current = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space(2)};
  border-left: 3px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  white-space: pre-wrap;
  font-size: 0.875rem;
`

const SubHead = styled.h3`
  margin: ${({ theme }) => theme.space(2)} 0 ${({ theme }) => theme.space(1)};
  font-size: 0.875rem;
`

const HelpText = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(1)};
  font-size: 0.875rem;
  line-height: 1.6;
`

const Sources = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.space(4)};
  font-size: 0.875rem;

  li + li {
    margin-top: ${({ theme }) => theme.space(1)};
  }
`

const Entry = styled.code`
  display: block;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.75rem;
  overflow-wrap: anywhere;
`

const Check = styled.label`
  display: flex;
  gap: ${({ theme }) => theme.space(2)};
  align-items: center;
  font-size: 0.875rem;
`

const SaveBox = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  padding-top: ${({ theme }) => theme.space(3)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

