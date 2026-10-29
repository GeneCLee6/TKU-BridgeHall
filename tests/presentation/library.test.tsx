import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import type { ArticleEntry, ArticleList } from '../../src/lib/api.ts'
import type { Article } from '../../src/types/article.ts'

/**
 * The library (E5 e5-t05, e5-t06, e5-t13) against a fake Worker. Articles live only online, so
 * every article here is test data, not library content.
 */

const PICTURE = 'article/0123456789abcdef01234567.webp'
/** Words only the Worker's search text has, so a hit proves the body was searched */
const BODY: Record<string, string> = { one: '王牌飛張的例子', two: '擠牌的三個條件' }

const article = (slug: string, extra: Partial<Article> = {}): Article => ({
  slug,
  title: `測試文章${slug}`,
  authors: ['測試作者甲'],
  series: 'squeeze',
  level: 'basic',
  summary: `測試摘要${slug}`,
  blocks: [
    { kind: 'heading', level: 2, text: '測試小標題' },
    { kind: 'paragraph', text: '測試段落' },
    { kind: 'quote', text: '測試引文', cite: '測試出處' },
    { kind: 'image', src: PICTURE, alt: '測試圖片' },
    { kind: 'rules', items: [{ text: '測試條列' }] },
    { kind: 'note', tone: 'info', text: '測試提示' },
  ],
  published: '2026-10-01',
  updated: '2026-10-02',
  license: 'own',
  ...extra,
})

const entry = (a: Article | null, slug = a?.slug ?? 'gone'): ArticleEntry => ({
  slug,
  version: 1,
  article: a,
  createdAt: 1,
  updatedAt: 2,
  updatedBy: 'amy',
  status: 'published',
  reviewedBy: 'amy',
  reviewedAt: 2,
})

type Answer = { status?: number; body?: unknown }
let routes: Record<string, Answer>
let sent: { method: string; path: string; body: unknown }[]
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

function serveArticles(articles: Article[], series: ArticleList['series'] = { version: 0, series: [] }) {
  const list: ArticleList = {
    version: articles.length,
    entries: articles.map((a) => {
      const { article: body, ...rest } = entry(a)
      const { blocks: _blocks, ...meta } = body as Article
      return { ...rest, meta }
    }),
    files: {},
    series,
  }
  routes['GET /api/book/articles'] = { body: list }
  routes['GET /api/book/articles?text=1'] = {
    body: { ...list, text: Object.fromEntries(articles.map((a) => [a.slug, `${a.summary} ${BODY[a.slug] ?? ''}`])) },
  }
  for (const a of articles) routes[`GET /api/book/articles/${a.slug}`] = { body: { entry: entry(a), files: {} } }
}

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
      import('../../src/pages/LibraryPage.tsx'),
      
      import('../../src/pages/AdminPage.tsx'),
      import('../../src/components/ReadingSettings.tsx'),
    ]),
  60_000,
)

beforeEach(() => {
  routes = {
    'GET /api/club/teams': { body: { teams: [] } },
    'GET /api/club/members': { body: { members: [] } },
    'GET /api/book/profiles': { body: { profiles: [] } },
    'GET /api/book/reviews': { body: { drafts: [] } },
    'GET /api/book/audit': { body: { entries: [] } },
    'GET /api/book/categories': { body: { version: 0, categories: [] } },
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

describe('the library page (e5-t05)', () => {
  it('puts articles on shelves by series, with a made-up cover when there is none', async () => {
    serveArticles([
      article('one'),
      article('two', { series: 'defence', level: 'advanced', authors: ['測試作者乙'] }),
    ])
    renderAt('/library')
    expect(await screen.findByRole('heading', { level: 1, name: '叢書' })).toBeInTheDocument()
    const squeeze = await screen.findByRole('region', { name: /^擠牌\s*\d+ 篇$/ })
    expect(within(squeeze).getByRole('link', { name: /測試文章one/ })).toHaveAttribute('href', '/library/one')
    expect(screen.getByRole('region', { name: /^防守\s*\d+ 篇$/ })).toHaveTextContent('測試文章two')
    // Built-in series without articles are left out
    expect(screen.queryByRole('region', { name: /^社史\s*\d+ 篇$/ })).not.toBeInTheDocument()
    expect(screen.getByText('共 2 篇')).toBeInTheDocument()
  })

  it('filters by series, level and author, and searches the words of the articles (e5-t13)', async () => {
    serveArticles([article('one'), article('two', { series: 'defence', level: 'advanced', authors: ['測試作者乙'] })])
    renderAt('/library')
    await userEvent.selectOptions(await screen.findByRole('combobox', { name: '程度' }), 'advanced')
    expect(screen.getByText('1／2 篇')).toBeInTheDocument()
    expect(screen.queryByText('測試文章one')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '清除篩選' }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: '作者' }), '測試作者甲')
    expect(screen.getByText('1／2 篇')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '清除篩選' }))

    await userEvent.type(screen.getByRole('searchbox', { name: '搜尋叢書' }), '擠牌的三個條件')
    expect(screen.getByRole('link', { name: /測試文章two/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /測試文章one/ })).not.toBeInTheDocument()
  })

  it('opens on a series from the address', async () => {
    serveArticles([article('one'), article('two', { series: 'defence' })])
    renderAt('/library?series=defence')
    expect(await screen.findByText('1／2 篇')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '系列' })).toHaveValue('defence')
  })

  it('says so when the library is empty or cannot be reached', async () => {
    serveArticles([])
    const { unmount } = renderAt('/library')
    expect(await screen.findByText('叢書還沒有文章。')).toBeInTheDocument()
    unmount()
    routes['GET /api/book/articles?text=1'] = { status: 503, body: { error: '伺服器忙碌' } }
    renderAt('/library')
    expect(await screen.findByRole('alert')).toHaveTextContent('叢書暫時載入不了')
  })
})

