import { ArrowLeft, Eye, History, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { SuitPalette } from '../components/editor/fields.tsx'
import { MetaForm } from '../components/editor/MetaForm.tsx'
import { Outline, OutlineSelect } from '../components/editor/Outline.tsx'
import { Preview } from '../components/editor/Preview.tsx'
import { RevisionsPanel } from '../components/editor/RevisionsPanel.tsx'
import { SectionForm, type SectionAction } from '../components/editor/SectionForm.tsx'
import { Button, ErrorText, Input, Muted, Notice, Row } from '../components/ui.tsx'
import { api, ApiError, errorText, type BookRevision } from '../lib/api.ts'
import { classification, conventionProblems, conventionWarnings, tidyConvention } from '../lib/content.ts'
import {
  blankBlock,
  blankConvention,
  findPlace,
  indentSection,
  insertSection,
  moveSection,
  newSectionId,
  outdentSection,
  removeSection,
  sectionIds,
  updateSection,
} from '../lib/editing.ts'
import { formatDateTime, today } from '../lib/format.ts'
import { importedItems, type ImportedItem } from '../lib/importResult.ts'
import { conventionPath } from '../lib/sections.ts'
import { useMediaQuery } from '../lib/useMediaQuery.ts'
import { useContent, useConvention } from '../state/ContentContext.tsx'
import { strings } from '../strings.ts'
import { mobile, mobileQuery } from '../styles/tokens.ts'
import type { Convention, Section } from '../types/convention.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { Frame, Gate } from './Frame.tsx'

const t = strings.editor

/**
 * The online editor. /edit/:slug edits a convention (the online version if there is one, else the
 * bundled one); /new starts an empty one; ?draft=<id>&n=<i> opens what AI import made from a file.
 * Saving publishes at once and keeps the previous version in the history.
 */
export function EditorPage() {
  return (
    <Frame wide>
      <Gate need="bookEdit">
        <EditorLoader />
      </Gate>
    </Frame>
  )
}

interface DraftSource {
  id: string
  index: number
  fileName: string
  reviewNotes: string
  item: ImportedItem
}

function EditorLoader() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const location = useLocation()
  const content = useContent()
  const draftId = params.get('draft')
  const index = Number(params.get('n') ?? 0)
  const [draft, setDraft] = useState<DraftSource | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!draftId) return
    api.book
      .draft(draftId)
      .then(({ draft: d }) => {
        const { items, reviewNotes } = importedItems(d.result)
        const item = items[index]
        if (!item) throw new Error(strings.editor.notFound)
        setDraft({ id: d.id, index, fileName: d.fileName, reviewNotes, item })
      })
      .catch((e) => setError(errorText(e)))
  }, [draftId, index])

  // The content to edit: the online version, or the bundled one when it has none or is hidden
  const exists = slug ? Boolean(content.bySlug(slug) ?? content.bundledBySlug(slug)) : false
  const fetched = useConvention(slug, content.status !== 'loading' && exists && !draftId)
  // After a save the newer version loads in the background; the open editor keeps going meanwhile
  // (adjusting state during render, the React-recommended alternative to an effect)
  const [shown, setShown] = useState<Convention>()
  if (fetched.convention && fetched.convention !== shown) setShown(fetched.convention)
  const current = fetched.convention ?? (shown?.slug === slug ? shown : undefined)
  const { failed, missing } = fetched

  if (error) return <Page><ErrorText role="alert">{error}</ErrorText></Page>
  if (failed) return <Page><ErrorText role="alert">{strings.online.loadFailed}</ErrorText></Page>
  if (missing && !draftId) return <Page><ErrorText role="alert">{t.notFound}</ErrorText></Page>
  if (content.status === 'loading' || (draftId && !draft) || (exists && !draftId && !current))
    return <Page><Muted role="status">{strings.loading}</Muted></Page>

  const info = slug ? content.online.get(slug) : undefined
  // AI import does not classify: an update keeps the kind, level and prerequisites it replaces
  const replaced = slug ? (content.bySlug(slug) ?? content.bundledBySlug(slug)) : undefined
  const initial = draft
    ? slug
      ? { ...classification(replaced), ...draft.item.convention, slug }
      : draft.item.convention
    : (current ?? blankConvention(content.categories[0].id, today()))
  if (slug && !exists && !draft) return <Page><ErrorText role="alert">{t.notFound}</ErrorText></Page>

  return (
    <EditorBody
      key={`${slug ?? 'new'}|${draftId ?? ''}|${index}|${location.key}`}
      slug={slug}
      initial={initial}
      baseVersion={info?.version ?? 0}
      hidden={!!info?.hidden}
      draft={draft}
      savedNotice={(location.state as { saved?: number } | null)?.saved}
    />
  )
}

