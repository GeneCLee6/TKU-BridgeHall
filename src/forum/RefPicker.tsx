import { useId, useState } from 'react'
import styled from 'styled-components'
import { Field, Input, Muted } from '../components/ui.tsx'
import { useSearch } from '../state/useSearch.ts'
import { forumStrings as t } from './forumStrings.ts'

/**
 * Finds a convention or one of its sections to quote in a post (`ref`, e11-t13) with the
 * handbook's own search; articles are left out (a post links an article by its address).
 */
export function RefPicker({ onPick }: { onPick: (slug: string, sectionId?: string) => void }) {
  const { search, prepare } = useSearch()
  const [query, setQuery] = useState('')
  const hintId = useId()
  const results = query.trim() ? search(query.trim(), 12).filter((r) => !r.path) : []

  return (
    <Wrap>
      <Field>
        {t.refSearch}
        <Input
          type="search"
          value={query}
          onFocus={prepare}
          onChange={(e) => setQuery(e.target.value)}
          aria-describedby={hintId}
          autoFocus
        />
        <small id={hintId}>{t.refSearchHint}</small>
      </Field>
      {query.trim() && !results.length && <Muted role="status">{t.refNoMatch}</Muted>}
      {results.length > 0 && (
        <Results>
          {results.map((r) => (
            <li key={`${r.slug}/${r.sectionId ?? ''}`}>
              <Pick type="button" onClick={() => onPick(r.slug, r.sectionId)}>
                {r.label}
              </Pick>
            </li>
          ))}
        </Results>
      )}
    </Wrap>
  )
}

const Wrap = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
`

const Results = styled.ul`
  display: grid;
  gap: 2px;
  max-height: 16rem;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
`

const Pick = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.space(2)};
  border: 0;
  border-radius: ${({ theme }) => theme.shape.control};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: ${({ theme }) => theme.colors.primarySoft};
  }
`
