import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { searchIndexJson } from '../../scripts/search-index.ts'
import { App } from '../../src/App.tsx'
import type { SearchIndex } from '../../src/lib/search.ts'

beforeAll(() => {
  // jsdom has no matchMedia
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})

afterEach(() => vi.unstubAllGlobals())

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )

const searchFor = async (query: string) => {
  await userEvent.click(screen.getByRole('searchbox'))
  await userEvent.type(screen.getByRole('searchbox'), query)
}

describe('search box', () => {
  it('searches the full text from the index built with the site', async () => {
    // A record only the index has, so a hit proves the index was searched
    const index = JSON.parse(searchIndexJson()) as SearchIndex
    index.records.push({ slug: 'lebensohl', label: '雷本索特約 › 索引專屬', name: '', tags: '', bids: '', text: '只在索引裡的句子' })
    const fetch = vi.fn(async (input: string) =>
      input === '/search-index.json'
        ? new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } })
        : new Response(null, { status: 503 }),
    )
    vi.stubGlobal('fetch', fetch)
    renderHome()
    await searchFor('只在索引裡的句子')
    expect(await screen.findByRole('link', { name: /索引專屬/ })).toBeInTheDocument()
  })

  it('falls back to loading every convention when the index cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 503 })))
    renderHome()
    // Only in a section's text, not in any title: found once every convention has loaded
    await searchFor('張花色只能是低花')
    expect(await screen.findByRole('link', { name: /^1NT的答叫 › 開叫1NT$/ })).toBeInTheDocument()
  })
})
