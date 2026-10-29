import styled from 'styled-components'
import { Suit } from '../components/Suit.tsx'
import type { SuitLetter } from '../lib/calls.ts'
import { REACTION_EMOJIS, type ReactionEmoji, type Reactions } from '../lib/forum.ts'
import { myReaction } from '../lib/forumPosts.ts'
import { forumStrings as t } from './forumStrings.ts'

const SUIT_OF: Partial<Record<ReactionEmoji, SuitLetter>> = { '♠': 'S', '♥': 'H', '♦': 'D', '♣': 'C' }

/**
 * The five reactions, 👍 ♠ ♥ ♦ ♣ (the suits in the site's four colours), each with how many
 * members gave it (e11-t14, AC-11.4). One per member: pressing another moves it, pressing their
 * own takes it back. The numbers change at once; `onPick` sends it.
 */
export function ReactionBar({
  reactions,
  userId,
  onPick,
  small = false,
}: {
  reactions: Reactions
  userId: string | undefined
  onPick: (emoji: ReactionEmoji) => void
  small?: boolean
}) {
  const mine = myReaction(reactions, userId)
  return (
    <Bar role="group" aria-label={t.reactions} $small={small}>
      {REACTION_EMOJIS.map((emoji) => {
        const n = reactions[emoji]?.length ?? 0
        const suit = SUIT_OF[emoji]
        return (
          <Choice
            key={emoji}
            type="button"
            aria-pressed={mine === emoji}
            aria-label={t.reactionLabel(t.reactionNames[emoji], n)}
            $on={mine === emoji}
            onClick={() => onPick(emoji)}
          >
            <span aria-hidden>{suit ? <Suit suit={suit} /> : emoji}</span>
            {n > 0 && <span aria-hidden>{n}</span>}
          </Choice>
        )
      })}
    </Bar>
  )
}

const Bar = styled.div<{ $small: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1)};
  font-size: ${({ $small }) => ($small ? '0.8125rem' : '0.9375rem')};
`

const Choice = styled.button<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  min-height: 2em;
  padding: 0 ${({ theme }) => theme.space(2)};
  border: ${({ theme }) => theme.borders.control} ${({ theme, $on }) => ($on ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.shape.tag};
  background: ${({ theme, $on }) => ($on ? theme.colors.primarySoft : theme.colors.surface)};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-variant-numeric: tabular-nums;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`
