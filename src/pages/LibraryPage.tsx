import { BookOpenText, FilePlus2, FileUp, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { KindLevel } from '../components/KindLevel.tsx'
import { Button, Row, Select } from '../components/ui.tsx'
import { libraryStrings } from '../libraryStrings.ts'
import { errorText, type ArticleList, type ArticleSeries } from '../lib/api.ts'
import { libraryApi } from '../lib/libraryApi.ts'
import { articleRecords, searchRecords } from '../lib/search.ts'
import { articlePath, authorsOf, filterArticles, resolveSeries, seriesColorIndex, shelves, type ShelfFilter } from '../lib/series.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { strings } from '../strings.ts'
import { avatarColors, onAvatar } from '../styles/avatarColors.ts'
import type { ArticleMeta } from '../types/article.ts'
import { levels, type Level } from '../types/convention.ts'
import { ArticlePage } from './ArticlePage.tsx'
import { PageBar } from './HandbookShell.tsx'

const s = libraryStrings

/** /library and /library/:slug: one lazy chunk for both, so App.tsx needs one route (the home page's budget) */
export function Library() {
  return useParams().slug ? <ArticlePage /> : <LibraryPage />
}

/**
 * /library, the library's shelves (叢書, E5 e5-t05, e5-t13): one shelf per series in the series'
 * order (lib/series.ts), each article a book with its cover (or one made from the series' colour
 * and the title). Narrowed by series, level and author; the search box searches titles, authors
 * and the words of every article (the Worker sends them with `?text=1`). The series filter is in
 * the address (`?series=`), so an article's trail links to its shelf. Lazy, inside the handbook's
 * frame (App.tsx).
 */
export function LibraryPage() {
  const { user, can } = useAuth()
  const [list, setList] = useState<ArticleList>()
  const [error, setError] = useState('')
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  usePageTitle(s.title)

  const load = useCallback(() => {
    libraryApi.articlesWithText().then(
      (next) => {
        setError('')
        setList(next)
      },
      (e) => setError(errorText(e)),
    )
  }, [])
  // Signing in or out changes which articles the reader may see
  useEffect(load, [load, user?.id])

  const articles = useMemo(() => list?.entries.flatMap((e) => (e.meta ? [e.meta] : [])) ?? [], [list])
  const series = useMemo(() => resolveSeries(list?.series.series), [list])
  const search = useMemo(() => (list ? searchRecords(articleRecords(list)) : () => []), [list])

  const filter: ShelfFilter = {
    series: params.get('series') ?? '',
    level: (levels.includes(params.get('level') as Level) ? params.get('level') : '') as Level | '',
    author: params.get('author') ?? '',
  }
  const setFilter = (patch: Partial<ShelfFilter>) => {
    const next = { ...filter, ...patch }
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)), { replace: true })
  }
  const filtered = filterArticles(articles, filter)
  const filtering = Boolean(filter.series || filter.level || filter.author || query.trim())
  // Search ranks the results; the shelves give way to one list while there is a query
  const found = query.trim()
    ? search(query, 50).flatMap((r) => filtered.filter((a) => `library/${a.slug}` === r.slug))
    : undefined
  const seriesLabel = (id: string) => series.find((x) => x.id === id)?.label ?? s.otherSeries

  return (
    <>
      <PageBar lead={<Lead>{s.title}</Lead>} />
      <Intro>
        <h1>{s.title}</h1>
        <p>{s.intro}</p>
        <Row>
          {can('bookEdit') && (
            <Button as={Link} to="/library/new" $small $variant="primary">
              <FilePlus2 size={16} aria-hidden />
              {s.newArticle}
            </Button>
          )}
          {can('bookImport') && (
            <Button as={Link} to="/import?target=articles" $small>
              <FileUp size={16} aria-hidden />
              {s.importArticles}
            </Button>
          )}
          <Button as={Link} to="/library/book" $small>
            <BookOpenText size={16} aria-hidden />
            {s.ebooks}
          </Button>
        </Row>
      </Intro>

      {error && (
        <Notice role="alert">
          {s.failed} {error}{' '}
          <Button
            type="button"
            $small
            onClick={() => {
              setError('')
              load()
            }}
          >
            {s.retry}
          </Button>
        </Notice>
      )}
      {!list && !error && <Muted role="status">{s.loading}</Muted>}

      {list && (
        <>
          <Tools role="search" aria-label={s.filters} onSubmit={(e) => e.preventDefault()}>
            <SearchField>
              <Search size={16} aria-hidden />
              <input
                type="search"
                value={query}
                aria-label={s.searchLabel}
                placeholder={s.searchPlaceholder}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
              />
            </SearchField>
            <label>
              {s.series}
              <Select value={filter.series} onChange={(e) => setFilter({ series: e.target.value })}>
                <option value="">{s.all}</option>
                {series.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              {s.level}
              <Select value={filter.level} onChange={(e) => setFilter({ level: e.target.value as Level | '' })}>
                <option value="">{s.all}</option>
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {strings.levels[l]}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              {s.author}
              <Select value={filter.author} onChange={(e) => setFilter({ author: e.target.value })}>
                <option value="">{s.all}</option>
                {authorsOf(articles).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </label>
            {filtering && (
              <Button
                type="button"
                $small
                $variant="ghost"
                onClick={() => {
                  setQuery('')
                  setParams({}, { replace: true })
                }}
              >
                {s.clear}
              </Button>
            )}
          </Tools>
          <Count role="status">{s.shown((found ?? filtered).length, articles.length)}</Count>

          {!articles.length ? (
            <Muted>{s.empty}</Muted>
          ) : found ? (
            found.length ? (
              <Books>
                {found.map((a) => (
                  <BookTile key={a.slug} article={a} files={list.files} seriesLabel={seriesLabel(a.series)} />
                ))}
              </Books>
            ) : (
              <Muted>{s.noMatch}</Muted>
            )
          ) : filtered.length ? (
            shelves(series, filtered).map((shelf) => (
              <ShelfView key={shelf.series?.id ?? ''} shelf={shelf.series} articles={shelf.articles} files={list.files} />
            ))
          ) : (
            <Muted>{s.noMatch}</Muted>
          )}
        </>
      )}
    </>
  )
}

function ShelfView({ shelf, articles, files }: { shelf: ArticleSeries | null; articles: ArticleMeta[]; files: ArticleList['files'] }) {
  const id = `shelf-${shelf?.id ?? 'other'}`
  return (
    <Shelf aria-labelledby={id}>
      <ShelfHeading id={id}>
        {shelf?.label ?? s.otherSeries}
        <small>{s.articleCount(articles.length)}</small>
      </ShelfHeading>
      {shelf?.description && <ShelfNote>{shelf.description}</ShelfNote>}
      <Books>
        {articles.map((a) => (
          <BookTile key={a.slug} article={a} files={files} seriesLabel={shelf?.label ?? s.otherSeries} />
        ))}
      </Books>
    </Shelf>
  )
}

/** One article on a shelf: its cover, title, authors and level; the whole tile is the link */
function BookTile({ article, files, seriesLabel }: { article: ArticleMeta; files: ArticleList['files']; seriesLabel: string }) {
  const cover = article.cover ? files[article.cover] : undefined
  const color = avatarColors[seriesColorIndex(article.series, avatarColors.length)]
  return (
    <li>
      <Tile to={articlePath(article.slug)}>
        {cover ? (
          <CoverImage src={cover.thumbUrl ?? cover.url} alt="" loading="lazy" />
        ) : (
          <MadeCover aria-hidden $color={color}>
            <small>{seriesLabel}</small>
            <span>{article.title}</span>
          </MadeCover>
        )}
        <TileText>
          <strong>{article.title}</strong>
          {article.authors.length > 0 && <span>{s.by(article.authors)}</span>}
          {article.summary && <Summary>{article.summary}</Summary>}
        </TileText>
      </Tile>
      <KindLevel level={article.level} levelOnly $small />
    </li>
  )
}

const Lead = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Intro = styled.div`
  margin-bottom: ${({ theme }) => theme.space(6)};
  h1 {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 1.75rem;
    font-weight: ${({ theme }) => theme.headingWeight};
    color: ${({ theme }) => theme.colors.primaryStrong};
  }
  p {
    margin: ${({ theme }) => theme.space(1)} 0 ${({ theme }) => theme.space(4)};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const Tools = styled.form`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space(3)};
  margin-bottom: ${({ theme }) => theme.space(2)};

  label {
    display: grid;
    gap: ${({ theme }) => theme.space(1)};
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const SearchField = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  flex: 1 1 16rem;
  height: 40px;
  padding: 0 ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.focus};
  }

  input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
  }
