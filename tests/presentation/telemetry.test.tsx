import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { ErrorBoundary } from '../../src/components/ErrorBoundary.tsx'
import type { BookAnalyticsView, BookClientError, Me } from '../../src/lib/api.ts'
import { resetErrorReports } from '../../src/lib/errorReport.ts'
import { PreferencesProvider } from '../../src/state/PreferencesContext.tsx'
import { warmPages } from './warmPages.ts'

/** The admin page's 錯誤回報 and 使用統計 (e10-t06, e10-t07), 個人設定's switch and the error boundary */

type Answer = { status?: number; body?: unknown }
let routes: Record<string, Answer>
let sent: { method: string; path: string; body: unknown }[]

const ERRORS: BookClientError[] = [
  {
    id: 2,
    at: Date.UTC(2026, 9, 29, 4),
    kind: 'boundary',
    message: 'TypeError: x is undefined',
    stack: 'TypeError: x is undefined\n    at Card (app.js:1:2)',
    page: '/c/fixture-alpha',
    version: 'abcdef1234567',
    count: 3,
  },
  { id: 1, at: Date.UTC(2026, 9, 28), kind: 'rejection', message: 'Error: offline', count: 1 },
]

const VIEW: BookAnalyticsView = {
  enabled: true,
  weeks: Array.from({ length: 12 }, (_, i) => ({
    week: `2026-${String(8 + Math.floor(i / 4)).padStart(2, '0')}-${String(3 + (i % 4) * 7).padStart(2, '0')}`,
    visitors: i,
    pages: i * 10,
  })),
  topConventions: [
    { slug: 'fixture-alpha', views: 40 },
    { slug: 'gone-convention', views: 2 },
  ],
  topSearches: [{ query: 'stayman', count: 7 }],
  profileSwitches: 5,
  quiz: { answered: 20, correct: 15 },
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

const signedIn = (me: Partial<Me>) => {
  const user = { id: 'u1', username: 'amy', admin: false, permissions: [], ...me }
  routes['GET /api/me'] = { body: { user } }
  localStorage.setItem('tku-bridgebook:me', JSON.stringify(user))
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
  routes = {
    'GET /api/club/teams': { body: { teams: [] } },
    'GET /api/club/members': { body: { members: [] } },
    'GET /api/book/profiles': { body: { profiles: [] } },
    'GET /api/book/reviews': { body: { drafts: [] } },
    'GET /api/book/audit': { body: { entries: [] } },
    'GET /api/book/articles': { body: { version: 0, entries: [], files: {}, series: { version: 0, series: [] } } },
    'GET /api/book/errors': { body: { errors: ERRORS } },
    'GET /api/book/analytics': { body: VIEW },
  }
  signedIn({})
  sent = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      const path = String(input)
      sent.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined })
      const answer = routes[`${method} ${path}`]
      if (!answer) return new Response(JSON.stringify({ error: '請先登入' }), { status: 401 })
      return new Response(answer.status === 204 ? null : JSON.stringify(answer.body ?? {}), { status: answer.status ?? 200 })
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('錯誤回報 on the admin page (e10-t06)', () => {
  it('lists the reports with their count, page and version, the stack under the message, and clears them', async () => {
    signedIn({ permissions: ['bookEdit'] })
    routes['DELETE /api/book/errors'] = { status: 204 }
    renderAt('/admin')
    const panel = within(await screen.findByRole('region', { name: '錯誤回報' }, { timeout: 5000 }))
    const rows = await panel.findAllByRole('row')
    expect(rows).toHaveLength(3)
    expect(rows[1]).toHaveTextContent('頁面無法顯示')
    expect(rows[1]).toHaveTextContent('/c/fixture-alpha')
    expect(rows[1]).toHaveTextContent('abcdef1')
    expect(within(rows[1]).getByRole('cell', { name: '3' })).toBeInTheDocument()
    expect(rows[2]).toHaveTextContent('未處理的非同步錯誤')

    await userEvent.click(panel.getByText('TypeError: x is undefined'))
    expect(panel.getByLabelText('呼叫堆疊')).toHaveTextContent('at Card (app.js:1:2)')

    await userEvent.click(panel.getByRole('button', { name: '清空' }))
    await userEvent.click(panel.getByRole('button', { name: '確定' }))
    await waitFor(() => expect(panel.getByText('目前沒有錯誤回報')).toBeInTheDocument())
    expect(sent.some((s) => s.method === 'DELETE' && s.path === '/api/book/errors')).toBe(true)
  })

  it('is not for plain members, and nothing is asked for them', async () => {
    renderAt('/admin')
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '錯誤回報' })).toBeNull()
    expect(sent.some((s) => s.path === '/api/book/errors' || s.path === '/api/book/analytics')).toBe(false)
  })
})

