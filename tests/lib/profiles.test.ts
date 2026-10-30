import { describe, expect, it } from 'vitest'
import { conventions as bundled } from '../fixtures/content.ts'
import type { ProfileOverride, ProfileSummary, SystemProfile } from '../../src/lib/api.ts'
import {
  emptyClubProfile,
  loadProfileView,
  profileChain,
  profileView,
  resolveProfile,
  unchanged,
  type ResolvedBlock,
} from '../../src/lib/profiles.ts'
import { conventionMeta } from '../../src/lib/sections.ts'
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
          rows: [
            { call: '2C', meaning: '問高花', note: '原註' },
            { call: '2D', meaning: '轉換', pending: '原文不清楚' },
          ],
        },
      ],
      children: [{ id: 'inner', title: '下層', blocks: [{ kind: 'responses', rows: [{ call: '3C', meaning: '原意' }] }] }],
    },
    { id: 'other', title: '另一段', blocks: [{ kind: 'paragraph', text: '別的' }] },
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

const rowsOf = (block: ResolvedBlock | undefined) => (block?.kind === 'responses' ? block.rows : [])
const slugsOf = (r: ReturnType<typeof resolveProfile>) => r.conventions.map((c) => c.slug)
const alpha = (r: ReturnType<typeof resolveProfile>) => r.conventions.find((c) => c.slug === 'alpha')!

describe('resolveProfile: the empty profile is the handbook', () => {
  it('gives back every bundled convention unchanged, as the same objects, with no profiles at all', () => {
    const result = resolveProfile([], 'club', bundled)
    expect(result.conventions).toEqual(bundled)
    result.conventions.forEach((c, i) => expect(c).toBe(bundled[i]))
    expect(result.problems).toEqual([])
    expect(result.notes).toEqual([])
    expect(result.chain).toEqual([emptyClubProfile()])
  })

  it('gives back the bundled conventions for empty team and partnership profiles too', () => {
    const result = resolveProfile([club(), team(), pair()], 'pair', bundled)
    expect(result.conventions).toEqual(bundled)
    expect(result.chain.map((p) => p.id)).toEqual(['club', 'team', 'pair'])
    expect(result.profile.id).toBe('pair')
    expect(result.problems).toEqual([])
  })

  it('never changes its arguments', () => {
    const content = structuredClone(CONTENT)
    const profiles = [
      club({ overrides: [row('club')] }),
      team({ adopted: { beta: 'off' }, overrides: [{ kind: 'section', slug: 'alpha', sectionId: 'other', section: { id: 'x', title: '換' } }] }),
      pair({ overrides: [row('pair'), { kind: 'meta', slug: 'alpha', tags: ['新'] }] }),
    ]
    const before = structuredClone(profiles)
    resolveProfile(profiles, 'pair', content)
    expect(content).toEqual(CONTENT)
    expect(profiles).toEqual(before)
  })
})

describe('resolveProfile: adoption', () => {
  it('leaves out a convention a profile does not play, keeping the order of the rest', () => {
    expect(slugsOf(resolveProfile([team({ adopted: { beta: 'off' } })], 'team', CONTENT))).toEqual(['alpha', 'gamma'])
  })

  it('lets a child play again what its parent dropped, and drop what its parent plays', () => {
    const profiles = [club({ adopted: { beta: 'off' } }), team({ adopted: { gamma: 'off' } }), pair({ adopted: { beta: 'on' } })]
    expect(slugsOf(resolveProfile(profiles, 'pair', CONTENT))).toEqual(['alpha', 'beta'])
    expect(slugsOf(resolveProfile(profiles, 'team', CONTENT))).toEqual(['alpha'])
    expect(slugsOf(resolveProfile(profiles, 'club', CONTENT))).toEqual(['alpha', 'gamma'])
  })

  it('keeps the overrides of a dropped convention unused until it is played again', () => {
    const profiles = [team({ adopted: { alpha: 'off' }, overrides: [row('隊伍的意思')] }), pair({ adopted: { alpha: 'on' } })]
    const off = resolveProfile(profiles, 'team', CONTENT)
    expect(slugsOf(off)).not.toContain('alpha')
    expect(off.problems).toEqual([])
    expect(rowsOf(alpha(resolveProfile(profiles, 'pair', CONTENT)).sections[0]!.blocks![1])[0]).toMatchObject({ meaning: '隊伍的意思', origin: 'team' })
  })

  it('reports an adoption of a convention the handbook does not have', () => {
    const result = resolveProfile([team({ adopted: { nope: 'on' } })], 'team', CONTENT)
    expect(result.problems).toEqual([{ kind: 'unknownAdoption', profileId: 'team', slug: 'nope' }])
    expect(slugsOf(result)).toEqual(['alpha', 'beta', 'gamma'])
  })
})

