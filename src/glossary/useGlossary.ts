import { useCallback, useEffect, useMemo, useState } from 'react'
import { glossary as bundled } from '../content/glossary.ts'
import { api, type BookGlossary } from '../lib/api.ts'
import { resolveGlossary } from './match.ts'

// The online glossary, fetched once a visit (the reading pages remount as the reader moves between
// them); null when the Worker cannot be reached, so the bundled list applies
let online: Promise<BookGlossary | null> | null = null
let latest: BookGlossary | null | undefined

function fetchOnline(force = false) {
  if (!online || force)
    online = api.book.glossary().then(
      (g) => (latest = g),
      () => (latest = null),
    )
  return online
}

/** The glossary in force, sorted by term, and the online list it came from (undefined while loading) */
export function useGlossary() {
  const [server, setServer] = useState<BookGlossary | null | undefined>(latest)
  useEffect(() => {
    let live = true
    void fetchOnline().then((g) => live && setServer(g))
    return () => {
      live = false
    }
  }, [])
  const reload = useCallback(() => fetchOnline(true).then(setServer), [])
  const terms = useMemo(() => resolveGlossary(bundled, server), [server])
  return { terms, server, reload, loading: server === undefined }
}

/** Tells the next readers of this visit about a save (the editor's) */
export function rememberGlossary(saved: BookGlossary) {
  latest = saved
  online = Promise.resolve(saved)
}
