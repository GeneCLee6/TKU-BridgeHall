import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import type { Me, PendingList } from '../../src/lib/api.ts'
import { warmPages } from './warmPages.ts'

/** 待確認面板 (e8-t06, e8-t07, e8-t08) against a fake API */

type Answer = { status?: number; body?: unknown }
let routes: Record<string, Answer>
let sent: { method: string; path: string; body: unknown }[]

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})
beforeAll(() => Promise.all([warmPages(), import('../../src/pages/PendingPage.tsx'), import('../../src/pages/EditorPage.tsx')]), 60_000)

// The made-up fixture-alpha's 待確認 row (tests/fixtures)
const SLAM_TRY = '測試用的待確認說明：這一列是虛構的。'

beforeEach(() => {
  routes = { 'GET /api/book/manifest': { body: { version: 0, entries: [] } } }
  sent = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      const path = String(input)
      sent.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined })
      const a = routes[`${method} ${path}`]
      if (!a) return new Response(JSON.stringify({ error: '請先登入', code: 'signInFirst' }), { status: 401 })
      return new Response(JSON.stringify(a.body ?? {}), { status: a.status ?? 200 })
    }),
  )
})
afterEach(() => vi.unstubAllGlobals())

const signedIn = (permissions: Me['permissions']) => {
  routes['GET /api/me'] = { body: { user: { id: 'u1', username: 'amy', admin: false, permissions } } }
}
const list = (extra: Partial<PendingList> = {}): PendingList => ({
  open: [
    {
      slug: 'fixture-alpha',
      sectionId: 'responses',
      index: 0,
      text: SLAM_TRY,
      status: 'working',
      assignee: 'amy',
      note: '下週社課問',
      updatedAt: 1,
      updatedBy: 'ben',
    },
  ],
  closed: [],
  editors: ['amy', 'ben'],
  ...extra,
})
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
const card = (text: string) => screen.getByText(text).closest('article') as HTMLElement

describe('the 待確認 panel', () => {
  it('lists every note with its status, assignee and remark, and filters them', async () => {
    signedIn(['bookEdit'])
    routes['GET /api/book/pending'] = { body: list() }
    renderAt('/pending')
    await screen.findByText(SLAM_TRY, {}, { timeout: 5000 })
    const row = within(card(SLAM_TRY))
    expect(row.getByText('處理中')).toBeInTheDocument()
    expect(row.getByText('下週社課問')).toBeInTheDocument()
    expect(row.getByRole('link', { name: /佔位答叫表（測試）$/ })).toHaveAttribute('href', '/c/fixture-alpha/responses?pending=0')

    const total = screen.getAllByRole('article').length
    // Every note of the fixtures: a row, a rule and a whole section
    expect(total).toBe(3)
    await userEvent.click(screen.getByRole('checkbox', { name: '只看指派給我的' }))
    expect(screen.getAllByRole('article')).toHaveLength(1)
    await userEvent.click(screen.getByRole('checkbox', { name: '只看指派給我的' }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: '狀態' }), 'open')
    expect(screen.getAllByRole('article')).toHaveLength(total - 1)
  })

  it('lets every member read it, without the editors’ buttons', async () => {
    signedIn([])
    routes['GET /api/book/pending'] = { body: list() }
    renderAt('/pending')
    await screen.findByText(SLAM_TRY, {}, { timeout: 5000 })
    expect(screen.queryByRole('button', { name: /^更新/ })).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('saves a note’s status and assignee', async () => {
    signedIn(['bookEdit'])
    routes['GET /api/book/pending'] = { body: list({ open: [] }) }
    routes['PUT /api/book/pending/fixture-alpha/responses/0'] = { body: { meta: {} } }
    renderAt('/pending')
    await screen.findByText(SLAM_TRY, {}, { timeout: 5000 })
    await userEvent.click(within(card(SLAM_TRY)).getByRole('button', { name: /^更新/ }))
    const form = screen.getByRole('form', { name: '更新：佔位答叫表（測試）' })
    await userEvent.selectOptions(within(form).getByRole('combobox', { name: '狀態' }), 'parked')
    await userEvent.selectOptions(within(form).getByRole('combobox', { name: '負責人' }), 'ben')
    await userEvent.type(within(form).getByRole('textbox', { name: '備註' }), '等比賽後')
    await userEvent.click(within(form).getByRole('button', { name: '儲存' }))
    expect(await screen.findByText('已儲存。')).toBeInTheDocument()
    expect(sent.find((s) => s.method === 'PUT')?.body).toEqual({
      text: SLAM_TRY,
      status: 'parked',
      assignee: 'ben',
      note: '等比賽後',
      resolution: '',
    })
  })

  it('asks for the grounds before opening the editor at the note’s section (e8-t08)', async () => {
    signedIn(['bookEdit'])
    routes['GET /api/book/pending'] = { body: list({ open: [] }) }
    routes['PUT /api/book/pending/fixture-alpha/responses/0'] = { body: { meta: {} } }
    routes['GET /api/book/conventions/fixture-alpha/draft'] = { body: { draft: null } }
    renderAt('/pending')
    await screen.findByText(SLAM_TRY, {}, { timeout: 5000 })
    await userEvent.click(within(card(SLAM_TRY)).getByRole('button', { name: /^更新/ }))
    const form = screen.getByRole('form', { name: '更新：佔位答叫表（測試）' })
    await userEvent.click(within(form).getByRole('button', { name: '寫依據並修改內容' }))
    expect(within(form).getByRole('alert')).toHaveTextContent('請先寫關閉依據。')
    expect(sent.some((s) => s.method === 'PUT')).toBe(false)

    await userEvent.type(within(form).getByRole('textbox', { name: /^關閉依據/ }), '社長 10/28 確認')
    await userEvent.click(within(form).getByRole('button', { name: '寫依據並修改內容' }))
    await waitFor(() => expect(sent.find((s) => s.method === 'PUT')?.body).toMatchObject({ status: 'working', resolution: '社長 10/28 確認' }))
    // The editor opens at the note's section
    expect(await screen.findByRole('textbox', { name: /^段落標題/ }, { timeout: 5000 })).toHaveValue('佔位答叫表（測試）')
  })

  it('lists the notes closed by publishing, with their grounds', async () => {
    signedIn([])
    routes['GET /api/book/pending'] = {
      body: list({
        closed: [
          {
            slug: 'fixture-beta',
            sectionId: 'x',
            index: 0,
            text: '舊的問題',
            status: 'confirmed',
            resolution: '社長確認',
            updatedAt: 1,
            updatedBy: 'amy',
            closedAt: 2,
            closedBy: 'ben',
            closedVersion: 3,
          },
        ],
      }),
    }
    renderAt('/pending')
    const closed = await screen.findByRole('region', { name: '最近關閉' }, { timeout: 5000 })
    expect(within(closed).getByText('舊的問題')).toBeInTheDocument()
    expect(within(closed).getByText('關閉依據：社長確認')).toBeInTheDocument()
    expect(within(closed).getByText(/^ben 於 .* 發布第 3 版時關閉$/)).toBeInTheDocument()
  })
})
