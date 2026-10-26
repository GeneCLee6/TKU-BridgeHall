import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { categories as bundledCategories } from '../content/categories.ts'
import { loadBundled } from '../content/loaders.ts'
import { manifest as bundledManifest } from '../content/manifest.ts'
import { api, type BookEntry, type BookManifest } from '../lib/api.ts'
import { knownCategoryIds, resolveCategories } from '../lib/categories.ts'
import { mergeManifest, onlineConvention, type OnlineInfo, type Skipped } from '../lib/content.ts'
import type { Category, Convention, ConventionMeta } from '../types/convention.ts'

/**
 * The conventions the handbook shows: the bundled manifest with the online changes laid over it
 * (lib/content.ts). The catalogue renders at once from the manifest, or from the online manifest
 * this browser saw last time, then fetches the current one. Content is loaded one convention at a
 * time (`load`, `useConvention`): the bundled chunk, or the online entry when it was changed online.
 * Without a connection it keeps what it has.
 */

type Status = 'loading' | 'live' | 'offline'

export interface Content {
  /** The catalogue: every convention shown, without content */
  conventions: ConventionMeta[]
  bySlug: (slug: string) => ConventionMeta | undefined
  /** The convention as it ships with the site, before online changes */
  bundledBySlug: (slug: string) => ConventionMeta | undefined
  /** The catalogue's groups in order: the online list, or the bundled one (lib/categories.ts) */
  categories: Category[]
  /** A convention's content if it is loaded already */
  loaded: (slug: string) => Convention | undefined
  /**
   * Loads a convention's content: the online version, or the bundled one when it was not changed
   * online or is hidden. Undefined when there is no such convention or its online content is broken.
   */
  load: (slug: string) => Promise<Convention | undefined>
  /** Loads every convention in the catalogue, e.g. for printing the whole handbook */
  loadAll: () => Promise<Convention[]>
  loadBundled: (slug: string) => Promise<Convention | undefined>
  online: Map<string, OnlineInfo>
  /**
   * A key that changes with a convention's content when that content differs from what the site
   * was built with (changed online, or by the reader's profile); undefined when it does not, so the
   * search can use the built index for it
   */
  changed: (slug: string) => string | undefined
  skipped: Skipped[]
  status: Status
  /** Fetches the online changes again, e.g. after a save */
  reload: () => Promise<void>
}

const CACHE_KEY = 'tku-bridge-book-manifest'
const bundledIndex = new Map(bundledManifest.map((c) => [c.slug, c]))

function cached(): BookManifest | null {
  try {
    const text = window.localStorage.getItem(CACHE_KEY)
    return text ? (JSON.parse(text) as BookManifest) : null
  } catch {
    return null
  }
}

function remember(manifest: BookManifest) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(manifest))
  } catch {
    // Full or blocked storage only costs the head start next time
  }
}

// Exported for ProfileContext, which gives the handbook page the profile's view of the same content
// oxlint-disable-next-line react/only-export-components
export const ContentContext = createContext<Content | null>(null)

