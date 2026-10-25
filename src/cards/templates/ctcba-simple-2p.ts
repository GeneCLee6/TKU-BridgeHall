import type { CardTemplate } from '../types.ts'
import {
  ctcbaSimpleCompetitive,
  ctcbaSimpleDefence,
  ctcbaSimpleHeader,
  ctcbaSimpleOpening,
} from './ctcba-simple.ts'

// 中華民國橋藝協會「2021 簡易制度卡（非橋士組用）」雙面版 (2021-簡易制度卡(非橋士組用)-雙面.pdf).
// Same cells and labels as the single-sided card (same block ids), set in a serif font. Each A4
// landscape sheet carries two identical copies side by side, to be cut in half: the front has
// the header and 開叫約定, the back 競叫約定, 對抗無王開叫 and 防禦約定, and both sides end with
// （背面尚有約定）. A copy is 340 pt wide (x 71–411 and 432–772 on the front).

const turnOver = '（背面尚有約定）'

export const ctcbaSimple2p: CardTemplate = {
  id: 'ctcba-simple-2p',
  name: '簡易制度卡（非橋士組用）雙面',
  year: 2021,
  publisher: '中華民國橋藝協會',
  paper: 'A4-landscape',
  nUp: 2,
  pages: [
    {
      id: 'front',
      columns: [
        {
          id: 'main',
          width: 100,
          blocks: [
            ...ctcbaSimpleHeader,
            ...ctcbaSimpleOpening,
            { kind: 'note', id: 'front.turn-over', text: turnOver },
          ],
        },
      ],
    },
    {
      id: 'back',
      columns: [
        {
          id: 'main',
          width: 100,
          blocks: [
            ...ctcbaSimpleCompetitive,
            ...ctcbaSimpleDefence,
            { kind: 'note', id: 'back.turn-over', text: turnOver },
          ],
        },
      ],
    },
  ],
}
