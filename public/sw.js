// TKU BridgeBook service worker: lets phones install the handbook as an app and read it offline.
// Pages come from the network when it is there (so new content shows at once) and from the cache
// when it is not; built files, whose names change with every build, come from the cache. The
// content edited online (/api/book/content) is kept the same way as pages; no other /api call is
// ever cached, since those belong to a signed-in member.

const CACHE = 'tku-bridge-book-v2'
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
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
  if (url.pathname === '/api/book/content') {
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
