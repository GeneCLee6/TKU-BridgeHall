import { createContext, lazy, Suspense, useContext } from 'react'
import type { BrownSticker } from '../types/convention.ts'

/**
 * 「在制度卡的位置」 beside a section (E3 e3-t10, AC-3.6). The convention page provides the
 * convention's `cardSlots` and the reader's profile; a section, or the convention's top (`*`),
 * that some entry takes its text from shows the cells it fills, each linked to that cell on the
 * profile's card. The templates are big, so the list is a lazy chunk, loaded only when an entry
 * mentions the section. Elsewhere (the whole book, print) there is no provider and nothing shows.
 */
export interface CardPlacesSource {
  cardSlots: readonly string[] | undefined
  profileId: string
  /** The convention, for its Brown Sticker form */
  slug?: string
  brownSticker?: BrownSticker
}

// oxlint-disable-next-line react/only-export-components
export const CardPlacesContext = createContext<CardPlacesSource | null>(null)

const CardPlaces = lazy(() => import('./CardPlaces.tsx'))

/** Whether `cardSlots` may have anything for `target` (cheap: decides whether to load the templates) */
// oxlint-disable-next-line react/only-export-components
export function mentions(cardSlots: readonly string[] | undefined, target: string): boolean {
  const tail = target === '*' ? ' <- *' : ` <- ${target}`
  return !!cardSlots?.some((entry) => {
    const i = entry.trimEnd().lastIndexOf(tail)
    if (i < 0) return false
    const rest = entry.trimEnd().slice(i + tail.length)
    return rest === '' || rest.startsWith('#')
  })
}

export function SectionCardPlaces({ target }: { target: string }) {
  const source = useContext(CardPlacesContext)
  if (!source || !mentions(source.cardSlots, target)) return null
  return (
    // The marker lets the screenshots wait for the line (tests/browser/fixtures.ts)
    <Suspense fallback={<span hidden data-card-places-pending />}>
      <CardPlaces
        cardSlots={source.cardSlots}
        profileId={source.profileId}
        target={target}
        {...(source.slug && { convention: { slug: source.slug, brownSticker: source.brownSticker } })}
      />
    </Suspense>
  )
}
