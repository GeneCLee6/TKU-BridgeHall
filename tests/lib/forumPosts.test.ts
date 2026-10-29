// @vitest-environment jsdom
import type { ClubMember } from '../../src/lib/api.ts'
import { FORUM_LIMITS, type PostBlock } from '../../src/lib/forum.ts'
import {
  clearDraft,
  commentProblems,
  DRAFT_KEY,
  insertMention,
  loadDraft,
  mentionAt,
  mentionMatches,
  mentionParts,
  myReaction,
  newBlock,
  postHas,
  postProblems,
  postSummary,
  recentAuthors,
  saveDraft,
  textLength,
  tidyBlocks,
  timeAgo,
  withReaction,
} from '../../src/lib/forumPosts.ts'

/** The compose box's and the post page's helpers (e11-t13, e11-t14) */

const MEMBERS: ClubMember[] = [
  { id: 'u1', username: 'amy', displayName: '王小美' },
  { id: 'u2', username: 'bob', displayName: '陳小柏' },
  { id: 'u3', username: 'amyx' },
]

describe('blocks as they are sent', () => {
  it('drops empty blocks, trims texts and empty captions', () => {
    const blocks: PostBlock[] = [
      { kind: 'paragraph', text: '  今天這副牌  ' },
      { kind: 'paragraph', text: '   ' },
      newBlock('deal'),
      newBlock('auction', 'E'),
      { kind: 'hand', cards: ['SA', 'HK'], label: '  ' },
      { kind: 'image', assetId: 'post/0123456789abcdef01234567.webp', alt: ' 牌桌 ', caption: '' },
      { kind: 'ref', slug: '' },
    ]
    expect(tidyBlocks(blocks)).toEqual([
      { kind: 'paragraph', text: '今天這副牌' },
      { kind: 'hand', cards: ['SA', 'HK'] },
      { kind: 'image', assetId: 'post/0123456789abcdef01234567.webp', alt: '牌桌' },
    ])
  })

  it('starts an auction with the dealer it is given', () => {
    expect(newBlock('auction', 'W')).toEqual({ kind: 'auction', auction: { dealer: 'W', calls: [] } })
  })

  it('counts text as the Worker does, one per character', () => {
    expect(textLength([{ kind: 'paragraph', text: '4♠ 怎麼做' }, { kind: 'note', tone: 'info', text: 'ab' }])).toBe(8)
  })

  it('finds what stops a post or a comment from being sent', () => {
    expect(postProblems('', [{ kind: 'paragraph', text: ' ' }])).toEqual([{ kind: 'empty' }])
    const long = 'x'.repeat(FORUM_LIMITS.postTextMax + 1)
    expect(postProblems('', [{ kind: 'paragraph', text: long }])).toEqual([
      { kind: 'tooLong', length: FORUM_LIMITS.postTextMax + 1, max: FORUM_LIMITS.postTextMax },
    ])
    const image: PostBlock = { kind: 'image', assetId: 'post/0123456789abcdef01234567.webp', alt: '' }
    expect(postProblems('', Array(FORUM_LIMITS.imagesMax + 1).fill(image)).map((p) => p.kind)).toEqual(['tooManyImages'])
    expect(postProblems('t'.repeat(FORUM_LIMITS.titleMax + 1), [{ kind: 'paragraph', text: 'a' }]).map((p) => p.kind)).toEqual([
      'titleTooLong',
    ])
    expect(commentProblems([{ kind: 'paragraph', text: '' }])).toEqual([{ kind: 'empty' }])
    expect(commentProblems([{ kind: 'paragraph', text: '' }, { kind: 'hand', cards: ['SA'] }])).toEqual([])
  })
})

describe('the draft on this device', () => {
  afterEach(() => window.localStorage.clear())

  it('keeps a draft with something in it, and drops an empty one', () => {
    saveDraft({ boardId: 'deals', title: '', blocks: [{ kind: 'paragraph', text: '寫到一半' }] })
    expect(loadDraft()).toEqual({ boardId: 'deals', title: '', blocks: [{ kind: 'paragraph', text: '寫到一半' }] })
    saveDraft({ boardId: 'deals', title: ' ', blocks: [{ kind: 'paragraph', text: '' }] })
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull()
    saveDraft({ boardId: 'deals', title: '標題', blocks: [] })
    clearDraft()
    expect(loadDraft()).toBeNull()
  })

  it('ignores whatever else is stored', () => {
    window.localStorage.setItem(DRAFT_KEY, '{"boardId":1}')
    expect(loadDraft()).toBeNull()
    window.localStorage.setItem(DRAFT_KEY, 'not json')
    expect(loadDraft()).toBeNull()
  })
})

