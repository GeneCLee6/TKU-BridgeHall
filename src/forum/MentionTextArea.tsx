import { useId, useRef, useState, type KeyboardEvent } from 'react'
import styled from 'styled-components'
import { Avatar } from '../components/Avatar.tsx'
import { TextArea } from '../components/ui.tsx'
import type { ClubMember } from '../lib/api.ts'
import { insertMention, mentionAt, mentionMatches } from '../lib/forumPosts.ts'
import { forumStrings as t } from './forumStrings.ts'

/**
 * A text box where typing `@` lists the club's members (avatar and name) to pick from (e11-t14,
 * AC-11.4): arrows move, Enter or Tab picks, Esc closes. Picking writes `@username `, which the
 * Worker turns into a mention.
 */
export function MentionTextArea({
  value,
  onChange,
  members,
  label,
  placeholder,
  rows = 3,
  autoFocus,
}: {
  value: string
  onChange: (text: string) => void
  members: readonly ClubMember[]
  label: string
  placeholder?: string
  rows?: number
  autoFocus?: boolean
}) {
  const listId = useId()
  const hintId = useId()
  const box = useRef<HTMLTextAreaElement>(null)
  const [caret, setCaret] = useState<number | null>(null)
  const [active, setActive] = useState(0)
  const [closedAt, setClosedAt] = useState<number | null>(null)

  const typing = caret === null ? null : mentionAt(value, caret)
  const matches = typing && closedAt !== typing.start ? mentionMatches(members, typing.query) : []
  const open = matches.length > 0
  const current = Math.min(active, matches.length - 1)

  const track = () => {
    const el = box.current
    if (el) setCaret(el.selectionStart === el.selectionEnd ? el.selectionStart : null)
  }

  const pick = (member: ClubMember) => {
    if (!typing || caret === null) return
    const next = insertMention(value, typing.start, caret, member.username)
    onChange(next.text)
    setCaret(next.caret)
    setActive(0)
    requestAnimationFrame(() => {
      const el = box.current
      if (!el) return
      el.focus()
      el.setSelectionRange(next.caret, next.caret)
    })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open) return
    if (event.key === 'ArrowDown') setActive((current + 1) % matches.length)
    else if (event.key === 'ArrowUp') setActive((current - 1 + matches.length) % matches.length)
    else if (event.key === 'Enter' || event.key === 'Tab') pick(matches[current])
    else if (event.key === 'Escape') setClosedAt(typing?.start ?? null)
    else return
    event.preventDefault()
  }

  return (
    <Wrap>
      <TextArea
        ref={box}
        value={value}
        rows={rows}
        aria-label={label}
        placeholder={placeholder}
        autoFocus={autoFocus}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${current}` : undefined}
        aria-describedby={hintId}
        onChange={(e) => {
          onChange(e.target.value)
          setCaret(e.target.selectionStart)
          setActive(0)
          setClosedAt(null)
        }}
        onSelect={track}
        onKeyDown={onKeyDown}
        onBlur={() => setCaret(null)}
      />
      <span id={hintId} className="visually-hidden">
        {t.mentionHint}
      </span>
      {open && (
        <List id={listId} role="listbox" aria-label={t.mentionList}>
          {matches.map((member, i) => (
            <Option
              key={member.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === current}
              $active={i === current}
              // Before the box loses focus, so the caret is still known
              onMouseDown={(e) => {
                e.preventDefault()
                pick(member)
              }}
            >
              <Avatar id={member.id} name={member.displayName || member.username} avatar={member.avatar} size={24} />
              <span>{member.displayName || member.username}</span>
              {member.displayName && <Username>@{member.username}</Username>}
            </Option>
          ))}
        </List>
      )}
    </Wrap>
  )
}

const Wrap = styled.div`
  position: relative;
  display: grid;
`

const List = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 20;
  min-width: min(100%, 16rem);
  margin: ${({ theme }) => theme.space(1)} 0 0;
  padding: ${({ theme }) => theme.space(1)};
  list-style: none;
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.panel};
`

const Option = styled.li<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : 'transparent')};
  cursor: pointer;
`

const Username = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`
