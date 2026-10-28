import { configure, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import type { ClubTeam, Partnership, ProfileSummary, SystemProfile } from '../../src/lib/api.ts'

/**
 * 隊伍頁、搭檔頁、我的隊伍與搭檔 (e2-t05, e2-t06, e2-t09; AC-2.4, AC-2.5, AC-2.7) against a fake
 * Worker: team 甲隊 (captain amy, members amy, bob, cat), the active partnership amy＋bob that
 * turns a convention off and overrides one row, and cat's invitation to amy.
 */

const base = { version: 1, updatedAt: 0, updatedBy: 'u1', overrides: [], notes: [], adopted: {} }
const row = { kind: 'row', slug: 'x', sectionId: 's', blockIndex: 0, rowIndex: 0, meaning: '改過' } as const
const PROFILES: SystemProfile[] = [
  { ...base, id: 'club', name: '社團預設', scope: 'club' },
  { ...base, id: 'tp', name: '甲隊', scope: 'team', adopted: { y: 'on' }, overrides: [row] },
  {
    ...base,
    id: 'pp',
    name: 'amy＋bob',
    scope: 'partnership',
    parentId: 'tp',
    adopted: { bergen: 'off' },
    overrides: [row],
    notes: [{ slug: 'x', text: '我們的備忘', by: 'u1', at: 0 }],
  },
  { ...base, id: 'fresh', name: 'amy＋dan', scope: 'partnership', parentId: 'tp' },
]
const summary = ({ adopted, overrides, notes, ...p }: SystemProfile): ProfileSummary => ({
  ...p,
  counts: { adopted: Object.keys(adopted).length, overrides: overrides.length, notes: notes.length },
})
const TEAM: ClubTeam = { id: 't1', name: '甲隊', captainId: 'u1', memberIds: ['u1', 'u2', 'u3'], profileId: 'tp', createdAt: 0 }
const PAIR: Partnership = { id: 'p1', userIds: ['u1', 'u2'], teamId: 't1', profileId: 'pp', createdAt: 0, status: 'active', acceptedAt: 0 }
const FRESH: Partnership = { id: 'p3', userIds: ['u1', 'u4'], teamId: 't1', profileId: 'fresh', createdAt: 0, status: 'active', acceptedAt: 0 }
const INVITE: Partnership = { id: 'p2', userIds: ['u3', 'u1'], profileId: '', createdAt: 1, status: 'pending' }
const MEMBERS = [
  { id: 'u1', username: 'amy' },
  { id: 'u2', username: 'bob' },
  { id: 'u3', username: 'cat' },
  { id: 'u4', username: 'dan' },
]
const access = { notes: true, edit: true, share: true }

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
  await Promise.all([
    import('../../src/pages/TeamsPage.tsx'),
    import('../../src/pages/PairPage.tsx'),
    import('../../src/pages/AccountPage.tsx'),
  ])
})

