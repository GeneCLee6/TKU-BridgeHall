import { request, send } from './api.ts'
import type {
  Board,
  BoardInput,
  BoardPage,
  Comment,
  CommentBlock,
  CommentInput,
  ForumFeed,
  ForumLatest,
  Post,
  PostInput,
  PostThread,
  ReactionEmoji,
  Reactions,
} from './forum.ts'

/**
 * 討論區的 API（E11 `e11-t06`、`e11-t07`）: TKU-BridgeTable `worker/forum.ts`, behind `/api/forum/*`
 * (ARCHITECTURE.md §4.6). Members only. Only the forum's pages import this, so it stays out of the
 * home page's bundle; the home page's two lists (e11-t16) load it with `import()`.
 *
 * Errors come back as `ApiError` with the server's message: 404 `forumBoardGone`, `postGone`,
 * `commentGone`; 403 `forumBoardOfficersOnly`, `notYours`; 409 `postLocked`; 429 `slowDown`
 * (FORUM_LIMITS.perMinute posts and comments a minute); 400 `badContent` with the reason.
 */

const id = (value: string) => encodeURIComponent(value)
type Target = 'post' | 'comment'
const targetPath = (target: Target, targetId: string) => `/api/forum/${target === 'post' ? 'posts' : 'comments'}/${id(targetId)}`

export const forumApi = {
  boards: () => request<{ boards: Board[] }>('/api/forum/boards').then((r) => r.boards),
  /** Admins */
  createBoard: (board: BoardInput) => send<{ board: Board }>('POST', '/api/forum/boards', board).then((r) => r.board),
  updateBoard: (boardId: string, board: BoardInput) =>
    send<{ board: Board }>('PATCH', `/api/forum/boards/${id(boardId)}`, board).then((r) => r.board),
  /** A built-in board, or one with posts, cannot be deleted (409) */
  deleteBoard: (boardId: string) => send<{ ok: true }>('DELETE', `/api/forum/boards/${id(boardId)}`),

  /** Pinned posts on page 1, then newest first, FORUM_LIMITS.pageSize a page */
  boardPage: (boardId: string, page = 1) => request<BoardPage>(`/api/forum/boards/${id(boardId)}/posts?page=${page}`),
  /** Every board's posts newest first: the forum's front page (e11-t15) */
  feed: (page = 1) => request<ForumFeed>(`/api/forum/feed?page=${page}`),
  /** The home page's 社團新聞 and 最新討論 */
  latest: () => request<ForumLatest>('/api/forum/latest'),

  post: (postId: string) => request<PostThread>(`/api/forum/posts/${id(postId)}`),
  createPost: (boardId: string, post: PostInput) =>
    send<{ post: Post }>('POST', `/api/forum/boards/${id(boardId)}/posts`, post).then((r) => r.post),
  /** The author only */
  updatePost: (postId: string, post: PostInput) => send<{ post: Post }>('PATCH', `/api/forum/posts/${id(postId)}`, post).then((r) => r.post),
  /** The author or an officer */
  deletePost: (postId: string) => send<{ ok: true }>('DELETE', `/api/forum/posts/${id(postId)}`),
  /** Officers */
  pin: (postId: string, pinned: boolean) =>
    send<{ post: Post }>('POST', `/api/forum/posts/${id(postId)}/pin`, { pinned }).then((r) => r.post),
  lock: (postId: string, locked: boolean) =>
    send<{ post: Post }>('POST', `/api/forum/posts/${id(postId)}/lock`, { locked }).then((r) => r.post),

  /** `parentId` makes it a reply; a reply to a reply hangs under the same top comment */
  comment: (postId: string, comment: CommentInput) =>
    send<{ comment: Comment }>('POST', `/api/forum/posts/${id(postId)}/comments`, comment).then((r) => r.comment),
  updateComment: (commentId: string, blocks: CommentBlock[]) =>
    send<{ comment: Comment }>('PATCH', `/api/forum/comments/${id(commentId)}`, { blocks }).then((r) => r.comment),
  /** A top comment's replies go with it */
  deleteComment: (commentId: string) => send<{ ok: true }>('DELETE', `/api/forum/comments/${id(commentId)}`),

  /** Sets or changes the member's one reaction; the answer is the target's reactions now */
  react: (target: Target, targetId: string, emoji: ReactionEmoji) =>
    send<{ reactions: Reactions }>('PUT', `${targetPath(target, targetId)}/reaction`, { emoji }).then((r) => r.reactions),
  unreact: (target: Target, targetId: string) =>
    send<{ reactions: Reactions }>('DELETE', `${targetPath(target, targetId)}/reaction`).then((r) => r.reactions),
}
