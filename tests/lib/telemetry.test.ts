import {
  analyticsOn,
  FLUSH_MS,
  flush,
  resetAnalytics,
  setAnalyticsConsent,
  trackPage,
  trackProfileSwitch,
  trackQuizAnswer,
  trackSearch,
} from '../../src/lib/analytics.ts'
import { BATCH_MAX, isoWeek, resetVisitor, VISITOR_KEY, visitorId } from '../../src/lib/analyticsSend.ts'
import { anonymousPath } from '../../src/lib/anonymousPath.ts'
import type { BookAnalyticsBatch } from '../../src/lib/api.ts'
import { reportError, resetErrorReports, REPORTS_PER_PAGE, setUpErrorReporting } from '../../src/lib/errorReport.ts'

/** The senders are loaded on first use */
const settled = () => vi.waitFor(() => new Promise((resolve) => setTimeout(resolve, 0)))

/** Error reports (e10-t06) and anonymous usage (e10-t07): what leaves the browser, and when */

let posted: { url: string; body: unknown }[]

beforeEach(() => {
  posted = []
  vi.stubEnv('PROD', true)
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      posted.push({ url, body: JSON.parse(String(init?.body)) })
      return new Response(null, { status: 204 })
    }),
  )
  resetErrorReports()
  resetAnalytics()
  resetVisitor()
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('anonymousPath', () => {
  it('keeps the path only, without the ids of members, teams, partnerships and profiles', () => {
    expect(anonymousPath('/c/stayman')).toBe('/c/stayman')
    expect(anonymousPath('/practice?c=stayman#x')).toBe('/practice')
    expect(anonymousPath('/u/member-42')).toBe('/u/:id')
    expect(anonymousPath('/teams/t1/cards')).toBe('/teams/:id/cards')
    expect(anonymousPath('/pairs/p9')).toBe('/pairs/:id')
    expect(anonymousPath('/profiles/abc/edit')).toBe('/profiles/:id/edit')
    expect(anonymousPath('/cards/abc/wbf')).toBe('/cards/:id/wbf')
    expect(anonymousPath('/teams')).toBe('/teams')
    expect(anonymousPath(`/library/${'x'.repeat(300)}`)).toHaveLength(200)
  })
})

describe('error reports (e10-t06)', () => {
  it('send the path without query, hash or ids, and mask e-mail addresses', async () => {
    window.history.replaceState(null, '', '/u/member-42?token=secret#top')
    await reportError('error', new TypeError('cannot read amy@example.com of 1234567'), 'https://x.test/assets/app.js?v=1:3:4')
    expect(posted).toHaveLength(1)
    const [{ url, body }] = posted
    expect(url).toBe('/api/book/errors')
    expect(body).toMatchObject({
      kind: 'error',
      message: 'TypeError: cannot read <email> of <n>',
      page: '/u/:id',
      source: 'https://x.test/assets/app.js:3:4',
    })
    expect(JSON.stringify(body)).not.toMatch(/secret|member-42|amy/)
  })

  it('send the same message once and at most five a page load', async () => {
    reportError('error', new Error('same'))
    reportError('rejection', new Error('same'))
    for (let i = 0; i < 10; i++) reportError('error', new Error(`e${i}`))
    await settled()
    expect(posted).toHaveLength(REPORTS_PER_PAGE)
    expect(posted.filter((p) => (p.body as { message: string }).message === 'Error: same')).toHaveLength(1)
  })

  it('catch uncaught errors and rejections', async () => {
    setUpErrorReporting()
    window.dispatchEvent(new ErrorEvent('error', { error: new Error('boom'), message: 'boom', filename: '/a.js', lineno: 1, colno: 2 }))
    const rejection = new Event('unhandledrejection') as Event & { reason: unknown }
    rejection.reason = new Error('nope')
    window.dispatchEvent(rejection)
    // A broken image fires `error` with neither: not reported
    window.dispatchEvent(new ErrorEvent('error'))
    await settled()
    expect(posted.map((p) => p.body)).toMatchObject([
      { kind: 'error', message: 'Error: boom', source: '/a.js:1:2' },
      { kind: 'rejection', message: 'Error: nope' },
    ])
  })

  it('send nothing outside a production build', () => {
    vi.stubEnv('PROD', false)
    reportError('error', new Error('dev'))
    expect(posted).toHaveLength(0)
  })
})

