import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { BlockView } from '../components/BlockView.tsx'
import { DealInput } from '../components/board/DealInput.tsx'
import { BlockEditor } from '../components/editor/BlockEditor.tsx'
import { AutoTextArea, MiniButton, SuitPalette } from '../components/editor/fields.tsx'
import { Button, ErrorText, Field, Input, Muted, Notice, PageTitle, Panel, PanelTitle, Row, Select } from '../components/ui.tsx'
import { libraryStrings } from '../libraryStrings.ts'
import { api, ApiError, errorText, type ArticleDraft, type ArticleEntry, type ArticleFiles, type ArticleRevision } from '../lib/api.ts'
import {
  ARTICLE_BLOCK_KINDS,
  blankArticle,
  blankArticleBlock,
  contractFromText,
  RESERVED_ARTICLE_SLUGS,
  tricksFromText,
  tricksText,
  type ArticleBlockKind,
} from '../lib/articleEdit.ts'
import { articleEditApi } from '../lib/articleEditApi.ts'
import { articleProblems, tidyArticle } from '../lib/articles.ts'
import { SEATS, type Seat } from '../lib/board.ts'
import { SLUG_PATTERN } from '../lib/content.ts'
import { formatDateTime, today } from '../lib/format.ts'
import { filesOff, uploadImage } from '../lib/imageUpload.ts'
import { importedArticles, type ImportedArticle } from '../lib/importResult.ts'
import { articlePath, resolveSeries } from '../lib/series.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { ArticleFilesContext } from '../state/ArticleFilesContext.tsx'
import { strings } from '../strings.ts'
import { licenses, type Article, type ArticleBlock, type ArticleSeries, type DealBlock, type HeadingBlock, type ImageBlock, type License, type PlayBlock, type QuoteBlock } from '../types/article.ts'
import { levels, type Block, type Level } from '../types/convention.ts'
import { articleEditStrings as t } from './articleEditStrings.ts'
import { Frame, Gate } from './Frame.tsx'

const s = libraryStrings

/**
 * The article editor (E5 e5-t07, AC-5.2, AC-5.3): /library/new starts an article, and
 * /library/:slug/edit edits one (its draft if it has one, else what is published).
 * `?draft=<id>&n=<i>` opens an article AI import made from a file (e5-t08).
 *
 * The blocks are the handbook's (BlockEditor) plus the article's own: a heading, a quote, a
 * picture (uploaded, e5-t12), a deal entered with the forum's DealInput (G4) and the card play.
 * Review as for conventions (E8): editors save a draft and send it for review; reviewers publish
 * it, send it back, or publish and hide straight away. Every publish is a version in the history.
 */
export function ArticleEditorPage() {
  return (
    <Frame wide>
      <Gate need="bookEdit">
        <Loader />
      </Gate>
    </Frame>
  )
}

interface Loaded {
  series: ArticleSeries[]
  /** Every published (or hidden) article's slug, so a new one cannot take it */
  taken: Set<string>
  entry: ArticleEntry | null
  files: ArticleFiles
  wip: ArticleDraft | null
  imported: { id: string; index: number; fileName: string; reviewNotes: string; item: ImportedArticle } | null
}

/** A value an article's check accepts, or undefined */
const asArticle = (value: unknown) => (value && articleProblems(value).length === 0 ? (value as Article) : undefined)

