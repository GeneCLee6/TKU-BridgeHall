import { configure, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { conventions } from '../fixtures/content.ts'
import type { ProfileOverride, ProfileSummary, SystemProfile } from '../../src/lib/api.ts'
import { walkSections } from '../../src/lib/sections.ts'
import type { ResponseRow } from '../../src/types/convention.ts'

/**
 * 與母制度集比較 (/profiles/:id/compare, e1-t15, AC-1.7) against a fake Worker: a partnership
 * under a team that turns a convention off, overrides a row of another and has an override that
 * points at a row that is gone.
 */

const dropped = conventions.find((c) => c.slug === 'fixture-beta')!
const target = (() => {
  for (const c of conventions) {
    if (c.slug === dropped.slug) continue
    let found: { slug: string; sectionId: string; blockIndex: number; row: ResponseRow } | undefined
    walkSections(c.sections, (s) => {
      const blockIndex = s.blocks?.findIndex((b) => b.kind === 'responses') ?? -1
      const block = s.blocks?.[blockIndex]
      if (!found && block?.kind === 'responses' && block.rows[0])
        found = { slug: c.slug, sectionId: s.id, blockIndex, row: block.rows[0] }
    })
    if (found) return { ...found, convention: c }
  }
  throw new Error('no convention with a responses block')
})()
const MEANING = '搭檔約定的獨門意義'
const GONE = '指到不存在的列'

const override = (meaning: string, rowIndex: number): ProfileOverride => ({
  kind: 'row',
  slug: target.slug,
  sectionId: target.sectionId,
  blockIndex: target.blockIndex,
  rowIndex,
  meaning,
})

const base = { version: 1, updatedAt: 0, updatedBy: 'u1', overrides: [], notes: [], adopted: {} }
const PROFILES: SystemProfile[] = [
  { ...base, id: 'club', name: '社團預設', scope: 'club' },
  { ...base, id: 'team', name: '甲隊', scope: 'team' },
  {
    ...base,
    id: 'pair',
    name: '小明＋小華',
    scope: 'partnership',
    parentId: 'team',
    adopted: { [dropped.slug]: 'off' },
    overrides: [override(MEANING, 0), override(GONE, 999)],
  },
]
const summary = ({ adopted, overrides, notes, ...p }: SystemProfile): ProfileSummary => ({
  ...p,
  counts: { adopted: Object.keys(adopted).length, overrides: overrides.length, notes: notes.length },
})

let routes: Record<string, unknown>
let sent: { method: string; path: string; body: unknown }[]

configure({ asyncUtilTimeout: 10_000 })
vi.setConfig({ testTimeout: 40_000 })

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})

