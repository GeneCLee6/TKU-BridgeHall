import { Bell, BellRing } from 'lucide-react'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { errorText } from '../lib/api.ts'
import { noticeApi } from '../lib/noticeApi.ts'
import { pageStrings } from '../pageStrings.ts'
import { Button, ErrorText } from './ui.tsx'

const t = pageStrings.follow

/**
 * 關注這個特約 (e8-t10): a member who follows a convention hears about each new version in 淡江牌桌's
 * notification centre. Shown once the Worker says whether they follow it, so nothing appears
 * when it cannot be asked (offline). Give it `key={slug}` so another convention starts afresh.
 */
export function FollowButton({ slug }: { slug: string }) {
  const [following, setFollowing] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    noticeApi.following(slug).then(
      (value) => live && setFollowing(value),
      () => {},
    )
    return () => {
      live = false
    }
  }, [slug])

  if (following === null) return null
  const toggle = async () => {
    setBusy(true)
    setError('')
    try {
      setFollowing(await noticeApi.setFollowing(slug, !following))
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Wrap data-print="hide">
      <Button type="button" $variant="ghost" $small aria-pressed={following} disabled={busy} onClick={toggle}>
        {following ? <BellRing size={16} aria-hidden /> : <Bell size={16} aria-hidden />}
        {following ? t.following : t.follow}
      </Button>
      <Hint>{following ? t.followingHint : t.hint}</Hint>
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  margin: ${({ theme }) => theme.space(6)} 0 0;
`

const Hint = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
`
