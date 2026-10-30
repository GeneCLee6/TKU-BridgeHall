import { useState } from 'react'
import styled from 'styled-components'
import { AuctionInput } from '../components/board/AuctionInput.tsx'
import { HandInput } from '../components/board/HandInput.tsx'
import { Button, ErrorText, Muted, Row } from '../components/ui.tsx'
import { errorText, type ClubMember } from '../lib/api.ts'
import type { Comment, CommentBlock, Post } from '../lib/forum.ts'
import { forumApi } from '../lib/forumApi.ts'
import { commentProblems, newBlock, tidyBlocks } from '../lib/forumPosts.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { forumStrings as t } from './forumStrings.ts'
import { commentAnchor, isOfficer, problemText } from './forumText.ts'
import { MentionTextArea } from './MentionTextArea.tsx'
import { PostBody } from './PostBlocks.tsx'
import { ActionMenu, Author, MenuItem, useReact, When } from './PostCard.tsx'
import { ReactionBar } from './ReactionBar.tsx'
import { ReportForm } from './ReportForm.tsx'

/**
 * A comment's text, with an auction or a hand attached when the member wants (e11-t14, AC-11.4).
 * Comments hold only these three kinds (`COMMENT_BLOCK_KINDS`).
 */
function CommentForm({
  members,
  initial,
  prefill = '',
  placeholder,
  submitLabel,
  autoFocus,
  onSubmit,
  onCancel,
}: {
  members: readonly ClubMember[]
  initial?: CommentBlock[]
  prefill?: string
  placeholder: string
  submitLabel: string
  autoFocus?: boolean
  onSubmit: (blocks: CommentBlock[]) => Promise<void>
  onCancel?: () => void
}) {
  const firstText = initial?.find((b) => b.kind === 'paragraph')
  const [text, setText] = useState(firstText?.kind === 'paragraph' ? firstText.text : prefill)
  const [extras, setExtras] = useState<CommentBlock[]>(() => (initial ?? []).filter((b) => b !== firstText))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const blocks: CommentBlock[] = [{ kind: 'paragraph', text }, ...extras]
  const send = async () => {
    const problems = commentProblems(blocks)
    if (problems.length) return setError(problems.map((p) => problemText(p, true)).join('\n'))
    setBusy(true)
    setError('')
    try {
      await onSubmit(tidyBlocks(blocks))
      setText(prefill)
      setExtras([])
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }
  const has = (kind: CommentBlock['kind']) => extras.some((b) => b.kind === kind)
  const toggle = (kind: 'auction' | 'hand') =>
    setExtras((list) => (has(kind) ? list.filter((b) => b.kind !== kind) : [...list, newBlock(kind) as CommentBlock]))

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault()
        void send()
      }}
    >
      <MentionTextArea value={text} onChange={setText} members={members} label={placeholder} placeholder={placeholder} rows={2} autoFocus={autoFocus} />
      {extras.map((block, i) =>
        block.kind === 'auction' ? (
          <AuctionInput
            key={`a${i}`}
            value={block.auction}
            onChange={(auction) => setExtras((list) => list.map((b) => (b === block ? { ...block, auction } : b)))}
          />
        ) : block.kind === 'hand' ? (
          <HandInput key={`h${i}`} value={block.cards} onChange={(cards) => setExtras((list) => list.map((b) => (b === block ? { ...block, cards } : b)))} />
        ) : null,
      )}
      <Row>
        <Muted as="span">{t.attach}</Muted>
        <Button type="button" $small $variant="ghost" aria-pressed={has('auction')} onClick={() => toggle('auction')}>
          {t.attachAuction}
        </Button>
        <Button type="button" $small $variant="ghost" aria-pressed={has('hand')} onClick={() => toggle('hand')}>
          {t.attachHand}
        </Button>
        <Spacer />
        {onCancel && (
          <Button type="button" $small $variant="ghost" onClick={onCancel}>
            {t.cancel}
          </Button>
        )}
        <Button type="submit" $small $variant="primary" disabled={busy}>
          {busy ? t.sending : submitLabel}
        </Button>
      </Row>
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </Form>
  )
}

