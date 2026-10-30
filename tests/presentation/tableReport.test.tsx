import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import type { RobotMeaningsQuery, SystemSpecStatus } from '../../src/lib/api.ts'
import { emptyClubProfile } from '../../src/lib/profiles.ts'
import type { SystemSpec } from '../../src/lib/systemSpec.ts'

/**
 * 牌桌整合 (/integrations/table, e7-t03 e7-t04) against a fake API: the built-in conventions turned
 * into rules, TKB's meanings asked a few auctions at a time, and the sync
 */

let sent: { method: string; path: string; body: unknown }[]
let synced: SystemSpecStatus['synced']

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })
const club = emptyClubProfile()

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})

beforeEach(() => {
  sent = []
  synced = null
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      const path = String(input)
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      sent.push({ method, path, body })
      const route = `${method} ${path}`
      if (route === 'GET /api/me')
        return json(200, {
          user: { id: 'u1', username: 'ed', admin: false, permissions: ['bookEdit'] },
        })
      if (route === 'GET /api/book/profiles')
        return json(200, {
          profiles: [{ ...club, counts: { adopted: 0, overrides: 0, notes: 0 } }],
        })
      if (route === 'GET /api/book/profiles/club') return json(200, { profile: club })
      if (route.startsWith('GET /api/book/system-spec'))
        return json(200, { tableProfileId: 'club', synced })
      if (route === 'PUT /api/book/system-spec/club') {
        synced = {
          spec: (body as { spec: SystemSpec }).spec,
          syncedAt: Date.UTC(2026, 9, 28, 4),
          syncedBy: 'u1',
          syncedByName: 'ed',
        }
        return json(200, { tableProfileId: 'club', synced })
      }
      if (route === 'POST /api/book/robot-meanings') {
        // TKB has a rule only for 3NT over 1NT (the made-up fixture-alpha's), and reads it 12-15
        const items = (body as RobotMeaningsQuery).items.map(({ after, calls }) => ({
          after,
          meanings: Object.fromEntries(
            calls.map((c) => [
              c,
              after === '1N (P)' && c === '3N'
                ? { hcp: [12, 15], text: '12–15 大牌點' }
                : null,
            ]),
          ),
        }))
        return json(200, { items })
      }
      if (method === 'PUT' && path.startsWith('/api/book/conventions/'))
        return json(200, { entry: { slug: path.split('/').pop(), version: 1 } })
      return json(401, { error: '請先登入', code: 'signInFirst' })
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('the table report', () => {
  it('lists what TKB reads otherwise, asks a few auctions at a time, and syncs on request', async () => {
    render(
      <MemoryRouter initialEntries={['/integrations/table']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      await screen.findByText('這個制度集還沒同步到牌桌。', {}, { timeout: 10_000 }),
    ).toBeInTheDocument()
    expect(screen.getByText(/牌桌機器人目前跟著「/)).toBeInTheDocument()
    expect(
      await screen.findByText(
        /^和牌桌規則不一致 \d+ 條；牌桌沒有規則 \d+ 條。$/,
        {},
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument()
    const asked = sent.filter((s) => s.path === '/api/book/robot-meanings')
    expect(asked.length).toBeGreaterThan(0)
    expect(asked.every((s) => (s.body as RobotMeaningsQuery).items.length <= 10)).toBe(true)

    // 3NT over 1NT: the fixture's 10-15 against TKB's 12-15
    const differ = screen.getByRole('region', { name: '和牌桌規則不一致的叫品' })
    const row = within(differ)
      .getAllByRole('row')
      .find((r) => within(r).queryByText('12–15 大牌點'))!
    expect(row).toBeDefined()
    expect(within(row).getByText('1NT （Pass）')).toBeInTheDocument()
    expect(within(row).getByText('點力')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '重新同步到牌桌' }))
    expect(await screen.findByText('已同步到牌桌。')).toBeInTheDocument()
    const put = sent.find((s) => s.method === 'PUT')!
    expect(put.path).toBe('/api/book/system-spec/club')
    expect((put.body as { spec: SystemSpec }).spec.rules.length).toBe(8)
    expect(screen.getByText(/和現在的內容相同/)).toBeInTheDocument()
  }, 30_000)

  it('saves an editor’s hand conditions on the club’s row, beside its words (e7-t08)', async () => {
    render(
      <MemoryRouter initialEntries={['/integrations/table']}>
        <App />
      </MemoryRouter>,
    )
    await screen.findByText(/^和牌桌規則不一致 \d+ 條；牌桌沒有規則 \d+ 條。$/, {}, { timeout: 10_000 })
    const askedBefore = sent.filter((s) => s.path === '/api/book/robot-meanings').length

    const unresolved = screen.getByRole('region', { name: '轉不出來的叫品' })
    await userEvent.click(within(unresolved).getAllByRole('button', { name: /^補條件：/ })[0])
    const form = await within(unresolved).findByRole('form', {}, { timeout: 10_000 })
    await userEvent.type(within(form).getByRole('spinbutton', { name: '點力下限' }), '8')
    await userEvent.clear(within(form).getByRole('spinbutton', { name: '點力上限' }))
    await userEvent.type(within(form).getByRole('spinbutton', { name: '點力上限' }), '10')
    await userEvent.click(within(form).getByRole('button', { name: '存條件' }))
    expect(await screen.findByText('已存條件，規則已重新轉換。', {}, { timeout: 10_000 })).toBeInTheDocument()

    const put = sent.find((s) => s.method === 'PUT' && s.path.startsWith('/api/book/conventions/'))!
    const body = put.body as { convention: { sections: unknown[] }; baseVersion: number; note: string }
    expect(body.baseVersion).toBe(0)
    expect(body.note).toMatch(/^補手牌條件：/)
    // One row gets them (the first row offered, with what the patterns read kept); its words stay
    const rows = JSON.stringify(body.convention.sections).match(/"conditions":\{[^}]*\}/g)
    expect(rows).toHaveLength(1)
    expect(rows![0]).toMatch(/^"conditions":\{"hcp":\[8,10\]/)
    // Remaking the rules asks TKB only about auctions it was not asked about
    await screen.findByText(/^和牌桌規則不一致 \d+ 條；牌桌沒有規則 \d+ 條。$/, {}, { timeout: 10_000 })
    expect(sent.filter((s) => s.path === '/api/book/robot-meanings').length).toBe(askedBefore)
  }, 30_000)
})
