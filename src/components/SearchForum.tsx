import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { forumStrings as t } from '../forum/forumStrings.ts'
import { postPath } from '../forum/forumText.ts'
import type { ForumSearch } from '../lib/forum.ts'
import { forumApi } from '../lib/forumApi.ts'
import { postSummary, searchProblem } from '../lib/forumPosts.ts'
import { useAuth } from '../state/AuthContext.tsx'

/** Posts the header shows; the rest are on the forum's search page */
const SHOWN = 5
/** Wait this long after the last key before asking the Worker */
const PAUSE_MS = 300

/**
 * The header search's 討論 group (e11-t18): the forum's posts whose title or text holds the words
 * (TKU-BridgeTable `GET /api/forum/search`), for signed-in members only. Lazy, with the forum's API
 * and strings, so the home page's JavaScript only carries the `lazy()` call in `SearchBar`.
 */
export default function SearchForum({ query, onPick }: { query: string; onPick: () => void }) {
  const { user } = useAuth()
  const words = query.trim()
  const ready = !!user && !searchProblem(words)
  const [found, setFound] = useState<{ query: string; result?: ForumSearch; failed?: boolean }>()

  useEffect(() => {
    if (!ready) return
    let current = true
    const timer = setTimeout(() => {
      forumApi.search(words, 1).then(
        (result) => current && setFound({ query: words, result }),
        () => current && setFound({ query: words, failed: true }),
      )
    }, PAUSE_MS)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [ready, words])

  if (!ready) return null
  const now = found?.query === words ? found : undefined
  const result = now?.result
  return (
    <Group aria-labelledby="search-forum">
      <h3 id="search-forum">{t.headerGroup}</h3>
      {!now ? (
        <p>{t.headerSearching}</p>
      ) : now.failed || !result ? (
        <p>{t.headerFailed}</p>
      ) : !result.posts.length ? (
        <p>{t.headerNone}</p>
      ) : (
        <ul>
          {result.posts.slice(0, SHOWN).map((post) => (
            <li key={post.id}>
              <Link to={postPath(post.id)} onClick={onPick}>
                {postSummary(post) || t.untitled}
              </Link>
            </li>
          ))}
          <li>
            <Link to={`/forum/search?${new URLSearchParams({ q: words })}`} onClick={onPick}>
              {t.headerAll(result.total)}
            </Link>
          </li>
        </ul>
      )}
    </Group>
  )
}

const Group = styled.section`
  margin-top: ${({ theme }) => theme.space(2)};
  padding-top: ${({ theme }) => theme.space(2)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  h3,
  p {
    margin: 0 ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(1)};
    font-size: 0.8125rem;
    font-weight: normal;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  li:last-child a {
    color: ${({ theme }) => theme.colors.primary};
    font-size: 0.875rem;
  }
`
