import { CLUB_PROFILE_ID, type ClubMember, type ProfileInput, type ProfileSummary, type SystemProfile } from './api.ts'

/**
 * 隊伍與搭檔 (E2 e2-t05, e2-t06, e2-t09): pure helpers for the team, partnership and account pages.
 * No storage and no React; the Worker (TKU-BridgeTable worker/teams.ts) checks every change.
 */

/** What a member is called on these pages: their display name, else their username, else the id */
export function memberName(members: readonly ClubMember[], id: string): string {
  const member = members.find((m) => m.id === id)
  return member?.displayName || member?.username || id
}

/** 「小明＋小華」, in the partnership's order (who invited first) */
export const pairName = (members: readonly ClubMember[], userIds: readonly string[]): string =>
  userIds.map((id) => memberName(members, id)).join('＋')

/** What a profile changes on its own layer: how many overrides, conventions turned off and turned on */
export interface ProfileDiff {
  overrides: number
  off: number
  on: number
}

export function profileDiff(profile: Pick<SystemProfile, 'adopted' | 'overrides'>): ProfileDiff {
  const adoptions = Object.values(profile.adopted)
  return {
    overrides: profile.overrides.length,
    off: adoptions.filter((a) => a === 'off').length,
    on: adoptions.filter((a) => a === 'on').length,
  }
}

/** A profile that adopts and overrides nothing of its own: what a new partnership starts with */
export const isFresh = (profile: Pick<SystemProfile, 'adopted' | 'overrides'>): boolean =>
  !profile.overrides.length && !Object.keys(profile.adopted).length

/**
 * The profiles a partnership's profile may copy from (e2-t09): the teams' and the other
 * partnerships' the member may read, the teams first. Its own parent is left out, since the
 * partnership already inherits it as it is.
 */
export function copySources(summaries: readonly ProfileSummary[], target: Pick<SystemProfile, 'id' | 'parentId'>): ProfileSummary[] {
  const parent = target.parentId ?? CLUB_PROFILE_ID
  return summaries
    .filter((s) => s.scope !== 'club' && s.id !== target.id && s.id !== parent)
    .sort((a, b) => Number(a.scope !== 'team') - Number(b.scope !== 'team') || a.name.localeCompare(b.name, 'zh-Hant'))
}

/**
 * The target profile with the source's adoptions and overrides in place of its own (e2-t09,
 * AC-2.7). The notes are not copied: the target keeps its own. Its name, scope, parent and
 * visibility stay too, which a member who is not an editor may not change anyway.
 */
export function copyProfile(target: SystemProfile, source: Pick<SystemProfile, 'adopted' | 'overrides'>): ProfileInput {
  const input: ProfileInput = {
    name: target.name,
    scope: target.scope,
    adopted: { ...source.adopted },
    overrides: [...source.overrides],
    notes: target.notes,
  }
  if (target.parentId !== undefined) input.parentId = target.parentId
  if (target.visibility !== undefined) input.visibility = target.visibility
  return input
}
