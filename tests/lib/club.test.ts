import { renderHook, waitFor } from '@testing-library/react'
import { api } from '../../src/lib/api.ts'
import { beacon } from '../../src/lib/beacon.ts'
import { CLUB_HEADER, clubHeaders, clubId, setClubId, withClub } from '../../src/lib/club.ts'
import { AuthProvider, useAuth } from '../../src/state/AuthContext.tsx'

/** The member's club on every call (e10-t11; TKU-BridgeTable e12-t02 shared/clubs.ts) */

let calls: { url: string; headers: Headers }[]

beforeEach(() => {
  calls = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, headers: new Headers(init?.headers) })
      return new Response(JSON.stringify({ user: { id: 'u1', username: 'amy', admin: false, permissions: [], clubId: 'tku' } }))
    }),
  )
})

afterEach(() => {
  setClubId(null)
  vi.unstubAllGlobals()
})

describe('the club on each call', () => {
  it('sends nothing before signing in, so the Worker takes 淡江 as before clubs', async () => {
    await api.me()
    expect(calls[0].headers.has(CLUB_HEADER)).toBe(false)
    expect(withClub('/api/book/analytics')).toBe('/api/book/analytics')
  })

  it('sends the account’s club once it is known', async () => {
    setClubId('tku')
    await api.login('amy', 'secret1')
    expect(calls[0].headers.get(CLUB_HEADER)).toBe('tku')
    expect(calls[0].headers.get('Content-Type')).toBe('application/json')
    expect(clubHeaders({ 'Content-Type': 'image/webp' }).get('Content-Type')).toBe('image/webp')
  })

  it('puts the club in the address where a header cannot go', () => {
    setClubId('tku')
    expect(withClub('/api/book/analytics')).toBe('/api/book/analytics?club=tku')
    expect(withClub('https://table.example/api/files/put/abc?x=1')).toBe('https://table.example/api/files/put/abc?x=1&club=tku')
    vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => true) })
    beacon('/api/book/errors', { a: 1 })
    expect(vi.mocked(navigator.sendBeacon).mock.calls[0][0]).toBe('/api/book/errors?club=tku')
  })

  it('takes the club from the account, and forgets it on signing out', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    await waitFor(() => expect(result.current.user?.clubId).toBe('tku'))
    expect(clubId()).toBe('tku')
    await result.current.logout()
    await waitFor(() => expect(result.current.user).toBeNull())
    expect(clubId()).toBeNull()
  })
})
