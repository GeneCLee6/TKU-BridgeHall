import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import styled from 'styled-components'
import { blankBlock } from '../../lib/editing.ts'
import { SECTION_ID_PATTERN } from '../../lib/content.ts'
import { strings } from '../../strings.ts'
import type { Block, Section } from '../../types/convention.ts'
import { Button, Field, Input, Row } from '../ui.tsx'
import { BlockEditor, PendingField } from './BlockEditor.tsx'
import { MiniButton } from './fields.tsx'

export type SectionAction = 'up' | 'down' | 'indent' | 'outdent' | 'addAfter' | 'addChild' | 'delete'

const t = strings.editor
const KINDS: Block['kind'][] = ['paragraph', 'responses', 'rules', 'note', 'hand']

/** The fields and content blocks of one section, with the buttons that move it in the tree */
export function SectionForm({
  section,
  can,
  takenIds,
  onChange,
  onAction,
}: {
  section: Section
  /** Which tree moves make sense here */
  can: Record<'up' | 'down' | 'indent' | 'outdent', boolean>
  /** Ids of the other sections, so a changed id stays unique */
  takenIds: string[]
  onChange: (section: Section) => void
  onAction: (action: SectionAction) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [idText, setIdText] = useState(section.id)
  const idProblem = !SECTION_ID_PATTERN.test(idText) || takenIds.includes(idText)
  const blocks = section.blocks ?? []
  const setBlocks = (next: Block[]) => onChange({ ...section, blocks: next })
  const moveBlock = (i: number, delta: -1 | 1) => {
    const to = i + delta
    if (to < 0 || to >= blocks.length) return
    const next = [...blocks]
    ;[next[i], next[to]] = [next[to], next[i]]
    setBlocks(next)
  }
  const tools: { action: SectionAction; label: string; icon: typeof ArrowUp; enabled: boolean }[] = [
    { action: 'up', label: t.moveUp, icon: ArrowUp, enabled: can.up },
    { action: 'down', label: t.moveDown, icon: ArrowDown, enabled: can.down },
    { action: 'outdent', label: t.outdent, icon: ArrowLeft, enabled: can.outdent },
    { action: 'indent', label: t.indent, icon: ArrowRight, enabled: can.indent },
  ]

  return (
    <Form aria-label={section.title || t.untitled}>
      <Toolbar>
        <Row>
          {tools.map(({ action, label, icon: Icon, enabled }) => (
            <MiniButton key={action} type="button" disabled={!enabled} onClick={() => onAction(action)} aria-label={label} title={label}>
              <Icon size={16} aria-hidden />
            </MiniButton>
          ))}
        </Row>
        <Row>
          <Button type="button" $small onClick={() => onAction('addAfter')}>
            <Plus size={14} aria-hidden />
            {t.addSectionAfter}
          </Button>
          <Button type="button" $small onClick={() => onAction('addChild')}>
            <Plus size={14} aria-hidden />
            {t.addChild}
          </Button>
          {confirming ? (
            <>
              <span>{t.confirmDeleteSection(section.title || t.untitled)}</span>
              <Button type="button" $small $variant="danger" onClick={() => onAction('delete')}>
                {strings.confirm}
              </Button>
              <Button type="button" $small onClick={() => setConfirming(false)}>
                {strings.cancel}
              </Button>
            </>
          ) : (
            <Button type="button" $small $variant="danger" onClick={() => setConfirming(true)}>
              <Trash2 size={14} aria-hidden />
              {t.deleteSection}
            </Button>
          )}
        </Row>
      </Toolbar>

      <Field>
        {t.sectionTitle}
        <Input value={section.title} onChange={(e) => onChange({ ...section, title: e.target.value })} />
      </Field>
      <Columns>
        <Field>
          {t.originalTitle}
          <Input value={section.originalTitle ?? ''} onChange={(e) => onChange({ ...section, originalTitle: e.target.value })} />
          <small>{t.originalTitleHint}</small>
        </Field>
        <Field>
          {t.sectionSummary}
          <Input value={section.summary ?? ''} onChange={(e) => onChange({ ...section, summary: e.target.value })} />
        </Field>
      </Columns>
      <PendingField value={section.pending ?? ''} onChange={(pending) => onChange({ ...section, pending })} />
      <Advanced>
        <summary>{t.sectionId}</summary>
        <Field>
          {t.sectionId}
          <Input
            value={idText}
            aria-invalid={idProblem}
            onChange={(e) => {
              const value = e.target.value.trim().toLowerCase()
              setIdText(value)
              if (SECTION_ID_PATTERN.test(value) && !takenIds.includes(value)) onChange({ ...section, id: value })
            }}
          />
          <small>{t.sectionIdHint}</small>
        </Field>
      </Advanced>

      <BlocksTitle>{t.blocks}</BlocksTitle>
      {blocks.map((block, i) => (
        <BlockEditor
          key={i}
          block={block}
          index={i}
          count={blocks.length}
          onChange={(b) => setBlocks(blocks.map((x, j) => (j === i ? b : x)))}
          onMove={(delta) => moveBlock(i, delta)}
          onRemove={() => setBlocks(blocks.filter((_, j) => j !== i))}
        />
      ))}
      <Row>
        <span>{t.addBlock}</span>
        {KINDS.map((kind) => (
          <Button key={kind} type="button" $small onClick={() => setBlocks([...blocks, blankBlock(kind)])}>
            <Plus size={14} aria-hidden />
            {t.blockNames[kind]}
          </Button>
        ))}
      </Row>
    </Form>
  )
}

const Form = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(2)};
  padding-bottom: ${({ theme }) => theme.space(3)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.space(3)};
`

const Advanced = styled.details`
  font-size: 0.875rem;
  summary {
    cursor: pointer;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  & > label {
    margin-top: ${({ theme }) => theme.space(2)};
  }
`

const BlocksTitle = styled.h3`
  margin: ${({ theme }) => theme.space(2)} 0 0;
  font-size: 1rem;
`
