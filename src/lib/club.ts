/**
 * Which club the signed-in member belongs to (e10-t11). Each club is its own Durable Object in TKU
 * BridgeTable's Worker (its e12-t02, shared/clubs.ts); every call says which one with `X-Club-Id`,
 * or `?club=` where a header cannot go (sendBeacon) or would need a new CORS preflight (the calls
 * straight to the Worker). The club comes from the account (`Me.clubId`); before signing in there
 * is none and the Worker takes 淡江, so the site behaves exactly as before clubs.
 */

/** TKU BridgeTable shared/clubs.ts CLUB_HEADER and CLUB_PARAM */
export const CLUB_HEADER = 'X-Club-Id'
export const CLUB_PARAM = 'club'

let current: string | null = null

/** Set from the account each time it is read or cleared (AuthContext's `keep`) */
export function setClubId(clubId: string | null | undefined) {
  current = clubId || null
}

export function clubId(): string | null {
  return current
}

/** The headers of a call, with the member's club when there is one */
export function clubHeaders(headers?: HeadersInit): Headers {
  const all = new Headers(headers)
  if (current) all.set(CLUB_HEADER, current)
  return all
}

/** The address with `?club=` added when there is a club (relative addresses stay relative) */
export function withClub(url: string): string {
  if (!current) return url
  const parsed = new URL(url, 'https://relative.invalid')
  parsed.searchParams.set(CLUB_PARAM, current)
  return parsed.origin === 'https://relative.invalid' ? `${parsed.pathname}${parsed.search}${parsed.hash}` : parsed.toString()
}
