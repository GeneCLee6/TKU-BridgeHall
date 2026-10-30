import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { Avatar } from '../components/Avatar.tsx'
import { BackLink, Button, ErrorText, Input, Muted, PageTitle } from '../components/ui.tsx'
import { api, ApiError, errorText, type ClubMember } from '../lib/api.ts'
import { FORUM_LIMITS, type Board, type Comment, type ForumFeed, type ForumSearch, type Post } from '../lib/forum.ts'
import { forumApi, type FeedFilter } from '../lib/forumApi.ts'
import { memberLabel, postSummary, recentAuthors, searchProblem, searchSnippet } from '../lib/forumPosts.ts'
import { useMediaQuery } from '../lib/useMediaQuery.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { Frame, Gate } from '../pages/Frame.tsx'
import { useAuth } from '../state/AuthContext.tsx'
import { mobile, mobileQuery } from '../styles/tokens.ts'
import { CommentSection } from './Comments.tsx'
import { forumStrings as t } from './forumStrings.ts'
import { ago, boardPath, isOfficer, postPath } from './forumText.ts'
import { PostCard } from './PostCard.tsx'
import { NewsList } from './NewsList.tsx'
import { PostComposer } from './PostComposer.tsx'

// Phones only (e9-t09), as in the handbook
const MobileToolbar = lazy(() =>
  import('../components/MobileToolbar.tsx').then((m) => ({ default: m.MobileToolbar })),
)

/**
 * 討論區 (E11): the forum's frame (e11-t15, DESIGN-V2.md §12), with the boards on the left, the page
 * in the middle and 社團新聞 and 活躍的人 on the right. The pages: every board's feed `/forum`, one
 * board `/forum/:boardId`, a post with its comments `/forum/p/:postId` (e11-t14) and the compose
 * box on a page of its own `/forum/new?board=` (e11-t13). Phones get one column, the boards as tabs
 * above it and the bottom toolbar. Members only, like the rest of the site; one lazy chunk, out of
 * the home page.
 */

interface Club {
  boards: Board[]
  members: ClubMember[]
}

/** What the frame gives its pages (Outlet context) */
interface Forum {
  club: Club
  /** The first page of every board's posts: the front page's feed and the frame's 活躍的人 */
  front?: ForumFeed
  /** The front page and 社團新聞 again, after a post was added or deleted */
  refresh: () => void
  /** The boards and members again, after the boards were changed (e11-t17) */
  reloadClub: () => void
}

// 討論區管理 (e11-t17): in this chunk too
export { ManagePage } from './ManagePage.tsx'

const useForum = () => useOutletContext<Forum>()

/** The boards and the club's members (names, avatars, `@` mentions), which every forum page needs */
function useClub(): { club?: Club; error?: string; retry: () => void } {
  const [state, setState] = useState<{ club?: Club; error?: string }>({})
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let current = true
    Promise.all([forumApi.boards(), api.club.members()]).then(
      ([boards, members]) => current && setState({ club: { boards, members } }),
      (e) => current && setState({ error: errorText(e) }),
    )
    return () => {
      current = false
    }
  }, [attempt])
  return { ...state, retry: () => setAttempt((n) => n + 1) }
}

function Failed({ text, retry }: { text: string; retry?: () => void }) {
  return (
    <>
      <ErrorText role="alert">{text}</ErrorText>
      {retry && (
        <div>
          <Button type="button" onClick={retry}>
            {t.retry}
          </Button>
        </div>
      )}
    </>
  )
}

export function PostPage() {
  return (
    <Column>
      <PostThread />
    </Column>
  )
}

