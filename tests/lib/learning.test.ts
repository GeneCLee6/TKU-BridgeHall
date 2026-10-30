import { conventionBySlug } from '../fixtures/content.ts'
import { bundledPaths, FROM_ZERO } from '../../src/content/paths.ts'
import { conventions } from '../fixtures/content.ts'
import { generateQuizzes } from '../../src/lib/quiz.ts'
import {
  LEARNING_LIMITS,
  lessonParam,
  lessonPracticePath,
  lessonQuizzes,
  readingQuizzes,
  mergePaths,
  newLessonId,
  outlineSections,
  outlineTrail,
  pathProgress,
  tidyPath,
  type LearningPath,
} from '../../src/lib/learning.ts'
import { conventionMeta } from '../../src/lib/sections.ts'

// The catalogue as the Worker's manifest gives it (L0)
const manifest = conventions.map(conventionMeta)

/** 學習路徑 (e4-t08, e4-t11): the bundled path and the helpers */

const path: LearningPath = {
  id: 'p',
  name: '路徑',
  lessons: [
    { id: 'lesson-1', title: '一', goal: '', readings: [{ slug: 'fixture-alpha' }], checklist: [] },
    { id: 'lesson-2', title: '二', goal: '', readings: [], checklist: [] },
    { id: 'lesson-3', title: '三', goal: '', readings: [], checklist: [] },
  ],
}

