import { configure, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { BUILTIN_BOARDS, type Post, type ReportItem } from '../../src/lib/forum.ts'

/**
 * The forum's officers and reports (E11 G7: e11-t09, e11-t17, AC-11.6, AC-11.2) against a fake
 * Worker: amy (u1) is signed in, as a member, an officer (forumModerate) or an admin; bob (u2) posts.
 */

const MEMBER = { id: 'u1', username: 'amy', admin: false, permissions: [] as string[] }
const OFFICER = { ...MEMBER, permissions: ['forumModerate'] }
const ADMIN = { ...MEMBER, admin: true }

const DEAL: Post = {
  id: 'd1',
  boardId: 'deals',
  authorId: 'u2',
  title: '4♠ 怎麼做',
  blocks: [{ kind: 'paragraph', text: '這副 4♠ 怎麼做？' }],
  createdAt: Date.now() - 3_600_000,
  reactions: {},
  commentCount: 1,
}
const COMMENT = { id: 'c1', postId: 'd1', authorId: 'u2', blocks: [{ kind: 'paragraph', text: '亂講' }], createdAt: Date.now(), reactions: {} }
const REPORT: ReportItem = {
  report: { id: 'r1', target: 'comment', targetId: 'c1', reporterId: 'u1', reason: '人身攻擊', createdAt: Date.now(), status: 'open' },
  postId: 'd1',
  authorId: 'u2',
  excerpt: '亂講',
}

let routes: Record<string, unknown>
let sent: { call: string; body?: unknown }[]

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

const signIn = (user: typeof MEMBER) => {
  routes['GET /api/me'] = { user }
}

beforeEach(() => {
  window.localStorage.clear()
  sent = []
  routes = {
    'GET /api/me': { user: MEMBER },
    'GET /api/forum/boards': { boards: BUILTIN_BOARDS.map((b) => ({ ...b, pinnedPostIds: [] })) },
    'GET /api/club/members': {
      members: [
        { id: 'u1', username: 'amy', displayName: '王小美' },
        { id: 'u2', username: 'bob', displayName: '陳小柏' },
      ],
    },
    'GET /api/forum/feed?page=1': { posts: [DEAL], page: 1, pages: 1 },
    'GET /api/forum/latest': { news: [], discussions: [DEAL] },
    'GET /api/forum/posts/d1': { post: DEAL, comments: [COMMENT] },
    'POST /api/forum/posts/d1/pin': { post: { ...DEAL, pinned: true } },
    'POST /api/forum/posts/d1/lock': { post: { ...DEAL, locked: true } },
    'POST /api/forum/reports': { report: REPORT.report },
    'GET /api/forum/reports?status=open': { reports: [REPORT] },
    'GET /api/forum/reports?status=all': { reports: [REPORT] },
    'POST /api/forum/reports/r1': { report: { ...REPORT.report, status: 'dismissed' } },
    'PATCH /api/forum/boards/chat': { board: {} },
    'PATCH /api/forum/boards/systems': { board: {} },
    'POST /api/forum/boards': { board: {} },
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const call = `${init?.method ?? 'GET'} ${String(input)}`
      sent.push({ call, body: init?.body ? JSON.parse(String(init.body)) : undefined })
      const body = routes[call]
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
const bodyOf = (call: string) => sent.find((s) => s.call === call)?.body

describe('reporting (e11-t09)', () => {
  it('lets a member report someone else’s post with a reason, and offers no pin or lock', async () => {
    open('/forum/p/d1')
    expect(await screen.findByRole('heading', { name: '4♠ 怎麼做', level: 1 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '貼文操作' }))
    expect(screen.queryByRole('button', { name: '置頂' })).toBeNull()
    expect(screen.queryByRole('button', { name: '刪除' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '檢舉' }))
    const form = screen.getByRole('form', { name: '檢舉這則貼文' })
    fireEvent.click(within(form).getByRole('button', { name: '送出檢舉' }))
    expect(within(form).getByRole('alert')).toHaveTextContent('請寫下檢舉的原因')
    fireEvent.change(within(form).getByRole('textbox', { name: /^檢舉的原因/ }), { target: { value: ' 廣告 ' } })
    fireEvent.click(within(form).getByRole('button', { name: '送出檢舉' }))
    expect(await screen.findByText('已送出檢舉，幹部會處理。')).toBeInTheDocument()
    expect(bodyOf('POST /api/forum/reports')).toEqual({ target: 'post', targetId: 'd1', reason: '廣告' })
  })

  it('lets a member report a comment, which has its own anchor for notifications', async () => {
    open('/forum/p/d1')
    await waitFor(() => expect(document.getElementById('comment-c1')).not.toBeNull())
    const item = document.getElementById('comment-c1')!
    fireEvent.click(within(item).getByRole('button', { name: '留言操作' }))
    fireEvent.click(within(item).getByRole('button', { name: '檢舉' }))
    fireEvent.change(within(item).getByRole('textbox', { name: /^檢舉的原因/ }), { target: { value: '人身攻擊' } })
    fireEvent.click(within(item).getByRole('button', { name: '送出檢舉' }))
    await waitFor(() => expect(bodyOf('POST /api/forum/reports')).toEqual({ target: 'comment', targetId: 'c1', reason: '人身攻擊' }))
  })
})

describe('officers (e11-t17)', () => {
  it('pin and lock a post from its menu', async () => {
    signIn(OFFICER)
    open('/forum/p/d1')
    expect(await screen.findByRole('heading', { name: '4♠ 怎麼做', level: 1 })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '貼文操作' }))
    expect(screen.getByRole('button', { name: '刪除' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '置頂' }))
    expect(await screen.findByText('置頂', { selector: 'span' })).toBeInTheDocument()
    expect(bodyOf('POST /api/forum/posts/d1/pin')).toEqual({ pinned: true })
    fireEvent.click(screen.getByRole('button', { name: '貼文操作' }))
    expect(screen.getByRole('button', { name: '取消置頂' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '鎖定留言' }))
    await waitFor(() => expect(bodyOf('POST /api/forum/posts/d1/lock')).toEqual({ locked: true }))
  })

  it('handle reports on 討論區管理, linked from the boards; the boards are the admins’', async () => {
    signIn(OFFICER)
    open('/forum')
    const nav = await screen.findByRole('navigation', { name: '板面' })
    fireEvent.click(within(nav).getByRole('link', { name: '討論區管理' }))
    expect(await screen.findByRole('heading', { name: '討論區管理', level: 1 })).toBeInTheDocument()
    const report = await screen.findByRole('listitem', { name: '留言：亂講' })
    expect(within(report).getByText('人身攻擊')).toBeInTheDocument()
    expect(within(report).getByText('作者：陳小柏')).toBeInTheDocument()
    expect(within(report).getByRole('link', { name: '看貼文' })).toHaveAttribute('href', '/forum/p/d1#comment-c1')
    expect(screen.getByText('板面只有管理員能改。')).toBeInTheDocument()

    routes['GET /api/forum/reports?status=open'] = { reports: [] }
    fireEvent.click(within(report).getByRole('button', { name: '駁回' }))
    expect(await screen.findByText('沒有待處理的檢舉。')).toBeInTheDocument()
    expect(bodyOf('POST /api/forum/reports/r1')).toEqual({ action: 'dismiss' })
  })

  it('are told the page is not theirs when they are not officers', async () => {
    open('/forum/manage')
    expect(await screen.findByText('這頁只有討論區幹部能看。')).toBeInTheDocument()
    expect(sent.some((s) => s.call.startsWith('GET /api/forum/reports'))).toBe(false)
  })
})

describe('boards (AC-11.2, e11-t17)', () => {
  it('an admin renames, reorders and adds boards, saved together', async () => {
    signIn(ADMIN)
    open('/forum/manage')
    const panel = await screen.findByRole('region', { name: '板面' })
    const chat = within(panel).getByRole('listitem', { name: '板面「閒聊」' })
    expect(within(panel).getByRole('listitem', { name: '板面「社團公告」' })).toHaveTextContent('內建')
    fireEvent.change(within(chat).getByRole('textbox', { name: '名稱' }), { target: { value: '聊天' } })
    fireEvent.click(within(panel).getByRole('button', { name: '上移：聊天' }))
    fireEvent.click(within(panel).getByRole('button', { name: /新增板面/ }))
    const added = within(panel).getByRole('listitem', { name: '板面「新的板面」' })
    fireEvent.change(within(added).getByRole('textbox', { name: '名稱' }), { target: { value: '比賽' } })
    fireEvent.change(within(added).getByRole('textbox', { name: /^代號/ }), { target: { value: 'events' } })
    fireEvent.change(within(added).getByRole('combobox', { name: '誰能發文' }), { target: { value: 'officers' } })
    fireEvent.click(within(panel).getByRole('button', { name: '儲存板面' }))
    expect(await within(panel).findByText('板面已儲存。')).toBeInTheDocument()
    expect(bodyOf('PATCH /api/forum/boards/chat')).toEqual({ name: '聊天', description: expect.any(String), postPolicy: 'all', order: 2 })
    expect(bodyOf('PATCH /api/forum/boards/systems')).toMatchObject({ order: 3 })
    expect(bodyOf('POST /api/forum/boards')).toEqual({ id: 'events', name: '比賽', description: '', postPolicy: 'officers', order: 4 })
    expect(sent.some((s) => s.call === 'PATCH /api/forum/boards/news')).toBe(false)
  })
})
