import { BookOpen, Handshake, Users } from 'lucide-react'
import { useId } from 'react'
import styled from 'styled-components'
import { PROFILE_SCOPES, type ProfileSummary } from '../lib/api.ts'
import { useProfiles } from '../state/ProfileContext.tsx'
import { strings } from '../strings.ts'
import { pill } from './ProfilePill.tsx'

/** 社團 a book, 隊伍 people, 搭檔 a handshake (DESIGN-V2 §5.1) */
function ProfileIcon({ scope }: { scope: ProfileSummary['scope'] }) {
  const Icon = { club: BookOpen, team: Users, partnership: Handshake }[scope]
  return <Icon size={16} aria-hidden />
}

/**
 * The header's system profile menu (e1-t12): a labelled native select, grouped by club, team and
 * partnership; a pill in the desktop header ('bar', e9-t03) or a labelled row in the mobile menu
 * drawer ('menu'). A status line tells screen readers which profile shows once it has loaded (a
 * failure also shows on the page). The handbook loads this lazily and only when a signed-in reader
 * has more than one profile to choose from; otherwise the header shows ProfilePill.
 */
export function ProfileSwitch({ variant }: { variant: 'bar' | 'menu' }) {
  const { list, activeId, choose, status } = useProfiles()
  const id = useId()
  const active = list.find((p) => p.id === activeId)
  const bar = variant === 'bar'
  return (
    <Wrap $bar={bar} data-print="hide">
      {bar && <ProfileIcon scope={active?.scope ?? 'club'} />}
      <label htmlFor={id} className={bar ? 'visually-hidden' : undefined}>
        {strings.profiles.label}
      </label>
      <select
        id={id}
        value={activeId}
        onChange={(e) => choose(e.target.value)}
        aria-busy={status === 'loading'}
      >
        {PROFILE_SCOPES.map((scope) => {
          const items = list.filter((p) => p.scope === scope)
          return (
            items.length > 0 && (
              <optgroup key={scope} label={strings.profiles.scopes[scope]}>
                {items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            )
          )
        })}
      </select>
      <span role="status" className="visually-hidden">
        {status === 'loading'
          ? strings.profiles.loading
          : status === 'failed'
            ? strings.profiles.failed
            : active && strings.profiles.showing(active.name)}
      </span>
    </Wrap>
  )
}

const Wrap = styled.div<{ $bar: boolean }>`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  ${({ $bar, theme }) => ($bar ? pill(theme) : `padding: ${theme.space(2)} ${theme.space(3)};`)}

  label {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  select {
    min-height: ${({ $bar }) => ($bar ? '30px' : '36px')};
    max-width: ${({ $bar }) => ($bar ? '12rem' : '100%')};
    padding: 0 ${({ theme }) => theme.space(2)};
    border: ${({ $bar, theme }) => ($bar ? '0' : `1px solid ${theme.colors.border}`)};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
    font-size: 0.875rem;
    ${({ $bar }) => $bar && 'font-weight: 500; cursor: pointer;'}
  }
`
