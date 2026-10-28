import { useCallback, useEffect, useMemo, useState } from 'react'
import { generateQuizzes, type Quiz } from '../lib/quiz.ts'
import {
  addLocalRound,
  applyFixes,
  clearLocalRounds,
  localRounds,
  quizApi,
  type QuizFix,
  type QuizRound,
  type QuizRoundInput,
} from '../lib/quizRecords.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { useProfiles } from '../state/ProfileContext.tsx'
import type { Convention } from '../types/convention.ts'

/**
 * What the practice pages share (E6): every convention's content as the reader's profile resolves
 * it (inside ProfiledContent), its questions with the editors' fixes, and the reader's results.
 * Only the lazily loaded practice pages import this.
 */

export function usePracticeQuizzes() {
  const content = useContent()
  const { activeId } = useProfiles()

  // Every convention's content, then its questions; again when the profile or the content changes
  const { loadAll } = content
  const contentKey = content.conventions.map((c) => `${c.slug}:${content.changed(c.slug) ?? ''}`).join('|')
  const total = content.conventions.length
  const [result, setResult] = useState<{ key: string; all: Convention[]; partial: boolean }>()
  useEffect(() => {
    let live = true
    loadAll().then(
      (all) => live && setResult({ key: contentKey, all, partial: all.length < total }),
      () => live && setResult({ key: contentKey, all: [], partial: true }),
    )
    return () => {
      live = false
    }
  }, [loadAll, contentKey, total])
  // What was loaded for other content (another profile) is not shown while the new one loads
  const loaded = result?.key === contentKey ? result.all : undefined
  const partial = Boolean(result?.partial)

  // The editors' fixes; without them (offline, an error) the questions are as made
  const [fixes, setFixes] = useState<QuizFix[]>()
  const [fixesFailed, setFixesFailed] = useState(false)
  const reloadFixes = useCallback(
    () =>
      quizApi.fixes().then(
        (list) => {
          setFixes(list)
          setFixesFailed(false)
        },
        () => {
          setFixes((list) => list ?? [])
          setFixesFailed(true)
        },
      ),
    [],
  )
  useEffect(() => {
    void reloadFixes()
  }, [reloadFixes])

  const made = useMemo(() => (loaded ? generateQuizzes(loaded, activeId).quizzes : []), [loaded, activeId])
  const { quizzes, stale } = useMemo(
    () => (loaded && fixes ? applyFixes(made, fixes, loaded, activeId) : { quizzes: [] as Quiz[], stale: [] as QuizFix[] }),
    [made, fixes, loaded, activeId],
  )
  const byId = useMemo(() => new Map((loaded ?? []).map((c) => [c.slug, c])), [loaded])

  return {
    /** Undefined while the content or the fixes load */
    loaded: loaded && fixes ? loaded : undefined,
    partial,
    made,
    quizzes,
    stale,
    fixes: fixes ?? [],
    fixesFailed,
    reloadFixes,
    byId,
    activeId,
  }
}

/** Where the reader's results are kept: the account when signed in, else this browser */
export function useQuizRounds() {
  const { user } = useAuth()
  const userId = user?.id
  const signedIn = Boolean(user)
  const [local, setLocal] = useState<QuizRound[]>(() => localRounds())
  const [account, setAccount] = useState<{ userId: string; rounds: QuizRound[]; failed: boolean }>()

  useEffect(() => {
    if (!userId) return
    let live = true
    quizApi.rounds().then(
      (rounds) => live && setAccount({ userId, rounds, failed: false }),
      () => live && setAccount({ userId, rounds: [], failed: true }),
    )
    return () => {
      live = false
    }
  }, [userId])

  // Another member's rounds are never shown while this one's load
  const mine = account?.userId === userId ? account : undefined
  const rounds = user === undefined ? undefined : user ? mine?.rounds : local

  /** Keeps a finished round; resolves false when the account could not take it */
  const add = useCallback(
    async (input: QuizRoundInput): Promise<boolean> => {
      if (!input.answers.length) return true
      if (!signedIn) {
        const round = addLocalRound(input)
        setLocal((list) => [round, ...list])
        return true
      }
      try {
        const round = await quizApi.addRound(input)
        setAccount((a) => a && { ...a, rounds: [round, ...a.rounds] })
        return true
      } catch {
        return false
      }
    },
    [signedIn],
  )

  const clear = useCallback(async () => {
    if (signedIn) {
      await quizApi.clearRounds()
      setAccount((a) => a && { ...a, rounds: [], failed: false })
    } else {
      clearLocalRounds()
      setLocal([])
    }
  }, [signedIn])

  return { rounds, failed: Boolean(mine?.failed), where: signedIn ? ('account' as const) : ('device' as const), add, clear }
}