function Loader() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const location = useLocation()
  const draftId = params.get('draft')
  const index = Number(params.get('n') ?? 0)
  const key = `${slug ?? ''}|${draftId ?? ''}|${index}|${location.key}`
  const [loaded, setLoaded] = useState<{ key: string; value: Loaded } | { key: string; error: string }>()

  useEffect(() => {
    let current = true
    const notFound = (e: unknown) => (e instanceof ApiError && e.status === 404 ? null : Promise.reject(e))
    Promise.all([
      api.book.articles(),
      slug ? api.book.article(slug).catch(notFound) : null,
      slug ? articleEditApi.draftOf(slug) : null,
      draftId ? api.book.draft(draftId).then((r) => r.draft) : null,
    ])
      .then(([list, one, wip, draft]) => {
        let imported: Loaded['imported'] = null
        if (draft) {
          const { items, reviewNotes } = importedArticles(draft.result)
          const item = items[index]
          if (!item) throw new Error(t.notFound)
          imported = { id: draft.id, index, fileName: draft.fileName, reviewNotes, item }
        }
        const value: Loaded = {
          series: resolveSeries(list.series.series),
          taken: new Set(list.entries.map((e) => e.slug)),
          entry: one?.entry ?? null,
          files: one?.files ?? {},
          wip: draftId ? null : wip,
          imported,
        }
        if (current) setLoaded({ key, value })
      })
      .catch((e) => current && setLoaded({ key, error: errorText(e) }))
    return () => {
      current = false
    }
  }, [slug, draftId, index, key])

  if (!loaded || loaded.key !== key) return <Muted role="status">{t.loading}</Muted>
  if ('error' in loaded) return <ErrorText role="alert">{loaded.error}</ErrorText>
  const { entry, wip, imported, series } = loaded.value
  const published = asArticle(entry?.article)
  const fromWip = asArticle(wip?.article)
  if (slug && !entry && !wip && !imported) return <ErrorText role="alert">{t.notFound}</ErrorText>

  // An imported update keeps what the AI does not decide: license, cover, level and the first date
  const base = fromWip ?? published
  const initial: Article = imported
    ? slug && base
      ? { ...imported.item.article, slug, license: base.license, published: base.published, ...(base.cover && { cover: base.cover }), ...(base.level && { level: base.level }) }
      : imported.item.article
    : (base ?? blankArticle(series[0]?.id ?? '', today()))

  return (
    <Editor
      key={key}
      slug={slug}
      initial={initial}
      loaded={loaded.value}
      savedNotice={(location.state as { notice?: string } | null)?.notice}
    />
  )
}

interface Saved {
  article: Article
  base: number
  at: number
}

type Mode = 'draft' | 'submit' | 'publish'

let nextKey = 0
const newKey = () => ++nextKey

