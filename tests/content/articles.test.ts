import { FILE_KEY } from '../../src/lib/account.ts'
import type { ArticleEntry } from '../../src/lib/api.ts'
import { articleProblems, articleText, isPictureKey, onlineArticle, pictureKeys, tidyArticle } from '../../src/lib/articles.ts'
import { filesOff, uploadPrepared } from '../../src/lib/imageUpload.ts'
import type { Deal } from '../../src/lib/board.ts'
import type { Article } from '../../src/types/article.ts'

/**
 * The article model (e5-t01) and its pictures (e5-t12). Test data only: the library's real articles
 * are written on the site, never in the repo.
 */
const PICTURE = 'article/0123456789abcdef01234567.webp'
const COVER = 'article/fedcba9876543210fedcba98.jpg'

/** Two hands shown, the defenders left out as articles often do */
const DEAL: Deal = { hands: { N: ['SA', 'SK', 'H2'], E: [], S: ['SQ', 'HA'], W: [] }, dealer: 'N', vul: 'NS' }
const play = (extra: Record<string, unknown>) => ({ kind: 'play', contract: '3N', declarer: 'S', tricks: [['SA']], ...extra })
const blocks = (...b: unknown[]) => ({ ...article(), blocks: b })

const article = (extra: Partial<Article> = {}): Article => ({
  slug: 'test-article',
  title: '測試標題',
  authors: ['測試作者'],
  series: 'test-series',
  level: 'basic',
  summary: '測試摘要',
  cover: COVER,
  published: '2026-10-28',
  updated: '2026-10-28',
  license: 'own',
  blocks: [
    { kind: 'heading', level: 2, text: '測試小標' },
    { kind: 'paragraph', text: '測試段落♠' },
    { kind: 'quote', text: '測試引文', cite: '測試出處' },
    { kind: 'image', src: PICTURE, alt: '測試替代文字', caption: '測試圖說' },
    { kind: 'heading', level: 3, text: '測試次小標' },
    { kind: 'rules', items: [{ text: '測試條列' }] },
    { kind: 'note', tone: 'info', text: '測試注意' },
    { kind: 'hand', hand: { spades: 'AK2', hearts: 'QJ3', diamonds: 'T98', clubs: '7654' } },
    { kind: 'deal', deal: DEAL, caption: '測試牌例說明' },
    { kind: 'play', contract: '4SX', declarer: 'S', tricks: [['HK', 'H2', 'HA', 'H3'], ['SA']], caption: '測試出牌說明' },
  ],
  ...extra,
})

const entry = (value: unknown, slug = 'test-article'): ArticleEntry => ({
  slug,
  version: 1,
  article: value,
  createdAt: 1,
  updatedAt: 1,
  updatedBy: 'rita',
  status: 'published',
  reviewedBy: 'rita',
  reviewedAt: 1,
})

