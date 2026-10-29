import { useEffect, useMemo, useRef, useState } from 'react'
import type { SearchFn, SearchIndex, SearchRecord } from '../lib/search.ts'
import { useContent } from './ContentContext.tsx'

export const SEARCH_INDEX_URL = '/search-index.json'

/**
 * The search box's search. Nothing is downloaded until `prepare` (the box is focused): then the
 * search code (Fuse) and the index built with the site, plus the content of the conventions
 * changed online or by the reader's profile, whose records replace the index's (lib/search.ts
 * `mergeIndex`), and the library's articles, which live only online (e5-t13). Until the index arrives, and if it cannot be fetched at all, the search falls back to what is loaded here:
 * section titles at first, and every convention's content once `loadAll` brings it.
 */
export function useSearch(): { search: SearchFn; prepare: () => void } {
  const { conventions, changed: changedKeyOf, loaded, load, loadAll } = useContent()
  const [lib, setLib] = useState<typeof import('../lib/search.ts')>()
  // undefined while not fetched yet, null when fetching failed
  const [index, setIndex] = useState<SearchIndex | null>()
  const [articles, setArticles] = useState<SearchRecord[]>()
  const fetching = useRef(false)

  const prepare = () => {
    const searchLib = import('../lib/search.ts')
    void searchLib.then(setLib)
    if (!articles) void import('../lib/libraryApi.ts').then((m) => m.loadArticleRecords()).then(setArticles)
    if (fetching.current || index) return
    fetching.current = true
    Promise.all([fetch(SEARCH_INDEX_URL).then((r) => (r.ok ? r.json() : null)), searchLib])
      .then(([value, { isSearchIndex }]) => {
        if (!isSearchIndex(value)) throw new Error('bad search index')
        setIndex(value)
      })
      .catch(() => {
        setIndex(null)
        void loadAll().catch(() => {})
      })
      // A failed fetch is tried again the next time the box is focused
      .finally(() => (fetching.current = false))
  }

  // With the index, only conventions changed online or by the profile need their content
  const changed = conventions.filter((c) => changedKeyOf(c.slug))
  const changedKey = changed.map((c) => changedKeyOf(c.slug)).join(' ')
  useEffect(() => {
    if (!index) return
    for (const c of changed) void load(c.slug).catch(() => {})
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reloaded when what changed online changes
  }, [index, changedKey, load])

  const searchable = conventions.map((c) => loaded(c.slug) ?? c)
  const searchKey = searchable.map((c) => ('sections' in c ? 1 : 0)).join('')
  // Fuse indexes the records on the first query after a change, not on every convention that loads
  const search = useMemo((): SearchFn => {
    if (!lib) return () => []
    let built: SearchFn | undefined
    const records = () => [
      ...(index ? lib.mergeIndex(index, searchable, (slug) => !changedKeyOf(slug)) : lib.buildRecords(searchable)),
      ...(articles ?? []),
    ]
    return (query, limit) => (built ??= lib.searchRecords(records()))(query, limit)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- rebuilt when the catalogue or what is loaded changes
  }, [lib, index, articles, conventions, changedKey, searchKey])

  return { search, prepare }
}