function Editor({ slug, initial, loaded, savedNotice }: { slug?: string; initial: Article; loaded: Loaded; savedNotice?: string }) {
  const { can } = useAuth()
  const reviewer = can('bookReview')
  const navigate = useNavigate()
  const { imported, series } = loaded
  const storageKey = `tku-bridgebook:article-editor:${slug ?? 'new'}${imported ? `:${imported.id}:${imported.index}` : ''}`

  const [article, setArticle] = useState(initial)
  // Stable keys, so a moved block keeps the text its form is holding
  const [keys, setKeys] = useState(() => initial.blocks.map(newKey))
  const [generation, setGeneration] = useState(0)
  const [base, setBase] = useState(loaded.entry?.version ?? 0)
  const [hidden, setHidden] = useState(loaded.entry ? loaded.entry.article === null : false)
  const [wip, setWip] = useState(loaded.wip)
  const [files, setFiles] = useState(loaded.files)
  const [dirty, setDirty] = useState(Boolean(imported))
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [rejectNote, setRejectNote] = useState('')
  const [confirm, setConfirm] = useState<'discard' | 'hide' | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(savedNotice ?? '')
  const [problems, setProblems] = useState<string[]>([])
  const [conflict, setConflict] = useState(false)
  const [tab, setTab] = useState<'form' | 'preview'>('form')
  const [addKind, setAddKind] = useState<ArticleBlockKind>('paragraph')
  const [restore, setRestore] = useState<Saved | null>(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? 'null') as Saved | null
      return saved && saved.base === (loaded.entry?.version ?? 0) && JSON.stringify(saved.article) !== JSON.stringify(initial) ? saved : null
    } catch {
      return null
    }
  })

  usePageTitle(slug ? t.titleEdit(article.title || slug) : imported ? t.titleImported(imported.fileName) : t.titleNew)

  // Unsaved work stays on this device, and leaving warns
  useEffect(() => {
    if (!dirty) return
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ article, base, at: Date.now() } satisfies Saved))
      } catch {
        // No storage: the warning on leaving still protects the work
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [article, base, dirty, storageKey])
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

  const change = (next: Article) => {
    setArticle(next)
    setDirty(true)
    setProblems([])
  }
  /** Replaces the whole article (a version, the saved work): the forms start over */
  const replace = (next: Article) => {
    setArticle(next)
    setKeys(next.blocks.map(newKey))
    setGeneration((g) => g + 1)
    setDirty(true)
  }
  const setBlock = (i: number, block: ArticleBlock) => change({ ...article, blocks: article.blocks.map((b, j) => (j === i ? block : b)) })
  const moveBlock = (i: number, delta: -1 | 1) => {
    const to = i + delta
    if (to < 0 || to >= article.blocks.length) return
    const blocks = [...article.blocks]
    const order = [...keys]
    ;[blocks[i], blocks[to]] = [blocks[to], blocks[i]]
    ;[order[i], order[to]] = [order[to], order[i]]
    setKeys(order)
    change({ ...article, blocks })
  }
  const removeBlock = (i: number) => {
    setKeys(keys.filter((_, j) => j !== i))
    change({ ...article, blocks: article.blocks.filter((_, j) => j !== i) })
  }
  const addBlock = () => {
    setKeys([...keys, newKey()])
    change({ ...article, blocks: [...article.blocks, blankArticleBlock(addKind)] })
  }

  const slugProblem = slug
    ? ''
    : !SLUG_PATTERN.test(article.slug)
      ? ''
      : RESERVED_ARTICLE_SLUGS.includes(article.slug)
        ? t.slugReserved
        : loaded.taken.has(article.slug)
          ? t.slugTaken
          : ''

  /**
   * Saves the draft ('draft', or 'submit' to send it for review) or publishes it (reviewers). A
   * 409 means someone published or saved the draft in between: reload and carry on from theirs.
   */
  const save = async (mode: Mode) => {
    setError('')
    setNotice('')
    const date = today()
    const tidy = tidyArticle({ ...article, updated: date, ...(base === 0 && mode === 'publish' && { published: date }) })
    const found = [...(slugProblem ? [slugProblem] : []), ...articleProblems(tidy)]
    if (found.length) return setProblems(found)
    setBusy(true)
    const why = note.trim() || (imported ? `匯入：${imported.fileName}` : undefined)
    try {
      let message: string
      if (mode === 'publish') {
        const entry = await api.book.saveArticle(tidy.slug, { article: tidy, baseVersion: base, ...(wip && { draftRevision: wip.revision }), note: why })
        setBase(entry.version)
        setHidden(false)
        setWip(null)
        message = t.published(entry.version)
      } else {
        setWip(await articleEditApi.saveDraft(tidy.slug, { article: tidy, baseVersion: base, draftRevision: wip?.revision ?? 0, note: why, submit: mode === 'submit' }))
        message = mode === 'submit' ? t.submitted : t.draftSaved
      }
      forget()
      setDirty(false)
      if (!slug) {
        navigate(`${articlePath(tidy.slug)}/edit`, { replace: true, state: { notice: message } })
        return
      }
      setArticle(tidy)
      setNote('')
      setNotice(message)
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setConflict(true)
      else setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  const run = async (action: () => Promise<void>) => {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await action()
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setConflict(true)
      else setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }
  const reject = () =>
    run(async () => {
      if (!slug || !wip) return
      setWip(await articleEditApi.reject(slug, wip.revision, rejectNote.trim()))
      setRejectNote('')
      setNotice(t.rejected)
    })
  const discard = () =>
    run(async () => {
      if (!slug || !wip) return
      await articleEditApi.discardDraft(slug, wip.revision)
      forget()
      setDirty(false)
      setConfirm(null)
      navigate(loaded.entry ? `${articlePath(slug)}/edit` : '/library', { replace: true, state: { notice: t.discarded } })
    })
  const hide = () =>
    run(async () => {
      if (!slug) return
      const entry = await api.book.hideArticle(slug, base)
      setBase(entry.version)
      setHidden(true)
      setConfirm(null)
      setNotice(t.hidden)
    })

  const busyOrSame = busy || conflict

  return (
    <Page>
      <PageTitle>{slug ? t.titleEdit(article.title || slug) : imported ? t.titleImported(imported.fileName) : t.titleNew}</PageTitle>
      <Bar>
        <Link to={slug && loaded.entry ? articlePath(slug) : '/library'}>← {slug && loaded.entry ? t.view : s.backToLibrary}</Link>
      </Bar>

      {imported && (
        <Notice>
          {imported.reviewNotes && (
            <>
              <strong>{t.importNotes(imported.fileName)}</strong>
              {imported.reviewNotes}
              <br />
            </>
          )}
          {t.importCheck}
        </Notice>
      )}
      {restore && (
        <Notice role="status">
          {t.restore(formatDateTime(restore.at))}{' '}
          <Button type="button" $small onClick={() => (replace(restore.article), setRestore(null))}>
            {t.restoreYes}
          </Button>{' '}
          <Button type="button" $small $variant="ghost" onClick={() => (forget(), setRestore(null))}>
            {t.restoreNo}
          </Button>
        </Notice>
      )}
      {hidden && <Notice>{t.isHidden}</Notice>}
      {wip && (
        <Notice>
          {wip.status === 'in-review'
            ? t.inReview(wip.reviewRequestedBy ?? wip.updatedBy, formatDateTime(wip.reviewRequestedAt ?? wip.updatedAt))
            : t.draftBy(wip.updatedBy, formatDateTime(wip.updatedAt))}
          {wip.note && `・${wip.note}`}
          {wip.reviewedBy && wip.reviewedAt && wip.reviewNote !== undefined && (
            <>
              <br />
              {t.sentBack(wip.reviewedBy, formatDateTime(wip.reviewedAt), wip.reviewNote)}
            </>
          )}
        </Notice>
      )}

      <Tabs role="tablist">
        <Tab type="button" role="tab" aria-selected={tab === 'form'} $active={tab === 'form'} onClick={() => setTab('form')}>
          {t.form}
        </Tab>
        <Tab type="button" role="tab" aria-selected={tab === 'preview'} $active={tab === 'preview'} onClick={() => setTab('preview')}>
          {t.preview}
        </Tab>
        <SuitPalette />
      </Tabs>

      {tab === 'preview' ? (
        <ArticleFilesContext.Provider value={files}>
          <PreviewBox>
            <h1>{article.title}</h1>
            {article.summary && <Muted>{article.summary}</Muted>}
            {article.blocks.map((block, i) => (
              <BlockView key={keys[i]} block={block} />
            ))}
          </PreviewBox>
        </ArticleFilesContext.Provider>
      ) : (
        <div key={generation}>
          <Details
            article={article}
            series={series}
            isNew={!slug}
            slugProblem={slugProblem}
            files={files}
            onFile={(key, url) => setFiles((f) => ({ ...f, [key]: { url } }))}
            onChange={change}
          />
          <Panel aria-labelledby="article-blocks">
            <PanelTitle id="article-blocks">{t.blocks}</PanelTitle>
            <Blocks>
              {article.blocks.map((block, i) => (
                <ArticleBlockEditor
                  key={keys[i]}
                  block={block}
                  index={i}
                  count={article.blocks.length}
                  files={files}
                  onFile={(key, url) => setFiles((f) => ({ ...f, [key]: { url } }))}
                  onChange={(b) => setBlock(i, b)}
                  onMove={(delta) => moveBlock(i, delta)}
                  onRemove={() => removeBlock(i)}
                />
              ))}
            </Blocks>
            <Row>
              <Select value={addKind} onChange={(e) => setAddKind(e.target.value as ArticleBlockKind)} aria-label={t.addBlock}>
                {ARTICLE_BLOCK_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {t.blockNames[kind]}
                  </option>
                ))}
              </Select>
              <Button type="button" $small onClick={addBlock}>
                <Plus size={14} aria-hidden />
                {t.addBlockKind(t.blockNames[addKind])}
              </Button>
            </Row>
          </Panel>
        </div>
      )}

      <Panel aria-label={t.publish}>
        {problems.length > 0 && (
          <ErrorText role="alert">
            {t.problems}
            <ProblemList>
              {problems.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ProblemList>
          </ErrorText>
        )}
        {conflict && (
          <ErrorText role="alert">
            {t.conflict}{' '}
            <Button type="button" $small onClick={() => navigate(slug ? `${articlePath(slug)}/edit` : '/library', { replace: true })}>
              {t.reload}
            </Button>
          </ErrorText>
        )}
        {error && <ErrorText role="alert">{error}</ErrorText>}
        {notice && <Notice role="status">{notice}</Notice>}
        {!reviewer && <Muted>{t.reviewerOnly}</Muted>}
        <Field>
          {t.note}
          <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </Field>
        <Row>
          <Button type="button" disabled={busyOrSame} onClick={() => void save('draft')}>
            {t.saveDraft}
          </Button>
          <Button type="button" $variant={reviewer ? undefined : 'primary'} disabled={busyOrSame} onClick={() => void save('submit')}>
            {t.submit}
          </Button>
          {reviewer && (
            <Button type="button" $variant="primary" disabled={busyOrSame} onClick={() => void save('publish')}>
              {wip ? t.publishDraft : t.publish}
            </Button>
          )}
        </Row>
        {reviewer && wip?.status === 'in-review' && (
          <Row>
            <Input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} aria-label={t.rejectReason} placeholder={t.rejectReason} maxLength={500} />
            <Button type="button" $small disabled={busyOrSame} onClick={() => void reject()}>
              {t.reject}
            </Button>
          </Row>
        )}
        <Row>
          {wip && slug && (
            <Button type="button" $small $variant="ghost" disabled={busyOrSame} onClick={() => setConfirm('discard')}>
              {t.discard}
            </Button>
          )}
          {reviewer && slug && loaded.entry && !hidden && (
            <Button type="button" $small $variant="danger" disabled={busyOrSame} onClick={() => setConfirm('hide')}>
              {t.hide}
            </Button>
          )}
        </Row>
        {confirm && (
          <Notice role="alertdialog" aria-label={confirm === 'hide' ? t.hide : t.discard}>
            {confirm === 'hide' ? t.hideConfirm : t.discardConfirm}{' '}
            <Button type="button" $small $variant="danger" disabled={busy} onClick={() => void (confirm === 'hide' ? hide() : discard())}>
              {confirm === 'hide' ? t.hide : t.discard}
            </Button>{' '}
            <Button type="button" $small $variant="ghost" onClick={() => setConfirm(null)}>
              {t.cancel}
            </Button>
          </Notice>
        )}
      </Panel>

      {slug && loaded.entry && <History slug={slug} onLoad={(next, version) => (replace(next), setNotice(t.loadedRevision(version)))} />}
    </Page>
  )
}

