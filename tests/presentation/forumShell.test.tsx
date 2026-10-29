import { configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { BUILTIN_BOARDS, type Post } from '../../src/lib/forum.ts'

/**
 * The forum's frame and board pages (E11 G6: e11-t15, AC-11.2) and the home page's 社團新聞 and
 * 最新討論 (e11-t16, AC-11.7) against a fake Worker: amy (u1) is signed in; bob (u2) posts.
 */

const ME = { id: 'u1', username: 'amy', admin: false, permissions: [], profile: { displayName: '王小美' } }
const ADMIN = { ...ME, admin: true }

const post = (id: string, boardId: string, text: string, extra: Partial<Post> = {}): Post => ({
  id,
  boardId,
  authorId: 'u2',
  blocks: [{ kind: 'paragraph', text }],
  createdAt: Date.now() - 3_600_000,
  reactions: {},
  commentCount: 0,
  ...extra,
})

const NEWS = post('n1', 'news', '大專盃報名開始', { title: '大專盃報名', pinned: true })
const DEAL = post('d1', 'deals', '這副 4♠ 怎麼做？', {
  blocks: [
    { kind: 'paragraph', text: '這副 4♠ 怎麼做？' },
    { kind: 'hand', cards: ['SA'] },
  ],
  commentCount: 3,
})
const CHAT = post('c1', 'chat', '週末去打牌嗎')
const boardPage = (boardId: string, posts: Post[], pinned: Post[] = [], pages = 1) => ({
  board: { ...BUILTIN_BOARDS.find((b) => b.id === boardId)!, pinnedPostIds: pinned.map((p) => p.id) },
  pinned,
  posts,
  page: 1,
  pages,
})

let routes: Record<string, unknown>
let calls: string[]

configure({ asyncUtilTimeout: 10_000 })
vi.setConfig({ testTimeout: 40_000 })

beforeAll(async () => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
  await import('../../src/forum/ForumPages.tsx')
  await import('../../src/pages/HomeForum.tsx')
})

