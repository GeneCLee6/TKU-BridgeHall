import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { Button, ErrorText, Muted, PageTitle } from '../components/ui.tsx'
import { api, ApiError, errorText, type ClubMember } from '../lib/api.ts'
import type { Board, Comment, Post } from '../lib/forum.ts'
import { forumApi } from '../lib/forumApi.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { Frame, Gate } from '../pages/Frame.tsx'
import { CommentSection } from './Comments.tsx'
import { forumStrings as t } from './forumStrings.ts'
import { postPath } from './forumText.ts'
import { PostCard } from './PostCard.tsx'
import { PostComposer } from './PostComposer.tsx'

/**
 * The forum's pages so far (E11 G5): a post with its comments (`/forum/p/:postId`, e11-t14) and the
 * compose box on a page of its own (`/forum/new?board=`, e11-t13). The forum's frame with the board
 * list and the feed is G6 (e11-t15), which puts the same `PostComposer` and `PostCard` on the
 * board pages. Members only, like the rest of the site; one lazy chunk, out of the home page.
 */

interface Club {
  boards: Board[]
  members: ClubMember[]
}

/** The boards and the club's members (names, avatars, `@` mentions), which every forum page needs */
function useClub(): { club?: Club; error?: string; retry: () => void } {
  const [state, setState] = useState<{ club?: Club; error?: string }>({})
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let current = true
    Promise.all([forumApi.boards(), api.club.members()]).then(
      ([boards, members]) => current && setState({ club: { boards, members } }),
      (e) => current && setState({ error: errorText(e) }),
    )
    return () => {
      current = false
    }
  }, [attempt])
  return { ...state, retry: () => setAttempt((n) => n + 1) }
}

function Failed({ text, retry }: { text: string; retry?: () => void }) {
  return (
    <>
      <ErrorText role="alert">{text}</ErrorText>
      {retry && (
        <div>
          <Button type="button" onClick={retry}>
            {t.retry}
          </Button>
        </div>
      )}
    </>
  )
}

export function PostPage() {
  return (
    <Frame>
      <Gate need="member">
        <Column>
          <PostThread />
        </Column>
      </Gate>
    </Frame>
  )
}

function PostThread() {
  const { postId = '' } = useParams()
  const navigate = useNavigate()
  const { club, error: clubError, retry } = useClub()
  const [thread, setThread] = useState<{ id: string; post?: Post; comments?: Comment[]; error?: string; gone?: boolean }>()
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    let current = true
    forumApi.post(postId).then(
      ({ post, comments }) => current && setThread({ id: postId, post, comments }),
      (e) =>
        current &&
        setThread({ id: postId, error: errorText(e), gone: e instanceof ApiError && e.status === 404 }),
    )
    return () => {
      current = false
    }
  }, [postId])

  const ready = thread?.id === postId ? thread : undefined
  usePageTitle(ready?.post?.title || t.title)

  if (clubError) return <Failed text={clubError} retry={retry} />
  if (ready?.error) return <Failed text={ready.gone ? t.postGone : ready.error} />
  if (!club || !ready?.post || !ready.comments) return <Muted role="status">{t.loading}</Muted>
  const { post, comments } = ready

  return (
    <>
      {editing ? (
        <PostComposer
          boards={club.boards}
          members={club.members}
          post={post}
          onDone={(saved) => {
            setThread({ ...ready, post: saved })
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <PostCard
          full
          post={post}
          boards={club.boards}
          members={club.members}
          onChange={(changed) => setThread((now) => (now?.post ? { ...now, post: changed } : now))}
          onEdit={() => setEditing(true)}
          onDelete={() => navigate('/', { replace: true })}
        />
      )}
      <CommentSection
        post={post}
        comments={comments}
        members={club.members}
        onComments={(list, count) =>
          setThread((now) => (now?.post ? { ...now, comments: list, post: { ...now.post, commentCount: count } } : now))
        }
      />
    </>
  )
}

export function NewPostPage() {
  return (
    <Frame title={t.newPostTitle}>
      <Gate need="member">
        <Column>
          <PageTitle>{t.newPostTitle}</PageTitle>
          <NewPost />
        </Column>
      </Gate>
    </Frame>
  )
}

function NewPost() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { club, error, retry } = useClub()
  if (error) return <Failed text={error} retry={retry} />
  if (!club) return <Muted role="status">{t.loading}</Muted>
  return (
    <PostComposer
      startOpen
      boards={club.boards}
      members={club.members}
      boardId={params.get('board') ?? undefined}
      onDone={(post) => navigate(postPath(post.id))}
    />
  )
}

/** The feed's width (DESIGN-V2.md §12: 40rem) */
const Column = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(4)};
  width: min(100%, 40rem);
  margin: 0 auto;
  min-width: 0;
`
