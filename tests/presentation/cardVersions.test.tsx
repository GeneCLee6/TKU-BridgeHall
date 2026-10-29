import { configure, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { fillCard } from '../../src/cards/fill.ts'
import { wbf } from '../../src/cards/templates/wbf.ts'
import { conventions as bundled } from '../../src/content/index.ts'
import type { CardSnapshotMeta, ProfileAccess, ProfileSummary, SystemProfile } from '../../src/lib/api.ts'
import { resolveProfile } from '../../src/lib/profiles.ts'
import { cardStrings as t } from '../../src/pages/cardStrings.ts'

/**
 * Convention card output (E3 e3-t08, e3-t09): the Word download, publishing a version, its share
 * switch, and the version page read without signing in while it is shared; plus the card page
 * opening at the cell a section's 「在制度卡的位置」 links to (e3-t10).
 */

const base = { updatedAt: 0, updatedBy: 'u1', overrides: [], notes: [], adopted: {} }
const CLUB: SystemProfile = { ...base, id: 'club', name: '社團預設', scope: 'club', version: 2 }
const TEAM: SystemProfile = { ...base, id: 'team', name: '甲隊', scope: 'team', parentId: 'club', version: 4 }
const summary = ({ adopted, overrides, notes, cardEdits: _c, ...p }: SystemProfile): ProfileSummary => ({
  ...p,
  counts: { adopted: Object.keys(adopted).length, overrides: overrides.length, notes: notes.length },
})
const CARD = fillCard(wbf, resolveProfile([], 'club', bundled))

let access: ProfileAccess
let signedIn: boolean
let snapshots: CardSnapshotMeta[]
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

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

beforeEach(() => {
  access = { notes: true, edit: true, share: true }
  signedIn = true
  snapshots = []
  sent = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      const path = String(input)
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      sent.push({ method, path, body })
      const route = `${method} ${path}`
      if (route === 'GET /api/me')
        return signedIn
          ? json(200, { user: { id: 'u1', username: 'amy', admin: false, permissions: [] } })
          : json(401, { error: '請先登入', code: 'signInFirst' })
      if (route === 'GET /api/book/profiles') return json(200, { profiles: [CLUB, TEAM].map(summary) })
      if (route === 'GET /api/book/profiles/club') return json(200, { profile: CLUB })
      if (route === 'GET /api/book/profiles/team') return json(200, { profile: TEAM, ...(signedIn && { access }) })
      if (route === 'GET /api/book/cards/team') return json(200, { snapshots })
      if (route === 'POST /api/book/cards/team') {
        const meta: CardSnapshotMeta = {
          profileId: 'team',
          templateId: body.templateId,
          n: snapshots.length + 1,
          at: 1_700_000_000_000,
          by: 'u1',
          byName: 'amy',
          note: body.note ?? '',
          profileName: '甲隊',
          profileVersion: body.profileVersion,
          shared: false,
          docx: !!body.docx,
        }
        snapshots = [meta, ...snapshots]
        return json(200, { snapshot: meta })
      }
      const one = path.match(/^\/api\/book\/cards\/team\/wbf\/(\d+)$/)
      if (one && method === 'PATCH') {
        snapshots = snapshots.map((s) => (s.n === Number(one[1]) ? { ...s, shared: body.shared } : s))
        return json(200, { snapshot: snapshots.find((s) => s.n === Number(one[1])) })
      }
      if (one && method === 'GET') {
        const meta = snapshots.find((s) => s.n === Number(one[1]))
        if (!meta || (!meta.shared && !signedIn)) return json(404, { error: '找不到', code: 'cardSnapshotGone' })
        return json(200, { snapshot: { ...meta, card: CARD } })
      }
      return json(404, { error: '找不到', code: 'notFound' })
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

const heading = () => screen.findByRole('heading', { name: `${t.title} · 甲隊` }, { timeout: 15_000 })

describe('convention card output', () => {
  it('offers the Word file, in Gill Sans for the WBF card', async () => {
    renderAt('/cards/team/wbf')
    await heading()
    expect(screen.getByRole('button', { name: t.word.download })).toBeInTheDocument()
    const font = screen.getByRole('combobox', { name: t.word.font })
    expect(within(font).getAllByRole('option').map((o) => o.textContent)).toEqual(Object.values(t.word.fonts))
  })

  it('publishes a version with its Word file, shares it and lists it', async () => {
    renderAt('/cards/team/wbf')
    await heading()
    const user = userEvent.setup()
    await user.click(screen.getByText(t.versions.title))
    expect(await screen.findByText(t.versions.none)).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: t.versions.note }), '春季賽')
    await user.click(screen.getByRole('button', { name: t.versions.publish }))
    expect(await screen.findByText(t.versions.published(1), {}, { timeout: 20_000 })).toBeInTheDocument()
    const post = sent.find((s) => s.method === 'POST')!.body as Record<string, unknown>
    expect(post).toMatchObject({ templateId: 'wbf', profileVersion: 4, note: '春季賽' })
    expect(typeof post.docx).toBe('string')
    // A Word file is a zip: base64 of "PK"
    expect(post.docx as string).toMatch(/^UEs/)
    expect((post.card as { templateId: string }).templateId).toBe('wbf')

    const link = await screen.findByRole('link', { name: t.versions.version(1) })
    expect(link).toHaveAttribute('href', '/cards/team/wbf/v/1')
    await user.click(screen.getByRole('checkbox', { name: t.versions.shareOf(1) }))
    expect(await screen.findByText(t.versions.shared)).toBeInTheDocument()
    expect(sent.some((s) => s.method === 'PATCH' && (s.body as { shared: boolean }).shared)).toBe(true)
  })

  it('shows a shared version read-only, with the Word file kept then', async () => {
    snapshots = [
      {
        profileId: 'team',
        templateId: 'wbf',
        n: 3,
        at: 1_700_000_000_000,
        by: 'u1',
        byName: 'amy',
        note: '春季賽',
        profileName: '甲隊',
        profileVersion: 4,
        shared: true,
        docx: true,
      },
    ]
    renderAt('/cards/team/wbf/v/3')
    expect(await screen.findByRole('heading', { name: /甲隊 · 第 3 版/ }, { timeout: 15_000 })).toBeInTheDocument()
    expect(screen.getByText(t.snapshot.readOnly)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: t.snapshot.storedWord })).toHaveAttribute('href', '/api/book/cards/team/wbf/3/docx')
    // Read-only: the cells are not buttons
    expect(screen.queryByRole('button', { name: /^Players:：/ })).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-card-paper]').length).toBeGreaterThan(1)
  })

  it('says so when a version is not shared any more', async () => {
    renderAt('/cards/team/wbf/v/9')
    expect(await screen.findByText(t.snapshot.gone, {}, { timeout: 15_000 })).toBeInTheDocument()
  })

  it('sends someone signed out to the login page, shared link or not (the whole site is for members, 2026-10-29)', async () => {
    signedIn = false
    window.localStorage.removeItem('tku-bridgebook:me')
    renderAt('/cards/team/wbf/v/3')
    expect(await screen.findByRole('heading', { level: 1, name: '登入' }, { timeout: 15_000 })).toBeInTheDocument()
  })

  it('opens at the cell a section links to', async () => {
    renderAt('/cards/team/wbf?cell=wbf.defence.vs-nt')
    await heading()
    const inspector = screen.getByRole('complementary', { name: t.inspector.title })
    expect(within(inspector).getByText(/Guide to Completion/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^VS\. NT|^VS NT/i })).toHaveAttribute('aria-pressed', 'true')
  })
})
