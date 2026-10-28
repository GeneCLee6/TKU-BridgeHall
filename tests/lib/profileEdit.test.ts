import { describe, expect, it } from 'vitest'
import { PROFILE_LIMITS, type ProfileInput, type SystemProfile } from '../../src/lib/api.ts'
import {
  addNote,
  editNote,
  findRowOverride,
  flatSections,
  grouped,
  inheritedAdoption,
  inputProblems,
  parentContent,
  parentsOf,
  plainSection,
  removeNote,
  removeRowOverride,
  removeSectionOverride,
  responseRows,
  rowHere,
  sameInput,
  sectionHere,
  setAdoption,
  setRowOverride,
  setSectionOverride,
  toInput,
} from '../../src/lib/profileEdit.ts'
import { emptyClubProfile } from '../../src/lib/profiles.ts'
import type { Convention } from '../../src/types/convention.ts'

const convention = (slug: string, category = 'notrump'): Convention => ({
  slug,
  nameZh: `特約 ${slug}`,
  nameEn: slug,
  category,
  tags: [],
  summary: '摘要',
  source: { title: 'Word' },
  updated: '2026-01-01',
  sections: [
    {
      id: 'top',
      title: '上層',
      blocks: [
        { kind: 'paragraph', text: '說明' },
        { kind: 'responses', rows: [{ call: '2C', meaning: '問高花', note: '原備註' }, { call: '2D', meaning: '轉換' }] },
      ],
      children: [{ id: 'child', title: '下層', blocks: [{ kind: 'responses', rows: [{ call: '3C', meaning: '自然' }] }] }],
    },
  ],
})

const profile = (id: string, extra: Partial<SystemProfile> = {}): SystemProfile => ({
  id,
  name: id,
  scope: 'team',
  adopted: {},
  overrides: [],
  notes: [],
  version: 3,
  updatedAt: 0,
  updatedBy: 'u1',
  ...extra,
})

const empty: ProfileInput = toInput(profile('team'))
const ref = { slug: 'a', sectionId: 'top', blockIndex: 1, rowIndex: 0 }

describe('profile input', () => {
  it('keeps only what is saved', () => {
    const input = toInput(profile('team', { parentId: 'club', visibility: 'members' }))
    expect(input).toEqual({ name: 'team', scope: 'team', parentId: 'club', visibility: 'members', adopted: {}, overrides: [], notes: [] })
    expect('version' in input).toBe(false)
    expect(sameInput(input, toInput(profile('team', { parentId: 'club', visibility: 'members' })))).toBe(true)
    expect(sameInput(input, setAdoption(input, 'a', 'off'))).toBe(false)
  })
})

describe('adoption', () => {
  it('sets, changes and clears the profile’s own choice', () => {
    const on = setAdoption(empty, 'a', 'on')
    expect(on.adopted).toEqual({ a: 'on' })
    expect(setAdoption(on, 'a', 'off').adopted).toEqual({ a: 'off' })
    expect(setAdoption(on, 'a', undefined).adopted).toEqual({})
    expect(empty.adopted).toEqual({})
  })

  it('follows the deepest parent that lists the convention, and plays it otherwise', () => {
    const club = { ...emptyClubProfile(), adopted: { a: 'off' as const, b: 'off' as const } }
    const team = profile('team', { adopted: { b: 'on' } })
    expect(inheritedAdoption([club, team], 'a')).toBe('off')
    expect(inheritedAdoption([club, team], 'b')).toBe('on')
    expect(inheritedAdoption([club, team], 'c')).toBe('on')
    expect(inheritedAdoption([], 'a')).toBe('on')
  })
})

describe('what the parent shows', () => {
  it('applies the parents’ overrides but keeps every convention', () => {
    const content = [convention('a'), convention('b')]
    const club = { ...emptyClubProfile(), adopted: { b: 'off' as const } }
    const team = profile('team', { overrides: [{ kind: 'row', ...ref, meaning: '隊伍的意義' }] })
    const base = parentContent([club, team], content)
    expect(base.map((c) => c.slug)).toEqual(['a', 'b'])
    expect(rowHere(base[0], empty, ref)?.meaning).toBe('隊伍的意義')
    expect(parentContent([], content)).toEqual(content)
  })

  it('finds the parents in a fetched chain', () => {
    const club = emptyClubProfile()
    const team = profile('team')
    const pair = profile('pair', { parentId: 'team' })
    expect(parentsOf([club, team, pair], pair)).toEqual([club, team])
    expect(parentsOf([club], club)).toEqual([])
  })

  it('groups conventions in the catalogue’s order, unknown groups last', () => {
    const categories = [
      { id: 'major', label: '高花', description: '', order: 0 },
      { id: 'notrump', label: '無王', description: '', order: 1 },
      { id: 'empty', label: '空', description: '', order: 2 },
    ]
    const groups = grouped(categories, [convention('a'), convention('b', 'major'), convention('c', 'new')])
    expect(groups.map((g) => [g.category?.id, g.conventions.map((c) => c.slug)])).toEqual([
      ['major', ['b']],
      ['notrump', ['a']],
      [undefined, ['c']],
    ])
  })
})