describe('the article page (e5-t05)', () => {
  it('shows the article with every block kind, its series and its details', async () => {
    serveArticles([article('one')])
    renderAt('/library/one')
    expect(await screen.findByRole('heading', { level: 1, name: '測試文章one' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '測試小標題' })).toBeInTheDocument()
    expect(screen.getByText('測試段落')).toBeInTheDocument()
    expect(screen.getByText('測試引文')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '測試圖片' })).toBeInTheDocument()
    expect(screen.getByText('測試條列')).toBeInTheDocument()
    expect(screen.getByText('測試提示')).toBeInTheDocument()
    expect(screen.getByText('測試作者甲')).toBeInTheDocument()
    expect(screen.getByText('社團自撰')).toBeInTheDocument()
    expect(screen.getByText('2026-10-02 更新')).toBeInTheDocument()
    const trail = screen.getByRole('navigation', { name: '叢書導覽' })
    expect(within(trail).getByRole('link', { name: '擠牌' })).toHaveAttribute('href', '/library?series=squeeze')
    await waitFor(() => expect(document.title).toMatch(/^測試文章one｜/))
  })

  it('tells a signed-out reader an article may be for members only', async () => {
    routes['GET /api/book/articles/club-only'] = { status: 404, body: { error: '找不到這篇文章', code: 'articleGone' } }
    renderAt('/library/club-only')
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('找不到這篇文章')
    expect(within(alert).getByRole('link', { name: '登入' })).toHaveAttribute('href', '/login?next=%2Flibrary%2Fclub-only')
  })

  it('does not show an article whose shape is broken', async () => {
    routes['GET /api/book/articles/broken'] = { body: { entry: entry({ ...article('broken'), license: 'public' } as unknown as Article), files: {} } }
    renderAt('/library/broken')
    expect(await screen.findByRole('alert')).toHaveTextContent('格式有問題')
  })
})

describe('searching articles from the search box (e5-t13)', () => {
  it('finds an article by the words of its body and links to its page', async () => {
    serveArticles([article('one')])
    renderAt('/')
    const box = await screen.findByRole('searchbox')
    await userEvent.click(box)
    await waitFor(() => expect(sent.some((s) => s.path === '/api/book/articles?text=1')).toBe(true))
    await userEvent.type(box, '王牌飛張的例子')
    expect(await screen.findByRole('link', { name: /叢書 › 測試文章one/ })).toHaveAttribute('href', '/library/one')
  })
})

describe('series on the admin page (e5-t06)', () => {
  beforeEach(() => {
    routes['GET /api/me'] = { body: { user: { id: 'u1', username: 'amy', admin: false, permissions: ['bookEdit'] } } }
  })

  it('starts from the built-in series, keeps one with articles and saves the whole list', async () => {
    serveArticles([article('one')])
    routes['PUT /api/book/series'] = {
      body: { version: 1, series: [{ id: 'squeeze', label: '擠牌法', description: '', order: 0 }], updatedAt: 5, updatedBy: 'amy' },
    }
    renderAt('/admin')
    const panel = await screen.findByRole('region', { name: '叢書系列' })
    expect(await within(panel).findByText('目前是內建的系列，還沒有在線上改過。')).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: /^刪除「擠牌」：還有 1 篇文章/ })).toBeDisabled()
    await userEvent.click(within(panel).getByRole('button', { name: '刪除「社史」' }))
    const name = within(panel).getByRole('textbox', { name: '系列「擠牌」的名稱' })
    await userEvent.clear(name)
    await userEvent.type(name, '擠牌法')
    await userEvent.click(within(panel).getByRole('button', { name: '儲存系列' }))
    expect(await within(panel).findByText('已儲存')).toBeInTheDocument()
    const save = sent.find((s) => s.method === 'PUT' && s.path === '/api/book/series')!
    expect(save.body).toMatchObject({ baseVersion: 0 })
    const ids = (save.body as { series: { id: string; label: string }[] }).series.map((s) => s.id)
    expect(ids).not.toContain('club-history')
    expect(ids).toContain('squeeze')
  })
})