interface Saved {
  draft: Convention
  base: number
  at: number
}

function EditorBody({
  slug,
  initial,
  baseVersion,
  hidden,
  draft: source,
  savedNotice,
}: {
  slug?: string
  initial: Convention
  baseVersion: number
  hidden: boolean
  draft: DraftSource | null
  savedNotice?: number
}) {
  const content = useContent()
  // The same list the catalogue shows (lib/categories.ts)
  const { categories } = content
  const categoryIds = categories.map((c) => c.id)
  const navigate = useNavigate()
  const wide = useMediaQuery('(min-width: 1280px)')
  const phone = useMediaQuery(mobileQuery)
  const storageKey = `tku-bridge-book-editor:${slug ?? 'new'}${source ? `:${source.id}:${source.index}` : ''}`

  const [draft, setDraft] = useState<Convention>(initial)
  const [base, setBase] = useState(baseVersion)
  const [generation, setGeneration] = useState(0)
  const [selected, setSelected] = useState('info')
  const [formKey, setFormKey] = useState(0)
  const [dirty, setDirty] = useState(Boolean(source))
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(savedNotice ? t.savedVersion(savedNotice) : '')
  const [problems, setProblems] = useState<string[]>([])
  const [conflict, setConflict] = useState<{ version: number; convention: Convention | null } | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [tab, setTab] = useState<'form' | 'preview'>('form')
  const [restore, setRestore] = useState<Saved | null>(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? 'null') as Saved | null
      return saved && saved.base === baseVersion && JSON.stringify(saved.draft) !== JSON.stringify(initial) ? saved : null
    } catch {
      return null
    }
  })

  const title = slug ? t.titleEdit(draft.nameZh || slug) : source ? t.titleDraft(source.fileName) : t.titleNew
  usePageTitle(title)

  // Keep unsaved work on this device, and warn before leaving it
  useEffect(() => {
    if (!dirty) return
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ draft, base, at: Date.now() } satisfies Saved))
      } catch {
        // No storage: the warning on leaving still protects the work
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [draft, base, dirty, storageKey])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = t.leaveWarning
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const forget = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // Nothing kept
    }
  }, [storageKey])

  const change = (next: Convention) => {
    setDraft(next)
    setDirty(true)
    setProblems([])
  }
  const changeSections = (update: (sections: Section[]) => Section[]) => change({ ...draft, sections: update(draft.sections) })
  /** Replaces the whole draft (a revision, the latest version): forms start over */
  const replace = (next: Convention, keepDirty = true) => {
    setDraft(next)
    setDirty(keepDirty)
    setGeneration((g) => g + 1)
    setSelected('info')
  }
  const select = (id: string) => {
    setSelected(id)
    setFormKey((k) => k + 1)
  }

  const place = selected === 'info' ? null : findPlace(draft.sections, selected)
  const siblings = place ? (place.parentId === null ? draft.sections : (findPlace(draft.sections, place.parentId)?.section.children ?? [])) : []
  const newSection = (): Section => ({ id: newSectionId(draft.sections), title: '', blocks: [blankBlock('paragraph')] })

  const act = (action: SectionAction) => {
    if (!place) return
    const id = place.section.id
    if (action === 'up' || action === 'down') changeSections((s) => moveSection(s, id, action === 'up' ? -1 : 1))
    if (action === 'indent') changeSections((s) => indentSection(s, id))
    if (action === 'outdent') changeSections((s) => outdentSection(s, id))
    if (action === 'addAfter' || action === 'addChild') {
      const section = newSection()
      changeSections((s) => (action === 'addAfter' ? insertSection(s, place.parentId, section, id) : insertSection(s, id, section)))
      select(section.id)
    }
    if (action === 'delete') {
      changeSections((s) => removeSection(s, id))
      select(place.parentId ?? 'info')
    }
  }

  const existingSlugs = useMemo(
    () => new Set([...content.conventions.map((c) => c.slug), ...content.online.keys()]),
    [content.conventions, content.online],
  )
  const slugTaken = !slug && existingSlugs.has(draft.slug)
  const warnings = useMemo(() => conventionWarnings(draft), [draft])

  const save = async (baseOverride?: number) => {
    setError('')
    setNotice('')
    const tidy = tidyConvention({ ...draft, updated: today() })
    const found = [...(slugTaken ? [t.slugTaken] : []), ...conventionProblems(tidy, categoryIds)]
    if (found.length) return setProblems(found)
    setBusy(true)
    try {
      const { entry } = await api.book.save(tidy.slug, {
        convention: tidy,
        baseVersion: baseOverride ?? base,
        bundledUpdated: content.bundledBySlug(tidy.slug)?.updated,
        note: note || (source ? `匯入：${source.fileName}` : undefined),
      })
      forget()
      setDirty(false)
      setConflict(null)
      await content.reload()
      if (!slug) {
        navigate(`/edit/${tidy.slug}`, { replace: true, state: { saved: entry.version } })
        return
      }
      setDraft(tidy)
      setBase(entry.version)
      setNote('')
      setNotice(t.savedVersion(entry.version))
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        // Someone saved in between: fetch their version so the editor can choose
        const entry = await api.book.entry(tidy.slug).catch(() => null)
        setConflict({
          version: entry?.version ?? 0,
          convention: entry && conventionProblems(entry.convention, categoryIds).length === 0 ? (entry.convention as Convention) : null,
        })
      } else setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  const loadRevision = async (revision: BookRevision) => {
    const { revision: full } = await api.book.revision(revision.slug, revision.id)
    const problems = conventionProblems(full.convention, categoryIds)
    if (problems.length) throw new Error(problems[0])
    replace(full.convention as Convention)
    setShowHistory(false)
    setNotice(t.loadedRevision(formatDateTime(revision.at)))
  }

  const isEdited = slug ? content.online.has(slug) : false
  const form =
    selected === 'info' || !place ? (
      <MetaForm
        key={`info-${generation}`}
        convention={draft}
        categories={categories}
        conventions={content.conventions}
        slugEditable={!slug}
        slugTaken={slugTaken}
        onChange={change}
      />
    ) : (
      <SectionForm
        key={`${generation}-${formKey}`}
        section={place.section}
        can={{
          up: place.index > 0,
          down: place.index < siblings.length - 1,
          indent: place.index > 0,
          outdent: place.parentId !== null,
        }}
        takenIds={sectionIds(draft.sections).filter((id) => id !== place.section.id)}
        onChange={(section) => {
          changeSections((s) => updateSection(s, place.section.id, () => section))
          // A changed id keeps the same form open
          if (section.id !== place.section.id) setSelected(section.id)
        }}
        onAction={act}
      />
    )
  const preview = <Preview convention={draft} focusId={selected} />
  const noteInput = (
    <NoteInput value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.saveNote} aria-label={t.saveNote} title={t.saveNoteHint} />
  )

  return (
    <Page>
      <Bar>
        <Heading>
          <Button as={Link} to={slug ? conventionPath(slug) : '/'} $small $variant="ghost" aria-label={t.back} title={t.back}>
            <ArrowLeft size={16} aria-hidden />
            <Wide>{t.back}</Wide>
          </Button>
          <Title>{title}</Title>
          <State role="status">{dirty ? t.unsaved : t.allSaved}</State>
        </Heading>
        <Tools>
          <SuitPalette />
          {slug && (
            <Button type="button" $small onClick={() => setShowHistory((s) => !s)} aria-expanded={showHistory} aria-label={t.history} title={t.history}>
              <History size={16} aria-hidden />
              <Wide>{t.history}</Wide>
            </Button>
          )}
          {!wide && (
            <Button type="button" $small onClick={() => setTab(tab === 'form' ? 'preview' : 'form')} aria-pressed={tab === 'preview'}>
              <Eye size={16} aria-hidden />
              {tab === 'form' ? t.preview : t.form}
            </Button>
          )}
          {!phone && noteInput}
          <Button type="button" $variant="primary" $small onClick={() => void save()} disabled={busy || (!dirty && !source)}>
            {busy ? t.saving : phone ? t.saveShort : t.save}
          </Button>
        </Tools>
      </Bar>
      {/* On phones the note stays out of the bar that follows the page, so the bar is short */}
      {phone && noteInput}

      <Notices>
        {restore && (
          <Notice role="status">
            {t.restoreLocal(formatDateTime(restore.at))}{' '}
            <Button
              type="button"
              $small
              onClick={() => {
                replace(restore.draft)
                setRestore(null)
              }}
            >
              {t.restoreLocalYes}
            </Button>{' '}
            <Button
              type="button"
              $small
              $variant="ghost"
              onClick={() => {
                forget()
                setRestore(null)
              }}
            >
              {t.restoreLocalNo}
            </Button>
          </Notice>
        )}
        {source && (
          <Notice>
            {source.item.replaces ? t.draftReplaces(content.bySlug(source.item.replaces)?.nameZh ?? source.item.replaces) : t.draftNew}
            {source.reviewNotes && (
              <>
                <br />
                <strong>{t.draftNote}：</strong>
                {source.reviewNotes}
              </>
            )}
          </Notice>
        )}
        {hidden && <Notice>{t.hidden}</Notice>}
        {content.status === 'offline' && <ErrorText>{strings.online.offline}</ErrorText>}
        {notice && (
          <Notice role="status">
            {notice} {slug && !dirty && <Link to={conventionPath(slug)}>{t.view}</Link>}
          </Notice>
        )}
        {error && <ErrorText role="alert">{error}</ErrorText>}
        {conflict && (
          <ErrorText role="alert">
            {t.conflict}
            <Row>
              {conflict.convention && (
                <Button
                  type="button"
                  $small
                  onClick={() => {
                    replace(conflict.convention!, false)
                    setBase(conflict.version)
                    setConflict(null)
                  }}
                >
                  {t.loadTheirs}
                </Button>
              )}
              <Button type="button" $small $variant="danger" onClick={() => void save(conflict.version)}>
                {t.overwrite}
              </Button>
            </Row>
          </ErrorText>
        )}
        {problems.length > 0 && (
          <ErrorText role="alert">
            {t.problems}
            {'\n'}
            {problems.map((p) => `・${p}`).join('\n')}
          </ErrorText>
        )}
        {warnings.length > 0 && (
          <Warnings>
            <summary>
              {t.warnings}（{warnings.length}）
            </summary>
            <ul>
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </Warnings>
        )}
      </Notices>

      <Columns $wide={wide} $history={showHistory}>
        {!phone && (
          <Side>
            <Outline sections={draft.sections} selected={selected} onSelect={select} />
            <Button
              type="button"
              $small
              onClick={() => {
                const section = newSection()
                changeSections((s) => insertSection(s, null, section))
                select(section.id)
              }}
            >
              <Plus size={14} aria-hidden />
              {t.addSectionAfter}
            </Button>
          </Side>
        )}
        <MainCol>
          {phone && <OutlineSelect sections={draft.sections} selected={selected} onSelect={select} />}
          {wide || tab === 'form' ? <FormBox>{form}</FormBox> : <PreviewCol aria-label={t.preview}>{preview}</PreviewCol>}
        </MainCol>
        {wide && <PreviewCol aria-label={t.preview}>{preview}</PreviewCol>}
        {showHistory && slug && (
          <RevisionsPanel
            load={() => api.book.revisions(slug).then((r) => r.revisions)}
            onLoad={loadRevision}
            onReset={
              isEdited && content.bundledBySlug(slug)
                ? async () => {
                    await api.book.reset(slug, base)
                    forget()
                    await content.reload()
                    navigate(`/edit/${slug}`, { replace: true })
                  }
                : undefined
            }
            onHide={
              // Editors may hide a convention too: everything but accounts is theirs (ARCHITECTURE.md §4.2)
              !hidden
                ? async () => {
                    await api.book.hide(slug, base)
                    forget()
                    await content.reload()
                    navigate('/', { replace: true })
                  }
                : undefined
            }
            onClose={() => setShowHistory(false)}
          />
        )}
      </Columns>
    </Page>
  )
}

