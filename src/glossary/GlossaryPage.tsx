import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { RichText } from '../components/Suit.tsx'
import { Input, Muted } from '../components/ui.tsx'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { strings } from '../strings.ts'
import { useGlossary } from './useGlossary.ts'
import { filterTerms, termAnchor } from './match.ts'
import { glossaryStrings as t } from './strings.ts'

/**
 * /glossary (e4-t05, AC-4.4): every term with its explanation, filtered as the reader types; a
 * term's popover in the text links here at its anchor. Editors get a way into the editor.
 */
export function GlossaryPage() {
  usePageTitle(t.title)
  const { terms, loading } = useGlossary()
  const { conventions } = useContent()
  const { can } = useAuth()
  const { hash } = useLocation()
  const [query, setQuery] = useState('')
  const shown = filterTerms(terms, query)

  // Coming from a popover: scroll to the term once the list is there
  useEffect(() => {
    if (loading || !hash) return
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' })
  }, [loading, hash])

  return (
    <Page aria-labelledby="glossary-title">
      <Head>
        <Title id="glossary-title">{t.title}</Title>
        {can('bookEdit') && (
          <EditLink to="/glossary/edit">
            <Pencil size={16} aria-hidden />
            {t.edit}
          </EditLink>
        )}
      </Head>
      <Muted>{t.intro}</Muted>
      {loading ? (
        <Muted role="status">{strings.loading}</Muted>
      ) : !terms.length ? (
        <Muted>{t.empty}</Muted>
      ) : (
        <>
          <Filter>
            {t.filter}
            <Input
              type="search"
              value={query}
              placeholder={t.filterPlaceholder}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Filter>
          <Muted role="status">{shown.length ? t.count(shown.length) : t.noMatch}</Muted>
          <List>
            {shown.map((term) => {
              const see = term.see ? conventions.find((c) => c.slug === term.see) : undefined
              return (
                <Entry key={term.term} id={termAnchor(term.term)}>
                  <dt>
                    <TermName>{term.term}</TermName>
                    {term.aliases.length > 0 && (
                      <Aliases>
                        {t.aliases}：{term.aliases.join('、')}
                      </Aliases>
                    )}
                  </dt>
                  <dd>
                    <Definition>
                      <RichText text={term.definition} />
                    </Definition>
                    {see && (
                      <Link to={`/c/${see.slug}`}>
                        {t.see}：{see.nameZh}
                      </Link>
                    )}
                  </dd>
                </Entry>
              )
            })}
          </List>
        </>
      )}
    </Page>
  )
}

const Page = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space(4)};
  max-width: 48rem;
`

const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
`

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.primaryStrong};
`

const EditLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  font-weight: 600;
`

const Filter = styled.label`
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
  font-weight: 600;
`

const List = styled.dl`
  margin: 0;
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`

const Entry = styled.div`
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};
  scroll-margin-top: 5rem;

  &:target {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  dd {
    margin: ${({ theme }) => theme.space(1)} 0 0;
  }
`

const TermName = styled.span`
  font-weight: 700;
  font-size: 1.0625rem;
`

const Aliases = styled.span`
  margin-left: ${({ theme }) => theme.space(2)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`

const Definition = styled.p`
  margin: 0 0 ${({ theme }) => theme.space(1)};
  line-height: 1.7;
  white-space: pre-line;
`
