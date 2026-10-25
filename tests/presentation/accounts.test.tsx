import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { conventions } from '../../src/content/index.ts'
import type { BookEntry, Me } from '../../src/lib/api.ts'
import { conventionMeta } from '../../src/lib/sections.ts'
import type { Convention } from '../../src/types/convention.ts'

/**
 * The account, editing and import pages against a fake API: each test lists the answers it
 * needs, and checks what the page sent.
 */

type Answer = { status?: number; body?: unknown; stream?: string } | ((init?: RequestInit) => { status?: number; body?: unknown })
let routes: Record<string, Answer>
let sent: { method: string; path: string; body: unknown }[]

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

/** The Worker's book routes for these online entries: the manifest and each entry by slug */
function serveBook(content: { version: number; entries: BookEntry[] }) {
  routes['GET /api/book/manifest'] = {
    body: {
      version: content.version,
      entries: content.entries.map(({ convention, ...rest }) => ({
        ...rest,
        meta: convention ? conventionMeta(convention as Convention) : null,
      })),
    },
  }
  for (const entry of content.entries) routes[`GET /api/book/content/${entry.slug}`] = { body: { entry } }
}

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})

beforeEach(() => {
  routes = {}
  sent = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      const path = String(input)
      const body = init?.body instanceof FormData ? Object.fromEntries(init.body.entries()) : init?.body ? JSON.parse(String(init.body)) : undefined
      sent.push({ method, path, body })
      const answer = routes[`${method} ${path}`]
      if (!answer) return json(401, { error: '請先登入', code: 'signInFirst' })
      const a: { status?: number; body?: unknown; stream?: string } = typeof answer === 'function' ? answer(init) : answer
      if (a.stream) return new Response(a.stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
      return json(a.status ?? 200, a.body ?? {})
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

const signedIn = (me: Partial<Me>) => {
  routes['GET /api/me'] = { body: { user: { id: 'u1', username: 'amy', admin: false, permissions: [], ...me } } }
}
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

describe('signing in and registering', () => {
  it('shows and hides the password, and goes back where the member came from', async () => {
    routes['POST /api/login'] = { body: { user: { id: 'u1', username: 'amy', admin: false, permissions: [] } } }
    renderAt('/login?next=/c/lebensohl')
    const password = await screen.findByLabelText(/^密碼/)
    await userEvent.type(screen.getByLabelText(/^帳號/), 'amy')
    await userEvent.type(password, 'secret1')
    expect(password).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: '顯示密碼' }))
    expect(password).toHaveAttribute('type', 'text')
    await userEvent.click(screen.getByRole('button', { name: '登入' }))
    expect(await screen.findByRole('button', { name: /^雷本索特約/ }, { timeout: 5000 })).toHaveAttribute('aria-expanded', 'true')
    expect(sent.find((s) => s.path === '/api/login')!.body).toEqual({ username: 'amy', password: 'secret1' })
  })

  it('sends a registration from this site for approval', async () => {
    routes['POST /api/register'] = { status: 202, body: { pending: true, username: 'amy' } }
    renderAt('/login')
    await userEvent.click(await screen.findByRole('button', { name: '註冊' }))
    await userEvent.type(screen.getByLabelText(/^帳號/), 'amy')
    await userEvent.type(screen.getByLabelText(/^密碼/), 'secret1')
    await userEvent.type(screen.getByLabelText(/^邀請碼/), 'tku')
    await userEvent.type(screen.getByLabelText(/^自我介紹/), '王小美')
    await userEvent.click(screen.getByRole('button', { name: '註冊' }))
    expect(await screen.findByRole('status')).toHaveTextContent('管理員核准後，就能用這個帳號登入淡江橋館和淡江牌桌')
    expect(sent.find((s) => s.path === '/api/register')!.body).toMatchObject({ note: '王小美', site: 'book' })
  })

  it('resets a forgotten password once both entries match', async () => {
    routes['POST /api/password/reset'] = { body: { ok: true } }
    renderAt('/login')
    await userEvent.click(await screen.findByRole('button', { name: '忘記密碼？' }))
    await userEvent.type(screen.getByLabelText(/^帳號/), 'amy')
    await userEvent.type(screen.getByLabelText(/^新密碼/), 'newpass1')
    await userEvent.type(screen.getByLabelText(/^再輸入一次/), 'nope')
    await userEvent.type(screen.getByLabelText(/^邀請碼/), 'tku')
    await userEvent.click(screen.getByRole('button', { name: '重設密碼' }))
    expect(screen.getByRole('alert')).toHaveTextContent('不一樣')
    await userEvent.clear(screen.getByLabelText(/^再輸入一次/))
    await userEvent.type(screen.getByLabelText(/^再輸入一次/), 'newpass1')
    await userEvent.click(screen.getByRole('button', { name: '重設密碼' }))
    expect(await screen.findByRole('status')).toHaveTextContent('密碼已重設')
    expect(sent.find((s) => s.path === '/api/password/reset')!.body).toEqual({ username: 'amy', inviteCode: 'tku', password: 'newpass1' })
  })
})

