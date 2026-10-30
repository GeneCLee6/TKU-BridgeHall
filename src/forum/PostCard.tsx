import { Lock, MoreHorizontal, Pin } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Avatar } from '../components/Avatar.tsx'
import { Tag, TagList } from '../components/Tag.tsx'
import { ErrorText } from '../components/ui.tsx'
import { errorText, type ClubMember } from '../lib/api.ts'
import { NEWS_BOARD_ID, type Board, type Post, type ReactionEmoji, type Reactions } from '../lib/forum.ts'
import { forumApi } from '../lib/forumApi.ts'
import { memberLabel, myReaction, withReaction } from '../lib/forumPosts.ts'
import { formatDateTime } from '../lib/format.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { forumStrings as t } from './forumStrings.ts'
import { ago, isOfficer, postPath } from './forumText.ts'
import { PostBody, usePostFiles } from './PostBlocks.tsx'
import { ReactionBar } from './ReactionBar.tsx'
import { ReportForm } from './ReportForm.tsx'

/** 2 小時前, with the full date and time for hovering and screen readers */
export function When({ at, edited }: { at: number; edited?: number }) {
  return (
    <time dateTime={new Date(at).toISOString()} title={formatDateTime(at)}>
      {ago(at)}
      {edited && <span title={formatDateTime(edited)}>{t.edited}</span>}
    </time>
  )
}

/** The author's avatar and name, linking to their page; someone who left the club stays nameless */
export function Author({ id, members, size }: { id: string; members: readonly ClubMember[]; size: number }) {
  const member = members.find((m) => m.id === id)
  const name = memberLabel(members, id) ?? t.someone
  return (
    <>
      <Avatar id={id} name={name} avatar={member?.avatar} size={size} />
      {member ? <AuthorLink to={`/u/${encodeURIComponent(id)}`}>{name}</AuthorLink> : <strong>{name}</strong>}
    </>
  )
}

/**
 * Reacting with the reactions shown at once: the bar moves first, then takes the Worker's answer,
 * and goes back if the call fails
 */
// oxlint-disable-next-line react/only-export-components -- the comments use it too
export function useReact(target: 'post' | 'comment', targetId: string, reactions: Reactions, onChange: (r: Reactions) => void) {
  const { user } = useAuth()
  const [error, setError] = useState('')
  const pick = (emoji: ReactionEmoji) => {
    if (!user) return
    const before = reactions
    const had = myReaction(before, user.id)
    onChange(withReaction(before, user.id, emoji))
    setError('')
    const call = had === emoji ? forumApi.unreact(target, targetId) : forumApi.react(target, targetId, emoji)
    call.then(onChange, (e) => {
      onChange(before)
      setError(errorText(e))
    })
  }
  return { pick, error, userId: user?.id }
}

/** The 「⋯」 menu of a post or a comment: what this member may do with it */
export function ActionMenu({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const wrap = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])
  return (
    <MenuWrap ref={wrap}>
      <MenuButton type="button" aria-label={label} aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(!open)}>
        <MoreHorizontal size={18} aria-hidden />
      </MenuButton>
      {open && (
        <Menu id={menuId} onClick={() => setOpen(false)}>
          {children}
        </Menu>
      )}
    </MenuWrap>
  )
}

/**
 * 貼文卡 (e11-t14, AC-11.3): the author, board and time; the post's blocks; the reactions and the
 * comment count. In a feed (`full` false) the title and count link to the post page; on the post
 * page the comments follow it. The author may edit and delete it; an officer (`isOfficer`, e11-t17)
 * may delete it too, pin it and lock it; anyone else may report it to the officers. A news post has
 * the primary line on its left (DESIGN-V2.md §12).
 */
