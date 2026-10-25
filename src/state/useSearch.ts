import { useEffect, useMemo, useRef, useState } from 'react'
import type { SearchFn, SearchIndex } from '../lib/search.ts'
import { useContent } from './ContentContext.tsx'

export const SEARCH_INDEX_URL = '/search-index.json'

/**
 * The search box's search. Nothing is downloaded until `prepare` (the box is focused): then the
 * search code (Fuse) and the index built with the site, plus the content of the conventions
 * changed online, whose records replace the index's (lib/search.ts `mergeIndex`). Until the index
 * arrives, and if it cannot be fetched at all, the search falls back to what is loaded here:
 * section titles at first, and every convention's content once `loadAll` brings it.
 */
export function useSearch(): { search: SearchFn; prepare: () => void } {
  const { conventions, online, loaded, load, loadAll } = useContent()
  const [lib, setLib] = useState<typeof import('../lib/search.ts')>()
  // undefined while not fetched yet, null when fetching failed
  const [index, setIndex] = useState<SearchIndex | null>()
  const fetching = useRef(false)

  const prepare = () => {
    const searchLib = import('../lib/search.ts')
    void searchLib.then(setLib)
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

  // With the index, only conventions changed online need their content
  const changed = conventions.filter((c) => online.has(c.slug))
  const changedKey = changed.map((c) => `${c.slug}@${online.get(c.slug)?.version}`).join(' ')
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
    const records = () =>
      index ? lib.mergeIndex(index, searchable, (slug) => !online.has(slug)) : lib.buildRecords(searchable)
    return (query, limit) => (built ??= lib.searchRecords(records()))(query, limit)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- rebuilt when the catalogue or what is loaded changes
  }, [lib, index, conventions, online, searchKey])

  return { search, prepare }
}