beforeEach(() => {
  window.localStorage.clear()
  calls = []
  routes = {
    'GET /api/me': { user: ME },
    'GET /api/forum/boards': { boards: BUILTIN_BOARDS.map((b) => ({ ...b, pinnedPostIds: [] })) },
    'GET /api/club/members': {
      members: [
        { id: 'u1', username: 'amy', displayName: '王小美' },
        { id: 'u2', username: 'bob', displayName: '陳小柏' },
      ],
    },
    'GET /api/forum/feed?page=1': { posts: [CHAT, DEAL, NEWS], page: 1, pages: 2 },
    'GET /api/forum/feed?page=2': { posts: [post('old', 'chat', '很久以前的貼文')], page: 2, pages: 2 },
    'GET /api/forum/latest': { news: [NEWS], discussions: [CHAT, DEAL] },
    'GET /api/forum/boards/deals/posts?page=1': boardPage('deals', [DEAL]),
    'GET /api/forum/boards/news/posts?page=1': boardPage('news', [], [NEWS]),
    'POST /api/forum/boards/deals/posts': { post: post('d2', 'deals', '新的一副') },
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      calls.push(`${method} ${String(input)}`)
      const body = routes[`${method} ${String(input)}`]
      return body === undefined
        ? new Response(JSON.stringify({ error: '沒有權限', code: 'forbidden' }), { status: 403 })
        : new Response(JSON.stringify(body), { status: 200 })
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

const open = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

describe('the forum’s frame and board pages (e11-t15)', () => {
  it('shows every board’s posts on /forum, the boards, the news and who is active', async () => {
    open('/forum')
    expect(await screen.findByRole('heading', { name: '討論區', level: 1 })).toBeInTheDocument()
    const boards = screen.getByRole('navigation', { name: '板面' })
    expect(within(boards).getByRole('link', { name: '全部動態' })).toHaveAttribute('aria-current', 'page')
    expect(within(boards).getAllByRole('link').map((a) => a.textContent)).toEqual(['全部動態', '社團公告', '牌局討論', '制度問答', '閒聊'])
    const feed = await screen.findByRole('region', { name: '貼文' })
    expect(await within(feed).findByText('週末去打牌嗎')).toBeInTheDocument()
    expect(within(feed).getByText('這副 4♠ 怎麼做？')).toBeInTheDocument()

    const news = screen.getByRole('region', { name: '社團新聞' })
    expect(await within(news).findByRole('link', { name: '大專盃報名' })).toHaveAttribute('href', '/forum/p/n1')
    expect(within(news).getByRole('link', { name: '看全部公告' })).toHaveAttribute('href', '/forum/news')
    expect(within(news).queryByRole('link', { name: '發公告' })).toBeNull()
    const active = screen.getByRole('region', { name: '活躍的人' })
    expect(within(active).getByRole('link', { name: '陳小柏' })).toHaveAttribute('href', '/u/u2')

    // The next page joins the list
    fireEvent.click(screen.getByRole('button', { name: '載入更多' }))
    expect(await within(feed).findByText('很久以前的貼文')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '載入更多' })).toBeNull()
  })

  it('shows one board, pinned posts first, and posts to it from its compose box', async () => {
    open('/forum/news')
    expect(await screen.findByRole('heading', { name: '社團公告', level: 1 })).toBeInTheDocument()
    expect(await screen.findByText('置頂', { selector: 'span' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: '牌局討論' }))
    expect(await screen.findByRole('heading', { name: '牌局討論', level: 1 })).toBeInTheDocument()
    const feed = await screen.findByRole('region', { name: '牌局討論' })
    expect(await within(feed).findByText('這副 4♠ 怎麼做？')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /想分享什麼牌/ }))
    expect(await screen.findByRole('combobox', { name: /^發布到/ })).toHaveValue('deals')
    fireEvent.change(screen.getByRole('combobox', { name: '文字' }), { target: { value: '新的一副' } })
    fireEvent.click(screen.getByRole('button', { name: '發布' }))
    expect(await within(feed).findByText('新的一副')).toBeInTheDocument()
    await waitFor(() => expect(calls.filter((c) => c === 'GET /api/forum/feed?page=1').length).toBeGreaterThan(1))
  })

  it('says when a board does not exist', async () => {
    open('/forum/nope')
    expect(await screen.findByRole('alert')).toHaveTextContent('找不到這個板面')
  })

  it('lets officers post news from the frame', async () => {
    routes['GET /api/me'] = { user: ADMIN }
    open('/forum')
    const news = await screen.findByRole('region', { name: '社團新聞' })
    expect(await within(news).findByRole('link', { name: '發公告' })).toHaveAttribute('href', '/forum/new?board=news')
  })
})

describe('the home page’s club news and latest discussions (e11-t16)', () => {
  it('lists the news board and the other boards’ latest posts', async () => {
    open('/')
    const news = await screen.findByRole('region', { name: '社團新聞' })
    const link = await within(news).findByRole('link', { name: /大專盃報名/ })
    expect(link).toHaveAttribute('href', '/forum/p/n1')
    expect(within(news).getByText('📌', { exact: false })).toBeInTheDocument()

    const latest = screen.getByRole('region', { name: '最新討論' })
    expect(await within(latest).findByRole('link', { name: '這副 4♠ 怎麼做？' })).toHaveAttribute('href', '/forum/p/d1')
    expect(within(latest).getByText('單手牌 · 3 則留言')).toBeInTheDocument()
    expect(within(latest).getAllByText('陳小柏')).toHaveLength(2)
    expect(within(latest).getByRole('link', { name: /去討論區/ })).toHaveAttribute('href', '/forum')
    // One request for both
    expect(calls.filter((c) => c === 'GET /api/forum/latest')).toHaveLength(1)
  })

  it('says so when the forum cannot be read', async () => {
    routes['GET /api/forum/latest'] = undefined
    open('/')
    const latest = await screen.findByRole('region', { name: '最新討論' })
    expect(await within(latest).findByText('討論暫時載入不了。')).toBeInTheDocument()
  })
})
