import { render, screen, within } from '@testing-library/react'
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
      input === '/api/book/search-index'
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

  it('shows the kind and level with each result', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 503 })))
    renderHome()
    await searchFor('Bergen')
    const link = await screen.findByRole('link', { name: /^Bergen加叫（松濤版）（Bergen Raises）$/ })
    expect(link.parentElement).toHaveTextContent('種類：特約')
    expect(link.parentElement).toHaveTextContent('程度：高階')
  })
})

describe('the 討論 group (e11-t18, AC-11.9)', () => {
  it('lists the forum’s posts after the conventions, and links to the forum’s search page', async () => {
    const post = { id: 'p9', boardId: 'systems', authorId: 'u2', title: 'Bergen 的問題', blocks: [], createdAt: 1, reactions: {}, commentCount: 0 }
    const fetch = vi.fn(async (input: string) =>
      input === '/api/forum/search?q=Bergen&page=1'
        ? new Response(JSON.stringify({ posts: [post], page: 1, pages: 1, query: 'Bergen', total: 1 }))
        : new Response(null, { status: 503 }),
    )
    vi.stubGlobal('fetch', fetch)
    renderHome()
    await searchFor('Bergen')
    const group = await screen.findByRole('region', { name: '討論' })
    expect(await within(group).findByRole('link', { name: 'Bergen 的問題' })).toHaveAttribute('href', '/forum/p/p9')
    expect(within(group).getByRole('link', { name: '在討論區看全部 1 則' })).toHaveAttribute('href', '/forum/search?q=Bergen')
    // Asked once, after the typing stopped
    expect(fetch.mock.calls.filter(([url]) => String(url).startsWith('/api/forum/search'))).toHaveLength(1)
  })

  it('says so when the forum cannot be searched', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 503 })))
    renderHome()
    await searchFor('Bergen')
    const group = await screen.findByRole('region', { name: '討論' })
    expect(await within(group).findByText('討論區暫時搜尋不了')).toBeInTheDocument()
  })
})
