import { ArrowRight } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { KindLevel } from '../components/KindLevel.tsx'
import { Badge } from '../components/PendingNote.tsx'
import { Tag, TagList } from '../components/Tag.tsx'
import { Button } from '../components/ui.tsx'
import { conventionPath, sectionPath } from '../lib/sections.ts'
import { useMediaQuery } from '../lib/useMediaQuery.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { pageStrings } from '../pageStrings.ts'
import { useContent } from '../state/ContentContext.tsx'
import { useProfiles } from '../state/ProfileContext.tsx'
import { strings } from '../strings.ts'
import { mobile, mobileQuery } from '../styles/tokens.ts'
import type { ConventionMeta } from '../types/convention.ts'
import { PageBar } from './HandbookShell.tsx'

const ALL = ''
const text = pageStrings.overview

/**
 * 卡片總覽 (e9-t17, DESIGN-V2.md §10.5): the home page of the fourth 版面. Category tabs, a tile
 * per convention with its kind and level, its 待確認 and how many places the reader's system
 * profile overrides; picking a tile previews it in a drawer on the right (summary, tags, the
 * sections as deep links) with a link to its page. On phones the tiles are two columns and open
 * the page itself. Lazy: only readers who chose this 版面 download it.
 */
export function CardOverview() {
  const { conventions, categories } = useContent()
  const { view } = useProfiles()
  const phone = useMediaQuery(mobileQuery)
  const [tab, setTab] = useState(ALL)
  const [picked, setPicked] = useState<string>()
  const tabsId = useId()
  const drawerId = useId()
  usePageTitle(text.title)

  // How many overrides the reader's profile chain makes in each convention
  const overrides = useMemo(() => {
    const count = new Map<string, number>()
    for (const profile of view?.chain ?? [])
      for (const { slug } of profile.overrides) count.set(slug, (count.get(slug) ?? 0) + 1)
    return count
  }, [view])

  const shown = categories.filter((c) => conventions.some((x) => x.category === c.id))
  const current = shown.some((c) => c.id === tab) ? tab : ALL
  const tiles = current === ALL ? conventions : conventions.filter((c) => c.category === current)
  const preview = conventions.find((c) => c.slug === picked)
  const tabs = [{ id: ALL, label: text.all }, ...shown.map((c) => ({ id: c.id, label: c.label }))]

  return (
    <>
      <PageBar lead={<Link to="/book">{text.toBook}</Link>} />
      <Head>
        <h1>{text.title}</h1>
        <p>{text.intro}</p>
      </Head>
      <Tabs role="tablist" aria-label={text.tabs}>
        {tabs.map((t) => (
          <button
            key={t.id || 'all'}
            type="button"
            role="tab"
            id={`${tabsId}-${t.id || 'all'}`}
            aria-selected={current === t.id}
            aria-controls={`${tabsId}-panel`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </Tabs>
      <Body $drawer={!phone}>
        <section id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${current || 'all'}`}>
          <Count>{text.tiles(tiles.length)}</Count>
          <Tiles>
            {tiles.map((c) => {
              const inner = <TileBody convention={c} overrides={overrides.get(c.slug) ?? 0} />
              return (
                <li key={c.slug}>
                  {phone ? (
                    <Tile as={Link} to={conventionPath(c.slug)}>
                      {inner}
                    </Tile>
                  ) : (
                    <Tile
                      type="button"
                      aria-pressed={picked === c.slug}
                      aria-controls={drawerId}
                      onClick={() => setPicked(c.slug)}
                    >
                      {inner}
                    </Tile>
                  )}
                </li>
              )
            })}
          </Tiles>
        </section>
        {!phone && (
          <Drawer id={drawerId} aria-label={text.preview} aria-live="polite">
            {preview ? <Preview convention={preview} /> : <Hint>{text.pick}</Hint>}
          </Drawer>
        )}
      </Body>
    </>
  )
}

function TileBody({ convention: c, overrides }: { convention: ConventionMeta; overrides: number }) {
  return (
    <>
      <strong>{c.nameZh}</strong>
      <small lang="en">{c.nameEn}</small>
      <Marks>
        <KindLevel kind={c.kind} level={c.level} $small />
        {c.pending.length > 0 && <Badge>{strings.pendingCount(c.pending.length)}</Badge>}
        {overrides > 0 && <Override>{text.overrides(overrides)}</Override>}
      </Marks>
    </>
  )
}

function Preview({ convention: c }: { convention: ConventionMeta }) {
  return (
    <>
      <h2>{c.nameZh}</h2>
      <p lang="en">{c.nameEn}</p>
      <KindLevel kind={c.kind} level={c.level} $small />
      <p>{c.summary}</p>
      {c.tags.length > 0 && (
        <TagList aria-label={text.tags}>
          {c.tags.map((t) => (
            <Tag key={t} label={t} />
          ))}
        </TagList>
      )}
      {c.outline.length > 0 && (
        <>
          <h3>{text.sections}</h3>
          <ol>
            {c.outline.map((s) => (
              <li key={s.id}>
                <Link to={sectionPath(c.slug, s.id)}>{s.title}</Link>
              </li>
            ))}
          </ol>
        </>
      )}
      <Button as={Link} to={conventionPath(c.slug)} $variant="primary">
        {text.open}
        <ArrowRight size={16} aria-hidden />
      </Button>
    </>
  )
}

const Head = styled.div`
  margin-bottom: ${({ theme }) => theme.space(4)};
  h1 {
    margin: 0;
    font-size: 1.75rem;
    color: ${({ theme }) => theme.colors.primaryStrong};
  }
  p {
    margin: ${({ theme }) => theme.space(1)} 0 0;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const Tabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1)};
  margin-bottom: ${({ theme }) => theme.space(4)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  button {
    min-height: 40px;
    padding: 0 ${({ theme }) => theme.space(3)};
    border: 0;
    border-bottom: 3px solid transparent;
    background: transparent;
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 600;
    cursor: pointer;
  }
  button:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
  button[aria-selected='true'] {
    border-bottom-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`

const Body = styled.div<{ $drawer: boolean }>`
  display: grid;
  grid-template-columns: ${({ $drawer }) => ($drawer ? 'minmax(0, 1fr) 22rem' : 'minmax(0, 1fr)')};
  gap: ${({ theme }) => theme.space(6)};
  align-items: start;
`

const Count = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(2)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
`

const Tiles = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  gap: ${({ theme }) => theme.space(3)};
  margin: 0;
  padding: 0;
  list-style: none;

  ${mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${({ theme }) => theme.space(2)};
  }
`

const Tile = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space(1)};
  width: 100%;
  height: 100%;
  padding: ${({ theme }) => theme.space(3)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.panel};
  color: ${({ theme }) => theme.colors.text};
  text-align: left;
  text-decoration: none;
  cursor: pointer;

  strong {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-weight: ${({ theme }) => theme.headingWeight};
    line-height: 1.4;
  }
  small {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.8125rem;
    line-height: 1.4;
  }
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  &[aria-pressed='true'] {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primarySoft};
  }
`

const Marks = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(2)};
  margin-top: auto;
  padding-top: ${({ theme }) => theme.space(1)};
`

const Override = styled.span`
  padding-left: ${({ theme }) => theme.space(2)};
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.75rem;
  font-weight: 600;
`

const Drawer = styled.aside`
  position: sticky;
  top: ${({ theme }) => theme.space(4)};
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  justify-items: start;
  max-height: calc(100vh - ${({ theme }) => theme.layout.headerHeight} - ${({ theme }) => theme.space(8)});
  overflow-y: auto;
  padding: ${({ theme }) => theme.space(5)};
  border-left: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.shape.panel};
  box-shadow: ${({ theme }) => theme.shadows.panel};

  h2,
  h3,
  p,
  ol {
    margin: 0;
  }
  h2 {
    font-size: 1.375rem;
    color: ${({ theme }) => theme.colors.primaryStrong};
  }
  h2 + p {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.875rem;
  }
  h3 {
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.structure};
  }
  ol {
    padding-left: ${({ theme }) => theme.space(5)};
    font-size: 0.9375rem;
  }
`

const Hint = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
`
