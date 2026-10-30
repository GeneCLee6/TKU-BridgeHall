import type { BookAnalyticsBatch, BookAnalyticsEvent } from './api.ts'
import { beacon } from './beacon.ts'

/**
 * The part of anonymous usage (lib/analytics.ts) loaded once the first event is queued: the
 * weekly visitor id and sending the batches to `POST /api/book/events`.
 */

export const EVENTS_URL = '/api/book/events'
export const VISITOR_KEY = 'tku-bridgebook:visitor'
/** Events per request, as the Worker takes them */
export const BATCH_MAX = 50

let memoryVisitor: { week: string; id: string } | undefined

/** The ISO week of `date` in UTC, `YYYY-Www`; weeks start on Monday, as the Worker's do */
export function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const year = d.getUTCFullYear()
  const week = Math.ceil(((d.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')

/** This week's visitor id; a new random one once the week has changed */
export function visitorId(now = new Date()): string {
  const week = isoWeek(now)
  let stored = memoryVisitor
  try {
    stored = JSON.parse(localStorage.getItem(VISITOR_KEY) ?? 'null') ?? undefined
  } catch {
    // Unreadable or no storage: the one kept in memory
  }
  if (stored?.week === week && typeof stored.id === 'string' && /^[\w-]{16,64}$/.test(stored.id)) return stored.id
  memoryVisitor = { week, id: randomId() }
  try {
    localStorage.setItem(VISITOR_KEY, JSON.stringify(memoryVisitor))
  } catch {
    // Without storage the id lasts until the page closes
  }
  return memoryVisitor.id
}

/** Sends the events, at most BATCH_MAX a request */
export function sendEvents(events: BookAnalyticsEvent[]) {
  const visitor = visitorId()
  for (let i = 0; i < events.length; i += BATCH_MAX)
    beacon(EVENTS_URL, { visitor, events: events.slice(i, i + BATCH_MAX) } satisfies BookAnalyticsBatch)
}

/** For tests: a fresh browser */
export const resetVisitor = () => {
  memoryVisitor = undefined
}
