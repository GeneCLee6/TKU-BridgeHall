import { FilePlus2, FileUp } from 'lucide-react'
import { lazy, startTransition, Suspense, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { AppHeader } from '../components/AppHeader.tsx'
import { ConventionCard } from '../components/ConventionCard.tsx'
import { Sidebar } from '../components/Sidebar.tsx'
import { ViewActions } from '../components/ViewActions.tsx'
import { Button } from '../components/ui.tsx'
import { references } from '../content/references.ts'
import { formatDateTime } from '../lib/format.ts'
import { useMediaQuery } from '../lib/useMediaQuery.ts'
import {
  allKeys,
  conventionDomId,
  conventionKey,
  findSectionPath,
  sectionDomId,
  sectionKey,
} from '../lib/sections.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent, useConvention } from '../state/ContentContext.tsx'
import { useExpansion } from '../state/ExpansionContext.tsx'
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
 * The whole handbook on one page, Swagger style. The route only decides what to open and scroll
 * to: /c/:slug opens a convention, /c/:slug/:sectionId opens the path down to that section.
 * The conventions are the bundled ones with the online changes laid over them (ContentContext);
 * the page starts from the manifest and each card loads its content when it opens. Inside
 * ProfiledContent (App.tsx) all of it is the reader's system profile's view (e1-t11).
 */
export function HandbookPage() {
  const { conventions, categories, bySlug: conventionBySlug, loadAll, online, status, skipped } = useContent()
  const { can } = useAuth()
  const { slug, sectionId } = useParams()
  const [searchParams] = useSearchParams()
  const pendingIndex = searchParams.get('pending')
  const { open, closeAll } = useExpansion()
  // Opening everything is the heaviest update on the page: as a transition the button
  // responds at once and the page stays usable while React renders.
  const expandAll = () => startTransition(() => open(conventions.flatMap(allKeys)))
  const collapseAll = () => startTransition(closeAll)
  const [menuOpen, setMenuOpen] = useState(false)
  // Focusing the search box downloads the search code and index (state/useSearch.ts)
  const { search, prepare: prepareSearch } = useSearch()
  // Printing shows every convention, so everything is loaded first
  const print = () =>
    void loadAll()
      .catch(() => {})
      .then(() => window.requestAnimationFrame(() => window.print()))
  const canEdit = can('bookEdit')
  const onlineNote = (s: string) => {
    const info = online.get(s)
    if (!info || info.hidden) return undefined
    return (info.added ? strings.online.added : strings.online.edited)(info.updatedBy, formatDateTime(info.updatedAt))
  }
  const isMobile = useMediaQuery(mobileQuery)
  const profiles = useProfiles()
  const profileSwitch = (variant: 'bar' | 'menu') =>
    profiles.list.length > 1 && (
      <Suspense fallback={null}>
        <ProfileSwitch variant={variant} />
      </Suspense>
    )

  const convention = slug ? conventionBySlug(slug) : undefined
  // The linked convention's content: the scroll waits for it, as the section is not there before
  const target = useConvention(slug)
  const ready = Boolean(target.convention) || target.failed
  const path = convention && sectionId ? findSectionPath(convention, sectionId) : []
  const notFound = (slug && !convention) || (sectionId && path.length === 0)

  // Open the path to the link at once; the scroll below waits for the content. Both depend on the
  // manifest entry itself, which stays the same object while other conventions load.
  useEffect(() => {
    const target = convention
    if (!target) return
    const trail = sectionId ? findSectionPath(target, sectionId) : []
    open([conventionKey(target.slug), ...trail.map((s) => sectionKey(target.slug, s.id))])
  }, [sectionId, open, convention])

  useEffect(() => {
    const target = convention
    if (!target || !ready) return
    const trail = sectionId ? findSectionPath(target, sectionId) : []
    const domId =
      sectionId && trail.length
        ? sectionDomId(target.slug, sectionId)
        : conventionDomId(target.slug)
    // Wait one frame so the newly opened content has its height before scrolling
    const frame = window.requestAnimationFrame(() => {
      const el = document.getElementById(domId)
      // ?pending=k points at the k-th 待確認 note that belongs directly to the section
      // (notes inside its child sections belong to those children)
      const note =
        el && pendingIndex !== null
          ? [...el.querySelectorAll<HTMLElement>('[data-pending]')].filter(
              (n) => n.parentElement?.closest('[data-section]') === el,
            )[Number(pendingIndex)]
          : undefined
      ;(note ?? el)?.scrollIntoView?.({ block: note ? 'center' : 'start', behavior: 'smooth' })
      el?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })
      note?.animate?.(
        [
          { outline: '3px solid currentColor', outlineOffset: '2px' },
          { outline: '3px solid transparent' },
        ],
        { duration: 1800, easing: 'ease-out' },
      )
    })
    return () => window.cancelAnimationFrame(frame)
  }, [sectionId, pendingIndex, convention, ready])

  return (
    <>
      <SkipLink href="#main">{strings.skipToContent}</SkipLink>
      <AppHeader
        search={search}
        onSearchFocus={prepareSearch}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((o) => !o)}
        actions={
          !isMobile && (
            <>
              {profileSwitch('bar')}
              <ViewActions
                variant="bar"
                onExpandAll={expandAll}
                onCollapseAll={collapseAll}
                onPrint={print}
              />
            </>
          )
        }
        account={<AccountCorner />}
      />
      <Layout>
        <Sidebar
          categories={categories}
          conventions={conventions}
          references={references}
          open={menuOpen}
          onNavigate={() => setMenuOpen(false)}
          actions={
            isMobile && (
              <>
                {profileSwitch('menu')}
                <ViewActions
                  variant="menu"
                  onExpandAll={() => {
                    expandAll()
                    setMenuOpen(false)
                  }}
                  onCollapseAll={() => {
                    collapseAll()
                    setMenuOpen(false)
                  }}
                />
              </>
            )
          }
        />
        {menuOpen && <Scrim aria-hidden onClick={() => setMenuOpen(false)} data-print="hide" />}
        <Main id="main" tabIndex={-1} aria-busy={profiles.status === 'loading'} $busy={profiles.status === 'loading'}>
          <Intro>
            <h1>
              {strings.appNameZh} <span lang="en">{strings.appNameEn}</span>
            </h1>
            <p>{strings.tagline}。點開特約查看答叫原則與叫牌範例，每個段落都有可分享的連結。</p>
            {(canEdit || can('bookImport')) && (
              <EditorBar data-print="hide">
                {canEdit && (
                  <Button as={Link} to="/new" $small>
                    <FilePlus2 size={16} aria-hidden />
                    {strings.account.newConvention}
                  </Button>
                )}
                {can('bookImport') && (
                  <Button as={Link} to="/import" $small>
                    <FileUp size={16} aria-hidden />
                    {strings.account.importFiles}
                  </Button>
                )}
              </EditorBar>
            )}
          </Intro>
          {status === 'offline' && <Status role="status">{strings.online.offline}</Status>}
          {profiles.status === 'failed' && <Status role="status">{strings.profiles.failed}</Status>}
          {canEdit && skipped.length > 0 && <Status role="status">{strings.online.skipped(skipped.length)}</Status>}
          {notFound && <NotFound role="alert">{strings.notFound}</NotFound>}
          {categories.map((category) => {
            const items = conventions.filter((c) => c.category === category.id)
            if (!items.length) return null
            return (
              <Group key={category.id} aria-labelledby={`cat-${category.id}`}>
                <GroupHeading id={`cat-${category.id}`}>
                  {category.label}
                  <small>{category.description}</small>
                </GroupHeading>
                {items.map((c) => (
                  <ConventionCard
                    key={c.slug}
                    convention={c}
                    editPath={canEdit ? `/edit/${c.slug}` : undefined}
                    online={onlineNote(c.slug)}
                  />
                ))}
              </Group>
            )
          })}
        </Main>
      </Layout>
    </>
  )
}

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

const Intro = styled.div`
  margin-bottom: ${({ theme }) => theme.space(6)};
  h1 {
    margin: 0;
    font-size: 1.75rem;
    color: ${({ theme }) => theme.colors.primaryStrong};
  }
  h1 span {
    font-size: 1.125rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  p {
    margin: ${({ theme }) => theme.space(1)} 0 0;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const EditorBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2)};
  margin-top: ${({ theme }) => theme.space(3)};
`

const Status = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.pendingBg};
  color: ${({ theme }) => theme.colors.pendingText};
`

const NotFound = styled.p`
  padding: ${({ theme }) => theme.space(3)};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.warningBg};
`

const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(4)};
  margin-bottom: ${({ theme }) => theme.space(10)};
`

const GroupHeading = styled.h2`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.space(3)};
  margin: 0;
  font-size: 1.125rem;

  small {
    font-size: 0.875rem;
    font-weight: 400;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`
