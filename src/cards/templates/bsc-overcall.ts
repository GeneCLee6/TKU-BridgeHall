import type { CardTemplate } from '../types.ts'
import { bscHelp } from './bsc-opening.ts'

// WBF Brown Sticker Overcall Announcement Form (WBF版BSC蓋叫申報表.docx on the CTCBA download
// page; Appendix 1 of the WBF Systems Policy). A4 portrait, Calibri 11 pt, one table 9530 twips
// wide (476.5 pt) of 12 grid columns; labels are copied from the file as printed. As on the
// opening form (bsc-opening.ts) the answer rows get fixed lines, chosen to fill one A4 page.
//
// - "Our overcall of ___ at ___ vulnerability": the last two cells print "at" and "vulnerability"
//   with the blank between them; here one fill-in with "vulnerability" after it.
// - "Applies:" prints "Opposite PH; Opposite UPH; All the time" to strike out: a choice.
// - The form has no blank rows under "With what hands will advancer pass the overcall?",
//   "Meanings of other advances and follow ups:" and "Responses after opponent’s DBL"; like the
//   other rows they get lines to write in.
// - "Proposed defence" is a centred paragraph below the table: here the last boxed cell.

const W = 9530 // twips
const pct = (twips: number) => (twips / W) * 100

export const bscOvercall: CardTemplate = {
  id: 'bsc-overcall',
  name: 'Brown Sticker Overcall Announcement Form',
  nameZh: '棕標蓋叫申報表',
  year: 2016,
  publisher: 'World Bridge Federation',
  paper: 'A4-portrait',
  language: 'en',
  printWidth: W / 20,
  fontSize: 11,
  brownSticker: 'overcall',
  pages: [
    {
      id: 'p1',
      lineHeight: 13.5,
      columns: [
        {
          id: 'form',
          width: 100,
          blocks: [
            { kind: 'banner', id: 'title', title: 'BROWN STICKER OVERCALL ANNOUNCEMENT FORM', lines: 2 },
            {
              kind: 'note',
              id: 'send',
              text: 'This form is to be completed and sent, by email, to anna@ecats.co.uk by the closing date announced in the Conditions of Contest',
            },
            { kind: 'text', id: 'names', label: 'Names:', lines: 1 },
            {
              kind: 'split',
              id: 'event',
              parts: [
                { width: pct(3495), blocks: [{ kind: 'text', id: 'country', label: 'Country', lines: 1 }] },
                { width: pct(3948 + 2087), blocks: [{ kind: 'text', id: 'event-name', label: 'Event', lines: 1 }] },
              ],
            },
            {
              kind: 'split',
              id: 'opening',
              parts: [
                { width: pct(3495 + 1017), blocks: [{ kind: 'text', id: 'their-bid', label: 'After opponents opening bid of', lines: 1 }] },
                { width: pct(1126 + 3892), blocks: [{ kind: 'text', id: 'their-shows', label: 'showing', lines: 1 }] },
              ],
            },
            {
              kind: 'split',
              id: 'overcall',
              parts: [
                { width: pct(2222 + 2966), blocks: [{ kind: 'text', id: 'bid', label: 'Our overcall of', lines: 1, help: bscHelp.overcall }] },
                {
                  width: pct(1084 + 3258),
                  blocks: [{ kind: 'text', id: 'vulnerability', label: 'at', suffix: 'vulnerability', lines: 1 }],
                },
              ],
            },
            { kind: 'text', id: 'shows', label: 'Shows:', lines: 2 },
            {
              kind: 'choice',
              id: 'applies',
              label: 'Applies:',
              options: [
                { id: 'opposite-ph', label: 'Opposite PH' },
                { id: 'opposite-uph', label: 'Opposite UPH' },
                { id: 'always', label: 'All the time' },
              ],
            },
            { kind: 'cells', id: 'description', title: 'Detailed Description:', lines: 7, help: bscHelp.description },
            { kind: 'heading', id: 'uncontested', title: 'Responses and Rebids When Responder Passes' },
            { kind: 'cells', id: 'pass', title: 'With what hands will advancer pass the overcall?', lines: 3 },
            { kind: 'cells', id: 'advances', title: 'Meanings of other advances and follow ups:', lines: 6, help: bscHelp.description },
            { kind: 'heading', id: 'competitive', title: 'Competitive Agreements' },
            {
              kind: 'cells',
              id: 'vs-double',
              title: 'Responses after opponent’s DBL (including Pass, RDBL and expected follow-ups)',
              lines: 3,
              help: bscHelp.description,
            },
            { kind: 'cells', id: 'vs-bid', title: 'Responses after opponent’s bid:', lines: 3 },
            { kind: 'cells', id: 'after-double', title: 'Rebids after opener DBLs the overcall (1X)-2Y-(P)-P-(DBL)-?', lines: 3 },
            { kind: 'cells', id: 'after-advance-double', title: 'Rebids after opener DBLs advancer’s bid:', lines: 3 },
            { kind: 'cells', id: 'after-rebid', title: 'Rebids after opener’s suit rebid:', lines: 3 },
            { kind: 'cells', id: 'defence', title: 'Proposed defence', lines: 3, help: bscHelp.defence },
          ],
        },
      ],
    },
  ],
}