function CommentItem({
  comment,
  members,
  onChange,
  onRemove,
  onReply,
  reply,
}: {
  comment: Comment
  members: readonly ClubMember[]
  onChange: (comment: Comment) => void
  onRemove: () => void
  onReply?: () => void
  reply: boolean
}) {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [reporting, setReporting] = useState(false)
  const [reported, setReported] = useState(false)
  const react = useReact('comment', comment.id, comment.reactions, (reactions) => onChange({ ...comment, reactions }))
  const mine = !!user && user.id === comment.authorId
  const officer = isOfficer(user)

  const remove = async (hasReplies: boolean) => {
    if (!window.confirm(hasReplies ? t.deleteRepliesConfirm : t.deleteCommentConfirm)) return
    try {
      await forumApi.deleteComment(comment.id)
      onRemove()
    } catch (e) {
      setError(errorText(e))
    }
  }

  return (
    <Item id={commentAnchor(comment.id)} aria-label={t.comment}>
      <ItemHead>
        <Author id={comment.authorId} members={members} size={24} />
        <Small>
          <When at={comment.createdAt} edited={comment.editedAt} />
        </Small>
        {user && (
          <ActionMenu label={t.commentActions}>
            {mine && (
              <MenuItem type="button" onClick={() => setEditing(true)}>
                {t.edit}
              </MenuItem>
            )}
            {!mine && (
              <MenuItem type="button" onClick={() => setReporting(true)}>
                {t.report}
              </MenuItem>
            )}
            {(mine || officer) && (
              <MenuItem type="button" $danger onClick={() => void remove(!reply)}>
                {t.delete}
              </MenuItem>
            )}
          </ActionMenu>
        )}
      </ItemHead>
      {reporting && (
        <ReportForm
          target="comment"
          targetId={comment.id}
          onDone={(sent) => {
            setReporting(false)
            setReported(sent)
          }}
        />
      )}
      {reported && <Muted role="status">{t.reported}</Muted>}
      {editing ? (
        <CommentForm
          members={members}
          initial={comment.blocks}
          placeholder={t.comment}
          submitLabel={t.save}
          autoFocus
          onCancel={() => setEditing(false)}
          onSubmit={async (blocks) => {
            onChange(await forumApi.updateComment(comment.id, blocks))
            setEditing(false)
          }}
        />
      ) : (
        <PostBody blocks={comment.blocks} members={members} files={{}} />
      )}
      <Row>
        <ReactionBar small reactions={comment.reactions} userId={react.userId} onPick={react.pick} />
        {onReply && (
          <Button type="button" $small $variant="ghost" onClick={onReply}>
            {t.reply}
          </Button>
        )}
      </Row>
      {(error || react.error) && <ErrorText role="alert">{error || react.error}</ErrorText>}
    </Item>
  )
}

/**
 * The post page's comments (e11-t14, AC-11.4): each top comment with its replies under it (one
 * level: replying to a reply answers the same top comment and names its author with `@`), the
 * reactions, editing and deleting one's own (an officer may delete any); then the box for a new
 * comment. A locked post takes no new comments, except from an officer.
 */
export function CommentSection({
  post,
  comments,
  members,
  onComments,
}: {
  post: Post
  comments: Comment[]
  members: readonly ClubMember[]
  onComments: (comments: Comment[], count: number) => void
}) {
  const { user } = useAuth()
  const [replyTo, setReplyTo] = useState<{ parentId: string; mention: string } | null>(null)
  const tops = comments.filter((c) => !c.parentId)
  const open = !post.locked || isOfficer(user)

  const set = (list: Comment[]) => onComments(list, list.length)
  const change = (comment: Comment) => set(comments.map((c) => (c.id === comment.id ? comment : c)))
  const removed = (comment: Comment) => set(comments.filter((c) => c.id !== comment.id && c.parentId !== comment.id))
  const add = async (blocks: CommentBlock[], parentId?: string) => {
    const comment = await forumApi.comment(post.id, parentId ? { parentId, blocks } : { blocks })
    set([...comments, comment])
    setReplyTo(null)
  }
  const usernameOf = (id: string) => members.find((m) => m.id === id)?.username

  return (
    <Section aria-labelledby="comments-title">
      <h2 id="comments-title">
        {t.commentsTitle}
        <Muted as="span"> · {t.comments(post.commentCount)}</Muted>
      </h2>
      {tops.map((top) => {
        const replies = comments.filter((c) => c.parentId === top.id)
        const replyHere = (to: Comment) => () => {
          const name = usernameOf(to.authorId)
          // A reply to a reply names whom it answers (DESIGN-V2.md §12)
          setReplyTo({ parentId: top.id, mention: to.id !== top.id && name ? `@${name} ` : '' })
        }
        return (
          <Thread key={top.id}>
            <CommentItem
              comment={top}
              members={members}
              reply={false}
              onChange={change}
              onRemove={() => removed(top)}
              onReply={open ? replyHere(top) : undefined}
            />
            {replies.length > 0 && (
              <Replies aria-label={t.replies(replies.length)}>
                {replies.map((r) => (
                  <CommentItem
                    key={r.id}
                    comment={r}
                    members={members}
                    reply
                    onChange={change}
                    onRemove={() => removed(r)}
                    onReply={open ? replyHere(r) : undefined}
                  />
                ))}
              </Replies>
            )}
            {replyTo?.parentId === top.id && (
              <Replies>
                <CommentForm
                  key={replyTo.mention}
                  members={members}
                  prefill={replyTo.mention}
                  placeholder={t.replyPlaceholder(members.find((m) => m.id === top.authorId)?.displayName || usernameOf(top.authorId) || t.someone)}
                  submitLabel={t.reply}
                  autoFocus
                  onCancel={() => setReplyTo(null)}
                  onSubmit={(blocks) => add(blocks, top.id)}
                />
              </Replies>
            )}
          </Thread>
        )
      })}
      {open ? (
        <CommentForm members={members} placeholder={t.commentPlaceholder} submitLabel={t.send} onSubmit={(blocks) => add(blocks)} />
      ) : (
        <Muted>{t.locked}</Muted>
      )}
    </Section>
  )
}

const Section = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};
  min-width: 0;

  h2 {
    margin: 0;
    font-size: 1.0625rem;
    color: ${({ theme }) => theme.colors.primaryStrong};
  }
`

const Thread = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
`

const Replies = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  margin-left: ${({ theme }) => theme.space(8)};
`

const Item = styled.article`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.shape.note};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  min-width: 0;
`

const ItemHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`

const Small = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
`

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  min-width: 0;
`

const Spacer = styled.span`
  flex: 1;
`
