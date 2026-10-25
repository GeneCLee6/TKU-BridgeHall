import type { CardTemplate } from '../types.ts'
import {
  ctcbaSimpleCompetitive,
  ctcbaSimpleDefence,
  ctcbaSimpleHeader,
  ctcbaSimpleOpening,
} from './ctcba-simple.ts'

// 中華民國橋藝協會「2021 簡易制度卡（非橋士組用）」雙面版. There is no reference image of
// the two-sided PDF in the repo yet, so this uses the single-sided card's cells (same labels,
// same block ids), one half per page; see `pending`.

export const ctcbaSimple2p: CardTemplate = {
  id: 'ctcba-simple-2p',
  name: '簡易制度卡（非橋士組用）雙面',
  year: 2021,
  publisher: '中華民國橋藝協會',
  paper: 'A4-landscape',
  pending:
    '雙面版沒有參考圖：暫用單面版的格子，第 1 頁開叫約定、第 2 頁競叫約定／對抗無王開叫／防禦約定；待對照 2021 雙面 PDF 的格子與版面',
  pages: [
    {
      id: 'p1',
      columns: [{ id: 'main', width: 100, blocks: [...ctcbaSimpleHeader, ...ctcbaSimpleOpening] }],
    },
    {
      id: 'p2',
      columns: [{ id: 'main', width: 100, blocks: [...ctcbaSimpleCompetitive, ...ctcbaSimpleDefence] }],
    },
  ],
}
