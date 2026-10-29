// @vitest-environment node
import { articleRecords, searchRecords } from '../../src/lib/search.ts'
import {
  articlePath,
  authorsOf,
  BUILTIN_SERIES,
  filterArticles,
  newSeriesId,
  noFilter,
  resolveSeries,
  seriesColorIndex,
  seriesUsage,
  shelves,
} from '../../src/lib/series.ts'
import type { ArticleMeta, ArticleSeries } from '../../src/types/article.ts'

/** Test data only: the shape of articles, not real library content */
const meta = (slug: string, extra: Partial<ArticleMeta> = {}): ArticleMeta => ({
  slug,
  title: `測試${slug}`,
  authors: ['測試作者甲'],
  series: 'test-a',
  summary: '測試摘要',
  published: '2026-10-01',
  updated: '2026-10-01',
  license: 'own',
  ...extra,
})

const series: ArticleSeries[] = [
  { id: 'test-b', label: '測試系列乙', description: '', order: 1 },
  { id: 'test-a', label: '測試系列甲', description: '', order: 0 },
]

describe('series (e5-t06)', () => {
  it('shows the built-in series until the list is saved online, then the online one in order', () => {
    expect(resolveSeries(undefined)).toEqual(BUILTIN_SERIES)
    expect(resolveSeries([])).toEqual(BUILTIN_SERIES)
    expect(resolveSeries(series).map((s) => s.id)).toEqual(['test-a', 'test-b'])
  })

  it('has built-in ids the Worker accepts, each once', () => {
    const ids = BUILTIN_SERIES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  it('counts articles per series and makes new ids that are not taken', () => {
    expect(seriesUsage([meta('a'), meta('b'), meta('c', { series: 'test-b' })])).toEqual(
      new Map([
        ['test-a', 2],
        ['test-b', 1],
      ]),
    )
    expect(newSeriesId([], 0)).toBe('s-0')
    expect(newSeriesId(['s-0'], 0)).toBe('s-0-2')
  })

  it('puts articles on shelves in series order, newest first, and keeps the ones in an unknown series', () => {
    const list = shelves(resolveSeries(series), [
      meta('old', { published: '2026-01-01' }),
      meta('new', { published: '2026-09-01' }),
      meta('lost', { series: 'gone' }),
    ])
    expect(list.map((s) => [s.series?.id ?? null, s.articles.map((a) => a.slug)])).toEqual([
      ['test-a', ['new', 'old']],
      [null, ['lost']],
    ])
  })

  it('filters by series, level and author', () => {
    const all = [
      meta('a', { level: 'basic' }),
      meta('b', { level: 'advanced', authors: ['測試作者乙'] }),
      meta('c', { series: 'test-b', authors: ['測試作者乙', '測試作者甲'] }),
    ]
    const slugs = (f: Partial<typeof noFilter>) => filterArticles(all, { ...noFilter, ...f }).map((a) => a.slug)
    expect(slugs({})).toEqual(['a', 'b', 'c'])
    expect(slugs({ series: 'test-b' })).toEqual(['c'])
    expect(slugs({ level: 'advanced' })).toEqual(['b'])
    expect(slugs({ author: '測試作者乙' })).toEqual(['b', 'c'])
    expect(authorsOf(all)).toEqual(['測試作者甲', '測試作者乙'])
  })

  it('gives a series the same cover colour every time', () => {
    expect(seriesColorIndex('test-a', 10)).toBe(seriesColorIndex('test-a', 10))
    expect(seriesColorIndex('test-a', 10)).toBeLessThan(10)
  })
})

describe('article search records (e5-t13)', () => {
  const list = {
    entries: [
      { slug: 'test-one', meta: meta('test-one', { title: '測試擠牌入門', level: 'basic' as const }) },
      { slug: 'hidden', meta: null },
    ],
    series: { series },
    text: { 'test-one': '只在內文裡的句子 1♠' },
  }

  it('makes one record per visible article, linked to its page', () => {
    const records = articleRecords(list)
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      slug: 'library/test-one',
      path: articlePath('test-one'),
      label: '叢書 › 測試擠牌入門',
      level: 'basic',
    })
    expect(records[0].tags).toContain('測試系列甲')
  })

  it('finds an article by its title, its author and the words of its body', () => {
    const search = searchRecords(articleRecords(list))
    expect(search('擠牌入門')[0]?.path).toBe('/library/test-one')
    expect(search('測試作者甲')[0]?.path).toBe('/library/test-one')
    expect(search('只在內文裡的句子')[0]?.path).toBe('/library/test-one')
    // Suits are searched as letters, as in conventions
    expect(search('1S')[0]?.path).toBe('/library/test-one')
  })

  it('still works without the words (a Worker that does not send them)', () => {
    expect(articleRecords({ entries: list.entries })[0].text).toContain('測試摘要')
  })
})
