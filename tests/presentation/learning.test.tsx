import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import type { Me } from '../../src/lib/api.ts'
import { bundledPaths } from '../../src/content/paths.ts'
import { forgetOnlinePaths, type PathProgress, type SavedLearningPath } from '../../src/lib/learning.ts'
import { warmPages } from './warmPages.ts'

/** 學習路徑 (e4-t09 pages, e4-t11 progress, e4-t12 online editing) against a fake API */

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
beforeAll(() => Promise.all([warmPages(), import('../../src/pages/LearnPages.tsx'), import('../../src/pages/LearnEditorPage.tsx')]), 60_000)

beforeEach(() => {
  forgetOnlinePaths()
  routes = { 'GET /api/book/paths': { body: { paths: [] } } }
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

/** The bundled 「從零開始」 reads the club's conventions, which the tests do not have (tests/fixtures) */
const bundled = bundledPaths[0]
/** 「從零開始」 as editors might have saved it online, reading the made-up conventions */
const fixturePath = (lessons: Partial<SavedLearningPath['lessons'][number]>[]): SavedLearningPath => ({
  id: 'from-zero',
  name: '從零開始',
  by: 'ed',
  at: Date.UTC(2026, 9, 1),
  lessons: lessons.map((l, i) => ({ id: `lesson-${i + 1}`, title: `測試第 ${i + 1} 課`, goal: '', readings: [], checklist: [], ...l })),
})

describe('the path and lesson pages (e4-t09)', () => {
  it('lists 「從零開始」’s lessons', async () => {
    renderAt('/learn/from-zero')
    expect(await screen.findByRole('heading', { level: 1, name: '從零開始' }, WAIT)).toBeInTheDocument()
    const lessons = within(screen.getAllByRole('list').find((l) => l.tagName === 'OL')!).getAllByRole('link')
    expect(lessons).toHaveLength(bundled.lessons.length)
    expect(lessons[0]).toHaveAttribute('href', '/learn/from-zero/lesson-1')
    expect(lessons[0]).toHaveTextContent(`第 1 課${bundled.lessons[0].title}`)
    expect(screen.getByRole('link', { name: '從第一課開始' })).toHaveAttribute('href', '/learn/from-zero/lesson-1')
    expect(screen.queryByRole('link', { name: '編輯路徑' })).toBeNull()
  })

  it('shows a lesson: what to read, and says the goal and checklist are the editors’ to write', async () => {
    routes['GET /api/book/paths'] = {
      body: {
        paths: [fixturePath([{ readings: [{ slug: 'fixture-system' }] }, { readings: [{ slug: 'fixture-alpha' }, { slug: 'fixture-beta' }] }, {}])],
      },
    }
    renderAt('/learn/from-zero/lesson-2')
    expect(await screen.findByRole('heading', { level: 1, name: '測試第 2 課' }, WAIT)).toBeInTheDocument()
    expect(screen.getByText('幹部還沒寫這一課的目標。')).toBeInTheDocument()
    expect(screen.getByText('幹部還沒寫這一課的檢核清單。')).toBeInTheDocument()
    const readings = within(screen.getByRole('region', { name: '閱讀' })).getAllByRole('link')
    expect(readings.map((a) => a.getAttribute('href'))).toEqual(['/c/fixture-alpha', '/c/fixture-beta'])
    const nav = within(screen.getByRole('navigation', { name: '上一課與下一課' }))
    expect(nav.getByRole('link', { name: /上一課/ })).toHaveAttribute('href', '/learn/from-zero/lesson-1')
    expect(nav.getByRole('link', { name: /下一課/ })).toHaveAttribute('href', '/learn/from-zero/lesson-3')
    // e4-t10: no questions chosen, so the lesson practises its readings
    expect(screen.getByText('從這一課的閱讀範圍出題（幹部還沒選題）。')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '練這一課的題目' })).toHaveAttribute('href', '/practice?lesson=from-zero%2Flesson-2')
  })

  it('shows the editors’ online version in place of the bundled one, with sections and checklist', async () => {
    const online: SavedLearningPath = {
      id: 'from-zero',
      name: '新生課',
      by: 'ed',
      at: Date.UTC(2026, 9, 1),
      lessons: [
        {
          id: 'lesson-1',
          title: '第一堂',
          goal: '幹部寫的目標',
          readings: [{ slug: 'fixture-alpha', sectionId: 'after-2c' }, { slug: 'fixture-alpha', sectionId: 'gone' }],
          checklist: ['幹部寫的檢核'],
        },
      ],
    }
    routes['GET /api/book/paths'] = { body: { paths: [online] } }
    renderAt('/learn/from-zero/lesson-1')
    expect(await screen.findByRole('heading', { level: 1, name: '第一堂' }, WAIT)).toBeInTheDocument()
    expect(screen.getByText('幹部寫的目標')).toBeInTheDocument()
    expect(screen.getByText('幹部寫的檢核')).toBeInTheDocument()
    const readings = within(screen.getByRole('region', { name: '閱讀' })).getAllByRole('link')
    expect(readings[0]).toHaveAttribute('href', '/c/fixture-alpha/after-2c')
    expect(readings[0]).toHaveTextContent('測試特約甲（虛構） › 佔位答叫表（測試） › 2♣ 之後（測試）')
    expect(readings[1]).toHaveAttribute('href', '/c/fixture-alpha')
    expect(screen.getByText('（找不到這一段，連到整個特約）')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /回到路徑.*新生課/ })).toHaveAttribute('href', '/learn/from-zero')
  })

  it('says so for a path or lesson that is not there', async () => {
    renderAt('/learn/from-zero/lesson-99')
    expect(await screen.findByRole('alert', undefined, WAIT)).toHaveTextContent('這條路徑沒有這一課。')
  })
})

