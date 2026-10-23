import { FilePlus2, FileUp } from 'lucide-react'
import { startTransition, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { AppHeader } from '../components/AppHeader.tsx'
import { ConventionCard } from '../components/ConventionCard.tsx'
import { Sidebar } from '../components/Sidebar.tsx'
import { ViewActions } from '../components/ViewActions.tsx'
import { Button } from '../components/ui.tsx'
import { categories, references } from '../content/index.ts'
import { formatDateTime } from '../lib/format.ts'
import { createSearch } from '../lib/search.ts'
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
import { useContent } from '../state/ContentContext.tsx'
import { useExpansion } from '../state/ExpansionContext.tsx'
import { strings } from '../strings.ts'
import { mobile, mobileQuery } from '../styles/tokens.ts'
import { AccountCorner } from './Frame.tsx'

/**
 * The whole handbook on one page, Swagger style. The route only decides what to open and scroll
 * to: /c/:slug opens a convention, /c/:slug/:sectionId opens the path down to that section.
 * The conventions are the bundled ones with the online changes laid over them (ContentContext).
 */
export function HandbookPage() {
  const { conventions, bySlug: conventionBySlug, online, status, skipped } = useContent()
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
  const search = useMemo(() => createSearch(conventions), [conventions])
  const canEdit = can('bookEdit')
  const onlineNote = (s: string) => {
    const info = online.get(s)
    if (!info || info.hidden) return undefined
    return (info.added ? strings.online.added : strings.online.edited)(info.updatedBy, formatDateTime(info.updatedAt))
  }
  const isMobile = useMediaQuery(mobileQuery)

  const convention = slug ? conventionBySlug(slug) : undefined
  const path = convention && sectionId ? findSectionPath(convention, sectionId) : []
  const notFound = (slug && !convention) || (sectionId && path.length === 0)

  useEffect(() => {
    const target = slug ? conventionBySlug(slug) : undefined
    if (!target) return
    const trail = sectionId ? findSectionPath(target, sectionId) : []
    open([conventionKey(target.slug), ...trail.map((s) => sectionKey(target.slug, s.id))])
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
  }, [slug, sectionId, pendingIndex, open, conventionBySlug])

  return (
    <>
      <SkipLink href="#main">{strings.skipToContent}</SkipLink>
      <AppHeader
        search={search}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((o) => !o)}
        actions={
          !isMobile && (
            <ViewActions variant="bar" onExpandAll={expandAll} onCollapseAll={collapseAll} />
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
            )
          }
        />
        {menuOpen && <Scrim aria-hidden onClick={() => setMenuOpen(false)} data-print="hide" />}
        <Main id="main" tabIndex={-1}>
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

const Main = styled.main`
  flex: 1;
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
