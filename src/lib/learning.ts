import { useCallback, useEffect, useMemo, useState } from 'react'
import { bundledPaths } from '../content/paths.ts'
import type { Convention, Section, SectionOutline } from '../types/convention.ts'
import { request, send } from './api.ts'
import type { Quiz } from './quiz.ts'

/**
 * 學習路徑 (E4: e4-t08, e4-t11, e4-t12). A path is lessons in order; a lesson names what to read
 * (a convention, or one of its sections), the practice questions to try (e4-t10), and a checklist.
 * The handbook bundles 「從零開始」 (content/paths.ts); an editor's saved version of a path, kept by
 * the Worker, replaces the bundled one with the same id. A signed-in member marks lessons done.
 *
 * The types mirror TKU-BridgeTable's `shared/learning.ts` (CLAUDE.md rule 10; checked in
 * parity/table-types.ts). Only lazily loaded code imports this module.
 */

// ── Mirrored from TKU-BridgeTable shared/learning.ts ──────────────────────────────────────────

export const LEARNING_LIMITS = {
  pathsMax: 20,
  lessonsMax: 40,
  readingsMax: 20,
  quizzesMax: 40,
  checklistMax: 20,
  idMax: 40,
  nameMax: 60,
  titleMax: 80,
  textMax: 1000,
  quizIdMax: 200,
} as const

export interface LessonReading {
  slug: string
  sectionId?: string
}

export interface Lesson {
  id: string
  title: string
  goal: string
  readings: LessonReading[]
  quizIds?: string[]
  checklist: string[]
}

export interface LearningPath {
  id: string
  name: string
  lessons: Lesson[]
}

export type SavedLearningPath = LearningPath & { by: string; at: number }

export interface PathProgress {
  pathId: string
  done: string[]
  at: number
}

export interface PathProgressInput {
  pathId: string
  lessonId: string
  done: boolean
}

// ── API ───────────────────────────────────────────────────────────────────────────────────────

export const learningApi = {
  paths: () => request<{ paths: SavedLearningPath[] }>('/api/book/paths').then((r) => r.paths),
  save: (path: LearningPath) => send<{ path: SavedLearningPath }>('PUT', '/api/book/paths', { path }).then((r) => r.path),
  /** Back to the bundled path */
  reset: (id: string) => send<{ ok: true }>('DELETE', '/api/book/paths', { id }),
  progress: () => request<{ progress: PathProgress[] }>('/api/book/paths/progress').then((r) => r.progress),
  mark: (progress: PathProgressInput) =>
    send<{ progress: PathProgress }>('PUT', '/api/book/paths/progress', { progress }).then((r) => r.progress),
}

// ── Addresses ─────────────────────────────────────────────────────────────────────────────────

export const LEARN_PATH = '/learn'
export const pathPage = (pathId: string) => `${LEARN_PATH}/${pathId}`
export const lessonPage = (pathId: string, lessonId: string) => `${LEARN_PATH}/${pathId}/${lessonId}`
export const pathEditPage = (pathId: string) => `${LEARN_PATH}/${pathId}/edit`
/** 練這一課 (e4-t10): the practice page with the lesson's questions */
export const lessonPracticePath = (pathId: string, lessonId: string) =>
  `/practice?lesson=${encodeURIComponent(`${pathId}/${lessonId}`)}`

// ── A lesson's questions (e4-t10) ─────────────────────────────────────────────────────────────

/** A section and every section under it, by id */
function sectionAndBelow(sections: readonly Section[], id: string): Set<string> {
  const out = new Set<string>()
  const walk = (list: readonly Section[], inside: boolean) => {
    for (const s of list) {
      const here = inside || s.id === id
      if (here) out.add(s.id)
      if (s.children) walk(s.children, here)
    }
  }
  walk(sections, false)
  return out
}

/** The questions made from a lesson's readings: a whole convention, or a section and those under it */
export function readingQuizzes(
  readings: readonly LessonReading[],
  quizzes: readonly Quiz[],
  conventions: readonly Convention[],
): Quiz[] {
  const bySlug = new Map(conventions.map((c) => [c.slug, c]))
  const wanted = readings.map((r) => {
    const convention = bySlug.get(r.slug)
    return { slug: r.slug, sections: r.sectionId && convention ? sectionAndBelow(convention.sections, r.sectionId) : undefined }
  })
  return quizzes.filter((q) => wanted.some((w) => w.slug === q.slug && (!w.sections || w.sections.has(q.sectionId))))
}

/**
 * The questions a lesson practises: the ones its editor chose (in that order, those the content
 * still makes), or, when none were chosen, every question from its readings.
 */
export function lessonQuizzes(lesson: Lesson, quizzes: readonly Quiz[], conventions: readonly Convention[]): Quiz[] {
  if (!lesson.quizIds?.length) return readingQuizzes(lesson.readings, quizzes, conventions)
  const byId = new Map(quizzes.map((q) => [q.id, q]))
  return lesson.quizIds.flatMap((id) => byId.get(id) ?? [])
}

/** `pathId/lessonId` from `?lesson=`; the path id has no slash */
export function lessonParam(value: string | null): { pathId: string; lessonId: string } | undefined {
  const at = value?.indexOf('/') ?? -1
  return value && at > 0 ? { pathId: value.slice(0, at), lessonId: value.slice(at + 1) } : undefined
}

// ── Paths ─────────────────────────────────────────────────────────────────────────────────────

export interface ShownPath extends LearningPath {
  /** Who saved the online version and when; undefined for the bundled one */
  saved?: { by: string; at: number }
  /** The site ships a path with this id (so removing the online one goes back to it) */
  bundled: boolean
}

