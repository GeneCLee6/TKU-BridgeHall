import { categories, conventions } from '../../src/content/index.ts'
import type { BookEntry, BookEntrySummary } from '../../src/lib/api.ts'
import {
  conventionProblems,
  conventionWarnings,
  mergeManifest,
  onlineConvention,
  tidyConvention,
} from '../../src/lib/content.ts'
import { conventionMeta } from '../../src/lib/sections.ts'
import type { Convention, ConventionMeta } from '../../src/types/convention.ts'

const ids = categories.map((c) => c.id as string)
const lebensohl = conventions.find((c) => c.slug === 'lebensohl')!
const metas = conventions.map(conventionMeta)

const summary = (slug: string, meta: unknown, extra: Partial<BookEntrySummary> = {}): BookEntrySummary => ({
  slug,
  version: 1,
  meta: meta as ConventionMeta | null,
  createdAt: 1,
  updatedAt: 2,
  updatedBy: 'amy',
  ...extra,
})

const entry = (slug: string, convention: unknown): BookEntry => ({
  slug,
  version: 1,
  convention,
  createdAt: 1,
  updatedAt: 2,
  updatedBy: 'amy',
})

describe('online content over the bundle', () => {
  it('replaces, adds and hides conventions, keeping the bundled order', () => {
    const edited = conventionMeta({ ...lebensohl, summary: '線上改過的摘要' })
    const added = conventionMeta({ ...lebensohl, slug: 'new-one', nameZh: '新特約' })
    const merged = mergeManifest(
      metas,
      [
        summary('lebensohl', edited, { version: 3, bundledUpdated: lebensohl.updated }),
        summary('new-one', added, { createdAt: 5 }),
        summary('jacoby-2nt', null),
      ],
      ids,
    )
    const slugs = merged.conventions.map((c) => c.slug)
    expect(slugs.indexOf('lebensohl')).toBe(conventions.findIndex((c) => c.slug === 'lebensohl'))
    expect(merged.conventions.find((c) => c.slug === 'lebensohl')!.summary).toBe('線上改過的摘要')
    expect(slugs.at(-1)).toBe('new-one')
    expect(slugs).not.toContain('jacoby-2nt')
    expect(merged.conventions).toHaveLength(conventions.length)
    expect(merged.online.get('lebensohl')).toMatchObject({ version: 3, added: false, hidden: false, updatedBy: 'amy' })
    expect(merged.online.get('new-one')).toMatchObject({ added: true })
    expect(merged.online.get('jacoby-2nt')).toMatchObject({ hidden: true })
  })

  it('leaves out broken entries instead of breaking the page', () => {
    const lebensohlMeta = metas.find((c) => c.slug === 'lebensohl')!
    const merged = mergeManifest(
      metas,
      [summary('lebensohl', { slug: 'lebensohl' }), summary('other', { ...lebensohlMeta, slug: 'mismatch' })],
      ids,
    )
    expect(merged.conventions.find((c) => c.slug === 'lebensohl')).toBe(lebensohlMeta)
    expect(merged.skipped.map((s) => s.slug)).toEqual(['lebensohl', 'other'])
  })

  it('checks an online convention when it is loaded', () => {
    const edited: Convention = { ...lebensohl, summary: '線上改過的摘要' }
    expect(onlineConvention(entry('lebensohl', edited), ids)).toEqual({ convention: edited })
    expect(onlineConvention(entry('lebensohl', { slug: 'lebensohl' }), ids)).toHaveProperty('problem')
    expect(onlineConvention(entry('other', edited), ids)).toEqual({ problem: '網址代稱不符' })
  })
})

describe('checking a convention', () => {
  it('accepts every bundled convention, and tidying changes none of them', () => {
    for (const c of conventions) {
      expect(conventionProblems(c, ids), c.slug).toEqual([])
      expect(tidyConvention(c), c.slug).toEqual(c)
      expect(conventionWarnings(c), c.slug).toEqual([])
    }
  })

  it('reports what an editor has to fix, in words', () => {
    const broken = {
      ...lebensohl,
      slug: 'Bad Slug',
      nameZh: '',
      category: 'nowhere',
      sections: [
        { id: 'a', title: 'A', blocks: [{ kind: 'video' }] },
        { id: 'a', title: 'B', blocks: [{ kind: 'responses', rows: [{ call: '1H' }] }] },
      ],
    }
    expect(conventionProblems(broken, ids)).toEqual([
      '網址代稱只能用小寫英文、數字與連字號，例如 jacoby-transfer',
      '缺少中文名稱',
      '分類不存在',
      'A：不明的內容區塊',
      '段落 id 重複：a',
      'B：叫品表的每一列要有叫品與意義',
    ])
  })

  it('warns about calls it cannot draw and suit letters left in meanings', () => {
    const draft: Convention = {
      ...lebensohl,
      sections: [
        {
          id: 'a',
          title: 'A',
          blocks: [{ kind: 'responses', rows: [{ call: '2Q', meaning: 'x' }, { call: '3H', meaning: '迫叫至3H' }] }],
        },
        { id: 'b', title: '' },
      ],
    }
    expect(conventionWarnings(draft)).toEqual([
      'A：看不懂的叫品「2Q」',
      'A：3H 的意義裡有花色字母沒換成符號',
      '（無標題）：段落沒有標題',
      '（無標題）：段落是空的',
    ])
  })

  it('drops empty optional fields when tidying', () => {
    const messy: Convention = {
      ...lebensohl,
      aliases: [' '],
      source: { title: 'x', note: '' },
      sections: [
        {
          id: 'a',
          title: 'A',
          summary: ' ',
          pending: '',
          children: [],
          blocks: [
            { kind: 'paragraph', text: 'p', pending: '' },
            {
              kind: 'responses',
              caption: '',
              rows: [
                { call: ' 2D ', meaning: 'm', note: '', pending: '' },
                { call: '', meaning: ' ' },
              ],
            },
            // What the editor leaves behind when nothing is filled in
            { kind: 'paragraph', text: ' ' },
            { kind: 'rules', items: [{ text: '' }] },
            { kind: 'responses', auction: { seats: ['開叫者', '敵方', '答叫者', '敵方'], calls: ['?'] }, rows: [{ call: '', meaning: '' }] },
            { kind: 'hand', hand: { spades: '', hearts: '', diamonds: '', clubs: '' } },
          ],
        },
        { id: 'b', title: 'B', blocks: [{ kind: 'note', tone: 'info', text: '' }] },
      ],
    }
    expect(tidyConvention(messy)).toEqual({
      ...lebensohl,
      aliases: undefined,
      source: { title: 'x' },
      sections: [
        {
          id: 'a',
          title: 'A',
          blocks: [
            { kind: 'paragraph', text: 'p' },
            { kind: 'responses', rows: [{ call: '2D', meaning: 'm' }] },
          ],
        },
        { id: 'b', title: 'B' },
      ],
    })
  })
})
