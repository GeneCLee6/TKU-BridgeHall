// @vitest-environment node
import { conventions } from '../fixtures/content.ts'
import { tidyConvention } from '../../src/lib/content.ts'
import {
  conditionsFrom,
  draftFrom,
  filledTargets,
  findRows,
  unresolvedTarget,
  withConditions,
} from '../../src/lib/handConditions.ts'
import { emptyClubProfile, resolveProfile } from '../../src/lib/profiles.ts'
import { walkSections } from '../../src/lib/sections.ts'
import { SPEC_ANY, toSystemSpec } from '../../src/lib/systemSpec.ts'
import type { Convention } from '../../src/types/convention.ts'

/**
 * Hand conditions filled in on the report page (e7-t08, AC-7.1): finding the club's row an
 * unresolved one came from, writing the conditions beside its words, and the rules they make.
 */

const club = emptyClubProfile()
const specOf = (list: Convention[]) => toSystemSpec(resolveProfile([club], club.id, list).conventions, club)

const sample: Convention = {
  ...conventions[0],
  slug: 'sample',
  sections: [
    {
      id: 'a',
      title: '答叫',
      blocks: [
        {
          kind: 'responses',
          auction: { seats: ['開叫者', '', '答叫者', ''], calls: ['1NT', '', '?'] },
          rows: [
            { call: '3C/D', meaning: '6張↑低花，邀請' },
            { call: '2C', meaning: 'Stayman，8點↑' },
          ],
        },
        {
          kind: 'responses',
          auction: { seats: ['開叫者', '', '答叫者', ''], calls: ['1C', '', '?'] },
          rows: [{ call: '3C/D', meaning: '6張↑低花，邀請' }],
        },
      ],
    },
  ],
}

describe('hand conditions', () => {
  it('are in none of the bundled conventions: they are the editors’ (CLAUDE.md rule 1)', () => {
    for (const c of conventions)
      walkSections(c.sections, (s) => {
        for (const b of s.blocks ?? [])
          if (b.kind === 'responses')
            for (const row of b.rows) expect(row.conditions, `${c.slug} ${s.id} ${row.call}`).toBeUndefined()
      })
  })

  it('find the club’s row by section, call, words and auction, and turn it into rules', () => {
    const spec = specOf([sample])
    const unresolved = spec.unresolved.filter((u) => u.call === '3C/D')
    expect(unresolved.map((u) => u.after)).toEqual([['1N (P)'], ['1C (P)']])
    const target = unresolvedTarget(unresolved[0])!
    expect(findRows(sample, target)).toEqual([{ blockIndex: 0, rowIndex: 0 }])

    const read = conditionsFrom({ ...draftFrom(), hcp: { low: '10', high: '11' }, forcing: '' })
    expect(read).toEqual({ conditions: { hcp: [10, 11] } })
    if (!('conditions' in read)) return
    const next = withConditions(sample, 'a', findRows(sample, target), read.conditions)
    // The words stay; only the row the target came from gets them
    const rows = next.sections[0].blocks!.flatMap((b) => (b.kind === 'responses' ? b.rows : []))
    expect(rows).toEqual([
      { call: '3C/D', meaning: '6張↑低花，邀請', conditions: { hcp: [10, 11] } },
      { call: '2C', meaning: 'Stayman，8點↑' },
      { call: '3C/D', meaning: '6張↑低花，邀請' },
    ])
    expect(sample.sections[0].blocks![0]).not.toHaveProperty('rows.0.conditions')
    expect(tidyConvention(next)).toEqual(next)

    const after = specOf([next])
    expect(after.unresolved.filter((u) => u.call === '3C/D')).toHaveLength(1)
    const filled = filledTargets(after)
    expect(filled).toHaveLength(1)
    expect(filled[0].rules.map((r) => r.call)).toEqual(['3C', '3D'])
    expect(filled[0].shows).toEqual({ hcp: [10, 11] })
    // The filled rule finds its row again, to change or clear it
    expect(findRows(next, filled[0])).toEqual([{ blockIndex: 0, rowIndex: 0 }])
    const cleared = withConditions(next, 'a', findRows(next, filled[0]), null)
    expect(cleared).toEqual(sample)
  })

  it('find nothing when the club’s row reads differently', () => {
    const target = unresolvedTarget(specOf([sample]).unresolved[0])!
    expect(findRows(sample, { ...target, text: '改過的文字' })).toEqual([])
    expect(findRows(sample, { ...target, after: ['1H (P)'] })).toEqual([])
    expect(findRows(sample, { ...target, ref: { slug: 'sample', sectionId: 'b' } })).toEqual([])
  })

  it('are only offered where the auction and call were read', () => {
    const spec = specOf(conventions)
    for (const u of spec.unresolved) {
      const target = unresolvedTarget(u)
      if (['alternatives', 'bracketed', 'noConditions'].includes(u.reason)) expect(target, `${u.ref.slug} ${u.call}`).not.toBeNull()
      else expect(target).toBeNull()
    }
  })

  it('read the form: empty bottoms are 0, empty tops no limit', () => {
    const draft = draftFrom({ hcp: [12, SPEC_ANY], len: { H: [5, 5] }, forcing: 'game', name: 'stayman' })
    expect(draft.hcp).toEqual({ low: '12', high: '' })
    expect(draft.len.H).toEqual({ low: '5', high: '5' })
    expect(draft.forcing).toBe('game')
    expect(conditionsFrom(draft)).toEqual({ conditions: { hcp: [12, SPEC_ANY], len: { H: [5, 5] }, forcing: 'game' } })
    expect(conditionsFrom({ ...draftFrom(), hcp: { low: '', high: '9' } })).toEqual({ conditions: { hcp: [0, 9] } })
    expect(conditionsFrom({ ...draftFrom(), forcing: 'game' })).toEqual({ problem: '手牌條件要有點力或張數' })
    expect(conditionsFrom({ ...draftFrom(), hcp: { low: '12', high: '8' } })).toEqual({ problem: '點力範圍不正確' })
    expect(conditionsFrom({ ...draftFrom(), hcp: { low: '8.5', high: '' } })).toEqual({ problem: '點力要填整數' })
    expect(conditionsFrom({ ...draftFrom(), len: { ...draftFrom().len, S: { low: '14', high: '' } } })).toEqual({ problem: '張數範圍不正確' })
  })
})
