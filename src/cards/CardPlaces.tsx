import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { cardStrings as t } from '../pages/cardStrings.ts'
import type { Convention } from '../types/convention.ts'
import { cardPlaces } from './places.ts'

/** The cells a section fills on the convention cards, linked to them (e3-t10); see placesContext.tsx */
export default function CardPlaces({
  cardSlots,
  profileId,
  target,
  convention,
}: {
  cardSlots: readonly string[] | undefined
  profileId: string
  target: string
  convention?: Pick<Convention, 'slug' | 'brownSticker'>
}) {
  const places = cardPlaces(cardSlots, target, convention)
  if (!places.length) return null
  return (
    <Places data-print="hide" data-card-places>
      <span>{t.places.title}</span>
      {places.map((p, i) => (
        <span key={p.slot}>
          {i > 0 && '、'}
          <Link
            to={`/cards/${encodeURIComponent(profileId)}/${p.path}?cell=${encodeURIComponent(p.slot)}`}
            aria-label={t.places.link(t.places.short[p.templateId], p.label)}
          >
            {t.places.short[p.templateId]} · {p.label}
          </Link>
        </span>
      ))}
    </Places>
  )
}

const Places = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: 0 ${({ theme }) => theme.space(1)};
  margin: 0 0 ${({ theme }) => theme.space(2)};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
`
