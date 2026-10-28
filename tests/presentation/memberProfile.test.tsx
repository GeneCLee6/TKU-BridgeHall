import { configure, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import type { ClubTeam, Partnership } from '../../src/lib/api.ts'

/**
 * 我的帳號 › 個人檔案 and the member page /u/:id (e11-t04, AC-11.1) against a fake Worker: amy (u1)
 * is signed in; bob (u2) calls himself 陳小柏, is in 甲隊 and the archived 舊隊, and plays with amy.
 */

const TEAM: ClubTeam = { id: 't1', name: '甲隊', captainId: 'u2', memberIds: ['u1', 'u2'], profileId: 'tp', createdAt: 0 }
const OLD: ClubTeam = { ...TEAM, id: 't2', name: '舊隊', captainId: 'u1', archived: true }
const PAIR: Partnership = { id: 'p1', userIds: ['u1', 'u2'], teamId: 't1', profileId: 'pp', createdAt: 0, status: 'active', acceptedAt: 0 }
const ME = { id: 'u1', username: 'amy', admin: false, permissions: [], profile: { displayName: '王小美', level: 'college' } }

let routes: Record<string, unknown>
let calls: { method: string; path: string; body: unknown }[]

configure({ asyncUtilTimeout: 10_000 })
vi.setConfig({ testTimeout: 40_000 })

beforeAll(async () => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
  await Promise.all([import('../../src/pages/MemberPage.tsx'), import('../../src/pages/AccountPage.tsx')])
})

beforeEach(() => {
  window.localStorage.clear()
  calls = []
  routes = {
    'GET /api/me': { user: ME },
    'GET /api/club/members': {
      members: [
        { id: 'u1', username: 'amy', displayName: '王小美' },
        { id: 'u2', username: 'bob', displayName: '陳小柏', avatar: 5 },
      ],
    },
    'GET /api/club/teams': { teams: [TEAM, OLD] },
    'GET /api/club/pairs': { pairs: [PAIR] },
    'GET /api/members/u2': {
      member: { id: 'u2', username: 'bob', avatar: 5, profile: { displayName: '陳小柏', level: 'open', system: '2/1', bio: '大四\n打了三年' }, recent: [] },
    },
    'GET /api/club/members/u2/teams': { teams: [TEAM, OLD], pairs: [PAIR] },
    'GET /api/members/u1': { member: { id: 'u1', username: 'amy', profile: {}, recent: [] } },
    'GET /api/club/members/u1/teams': { teams: [], pairs: [] },
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      calls.push({ method, path: String(input), body: init?.body ? JSON.parse(String(init.body)) : undefined })
      const body = routes[`${method} ${String(input)}`]
      if (body === undefined && String(input).startsWith('/api/members/'))
        return new Response(JSON.stringify({ error: '找不到這位社員', code: 'userGone' }), { status: 404 })
      return body === undefined
        ? new Response(JSON.stringify({ error: '沒有權限', code: 'forbidden' }), { status: 403 })
        : new Response(JSON.stringify(body), { status: 200 })
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

const open = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

describe('the member page /u/:id (e11-t04, AC-11.1)', () => {
  it("shows the member's avatar, name, level, system, bio, teams and partnerships", async () => {
    open('/u/u2')
    expect(await screen.findByRole('heading', { name: '陳小柏', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('帳號 bob')).toBeInTheDocument()
    expect(screen.getByText('公開組')).toBeInTheDocument()
    expect(screen.getByText('2/1')).toBeInTheDocument()
    expect(screen.getByText(/打了三年/)).toBeInTheDocument()
    expect(document.querySelector('[data-avatar] img')).toHaveAttribute('src', '/api/avatar/u2?v=5')

    const teams = screen.getByRole('list', { name: '隊伍' })
    const items = within(teams).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual(['甲隊隊長', '舊隊已封存'])
    expect(within(teams).getByRole('link', { name: '甲隊' })).toHaveAttribute('href', '/teams/t1')

    const pairs = screen.getByRole('list', { name: '搭檔' })
    expect(within(pairs).getByRole('link', { name: '與 王小美' })).toHaveAttribute('href', '/pairs/p1')
    expect(pairs).toHaveTextContent('（甲隊）')
    // Not their own page
    expect(screen.queryByRole('link', { name: '在「我的帳號」編輯個人檔案' })).toBeNull()
  })

  it('says so when the member is gone', async () => {
    // The Worker lists no teams for an unknown id; the profile is what answers 404
    routes['GET /api/club/members/nobody/teams'] = { teams: [], pairs: [] }
    open('/u/nobody')
    expect(await screen.findByRole('alert')).toHaveTextContent('找不到這位社員')
  })

  it('links your own page to 我的帳號, and shows the username when there is no display name', async () => {
    open('/u/u1')
    expect(await screen.findByRole('heading', { name: /^amy/, level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '在「我的帳號」編輯個人檔案' })).toHaveAttribute('href', '/account')
    expect(screen.getByText('還沒有自我介紹。')).toBeInTheDocument()
    expect(screen.getByText('不在任何隊伍裡')).toBeInTheDocument()
  })

  it('links the members on a team page to their profile pages', async () => {
    routes['GET /api/club/teams/t1'] = { team: TEAM, pairs: [] }
    open('/teams/t1')
    const members = await screen.findByRole('list', { name: '隊員' })
    expect(within(members).getByRole('link', { name: '陳小柏' })).toHaveAttribute('href', '/u/u2')
  })
})

describe('我的帳號 › 個人檔案 (e11-t04)', () => {
  it('saves the whole profile, an empty level left out', async () => {
    routes['PATCH /api/account/profile'] = { user: { ...ME, profile: { displayName: '小美', system: '淡江制度', bio: '大三' } } }
    open('/account')
    const form = await screen.findByRole('form', { name: '個人檔案' })
    const name = within(form).getByRole('textbox', { name: /^顯示名稱/ })
    expect(name).toHaveValue('王小美')
    expect(within(form).getByRole('combobox', { name: '自評程度' })).toHaveValue('college')
    fireEvent.change(name, { target: { value: '小美' } })
    fireEvent.change(within(form).getByRole('combobox', { name: '自評程度' }), { target: { value: '' } })
    fireEvent.change(within(form).getByRole('textbox', { name: /^常用制度/ }), { target: { value: '淡江制度' } })
    fireEvent.change(within(form).getByRole('textbox', { name: /^自我介紹/ }), { target: { value: '大三' } })
    expect(within(form).getByText('2 / 300 字')).toBeInTheDocument()
    fireEvent.click(within(form).getByRole('button', { name: '儲存' }))
    expect(await within(form).findByText('個人檔案已儲存')).toBeInTheDocument()
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ displayName: '小美', system: '淡江制度', bio: '大三' })
    expect(screen.getByRole('link', { name: '看我的檔案頁' })).toHaveAttribute('href', '/u/u1')
  })
})
