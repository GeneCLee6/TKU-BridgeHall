import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import type { ArticleEntry } from '../../src/lib/api.ts'
import type { ReadingPlace } from '../../src/lib/reading.ts'
import type { Article } from '../../src/types/article.ts'
import type { Ebook } from '../../src/lib/ebooks.ts'
import { READER } from '../setup.ts'

// pdf.js does not draw in jsdom: a stand-in that says where it opened and turns one page
vi.mock('../../src/components/PdfReader.tsx', () => ({
  PdfReader: ({ initialPage = 1, onPage }: { initialPage?: number; onPage?: (page: number, pages: number) => void }) => (
    <p>
      reader at {initialPage}
      <button type="button" onClick={() => onPage?.(initialPage + 1, 200)}>
        next page
      </button>
    </p>
  ),
}))

/** 閱讀進度 and 「繼續閱讀」 (e5-t14, AC-5.8) against a fake Worker; the article is test data */

const article: Article = {
  slug: 'reading-test',
  title: '測試閱讀文章',
  authors: ['測試作者'],
  series: 'squeeze',
  level: 'basic',
  summary: '',
  blocks: [
    { kind: 'heading', level: 2, text: '測試小標題一' },
    { kind: 'paragraph', text: '測試段落一' },
    { kind: 'heading', level: 2, text: '測試小標題二' },
    { kind: 'paragraph', text: '測試段落二' },
  ],
  published: '2026-10-01',
  updated: '2026-10-01',
  license: 'own',
}
const entry: ArticleEntry = {
  slug: article.slug,
  version: 1,
  article,
  createdAt: 1,
  updatedAt: 1,
  updatedBy: 'amy',
  status: 'published',
  reviewedBy: 'amy',
  reviewedAt: 1,
}
const book: Ebook = {
  id: '0123456789ab',
  title: '測試電子書',
  authors: ['甲'],
  series: '測試',
  license: 'own',
  fileKey: 'ebook/000000000000000000000001.pdf',
  size: 1024,
  uploadedBy: 'r',
  createdAt: 1,
  updatedAt: 1,
  updatedBy: 'r',
}
const places: ReadingPlace[] = [
  { kind: 'article', id: article.slug, title: article.title, place: 2, of: 4, at: Date.UTC(2026, 9, 28, 4) },
  { kind: 'ebook', id: '0123456789ab', title: '測試電子書', place: 50, of: 200, at: Date.UTC(2026, 9, 27, 4) },
]

type Answer = { status?: number; body?: unknown }
let routes: Record<string, Answer>
let sent: { method: string; path: string; body: unknown }[]
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})
beforeAll(
  () =>
    Promise.all([
      import('../../src/pages/AccountPage.tsx'),
      import('../../src/pages/LibraryPage.tsx'),
      import('../../src/pages/EbookPages.tsx'),
    ]),
  60_000,
)

beforeEach(() => {
  routes = {
    'GET /api/me': { body: { user: READER } },
    'GET /api/book/reading': { body: { places } },
    'PUT /api/book/reading': { body: { place: places[0] } },
    'DELETE /api/book/reading': { body: { ok: true } },
    [`GET /api/book/articles/${article.slug}`]: { body: { entry, files: {} } },
    [`GET /api/book/ebooks/${book.id}`]: { body: { ebook: book, files: { [book.fileKey]: { url: '/api/files/x' } } } },
    'GET /api/book/articles': { body: { version: 1, entries: [], files: {}, series: { version: 0, series: [] } } },
  }
  sent = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      const path = String(input)
      sent.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined })
      const answer = routes[`${method} ${path}`]
      if (!answer) return json(401, { error: '請先登入', code: 'signInFirst' })
      return json(answer.status ?? 200, answer.body ?? {})
    }),
  )
})
afterEach(() => vi.unstubAllGlobals())

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
const WAIT = { timeout: 10_000 }

describe('「繼續閱讀」 on 我的帳號', () => {
  it('lists the places, newest first, each a link back to the block or page', async () => {
    renderAt('/account')
    const panel = await screen.findByRole('region', { name: '繼續閱讀' }, WAIT)
    const links = await within(panel).findAllByRole('link')
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['測試閱讀文章', '/library/reading-test?at=2'],
      ['測試電子書', '/library/book/0123456789ab?page=50'],
    ])
    expect(panel).toHaveTextContent('文章 · 讀到第 3／4 段')
    expect(panel).toHaveTextContent('電子書 · 讀到第 50／200 頁')
    expect(within(panel).getByRole('progressbar', { name: '《測試電子書》讀了多少' })).toHaveAttribute('value', '25')
  })

  it('takes one off the list', async () => {
    renderAt('/account')
    const panel = await screen.findByRole('region', { name: '繼續閱讀' }, WAIT)
    await userEvent.click(await within(panel).findByRole('button', { name: '從繼續閱讀拿掉《測試電子書》' }))
    await waitFor(() => expect(within(panel).queryByRole('link', { name: '測試電子書' })).toBeNull())
    expect(sent.find((r) => r.method === 'DELETE')).toEqual({
      method: 'DELETE',
      path: '/api/book/reading',
      body: { kind: 'ebook', id: '0123456789ab' },
    })
  })

  it('says so when there is nothing yet', async () => {
    routes['GET /api/book/reading'] = { body: { places: [] } }
    renderAt('/account')
    const panel = await screen.findByRole('region', { name: '繼續閱讀' }, WAIT)
    expect(await within(panel).findByText(/還沒有讀過的文章或電子書/)).toBeInTheDocument()
    expect(within(panel).getByRole('link', { name: '去叢書看看' })).toHaveAttribute('href', '/library')
  })
})

describe('the article page keeps the place (e5-t14)', () => {
  it('offers to go back to the kept place, and keeps the place reached when left', async () => {
    const view = renderAt(`/library/${article.slug}`)
    expect(await screen.findByRole('heading', { level: 1, name: article.title }, WAIT)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '接著上次讀：第 3／4 段' })).toBeInTheDocument()
    // Leaving the page saves at once; jsdom lays nothing out, so the reader is at the end
    view.unmount()
    await waitFor(() =>
      expect(sent.find((r) => r.method === 'PUT')?.body).toEqual({
        reading: { kind: 'article', id: article.slug, title: article.title, place: 3, of: 4 },
      }),
    )
  })

  it('opened at a block, it does not ask', async () => {
    renderAt(`/library/${article.slug}?at=2`)
    expect(await screen.findByRole('heading', { level: 1, name: article.title }, WAIT)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /接著上次讀/ })).toBeNull()
    expect(sent.some((r) => r.path === '/api/book/reading' && r.method === 'GET')).toBe(false)
  })
})

describe('the e-book page keeps the page (e5-t14)', () => {
  it('opens where the member left off, and keeps each page turned', async () => {
    const view = renderAt(`/library/book/${book.id}`)
    expect(await screen.findByText('reader at 50', {}, WAIT)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'next page' }))
    view.unmount()
    await waitFor(() =>
      expect(sent.find((r) => r.method === 'PUT')?.body).toEqual({
        reading: { kind: 'ebook', id: book.id, title: book.title, place: 51, of: 200 },
      }),
    )
  })

  it('opens at the page in the address', async () => {
    renderAt(`/library/book/${book.id}?page=7`)
    expect(await screen.findByText('reader at 7', {}, WAIT)).toBeInTheDocument()
  })
})
