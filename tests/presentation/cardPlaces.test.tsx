import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { cardPlaces } from '../../src/cards/places.ts'
import { mentions } from '../../src/cards/placesContext.tsx'
import { conventions, conventionBySlug } from '../fixtures/content.ts'
import { cardStrings as t } from '../../src/pages/cardStrings.ts'
import { warmPages } from './warmPages.ts'

/** 「在制度卡的位置」 beside a section (e3-t10, AC-3.6) */

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})
beforeAll(() => Promise.all([warmPages(), import('../../src/cards/CardPlaces.tsx')]), 60_000)

const alpha = conventionBySlug('fixture-alpha')!

describe('cardPlaces', () => {
  it('lists the cells a section or the whole convention fills, under the template that owns them', () => {
    const whole = ['wbf.summary.special-bids <- *', 'ctcba-simple.comp.more <- *', 'wbf.defence.vs-preempts <- other-uses']
    expect(cardPlaces(whole, '*')).toEqual([
      { templateId: 'wbf', path: 'wbf', slot: 'wbf.summary.special-bids', label: expect.stringMatching(/SPECIAL BIDS/i) },
      { templateId: 'ctcba-simple', path: 'ctcba-simple', slot: 'ctcba-simple.comp.more', label: expect.any(String) },
    ])
    expect(cardPlaces(alpha.cardSlots, '*')).toEqual([])
    expect(cardPlaces(alpha.cardSlots, 'responses')).toEqual([
      { templateId: 'wbf', path: 'wbf', slot: 'wbf.openings.1NT.responses', label: expect.stringMatching(/1NT · Responses/) },
      expect.objectContaining({ templateId: 'ctcba-simple', slot: 'ctcba-simple.nt.stayman' }),
      expect.objectContaining({ templateId: 'ctcba-simple', slot: 'ctcba-simple.nt.transfer-2' }),
    ])
    expect(cardPlaces(alpha.cardSlots, 'nothing-here')).toEqual([])
    expect(cardPlaces(undefined, '*')).toEqual([])
  })

  it('agrees with the cheap check that decides whether to load the templates', () => {
    for (const c of conventions) {
      const ids = ['*', ...c.sections.flatMap(function walk(s): string[] {
        return [s.id, ...(s.children ?? []).flatMap(walk)]
      })]
      for (const id of ids) expect(mentions(c.cardSlots, id) || cardPlaces(c.cardSlots, id).length === 0, `${c.slug} ${id}`).toBe(true)
    }
    expect(mentions(['wbf.a.b <- other-uses#0:0'], 'other-uses')).toBe(true)
    expect(mentions(['wbf.a.b <- other-uses-2'], 'other-uses')).toBe(false)
  })
})

describe('the convention page', () => {
  it('shows where the convention and its sections go on the cards, linked to the cell', async () => {
    render(
      <MemoryRouter initialEntries={['/c/fixture-alpha']}>
        <App />
      </MemoryRouter>,
    )
    const links = await screen.findAllByRole('link', { name: new RegExp(`^${t.places.link('WBF 卡', '')}`) }, { timeout: 15_000 })
    const hrefs = links.map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/cards/club/wbf?cell=wbf.openings.1NT.responses')
    const section = document.getElementById(links.find((a) => a.getAttribute('href')!.includes('1NT.responses'))!.closest('[data-section]')!.id)!
    expect(within(section).getAllByText(t.places.title).length).toBeGreaterThan(0)
  })
})