describe('article model (e5-t01)', () => {
  it('takes an article with every block kind', () => {
    expect(articleProblems(article())).toEqual([])
    expect(articleProblems(article({ cover: undefined, level: undefined, license: 'members-only' }))).toEqual([])
  })

  it.each<[string, unknown]>([
    ['not an object', 'x'],
    ['a bad slug', { ...article(), slug: 'Test Article' }],
    ['an empty title', article({ title: ' ' })],
    ['a title too long', article({ title: '字'.repeat(121) })],
    ['authors that are not a list', { ...article(), authors: '測試作者' }],
    ['an unknown license', { ...article(), license: 'public' }],
    ['an unknown level', { ...article(), level: 'expert' }],
    ['a cover that is an address', article({ cover: 'https://example.com/a.jpg' })],
    ['a heading of level 1', { ...article(), blocks: [{ kind: 'heading', level: 1, text: 'x' }] }],
    ['a quote without text', { ...article(), blocks: [{ kind: 'quote' }] }],
    ['a picture without a description', { ...article(), blocks: [{ kind: 'image', src: PICTURE }] }],
    ['a picture from elsewhere', { ...article(), blocks: [{ kind: 'image', src: 'https://example.com/a.jpg', alt: 'x' }] }],
    ['an unknown block', { ...article(), blocks: [{ kind: 'video' }] }],
    ['a broken handbook block', { ...article(), blocks: [{ kind: 'paragraph' }] }],
    ['no blocks', { ...article(), blocks: undefined }],
    ['a deal without hands', blocks({ kind: 'deal', deal: { dealer: 'N', vul: 'None' } })],
    ['a deal with no cards', blocks({ kind: 'deal', deal: { ...DEAL, hands: { N: [], E: [], S: [], W: [] } } })],
    ['a deal with a card twice', blocks({ kind: 'deal', deal: { ...DEAL, hands: { ...DEAL.hands, E: ['SA'] } } })],
    ['a deal with a card it does not know', blocks({ kind: 'deal', deal: { ...DEAL, hands: { ...DEAL.hands, E: ['S1'] } } })],
    ['a deal with an unknown dealer', blocks({ kind: 'deal', deal: { ...DEAL, dealer: 'X' } })],
    ['a deal with an unknown vulnerability', blocks({ kind: 'deal', deal: { ...DEAL, vul: 'All' } })],
    ['a play with a bad contract', blocks(play({ contract: '4NT' }))],
    ['a play with a short trick before the last', blocks(play({ tricks: [['SA'], ['SK']] }))],
    ['a play with a caption that is not text', blocks(play({ caption: 1 }))],
  ])('refuses %s', (_, value) => {
    expect(articleProblems(value).length).toBeGreaterThan(0)
  })

  it('says which block is broken', () => {
    expect(articleProblems({ ...article(), blocks: [{ kind: 'heading', level: 2, text: 'x' }, { kind: 'quote' }] })).toEqual([
      '第 2 個區塊：引文格式不正確',
    ])
    expect(articleProblems(blocks(play({ declarer: 'X' })))).toEqual(['第 1 個區塊：出牌過程：要有莊家'])
    expect(articleProblems(blocks({ kind: 'deal', deal: { ...DEAL, hands: { ...DEAL.hands, W: ['HA'] } } }))).toEqual([
      '第 1 個區塊：牌例的 HA 出現了兩次',
    ])
  })

  it('checks an online entry and its slug', () => {
    expect(onlineArticle(entry(article()))).toEqual({ article: article() })
    expect(onlineArticle(entry(null))).toEqual({ article: null })
    expect(onlineArticle(entry(article(), 'other'))).toEqual({ problem: '網址代稱不符' })
    expect(onlineArticle(entry({ slug: 'test-article' }))).toHaveProperty('problem')
  })

  it('tidies empty fields and blocks away', () => {
    const tidy = tidyArticle(
      article({
        authors: ['測試作者', ' '],
        cover: '',
        blocks: [
          { kind: 'heading', level: 2, text: '' },
          { kind: 'quote', text: '測試引文', cite: ' ' },
          { kind: 'image', src: PICTURE, alt: '測試替代文字', caption: '' },
          { kind: 'image', src: '', alt: '' },
          { kind: 'paragraph', text: '測試段落', pending: '' },
          { kind: 'deal', deal: { ...DEAL, hands: { N: [], E: [], S: [], W: [] } } },
          { kind: 'deal', deal: DEAL, caption: ' ' },
          { kind: 'play', contract: '3N', declarer: 'S', tricks: [] },
          { kind: 'play', contract: '3N', declarer: 'S', tricks: [['SA']], caption: '' },
        ],
      }),
    )
    expect(tidy.authors).toEqual(['測試作者'])
    expect(tidy).not.toHaveProperty('cover')
    expect(tidy.blocks).toEqual([
      { kind: 'quote', text: '測試引文' },
      { kind: 'image', src: PICTURE, alt: '測試替代文字' },
      { kind: 'paragraph', text: '測試段落' },
      { kind: 'deal', deal: DEAL },
      { kind: 'play', contract: '3N', declarer: 'S', tricks: [['SA']] },
    ])
    expect(articleProblems(tidy)).toEqual([])
  })

  it('gives search the title, authors, summary and every block’s words', () => {
    const words = articleText(article())
    for (const part of ['測試標題', '測試作者', '測試摘要', '測試小標', '測試段落', '測試引文', '測試出處', '測試替代文字', '測試圖說', '測試條列', '測試牌例說明', '測試出牌說明'])
      expect(words).toContain(part)
    for (const notWords of ['SA', 'HK', '4SX']) expect(words).not.toContain(notWords)
  })
})

describe('article pictures (e5-t12)', () => {
  it('keeps uploaded file keys, not addresses or thumbnails', () => {
    expect(FILE_KEY.test(PICTURE)).toBe(true)
    expect(isPictureKey(PICTURE)).toBe(true)
    expect(isPictureKey('article/0123456789abcdef01234567-thumb.webp')).toBe(false)
    expect(isPictureKey('/api/files/article/0123456789abcdef01234567.webp?e=1&s=x')).toBe(false)
    expect(pictureKeys(article())).toEqual([COVER, PICTURE])
    expect(pictureKeys(article({ cover: undefined, blocks: [] }))).toEqual([])
  })

  it('tells when uploads are not set up yet (503 filesOff)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ error: '圖片上傳還沒開放', code: 'filesOff', params: {} }, { status: 503 })),
    )
    try {
      const error = await uploadPrepared(new Blob(['abc'], { type: 'image/webp' }), null, 'article').catch((e: unknown) => e)
      expect(filesOff(error)).toBe(true)
      expect(filesOff(new Error('x'))).toBe(false)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