describe('@ mentions', () => {
  it('finds the name being typed at the caret', () => {
    expect(mentionAt('嗨 @bo', 5)).toEqual({ start: 2, query: 'bo' })
    expect(mentionAt('@', 1)).toEqual({ start: 0, query: '' })
    expect(mentionAt('mail a@b', 8)).toBeNull()
    expect(mentionAt('@bob 你好', 8)).toBeNull()
    expect(mentionAt('沒有', 2)).toBeNull()
  })

  it('lists members by username or display name, starts before contains', () => {
    expect(mentionMatches(MEMBERS, 'am').map((m) => m.id)).toEqual(['u1', 'u3'])
    expect(mentionMatches(MEMBERS, '小柏').map((m) => m.id)).toEqual(['u2'])
    expect(mentionMatches(MEMBERS, 'b').map((m) => m.id)).toEqual(['u2'])
  })

  it('writes the username in place of what was typed', () => {
    expect(insertMention('嗨 @bo 看這副', 2, 5, 'bob')).toEqual({ text: '嗨 @bob  看這副', caret: 7 })
  })

  it('finds mentions the way the Worker does', () => {
    expect(mentionParts('@amyx 和 @王小美你好，寫信到 x@amy.tw', MEMBERS)).toEqual([
      { text: '@amyx', member: MEMBERS[2] },
      { text: ' 和 ' },
      { text: '@王小美', member: MEMBERS[0] },
      { text: '你好，寫信到 x@amy.tw' },
    ])
    expect(mentionParts('@AMY 好', MEMBERS)).toEqual([{ text: '@AMY', member: MEMBERS[0] }, { text: ' 好' }])
    expect(mentionParts('@amyz', MEMBERS)).toEqual([{ text: '@amyz' }])
  })
})

describe('reactions', () => {
  it('moves the one reaction, and takes it back when picked again', () => {
    const start = { '👍': ['u2', 'u1'], '♠': ['u3'] }
    expect(myReaction(start, 'u1')).toBe('👍')
    const moved = withReaction(start, 'u1', '♠')
    expect(moved).toEqual({ '👍': ['u2'], '♠': ['u3', 'u1'] })
    expect(withReaction(moved, 'u1', '♠')).toEqual({ '👍': ['u2'], '♠': ['u3'] })
    expect(withReaction({ '♥': ['u1'] }, 'u1', '♥')).toEqual({})
  })
})

describe('times', () => {
  const words = { justNow: '剛剛', minutesAgo: (n: number) => `${n}分`, hoursAgo: (n: number) => `${n}時`, daysAgo: (n: number) => `${n}天` }
  const now = Date.UTC(2026, 9, 29, 12)
  it('says how long ago, then the date', () => {
    expect(timeAgo(now - 30_000, now, words, () => 'date')).toBe('剛剛')
    expect(timeAgo(now - 5 * 60_000, now, words, () => 'date')).toBe('5分')
    expect(timeAgo(now - 3 * 3_600_000, now, words, () => 'date')).toBe('3時')
    expect(timeAgo(now - 2 * 86_400_000, now, words, () => 'date')).toBe('2天')
    expect(timeAgo(now - 8 * 86_400_000, now, words, () => 'date')).toBe('date')
  })
})

describe('posts in lists (e11-t15, e11-t16)', () => {
  it('sums a post up by its title, else its first words', () => {
    expect(postSummary({ title: ' 大專盃報名 ', blocks: [{ kind: 'paragraph', text: '內文' }] })).toBe('大專盃報名')
    expect(postSummary({ blocks: [{ kind: 'hand', cards: ['SA'] }, { kind: 'paragraph', text: '這副\n怎麼打？' }] })).toBe('這副 怎麼打？')
    expect(postSummary({ blocks: [{ kind: 'paragraph', text: '一二三四五六' }] }, 4)).toBe('一二三四…')
    expect(postSummary({ blocks: [{ kind: 'hand', cards: ['SA'] }] })).toBe('')
  })

  it('says what a post carries besides text', () => {
    const blocks: PostBlock[] = [{ kind: 'hand', cards: ['SA'] }, { kind: 'paragraph', text: 'x' }]
    expect(postHas({ blocks })).toEqual({ deal: false, auction: false, hand: true })
  })

  it('lists who posted last, each once', () => {
    const posts = [
      { authorId: 'a', createdAt: 1 },
      { authorId: 'b', createdAt: 3 },
      { authorId: 'a', createdAt: 4 },
      { authorId: 'c', createdAt: 2 },
    ]
    expect(recentAuthors(posts)).toEqual(['a', 'b', 'c'])
    expect(recentAuthors(posts, 2)).toEqual(['a', 'b'])
  })
})
