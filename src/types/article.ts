/**
 * The library's articles (E5 e5-t01, docs/PRD/e5-library-articles-ebooks.md). An article is written
 * on the site, not bundled: the Worker keeps it (TKU-BridgeTable worker/articles.ts, `api.ts`
 * ArticleEntry) and the handbook checks its shape before showing it (lib/articles.ts).
 *
 * Its blocks are the handbook's (`Block`) plus three that only articles use: a heading, a quote and
 * a picture. `deal` and `play` come with e5-t02 and e5-t03.
 */

import type { Block, Level } from './convention.ts'

/** 小標題: the article's own outline, since an article has no sections */
export interface HeadingBlock {
  kind: 'heading'
  level: 2 | 3
  text: string
}

/** 引文 */
export interface QuoteBlock {
  kind: 'quote'
  text: string
  /** Who or what it is quoted from */
  cite?: string
}

/**
 * 圖片: `src` is the file key the upload gave back (lib/imageUpload.ts, `article/<id>.webp`), never
 * an address; the Worker signs short-lived addresses with every read (ArticleFiles)
 */
export interface ImageBlock {
  kind: 'image'
  src: string
  /** Read out instead of the picture, and shown when it cannot be loaded */
  alt: string
  caption?: string
}

export type ArticleBlock = Block | HeadingBlock | QuoteBlock | ImageBlock

/**
 * 授權: written by the club (`own`), used with permission (`permitted`), or only for signed-in
 * members (`members-only`). Every article has one.
 */
export type License = 'own' | 'permitted' | 'members-only'

export const licenses: readonly License[] = ['own', 'permitted', 'members-only']

export interface Article {
  /** URL-safe and unique among articles: /library/:slug */
  slug: string
  title: string
  authors: string[]
  /** The series' id (e5-t06) */
  series: string
  level?: Level
  /** One or two lines for the shelf */
  summary: string
  /** A file key, like an image block's `src` */
  cover?: string
  blocks: ArticleBlock[]
  /** ISO dates */
  published: string
  updated: string
  license: License
}

/** An article without its blocks: what a shelf shows */
export type ArticleMeta = Omit<Article, 'blocks'>
