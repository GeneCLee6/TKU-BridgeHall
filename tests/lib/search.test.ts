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

  it('returns nothing for an empty query', () => {
    expect(search('   ')).toEqual([])
  })
})