/** The article's details: title, slug (new ones only), authors, series, level, license, summary and cover */
function Details({
  article,
  series,
  isNew,
  slugProblem,
  files,
  onFile,
  onChange,
}: {
  article: Article
  series: ArticleSeries[]
  isNew: boolean
  slugProblem: string
  files: ArticleFiles
  onFile: (key: string, url: string) => void
  onChange: (article: Article) => void
}) {
  // Kept as typed, so a comma at the end does not vanish while typing
  const [authors, setAuthors] = useState(() => article.authors.join('、'))
  const known = series.some((x) => x.id === article.series)
  return (
    <Panel aria-labelledby="article-details">
      <PanelTitle id="article-details">{t.details}</PanelTitle>
      <Grid>
        <Field>
          {t.title}
          <Input value={article.title} maxLength={120} onChange={(e) => onChange({ ...article, title: e.target.value })} />
        </Field>
        <Field>
          {t.slug}
          <Input value={article.slug} disabled={!isNew} onChange={(e) => onChange({ ...article, slug: e.target.value.trim().toLowerCase() })} />
          <small>{slugProblem || t.slugHint}</small>
        </Field>
        <Field>
          {t.authors}
          <Input
            value={authors}
            onChange={(e) => {
              setAuthors(e.target.value)
              onChange({ ...article, authors: e.target.value.split(/[、,，]/).map((a) => a.trim()).filter(Boolean) })
            }}
          />
          <small>{t.authorsHint}</small>
        </Field>
        <Field>
          {t.series}
          <Select value={article.series} onChange={(e) => onChange({ ...article, series: e.target.value })}>
            {!known && <option value={article.series}>{article.series}</option>}
            {series.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          {t.level}
          <Select
            value={article.level ?? ''}
            onChange={(e) => {
              const next = { ...article }
              if (e.target.value) next.level = e.target.value as Level
              else delete next.level
              onChange(next)
            }}
          >
            <option value="">{t.levelNone}</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {strings.levels[l]}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          {t.license}
          <Select value={article.license} onChange={(e) => onChange({ ...article, license: e.target.value as License })}>
            {licenses.map((l) => (
              <option key={l} value={l}>
                {s.licenses[l]}
              </option>
            ))}
          </Select>
          <small>{t.licenseHint}</small>
        </Field>
      </Grid>
      <Field>
        {t.summary}
        <AutoTextArea value={article.summary} onChange={(e) => onChange({ ...article, summary: e.target.value })} />
        <small>{t.summaryHint}</small>
      </Field>
      <PictureField
        label={t.cover}
        value={article.cover ?? ''}
        files={files}
        onFile={onFile}
        onChange={(cover) => {
          const next = { ...article }
          if (cover) next.cover = cover
          else delete next.cover
          onChange(next)
        }}
        removable
      />
    </Panel>
  )
}

/** Uploads a picture (e5-t12) and keeps its file key; the address is only for this page's preview */
function PictureField({
  label,
  value,
  files,
  onFile,
  onChange,
  removable = false,
}: {
  label: string
  value: string
  files: ArticleFiles
  onFile: (key: string, url: string) => void
  onChange: (key: string) => void
  removable?: boolean
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'off' | string>('idle')
  const input = useRef<HTMLInputElement>(null)
  const pick = async (file: File | undefined) => {
    if (!file) return
    setState('busy')
    try {
      const uploaded = await uploadImage(file, 'article')
      onFile(uploaded.key, uploaded.thumbUrl ?? uploaded.url)
      onChange(uploaded.key)
      setState('idle')
    } catch (e) {
      setState(filesOff(e) ? 'off' : errorText(e))
    } finally {
      if (input.current) input.current.value = ''
    }
  }
  const url = value ? files[value]?.thumbUrl ?? files[value]?.url : undefined
  return (
    <Field as="div">
      {label}
      <PictureRow>
        {url ? <Thumb src={url} alt="" /> : <Muted>{value ? t.uploaded : removable ? t.coverNone : t.imageNone}</Muted>}
        <Button type="button" $small disabled={state === 'busy'} onClick={() => input.current?.click()}>
          {state === 'busy' ? t.uploading : value ? t.imageReplace : removable ? t.coverUpload : t.imagePick}
        </Button>
        {removable && value && (
          <Button type="button" $small $variant="ghost" onClick={() => onChange('')}>
            {t.coverRemove}
          </Button>
        )}
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} aria-label={label} />
      </PictureRow>
      {state === 'off' && <ErrorText role="alert">{t.filesOff}</ErrorText>}
      {state !== 'idle' && state !== 'busy' && state !== 'off' && <ErrorText role="alert">{state}</ErrorText>}
    </Field>
  )
}

const isHandbookBlock = (b: ArticleBlock): b is Block => !['heading', 'quote', 'image', 'deal', 'play'].includes(b.kind)

/** One block: the handbook's kinds in its own BlockEditor, the article's kinds here */
function ArticleBlockEditor({
  block,
  index,
  count,
  files,
  onFile,
  onChange,
  onMove,
  onRemove,
}: {
  block: ArticleBlock
  index: number
  count: number
  files: ArticleFiles
  onFile: (key: string, url: string) => void
  onChange: (block: ArticleBlock) => void
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
}) {
  if (isHandbookBlock(block))
    return <BlockEditor block={block} index={index} count={count} onChange={onChange} onMove={onMove} onRemove={onRemove} />
  const e = strings.editor
  return (
    <Box aria-label={`${t.blockNames[block.kind]} ${index + 1}`}>
      <Head>
        <Kind>{t.blockNames[block.kind]}</Kind>
        <Row>
          <MiniButton type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={e.moveUp} title={e.moveUp}>
            <ArrowUp size={16} aria-hidden />
          </MiniButton>
          <MiniButton type="button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={e.moveDown} title={e.moveDown}>
            <ArrowDown size={16} aria-hidden />
          </MiniButton>
          <MiniButton type="button" onClick={onRemove} aria-label={e.deleteBlock} title={e.deleteBlock}>
            <Trash2 size={16} aria-hidden />
          </MiniButton>
        </Row>
      </Head>
      {block.kind === 'heading' && <HeadingEditor block={block} onChange={onChange} />}
      {block.kind === 'quote' && <QuoteEditor block={block} onChange={onChange} />}
      {block.kind === 'image' && <ImageEditor block={block} files={files} onFile={onFile} onChange={onChange} />}
      {block.kind === 'deal' && <DealEditor block={block} onChange={onChange} />}
      {block.kind === 'play' && <PlayEditor block={block} onChange={onChange} />}
    </Box>
  )
}

function HeadingEditor({ block, onChange }: { block: HeadingBlock; onChange: (b: ArticleBlock) => void }) {
  return (
    <Row>
      <Field>
        {t.headingLevel}
        <Select value={block.level} onChange={(e) => onChange({ ...block, level: Number(e.target.value) === 3 ? 3 : 2 })}>
          <option value={2}>{t.heading2}</option>
          <option value={3}>{t.heading3}</option>
        </Select>
      </Field>
      <Grow>
        {strings.editor.text}
        <Input value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
      </Grow>
    </Row>
  )
}

function QuoteEditor({ block, onChange }: { block: QuoteBlock; onChange: (b: ArticleBlock) => void }) {
  return (
    <>
      <Field>
        {strings.editor.text}
        <AutoTextArea minRows={2} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
      </Field>
      <Field>
        {t.quoteCite}
        <Input value={block.cite ?? ''} onChange={(e) => onChange({ ...block, cite: e.target.value })} />
      </Field>
    </>
  )
}

function ImageEditor({
  block,
  files,
  onFile,
  onChange,
}: {
  block: ImageBlock
  files: ArticleFiles
  onFile: (key: string, url: string) => void
  onChange: (b: ArticleBlock) => void
}) {
  return (
    <>
      <PictureField label={t.blockNames.image} value={block.src} files={files} onFile={onFile} onChange={(src) => onChange({ ...block, src })} />
      <Field>
        {t.imageAlt}
        <Input value={block.alt} onChange={(e) => onChange({ ...block, alt: e.target.value })} />
      </Field>
      <Field>
        {t.imageCaption}
        <Input value={block.caption ?? ''} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
      </Field>
    </>
  )
}

/** 牌例 (AC-5.3): four hands with G4's DealInput; a seat may stay empty */
function DealEditor({ block, onChange }: { block: DealBlock; onChange: (b: ArticleBlock) => void }) {
  return (
    <>
      <DealInput value={block.deal} onChange={(deal) => onChange({ ...block, deal })} />
      <Field>
        {t.dealCaption}
        <AutoTextArea value={block.caption ?? ''} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
      </Field>
    </>
  )
}

/** 出牌過程 (AC-5.3): the contract, declarer and one line per trick */
function PlayEditor({ block, onChange }: { block: PlayBlock; onChange: (b: ArticleBlock) => void }) {
  const b = strings.board
  // The tricks are edited as text, kept as typed so the cursor never jumps
  const [text, setText] = useState(() => tricksText(block.tricks))
  return (
    <>
      <Row>
        <Field>
          {t.playContract}
          <Input value={block.contract} onChange={(e) => onChange({ ...block, contract: contractFromText(e.target.value) })} placeholder={t.playContractHint} />
        </Field>
        <Field>
          {t.playDeclarer}
          <Select value={block.declarer} onChange={(e) => onChange({ ...block, declarer: e.target.value as Seat })}>
            {SEATS.map((seat) => (
              <option key={seat} value={seat}>
                {b.seatNames[seat]}
              </option>
            ))}
          </Select>
        </Field>
      </Row>
      <Field>
        {t.playTricks}
        <AutoTextArea
          minRows={4}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            onChange({ ...block, tricks: tricksFromText(e.target.value) })
          }}
        />
        <small>{t.playTricksHint}</small>
      </Field>
      <Field>
        {t.playCaption}
        <AutoTextArea value={block.caption ?? ''} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
      </Field>
    </>
  )
}

