import type { Board } from '../lib/forum.ts'
import type { PostProblem } from '../lib/forumPosts.ts'
import { formatDateTime } from '../lib/format.ts'
import { timeAgo } from '../lib/forumPosts.ts'
import { forumStrings as t } from './forumStrings.ts'

/** A post's own page */
export const postPath = (postId: string) => `/forum/p/${encodeURIComponent(postId)}`

/** The boards a member may start a post on: every member's, and the officers' for an officer (admins until e11-t09) */
export const postableBoards = (boards: readonly Board[], officer: boolean) =>
  [...boards].sort((a, b) => a.order - b.order).filter((b) => b.postPolicy === 'all' || officer)

/** 剛剛, 5 分鐘前, …, from now */
export const ago = (ms: number) => timeAgo(ms, Date.now(), t, formatDateTime)

/** What the member is told about a problem that stops a post or comment from being sent */
export function problemText(p: PostProblem, comment = false): string {
  switch (p.kind) {
    case 'empty':
      return comment ? t.problems.commentEmpty : t.problems.empty
    case 'tooManyBlocks':
      return t.problems.tooManyBlocks(p.max)
    case 'tooLong':
      return t.problems.tooLong(p.length, p.max)
    case 'tooManyImages':
      return t.problems.tooManyImages(p.max)
    case 'titleTooLong':
      return t.problems.titleTooLong(p.max)
  }
}
