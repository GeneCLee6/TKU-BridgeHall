/**
 * Default avatars (e11-t03): the initial on one of these, picked from the member's id so it never
 * changes. The same ten as TKU-BridgeTable's `avatars` (its e1-t18), so a member has the same colour
 * on both sites; all carry `onAvatar` text at 4.5:1 or better, the same in both themes and every
 * style. Part of the tokens (CLAUDE.md rule 4), in a module of their own: only `Avatar` imports
 * them, and inside `tokens.ts` they would ride along to the home page.
 */
export const avatarColors = ['#1c2e4f', '#7a3b12', '#1f6b43', '#5b2c7a', '#a0302a', '#2a5d8f', '#6e5410', '#3d5a40', '#7a2a55', '#3f4a5c'] as const
export const onAvatar = '#ffffff'
