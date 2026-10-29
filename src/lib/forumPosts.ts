import { emptyDeal, type Card, type Seat } from './board.ts'
import {
  FORUM_LIMITS,
  REACTION_EMOJIS,
  type CommentBlock,
  type PostBlock,
  type ReactionEmoji,
  type Reactions,
} from './forum.ts'
import type { ClubMember } from './api.ts'

/**
 * The forum's pure helpers (E11 `e11-t13`, `e11-t14`): what the compose box sends, its draft on
 * this device, `@` mentions while typing and when shown, reactions and times. The Worker checks
 * every post again (TKU-BridgeTable `worker/forum.ts`); these only catch what the member can fix
 * before sending.
 */

// ── Blocks ───────────────────────────────────────────────────────────────────────────────────

/** A new block of a kind the compose box adds; the dealer comes from a deal already in the post */
export function newBlock(kind: 'paragraph' | 'deal' | 'auction' | 'hand', dealer: Seat = 'N'): PostBlock {
  if (kind === 'paragraph') return { kind, text: '' }
  if (kind === 'deal') return { kind, deal: emptyDeal(dealer) }
  if (kind === 'auction') return { kind, auction: { dealer, calls: [] } }
  return { kind, cards: [] as Card[] }
}

/** True when a block has nothing in it yet (left out when the post is sent) */
export function isEmptyBlock(block: PostBlock): boolean {
  switch (block.kind) {
    case 'paragraph':
    case 'note':
      return !block.text.trim()
    case 'rules':
      return block.items.every((item) => !item.text.trim())
    case 'hand':
      return block.cards.length === 0
    case 'deal':
      return Object.values(block.deal.hands).every((cards) => cards.length === 0)
    case 'auction':
      return block.auction.calls.length === 0
    case 'image':
      return !block.assetId
    case 'ref':
      return !block.slug
    case 'record':
      return !block.tableRecordId
  }
}

const clean = (value: string | undefined) => (value && value.trim() ? value.trim() : undefined)

/** One block as it is sent: texts trimmed, empty labels and captions dropped */
function tidyBlock(block: PostBlock): PostBlock {
  switch (block.kind) {
    case 'paragraph':
    case 'note':
      return { ...block, text: block.text.trim() }
    case 'hand': {
      const { label, ...rest } = block
      const kept = clean(label)
      return kept ? { ...rest, label: kept } : rest
    }
    case 'deal': {
      const { caption, ...rest } = block
      const kept = clean(caption)
      return kept ? { ...rest, caption: kept } : rest
    }
    case 'auction': {
      const { caption, ...rest } = block
      const kept = clean(caption)
      return kept ? { ...rest, caption: kept } : rest
    }
    case 'image': {
      const { caption, ...rest } = block
      const kept = clean(caption)
      const base = { ...rest, alt: block.alt.trim() }
      return kept ? { ...base, caption: kept } : base
    }
    default:
      return block
  }
}

/** The blocks as they are sent: empty ones left out, the rest tidied */
export const tidyBlocks = <T extends PostBlock>(blocks: readonly T[]): T[] =>
  blocks.filter((block) => !isEmptyBlock(block)).map((block) => tidyBlock(block) as T)

/** The words of a block that count towards the text limit (as the Worker counts them) */
export function blockWords(block: PostBlock): string[] {
  if (block.kind === 'paragraph' || block.kind === 'note') return [block.text]
  if (block.kind === 'rules') {
    const all: string[] = []
    const walk = (items: typeof block.items) =>
      items.forEach((item) => {
        all.push(item.text)
        if (item.children) walk(item.children)
      })
    walk(block.items)
    return all
  }
  return []
}

/** Characters of text, counted as the Worker does (one per code point, after trimming) */
export const textLength = (blocks: readonly PostBlock[]) =>
  tidyBlocks(blocks)
    .flatMap(blockWords)
    .reduce((sum, text) => sum + [...text].length, 0)

export type PostProblem =
  | { kind: 'empty' }
  | { kind: 'tooManyBlocks'; max: number }
  | { kind: 'tooLong'; length: number; max: number }
  | { kind: 'tooManyImages'; max: number }
  | { kind: 'titleTooLong'; max: number }

/** What stops a post from being sent, before the Worker sees it */
export function postProblems(title: string, blocks: readonly PostBlock[]): PostProblem[] {
  const sent = tidyBlocks(blocks)
  const problems: PostProblem[] = []
  if (sent.length === 0) problems.push({ kind: 'empty' })
  if (sent.length > FORUM_LIMITS.blocksMax) problems.push({ kind: 'tooManyBlocks', max: FORUM_LIMITS.blocksMax })
  const length = textLength(sent)
  if (length > FORUM_LIMITS.postTextMax) problems.push({ kind: 'tooLong', length, max: FORUM_LIMITS.postTextMax })
  if (sent.filter((b) => b.kind === 'image').length > FORUM_LIMITS.imagesMax)
    problems.push({ kind: 'tooManyImages', max: FORUM_LIMITS.imagesMax })
  if ([...title.trim()].length > FORUM_LIMITS.titleMax) problems.push({ kind: 'titleTooLong', max: FORUM_LIMITS.titleMax })
  return problems
}

/** What stops a comment from being sent */
export function commentProblems(blocks: readonly CommentBlock[]): PostProblem[] {
  const sent = tidyBlocks(blocks)
  if (sent.length === 0) return [{ kind: 'empty' }]
  const length = textLength(sent)
  return length > FORUM_LIMITS.commentTextMax ? [{ kind: 'tooLong', length, max: FORUM_LIMITS.commentTextMax }] : []
}

// ── The draft on this device ─────────────────────────────────────────────────────────────────

export const DRAFT_KEY = 'tku-bridgebook:forumDraft'

