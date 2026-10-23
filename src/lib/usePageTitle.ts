import { useEffect } from 'react'
import { strings } from '../strings.ts'

/** Sets the browser tab's title for a page other than the handbook */
export function usePageTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return
    const before = document.title
    document.title = `${title}｜${strings.appNameZh}`
    return () => {
      document.title = before
    }
  }, [title])
}