/** 版本紀錄: every publish and hide, newest first; a version can be loaded into the editor */
function History({ slug, onLoad }: { slug: string; onLoad: (article: Article, version: number) => void }) {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<ArticleRevision[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!open || list) return
    api.book.articleRevisions(slug).then(setList, (e) => setError(errorText(e)))
  }, [open, list, slug])
  const load = async (revision: ArticleRevision) => {
    setError('')
    try {
      const full = await api.book.articleRevision(slug, revision.id)
      const article = asArticle(full.article)
      if (!article) throw new Error(articleProblems(full.article)[0] ?? t.notFound)
      onLoad(article, revision.version)
    } catch (e) {
      setError(e instanceof Error && !(e instanceof ApiError) ? e.message : errorText(e))
    }
  }
  return (
    <Panel aria-labelledby="article-history">
      <PanelTitle id="article-history">
        <Toggle type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {t.history} {open ? '▴' : '▾'}
        </Toggle>
      </PanelTitle>
      {open && (
        <>
          {error && <ErrorText role="alert">{error}</ErrorText>}
          {!list && !error && <Muted role="status">{strings.loading}</Muted>}
          {list && !list.length && <Muted>{t.historyEmpty}</Muted>}
          <HistoryList>
            {(list ?? []).map((r) => (
              <li key={r.id}>
                <span>
                  {t.historyLine(r.version, r.by, formatDateTime(r.at), t.historyActions[r.action])}
                  {r.note && `・${r.note}`}
                </span>
                {r.action === 'save' && (
                  <Button type="button" $small $variant="ghost" onClick={() => void load(r)}>
                    {t.historyLoad}
                  </Button>
                )}
              </li>
            ))}
          </HistoryList>
        </>
      )}
    </Panel>
  )
}

