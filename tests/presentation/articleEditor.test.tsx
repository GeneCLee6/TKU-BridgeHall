import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import type { ArticleDraft, ArticleEntry, ArticleList } from '../../src/lib/api.ts'
import type { Article } from '../../src/types/article.ts'

/**
 * The article editor (e5-t07, AC-5.2, AC-5.3) and article import's way into it (e5-t08), against a
 * fake Worker. Every article here is test data, not library content.
 */

const EDITOR = { id: 'ed', username: 'ed', admin: false, permissions: ['bookEdit', 'bookImport'] }
const REVIEWER = { id: 'rita', username: 'rita', admin: false, permissions: ['bookEdit', 'bookReview'] }

const article = (slug: string, extra: Partial<Article> = {}): Article => ({
  slug,
  title: `測試文章${slug}`,
  authors: ['測試作者'],
  series: 'squeeze',
  summary: '測試摘要',
  blocks: [{ kind: 'paragraph', text: '測試段落' }],
  published: '2026-10-01',
  updated: '2026-10-01',
  license: 'own',
  ...extra,
})

const entry = (a: Article, version = 1): ArticleEntry => ({
  slug: a.slug,
  version,
  article: a,
  createdAt: 1,
  updatedAt: 2,
  updatedBy: 'rita',
  status: 'published',
  reviewedBy: 'rita',
  reviewedAt: 2,
})

const draftOf = (a: Article, extra: Partial<ArticleDraft> = {}): ArticleDraft => ({
  slug: a.slug,
  status: 'draft',
  baseVersion: 1,
  revision: 1,
  article: a,
  note: '',
  createdAt: 3,
  createdBy: 'ed',
  updatedAt: 3,
  updatedBy: 'ed',
  ...extra,
})

type Answer = { status?: number; body?: unknown }
let routes: Record<string, Answer>
let sent: { method: string; path: string; body: unknown }[]
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

function serve(user: typeof EDITOR, articles: Article[]) {
  const list: ArticleList = {
    version: articles.length,
    entries: articles.map((a) => {
      const { article: body, ...rest } = entry(a)
      const { blocks: _blocks, ...meta } = body as Article
      return { ...rest, meta }
    }),
    files: {},
    series: { version: 0, series: [] },
  }
  routes['GET /api/me'] = { body: { user } }
  routes['GET /api/book/articles'] = { body: list }
  routes['GET /api/book/articles?text=1'] = { body: { ...list, text: {} } }
  for (const a of articles) {
    routes[`GET /api/book/articles/${a.slug}`] = { body: { entry: entry(a), files: {} } }
    routes[`GET /api/book/articles/${a.slug}/draft`] = { body: { draft: null } }
  }
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
      import('../../src/pages/ArticleEditorPage.tsx'),
      import('../../src/pages/LibraryPage.tsx'),
      import('../../src/pages/ReviewPage.tsx'),
      import('../../src/components/board/DealInput.tsx'),
      import('../../src/components/ReadingSettings.tsx'),
    ]),
  60_000,
)

