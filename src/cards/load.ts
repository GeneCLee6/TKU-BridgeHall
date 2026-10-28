import {
  api,
  CLUB_PROFILE_ID,
  errorText,
  type ProfileAccess,
  type ProfileSummary,
  type SystemProfile,
} from '../lib/api.ts'
import { emptyClubProfile, summaryChain } from '../lib/profiles.ts'
import type { Convention } from '../types/convention.ts'

/** What a card page needs to fill a profile's card */
export interface LoadedCard {
  /** From the club down to the profile */
  chain: SystemProfile[]
  summaries: ProfileSummary[]
  access?: ProfileAccess
  content: Convention[]
  /** The Worker could not be reached: the club's card from the handbook's own content, not editable */
  offline?: true
}

/**
 * The profile, the profiles above it (one that cannot be read is left out) and every convention.
 * Signed out only the club's can be read; when the Worker cannot be reached the club's card is
 * filled from the handbook's own content.
 */
export async function fetchCard(
  profileId: string,
  loadAll: () => Promise<Convention[]>,
): Promise<LoadedCard | { error: string }> {
  const all = await loadAll()
  try {
    const [summaries, { profile, access }] = await Promise.all([
      api.book.profiles(),
      api.book.profileWithAccess(profileId),
    ])
    const above =
      profile.id === CLUB_PROFILE_ID
        ? []
        : summaryChain(summaries, profile.parentId ?? CLUB_PROFILE_ID)
    const parents = await Promise.all(above.map((s) => api.book.profile(s.id).catch(() => null)))
    return {
      chain: [...parents.filter((p): p is SystemProfile => !!p), profile],
      summaries,
      ...(access && { access }),
      content: all,
    }
  } catch (e) {
    if (profileId !== CLUB_PROFILE_ID) return { error: errorText(e) }
    return { chain: [emptyClubProfile()], summaries: [], content: all, offline: true }
  }
}

/** A blob as base64, for sending a Word file in JSON */
export async function blobBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}
