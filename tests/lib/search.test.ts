import { conventions } from '../../src/content/index.ts'
import { createSearch } from '../../src/lib/search.ts'

const search = createSearch(conventions)

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
    expect(hit?.slug).toBe('lebensohl')
  })

  it('returns nothing for an empty query', () => {
    expect(search('   ')).toEqual([])
  })
})
