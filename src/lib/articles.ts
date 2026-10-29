import { FILE_KEY } from './account.ts'
import { isCard, isSeat, SEATS, VULNERABILITIES, type Card } from './board.ts'
import { playProblems } from './play.ts'
import type { ArticleEntry } from './api.ts'
import { blockProblems, emptyBlock, isObject, isString, isStrings, optionalLevel, optionalString, SLUG_PATTERN, text, tidyBlock } from './content.ts'
import { blockText } from './sections.ts'
import { licenses, type Article, type ArticleBlock, type License } from '../types/article.ts'
import type { Block } from '../types/convention.ts'

/**
 * Articles (E5 e5-t01): the checks, the tidying and the search text, the same as lib/content.ts does
 * for conventions. The Worker checks the same shape (TKU-BridgeTable worker/articles.ts
 * checkArticle); this runs again when an article is loaded, so a bad save never breaks the page.
 */

/** The longest title, as the Worker allows (ARTICLE_LIMITS.titleMax) */
export const ARTICLE_TITLE_MAX = 120

/** A picture's file key from the uploads (not a thumbnail's): what `src` and `cover` hold */
export const isPictureKey = (value: unknown): value is string =>
  isString(value) && FILE_KEY.test(value) && !value.includes('-thumb.')

const isArticleOnly = (b: { kind?: unknown }): b is Exclude<ArticleBlock, Block> =>
  b.kind === 'heading' || b.kind === 'quote' || b.kind === 'image' || b.kind === 'deal' || b.kind === 'play'

/**
 * A deal block's problems: the forum's rule (TKU-BridgeTable worker/forum.ts), so a seat may be
 * empty, but each card is held once, at most thirteen to a seat, and there is at least one
 */
function dealBlockProblems(deal: unknown): string[] {
  if (!isObject(deal) || !isObject(deal.hands)) return ['牌例要有四家的牌']
  const problems: string[] = []
  if (!isSeat(deal.dealer)) problems.push('牌例要有發牌者')
  if (!VULNERABILITIES.includes(deal.vul as never)) problems.push('牌例的身價不存在')
  const seen = new Set<Card>()
  for (const seat of SEATS) {
    const cards = deal.hands[seat] ?? []
    if (!Array.isArray(cards) || cards.length > 13) {
      problems.push('牌例每家最多 13 張牌')
      continue
    }
    for (const card of cards as unknown[]) {
      if (!isCard(card)) problems.push(`牌例有不認得的牌：${String(card)}`)
      else if (seen.has(card)) problems.push(`牌例的 ${card} 出現了兩次`)
      else seen.add(card)
    }
  }
  if (!seen.size) problems.push('牌例要至少有一張牌')
  return problems
}

const captionProblems = (caption: unknown) => (optionalString(caption) ? [] : ['說明要是文字'])

/** Why a value is not an article block, worded for editors; empty when it is one */
export function articleBlockProblems(b: unknown, where: string): string[] {
  if (!isObject(b) || !isArticleOnly(b)) return blockProblems(b, where)
  switch (b.kind) {
    case 'heading':
      return (b.level === 2 || b.level === 3) && isString(b.text) ? [] : [`${where}：小標題要有層級（2 或 3）與文字`]
    case 'quote':
      return isString(b.text) && optionalString(b.cite) ? [] : [`${where}：引文格式不正確`]
    case 'image':
      return isPictureKey(b.src) && isString(b.alt) && optionalString(b.caption) ? [] : [`${where}：圖片要是上傳的檔案，並有替代文字`]
    case 'deal':
      return [...dealBlockProblems(b.deal), ...captionProblems(b.caption)].map((p) => `${where}：${p}`)
    case 'play':
      return [...playProblems(b.contract, b.declarer, b.tricks), ...captionProblems(b.caption)].map((p) => `${where}：出牌過程：${p}`)
  }
}