describe('resolveProfile: overrides', () => {
  it('changes a row and marks it, leaving the other rows and conventions as they were', () => {
    const result = resolveProfile([team({ overrides: [row('改過的')] })], 'team', CONTENT)
    const resolved = alpha(result)
    const rows = rowsOf(resolved.sections[0]!.blocks![1])
    expect(rows[0]).toEqual({ call: '2C', meaning: '改過的', note: '原註', origin: 'team' })
    expect(rows[1]).toBe(rowsOf(CONTENT[0]!.sections[0]!.blocks![1])[1])
    expect(resolved.sections[0]!.origin).toBeUndefined()
    expect(resolved.sections[1]).toBe(CONTENT[0]!.sections[1])
    expect(result.conventions[1]).toBe(CONTENT[1])
    expect(result.problems).toEqual([])
  })

  it('replaces the note when the override has one, clears it with an empty one, and drops the old 待確認', () => {
    const replaced = rowsOf(alpha(resolveProfile([team({ overrides: [row('新', { note: '新註' })] })], 'team', CONTENT)).sections[0]!.blocks![1])
    expect(replaced[0]).toEqual({ call: '2C', meaning: '新', note: '新註', origin: 'team' })
    const cleared = rowsOf(alpha(resolveProfile([team({ overrides: [row('新', { note: '' })] })], 'team', CONTENT)).sections[0]!.blocks![1])
    expect(cleared[0]).toEqual({ call: '2C', meaning: '新', origin: 'team' })
    const pending = rowsOf(alpha(resolveProfile([team({ overrides: [row('新', { rowIndex: 1 })] })], 'team', CONTENT)).sections[0]!.blocks![1])
    expect(pending[1]).toEqual({ call: '2D', meaning: '新', origin: 'team' })
  })

  it('finds rows in nested sections', () => {
    const result = resolveProfile([team({ overrides: [row('深層', { sectionId: 'inner', blockIndex: 0 })] })], 'team', CONTENT)
    expect(rowsOf(alpha(result).sections[0]!.children![0]!.blocks![0])[0]).toMatchObject({ meaning: '深層', origin: 'team' })
  })

  it('lets the deeper profile win over three layers, marking each part with the layer that last changed it', () => {
    const profiles = [
      club({ overrides: [row('社團'), row('社團 2D', { rowIndex: 1 })] }),
      team({ parentId: 'club', overrides: [row('隊伍'), { kind: 'meta', slug: 'alpha', summary: '隊伍摘要' }] }),
      pair({ overrides: [row('搭檔'), { kind: 'meta', slug: 'alpha', tags: ['搭檔'] }] }),
    ]
    const resolved = alpha(resolveProfile(profiles, 'pair', CONTENT))
    const rows = rowsOf(resolved.sections[0]!.blocks![1])
    expect(rows[0]).toMatchObject({ meaning: '搭檔', origin: 'partnership' })
    expect(rows[1]).toMatchObject({ meaning: '社團 2D', origin: 'club' })
    expect(resolved).toMatchObject({ summary: '隊伍摘要', tags: ['搭檔'], origin: 'partnership' })

    const forTeam = alpha(resolveProfile(profiles, 'team', CONTENT))
    expect(rowsOf(forTeam.sections[0]!.blocks![1])[0]).toMatchObject({ meaning: '隊伍', origin: 'team' })
    expect(forTeam).toMatchObject({ summary: '隊伍摘要', tags: ['t'], origin: 'team' })
  })

  it('replaces a whole section, keeping its id and marking it and the sections inside', () => {
    const section = { id: 'whatever', title: '我們的版本', children: [{ id: 'sub', title: '子段' }] }
    const resolved = alpha(resolveProfile([team({ overrides: [{ kind: 'section', slug: 'alpha', sectionId: 'top', section }] })], 'team', CONTENT))
    expect(resolved.sections[0]).toEqual({ id: 'top', title: '我們的版本', origin: 'team', children: [{ id: 'sub', title: '子段', origin: 'team' }] })
    expect(resolved.sections[1]).toBe(CONTENT[0]!.sections[1])
  })

  it('applies a profile’s section override before its row overrides, so rows can point into the new section', () => {
    const section = { id: 'other', title: '新段', blocks: [{ kind: 'responses' as const, rows: [{ call: '3NT', meaning: '止叫' }] }] }
    const overrides: ProfileOverride[] = [
      row('改新段', { sectionId: 'other', blockIndex: 0 }),
      { kind: 'section', slug: 'alpha', sectionId: 'other', section },
    ]
    const result = resolveProfile([pair({ parentId: undefined, overrides })], 'pair', CONTENT)
    expect(rowsOf(alpha(result).sections[1]!.blocks![0])[0]).toEqual({ call: '3NT', meaning: '改新段', origin: 'partnership' })
    expect(result.problems).toEqual([])
  })

  it('lets a child replace a section its parent changed, and change a row in a section its parent replaced', () => {
    const section = { id: 'top', title: '隊伍版', blocks: [{ kind: 'responses' as const, rows: [{ call: '2C', meaning: '隊伍' }] }] }
    const profiles = [
      club({ overrides: [row('社團')] }),
      team({ overrides: [{ kind: 'section', slug: 'alpha', sectionId: 'top', section }] }),
      pair({ overrides: [row('搭檔', { blockIndex: 0 })] }),
    ]
    const forTeam = alpha(resolveProfile(profiles, 'team', CONTENT))
    expect(forTeam.sections[0]).toMatchObject({ title: '隊伍版', origin: 'team' })
    expect(rowsOf(forTeam.sections[0]!.blocks![0])[0]).toEqual({ call: '2C', meaning: '隊伍' })
    const forPair = alpha(resolveProfile(profiles, 'pair', CONTENT))
    expect(forPair.sections[0]!.origin).toBe('team')
    expect(rowsOf(forPair.sections[0]!.blocks![0])[0]).toEqual({ call: '2C', meaning: '搭檔', origin: 'partnership' })
  })
})

