import { configure, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import type { ProfileInput, ProfileSummary, SystemProfile } from '../../src/lib/api.ts'
import { CTCBA_CARDS_URL, cardStrings as t } from '../../src/pages/cardStrings.ts'
import type { Convention } from '../../src/types/convention.ts'

/**
 * A Brown Sticker form on the card page (e3-t12, AC-3.8): 2♦ opening marked as a Brown Sticker
 * opening (no built-in convention is marked) adds a tab with its form, against a fake Worker.
 */

vi.mock('../../src/content/conventions/two-diamond-opening.ts', async (importOriginal) => {
  const m = await importOriginal<{ twoDiamondOpening: Convention }>()
  return { twoDiamondOpening: { ...m.twoDiamondOpening, brownSticker: 'opening' } }
})

const base = { updatedAt: 0, updatedBy: 'u1', overrides: [], notes: [], adopted: {} }
const CLUB: SystemProfile = { ...base, id: 'club', name: '社團預設', scope: 'club', version: 2 }
const PAIR: SystemProfile = { ...base, id: 'pair', name: '小明小華', scope: 'partnership', parentId: 'club', version: 3 }
const summary = ({ adopted, overrides, notes, cardEdits: _c, ...p }: SystemProfile): ProfileSummary => ({
  ...p,
  counts: { adopted: Object.keys(adopted).length, overrides: overrides.length, notes: notes.length },
})

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
  sent = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      const path = String(input)
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      sent.push({ method, path, body })
      const route = `${method} ${path}`
      if (route === 'GET /api/me') return json(200, { user: { id: 'u1', username: 'amy', admin: false, permissions: [] } })
      if (route === 'GET /api/book/profiles') return json(200, { profiles: [CLUB, PAIR].map(summary) })
      if (route === 'GET /api/book/profiles/club') return json(200, { profile: CLUB })
      if (route === 'GET /api/book/profiles/pair')
        return json(200, { profile: PAIR, access: { notes: true, edit: true, share: true } })
      if (route === 'PUT /api/book/profiles/pair') {
        const { profile } = body as { profile: ProfileInput }
        return json(200, { profile: { ...PAIR, ...profile, version: 4 } })
      }
      return json(404, { error: '找不到', code: 'notFound' })
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

const renderAt = async (path: string) => {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  expect(await screen.findByRole('heading', { name: `${t.title} · 小明小華` }, { timeout: 15_000 })).toBeInTheDocument()
}

const cell = (label: string) => screen.getByRole('button', { name: new RegExp(`^${label}：`) })
const tabName = t.bsc.tab('棕標開叫申報表', '2D 開叫')

describe('Brown Sticker forms on the card page', () => {
  it('adds a tab for the marked convention after the cards', async () => {
    await renderAt('/cards/pair/wbf')
    const tabs = within(screen.getByRole('navigation', { name: t.templates }))
    const names = tabs.getAllByRole('link').map((a) => a.textContent)
    expect(names).toEqual(['WBF 制度卡', expect.stringMatching(/簡易/), expect.stringMatching(/簡易/), tabName])
    expect(screen.getByText(t.versions.title)).toBeInTheDocument()
    expect(tabs.getByRole('link', { name: tabName })).toHaveAttribute('href', '/cards/pair/bsc-opening/two-diamond-opening')
  })

  it('fills the form from the convention, links the Systems Policy and keeps edits per convention', async () => {
    await renderAt('/cards/pair/bsc-opening/two-diamond-opening')
    expect(within(screen.getByRole('navigation', { name: t.templates })).getByRole('link', { name: tabName })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByText(t.bsc.intro('2D 開叫', '棕標開叫申報表'))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: t.bsc.policy })).toHaveAttribute('href', CTCBA_CARDS_URL)
    expect(screen.queryByText(t.versions.title)).not.toBeInTheDocument()
    expect(cell('Detailed Description:')).toHaveTextContent('[Note 1]')
    expect(document.querySelector('style[media="print"]')!.textContent).toMatch(/size: A4 portrait/)

    const user = userEvent.setup()
    await user.click(cell('Names:'))
    const inspector = screen.getByRole('complementary', { name: t.inspector.title })
    await user.type(within(inspector).getByRole('textbox', { name: t.edit.text }), 'Amy - Bob')
    await user.click(screen.getByRole('button', { name: t.edit.save }))
    expect(await screen.findByText(t.edit.saved(4))).toBeInTheDocument()
    const put = sent.find((s) => s.method === 'PUT')!
    expect((put.body as { profile: ProfileInput }).profile.cardEdits).toEqual({
      'bsc-opening.two-diamond-opening.names': { text: 'Amy - Bob' },
    })
  })

  it('says so when the profile has no convention marked for the form', async () => {
    await renderAt('/cards/pair/bsc-overcall/two-diamond-opening')
    expect(screen.getByText(t.bsc.none('棕標蓋叫申報表'))).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: t.pdf })).not.toBeInTheDocument()
  })
})