describe('anonymous usage (e10-t07)', () => {
  const batches = () => posted.map((p) => p.body as BookAnalyticsBatch)

  it('numbers ISO weeks in UTC from Monday', () => {
    expect(isoWeek(new Date('2026-01-01T12:00:00Z'))).toBe('2026-W01')
    expect(isoWeek(new Date('2024-12-30T00:00:00Z'))).toBe('2025-W01')
    expect(isoWeek(new Date('2027-01-03T23:00:00Z'))).toBe('2026-W53')
    expect(isoWeek(new Date('2026-10-26T00:00:00Z'))).toBe('2026-W44')
    expect(isoWeek(new Date('2026-10-25T23:59:59Z'))).toBe('2026-W43')
  })

  it('makes a new random visitor every week, the same one within it', () => {
    const monday = new Date('2026-10-26T01:00:00Z')
    const a = visitorId(monday)
    expect(a).toMatch(/^[\w-]{16,64}$/)
    expect(visitorId(new Date('2026-11-01T20:00:00Z'))).toBe(a)
    expect(JSON.parse(localStorage.getItem(VISITOR_KEY)!)).toEqual({ week: '2026-W44', id: a })
    const b = visitorId(new Date('2026-11-02T01:00:00Z'))
    expect(b).not.toBe(a)
    expect(JSON.parse(localStorage.getItem(VISITOR_KEY)!).week).toBe('2026-W45')
  })

  it('sends events without anything that names the reader, every 30 seconds', async () => {
    vi.useFakeTimers()
    setAnalyticsConsent(true)
    trackPage('/c/fixture-alpha')
    trackPage('/u/member-42')
    trackProfileSwitch('partnership')
    trackQuizAnswer('fixture-alpha', true)
    // A slug the Worker would not take is left out
    trackQuizAnswer('bad slug!', false)
    expect(posted).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(FLUSH_MS)
    vi.useRealTimers()
    await settled()
    expect(batches()).toHaveLength(1)
    const [batch] = batches()
    expect(Object.keys(batch).sort()).toEqual(['events', 'visitor'])
    expect(batch.events).toEqual([
      { type: 'page', path: '/c/fixture-alpha', slug: 'fixture-alpha' },
      { type: 'page', path: '/u/:id' },
      { type: 'profile-switch', profileKind: 'pair' },
      { type: 'quiz-answer', slug: 'fixture-alpha', correct: true },
    ])
    expect(JSON.stringify(batch)).not.toMatch(/member-42/)
    expect(posted[0].url).toBe('/api/book/events')
  })

  it('sends the query a reader settled on: 2 to 50 characters, not the same twice running', async () => {
    setAnalyticsConsent(true)
    trackSearch('a')
    trackSearch('  stayman ')
    trackSearch('stayman')
    trackSearch('x'.repeat(80))
    await flush()
    expect(batches()[0].events).toEqual([
      { type: 'search', query: 'stayman' },
      { type: 'search', query: 'x'.repeat(50) },
    ])
  })

  it('sends at most 50 events a request', async () => {
    setAnalyticsConsent(true)
    for (let i = 0; i < BATCH_MAX + 3; i++) trackPage(`/c/c${i}`)
    await flush()
    expect(batches().map((b) => b.events.length)).toEqual([BATCH_MAX, 3])
  })

  it('sends nothing when turned off, and drops what was waiting', async () => {
    setAnalyticsConsent(true)
    trackPage('/a')
    setAnalyticsConsent(false)
    trackPage('/b')
    await flush()
    expect(posted).toHaveLength(0)
  })

  it('sends nothing outside a production build', async () => {
    vi.stubEnv('PROD', false)
    setAnalyticsConsent(true)
    trackPage('/a')
    await flush()
    expect(posted).toHaveLength(0)
  })

  it('is on by default unless the browser sends Global Privacy Control or Do Not Track', () => {
    expect(analyticsOn(null)).toBe(true)
    vi.stubGlobal('navigator', { ...navigator, globalPrivacyControl: true })
    expect(analyticsOn(null)).toBe(false)
    expect(analyticsOn(true)).toBe(true)
    vi.stubGlobal('navigator', { ...navigator, globalPrivacyControl: false, doNotTrack: '1' })
    expect(analyticsOn(null)).toBe(false)
    vi.stubGlobal('navigator', { ...navigator, doNotTrack: '0' })
    expect(analyticsOn(null)).toBe(true)
    expect(analyticsOn(false)).toBe(false)
  })
})