describe('what a member sees', () => {
  it('offers only what the permissions allow', async () => {
    signedIn({ permissions: ['bookEdit'] })
    renderAt('/')
    await userEvent.click(await screen.findByRole('button', { name: 'amy 的帳號選單' }))
    const menu = screen.getByRole('menu')
    expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['新增特約', '我的帳號', '登出'])
    expect(screen.getAllByRole('link', { name: /^編輯：/ }).length).toBe(conventions.length)
  })

  it('gives admins everything, with the registrations waiting', async () => {
    signedIn({ admin: true, permissions: ['bookEdit', 'bookImport'], applications: 2 })
    renderAt('/')
    await userEvent.click(await screen.findByRole('button', { name: 'amy 的帳號選單' }))
    expect(within(screen.getByRole('menu')).getAllByRole('menuitem').map((i) => i.textContent)).toEqual([
      '新增特約',
      '匯入檔案',
      '社團管理（2 筆待審核）',
      '我的帳號',
      '登出',
    ])
  })

  it('shows no edit buttons to readers, and asks them to sign in on member pages', async () => {
    renderAt('/')
    expect(await screen.findByRole('link', { name: /登入/ })).toBeInTheDocument()
    expect(screen.queryAllByRole('link', { name: /^編輯：/ })).toEqual([])
  })

  it('shows the online version of a convention, and who changed it', async () => {
    const lebensohl = conventions.find((c) => c.slug === 'lebensohl')!
    serveBook({
      version: 2,
      entries: [
        { slug: 'lebensohl', version: 2, convention: { ...lebensohl, summary: '線上改過的摘要', nameEn: 'Lebensohl online' }, createdAt: 1, updatedAt: Date.UTC(2026, 9, 23, 4), updatedBy: 'amy' },
        { slug: 'jacoby-2nt', version: 1, convention: null, createdAt: 1, updatedAt: 1, updatedBy: 'gene' },
      ],
    })
    renderAt('/c/lebensohl')
    expect(await screen.findByText('線上改過的摘要')).toBeInTheDocument()
    // The content comes from the online entry, loaded when the linked card opens
    expect(await screen.findByText(/線上修改：amy，2026\/10\/23/)).toBeInTheDocument()
    expect(sent.map((r) => r.path)).toContain('/api/book/content/lebensohl')
    // Jacoby 2NT is hidden online; the old version of the same name stays
    const slamAsks = screen.getAllByRole('button', { name: /^開叫高花之滿貫詢問叫/ })
    expect(slamAsks.map((b) => b.textContent)).toEqual([expect.stringContaining('舊版')])
  })
})

describe('the admin page', () => {
  it('approves a registration and grants a permission', async () => {
    signedIn({ admin: true, permissions: ['bookEdit', 'bookImport'] })
    routes['GET /api/admin/applications'] = { body: { applications: [{ id: 'a1', username: 'ben', note: '資工二', site: 'book', createdAt: 1 }] } }
    routes['GET /api/admin/users'] = {
      body: {
        users: [{ id: 'u2', username: 'cat', admin: false, createdAt: 1, lastLoginAt: null, boards: 0, online: false, permissions: [], passwordResetAt: null }],
      },
    }
    routes['GET /api/admin/settings'] = { body: { settings: { maxUsers: 10, inviteCode: 'tku' } } }
    routes['POST /api/admin/applications/a1/approve'] = { body: { user: {} } }
    routes['POST /api/admin/users/u2/permissions'] = { body: { ok: true } }
    renderAt('/admin')
    expect(await screen.findByText('資工二')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '核准' }))
    await userEvent.click(await screen.findByRole('checkbox', { name: 'cat：匯入檔案' }))
    await waitFor(() => expect(sent.some((s) => s.path === '/api/admin/users/u2/permissions')).toBe(true))
    expect(sent.find((s) => s.path === '/api/admin/users/u2/permissions')!.body).toEqual({ permissions: ['bookImport'] })
    expect(sent.some((s) => s.method === 'POST' && s.path === '/api/admin/applications/a1/approve')).toBe(true)
  })

  it('stays closed to members who are not admins', async () => {
    signedIn({ permissions: ['bookEdit'] })
    renderAt('/admin')
    expect(await screen.findByRole('alert')).toHaveTextContent('只有管理員')
  })
})

