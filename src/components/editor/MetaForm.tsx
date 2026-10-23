import { useState } from 'react'
import styled from 'styled-components'
import { splitList } from '../../lib/editing.ts'
import { strings } from '../../strings.ts'
import type { Category, CategoryId, Convention } from '../../types/convention.ts'
import { Field, Input, Select } from '../ui.tsx'
import { AutoTextArea } from './fields.tsx'

const t = strings.editor

/** A convention's own fields: names, address, category, tags, summary and source */
export function MetaForm({
  convention,
  categories,
  slugEditable,
  slugTaken,
  onChange,
}: {
  convention: Convention
  categories: Category[]
  /** Only a new convention can choose its address */
  slugEditable: boolean
  slugTaken: boolean
  onChange: (convention: Convention) => void
}) {
  // Lists are typed as text and split on save, so a trailing 、 does not vanish while typing
  const [aliases, setAliases] = useState((convention.aliases ?? []).join('、'))
  const [tags, setTags] = useState(convention.tags.join('、'))
  const set = (patch: Partial<Convention>) => onChange({ ...convention, ...patch })

  return (
    <Form aria-label={t.info}>
      <Columns>
        <Field>
          {t.nameZh}
          <Input value={convention.nameZh} onChange={(e) => set({ nameZh: e.target.value })} required />
        </Field>
        <Field>
          {t.nameEn}
          <Input value={convention.nameEn} onChange={(e) => set({ nameEn: e.target.value })} lang="en" />
        </Field>
      </Columns>
      <Columns>
        <Field>
          {t.slug}
          <Input
            value={convention.slug}
            readOnly={!slugEditable}
            aria-invalid={slugTaken}
            onChange={(e) => set({ slug: e.target.value.trim().toLowerCase() })}
            lang="en"
          />
          <small>{slugTaken ? t.slugTaken : t.slugHint}</small>
        </Field>
        <Field>
          {t.category}
          <Select value={convention.category} onChange={(e) => set({ category: e.target.value as CategoryId })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </Columns>
      <Field>
        {t.summary}
        <AutoTextArea value={convention.summary} onChange={(e) => set({ summary: e.target.value })} />
        <small>{t.summaryHint}</small>
      </Field>
      <Columns>
        <Field>
          {t.tags}
          <Input
            value={tags}
            onChange={(e) => {
              setTags(e.target.value)
              set({ tags: splitList(e.target.value) })
            }}
          />
          <small>{t.tagsHint}</small>
        </Field>
        <Field>
          {t.aliases}
          <Input
            value={aliases}
            onChange={(e) => {
              setAliases(e.target.value)
              set({ aliases: splitList(e.target.value) })
            }}
          />
          <small>{t.aliasesHint}</small>
        </Field>
      </Columns>
      <Columns>
        <Field>
          {t.sourceTitle}
          <Input value={convention.source.title} onChange={(e) => set({ source: { ...convention.source, title: e.target.value } })} />
        </Field>
        <Field>
          {t.sourceNote}
          <Input
            value={convention.source.note ?? ''}
            onChange={(e) => set({ source: { ...convention.source, note: e.target.value } })}
          />
        </Field>
      </Columns>
    </Form>
  )
}

const Form = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.space(3)};
`
