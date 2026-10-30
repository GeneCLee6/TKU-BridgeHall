import { searchIndexJson } from '../../scripts/search-index.ts'
import { conventions } from '../fixtures/content.ts'
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
const index = JSON.parse(searchIndexJson(conventions)) as SearchIndex
const search = searchRecords(mergeIndex(index, manifest, () => true))
const fromContent = createSearch(conventions)

describe('search', () => {
  it.each([
    ['Fixture Alpha', 'fixture-alpha'],
    ['測試特約甲', 'fixture-alpha'],
    ['測試甲', 'fixture-alpha'],
    ['問四張高花', 'fixture-alpha'],
    ['Fixture Beta', 'fixture-beta'],
    ['測試特約乙', 'fixture-beta'],
    ['測試乙', 'fixture-beta'],
    ['處罰性', 'fixture-beta'],
    ['測試制度', 'fixture-system'],
    ['佔位開叫表', 'fixture-system'],
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
    const hit = search('測試回答').find((r) => r.sectionId)
    expect(hit?.slug).toBeTruthy()
    expect(hit?.label).toContain('›')
  })

  it('ranks the convention a name belongs to first', () => {
    expect(search('測試特約乙')[0].slug).toBe('fixture-beta')
    expect(search('Fixture System')[0].slug).toBe('fixture-system')
  })

  it('gives the same results from the index as from the full content', () => {
    for (const query of ['Fixture', '2D', '測試回答', '測試', '處罰性', '佔位', '3NT']) {
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
    const original = conventions.find((c) => c.slug === 'fixture-alpha')!
    const edited: Convention = {
      ...original,
      sections: [{ id: 'new', title: '新段落', blocks: [{ kind: 'paragraph', text: '只在線上版本出現的句子' }] }],
    }
    const catalogue = manifest.map((c) => (c.slug === 'fixture-alpha' ? edited : c))
    const online = searchRecords(mergeIndex(index, catalogue, (slug) => slug !== 'fixture-alpha'))
    expect(online('只在線上版本出現')[0]).toMatchObject({ slug: 'fixture-alpha', sectionId: 'new' })
    // The bundled sections are gone with the bundled content
    const bundledSection = original.sections[0].id
    expect(online('測試特約甲').some((r) => r.slug === 'fixture-alpha' && r.sectionId === bundledSection)).toBe(false)
  })

  it('searches the section titles of a convention changed online until its content loads', () => {
    const meta = conventionMeta(conventions.find((c) => c.slug === 'fixture-beta')!)
    const records = mergeIndex(index, [meta], () => false)
    expect(records).toEqual(buildRecords([meta]))
  })

  it('leaves out conventions no longer in the catalogue (hidden online)', () => {
    const records = mergeIndex(index, manifest.filter((c) => c.slug !== 'fixture-alpha'), () => true)
    expect(records.some((r) => r.slug === 'fixture-alpha')).toBe(false)
  })
})