function PostThread() {
  const { postId = '' } = useParams()
  const navigate = useNavigate()
  const { club, refresh } = useForum()
  const [thread, setThread] = useState<{ id: string; post?: Post; comments?: Comment[]; error?: string; gone?: boolean }>()
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    let current = true
    forumApi.post(postId).then(
      ({ post, comments }) => current && setThread({ id: postId, post, comments }),
      (e) =>
        current &&
        setThread({ id: postId, error: errorText(e), gone: e instanceof ApiError && e.status === 404 }),
    )
    return () => {
      current = false
    }
  }, [postId])

  const ready = thread?.id === postId ? thread : undefined
  usePageTitle(ready?.post?.title || t.title)

  // A notification about a comment opens `#comment-<id>` (e11-t08): go to it once the comments are in
  const { hash } = useLocation()
  const loaded = !!ready?.comments
  useEffect(() => {
    if (!loaded || !hash.startsWith('#comment-')) return
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView?.({ block: 'center' })
  }, [loaded, hash])

  if (ready?.error) return <Failed text={ready.gone ? t.postGone : ready.error} />
  if (!ready?.post || !ready.comments) return <Muted role="status">{t.loading}</Muted>
  const { post, comments } = ready
  const board = club.boards.find((b) => b.id === post.boardId)

  return (
    <>
      {board && <BackLink to={boardPath(board.id)}>{t.backToBoard(board.name)}</BackLink>}
      {editing ? (
        <PostComposer
          boards={club.boards}
          members={club.members}
          post={post}
          onDone={(saved) => {
            setThread({ ...ready, post: saved })
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <PostCard
          full
          post={post}
          boards={club.boards}
          members={club.members}
          onChange={(changed) => setThread((now) => (now?.post ? { ...now, post: changed } : now))}
          onEdit={() => setEditing(true)}
          onDelete={() => {
            // Back to the board it was on (G6; G5 went home)
            refresh()
            navigate(boardPath(post.boardId), { replace: true })
          }}
        />
      )}
      <CommentSection
        post={post}
        comments={comments}
        members={club.members}
        onComments={(list, count) =>
          setThread((now) => (now?.post ? { ...now, comments: list, post: { ...now.post, commentCount: count } } : now))
        }
      />
    </>
  )
}

export function NewPostPage() {
  usePageTitle(t.newPostTitle)
  return (
    <Column>
      <PageTitle>{t.newPostTitle}</PageTitle>
      <NewPost />
    </Column>
  )
}

function NewPost() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { club, refresh } = useForum()
  return (
    <PostComposer
      startOpen
      boards={club.boards}
      members={club.members}
      boardId={params.get('board') ?? undefined}
      onDone={(post) => {
        refresh()
        navigate(postPath(post.id))
      }}
    />
  )
}

/** The feed's width (DESIGN-V2.md §12: 40rem) */
const Column = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(4)};
  width: min(100%, 40rem);
  margin: 0 auto;
  min-width: 0;
