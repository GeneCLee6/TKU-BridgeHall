import {
  BookOpen,
  Megaphone,
  Puzzle,
  Shield,
  SignalHigh,
  SignalLow,
  SignalMedium,
  type LucideIcon,
} from 'lucide-react'
import styled from 'styled-components'
import { strings } from '../strings.ts'
import { conventionKinds, levels, type ConventionKind, type Level } from '../types/convention.ts'

const kindIcons: Record<ConventionKind, LucideIcon> = {
  system: BookOpen,
  convention: Puzzle,
  signal: Megaphone,
  defense: Shield,
}

/** More bars for a higher level, so the label does not rely on colour */
const levelIcons: Record<Level, LucideIcon> = {
  basic: SignalLow,
  intermediate: SignalMedium,
  advanced: SignalHigh,
}

/**
 * A card's kind and level as two small labels, each an icon and a word. A card without a kind is
 * a convention; a level is shown only when one is set. Values this version does not know (from
 * newer online content) are left out rather than shown wrong.
 */
export function KindLevel({
  kind,
  level,
  $small = false,
}: {
  kind?: string
  level?: string
  /** The catalogue's size */
  $small?: boolean
}) {
  const k = (kind ?? 'convention') as ConventionKind
  const l = level as Level | undefined
  const KindIcon = conventionKinds.includes(k) ? kindIcons[k] : undefined
  const LevelIcon = l && levels.includes(l) ? levelIcons[l] : undefined
  if (!KindIcon && !LevelIcon) return null
  const size = $small ? 12 : 14
  return (
    <Labels $small={$small}>
      {KindIcon && (
        <Label $small={$small} data-kind={k}>
          <KindIcon size={size} aria-hidden />
          <span className="visually-hidden">{strings.kindPrefix}</span>
          {strings.kinds[k]}
        </Label>
      )}
      {LevelIcon && l && (
        <Label $small={$small} data-level={l}>
          <LevelIcon size={size} aria-hidden />
          <span className="visually-hidden">{strings.levelPrefix}</span>
          {strings.levels[l]}
        </Label>
      )}
    </Labels>
  )
}

const Labels = styled.span<{ $small: boolean }>`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme, $small }) => theme.space($small ? 1 : 1.5)};
`

const Label = styled.span<{ $small: boolean }>`
  /* Holds the visually hidden prefix inside scrolling boxes (the catalogue, search results) */
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  padding: 0 ${({ theme, $small }) => theme.space($small ? 1.5 : 2)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.badge};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ $small }) => ($small ? '0.6875rem' : '0.75rem')};
  font-weight: 500;
  line-height: ${({ $small }) => ($small ? '1.125rem' : '1.5rem')};
  white-space: nowrap;

  svg {
    flex: none;
    color: ${({ theme }) => theme.colors.structure};
  }
`
