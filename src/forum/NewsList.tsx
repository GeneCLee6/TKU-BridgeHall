import { ArrowRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Button } from '../components/ui.tsx'
import { NEWS_BOARD_ID, type Post } from '../lib/forum.ts'
import { postSummary } from '../lib/forumPosts.ts'
import { today } from '../lib/format.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { forumStrings as t } from './forumStrings.ts'
import { boardPath, isOfficer, postPath } from './forumText.ts'

/**
 * 社團新聞's list and its buttons, the same on the home page (HomeForum) and in the forum's right
 * column (2026-10-30): the date first, pinned ones marked 📌, then 看全部公告 and, for officers,
 * 發公告. Only those two lazy chunks import it, so the home page's first download does not carry it.
 */
export function NewsList({ news, failed = false }: { news?: Post[]; failed?: boolean }) {
  return (
    <div>
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
      <NewsActions />
    </div>
  )
}

function NewsActions() {
  const { user } = useAuth()
  return (
    <More>
      <Button as={Link} to={boardPath(NEWS_BOARD_ID)} $small>
        {t.allNews}
        <ArrowRight size={16} aria-hidden />
      </Button>
      {isOfficer(user) && (
        <Button as={Link} to={`/forum/new?board=${NEWS_BOARD_ID}`} $small $variant="ghost">
          <Plus size={16} aria-hidden />
          {t.postNews}
        </Button>
      )}
    </More>
  )
}

const date = (ms: number) => today(new Date(ms)).slice(5).replace('-', '/')

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

const More = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2)};
  margin: ${({ theme }) => theme.space(3)} 0 0;
`
