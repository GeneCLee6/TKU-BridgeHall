import { BookOpen, FilePlus2, FileUp } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { KindLevel } from '../components/KindLevel.tsx'
import { Button } from '../components/ui.tsx'
import { conventionPath } from '../lib/sections.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { usePreferences } from '../state/PreferencesContext.tsx'
import { strings } from '../strings.ts'
import { mobile } from '../styles/tokens.ts'
import { NotFound, PageBar } from './HandbookShell.tsx'

// The blocks beyond the categories load after the page: the home page has a JS budget
const blocks = () => import('./HomeBlocks.tsx')
const ProfileCard = lazy(() => blocks().then((m) => ({ default: m.ProfileCard })))
const FirstSteps = lazy(() => blocks().then((m) => ({ default: m.FirstSteps })))
const RecentChanges = lazy(() => blocks().then((m) => ({ default: m.RecentChanges })))
// 卡片總覽 (e9-t17): only readers who picked that 版面 download it
const CardOverview = lazy(() => import('./CardOverview.tsx').then((m) => ({ default: m.CardOverview })))

/** The home page, or the tiles of 卡片總覽 when the reader picked that 版面 (e9-t15) */
export function HomePage({ notFound = false }: { notFound?: boolean }) {
  const { layout } = usePreferences()
  if (layout === 'cards' && !notFound) return <CardOverview />
  return <Entrance notFound={notFound} />
}

/**
 * The entrance (e9-t08, DESIGN-V2 §5.3): what the site is; in the main column the reader's system
 * profile, 第一次來 and every category with its conventions as links to their own pages; on the
 * right 最近更新 (the club news board takes that place in E11). One column on phones, in the same
 * order. It loads no convention content. Also shown for an unknown address, with a note.
 */
function Entrance({ notFound }: { notFound: boolean }) {
  const { conventions, categories } = useContent()
  const { can } = useAuth()
  const canEdit = can('bookEdit')

  return (
    <>
      <PageBar />
      {notFound && <NotFound role="alert">{strings.notFound}</NotFound>}
      <Intro>
        <h1>
          {strings.appNameZh} <span lang="en">{strings.appNameEn}</span>
        </h1>
        <p>
          {strings.tagline}。{strings.pages.homeIntro}
        </p>
        <Actions data-print="hide">
          <Button as={Link} to="/book" $small $variant="primary">
            <BookOpen size={16} aria-hidden />
            {strings.pages.toBook}
          </Button>
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
        </Actions>
      </Intro>
      <Columns>
        <MainColumn>
          <Suspense fallback={<Reserve $h={9} />}>
            <ProfileCard />
            <FirstSteps />
          </Suspense>
          <Categories>
            {categories.map((category) => {
              const items = conventions.filter((c) => c.category === category.id)
              if (!items.length) return null
              return (
                <Category key={category.id} aria-labelledby={`home-cat-${category.id}`}>
                  <h2 id={`home-cat-${category.id}`}>{category.label}</h2>
                  <p>
                    {category.description}
                    <small>{strings.conventionCount(items.length)}</small>
                  </p>
                  <ul>
                    {items.map((c) => (
                      <li key={c.slug}>
                        <Link to={conventionPath(c.slug)}>
                          <span>{c.nameZh}</span>
                          <KindLevel kind={c.kind} level={c.level} $small />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Category>
              )
            })}
          </Categories>
        </MainColumn>
        <Aside>
          <Suspense fallback={<Reserve $h={12} />}>
            <RecentChanges />
          </Suspense>
        </Aside>
      </Columns>
    </>
  )
}

const Intro = styled.div`
  margin-bottom: ${({ theme }) => theme.space(8)};
  h1 {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.heading};
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

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2)};
  margin-top: ${({ theme }) => theme.space(4)};
`

const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18rem;
  gap: ${({ theme }) => theme.space(8)};
  align-items: start;
  ${mobile} {
    grid-template-columns: minmax(0, 1fr);
  }
`

const MainColumn = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(8)};
  min-width: 0;
`

const Aside = styled.aside`
  min-width: 0;
`

/** Room for a lazy block while it loads, so the page does not jump */
const Reserve = styled.div<{ $h: number }>`
  min-height: ${({ $h }) => $h}rem;
`

const Categories = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: ${({ theme }) => theme.space(3)};
`

const Category = styled.section`
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};

  h2 {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 1.0625rem;
  }
  p {
    display: flex;
    flex-wrap: wrap;
    gap: 0 ${({ theme }) => theme.space(2)};
    margin: ${({ theme }) => theme.space(1)} 0 ${({ theme }) => theme.space(2)};
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  small {
    font-size: inherit;
    color: ${({ theme }) => theme.colors.structure};
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.space(2)};
    min-height: 36px;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;
    ${mobile} {
      min-height: 44px;
    }
  }
  a:hover span {
    color: ${({ theme }) => theme.colors.primary};
  }
`
