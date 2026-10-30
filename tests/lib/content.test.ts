import { categories, conventions } from '../fixtures/content.ts'
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
const alpha = conventions.find((c) => c.slug === 'fixture-alpha')!
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
    const edited = conventionMeta({ ...alpha, summary: '線上改過的摘要' })
    const added = conventionMeta({ ...alpha, slug: 'new-one', nameZh: '新特約' })
    const merged = mergeManifest(
      metas,
      [
        summary('fixture-alpha', edited, { version: 3, bundledUpdated: alpha.updated }),
        summary('new-one', added, { createdAt: 5 }),
        summary('fixture-beta', null),
      ],
      ids,
    )
    const slugs = merged.conventions.map((c) => c.slug)
    expect(slugs.indexOf('fixture-alpha')).toBe(conventions.findIndex((c) => c.slug === 'fixture-alpha'))
    expect(merged.conventions.find((c) => c.slug === 'fixture-alpha')!.summary).toBe('線上改過的摘要')
    expect(slugs.at(-1)).toBe('new-one')
    expect(slugs).not.toContain('fixture-beta')
    expect(merged.conventions).toHaveLength(conventions.length)
    expect(merged.online.get('fixture-alpha')).toMatchObject({ version: 3, added: false, hidden: false, updatedBy: 'amy' })
    expect(merged.online.get('new-one')).toMatchObject({ added: true })
    expect(merged.online.get('fixture-beta')).toMatchObject({ hidden: true })
  })

  it('leaves out broken entries instead of breaking the page', () => {
    const alphaMeta = metas.find((c) => c.slug === 'fixture-alpha')!
    const merged = mergeManifest(
      metas,
      [summary('fixture-alpha', { slug: 'fixture-alpha' }), summary('other', { ...alphaMeta, slug: 'mismatch' })],
      ids,
    )
    expect(merged.conventions.find((c) => c.slug === 'fixture-alpha')).toBe(alphaMeta)
    expect(merged.skipped.map((s) => s.slug)).toEqual(['fixture-alpha', 'other'])
  })

  it('checks an online convention when it is loaded', () => {
    const edited: Convention = { ...alpha, summary: '線上改過的摘要' }
    expect(onlineConvention(entry('fixture-alpha', edited), ids)).toEqual({ convention: edited })
    expect(onlineConvention(entry('fixture-alpha', { slug: 'fixture-alpha' }), ids)).toHaveProperty('problem')
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
      ...alpha,
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

  it('checks kind, level and prerequisites, which are all optional', () => {
    const { kind: _kind, level: _level, ...unclassified } = alpha
    expect(conventionProblems(unclassified, ids)).toEqual([])
    const broken = {
      ...alpha,
      kind: 'gadget',
      level: 'expert',
      prerequisites: ['fixture-alpha'],
      cardSlots: 'top',
      sections: [{ id: 'a', title: 'A', level: 'hard', blocks: [] }],
    }
    expect(conventionProblems(broken, ids)).toEqual([
      '種類不存在',
      '程度不存在',
      '前置特約不能是自己',
      '制度卡位置要是文字清單',
      'A：程度不存在',
    ])
    expect(conventionProblems({ ...alpha, prerequisites: [1] }, ids)).toEqual(['前置特約要是網址代稱清單'])
    expect(tidyConvention({ ...alpha, prerequisites: [' '], cardSlots: [...alpha.cardSlots!, ' '] })).toEqual(
      alpha,
    )
  })

  it('warns about calls it cannot draw and suit letters left in meanings', () => {
    const draft: Convention = {
      ...alpha,
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

  it('checks and tidies the 導讀 block (e4-t04)', () => {
    const withIntro = (block: unknown) => ({ ...alpha, sections: [{ id: 'a', title: 'A', blocks: [block] }] })
    expect(conventionProblems(withIntro({ kind: 'intro', why: 'w', pitfalls: ['p'] }), ids)).toEqual([])
    expect(conventionProblems(withIntro({ kind: 'intro' }), ids)).toEqual([])
    expect(conventionProblems(withIntro({ kind: 'intro', why: 1 }), ids)).toEqual(['A：導讀格式不正確'])
    expect(conventionProblems(withIntro({ kind: 'intro', pitfalls: 'p' }), ids)).toEqual(['A：導讀格式不正確'])

    const tidy = (block: unknown) => tidyConvention(withIntro(block) as Convention).sections[0]
    expect(tidy({ kind: 'intro', why: 'w', when: ' ', pitfalls: ['p', ' ', ''] })).toEqual({
      id: 'a',
      title: 'A',
      blocks: [{ kind: 'intro', why: 'w', pitfalls: ['p'] }],
    })
    // What the editor's 導讀 button adds, left empty, is dropped
    expect(tidy({ kind: 'intro', why: '', when: '', pitfalls: [] })).toEqual({ id: 'a', title: 'A' })
  })

  it('drops empty optional fields when tidying', () => {
    const messy: Convention = {
      ...alpha,
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
      ...alpha,
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
