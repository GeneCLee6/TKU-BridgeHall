import { lazy, Suspense, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
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
import { useProfiles } from '../state/ProfileContext.tsx'
import { useSearch } from '../state/useSearch.ts'
import { strings } from '../strings.ts'
import { mobile, mobileQuery } from '../styles/tokens.ts'
import { AccountCorner } from './Frame.tsx'

// Only signed-in readers with more than one profile see the menu (e1-t12)
const ProfileSwitch = lazy(() =>
  import('../components/ProfileSwitch.tsx').then((m) => ({ default: m.ProfileSwitch })),
)

/**
 * The frame the reading pages share (e9-t04): header, catalogue and the main column, with the
 * page itself (home, one convention, the whole book) in the Outlet. It stays mounted while the
 * reader moves between pages, so the catalogue keeps what it has open. Inside ProfiledContent
 * (App.tsx), so everything here is the reader's system profile's view (e1-t11).
 */
export function HandbookShell() {
  const { conventions, categories, status, skipped } = useContent()
  const { can } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  // Focusing the search box downloads the search code and index (state/useSearch.ts)
  const { search, prepare: prepareSearch } = useSearch()
  const isMobile = useMediaQuery(mobileQuery)
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
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((o) => !o)}
        profile={!isMobile && (choosable ? profileSwitch('bar') : <ProfilePill />)}
        account={<AccountCorner />}
      />
      <Layout>
        <Sidebar
          categories={categories}
          conventions={conventions}
          references={references}
          open={menuOpen}
          onNavigate={() => setMenuOpen(false)}
          actions={isMobile && choosable && profileSwitch('menu')}
        />
        {menuOpen && <Scrim aria-hidden onClick={() => setMenuOpen(false)} data-print="hide" />}
        <Main id="main" tabIndex={-1} aria-busy={profiles.status === 'loading'} $busy={profiles.status === 'loading'}>
          {status === 'offline' && <Status role="status">{strings.online.offline}</Status>}
          {profiles.status === 'failed' && <Status role="status">{strings.profiles.failed}</Status>}
          {can('bookEdit') && skipped.length > 0 && (
            <Status role="status">{strings.online.skipped(skipped.length)}</Status>
          )}
          <Suspense fallback={<p role="status">{strings.loading}</p>}>
            <Outlet />
          </Suspense>
        </Main>
      </Layout>
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
      <ReadingSettingsButton {...actions} />
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
    return (info.added ? strings.online.added : strings.online.edited)(info.updatedBy, formatDateTime(info.updatedAt))
  }
}

export const NotFound = styled.p`
  padding: ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.radius.sm};
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
    inset: ${({ theme }) => theme.layout.headerHeight} 0 0 0;
    z-index: 35;
    background: ${({ theme }) => theme.colors.overlay};
  }
`

const Main = styled.main<{ $busy: boolean }>`
  flex: 1;
  /* Switching profiles dims the page until the new one has loaded */
  opacity: ${({ $busy }) => ($busy ? 0.55 : 1)};
  transition: opacity 150ms ease;
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
  min-width: 0;
  max-width: ${({ theme }) => theme.layout.contentMax};
  padding: ${({ theme }) => theme.space(6)} ${({ theme }) => theme.space(6)}
    ${({ theme }) => theme.space(16)};
  outline: none;

  ${mobile} {
    padding: ${({ theme }) => theme.space(4)} ${({ theme }) => theme.space(4)}
      ${({ theme }) => theme.space(12)};
  }
`

const Status = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.pendingBg};
  color: ${({ theme }) => theme.colors.pendingText};
`
