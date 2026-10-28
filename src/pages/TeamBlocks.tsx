import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Avatar } from '../components/Avatar.tsx'
import { Button, Muted, Row } from '../components/ui.tsx'
import type { ClubMember, ProfileAccess } from '../lib/api.ts'
import { memberName } from '../lib/teams.ts'
import { useProfiles } from '../state/ProfileContext.tsx'
import { teamStrings as t } from './teamStrings.ts'

/**
 * The ways into a team's or partnership's profile (AC-2.4, AC-2.5): read the handbook with it
 * (it becomes the reader's profile), compare it with its parent (e1-t15), and edit it (e1-t14)
 * when the Worker says the member may. 制度卡 joins them with E3 (D4, e3-t11).
 */
export function ProfileEntries({ profileId, name, access }: { profileId: string; name: string; access?: ProfileAccess }) {
  const { choose } = useProfiles()
  const navigate = useNavigate()
  const id = encodeURIComponent(profileId)
  return (
    <>
      <Row>
        <Button
          type="button"
          $variant="primary"
          title={t.readHint}
          aria-label={`${t.read}：${name}`}
          onClick={() => {
            choose(profileId)
            navigate('/')
          }}
        >
          {t.read}
        </Button>
        <Link to={`/profiles/${id}/compare`} aria-label={`${t.compare}：${name}`}>
          {t.compare}
        </Link>
        {access?.edit && (
          <Link to={`/profiles/${id}/edit`} aria-label={`${t.edit}：${name}`}>
            {t.edit}
          </Link>
        )}
      </Row>
      {access && !access.edit && <Muted>{t.readOnly}</Muted>}
      <Muted>{t.cardsLater}</Muted>
    </>
  )
}

/** A member with their avatar and name, linked to their profile page (e11-t04), and what they are (隊長) when given */
export function MemberChip({ members, id, role }: { members: readonly ClubMember[]; id: string; role?: string }) {
  const member = members.find((m) => m.id === id)
  const name = memberName(members, id)
  return (
    <Chip>
      <Avatar id={id} name={name} size={28} avatar={member?.avatar} />
      <Link to={`/u/${encodeURIComponent(id)}`}>{name}</Link>
      {role && <Badge>{role}</Badge>}
    </Chip>
  )
}

export const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`

export const Badge = styled.span`
  padding: 0 ${({ theme }) => theme.space(2)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.badge};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
`

export const Plain = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  margin: 0;
  padding: 0;
  list-style: none;
`

export const Stack = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`
