import { useEffect, useId, useRef, useState } from 'react'
import styled from 'styled-components'
import { Button, ErrorText, Field, Input, Muted, Row, Select } from '../components/ui.tsx'
import { api, ApiError, errorText } from '../lib/api.ts'
import { formatCall } from '../lib/calls.ts'
import {
  conditionsFrom,
  draftFrom,
  findRows,
  SUITS,
  withConditions,
  type ConditionsDraft,
  type ConditionsTarget,
  type RangeDraft,
  type RowPlace,
} from '../lib/handConditions.ts'
import type { SpecSuit } from '../lib/systemSpec.ts'
import { useContent } from '../state/ContentContext.tsx'
import type { Convention } from '../types/convention.ts'
import { tableReport as t } from './tableReportStrings.ts'

const SUIT: Record<SpecSuit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }

type Found = { convention: Convention; places: RowPlace[] } | { gone: true } | null

/**
 * The hand conditions of one converted row (e7-t08): high cards, lengths per suit, forcing. Saves
 * them on the club's row through the online content (ARCHITECTURE.md §4.1, bookEdit), the same as
 * the editor: the convention gets, or replaces, its online version; its words stay as they are.
 */
export function HandConditionsForm({
  target,
  filled,
  onDone,
  onCancel,
}: {
  target: ConditionsTarget
  /** The row has conditions already, so they can be cleared */
  filled: boolean
  onDone: (message: string) => void
  onCancel: () => void
}) {
  const content = useContent()
  const [found, setFound] = useState<Found>(null)
  const [draft, setDraft] = useState<ConditionsDraft>(() => draftFrom(target.shows))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const id = useId()
  const { slug, sectionId } = target.ref

  // Once per row: the form keeps the club's convention as it opened and saves from its version
  const start = useRef({ load: content.load, target })
  useEffect(() => {
    let current = true
    const { load, target: row } = start.current
    load(row.ref.slug).then(
      (convention) => {
        if (!current) return
        const places = convention ? findRows(convention, row) : []
        setFound(convention && places.length ? { convention, places } : { gone: true })
      },
      (e) => current && setError(errorText(e)),
    )
    return () => {
      current = false
    }
  }, [])

  const save = async (clear: boolean) => {
    if (!found || 'gone' in found) return
    setError('')
    const read = clear ? null : conditionsFrom(draft)
    if (read && 'problem' in read) return setError(read.problem)
    setBusy(true)
    try {
      const next = withConditions(found.convention, sectionId, found.places, read ? read.conditions : null)
      await api.book.save(slug, {
        convention: next,
        baseVersion: content.online.get(slug)?.version ?? 0,
        bundledUpdated: content.bundledBySlug(slug)?.updated,
        note: t.conditions.saveNote(target.call),
      })
      onDone(clear ? t.conditions.cleared : t.conditions.saved)
    } catch (e) {
      setError(e instanceof ApiError && e.status === 409 ? t.conditions.conflict : errorText(e))
      setBusy(false)
    }
  }

  if (!found) return error ? <ErrorText role="alert">{error}</ErrorText> : <Muted role="status">{t.conditions.loading}</Muted>
  if ('gone' in found)
    return (
      <Form>
        <Muted>{t.conditions.gone}</Muted>
        <Row>
          <Button type="button" $small onClick={onCancel}>
            {t.conditions.cancel}
          </Button>
        </Row>
      </Form>
    )

  const range = (label: string, value: RangeDraft, change: (next: RangeDraft) => void, max: number) => (
    <Range role="group" aria-label={label}>
      <span aria-hidden="true">{label}</span>
      <Small
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        aria-label={t.conditions.low(label)}
        value={value.low}
        onChange={(e) => change({ ...value, low: e.target.value })}
      />
      <span aria-hidden="true">–</span>
      <Small
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        aria-label={t.conditions.high(label)}
        placeholder={t.conditions.noTop}
        value={value.high}
        onChange={(e) => change({ ...value, high: e.target.value })}
      />
    </Range>
  )

  return (
    <Form
      aria-labelledby={id}
      onSubmit={(e) => {
        e.preventDefault()
        void save(false)
      }}
    >
      <Muted id={id}>{t.conditions.intro(formatCall(target.call))}</Muted>
      {found.places.length > 1 && <Muted>{t.conditions.several(found.places.length)}</Muted>}
      <Fields>
        {range(t.conditions.hcp, draft.hcp, (hcp) => setDraft({ ...draft, hcp }), 37)}
        {SUITS.map((suit) => (
          <span key={suit}>
            {range(t.conditions.len(SUIT[suit]), draft.len[suit], (r) => setDraft({ ...draft, len: { ...draft.len, [suit]: r } }), 13)}
          </span>
        ))}
        <Field>
          {t.conditions.forcing}
          <Select value={draft.forcing} onChange={(e) => setDraft({ ...draft, forcing: e.target.value as ConditionsDraft['forcing'] })}>
            <option value="">{t.conditions.forcingNone}</option>
            <option value="oneRound">{t.shows.oneRound}</option>
            <option value="game">{t.shows.game}</option>
          </Select>
        </Field>
      </Fields>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      <Row>
        <Button type="submit" $variant="primary" $small disabled={busy}>
          {busy ? t.conditions.saving : t.conditions.save}
        </Button>
        {filled && (
          <Button type="button" $variant="danger" $small disabled={busy} onClick={() => void save(true)}>
            {t.conditions.clear}
          </Button>
        )}
        <Button type="button" $small disabled={busy} onClick={onCancel}>
          {t.conditions.cancel}
        </Button>
      </Row>
    </Form>
  )
}

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(2)} 0;
`

const Fields = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: ${({ theme }) => theme.space(3)};
`

const Range = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  font-size: 0.8125rem;
  font-weight: 600;
`

const Small = styled(Input)`
  width: 4.5rem;
`
