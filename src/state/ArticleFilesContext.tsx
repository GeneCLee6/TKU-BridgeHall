import { createContext, useContext } from 'react'
import type { ArticleFiles } from '../lib/api.ts'

/**
 * The signed addresses for an article's pictures, as the Worker sent them with the article
 * (`ArticleResponse.files`, e5-t12). The article page provides them; an `image` block looks its
 * `src` up here, and shows its description when it is missing (no R2 bucket yet, or none given).
 */
export const ArticleFilesContext = createContext<ArticleFiles>({})

export const useArticleFile = (key: string) => useContext(ArticleFilesContext)[key]
