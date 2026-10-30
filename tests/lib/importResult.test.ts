import { categories, conventions } from '../fixtures/content.ts'
import { tidyConvention } from '../../src/lib/content.ts'
import { fromAiReply, importedItems, draftBody, slugify, type FlatConvention } from '../../src/lib/importResult.ts'
import type { Block, Convention, RuleItem, Section } from '../../src/types/convention.ts'

const ids = categories.map((c) => c.id as string)

/** A convention in the flat shape the AI answers in (TKU-BridgeTable worker/importer.ts) */
function toFlat(c: Convention, action: 'new' | 'update' = 'new'): FlatConvention {
  const items = (list: RuleItem[], level = 0): { level: number; text: string; pending: string }[] =>
    list.flatMap((i) => [{ level, text: i.text, pending: i.pending ?? '' }, ...items(i.children ?? [], level + 1)])
  const block = (b: Block) => {
    switch (b.kind) {
      case 'paragraph':
        return { kind: b.kind, text: b.text, pending: b.pending ?? '' }
      case 'rules':
        return { kind: b.kind, ordered: !!b.ordered, items: items(b.items) }
      case 'note':
        return { kind: b.kind, tone: b.tone, text: b.text }
      case 'hand':
        return { kind: b.kind, label: b.label ?? '', ...b.hand }
      case 'responses':
        return {
          kind: b.kind,
          caption: b.caption ?? '',
          seats: b.auction?.seats ?? [],
          calls: (b.auction?.calls ?? []).map((x) => (typeof x === 'string' ? { call: x, note: '' } : { call: x.call, note: x.note ?? '' })),
          rows: b.rows.map((r) => ({ call: r.call, meaning: r.meaning, note: r.note ?? '', pending: r.pending ?? '' })),
        }
    }
  }
  const sections = (list: Section[], parentId = ''): FlatConvention['sections'] =>
    list.flatMap((s) => [
      {
        id: s.id,
        parentId,
        title: s.title,
        originalTitle: s.originalTitle ?? '',
        summary: s.summary ?? '',
        pending: s.pending ?? '',
        blocks: (s.blocks ?? []).map(block) as FlatConvention['sections'][number]['blocks'],
      },
      ...sections(s.children ?? [], s.id),
    ])
  return {
    action,
    replaces: action === 'update' ? c.slug : '',
    slug: c.slug,
    nameZh: c.nameZh,
    nameEn: c.nameEn,
    aliases: c.aliases ?? [],
    category: c.category,
    tags: c.tags,
    summary: c.summary,
    sourceTitle: c.source.title,
    sourceNote: c.source.note ?? '',
    sections: sections(c.sections),
  }
}

/** The AI's flat shape has no 導讀 block and no section level (both are set in the editor): left out here */
const withoutIntro = (c: Convention): Convention => {
  const strip = (list: Section[]): Section[] =>
    list.map(({ level: _level, ...s }) => ({
      ...s,
      ...(s.blocks && { blocks: s.blocks.filter((b) => b.kind !== 'intro') }),
      ...(s.children && { children: strip(s.children) }),
    }))
  return { ...c, sections: strip(c.sections) }
}
const bundled = conventions.map(withoutIntro)

describe('turning the AI reply into conventions', () => {
  it('rebuilds every bundled convention exactly from its flat form', () => {
    for (const c of bundled) {
      const { items } = fromAiReply({ conventions: [toFlat(c)], reviewNotes: '' }, ids, c.updated)
      // The AI does not classify: kind, level and prerequisites are set in the editor
      const { kind: _k, level: _l, prerequisites: _p, cardSlots: _c, ...unclassified } = tidyConvention(c)
      expect(items[0].convention, c.slug).toEqual(unclassified)
      expect(items[0].problems, c.slug).toEqual([])
    }
  })

  it('files updates under the convention they replace, and cleans up what it cannot use', () => {
    const alpha = bundled.find((c) => c.slug === 'fixture-alpha')!
    const update = { ...toFlat(alpha, 'update'), slug: 'something-else' }
    const odd: FlatConvention = {
      ...toFlat(alpha),
      slug: 'Jacoby Transfer!',
      category: 'unknown',
      sections: [
        { id: 'Intro Part', parentId: '', title: '一', originalTitle: '', summary: '', pending: '', blocks: [] },
        { id: 'dup', parentId: 'Intro Part', title: '二', originalTitle: '', summary: '', pending: '', blocks: [] },
        { id: 'dup', parentId: 'nowhere', title: '三', originalTitle: '', summary: '', pending: '', blocks: [] },
      ],
    }
    const { items, reviewNotes } = fromAiReply({ conventions: [update, odd], reviewNotes: '對應到雷本索' }, ids, '2026-10-23')
    expect(reviewNotes).toBe('對應到雷本索')
    expect(items[0]).toMatchObject({ replaces: 'fixture-alpha', convention: { slug: 'fixture-alpha' } })
    const second = items[1].convention
    expect(second.slug).toBe('jacoby-transfer')
    expect(second.category).toBe(ids[0])
    expect(second.sections.map((s) => [s.id, s.title, s.children?.map((x) => [x.id, x.title])])).toEqual([
      ['sec-1', '一', [['dup', '二']]],
      ['sec-2', '三', undefined],
    ])
  })

  it('keeps list levels sensible and normalises calls', () => {
    const flat: FlatConvention = {
      ...toFlat(conventions[0]),
      sections: [
        {
          id: 'a',
          parentId: '',
          title: 'A',
          originalTitle: '',
          summary: '',
          pending: '',
          blocks: [
            { kind: 'rules', ordered: false, items: [{ level: 2, text: 'x', pending: '' }, { level: 3, text: 'y', pending: '疑' }] },
            { kind: 'responses', caption: '', seats: ['N', 'E', 'S', 'W'], calls: [{ call: '1nt', note: '' }, { call: '2♣', note: '史帝曼' }], rows: [{ call: '2♦', meaning: '轉換', note: '', pending: '' }] },
          ],
        },
      ],
    }
    const blocks = fromAiReply({ conventions: [flat] }, ids, '2026-10-23').items[0].convention.sections[0].blocks
    expect(blocks).toEqual([
      { kind: 'rules', items: [{ text: 'x', children: [{ text: 'y', pending: '疑' }] }] },
      {
        kind: 'responses',
        auction: { seats: ['N', 'E', 'S', 'W'], calls: ['1NT', { call: '2C', note: '史帝曼' }] },
        rows: [{ call: '2D', meaning: '轉換' }],
      },
    ])
  })

  it('reads a saved draft back', () => {
    const result = fromAiReply({ conventions: [toFlat(conventions[1])], reviewNotes: 'n' }, ids, '2026-10-23')
    const stored = JSON.parse(JSON.stringify(draftBody(result)))
    expect(importedItems(stored)).toEqual(result)
    expect(importedItems({ conventions: [null, { nothing: 1 }] }).items).toEqual([])
  })

  it('makes URL-safe slugs', () => {
    expect(slugify('Jacoby 2NT (Old)', 'x')).toBe('jacoby-2nt-old')
    expect(slugify('雷本索', 'imported-1')).toBe('imported-1')
  })
})
