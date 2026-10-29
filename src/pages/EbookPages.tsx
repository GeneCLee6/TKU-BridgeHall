import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button, ErrorText, Field, Input, Muted, Notice, PageTitle, Panel, PanelTitle, Row } from '../components/ui.tsx'
import { ApiError, errorText } from '../lib/api.ts'
import {
  bySeries,
  type Ebook,
  ebookApi,
  type EbookFiles,
  EBOOK_LICENSES,
  type EbookList,
  type EbookResponse,
  formatBytes,
  formOf,
  formToInput,
  nearlyFull,
  pdfProblem,
  uploadPdf,
  workerUrl,
} from '../lib/ebooks.ts'
import { filesOff, uploadArticlePicture } from '../lib/imageUpload.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { strings } from '../strings.ts'
import { ebookStrings as t } from './ebookStrings.ts'
import { Frame } from './Frame.tsx'

// pdf.js only loads when a book is opened (e5-t10): never on the list, never on the home page
const PdfReader = lazy(() => import('../components/PdfReader.tsx').then((m) => ({ default: m.PdfReader })))

/**
 * 電子書（E5 e5-t09～e5-t11、e5-t15）: the list (/library/book), grouped by series, and a book's page
 * (/library/book/:id) with the in-site PDF reader. Reviewers upload, edit and take books down
 * here; editors also see how full the file storage is. Signed out, members-only books are not in
 * the list and their page answers as if there were no such book (the Worker leaves them out).
 */
export function EbooksPage() {
  return (
    <Frame title={t.listTitle}>
      <Ebooks />
    </Frame>
  )
}

export function EbookPage() {
  return (
    <Frame>
      <Book />
    </Frame>
  )
}

const failure = (e: unknown) => (filesOff(e) ? t.filesOff : errorText(e))

function Ebooks() {
  const { user, can } = useAuth()
  const [list, setList] = useState<EbookList | { error: string } | null>(null)
  const [tick, setTick] = useState(0)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let current = true
    ebookApi.list().then(
      (next) => current && setList(next),
      (e) => current && setList({ error: errorText(e) }),
    )
    return () => {
      current = false
    }
    // Signing in or out changes which books the Worker gives
  }, [tick, user])

  return (
    <>
      <PageTitle>{t.listTitle}</PageTitle>
      <Muted>{t.listIntro}</Muted>
      {user === null && (
        <Muted>
          {t.membersHint} <Link to="/login?next=%2Flibrary%2Fbook">{t.signIn}</Link>
        </Muted>
      )}
      {notice && <Notice role="status">{notice}</Notice>}
      {list && 'usage' in list && list.usage && (
        <>
          <Muted>{t.usage(formatBytes(list.usage.bytes), formatBytes(list.usage.maxBytes))}</Muted>
          {nearlyFull(list.usage) && <ErrorText role="alert">{t.usageWarn}</ErrorText>}
        </>
      )}
      {can('bookReview') && (
        <EbookForm
          onSaved={(book) => {
            setNotice(t.uploaded(book.title))
            setTick((n) => n + 1)
          }}
        />
      )}
      {!list ? (
        <Muted role="status">{strings.loading}</Muted>
      ) : 'error' in list ? (
        <ErrorText role="alert">
          {t.loadFailed}：{list.error}
        </ErrorText>
      ) : !list.ebooks.length ? (
        <Muted>{t.empty}</Muted>
      ) : (
        bySeries(list.ebooks).map(([series, books]) => (
          <section key={series} aria-labelledby={`series-${series}`}>
            <SeriesTitle id={`series-${series}`}>{series}</SeriesTitle>
            <Shelf>
              {books.map((book) => (
                <BookCard key={book.id} book={book} files={list.files} />
              ))}
            </Shelf>
          </section>
        ))
      )}
    </>
  )
}

function BookCard({ book, files }: { book: Ebook; files: EbookFiles }) {
  const cover = book.cover ? files[book.cover] : undefined
  return (
    <Card>
      <Link to={`/library/book/${book.id}`}>
        <Cover $empty={!cover}>
          {cover ? <img src={cover.thumbUrl ?? cover.url} alt="" loading="lazy" /> : <span aria-hidden>{book.title}</span>}
        </Cover>
        <CardTitle>{book.title}</CardTitle>
      </Link>
      <Small>{t.byAuthors(book.authors)}</Small>
      <Small>
        {book.year ? `${t.year(book.year)} · ` : ''}
        {t.licenses[book.license]}
      </Small>
    </Card>
  )
}