describe('resolveProfile: broken references', () => {
  it('skips and reports overrides that point at nothing, and still applies the others', () => {
    const bad: ProfileOverride[] = [
      row('沒有這個特約', { slug: 'nope' }),
      row('沒有這段', { sectionId: 'nope' }),
      { kind: 'section', slug: 'alpha', sectionId: 'nope', section: { id: 'nope', title: '?' } },
      row('不是答叫表', { blockIndex: 0 }),
      row('沒有這個區塊', { blockIndex: 9 }),
      row('沒有這一列', { rowIndex: 9 }),
    ]
    const result = resolveProfile([team({ overrides: [...bad, row('好的')] })], 'team', CONTENT)
    expect(rowsOf(alpha(result).sections[0]!.blocks![1])[0]).toMatchObject({ meaning: '好的' })
    expect(result.problems).toEqual([
      { kind: 'brokenOverride', profileId: 'team', override: bad[0], missing: 'convention' },
      { kind: 'brokenOverride', profileId: 'team', override: bad[2], missing: 'section' },
      { kind: 'brokenOverride', profileId: 'team', override: bad[1], missing: 'section' },
      { kind: 'brokenOverride', profileId: 'team', override: bad[3], missing: 'row' },
      { kind: 'brokenOverride', profileId: 'team', override: bad[4], missing: 'row' },
      { kind: 'brokenOverride', profileId: 'team', override: bad[5], missing: 'row' },
    ])
  })

  it('falls back to the club for a profile that is not there', () => {
    const result = resolveProfile([club({ adopted: { beta: 'off' } })], 'gone', CONTENT)
    expect(result.profile.id).toBe('club')
    expect(slugsOf(result)).toEqual(['alpha', 'gamma'])
    expect(result.problems).toEqual([{ kind: 'missingProfile', profileId: 'gone' }])
  })

  it('inherits the club directly when a parent is missing', () => {
    const result = resolveProfile([pair({ adopted: { beta: 'off' } })], 'pair', CONTENT)
    expect(result.chain.map((p) => p.id)).toEqual(['club', 'pair'])
    expect(slugsOf(result)).toEqual(['alpha', 'gamma'])
    expect(result.problems).toEqual([{ kind: 'missingParent', profileId: 'pair', parentId: 'team' }])
  })

  it('stops a loop of parents and goes to the club', () => {
    const profiles = [team({ parentId: 'pair', adopted: { beta: 'off' } }), pair({ parentId: 'team', overrides: [row('搭檔')] })]
    const result = resolveProfile(profiles, 'pair', CONTENT)
    expect(result.chain.map((p) => p.id)).toEqual(['club', 'team', 'pair'])
    expect(result.problems).toEqual([{ kind: 'cycle', profileId: 'team', parentId: 'pair' }])
    expect(slugsOf(result)).toEqual(['alpha', 'gamma'])
    expect(rowsOf(alpha(result).sections[0]!.blocks![1])[0]).toMatchObject({ meaning: '搭檔' })

    const self = resolveProfile([team({ parentId: 'team' })], 'team', CONTENT)
    expect(self.chain.map((p) => p.id)).toEqual(['club', 'team'])
    expect(self.problems).toEqual([{ kind: 'cycle', profileId: 'team', parentId: 'team' }])
  })

  it('treats a profile without a parent as a child of the club, and ignores a parent on the club', () => {
    expect(profileChain([team({ parentId: undefined })], 'team').chain.map((p) => p.id)).toEqual(['club', 'team'])
    const { chain, problems } = profileChain([club({ parentId: 'team' }), team()], 'club')
    expect(chain.map((p) => p.id)).toEqual(['club'])
    expect(problems).toEqual([])
  })
})

