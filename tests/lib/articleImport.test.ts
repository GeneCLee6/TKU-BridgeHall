import {
  blankArticle,
  blankArticleBlock,
  cardFromText,
  contractFromText,
  suitCards,
  tricksFromText,
  tricksText,
} from '../../src/lib/articleEdit.ts'
import { articleProblems } from '../../src/lib/articles.ts'
import { articleDraftBody, fromArticleReply, importedArticles, type FlatArticle } from '../../src/lib/importResult.ts'

/**
 * Article import (e5-t08) and the article editor's card text (e5-t07). Every article here is test
 * data in the shape TKU-BridgeTable worker/importer.ts articleImportSchema answers in, not library
 * content.
 */

const SERIES = ['squeeze', 'lessons']
const none = { spades: '', hearts: '', diamonds: '', clubs: '' }

function flat(extra: Partial<FlatArticle> = {}): FlatArticle {
  return {
    action: 'new',
    replaces: '',
    slug: 'test-article',
    title: '測試文章',
    authors: ['測試作者'],
    series: 'squeeze',
    summary: '測試摘要',
    blocks: [
      { kind: 'heading', level: 2, text: '測試小標題' },
      { kind: 'paragraph', text: '測試段落 **粗體** 1♠', pending: '' },
      { kind: 'paragraph', text: '測試疑義段落', pending: '原文缺字' },
      { kind: 'rules', ordered: true, items: [{ level: 0, text: '測試條列', pending: '' }, { level: 1, text: '測試子項', pending: '' }] },
      { kind: 'quote', text: '測試引文', cite: '測試出處' },
      { kind: 'note', tone: 'warning', text: '測試注意' },
      {
        kind: 'deal',
        caption: '測試牌例',
        dealer: 'S',
        vul: 'EW',
        north: { spades: 'AK2', hearts: '-', diamonds: 'QJ10', clubs: '' },
        east: none,
        south: { spades: 'Q3', hearts: 'A', diamonds: '', clubs: '' },
        west: none,
      },
      { kind: 'play', caption: '測試出牌', contract: '3NT', declarer: 'S', tricks: ['S2 SA S5 SK', '♥A h10', ''] },
    ],
    ...extra,
  }
}

describe('cards typed as text (e5-t07)', () => {
  it('reads letters, symbols and 10', () => {
    expect(cardFromText('SA')).toBe('SA')
    expect(cardFromText('♠a')).toBe('SA')
    expect(cardFromText('h10')).toBe('HT')
    expect(cardFromText('♦T')).toBe('DT')
  })

  it('keeps what it cannot read, so the check names it', () => {
    expect(cardFromText('X9')).toBe('X9')
    expect(articleProblems({ ...blankArticle('squeeze', '2026-10-29'), slug: 'x', title: 'x', blocks: [{ kind: 'play', contract: '3N', declarer: 'S', tricks: [['X9']] }] })).not.toEqual([])
  })

  it('turns lines into tricks and back, dropping blank lines', () => {
    const tricks = tricksFromText('S2 SA, S5 SK\n\n♥A H3')
    expect(tricks).toEqual([['S2', 'SA', 'S5', 'SK'], ['HA', 'H3']])
    expect(tricksText(tricks)).toBe('S2 SA S5 SK\nHA H3')
  })

  it('reads a suit’s ranks and a contract', () => {
    expect(suitCards('D', 'QJ10')).toEqual(['DQ', 'DJ', 'DT'])
    expect(suitCards('H', '-')).toEqual([])
    expect(contractFromText('3nt')).toBe('3N')
    expect(contractFromText('4 h x')).toBe('4HX')
    expect(contractFromText('4♠')).toBe('4S')
  })

  it('starts blocks the article’s check accepts once filled', () => {
    expect(blankArticleBlock('heading')).toEqual({ kind: 'heading', level: 2, text: '' })
    expect(blankArticleBlock('deal')).toMatchObject({ kind: 'deal', deal: { dealer: 'N', vul: 'None' } })
    expect(blankArticleBlock('paragraph')).toMatchObject({ kind: 'paragraph' })
    expect(blankArticle('squeeze', '2026-10-29').license).toBe('members-only')
  })
})

