import type { BookClientError } from './api.ts'

/**
 * Error reporting (e10-t06): the page's uncaught errors, unhandled promise rejections and what the
 * error boundary catches (components/ErrorBoundary.tsx) go to `POST /api/book/errors`, where
 * editors read them on the admin page. Nothing about the reader goes along: no member id, the
 * page's path without query or ids (lib/anonymousPath.ts), e-mail addresses and long numbers
 * masked (lib/errorSend.ts, loaded only when there is something to send; the Worker cleans them
 * again). Production builds only; at most 5 reports per page load and the same message once, so a
 * render loop sends a handful. Not affected by 傳送匿名使用統計, which is about usage (e10-t07);
 * 個人設定 says so. Sending never throws and never retries.
 */

export type ErrorReport = Pick<BookClientError, 'kind' | 'message' | 'source' | 'stack' | 'page' | 'version'>

export const REPORTS_PER_PAGE = 5

const sent = new Set<string>()

/** Reports an error, within this page load's limits; production builds only */
export function reportError(kind: ErrorReport['kind'], error: unknown, source?: string): Promise<void> | undefined {
  if (!import.meta.env.PROD) return
  const message = error instanceof Error ? `${error.name}: ${error.message}` : typeof error === 'string' ? error : ''
  if (!message || sent.size >= REPORTS_PER_PAGE || sent.has(message)) return
  sent.add(message)
  const { pathname } = location
  return import('./errorSend.ts').then(
    (m) => m.sendError(kind, error, message, pathname, source),
    () => {},
  )
}

/** For tests: a new page load */
export const resetErrorReports = () => sent.clear()

/** Call once at start-up */
export function setUpErrorReporting() {
  window.addEventListener('error', (event) => {
    // Failed images and scripts fire `error` too, without an error or a message: not the page's bugs
    if (!event.error && !event.message) return
    void reportError('error', event.error ?? event.message, event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined)
  })
  window.addEventListener('unhandledrejection', (event) => void reportError('rejection', event.reason))
}
