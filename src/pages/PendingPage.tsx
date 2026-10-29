import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { RichText } from '../components/Suit.tsx'
import { Button, ErrorText, Field, Muted, Notice, PageTitle, Panel, PanelTitle, Row, Select, TextArea } from '../components/ui.tsx'
import { errorText, type PendingList, type PendingStatus } from '../lib/api.ts'
import { formatDateTime } from '../lib/format.ts'
import { pendingRows, type PendingRow } from '../lib/pending.ts'
import { pendingApi } from '../lib/pendingApi.ts'
import { conventionPath, pendingPath } from '../lib/sections.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { strings } from '../strings.ts'
import { Frame, Gate } from './Frame.tsx'
import { pendingText as t } from './pendingStrings.ts'

/**
 * 待確認面板 (E8 e8-t06, e8-t07, e8-t08, AC-8.2). Every 待確認 note in the club's content (not a
 * reader's profile), with its record: status, assignee, remark and closing grounds. Every member
 * reads it; editors (`bookEdit`) update a note, and close one by writing the grounds and opening
 * the editor at its section: the change goes through review, and publishing it closes the note
 * (TKU-BridgeTable worker/pending.ts). One column, so it works on a phone.
 */
export function PendingPage() {
  return (
    <Frame>
      <Gate need="member">
        <Pending />
      </Gate>
    </Frame>
  )
}

type Filter = PendingStatus | 'all'
const STATUSES = ['open', 'working', 'parked'] as const

function Pending() {
  usePageTitle(t.title)
  const content = useContent()
  const { user, can } = useAuth()
  const editor = can('bookEdit')
  const [data, setData] = useState<PendingList | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [mine, setMine] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const fetchList = useCallback(() => {
    let current = true
    pendingApi.list().then(
      (list) => current && setData(list),
      (e) => current && setError(errorText(e)),
    )
    return () => {
      current = false
    }
  }, [])
  useEffect(fetchList, [fetchList])

  const rows = useMemo(() => pendingRows(content.conventions, data?.open ?? []), [content.conventions, data])
  const shown = rows.filter(
    (r) => (filter === 'all' || r.status === filter) && (!mine || r.meta?.assignee === user?.username),
  )
  const counts = STATUSES.map((s) => [s, rows.filter((r) => r.status === s).length] as const)
  const ready = data !== null && content.status !== 'loading'

  return (
    <>
      <PageTitle>{t.title}</PageTitle>
      <Muted>{t.intro}</Muted>
      {!editor && <Muted>{t.readOnly}</Muted>}
      {notice && <Notice role="status">{notice}</Notice>}
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {!ready && !error && <Muted role="status">{strings.loading}</Muted>}
      {ready && (
        <>
          <Filters>
            <Field>
              {t.filterStatus}
              <Select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
                <option value="all">
                  {t.filterAll}（{rows.length}）
                </option>
                {counts.map(([s, n]) => (
                  <option key={s} value={s}>
                    {t.status[s]}（{n}）
                  </option>
                ))}
              </Select>
            </Field>
            {editor && (
              <Check>
                <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
                {t.filterMine}
              </Check>
            )}
            <Muted role="status">{t.shown(shown.length, rows.length)}</Muted>
          </Filters>
          {shown.length === 0 && <Muted>{rows.length ? t.emptyFiltered : t.empty}</Muted>}
          {shown.length > 0 && (
            <Cards>
              {shown.map((row) => {
                const id = `${row.slug}/${row.note.sectionId}/${row.note.index}`
                return (
                  <li key={id}>
                    <PendingCard
                      row={row}
                      editors={data.editors}
                      editor={editor}
                      editing={editing === id}
                      onEdit={() => {
                        setNotice('')
                        setEditing(editing === id ? null : id)
                      }}
                      onSaved={() => {
                        setEditing(null)
                        setNotice(t.saved)
                        fetchList()
                      }}
                    />
                  </li>
                )
              })}
            </Cards>
          )}
          <Panel aria-labelledby="pending-closed">
            <PanelTitle id="pending-closed">{t.closedTitle}</PanelTitle>
            {data.closed.length === 0 ? (
              <Muted>{t.closedEmpty}</Muted>
            ) : (
              <Cards>
                {data.closed.map((m) => (
                  <li key={`${m.slug}/${m.sectionId}/${m.index}/${m.closedAt}`}>
                    <Link to={conventionPath(m.slug)}>{content.bySlug(m.slug)?.nameZh ?? m.slug}</Link>
                    <Question>{m.text}</Question>
                    {m.resolution && (
                      <Muted>
                        {t.resolution}：{m.resolution}
                      </Muted>
                    )}
                    <Muted>{t.closedBy(m.closedBy ?? m.updatedBy, formatDateTime(m.closedAt ?? m.updatedAt), m.closedVersion)}</Muted>
                  </li>
                ))}
              </Cards>
            )}
          </Panel>
        </>
      )}
    </>
  )
}