describe('progress (e4-t11)', () => {
  it('marks a lesson done, shows the share on the path page and in 我的帳號', async () => {
    signedIn({})
    let progress: PathProgress[] = [{ pathId: 'from-zero', done: ['lesson-1'], at: 1 }]
    routes['GET /api/book/paths/progress'] = () => ({ body: { progress } })
    routes['PUT /api/book/paths/progress'] = (body) => {
      const { lessonId, done } = (body as { progress: { lessonId: string; done: boolean } }).progress
      const ids = progress[0].done.filter((id) => id !== lessonId)
      progress = [{ pathId: 'from-zero', done: done ? [...ids, lessonId] : ids, at: 2 }]
      return { body: { progress: progress[0] } }
    }
    const user = userEvent.setup()
    renderAt('/learn/from-zero/lesson-2')
    await user.click(await screen.findByRole('button', { name: '標記為完成' }, WAIT))
    expect(await screen.findByRole('button', { name: '已完成' })).toHaveAttribute('aria-pressed', 'true')
    expect(sent.find((r) => r.method === 'PUT')?.body).toEqual({ progress: { pathId: 'from-zero', lessonId: 'lesson-2', done: true } })

    await user.click(screen.getByRole('link', { name: /下一課/ }))
    await user.click(await screen.findByRole('link', { name: '從零開始' }))
    expect(await screen.findByText('已完成 2／8 課（25%）', undefined, WAIT)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: '完成進度' })).toHaveAttribute('value', '2')
  })

  it('lists the paths started in 我的帳號', async () => {
    signedIn({})
    routes['GET /api/book/paths/progress'] = { body: { progress: [{ pathId: 'from-zero', done: ['lesson-1', 'lesson-2'], at: 1 }] } }
    renderAt('/account')
    const panel = within(await screen.findByRole('region', { name: '學習進度' }, WAIT))
    expect(await panel.findByText(/已完成 2／8 課（25%）/)).toBeInTheDocument()
    expect(panel.getByRole('link', { name: '從零開始' })).toHaveAttribute('href', '/learn/from-zero')
  })
})

