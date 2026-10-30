// @vitest-environment node
import { conventions } from '../fixtures/content.ts'
import type { RobotShows } from '../../src/lib/api.ts'
import { emptyClubProfile, resolveProfile } from '../../src/lib/profiles.ts'
import {
  batches,
  compareSpec,
  differences,
  meaningQueries,
  sameSpec,
  unresolvedByReason,
} from '../../src/lib/specReport.ts'
import { SPEC_ANY, toSystemSpec, type SpecRule, type SystemSpec } from '../../src/lib/systemSpec.ts'
import { SYSTEM_SPEC_LIMITS } from '../../src/lib/tableSync.ts'

/** The report page's sums (e7-t04, AC-7.2) */

const rule = (shows: SpecRule['shows'], after = ['1N (P)'], call = '2C'): SpecRule => ({
  after,
  call,
  shows,
  text: '原文',
  ref: { slug: 'fixture-alpha', sectionId: 'a' },
})
const robot = (shows: Omit<RobotShows, 'text'>): RobotShows => ({ text: '機器人', ...shows })
const spec = (rules: SpecRule[]): SystemSpec => ({
  profileId: 'club',
  version: 1,
  rules,
  unresolved: [],
})

describe('meaningQueries', () => {
  it('asks about each auction once, with every call after it', () => {
    const queries = meaningQueries(
      spec([
        rule({}, ['1N (P)'], '2C'),
        rule({}, ['1N (P)'], '2D'),
        rule({}, ['1N (P)', '1C (P)'], '2C'),
      ]),
    )
    expect(queries).toEqual([
      { after: '1N (P)', calls: ['2C', '2D'] },
      { after: '1C (P)', calls: ['2C'] },
    ])
  })

  it('fits the built-in conventions into the table’s limits', () => {
    const club = emptyClubProfile()
    const built = toSystemSpec(resolveProfile([club], club.id, conventions).conventions, club)
    const queries = meaningQueries(built)
    expect(queries.every((q) => q.calls.length <= SYSTEM_SPEC_LIMITS.meaningCallsMax)).toBe(true)
    expect(JSON.stringify(built).length).toBeLessThan(SYSTEM_SPEC_LIMITS.bytesMax)
    expect(batches(queries, SYSTEM_SPEC_LIMITS.meaningItemsMax).length).toBeLessThan(40)
  })
})

describe('batches', () => {
  it('splits a list', () => {
    expect(batches([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(batches([], 2)).toEqual([])
  })
})

describe('differences', () => {
  it('compares only what the handbook states', () => {
    expect(
      differences(
        rule({ hcp: [15, 17] }),
        robot({ hcp: [15, 17], balanced: true, name: 'stayman' }),
      ),
    ).toEqual([])
    expect(differences(rule({ hcp: [15, 17] }), robot({ hcp: [14, 17] }))).toEqual(['hcp'])
    expect(differences(rule({ hcp: [15, 17] }), robot({}))).toEqual(['hcp'])
  })

  it('reads every open top the same', () => {
    expect(
      differences(
        rule({ hcp: [8, SPEC_ANY], len: { H: [5, SPEC_ANY] } }),
        robot({ hcp: [8, 37], len: { H: [5, 13] } }),
      ),
    ).toEqual([])
    expect(
      differences(
        rule({ len: { H: [5, SPEC_ANY], S: [4, SPEC_ANY] } }),
        robot({ len: { H: [5, 5] } }),
      ),
    ).toEqual(['lenS', 'lenH'])
  })

  it('compares balanced, forcing and the name', () => {
    expect(
      differences(
        rule({ balanced: true, forcing: 'game', name: 'stayman' }),
        robot({ forcing: 'oneRound', name: 'texas' }),
      ),
    ).toEqual(['balanced', 'forcing', 'name'])
  })
})

describe('compareSpec', () => {
  it('lists the calls TKB lacks and the ones it reads otherwise, of the auctions asked so far', () => {
    const s = spec([
      rule({ hcp: [8, SPEC_ANY] }, ['1N (P)'], '2C'),
      rule({ hcp: [0, 7] }, ['1N (P)'], '2D'),
      rule({}, ['1C (P)'], '1H'),
    ])
    const found = compareSpec(s, [
      { after: '1N (P)', meanings: { '2C': robot({ hcp: [8, 37] }), '2D': null } },
    ])
    expect(found.map((m) => [m.after, m.rule.call, m.robot?.text ?? null, m.fields])).toEqual([
      ['1N (P)', '2D', null, []],
    ])
    const again = compareSpec(s, [
      {
        after: '1N (P)',
        meanings: { '2C': robot({ hcp: [10, 37] }), '2D': robot({ hcp: [0, 7] }) },
      },
    ])
    expect(again.map((m) => [m.rule.call, m.fields])).toEqual([['2C', ['hcp']]])
  })
})

describe('unresolvedByReason', () => {
  it('groups the rows in the report’s order, leaving out empty groups', () => {
    const s = spec([])
    const row = (reason: SystemSpec['unresolved'][number]['reason']) => ({
      ref: { slug: 's', sectionId: 'a' },
      call: '2C',
      text: 'x',
      reason,
    })
    s.unresolved = [row('noConditions'), row('pending'), row('noConditions')]
    expect(unresolvedByReason(s).map((g) => [g.reason, g.rows.length])).toEqual([
      ['pending', 1],
      ['noConditions', 2],
    ])
  })
})

describe('sameSpec', () => {
  it('tells a changed spec', () => {
    expect(sameSpec(spec([rule({})]), spec([rule({})]))).toBe(true)
    expect(sameSpec(spec([rule({})]), spec([rule({ hcp: [1, 2] })]))).toBe(false)
  })
})
