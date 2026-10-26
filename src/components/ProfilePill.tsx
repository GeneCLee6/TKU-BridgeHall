import { BookOpen } from 'lucide-react'
import styled from 'styled-components'
import type { AppTheme } from '../styles/tokens.ts'
import { useProfiles } from '../state/ProfileContext.tsx'
import { strings } from '../strings.ts'

/** The capsule both the static pill and the profile menu are drawn in (DESIGN-V2 §5.1) */
// oxlint-disable-next-line react/only-export-components
export const pill =(theme: AppTheme) => `
  flex: none;
  flex-wrap: nowrap;
  gap: ${theme.space(1)};
  height: 34px;
  padding: 0 ${theme.space(1)} 0 ${theme.space(3)};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radius.pill};
  background: ${theme.colors.surface};
  color: ${theme.colors.text};
  svg { flex: none; color: ${theme.colors.textMuted}; }
`

/**
 * The header's system profile when there is nothing to choose (signed out, or the club's is the
 * only one): the profile's name in a pill that does nothing (e9-t03). With more to choose from
 * the header loads ProfileSwitch instead.
 */
export function ProfilePill() {
  const { list, activeId } = useProfiles()
  const name = list.find((p) => p.id === activeId)?.name ?? strings.profiles.club
  return (
    <Pill data-print="hide">
      <BookOpen size={16} aria-hidden />
      <span className="visually-hidden">{strings.profiles.label}：</span>
      {name}
    </Pill>
  )
}

const Pill = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  ${({ theme }) => pill(theme)}
  padding-right: ${({ theme }) => theme.space(3)};
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
`