beforeEach(() => {
  window.localStorage.clear()
  sent = []
  routes = {
    'GET /api/me': { user: { id: 'u1', username: 'amy', admin: false, permissions: [] } },
    'GET /api/book/profiles': { profiles: PROFILES.map(summary) },
    ...Object.fromEntries(PROFILES.map((p) => [`GET /api/book/profiles/${p.id}`, { profile: p }])),
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      if (init?.method && init.method !== 'GET') sent.push({ method: init.method, path: String(input), body: JSON.parse(String(init.body ?? '{}')) })
      const body = routes[`${init?.method ?? 'GET'} ${String(input)}`]
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

describe('the compare page', () => {
  it('lists what the partnership turns off, each override against the parent, and what is broken', async () => {
    open('/profiles/pair/compare')
    expect(await screen.findByRole('heading', { name: '小明＋小華' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '甲隊' })).toHaveAttribute('href', '/profiles/team/compare')

    const adoptions = screen.getByRole('region', { name: '採用與不採用' })
    expect(within(adoptions).getByRole('link', { name: dropped.nameZh })).toHaveAttribute('href', `/c/${dropped.slug}`)

    const overrides = screen.getByRole('region', { name: '覆寫' })
    const item = within(overrides).getByRole('article')
    // The parent's meaning word for word (RichText drops only the ** of bold)
    expect(item).toHaveTextContent(target.row.meaning.replace(/\*\*/g, ''))
    expect(within(item).getByText(MEANING)).toBeInTheDocument()
    expect(within(item).getByText('原文（母制度集）')).toBeInTheDocument()
    expect(within(item).getByText('覆寫後')).toBeInTheDocument()
    expect(within(item).getByRole('link', { name: '到該段' })).toHaveAttribute(
      'href',
      `/c/${target.slug}/${target.sectionId}`,
    )
    expect(within(overrides).queryByText(GONE)).not.toBeInTheDocument()

    const problems = screen.getByRole('region', { name: '失效的覆寫與其他問題' })
    expect(within(problems).getByText('這一列已不存在')).toBeInTheDocument()
    expect(problems).toHaveTextContent(GONE)
  })

  it('says when a profile changes nothing', async () => {
    open('/profiles/team/compare')
    expect(await screen.findByText(/和母制度集完全相同/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '社團預設' })).toHaveAttribute('href', '/profiles/club/compare')
  })

  it('shows the Worker’s refusal for a profile the member may not read', async () => {
    open('/profiles/secret/compare')
    expect(await screen.findByRole('alert')).toHaveTextContent('沒有權限')
  })
})

describe('建議統一 (e2-t08, AC-2.6)', () => {
  const ref = `row:${target.slug}:${target.sectionId}:${target.blockIndex}:0`
  const team = { id: 't1', name: '甲隊', captainId: 'u1', memberIds: ['u1', 'u2', 'u3'], profileId: 'team', createdAt: 0 }
  const pair = { id: 'x1', userIds: ['u2', 'u3'], teamId: 't1', profileId: 'pair', createdAt: 0, status: 'active' }

  it("gives the team's captain a button by each override that tells the partners", async () => {
    routes['GET /api/club/teams/t1'] = { team, pairs: [pair] }
    routes['POST /api/club/teams/t1/suggest-unify'] = { ok: true }
    open('/profiles/pair/compare?team=t1&pair=x1')
    const overrides = await screen.findByRole('region', { name: '覆寫' })
    const button = await within(overrides).findByRole('button', { name: /^建議統一：/ })
    await userEvent.click(button)
    expect(await screen.findByText('已通知這對搭檔。')).toBeInTheDocument()
    expect(sent).toEqual([{ method: 'POST', path: '/api/club/teams/t1/suggest-unify', body: { pairId: 'x1', ref, name: target.convention.nameZh } }])
  })

  it('has no such button for someone who is not the captain', async () => {
    routes['GET /api/club/teams/t1'] = { team: { ...team, captainId: 'u9' }, pairs: [pair] }
    open('/profiles/pair/compare?team=t1&pair=x1')
    await screen.findByRole('region', { name: '覆寫' })
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/club/teams/t1', expect.anything()))
    expect(screen.queryByRole('button', { name: /^建議統一/ })).not.toBeInTheDocument()
  })

  it('shows a partner the suggested override on top, and drops it with one press', async () => {
    const mine = PROFILES[2]
    routes['GET /api/book/profiles/pair'] = { profile: mine, access: { notes: true, edit: true, share: true } }
    routes['PUT /api/book/profiles/pair'] = { profile: { ...mine, version: 2 } }
    open(`/profiles/pair/compare?unify=${encodeURIComponent(ref)}`)
    const panel = await screen.findByRole('region', { name: '隊長建議統一' })
    expect(within(panel).getByText(MEANING)).toBeInTheDocument()
    await userEvent.click(within(panel).getByRole('button', { name: '改回「甲隊」的版本' }))
    expect(await screen.findByText('已改回：這條覆寫已刪除。')).toBeInTheDocument()
    expect(sent).toHaveLength(1)
    const saved = sent[0].body as { profile: SystemProfile; baseVersion: number; note: string }
    expect(sent[0]).toMatchObject({ method: 'PUT', path: '/api/book/profiles/pair' })
    expect(saved.baseVersion).toBe(1)
    expect(saved.profile.overrides).toEqual([override(GONE, 999)])
    expect(saved.profile.adopted).toEqual(mine.adopted)
  })

  it('tells a reader who may not edit that only the partners may drop it, and says when it is gone', async () => {
    const { unmount } = open(`/profiles/pair/compare?unify=${encodeURIComponent(ref)}`)
    const panel = await screen.findByRole('region', { name: '隊長建議統一' })
    expect(within(panel).getByText('只有這對搭檔能改回。')).toBeInTheDocument()
    expect(within(panel).queryByRole('button')).not.toBeInTheDocument()
    unmount()
    open('/profiles/pair/compare?unify=row%3Anothing%3Ax%3A0%3A0')
    expect(await screen.findByText(/已經不在了/)).toBeInTheDocument()
  })
})
