import type { ProfileSummary, SystemProfile } from '../../src/lib/api.ts'
import {
  copyProfile,
  copySources,
  isFresh,
  memberName,
  overrideRef,
  pairComparePath,
  pairName,
  profileDiff,
  withoutOverride,
} from '../../src/lib/teams.ts'

const base = { version: 1, updatedAt: 0, updatedBy: 'u1', overrides: [], notes: [], adopted: {} }
const summary = (id: string, name: string, scope: ProfileSummary['scope'], parentId?: string): ProfileSummary => ({
  id,
  name,
  scope,
  parentId,
  version: 1,
  updatedAt: 0,
  updatedBy: 'u1',
  counts: { adopted: 0, overrides: 0, notes: 0 },
})

describe('team helpers', () => {
  const members = [
    { id: 'u1', username: 'amy', displayName: '小明' },
    { id: 'u2', username: 'bob' },
  ]

  it('names members by display name, then username, then id', () => {
    expect(memberName(members, 'u1')).toBe('小明')
    expect(memberName(members, 'u2')).toBe('bob')
    expect(memberName(members, 'u9')).toBe('u9')
    expect(pairName(members, ['u2', 'u1'])).toBe('bob＋小明')
  })

  it('counts a profile’s own overrides and adoptions', () => {
    const profile = {
      adopted: { a: 'off', b: 'off', c: 'on' } as const,
      overrides: [{ kind: 'meta', slug: 'a', summary: 'x' }] as SystemProfile['overrides'],
    }
    expect(profileDiff(profile)).toEqual({ overrides: 1, off: 2, on: 1 })
    expect(isFresh(profile)).toBe(false)
    expect(isFresh({ adopted: {}, overrides: [] })).toBe(true)
  })

  it('offers the teams and other partnerships to copy from, not the club, itself or its parent', () => {
    const list = [
      summary('club', '社團預設', 'club'),
      summary('p2', '乙＋丙', 'partnership', 't1'),
      summary('t1', '甲隊', 'team'),
      summary('t2', '乙隊', 'team'),
      summary('me', '我們', 'partnership', 't1'),
    ]
    expect(copySources(list, { id: 'me', parentId: 't1' }).map((s) => s.id)).toEqual(['t2', 'p2'])
    // Without a team the parent is the club, and every team may be copied
    expect(copySources(list, { id: 'me' }).map((s) => s.id)).toEqual(['t2', 't1', 'p2'])
  })

  it('copies the adoptions and overrides but keeps the target’s notes, name, scope and parent (AC-2.7)', () => {
    const target: SystemProfile = {
      ...base,
      id: 'me',
      name: '我們',
      scope: 'partnership',
      parentId: 't1',
      visibility: 'members',
      adopted: { old: 'off' },
      notes: [{ slug: 'x', text: '我們的備忘', by: 'u1', at: 0 }] as SystemProfile['notes'],
    }
    const source: SystemProfile = {
      ...base,
      id: 'p2',
      name: '乙＋丙',
      scope: 'partnership',
      adopted: { a: 'on' },
      overrides: [{ kind: 'meta', slug: 'a', summary: 'x' }] as SystemProfile['overrides'],
      notes: [{ slug: 'y', text: '別人的備忘', by: 'u2', at: 0 }] as SystemProfile['notes'],
    }
    const input = copyProfile(target, source)
    expect(input).toEqual({
      name: '我們',
      scope: 'partnership',
      parentId: 't1',
      visibility: 'members',
      adopted: { a: 'on' },
      overrides: source.overrides,
      notes: target.notes,
    })
    expect(input.adopted).not.toBe(source.adopted)
  })
})

describe('建議統一 (e2-t08)', () => {
  const row = { kind: 'row' as const, slug: 'stayman', sectionId: 's1', blockIndex: 0, rowIndex: 2, meaning: '改' }
  const section = { kind: 'section' as const, slug: 'stayman', sectionId: 's2', section: { id: 's2', title: '段' } }
  const profile: SystemProfile = {
    ...base,
    id: 'p1',
    name: '小明＋bob',
    scope: 'partnership',
    parentId: 't1',
    adopted: { jacoby: 'off' },
    overrides: [row, section],
    notes: [{ slug: 'stayman', text: '備忘', by: 'u1', at: 0 }],
  }

  it('names each override as the Worker does', () => {
    expect(overrideRef(row)).toBe('row:stayman:s1:0:2')
    expect(overrideRef(section)).toBe('section:stayman:s2')
    expect(overrideRef({ kind: 'meta', slug: 'stayman', summary: 'x' })).toBe('meta:stayman')
  })

  it('drops only the named override and keeps everything else', () => {
    expect(withoutOverride(profile, 'row:stayman:s1:0:2')).toEqual({
      name: '小明＋bob',
      scope: 'partnership',
      parentId: 't1',
      adopted: { jacoby: 'off' },
      overrides: [section],
      notes: profile.notes,
    })
    expect(withoutOverride(profile, 'row:nothing:x:0:0').overrides).toEqual([row, section])
  })

  it('links the team page to a partnership\'s compare page with the team and the pair', () => {
    expect(pairComparePath('p 1', 't1', 'x1')).toBe('/profiles/p%201/compare?team=t1&pair=x1')
  })
})
