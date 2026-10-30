import { describe, expect, it } from 'vitest'
import type { ProfileOverride, SystemProfile } from '../../src/lib/api.ts'
import { changesNothing, compareProfile, type RowChange, type SectionChange } from '../../src/lib/profileCompare.ts'
import type { Convention } from '../../src/types/convention.ts'

const convention = (slug: string): Convention => ({
  slug,
  nameZh: `特約 ${slug}`,
  nameEn: slug,
  category: 'notrump',
  tags: ['t'],
  summary: '原本的摘要',
  source: { title: 'Word' },
  updated: '2026-01-01',
  sections: [
    {
      id: 'top',
      title: '上層',
      blocks: [
        { kind: 'paragraph', text: '說明' },
        {
          kind: 'responses',
          auction: { seats: ['北', '東', '南', '西'], calls: ['1NT', 'P', '?'] },
          rows: [
            { call: '2C', meaning: '問高花', note: '原註' },
            { call: '2D', meaning: '轉換' },
          ],
        },
      ],
      children: [{ id: 'inner', title: '下層', blocks: [{ kind: 'responses', rows: [{ call: '3C', meaning: '原意' }] }] }],
    },
  ],
})

const CONTENT: Convention[] = [convention('alpha'), convention('beta'), convention('gamma')]

const profile = (p: Partial<SystemProfile> & Pick<SystemProfile, 'id' | 'scope'>): SystemProfile => ({
  name: p.id,
  adopted: {},
  overrides: [],
  notes: [],
  version: 1,
  updatedAt: 0,
  updatedBy: 'u1',
  ...p,
})

const club = (p: Partial<SystemProfile> = {}) => profile({ ...p, id: 'club', scope: 'club' })
const team = (p: Partial<SystemProfile> = {}) => profile({ id: 'team', scope: 'team', ...p })
const pair = (p: Partial<SystemProfile> = {}) => profile({ id: 'pair', scope: 'partnership', parentId: 'team', ...p })

const row = (meaning: string, extra: Partial<Extract<ProfileOverride, { kind: 'row' }>> = {}): ProfileOverride => ({
  kind: 'row',
  slug: 'alpha',
  sectionId: 'top',
  blockIndex: 1,
  rowIndex: 0,
  meaning,
  ...extra,
})

