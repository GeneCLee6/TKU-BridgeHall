import { describe, expect, it } from 'vitest'
import { describeSlots } from '../../src/cards/describe.ts'
import { editsFor, fillProfileCard, setCardEdit, storedSlot } from '../../src/cards/edits.ts'
import { templateSlots } from '../../src/cards/slots.ts'
import { cardTemplates } from '../../src/cards/templates/index.ts'
import { ctcbaSimple } from '../../src/cards/templates/ctcba-simple.ts'
import { ctcbaSimple2p } from '../../src/cards/templates/ctcba-simple-2p.ts'
import { wbf } from '../../src/cards/templates/wbf.ts'
import { conventions } from '../fixtures/content.ts'
import type { SystemProfile } from '../../src/lib/api.ts'
import { resolveProfile } from '../../src/lib/profiles.ts'

const profile = (p: Partial<SystemProfile> & Pick<SystemProfile, 'id' | 'scope'>): SystemProfile => ({
  name: p.id,
  adopted: {},
  overrides: [],
  notes: [],
  version: 1,
  updatedAt: 0,
  updatedBy: 'u',
  ...p,
})

describe('hand edits of a card (e3-t06)', () => {
  it('adds, replaces and removes one slot, dropping edits that change nothing', () => {
    const one = setCardEdit(undefined, 'wbf.summary.general', { text: 'Natural' })
    expect(one).toEqual({ 'wbf.summary.general': { text: 'Natural' } })
    const two = setCardEdit(one, 'wbf.summary.1nt', { text: '15-17', flagged: true })
    expect(Object.keys(two!)).toEqual(['wbf.summary.general', 'wbf.summary.1nt'])
    expect(setCardEdit(two, 'wbf.summary.1nt', { flagged: undefined })).toEqual(one)
    expect(setCardEdit(one, 'wbf.summary.general', undefined)).toBeUndefined()
    // Never changes its argument
    expect(one).toEqual({ 'wbf.summary.general': { text: 'Natural' } })
  })

  it("keeps the two-sided simple card's edits under the single-sided card's ids", () => {
    expect(storedSlot(ctcbaSimple2p, 'ctcba-simple-2p.nt.stayman')).toBe('ctcba-simple.nt.stayman')
    expect(storedSlot(wbf, 'wbf.summary.general')).toBe('wbf.summary.general')
    const stored = { 'ctcba-simple.nt.stayman': { checked: false }, 'wbf.summary.general': { text: 'x' } }
    expect(editsFor(ctcbaSimple2p, stored)).toEqual({ 'ctcba-simple-2p.nt.stayman': { checked: false } })
    expect(editsFor(ctcbaSimple, stored)).toEqual({ 'ctcba-simple.nt.stayman': { checked: false } })
    expect(editsFor(wbf, stored)).toEqual({ 'wbf.summary.general': { text: 'x' } })
  })

  it('inherits edits down the chain, the nearest layer winning, with its origin', () => {
    const club = profile({ id: 'club', scope: 'club', cardEdits: { 'wbf.summary.general': { text: 'Club' }, 'wbf.summary.1nt': { text: '15-17' } } })
    const team = profile({ id: 'team', scope: 'team', parentId: 'club', cardEdits: { 'wbf.summary.general': { text: 'Team' } } })
    const pair = profile({ id: 'pair', scope: 'partnership', parentId: 'team', cardEdits: { 'wbf.summary.psychics': { text: 'Rare', flagged: true } } })
    const resolution = resolveProfile([club, team, pair], 'pair', conventions)
    const card = fillProfileCard(wbf, resolution)
    expect(card.cells['wbf.summary.general']).toMatchObject({ text: 'Team', edited: true, origin: 'team' })
    expect(card.cells['wbf.summary.1nt']).toMatchObject({ text: '15-17', origin: 'club' })
    expect(card.cells['wbf.summary.psychics']).toMatchObject({ text: 'Rare', flagged: true, origin: 'partnership' })
    expect(card.problems.filter((p) => p.kind === 'unknownEdit')).toEqual([])

    // The edits being made replace the profile's saved ones
    const editing = fillProfileCard(wbf, resolution, { 'wbf.summary.general': { text: 'Ours' } })
    expect(editing.cells['wbf.summary.general']).toMatchObject({ text: 'Ours', origin: 'partnership' })
    expect(editing.cells['wbf.summary.psychics']).toBeUndefined()
  })

  it('reports an edit for a slot the card does not have', () => {
    const club = profile({ id: 'club', scope: 'club', cardEdits: { 'wbf.gone': { text: 'x' } } })
    const card = fillProfileCard(wbf, resolveProfile([club], 'club', conventions))
    expect(card.problems).toContainEqual({ kind: 'unknownEdit', slot: 'wbf.gone' })
  })
})

describe('slot descriptions for the card page (e3-t05)', () => {
  it('describes every slot fillCard can write, with a label and, on the WBF card, help', () => {
    for (const template of cardTemplates) {
      const described = describeSlots(template)
      expect([...described.keys()]).toEqual(templateSlots(template).map((s) => s.id))
      for (const info of described.values()) expect(info.label).not.toBe('')
    }
    const wbfSlots = describeSlots(wbf)
    expect(wbfSlots.get('wbf.openings.1H.responses')).toMatchObject({ label: expect.stringContaining('Responses'), kind: 'cell' })
    expect(wbfSlots.get('wbf.openings.1H.responses')!.help?.source).toMatch(/Guide to Completion/)
    expect(describeSlots(ctcbaSimple).get('ctcba-simple.header.natural')).toMatchObject({ kind: 'choice' })
  })
})
