import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { BlockView } from '../components/BlockView.tsx'
import { CopyLinkButton } from '../components/CopyLinkButton.tsx'
import { KindLevel } from '../components/KindLevel.tsx'
import { Pencil } from 'lucide-react'
import { BackLink, Button, Row } from '../components/ui.tsx'
import { libraryStrings } from '../libraryStrings.ts'
import { api, ApiError, errorText, type ArticleFiles } from '../lib/api.ts'
import { onlineArticle } from '../lib/articles.ts'
import { AT_PARAM, placeParam, useReadingMark, useReadingPlaces } from '../lib/reading.ts'
import { articlePath, resolveSeries } from '../lib/series.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { ArticleFilesContext } from '../state/ArticleFilesContext.tsx'
import type { Article } from '../types/article.ts'
import { PageBar } from './HandbookShell.tsx'

const s = libraryStrings

type State =
  | { status: 'loading' }
  | { status: 'failed'; message: string }
  | { status: 'missing' }
  | { status: 'broken'; problem: string }
  | { status: 'ready'; article: Article; files: ArticleFiles; seriesLabel?: string }

/**
 * /library/:slug, one article (E5 e5-t05, DESIGN-V2.md §6): the convention page's book-page
 * layout, a measure of about 68 characters, serif headings and every block an article can have.
 * Articles live only on the Worker, so the page reads them from there; its pictures' signed
 * addresses come with it (ArticleFilesContext). Hidden and `members-only` articles (signed out)
 * are a 404 from the Worker, shown as 找不到. Lazy, inside the handbook's frame (App.tsx).
 */
export function ArticlePage() {
  const { slug = '' } = useParams()
  const { user, can } = useAuth()
  // What was loaded, for which article and reader; anything else is still loading
  const key = `${slug} ${user?.id ?? ''}`
  const [loaded, setLoaded] = useState<{ key: string; state: State }>()
  const state: State = loaded?.key === key ? loaded.state : { status: 'loading' }

  const load = useCallback(() => {
    const setState = (next: State) => setLoaded({ key, state: next })
    // The article and the series' names; the list is small and the library page caches nothing
    Promise.all([api.book.article(slug), api.book.articles().catch(() => null)])
      .then(([{ entry, files }, list]) => {
        const checked = onlineArticle(entry)
        if ('problem' in checked) return setState({ status: 'broken', problem: checked.problem })
        if (!checked.article) return setState({ status: 'missing' })
        const series = resolveSeries(list?.series.series).find((x) => x.id === checked.article!.series)
        setState({ status: 'ready', article: checked.article, files, seriesLabel: series?.label })
      })
      .catch((error) =>
        setState(
          error instanceof ApiError && error.status === 404
            ? { status: 'missing' }
            : { status: 'failed', message: errorText(error) },
        ),
      )
  }, [slug, key])

  // Signing in or out changes what the reader may see, and so the key
  useEffect(load, [load])
  const retry = () => {
    setLoaded(undefined)
    load()
  }
  usePageTitle(state.status === 'ready' ? state.article.title : s.title)

  const trail = (
    <Trail aria-label={s.breadcrumb}>
      <Link to="/library">{s.title}</Link>
      {state.status === 'ready' && state.seriesLabel && (
        <>
          {' › '}
          <Link to={`/library?series=${encodeURIComponent(state.article.series)}`}>{state.seriesLabel}</Link>
        </>
      )}
    </Trail>
  )

  if (state.status !== 'ready')
    return (
      <Page>
        <PageBar lead={trail} />
        {state.status === 'loading' && <Muted role="status">{s.loading}</Muted>}
        {state.status === 'failed' && (
          <Notice role="alert">
            {state.message}{' '}
            <Button type="button" $small onClick={retry}>
              {s.retry}
            </Button>
          </Notice>
        )}
        {state.status === 'missing' && (
          <Notice role="alert">
            {s.notFound}
            <Row>
              <BackLink to="/library">{s.backToLibrary}</BackLink>
              {/* A hidden article is only gone for readers: editors may bring it back (e5-t07) */}
              {can('bookEdit') && (
                <Button as={Link} to={`${articlePath(slug)}/edit`} $small>
                  <Pencil size={16} aria-hidden />
                  {s.editArticle}
                </Button>
              )}
            </Row>
          </Notice>
        )}
        {state.status === 'broken' && <Notice role="alert">{s.broken(state.problem)}</Notice>}
      </Page>
    )

  return (
    <ArticleView
      key={state.article.slug}
      article={state.article}
      files={state.files}
      trail={trail}
      signedIn={!!user}
      editable={can('bookEdit')}
    />
  )
}

/**
 * The article itself. A signed-in reader's place (the block they have reached) is kept with their
 * account as they scroll (e5-t14, AC-5.8); `?at=` opens the article at a block, which is where
 * 「繼續閱讀」 on 我的帳號 goes, and an article opened without it offers to go back to that place.
 */
