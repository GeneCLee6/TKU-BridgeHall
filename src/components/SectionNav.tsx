import { useEffect, useRef, useState, type ReactNode } from 'react'
import styled from 'styled-components'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'

type Item = { id: string; label: string }

/**
 * A long page of panels (我的帳號, 社團管理) with a list of them on the left that stays in view: a
 * wide screen's spare width becomes a way around the page. The list is read from the panels
 * themselves (each `section`'s first `h2`), so a panel that shows only for some members, or loads
 * later, is listed when it is there. The panel being read is marked. Phones get the panels alone.
 */
export function WithSectionNav({ children }: { children: ReactNode }) {
  const body = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<Item[]>([])
  const [current, setCurrent] = useState<string>()

  useEffect(() => {
    const element = body.current
    if (!element) return
    const collect = () => {
      const next: Item[] = []
      element.querySelectorAll<HTMLElement>(':scope > section').forEach((section, i) => {
        const heading = section.querySelector('h2')
        const label = heading?.textContent?.trim()
        if (!label) return
        // Panels without an id of their own get one, so the list can link to them
        if (!section.id) section.id = `part-${i + 1}`
        next.push({ id: section.id, label })
      })
      setItems((old) => (JSON.stringify(old) === JSON.stringify(next) ? old : next))
    }
    collect()
    const observer = new MutationObserver(collect)
    observer.observe(element, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  // The panel being read: the last whose top has passed a little below the header
  useEffect(() => {
    if (!items.length) return
    let frame = 0
    const update = () => {
      frame = 0
      let here = items[0]?.id
      for (const item of items) {
        const top = document.getElementById(item.id)?.getBoundingClientRect().top ?? Infinity
        if (top < 140) here = item.id
      }
      setCurrent(here)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [items])

  return (
    <Layout>
      <Nav aria-label={strings.pages.sections} data-print="hide">
        {items.length > 1 && (
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} aria-current={item.id === current ? 'location' : undefined}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </Nav>
      <Body ref={body}>{children}</Body>
    </Layout>
  )
}

const Layout = styled.div`
  display: grid;
  grid-template-columns: 13rem minmax(0, 1fr);
  gap: ${({ theme }) => theme.space(8)};
  align-items: start;

  ${mobile} {
    grid-template-columns: minmax(0, 1fr);
  }
  @media print {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Nav = styled.nav`
  position: sticky;
  top: calc(${({ theme }) => theme.layout.headerHeight} + ${({ theme }) => theme.space(6)});
  max-height: calc(100vh - ${({ theme }) => theme.layout.headerHeight} - ${({ theme }) => theme.space(12)});
  overflow-y: auto;

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    border-left: 2px solid ${({ theme }) => theme.colors.border};
  }
  a {
    display: block;
    margin-left: -2px;
    padding: ${({ theme }) => theme.space(1.5)} ${({ theme }) => theme.space(3)};
    border-left: 2px solid transparent;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.875rem;
    line-height: 1.4;
    text-decoration: none;
  }
  a:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
  a[aria-current] {
    border-left-color: ${({ theme }) => theme.colors.structure};
    color: ${({ theme }) => theme.colors.primaryStrong};
    font-weight: 600;
  }

  ${mobile} {
    display: none;
  }
  @media print {
    display: none;
  }
`

const Body = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ theme }) => theme.space(5)};
  min-width: 0;

  & > section {
    scroll-margin-top: calc(${({ theme }) => theme.layout.headerHeight} + ${({ theme }) => theme.space(4)});
  }
`
