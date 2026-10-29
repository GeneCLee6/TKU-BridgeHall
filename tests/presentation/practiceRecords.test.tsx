import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { conventionBySlug } from '../../src/content/index.ts'
import type { Me } from '../../src/lib/api.ts'
import { generateQuizzes } from '../../src/lib/quiz.ts'
import { clearLocalRounds, localRounds, type QuizFix, type QuizRound } from '../../src/lib/quizRecords.ts'
import { warmPages } from './warmPages.ts'

/** 成績紀錄、錯題本 (e6-t04, e6-t05) and 修題 (e6-t06) against a fake API */

type Answer = { status?: number; body?: unknown }
let routes: Record<string, Answer | ((body: unknown) => Answer)>
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
      warmPages(),
      import('../../src/pages/PracticePage.tsx'),
      import('../../src/pages/PracticeScoresPage.tsx'),
      import('../../src/pages/PracticeFixesPage.tsx'),
    ]),
  60_000,
)

beforeEach(() => {
  clearLocalRounds()
  routes = { 'GET /api/book/quiz/fixes': { body: { fixes: [] } } }
  signedIn({})
  sent = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      const path = String(input)
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      sent.push({ method, path, body })
      const route = routes[`${method} ${path}`]
      if (!route) return json(401, { error: '請先登入', code: 'signInFirst' })
      const a = typeof route === 'function' ? route(body) : route
      return json(a.status ?? 200, a.body ?? {})
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
const WAIT = { timeout: 10_000 }

const lebensohl = generateQuizzes([conventionBySlug('lebensohl')!], 'club').quizzes

async function answerRound(user: ReturnType<typeof userEvent.setup>, n: number) {
  await user.selectOptions(screen.getByRole('combobox', { name: /題數/ }), String(n))
  await user.click(screen.getByRole('button', { name: '開始練習' }))
  for (let i = 1; i <= n; i++) {
    await screen.findByText(`第 ${i}／${n} 題`)
    await user.click(within(screen.getByRole('list', { name: '選項' })).getAllByRole('button')[0])
    await user.click(await screen.findByRole('button', { name: i < n ? '下一題' : '看結果' }))
  }
  await screen.findByRole('heading', { name: '練習結束' })
}

describe('成績紀錄 (e6-t04)', () => {
  it('keeps a round in the account when signed in', async () => {
    signedIn({})
    routes['GET /api/book/quiz/rounds'] = { body: { rounds: [] } }
    routes['POST /api/book/quiz/rounds'] = (body) => ({
      body: { round: { id: 'r1', at: 1, ...(body as { round: object }).round } },
    })
    const user = userEvent.setup()
    renderAt('/practice?c=lebensohl')
    await screen.findByText(/成績存在你的帳號/, {}, WAIT)
    await screen.findByRole('checkbox', { name: /^雷本索特約/ }, WAIT)
    await answerRound(user, 5)
    expect(await screen.findByText('成績已存到你的帳號。')).toBeInTheDocument()
    const post = sent.find((r) => r.method === 'POST' && r.path === '/api/book/quiz/rounds')!
    expect((post.body as { round: { profileId: string; answers: unknown[] } }).round).toMatchObject({ profileId: 'club' })
    expect((post.body as { round: { answers: unknown[] } }).round.answers).toHaveLength(5)
    expect(localRounds()).toEqual([])
  })
})

describe('成績與錯題本 (e6-t05, AC-6.4)', () => {
  const rounds: QuizRound[] = [
    {
      id: 'r1',
      at: 2,
      profileId: 'club',
      answers: [
        { id: lebensohl[0].id, slug: 'lebensohl', right: false },
        { id: lebensohl[1].id, slug: 'lebensohl', right: true },
      ],
    },
  ]

  it('shows the share right, by convention, and the questions last answered wrong', async () => {
    signedIn({})
    routes['GET /api/book/quiz/rounds'] = { body: { rounds } }
    renderAt('/practice/scores')
    expect(await screen.findByRole('heading', { name: '錯題本（1 題）' }, WAIT)).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: '雷本索特約' })).toBeInTheDocument()
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0)
    const wrong = await screen.findByRole('link', { name: new RegExp(`^雷本索特約 › ${lebensohl[0].trail[0]}`) }, WAIT)
    expect(wrong).toHaveAttribute('href', `/c/lebensohl/${lebensohl[0].sectionId}`)
    expect(screen.getByRole('link', { name: '練錯題' })).toHaveAttribute('href', '/practice?wrong=1')
  })

  it('practises only the wrong questions from ?wrong=1', async () => {
    signedIn({})
    routes['GET /api/book/quiz/rounds'] = { body: { rounds } }
    renderAt('/practice?wrong=1')
    expect(await screen.findByText('符合條件的題目共 1 題。', {}, WAIT)).toBeInTheDocument()
  })
})

describe('修題 (e6-t06, AC-6.6)', () => {
  const quiz = lebensohl[0]

  it('is for editors only', async () => {
    signedIn({})
    renderAt('/practice/fixes')
    expect(await screen.findByRole('alert', {}, WAIT)).toBeInTheDocument()
  })

  it('takes a question out, against the text it was written for', async () => {
    signedIn({ permissions: ['bookEdit'] })
    routes['PUT /api/book/quiz/fixes'] = (body) => ({ body: { fix: { ...(body as { fix: object }).fix, by: 'amy', at: 1 } } })
    const user = userEvent.setup()
    renderAt(`/practice/fixes?id=${encodeURIComponent(quiz.id)}`)
    await user.click(await screen.findByRole('checkbox', { name: /停用這題/ }, WAIT))
    await user.click(screen.getByRole('button', { name: '儲存' }))
    await waitFor(() => expect(sent.some((r) => r.method === 'PUT')).toBe(true))
    expect(sent.find((r) => r.method === 'PUT')!.body).toEqual({
      fix: { source: 'auto', id: quiz.id, basis: { call: quiz.call, answer: quiz.answer }, disabled: true },
    })
  })

  it('leaves a disabled question out of practice', async () => {
    const fix: QuizFix = { source: 'auto', id: quiz.id, basis: { call: quiz.call!, answer: quiz.answer }, disabled: true, by: 'ed', at: 1 }
    routes['GET /api/book/quiz/fixes'] = { body: { fixes: [fix] } }
    renderAt('/practice?c=lebensohl')
    expect(await screen.findByText(`符合條件的題目共 ${lebensohl.length - 1} 題。`, {}, WAIT)).toBeInTheDocument()
  })
})
