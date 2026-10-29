import { FileUp, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { AutoTextArea } from '../components/editor/fields.tsx'
import { Button, ErrorText, Field, Muted, Notice, PageTitle, Panel, PanelTitle, Row, Select } from '../components/ui.tsx'
import { api, ApiError, errorText, type ArticleList, type ImportDraftSummary } from '../lib/api.ts'
import { DocTextError, docToText, docxToText } from '../lib/docText.ts'
import { formatDateTime, today } from '../lib/format.ts'
import {
  articleDraftBody,
  draftBody,
  fromAiReply,
  fromArticleReply,
  importedArticles,
  importedItems,
  type ArticleImportResult,
  type ImportResult,
} from '../lib/importResult.ts'
import { articlePath, resolveSeries } from '../lib/series.ts'
import { readReply, StreamError } from '../lib/sse.ts'
import { useContent } from '../state/ContentContext.tsx'
import { strings } from '../strings.ts'
import type { ConventionMeta, SectionOutline } from '../types/convention.ts'
import { articleEditStrings as a } from './articleEditStrings.ts'
import { Frame, Gate } from './Frame.tsx'

const t = strings.importer
const PDF_MAX_MB = 20

/** What was taken out of the chosen file */
type Source = { name: string; kind: 'text'; text: string } | { name: string; kind: 'pdf'; file: File }

/**
 * 匯入檔案: a Word or PDF file goes to Claude (through TKU BridgeTable's Worker, which holds the
 * key) with the handbook's current catalogue; the reply becomes conventions in a draft that opens
 * in the editor. Word files are read here in the browser; PDFs go as they are.
 *
 * `?target=articles` (e5-t08) makes articles for the library instead: the AI gets the series and
 * the library's articles, transcribes the file verbatim into an article's blocks, and each article
 * opens in the article editor.
 */
export function ImportPage() {
  return (
    <Frame title={t.title}>
      <PageTitle>{t.title}</PageTitle>
      <Gate need="bookImport">
        <ImportBody />
      </Gate>
    </Frame>
  )
}

/** The site's conventions, one per line with their sections, so the AI can match and reuse ids */
function catalogue(conventions: ConventionMeta[]) {
  const sections = (list: SectionOutline[], depth = 0): string[] =>
    list.flatMap((s) => [`${'  '.repeat(depth + 1)}${s.id}：${s.title}`, ...sections(s.children ?? [], depth + 1)])
  return conventions
    .map((c) =>
      [
        `${c.slug}｜${c.nameZh}｜${c.nameEn}｜分類 ${c.category}${c.aliases?.length ? `｜別名 ${c.aliases.join('、')}` : ''}｜${c.summary}`,
        ...sections(c.outline),
      ].join('\n'),
    )
    .join('\n')
    .slice(0, 60_000)
}

/** The library's articles, one per line, so the AI can tell a new article from an update (e5-t08) */
const articleCatalogue = (list: ArticleList) =>
  list.entries
    .flatMap((e) => (e.meta ? [`${e.slug}｜${e.meta.title}｜${e.meta.authors.join('、')}｜系列 ${e.meta.series}｜${e.meta.summary}`] : []))
    .join('\n')
    .slice(0, 60_000)

type Target = 'conventions' | 'articles'

/** Where an imported convention or article opens */
const editorPath = (target: Target, draftId: string, index: number, replaces: string) =>
  target === 'articles'
    ? `${replaces ? `${articlePath(replaces)}/edit` : '/library/new'}?draft=${draftId}&n=${index}`
    : `${replaces ? `/edit/${replaces}` : '/new'}?draft=${draftId}&n=${index}`

async function readFile(file: File): Promise<Source> {
  const name = file.name
  const ext = name.toLowerCase().split('.').pop() ?? ''
  if (ext === 'pdf') {
    if (file.size > PDF_MAX_MB * 1024 * 1024) throw new DocTextError(t.tooBig)
    return { name, kind: 'pdf', file }
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  let text: string
  if (ext === 'doc') text = docToText(bytes)
  else if (ext === 'docx') text = docxToText(bytes)
  else if (ext === 'txt' || ext === 'md') text = new TextDecoder().decode(bytes)
  else throw new DocTextError(t.unsupported)
  if (!text.trim()) throw new DocTextError(t.emptyText)
  const note = ext === 'doc' || ext === 'docx' ? '（以下文字由網站從 Word 檔讀出：**…** 是原文粗體，| … | 是表格的一列）\n\n' : ''
  return { name, kind: 'text', text: note + text }
}

type Phase =
  | { step: 'idle' }
  | { step: 'running'; chars: number; sections: number; started: number }
  | { step: 'done'; result: ImportResult; draft: ImportDraftSummary }
  | { step: 'doneArticles'; result: ArticleImportResult; draft: ImportDraftSummary }

function ImportBody() {
  const content = useContent()
  const { categories } = content
  const categoryIds = categories.map((c) => c.id)
  const [params, setParams] = useSearchParams()
  const target: Target = params.get('target') === 'articles' ? 'articles' : 'conventions'
  const [library, setLibrary] = useState<ArticleList | null>(null)
  const [source, setSource] = useState<Source | null>(null)
  const [reading, setReading] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [phase, setPhase] = useState<Phase>({ step: 'idle' })
  const [now, setNow] = useState(() => Date.now())
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState<ImportDraftSummary[]>([])
  const abort = useRef<AbortController | null>(null)

  const loadDrafts = useCallback(
    () =>
      api.book
        .drafts()
        .then((d) => setDrafts(d.drafts))
        .catch(() => undefined),
    [],
  )
  useEffect(() => {
    void loadDrafts()
  }, [loadDrafts])

  // Articles: the series and the library's articles go to the AI
  useEffect(() => {
    if (target !== 'articles' || library) return
    api.book.articles().then(setLibrary, () => undefined)
  }, [target, library])

  // The elapsed time ticks while the AI works
  useEffect(() => {
    if (phase.step !== 'running') return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [phase.step])

  // Leaving the page would lose the analysis under way
  useEffect(() => {
    if (phase.step !== 'running') return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [phase.step])

  const pick = async (file: File | undefined) => {
    setError('')
    setSource(null)
    setPhase({ step: 'idle' })
    if (!file) return
    setReading(true)
    try {
      setSource(await readFile(file))
    } catch (e) {
      setError(e instanceof DocTextError ? e.message : errorText(e))
    } finally {
      setReading(false)
    }
  }

  const start = async () => {
    if (!source) return
    setError('')
    const controller = new AbortController()
    abort.current = controller
    const started = Date.now()
    const articles = target === 'articles'
    setPhase({ step: 'running', chars: 0, sections: 0, started })
    setNow(started)
    try {
      const list = articles ? (library ?? (await api.book.articles())) : null
      const series = list ? resolveSeries(list.series.series) : []
      if (articles && !series.length) throw new Error(a.importNoSeries)
      const { ticket, url, ready } = await api.book.importTicket()
      if (!ready) throw new Error(t.notReady)
      const form = new FormData()
      form.set('ticket', ticket)
      form.set(
        'meta',
        JSON.stringify(
          list
            ? {
                target: 'articles',
                fileName: source.name,
                instructions,
                catalogue: articleCatalogue(list),
                categories: series.map(({ id, label, description }) => ({ id, label, description })),
              }
            : { fileName: source.name, instructions, catalogue: catalogue(content.conventions), categories },
        ),
      )
      if (source.kind === 'pdf') form.set('file', source.file, source.name)
      else form.set('text', source.text)
      // Straight to the Worker: the site's /api proxy gives up after two minutes
      const response = await fetch(url, { method: 'POST', body: form, signal: controller.signal })
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}))
        throw new ApiError(data.error ?? `伺服器回應 ${response.status}`, response.status, data.code)
      }
      // Sections of conventions, or blocks of articles, as a rough count of the progress
      const counted = articles ? /"kind"/g : /"parentId"/g
      const reply = await readReply(response.body, (p) =>
        setPhase({ step: 'running', chars: p.text.length, sections: (p.text.match(counted) ?? []).length, started }),
      )
      if (reply.stopReason === 'max_tokens') throw new Error(t.tooLong)
      if (reply.stopReason === 'refusal') throw new Error(t.refused)
      let parsed: unknown
      try {
        parsed = JSON.parse(reply.text)
      } catch {
        throw new Error(t.badReply)
      }
      if (articles) {
        const result = fromArticleReply(
          parsed,
          series.map((x) => x.id),
          today(),
        )
        if (!result.items.length) throw new Error(t.badReply)
        const { draft } = await api.book.saveDraft(source.name, articleDraftBody(result))
        setPhase({ step: 'doneArticles', result, draft })
      } else {
        const result = fromAiReply(parsed, categoryIds, today())
        if (!result.items.length) throw new Error(t.badReply)
        const { draft } = await api.book.saveDraft(source.name, draftBody(result))
        setPhase({ step: 'done', result, draft })
      }
      void loadDrafts()
    } catch (e) {
      setPhase({ step: 'idle' })
      if (controller.signal.aborted) setError(t.cancelled)
      else setError(e instanceof ApiError || e instanceof StreamError ? e.message : e instanceof Error && e.message ? e.message : errorText(e))
    } finally {
      abort.current = null
    }
  }

  const running = phase.step === 'running'

  return (
    <>
      <Muted>{target === 'articles' ? a.importArticlesIntro : t.intro}</Muted>
      <Panel>
        <Grid>
          <Field>
            {a.importTarget}
            <Select
              value={target}
              disabled={running}
              onChange={(e) => {
                setPhase({ step: 'idle' })
                setParams(e.target.value === 'articles' ? { target: 'articles' } : {}, { replace: true })
              }}
            >
              <option value="conventions">{a.importConventions}</option>
              <option value="articles">{a.importArticlesTarget}</option>
            </Select>
          </Field>
          <Field>
            {t.pick}
            <FileInput
              type="file"
              accept=".doc,.docx,.pdf,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => void pick(e.target.files?.[0])}
              disabled={running}
            />
            <small>{t.pickHint}</small>
          </Field>
          {reading && <Muted role="status">{t.reading}</Muted>}
          {source?.kind === 'pdf' && <Notice>{t.pdfReady((source.file.size / 1024 / 1024).toFixed(1))}</Notice>}
          {source?.kind === 'text' && (
            <Details>
              <summary>
                {t.extracted(source.text.length)}・{t.showText}
              </summary>
              <Extract>{source.text}</Extract>
            </Details>
          )}
          <Field>
            {t.instructions}
            <AutoTextArea value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            <small>{t.instructionsHint}</small>
          </Field>
          {error && <ErrorText role="alert">{error}</ErrorText>}
          {phase.step === 'running' ? (
            <Progress role="status">
              <strong>{t.analysing}</strong>
              <span>{t.progress(phase.chars, phase.sections, Math.round((now - phase.started) / 1000))}</span>
              <Muted>{t.slowHint}</Muted>
              <div>
                <Button type="button" $small $variant="danger" onClick={() => abort.current?.abort()}>
                  <Square size={14} aria-hidden />
                  {t.cancel}
                </Button>
              </div>
            </Progress>
          ) : (
            <Row>
              <Button type="button" $variant="primary" disabled={!source} onClick={() => void start()}>
                <FileUp size={16} aria-hidden />
                {t.start}
              </Button>
              <Muted>{t.cost}</Muted>
            </Row>
          )}
        </Grid>
      </Panel>

      {phase.step === 'done' && (
        <Panel aria-labelledby="import-result">
          <PanelTitle id="import-result">{t.done(phase.result.items.length)}</PanelTitle>
          {phase.result.reviewNotes && (
            <Notice>
              <strong>{t.notes}：</strong>
              {phase.result.reviewNotes}
            </Notice>
          )}
          <Results>
            {phase.result.items.map((item, i) => (
              <li key={i}>
                <div>
                  <strong>{item.convention.nameZh || item.convention.slug}</strong>
                  <Small>
                    {item.replaces ? t.willReplace(content.bySlug(item.replaces)?.nameZh ?? item.replaces) : t.willAdd}・
                    {categories.find((c) => c.id === item.convention.category)?.label}
                    {item.problems.length > 0 && `・${t.problems(item.problems.length)}`}
                  </Small>
                </div>
                <Button as={Link} to={editorPath('conventions', phase.draft.id, i, item.replaces)} $small $variant="primary">
                  {t.open}
                </Button>
              </li>
            ))}
          </Results>
        </Panel>
      )}

      {phase.step === 'doneArticles' && (
        <Panel aria-labelledby="import-result">
          <PanelTitle id="import-result">{a.importDone(phase.result.items.length)}</PanelTitle>
          {phase.result.reviewNotes && (
            <Notice>
              <strong>{t.notes}：</strong>
              {phase.result.reviewNotes}
            </Notice>
          )}
          <Results>
            {phase.result.items.map((item, i) => (
              <li key={i}>
                <div>
                  <strong>{item.article.title || item.article.slug}</strong>
                  <Small>
                    {item.replaces
                      ? a.importWillReplace(library?.entries.find((e) => e.slug === item.replaces)?.meta?.title ?? item.replaces)
                      : a.importWillAdd}
                    {item.problems.length > 0 && `・${t.problems(item.problems.length)}`}
                  </Small>
                </div>
                <Button as={Link} to={editorPath('articles', phase.draft.id, i, item.replaces)} $small $variant="primary">
                  {t.open}
                </Button>
              </li>
            ))}
          </Results>
        </Panel>
      )}

      <Panel aria-labelledby="drafts">
        <PanelTitle id="drafts">{t.drafts}</PanelTitle>
        {!drafts.length ? (
          <Muted>{t.noDrafts}</Muted>
        ) : (
          <Results>
            {drafts.map((d) => (
              <DraftRow key={d.id} draft={d} onDelete={() => api.book.deleteDraft(d.id).then(loadDrafts)} />
            ))}
          </Results>
        )}
      </Panel>
    </>
  )
}

