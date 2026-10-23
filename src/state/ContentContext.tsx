import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { categories, conventions as bundled } from '../content/index.ts'
import { api, type BookContent } from '../lib/api.ts'
import { mergeContent, type MergedContent, type OnlineInfo } from '../lib/content.ts'
import type { Convention } from '../types/convention.ts'

/**
 * The conventions the handbook shows: the bundled ones with the online changes laid over them
 * (lib/content.ts). The page renders at once from the bundle, or from the online changes this
 * browser saw last time, then fetches the current ones. Without a connection it keeps what it has.
 */

type Status = 'loading' | 'live' | 'offline'

interface Content {
  conventions: Convention[]
  /** The convention as it ships with the site, before online changes */
  bundledBySlug: (slug: string) => Convention | undefined
  bySlug: (slug: string) => Convention | undefined
  online: Map<string, OnlineInfo>
  skipped: MergedContent['skipped']
  status: Status
  /** Fetches the online changes again, e.g. after a save */
  reload: () => Promise<void>
}

const CACHE_KEY = 'tku-bridge-book-online'
const categoryIds = categories.map((c) => c.id as string)

function cached(): BookContent | null {
  try {
    const text = window.localStorage.getItem(CACHE_KEY)
    return text ? (JSON.parse(text) as BookContent) : null
  } catch {
    return null
  }
}

function remember(content: BookContent) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(content))
  } catch {
    // Full or blocked storage only costs the head start next time
  }
}

const ContentContext = createContext<Content | null>(null)

export function ContentProvider({
  children,
  load = api.book.content,
}: {
  children: ReactNode
  /** Where the online changes come from; tests pass their own */
  load?: () => Promise<BookContent>
}) {
  const [content, setContent] = useState<BookContent | null>(cached)
  const [status, setStatus] = useState<Status>('loading')

  const reload = useCallback(
    () =>
      load()
        .then((next) => {
          setContent(next)
          remember(next)
          setStatus('live')
        })
        .catch(() => setStatus('offline')),
    [load],
  )

  useEffect(() => {
    void reload()
  }, [reload])

  const value = useMemo(() => {
    const merged = mergeContent(bundled, content?.entries ?? [], categoryIds)
    const index = new Map(merged.conventions.map((c) => [c.slug, c]))
    return {
      conventions: merged.conventions,
      bundledBySlug: (slug: string) => bundled.find((c) => c.slug === slug),
      bySlug: (slug: string) => index.get(slug),
      online: merged.online,
      skipped: merged.skipped,
      status,
      reload,
    }
  }, [content, status, reload])

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useContent(): Content {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used inside ContentProvider')
  return ctx
}