beforeEach(() => {
  window.localStorage.clear()
  routes = {
    'GET /api/club/teams': { body: { teams: [] } },
    'GET /api/book/profiles': { body: { profiles: [] } },
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
      if (!answer) return json(404, { error: '找不到', code: 'noSuchApi' })
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

const lastSent = (method: string, path: string) => [...sent].reverse().find((x) => x.method === method && x.path === path)

describe('the article editor (e5-t07)', () => {
  it('writes a new article with a deal entered card by card, and saves it as a draft', async () => {
    const user = userEvent.setup()
    serve(EDITOR, [article('one')])
    routes['PUT /api/book/articles/new-one/draft'] = {
      body: { draft: draftOf(article('new-one'), { baseVersion: 0 }) },
    }
    renderAt('/library/new')
    expect(await screen.findByRole('heading', { level: 1, name: '新增文章' }, { timeout: 10_000 })).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: '標題' }), '測試新文章')
    await user.type(screen.getByRole('textbox', { name: /^網址代稱/ }), 'one')
    expect(screen.getByText('這個網址代稱已經有文章了')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /^網址代稱/ }), '-x')
    await user.clear(screen.getByRole('textbox', { name: /^網址代稱/ }))
    await user.type(screen.getByRole('textbox', { name: /^網址代稱/ }), 'new-one')
    await user.type(screen.getByRole('textbox', { name: /^文字/ }), '測試段落')

    // A deal (AC-5.3): G4's DealInput, a seat may stay empty
    await user.selectOptions(screen.getByRole('combobox', { name: '新增區塊' }), '牌例（四家牌）')
    await user.click(screen.getByRole('button', { name: '新增牌例（四家牌）' }))
    const deal = await screen.findByRole('region', { name: '牌例（四家牌） 2' })
    const panel = await within(deal).findByRole('group', { name: '選牌' }, { timeout: 10_000 })
    await user.click(within(panel).getByRole('button', { name: '黑桃A' }))
    await user.click(within(panel).getByRole('button', { name: '紅心K' }))

    // The card play, one trick a line
    await user.selectOptions(screen.getByRole('combobox', { name: '新增區塊' }), '出牌過程')
    await user.click(screen.getByRole('button', { name: '新增出牌過程' }))
    const play = screen.getByRole('region', { name: '出牌過程 3' })
    await user.type(within(play).getByRole('textbox', { name: /^合約/ }), '3nt')
    await user.type(within(play).getByRole('textbox', { name: /^每一墩的牌/ }), 'SA S2 S3 S4')

    await user.click(screen.getByRole('button', { name: '存草稿' }))
    await waitFor(() => expect(lastSent('PUT', '/api/book/articles/new-one/draft')).toBeDefined())
    const body = lastSent('PUT', '/api/book/articles/new-one/draft')!.body as { article: Article; baseVersion: number; draftRevision: number }
    expect(body).toMatchObject({ baseVersion: 0, draftRevision: 0 })
    expect(body.article).toMatchObject({ slug: 'new-one', title: '測試新文章', license: 'members-only', series: 'declarer-play' })
    expect(body.article.blocks).toEqual([
      { kind: 'paragraph', text: '測試段落' },
      { kind: 'deal', deal: { hands: { N: ['SA', 'HK'], E: [], S: [], W: [] }, dealer: 'N', vul: 'None' } },
      { kind: 'play', contract: '3N', declarer: 'S', tricks: [['SA', 'S2', 'S3', 'S4']] },
    ])
    // Editors save and send for review; publishing is the reviewers'
    expect(screen.queryByRole('button', { name: '發布' })).not.toBeInTheDocument()
  }, 30_000)

  it('names what must be fixed before saving', async () => {
    const user = userEvent.setup()
    serve(EDITOR, [])
    renderAt('/library/new')
    await user.click(await screen.findByRole('button', { name: '送審' }, { timeout: 10_000 }))
    const alert = await screen.findByText('存檔前要修正：')
    expect(alert).toHaveTextContent('網址代稱')
    expect(alert).toHaveTextContent('標題')
    expect(sent.some((x) => x.method === 'PUT')).toBe(false)
  }, 20_000)

  it('lets a reviewer publish a draft sent for review, or send it back', async () => {
    const user = userEvent.setup()
    const one = article('one')
    serve(REVIEWER, [one])
    const changed = article('one', { title: '改過的標題' })
    routes['GET /api/book/articles/one/draft'] = {
      body: { draft: draftOf(changed, { status: 'in-review', revision: 2, reviewRequestedBy: 'ed', reviewRequestedAt: 3, note: '改標題' }) },
    }
    routes['PUT /api/book/articles/one'] = { body: { entry: entry(changed, 2) } }
    routes['POST /api/book/articles/one/reject'] = { body: { draft: draftOf(changed, { revision: 3, reviewedBy: 'rita', reviewedAt: 4, reviewNote: '再看看' }) } }
    renderAt('/library/one/edit')
    expect(await screen.findByDisplayValue('改過的標題', {}, { timeout: 10_000 })).toBeInTheDocument()
    expect(screen.getByText(/ed 於 .* 送審中/)).toBeInTheDocument()
    // The slug of a published article does not change
    expect(screen.getByRole('textbox', { name: /^網址代稱/ })).toBeDisabled()

    await user.type(screen.getByRole('textbox', { name: '退回的原因' }), '再看看')
    await user.click(screen.getByRole('button', { name: '退回' }))
    await screen.findByText('已退回給編輯者。')
    expect(lastSent('POST', '/api/book/articles/one/reject')!.body).toEqual({ draftRevision: 2, note: '再看看' })

    await user.click(screen.getByRole('button', { name: '發布這份草稿' }))
    await screen.findByText('已發布第 2 版。')
    expect(lastSent('PUT', '/api/book/articles/one')!.body).toMatchObject({ baseVersion: 1, draftRevision: 3, article: { title: '改過的標題' } })
  }, 30_000)

  it('opens what AI import made from a file, with its notes, keeping the license of the one it updates', async () => {
    serve(EDITOR, [article('one')])
    const imported = article('one', { title: '匯入的標題', license: 'members-only' })
    routes['GET /api/book/drafts/d1'] = {
      body: {
        draft: {
          id: 'd1',
          fileName: '講義.docx',
          createdAt: 1,
          createdBy: 'ed',
          conventions: 0,
          articles: 1,
          result: { articles: [{ replaces: 'one', article: imported, problems: [] }], reviewNotes: '第 3 頁的圖無法轉' },
        },
      },
    }
    renderAt('/library/one/edit?draft=d1&n=0')
    expect(await screen.findByDisplayValue('匯入的標題', {}, { timeout: 10_000 })).toBeInTheDocument()
    expect(screen.getByText(/第 3 頁的圖無法轉/)).toBeInTheDocument()
    expect(screen.getByText(/AI 匯入只能逐字轉錄/)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /^授權/ })).toHaveValue('own')
  }, 20_000)
})

describe('ways into the editor', () => {
  it('shows editors 新增文章 and 匯入文章 on the library, and 編輯這篇 on an article', async () => {
    serve(EDITOR, [article('one')])
    const { unmount } = renderAt('/library')
    expect(await screen.findByRole('link', { name: '新增文章' }, { timeout: 10_000 })).toHaveAttribute('href', '/library/new')
    expect(screen.getByRole('link', { name: '匯入文章' })).toHaveAttribute('href', '/import?target=articles')
    unmount()
    renderAt('/library/one')
    expect(await screen.findByRole('link', { name: '編輯這篇' }, { timeout: 10_000 })).toHaveAttribute('href', '/library/one/edit')
  }, 20_000)

  it('lists article drafts on the review page', async () => {
    serve(REVIEWER, [])
    routes['GET /api/book/reviews'] = {
      body: { drafts: [], articles: [{ ...draftOf(article('one')), article: undefined, status: 'in-review', title: '測試送審文章' }] },
    }
    renderAt('/review')
    expect(await screen.findByRole('link', { name: '測試送審文章' }, { timeout: 10_000 })).toHaveAttribute('href', '/library/one/edit')
  }, 20_000)
})