`

export function ForumShell() {
  const isMobile = useMediaQuery(mobileQuery)
  return (
    <Frame wide toolbar>
      <Gate need="member">
        <ForumFrame />
      </Gate>
      {isMobile && (
        <Suspense fallback={null}>
          <MobileToolbar search="/forum/search" />
        </Suspense>
      )}
    </Frame>
  )
}

function ForumFrame() {
  const { club, error, retry } = useClub()
  // 討論區管理 has tables: it takes the feed's and the news' columns (2026-10-30)
  const manage = useLocation().pathname === '/forum/manage'
  const officer = isOfficer(useAuth().user)
  const [front, setFront] = useState<ForumFeed>()
  const [news, setNews] = useState<Post[]>()
  const [round, setRound] = useState(0)

  useEffect(() => {
    let current = true
    forumApi.feed(1).then(
      (feed) => current && setFront(feed),
      () => current && setFront({ posts: [], page: 1, pages: 1 }),
    )
    forumApi.latest().then(
      (latest) => current && setNews(latest.news),
      () => current && setNews([]),
    )
    return () => {
      current = false
    }
  }, [round])

  if (error)
    return (
      <Main id="main">
        <Failed text={error} retry={retry} />
      </Main>
    )
  if (!club)
    return (
      <Main id="main">
        <Muted role="status">{t.loading}</Muted>
      </Main>
    )
  const boards = [...club.boards].sort((a, b) => a.order - b.order)
  const context: Forum = { club, front, refresh: () => setRound((n) => n + 1), reloadClub: retry }

  return (
    <Layout $manage={manage}>
      <BoardNav aria-label={t.boards}>
        <h2>{t.boards}</h2>
        <ul>
          <li>
            <NavLink to="/forum" end>
              {t.allBoards}
            </NavLink>
          </li>
          {boards.map((board) => (
            <li key={board.id}>
              <NavLink to={boardPath(board.id)}>{board.name}</NavLink>
            </li>
          ))}
          {officer && (
            <li>
              <NavLink to="/forum/manage">{t.manage}</NavLink>
            </li>
          )}
        </ul>
        <h2>{t.personal}</h2>
        <ul>
          <li>
            <NavLink to="/forum/mine">{t.mine}</NavLink>
          </li>
          <li>
            <NavLink to="/forum/mentions">{t.mentions}</NavLink>
          </li>
          <li className="search-tab">
            <NavLink to="/forum/search">{t.search}</NavLink>
          </li>
        </ul>
        <NavSearch />
      </BoardNav>
      <Main id="main" tabIndex={-1}>
        <Suspense fallback={<Muted role="status">{t.loading}</Muted>}>
          <Outlet context={context} />
        </Suspense>
      </Main>
      {!manage && (
        <Aside>
          <NewsBox news={news} />
          <ActivePeople posts={front?.posts} members={club.members} />
        </Aside>
      )}
    </Layout>
  )
}

/** 社團新聞: the news board's latest, pinned first; officers may post one from here. The same list as the home page's */
function NewsBox({ news }: { news?: Post[] }) {
  return (
    <Box aria-labelledby="forum-news">
      <h2 id="forum-news">{t.news}</h2>
      <NewsList news={news} />
    </Box>
  )
}

/** 活躍的人: who posted last, from the front page's posts */
function ActivePeople({ posts, members }: { posts?: Post[]; members: readonly ClubMember[] }) {
  const people = recentAuthors(posts ?? []).flatMap((id) => members.filter((m) => m.id === id))
  if (!people.length) return null
  return (
    <Box aria-labelledby="forum-active">
      <h2 id="forum-active">{t.active}</h2>
      <Muted>{t.activeHint}</Muted>
      <People>
        {people.map((member) => {
          const name = member.displayName || member.username
          return (
            <li key={member.id}>
              <Link to={`/u/${encodeURIComponent(member.id)}`}>
                <Avatar id={member.id} name={name} avatar={member.avatar} size={32} />
                <span>{name}</span>
              </Link>
            </li>
          )
        })}
      </People>
    </Box>
  )
}

/** The front page `/forum`: every board's posts newest first */
export function FeedPage() {
  usePageTitle(t.title)
  const { front } = useForum()
  return (
    <Column>
      <Heading>
        <PageTitle>{t.title}</PageTitle>
        <Muted>{t.allBoardsIntro}</Muted>
      </Heading>
      <Posts key="all" first={front} />
    </Column>
  )
}

/** One board `/forum/:boardId`: its pinned posts first, then the others newest first */
export function BoardPage() {
  const { boardId = '' } = useParams()
  const { club } = useForum()
  const board = club.boards.find((b) => b.id === boardId)
  usePageTitle(board?.name ?? t.title)
  if (!board)
    return (
      <Column>
        <ErrorText role="alert">{t.boardGone}</ErrorText>
        <BackLink to="/forum">{t.allBoards}</BackLink>
      </Column>
    )
  return (
    <Column>
      <Heading>
        <PageTitle>{board.name}</PageTitle>
        {board.description && <Muted>{board.description}</Muted>}
      </Heading>
      <Posts key={board.id} board={board} />
    </Column>
  )
}

/** 我的貼文 `/forum/mine` and 提到我的 `/forum/mentions` (e11-t10): the member's own posts, or those mentioning them */
export function MinePage({ mentions = false }: { mentions?: boolean }) {
  const { user } = useAuth()
  const title = mentions ? t.mentions : t.mine
  usePageTitle(title)
  const me = user?.id ?? ''
  return (
    <Column>
      <Heading>
        <PageTitle>{title}</PageTitle>
        <Muted>{mentions ? t.mentionsIntro : t.mineIntro}</Muted>
      </Heading>
      <Posts
        key={`${mentions ? 'mentions' : 'mine'}:${me}`}
        filter={mentions ? { mentions: me } : { author: me }}
        empty={mentions ? t.noMentions : t.noMine}
      />
    </Column>
  )
}

export const MentionsPage = () => <MinePage mentions />

/** The left column's search box (e11-t18): it opens the search page */
function NavSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  return (
    <SearchForm
      role="search"
      className="nav-search"
      onSubmit={(e) => {
        e.preventDefault()
        if (query.trim()) navigate(`/forum/search?${new URLSearchParams({ q: query.trim() })}`)
      }}
    >
      <Input
        type="search"
        aria-label={t.searchLabel}
        placeholder={t.searchPlaceholder}
        value={query}
        maxLength={FORUM_LIMITS.searchMax}
        onChange={(e) => setQuery(e.target.value)}
      />
    </SearchForm>
  )
}

/** 搜尋討論 `/forum/search?q=` (e11-t18, AC-11.9): titles and text blocks, newest first, a page at a time */
export function SearchPage() {
  usePageTitle(t.searchTitle)
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const problem = query.trim() ? searchProblem(query) : null
  return (
    <Column>
      <Heading>
        <PageTitle>{t.searchTitle}</PageTitle>
        <Muted>{t.searchIntro}</Muted>
      </Heading>
      <SearchBox key={query} query={query} onSearch={(q) => setParams(q ? { q } : {})} />
      {problem ? (
        <ErrorText role="alert">
          {problem === 'empty'
            ? t.searchProblems.empty
            : problem === 'tooLong'
              ? t.searchProblems.tooLong(FORUM_LIMITS.searchMax)
              : t.searchProblems.tooManyWords(FORUM_LIMITS.searchWordsMax)}
        </ErrorText>
      ) : (
        query.trim() && <SearchResults key={query} query={query.trim()} />
      )}
    </Column>
  )
}

/** The search page's box; keyed by the search, so it starts from what was searched */
function SearchBox({ query, onSearch }: { query: string; onSearch: (query: string) => void }) {
  const [text, setText] = useState(query)
  return (
    <SearchForm
      role="search"
      $flush
      onSubmit={(e) => {
        e.preventDefault()
        onSearch(text.trim())
      }}
    >
      <Input
        type="search"
        aria-label={t.searchLabel}
        placeholder={t.searchPlaceholder}
        value={text}
        maxLength={FORUM_LIMITS.searchMax}
        onChange={(e) => setText(e.target.value)}
      />
      <Button type="submit">{t.search}</Button>
    </SearchForm>
  )
}

/** A post without a title is listed by its first words; show where the words were found when that is further on */
const snippetMoves = (post: Post, query: string) => searchSnippet(post, query).startsWith('…')

function SearchResults({ query }: { query: string }) {
  const { club } = useForum()
  const [found, setFound] = useState<ForumSearch>()
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  const load = (at: number) => {
    setBusy(true)
    setError('')
    forumApi.search(query, at).then(
      (r) => {
        setFound((now) =>
          at === 1 || !now ? r : { ...r, posts: [...now.posts, ...r.posts.filter((p) => !now.posts.some((q) => q.id === p.id))] },
        )
        setBusy(false)
      },
      (e) => {
        setError(errorText(e))
        setBusy(false)
      },
    )
  }
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- once; the list is keyed by the query
  useEffect(() => load(1), [])

  const boardName = (id: string) => club.boards.find((b) => b.id === id)?.name ?? id
  return (
    <>
      {error && <Failed text={error} retry={() => load(found ? found.page + 1 : 1)} />}
      {found ? (
        <section aria-label={t.searchResults}>
          <Muted role="status">{found.total ? t.searchCount(found.total, found.query) : t.searchNone(found.query)}</Muted>
          <Hits>
            {found.posts.map((post) => (
              <li key={post.id}>
                <Link to={postPath(post.id)}>{postSummary(post) || t.untitled}</Link>
                {(post.title || snippetMoves(post, query)) && <span>{searchSnippet(post, query)}</span>}
                <small>
                  {boardName(post.boardId)} · {memberLabel(club.members, post.authorId) ?? t.someone} · {ago(post.createdAt)}
                  {post.commentCount > 0 && ` · ${t.comments(post.commentCount)}`}
                </small>
              </li>
            ))}
          </Hits>
        </section>
      ) : (
        !error && <Muted role="status">{t.loading}</Muted>
      )}
      {found && found.page < found.pages && (
        <div>
          <Button type="button" disabled={busy} onClick={() => load(found.page + 1)}>
            {busy ? t.loadingMore : t.more}
          </Button>
        </div>
      )}
    </>
  )
}

/**
 * The compose box and a list of posts, a page at a time: one board's (its pinned posts first), or
 * every board's, starting from the frame's first page (`first`)
 */
function Posts({ board, first, filter, empty }: { board?: Board; first?: ForumFeed; filter?: FeedFilter; empty?: string }) {
  const { club, refresh } = useForum()
  const [pinned, setPinned] = useState<Post[]>([])
  const [posts, setPosts] = useState<Post[]>()
  const [page, setPage] = useState({ at: 0, of: 1 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = (at: number) => {
    setBusy(true)
    setError('')
    const call: Promise<{ pinned: Post[]; posts: Post[]; page: number; pages: number }> = board
      ? forumApi.boardPage(board.id, at)
      : forumApi.feed(at, filter).then((r) => ({ ...r, pinned: [] }))
    call.then(
      (r) => {
        if (at === 1) setPinned(r.pinned)
        // A post may move to the next page while reading; show it once
        setPosts((now) => (at === 1 || !now ? r.posts : [...now, ...r.posts.filter((p) => !now.some((q) => q.id === p.id))]))
        setPage({ at: r.page, of: r.pages })
        setBusy(false)
      },
      (e) => {
        setError(errorText(e))
        setBusy(false)
      },
    )
  }

  // A board loads its own first page (the list is keyed by the board); the front page takes the frame's
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- once, when the list mounts
  useEffect(() => void ((board || filter) && load(1)), [])
  useEffect(() => {
    if (board || filter || !first || page.at > 1) return
    setPosts(first.posts)
    setPage({ at: first.page, of: first.pages })
  }, [board, filter, first, page.at])

  const change = (post: Post) => {
    const swap = (list: Post[]) => list.map((p) => (p.id === post.id ? post : p))
    setPosts((now) => now && swap(now))
    setPinned(swap)
  }
  const remove = (id: string) => {
    const drop = (list: Post[]) => list.filter((p) => p.id !== id)
    setPosts((now) => now && drop(now))
    setPinned(drop)
    refresh()
  }
  const added = (post: Post) => {
    if (!board || post.boardId === board.id) setPosts((now) => [post, ...(now ?? [])])
    refresh()
  }

  const card = (post: Post) => (
    <PostCard
      key={post.id}
      post={post}
      boards={club.boards}
      members={club.members}
      onChange={change}
      onDelete={() => remove(post.id)}
    />
  )

  return (
    <>
      {!filter && <PostComposer boards={club.boards} members={club.members} boardId={board?.id} onDone={added} />}
      {error && <Failed text={error} retry={() => load(posts ? page.at + 1 : 1)} />}
      {posts ? (
        <Feed aria-label={board ? board.name : t.feedLabel}>
          {pinned.map(card)}
          {posts.map(card)}
          {!pinned.length && !posts.length && <Muted>{empty ?? t.noPosts}</Muted>}
        </Feed>
      ) : (
        !error && <Muted role="status">{t.loading}</Muted>
      )}
      {posts && page.at < page.of && (
        <div>
          <Button type="button" disabled={busy} onClick={() => load(page.at + 1)}>
            {busy ? t.loadingMore : t.more}
          </Button>
        </div>
      )}
    </>
  )
}

/** Wide screens: boards 14rem, the feed 40rem, news 18rem (DESIGN-V2.md §12); narrower, the news goes under the feed */
const Layout = styled.div<{ $manage: boolean }>`
  display: grid;
  grid-template-columns: ${({ $manage }) => ($manage ? '14rem minmax(0, 1fr)' : '14rem minmax(0, 40rem) 18rem')};
  max-width: ${({ $manage, theme }) => ($manage ? theme.layout.pageMax : 'none')};
  margin: 0 auto;
  justify-content: center;
  align-items: start;
  gap: ${({ theme }) => theme.space(8)};
  padding: ${({ theme }) => theme.space(6)} ${({ theme }) => theme.space(6)} ${({ theme }) => theme.space(16)};

  @media (max-width: 1180px) {
    grid-template-columns: ${({ $manage }) => ($manage ? '12rem minmax(0, 1fr)' : '12rem minmax(0, 40rem)')};
  }
  ${mobile} {
    grid-template-columns: minmax(0, 1fr);
    gap: ${({ theme }) => theme.space(4)};
    padding: 0 ${({ theme }) => theme.space(4)}
      calc(${({ theme }) => theme.space(12)} + ${({ theme }) => theme.layout.toolbarHeight});
  }