describe('editing a path online (e4-t12)', () => {
  it('lets an editor change a lesson and save; the path page shows it', async () => {
    signedIn({ permissions: ['bookEdit'] })
    routes['GET /api/book/paths/progress'] = { body: { progress: [] } }
    let saved: SavedLearningPath | undefined
    routes['PUT /api/book/paths'] = (body) => {
      saved = { ...(body as { path: SavedLearningPath }).path, by: 'amy', at: Date.UTC(2026, 9, 2) }
      routes['GET /api/book/paths'] = { body: { paths: [saved] } }
      return { body: { path: saved } }
    }
    const user = userEvent.setup()
    renderAt('/learn/from-zero')
    await user.click(await screen.findByRole('link', { name: '編輯路徑' }, WAIT))
    expect(await screen.findByRole('heading', { level: 1, name: '編輯「從零開始」' }, WAIT)).toBeInTheDocument()
    expect(screen.getByText('目前是網站內建的版本。')).toBeInTheDocument()

    const first = within(screen.getByRole('group', { name: '第 1 課' }))
    await user.type(first.getByRole('textbox', { name: '目標' }), '幹部寫的目標')
    await user.type(first.getByRole('textbox', { name: /自我檢核/ }), '會算點力{enter}{enter}')
    await user.click(first.getByRole('button', { name: '加一處閱讀' }))
    await user.selectOptions(first.getByRole('combobox', { name: '第 1 課 特約 2' }), 'fixture-alpha')
    await user.selectOptions(first.getByRole('combobox', { name: '第 1 課 段落 2' }), 'after-2c')
    await user.click(screen.getByRole('button', { name: '刪除第 8 課' }))
    await user.click(screen.getByRole('button', { name: '存檔' }))

    expect(await screen.findByText('已存檔。', undefined, WAIT)).toBeInTheDocument()
    expect(saved!.lessons).toHaveLength(7)
    expect(saved!.lessons[0]).toEqual({
      id: 'lesson-1',
      title: bundled.lessons[0].title,
      goal: '幹部寫的目標',
      readings: [...bundled.lessons[0].readings, { slug: 'fixture-alpha', sectionId: 'after-2c' }],
      checklist: ['會算點力'],
    })
    // Saved online, so it can go back to the bundled one
    expect(await screen.findByRole('button', { name: '還原為內建版本' })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: '回到「從零開始」' }))
    expect(await screen.findByText('幹部寫的目標', undefined, WAIT)).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('link', { name: /^第 \d 課/ })).toHaveLength(7))
  })

  it('keeps a reader without bookEdit out', async () => {
    signedIn({})
    renderAt('/learn/from-zero/edit')
    expect(await screen.findByRole('alert', undefined, WAIT)).toHaveTextContent(/權限/)
  })
})

describe('a lesson’s questions (e4-t10)', () => {
  it('lets an editor choose questions from the lesson’s readings; the lesson page counts them', async () => {
    signedIn({ permissions: ['bookEdit'] })
    let saved: SavedLearningPath | undefined
    routes['PUT /api/book/paths'] = (body) => {
      saved = { ...(body as { path: SavedLearningPath }).path, by: 'amy', at: Date.UTC(2026, 9, 2) }
      routes['GET /api/book/paths'] = { body: { paths: [saved] } }
      return { body: { path: saved } }
    }
    // Online already, so the bundled path's readings (the club's conventions) are not in the way
    routes['GET /api/book/paths'] = {
      body: { paths: [fixturePath([{ readings: [{ slug: 'fixture-beta' }] }, { readings: [{ slug: 'fixture-alpha', sectionId: 'rules' }] }])] },
    }
    const user = userEvent.setup()
    renderAt('/learn/from-zero/edit')
    const second = within(await screen.findByRole('group', { name: '第 2 課' }, WAIT))
    await user.click(second.getByRole('button', { name: /^選題/ }))
    // That section makes one question: its worked example
    const list = within(await second.findByRole('list', { name: '第 2 課 題目' }, WAIT))
    const boxes = list.getAllByRole('checkbox')
    expect(boxes).toHaveLength(1)
    expect(list.getByText(/叫品題/)).toBeInTheDocument()
    await user.click(boxes[0])
    expect(second.getByText(/已選 1／40 題/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '存檔' }))
    expect(await screen.findByText('已存檔。', undefined, WAIT)).toBeInTheDocument()
    expect(saved!.lessons[1].quizIds).toEqual(['fixture-alpha/rules/3/hand'])
    expect(saved!.lessons[0].quizIds).toBeUndefined()
  })

  it('says how many questions the editors chose', async () => {
    const online: SavedLearningPath = {
      id: 'from-zero',
      name: '從零開始',
      by: 'ed',
      at: 1,
      lessons: [{ id: 'lesson-1', title: '第一堂', goal: '', readings: [], quizIds: ['fixture-alpha/responses/0/0', 'fixture-alpha/responses/0/1'], checklist: [] }],
    }
    routes['GET /api/book/paths'] = { body: { paths: [online] } }
    renderAt('/learn/from-zero/lesson-1')
    expect(await screen.findByText('幹部為這一課選了 2 題。', undefined, WAIT)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '練這一課的題目' })).toHaveAttribute('href', '/practice?lesson=from-zero%2Flesson-1')
  })
})