export function ContentProvider({
  children,
  loadManifest = api.book.manifest,
  loadEntry = api.book.entry,
}: {
  children: ReactNode
  /** Where the online changes come from; tests pass their own */
  loadManifest?: () => Promise<BookManifest>
  loadEntry?: (slug: string) => Promise<BookEntry>
}) {
  const [manifest, setManifest] = useState<BookManifest | null>(cached)
  const [status, setStatus] = useState<Status>('loading')
  // Loaded content by `slug@version` ('bundled' for the shipped one), so a newer online version
  // is never confused with an older one and nothing has to be cleared
  const [contents, setContents] = useState<ReadonlyMap<string, Convention | undefined>>(new Map())
  const [broken, setBroken] = useState<Skipped[]>([])
  const inFlight = useRef(new Map<string, Promise<Convention | undefined>>())
  // Content that arrived since the last render, stored together: expanding everything then
  // re-renders the page a few times instead of once per convention
  const arrived = useRef<[string, Convention | undefined][] | null>(null)
  const store = useCallback((key: string, convention: Convention | undefined) => {
    if (arrived.current) return void arrived.current.push([key, convention])
    arrived.current = [[key, convention]]
    window.setTimeout(() => {
      const batch = arrived.current ?? []
      arrived.current = null
      setContents((m) => new Map([...m, ...batch]))
    })
  }, [])

  const reload = useCallback(
    () =>
      loadManifest()
        .then((next) => {
          setManifest(next)
          remember(next)
          setStatus('live')
        })
        .catch(() => setStatus('offline')),
    [loadManifest],
  )

  useEffect(() => {
    void reload()
  }, [reload])

  const value = useMemo((): Content => {
    const categoryIds = knownCategoryIds(bundledCategories, manifest?.categories)
    const merged = mergeManifest(bundledManifest, manifest?.entries ?? [], categoryIds)
    const categories = resolveCategories(bundledCategories, manifest?.categories, merged.conventions)
    const index = new Map(merged.conventions.map((c) => [c.slug, c]))
    // Which version of a convention `load` gives: the online one unless it is hidden
    const source = (slug: string) => {
      const info = merged.online.get(slug)
      if (info && !info.hidden) return { key: `${slug}@${info.version}`, online: true }
      return bundledIndex.has(slug) ? { key: `${slug}@bundled`, online: false } : undefined
    }

    const load = (slug: string): Promise<Convention | undefined> => {
      const from = source(slug)
      if (!from) return Promise.resolve(undefined)
      if (contents.has(from.key)) return Promise.resolve(contents.get(from.key))
      let promise = inFlight.current.get(from.key)
      if (!promise) {
        promise = from.online
          ? loadEntry(slug).then((entry) => {
              const checked = onlineConvention(entry, categoryIds)
              if ('convention' in checked) return checked.convention
              setBroken((b) => [...b.filter((s) => s.slug !== slug), { slug, problem: checked.problem }])
              return undefined
            })
          : loadBundled(slug)
        promise.then(
          (convention) => store(from.key, convention),
          () => inFlight.current.delete(from.key),
        )
        inFlight.current.set(from.key, promise)
      }
      return promise
    }

    return {
      conventions: merged.conventions,
      bySlug: (slug) => index.get(slug),
      bundledBySlug: (slug) => bundledIndex.get(slug),
      categories,
      loaded: (slug) => {
        const from = source(slug)
        return from && contents.get(from.key)
      },
      load,
      loadAll: () =>
        Promise.all(merged.conventions.map((c) => load(c.slug))).then((all) =>
          all.filter((c): c is Convention => c !== undefined),
        ),
      loadBundled,
      online: merged.online,
      changed: (slug) => {
        const info = merged.online.get(slug)
        return info && `${slug}@${info.version}`
      },
      skipped: [...merged.skipped, ...broken],
      status,
      reload,
    }
  }, [manifest, contents, broken, status, reload, loadEntry, store])

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useContent(): Content {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used inside ContentProvider')
  return ctx
}

/**
 * A convention's content, loading it when `enabled` (e.g. once its card is opened). `failed` is
 * true when loading did not work (offline), and `retry` tries again; `missing` when there is no
 * such convention or its online content is broken.
 */
// oxlint-disable-next-line react/only-export-components
export function useConvention(slug: string | undefined, enabled = true) {
  const { loaded, load } = useContent()
  const convention = slug ? loaded(slug) : undefined
  const [failed, setFailed] = useState<string>()
  const [missing, setMissing] = useState<string>()
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!slug || !enabled || convention) return
    let current = true
    load(slug).then(
      (found) => current && !found && setMissing(slug),
      () => current && setFailed(slug),
    )
    return () => {
      current = false
    }
  }, [slug, enabled, convention, load, attempt])

  return {
    convention,
    failed: failed !== undefined && failed === slug && !convention,
    missing: missing !== undefined && missing === slug && !convention,
    retry: () => {
      setFailed(undefined)
      setAttempt((a) => a + 1)
    },
  }
}
