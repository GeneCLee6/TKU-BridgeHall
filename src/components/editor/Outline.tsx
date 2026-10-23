import styled from 'styled-components'
import { strings } from '../../strings.ts'
import type { Section } from '../../types/convention.ts'

/** The convention's section tree in the editor; picking an item shows its form */
export function Outline({
  sections,
  selected,
  onSelect,
}: {
  sections: Section[]
  /** 'info' for the convention's own fields, or a section id */
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <Nav aria-label={strings.editor.outline}>
      <List>
        <li>
          <Item type="button" $depth={0} aria-current={selected === 'info' ? 'true' : undefined} onClick={() => onSelect('info')}>
            {strings.editor.info}
          </Item>
        </li>
        <Tree sections={sections} depth={0} selected={selected} onSelect={onSelect} />
      </List>
    </Nav>
  )
}

function Tree({
  sections,
  depth,
  selected,
  onSelect,
}: {
  sections: Section[]
  depth: number
  selected: string
  onSelect: (id: string) => void
}) {
  return sections.map((s) => (
    <li key={s.id}>
      <Item type="button" $depth={depth} aria-current={selected === s.id ? 'true' : undefined} onClick={() => onSelect(s.id)}>
        {s.title.trim() || strings.editor.untitled}
      </Item>
      {s.children?.length ? (
        <List>
          <Tree sections={s.children} depth={depth + 1} selected={selected} onSelect={onSelect} />
        </List>
      ) : null}
    </li>
  ))
}

/** A select for phones, where there is no room for the tree */
export function OutlineSelect({
  sections,
  selected,
  onSelect,
}: {
  sections: Section[]
  selected: string
  onSelect: (id: string) => void
}) {
  const options: { id: string; label: string }[] = [{ id: 'info', label: strings.editor.info }]
  const walk = (list: Section[], depth: number) =>
    list.forEach((s) => {
      options.push({ id: s.id, label: `${'　'.repeat(depth)}${s.title.trim() || strings.editor.untitled}` })
      walk(s.children ?? [], depth + 1)
    })
  walk(sections, 0)
  return (
    <SelectBox aria-label={strings.editor.outline} value={selected} onChange={(e) => onSelect(e.target.value)}>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </SelectBox>
  )
}

const Nav = styled.nav`
  font-size: 0.9375rem;
`

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`

const Item = styled.button<{ $depth: number }>`
  display: block;
  width: 100%;
  min-height: 34px;
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(2)};
  padding-left: ${({ theme, $depth }) => theme.space(2 + $depth * 4)};
  border: 0;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  text-align: left;
  line-height: 1.4;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }
  &[aria-current='true'] {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 700;
  }
`

const SelectBox = styled.select`
  width: 100%;
  min-height: 40px;
  padding: 0 ${({ theme }) => theme.space(2)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
`
