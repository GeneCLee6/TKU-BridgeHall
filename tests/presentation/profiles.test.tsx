import { configure, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { searchIndexJson } from '../../scripts/search-index.ts'
import { App } from '../../src/App.tsx'
import { conventions } from '../../src/content/index.ts'
import type { Me, ProfileSummary, SystemProfile } from '../../src/lib/api.ts'
import { walkSections } from '../../src/lib/sections.ts'
import { strings } from '../../src/strings.ts'

/**
 * The reader's system profile on the handbook page (A7: e1-t11, e1-t12, e1-t13, e1-t16) against a
 * fake Worker: a team profile and a partnership under it.
 */

// A convention the partnership does not play, and a row of another one it plays its own way
const dropped = conventions.find((c) => c.slug === 'bergen-raises')!
const target = (() => {
  for (const c of conventions) {
    if (c.slug === dropped.slug) continue
    let found: { slug: string; sectionId: string; blockIndex: number; title: string } | undefined
    walkSections(c.sections, (s) => {
      const blockIndex = s.blocks?.findIndex((b) => b.kind === 'responses') ?? -1
      if (!found && blockIndex >= 0) found = { slug: c.slug, sectionId: s.id, blockIndex, title: s.title }
    })
    if (found) return { ...found, convention: c }
  }
  throw new Error('no convention with a responses block')
})()
const MEANING = '搭檔約定的獨門意義'

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
    overrides: [{ kind: 'row', slug: target.slug, sectionId: target.sectionId, blockIndex: target.blockIndex, rowIndex: 0, meaning: MEANING }],
    notes: [{ slug: target.slug, text: '記得先問搭檔', by: 'u1', at: 0 }],
  },
]
const summary = ({ adopted, overrides, notes, ...p }: SystemProfile): ProfileSummary => ({
  ...p,
  counts: { adopted: Object.keys(adopted).length, overrides: overrides.length, notes: notes.length },
})

let routes: Record<string, unknown>
let sent: { method: string; path: string; body: unknown }[]

// The menu waits for the session, the list and a lazy chunk; give a busy machine time
configure({ asyncUtilTimeout: 8000 })
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
  routes = { 'GET /api/book/search-index': JSON.parse(searchIndexJson()) }
  sent = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      const path = String(input)
      sent.push({ method, path, body: init?.body ? JSON.parse(String(init.body)) : undefined })
      const body = routes[`${method} ${path}`]
      return body === undefined
        ? new Response(JSON.stringify({ code: 'signInFirst' }), { status: 401 })
        : new Response(JSON.stringify(body), { status: 200 })
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

