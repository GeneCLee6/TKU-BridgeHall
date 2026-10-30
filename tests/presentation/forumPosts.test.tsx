import { configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { BUILTIN_BOARDS, type Comment, type Post } from '../../src/lib/forum.ts'
import { DRAFT_KEY } from '../../src/lib/forumPosts.ts'

/**
 * The post page and the compose box (E11 G5: e11-t13, e11-t14; AC-11.3, AC-11.4) against a fake
 * Worker: amy (u1) is signed in; bob (u2) wrote the post, with a deal, an auction, a hand, a quote
 * from the handbook and a picture; amy commented and bob replied.
 */

const ME = { id: 'u1', username: 'amy', admin: false, permissions: [], profile: { displayName: '王小美' } }
const IMAGE = 'post/0123456789abcdef01234567.webp'

const POST: Post = {
  id: 'p1',
  boardId: 'deals',
  authorId: 'u2',
  title: '今天社課這副 4♠',
  blocks: [
    { kind: 'paragraph', text: '西家首攻 ♥K，@amy 你會怎麼做？' },
    {
      kind: 'deal',
      deal: {
        dealer: 'N',
        vul: 'Both',
        hands: { N: ['SA', 'SQ'], E: ['SJ'], S: ['SK', 'ST'], W: ['S8'] },
      },
    },
    { kind: 'auction', auction: { dealer: 'N', calls: [{ seat: 'N', call: '1D' }, { seat: 'E', call: 'P' }, { seat: 'S', call: '1S' }] } },
    { kind: 'hand', cards: ['SK', 'ST', 'HA'], label: '我的牌' },
    { kind: 'ref', slug: 'fixture-beta', sectionId: 'overview' },
    { kind: 'image', assetId: IMAGE, alt: '社課的牌桌' },
  ],
  createdAt: Date.now() - 2 * 3_600_000,
  reactions: { '👍': ['u2'], '♠': ['u3'] },
  commentCount: 2,
}

const COMMENTS: Comment[] = [
  { id: 'c1', postId: 'p1', authorId: 'u1', blocks: [{ kind: 'paragraph', text: '先拔王牌再飛？' }], createdAt: Date.now() - 3_600_000, reactions: {} },
  {
    id: 'c2',
    postId: 'p1',
    parentId: 'c1',
    authorId: 'u2',
    blocks: [{ kind: 'paragraph', text: '我會先做梅花' }, { kind: 'hand', cards: ['CA', 'CK'] }],
    createdAt: Date.now() - 1_800_000,
    reactions: { '♥': ['u1'] },
  },
]

let routes: Record<string, unknown>
let calls: { method: string; path: string; body: unknown }[]

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
        { id: 'u2', username: 'bob', displayName: '陳小柏', avatar: 5 },
      ],
    },
    'GET /api/forum/posts/p1': { post: POST, comments: COMMENTS },
    'POST /api/files/urls': { urls: { [IMAGE]: { url: 'https://files.example/p.webp' } } },
    'PUT /api/forum/posts/p1/reaction': { reactions: { '👍': ['u2'], '♠': ['u3', 'u1'] } },
    'DELETE /api/forum/comments/c1/reaction': { reactions: {} },
    'POST /api/forum/posts/p1/comments': {
      comment: { id: 'c3', postId: 'p1', authorId: 'u1', blocks: [{ kind: 'paragraph', text: '謝謝！' }], createdAt: Date.now(), reactions: {} },
    },
    'PATCH /api/forum/posts/p1': { post: { ...POST, title: '改過的標題', editedAt: Date.now() } },
    'DELETE /api/forum/posts/p1': { ok: true },
    'GET /api/forum/boards/deals/posts?page=1': { board: { ...BUILTIN_BOARDS[1], pinnedPostIds: [] }, pinned: [], posts: [], page: 1, pages: 1 },
    'POST /api/forum/boards/systems/posts': { post: { ...POST, id: 'p9', boardId: 'systems', title: '新貼文', blocks: [{ kind: 'paragraph', text: '新的內容' }] } },
    'GET /api/forum/posts/p9': {
      post: { ...POST, id: 'p9', boardId: 'systems', title: '新貼文', blocks: [{ kind: 'paragraph', text: '新的內容' }], commentCount: 0 },
      comments: [],
    },
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      calls.push({ method, path: String(input), body: init?.body ? JSON.parse(String(init.body)) : undefined })
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

