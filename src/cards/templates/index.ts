import type { CardTemplate } from '../types.ts'
import { bscOpening } from './bsc-opening.ts'
import { bscOvercall } from './bsc-overcall.ts'
import { ctcbaSimple } from './ctcba-simple.ts'
import { ctcbaSimple2p } from './ctcba-simple-2p.ts'
import { wbf } from './wbf.ts'

/**
 * Registered card templates; file name = template id.
 * Import only from lazy-loaded card pages, tests and scripts (keeps the home page budget).
 */
export const cardTemplates: readonly CardTemplate[] = [wbf, ctcbaSimple, ctcbaSimple2p, bscOpening, bscOvercall]

/** The cards every profile has; the Brown Sticker forms come one per marked convention (cards/bsc.ts) */
export const profileTemplates: readonly CardTemplate[] = cardTemplates.filter((t) => !t.brownSticker)
