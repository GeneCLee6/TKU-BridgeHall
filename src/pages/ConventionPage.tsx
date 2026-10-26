import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { ConventionCard } from '../components/ConventionCard.tsx'
import { allKeys, conventionDomId, conventionKey, findSectionPath, sectionDomId, sectionKey } from '../lib/sections.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent, useConvention } from '../state/ContentContext.tsx'
import { useExpansion } from '../state/ExpansionContext.tsx'
import { strings } from '../strings.ts'
import { HomePage } from './HomePage.tsx'
import { NotFound, PageBar, useOnlineNote } from './HandbookShell.tsx'

/**
 * One convention on its own page (e9-t04): /c/:slug opens it, /c/:slug/:sectionId also opens the
 * path down to that section, scrolls to it and focuses its heading; ?pending=k picks the k-th
 * 待確認 note of the section. Loaded lazily, so the home page carries none of the card code.
 * The three-column layout is e9-t05.
 */
export function ConventionPage() {
  const { bySlug, categories } = useContent()
  const { can } = useAuth()
  const { slug = '', sectionId } = useParams()
  const [searchParams] = useSearchParams()
  const pendingIndex = searchParams.get('pending')
  const { open, close } = useExpansion()
  const onlineNote = useOnlineNote()

  const convention = bySlug(slug)
  // The convention's content: the scroll waits for it, as the section is not there before
  const target = useConvention(convention ? slug : undefined)
  const ready = Boolean(target.convention) || target.failed
  const path = convention && sectionId ? findSectionPath(convention, sectionId) : []
  usePageTitle(convention?.nameZh)

  // Open the path to the link at once; the scroll below waits for the content. Both depend on the
  // manifest entry itself, which stays the same object while other conventions load.
  useEffect(() => {
    if (!convention) return
    const trail = sectionId ? findSectionPath(convention, sectionId) : []
    open([conventionKey(convention.slug), ...trail.map((s) => sectionKey(convention.slug, s.id))])
  }, [sectionId, open, convention])

  useEffect(() => {
    if (!convention || !ready) return
    const trail = sectionId ? findSectionPath(convention, sectionId) : []
    const domId = sectionId && trail.length ? sectionDomId(convention.slug, sectionId) : conventionDomId(convention.slug)
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

  if (!convention) return <HomePage notFound />

  const keys = allKeys(convention)
  const category = categories.find((c) => c.id === convention.category)
  return (
    <>
      <PageBar
        lead={
          <Trail aria-label={strings.pages.trail}>
            <Link to="/book">{strings.pages.book}</Link>
            {category && (
              <>
                <span aria-hidden> › </span>
                {category.label}
              </>
            )}
          </Trail>
        }
        onExpandAll={() => open(keys)}
        onCollapseAll={() => close(keys.slice(1))}
        // Only this convention is on the page, and it is open, so its content is there to print
        onPrint={() => window.print()}
      />
      {sectionId && path.length === 0 && <NotFound role="alert">{strings.notFound}</NotFound>}
      <ConventionCard
        key={convention.slug}
        convention={convention}
        editPath={can('bookEdit') ? `/edit/${convention.slug}` : undefined}
        online={onlineNote(convention.slug)}
      />
    </>
  )
}

const Trail = styled.nav`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};

  a {
    color: ${({ theme }) => theme.colors.primary};
  }
`