const sent = (method: string, path: string) => calls.filter((c) => c.method === method && c.path === path)

describe('the post page (e11-t14)', () => {
  it('draws every block: text with mentions, deal, auction, hand, quote and picture', async () => {
    open('/forum/p/p1')
    expect(await screen.findByRole('heading', { name: '今天社課這副 4♠', level: 1 })).toBeInTheDocument()
    const post = screen.getByRole('article', { name: '今天社課這副 4♠' })
    expect(within(post).getByRole('link', { name: '陳小柏' })).toHaveAttribute('href', '/u/u2')
    expect(within(post).getByRole('link', { name: '@amy' })).toHaveAttribute('href', '/u/u1')
    expect(within(post).getByText('牌局討論')).toBeInTheDocument()
    expect(within(post).getByText('2 小時前')).toBeInTheDocument()
    expect(within(post).getByRole('group', { name: '牌例' })).toBeInTheDocument()
    expect(within(post).getByText('雙有身價')).toBeInTheDocument()
    expect(within(post).getByRole('table')).toBeInTheDocument()
    expect(within(post).getByRole('group', { name: '我的牌' })).toBeInTheDocument()
    expect(await within(post).findByRole('link', { name: /^引用：測試特約乙（虛構） › 佔位概要（測試）/ })).toHaveAttribute(
      'href',
      '/c/fixture-beta/overview',
    )
    expect(await within(post).findByRole('img', { name: '社課的牌桌' })).toHaveAttribute('src', 'https://files.example/p.webp')
    expect(sent('POST', '/api/files/urls')[0].body).toEqual({ keys: [IMAGE] })
  })

  it('reacts at once and takes the Worker’s count (AC-11.4)', async () => {
    open('/forum/p/p1')
    const post = await screen.findByRole('article', { name: '今天社課這副 4♠' })
    const bar = within(post).getByRole('group', { name: '反應' })
    expect(within(bar).getByRole('button', { name: '讚，1 人' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(within(bar).getByRole('button', { name: '黑桃，1 人' }))
    expect(await within(bar).findByRole('button', { name: '黑桃，2 人' })).toHaveAttribute('aria-pressed', 'true')
    expect(sent('PUT', '/api/forum/posts/p1/reaction')[0].body).toEqual({ emoji: '♠' })
  })

  it('shows comments one level deep, with a hand in a reply, and takes a reaction back', async () => {
    open('/forum/p/p1')
    await screen.findByText('先拔王牌再飛？')
    const replies = screen.getByLabelText('1 則回覆')
    expect(within(replies).getByText('我會先做梅花')).toBeInTheDocument()
    expect(within(replies).getByRole('group', { name: '單手牌' })).toBeInTheDocument()
    const reply = within(replies).getByRole('article')
    fireEvent.click(within(reply).getByRole('button', { name: '紅心，1 人' }))
    // The Worker's answer for c2 is not stubbed: the bar goes back and says why
    expect(await within(reply).findByRole('alert')).toHaveTextContent('沒有權限')
    expect(within(reply).getByRole('button', { name: '紅心，1 人' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('sends a comment, and a reply to a reply names whom it answers', async () => {
    open('/forum/p/p1')
    const box = await screen.findByRole('combobox', { name: '留言…打 @ 可以提到社員' })
    fireEvent.change(box, { target: { value: '謝謝！' } })
    fireEvent.click(screen.getByRole('button', { name: '送出' }))
    expect(await screen.findByText('謝謝！')).toBeInTheDocument()
    expect(sent('POST', '/api/forum/posts/p1/comments')[0].body).toEqual({ blocks: [{ kind: 'paragraph', text: '謝謝！' }] })
    expect(screen.getByText('· 3 則留言')).toBeInTheDocument()

    const replies = screen.getByLabelText('1 則回覆')
    fireEvent.click(within(replies).getByRole('button', { name: '回覆' }))
    const replyBox = await screen.findByRole('combobox', { name: '回覆 王小美…' })
    expect(replyBox).toHaveValue('@bob ')
  })

  it('lists members after @ and writes the chosen one’s username', async () => {
    open('/forum/p/p1')
    const box = await screen.findByRole('combobox', { name: '留言…打 @ 可以提到社員' })
    fireEvent.change(box, { target: { value: '問 @小柏', selectionStart: 5 } })
    const list = await screen.findByRole('listbox', { name: '提到社員' })
    expect(within(list).getByRole('option', { name: /陳小柏/ })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(box).toHaveValue('問 @bob ')
  })

  it('lets the author edit the post', async () => {
    routes['GET /api/forum/posts/p1'] = { post: { ...POST, authorId: 'u1' }, comments: [] }
    open('/forum/p/p1')
    fireEvent.click(await screen.findByRole('button', { name: '貼文操作' }))
    fireEvent.click(screen.getByRole('button', { name: '編輯' }))
    const title = await screen.findByRole('textbox', { name: '標題（可不填）' })
    fireEvent.change(title, { target: { value: '改過的標題' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存' }))
    expect(await screen.findByRole('heading', { name: '改過的標題', level: 1 })).toBeInTheDocument()
    const body = sent('PATCH', '/api/forum/posts/p1')[0].body as { title: string; blocks: unknown[] }
    expect(body.title).toBe('改過的標題')
    expect(body.blocks).toHaveLength(POST.blocks.length)
  })

  it('lets the author delete the post, but not someone else', async () => {
    const { unmount } = open('/forum/p/p1')
    fireEvent.click(await screen.findByRole('button', { name: '貼文操作' }))
    expect(screen.queryByRole('button', { name: '刪除' })).toBeNull()
    expect(screen.queryByRole('button', { name: '編輯' })).toBeNull()
    unmount()

    routes['GET /api/forum/posts/p1'] = { post: { ...POST, authorId: 'u1' }, comments: [] }
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    open('/forum/p/p1')
    fireEvent.click(await screen.findByRole('button', { name: '貼文操作' }))
    fireEvent.click(screen.getByRole('button', { name: '刪除' }))
    await waitFor(() => expect(sent('DELETE', '/api/forum/posts/p1')).toHaveLength(1))
    // Back to the board it was on (G6)
    expect(await screen.findByRole('heading', { name: '牌局討論', level: 1 })).toBeInTheDocument()
    expect(await screen.findByText('這裡還沒有貼文，來發第一則吧。')).toBeInTheDocument()
  })

  it('takes no new comments on a locked post', async () => {
    routes['GET /api/forum/posts/p1'] = { post: { ...POST, locked: true }, comments: COMMENTS }
    open('/forum/p/p1')
    await screen.findByText('先拔王牌再飛？')
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByRole('button', { name: '回覆' })).toBeNull()
  })

  it('says when the post is gone', async () => {
    routes['GET /api/forum/posts/p1'] = undefined
    calls = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) =>
        routes[`GET ${String(input)}`]
          ? new Response(JSON.stringify(routes[`GET ${String(input)}`]), { status: 200 })
          : new Response(JSON.stringify({ error: '找不到貼文', code: 'postGone' }), { status: 404 }),
      ),
    )
    open('/forum/p/p1')
    expect(await screen.findByRole('alert')).toHaveTextContent('找不到這則貼文')
  })
})

describe('the compose box (e11-t13)', () => {
  it('posts text and a hand to the chosen board, keeping a draft until then', async () => {
    open('/forum/new?board=systems')
    expect(await screen.findByRole('heading', { name: '發一則新貼文', level: 1 })).toBeInTheDocument()
    const board = await screen.findByRole('combobox', { name: /^發布到/ })
    expect(board).toHaveValue('systems')
    // Only officers post news
    expect(within(board).queryByRole('option', { name: /社團公告/ })).toBeNull()

    fireEvent.change(screen.getByRole('textbox', { name: '標題（可不填）' }), { target: { value: '新貼文' } })
    fireEvent.change(screen.getByRole('combobox', { name: '文字' }), { target: { value: '新的內容' } })
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? '{}').title).toBe('新貼文'))

    fireEvent.click(screen.getByRole('button', { name: '單手牌' }))
    const hand = screen.getByRole('region', { name: '第 2 塊：單手牌' })
    fireEvent.click(within(hand).getByRole('button', { name: '黑桃A' }))

    fireEvent.click(screen.getByRole('button', { name: '發布' }))
    expect(await screen.findByRole('heading', { name: '新貼文', level: 1 })).toBeInTheDocument()
    expect(sent('POST', '/api/forum/boards/systems/posts')[0].body).toEqual({
      title: '新貼文',
      blocks: [
        { kind: 'paragraph', text: '新的內容' },
        { kind: 'hand', cards: ['SA'] },
      ],
    })
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it('brings back the draft and refuses an empty post', async () => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ boardId: 'chat', title: '草稿', blocks: [{ kind: 'paragraph', text: '' }] }))
    open('/forum/new')
    expect(await screen.findByRole('textbox', { name: '標題（可不填）' })).toHaveValue('草稿')
    expect(screen.getByRole('combobox', { name: /^發布到/ })).toHaveValue('chat')
    fireEvent.click(screen.getByRole('button', { name: '發布' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('貼文還沒有內容')
    expect(sent('POST', '/api/forum/boards/chat/posts')).toHaveLength(0)
  })

  it('quotes a convention found with the handbook’s search', async () => {
    open('/forum/new')
    fireEvent.click(await screen.findByRole('button', { name: '引用特約' }))
    const search = screen.getByRole('searchbox', { name: /搜尋特約或段落/ })
    fireEvent.focus(search)
    fireEvent.change(search, { target: { value: '測試特約乙' } })
    fireEvent.click(await screen.findByRole('button', { name: /^測試特約乙（虛構）（Fixture Beta/ }))
    expect(await screen.findByRole('link', { name: /^引用：測試特約乙（虛構）/ })).toHaveAttribute('href', '/c/fixture-beta')
  })

  it('points at a BridgeTable record by its address, keeping the id and linking to it (e11-t20)', async () => {
    open('/forum/new?board=deals')
    fireEvent.change(await screen.findByRole('combobox', { name: '文字' }), { target: { value: '這副怎麼打' } })
    fireEvent.click(screen.getByRole('button', { name: '牌桌紀錄' }))
    const record = screen.getByRole('region', { name: '第 2 塊：牌桌紀錄' })
    const input = within(record).getByRole('textbox', { name: '淡江牌桌紀錄的網址或代號' })
    fireEvent.change(input, { target: { value: 'https://example.com/nothing' } })
    expect(within(record).getByText(/看不出是哪一筆紀錄/)).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    fireEvent.change(input, { target: { value: 'https://tku-bridge-table.genelee-pro.workers.dev/history/Ab12cd34' } })
    expect(within(record).getByRole('link', { name: '到淡江牌桌看這副牌' })).toHaveAttribute(
      'href',
      'https://tku-bridge-table.genelee-pro.workers.dev/history/Ab12cd34',
    )
    fireEvent.click(screen.getByRole('button', { name: '發布' }))
    await waitFor(() => expect(sent('POST', '/api/forum/boards/deals/posts')).toHaveLength(1))
    expect(sent('POST', '/api/forum/boards/deals/posts')[0].body).toEqual({
      blocks: [
        { kind: 'paragraph', text: '這副怎麼打' },
        { kind: 'record', tableRecordId: 'Ab12cd34' },
      ],
    })
  })
})