/** Why a value cannot be shown as an article, worded for editors; empty when it can */
export function articleProblems(value: unknown): string[] {
  if (!isObject(value)) return ['不是一篇文章']
  const problems: string[] = []
  if (!isString(value.slug) || !SLUG_PATTERN.test(value.slug)) problems.push('網址代稱只能用小寫英文、數字與連字號')
  if (!isString(value.title) || !value.title.trim() || value.title.length > ARTICLE_TITLE_MAX)
    problems.push(`標題要有 1 到 ${ARTICLE_TITLE_MAX} 個字`)
  if (!isStrings(value.authors)) problems.push('作者要是文字清單')
  if (!isString(value.series)) problems.push('缺少系列')
  if (!optionalLevel(value.level)) problems.push('程度不存在')
  if (!isString(value.summary)) problems.push('缺少摘要')
  if (!isString(value.published) || !isString(value.updated)) problems.push('缺少發布與更新日期')
  if (!licenses.includes(value.license as License)) problems.push('授權不存在')
  if (value.cover !== undefined && !isPictureKey(value.cover)) problems.push('封面要是上傳的圖片')
  if (!Array.isArray(value.blocks)) return [...problems, '缺少內容']
  value.blocks.forEach((b, i) => problems.push(...articleBlockProblems(b, `第 ${i + 1} 個區塊`)))
  return problems
}

/** An online entry's article, checked: the article, or why it cannot be shown (null when hidden) */
export function onlineArticle(entry: ArticleEntry): { article: Article | null } | { problem: string } {
  if (entry.article === null) return { article: null }
  const problems = articleProblems(entry.article)
  if (problems.length) return { problem: problems[0] }
  const article = entry.article as Article
  return article.slug === entry.slug ? { article } : { problem: '網址代稱不符' }
}

function emptyArticleBlock(b: ArticleBlock) {
  if (!isArticleOnly(b)) return emptyBlock(b)
  switch (b.kind) {
    case 'image':
      return !b.src.trim()
    case 'deal':
      return SEATS.every((seat) => !b.deal.hands[seat]?.length)
    case 'play':
      return !b.tricks.length
    default:
      return !b.text.trim()
  }
}

function tidyArticleBlock(b: ArticleBlock): ArticleBlock {
  if (!isArticleOnly(b)) return tidyBlock(b)
  switch (b.kind) {
    case 'heading':
      return { kind: 'heading', level: b.level, text: b.text }
    case 'quote':
      return { kind: 'quote', text: b.text, ...(text(b.cite) && { cite: b.cite }) }
    case 'image':
      return { kind: 'image', src: b.src, alt: b.alt, ...(text(b.caption) && { caption: b.caption }) }
    case 'deal':
      return { kind: 'deal', deal: structuredClone(b.deal), ...(text(b.caption) && { caption: b.caption }) }
    case 'play': {
      const tricks = b.tricks.map((trick) => [...trick])
      return { kind: 'play', contract: b.contract, declarer: b.declarer, tricks, ...(text(b.caption) && { caption: b.caption }) }
    }
  }
}

/** A deep copy without empty optional fields and empty blocks, as conventions are saved */
export function tidyArticle(article: Article): Article {
  const authors = article.authors.filter((a) => a.trim())
  return {
    slug: article.slug,
    title: article.title,
    authors,
    series: article.series,
    ...(article.level && { level: article.level }),
    summary: article.summary,
    ...(text(article.cover) && { cover: article.cover }),
    blocks: article.blocks.filter((b) => !emptyArticleBlock(b)).map(tidyArticleBlock),
    published: article.published,
    updated: article.updated,
    license: article.license,
  }
}

/** A block's words for search (E10's index adds articles in e5-t13) */
export function articleBlockText(block: ArticleBlock): string {
  if (!isArticleOnly(block)) return blockText(block)
  switch (block.kind) {
    case 'heading':
      return block.text
    case 'quote':
      return [block.text, block.cite].filter(Boolean).join(' ')
    case 'image':
      return [block.alt, block.caption].filter(Boolean).join(' ')
    case 'deal':
    case 'play':
      return block.caption ?? ''
  }
}

/** Every word of an article that search looks at: title, authors, summary and blocks */
export function articleText(article: Article): string {
  return [article.title, ...article.authors, article.summary, ...article.blocks.map(articleBlockText)].filter(Boolean).join(' ')
}

/** Every picture an article names, cover first: what the Worker signs addresses for */
export function pictureKeys(article: Pick<Article, 'cover' | 'blocks'>): string[] {
  const blocks = article.blocks.flatMap((b) => (b.kind === 'image' && isPictureKey(b.src) ? [b.src] : []))
  return [...(isPictureKey(article.cover) ? [article.cover] : []), ...blocks]
}
