import type { LearningPath } from '../lib/learning.ts'

/**
 * The bundled learning paths (E4, e4-t08). Only the lazily loaded learning pages and the home
 * page's lazy blocks import this (through lib/learning.ts).
 *
 * 「從零開始」 is only an order of the handbook's own basic conventions, from the 自然制 handout:
 * each lesson reads one or two of them and its title is the convention's name. What a lesson is for
 * (`goal`) and its checklist are the club's to write (CLAUDE.md rule 1), so they are empty here and
 * the lesson page says so; editors fill them in online (/learn/from-zero/edit). The order itself is
 * waiting for the club too (CONTENT_GUIDE.md §6.4).
 */

const lesson = (n: number, title: string, ...slugs: string[]) => ({
  id: `lesson-${n}`,
  title,
  goal: '',
  readings: slugs.map((slug) => ({ slug })),
  checklist: [],
})

export const FROM_ZERO = 'from-zero'

export const bundledPaths: LearningPath[] = [
  {
    id: FROM_ZERO,
    name: '從零開始',
    lessons: [
      lesson(1, '淡江自然制總覽', 'system-overview'),
      lesson(2, '開叫1♣（自然制講義）', 'system-one-club'),
      lesson(3, '開叫1♦（自然制講義）', 'system-one-diamond'),
      lesson(4, '開叫1♥/1♠（自然制講義）', 'system-one-major'),
      lesson(5, '開叫1NT/2NT（自然制講義）', 'system-notrump', 'notrump-responses'),
      lesson(6, '開叫2♣、弱二與阻塞叫（自然制講義）', 'system-strong-and-preempts'),
      lesson(7, '叫牌觀念、防禦與打牌（自然制講義）', 'system-concepts'),
      lesson(8, '橋牌防守信號', 'defensive-signals'),
    ],
  },
]
