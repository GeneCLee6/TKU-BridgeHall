import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { conventions } from '../../src/content/index.ts'
import type { BookDraft, BookEntry, Me } from '../../src/lib/api.ts'
import { conventionMeta } from '../../src/lib/sections.ts'
import type { Convention } from '../../src/types/convention.ts'
import { warmPages } from './warmPages.ts'

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
beforeAll(warmPages, 60_000)

beforeEach(() => {
  // The admin page's team panel (e2-t07) and profile panel (e1-t14) read these whenever it opens
  routes = {
    'GET /api/club/teams': { body: { teams: [] } },
    'GET /api/club/members': { body: { members: [] } },
    'GET /api/book/profiles': { body: { profiles: [] } },
    // And its drafts and audit log (e8-t02, e8-t09)
    'GET /api/book/reviews': { body: { drafts: [] } },
    'GET /api/book/audit': { body: { entries: [] } },
  }
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
    expect(await screen.findByRole('heading', { level: 1, name: '雷本索特約' }, { timeout: 5000 })).toBeInTheDocument()
    expect(sent.find((s) => s.path === '/api/login')!.body).toEqual({ username: 'amy', password: 'secret1' })
  })

  it('keeps theme and 字級 in 閱讀設定, not in the header (e9-t11)', async () => {
    renderAt('/login')
    await screen.findByLabelText(/^密碼/)
    const header = within(screen.getByRole('banner'))
    expect(header.queryByRole('group', { name: '字級' })).toBeNull()
    await userEvent.click(header.getByRole('button', { name: '閱讀設定' }))
    expect(await screen.findByRole('dialog', {}, { timeout: 5000 })).toHaveTextContent('字級')
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
    renderAt('/book')
    await userEvent.click(await screen.findByRole('button', { name: 'amy 的帳號選單' }))
    const menu = screen.getByRole('menu')
    expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['新增特約', '社團管理', '我的帳號', '隊伍與搭檔', '登出'])
    expect((await screen.findAllByRole('link', { name: /^編輯：/ })).length).toBe(conventions.length)
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
      '隊伍與搭檔',
      '登出',
    ])
  })

  it('shows no edit buttons to readers, and asks them to sign in on member pages', async () => {
    renderAt('/')
    expect(await within(screen.getByRole('banner')).findByRole('link', { name: /登入/ })).toBeInTheDocument()
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
    const catalogue = within(screen.getByRole('navigation', { name: '特約目錄' }))
    const slamAsks = catalogue.getAllByRole('link', { name: /^開叫高花之滿貫詢問叫/ })
    expect(slamAsks.map((b) => b.textContent)).toEqual([expect.stringContaining('舊版')])
  })
})

