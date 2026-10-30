import { Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { BackLink, Button, ErrorText, Field, Input, Muted, Notice, PageTitle, Row, Select, TextArea } from '../components/ui.tsx'
import { glossary as bundled } from '../content/glossary.ts'
import { api, ApiError, errorText, type BookGlossary } from '../lib/api.ts'
import { formatDateTime } from '../lib/format.ts'
import { Frame, Gate } from '../pages/Frame.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { strings } from '../strings.ts'
import { DEFINITION_MAX, draftsToTerms, TERM_MAX, toDraft, type Draft } from './drafts.ts'
import { rememberGlossary } from './useGlossary.ts'
import { resolveGlossary } from './match.ts'
import { glossaryStrings as t } from './strings.ts'

/** /glossary/edit (e4-t07): the whole glossary as one list, saved at once (PUT /api/book/glossary) */
export function GlossaryEditorPage() {
  return (
    <Frame title={t.editTitle}>
      <PageTitle>{t.editTitle}</PageTitle>
      <Gate need="bookEdit">
        <GlossaryEditor />
      </Gate>
    </Frame>
  )
}

function GlossaryEditor() {
  const { conventions } = useContent()
  const [server, setServer] = useState<BookGlossary | null>(null)
  const [rows, setRows] = useState<Draft[]>([])
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const nextKey = useRef(0)

  const take = useCallback((next: BookGlossary) => {
    setServer(next)
    setRows(resolveGlossary(bundled, next).map((term) => toDraft(term, nextKey.current++)))
    setConflict(false)
  }, [])

  const load = useCallback(() => api.book.glossary().then(take, (e) => setError(errorText(e))), [take])

  useEffect(() => {
    void load()
  }, [load])

  if (!server) return error ? <ErrorText role="alert">{error}</ErrorText> : <Muted role="status">{strings.loading}</Muted>

  const change = (key: number, patch: Partial<Draft>) =>
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const save = async () => {
    setError('')
    setNotice('')
    const terms = draftsToTerms(rows)
    if (typeof terms === 'string') return setError(terms)
    setSaving(true)
    try {
      const saved = await api.book.saveGlossary(terms, server.version)
      rememberGlossary(saved)
      take(saved)
      setNotice(strings.saved)
    } catch (e) {
      setError(errorText(e))
      setConflict(e instanceof ApiError && e.code === 'glossaryConflict')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <BackLink to="/glossary">{t.back}</BackLink>
      <Muted>{t.editIntro}</Muted>
      <Muted>
        {server.version > 0 && server.updatedBy && server.updatedAt
          ? t.updated(server.updatedBy, formatDateTime(server.updatedAt))
          : t.bundled}
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
      {!rows.length && <Muted>{t.empty}</Muted>}
      <List aria-label={t.editTitle}>
        {rows.map((row) => (
          <Item key={row.key}>
            <Fields>
              <Field>
                {t.term}
                <Input value={row.term} maxLength={TERM_MAX} onChange={(e) => change(row.key, { term: e.target.value })} />
              </Field>
              <Field>
                {t.aliasesField}
                <Input value={row.aliases} onChange={(e) => change(row.key, { aliases: e.target.value })} />
              </Field>
              <Field>
                {t.seeField}
                <Select value={row.see} onChange={(e) => change(row.key, { see: e.target.value })}>
                  <option value="">{t.seeNone}</option>
                  {row.see && !conventions.some((c) => c.slug === row.see) && <option value={row.see}>{row.see}</option>}
                  {conventions.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.nameZh}
                    </option>
                  ))}
                </Select>
              </Field>
            </Fields>
            <Field>
              {t.definition}
              <TextArea
                rows={3}
                value={row.definition}
                maxLength={DEFINITION_MAX}
                onChange={(e) => change(row.key, { definition: e.target.value })}
              />
            </Field>
            <Row>
              <Button
                type="button"
                $small
                $variant="danger"
                onClick={() => setRows((list) => list.filter((r) => r.key !== row.key))}
              >
                <Trash2 size={16} aria-hidden />
                {t.remove(row.term)}
              </Button>
            </Row>
          </Item>
        ))}
      </List>
      <Row>
        <Button
          type="button"
          onClick={() =>
            setRows((list) => [...list, { key: nextKey.current++, term: '', aliases: '', definition: '', see: '' }])
          }
        >
          <Plus size={16} aria-hidden />
          {t.add}
        </Button>
        <Button type="button" $variant="primary" disabled={saving} onClick={() => void save()}>
          {saving ? t.saving : t.save}
        </Button>
      </Row>
    </>
  )
}

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`

const Item = styled.li`
  padding: ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`

const Fields = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: ${({ theme }) => theme.space(3)};
`
