import { ApiError } from '../../src/lib/api.ts'
import type { Comment, Post } from '../../src/lib/forum.ts'
import { forumApi } from '../../src/lib/forumApi.ts'

/** The forum calls against TKU-BridgeTable's routes (its worker/roles.ts forumRouteNeed and club.ts forumApi) */

const post: Post = { id: 'p1', boardId: 'deals', authorId: 'u1', blocks: [{ kind: 'paragraph', text: '一副牌' }], createdAt: 1, reactions: {}, commentCount: 0 }
const comment: Comment = { id: 'c1', postId: 'p1', authorId: 'u2', blocks: [{ kind: 'paragraph', text: '好' }], createdAt: 2, reactions: {} }

let sent: { method: string; path: string; body: unknown }[]
let answer: { status: number; body: unknown }

beforeEach(() => {
  sent = []
  answer = { status: 200, body: {} }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string, init?: RequestInit) => {
      sent.push({ method: init?.method ?? 'GET', path, body: init?.body ? JSON.parse(String(init.body)) : undefined })
      return new Response(JSON.stringify(answer.body), { status: answer.status })
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('forum API (e11-t06, e11-t07)', () => {
  it('reads and changes boards and posts', async () => {
    answer.body = { boards: [] }
    expect(await forumApi.boards()).toEqual([])
    answer.body = { board: { id: 'x' } }
    await forumApi.createBoard({ id: 'x', name: '比賽' })
    await forumApi.updateBoard('x', { order: 2 })
    await forumApi.deleteBoard('x')
    answer.body = { board: {}, pinned: [], posts: [post], page: 2, pages: 2 }
    expect((await forumApi.boardPage('deals', 2)).posts).toEqual([post])
    await forumApi.latest()
    answer.body = { post }
    expect(await forumApi.createPost('deals', { blocks: post.blocks })).toEqual(post)
    await forumApi.updatePost('p1', { title: 't', blocks: post.blocks })
    await forumApi.pin('p1', true)
    await forumApi.lock('p1', false)
    answer.body = { post, comments: [comment] }
    expect(await forumApi.post('p1')).toEqual({ post, comments: [comment] })
    await forumApi.deletePost('p1')
    expect(sent.map((s) => `${s.method} ${s.path}`)).toEqual([
      'GET /api/forum/boards',
      'POST /api/forum/boards',
      'PATCH /api/forum/boards/x',
      'DELETE /api/forum/boards/x',
      'GET /api/forum/boards/deals/posts?page=2',
      'GET /api/forum/latest',
      'POST /api/forum/boards/deals/posts',
      'PATCH /api/forum/posts/p1',
      'POST /api/forum/posts/p1/pin',
      'POST /api/forum/posts/p1/lock',
      'GET /api/forum/posts/p1',
      'DELETE /api/forum/posts/p1',
    ])
    expect(sent[8].body).toEqual({ pinned: true })
    expect(sent[9].body).toEqual({ locked: false })
  })

  it('comments and reacts', async () => {
    answer.body = { comment }
    expect(await forumApi.comment('p1', { parentId: 'c0', blocks: comment.blocks })).toEqual(comment)
    await forumApi.updateComment('c1', comment.blocks)
    await forumApi.deleteComment('c1')
    answer.body = { reactions: { '♠': ['u1'] } }
    expect(await forumApi.react('post', 'p1', '♠')).toEqual({ '♠': ['u1'] })
    await forumApi.unreact('comment', 'c1')
    expect(sent.map((s) => `${s.method} ${s.path}`)).toEqual([
      'POST /api/forum/posts/p1/comments',
      'PATCH /api/forum/comments/c1',
      'DELETE /api/forum/comments/c1',
      'PUT /api/forum/posts/p1/reaction',
      'DELETE /api/forum/comments/c1/reaction',
    ])
    expect(sent[0].body).toEqual({ parentId: 'c0', blocks: comment.blocks })
    expect(sent[3].body).toEqual({ emoji: '♠' })
  })

  it('passes the server’s errors on', async () => {
    answer = { status: 429, body: { error: '太快了', code: 'slowDown' } }
    await expect(forumApi.createPost('deals', { blocks: post.blocks })).rejects.toEqual(new ApiError('太快了', 429, 'slowDown'))
  })
})