const Page = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  max-width: 56rem;
`

const Bar = styled.div`
  font-size: 0.875rem;

  a {
    color: ${({ theme }) => theme.colors.primary};
  }
`

const Tabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};

  & > [role='group'] {
    margin-left: auto;
  }
`

const Tab = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(3)};
  border: ${({ theme }) => theme.borders.control} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : theme.colors.surface)};
  color: ${({ theme, $active }) => ($active ? theme.colors.primaryStrong : theme.colors.text)};
  font: inherit;
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  cursor: pointer;
`

const PreviewBox = styled.div`
  padding: ${({ theme }) => theme.space(4)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};
  max-width: 44rem;

  h1 {
    margin: 0 0 ${({ theme }) => theme.space(2)};
    font-family: ${({ theme }) => theme.fonts.heading};
    color: ${({ theme }) => theme.colors.primaryStrong};
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.space(3)};
  margin-bottom: ${({ theme }) => theme.space(3)};

  small {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const Blocks = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  margin-bottom: ${({ theme }) => theme.space(3)};
`

const Box = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};

  small {
    color: ${({ theme }) => theme.colors.textMuted};
    line-height: 1.5;
  }
`

const Head = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`

const Kind = styled.span`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryStrong};
`

const Grow = styled(Field)`
  flex: 1 1 240px;
`

const PictureRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  font-weight: 400;
`

const Thumb = styled.img`
  max-width: 160px;
  max-height: 120px;
  border-radius: ${({ theme }) => theme.shape.control};
  border: 1px solid ${({ theme }) => theme.colors.border};
`

const ProblemList = styled.ul`
  margin: ${({ theme }) => theme.space(1)} 0 0;
  padding-left: ${({ theme }) => theme.space(5)};
`

const HistoryList = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: ${({ theme }) => theme.space(2)};
    padding: ${({ theme }) => theme.space(1)} 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`

const Toggle = styled.button`
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
`