function signedIn(me: Partial<Me> = {}) {
  const user = { id: 'u1', username: 'amy', admin: false, permissions: [], ...me }
  routes['GET /api/me'] = { user }
  routes['GET /api/book/profiles'] = { profiles: PROFILES.map(summary) }
  for (const p of PROFILES) routes[`GET /api/book/profiles/${p.id}`] = { profile: p }
  routes['POST /api/account/preferences'] = { user }
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

const catalogue = () => screen.getByRole('navigation', { name: strings.catalogue })

describe('system profiles on the handbook page', () => {
  it("opens on the account's profile: leaves out what it does not play, marks overrides, shows notes", async () => {
    signedIn({ bookProfile: 'pair' })
    renderAt(`/c/${target.slug}/${target.sectionId}`)
    const menu = await screen.findByRole('combobox', { name: strings.profiles.label })
    await waitFor(() => expect(menu).toHaveValue('pair'))
    await waitFor(() => expect(within(catalogue()).queryByText(dropped.nameZh)).not.toBeInTheDocument())

    expect(await screen.findByText(MEANING)).toBeInTheDocument()
    expect(screen.getByText(MEANING).closest('td')).toHaveTextContent(strings.profiles.overridden.partnership)
    expect(screen.getByText('記得先問搭檔')).toBeInTheDocument()
    expect(screen.getByText(strings.profiles.notes.partnership)).toBeInTheDocument()
    // Only the chain was fetched, and the editor's content was not touched
    const fetched = sent.filter((r) => r.path.startsWith('/api/book/profiles/')).map((r) => r.path)
    expect(fetched.sort()).toEqual(['/api/book/profiles/club', '/api/book/profiles/pair', '/api/book/profiles/team'])
  })

  it('searches what the profile shows', async () => {
    signedIn({ bookProfile: 'pair' })
    renderAt('/')
    const menu = await screen.findByRole('combobox', { name: strings.profiles.label })
    await waitFor(() => expect(menu).toHaveValue('pair'))
    await waitFor(() => expect(within(catalogue()).queryByText(dropped.nameZh)).not.toBeInTheDocument())
    await userEvent.click(screen.getByRole('searchbox'))
    await userEvent.type(screen.getByRole('searchbox'), MEANING)
    expect(await screen.findByRole('link', { name: new RegExp(target.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })).toBeInTheDocument()
    await userEvent.clear(screen.getByRole('searchbox'))
    await userEvent.type(screen.getByRole('searchbox'), 'Bergen')
    await waitFor(() => expect(screen.queryByRole('link', { name: new RegExp(`^${dropped.nameZh}`) })).not.toBeInTheDocument())
  })

  it("shows the reader's profile on the home page, with what it inherits and counts (e9-t08)", async () => {
    signedIn({ bookProfile: 'pair' })
    renderAt('/')
    const card = within(await screen.findByRole('region', { name: '小明＋小華' }))
    expect(card.getByText('目前的制度集 · 搭檔')).toBeInTheDocument()
    expect(card.getByText('甲隊')).toBeInTheDocument()
    expect(card.getByText('採用 1 個特約')).toBeInTheDocument()
    expect(card.getByText('覆寫 1 條')).toBeInTheDocument()
    expect(card.getByText('備忘 1 則')).toBeInTheDocument()
    expect(card.getByRole('link', { name: '讀制度' })).toHaveAttribute('href', '/book')
    expect(card.queryByRole('link', { name: '登入' })).not.toBeInTheDocument()
  })

  it('switches from the header and keeps the choice with the account', async () => {
    signedIn({ bookProfile: 'pair' })
    renderAt('/')
    const menu = await screen.findByRole('combobox', { name: strings.profiles.label })
    await waitFor(() => expect(within(catalogue()).queryByText(dropped.nameZh)).not.toBeInTheDocument())

    await userEvent.selectOptions(menu, 'club')
    expect(await within(catalogue()).findAllByText(dropped.nameZh)).not.toHaveLength(0)
    expect(sent).toContainEqual({ method: 'POST', path: '/api/account/preferences', body: { bookProfile: '' } })
    expect(window.localStorage.getItem('tku-bridgebook:profile')).toBeNull()

    await userEvent.selectOptions(menu, 'team')
    expect(sent).toContainEqual({ method: 'POST', path: '/api/account/preferences', body: { bookProfile: 'team' } })
  })

  it('keeps a choice the account could not save on this device, and sends it again next time', async () => {
    signedIn()
    routes['POST /api/account/preferences'] = undefined
    const first = renderAt('/')
    const menu = await screen.findByRole('combobox', { name: strings.profiles.label })
    await userEvent.selectOptions(menu, 'pair')
    await waitFor(() => expect(window.localStorage.getItem('tku-bridgebook:profile')).toBe('{"user":"u1","id":"pair"}'))
    first.unmount()

    signedIn()
    sent = []
    renderAt('/')
    await waitFor(() => expect(screen.getByRole('combobox', { name: strings.profiles.label })).toHaveValue('pair'))
    await waitFor(() =>
      expect(sent).toContainEqual({ method: 'POST', path: '/api/account/preferences', body: { bookProfile: 'pair' } }),
    )
    await waitFor(() => expect(window.localStorage.getItem('tku-bridgebook:profile')).toBeNull())
  })

  it('shows the club when the chosen profile is gone', async () => {
    signedIn({ bookProfile: 'deleted' })
    renderAt('/')
    const menu = await screen.findByRole('combobox', { name: strings.profiles.label })
    await waitFor(() => expect(menu).toHaveValue('club'))
    expect(within(catalogue()).getAllByText(dropped.nameZh)).not.toHaveLength(0)
  })
})