/**
 * Desktop: a workspace exactly as tall as the window under the header. The columns share their top
 * and bottom edges and each scrolls on its own, so the page itself never scrolls. Phones: one
 * column that scrolls with the page.
 */
const Page = styled.main`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  height: calc(100vh - ${({ theme }) => theme.layout.headerHeight});
  /* A very short window scrolls the page rather than squeezing the columns to nothing */
  min-height: 480px;
  padding: ${({ theme }) => theme.space(4)} ${({ theme }) => theme.space(5)};

  ${mobile} {
    display: grid;
    height: auto;
    min-height: 0;
    padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(10)};
  }
`

const Bar = styled.div`
  position: sticky;
  top: ${({ theme }) => theme.layout.headerHeight};
  z-index: 30;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow};
`

const Heading = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  min-width: 0;
`

const Tools = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};

  ${mobile} {
    gap: ${({ theme }) => theme.space(1)};
    width: 100%;
    & > :last-child {
      margin-left: auto;
    }
  }
`

/** Button text that phones leave out (the button keeps its icon and its aria-label) */
const Wide = styled.span`
  ${mobile} {
    display: none;
  }
`

const Title = styled.h1`
  margin: 0;
  min-width: 0;
  overflow: hidden;
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.primaryStrong};
  text-overflow: ellipsis;
  white-space: nowrap;

  ${mobile} {
    font-size: 1rem;
  }
`

