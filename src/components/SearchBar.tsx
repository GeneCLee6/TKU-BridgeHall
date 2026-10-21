import { Search } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import type { SearchFn } from '../lib/search.ts'
import { conventionPath, sectionPath } from '../lib/sections.ts'
import { strings } from '../strings.ts'
import { RichText } from './Suit.tsx'

/** Searches convention names, aliases, tags, bids and meanings; results are deep links */
export function SearchBar({ search }: { search: SearchFn }) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => search(query), [search, query])
  const inputId = useId()
  const listId = useId()
  const showResults = query.trim().length > 0

  return (
    <Wrap role="search" data-print="hide" onSubmit={(e) => e.preventDefault()}>
      <label htmlFor={inputId} className="visually-hidden">
        {strings.searchLabel}
      </label>
      <Field>
        <Search size={16} aria-hidden />
        <input
          id={inputId}
          type="search"
          value={query}
          placeholder={strings.searchPlaceholder}
          autoComplete="off"
          aria-controls={showResults ? listId : undefined}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
        />
      </Field>
      {showResults && (
        <Results id={listId} aria-live="polite">
          <Count>{results.length ? strings.searchResults(results.length) : strings.searchEmpty}</Count>
          <ul>
            {results.map((r) => (
              <li key={`${r.slug}/${r.sectionId ?? ''}`}>
                <Link
                  to={r.sectionId ? sectionPath(r.slug, r.sectionId) : conventionPath(r.slug)}
                  onClick={() => setQuery('')}
                >
                  <RichText text={r.label} />
                </Link>
              </li>
            ))}
          </ul>
        </Results>
      )}
    </Wrap>
  )
}

const Wrap = styled.form`
  position: relative;
  flex: 1;
  min-width: 0;
  max-width: 440px;
`

const Field = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  height: 40px;
  padding: 0 ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.focus};
  }

  input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
    font-size: 0.9375rem;
  }
`

const Results = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 30;
  max-height: 60vh;
  overflow-y: auto;
  padding: ${({ theme }) => theme.space(2)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow};

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  a {
    display: block;
    padding: ${({ theme }) => theme.space(2)};
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;
    font-size: 0.9375rem;
    line-height: 1.5;
  }
  a:hover,
  a:focus-visible {
    background: ${({ theme }) => theme.colors.primarySoft};
  }
`

const Count = styled.p`
  margin: 0 ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(1)};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`
