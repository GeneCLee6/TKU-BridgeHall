import { request, send, type BookAnalyticsView, type BookClientError } from './api.ts'

/**
 * The admin page's error reports (e10-t06) and usage statistics (e10-t07); TKU-BridgeTable
 * worker. Kept out of api.ts so the home page's JavaScript does not carry them. Reading takes
 * bookEdit (or an admin); turning the club's analytics on or off is an admin's.
 */
export const telemetryApi = {
  /** The newest 100, newest first */
  errors: () => request<{ errors: BookClientError[] }>('/api/book/errors').then((r) => r.errors),
  clearErrors: () => send<unknown>('DELETE', '/api/book/errors'),
  analytics: () => request<BookAnalyticsView>('/api/book/analytics'),
  setAnalytics: (enabled: boolean) => send<BookAnalyticsView>('PUT', '/api/book/analytics/settings', { enabled }),
}
