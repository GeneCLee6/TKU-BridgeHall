import { anonymousPath } from './anonymousPath.ts'
import type { BookAnalyticsEvent, ProfileScope } from './api.ts'

/**
 * Anonymous usage (e10-t07): pages opened, the searches readers settle on, switching system
 * profile (its kind only) and practice answers, queued here and sent to `POST /api/book/events`
 * every 30 seconds, when 50 have gathered, or when the page is hidden or closed (sendBeacon first).
 *
 * Nothing names the reader: no account, no profile, team or partnership id (paths go through
 * lib/anonymousPath.ts). The batch carries `visitor`, a random id this browser makes afresh every
 * ISO week (localStorage `tku-bridgebook:visitor`, with the week), which only lets the Worker count
 * weekly readers. Production builds only, and only while the reader has not turned off 傳送匿名使用統計
 * (個人設定; off by default when the browser sends Global Privacy Control or Do Not Track). The club
 * turns it off for everyone on the admin page; the Worker then drops what comes in.
 *
 * This is the queue only, in the home page's download; sending (the visitor id, the batches) is
 * lib/analyticsSend.ts, loaded when the first event is queued.
 */

export const FLUSH_MS = 30_000
const BATCH_MAX = 50
/** What the Worker takes as a slug; an event with another is dropped there, so not sent */
const SLUG = /^[\w-]{1,100}$/

type Sender = typeof import('./analyticsSend.ts')

let queue: BookAnalyticsEvent[] = []
let consent = false
let timer: ReturnType<typeof setTimeout> | undefined
let lastQuery = ''
let sender: Promise<Sender> | undefined
let loaded: Sender | undefined

const load = () =>
  (sender ??= import('./analyticsSend.ts').then((m) => (loaded = m)).catch((e: unknown) => {
    sender = undefined
    throw e
  }))

/** The browser asks sites not to track (Global Privacy Control, Do Not Track) */
export const privacySignal = () => {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1'
}

/** The reader's choice (個人設定), or before they choose, on unless the browser asks not to track */
export const analyticsOn = (choice: boolean | undefined) => choice ?? !privacySignal()

/** Whether to send; turning it off drops what is waiting */
export function setAnalyticsConsent(on: boolean) {
  consent = on
  if (!on) {
    queue = []
    clearTimeout(timer)
    timer = undefined
  }
}

/** Sends what is waiting; at once when the sender has loaded, which it has once anything was queued */
export function flush(): Promise<void> {
  clearTimeout(timer)
  timer = undefined
  if (!queue.length) return Promise.resolve()
  const events = queue
  queue = []
  if (loaded) {
    loaded.sendEvents(events)
    return Promise.resolve()
  }
  return load().then(
    (m) => m.sendEvents(events),
    () => {},
  )
}

export function track(event: BookAnalyticsEvent) {
  if (!import.meta.env.PROD || !consent) return
  if (event.slug !== undefined && !SLUG.test(event.slug)) delete event.slug
  queue.push(event)
  void load().catch(() => {})
  if (queue.length >= BATCH_MAX) void flush()
  else timer ??= setTimeout(() => void flush(), FLUSH_MS)
}

/** A page opened; a convention's page names the convention */
export function trackPage(pathname: string) {
  const path = anonymousPath(pathname)
  const slug = /^\/c\/([^/]+)/.exec(path)?.[1]
  track(slug && SLUG.test(slug) ? { type: 'page', path, slug } : { type: 'page', path })
}

/** The query a reader stopped at or picked a result for; 2 to 50 characters, not the same twice running */
export function trackSearch(query: string) {
  const q = query.trim().slice(0, 50)
  if (q.length < 2 || q === lastQuery) return
  lastQuery = q
  track({ type: 'search', query: q })
}

const KINDS = { club: 'club', team: 'team', partnership: 'pair' } as const

/** Switched system profile: only which kind it is */
export const trackProfileSwitch = (scope: ProfileScope) => track({ type: 'profile-switch', profileKind: KINDS[scope] })

export const trackQuizAnswer = (slug: string, correct: boolean) =>
  SLUG.test(slug) && track({ type: 'quiz-answer', slug, correct })

/** Call once at start-up: sends what is waiting when the page is hidden or closed */
export function startAnalytics() {
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && void flush())
  window.addEventListener('pagehide', () => void flush())
}

/** For tests: a fresh page */
export function resetAnalytics() {
  setAnalyticsConsent(false)
  lastQuery = ''
}