/** A saved draft; opening it loads its conventions (or articles, e5-t08) from the server */
function DraftRow({ draft, onDelete }: { draft: ImportDraftSummary; onDelete: () => Promise<void> }) {
  const articles = draft.articles !== undefined
  const [items, setItems] = useState<{ title: string; replaces: string }[] | null>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open || items) return
    api.book
      .draft(draft.id)
      .then(({ draft: d }) =>
        setItems(
          articles
            ? importedArticles(d.result).items.map((x) => ({ title: x.article.title || x.article.slug, replaces: x.replaces }))
            : importedItems(d.result).items.map((x) => ({ title: x.convention.nameZh || x.convention.slug, replaces: x.replaces })),
        ),
      )
      .catch(() => undefined)
  }, [open, items, draft.id, articles])
  const when = formatDateTime(draft.createdAt)
  return (
    <li>
      <div>
        <button type="button" className="link" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {articles
            ? a.importDraftLine(draft.fileName || '—', draft.createdBy, when, draft.articles ?? 0)
            : strings.importer.draftLine(draft.fileName || '—', draft.createdBy, when, draft.conventions)}
        </button>
        {open && items && (
          <DraftItems>
            {items.map((item, i) => (
              <li key={i}>
                <Link to={editorPath(articles ? 'articles' : 'conventions', draft.id, i, item.replaces)}>{item.title}</Link>
              </li>
            ))}
          </DraftItems>
        )}
      </div>
      <Button type="button" $small $variant="ghost" onClick={() => void onDelete()}>
        {strings.importer.deleteDraft}
      </Button>
    </li>
  )
}

const Grid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`

const FileInput = styled.input`
  font: inherit;
  font-weight: 400;
`

const Details = styled.details`
  summary {
    cursor: pointer;
    color: ${({ theme }) => theme.colors.primary};
  }
`

const Extract = styled.pre`
  max-height: 320px;
  overflow: auto;
  margin: ${({ theme }) => theme.space(2)} 0 0;
  padding: ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.875rem;
  white-space: pre-wrap;
`

const Progress = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
  padding: ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.primarySoft};
`

const Results = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  margin: ${({ theme }) => theme.space(3)} 0 0;
  padding: 0;
  list-style: none;

  & > li {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: ${({ theme }) => theme.space(2)};
    padding: ${({ theme }) => theme.space(2)} 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  button.link {
    border: 0;
    padding: 0;
    background: none;
    color: ${({ theme }) => theme.colors.primary};
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
`

const Small = styled.small`
  display: block;
  color: ${({ theme }) => theme.colors.textMuted};
`

const DraftItems = styled.ul`
  margin: ${({ theme }) => theme.space(1)} 0 0;
  padding-left: ${({ theme }) => theme.space(5)};
`
