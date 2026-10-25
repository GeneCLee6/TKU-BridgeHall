import { FileUp, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { AutoTextArea } from '../components/editor/fields.tsx'
import { Button, ErrorText, Field, Muted, Notice, PageTitle, Panel, PanelTitle, Row } from '../components/ui.tsx'
import { categories } from '../content/categories.ts'
import { api, ApiError, errorText, type ImportDraftSummary } from '../lib/api.ts'
import { DocTextError, docToText, docxToText } from '../lib/docText.ts'
import { formatDateTime, today } from '../lib/format.ts'
import { draftBody, fromAiReply, importedItems, type ImportResult } from '../lib/importResult.ts'
import { readReply, StreamError } from '../lib/sse.ts'
import { useContent } from '../state/ContentContext.tsx'
import { strings } from '../strings.ts'
import type { ConventionMeta, SectionOutline } from '../types/convention.ts'
import { Frame, Gate } from './Frame.tsx'

const t = strings.importer
const PDF_MAX_MB = 20
const categoryIds = categories.map((c) => c.id as string)

/** What was taken out of the chosen file */
type Source = { name: string; kind: 'text'; text: string } | { name: string; kind: 'pdf'; file: File }

/**
 * 匯入檔案: a Word or PDF file goes to Claude (through TKU BridgeTable's Worker, which holds the
 * key) with the handbook's current catalogue; the reply becomes conventions in a draft that opens
 * in the editor. Word files are read here in the browser; PDFs go as they are.
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

function ImportBody() {
  const content = useContent()
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
    setPhase({ step: 'running', chars: 0, sections: 0, started })
    setNow(started)
    try {
      const { ticket, url, ready } = await api.book.importTicket()
      if (!ready) throw new Error(t.notReady)
      const form = new FormData()
      form.set('ticket', ticket)
      form.set(
        'meta',
        JSON.stringify({ fileName: source.name, instructions, catalogue: catalogue(content.conventions), categories }),
      )
      if (source.kind === 'pdf') form.set('file', source.file, source.name)
      else form.set('text', source.text)
      // Straight to the Worker: the site's /api proxy gives up after two minutes
      const response = await fetch(url, { method: 'POST', body: form, signal: controller.signal })
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}))
        throw new ApiError(data.error ?? `伺服器回應 ${response.status}`, response.status, data.code)
      }
      const reply = await readReply(response.body, (p) =>
        setPhase({ step: 'running', chars: p.text.length, sections: (p.text.match(/"parentId"/g) ?? []).length, started }),
      )
      if (reply.stopReason === 'max_tokens') throw new Error(t.tooLong)
      if (reply.stopReason === 'refusal') throw new Error(t.refused)
      let parsed: unknown
      try {
        parsed = JSON.parse(reply.text)
      } catch {
        throw new Error(t.badReply)
      }
      const result = fromAiReply(parsed, categoryIds, today())
      if (!result.items.length) throw new Error(t.badReply)
      const { draft } = await api.book.saveDraft(source.name, draftBody(result))
      setPhase({ step: 'done', result, draft })
      void loadDrafts()
    } catch (e) {
      setPhase({ step: 'idle' })
      if (controller.signal.aborted) setError(t.cancelled)
      else setError(e instanceof ApiError || e instanceof StreamError ? e.message : e instanceof Error && e.message ? e.message : errorText(e))
    } finally {
      abort.current = null
    }
  }

  const editorPath = (draftId: string, index: number, replaces: string) =>
    `${replaces ? `/edit/${replaces}` : '/new'}?draft=${draftId}&n=${index}`

  return (
    <>
      <Muted>{t.intro}</Muted>
      <Panel>
        <Grid>
          <Field>
            {t.pick}
            <FileInput
              type="file"
              accept=".doc,.docx,.pdf,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => void pick(e.target.files?.[0])}
              disabled={phase.step === 'running'}
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
                <Button as={Link} to={editorPath(phase.draft.id, i, item.replaces)} $small $variant="primary">
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
              <DraftRow key={d.id} draft={d} editorPath={editorPath} onDelete={() => api.book.deleteDraft(d.id).then(loadDrafts)} />
            ))}
          </Results>
        )}
      </Panel>
    </>
  )
}

/** A saved draft; opening it loads its conventions from the server */
function DraftRow({
  draft,
  editorPath,
  onDelete,
}: {
  draft: ImportDraftSummary
  editorPath: (draftId: string, index: number, replaces: string) => string
  onDelete: () => Promise<void>
}) {
  const [result, setResult] = useState<ImportResult | null>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open || result) return
    api.book
      .draft(draft.id)
      .then(({ draft: d }) => setResult(importedItems(d.result)))
      .catch(() => undefined)
  }, [open, result, draft.id])
  return (
    <li>
      <div>
        <button type="button" className="link" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {strings.importer.draftLine(draft.fileName || '—', draft.createdBy, formatDateTime(draft.createdAt), draft.conventions)}
        </button>
        {open && result && (
          <DraftItems>
            {result.items.map((item, i) => (
              <li key={i}>
                <Link to={editorPath(draft.id, i, item.replaces)}>{item.convention.nameZh || item.convention.slug}</Link>
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
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.875rem;
  white-space: pre-wrap;
`

const Progress = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
  padding: ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.radius.sm};
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
