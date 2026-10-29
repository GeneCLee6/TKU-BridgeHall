import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { READER } from '../setup.ts'
import type { BookGlossary, Me } from '../../src/lib/api.ts'
import { warmPages } from './warmPages.ts'

/**
 * 名詞解釋 (e4-t05–t07) against a fake API. The terms are test data only: the club's explanations
 * are the officers' to write (CLAUDE.md rule 1).
 */

let routes: Record<string, { status?: number; body?: unknown }>
let sent: { method: string; path: string; body: unknown }[]
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

const online: BookGlossary = {
  version: 3,
  updatedAt: 1,
  updatedBy: 'amy',
  terms: [
    { term: 'GF', aliases: [], definition: '測試定義甲', see: 'lebensohl' },
    { term: '測試名詞', aliases: ['測試別名'], definition: '測試定義乙' },
  ],
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
      warmPages(),
      import('../../src/glossary/GlossaryPage.tsx'),
      import('../../src/glossary/GlossaryEditorPage.tsx'),
    ]),
  60_000,
)

beforeEach(() => {
  routes = { 'GET /api/me': { body: { user: READER } }, 'GET /api/book/glossary': { body: online } }
  sent = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
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

describe('名詞解釋', () => {
  it('marks a term in the text once and explains it in a popover, by keyboard too (e4-t06)', async () => {
    renderAt('/c/lebensohl/natural-rules')
    const terms = await screen.findAllByRole('button', { name: 'GF' }, { timeout: 5000 })
    const term = terms[0]
    // The words are unchanged: the paragraph still reads as the Word file does
    expect(term.closest('li')).toHaveTextContent('[原文已移除]')
    expect(term).toHaveAttribute('aria-expanded', 'false')

    term.focus()
    await userEvent.keyboard('{Enter}')
    const dialog = screen.getByRole('dialog', { name: '名詞解釋：GF' })
    expect(dialog).toHaveTextContent('測試定義甲')
    expect(within(dialog).getByRole('link', { name: /^相關特約/ })).toHaveAttribute('href', '/c/lebensohl')
    expect(within(dialog).getByRole('link', { name: '看名詞頁' })).toHaveAttribute('href', '/glossary#term-gf')

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: '名詞解釋：GF' })).toBeNull()
    expect(term).toHaveFocus()
  })

  it('lists the terms and filters them (e4-t05)', async () => {
    renderAt('/glossary')
    expect(await screen.findByRole('heading', { level: 1, name: '名詞解釋' }, { timeout: 5000 })).toBeInTheDocument()
    expect(await screen.findByText('測試定義甲')).toBeInTheDocument()
    expect(screen.getByText('共 2 條')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('找名詞'), '別名')
    expect(screen.getByText('共 1 條')).toBeInTheDocument()
    expect(screen.queryByText('測試定義甲')).toBeNull()
    expect(screen.queryByRole('link', { name: '編輯名詞表' })).toBeNull()
  })

  it('lets an editor change the list and save it whole (e4-t07)', async () => {
    const me: Me = { id: 'u1', username: 'amy', admin: false, permissions: ['bookEdit'] } as Me
    routes['GET /api/me'] = { body: { user: me } }
    routes['PUT /api/book/glossary'] = { body: { ...online, version: 4 } }
    renderAt('/glossary/edit')
    const remove = await screen.findByRole('button', { name: '刪除「GF」' }, { timeout: 5000 })
    await userEvent.click(remove)
    await userEvent.click(screen.getByRole('button', { name: '新增名詞' }))
    const items = screen.getAllByRole('listitem')
    const last = within(items[items.length - 1])
    await userEvent.type(last.getByLabelText('名詞'), '測試新詞')
    await userEvent.type(last.getByLabelText('解釋'), '測試新解釋')
    await userEvent.click(screen.getByRole('button', { name: '儲存名詞表' }))
    await waitFor(() => expect(sent.find((s) => s.method === 'PUT')).toBeTruthy())
    expect(sent.find((s) => s.method === 'PUT')!.body).toEqual({
      baseVersion: 3,
      terms: [
        { term: '測試名詞', aliases: ['測試別名'], definition: '測試定義乙' },
        { term: '測試新詞', aliases: [], definition: '測試新解釋' },
      ],
    })
    expect(await screen.findByRole('status')).toHaveTextContent('已儲存')
  })
})