function Book() {
  const { id = '' } = useParams()
  const { user, can } = useAuth()
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState<EbookResponse | { error: string; gone: boolean } | null>(null)
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)
  usePageTitle(loaded && 'ebook' in loaded ? loaded.ebook.title : t.listTitle)

  useEffect(() => {
    let current = true
    ebookApi.get(id).then(
      (next) => current && setLoaded(next),
      (e) => current && setLoaded({ error: errorText(e), gone: e instanceof ApiError && e.status === 404 }),
    )
    return () => {
      current = false
    }
  }, [id, tick, user])

  const back = <Link to="/library/book">{t.back}</Link>
  if (!loaded) return <Muted role="status">{strings.loading}</Muted>
  if ('error' in loaded)
    return (
      <>
        {back}
        <ErrorText role="alert">{loaded.gone ? (user ? t.notFound : t.notFoundSignedOut) : loaded.error}</ErrorText>
        {loaded.gone && user === null && (
          <Row>
            <Link to={`/login?next=${encodeURIComponent(`/library/book/${id}`)}`}>{t.signIn}</Link>
          </Row>
        )}
      </>
    )

  const { ebook, files } = loaded
  const pdf = files[ebook.fileKey]
  const cover = ebook.cover ? files[ebook.cover] : undefined
  const remove = async () => {
    if (!window.confirm(t.removeConfirm(ebook.title))) return
    try {
      await ebookApi.remove(ebook.id)
      navigate('/library/book')
    } catch (e) {
      setError(errorText(e))
    }
  }

  return (
    <>
      {back}
      <Head>
        {cover && <img src={cover.thumbUrl ?? cover.url} alt="" />}
        <div>
          <PageTitle>{ebook.title}</PageTitle>
          <Muted>{t.byAuthors(ebook.authors)}</Muted>
          <Muted>
            {[ebook.series, ebook.year && t.year(ebook.year), ebook.pages && t.pagesCount(ebook.pages), formatBytes(ebook.size)]
              .filter(Boolean)
              .join(' · ')}
          </Muted>
          <Muted>
            {t.licenseLabel}：{t.licenses[ebook.license]}（{t.licenseHints[ebook.license]}）
          </Muted>
        </div>
      </Head>
      {notice && <Notice role="status">{notice}</Notice>}
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {can('bookReview') && (
        <Row>
          <Button type="button" $small onClick={() => setEditing((on) => !on)} aria-expanded={editing}>
            {editing ? t.cancel : t.edit}
          </Button>
          <Button type="button" $small $variant="danger" onClick={() => void remove()}>
            {t.remove}
          </Button>
        </Row>
      )}
      {editing && (
        <EbookForm
          book={ebook}
          onSaved={() => {
            setEditing(false)
            setNotice(t.saved)
            setTick((n) => n + 1)
          }}
        />
      )}
      {pdf ? (
        <Suspense fallback={<Muted role="status">{t.reader.loading}</Muted>}>
          <PdfReader key={ebook.fileKey} url={workerUrl(pdf.url)} title={ebook.title} />
        </Suspense>
      ) : (
        <ErrorText role="alert">{t.fileMissing}</ErrorText>
      )}
    </>
  )
}