`

const Count = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(6)};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Shelf = styled.section`
  margin-bottom: ${({ theme }) => theme.space(10)};
`

const ShelfHeading = styled.h2`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space(3)};
  margin: 0 0 ${({ theme }) => theme.space(1)};
  padding-bottom: ${({ theme }) => theme.space(2)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.accent};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.375rem;
  font-weight: ${({ theme }) => theme.headingWeight};
  color: ${({ theme }) => theme.colors.primaryStrong};

  small {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 0.8125rem;
    font-weight: 400;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const ShelfNote = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(3)};
  color: ${({ theme }) => theme.colors.textMuted};
`

const Books = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: ${({ theme }) => theme.space(6)} ${({ theme }) => theme.space(4)};
  margin: ${({ theme }) => theme.space(4)} 0 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space(1)};
    min-width: 0;
  }
`

const Tile = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;

  &:hover strong,
  &:focus-visible strong {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: underline;
  }
`

/** A book's proportions */
const coverBox = `
  width: 100%;
  aspect-ratio: 3 / 4;
`

const CoverImage = styled.img`
  ${coverBox}
  object-fit: cover;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`

const MadeCover = styled.div<{ $color: string }>`
  ${coverBox}
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ $color }) => $color};
  color: ${onAvatar};
  overflow: hidden;

  small {
    font-size: 0.75rem;
    letter-spacing: 0.02em;
    opacity: 0.9;
  }
  span {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 1.125rem;
    font-weight: ${({ theme }) => theme.headingWeight};
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
`

const TileText = styled.span`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(0.5)};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};

  strong {
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.text};
    line-height: 1.4;
  }
`

const Summary = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Muted = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
`

const Notice = styled.p`
  padding: ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.warningBg};
`