describe('compareProfile', () => {
  it('finds nothing for a profile that changes nothing', () => {
    const result = compareProfile([club(), team()], 'team', CONTENT)
    expect(result.parent?.id).toBe('club')
    expect(changesNothing(result)).toBe(true)
  })

  it('compares a row with the resolved parent, not with the handbook', () => {
    const profiles = [club(), team({ overrides: [row('隊伍的意思')] }), pair({ overrides: [row('搭檔的意思', { note: '' })] })]
    const result = compareProfile(profiles, 'pair', CONTENT)
    expect(result.parent?.id).toBe('team')
    expect(result.conventions).toHaveLength(1)
    const change = result.conventions[0]!.changes[0] as RowChange
    expect(change.kind).toBe('row')
    expect(change.trail).toEqual(['上層'])
    expect(change.auction?.calls).toEqual(['1NT', 'P', '?'])
    expect(change.before).toMatchObject({ call: '2C', meaning: '隊伍的意思', note: '原註', origin: 'team' })
    expect(change.after).toEqual({ call: '2C', meaning: '搭檔的意思', origin: 'partnership' })
  })

  it('compares the club with the handbook itself', () => {
    const result = compareProfile([club({ overrides: [row('社團的意思')] })], 'club', CONTENT)
    expect(result.parent).toBeUndefined()
    const change = result.conventions[0]!.changes[0] as RowChange
    expect(change.before?.meaning).toBe('問高花')
    expect(change.after.meaning).toBe('社團的意思')
  })

  it('lists only its own changes, meta first, grouped in the content order', () => {
    const profiles = [
      club({ overrides: [row('社團的意思', { slug: 'beta' })] }),
      team({
        overrides: [
          row('新', { slug: 'gamma' }),
          { kind: 'section', slug: 'alpha', sectionId: 'inner', section: { id: 'x', title: '新的下層' } },
          { kind: 'meta', slug: 'alpha', tags: ['新'] },
        ],
      }),
    ]
    const result = compareProfile(profiles, 'team', CONTENT)
    expect(result.conventions.map((c) => c.slug)).toEqual(['alpha', 'gamma'])
    const [meta, section] = result.conventions[0]!.changes
    expect(meta).toMatchObject({
      kind: 'meta',
      before: { summary: '原本的摘要', tags: ['t'] },
      after: { summary: '原本的摘要', tags: ['新'] },
    })
    expect(section!.kind).toBe('section')
    const s = section as SectionChange
    expect(s.trail).toEqual(['上層'])
    expect(s.before?.title).toBe('下層')
    expect(s.after).toMatchObject({ id: 'inner', title: '新的下層', origin: 'team' })
  })

  it('has no original for a row inside a section the same profile replaced', () => {
    const replacement = { id: 'inner', title: '新', blocks: [{ kind: 'responses' as const, rows: [{ call: '3C', meaning: '新意' }] }] }
    const profiles = [
      club(),
      team({
        overrides: [row('再改', { sectionId: 'inner', blockIndex: 0 }), { kind: 'section', slug: 'alpha', sectionId: 'inner', section: replacement }],
      }),
    ]
    const changes = compareProfile(profiles, 'team', CONTENT).conventions[0]!.changes
    const r = changes.find((c) => c.kind === 'row') as RowChange
    expect(r.before).toBeUndefined()
    expect(r.after.meaning).toBe('再改')
  })

  it('lists adoptions against the parent, and overrides on a convention that is not played', () => {
    const profiles = [
      club({ adopted: { beta: 'off' } }),
      team({ adopted: { beta: 'on', gamma: 'off' }, overrides: [row('新', { slug: 'gamma' })] }),
    ]
    const result = compareProfile(profiles, 'team', CONTENT)
    expect(result.adoptions).toEqual([
      { slug: 'beta', name: '特約 beta', value: 'on', parentPlays: false },
      { slug: 'gamma', name: '特約 gamma', value: 'off', parentPlays: true },
    ])
    const gamma = result.conventions.find((c) => c.slug === 'gamma')!
    expect(gamma.played).toBe(false)
    expect((gamma.changes[0] as RowChange).before?.meaning).toBe('問高花')
  })

  it('reports what points at nothing instead of listing it as a change', () => {
    const missingRow = row('沒有這列', { rowIndex: 9 })
    const missingSection = row('沒有這段', { sectionId: 'nowhere' })
    const missingConvention = row('沒有這個特約', { slug: 'gone' })
    const profiles = [
      club({ overrides: [row('社團的', { rowIndex: 7 })] }),
      team({
        adopted: { gone: 'off', gamma: 'off' },
        overrides: [missingRow, missingSection, missingConvention, row('好的', { slug: 'gamma' })],
        notes: [{ slug: 'gamma', sectionId: 'nowhere', text: '備忘', by: 'u1', at: 0 }],
      }),
    ]
    const result = compareProfile(profiles, 'team', CONTENT)
    expect(result.conventions.map((c) => c.slug)).toEqual(['gamma'])
    expect(result.problems).toEqual(
      expect.arrayContaining([
        { kind: 'unknownAdoption', profileId: 'team', slug: 'gone' },
        { kind: 'brokenOverride', profileId: 'team', override: missingRow, missing: 'row' },
        { kind: 'brokenOverride', profileId: 'team', override: missingSection, missing: 'section' },
        { kind: 'brokenOverride', profileId: 'team', override: missingConvention, missing: 'convention' },
        expect.objectContaining({ kind: 'brokenNote', profileId: 'team', missing: 'section' }),
      ]),
    )
    // The club's broken override belongs on the club's own page
    expect(result.problems).toHaveLength(5)
    expect(changesNothing(result)).toBe(false)
  })

  it('reports a missing parent and compares with the club', () => {
    const result = compareProfile([club(), pair({ overrides: [row('新')] })], 'pair', CONTENT)
    expect(result.parent?.id).toBe('club')
    expect(result.problems).toEqual([{ kind: 'missingParent', profileId: 'pair', parentId: 'team' }])
    expect((result.conventions[0]!.changes[0] as RowChange).before?.meaning).toBe('問高花')
  })

  it('never changes its arguments', () => {
    const profiles = [club({ adopted: { beta: 'off' } }), team({ overrides: [row('新')] })]
    const copy = structuredClone(profiles)
    const content = structuredClone(CONTENT)
    compareProfile(profiles, 'team', content)
    expect(profiles).toEqual(copy)
    expect(content).toEqual(CONTENT)
  })
})
