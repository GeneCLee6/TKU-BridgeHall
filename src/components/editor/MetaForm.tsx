import { useState } from 'react'
import styled from 'styled-components'
import { splitList } from '../../lib/editing.ts'
import { strings } from '../../strings.ts'
import {
  brownStickers,
  conventionKinds,
  levels,
  type BrownSticker,
  type Category,
  type CategoryId,
  type Convention,
  type ConventionKind,
  type ConventionMeta,
  type Level,
} from '../../types/convention.ts'
import { Field, Input, Select } from '../ui.tsx'
import { AutoTextArea } from './fields.tsx'

const t = strings.editor

/**
 * A convention's own fields: names, address, category, kind, level, Brown Sticker mark,
 * prerequisites, tags, summary and source. `conventions` is the catalogue the prerequisites are picked from.
 */
export function MetaForm({
  convention,
  categories,
  conventions,
  slugEditable,
  slugTaken,
  onChange,
}: {
  convention: Convention
  categories: Category[]
  conventions: ConventionMeta[]
  /** Only a new convention can choose its address */
  slugEditable: boolean
  slugTaken: boolean
  onChange: (convention: Convention) => void
}) {
  // Lists are typed as text and split on save, so a trailing 、 does not vanish while typing
  const [aliases, setAliases] = useState((convention.aliases ?? []).join('、'))
  const [tags, setTags] = useState(convention.tags.join('、'))
  const set = (patch: Partial<Convention>) => onChange({ ...convention, ...patch })
  const prerequisites = convention.prerequisites ?? []
  const togglePrerequisite = (slug: string, on: boolean) => {
    const next = on ? [...prerequisites, slug] : prerequisites.filter((p) => p !== slug)
    set({ prerequisites: next.length ? next : undefined })
  }
  const known = new Set(conventions.map((c) => c.slug))
  // Choices in catalogue order; a prerequisite that no longer exists stays visible so it can be removed
  const choices = [
    ...conventions.filter((c) => c.slug !== convention.slug).map((c) => ({ slug: c.slug, label: c.nameZh })),
    ...prerequisites.filter((p) => !known.has(p)).map((p) => ({ slug: p, label: t.prerequisitesMissing(p) })),
  ]

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
      <Columns>
        <Field>
          {t.kind}
          <Select
            value={convention.kind ?? 'convention'}
            onChange={(e) => set({ kind: e.target.value as ConventionKind })}
          >
            {conventionKinds.map((k) => (
              <option key={k} value={k}>
                {strings.kinds[k]}
              </option>
            ))}
          </Select>
          <small>{t.kindHint}</small>
        </Field>
        <Field>
          {t.level}
          <Select
            value={convention.level ?? ''}
            onChange={(e) => set({ level: (e.target.value || undefined) as Level | undefined })}
          >
            <option value="">{t.levelNone}</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {strings.levels[l]}
              </option>
            ))}
          </Select>
          <small>{t.levelHint}</small>
        </Field>
      </Columns>
      <Columns>
        <Field>
          {t.brownSticker}
          <Select
            value={convention.brownSticker ?? ''}
            onChange={(e) => set({ brownSticker: (e.target.value || undefined) as BrownSticker | undefined })}
          >
            <option value="">{t.brownStickerNone}</option>
            {brownStickers.map((b) => (
              <option key={b} value={b}>
                {t.brownStickers[b]}
              </option>
            ))}
          </Select>
          <small>{t.brownStickerHint}</small>
        </Field>
      </Columns>
      <Choices>
        <legend>{t.prerequisites}</legend>
        <small>{t.prerequisitesHint}</small>
        <ul>
          {choices.map((c) => (
            <li key={c.slug}>
              <label>
                <input
                  type="checkbox"
                  checked={prerequisites.includes(c.slug)}
                  onChange={(e) => togglePrerequisite(c.slug, e.target.checked)}
                />
                {c.label}
              </label>
            </li>
          ))}
        </ul>
      </Choices>
      {/* Long text gets a whole row and wraps, instead of scrolling inside half a row */}
      <Field>
        {t.summary}
        <AutoTextArea minRows={1} value={convention.summary} onChange={(e) => set({ summary: e.target.value })} />
        <small>{t.summaryHint}</small>
      </Field>
      <Field>
        {t.tags}
        <AutoTextArea
          minRows={1}
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
        <AutoTextArea
          minRows={1}
          value={aliases}
          onChange={(e) => {
            setAliases(e.target.value)
            set({ aliases: splitList(e.target.value) })
          }}
        />
        <small>{t.aliasesHint}</small>
      </Field>
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

const Choices = styled.fieldset`
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
  font-size: 0.8125rem;
  line-height: 1.5;

  legend {
    padding: 0;
    font-weight: 600;
  }
  small {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.75rem;
  }
  ul {
    /* A positioned box, so nothing visually hidden inside it escapes the scroll */
    position: relative;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(3)};
    max-height: 12rem;
    overflow-y: auto;
    margin: 0;
    padding: ${({ theme }) => theme.space(2)};
    border: ${({ theme }) => theme.borders.control} ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.shape.control};
    list-style: none;
  }
  label {
    display: flex;
    align-items: flex-start;
    gap: ${({ theme }) => theme.space(2)};
    cursor: pointer;
  }
  input {
    margin-top: 0.25em;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`
