import type { Me } from '../lib/api.ts'
import type { Board } from '../lib/forum.ts'
import type { PostProblem } from '../lib/forumPosts.ts'
import { formatDateTime } from '../lib/format.ts'
import { timeAgo } from '../lib/forumPosts.ts'
import { forumStrings as t } from './forumStrings.ts'

/** A post's own page */
export const postPath = (postId: string) => `/forum/p/${encodeURIComponent(postId)}`

/** A comment's place on its post's page: the club's notifications open `/forum/p/<id>#comment-<id>` (e11-t08) */
export const commentAnchor = (commentId: string) => `comment-${commentId}`

/**
 * The forum's officers (幹部, e11-t09): members with `forumModerate`, and admins. They post news, pin,
 * lock and delete anyone's posts and comments, and handle reports (TKU-BridgeTable worker/roles.ts)
 */
export const isOfficer = (user: Me | null | undefined) => !!user && (user.admin || user.permissions.includes('forumModerate'))

/** The boards a member may start a post on: every member's, and the officers' for an officer */
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

/** A board's page (e11-t15) */
export const boardPath = (boardId: string) => `/forum/${encodeURIComponent(boardId)}`
