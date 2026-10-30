import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { brownStickerForms, formResolution } from '../../src/cards/bsc.ts'
import { cardDocx } from '../../src/cards/docx.ts'
import { editsFor, fillProfileCard, storedSlot } from '../../src/cards/edits.ts'
import { cardPlaces } from '../../src/cards/places.ts'
import { bscOpening } from '../../src/cards/templates/bsc-opening.ts'
import { bscOvercall } from '../../src/cards/templates/bsc-overcall.ts'
import { profileTemplates } from '../../src/cards/templates/index.ts'
import { conventionBySlug, conventions } from '../fixtures/content.ts'
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

const alpha = conventionBySlug('fixture-alpha')!
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
    const list = content(marked(alpha, 'opening'))
    const forms = brownStickerForms(resolve(list))
    expect(forms.map((f) => [f.template.id, f.convention.slug])).toEqual([['bsc-opening', 'fixture-alpha']])
    // Not played: no form
    const off = { ...club, adopted: { 'fixture-alpha': 'off' as const } }
    expect(brownStickerForms(resolve(list, off))).toEqual([])
    expect(formResolution(resolve(list, off), bscOpening, 'fixture-alpha')).toBeUndefined()
    // Marked for the other form
    expect(formResolution(resolve(list), bscOvercall, 'fixture-alpha')).toBeUndefined()
  })

  it('fills a form from its convention alone: the whole convention as Detailed Description by default', () => {
    const list = content(marked(alpha, 'opening'))
    const card = fillProfileCard(bscOpening, resolve(list), undefined, 'fixture-alpha')!
    expect(card.problems).toEqual([])
    expect(Object.keys(card.cells)).toEqual(['bsc-opening.description'])
    // The made-up convention is short enough to fit the cell (a long one goes to a supplementary note)
    expect(card.cells['bsc-opening.description']!.text).toContain('前言（測試）')
    // The other conventions' WBF slots do not reach the form
    expect(card.cells['bsc-opening.description']!.sources.every((s) => s.slug === 'fixture-alpha')).toBe(true)
    // The convention's WBF cells are still filled on the WBF card
    const wbf = fillProfileCard(profileTemplates[0]!, resolve(list))
    expect(wbf.cells['wbf.openings.1NT.responses']).toBeDefined()
  })

  it("fills the cells the convention's own entries name, and nothing else", () => {
    const list = content(
      marked(alpha, 'opening', [
        ...alpha.cardSlots!,
        'bsc-opening.bid = 2♦',
        'bsc-opening.shows <- intro',
        'bsc-opening.rebids <- responses#0',
      ]),
    )
    const card = fillProfileCard(bscOpening, resolve(list), undefined, 'fixture-alpha')!
    expect(card.problems).toEqual([])
    expect(card.cells['bsc-opening.bid']!.text).toBe('2♦')
    expect(card.cells['bsc-opening.shows']!.sources[0]).toMatchObject({ slug: 'fixture-alpha', sectionId: 'intro' })
    expect(card.cells['bsc-opening.rebids']).toBeDefined()
    expect(card.cells['bsc-opening.description']).toBeUndefined()
  })

  it('keeps hand edits per convention, so two forms of one kind do not share them', () => {
    expect(storedSlot(bscOpening, 'bsc-opening.names', 'fixture-alpha')).toBe('bsc-opening.fixture-alpha.names')
    const stored = {
      'bsc-opening.fixture-alpha.names': { text: 'Amy - Bob' },
      'bsc-opening.other.names': { text: 'Cat - Dan' },
      'wbf.header.players': { text: 'x' },
    }
    expect(editsFor(bscOpening, stored, 'fixture-alpha')).toEqual({ 'bsc-opening.names': { text: 'Amy - Bob' } })
    const list = content(marked(alpha, 'opening'))
    const card = fillProfileCard(bscOpening, resolve(list), stored, 'fixture-alpha')!
    expect(card.cells['bsc-opening.names']).toMatchObject({ text: 'Amy - Bob', edited: true, origin: 'club' })
    expect(card.problems).toEqual([])
  })

  it('lists a form cell beside its section only when the convention is marked for it', () => {
    const slots = ['bsc-opening.shows <- intro', 'wbf.openings.1NT.responses <- intro']
    expect(cardPlaces(slots, 'intro', { slug: 'fixture-alpha', brownSticker: 'opening' })).toEqual([
      expect.objectContaining({ templateId: 'bsc-opening', path: 'bsc-opening/fixture-alpha', slot: 'bsc-opening.shows' }),
      expect.objectContaining({ templateId: 'wbf', path: 'wbf' }),
    ])
    expect(cardPlaces(slots, 'intro', { slug: 'fixture-alpha' }).map((p) => p.templateId)).toEqual(['wbf'])
  })

  it('writes the overcall form, with its choice and the word after the blank, as a portrait Word file', async () => {
    const list = content(marked(alpha, 'overcall'))
    const stored = {
      'bsc-overcall.fixture-alpha.applies': { option: 'always' },
      'bsc-overcall.fixture-alpha.vulnerability': { text: 'any' },
    }
    const card = fillProfileCard(bscOvercall, resolve(list), stored, 'fixture-alpha')!
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
    const categories = [alpha.category]
    expect(conventionProblems(marked(alpha, 'opening'), categories)).toEqual([])
    expect(conventionProblems({ ...alpha, brownSticker: 'response' }, categories)).toContain('棕標只能是開叫或蓋叫')
  })
})
