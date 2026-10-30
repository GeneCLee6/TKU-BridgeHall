// @vitest-environment node
import { conventions } from '../fixtures/content.ts'
import { emptyClubProfile, resolveProfile } from '../../src/lib/profiles.ts'
import { walkSections } from '../../src/lib/sections.ts'
import { SPEC_ANY, toSystemSpec, type SpecShows } from '../../src/lib/systemSpec.ts'

/**
 * The built-in conventions as the robot's rules (e7-t02, AC-7.1). src/lib/systemSpec.ts is a copy
 * of TKU-BridgeTable shared/systemSpec.ts (the parity check compares the two); its own tests are
 * in the table. Here: the club profile over the made-up fixtures (tests/fixtures; the club's own
 * conventions have the same test in the private content repository), one snapshot line per rule and
 * per unresolved row, so a change to the content or the patterns shows up in review
 * (docs/SYSTEM-SPEC.md).
 */

const club = emptyClubProfile()
const resolved = resolveProfile([club], club.id, conventions).conventions
const spec = toSystemSpec(resolved, club)

const SUIT = { S: '♠', H: '♥', D: '♦', C: '♣' } as const
const range = ([a, b]: readonly [number, number]) =>
  b === SPEC_ANY ? `${a}+` : a === b ? `${a}` : `${a}-${b}`

/** hcp 15-17 · ♥5 · ♠4+ · 平均 · GF · stayman */
function compact(shows: SpecShows): string {
  const parts: string[] = []
  if (shows.hcp) parts.push(`hcp ${range(shows.hcp)}`)
  for (const [suit, r] of Object.entries(shows.len ?? {}))
    parts.push(`${SUIT[suit as keyof typeof SUIT]}${range(r)}`)
  if (shows.balanced) parts.push('平均')
  if (shows.forcing) parts.push(shows.forcing === 'game' ? 'GF' : 'F1')
  if (shows.name) parts.push(shows.name)
  return parts.join(' · ')
}

const auction = (after: readonly string[]) => after.map((p) => p || '（開叫）').join(' / ')

describe('toSystemSpec over the built-in conventions', () => {
  it('converts every convention, rule by rule', () => {
    const bySlug = Object.fromEntries(
      conventions.map((c) => [
        c.slug,
        {
          rules: spec.rules
            .filter((r) => r.ref.slug === c.slug)
            .map(
              (r) =>
                `#${r.ref.sectionId} | ${auction(r.after)} | ${r.call} | ${compact(r.shows)} | ${r.text}`,
            ),
          unresolved: spec.unresolved
            .filter((u) => u.ref.slug === c.slug)
            .map((u) => {
              const detail = u.detail === undefined ? '' : `[${u.detail}]`
              return `#${u.ref.sectionId} | ${u.call} | ${u.reason}${detail} | ${u.text}`
            }),
        },
      ]),
    )
    expect(bySlug).toMatchSnapshot()
  })

  it('accounts for every row', () => {
    let rows = 0
    for (const c of conventions) {
      walkSections(c.sections, (s) => {
        for (const b of s.blocks ?? []) if (b.kind === 'responses') rows += b.rows.length
      })
    }
    const converted = new Set(
      spec.rules.map((r) => `${r.ref.slug}#${r.ref.sectionId}|${r.text}|${r.after.join('/')}`),
    )
    expect(spec.unresolved.length + converted.size).toBeLessThanOrEqual(rows)
    const reasons: Record<string, number> = {}
    for (const u of spec.unresolved) reasons[u.reason] = (reasons[u.reason] ?? 0) + 1
    expect({
      rules: spec.rules.length,
      unresolved: spec.unresolved.length,
      reasons,
    }).toMatchSnapshot()
  })

  it('keeps every meaning word for word', () => {
    const meanings = new Set<string>()
    for (const c of conventions) {
      walkSections(c.sections, (s) => {
        for (const b of s.blocks ?? [])
          if (b.kind === 'responses') for (const r of b.rows) meanings.add(r.meaning)
      })
    }
    for (const item of [...spec.rules, ...spec.unresolved]) expect(meanings).toContain(item.text)
  })

  it('makes rules with a hand condition and well-formed auctions', () => {
    for (const rule of spec.rules) {
      expect(rule.shows.hcp ?? rule.shows.len ?? rule.shows.balanced).toBeDefined()
      for (const pattern of rule.after) {
        // The robot's `patternProblem`: counting back from the caller, theirs are in brackets
        const tokens = pattern.split(' ').filter(Boolean)
        tokens.forEach((t, i) => {
          const theirs = (tokens.length - 1 - i) % 2 === 0
          expect(t, pattern).toMatch(
            theirs ? /^\((P|X|XX|[1-7][CDHSN])\)$/ : /^(P|X|XX|[1-7][CDHSN])$/,
          )
        })
      }
    }
  })

  it('leaves rows marked 待確認 to a person', () => {
    expect(spec.rules.some((r) => /待確認/.test(r.text))).toBe(false)
    expect(spec.unresolved.filter((u) => u.reason === 'pending').length).toBeGreaterThan(0)
  })
})
