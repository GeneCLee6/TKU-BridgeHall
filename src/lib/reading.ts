import { useCallback, useEffect, useRef, useState } from 'react'
import { request, send } from './api.ts'
import { articlePath } from './series.ts'

/**
 * 閱讀進度 (E5 e5-t14, AC-5.8): where a member stopped in an article (the block they had reached)
 * or an e-book (the page), kept with their account by the Worker so 「繼續閱讀」 on 我的帳號 takes
 * them back. The types mirror TKU-BridgeTable's `shared/reading.ts` (CLAUDE.md rule 10; checked in
 * parity/table-types.ts). Only lazily loaded pages import this module.
 */

// ── Mirrored from TKU-BridgeTable shared/reading.ts ───────────────────────────────────────────

export const READING_KINDS = ['article', 'ebook'] as const
export type ReadingKind = (typeof READING_KINDS)[number]

export const READING_LIMITS = {
  kept: 30,
  idMax: 60,
  titleMax: 200,
  placeMax: 100_000,
} as const

export interface ReadingInput {
  kind: ReadingKind
  /** The article's slug, or the e-book's id */
  id: string
  title: string
  /** The block reached (from 0) in an article; the page (from 1) in a book */
  place: number
  /** The article's blocks, or the book's pages */
  of: number
}

export type ReadingPlace = ReadingInput & { at: number }

// ── API ───────────────────────────────────────────────────────────────────────────────────────

export const readingApi = {
  places: () => request<{ places: ReadingPlace[] }>('/api/book/reading').then((r) => r.places),
  mark: (reading: ReadingInput) => send<{ place: ReadingPlace }>('PUT', '/api/book/reading', { reading }).then((r) => r.place),
  forget: (kind: ReadingKind, id: string) => send<{ ok: true }>('DELETE', '/api/book/reading', { kind, id }),
}

// ── Addresses ─────────────────────────────────────────────────────────────────────────────────

/** `?at=` on an article opens it at that block; `?page=` on a book at that page */
export const AT_PARAM = 'at'
export const PAGE_PARAM = 'page'

/** Where 「繼續閱讀」 goes: the block or page the member had reached */
export const readingPath = (place: Pick<ReadingPlace, 'kind' | 'id' | 'place'>) =>
  place.kind === 'article'
    ? `${articlePath(place.id)}${place.place > 0 ? `?${AT_PARAM}=${place.place}` : ''}`
    : `/library/book/${place.id}${place.place > 1 ? `?${PAGE_PARAM}=${place.place}` : ''}`

/** A place from the address, if it is a whole number from `min` to `max` */
export function placeParam(value: string | null, min: number, max: number): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined
  const n = Number(value)
  return n >= min && n <= max ? n : undefined
}

/** How far along, 0–100: an article's last block or a book's last page is 100 */
export function readingShare(place: Pick<ReadingPlace, 'kind' | 'place' | 'of'>) {
  const done = place.kind === 'article' ? place.place + 1 : place.place
  return Math.min(100, Math.round((done / Math.max(1, place.of)) * 100))
}

// ── Hooks ─────────────────────────────────────────────────────────────────────────────────────

/** Saving waits this long after the reader moves, so scrolling or paging saves once */
export const READING_SAVE_DELAY = 2000

/**
 * Keeps the place in one article or book: `mark(place)` saves it after READING_SAVE_DELAY, and
 * at once when the page is hidden or left. Nothing is sent while `what` is undefined (signed out,
 * or still loading: a place marked then is sent once it is known), nor for the place already
 * saved. Failures are quiet: progress is a nicety. The page keys its reader by article or book.
 */
export function useReadingMark(what: Omit<ReadingInput, 'place'> | undefined) {
  const pending = useRef<number | undefined>(undefined)
  const saved = useRef<number | undefined>(undefined)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const whatRef = useRef(what)
  const key = what ? `${what.kind}:${what.id}:${what.of}:${what.title}` : ''

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = undefined
    const current = whatRef.current
    const place = pending.current
    if (!current || place === undefined || place === saved.current) return
    saved.current = place
    readingApi.mark({ ...current, place }).catch(() => {
      if (saved.current === place) saved.current = undefined
    })
  }, [])

  useEffect(() => {
    whatRef.current = what
  })

  // A new article or book starts afresh; leaving one saves where the reader was
  useEffect(() => {
    saved.current = undefined
    const hide = () => document.visibilityState === 'hidden' && flush()
    document.addEventListener('visibilitychange', hide)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', hide)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [key, flush])

  return useCallback(
    (place: number) => {
      pending.current = place
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, READING_SAVE_DELAY)
    },
    [flush],
  )
}

/** The member's places, newest first; undefined while loading, [] when they could not be read */
export function useReadingPlaces(enabled: boolean) {
  const [places, setPlaces] = useState<ReadingPlace[]>()
  useEffect(() => {
    if (!enabled) return
    let live = true
    readingApi.places().then(
      (list) => live && setPlaces(list),
      () => live && setPlaces([]),
    )
    return () => {
      live = false
    }
  }, [enabled])

  const forget = useCallback(async (kind: ReadingKind, id: string) => {
    await readingApi.forget(kind, id)
    setPlaces((before) => before?.filter((p) => p.kind !== kind || p.id !== id))
  }, [])

  return { places: enabled ? places : undefined, forget }
}
