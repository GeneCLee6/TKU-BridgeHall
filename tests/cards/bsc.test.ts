import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { brownStickerForms, formResolution } from '../../src/cards/bsc.ts'
import { cardDocx } from '../../src/cards/docx.ts'
import { editsFor, fillProfileCard, storedSlot } from '../../src/cards/edits.ts'
import { cardPlaces } from '../../src/cards/places.ts'
import { bscOpening } from '../../src/cards/templates/bsc-opening.ts'
import { bscOvercall } from '../../src/cards/templates/bsc-overcall.ts'
import { profileTemplates } from '../../src/cards/templates/index.ts'
import { conventionBySlug, conventions } from '../../src/content/index.ts'
import type { SystemProfile } from '../../src/lib/api.ts'
import { conventionProblems } from '../../src/lib/content.ts'
import { resolveProfile } from '../../src/lib/profiles.ts'
import type { Convention } from '../../src/types/convention.ts'

/** Brown Sticker announcement forms (e3-t12, AC-3.8) */

const club: SystemProfile = {
  id: 'club',
  name: '社團',
  scope: 'club',
  adopted: {},
  overrides: [],
  notes: [],
  version: 1,
  updatedAt: 0,
  updatedBy: 'u',
}

const twoDiamonds = conventionBySlug('two-diamond-opening')!
const marked = (c: Convention, brownSticker: Convention['brownSticker'], cardSlots = c.cardSlots): Convention => ({
  ...c,
  brownSticker,
  ...(cardSlots && { cardSlots }),
})
const content = (...changed: Convention[]) => conventions.map((c) => changed.find((x) => x.slug === c.slug) ?? c)
const resolve = (list: Convention[], profile = club) => resolveProfile([profile], profile.id, list)

