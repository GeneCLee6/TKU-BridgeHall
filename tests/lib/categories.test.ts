import { categories, conventions } from '../fixtures/content.ts'
import { categoryUsage, knownCategoryIds, newCategoryId, resolveCategories } from '../../src/lib/categories.ts'
import type { Category } from '../../src/types/convention.ts'

const cat = (id: string, order: number, label = id): Category => ({ id, label, description: '', order })

describe('categories as data', () => {
  // That every bundled category has some of the club's conventions is checked in the private
  // repository's copy of this file; the made-up ones (tests/fixtures) use only a few categories
  it('ships the bundled ones in order, and the conventions use only those', () => {
    expect(categories.map((c) => c.order)).toEqual(categories.map((_, i) => i))
    const ids = categories.map((c) => c.id)
    for (const id of categoryUsage(conventions).keys()) expect(ids).toContain(id)
  })

  it('uses the bundled list until the categories are edited online', () => {
    expect(resolveCategories(categories, undefined, conventions)).toEqual(categories)
    expect(resolveCategories(categories, [], conventions)).toEqual(categories)
  })

  it('uses the online list in its order, keeping bundled ones that still have conventions', () => {
    const bundled = [cat('a', 0), cat('b', 1), cat('c', 2)]
    const online = [cat('new', 1, '新'), cat('b', 0, '乙（改名）')]
    expect(resolveCategories(bundled, online, [{ category: 'b' }, { category: 'c' }])).toEqual([
      cat('b', 0, '乙（改名）'),
      cat('new', 1, '新'),
      // Left out online but still used: kept at the end
      cat('c', 2),
    ])
    expect(knownCategoryIds(bundled, online)).toEqual(['new', 'b', 'a', 'c'])
  })

  it('counts conventions per category and makes ids that are not taken', () => {
    expect(categoryUsage([{ category: 'a' }, { category: 'a' }, { category: 'b' }])).toEqual(new Map([['a', 2], ['b', 1]]))
    expect(newCategoryId([], 36)).toBe('c-10')
    expect(newCategoryId(['c-10', 'c-10-2'], 36)).toBe('c-10-3')
    expect(newCategoryId([])).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })
})
