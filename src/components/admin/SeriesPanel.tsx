import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import styled from 'styled-components'
import { libraryStrings } from '../../libraryStrings.ts'
import { api, ApiError, errorText, type ArticleSeriesList } from '../../lib/api.ts'
import { formatDateTime } from '../../lib/format.ts'
import { libraryApi } from '../../lib/libraryApi.ts'
import { newSeriesId, resolveSeries, SERIES_LIMITS, seriesUsage } from '../../lib/series.ts'
import { strings } from '../../strings.ts'
import { mobile } from '../../styles/tokens.ts'
import type { ArticleMeta } from '../../types/article.ts'
import { Button, ErrorText, Field, Input, Muted, Notice, Panel, PanelTitle, Row } from '../ui.tsx'

const t = libraryStrings.admin

type Draft = { id: string; label: string; description: string }

/**
 * 叢書系列 on the admin page (E5 e5-t06): rename, reorder, add and remove the library's series,
 * saved as one list (PUT /api/book/series), as the catalogue's categories are (CategoriesPanel).
 * A series with articles in it cannot be removed; the Worker checks the series it has saved, this
 * checks every article the editor can see, so the built-in ones are covered before the first save.
 */
export function SeriesPanel() {
  const [server, setServer] = useState<ArticleSeriesList | null>(null)
  const [articles, setArticles] = useState<ArticleMeta[]>([])
  const [initial, setInitial] = useState<Draft[]>([])
  const [rows, setRows] = useState<Draft[]>([])
  const [added, setAdded] = useState({ label: '', description: '' })
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const take = useCallback((next: ArticleSeriesList) => {
    const list = resolveSeries(next.series).map(({ id, label, description }) => ({ id, label, description }))
    setServer(next)
    setInitial(list)
    setRows(list)
    setConflict(false)
  }, [])

  const load = useCallback(
    () =>
      api.book.articles().then((list) => {
        setArticles(list.entries.flatMap((e) => (e.meta ? [e.meta] : [])))
        take(list.series)
      }, (e) => setError(errorText(e))),
    [take],
  )

  useEffect(() => {
    void load()
  }, [load])

  if (!server)
    return (
      <Panel aria-labelledby="library-series">
        <PanelTitle id="library-series">{t.title}</PanelTitle>
        {error ? <ErrorText role="alert">{error}</ErrorText> : <Muted role="status">{strings.loading}</Muted>}
      </Panel>
    )

  const usage = seriesUsage(articles)
  const dirty = JSON.stringify(rows) !== JSON.stringify(initial)
  const change = (id: string, patch: Partial<Draft>) => setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const move = (index: number, by: number) =>
    setRows((list) => {
      const next = [...list]
      const [row] = next.splice(index, 1)
      next.splice(index + by, 0, row)
      return next
    })

  const add = (event: FormEvent) => {
    event.preventDefault()
    const label = added.label.trim()
    if (!label) return
    setRows((list) => [...list, { id: newSeriesId(list.map((r) => r.id)), label, description: added.description.trim() }])
    setAdded({ label: '', description: '' })
  }

  const save = async () => {
    setError('')
    setNotice('')
    const list = rows.map((r) => ({ ...r, label: r.label.trim(), description: r.description.trim() }))
    if (list.some((r) => !r.label)) return setError(t.nameRequired)
    if (list.length > SERIES_LIMITS.max) return setError(t.tooMany(SERIES_LIMITS.max))
    setSaving(true)
    try {
      take(await libraryApi.saveSeries(list, server.version))
      setNotice(t.saved)
    } catch (e) {
      setError(errorText(e))
      setConflict(e instanceof ApiError && e.code === 'seriesConflict')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel aria-labelledby="library-series">
      <PanelTitle id="library-series">{t.title}</PanelTitle>
      <Stack>
        <Muted>{t.intro}</Muted>
        <Muted>
          {server.series.length && server.updatedBy && server.updatedAt
            ? t.updated(server.updatedBy, formatDateTime(server.updatedAt))
            : t.builtIn}
        </Muted>
        {error && (
          <ErrorText role="alert">
            {error}
            {conflict && (
              <>
                {' '}
                <Button
                  type="button"
                  $small
                  onClick={() => {
                    setError('')
                    void load()
                  }}
                >
                  {t.reload}
                </Button>
              </>
            )}
          </ErrorText>
        )}
        {notice && <Notice role="status">{notice}</Notice>}

        <List aria-label={t.title}>
          {rows.map((row, index) => {
            const used = usage.get(row.id) ?? 0
            const name = row.label || row.id
            return (
              <Item key={row.id}>
                <Order aria-hidden>{index + 1}</Order>
                <Fields>
                  <Input
                    value={row.label}
                    maxLength={SERIES_LIMITS.labelMax}
                    onChange={(e) => change(row.id, { label: e.target.value })}
                    aria-label={t.nameOf(row.label)}
                    placeholder={t.name}
                  />
                  <Input
                    value={row.description}
                    maxLength={SERIES_LIMITS.descriptionMax}
                    onChange={(e) => change(row.id, { description: e.target.value })}
                    aria-label={t.descriptionOf(row.label)}
                    placeholder={t.description}
                  />
                </Fields>
                <Count>
                  {t.articles} {used}
                </Count>
                <Row>
                  <Button type="button" $small $variant="ghost" disabled={index === 0} onClick={() => move(index, -1)} aria-label={t.up(name)}>
                    <ArrowUp size={16} aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    $small
                    $variant="ghost"
                    disabled={index === rows.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={t.down(name)}
                  >
                    <ArrowDown size={16} aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    $small
                    $variant="danger"
                    disabled={used > 0 || rows.length === 1}
                    title={used > 0 ? t.inUse(used) : undefined}
                    onClick={() => setRows((list) => list.filter((r) => r.id !== row.id))}
                    aria-label={used > 0 ? `${t.remove(name)}：${t.inUse(used)}` : t.remove(name)}
                  >
                    <Trash2 size={16} aria-hidden />
                  </Button>
                </Row>
              </Item>
            )
          })}
        </List>

        <AddForm onSubmit={add} aria-label={t.add}>
          <Field>
            {t.newName}
            <Input value={added.label} maxLength={SERIES_LIMITS.labelMax} onChange={(e) => setAdded({ ...added, label: e.target.value })} />
          </Field>
          <Field>
            {t.newDescription}
            <Input
              value={added.description}
              maxLength={SERIES_LIMITS.descriptionMax}
              onChange={(e) => setAdded({ ...added, description: e.target.value })}
            />
          </Field>
          <Button type="submit" disabled={!added.label.trim() || rows.length >= SERIES_LIMITS.max}>
            <Plus size={16} aria-hidden />
            {t.add}
          </Button>
        </AddForm>

        <Row>
          <Button type="button" $variant="primary" disabled={!dirty || saving} onClick={() => void save()}>
            {t.save}
          </Button>
          <Button type="button" disabled={!dirty || saving} onClick={() => setRows(initial)}>
            {t.undo}
          </Button>
          {dirty && <Muted>{t.unsaved}</Muted>}
        </Row>
      </Stack>
    </Panel>
  )
}

const Stack = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(4)};
`

const List = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
`

const Item = styled.li`
  display: grid;
  grid-template-columns: 1.5rem minmax(0, 1fr) auto auto;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(2)} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${mobile} {
    grid-template-columns: 1.5rem minmax(0, 1fr);
    & > :nth-child(n + 3) {
      grid-column: 2;
    }
  }
`

const Order = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
  text-align: right;
`

const Fields = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 14rem) minmax(0, 1fr);
  gap: ${({ theme }) => theme.space(2)};

  ${mobile} {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Count = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
  white-space: nowrap;
`

const AddForm = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 14rem) minmax(0, 1fr) auto;
  align-items: end;
  gap: ${({ theme }) => theme.space(2)};

  ${mobile} {
    grid-template-columns: minmax(0, 1fr);
  }
`
