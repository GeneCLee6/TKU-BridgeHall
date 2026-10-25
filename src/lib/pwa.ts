import { useSyncExternalStore } from 'react'

/**
 * The handbook as a phone app (a PWA): the service worker that makes it installable and readable
 * offline, and the browser's install offer. Chrome and Edge on Android and computers offer to
 * install with an event the page can keep and use from its own button; iPhones and iPads have no
 * such event, so the page explains Safari's "Add to Home Screen" instead.
 * Same approach as TKU BridgeTable (淡江牌桌), so both apps install the same way.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let offer: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const changed = () => listeners.forEach((listener) => listener())

/** Call once at start-up: registers the service worker and keeps the install offer for later */
export function setUpApp() {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    offer = event as InstallPromptEvent
    changed()
  })
  window.addEventListener('appinstalled', () => {
    offer = null
    changed()
  })
  // Only the built site: a service worker would get in the way of the dev server
  if (import.meta.env.PROD && 'serviceWorker' in navigator)
    window.addEventListener(
      'load',
      () =>
        void navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => watchForUpdates(registration, navigator.serviceWorker))
          .catch(() => undefined),
    )
}

// --- New versions ----------------------------------------------------------------------------
// Every build is a new service worker (vite.config.ts stamps sw.js). It installs in the
// background and waits; the page offers to reload (UpdatePrompt), and reloading asks it to take
// over first, so the reloaded page and its cache belong to the same version.

let waiting: ServiceWorker | null = null
const updateListeners = new Set<() => void>()
const setWaiting = (worker: ServiceWorker | null) => {
  waiting = worker
  updateListeners.forEach((listener) => listener())
}

/**
 * Notices a new version waiting to take over, now or later. A phone app can stay open for days,
 * so the check for one is repeated whenever the page comes back into view.
 */
export function watchForUpdates(
  registration: ServiceWorkerRegistration,
  container: ServiceWorkerContainer,
) {
  // The very first worker has no older version to replace: nothing to offer
  const offer = (worker: ServiceWorker | null) => worker && container.controller && setWaiting(worker)
  offer(registration.waiting)
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing
    worker?.addEventListener('statechange', () => worker.state === 'installed' && offer(worker))
  })
  let reloading = false
  container.addEventListener('controllerchange', () => {
    if (!waiting || reloading) return
    reloading = true
    window.location.reload()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void registration.update().catch(() => undefined)
  })
}

/** Whether a new version is waiting; `reload` switches to it */
export function useUpdate() {
  const available = useSyncExternalStore(
    (listener) => {
      updateListeners.add(listener)
      return () => updateListeners.delete(listener)
    },
    () => waiting !== null,
    () => false,
  )
  const reload = () => {
    // The page reloads once the new worker has taken over (controllerchange above)
    if (waiting) waiting.postMessage({ type: 'skip-waiting' })
    else window.location.reload()
  }
  return { available, reload }
}

/** Whether the page is already running as the installed app */
export function isStandalone() {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    )
  } catch {
    return false
  }
}

export const isAppleMobile = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** The browser's install offer, if it made one; `install` shows its dialog */
export function useInstallOffer() {
  const available = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => offer !== null,
    () => false,
  )
  const install = async () => {
    if (!offer) return
    await offer.prompt()
    await offer.userChoice.catch(() => undefined)
    offer = null
    changed()
  }
  return { available, install }
}
