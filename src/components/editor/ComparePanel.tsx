import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { api, errorText, type BookRevision } from '../../lib/api.ts'
import { conventionProblems, isObject, isString } from '../../lib/content.ts'
import { diffConventions } from '../../lib/diff.ts'
import { formatDateTime } from '../../lib/format.ts'
import { diffText as d } from '../../pages/reviewStrings.ts'
import { strings } from '../../strings.ts'
import type { Convention } from '../../types/convention.ts'
import { DiffView } from '../DiffView.tsx'
import { Button, ErrorText, Field, Muted, Select } from '../ui.tsx'

const EDITING = 'editing'

/** A saved version's content, checked for shape only: an old version may name a category gone since */
async function fetchRevision(r: BookRevision): Promise<Convention> {
  const { revision } = await api.book.revision(r.slug, r.id)
  const c = revision.convention
  const problems = conventionProblems(c, isObject(c) && isString(c.category) ? [c.category] : [])
  if (problems.length) throw new Error(problems[0])
  return c as Convention
}

const label = (r: BookRevision) => d.revision(formatDateTime(r.at), r.version)

/**
 * 與這版比較 (E8 e8-t05, AC-8.3): a saved version against what is in the editor now, or against
 * any other saved version, the older one always on the left of the comparison.
 */
export function ComparePanel({
  from,
  revisions,
  editing,
  onClose,
}: {
  from: BookRevision
  revisions: BookRevision[]
  /** What the editor has now, saved or not */
  editing: Convention
  onClose: () => void
}) {
  const saved = revisions.filter((r) => r.action === 'save')
  const [target, setTarget] = useState(EDITING)
  const [loaded, setLoaded] = useState<Map<string, Convention>>(() => new Map())
  const [error, setError] = useState('')
  const other = target === EDITING ? null : (saved.find((r) => r.id === target) ?? null)

  useEffect(() => {
    let current = true
    const wanted = [from, ...(other ? [other] : [])].filter((r) => !loaded.has(r.id))
    if (!wanted.length) return
    Promise.all(wanted.map(async (r) => [r.id, await fetchRevision(r)] as const)).then(
      (found) => current && setLoaded((m) => new Map([...m, ...found])),
      (e) => current && setError(errorText(e)),
    )
    return () => {
      current = false
    }
  }, [from, other, loaded])

  const fromContent = loaded.get(from.id)
  const otherContent = other ? loaded.get(other.id) : editing
  // The older version first: a saved one older than `from` goes before it
  const swap = other !== null && other.at < from.at
  const diff = useMemo(
    () => (fromContent && otherContent ? (swap ? diffConventions(otherContent, fromContent) : diffConventions(fromContent, otherContent)) : null),
    [fromContent, otherContent, swap],
  )
  const fromLabel = label(from)
  const otherLabel = other ? label(other) : d.editing

  return (
    <Wrap aria-labelledby="compare-title">
      <Head>
        <h2 id="compare-title">
          {d.compareTitle}：{fromLabel}
        </h2>
        <Button type="button" $small onClick={onClose}>
          {d.closeCompare}
        </Button>
      </Head>
      <Field>
        {d.compareWith}
        <Select
          value={target}
          onChange={(e) => {
            setError('')
            setTarget(e.target.value)
          }}
        >
          <option value={EDITING}>{d.editing}</option>
          {saved
            .filter((r) => r.id !== from.id)
            .map((r) => (
              <option key={r.id} value={r.id}>
                {label(r)}
              </option>
            ))}
        </Select>
      </Field>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {!diff ? (
        !error && <Muted role="status">{strings.loading}</Muted>
      ) : (
        <DiffView diff={diff} before={swap ? otherLabel : fromLabel} after={swap ? fromLabel : otherLabel} />
      )}
    </Wrap>
  )
}

const Wrap = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  align-content: start;
`

const Head = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  h2 {
    margin: 0;
    font-size: 1.125rem;
  }
`