function ArticleView({
  article,
  files,
  trail,
  signedIn,
  editable,
}: {
  article: Article
  files: ArticleFiles
  trail: ReactNode
  signedIn: boolean
  /** An editor's: a link to the article editor (e5-t07) */
  editable: boolean
}) {
  const body = useRef<HTMLDivElement>(null)
  const [params] = useSearchParams()
  const last = article.blocks.length - 1
  const at = placeParam(params.get(AT_PARAM), 0, last)
  const { places } = useReadingPlaces(signedIn && at === undefined)
  const saved = places?.find((p) => p.kind === 'article' && p.id === article.slug)?.place
  const [resumed, setResumed] = useState(false)
  const resume = saved !== undefined && saved > 0 && saved <= last && !resumed ? saved : undefined

  // Opened at a block: bring it to the top once it is drawn
  useEffect(() => {
    if (at !== undefined) blockAt(body, at)?.scrollIntoView?.()
  }, [at, article.slug])

  const mark = useReadingMark(
    signedIn && article.blocks.length ? { kind: 'article', id: article.slug, title: article.title, of: article.blocks.length } : undefined,
  )
  useReadingPlace(body, mark)

  return (
    <ArticleFilesContext.Provider value={files}>
      <Page>
        <PageBar lead={trail} onPrint={() => window.print()} />
        <article aria-labelledby="article-title">
          <TitleBlock>
            <TitleRow>
              <Title id="article-title">{article.title}</Title>
              <span data-print="hide">
                {editable && (
                  <Button as={Link} to={`${articlePath(article.slug)}/edit`} $small $variant="ghost">
                    {s.editArticle}
                  </Button>
                )}
                <CopyLinkButton path={articlePath(article.slug)} label={article.title} />
              </span>
            </TitleRow>
            {article.authors.length > 0 && <Byline>{s.by(article.authors)}</Byline>}
            <Meta>
              <KindLevel level={article.level} levelOnly />
              <span>{s.published(article.published)}</span>
              {article.updated !== article.published && <span>{s.updated(article.updated)}</span>}
              <span>{s.licenses[article.license]}</span>
            </Meta>
          </TitleBlock>
          {resume !== undefined && (
            <Resume data-print="hide">
              <Button
                type="button"
                $small
                onClick={() => {
                  setResumed(true)
                  blockAt(body, resume)?.scrollIntoView?.()
                }}
              >
                {s.reading.resume(resume, article.blocks.length)}
              </Button>
            </Resume>
          )}
          {article.summary && <Lede>{article.summary}</Lede>}
          <Body ref={body}>
            {article.blocks.map((block, i) => (
              <Place key={i} data-reading-block={i}>
                <BlockView block={block} />
              </Place>
            ))}
          </Body>
        </article>
      </Page>
    </ArticleFilesContext.Provider>
  )
}

const blockAt = (body: RefObject<HTMLDivElement | null>, place: number) =>
  body.current?.querySelector<HTMLElement>(`[data-reading-block="${place}"]`)

/**
 * Tells `mark` the block the reader has reached as they scroll: the last one whose top is above a
 * line a third of the way down the window, or the last block at the bottom of the page.
 */
function useReadingPlace(body: RefObject<HTMLDivElement | null>, mark: (place: number) => void) {
  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const blocks = body.current?.querySelectorAll<HTMLElement>('[data-reading-block]')
      if (!blocks?.length) return
      const line = window.innerHeight / 3
      const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      let place = 0
      if (atEnd) place = blocks.length - 1
      else for (const [i, block] of blocks.entries()) if (block.getBoundingClientRect().top <= line) place = i
      mark(place)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [body, mark])
}

/** About 68 characters of body text (DESIGN-V2.md §4) */
const Page = styled.div`
  max-width: 44rem;
`

const Trail = styled.nav`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};

  a {
    color: ${({ theme }) => theme.colors.primary};
  }
`

const TitleBlock = styled.header`
  padding-bottom: ${({ theme }) => theme.space(3)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.accent};
`

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space(2)};

  & > span {
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.space(1)};
    margin-left: auto;
  }
`

const Title = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 2rem;
  font-weight: ${({ theme }) => theme.headingWeight};
  line-height: 1.25;
  color: ${({ theme }) => theme.colors.primaryStrong};
`

const Byline = styled.p`
  margin: ${({ theme }) => theme.space(1)} 0 ${({ theme }) => theme.space(2)};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(3)};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Lede = styled.p`
  margin: ${({ theme }) => theme.space(4)} 0 ${({ theme }) => theme.space(6)};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.75;
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  line-height: 1.75;
`

/** One block; under the header when 「繼續閱讀」 brings it to the top */
const Place = styled.div`
  scroll-margin-top: calc(${({ theme }) => theme.layout.headerHeight} + 16px);
`

const Resume = styled.p`
  margin: ${({ theme }) => theme.space(3)} 0 0;
`

const Muted = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
`

const Notice = styled.p`
  padding: ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.warningBg};
`
