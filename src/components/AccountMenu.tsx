import { ChevronDown, LogIn, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import type { Me, Permission } from '../lib/api.ts'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'

/**
 * The header's account corner: 登入 when signed out; otherwise the member's name opening a menu
 * with what their permissions allow (新增特約, 匯入檔案, 社團管理), 我的帳號 and 登出.
 */
export function AccountMenu({
  user,
  can,
  onSignOut,
}: {
  user: Me | null | undefined
  can: (permission: Permission) => boolean
  onSignOut: () => void
}) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  // Close on a click elsewhere or Escape
  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // A link in the menu moves to another page; close it there (adjusting state during render)
  const [seenPath, setSeenPath] = useState(location.pathname)
  if (location.pathname !== seenPath) {
    setSeenPath(location.pathname)
    setOpen(false)
  }

  if (user === undefined) return null
  if (!user) {
    const next = location.pathname === '/login' ? '' : `?next=${encodeURIComponent(location.pathname + location.search)}`
    return (
      <SignIn to={`/login${next}`} aria-label={strings.account.signIn} data-print="hide">
        <LogIn size={18} aria-hidden />
        <span>{strings.account.signIn}</span>
      </SignIn>
    )
  }

  const pending = user.applications ?? 0
  return (
    <Wrap ref={wrap} data-print="hide">
      <Trigger
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={strings.account.menu(user.username)}
        onClick={() => setOpen((o) => !o)}
      >
        <UserRound size={18} aria-hidden />
        <Name>{user.username}</Name>
        {pending > 0 && <Count aria-hidden>{pending}</Count>}
        <ChevronDown size={14} aria-hidden />
      </Trigger>
      {open && (
        <Menu role="menu" aria-label={strings.account.menu(user.username)}>
          {can('bookEdit') && (
            <Item role="menuitem" to="/new">
              {strings.account.newConvention}
            </Item>
          )}
          {can('bookImport') && (
            <Item role="menuitem" to="/import">
              {strings.account.importFiles}
            </Item>
          )}
          {(user.admin || can('bookEdit')) && (
            <Item role="menuitem" to="/admin">
              {pending > 0 ? strings.account.adminPending(pending) : strings.account.admin}
            </Item>
          )}
          <Item role="menuitem" to="/account">
            {strings.account.mine}
          </Item>
          <ItemButton
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
          >
            {strings.account.signOut}
          </ItemButton>
        </Menu>
      )}
    </Wrap>
  )
}

const SignIn = styled(Link)`
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  min-height: 36px;
  padding: 0 ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.tag};
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.colors.primarySoft};
  }
  ${mobile} {
    padding: 0 ${({ theme }) => theme.space(2)};
    & > span { display: none; }
  }
`

const Wrap = styled.div`
  position: relative;
  flex: none;
`

const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  min-height: 36px;
  padding: 0 ${({ theme }) => theme.space(2)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.tag};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover,
  &[aria-expanded='true'] {
    background: ${({ theme }) => theme.colors.primarySoft};
  }
`

const Name = styled.span`
  max-width: 8em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${mobile} {
    display: none;
  }
`

const Count = styled.b`
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: ${({ theme }) => theme.shape.tag};
  background: ${({ theme }) => theme.colors.seal};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-size: 0.6875rem;
`

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 60;
  display: grid;
  min-width: 200px;
  padding: ${({ theme }) => theme.space(1)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.popover};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.panel};
`

const itemStyle = `
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 0.9375rem;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
`

const Item = styled(Link)`
  ${itemStyle}
  color: ${({ theme }) => theme.colors.text};
  &:hover {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
  }
`

const ItemButton = styled.button`
  ${itemStyle}
  color: ${({ theme }) => theme.colors.text};
  &:hover {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
  }
`
