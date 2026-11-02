import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { warmPages } from './warmPages.ts'

/**
 * 用 Google 登入 and 用 LINE 登入 (TKU-BridgeTable e1-t31, e1-t32) against a fake Worker: each
 * branded button only when the table has that provider, the way there with this site's origin and
 * ?next=, the code step for 兩步驟登入 and the errors the Worker sends the browser back with.
 */

type Answer = { status?: number; body?: unknown } | (() => { status?: number; body?: unknown })
let routes: Record<string, Answer>
let sent: { method: string; path: string; body: unknown }[]

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })
const SIGNED_OUT = { status: 401, body: { error: '請先登入', code: 'signInFirst' } }

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
  localStorage.clear()
  routes = { 'GET /api/me': SIGNED_OUT, 'GET /api/auth/google': { body: { enabled: true } } }
  sent = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      const path = String(input)
      sent.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined })
      const answer = routes[`${method} ${path}`]
      if (!answer) return json(404, { error: '沒有這個 API', code: 'noSuchApi' })
      const a = typeof answer === 'function' ? answer() : answer
      return json(a.status ?? 200, a.body ?? {})
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

describe('用 Google 登入 (table e1-t31)', () => {
  it('has no Google button when the table has no Google sign-in', async () => {
    routes['GET /api/auth/google'] = { body: { enabled: false } }
    renderAt('/login')
    await screen.findByLabelText(/^密碼/)
    await vi.waitFor(() => expect(sent.some((s) => s.path === '/api/auth/google')).toBe(true))
    expect(screen.queryByRole('button', { name: '使用 Google 帳戶登入' })).toBeNull()
  })

  it('goes to Google with this site’s origin and the page to come back to', async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, origin: window.location.origin, assign })
    routes['POST /api/auth/google/start'] = { body: { url: 'https://accounts.google.com/o/oauth2/v2/auth?x=1' } }
    renderAt('/login?next=/c/fixture-alpha')
    await userEvent.click(await screen.findByRole('button', { name: '使用 Google 帳戶登入' }))
    await vi.waitFor(() => expect(assign).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/v2/auth?x=1'))
    expect(sent.find((s) => s.path === '/api/auth/google/start')!.body).toEqual({
      origin: window.location.origin,
      returnTo: '/c/fixture-alpha',
    })
  })

  it('says what went wrong when the Worker sends the browser back with an error', async () => {
    renderAt('/login?google=error&code=googleNotLinked')
    expect(await screen.findByRole('alert')).toHaveTextContent('這個 Google 帳號還沒有綁定社團帳號')
  })

  it('asks only for the 兩步驟登入 code after Google, then goes where the member was', async () => {
    const answers = [
      { status: 401, body: { error: '驗證碼不正確或已經用過，請輸入 App 上現在的驗證碼', code: 'twoFactorWrong' } },
      { body: { user: { id: 'u1', username: 'amy', admin: true, permissions: [] }, returnTo: '/c/fixture-alpha' } },
    ]
    routes['POST /api/auth/google/code'] = () => {
      const answer = answers.shift()!
      if (!answer.status) routes['GET /api/me'] = { body: { user: { id: 'u1', username: 'amy', admin: true, permissions: [] } } }
      return answer
    }
    renderAt('/login?google=code')
    const code = await screen.findByLabelText(/^驗證碼/)
    expect(screen.queryByLabelText(/^密碼/)).toBeNull()
    await userEvent.type(code, '000000')
    await userEvent.click(screen.getByRole('button', { name: '登入' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('驗證碼不正確')
    await userEvent.clear(code)
    await userEvent.type(code, '123456')
    await userEvent.click(screen.getByRole('button', { name: '登入' }))
    expect(await screen.findByRole('heading', { level: 1, name: '測試特約甲（虛構）' }, { timeout: 5000 })).toBeInTheDocument()
    expect(sent.filter((s) => s.path === '/api/auth/google/code').map((s) => s.body)).toEqual([{ code: '000000' }, { code: '123456' }])
  })

  it('goes back to the sign-in form from the code step', async () => {
    renderAt('/login?google=code')
    await userEvent.click(await screen.findByRole('button', { name: '改用帳號密碼登入' }))
    expect(await screen.findByLabelText(/^密碼/)).toBeInTheDocument()
  })
})

describe('用 LINE 登入 (table e1-t32)', () => {
  beforeEach(() => {
    routes['GET /api/auth/line'] = { body: { enabled: true } }
  })

  it('shows Google’s and LINE’s own buttons, each with its inline logo', async () => {
    renderAt('/login')
    const google = await screen.findByRole('button', { name: '使用 Google 帳戶登入' })
    const line = await screen.findByRole('button', { name: '用 LINE 登入' })
    for (const button of [google, line]) {
      expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
      expect(button.querySelector('img')).toBeNull()
    }
    expect(google.querySelectorAll('svg path')).toHaveLength(4)
  })

  it('shows only LINE when the table has only LINE', async () => {
    routes['GET /api/auth/google'] = { body: { enabled: false } }
    renderAt('/login')
    await screen.findByRole('button', { name: '用 LINE 登入' })
    expect(screen.queryByRole('button', { name: '使用 Google 帳戶登入' })).toBeNull()
  })

  it('goes to LINE with this site’s origin and the page to come back to', async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, origin: window.location.origin, assign })
    routes['POST /api/auth/line/start'] = { body: { url: 'https://access.line.me/oauth2/v2.1/authorize?x=1' } }
    renderAt('/login?next=/c/fixture-alpha')
    await userEvent.click(await screen.findByRole('button', { name: '用 LINE 登入' }))
    await vi.waitFor(() => expect(assign).toHaveBeenCalledWith('https://access.line.me/oauth2/v2.1/authorize?x=1'))
    expect(sent.find((s) => s.path === '/api/auth/line/start')!.body).toEqual({ origin: window.location.origin, returnTo: '/c/fixture-alpha' })
  })

  it('says what went wrong at LINE', async () => {
    renderAt('/login?line=error&code=lineNotLinked')
    expect(await screen.findByRole('alert')).toHaveTextContent('這個 LINE 帳號還沒有綁定社團帳號')
  })

  it('asks only for the 兩步驟登入 code after LINE, at LINE’s own route', async () => {
    routes['POST /api/auth/line/code'] = () => {
      routes['GET /api/me'] = { body: { user: { id: 'u1', username: 'amy', admin: true, permissions: [] } } }
      return { body: { user: { id: 'u1', username: 'amy', admin: true, permissions: [] }, returnTo: '/c/fixture-alpha' } }
    }
    renderAt('/login?line=code')
    expect(await screen.findByText(/用 LINE 登入也要輸入/)).toBeInTheDocument()
    await userEvent.type(await screen.findByLabelText(/^驗證碼/), '123456')
    await userEvent.click(screen.getByRole('button', { name: '登入' }))
    expect(await screen.findByRole('heading', { level: 1, name: '測試特約甲（虛構）' }, { timeout: 5000 })).toBeInTheDocument()
    expect(sent.filter((s) => s.path === '/api/auth/line/code').map((s) => s.body)).toEqual([{ code: '123456' }])
  })
})