beforeEach(() => {
  window.localStorage.clear()
  calls = []
  routes = {
    'GET /api/me': { user: { id: 'u1', username: 'amy', admin: false, permissions: [] } },
    'GET /api/book/profiles': { profiles: PROFILES.map(summary) },
    'GET /api/book/profiles/tp': { profile: PROFILES[1], access: { notes: true, edit: true, share: true } },
    'GET /api/book/profiles/pp': { profile: PROFILES[2], access },
    'GET /api/book/profiles/fresh': { profile: PROFILES[3], access },
    'PUT /api/book/profiles/fresh': { profile: { ...PROFILES[3], version: 2 } },
    'GET /api/club/members': { members: MEMBERS },
    'GET /api/club/teams': { teams: [TEAM, { ...TEAM, id: 't2', name: '舊隊', archived: true }] },
    'GET /api/club/teams/t1': { team: TEAM, pairs: [PAIR] },
    'GET /api/club/pairs': { pairs: [INVITE, PAIR] },
    'GET /api/club/pairs/p1': { pair: PAIR },
    'GET /api/club/pairs/p2': { pair: INVITE },
    'GET /api/club/pairs/p3': { pair: FRESH },
    'POST /api/club/pairs/p2/accept': { pair: { ...INVITE, status: 'active', profileId: 'fresh' } },
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      calls.push({ method, path: String(input), body: init?.body ? JSON.parse(String(init.body)) : undefined })
      const body = routes[`${method} ${String(input)}`]
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

describe('the team pages (e2-t05, AC-2.4)', () => {
  it('lists the teams, the member’s own marked and the archived ones apart', async () => {
    open('/teams')
    const list = await screen.findByRole('table', { name: '隊伍' })
    expect(within(list).getByRole('link', { name: '甲隊' })).toHaveAttribute('href', '/teams/t1')
    expect(within(list).getByText('我的隊伍')).toBeInTheDocument()
    expect(within(screen.getByRole('table', { name: '已封存的隊伍' })).getByText('舊隊')).toBeInTheDocument()
  })

  it('shows the members, the team’s profile entries and each partnership’s changes over the team', async () => {
    open('/teams/t1')
    expect(await screen.findByRole('heading', { name: '甲隊', level: 1 })).toBeInTheDocument()
    const members = screen.getByRole('list', { name: '隊員' })
    expect(within(members).getByText('隊長')).toBeInTheDocument()
    expect(within(members).getByText('cat')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: '與母制度集比較：甲隊' })).toHaveAttribute('href', '/profiles/tp/compare')
    expect(screen.getByRole('link', { name: '編輯制度集：甲隊' })).toHaveAttribute('href', '/profiles/tp/edit')

    const pair = screen.getByRole('row', { name: 'amy＋bob 相對隊伍的差異' })
    const cells = within(pair).getAllByRole('cell')
    expect(cells.map((c) => c.textContent)).toEqual(['amy＋bob', '1', '1', '0', '與母制度集比較'])
    expect(within(pair).getByRole('link', { name: '打開 amy＋bob 的搭檔頁' })).toHaveAttribute('href', '/pairs/p1')
  })

  it('leaves out the edit link when the member may only read', async () => {
    routes['GET /api/book/profiles/tp'] = { profile: PROFILES[1], access: { notes: false, edit: false, share: false } }
    open('/teams/t1')
    expect(await screen.findByRole('link', { name: '與母制度集比較：甲隊' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '編輯制度集：甲隊' })).not.toBeInTheDocument()
    expect(screen.getByText('你可以讀這個制度集，但不能修改。')).toBeInTheDocument()
  })
})

describe('the partnership page (e2-t06, AC-2.5)', () => {
  it('sums up the partnership’s profile with the ways into it', async () => {
    open('/pairs/p1')
    expect(await screen.findByRole('heading', { name: 'amy＋bob', level: 1 })).toBeInTheDocument()
    const sum = screen.getByRole('list', { name: '這對的制度' })
    expect(sum).toHaveTextContent('繼承「甲隊」')
    expect(sum).toHaveTextContent('不採用 1 個特約')
    expect(sum).toHaveTextContent('覆寫 1 處')
    expect(screen.getByRole('link', { name: '甲隊' })).toHaveAttribute('href', '/teams/t1')
    expect(screen.getByRole('link', { name: '與母制度集比較：amy＋bob' })).toHaveAttribute('href', '/profiles/pp/compare')
    expect(screen.getByRole('button', { name: '讀制度：amy＋bob' })).toBeInTheDocument()
  })

  it('answers an invitation', async () => {
    open('/pairs/p2')
    expect(await screen.findByText('cat 邀請你組成搭檔。')).toBeInTheDocument()
    routes['GET /api/club/pairs/p2'] = { pair: { ...INVITE, status: 'active', profileId: 'fresh' } }
    fireEvent.click(screen.getByRole('button', { name: '接受' }))
    expect(await screen.findByRole('list', { name: '這對的制度' })).toBeInTheDocument()
    expect(calls.some((c) => c.method === 'POST' && c.path === '/api/club/pairs/p2/accept')).toBe(true)
  })
})

describe('copying a profile into a new partnership’s (e2-t09, AC-2.7)', () => {
  it('copies another partnership’s adoptions and overrides, not its notes', async () => {
    open('/pairs/p3')
    const form = await screen.findByRole('form', { name: '從別處複製制度集' })
    expect(screen.getByText(/可以就這樣「從隊伍開始」/)).toBeInTheDocument()
    const select = within(form).getByRole('combobox', { name: '複製來源' })
    // The team is its parent already, so only the other partnership is offered
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['選擇制度集', '搭檔：amy＋bob'])
    fireEvent.change(select, { target: { value: 'pp' } })
    fireEvent.click(within(form).getByRole('button', { name: '複製' }))
    expect(await screen.findByText('已從「amy＋bob」複製採用與覆寫')).toBeInTheDocument()

    const put = calls.find((c) => c.method === 'PUT')!
    expect(put.path).toBe('/api/book/profiles/fresh')
    expect(put.body).toEqual({
      profile: {
        name: 'amy＋dan',
        scope: 'partnership',
        parentId: 'tp',
        adopted: { bergen: 'off' },
        overrides: [row],
        notes: [],
      },
      baseVersion: 1,
      note: '從「amy＋bob」複製',
    })
  })
})

describe('我的帳號 › 我的隊伍與搭檔 (e2-t06)', () => {
  it('lists the member’s teams and partnerships and invites a partner', async () => {
    routes['POST /api/club/pairs'] = { pair: { ...INVITE, id: 'p9', userIds: ['u1', 'u3'], teamId: 't1' } }
    routes['GET /api/club/pairs/p9'] = { pair: { ...INVITE, id: 'p9', userIds: ['u1', 'u3'], teamId: 't1' } }
    open('/account')
    const teams = await screen.findByRole('list', { name: '我的隊伍' })
    expect(within(teams).getByRole('link', { name: '甲隊' })).toHaveAttribute('href', '/teams/t1')
    const pairs = screen.getByRole('list', { name: '我的搭檔' })
    expect(within(pairs).getByRole('link', { name: 'cat＋amy' })).toHaveAttribute('href', '/pairs/p2')
    expect(within(pairs).getByText('回覆邀請')).toBeInTheDocument()
    expect(within(pairs).getByText('現役')).toBeInTheDocument()

    const form = screen.getByRole('form', { name: '邀請搭檔' })
    fireEvent.change(within(form).getByRole('combobox', { name: '搭檔' }), { target: { value: 'u3' } })
    fireEvent.change(within(form).getByRole('combobox', { name: '所屬隊伍（選填）' }), { target: { value: 't1' } })
    fireEvent.click(within(form).getByRole('button', { name: '送出邀請' }))
    expect(await screen.findByText('已邀請 cat，等待對方回覆。')).toBeInTheDocument()
    expect(calls.find((c) => c.method === 'POST' && c.path === '/api/club/pairs')?.body).toEqual({ partnerId: 'u3', teamId: 't1' })
  })
})
