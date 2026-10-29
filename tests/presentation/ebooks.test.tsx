import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import type { Me } from '../../src/lib/api.ts'
import type { Ebook } from '../../src/lib/ebooks.ts'

/**
 * 電子書 (e5-t09, e5-t11, e5-t15) against a fake API. The reader itself (pdf.js on a canvas) is
 * not drawn in jsdom: these check the list, the book page's details, who gets the upload form, and
 * what the page says when the Worker leaves a members-only book out.
 */

type Answer = { status?: number; body?: unknown }
let routes: Record<string, Answer>
let sent: { method: string; path: string; body: unknown }[]

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

const book: Ebook = {
  id: 'b1',
  title: '主打技巧',
  authors: ['甲', '乙'],
  series: '主打',
  year: 2024,
  license: 'own',
  fileKey: 'ebook/000000000000000000000001.pdf',
  size: 3 * 1024 * 1024,
  uploadedBy: 'r',
  createdAt: 1,
  updatedAt: 1,
  updatedBy: 'r',
}

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})
beforeAll(() => import('../../src/pages/EbookPages.tsx'), 60_000)

beforeEach(() => {
  routes = {}
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

const signedIn = (me: Partial<Me>) => {
  routes['GET /api/me'] = { body: { user: { id: 'u1', username: 'amy', admin: false, permissions: [], ...me } } }
}
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

describe('e-books', () => {
  it('lists the books by series, and tells someone signed out that members-only ones need signing in', async () => {
    routes['GET /api/book/ebooks'] = { body: { ebooks: [book], files: {} } }
    renderAt('/library/book')
    expect(await screen.findByRole('heading', { level: 2, name: '主打' }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /主打技巧/ })).toHaveAttribute('href', '/library/book/b1')
    expect(screen.getByText(/2024 年 · 社團自撰/)).toBeInTheDocument()
    expect(await screen.findByText(/有些書僅限社員閱讀/)).toBeInTheDocument()
    // Only reviewers upload
    expect(screen.queryByRole('heading', { name: '上傳電子書' })).toBeNull()
  })

  it('gives reviewers the upload form, with the license to choose, and editors the storage usage', async () => {
    signedIn({ permissions: ['bookEdit', 'bookReview'] })
    routes['GET /api/book/ebooks'] = {
      body: { ebooks: [], files: {}, usage: { bytes: 8.5 * 1024 ** 3, warnBytes: 8 * 1024 ** 3, maxBytes: 10 * 1024 ** 3 } },
    }
    renderAt('/library/book')
    expect(await screen.findByRole('heading', { name: '上傳電子書' }, { timeout: 5000 })).toBeInTheDocument()
    expect(await screen.findByText('檔案空間已用 8.5 GB／10.0 GB')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('快到免費上限')
    const licenses = screen.getAllByRole('radio')
    expect(licenses).toHaveLength(3)
    expect(licenses.every((r) => !(r as HTMLInputElement).checked)).toBe(true)

    await userEvent.type(screen.getByLabelText('書名'), '防守')
    await userEvent.type(screen.getByLabelText(/^作者/), '丙')
    await userEvent.type(screen.getByLabelText(/^系列/), '防守')
    await userEvent.click(screen.getByRole('radio', { name: /僅社員可看/ }))
    expect(screen.getByRole('radio', { name: /僅社員可看/ })).toBeChecked()
  })

  it("shows a book's details and license", async () => {
    routes['GET /api/book/ebooks/b1'] = { body: { ebook: book, files: {} } }
    renderAt('/library/book/b1')
    expect(await screen.findByRole('heading', { level: 1, name: '主打技巧' }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText('甲、乙')).toBeInTheDocument()
    expect(screen.getByText(/主打 · 2024 年 · 3.0 MB/)).toBeInTheDocument()
    expect(screen.getByText(/授權：社團自撰/)).toBeInTheDocument()
    // No signed address (no bucket yet): no reader
    expect(screen.getByRole('alert')).toHaveTextContent('這本書的檔案現在讀不到')
  })

  it('asks someone signed out to sign in when a book is not there for them (AC-5.6)', async () => {
    routes['GET /api/book/ebooks/b2'] = { status: 404, body: { error: '找不到這本書', code: 'ebookGone' } }
    renderAt('/library/book/b2')
    expect(await screen.findByText(/如果是僅限社員的書，請先登入/, {}, { timeout: 5000 })).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: '登入' }).map((a) => a.getAttribute('href'))
    expect(links).toContain('/login?next=%2Flibrary%2Fbook%2Fb2')
  })
})