function PendingCard({
  row,
  editors,
  editor,
  editing,
  onEdit,
  onSaved,
}: {
  row: PendingRow
  editors: string[]
  editor: boolean
  editing: boolean
  onEdit: () => void
  onSaved: () => void
}) {
  const { note, meta } = row
  const where = note.trail[note.trail.length - 1]
  return (
    <Card>
      <Row>
        <StatusPill $status={row.status}>{t.status[row.status]}</StatusPill>
        <Muted as="span">{row.nameZh}</Muted>
      </Row>
      <Link to={pendingPath(row.slug, note.sectionId, note.index)}>
        <RichText text={note.trail.join(' › ')} />
      </Link>
      <Question>{note.text}</Question>
      <Facts>
        <dt>{t.assignee}</dt>
        <dd>{meta?.assignee ?? t.nobody}</dd>
        {meta?.note && (
          <>
            <dt>{t.note}</dt>
            <dd>{meta.note}</dd>
          </>
        )}
        {meta?.resolution && (
          <>
            <dt>{t.resolution}</dt>
            <dd>{meta.resolution}</dd>
          </>
        )}
      </Facts>
      {meta && <Muted>{t.updated(meta.updatedBy, formatDateTime(meta.updatedAt))}</Muted>}
      {editor && (
        <Row>
          <Button type="button" $small $variant="ghost" aria-expanded={editing} onClick={onEdit}>
            {t.edit}
            <span className="visually-hidden">：{where}</span>
          </Button>
        </Row>
      )}
      {editing && <PendingForm row={row} editors={editors} onSaved={onSaved} label={t.editOf(where)} />}
    </Card>
  )
}

function PendingForm({ row, editors, onSaved, label }: { row: PendingRow; editors: string[]; onSaved: () => void; label: string }) {
  const navigate = useNavigate()
  const { meta, note } = row
  const [status, setStatus] = useState<Exclude<PendingStatus, 'confirmed'>>(meta?.status === 'confirmed' ? 'working' : (meta?.status ?? 'open'))
  const [assignee, setAssignee] = useState(meta?.assignee ?? '')
  const [remark, setRemark] = useState(meta?.note ?? '')
  const [resolution, setResolution] = useState(meta?.resolution ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // Someone no longer an editor stays selectable until changed
  const people = assignee && !editors.includes(assignee) ? [assignee, ...editors] : editors

  const save = async (next: Exclude<PendingStatus, 'confirmed'>) => {
    setError('')
    setBusy(true)
    try {
      await pendingApi.save(
        { slug: row.slug, sectionId: note.sectionId, index: note.index },
        { text: note.text, status: next, assignee, note: remark.trim(), resolution: resolution.trim() },
      )
      return true
    } catch (e) {
      setError(errorText(e))
      return false
    } finally {
      setBusy(false)
    }
  }
  const close = async () => {
    if (!resolution.trim()) {
      setError(t.closeNeedsResolution)
      return
    }
    if (await save(status === 'open' ? 'working' : status))
      navigate(`/edit/${row.slug}?section=${encodeURIComponent(note.sectionId)}`)
  }

  return (
    <Form
      aria-label={label}
      onSubmit={async (e) => {
        e.preventDefault()
        if (await save(status)) onSaved()
      }}
    >
      <Fields>
        <Field>
          {t.filterStatus}
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t.status[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          {t.assignee}
          <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">{t.nobody}</option>
            {people.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
      </Fields>
      <Field>
        {t.note}
        <TextArea value={remark} maxLength={500} onChange={(e) => setRemark(e.target.value)} />
      </Field>
      <Field>
        {t.resolution}
        <TextArea value={resolution} maxLength={500} onChange={(e) => setResolution(e.target.value)} />
        <small>{t.resolutionHint}</small>
      </Field>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      <Row>
        <Button type="submit" $small disabled={busy}>
          {busy ? t.saving : t.save}
        </Button>
        <Button type="button" $small $variant="ghost" disabled={busy} onClick={() => void close()}>
          {t.close}
        </Button>
      </Row>
      <Muted>{t.closeHint}</Muted>
    </Form>
  )
}

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: ${({ theme }) => theme.space(4)};
`

const Check = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  min-height: 2.75rem;
`

const Cards = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  margin: 0;
  padding: 0;
  list-style: none;

  & > li {
    display: grid;
    gap: ${({ theme }) => theme.space(1.5)};
  }
`

const Card = styled.article`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-left: 4px solid ${({ theme }) => theme.colors.pendingBorder};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};
`

const Question = styled.p`
  margin: 0;
  line-height: 1.7;
`

const StatusPill = styled.span<{ $status: PendingStatus }>`
  padding: 0 ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.shape.tag};
  font-size: 0.8125rem;
  line-height: 1.5rem;
  font-weight: 600;
  ${({ theme, $status }) =>
    $status === 'open'
      ? `background: ${theme.colors.pendingBg}; color: ${theme.colors.pendingText}; box-shadow: inset 0 0 0 1px ${theme.colors.pendingBorder};`
      : $status === 'working'
        ? `background: ${theme.colors.primarySoft}; color: ${theme.colors.primaryStrong};`
        : `background: ${theme.colors.tagBg}; color: ${theme.colors.textMuted}; box-shadow: inset 0 0 0 1px ${theme.colors.tagBorder};`}
`

const Facts = styled.dl`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(3)};
  margin: 0;
  font-size: 0.875rem;

  & > dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }
  & > dd {
    margin: 0;
  }
`

const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  padding-top: ${({ theme }) => theme.space(3)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Fields = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: ${({ theme }) => theme.space(3)};
`
