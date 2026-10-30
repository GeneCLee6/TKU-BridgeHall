import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { conventions } from '../fixtures/content.ts'
import type { BookDraft, BookRevision, Me } from '../../src/lib/api.ts'
import type { Convention } from '../../src/types/convention.ts'
import { warmPages } from './warmPages.ts'

/** 審核 (e8-t04) and 與這版比較 (e8-t05) against a fake API */

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
beforeAll(() => Promise.all([warmPages(), import('../../src/pages/ReviewPage.tsx'), import('../../src/pages/EditorPage.tsx')]), 60_000)

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
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

const alpha = conventions.find((c) => c.slug === 'fixture-alpha')!
const changed: Convention = { ...alpha, summary: '草稿的摘要' }
const draft = (extra: Partial<BookDraft> = {}): BookDraft => ({
  slug: 'fixture-alpha',
  status: 'in-review',
  baseVersion: 0,
  revision: 4,
  convention: changed,
  note: '改摘要',
  createdAt: 1,
  createdBy: 'ben',
  updatedAt: 2,
  updatedBy: 'ben',
  reviewRequestedBy: 'ben',
  reviewRequestedAt: 2,
  ...extra,
})

describe('the review page (e8-t04)', () => {
  it('lists the drafts in review first, each linked to its review', async () => {
    signedIn(['bookEdit'])
    routes['GET /api/book/reviews'] = {
      body: {
        drafts: [
          { ...draft({ status: 'draft', slug: 'fixture-gamma', note: '' }), convention: undefined, nameZh: '測試草稿丙' },
          { ...draft(), convention: undefined, nameZh: '測試特約甲（虛構）' },
        ],
      },
    }
    renderAt('/review')
    const inReview = await screen.findByRole('region', { name: /^送審中/ }, { timeout: 5000 })
    expect(within(inReview).getByRole('link', { name: '測試特約甲（虛構）' })).toHaveAttribute('href', '/review/fixture-alpha')
    expect(within(inReview).getByText('改摘要')).toBeInTheDocument()
    const editing = screen.getByRole('region', { name: /^編輯中的草稿/ })
    expect(within(editing).getByRole('link', { name: '測試草稿丙' })).toHaveAttribute('href', '/review/fixture-gamma')
  })

  it('shows a draft against the published version, and lets a reviewer publish it', async () => {
    signedIn(['bookEdit', 'bookReview'])
    routes['GET /api/book/conventions/fixture-alpha/draft'] = { body: { draft: draft() } }
    routes['PUT /api/book/conventions/fixture-alpha'] = {
      body: { entry: { slug: 'fixture-alpha', version: 1, convention: changed, createdAt: 1, updatedAt: 3, updatedBy: 'amy', status: 'published' } },
    }
    routes['GET /api/book/reviews'] = { body: { drafts: [] } }
    renderAt('/review/fixture-alpha')
    const diff = await screen.findByRole('region', { name: '與目前的內建版本比較' }, { timeout: 5000 })
    const meta = await within(diff).findByRole('region', { name: '特約資料' })
    expect(meta).toHaveTextContent('摘要')
    expect(meta).toHaveTextContent(alpha.summary)
    expect(meta).toHaveTextContent('草稿的摘要')
    // Only the summary changed (and nothing in the sections)
    expect(within(diff).getAllByRole('region')).toHaveLength(1)
    expect(screen.getByText(/編輯者的說明：改摘要/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/^發布說明/), '校對過')
    await userEvent.click(screen.getByRole('button', { name: '發布' }))
    await waitFor(() => expect(sent.some((s) => s.method === 'PUT')).toBe(true))
    expect(sent.find((s) => s.method === 'PUT')!.body).toMatchObject({ baseVersion: 0, draftRevision: 4, note: '校對過', convention: { summary: '草稿的摘要' } })
    expect(await screen.findByText(/測試特約甲（虛構）：已發布（第 1 版）/)).toBeInTheDocument()
  })

  it('sends a draft back with why', async () => {
    signedIn(['bookEdit', 'bookReview'])
    routes['GET /api/book/conventions/fixture-alpha/draft'] = { body: { draft: draft() } }
    routes['POST /api/book/conventions/fixture-alpha/reject'] = {
      body: { draft: draft({ status: 'draft', revision: 5, reviewedBy: 'amy', reviewedAt: 3, reviewNote: '點力不符' }) },
    }
    renderAt('/review/fixture-alpha')
    await userEvent.type(await screen.findByLabelText('退回理由', undefined, { timeout: 5000 }), '點力不符')
    await userEvent.click(screen.getByRole('button', { name: '退回' }))
    expect(await screen.findByText('已退回草稿給編輯者。')).toBeInTheDocument()
    expect(sent.find((s) => s.path.endsWith('/reject'))!.body).toEqual({ draftRevision: 4, note: '點力不符' })
    expect(screen.getByText(/amy 在 .* 退回：點力不符/)).toBeInTheDocument()
    // Sent back, it is a draft again: nothing more to send back
    expect(screen.queryByRole('button', { name: '退回' })).toBeNull()
  })

  it('shows editors the differences but not the reviewers’ buttons', async () => {
    signedIn(['bookEdit'])
    routes['GET /api/book/conventions/fixture-alpha/draft'] = { body: { draft: draft() } }
    renderAt('/review/fixture-alpha')
    expect(await screen.findByText(/發布與退回要由審核者/, undefined, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '發布' })).toBeNull()
    expect(screen.getByRole('link', { name: '在編輯器打開' })).toHaveAttribute('href', '/edit/fixture-alpha')
  })
})

describe('與這版比較 in the version history (e8-t05)', () => {
  it('compares a saved version with the editor, and with another version', async () => {
    signedIn(['bookEdit'])
    const first: Convention = { ...alpha, nameEn: 'Alpha v1' }
    const second: Convention = { ...alpha, nameEn: 'Alpha v2' }
    const revision = (id: string, version: number, at: number): BookRevision => ({ id, slug: 'fixture-alpha', version, action: 'save', at, by: 'amy', note: '' })
    routes['GET /api/book/conventions/fixture-alpha/revisions'] = { body: { revisions: [revision('r2', 2, 2000), revision('r1', 1, 1000)] } }
    routes['GET /api/book/conventions/fixture-alpha/revisions/r1'] = { body: { revision: { ...revision('r1', 1, 1000), convention: first } } }
    routes['GET /api/book/conventions/fixture-alpha/revisions/r2'] = { body: { revision: { ...revision('r2', 2, 2000), convention: second } } }
    renderAt('/edit/fixture-alpha')
    await userEvent.click(await screen.findByRole('button', { name: '版本紀錄' }, { timeout: 5000 }))
    const compare = await screen.findAllByRole('button', { name: '與這版比較' })
    // The older one against what the editor has (the bundled convention)
    await userEvent.click(compare[1])
    const panel = await screen.findByRole('region', { name: /^版本比較/ })
    const meta = await within(panel).findByRole('region', { name: '特約資料' })
    expect(meta).toHaveTextContent('英文名稱')
    expect(meta).toHaveTextContent(alpha.nameEn)
    // Against the newer version: v1 before v2
    await userEvent.selectOptions(within(panel).getByLabelText('比較對象'), 'r2')
    await waitFor(() => expect(within(panel).getByRole('region', { name: '特約資料' })).toHaveTextContent(/v1.*v2/))
    await userEvent.click(within(panel).getByRole('button', { name: '關閉比較' }))
    expect(screen.queryByRole('region', { name: /^版本比較/ })).toBeNull()
  })
})