export interface PostDraft {
  boardId: string
  title: string
  blocks: PostBlock[]
}

const isDraft = (value: unknown): value is PostDraft =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as PostDraft).boardId === 'string' &&
  typeof (value as PostDraft).title === 'string' &&
  Array.isArray((value as PostDraft).blocks)

/** The new post the member was writing, if any (storage may be blocked or hold anything) */
export function loadDraft(): PostDraft | null {
  try {
    const text = window.localStorage.getItem(DRAFT_KEY)
    const value: unknown = text ? JSON.parse(text) : null
    return isDraft(value) ? value : null
  } catch {
    return null
  }
}

/** Keeps the draft, or drops it when it has nothing in it */
export function saveDraft(draft: PostDraft) {
  try {
    if (!draft.title.trim() && tidyBlocks(draft.blocks).length === 0) window.localStorage.removeItem(DRAFT_KEY)
    else window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // A full or blocked storage only loses the draft
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    // Nothing to clear
  }
}

// ── @ mentions ───────────────────────────────────────────────────────────────────────────────

/**
 * The `@name` being typed where the caret is: where its `@` is and what follows it so far. None
 * when the `@` is part of an e-mail address or the text after it has a space or line break.
 */
export function mentionAt(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret)
  const at = before.lastIndexOf('@')
  if (at < 0) return null
  if (at > 0 && /[A-Za-z0-9_.]/.test(before[at - 1])) return null
  const query = before.slice(at + 1)
  if (/\s/.test(query) || [...query].length > 20) return null
  return { start: at, query }
}

/** The members whose username or display name starts with (then contains) the query, best first */
export function mentionMatches(members: readonly ClubMember[], query: string, limit = 6): ClubMember[] {
  const q = query.toLowerCase()
  const names = (m: ClubMember) => [m.username.toLowerCase(), ...(m.displayName ? [m.displayName.toLowerCase()] : [])]
  const starts = members.filter((m) => names(m).some((n) => n.startsWith(q)))
  const contains = members.filter((m) => !starts.includes(m) && names(m).some((n) => n.includes(q)))
  return [...starts, ...contains].slice(0, limit)
}

/** The text with the `@query` at `start` replaced by `@username `, and where the caret goes */
export function insertMention(text: string, start: number, caret: number, username: string) {
  const inserted = `@${username} `
  return { text: text.slice(0, start) + inserted + text.slice(caret), caret: start + inserted.length }
}

export type TextPart = { text: string } | { text: string; member: ClubMember }

/**
 * The text cut into plain runs and `@` mentions of members, found the way the Worker finds them
 * (`mentionsIn`): username in any case or display name, longest first; a name ending in a Latin
 * letter or digit must not run on into more of them; an `@` inside an e-mail address names nobody.
 */
export function mentionParts(text: string, members: readonly ClubMember[]): TextPart[] {
  const names = members
    .flatMap((m) => [
      { member: m, name: m.username.toLowerCase() },
      ...(m.displayName ? [{ member: m, name: m.displayName.toLowerCase() }] : []),
    ])
    .filter((n) => n.name)
    .sort((a, b) => b.name.length - a.name.length)
  const lower = text.toLowerCase()
  const parts: TextPart[] = []
  let from = 0
  for (let at = lower.indexOf('@'); at >= 0; at = lower.indexOf('@', at + 1)) {
    if (at < from || (at > 0 && /[a-z0-9_.]/.test(lower[at - 1]))) continue
    const rest = lower.slice(at + 1)
    const hit = names.find(({ name }) => rest.startsWith(name) && !(/\w$/.test(name) && /^\w/.test(rest.slice(name.length))))
    if (!hit) continue
    if (at > from) parts.push({ text: text.slice(from, at) })
    const end = at + 1 + hit.name.length
    parts.push({ text: text.slice(at, end), member: hit.member })
    from = end
  }
  if (from < text.length) parts.push({ text: text.slice(from) })
  return parts
}

// ── Reactions ────────────────────────────────────────────────────────────────────────────────

/** The member's one reaction on a post or comment, if any */
export function myReaction(reactions: Reactions, userId: string | undefined): ReactionEmoji | undefined {
  if (!userId) return undefined
  return REACTION_EMOJIS.find((emoji) => reactions[emoji]?.includes(userId))
}

/** The reactions after the member picks `emoji` (picking their own again takes it back), for the bar to show at once */
export function withReaction(reactions: Reactions, userId: string, emoji: ReactionEmoji): Reactions {
  const had = myReaction(reactions, userId)
  const next: Reactions = {}
  for (const e of REACTION_EMOJIS) {
    const ids = (reactions[e] ?? []).filter((id) => id !== userId)
    if (e === emoji && had !== emoji) ids.push(userId)
    if (ids.length) next[e] = ids
  }
  return next
}

// ── Names and times ──────────────────────────────────────────────────────────────────────────

/** A member's display name, else username; undefined for someone no longer in the club */
export function memberLabel(members: readonly ClubMember[], id: string): string | undefined {
  const member = members.find((m) => m.id === id)
  return member ? member.displayName || member.username : undefined
}

export interface TimeWords {
  justNow: string
  minutesAgo: (n: number) => string
  hoursAgo: (n: number) => string
  daysAgo: (n: number) => string
}

/** 剛剛, 5 分鐘前, 3 小時前, 2 天前; older than a week, the date */
export function timeAgo(ms: number, now: number, words: TimeWords, date: (ms: number) => string): string {
  const minutes = Math.floor((now - ms) / 60_000)
  if (minutes < 1) return words.justNow
  if (minutes < 60) return words.minutesAgo(minutes)
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return words.hoursAgo(hours)
  const days = Math.floor(hours / 24)
  return days < 7 ? words.daysAgo(days) : date(ms)
}
