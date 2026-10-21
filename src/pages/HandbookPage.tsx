import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { AppHeader } from '../components/AppHeader.tsx'
import { ConventionCard } from '../components/ConventionCard.tsx'
import { Sidebar } from '../components/Sidebar.tsx'
import { categories, conventionBySlug, conventions } from '../content/index.ts'
import { createSearch } from '../lib/search.ts'
import {
  allKeys,
  conventionDomId,
  conventionKey,
  findSectionPath,
  sectionDomId,
  sectionKey,
} from '../lib/sections.ts'
import { useExpansion } from '../state/ExpansionContext.tsx'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'

/**
 * The whole handbook on one page, Swagger style. The route only decides what to open and scroll
 * to: /c/:slug opens a convention, /c/:slug/:sectionId opens the path down to that section.
 */
export function HandbookPage() {
  const { slug, sectionId } = useParams()
  const { open, closeAll } = useExpansion()
  const [menuOpen, setMenuOpen] = useState(false)
  const search = useMemo(() => createSearch(conventions), [])

  const convention = slug ? conventionBySlug(slug) : undefined
  const path = convention && sectionId ? findSectionPath(convention, sectionId) : []
  const notFound = (slug && !convention) || (sectionId && path.length === 0)

  useEffect(() => {
    const target = slug ? conventionBySlug(slug) : undefined
    if (!target) return
    const trail = sectionId ? findSectionPath(target, sectionId) : []
    open([conventionKey(target.slug), ...trail.map((s) => sectionKey(target.slug, s.id))])
    const domId =
      sectionId && trail.length ? sectionDomId(target.slug, sectionId) : conventionDomId(target.slug)
    // Wait one frame so the newly opened content has its height before scrolling
    const frame = window.requestAnimationFrame(() => {
      const el = document.getElementById(domId)
      el?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
      el?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [slug, sectionId, open])

  return (
    <>
      <SkipLink href="#main">{strings.skipToContent}</SkipLink>
      <AppHeader
        search={search}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((o) => !o)}
        onExpandAll={() => open(conventions.flatMap(allKeys))}
        onCollapseAll={closeAll}
      />
      <Layout>
        <Sidebar
          categories={categories}
          conventions={conventions}
          open={menuOpen}
          onNavigate={() => setMenuOpen(false)}
        />
        {menuOpen && <Scrim aria-hidden onClick={() => setMenuOpen(false)} data-print="hide" />}
        <Main id="main" tabIndex={-1}>
          <Intro>
            <h1>
              {strings.appNameZh} <span lang="en">{strings.appNameEn}</span>
            </h1>
            <p>{strings.tagline}。點開特約查看答叫原則與叫牌範例，每個段落都有可分享的連結。</p>
          </Intro>
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
                  <ConventionCard key={c.slug} convention={c} />
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
  padding: ${({ theme }) => theme.space(6)} ${({ theme }) => theme.space(6)} ${({ theme }) => theme.space(16)};
  outline: none;

  ${mobile} {
    padding: ${({ theme }) => theme.space(4)} ${({ theme }) => theme.space(4)} ${({ theme }) => theme.space(12)};
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
