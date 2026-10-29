import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { BlockView } from '../components/BlockView.tsx'
import { CopyLinkButton } from '../components/CopyLinkButton.tsx'
import { KindLevel } from '../components/KindLevel.tsx'
import { Button } from '../components/ui.tsx'
import { libraryStrings } from '../libraryStrings.ts'
import { api, ApiError, errorText, type ArticleFiles } from '../lib/api.ts'
import { onlineArticle } from '../lib/articles.ts'
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
  const { user } = useAuth()
  const { pathname } = useLocation()
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
            {s.notFound}{' '}
            {user === null ? (
              <Link to={`/login?next=${encodeURIComponent(pathname)}`}>{s.signIn}</Link>
            ) : (
              <Link to="/library">{s.backToLibrary}</Link>
            )}
          </Notice>
        )}
        {state.status === 'broken' && <Notice role="alert">{s.broken(state.problem)}</Notice>}
      </Page>
    )

  const { article, files } = state
  return (
    <ArticleFilesContext.Provider value={files}>
      <Page>
        <PageBar lead={trail} onPrint={() => window.print()} />
        <article aria-labelledby="article-title">
          <TitleBlock>
            <TitleRow>
              <Title id="article-title">{article.title}</Title>
              <span data-print="hide">
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
          {article.summary && <Lede>{article.summary}</Lede>}
          <Body>
            {article.blocks.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
          </Body>
        </article>
      </Page>
    </ArticleFilesContext.Provider>
  )
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

  span {
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

const Muted = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
`

const Notice = styled.p`
  padding: ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.warningBg};
`
