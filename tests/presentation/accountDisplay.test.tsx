import { act, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import type { Me } from '../../src/lib/api.ts'
import { AccountDisplaySync } from '../../src/state/AccountDisplaySync.tsx'
import { AuthProvider } from '../../src/state/AuthContext.tsx'
import { PreferencesProvider, usePreferences } from '../../src/state/PreferencesContext.tsx'

/**
 * 個人設定 kept with the account (AC-9.9): the account's settings apply on sign-in, a change here
 * goes to the account, and one that could not be sent is sent again before the account's apply.
 */

let me: Me
let sent: Record<string, unknown>[]
let offline: boolean

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})

beforeEach(() => {
  // Signed in on this device before as the same member
  window.localStorage.removeItem('tku-bridgebook:me')
  me = { id: 'u1', username: 'amy', admin: false, permissions: [] }
  sent = []
  offline = false
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input)
    if (path === '/api/me') return new Response(JSON.stringify({ user: me }))
    if (path === '/api/account/preferences' && init?.method === 'POST') {
      if (offline) throw new TypeError('offline')
      const body = JSON.parse(String(init.body)) as { bookDisplay: Record<string, string> }
      sent.push(body)
      me = { ...me, bookDisplay: body.bookDisplay }
      return new Response(JSON.stringify({ user: me }))
    }
    throw new TypeError(`No route for ${path}`)
  })
})

let change: (changes: Parameters<ReturnType<typeof usePreferences>['update']>[0]) => void
function Probe() {
  const prefs = usePreferences()
  useEffect(() => {
    change = prefs.update
  })
  return (
    <p>
      {prefs.style} {prefs.layout} {prefs.textSize}
    </p>
  )
}

const renderSite = () =>
  render(
    <PreferencesProvider>
      <AuthProvider>
        <AccountDisplaySync />
        <Probe />
      </AuthProvider>
    </PreferencesProvider>,
  )

const storedPrefs = () => JSON.parse(window.localStorage.getItem('tku-bridgebook:prefs') ?? '{}') as Record<string, unknown>

describe('個人設定 kept with the account (AC-9.9)', () => {
  it("applies the account's settings on sign-in, and keeps them on this device too", async () => {
    me.bookDisplay = { style: 'chinese', layout: 'three', textSize: 'large', unknownSetting: 'x' }
    renderSite()
    expect(await screen.findByText('chinese three large')).toBeInTheDocument()
    await waitFor(() => expect(storedPrefs()).toMatchObject({ style: 'chinese', layout: 'three' }))
    // The account already has them: nothing goes back
    await new Promise((done) => setTimeout(done, 1000))
    expect(sent).toEqual([])
  })

  it("gives an account without settings this device's, then sends each change", async () => {
    window.localStorage.setItem('tku-bridgebook:prefs', JSON.stringify({ style: 'plain', newcomerAsked: true }))
    renderSite()
    await waitFor(() => expect(sent).toHaveLength(1), { timeout: 3000 })
    expect(sent[0]).toEqual({
      bookDisplay: expect.objectContaining({ style: 'plain', layout: 'whole', textSize: 'medium' }),
    })
    // Device-only settings stay on the device
    expect(sent[0].bookDisplay).not.toHaveProperty('newcomerAsked')

    act(() => change({ layout: 'focus', textSize: 'small' }))
    await waitFor(() => expect(sent).toHaveLength(2), { timeout: 3000 })
    expect(sent[1].bookDisplay).toMatchObject({ style: 'plain', layout: 'focus', textSize: 'small' })
  })

  it("sends a change made offline next time, instead of taking the account's", async () => {
    me.bookDisplay = { style: 'general', layout: 'whole', textSize: 'medium' }
    offline = true
    const first = renderSite()
    await screen.findByText('general whole medium')
    act(() => change({ style: 'soft' }))
    await waitFor(() => expect(window.localStorage.getItem('tku-bridgebook:displayUnsent')).toBe('u1'), { timeout: 3000 })
    first.unmount()

    offline = false
    renderSite()
    await waitFor(() => expect(sent).toHaveLength(1), { timeout: 3000 })
    expect(sent[0].bookDisplay).toMatchObject({ style: 'soft' })
    expect(screen.getByText('soft whole medium')).toBeInTheDocument()
    await waitFor(() => expect(window.localStorage.getItem('tku-bridgebook:displayUnsent')).toBeNull())
  })
})
