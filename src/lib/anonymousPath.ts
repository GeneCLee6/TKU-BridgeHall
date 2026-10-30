/**
 * The path of a page without anything that names a person or their profile, for error reports
 * (e10-t06) and usage events (e10-t07): no query, no hash, and the id in a member's page, a team, a
 * partnership, a system profile or its cards replaced by `:id`. Conventions, articles, lessons and
 * posts keep their slug or id, which names content, not the reader. At most 200 characters.
 */
const PERSONAL = new Set(['u', 'teams', 'pairs', 'profiles', 'cards'])

export function anonymousPath(pathname: string): string {
  const parts = pathname.split(/[?#]/, 1)[0].split('/')
  if (PERSONAL.has(parts[1]) && parts[2]) parts[2] = ':id'
  return parts.join('/').slice(0, 200) || '/'
}