const shown = (path: LearningPath, bundled: boolean, saved?: { by: string; at: number }): ShownPath => ({
  id: path.id,
  name: path.name,
  lessons: path.lessons,
  bundled,
  ...(saved && { saved }),
})

/** The bundled paths with the online versions in their place, then the paths only saved online */
export function mergePaths(bundled: readonly LearningPath[], online: readonly SavedLearningPath[]): ShownPath[] {
  const byId = new Map(online.map((p) => [p.id, p]))
  const out = bundled.map((p) => {
    const saved = byId.get(p.id)
    return saved ? shown(saved, true, { by: saved.by, at: saved.at }) : shown(p, true)
  })
  const ids = new Set(bundled.map((p) => p.id))
  for (const p of online) if (!ids.has(p.id)) out.push(shown(p, false, { by: p.by, at: p.at }))
  return out
}

export const bundledPath = (id: string) => bundledPaths.find((p) => p.id === id)

/** Online versions are fetched once per page load; a save refetches */
let onlineRequest: Promise<SavedLearningPath[]> | undefined
const fetchOnline = (fresh = false) => {
  if (fresh || !onlineRequest)
    onlineRequest = learningApi.paths().catch(() => {
      // Offline or an error: the bundled paths, and try again next time
      onlineRequest = undefined
      return []
    })
  return onlineRequest
}

/** Fetches the online versions again next time (tests; a member signing in sees no other paths) */
export const forgetOnlinePaths = () => {
  onlineRequest = undefined
}

/**
 * Every path, the online versions in place. Until they arrive (or when they cannot) the bundled
 * ones, with `loaded` false.
 */
export function useLearningPaths() {
  const [online, setOnline] = useState<SavedLearningPath[]>()
  useEffect(() => {
    let live = true
    void fetchOnline().then((paths) => live && setOnline(paths))
    return () => {
      live = false
    }
  }, [])
  const reload = useCallback(() => fetchOnline(true).then(setOnline), [])
  const paths = useMemo(() => mergePaths(bundledPaths, online ?? []), [online])
  return { paths, loaded: online !== undefined, reload }
}

// ── Progress (e4-t11) ─────────────────────────────────────────────────────────────────────────

/** Done lessons that are still in the path, and the whole-number share of the path they are */
export function pathProgress(path: LearningPath, done: readonly string[] | undefined) {
  const set = new Set(done)
  const count = path.lessons.filter((l) => set.has(l.id)).length
  return { done: count, total: path.lessons.length, percent: path.lessons.length ? Math.round((count / path.lessons.length) * 100) : 0 }
}

/**
 * The signed-in member's progress (e4-t11): lesson ids done, by path. Undefined while loading or
 * when signed out (`enabled` false); a mark shows at once and goes back if the save fails.
 */
export function usePathProgress(enabled: boolean) {
  const [progress, setProgress] = useState<Map<string, string[]>>()
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let live = true
    learningApi.progress().then(
      (list) => live && setProgress(new Map(list.map((p) => [p.pathId, p.done]))),
      () => {
        if (!live) return
        setFailed(true)
        setProgress(new Map())
      },
    )
    return () => {
      live = false
    }
  }, [enabled])

  const mark = useCallback(
    async (pathId: string, lessonId: string, done: boolean) => {
      const set = (ids: string[]) => setProgress((before) => new Map(before).set(pathId, ids))
      const previous = progress?.get(pathId) ?? []
      const others = previous.filter((id) => id !== lessonId)
      set(done ? [...others, lessonId] : others)
      try {
        set((await learningApi.mark({ pathId, lessonId, done })).done)
        setFailed(false)
      } catch {
        set(previous)
        setFailed(true)
      }
    },
    [progress],
  )

  return { progress: enabled ? progress : undefined, failed, mark }
}

// ── Readings ──────────────────────────────────────────────────────────────────────────────────

/** Section titles from the top down to `sectionId`; undefined when the outline has no such section */
export function outlineTrail(outline: readonly SectionOutline[], sectionId: string): string[] | undefined {
  for (const s of outline) {
    if (s.id === sectionId) return [s.title]
    const below = s.children && outlineTrail(s.children, sectionId)
    if (below) return [s.title, ...below]
  }
  return undefined
}

/** Every section of an outline, depth first, with its trail (for the editor's section choice) */
export function outlineSections(outline: readonly SectionOutline[], above: string[] = []): { id: string; trail: string[] }[] {
  return outline.flatMap((s) => {
    const trail = [...above, s.title]
    return [{ id: s.id, trail }, ...outlineSections(s.children ?? [], trail)]
  })
}

/** A path as the editor saves it: text trimmed, empty checklist items and readings dropped */
export function tidyPath(path: LearningPath): LearningPath {
  return {
    id: path.id,
    name: path.name.trim(),
    lessons: path.lessons.map((l) => ({
      id: l.id,
      title: l.title.trim(),
      goal: l.goal.trim(),
      readings: l.readings.filter((r) => r.slug).map((r) => (r.sectionId ? { slug: r.slug, sectionId: r.sectionId } : { slug: r.slug })),
      ...(l.quizIds?.length && { quizIds: l.quizIds }),
      checklist: l.checklist.map((c) => c.trim()).filter(Boolean),
    })),
  }
}

/** A lesson id not used in the path yet */
export function newLessonId(path: LearningPath) {
  const ids = new Set(path.lessons.map((l) => l.id))
  let n = path.lessons.length + 1
  while (ids.has(`lesson-${n}`)) n++
  return `lesson-${n}`
}