export function PostCard({
  post,
  boards,
  members,
  full = false,
  onChange,
  onEdit,
  onDelete,
}: {
  post: Post
  boards: readonly Board[]
  members: readonly ClubMember[]
  full?: boolean
  onChange: (post: Post) => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const { user } = useAuth()
  const files = usePostFiles(post.blocks)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reported, setReported] = useState(false)
  const react = useReact('post', post.id, post.reactions, (reactions) => onChange({ ...post, reactions }))
  const board = boards.find((b) => b.id === post.boardId)
  const mine = !!user && user.id === post.authorId
  const officer = isOfficer(user)
  const Title = full ? 'h1' : 'h2'

  const remove = async () => {
    if (!window.confirm(t.deleteConfirm)) return
    setError('')
    try {
      await forumApi.deletePost(post.id)
      onDelete?.()
    } catch (e) {
      setError(errorText(e))
    }
  }

  /** Pin or lock it (officers): the card shows the Worker's answer */
  const moderate = async (action: 'pin' | 'lock', on: boolean) => {
    setError('')
    try {
      onChange(await (action === 'pin' ? forumApi.pin(post.id, on) : forumApi.lock(post.id, on)))
    } catch (e) {
      setError(errorText(e))
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(new URL(postPath(post.id), window.location.origin).toString())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // The address is in the bar anyway
    }
  }

  return (
    <Card $news={post.boardId === NEWS_BOARD_ID} aria-labelledby={`post-${post.id}`}>
      <Head>
        <Author id={post.authorId} members={members} size={32} />
        <Meta>
          {board && (
            <TagList>
              <Tag label={board.name} />
            </TagList>
          )}
          <When at={post.createdAt} edited={post.editedAt} />
          {post.pinned && (
            <Mark>
              <Pin size={14} aria-hidden />
              {t.pinned}
            </Mark>
          )}
          {post.locked && (
            <Mark>
              <Lock size={14} aria-hidden />
              {t.locked}
            </Mark>
          )}
        </Meta>
        <ActionMenu label={t.actions}>
          <MenuItem type="button" onClick={() => void copy()}>
            {t.copyLink}
          </MenuItem>
          {mine && onEdit && (
            <MenuItem type="button" onClick={onEdit}>
              {t.edit}
            </MenuItem>
          )}
          {officer && (
            <MenuItem type="button" onClick={() => void moderate('pin', !post.pinned)}>
              {post.pinned ? t.unpin : t.pin}
            </MenuItem>
          )}
          {officer && (
            <MenuItem type="button" onClick={() => void moderate('lock', !post.locked)}>
              {post.locked ? t.unlock : t.lock}
            </MenuItem>
          )}
          {user && !mine && (
            <MenuItem type="button" onClick={() => setReporting(true)}>
              {t.report}
            </MenuItem>
          )}
          {(mine || officer) && (
            <MenuItem type="button" $danger onClick={() => void remove()}>
              {t.delete}
            </MenuItem>
          )}
        </ActionMenu>
      </Head>
      {copied && (
        <Copied role="status">{t.copied}</Copied>
      )}
      {reporting && (
        <ReportForm
          target="post"
          targetId={post.id}
          onDone={(sent) => {
            setReporting(false)
            setReported(sent)
          }}
        />
      )}
      {reported && <Copied role="status">{t.reported}</Copied>}

      <Title id={`post-${post.id}`} className={post.title ? undefined : 'visually-hidden'}>
        {full ? post.title || t.title : <Link to={postPath(post.id)}>{post.title || t.readMore}</Link>}
      </Title>
      <PostBody blocks={post.blocks} members={members} files={files} />

      <Foot>
        <ReactionBar reactions={post.reactions} userId={react.userId} onPick={react.pick} />
        {full ? <span>{t.comments(post.commentCount)}</span> : <Link to={postPath(post.id)}>{t.comments(post.commentCount)}</Link>}
      </Foot>
      {(error || react.error) && <ErrorText role="alert">{error || react.error}</ErrorText>}
    </Card>
  )
}

const Card = styled.article<{ $news: boolean }>`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-left: ${({ theme, $news }) => ($news ? `2px solid ${theme.colors.primary}` : undefined)};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.panel};
  min-width: 0;

  h1,
  h2 {
    margin: 0;
    font-size: 1.125rem;
    color: ${({ theme }) => theme.colors.primaryStrong};
  }

  h1 {
    font-size: 1.375rem;
  }

  h2 a {
    color: inherit;
    text-decoration: none;
  }

  h2 a:hover {
    text-decoration: underline;
  }
`

const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`

export const AuthorLink = styled(Link)`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  flex: 1;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`

const Mark = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
`

const Foot = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(2)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`

const Copied = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`

const MenuWrap = styled.div`
  position: relative;
  margin-left: auto;
`

const MenuButton = styled.button`
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.shape.control};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  &:hover,
  &[aria-expanded='true'] {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.text};
  }
`

const Menu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 10;
  display: grid;
  min-width: 8rem;
  padding: ${({ theme }) => theme.space(1)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.popover};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.panel};
`

export const MenuItem = styled.button<{ $danger?: boolean }>`
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border: 0;
  border-radius: ${({ theme }) => theme.shape.control};
  background: transparent;
  color: ${({ theme, $danger }) => ($danger ? theme.colors.seal : theme.colors.text)};
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
`
