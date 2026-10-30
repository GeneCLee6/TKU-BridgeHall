import { configure, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import type { ProfileAccess, ProfileInput, ProfileSummary, SystemProfile } from '../../src/lib/api.ts'
import { cardStrings as t } from '../../src/pages/cardStrings.ts'

/**
 * The convention card page (/cards/:profileId/:templateId, e3-t05–t07) against a fake Worker: a
 * team's card under the club's, with a club edit inherited, hand edits saved with the profile.
 */

const base = { updatedAt: 0, updatedBy: 'u1', overrides: [], notes: [], adopted: {} }
const CLUB: SystemProfile = {
  ...base,
  id: 'club',
  name: '社團預設',
  scope: 'club',
  version: 2,
  cardEdits: { 'wbf.header.event': { text: 'Club Cup' } },
}
const TEAM: SystemProfile = { ...base, id: 'team', name: '甲隊', scope: 'team', parentId: 'club', version: 4 }
const summary = ({ adopted, overrides, notes, cardEdits: _c, ...p }: SystemProfile): ProfileSummary => ({
  ...p,
  counts: { adopted: Object.keys(adopted).length, overrides: overrides.length, notes: notes.length },
})

let access: ProfileAccess
let signedIn: boolean
let saveStatus: number
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
  saveStatus = 200
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
      if (route === 'PUT /api/book/profiles/team') {
        if (saveStatus === 409) return json(409, { error: '有人先存了', code: 'profileConflict' })
        const { profile } = body as { profile: ProfileInput }
        return json(200, { profile: { ...TEAM, ...profile, version: 5 } })
      }
      return json(404, { error: '找不到', code: 'notFound' })
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

const renderCard = async (path = '/cards/team/wbf') => {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  expect(await screen.findByRole('heading', { name: `${t.title} · 甲隊` }, { timeout: 15_000 })).toBeInTheDocument()
}

const cell = (label: string) => screen.getByRole('button', { name: new RegExp(`^${label}：`) })

describe('the convention card page', () => {
  it('shows the card filled from the profile, with template tabs, help and sources', async () => {
    await renderCard()
    const tabs = screen.getByRole('navigation', { name: t.templates })
    expect(within(tabs).getByRole('link', { name: 'WBF 制度卡' })).toHaveAttribute('aria-current', 'page')
    expect(within(tabs).getByRole('link', { name: /單面/ })).toHaveAttribute('href', '/cards/team/ctcba-simple')
    expect(screen.getByRole('button', { name: t.pdf })).toBeInTheDocument()

    // Filled from the conventions: a cell with a 「§」 link back to the handbook
    const links = screen.getAllByRole('link', { name: new RegExp(`^${t.toSection}：`) })
    // The made-up conventions fill two WBF cells (tests/fixtures)
    expect(links.length).toBeGreaterThanOrEqual(2)
    expect(links[0]!.getAttribute('href')).toMatch(/^\/c\//)

    // The club's edit shows on the team's card; the cell has the Guide's help on hover
    const event = cell('Event:')
    expect(event).toHaveTextContent('Club Cup')
    const user = userEvent.setup()
    await user.click(event)
    const inspector = screen.getByRole('complementary', { name: t.inspector.title })
    expect(within(inspector).getByText(t.edit.inherited('社團'))).toBeInTheDocument()
    await user.click(cell('GENERAL APPROACH AND STYLE'))
    expect(cell('GENERAL APPROACH AND STYLE')).toHaveAttribute('title', expect.stringMatching(/./))
    expect(within(inspector).getByText(/Guide to Completion/)).toBeInTheDocument()
  })

  it('edits, flags and resets a cell, and saves the edits with the whole profile', async () => {
    await renderCard()
    const user = userEvent.setup()
    await user.click(cell('Players:'))
    const inspector = screen.getByRole('complementary', { name: t.inspector.title })
    const text = within(inspector).getByRole('textbox', { name: t.edit.text })
    await user.type(text, '小明、小華')
    await user.click(within(inspector).getByRole('checkbox', { name: t.edit.flagged }))
    expect(cell('Players:')).toHaveTextContent('小明、小華')
    expect(screen.getByText(t.edit.unsaved(1))).toBeInTheDocument()

    // Reset one, edit again, then save
    await user.click(within(inspector).getByRole('button', { name: t.edit.reset }))
    expect(cell('Players:')).not.toHaveTextContent('小明')
    await user.type(within(inspector).getByRole('textbox', { name: t.edit.text }), 'Amy')
    await user.click(screen.getByRole('button', { name: t.edit.save }))
    expect(await screen.findByText(t.edit.saved(5))).toBeInTheDocument()
    const put = sent.find((s) => s.method === 'PUT')!
    const { profile, baseVersion } = put.body as { profile: ProfileInput; baseVersion: number }
    expect(baseVersion).toBe(4)
    expect(profile.cardEdits).toEqual({ 'wbf.header.players': { text: 'Amy' } })
    expect(profile).toMatchObject({ name: '甲隊', scope: 'team', adopted: {}, overrides: [], notes: [] })
  })

  it('asks to reload when someone saved first (409)', async () => {
    saveStatus = 409
    await renderCard()
    const user = userEvent.setup()
    await user.click(cell('Players:'))
    await user.type(screen.getByRole('textbox', { name: t.edit.text }), 'Amy')
    await user.click(screen.getByRole('button', { name: t.edit.save }))
    expect(await screen.findByText(new RegExp(t.edit.conflict))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t.edit.reload })).toBeInTheDocument()
  })

  it('is read-only without the right to edit', async () => {
    access = { notes: true, edit: false, share: false }
    await renderCard()
    const user = userEvent.setup()
    await user.click(cell('Players:'))
    expect(screen.getByText(t.edit.readOnly)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: t.edit.save })).not.toBeInTheDocument()
  })

  it('draws the two-sided card twice for print and sends an unknown template to a message', async () => {
    await renderCard('/cards/team/ctcba-simple-2p')
    const extra = document.querySelectorAll('[data-card-extra]')
    expect(extra.length).toBe(2)
    for (const copy of extra) expect(copy).toHaveAttribute('aria-hidden', 'true')
    expect(document.querySelector('style[media="print"]')!.textContent).toMatch(/size: A4 landscape/)
  })
})
