import { searchIndexJson } from '../../scripts/search-index.ts'
import { conventions } from '../../src/content/index.ts'
import {
  buildRecords,
  createSearch,
  isSearchIndex,
  mergeIndex,
  searchRecords,
  type SearchIndex,
} from '../../src/lib/search.ts'
import { conventionMeta } from '../../src/lib/sections.ts'
import type { Convention } from '../../src/types/convention.ts'

// What the site searches: the index the Worker serves, with the manifest (no content loaded)
const manifest = conventions.map(conventionMeta)
const index = JSON.parse(searchIndexJson()) as SearchIndex
const search = searchRecords(mergeIndex(index, manifest, () => true))
const fromContent = createSearch(conventions)

describe('search', () => {
  it.each([
    ['Lebensohl', 'lebensohl'],
    ['雷本索', 'lebensohl'],
    ['雷本所', 'lebensohl'],
    ['stayman', 'notrump-responses'],
    ['Texas transfer', 'notrump-responses'],
    ['1H 2H', 'single-raise-major'],
    ['單加', 'single-raise-major'],
    ['J2N', 'jacoby-2nt'],
    ['Jacoby', 'jacoby-2nt'],
    ['Bergen', 'bergen-raises'],
    ['松濤版', 'bergen-raises'],
    ['信號', 'defensive-signals'],
    ['Smith Echo', 'defensive-signals'],
    ['奇正偶轉', 'defensive-signals'],
    ['一高弱二', 'two-diamond-opening'],
    ['NMF', 'new-minor-forcing'],
    ['好壞2NT', 'good-bad-2nt'],
    ['puppet', 'two-notrump-opening'],
    ['1S 2NT舊版', 'major-slam-ask-2011'],
    ['回答性賭倍', 'responsive-double'],
    ['自然制', 'system-overview'],
    ['技光', 'system-competition'],
    ['Responsive dbl', 'responsive-double'],
    ['Unusual 2NT', 'defense-vs-unusual-2nt'],
    ['兩低', 'defense-vs-unusual-2nt'],
    ['mini splinter', 'defense-vs-unusual-2nt'],
  ])('finds "%s" in %s', (query, slug) => {
    expect(search(query)[0]?.slug).toBe(slug)
  })

  it('treats 2♦ and 2D as the same bid', () => {
    const symbol = search('2♦').map((r) => `${r.slug}/${r.sectionId}`)
    const letter = search('2D').map((r) => `${r.slug}/${r.sectionId}`)
    expect(symbol).toEqual(letter)
    expect(symbol.length).toBeGreaterThan(0)
  })

  it('returns sections as deep-linkable results', () => {
    const hit = search('問A').find((r) => r.sectionId)
    expect(hit?.slug).toBeTruthy()
    expect(hit?.label).toContain('›')
  })

  it('ranks a convention ahead of the old handbook on the same subject', () => {
    expect(search('雷本索')[0].slug).toBe('lebensohl')
    expect(search('Stayman')[0].slug).toBe('notrump-responses')
  })

  it('gives the same results from the index as from the full content', () => {
    for (const query of ['Lebensohl', '2D', '問A', '信號', '1S 2NT舊版', 'NMF', '平衡位置']) {
      const ids = (fn: typeof search) => fn(query).map((r) => `${r.slug}/${r.sectionId ?? ''}`)
      expect(ids(search)).toEqual(ids(fromContent))
    }
  })

  it('returns nothing for an empty query', () => {
    expect(search('   ')).toEqual([])
  })
})

describe('search index', () => {
  it('holds a record for every bundled convention and section', () => {
    expect(isSearchIndex(index)).toBe(true)
    expect(index.records).toEqual(buildRecords(conventions))
    expect(isSearchIndex({ version: 0, records: [] })).toBe(false)
    expect(isSearchIndex(null)).toBe(false)
  })

  it('replaces the records of a convention changed online with its new content', () => {
    const original = conventions.find((c) => c.slug === 'lebensohl')!
    const edited: Convention = {
      ...original,
      sections: [{ id: 'new', title: '新段落', blocks: [{ kind: 'paragraph', text: '只在線上版本出現的句子' }] }],
    }
    const catalogue = manifest.map((c) => (c.slug === 'lebensohl' ? edited : c))
    const online = searchRecords(mergeIndex(index, catalogue, (slug) => slug !== 'lebensohl'))
    expect(online('只在線上版本出現')[0]).toMatchObject({ slug: 'lebensohl', sectionId: 'new' })
    // The bundled sections are gone with the bundled content
    const bundledSection = original.sections[0].id
    expect(online('雷本索').some((r) => r.slug === 'lebensohl' && r.sectionId === bundledSection)).toBe(false)
  })

  it('searches the section titles of a convention changed online until its content loads', () => {
    const meta = conventionMeta(conventions.find((c) => c.slug === 'jacoby-2nt')!)
    const records = mergeIndex(index, [meta], () => false)
    expect(records).toEqual(buildRecords([meta]))
  })

  it('leaves out conventions no longer in the catalogue (hidden online)', () => {
    const records = mergeIndex(index, manifest.filter((c) => c.slug !== 'lebensohl'), () => true)
    expect(records.some((r) => r.slug === 'lebensohl')).toBe(false)
  })
})
