import { configure, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { conventions } from '../../src/content/index.ts'
import type { ProfileOverride, ProfileSummary, SystemProfile } from '../../src/lib/api.ts'
import { walkSections } from '../../src/lib/sections.ts'
import type { ResponseRow } from '../../src/types/convention.ts'

/**
 * 與母制度集比較 (/profiles/:id/compare, e1-t15, AC-1.7) against a fake Worker: a partnership
 * under a team that turns a convention off, overrides a row of another and has an override that
 * points at a row that is gone.
 */

const dropped = conventions.find((c) => c.slug === 'bergen-raises')!
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
  routes = {
    'GET /api/me': { user: { id: 'u1', username: 'amy', admin: false, permissions: [] } },
    'GET /api/book/profiles': { profiles: PROFILES.map(summary) },
    ...Object.fromEntries(PROFILES.map((p) => [`GET /api/book/profiles/${p.id}`, { profile: p }])),
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
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
