import type { CardHelp, CardTemplate } from '../types.ts'

// WBF Brown Sticker Opening Bid Announcement Form (WBF版BSC開叫申報表.docx on the CTCBA download
// page; Appendix 1 of the WBF Systems Policy, whose footer it carries: "2016 WBF SYSTEM POLICY").
// A4 portrait, Calibri 11 pt, one table 9530 twips wide (476.5 pt) of 12 grid columns; labels are
// copied from the file as printed. The form's own rows are one paragraph high and grow as they
// are typed in; a printed card does not grow, so the answer rows get the lines below, chosen to
// fill one A4 page at 13.5 pt a line.
//
// - The Country / Event row ends in a third cell with nothing printed in it: it is counted in Event.
// - "Proposed Defence" is a centred paragraph below the table, followed by empty paragraphs: here
//   it is the last boxed cell.
// - Each convention marked `brownSticker: 'opening'` gets a form of its own (cards/bsc.ts), so the
//   cells are filled from that convention alone.

const policy = (page: number, text: string): CardHelp => ({ text, source: `2023 WBF Systems Policy, p. ${page}` })

/**
 * Help for both forms (also bsc-overcall.ts): the forms have no guide of their own, so the cells
 * quote the WBF Systems Policy (2023WBFSystemsPolicy.pdf on the CTCBA download page), which says
 * what a Brown Sticker method is and what must be filed.
 */
export const bscHelp = {
  opening: policy(
    3,
    "Brown Sticker: any opening bid of two clubs through three spades that could be made on 9 high card points or less, AND does not promise at least four cards in a known suit; also any 'weak' two-suited opening at the two or three level that may by agreement be made with three cards or fewer in one of the suits.",
  ),
  overcall: policy(
    3,
    "Brown Sticker: an overcall that does not promise at least four cards in a known suit, over a natural opening bid of one of a suit; also any 'weak' two-suited overcall at the two or three level that may by agreement be made with three cards or fewer in one of the suits.",
  ),
  description: policy(
    5,
    "Any pair playing a HUM system or 'Brown Sticker' method has a special obligation to present a complete description of both their bids and subsequent developments (especially competitive developments).",
  ),
  defence: policy(
    3,
    'A viable suggested defence to any Brown Sticker method must be filed. This will be deemed to be a part of the System Card and may be referred to by the opponents at the table. No written defence should exceed more than 50 words in total.',
  ),
}

const W = 9530 // twips
const pct = (twips: number) => (twips / W) * 100

export const bscOpening: CardTemplate = {
  id: 'bsc-opening',
  name: 'Brown Sticker Opening Bid Announcement Form',
  nameZh: '棕標開叫申報表',
  year: 2016,
  publisher: 'World Bridge Federation',
  paper: 'A4-portrait',
  language: 'en',
  printWidth: W / 20,
  fontSize: 11,
  brownSticker: 'opening',
  pages: [
    {
      id: 'p1',
      lineHeight: 13.5,
      columns: [
        {
          id: 'form',
          width: 100,
          blocks: [
            { kind: 'banner', id: 'title', title: 'BROWN STICKER OPENING BID ANNOUNCEMENT FORM', lines: 2 },
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
                { width: pct(3975), blocks: [{ kind: 'text', id: 'country', label: 'Country', lines: 1 }] },
                { width: pct(3430 + 2125), blocks: [{ kind: 'text', id: 'event-name', label: 'Event', lines: 1 }] },
              ],
            },
            {
              kind: 'split',
              id: 'opening',
              parts: [
                { width: pct(1880 + 553), blocks: [{ kind: 'text', id: 'bid', label: 'Opening bid of', lines: 1, help: bscHelp.opening }] },
                { width: pct(1091 + 1484), blocks: [{ kind: 'text', id: 'seat', label: 'in', lines: 1 }] },
                { width: pct(1221 + 3301), blocks: [{ kind: 'text', id: 'vulnerability', label: 'seat at', lines: 1 }] },
              ],
            },
            { kind: 'text', id: 'shows', label: 'Shows:', lines: 2 },
            { kind: 'cells', id: 'description', title: 'Detailed Description:', lines: 8, help: bscHelp.description },
            { kind: 'heading', id: 'uncontested', title: 'Responses and Rebids in Uncontested auctions' },
            { kind: 'cells', id: 'pass', title: 'With what hands will responder pass the opening bid?', lines: 4 },
            { kind: 'cells', id: 'rebids', title: 'Meanings of other responses and rebids:', lines: 7, help: bscHelp.description },
            { kind: 'heading', id: 'competitive', title: 'Competitive Agreements' },
            {
              kind: 'cells',
              id: 'vs-double',
              title: 'Responses after opponent’s DBL (including Pass, RDBL and expected follow-ups)',
              lines: 4,
              help: bscHelp.description,
            },
            { kind: 'cells', id: 'vs-overcall', title: 'Responses after opponent’s overcall:', lines: 4 },
            { kind: 'cells', id: 'after-double', title: 'Rebids after 4th hand DBLs the response:', lines: 3 },
            { kind: 'cells', id: 'after-overcall', title: 'Rebids after 4th hand overcalls:', lines: 3 },
            { kind: 'cells', id: 'defence', title: 'Proposed Defence', lines: 4, help: bscHelp.defence },
          ],
        },
      ],
    },
  ],
}