describe('resolveProfile: notes', () => {
  it('collects the notes of the chain with their layer, club first', () => {
    const note = (slug: string, text: string, sectionId?: string) => ({ slug, text, by: 'u1', at: 1, ...(sectionId && { sectionId }) })
    const profiles = [club({ notes: [note('alpha', '社團')] }), team({ notes: [note('alpha', '隊伍', 'inner')] }), pair({ notes: [note('beta', '搭檔')] })]
    expect(resolveProfile(profiles, 'pair', CONTENT).notes).toEqual([
      { ...note('alpha', '社團'), profileId: 'club', origin: 'club' },
      { ...note('alpha', '隊伍', 'inner'), profileId: 'team', origin: 'team' },
      { ...note('beta', '搭檔'), profileId: 'pair', origin: 'partnership' },
    ])
  })

  it('reports notes on a missing convention or section, and keeps notes on a dropped convention out quietly', () => {
    const notes = [
      { slug: 'nope', text: 'a', by: 'u1', at: 1 },
      { slug: 'alpha', sectionId: 'nope', text: 'b', by: 'u1', at: 1 },
      { slug: 'beta', text: 'c', by: 'u1', at: 1 },
    ]
    const result = resolveProfile([team({ adopted: { beta: 'off' }, notes })], 'team', CONTENT)
    expect(result.notes).toEqual([])
    expect(result.problems).toEqual([
      { kind: 'brokenNote', profileId: 'team', note: notes[0], missing: 'convention' },
      { kind: 'brokenNote', profileId: 'team', note: notes[1], missing: 'section' },
    ])
  })

  it('finds a note’s section in a section the profile replaced', () => {
    const section = { id: 'top', title: '新', children: [{ id: 'added', title: '新增' }] }
    const profiles = [team({ overrides: [{ kind: 'section', slug: 'alpha', sectionId: 'top', section }], notes: [{ slug: 'alpha', sectionId: 'added', text: 'x', by: 'u1', at: 1 }] })]
    const result = resolveProfile(profiles, 'team', CONTENT)
    expect(result.notes).toHaveLength(1)
    expect(result.problems).toEqual([])
  })
})

