import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import styled from 'styled-components'
import { categories as bundledCategories } from '../../content/categories.ts'
import { api, ApiError, errorText, type BookCategories } from '../../lib/api.ts'
import { categoryUsage, newCategoryId, resolveCategories } from '../../lib/categories.ts'
import { formatDateTime } from '../../lib/format.ts'
import { useContent } from '../../state/ContentContext.tsx'
import { strings } from '../../strings.ts'
import { mobile } from '../../styles/tokens.ts'
import { Button, ErrorText, Field, Input, Muted, Notice, Panel, PanelTitle, Row } from '../ui.tsx'
import { categoriesStrings } from './categoriesStrings.ts'

const t = categoriesStrings
/** The Worker's limit (TKU-BridgeTable worker/book.ts CATEGORY_LIMITS) */
export const CATEGORY_MAX = 20
const LABEL_MAX = 40
const DESCRIPTION_MAX = 200

type Draft = { id: string; label: string; description: string }

/**
 * 分類 on the admin page: rename, reorder, add and remove the catalogue's categories, saved as one
 * list (PUT /api/book/categories). A category with conventions in it cannot be removed; the Worker
 * only knows the conventions edited online, so this checks the whole catalogue first.
 */
export function CategoriesPanel() {
  const content = useContent()
  const [server, setServer] = useState<BookCategories | null>(null)
  const [initial, setInitial] = useState<Draft[]>([])
  const [rows, setRows] = useState<Draft[]>([])
  const [added, setAdded] = useState({ label: '', description: '' })
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  // The catalogue at the time of loading, without reloading whenever it changes
  const conventions = useRef(content.conventions)
  useEffect(() => {
    conventions.current = content.conventions
  })

  const take = useCallback((next: BookCategories) => {
    const list = resolveCategories(bundledCategories, next.categories, conventions.current).map(
      ({ id, label, description }) => ({ id, label, description }),
    )
    setServer(next)
    setInitial(list)
    setRows(list)
    setConflict(false)
  }, [])

  const load = useCallback(() => api.book.categories().then(take, (e) => setError(errorText(e))), [take])

  useEffect(() => {
    void load()
  }, [load])

  if (!server)
    return (
      <Panel aria-labelledby="categories">
        <PanelTitle id="categories">{t.title}</PanelTitle>
        {error ? <ErrorText role="alert">{error}</ErrorText> : <Muted role="status">{strings.loading}</Muted>}
      </Panel>
    )

  const usage = categoryUsage(content.conventions)
  const dirty = JSON.stringify(rows) !== JSON.stringify(initial)
  const change = (id: string, patch: Partial<Draft>) =>
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)))
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
    setRows((list) => [
      ...list,
      { id: newCategoryId(list.map((r) => r.id)), label, description: added.description.trim() },
    ])
    setAdded({ label: '', description: '' })
  }

  const save = async () => {
    setError('')
    setNotice('')
    const list = rows.map((r) => ({ ...r, label: r.label.trim(), description: r.description.trim() }))
    if (list.some((r) => !r.label)) return setError(t.nameRequired)
    if (list.length > CATEGORY_MAX) return setError(t.tooMany(CATEGORY_MAX))
    setSaving(true)
    try {
      take(await api.book.saveCategories(list, server.version))
      setNotice(strings.saved)
      // The catalogue, the home page and the editor read the categories from the manifest
      await content.reload()
    } catch (e) {
      setError(errorText(e))
      setConflict(e instanceof ApiError && e.code === 'categoryConflict')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel aria-labelledby="categories">
      <PanelTitle id="categories">{t.title}</PanelTitle>
      <Stack>
        <Muted>{t.intro}</Muted>
        <Muted>
          {server.categories.length && server.updatedBy && server.updatedAt
            ? t.updated(server.updatedBy, formatDateTime(server.updatedAt))
            : t.bundled}
        </Muted>
        {error && (
          <ErrorText role="alert">
            {error}
            {conflict && (
              <>
                {' '}
                <Button type="button" $small onClick={() => {
                    setError('')
                    void load()
                  }}>
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
                    maxLength={LABEL_MAX}
                    onChange={(e) => change(row.id, { label: e.target.value })}
                    aria-label={t.nameOf(row.label)}
                    placeholder={t.name}
                  />
                  <Input
                    value={row.description}
                    maxLength={DESCRIPTION_MAX}
                    onChange={(e) => change(row.id, { description: e.target.value })}
                    aria-label={t.descriptionOf(row.label)}
                    placeholder={t.description}
                  />
                </Fields>
                <Count title={t.conventions}>
                  {t.conventions} {used}
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
                    disabled={used > 0}
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
            <Input value={added.label} maxLength={LABEL_MAX} onChange={(e) => setAdded({ ...added, label: e.target.value })} />
          </Field>
          <Field>
            {t.newDescription}
            <Input
              value={added.description}
              maxLength={DESCRIPTION_MAX}
              onChange={(e) => setAdded({ ...added, description: e.target.value })}
            />
          </Field>
          <Button type="submit" disabled={!added.label.trim() || rows.length >= CATEGORY_MAX}>
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
