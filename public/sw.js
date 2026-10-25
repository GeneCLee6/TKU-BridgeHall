// TKU BridgeBook service worker: lets phones install the handbook as an app and read it offline.
// Pages come from the network when it is there (so new content shows at once) and from the cache
// when it is not; built files, whose names change with every build, come from the cache (each
// convention is its own built file, cached once it has been read). The content edited online
// (/api/book/manifest, /api/book/content/:slug) and the search index are kept the same way as
// pages; no other /api call is ever cached, since those belong to a signed-in member.
//
// Installing also stores what the first screen and the search need (the app shell, the home
// page's built files, the search index and the online manifest), so the handbook opens and
// searches offline after one visit. A new version waits until the page asks it to take over
// (the "new version" prompt, src/lib/pwa.ts); the cache keeps its name across versions, so the
// conventions already read stay readable offline.
//
// Build: __BUILD__ (vite.config.ts stamps a hash of the build here, so every build is a new worker)

const CACHE = 'tku-bridge-book-v4'
const BOOK_CONTENT = /^\/api\/book\/(manifest|content(\/[a-z0-9-]+)?)$/
const SEARCH_INDEX = '/search-index.json'
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/favicon.svg']
// Stored when they can be; the worker installs without them
const PRELOAD = [SEARCH_INDEX, '/api/book/manifest']

/** The built files index.html loads (scripts, styles, preloads) */
const shellAssets = (html) => [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.addAll(SHELL)
      const html = await cache.match('/').then((response) => (response ? response.text() : ''))
      await Promise.all(
        [...PRELOAD, ...shellAssets(html)].map((url) => cache.add(url).catch(() => undefined)),
      )
    }),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'skip-waiting') void self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

const keep = (request, response) => {
  if (response.ok) {
    const copy = response.clone()
    void caches.open(CACHE).then((cache) => cache.put(request, copy))
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    // Every page is the same app shell: newest from the network, the cached one when offline
    event.respondWith(
      fetch(request)
        .then((response) => keep('/', response))
        .catch(() => caches.match('/')),
    )
    return
  }
  if (BOOK_CONTENT.test(url.pathname) || url.pathname === SEARCH_INDEX) {
    event.respondWith(
      fetch(request)
        .then((response) => keep(request, response))
        .catch(() => caches.match(request).then((hit) => hit || Response.error())),
    )
    return
  }
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((response) => keep(request, response))),
    )
  }
})
