import { List, ListTree, MessagesSquare, Search, SlidersHorizontal, UserRound } from 'lucide-react'
import { Link, useMatch } from 'react-router-dom'
import styled from 'styled-components'
import { sendToolbarEvent, toolbarEvents } from '../lib/toolbar.ts'
import { pageStrings } from '../pageStrings.ts'
import { useAuth } from '../state/AuthContext.tsx'

const t = pageStrings.toolbar

/**
 * The phone's bottom toolbar (e9-t09, DESIGN-V2 §7): 目錄 (the catalogue, which slides up as a
 * drawer), 本頁 on a convention page or 我的 elsewhere, 搜尋 (the header's search box) and
 * 閱讀設定, with 討論 (the forum, e11-t15) after the second. Loaded only below the phone breakpoint.
 * The forum's pages have no catalogue drawer nor header search box: there 目錄 goes to the whole book and
 * 搜尋 opens the forum's search page (`onCatalogue` not given, `search` a path).
 */
export function MobileToolbar({
  catalogueOpen = false,
  onCatalogue,
  search: withSearch = true,
}: {
  catalogueOpen?: boolean
  onCatalogue?: (open: boolean) => void
  /** The header's search box; a path (the forum's search page, e11-t18) links there instead */
  search?: boolean | string
}) {
  const { user } = useAuth()
  const onConvention = useMatch('/c/:slug/*')
  const onForum = useMatch('/forum/*')

  const close = () => onCatalogue?.(false)
  const search = () => {
    close()
    // The header stays at the top, so its search box is always in view
    document.getElementById('site-search')?.focus()
  }
  const send = (name: string) => () => {
    close()
    sendToolbarEvent(name)
  }

  return (
    <Bar aria-label={t.label} data-print="hide">
      {onCatalogue ? (
        <Item
          type="button"
          aria-expanded={catalogueOpen}
          aria-controls="catalogue"
          $current={catalogueOpen}
          onClick={() => onCatalogue(!catalogueOpen)}
        >
          <List aria-hidden />
          {t.catalogue}
        </Item>
      ) : (
        <Item as={Link} to="/book">
          <List aria-hidden />
          {t.catalogue}
        </Item>
      )}
      {onConvention ? (
        <Item type="button" data-toolbar="on-this-page" onClick={send(toolbarEvents.onThisPage)}>
          <ListTree aria-hidden />
          {t.onThisPage}
        </Item>
      ) : (
        <Item as={Link} to={user ? '/account' : '/login'}>
          <UserRound aria-hidden />
          {t.mine}
        </Item>
      )}
      <Item as={Link} to="/forum" onClick={close} aria-current={onForum ? 'page' : undefined} $current={!!onForum}>
        <MessagesSquare aria-hidden />
        {t.forum}
      </Item>
      {typeof withSearch === 'string' ? (
        <Item as={Link} to={withSearch} onClick={close}>
          <Search aria-hidden />
          {t.search}
        </Item>
      ) : withSearch && (
        <Item type="button" onClick={search}>
          <Search aria-hidden />
          {t.search}
        </Item>
      )}
      <Item type="button" data-toolbar="reading" onClick={send(toolbarEvents.reading)}>
        <SlidersHorizontal aria-hidden />
        {t.reading}
      </Item>
    </Bar>
  )
}

const Bar = styled.nav`
  position: fixed;
  z-index: 45;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  height: ${({ theme }) => theme.layout.toolbarHeight};
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: content-box;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
`

const Item = styled.button<{ $current?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 44px;
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme, $current }) => ($current ? theme.colors.seal : theme.colors.textMuted)};
  font: inherit;
  font-size: 0.75rem;
  font-weight: ${({ $current }) => ($current ? 600 : 400)};
  text-decoration: none;
  cursor: pointer;

  svg {
    width: 20px;
    height: 20px;
  }
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`
