import { anonymousPath } from './anonymousPath.ts'
import { beacon } from './beacon.ts'
import type { ErrorReport } from './errorReport.ts'

/**
 * The part of error reporting (lib/errorReport.ts) loaded only once an error happens: cleans the
 * report and sends it to `POST /api/book/errors` (≤ 8192 characters; kind and message required).
 */

export const ERRORS_URL = '/api/book/errors'

/** Masks e-mail addresses, long numbers and URLs' queries, then cuts to `max` characters */
export const scrub = (text: string, max: number) =>
  text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '<email>')
    .replace(/\d{6,}/g, '<n>')
    .replace(/(https?:\/\/[^\s?#)]+)[?#][^\s):]*/g, '$1')
    .slice(0, max)

export function sendError(kind: ErrorReport['kind'], error: unknown, message: string, pathname: string, source?: string) {
  const report: ErrorReport = {
    kind,
    message: scrub(message, 500),
    page: anonymousPath(pathname),
    // The build's commit, which vite.config.ts stamps into index.html
    version: (document.querySelector<HTMLMetaElement>('meta[name="app-version"]')?.content ?? 'unknown').slice(0, 40),
  }
  if (error instanceof Error && error.stack) report.stack = scrub(error.stack, 4000)
  if (source) report.source = scrub(source, 300)
  beacon(ERRORS_URL, report)
}