describe('使用統計 on the admin page (e10-t07)', () => {
  it('shows the weeks as columns and a table, the top conventions by name, searches, switches and answers', async () => {
    signedIn({ permissions: ['bookEdit'] })
    renderAt('/admin')
    const panel = within(await screen.findByRole('region', { name: '使用統計' }, { timeout: 5000 }))
    expect(await panel.findByText('每週活躍人數')).toBeInTheDocument()
    expect(panel.getByText('每週瀏覽數')).toBeInTheDocument()
    // The weeks as a table, for screen readers and exact numbers
    const weeks = within(panel.getByText('每週活躍人數與瀏覽數（表格）').closest('details')!)
    expect(weeks.getAllByRole('row', { hidden: true })).toHaveLength(13)
    // A slug the manifest knows shows the convention's name; another its slug
    expect(panel.getByRole('cell', { name: '測試特約甲（虛構）' })).toBeInTheDocument()
    expect(panel.getByRole('cell', { name: 'gone-convention' })).toBeInTheDocument()
    expect(panel.getByRole('cell', { name: 'stayman' })).toBeInTheDocument()
    expect(panel.getByText('5 次')).toBeInTheDocument()
    expect(panel.getByText('20 題，答對 15 題（75%）')).toBeInTheDocument()
    // The club's switch is an admin's
    expect(panel.queryByRole('checkbox', { name: '社團開啟匿名分析' })).toBeNull()
  })

  it('lets an admin turn the club’s analytics off', async () => {
    signedIn({ admin: true, permissions: ['bookEdit'] })
    routes['GET /api/admin/applications'] = { body: { applications: [] } }
    routes['GET /api/admin/users'] = { body: { users: [] } }
    routes['GET /api/admin/settings'] = { body: { settings: { maxUsers: 10, inviteCode: '' } } }
    routes['PUT /api/book/analytics/settings'] = { body: { ...VIEW, enabled: false } }
    renderAt('/admin')
    const panel = within(await screen.findByRole('region', { name: '使用統計' }, { timeout: 5000 }))
    const box = await panel.findByRole('checkbox', { name: '社團開啟匿名分析' })
    expect(box).toBeChecked()
    await userEvent.click(box)
    await waitFor(() => expect(box).not.toBeChecked())
    expect(sent.find((s) => s.method === 'PUT')).toEqual({ method: 'PUT', path: '/api/book/analytics/settings', body: { enabled: false } })
    expect(panel.getByText(/社團已關閉匿名分析/)).toBeInTheDocument()
  })
})

describe('傳送匿名使用統計 in 個人設定 (e10-t07)', () => {
  const prefs = () => JSON.parse(localStorage.getItem('tku-bridgebook:prefs') ?? '{}')

  it('is on by default and remembered when turned off', async () => {
    renderAt('/settings')
    const box = await screen.findByRole('checkbox', { name: '傳送匿名使用統計' }, { timeout: 5000 })
    expect(box).toBeChecked()
    expect(prefs().analytics).toBeNull()
    await userEvent.click(box)
    expect(box).not.toBeChecked()
    expect(prefs().analytics).toBe(false)
    // 全部恢復預設 is about the display: it keeps this choice
    await userEvent.click(screen.getByRole('button', { name: '全部恢復預設' }))
    expect(prefs().analytics).toBe(false)
  })

  it('is off by default when the browser asks not to be tracked', async () => {
    vi.stubGlobal('navigator', Object.assign(Object.create(navigator), { globalPrivacyControl: true }))
    renderAt('/settings')
    const box = await screen.findByRole('checkbox', { name: '傳送匿名使用統計' }, { timeout: 5000 })
    expect(box).not.toBeChecked()
    expect(screen.getByText(/Global Privacy Control/)).toBeInTheDocument()
  })
})

describe('the error boundary (e10-t06)', () => {
  function Broken(): never {
    throw new Error('render failed')
  }

  it('shows what happened with a reload button, and reports it', async () => {
    vi.stubEnv('PROD', true)
    resetErrorReports()
    routes['POST /api/book/errors'] = { status: 204 }
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <MemoryRouter initialEntries={['/c/fixture-alpha?x=1']}>
        <PreferencesProvider>
          <ErrorBoundary>
            <Broken />
          </ErrorBoundary>
        </PreferencesProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: '這一頁出了點問題' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新整理' })).toBeInTheDocument()
    await waitFor(() => expect(sent.some((s) => s.path === '/api/book/errors')).toBe(true))
    expect(sent.find((s) => s.path === '/api/book/errors')!.body).toMatchObject({ kind: 'boundary', message: 'Error: render failed' })
    vi.mocked(console.error).mockRestore()
  })
})
