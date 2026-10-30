import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { conventionBySlug, conventions } from '../fixtures/content.ts'
import { generateQuizzes } from '../../src/lib/quiz.ts'
import { strings } from '../../src/strings.ts'
import { READER } from '../setup.ts'
import { warmPages } from './warmPages.ts'

/** 「從零開始」 saved online with one lesson that reads the made-up worked example (the bundled one reads the club's conventions) */
const servePathOnline = () =>
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    const path = String(input)
    const answer = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } }))
    if (path === '/api/me') return answer({ user: READER })
    if (path === '/api/book/paths')
      return answer({
        paths: [
          {
            id: 'from-zero',
            name: '從零開始',
            by: 'ed',
            at: 1,
            lessons: [{ id: 'lesson-1', title: '測試第 1 課', goal: '', readings: [{ slug: 'fixture-alpha', sectionId: 'rules' }], checklist: [] }],
          },
        ],
      })
    return Promise.reject(new TypeError('No API in component tests'))
  })

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})
beforeAll(() => Promise.all([warmPages(), import('../../src/pages/PracticePage.tsx')]), 60_000)

const WAIT = { timeout: 10_000 }

describe('練習 (e6-t02, e6-t03, AC-6.3)', () => {
  it('starts with the convention from 練這個特約 and answers a round with the source shown', async () => {
    const user = userEvent.setup()
    renderAt('/practice?c=fixture-alpha')
    const box = await screen.findByRole('checkbox', { name: /^測試特約甲（虛構）/ }, WAIT)
    expect(box).toBeChecked()
    // Only that convention is chosen; its questions are all the round can draw from
    const asked = generateQuizzes([conventionBySlug('fixture-alpha')!], 'club').quizzes
    expect(screen.getByText(`符合條件的題目共 ${asked.length} 題。`)).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').filter((b) => (b as HTMLInputElement).checked)).toHaveLength(1)

    // Its meaning questions: it has a call question too, answered on a bidding box (below)
    await user.selectOptions(screen.getByRole('combobox', { name: /^題型/ }), 'meaning')
    await user.selectOptions(screen.getByRole('combobox', { name: /題數/ }), '5')
    await user.click(screen.getByRole('button', { name: '開始練習' }))

    for (let i = 1; i <= 5; i++) {
      expect(await screen.findByText(`第 ${i}／5 題`)).toBeInTheDocument()
      const choices = within(screen.getByRole('list', { name: '選項' })).getAllByRole('button')
      expect(choices).toHaveLength(4)
      // Every choice is one of the convention's meanings, word for word
      const meanings = new Set(asked.filter((q) => q.kind === 'meaning').map((q) => q.answer))
      choices.forEach((c) => expect(meanings.has(c.textContent ?? '')).toBe(true))
      await user.click(choices[0])
      expect(await screen.findByRole('heading', { name: /^答(對了|錯了)/ })).toHaveFocus()
      expect(screen.getByText('正解')).toBeInTheDocument()
      const link = screen.getByRole('link', { name: '去讀原文' })
      expect(link.getAttribute('href')).toMatch(/^\/c\/fixture-alpha\//)
      // The source table is shown under the answer
      expect(screen.getAllByRole('table').length).toBeGreaterThan(0)
      await user.click(screen.getByRole('button', { name: i < 5 ? '下一題' : '看結果' }))
    }
    expect(await screen.findByRole('heading', { name: '練習結束' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^答對 \d／5 題$/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '再練一次' }))
    expect(await screen.findByText('第 1／5 題')).toBeInTheDocument()
  })

  it('offers only conventions with questions, all chosen by default', async () => {
    renderAt('/practice')
    await screen.findByRole('checkbox', { name: /^測試特約甲（虛構）/ }, WAIT)
    const boxes = screen.getAllByRole('checkbox')
    expect(boxes).toHaveLength(new Set(generateQuizzes(conventions, 'club').quizzes.map((q) => q.slug)).size)
    boxes.forEach((b) => expect(b).toBeChecked())
    await userEvent.click(screen.getByRole('button', { name: '全不選' }))
    expect(screen.getByText(/沒有符合條件的題目/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '開始練習' })).toBeDisabled()
  })
})

describe('練這個特約 (e6-t09)', () => {
  // Every made-up convention has a response table; a page without one (no link) is checked on the
  // club's conventions, in the private repository's copy of this file
  it('is on a convention page with response tables', async () => {
    renderAt('/c/fixture-alpha')
    const link = await screen.findByRole('link', { name: '練這個特約' }, WAIT)
    expect(link).toHaveAttribute('href', '/practice?c=fixture-alpha')
    await waitFor(() => expect(screen.queryByText(strings.loading)).toBeNull(), WAIT)
  })
})

describe('叫品題 (e6-t07) and a lesson’s questions (e4-t10)', () => {
  it('practises a lesson’s questions and answers a call question on the bidding box', async () => {
    servePathOnline()
    const user = userEvent.setup()
    renderAt('/practice?lesson=from-zero%2Flesson-1')
    // The lesson reads one section with one question: the worked example, whose answer is 2H
    const mode = await screen.findByRole('combobox', { name: /出題範圍/ }, WAIT)
    await waitFor(() => expect(mode).toHaveDisplayValue('這一課：測試第 1 課（1 題）'))
    expect(screen.getByText('符合條件的題目共 1 題。')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '開始練習' }))

    const prompt = await screen.findByText((_, el) => el?.tagName === 'P' && el.textContent === 'EX) 測試牌例：同伴開叫 1NT，你？', undefined, WAIT)
    expect(prompt).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '你叫什麼？' })).toHaveFocus()
    const box = within(screen.getByRole('group', { name: '叫牌盒' }))
    expect(box.getAllByRole('button')).toHaveLength(38)
    await user.click(box.getByRole('button', { name: '2紅心' }))
    expect(await screen.findByRole('heading', { name: '答對了！' })).toHaveFocus()
    expect(box.getByRole('button', { name: '2紅心' })).toHaveAttribute('aria-pressed', 'true')
    // The source's own hand and its label, under the answer
    expect(within(screen.getByRole('region', { name: '原文的牌例' })).getByText(/^叫2/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '看結果' }))
    expect(await screen.findByRole('heading', { name: /^答對 1／1 題$/ })).toBeInTheDocument()
  })

  it('marks a wrong call and the source’s call', async () => {
    servePathOnline()
    const user = userEvent.setup()
    renderAt('/practice?lesson=from-zero%2Flesson-1')
    await screen.findByText('符合條件的題目共 1 題。', undefined, WAIT)
    await user.click(screen.getByRole('button', { name: '開始練習' }))
    const box = within(await screen.findByRole('group', { name: '叫牌盒' }, WAIT))
    await user.click(box.getByRole('button', { name: '3黑桃' }))
    expect(await screen.findByRole('heading', { name: '答錯了。' })).toBeInTheDocument()
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === '你叫的：3♠ · 原文叫：2♥')).toBeInTheDocument()
  })

  it('filters by kind', async () => {
    const user = userEvent.setup()
    renderAt('/practice')
    const kind = await screen.findByRole('combobox', { name: /題型/ }, WAIT)
    await screen.findByRole('checkbox', { name: /^測試特約甲（虛構）/ }, WAIT)
    await user.selectOptions(kind, 'call')
    const calls = generateQuizzes(conventions, 'club').quizzes.filter((q) => q.kind === 'call')
    expect(calls.length).toBeGreaterThan(0)
    expect(await screen.findByText(`符合條件的題目共 ${calls.length} 題。`)).toBeInTheDocument()
  })
})
