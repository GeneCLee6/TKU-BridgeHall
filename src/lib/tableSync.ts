/**
 * The calls of the report page /integrations/table (E7: e7-t03, e7-t04), kept out of lib/api.ts so
 * that the home page does not carry them; the types are in api.ts with the others that mirror
 * TKU-BridgeTable shared/protocol.ts. All three are the editors' (bookEdit).
 */

import {
  request,
  send,
  type RobotMeaningsItem,
  type RobotMeaningsQuery,
  type SystemSpecStatus,
} from './api.ts'
import type { SystemSpec } from './systemSpec.ts'

/**
 * A synced spec's size (its JSON), how many auctions one robot-meanings request may ask about and
 * how many calls after each; the same as the table's SYSTEM_SPEC_LIMITS
 */
export const SYSTEM_SPEC_LIMITS = {
  bytesMax: 1_000_000,
  meaningItemsMax: 10,
  meaningCallsMax: 38,
} as const

export const tableSync = {
  /** The profile's last synced rules (null if never), and which profile TKB follows; that one without `profileId` */
  status: (profileId?: string) =>
    request<SystemSpecStatus>(
      `/api/book/system-spec${profileId ? `?profileId=${encodeURIComponent(profileId)}` : ''}`,
    ),
  /** Replaces the profile's synced rules; 404 `profileGone`, 413 `contentTooLarge` */
  sync: (spec: SystemSpec) =>
    send<SystemSpecStatus>('PUT', `/api/book/system-spec/${encodeURIComponent(spec.profileId)}`, {
      spec,
    }),
  /** What TKB's rules say the calls show, at most SYSTEM_SPEC_LIMITS.meaningItemsMax auctions at a time */
  robotMeanings: (items: RobotMeaningsQuery['items']) =>
    send<{ items: RobotMeaningsItem[] }>('POST', '/api/book/robot-meanings', { items }).then(
      (r) => r.items,
    ),
}
