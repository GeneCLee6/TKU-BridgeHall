import { startTransition } from 'react'
import styled from 'styled-components'
import { ConventionCard } from '../components/ConventionCard.tsx'
import { allKeys } from '../lib/sections.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { useExpansion } from '../state/ExpansionContext.tsx'
import { strings } from '../strings.ts'
import { PageBar, useOnlineNote } from './HandbookShell.tsx'

/**
 * /book, the whole book on one page (e9-t04): every convention as a collapsed card under its
 * category, as the handbook was before the split. Each card loads its content when it opens;
 * 印整本 loads all of it first. Loaded lazily, like the convention page.
 */
export function BookPage() {
  const { conventions, categories, loadAll } = useContent()
  const { can } = useAuth()
  const { open, closeAll } = useExpansion()
  const onlineNote = useOnlineNote()
  const canEdit = can('bookEdit')
  usePageTitle(strings.pages.book)

  return (
    <>
      <PageBar
        // Opening everything is the heaviest update on the page: as a transition the panel closes
        // at once and the page stays usable while React renders.
        onExpandAll={() => startTransition(() => open(conventions.flatMap(allKeys)))}
        onCollapseAll={() => startTransition(closeAll)}
        // Printing shows every convention, so everything is loaded first
        onPrint={() =>
          void loadAll()
            .catch(() => {})
            .then(() => window.requestAnimationFrame(() => window.print()))
        }
        printLabel={strings.reading.printBook}
      />
      <Intro>
        <h1>{strings.pages.book}</h1>
        <p>{strings.pages.bookIntro}</p>
      </Intro>
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
    </>
  )
}

const Intro = styled.div`
  margin-bottom: ${({ theme }) => theme.space(6)};
  h1 {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 1.75rem;
    color: ${({ theme }) => theme.colors.primaryStrong};
  }
  p {
    margin: ${({ theme }) => theme.space(1)} 0 0;
    color: ${({ theme }) => theme.colors.textMuted};
  }
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
