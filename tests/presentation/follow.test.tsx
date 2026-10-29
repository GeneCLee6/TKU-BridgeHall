import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'styled-components'
import { FollowButton } from '../../src/components/FollowButton.tsx'
import { createTheme } from '../../src/styles/tokens.ts'

/** 關注這個特約 (e8-t10) against a fake Worker */

let following: boolean | null
let sent: unknown[]

beforeEach(() => {
  following = false
  sent = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      if (String(input) !== '/api/book/follows/stayman' || following === null) return new Response('{}', { status: 503 })
      if (init?.method === 'PUT') {
        const body = JSON.parse(String(init.body)) as { following: boolean }
        sent.push(body)
        following = body.following
      }
      return new Response(JSON.stringify({ following }), { status: 200 })
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

const show = () =>
  render(
    <ThemeProvider theme={createTheme('light')}>
      <FollowButton slug="stayman" />
    </ThemeProvider>,
  )

describe('FollowButton', () => {
  it('follows and stops following a convention', async () => {
    show()
    const button = await screen.findByRole('button', { name: '關注這個特約' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(button)
    expect(await screen.findByRole('button', { name: '已關注' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: '已關注' }))
    expect(await screen.findByRole('button', { name: '關注這個特約' })).toBeInTheDocument()
    expect(sent).toEqual([{ following: true }, { following: false }])
  })

  it('shows nothing when the Worker cannot say', async () => {
    following = null
    show()
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
