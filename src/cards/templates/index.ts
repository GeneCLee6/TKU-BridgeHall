import type { CardTemplate } from '../types.ts'
import { ctcbaSimple } from './ctcba-simple.ts'
import { ctcbaSimple2p } from './ctcba-simple-2p.ts'
import { wbf } from './wbf.ts'

/**
 * Registered card templates; file name = template id. The BSC forms come with e3-t12.
 * Import only from lazy-loaded card pages, tests and scripts (keeps the home page budget).
 */
export const cardTemplates: readonly CardTemplate[] = [wbf, ctcbaSimple, ctcbaSimple2p]
