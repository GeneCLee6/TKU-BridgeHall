import { List, ListTree, Search, SlidersHorizontal, UserRound } from 'lucide-react'
import { Link, useMatch } from 'react-router-dom'
import styled from 'styled-components'
import { sendToolbarEvent, toolbarEvents } from '../lib/toolbar.ts'
import { pageStrings } from '../pageStrings.ts'
import { useAuth } from '../state/AuthContext.tsx'

const t = pageStrings.toolbar

/**
 * The phone's bottom toolbar (e9-t09, DESIGN-V2 §7): 目錄 (the catalogue, which slides up as a
 * drawer), 本頁 on a convention page or 我的 elsewhere, 搜尋 (the header's search box) and
 * 閱讀設定. Loaded only below the phone breakpoint. 討論 joins it with the forum (G6).
 */
export function MobileToolbar({
  catalogueOpen,
  onCatalogue,
}: {
  catalogueOpen: boolean
  onCatalogue: (open: boolean) => void
}) {
  const { user } = useAuth()
  const onConvention = useMatch('/c/:slug/*')

  const search = () => {
    onCatalogue(false)
    // The header stays at the top, so its search box is always in view
    document.getElementById('site-search')?.focus()
  }
  const send = (name: string) => () => {
    onCatalogue(false)
    sendToolbarEvent(name)
  }

  return (
    <Bar aria-label={t.label} data-print="hide">
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
      <Item type="button" onClick={search}>
        <Search aria-hidden />
        {t.search}
      </Item>
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
  grid-template-columns: repeat(4, 1fr);
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
