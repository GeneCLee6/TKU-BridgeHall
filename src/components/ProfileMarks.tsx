import styled, { type DefaultTheme } from 'styled-components'
import type { Origin } from '../lib/profiles.ts'
import { useProfiles } from '../state/ProfileContext.tsx'
import { strings } from '../strings.ts'

/**
 * Where the reader's system profile differs from the handbook (e1-t13): a mark with words, not
 * only a colour, next to an overridden section or convention and in an overridden call's meaning,
 * and the profiles' private notes. Readers without a profile (signed out) never see either.
 */

// oxlint-disable-next-line react/only-export-components
export const originColor = (theme: DefaultTheme, origin: Origin) =>
  ({ club: theme.colors.structure, team: theme.colors.accent, partnership: theme.colors.seal })[
    origin
  ]

export function OriginMark({ origin }: { origin?: Origin }) {
  return origin ? <Mark $origin={origin}>{strings.profiles.overridden[origin]}</Mark> : null
}

/** The notes on a convention (without `sectionId`) or on one of its sections */
export function ProfileNotes({ slug, sectionId }: { slug: string; sectionId?: string }) {
  const notes =
    useProfiles()
      .view?.notes(slug)
      .filter((n) => n.sectionId === sectionId) ?? []
  return notes.map((note, i) => (
    <Note key={`${note.profileId}-${i}`} $origin={note.origin} data-print="hide">
      <strong>{strings.profiles.notes[note.origin]}</strong>
      <p>{note.text}</p>
    </Note>
  ))
}

const Mark = styled.span<{ $origin: Origin }>`
  display: inline-block;
  margin-left: ${({ theme }) => theme.space(2)};
  padding: 0 ${({ theme }) => theme.space(1.5)};
  border: 1px solid ${({ theme, $origin }) => originColor(theme, $origin)};
  border-radius: ${({ theme }) => theme.shape.tag};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.5;
  vertical-align: middle;
  white-space: nowrap;
`

const Note = styled.aside<{ $origin: Origin }>`
  margin: 0 0 ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-left: 3px solid ${({ theme, $origin }) => originColor(theme, $origin)};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  font-size: 0.875rem;

  p {
    margin: ${({ theme }) => theme.space(0.5)} 0 0;
    white-space: pre-wrap;
  }
`
