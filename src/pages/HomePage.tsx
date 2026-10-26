import { BookOpen, FilePlus2, FileUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { KindLevel } from '../components/KindLevel.tsx'
import { Button } from '../components/ui.tsx'
import { conventionPath } from '../lib/sections.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { strings } from '../strings.ts'
import { NotFound, PageBar } from './HandbookShell.tsx'

/**
 * The entrance (e9-t04): what the site is, the way to the whole book, and every category with its
 * conventions as links to their own pages. It loads no convention content. The full home page
 * (profile card, 第一次來, news, recent changes) is e9-t08. Also shown for an unknown address,
 * with a note.
 */
export function HomePage({ notFound = false }: { notFound?: boolean }) {
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
      {categories.map((category) => {
        const items = conventions.filter((c) => c.category === category.id)
        if (!items.length) return null
        return (
          <Category key={category.id} aria-labelledby={`home-cat-${category.id}`}>
            <h2 id={`home-cat-${category.id}`}>
              {category.label}
              <small>{category.description}</small>
            </h2>
            <ul>
              {items.map((c) => (
                <li key={c.slug}>
                  <Link to={conventionPath(c.slug)}>
                    <strong>{c.nameZh}</strong>
                    <small lang="en">{c.nameEn}</small>
                    <KindLevel kind={c.kind} level={c.level} $small />
                  </Link>
                </li>
              ))}
            </ul>
          </Category>
        )
      })}
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

const Category = styled.section`
  margin-bottom: ${({ theme }) => theme.space(8)};

  h2 {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: ${({ theme }) => theme.space(3)};
    margin: 0 0 ${({ theme }) => theme.space(3)};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 1.125rem;
  }
  h2 small {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 0.875rem;
    font-weight: 400;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  ul {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: ${({ theme }) => theme.space(3)};
    margin: 0;
    padding: 0;
    list-style: none;
  }
  a {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space(1)};
    height: 100%;
    padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
    border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.shape.panel};
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;
  }
  a:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  a:hover strong {
    color: ${({ theme }) => theme.colors.primary};
  }
  small {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.8125rem;
  }
`
