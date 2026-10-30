import { forgetMemberData, MANIFEST_CACHE_KEY, SW_CACHE } from '../../src/lib/memberCache.ts'
import source from '../../public/sw.js?raw'

/** Signing out forgets what only members read (L0, e10-t20) */
describe('forgetting member data', () => {
  it('drops the cached manifest and every cached /api answer, and keeps the app files', async () => {
    window.localStorage.setItem(MANIFEST_CACHE_KEY, '{}')
    window.localStorage.setItem('tku-bridgebook:prefs', '{}')
    const keys = ['/', '/assets/index-abc.js', '/api/book/manifest', '/api/book/builtin/lebensohl', '/api/book/search-index'].map(
      (path) => new Request(`https://book.test${path}`),
    )
    const deleted: string[] = []
    const cache = { keys: vi.fn(async () => keys), delete: vi.fn(async (r: Request) => deleted.push(new URL(r.url).pathname)) }
    const open = vi.fn(async () => cache)
    vi.stubGlobal('caches', { open })
    await forgetMemberData()
    expect(open).toHaveBeenCalledWith(SW_CACHE)
    expect(deleted).toEqual(['/api/book/manifest', '/api/book/builtin/lebensohl', '/api/book/search-index'])
    expect(window.localStorage.getItem(MANIFEST_CACHE_KEY)).toBeNull()
    expect(window.localStorage.getItem('tku-bridgebook:prefs')).toBe('{}')
  })

  it('names the service worker cache', () => {
    expect(source).toContain(`const CACHE = '${SW_CACHE}'`)
  })
})