describe('sections and rows', () => {
  const c = convention('a')

  it('lists the sections depth first and a section’s own rows by place', () => {
    expect(flatSections(c.sections).map(({ section, depth }) => [section.id, depth])).toEqual([
      ['top', 0],
      ['child', 1],
    ])
    expect(responseRows(c.sections[0]!).map(({ blockIndex, rowIndex, row }) => [blockIndex, rowIndex, row.call])).toEqual([
      [1, 0, '2C'],
      [1, 1, '2D'],
    ])
  })

  it('works on the profile’s own replacement of a section when it has one', () => {
    const replaced = setSectionOverride(empty, 'a', 'top', {
      id: 'renamed',
      title: '換過',
      blocks: [{ kind: 'responses', rows: [{ call: '2C', meaning: '換過的意義' }] }],
    })
    expect(sectionHere(c, replaced, 'a', 'top')?.title).toBe('換過')
    expect(rowHere(c, replaced, { ...ref, blockIndex: 0 })?.meaning).toBe('換過的意義')
    expect(rowHere(c, empty, ref)?.meaning).toBe('問高花')
    expect(rowHere(c, empty, { ...ref, rowIndex: 9 })).toBeUndefined()
  })

  it('drops the parent’s marks from a section it copies', () => {
    const section = plainSection({
      id: 's',
      title: 'x',
      origin: 'team',
      blocks: [{ kind: 'responses', rows: [{ call: '1C', meaning: 'm', origin: 'team' }] }],
      children: [{ id: 'k', title: 'y', origin: 'team' }],
    })
    expect(JSON.stringify(section)).not.toContain('origin')
  })
})

describe('overrides', () => {
  it('adds a row override, replaces it in place and removes it', () => {
    const one = setRowOverride(empty, ref, '新意義')
    expect(one.overrides).toEqual([{ kind: 'row', ...ref, meaning: '新意義' }])
    const other = setRowOverride(one, { ...ref, rowIndex: 1 }, '第二列')
    const changed = setRowOverride(other, ref, '再改', '')
    expect(changed.overrides).toHaveLength(2)
    expect(findRowOverride(changed, ref)).toEqual({ kind: 'row', ...ref, meaning: '再改', note: '' })
    expect(changed.overrides[0]).toBe(findRowOverride(changed, ref))
    expect(removeRowOverride(changed, ref).overrides).toEqual([{ kind: 'row', ...ref, rowIndex: 1, meaning: '第二列' }])
    expect(empty.overrides).toEqual([])
  })

  it('keeps the section id on a replacement and reverts it', () => {
    const input = setSectionOverride(empty, 'a', 'top', { id: 'other', title: '換過' })
    expect(input.overrides).toEqual([{ kind: 'section', slug: 'a', sectionId: 'top', section: { id: 'top', title: '換過' } }])
    const again = setSectionOverride(input, 'a', 'top', { id: 'top', title: '再換' })
    expect(again.overrides).toHaveLength(1)
    expect(removeSectionOverride(again, 'a', 'top').overrides).toEqual([])
  })
})

describe('notes', () => {
  it('adds, edits and removes notes', () => {
    const one = addNote(empty, { slug: 'a', text: '記得', by: 'u1', at: 1 })
    const two = addNote(one, { slug: 'a', sectionId: 'top', text: '段落', by: 'u1', at: 2 })
    expect(editNote(two, 1, '改過', 'u2', 3).notes[1]).toEqual({ slug: 'a', sectionId: 'top', text: '改過', by: 'u2', at: 3 })
    expect(removeNote(two, 0).notes.map((n) => n.text)).toEqual(['段落'])
  })
})

describe('limits', () => {
  it('finds what the Worker would refuse', () => {
    expect(inputProblems(empty)).toEqual([])
    const long = addNote(empty, { slug: 'a', text: 'x'.repeat(PROFILE_LIMITS.noteMax + 1), by: 'u1', at: 0 })
    expect(inputProblems(long)).toEqual([{ kind: 'noteTooLong', index: 0 }])
    expect(inputProblems(addNote(empty, { slug: 'a', text: '  ', by: 'u1', at: 0 }))).toEqual([{ kind: 'emptyNote', index: 0 }])
    expect(inputProblems(setRowOverride(empty, ref, ' '))).toEqual([{ kind: 'emptyMeaning', index: 0 }])
    const many: ProfileInput = {
      ...empty,
      overrides: Array.from({ length: PROFILE_LIMITS.overridesMax + 1 }, (_, i) => ({ kind: 'row' as const, ...ref, rowIndex: i, meaning: 'm' })),
    }
    expect(inputProblems(many)).toEqual([{ kind: 'tooManyOverrides', count: PROFILE_LIMITS.overridesMax + 1 }])
    const big = addNote(empty, { slug: 'a', text: '字'.repeat(PROFILE_LIMITS.noteMax), by: 'u1', at: 0 })
    const huge: ProfileInput = { ...big, notes: Array.from({ length: 40 }, () => big.notes[0]!) }
    expect(inputProblems(huge).map((p) => p.kind)).toEqual(['tooLarge'])
  })
})
