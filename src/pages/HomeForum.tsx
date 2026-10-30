import { ArrowRight, MessagesSquare, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Avatar } from '../components/Avatar.tsx'
import { Tag, TagList } from '../components/Tag.tsx'
import { Button } from '../components/ui.tsx'
import { api, type ClubMember } from '../lib/api.ts'
import { NEWS_BOARD_ID, type Board, type ForumLatest } from '../lib/forum.ts'
import { forumApi } from '../lib/forumApi.ts'
import { memberLabel, postHas, postSummary } from '../lib/forumPosts.ts'
import { today } from '../lib/format.ts'
import { forumStrings as t } from '../forum/forumStrings.ts'
import { boardPath, isOfficer, postPath } from '../forum/forumText.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { BlockTitle } from './HomeBlocks.tsx'

/**
 * The home page's 社團新聞 and 最新討論 (e11-t16, AC-11.7, DESIGN-V2.md §5.3): the news board's
 * latest three, pinned first, with the date first; and the other boards' latest three, each with
 * its author, board, title or first words, what it carries (four hands, an auction) and its
 * comments. Loaded after the home page (its JS budget); both parts share one request.
 */

interface HomeForumData {
  latest: ForumLatest
  boards: Board[]
  members: ClubMember[]
}

let loading: Promise<HomeForumData> | null = null
let takers = 0

/**
 * One request for the two parts of one visit (they sit in different Suspense boundaries, so they
 * may mount apart); the next visit asks again
 */
function load(): Promise<HomeForumData> {
  if (!loading || takers >= 2) {
    loading = Promise.all([forumApi.latest(), forumApi.boards(), api.club.members()]).then(
      ([latest, boards, members]) => ({ latest, boards, members }),
    )
    takers = 0
  }
  takers += 1
  return loading
}

function useHomeForum() {
  const [state, setState] = useState<{ data?: HomeForumData; failed?: boolean }>({})
  useEffect(() => {
    let current = true
    load().then(
      (data) => current && setState({ data }),
      () => current && setState({ failed: true }),
    )
    return () => {
      current = false
    }
  }, [])
  return state
}

const date = (ms: number) => today(new Date(ms)).slice(5).replace('-', '/')

export default function HomeForum({ part }: { part: 'news' | 'discussions' }) {
  return part === 'news' ? <ClubNews /> : <LatestDiscussions />
}

/** 社團新聞 (the right column); officers get 發公告 */
function ClubNews() {
  const { data, failed } = useHomeForum()
  const { user } = useAuth()
  const news = data?.latest.news
  return (
    <section aria-labelledby="home-news">
      <BlockTitle id="home-news">{t.news}</BlockTitle>
      {failed ? (
        <Note>{t.homeFailed}</Note>
      ) : !news ? (
        <Note role="status">{t.loading}</Note>
      ) : news.length ? (
        <List>
          {news.map((post) => (
            <li key={post.id}>
              <time dateTime={new Date(post.createdAt).toISOString()}>{date(post.createdAt)}</time>
              <Link to={postPath(post.id)}>
                {post.pinned && <span aria-label={t.pinned}>📌 </span>}
                {postSummary(post) || t.untitled}
              </Link>
            </li>
          ))}
        </List>
      ) : (
        <Note>{t.noNews}</Note>
      )}
      <More>
        <Button as={Link} to={boardPath(NEWS_BOARD_ID)} $small>
          {t.allNews}
          <ArrowRight size={14} aria-hidden />
        </Button>
        {isOfficer(user) && (
          <Button as={Link} to={`/forum/new?board=${NEWS_BOARD_ID}`} $small $variant="ghost">
            <Plus size={14} aria-hidden />
            {t.postNews}
          </Button>
        )}
      </More>
    </section>
  )
}

/** 最新討論 (the main column) */
function LatestDiscussions() {
  const { data, failed } = useHomeForum()
  const posts = data?.latest.discussions
  return (
    <section aria-labelledby="home-discussions">
      <BlockTitle id="home-discussions">{t.latest}</BlockTitle>
      {failed ? (
        <Note>{t.homeFailed}</Note>
      ) : !posts || !data ? (
        <Note role="status">{t.loading}</Note>
      ) : posts.length ? (
        <Cards>
          {posts.map((post) => {
            const name = memberLabel(data.members, post.authorId) ?? t.someone
            const board = data.boards.find((b) => b.id === post.boardId)
            const has = postHas(post)
            const extras = (['deal', 'auction', 'hand'] as const).filter((k) => has[k]).map((k) => t.has[k])
            return (
              <li key={post.id}>
                <Avatar id={post.authorId} name={name} avatar={data.members.find((m) => m.id === post.authorId)?.avatar} size={32} />
                <div>
                  <Byline>
                    <strong>{name}</strong>
                    {board && (
                      <TagList>
                        <Tag label={board.name} />
                      </TagList>
                    )}
                  </Byline>
                  <Link to={postPath(post.id)}>{postSummary(post) || t.untitled}</Link>
                  <small>
                    {[...extras, t.comments(post.commentCount)].join(' · ')}
                  </small>
                </div>
              </li>
            )
          })}
        </Cards>
      ) : (
        <Note>{t.noDiscussions}</Note>
      )}
      <More>
        <Button as={Link} to="/forum" $small>
          <MessagesSquare size={14} aria-hidden />
          {t.toForum}
          <ArrowRight size={14} aria-hidden />
        </Button>
      </More>
    </section>
  )
}

const Note = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  li {
    display: flex;
    align-items: baseline;
    gap: ${({ theme }) => theme.space(2)};
    padding: ${({ theme }) => theme.space(2)} 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  time {
    flex: none;
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  a {
    min-width: 0;
    color: ${({ theme }) => theme.colors.text};
    font-weight: 500;
  }
`

const Cards = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    gap: ${({ theme }) => theme.space(3)};
    padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
    border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.shape.panel};
    background: ${({ theme }) => theme.colors.surface};
  }
  li > div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  a {
    color: ${({ theme }) => theme.colors.text};
    font-weight: 500;
    overflow-wrap: anywhere;
  }
  small {
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const Byline = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  font-size: 0.875rem;
`

const More = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2)};
  margin: ${({ theme }) => theme.space(3)} 0 0;
`
