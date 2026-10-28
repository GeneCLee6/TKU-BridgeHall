import { cardColors } from '../styles/tokens.ts'
import { PAPER_WIDTH } from './describe.ts'
import type { CardTemplate } from './types.ts'

/**
 * Printing a card page prints the sheets alone: A4 in the form's orientation, margins that leave
 * the form at its own size, each sheet (and the supplementary notes) on a page of its own, the n-up
 * copies drawn, and the site's marks (grounds, links, the selected cell) left out. Used by the card
 * page, a card version and a team's cards (e3-t07, e3-t09, e3-t11).
 */
export function PrintStyle({ template }: { template: CardTemplate }) {
  const orientation = template.paper === 'A4-landscape' ? 'landscape' : 'portrait'
  const side =
    template.paper === 'A4-landscape'
      ? (842 - PAPER_WIDTH['A4-landscape']) / 2
      : (595 - PAPER_WIDTH['A4-portrait']) / 2
  return (
    <style media="print">{`
@page { size: A4 ${orientation}; margin: 20pt ${side}pt; }
html, body { background: ${cardColors.paper} !important; }
#main { padding: 0 !important; margin: 0 !important; max-width: none !important; display: block !important; }
[data-card-scroll] { overflow: visible !important; border: 0 !important; padding: 0 !important; background: none !important; }
[data-card-paper] { margin: 0 !important; box-shadow: none !important; break-after: page; }
[data-card-paper]:last-child { break-after: auto; }
[data-card-set]:not(:last-child) [data-card-paper]:last-child { break-after: page; }
[data-card-extra] { display: block !important; }
[data-card-slot] { background-color: transparent !important; box-shadow: none !important; outline: none !important; }
[data-card-slot][data-origin] { text-decoration: underline; }
[data-card-slot] button { cursor: default; }
`}</style>
  )
}
