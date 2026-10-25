import source from '../../public/sw.js?raw'

/**
 * The service worker run against a fake worker scope: what installing stores, and that a new
 * version waits for the page instead of taking over by itself.
 */
type Listener = (event: Record<string, unknown>) => void

function startWorker(site: Record<string, string>) {
  const listeners: Record<string, Listener> = {}
  const stored = new Map<string, Response>()
  const cache = {
    addAll: vi.fn(async (urls: string[]) => {
      for (const url of urls) stored.set(url, new Response(site[url] ?? ''))
    }),
    add: vi.fn(async (url: string) => {
      if (!(url in site)) throw new Error(`offline: ${url}`)
      stored.set(url, new Response(site[url]))
    }),
    match: vi.fn(async (url: string) => stored.get(url)?.clone()),
    put: vi.fn(),
  }
  const scope = {
    addEventListener: (type: string, listener: Listener) => (listeners[type] = listener),
    skipWaiting: vi.fn(async () => {}),
    clients: { claim: vi.fn(async () => {}) },
    location: { origin: 'https://book.test' },
  }
  const caches = { open: vi.fn(async () => cache), keys: vi.fn(async () => []), delete: vi.fn() }
  new Function('self', 'caches', 'fetch', source)(scope, caches, vi.fn())
  const dispatch = async (type: string, event: Record<string, unknown> = {}) => {
    let work: Promise<unknown> = Promise.resolve()
    listeners[type]({ ...event, waitUntil: (p: Promise<unknown>) => (work = p) })
    await work
  }
  return { scope, stored, dispatch }
}

const home = `<!doctype html><script type="module" src="/assets/index-abc.js"></script>
<link rel="modulepreload" href="/assets/vendor-def.js"><link rel="stylesheet" href="/assets/index-ghi.css">`

describe('service worker', () => {
  it('stores the shell, the home page files, the search index and the online manifest on install', async () => {
    const { stored, dispatch } = startWorker({
      '/': home,
      '/search-index.json': '{}',
      '/api/book/manifest': '{}',
      '/assets/index-abc.js': '',
      '/assets/vendor-def.js': '',
      '/assets/index-ghi.css': '',
    })
    await dispatch('install')
    expect([...stored.keys()]).toEqual(
      expect.arrayContaining([
        '/',
        '/search-index.json',
        '/api/book/manifest',
        '/assets/index-abc.js',
        '/assets/vendor-def.js',
        '/assets/index-ghi.css',
      ]),
    )
  })

  it('installs even when the extras cannot be fetched', async () => {
    const { stored, dispatch } = startWorker({ '/': home })
    await dispatch('install')
    expect(stored.has('/')).toBe(true)
    expect(stored.has('/search-index.json')).toBe(false)
  })

  it('waits for the page before taking over', async () => {
    const { scope, dispatch } = startWorker({ '/': home })
    await dispatch('install')
    expect(scope.skipWaiting).not.toHaveBeenCalled()
    await dispatch('message', { data: { type: 'skip-waiting' } })
    expect(scope.skipWaiting).toHaveBeenCalled()
  })

  it('carries a build stamp for vite.config.ts to fill in', () => {
    expect(source).toContain('__BUILD__')
  })
})
