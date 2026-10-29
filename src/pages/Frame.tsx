import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccountMenu } from '../components/AccountMenu.tsx'
import { AppHeader } from '../components/AppHeader.tsx'
import { ReadingSettingsButton } from '../components/ReadingSettingsButton.tsx'
import { ErrorText, Muted, PageMain } from '../components/ui.tsx'
import type { Permission } from '../lib/api.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { strings } from '../strings.ts'

/** The account corner of the header, wired to the signed-in member */
export function AccountCorner() {
  const { user, can, logout } = useAuth()
  return <AccountMenu user={user} can={can} onSignOut={() => void logout()} />
}

/**
 * The header and page frame for everything except the handbook itself. Pages whose title changes
 * (the editor) leave out `title` and set it themselves. Like the handbook's header v2 the bar has
 * no 字級 control: theme and 字級 are in 閱讀設定 (e9-t11, DESIGN-V2.md §5.1).
 */
export function Frame({
  title,
  children,
  wide,
  toolbar,
}: {
  title?: string
  children: ReactNode
  wide?: boolean
  /** The page has the phone's bottom toolbar (the forum, e11-t15), whose 閱讀設定 opens the panel */
  toolbar?: boolean
}) {
  usePageTitle(title)
  return (
    <>
      <AppHeader actions={<ReadingSettingsButton toolbar={toolbar} />} account={<AccountCorner />} />
      {wide ? children : <PageMain id="main">{children}</PageMain>}
    </>
  )
}

/**
 * Lets a page through only for a signed-in member with the permission (or an admin, with
 * `permission` 'admin'); otherwise says why, and sends a signed-out visitor to the login page.
 */
export function Gate({ need, children }: { need: Permission | 'admin' | 'member'; children: ReactNode }) {
  const { user, can } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (user === null)
      navigate(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`, {
        replace: true,
      })
  }, [user, navigate])
  if (user === undefined || user === null) return <Muted role="status">{strings.loading}</Muted>
  const allowed = need === 'member' || (need === 'admin' ? user.admin : can(need))
  if (!allowed)
    return <ErrorText role="alert">{need === 'admin' ? strings.admin.adminOnly : strings.auth.noPermission}</ErrorText>
  return children
}