describe('profileView: one convention at a time, as the handbook page reads it (e1-t11)', () => {
  const profiles = [
    club(),
    team({ adopted: { beta: 'off' }, overrides: [row('隊伍的意義')] }),
    pair({
      adopted: { beta: 'on', gamma: 'off' },
      overrides: [
        row('搭檔的意義'),
        { kind: 'section', slug: 'alpha', sectionId: 'other', section: { id: 'x', title: '換掉的段', children: [{ id: 'new', title: '新段' }] } },
        { kind: 'meta', slug: 'alpha', summary: '搭檔的摘要' },
      ],
      notes: [{ slug: 'alpha', text: '備忘', by: 'u1', at: 1 }],
    }),
  ]

  it('resolves each convention the same way as resolveProfile', () => {
    const view = profileView(profiles, 'pair')
    const whole = resolveProfile(profiles, 'pair', CONTENT)
    expect(CONTENT.filter((c) => view.plays(c.slug)).map(view.convention)).toEqual(whole.conventions)
    expect(view.notes('alpha')).toEqual(whole.notes)
    expect(view.chain.map((p) => p.id)).toEqual(['club', 'team', 'pair'])
  })

  it('plays what the deepest profile says and knows which conventions it changes', () => {
    const view = profileView(profiles, 'pair')
    expect(['alpha', 'beta', 'gamma'].map(view.plays)).toEqual([true, true, false])
    expect(profileView(profiles, 'team').plays('beta')).toBe(false)
    expect(view.changes('alpha')).toBe(true)
    expect(view.changes('beta')).toBe(false)
  })

  it('gives the same object for a convention it does not change, and the same resolved one again', () => {
    const view = profileView(profiles, 'pair')
    const [alpha, beta] = CONTENT
    expect(view.convention(beta!)).toBe(beta)
    expect(view.convention(alpha!)).toBe(view.convention(alpha!))
    expect(view.convention(alpha!).origin).toBe('partnership')
  })

  it('applies the summary, tags and replaced sections to the catalogue entry', () => {
    const view = profileView(profiles, 'pair')
    const meta = conventionMeta(CONTENT[0]!)
    const shown = view.meta(meta)
    expect(shown.summary).toBe('搭檔的摘要')
    expect(shown.outline).toEqual([
      { id: 'top', title: '上層', children: [{ id: 'inner', title: '下層' }] },
      { id: 'other', title: '換掉的段', children: [{ id: 'new', title: '新段' }] },
    ])
    expect(shown.pending).toBe(meta.pending)
    expect(view.meta(meta)).toBe(shown)
    expect(view.meta(conventionMeta(CONTENT[1]!))).toEqual(conventionMeta(CONTENT[1]!))
  })

  it('shows the club for a profile that is gone', () => {
    const view = profileView(profiles, 'gone')
    expect(view.profile.id).toBe('club')
    expect(view.problems).toEqual([{ kind: 'missingProfile', profileId: 'gone' }])
  })
})

describe('unchanged and loadProfileView', () => {
  const summary = (p: SystemProfile): ProfileSummary => {
    const { adopted, overrides, notes, ...rest } = p
    return { ...rest, counts: { adopted: Object.keys(adopted).length, overrides: overrides.length, notes: notes.length } }
  }
  const profiles = [club(), team(), pair({ notes: [{ slug: 'alpha', text: 'x', by: 'u1', at: 1 }] }), profile({ id: 'solo', scope: 'partnership' })]
  const summaries = profiles.map(summary)
  const fetchProfile = vi.fn(async (id: string) => profiles.find((p) => p.id === id)!)

  it('tells whether the chain down to a profile changes anything', () => {
    expect(unchanged(summaries, 'club')).toBe(true)
    expect(unchanged(summaries, 'team')).toBe(true)
    expect(unchanged(summaries, 'solo')).toBe(true)
    expect(unchanged(summaries, 'pair')).toBe(false)
    expect(unchanged([summary(club({ adopted: { beta: 'off' } })), summaries[3]!], 'solo')).toBe(false)
  })

  it('fetches the chain only, and nothing when it changes nothing', async () => {
    expect(await loadProfileView(summaries, 'team', fetchProfile)).toBeUndefined()
    expect(fetchProfile).not.toHaveBeenCalled()
    const view = await loadProfileView(summaries, 'pair', fetchProfile)
    expect(fetchProfile.mock.calls.map(([id]) => id).sort()).toEqual(['club', 'pair', 'team'])
    expect(view?.profile.id).toBe('pair')
  })
})