describe('the avatar on my account (e11-t03)', () => {
  it('shows the default initials, then the uploaded picture, and goes back to the default', async () => {
    signedIn({ profile: { displayName: '王小美' } })
    const { container, unmount } = renderAt('/account')
    expect(await screen.findByRole('heading', { name: '頭像' })).toBeInTheDocument()
    const avatars = () => [...container.querySelectorAll('[data-avatar]')]
    expect(avatars().map((a) => a.getAttribute('data-initials'))).toEqual(['王', '王'])
    expect(container.querySelector('[data-avatar] img')).toBeNull()
    expect(screen.queryByRole('button', { name: '改回預設頭像' })).toBeNull()
    unmount()

    signedIn({ avatar: 7 })
    routes['DELETE /api/account/avatar'] = () => {
      signedIn({})
      return { body: { user: { id: 'u1', username: 'amy', admin: false, permissions: [] } } }
    }
    const again = renderAt('/account')
    await userEvent.click(await screen.findByRole('button', { name: '改回預設頭像' }))
    expect(again.container.querySelector('[data-avatar] img')).toBeNull()
    expect(await screen.findByRole('status')).toHaveTextContent('已改回預設頭像')
    expect(sent.some((r) => r.method === 'DELETE' && r.path === '/api/account/avatar')).toBe(true)
  })

  it('turns down a file that is not a picture before cropping', async () => {
    signedIn({})
    const { container } = renderAt('/account')
    await screen.findByRole('heading', { name: '頭像' })
    const input = container.querySelector<HTMLInputElement>('input[type=file]')!
    await userEvent.upload(input, new File(['x'], 'a.gif', { type: 'image/gif' }), { applyAccept: false })
    expect(await screen.findByRole('alert')).toHaveTextContent('頭像只能是 JPEG、PNG 或 WebP 圖片')
    expect(screen.queryByRole('group', { name: '裁切頭像' })).toBeNull()
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
    // Admins have the editors' panels too
    expect(screen.getByRole('heading', { name: '分類' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '社團設定' })).toBeInTheDocument()
  })

  it('grants reviewing with editing, and takes reviewing away with editing (e8-t01)', async () => {
    signedIn({ admin: true, permissions: ['bookEdit', 'bookReview', 'bookImport'] })
    routes['GET /api/admin/applications'] = { body: { applications: [] } }
    const users = [
      { id: 'u2', username: 'cat', admin: false, createdAt: 1, lastLoginAt: null, boards: 0, online: false, permissions: [], passwordResetAt: null },
      { id: 'u3', username: 'dan', admin: false, createdAt: 1, lastLoginAt: null, boards: 0, online: false, permissions: ['bookEdit', 'bookReview'], passwordResetAt: null },
    ]
    routes['GET /api/admin/users'] = { body: { users } }
    routes['GET /api/admin/settings'] = { body: { settings: { maxUsers: 10, inviteCode: 'tku' } } }
    routes['POST /api/admin/users/u2/permissions'] = { body: { ok: true } }
    routes['POST /api/admin/users/u3/permissions'] = { body: { ok: true } }
    renderAt('/admin')
    await userEvent.click(await screen.findByRole('checkbox', { name: 'cat：審核發布' }))
    await waitFor(() => expect(sent.some((s) => s.path === '/api/admin/users/u2/permissions')).toBe(true))
    expect(sent.find((s) => s.path === '/api/admin/users/u2/permissions')!.body).toEqual({ permissions: ['bookEdit', 'bookReview'] })
    await userEvent.click(await screen.findByRole('checkbox', { name: 'dan：線上編輯' }))
    await waitFor(() => expect(sent.some((s) => s.path === '/api/admin/users/u3/permissions')).toBe(true))
    expect(sent.find((s) => s.path === '/api/admin/users/u3/permissions')!.body).toEqual({ permissions: [] })
  })

  it('lists the drafts and the audit log for editors, each linked to the editor (e8-t02, e8-t09)', async () => {
    signedIn({ permissions: ['bookEdit'] })
    routes['GET /api/book/categories'] = { body: { version: 0, categories: [] } }
    routes['GET /api/book/reviews'] = {
      body: {
        drafts: [
          { slug: 'lebensohl', nameZh: '雷本索特約', status: 'in-review', baseVersion: 0, revision: 2, note: '', createdAt: 1, createdBy: 'amy', updatedAt: 1, updatedBy: 'amy', reviewRequestedBy: 'amy', reviewRequestedAt: 1 },
        ],
      },
    }
    routes['GET /api/book/audit'] = {
      body: {
        entries: [
          { id: '2', at: 2, by: 'rita', action: 'book:publish', target: 'lebensohl', version: 3, revisionId: '00000000000002-abc', note: '校對' },
          { id: '1', at: 1, by: 'amy', action: 'book:categories', target: 'categories', version: 1 },
        ],
      },
    }
    renderAt('/admin')
    expect(await screen.findByRole('link', { name: '打開：雷本索特約' }, { timeout: 5000 })).toHaveAttribute('href', '/review/lebensohl')
    expect(screen.getByText('送審中（amy）')).toBeInTheDocument()
    const audit = screen.getByRole('region', { name: '審計紀錄' })
    expect(within(audit).getByRole('link', { name: 'lebensohl' })).toHaveAttribute('href', '/edit/lebensohl?rev=00000000000002-abc')
    expect(within(audit).getByText('第 3 版')).toBeInTheDocument()
    expect(within(audit).getByText('改分類')).toBeInTheDocument()
  })

  it('stays closed to members without the editing permission', async () => {
    signedIn({ permissions: ['bookImport'] })
    renderAt('/admin')
    expect(await screen.findByRole('alert')).toHaveTextContent('還沒有這項權限')
  })

  it('shows editors who are not admins every panel but the account ones', async () => {
    signedIn({ permissions: ['bookEdit'] })
    routes['GET /api/book/categories'] = { body: { version: 0, categories: [] } }
    renderAt('/admin')
    expect(await screen.findByRole('heading', { name: '分類' }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText(/帳號、申請與社團設定只有管理員看得到/)).toBeInTheDocument()
    for (const accounts of ['待審核的申請', '社員', '社團設定']) expect(screen.queryByRole('heading', { name: accounts })).toBeNull()
    expect(screen.queryByRole('link', { name: /淡江牌桌管理頁/ })).toBeNull()
    expect(sent.some((s) => s.path.startsWith('/api/admin/'))).toBe(false)
  })
})

describe('categories', () => {
  const bundled = [
    { id: 'notrump', label: '無王開叫後續', description: '1NT、2NT 開叫之後的答叫與競叫', order: 0 },
    { id: 'suit-openings', label: '花色開叫後續', description: '花色開叫之後的答叫與再叫', order: 1 },
    { id: 'signals', label: '防守信號', description: '防守時的出牌與墊牌信號', order: 2 },
    { id: 'competitive', label: '競叫與防守', description: '敵方插叫或我方插叫時的約定', order: 3 },
    { id: 'system', label: '制度總覽（舊講義）', description: '2010 年講義《我們的制度》；與特約衝突時以特約為準', order: 4 },
  ]

  it('renames, reorders and adds categories, saved as one list, and blocks removing one in use', async () => {
    signedIn({ permissions: ['bookEdit'] })
    routes['GET /api/book/categories'] = { body: { version: 0, categories: [] } }
    routes['PUT /api/book/categories'] = (init) => {
      const body = JSON.parse(String(init?.body))
      const categories = body.categories.map((c: object, order: number) => ({ ...c, order }))
      return { body: { version: 1, categories, updatedBy: 'amy', updatedAt: 1 } }
    }
    renderAt('/admin')
    const name = await screen.findByRole('textbox', { name: '「競叫與防守」的名稱' }, { timeout: 5000 })
    expect(screen.getByText('目前用的是網站內建的分類；第一次儲存後改用線上這一份。')).toBeInTheDocument()

    // Every bundled category has conventions in it, so none can be removed
    const remove = screen.getByRole('button', { name: /^刪除「競叫與防守」：裡面還有 \d+ 個特約/ })
    expect(remove).toBeDisabled()

    await userEvent.clear(name)
    await userEvent.type(name, '競叫')
    await userEvent.click(screen.getByRole('button', { name: '把「防守信號」往上移' }))
    const add = screen.getByRole('form', { name: '新增分類' })
    await userEvent.type(within(add).getByRole('textbox', { name: '新分類的名稱' }), '滿貫')
    await userEvent.click(within(add).getByRole('button', { name: '新增分類' }))
    // A new one is empty, so it can go again
    await userEvent.click(screen.getByRole('button', { name: '刪除「滿貫」' }))
    await userEvent.type(within(add).getByRole('textbox', { name: '新分類的名稱' }), '滿貫叫法')
    await userEvent.click(within(add).getByRole('button', { name: '新增分類' }))

    await userEvent.click(screen.getByRole('button', { name: '儲存分類' }))
    await waitFor(() => expect(sent.some((s) => s.method === 'PUT')).toBe(true))
    const put = sent.find((s) => s.method === 'PUT')!.body as { baseVersion: number; categories: { id: string; label: string }[] }
    expect(put.baseVersion).toBe(0)
    expect(put.categories.map((c) => c.label)).toEqual(['無王開叫後續', '防守信號', '花色開叫後續', '競叫', '制度總覽（舊講義）', '滿貫叫法'])
    expect(put.categories[5].id).toMatch(/^c-[a-z0-9]+$/)
    expect(await screen.findByText('已儲存')).toBeInTheDocument()
    expect(screen.getByText(/最後由 amy 在/)).toBeInTheDocument()
    // The catalogue is fetched again so it shows the new list
    expect(sent.filter((s) => s.path === '/api/book/manifest').length).toBeGreaterThan(1)
  })

  it('says when someone else saved first, and loads their list', async () => {
    signedIn({ permissions: ['bookEdit'] })
    routes['GET /api/book/categories'] = { body: { version: 3, categories: bundled, updatedBy: 'ben', updatedAt: 1 } }
    routes['PUT /api/book/categories'] = {
      status: 409,
      body: { error: 'ben 剛剛修改了分類，請重新載入後再改', code: 'categoryConflict', params: { name: 'ben' } },
    }
    renderAt('/admin')
    const name = await screen.findByRole('textbox', { name: '「防守信號」的名稱' }, { timeout: 5000 })
    await userEvent.type(name, '！')
    await userEvent.click(screen.getByRole('button', { name: '儲存分類' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('ben 剛剛修改了分類')
    expect((sent.find((s) => s.method === 'PUT')!.body as { baseVersion: number }).baseVersion).toBe(3)
    await userEvent.click(screen.getByRole('button', { name: '重新載入' }))
    expect(await screen.findByRole('textbox', { name: '「防守信號」的名稱' })).toHaveValue('防守信號')
  })

  it('groups the catalogue, the home page and the editor by the online list', async () => {
    signedIn({ permissions: ['bookEdit'] })
    const online = [
      { ...bundled[3], label: '競叫（線上）', order: 0 },
      { ...bundled[0], order: 1 },
      { id: 'slam', label: '滿貫', description: '', order: 2 },
    ]
    routes['GET /api/book/manifest'] = { body: { version: 1, entries: [], categories: online } }
    renderAt('/book')
    expect((await screen.findAllByRole('heading', { name: /^競叫（線上）/ })).length).toBeGreaterThan(0)
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.id).filter((id) => id.startsWith('cat-'))
    // Online order first; the bundled ones the list left out still have conventions, so they follow
    expect(headings).toEqual(['cat-competitive', 'cat-notrump', 'cat-suit-openings', 'cat-signals', 'cat-system'])
  })

  it('offers the same list in the editor', async () => {
    signedIn({ permissions: ['bookEdit'] })
    routes['GET /api/book/manifest'] = {
      body: { version: 1, entries: [], categories: [{ id: 'slam', label: '滿貫', description: '', order: 0 }, { ...bundled[0], order: 1 }] },
    }
    renderAt('/new')
    // The editor is a lazy chunk; give it time on a busy machine
    const select = await screen.findByRole('combobox', { name: '分類' }, { timeout: 5000 })
    await waitFor(() => expect(within(select).getAllByRole('option')[0]).toHaveTextContent('滿貫'), { timeout: 5000 })
    // The bundled ones still in use follow, so every convention can keep its category
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual([
      '滿貫',
      '無王開叫後續',
      '花色開叫後續',
      '防守信號',
      '競叫與防守',
      '制度總覽（舊講義）',
    ])
  })
})

describe('the editor', () => {
  const lebensohl = conventions.find((c) => c.slug === 'lebensohl')!

  const draftOf = (extra: Partial<BookDraft> = {}): BookDraft => ({
    slug: 'lebensohl',
    status: 'draft',
    baseVersion: 0,
    revision: 1,
    convention: lebensohl,
    note: '',
    createdAt: 1,
    createdBy: 'amy',
    updatedAt: 1,
    updatedBy: 'amy',
    ...extra,
  })

  it('saves an editor’s change as a draft against the version it started from, then sends it for review', async () => {
    signedIn({ permissions: ['bookEdit'] })
    serveBook({ version: 0, entries: [] })
    routes['PUT /api/book/conventions/lebensohl/draft'] = (init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { submit: boolean; draftRevision: number }
      return { body: { draft: draftOf({ status: body.submit ? 'in-review' : 'draft', revision: body.draftRevision + 1, reviewRequestedBy: body.submit ? 'amy' : undefined }) } }
    }
    renderAt('/edit/lebensohl')
    const summary = await screen.findByLabelText(/^摘要/)
    // Editors cannot publish: that is the reviewers'
    expect(screen.queryByRole('button', { name: '直接發布' })).toBeNull()
    await userEvent.clear(summary)
    await userEvent.type(summary, '新的摘要')
    expect(screen.getByText('有未儲存的修改')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('修改說明（選填）'), '校對')
    await userEvent.click(screen.getByRole('button', { name: '儲存草稿' }))
    expect(await screen.findByText(/已儲存草稿。讀者還看不到/)).toBeInTheDocument()
    const save = sent.find((s) => s.method === 'PUT')!.body as { convention: { summary: string }; baseVersion: number; bundledUpdated: string; note: string; draftRevision: number; submit: boolean }
    expect(save).toMatchObject({ baseVersion: 0, draftRevision: 0, submit: false, bundledUpdated: lebensohl.updated, note: '校對' })
    expect(save.convention.summary).toBe('新的摘要')
    expect(sent.some((s) => s.method === 'PUT' && s.path === '/api/book/conventions/lebensohl')).toBe(false)
    // Sending the saved draft for review needs no change
    await userEvent.click(screen.getByRole('button', { name: '送審' }))
    expect(await screen.findByText('已送審，等審核者發布。')).toBeInTheDocument()
    expect(sent.filter((s) => s.method === 'PUT').map((s) => (s.body as { draftRevision: number; submit: boolean }))).toMatchObject([
      { draftRevision: 0, submit: false },
      { draftRevision: 1, submit: true },
    ])
    expect(screen.getByText(/^送審中：amy/)).toBeInTheDocument()
  })

  it('opens the draft, and lets a reviewer publish it or send it back', async () => {
    signedIn({ permissions: ['bookEdit', 'bookReview'] })
    serveBook({ version: 0, entries: [] })
    routes['GET /api/book/conventions/lebensohl/draft'] = {
      body: { draft: draftOf({ status: 'in-review', revision: 4, reviewRequestedBy: 'ben', reviewRequestedAt: 2, convention: { ...lebensohl, summary: '草稿的摘要' } }) },
    }
    routes['POST /api/book/conventions/lebensohl/reject'] = {
      body: { draft: draftOf({ revision: 5, reviewedBy: 'amy', reviewedAt: 3, reviewNote: '點力不符' }) },
    }
    renderAt('/edit/lebensohl')
    expect(await screen.findByLabelText(/^摘要/)).toHaveValue('草稿的摘要')
    expect(screen.getByText(/^送審中：ben/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('退回理由'), '點力不符')
    await userEvent.click(screen.getByRole('button', { name: '退回' }))
    expect(await screen.findByText('已退回草稿給編輯者。')).toBeInTheDocument()
    expect(sent.find((s) => s.path.endsWith('/reject'))!.body).toEqual({ draftRevision: 4, note: '點力不符' })
    expect(screen.getByText(/amy 在 .* 退回：/).parentElement).toHaveTextContent('點力不符')
    // Publishing it uses the draft up
    routes['PUT /api/book/conventions/lebensohl'] = {
      body: { entry: { slug: 'lebensohl', version: 1, convention: lebensohl, createdAt: 1, updatedAt: 1, updatedBy: 'amy', status: 'published' } },
    }
    await userEvent.click(screen.getByRole('button', { name: '直接發布' }))
    expect(await screen.findByText(/已發布（第 1 版）/)).toBeInTheDocument()
    expect(sent.find((s) => s.method === 'PUT')!.body).toMatchObject({ baseVersion: 0, draftRevision: 5 })
    expect(screen.queryByText(/這是草稿/)).toBeNull()
  })

  it('says when someone saved the draft in between', async () => {
    signedIn({ permissions: ['bookEdit'] })
    serveBook({ version: 0, entries: [] })
    routes['PUT /api/book/conventions/lebensohl/draft'] = {
      status: 409,
      body: { error: 'ben 剛剛修改了這份草稿，請重新載入後再改', code: 'bookDraftConflict', params: { name: 'ben' } },
    }
    renderAt('/edit/lebensohl')
    await userEvent.type(await screen.findByLabelText(/^英文名稱/), ' x')
    await userEvent.click(screen.getByRole('button', { name: '儲存草稿' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('ben 剛剛修改了這份草稿')
    expect(screen.getByRole('button', { name: '重新載入' })).toBeInTheDocument()
  })

  it('sets the kind, level and prerequisites', async () => {
    signedIn({ permissions: ['bookEdit', 'bookReview'] })
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
    await userEvent.click(screen.getByRole('button', { name: '直接發布' }))
    expect(await screen.findByText(/已發布（第 1 版）/)).toBeInTheDocument()
    const save = sent.find((s) => s.method === 'PUT')!.body as { convention: Convention }
    expect(save.convention).toMatchObject({ kind: 'defense', level: 'advanced', prerequisites: ['notrump-responses'] })
  })

  it('offers a way out when someone else published first', async () => {
    signedIn({ permissions: ['bookEdit', 'bookReview'] })
    serveBook({ version: 0, entries: [] })
    let puts = 0
    routes['PUT /api/book/conventions/lebensohl'] = () =>
      ++puts === 1
        ? { status: 409, body: { error: 'ben 剛剛修改了這個特約，請重新載入後再改', code: 'bookConflict' } }
        : { body: { entry: { slug: 'lebensohl', version: 3, convention: lebensohl, createdAt: 1, updatedAt: 1, updatedBy: 'amy' } } }
    renderAt('/edit/lebensohl')
    await userEvent.type(await screen.findByLabelText(/^英文名稱/), ' convention')
    serveBook({ version: 2, entries: [{ slug: 'lebensohl', version: 2, convention: lebensohl, createdAt: 1, updatedAt: 1, updatedBy: 'ben' }] })
    await userEvent.click(screen.getByRole('button', { name: '直接發布' }))
    expect(await screen.findByText(/有人剛剛發布了這個特約的新版本/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /放棄我的修改/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /仍然用我的版本覆蓋/ }))
    expect(await screen.findByText(/已發布（第 3 版）/)).toBeInTheDocument()
    expect(sent.filter((s) => s.method === 'PUT').map((s) => (s.body as { baseVersion: number }).baseVersion)).toEqual([0, 2])
  })

  it('lets reviewers hide a convention, and not editors (e8-t01)', async () => {
    signedIn({ permissions: ['bookEdit'] })
    serveBook({ version: 0, entries: [] })
    routes['GET /api/book/conventions/lebensohl/revisions'] = { body: { revisions: [] } }
    const { unmount } = renderAt('/edit/lebensohl')
    await userEvent.click(await screen.findByRole('button', { name: '版本紀錄' }))
    await screen.findByText(/還沒有線上修改的紀錄/)
    expect(screen.queryByRole('button', { name: '從橋譜隱藏這個特約' })).toBeNull()
    unmount()
    signedIn({ permissions: ['bookEdit', 'bookReview'] })
    serveBook({ version: 0, entries: [] })
    routes['GET /api/book/conventions/lebensohl/revisions'] = { body: { revisions: [] } }
    routes['POST /api/book/conventions/lebensohl/hide'] = {
      body: { entry: { slug: 'lebensohl', version: 1, convention: null, createdAt: 1, updatedAt: 1, updatedBy: 'amy' } },
    }
    renderAt('/edit/lebensohl')
    await userEvent.click(await screen.findByRole('button', { name: '版本紀錄' }))
    await userEvent.click(await screen.findByRole('button', { name: '從橋譜隱藏這個特約' }))
    await userEvent.click(screen.getByRole('button', { name: '確定' }))
    await waitFor(() => expect(sent.some((s) => s.method === 'POST' && s.path === '/api/book/conventions/lebensohl/hide')).toBe(true))
    expect(sent.find((s) => s.path === '/api/book/conventions/lebensohl/hide')!.body).toEqual({ baseVersion: 0 })
  })

  it('will not save a new convention without its name and address', async () => {
    signedIn({ permissions: ['bookEdit'] })
    serveBook({ version: 0, entries: [] })
    renderAt('/new')
    await userEvent.type(await screen.findByLabelText(/^摘要/), 'x')
    await userEvent.click(screen.getByRole('button', { name: '儲存草稿' }))
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

describe('teams on the admin page (e2-t07, e2-t10)', () => {
  const team = { id: 't1', name: 'A 隊', captainId: 'u1', memberIds: ['u1', 'u2'], profileId: 'p1', createdAt: 1 }
  const people = [
    { id: 'u1', username: 'amy' },
    { id: 'u2', username: 'ben' },
    { id: 'u3', username: 'cat' },
  ]

  it('lists the teams for editors: captain, members, members editing the profile, partnerships, and a new team', async () => {
    signedIn({ permissions: ['bookEdit'] })
    routes['GET /api/book/categories'] = { body: { version: 0, categories: [] } }
    routes['GET /api/club/teams'] = { body: { teams: [team] } }
    routes['GET /api/club/members'] = { body: { members: people } }
    routes['GET /api/club/teams/t1'] = {
      body: { team, pairs: [{ id: 'q1', userIds: ['u1', 'u2'], teamId: 't1', profileId: 'p2', createdAt: 1, status: 'active', acceptedAt: 2 }] },
    }
    routes['PATCH /api/club/teams/t1'] = { body: { team } }
    routes['POST /api/club/teams/t1/members'] = { body: { team } }
    routes['POST /api/club/teams'] = { body: { team } }
    const user = userEvent.setup()
    renderAt('/admin')

    const list = await screen.findByRole('list', { name: '隊伍' }, { timeout: 5000 })
    expect(within(list).getByText('A 隊')).toBeInTheDocument()
    expect(within(list).getByRole('combobox', { name: 'A 隊 的隊長' })).toHaveValue('u1')

    await user.click(within(list).getByRole('checkbox', { name: '隊員可編輯制度集' }))
    await waitFor(() => expect(sent.find((s) => s.method === 'PATCH')?.body).toEqual({ membersEdit: true }))

    await user.selectOptions(within(list).getByRole('combobox', { name: '加入 A 隊 的社員' }), 'u3')
    await user.click(within(list).getByRole('button', { name: '加入' }))
    await waitFor(() => expect(sent.find((s) => s.path === '/api/club/teams/t1/members')?.body).toEqual({ userId: 'u3' }))

    await user.click(within(list).getByRole('button', { name: 'A 隊 的搭檔' }))
    expect(await screen.findByText('amy＋ben')).toBeInTheDocument()

    const form = screen.getByRole('form', { name: '建立隊伍' })
    await user.type(within(form).getByLabelText('隊名'), 'B 隊')
    await user.selectOptions(within(form).getByLabelText('隊長'), 'u3')
    await user.click(within(form).getByRole('button', { name: '建立隊伍' }))
    await waitFor(() =>
      expect(sent.find((s) => s.method === 'POST' && s.path === '/api/club/teams')?.body).toEqual({ name: 'B 隊', captainId: 'u3' }),
    )
  })
})