describe('turning the AI reply into articles (e5-t08)', () => {
  it('keeps every word as the AI transcribed it', () => {
    const { items, reviewNotes } = fromArticleReply({ articles: [flat()], reviewNotes: '測試說明' }, SERIES, '2026-10-29')
    expect(reviewNotes).toBe('測試說明')
    const [{ article, problems, replaces }] = items
    expect(problems).toEqual([])
    expect(replaces).toBe('')
    expect(article).toMatchObject({
      slug: 'test-article',
      title: '測試文章',
      authors: ['測試作者'],
      series: 'squeeze',
      summary: '測試摘要',
      published: '2026-10-29',
      updated: '2026-10-29',
      license: 'members-only',
    })
    expect(article).not.toHaveProperty('level')
    expect(article.blocks).toEqual([
      { kind: 'heading', level: 2, text: '測試小標題' },
      { kind: 'paragraph', text: '測試段落 **粗體** 1♠' },
      { kind: 'paragraph', text: '測試疑義段落', pending: '原文缺字' },
      { kind: 'rules', ordered: true, items: [{ text: '測試條列', children: [{ text: '測試子項' }] }] },
      { kind: 'quote', text: '測試引文', cite: '測試出處' },
      { kind: 'note', tone: 'warning', text: '測試注意' },
      {
        kind: 'deal',
        caption: '測試牌例',
        deal: { dealer: 'S', vul: 'EW', hands: { N: ['SA', 'SK', 'S2', 'DQ', 'DJ', 'DT'], E: [], S: ['SQ', 'S3', 'HA'], W: [] } },
      },
      { kind: 'play', caption: '測試出牌', contract: '3N', declarer: 'S', tricks: [['S2', 'SA', 'S5', 'SK'], ['HA', 'HT']] },
    ])
  })

  it('files an update under the article it replaces', () => {
    const { items } = fromArticleReply({ articles: [flat({ action: 'update', replaces: 'old-article', slug: 'other' })] }, SERIES, '2026-10-29')
    expect(items[0].replaces).toBe('old-article')
    expect(items[0].article.slug).toBe('old-article')
  })

  it('makes a usable slug and series, and stays off the library’s own pages', () => {
    const { items } = fromArticleReply(
      { articles: [flat({ slug: 'New', series: 'nope' }), flat({ slug: '中文' }), flat({ action: 'update', replaces: 'Bad Slug' })] },
      SERIES,
      '2026-10-29',
    )
    expect(items.map((i) => i.article.slug)).toEqual(['new-article', 'imported-article-2', 'test-article'])
    expect(items[0].article.series).toBe('squeeze')
    expect(items[2].replaces).toBe('')
  })

  it('names what is wrong instead of dropping it', () => {
    const bad = flat({
      title: '',
      blocks: [{ kind: 'deal', caption: '', dealer: 'Q', vul: 'x', north: { ...none, spades: 'AZ' }, east: none, south: none, west: none }],
    })
    const [item] = fromArticleReply({ articles: [bad] }, SERIES, '2026-10-29').items
    expect(item.article.blocks[0]).toMatchObject({ deal: { dealer: 'N', vul: 'None', hands: { N: ['SA', 'SZ'] } } })
    expect(item.problems.join()).toMatch(/標題/)
    expect(item.problems.join()).toMatch(/SZ/)
  })

  it('survives a reply that is not what was asked for', () => {
    expect(fromArticleReply(null, SERIES, '2026-10-29').items).toEqual([])
    expect(fromArticleReply({ articles: 'x' }, SERIES, '2026-10-29').items).toEqual([])
  })

  it('is kept in an import draft under `articles`', () => {
    const result = fromArticleReply({ articles: [flat()], reviewNotes: '說明' }, SERIES, '2026-10-29')
    const body = articleDraftBody(result)
    expect(body).toHaveProperty('articles')
    expect(importedArticles(JSON.parse(JSON.stringify(body)))).toEqual(result)
    expect(importedArticles({ conventions: [{}] }).items).toEqual([])
  })
})
