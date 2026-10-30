/**
 * What only members may read, kept on this device for a head start and for reading offline (L0,
 * e10-t20): the manifest this browser saw last (localStorage) and the API answers the service
 * worker cached (public/sw.js: the manifest, conventions, the search index). Signing out, or the
 * Worker saying the session is gone, forgets all of it, so the next person on this device sees
 * nothing without signing in.
 */

/** ContentContext's copy of the last manifest (the name predates the `tku-bridgebook:` prefix) */
export const MANIFEST_CACHE_KEY = 'tku-bridge-book-manifest'
/** public/sw.js `CACHE` */
export const SW_CACHE = 'tku-bridge-book-v4'

export async function forgetMemberData(): Promise<void> {
  try {
    window.localStorage.removeItem(MANIFEST_CACHE_KEY)
  } catch {
    // Without storage there is nothing kept
  }
  try {
    if (typeof caches === 'undefined') return
    const cache = await caches.open(SW_CACHE)
    const requests = await cache.keys()
    await Promise.all(requests.filter((r) => new URL(r.url).pathname.startsWith('/api/')).map((r) => cache.delete(r)))
  } catch {
    // No service worker cache here (an insecure origin, a private window)
  }
}