`

const Main = styled.main`
  min-width: 0;
  outline: none;
`

/** A column on the left; tabs across the top on phones */
const BoardNav = styled.nav`
  position: sticky;
  top: ${({ theme }) => theme.space(20)};
  h2 {
    margin: 0 0 ${({ theme }) => theme.space(2)};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 0.9375rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  ul {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  a {
    display: flex;
    align-items: center;
    min-height: 36px;
    padding: 0 ${({ theme }) => theme.space(3)};
    border-radius: ${({ theme }) => theme.shape.control};
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;
  }
  a:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
  a[aria-current='page'] {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.primaryStrong};
    font-weight: 600;
    box-shadow: inset 3px 0 0 ${({ theme }) => theme.colors.primary};
  }
  ul + h2 {
    margin-top: ${({ theme }) => theme.space(6)};
  }
  /* Wide screens have the search box; phones a 搜尋 tab */
  .search-tab {
    display: none;
  }

  ${mobile} {
    display: flex;
    .search-tab {
      display: block;
    }
    .nav-search {
      display: none;
    }
    position: relative;
    top: 0;
    margin: 0 -${({ theme }) => theme.space(4)};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    overflow-x: auto;
    h2 {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }
    ul {
      display: flex;
      gap: 0;
      padding: 0 ${({ theme }) => theme.space(2)};
    }
    a {
      min-height: 44px;
      white-space: nowrap;
      border-radius: 0;
    }
    a[aria-current='page'] {
      background: transparent;
      box-shadow: inset 0 -2px 0 ${({ theme }) => theme.colors.seal};
    }
  }
`

const Aside = styled.aside`
  display: grid;
  gap: ${({ theme }) => theme.space(6)};
  min-width: 0;
  @media (max-width: 1180px) {
    grid-column: 2;
  }
  ${mobile} {
    grid-column: auto;
  }
`

const Box = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  h2 {
    margin: 0;
    padding-bottom: ${({ theme }) => theme.space(2)};
    border-bottom: 1px solid ${({ theme }) => theme.colors.accent};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 1.0625rem;
  }
  p {
    margin: 0;
  }
  > ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  > ul > li {
    display: grid;
    gap: 2px;
    padding: ${({ theme }) => theme.space(2)} 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  > ul a {
    color: ${({ theme }) => theme.colors.text};
    font-weight: 500;
  }
  small {
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const People = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2)};
  margin: 0;
  padding: 0;
  list-style: none;
  a {
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.space(2)};
    min-height: 36px;
    padding-right: ${({ theme }) => theme.space(2)};
    color: ${({ theme }) => theme.colors.text};
    font-size: 0.875rem;
    text-decoration: none;
  }
  a:hover span {
    color: ${({ theme }) => theme.colors.primary};
  }
`

const SearchForm = styled.form<{ $flush?: boolean }>`
  display: flex;
  gap: ${({ theme }) => theme.space(2)};
  margin-top: ${({ $flush, theme }) => ($flush ? 0 : theme.space(4))};
  input {
    flex: 1;
    min-width: 0;
  }
`

const Hits = styled.ul`
  display: grid;
  margin: ${({ theme }) => theme.space(2)} 0 0;
  padding: 0;
  list-style: none;
  li {
    display: grid;
    gap: 2px;
    padding: ${({ theme }) => theme.space(3)} 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  a {
    color: ${({ theme }) => theme.colors.text};
    font-weight: 600;
  }
  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.9375rem;
    overflow-wrap: anywhere;
  }
  small {
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const Heading = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
  p {
    margin: 0;
  }
`

const Feed = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space(4)};
`
