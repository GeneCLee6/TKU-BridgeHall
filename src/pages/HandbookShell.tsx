import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { AppHeader } from '../components/AppHeader.tsx'
import { ProfilePill } from '../components/ProfilePill.tsx'
import { ReadingSettingsButton, type ReadingActions } from '../components/ReadingSettingsButton.tsx'
import { Sidebar } from '../components/Sidebar.tsx'
import { references } from '../content/references.ts'
import { formatDateTime } from '../lib/format.ts'
import { useMediaQuery } from '../lib/useMediaQuery.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { usePreferences } from '../state/PreferencesContext.tsx'
import { useProfiles } from '../state/ProfileContext.tsx'
import { useSearch } from '../state/useSearch.ts'
import { strings } from '../strings.ts'
import { mobile, mobileQuery } from '../styles/tokens.ts'
import { AccountCorner } from './Frame.tsx'

// Only signed-in readers with more than one profile see the menu (e1-t12)
const ProfileSwitch = lazy(() =>
  import('../components/ProfileSwitch.tsx').then((m) => ({ default: m.ProfileSwitch })),
)
// A signed-out reader's first visit only (e4-t03)
const NewcomerPrompt = lazy(() =>
  import('../components/NewcomerPrompt.tsx').then((m) => ({ default: m.NewcomerPrompt })),
)
// Phones only (e9-t09)
const MobileToolbar = lazy(() =>
  import('../components/MobileToolbar.tsx').then((m) => ({ default: m.MobileToolbar })),
)

/**
 * The frame the reading pages share (e9-t04): header, catalogue and the main column, with the
 * page itself (home, one convention, the whole book) in the Outlet. It stays mounted while the
 * reader moves between pages, so the catalogue keeps what it has open. Inside ProfiledContent
 * (App.tsx), so everything here is the reader's system profile's view (e1-t11).
 */
export function HandbookShell() {
  const { conventions, categories, status, skipped } = useContent()
  const { can, user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  // Esc closes the phone's catalogue drawer and gives the focus back to the toolbar (e9-t13)
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      document.querySelector<HTMLElement>('[aria-controls="catalogue"]')?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])
  // Focusing the search box downloads the search code and index (state/useSearch.ts)
  const { search, prepare: prepareSearch } = useSearch()
  const isMobile = useMediaQuery(mobileQuery)
  // 版面 (e9-t15): 專注單欄 and 卡片總覽 have no catalogue column; phones keep their drawer
  const { layout, newcomerAsked } = usePreferences()
  const catalogue = isMobile || layout === 'whole' || layout === 'three'
  const home = useLocation().pathname === '/'
  // Without the catalogue the column is centred: a book's measure for a page, room for the tiles at home
  const measure = catalogue ? undefined : home ? (layout === 'cards' ? '84rem' : undefined) : '48rem'
  const profiles = useProfiles()
  const choosable = profiles.list.length > 1
  const profileSwitch = (variant: 'bar' | 'menu') => (
    <Suspense fallback={null}>
      <ProfileSwitch variant={variant} />
    </Suspense>
  )

  return (
    <>
      <SkipLink href="#main">{strings.skipToContent}</SkipLink>
      <AppHeader
        search={search}
        onSearchFocus={prepareSearch}
        profile={!isMobile && (choosable ? profileSwitch('bar') : <ProfilePill />)}
        account={<AccountCorner />}
      />
      <Layout>
        {catalogue && (
          <Sidebar
            categories={categories}
            conventions={conventions}
            references={references}
            open={menuOpen}
            onNavigate={() => setMenuOpen(false)}
            actions={isMobile && choosable && profileSwitch('menu')}
          />
        )}
        {menuOpen && <Scrim aria-hidden onClick={() => setMenuOpen(false)} data-print="hide" />}
        <Main
          id="main"
          tabIndex={-1}
          aria-busy={profiles.status === 'loading'}
          $busy={profiles.status === 'loading'}
          $measure={measure}
        >
          {status === 'offline' && <Status role="status">{strings.online.offline}</Status>}
          {profiles.status === 'failed' && <Status role="status">{strings.profiles.failed}</Status>}
          {can('bookEdit') && skipped.length > 0 && (
            <Status role="status">{strings.online.skipped(skipped.length)}</Status>
          )}
          {user === null && !newcomerAsked && (
            <Suspense fallback={null}>
              <NewcomerPrompt />
            </Suspense>
          )}
          <Suspense fallback={<p role="status">{strings.loading}</p>}>
            <Outlet />
          </Suspense>
        </Main>
      </Layout>
      {isMobile && (
        <Suspense fallback={null}>
          <MobileToolbar catalogueOpen={menuOpen} onCatalogue={setMenuOpen} />
        </Suspense>
      )}
    </>
  )
}

/**
 * The line at the top of the whole book: where the reader is on the left, the 閱讀設定 button on
 * the right. The convention page has its own (e9-t05), with the button in its 本頁 column.
 */
export function PageBar({ lead, ...actions }: ReadingActions & { lead?: ReactNode }) {
  return (
    <Bar>
      <div>{lead}</div>
      <ReadingSettingsButton toolbar {...actions} />
    </Bar>
  )
}

/** Who changed a convention online and when, for its card; nothing for the bundled version */
// oxlint-disable-next-line react/only-export-components
export function useOnlineNote() {
  const { online } = useContent()
  return (slug: string) => {
    const info = online.get(slug)
    if (!info || info.hidden) return undefined
    return (info.added ? strings.online.added : strings.online.edited)(
      info.updatedBy,
      formatDateTime(info.updatedAt),
    )
  }
}

export const NotFound = styled.p`
  padding: ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.warningBg};
`

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
  min-height: 36px;
  margin-bottom: ${({ theme }) => theme.space(4)};
`

const SkipLink = styled.a`
  position: absolute;
  left: -9999px;
  &:focus {
    left: 8px;
    top: 8px;
    z-index: 100;
    padding: 8px 12px;
    background: ${({ theme }) => theme.colors.surface};
  }
`

const Layout = styled.div`
  display: flex;
  min-height: calc(100vh - ${({ theme }) => theme.layout.headerHeight});
`

const Scrim = styled.div`
  display: none;
  ${mobile} {
    display: block;
    position: fixed;
    inset: 0 0 ${({ theme }) => theme.layout.toolbarHeight} 0;
    z-index: 35;
    background: ${({ theme }) => theme.colors.overlay};
  }
`

const Main = styled.main<{ $busy: boolean; $measure?: string }>`
  flex: 1;
  /* Centred in the room the catalogue leaves, so a wide screen is not all empty on the right */
  margin: 0 auto;
  /* Switching profiles dims the page until the new one has loaded */
  opacity: ${({ $busy }) => ($busy ? 0.55 : 1)};
  transition: opacity 150ms ease;
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
  min-width: 0;
  max-width: ${({ theme, $measure }) => $measure ?? theme.layout.contentMax};
  padding: ${({ theme }) => theme.space(6)} ${({ theme }) => theme.space(6)}
    ${({ theme }) => theme.space(16)};
  outline: none;

  ${mobile} {
    padding: ${({ theme }) => theme.space(4)} ${({ theme }) => theme.space(4)}
      calc(${({ theme }) => theme.space(12)} + ${({ theme }) => theme.layout.toolbarHeight});
  }
`

const Status = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.pendingBg};
  color: ${({ theme }) => theme.colors.pendingText};
`
