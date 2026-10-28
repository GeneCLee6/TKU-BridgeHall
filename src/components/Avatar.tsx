import { useState } from 'react'
import styled from 'styled-components'
import { avatarUrl } from '../lib/account.ts'
import { avatarInitials, avatarSlot } from '../lib/avatar.ts'
import { avatarColors, onAvatar } from '../styles/avatarColors.ts'

/**
 * A member's avatar (e11-t03), the same as TKU-BridgeTable's: their uploaded picture when they have
 * one (`avatar` is its version, from `Me.avatar` or `ClubMember.avatar`), otherwise (and while it
 * loads, or when it fails) their initials on their own colour. Decorative, since the name is always
 * next to it: the initials are drawn by CSS and the picture has no alt text, so neither is read
 * out nor part of the text.
 */
export function Avatar({ id, name, size = 32, avatar }: { id: string; name: string; size?: number; avatar?: number }) {
  const src = avatar ? avatarUrl(id, avatar) : null
  // The address that failed to load; a new version tries again
  const [failed, setFailed] = useState<string | null>(null)
  return (
    <Circle $size={size} $color={avatarColors[avatarSlot(id, avatarColors.length)]} aria-hidden data-avatar data-initials={avatarInitials(name)}>
      {src && failed !== src && (
        <Picture src={src} alt="" width={size} height={size} loading="lazy" decoding="async" draggable={false} onError={() => setFailed(src)} />
      )}
    </Circle>
  )
}

const Circle = styled.span<{ $size: number; $color: string }>`
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  overflow: hidden;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  color: ${onAvatar};
  font-size: ${({ $size }) => Math.round($size * 0.44)}px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  user-select: none;

  &::before {
    content: attr(data-initials);
  }
`

const Picture = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`