const State = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

/** As tall as the small buttons beside it */
const NoteInput = styled(Input)`
  width: 14rem;
  min-height: 2rem;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 0.875rem;
  ${mobile} {
    width: 100%;
  }
`

const Notices = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  &:empty {
    display: none;
  }
`

const Warnings = styled.details`
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-left: 4px solid ${({ theme }) => theme.colors.pendingBorder};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.pendingBg};
  color: ${({ theme }) => theme.colors.pendingText};

  summary {
    cursor: pointer;
    font-weight: 600;
  }
  ul {
    margin: ${({ theme }) => theme.space(2)} 0 0;
    padding-left: ${({ theme }) => theme.space(5)};
  }
`

const Columns = styled.div<{ $wide: boolean; $history: boolean }>`
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: ${({ $wide, $history }) =>
    $wide ? `15rem minmax(0, 1fr) minmax(0, 1fr)${$history ? ' 20rem' : ''}` : `14rem minmax(0, 1fr)${$history ? ' 18rem' : ''}`};
  /* One row the height of the workspace: every column is stretched to it */
  grid-template-rows: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space(4)};

  & > aside {
    overflow: auto;
  }

  ${mobile} {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: none;
    align-items: start;
  }
`

/** The outline scrolls; the add button stays at the bottom of the column */
const Side = styled.div`
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(2)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};

  & > nav {
    overflow: auto;
  }
`

const MainCol = styled.div`
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space(3)};
  min-width: 0;

  ${mobile} {
    grid-template-rows: none;
  }
`

const FormBox = styled.div`
  overflow: auto;
  padding: ${({ theme }) => theme.space(4)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};

  ${mobile} {
    overflow: visible;
    padding: ${({ theme }) => theme.space(3)};
  }
`

/** Framed like the outline and the form, so the three columns read as one set */
const PreviewCol = styled.section`
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  min-width: 0;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.surface};

  ${mobile} {
    grid-template-rows: none;
  }
`