describe('the bundled paths', () => {
  it('has 「從零開始」, whose lessons read the handbook’s basic conventions and leave the teaching to the club', () => {
    const fromZero = bundledPaths.find((p) => p.id === FROM_ZERO)!
    expect(fromZero.name).toBe('從零開始')
    expect(fromZero.lessons).toHaveLength(8)
    for (const lesson of fromZero.lessons) {
      expect(lesson.readings.length).toBeGreaterThan(0)
      // Goal and checklist are the editors' (CLAUDE.md rule 1). That each title is its first reading's
      // name and every reading is a basic convention is checked on the club's conventions, in the
      // private repository's copy of this file (the readings name them; tests/fixtures are made up)
      expect(lesson.goal).toBe('')
      expect(lesson.checklist).toEqual([])
    }
  })

  it('keeps every path within what the Worker takes', () => {
    for (const p of bundledPaths) {
      expect(p.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(p.lessons.length).toBeLessThanOrEqual(LEARNING_LIMITS.lessonsMax)
      expect(new Set(p.lessons.map((l) => l.id)).size).toBe(p.lessons.length)
      for (const lesson of p.lessons) {
        expect(lesson.id).not.toBe('edit')
        expect(lesson.title.length).toBeLessThanOrEqual(LEARNING_LIMITS.titleMax)
        for (const r of lesson.readings) expect(r.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      }
    }
  })
})

describe('mergePaths', () => {
  it('puts the online version in the bundled one’s place, and adds paths only saved online', () => {
    const online = [
      { ...path, name: '改過', by: 'ed', at: 5 },
      { ...path, id: 'extra', by: 'ed', at: 6 },
    ]
    const merged = mergePaths([path, { ...path, id: 'other' }], online)
    expect(merged.map((p) => [p.id, p.name, p.bundled, p.saved])).toEqual([
      ['p', '改過', true, { by: 'ed', at: 5 }],
      ['other', '路徑', true, undefined],
      ['extra', '路徑', false, { by: 'ed', at: 6 }],
    ])
    expect(merged[0]).not.toHaveProperty('by')
  })
})

describe('pathProgress', () => {
  it('counts only the lessons still in the path', () => {
    expect(pathProgress(path, ['lesson-1', 'gone'])).toEqual({ done: 1, total: 3, percent: 33 })
    expect(pathProgress(path, undefined)).toEqual({ done: 0, total: 3, percent: 0 })
    expect(pathProgress({ ...path, lessons: [] }, [])).toEqual({ done: 0, total: 0, percent: 0 })
  })
})

describe('outlines', () => {
  const outline = manifest.find((c) => c.slug === 'fixture-alpha')!.outline
  it('names a section by its trail', () => {
    expect(outlineTrail(outline, 'after-2c')).toEqual(['佔位答叫表（測試）', '2♣ 之後（測試）'])
    expect(outlineTrail(outline, 'nope')).toBeUndefined()
  })
  it('lists every section, depth first', () => {
    const all = outlineSections(outline)
    expect(all[0]).toEqual({ id: 'intro', trail: ['前言（測試）'] })
    expect(all.find((s) => s.id === 'after-2c')?.trail).toEqual(['佔位答叫表（測試）', '2♣ 之後（測試）'])
  })
})

describe('the editor’s helpers', () => {
  it('tidies a path for saving', () => {
    const tidy = tidyPath({
      id: 'p',
      name: ' 路徑 ',
      lessons: [
        {
          id: 'lesson-1',
          title: ' 一 ',
          goal: ' 目標 \n',
          readings: [{ slug: '' }, { slug: 'fixture-alpha', sectionId: undefined }, { slug: 'fixture-alpha', sectionId: 'responses' }],
          quizIds: [],
          checklist: [' a ', '', '  '],
        },
      ],
    })
    expect(tidy).toEqual({
      id: 'p',
      name: '路徑',
      lessons: [
        {
          id: 'lesson-1',
          title: '一',
          goal: '目標',
          readings: [{ slug: 'fixture-alpha' }, { slug: 'fixture-alpha', sectionId: 'responses' }],
          checklist: ['a'],
        },
      ],
    })
  })

  it('makes a lesson id not in use', () => {
    expect(newLessonId(path)).toBe('lesson-4')
    expect(newLessonId({ ...path, lessons: [path.lessons[2]] })).toBe('lesson-2')
    expect(newLessonId({ ...path, lessons: [{ ...path.lessons[0], id: 'lesson-2' }] })).toBe('lesson-3')
  })
})

describe('a lesson’s questions (e4-t10)', () => {
  const { quizzes } = generateQuizzes(conventions, 'club')
  const lesson = (readings: { slug: string; sectionId?: string }[], quizIds?: string[]) => ({
    id: 'l',
    title: 'L',
    goal: '',
    readings,
    checklist: [],
    ...(quizIds && { quizIds }),
  })

  it('practises its readings when no questions were chosen: a whole convention or a section and those under it', () => {
    const whole = readingQuizzes([{ slug: 'fixture-alpha' }], quizzes, conventions)
    expect(whole.length).toBeGreaterThan(0)
    expect(whole.every((q) => q.slug === 'fixture-alpha')).toBe(true)
    // A top-level section with questions in it or under it
    const top = conventionBySlug('fixture-alpha')!.sections.find((s) => whole.some((q) => q.trail[0] === s.title))!
    const part = readingQuizzes([{ slug: 'fixture-alpha', sectionId: top.id }], quizzes, conventions)
    expect(part.length).toBeGreaterThan(0)
    expect(part.length).toBeLessThan(whole.length)
    expect(part).toEqual(whole.filter((q) => q.trail[0] === top.title))
    expect(lessonQuizzes(lesson([{ slug: 'no-such-convention' }]), quizzes, conventions)).toEqual([])
  })

  it('practises the chosen questions in their order, those still made', () => {
    const ids = [quizzes[5].id, 'gone/x/0/0', quizzes[2].id]
    expect(lessonQuizzes(lesson([{ slug: 'fixture-alpha' }], ids), quizzes, conventions).map((q) => q.id)).toEqual([quizzes[5].id, quizzes[2].id])
  })

  it('links to the practice page and reads the link back', () => {
    expect(lessonPracticePath('from-zero', 'lesson-2')).toBe('/practice?lesson=from-zero%2Flesson-2')
    expect(lessonParam('from-zero/lesson-2')).toEqual({ pathId: 'from-zero', lessonId: 'lesson-2' })
    expect(lessonParam(null)).toBeUndefined()
    expect(lessonParam('from-zero')).toBeUndefined()
  })
})
