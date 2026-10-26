import { useId } from 'react'
import styled from 'styled-components'
import { PROFILE_SCOPES } from '../lib/api.ts'
import { useProfiles } from '../state/ProfileContext.tsx'
import { strings } from '../strings.ts'

/**
 * The header's system profile menu (e1-t12): a labelled native select, grouped by club, team and
 * partnership, in the desktop header ('bar') or the mobile menu drawer ('menu'). A status line
 * tells screen readers which profile shows once it has loaded (a failure also shows on the page). HandbookPage loads this lazily and
 * only when a signed-in reader has more than one profile to choose from.
 */
export function ProfileSwitch({ variant }: { variant: 'bar' | 'menu' }) {
  const { list, activeId, choose, status } = useProfiles()
  const id = useId()
  const active = list.find((p) => p.id === activeId)
  return (
    <Wrap $menu={variant === 'menu'} data-print="hide">
      <label htmlFor={id}>{strings.profiles.label}</label>
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

const Wrap = styled.div<{ $menu: boolean }>`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  ${({ $menu, theme }) => $menu && `padding: ${theme.space(2)} ${theme.space(3)};`}

  label {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  select {
    min-height: 36px;
    max-width: ${({ $menu }) => ($menu ? '100%' : '12rem')};
    padding: 0 ${({ theme }) => theme.space(2)};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
    font-size: 0.875rem;
  }
`