describe('Brown Sticker forms', () => {
  it('marks no built-in convention, so the club card has no forms', () => {
    expect(conventions.filter((c) => c.brownSticker)).toEqual([])
    expect(brownStickerForms(resolve(conventions))).toEqual([])
    expect(profileTemplates.map((t) => t.id)).toEqual(['wbf', 'ctcba-simple', 'ctcba-simple-2p'])
  })

  it('gives each marked convention the profile plays a form of its kind', () => {
    const list = content(marked(twoDiamonds, 'opening'))
    const forms = brownStickerForms(resolve(list))
    expect(forms.map((f) => [f.template.id, f.convention.slug])).toEqual([['bsc-opening', 'two-diamond-opening']])
    // Not played: no form
    const off = { ...club, adopted: { 'two-diamond-opening': 'off' as const } }
    expect(brownStickerForms(resolve(list, off))).toEqual([])
    expect(formResolution(resolve(list, off), bscOpening, 'two-diamond-opening')).toBeUndefined()
    // Marked for the other form
    expect(formResolution(resolve(list), bscOvercall, 'two-diamond-opening')).toBeUndefined()
  })

  it('fills a form from its convention alone: the whole convention as Detailed Description by default', () => {
    const list = content(marked(twoDiamonds, 'opening'))
    const card = fillProfileCard(bscOpening, resolve(list), undefined, 'two-diamond-opening')!
    expect(card.problems).toEqual([])
    expect(Object.keys(card.cells)).toEqual(['bsc-opening.description'])
    expect(card.cells['bsc-opening.description']!.text).toMatch(/\[Note 1\]/)
    expect(card.notes).toHaveLength(1)
    expect(card.notes[0]!.slug).toBe('two-diamond-opening')
    // The other conventions' WBF slots do not reach the form
    expect(card.cells['bsc-opening.description']!.sources.every((s) => s.slug === 'two-diamond-opening')).toBe(true)
    // The convention's WBF cells are still filled on the WBF card
    const wbf = fillProfileCard(profileTemplates[0]!, resolve(list))
    expect(wbf.cells['wbf.openings.2D.description']).toBeDefined()
  })

  it("fills the cells the convention's own entries name, and nothing else", () => {
    const list = content(
      marked(twoDiamonds, 'opening', [
        ...twoDiamonds.cardSlots!,
        'bsc-opening.bid = 2♦',
        'bsc-opening.shows <- hands',
        'bsc-opening.rebids <- responses#0',
      ]),
    )
    const card = fillProfileCard(bscOpening, resolve(list), undefined, 'two-diamond-opening')!
    expect(card.problems).toEqual([])
    expect(card.cells['bsc-opening.bid']!.text).toBe('2♦')
    expect(card.cells['bsc-opening.shows']!.sources[0]).toMatchObject({ slug: 'two-diamond-opening', sectionId: 'hands' })
    expect(card.cells['bsc-opening.rebids']).toBeDefined()
    expect(card.cells['bsc-opening.description']).toBeUndefined()
  })

  it('keeps hand edits per convention, so two forms of one kind do not share them', () => {
    expect(storedSlot(bscOpening, 'bsc-opening.names', 'two-diamond-opening')).toBe('bsc-opening.two-diamond-opening.names')
    const stored = {
      'bsc-opening.two-diamond-opening.names': { text: 'Amy - Bob' },
      'bsc-opening.other.names': { text: 'Cat - Dan' },
      'wbf.header.players': { text: 'x' },
    }
    expect(editsFor(bscOpening, stored, 'two-diamond-opening')).toEqual({ 'bsc-opening.names': { text: 'Amy - Bob' } })
    const list = content(marked(twoDiamonds, 'opening'))
    const card = fillProfileCard(bscOpening, resolve(list), stored, 'two-diamond-opening')!
    expect(card.cells['bsc-opening.names']).toMatchObject({ text: 'Amy - Bob', edited: true, origin: 'club' })
    expect(card.problems).toEqual([])
  })

  it('lists a form cell beside its section only when the convention is marked for it', () => {
    const slots = ['bsc-opening.shows <- hands', 'wbf.openings.2D.description <- hands']
    expect(cardPlaces(slots, 'hands', { slug: 'two-diamond-opening', brownSticker: 'opening' })).toEqual([
      expect.objectContaining({ templateId: 'bsc-opening', path: 'bsc-opening/two-diamond-opening', slot: 'bsc-opening.shows' }),
      expect.objectContaining({ templateId: 'wbf', path: 'wbf' }),
    ])
    expect(cardPlaces(slots, 'hands', { slug: 'two-diamond-opening' }).map((p) => p.templateId)).toEqual(['wbf'])
  })

  it('writes the overcall form, with its choice and the word after the blank, as a portrait Word file', async () => {
    const list = content(marked(twoDiamonds, 'overcall'))
    const stored = {
      'bsc-overcall.two-diamond-opening.applies': { option: 'always' },
      'bsc-overcall.two-diamond-opening.vulnerability': { text: 'any' },
    }
    const card = fillProfileCard(bscOvercall, resolve(list), stored, 'two-diamond-opening')!
    expect(card.cells['bsc-overcall.applies']!.option).toBe('always')
    const blob = await cardDocx(bscOvercall, card, { title: 'BSC', notesTitle: 'SUPPLEMENTARY NOTES' })
    const xml = await (await JSZip.loadAsync(await blob.arrayBuffer())).file('word/document.xml')!.async('string')
    expect(xml).toContain('BROWN STICKER OVERCALL ANNOUNCEMENT FORM')
    expect(xml).toContain('All the time')
    expect(xml).toMatch(/any<\/w:t>.*vulnerability/s)
    expect(xml).not.toContain('w:orient="landscape"')
    expect(xml).toContain('[Note 1]')
  })

  it('accepts only an opening or an overcall as the mark', () => {
    const categories = [twoDiamonds.category]
    expect(conventionProblems(marked(twoDiamonds, 'opening'), categories)).toEqual([])
    expect(conventionProblems({ ...twoDiamonds, brownSticker: 'response' }, categories)).toContain('棕標只能是開叫或蓋叫')
  })
})