/** Uploading a new book, or changing one's record (and optionally its PDF): reviewers only */
function EbookForm({ book, onSaved }: { book?: Ebook; onSaved: (book: Ebook) => void }) {
  const [form, setForm] = useState(() => formOf(book))
  const [pdf, setPdf] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    const checked = formToInput(form, book?.fileKey ?? 'pending')
    if (typeof checked === 'string') return setError(t.problems[checked])
    if (!book && !pdf) return setError(t.problems.file)
    const problem = pdf && pdfProblem(pdf)
    if (problem) return setError(t.problems[problem])
    try {
      let fileKey = book?.fileKey ?? ''
      if (pdf) {
        setBusy(t.uploading(0))
        fileKey = await uploadPdf(pdf, (share) => setBusy(t.uploading(Math.round(share * 100))))
      }
      let cover = book?.cover
      if (coverFile) {
        setBusy(t.coverUploading)
        cover = await uploadArticlePicture(coverFile)
      }
      setBusy(t.saving)
      const input = { ...checked, fileKey, ...(cover ? { cover } : {}) }
      const saved = book ? await ebookApi.update(book.id, input) : await ebookApi.create(input)
      if (!book) {
        setForm(formOf())
        setPdf(null)
        setCoverFile(null)
        ;(event.target as HTMLFormElement).reset()
      }
      onSaved(saved)
    } catch (e) {
      // A cover that is not a JPEG, PNG or WebP (imageUpload throws a TypeError for one)
      setError(coverFile && e instanceof TypeError && e.message !== 'network' ? t.problems.coverType : failure(e))
    } finally {
      setBusy('')
    }
  }

  return (
    <Panel aria-labelledby={book ? 'ebook-edit' : 'ebook-upload'}>
      <PanelTitle id={book ? 'ebook-edit' : 'ebook-upload'}>{book ? t.edit : t.uploadTitle}</PanelTitle>
      <Form onSubmit={(e) => void submit(e)}>
        <Muted>{t.uploadIntro}</Muted>
        <Field>
          {book ? t.fields.replaceFile : t.fields.file}
          <Input type="file" accept="application/pdf,.pdf" required={!book} onChange={(e) => setPdf(e.target.files?.[0] ?? null)} />
        </Field>
        <Field>
          {t.fields.title}
          <Input value={form.title} onChange={set('title')} required maxLength={120} />
        </Field>
        <Field>
          {t.fields.authors}
          <Input value={form.authors} onChange={set('authors')} required />
        </Field>
        <Field>
          {t.fields.series}
          <Input value={form.series} onChange={set('series')} required maxLength={40} />
        </Field>
        <Row>
          <Field>
            {t.fields.year}
            <Input value={form.year} onChange={set('year')} inputMode="numeric" />
          </Field>
          <Field>
            {t.fields.pages}
            <Input value={form.pages} onChange={set('pages')} inputMode="numeric" />
          </Field>
        </Row>
        <Field>
          {t.fields.cover}
          <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
        </Field>
        <Licenses>
          <legend>{t.fields.license}</legend>
          {EBOOK_LICENSES.map((license) => (
            <label key={license}>
              <input
                type="radio"
                name={book ? `license-${book.id}` : 'license-new'}
                value={license}
                checked={form.license === license}
                onChange={set('license')}
                required
              />
              <span>
                {t.licenses[license]}
                <small>{t.licenseHints[license]}</small>
              </span>
            </label>
          ))}
        </Licenses>
        {error && <ErrorText role="alert">{error}</ErrorText>}
        <Row>
          <Button type="submit" $variant="primary" disabled={!!busy}>
            {book ? t.save : t.upload}
          </Button>
          {busy && <Muted role="status">{busy}</Muted>}
        </Row>
      </Form>
    </Panel>
  )
}

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`

const Licenses = styled.fieldset`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  margin: 0;
  padding: ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};

  legend {
    font-size: 0.8125rem;
    font-weight: 600;
  }

  label {
    display: flex;
    gap: ${({ theme }) => theme.space(2)};
    align-items: start;
    cursor: pointer;
  }

  span {
    display: grid;
  }

  small {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const SeriesTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space(3)};
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.primaryStrong};
`

const Shelf = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: ${({ theme }) => theme.space(4)};
  margin: 0;
  padding: 0;
  list-style: none;
`

const Card = styled.li`
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
  align-content: start;

  a {
    display: grid;
    gap: ${({ theme }) => theme.space(2)};
    color: inherit;
    text-decoration: none;
  }

  a:hover h3,
  a:focus-visible h3 {
    text-decoration: underline;
  }
`

const Cover = styled.div<{ $empty: boolean }>`
  aspect-ratio: 3 / 4;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: ${({ theme, $empty }) => ($empty ? theme.space(3) : 0)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme, $empty }) => ($empty ? theme.colors.primarySoft : theme.colors.surfaceAlt)};
  color: ${({ theme }) => theme.colors.primaryStrong};
  font-weight: 700;
  text-align: center;
  line-height: 1.4;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const CardTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  line-height: 1.4;
`

const Small = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
`

const Head = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(4)};
  align-items: start;

  img {
    width: 7rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.shape.control};
  }

  div {
    display: grid;
    gap: ${({ theme }) => theme.space(1)};
  }
`