describe('the editor', () => {
  const lebensohl = conventions.find((c) => c.slug === 'lebensohl')!

  it('saves a change against the version it started from', async () => {
    signedIn({ permissions: ['bookEdit'] })
    serveBook({ version: 0, entries: [] })
    routes['PUT /api/book/conventions/lebensohl'] = {
      body: { entry: { slug: 'lebensohl', version: 1, convention: lebensohl, createdAt: 1, updatedAt: 1, updatedBy: 'amy' } },
    }
    renderAt('/edit/lebensohl')
    const summary = await screen.findByLabelText(/^摘要/)
    await userEvent.clear(summary)
    await userEvent.type(summary, '新的摘要')
    expect(screen.getByText('有未儲存的修改')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('修改說明（選填）'), '校對')
    await userEvent.click(screen.getByRole('button', { name: '儲存並發布' }))
    expect(await screen.findByText(/已儲存並發布（第 1 版）/)).toBeInTheDocument()
    const save = sent.find((s) => s.method === 'PUT')!.body as { convention: { summary: string }; baseVersion: number; bundledUpdated: string; note: string }
    expect(save).toMatchObject({ baseVersion: 0, bundledUpdated: lebensohl.updated, note: '校對' })
    expect(save.convention.summary).toBe('新的摘要')
  })

  it('sets the kind, level and prerequisites', async () => {
    signedIn({ permissions: ['bookEdit'] })
    serveBook({ version: 0, entries: [] })
    routes['PUT /api/book/conventions/lebensohl'] = {
      body: { entry: { slug: 'lebensohl', version: 1, convention: lebensohl, createdAt: 1, updatedAt: 1, updatedBy: 'amy' } },
    }
    renderAt('/edit/lebensohl')
    const kind = await screen.findByLabelText(/^種類/)
    expect(kind).toHaveValue('convention')
    expect(screen.getByLabelText(/^程度/)).toHaveValue('intermediate')
    await userEvent.selectOptions(kind, 'defense')
    await userEvent.selectOptions(screen.getByLabelText(/^程度/), 'advanced')
    const prerequisites = screen.getByRole('group', { name: '前置特約' })
    // Every other convention can be picked, but not this one
    expect(within(prerequisites).queryByRole('checkbox', { name: '雷本索特約' })).toBeNull()
    await userEvent.click(within(prerequisites).getByRole('checkbox', { name: '1NT的答叫' }))
    await userEvent.click(screen.getByRole('button', { name: '儲存並發布' }))
    expect(await screen.findByText(/已儲存並發布（第 1 版）/)).toBeInTheDocument()
    const save = sent.find((s) => s.method === 'PUT')!.body as { convention: Convention }
    expect(save.convention).toMatchObject({ kind: 'defense', level: 'advanced', prerequisites: ['notrump-responses'] })
  })

  it('offers a way out when someone else saved first', async () => {
    signedIn({ permissions: ['bookEdit'] })
    serveBook({ version: 0, entries: [] })
    let puts = 0
    routes['PUT /api/book/conventions/lebensohl'] = () =>
      ++puts === 1
        ? { status: 409, body: { error: 'ben 剛剛修改了這個特約，請重新載入後再改', code: 'bookConflict' } }
        : { body: { entry: { slug: 'lebensohl', version: 3, convention: lebensohl, createdAt: 1, updatedAt: 1, updatedBy: 'amy' } } }
    renderAt('/edit/lebensohl')
    await userEvent.type(await screen.findByLabelText(/^英文名稱/), ' convention')
    serveBook({ version: 2, entries: [{ slug: 'lebensohl', version: 2, convention: lebensohl, createdAt: 1, updatedAt: 1, updatedBy: 'ben' }] })
    await userEvent.click(screen.getByRole('button', { name: '儲存並發布' }))
    expect(await screen.findByText(/有人剛剛修改了這個特約/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /放棄我的修改/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /仍然用我的版本覆蓋/ }))
    expect(await screen.findByText(/已儲存並發布（第 3 版）/)).toBeInTheDocument()
    expect(sent.filter((s) => s.method === 'PUT').map((s) => (s.body as { baseVersion: number }).baseVersion)).toEqual([0, 2])
  })

  it('will not save a new convention without its name and address', async () => {
    signedIn({ permissions: ['bookEdit'] })
    serveBook({ version: 0, entries: [] })
    renderAt('/new')
    await userEvent.type(await screen.findByLabelText(/^摘要/), 'x')
    await userEvent.click(screen.getByRole('button', { name: '儲存並發布' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('網址代稱只能用小寫英文')
    expect(alert).toHaveTextContent('缺少中文名稱')
    expect(sent.some((s) => s.method === 'PUT')).toBe(false)
    await userEvent.type(screen.getByLabelText(/^網址代稱/), 'lebensohl')
    expect(screen.getByText('這個網址代稱已經有特約使用了')).toBeInTheDocument()
  })

  it('types suit symbols into the field being edited', async () => {
    signedIn({ permissions: ['bookEdit'] })
    serveBook({ version: 0, entries: [] })
    renderAt('/new')
    const name = await screen.findByLabelText(/^中文名稱/)
    await userEvent.type(name, '開叫1')
    await userEvent.click(screen.getByRole('button', { name: '插入花色 ♥' }))
    expect(name).toHaveValue('開叫1♥')
  })
})

describe('importing a file', () => {
  const event = (type: string, data: object) => `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`
  const reply = JSON.stringify({
    conventions: [
      {
        action: 'new',
        replaces: '',
        slug: 'drury',
        nameZh: '杜魯里',
        nameEn: 'Drury',
        aliases: [],
        category: 'suit-openings',
        tags: ['2C'],
        summary: '第三、四家開叫高花後的 2♣ 詢問。',
        sourceTitle: 'Drury',
        sourceNote: '',
        sections: [
          { id: 'rules', parentId: '', title: '答叫原則', originalTitle: '', summary: '', pending: '', blocks: [{ kind: 'paragraph', text: '原文。', pending: '' }] },
        ],
      },
    ],
    reviewNotes: '網站沒有這個特約，判斷為新特約。',
  })

  it('reads the file, streams the AI reply and opens the result in the editor', async () => {
    signedIn({ permissions: ['bookImport'] })
    routes['GET /api/book/drafts'] = { body: { drafts: [] } }
    routes['POST /api/book/import/ticket'] = { body: { ticket: 't1', url: 'https://table.example/api/book/import', ready: true } }
    routes['POST https://table.example/api/book/import'] = {
      stream:
        event('message_start', { message: { model: 'claude-opus-5-5', usage: { output_tokens: 1 } } }) +
        event('content_block_start', { index: 0, content_block: { type: 'text', text: '' } }) +
        event('content_block_delta', { index: 0, delta: { type: 'text_delta', text: reply.slice(0, 100) } }) +
        event('content_block_delta', { index: 0, delta: { type: 'text_delta', text: reply.slice(100) } }) +
        event('message_delta', { delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 300 } }) +
        event('message_stop', {}),
    }
    routes['POST /api/book/drafts'] = { body: { draft: { id: 'd1', fileName: 'drury.txt', createdAt: 1, createdBy: 'amy', conventions: 1 } } }
    renderAt('/import')
    const input = await screen.findByLabelText(/^選擇檔案/)
    await userEvent.upload(input, new File(['杜魯里\n2C = 詢問'], 'drury.txt', { type: 'text/plain' }))
    expect(await screen.findByText(/已從檔案讀出/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/^給 AI 的補充說明/), '這是新特約')
    await userEvent.click(screen.getByRole('button', { name: '開始分析' }))
    expect(await screen.findByText(/AI 從這份文件整理出 1 個特約/)).toBeInTheDocument()
    expect(screen.getByText('網站沒有這個特約，判斷為新特約。')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '打開編輯器' })).toHaveAttribute('href', '/new?draft=d1&n=0')

    const upload = sent.find((s) => s.path === 'https://table.example/api/book/import')!.body as Record<string, string>
    expect(upload.ticket).toBe('t1')
    expect(upload.text).toContain('2C = 詢問')
    expect(JSON.parse(upload.meta)).toMatchObject({ fileName: 'drury.txt', instructions: '這是新特約' })
    expect(JSON.parse(upload.meta).catalogue).toContain('lebensohl｜雷本索特約')
    const draft = sent.find((s) => s.method === 'POST' && s.path === '/api/book/drafts')!.body as { result: { conventions: { convention: { slug: string } }[] } }
    expect(draft.result.conventions[0].convention.slug).toBe('drury')
  })

  it('explains when AI import is not set up yet', async () => {
    signedIn({ permissions: ['bookImport'] })
    routes['GET /api/book/drafts'] = { body: { drafts: [] } }
    routes['POST /api/book/import/ticket'] = { body: { ticket: 't1', url: 'x', ready: false } }
    renderAt('/import')
    await userEvent.upload(await screen.findByLabelText(/^選擇檔案/), new File(['x'], 'a.txt', { type: 'text/plain' }))
    await userEvent.click(await screen.findByRole('button', { name: '開始分析' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('ANTHROPIC_API_KEY')
  })
})
