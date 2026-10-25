import type { CardTemplate } from '../types.ts'

// WBF Convention Card 2.19 (WBF版空白制度卡.doc, from the CTCBA download page).
// Labels are copied from the card; line counts and widths are measured from
// docs/design/wbf-card-reference-p1.png and -p2.png (the BWS 2001 sample). Page 1 has three
// equal columns of 45 printed lines each.

export const wbf: CardTemplate = {
  id: 'wbf',
  name: 'WBF Convention Card',
  nameZh: 'WBF 制度卡',
  version: '2.19',
  year: 2019,
  publisher: 'World Bridge Federation',
  paper: 'A4-landscape',
  pending:
    '欄寬與行數依填寫範例截圖量測（原始 .doc 不在 repo）；第 2 頁開叫表的列（1C 兩行、1NT 四行、3C 後接 3NT…）照範例，欄名 Artificial／Min.／Neg Dbl thru 在截圖中被截斷，待對照空白 .doc',
  pages: [
    {
      id: 'p1',
      columns: [
        {
          id: 'defence',
          width: 33.4,
          blocks: [
            { kind: 'heading', id: 'defence.title', title: 'DEFENSIVE AND COMPETITIVE BIDDING' },
            { kind: 'cells', id: 'defence.overcalls', title: 'OVERCALLS (Style; Responses; 1/2 Level; Reopening)', lines: 6 },
            { kind: 'cells', id: 'defence.1nt-overcall', title: '1NT OVERCALL (2ND/4TH Live; Reopening)', lines: 5 },
            { kind: 'cells', id: 'defence.jump-overcalls', title: 'JUMP OVERCALLS (Style; Responses; Unusual NT)', lines: 4 },
            { kind: 'cells', id: 'defence.cue-bids', title: 'DIRECT AND JUMP CUE BIDS (Style; Responses; Reopen)', lines: 4 },
            { kind: 'cells', id: 'defence.vs-nt', title: 'VS. NT (vs. Strong / Weak; Reopening; PH)', lines: 6 },
            { kind: 'cells', id: 'defence.vs-preempts', title: 'VS. PREEMPTS ( Doubles; Cue-bids; Jumps; NT bids)', lines: 3 },
            { kind: 'cells', id: 'defence.vs-strong', title: 'VS. ARTIFICIAL STRONG OPENINGS', lines: 4 },
            { kind: 'cells', id: 'defence.vs-takeout-double', title: "OVER OPPONENTS' TAKE OUT DOUBLE", lines: 4 },
          ],
        },
        {
          id: 'leads',
          width: 33.3,
          blocks: [
            { kind: 'heading', id: 'leads.title', title: 'LEADS AND SIGNALS', shaded: true },
            {
              kind: 'table',
              id: 'leads.style',
              title: 'OPENING LEADS STYLE',
              rowHeader: { label: '', width: 12 },
              columns: [
                { id: 'lead', label: 'Lead', width: 44 },
                { id: 'partner', label: "In Partner's Suit", width: 44 },
              ],
              rows: [
                { id: 'suit', label: 'Suit' },
                { id: 'nt', label: 'NT' },
                { id: 'subseq', label: 'Subseq' },
              ],
            },
            { kind: 'text', id: 'leads.other', label: 'Other:', lines: 2 },
            {
              kind: 'table',
              id: 'leads.leads',
              title: 'LEADS',
              rowHeader: { label: 'Lead', width: 12 },
              columns: [
                { id: 'suit', label: 'Vs. Suit', width: 44 },
                { id: 'nt', label: 'Vs. NT', width: 44 },
              ],
              rows: [
                { id: 'ace', label: 'Ace' },
                { id: 'king', label: 'King' },
                { id: 'queen', label: 'Queen' },
                { id: 'jack', label: 'Jack' },
                { id: '10', label: '10' },
                { id: '9', label: '9' },
                { id: 'hi-x', label: 'Hi-x' },
                { id: 'lo-x', label: 'Lo-x' },
              ],
            },
            {
              kind: 'table',
              id: 'leads.signals',
              title: 'SIGNALS IN ORDER OF PRIORITY',
              rowHeader: { label: '', width: 15 },
              columns: [
                { id: 'partner', label: 'Partners Lead', width: 28 },
                { id: 'declarer', label: "Declarer's Lead", width: 28 },
                { id: 'discard', label: 'Discarding', width: 29 },
              ],
              rows: [
                { id: 'suit-1', label: 'Suit:1st' },
                { id: 'suit-2', label: '2nd' },
                { id: 'suit-3', label: '3rd' },
                { id: 'nt-1', label: 'NT: 1st' },
                { id: 'nt-2', label: '2nd' },
                { id: 'nt-3', label: '3rd' },
              ],
            },
            { kind: 'text', id: 'leads.signals-trumps', label: 'Signals (including Trumps):', lines: 3 },
            { kind: 'heading', id: 'doubles.title', title: 'DOUBLES', shaded: true },
            { kind: 'cells', id: 'doubles.takeout', title: 'TAKEOUT DOUBLES (Style; Responses; Reopening)', lines: 4 },
            {
              kind: 'cells',
              id: 'doubles.special',
              title: 'SPECIAL, ARTIFICIAL AND COMPETITIVE DOUBLES/REDOUBLES',
              lines: 9,
            },
          ],
        },
        {
          id: 'summary',
          width: 33.3,
          blocks: [
            { kind: 'banner', id: 'header.title', title: 'WBF Convention Card 2.19', lines: 4 },
            { kind: 'text', id: 'header.category', label: 'Category:', lines: 1 },
            { kind: 'text', id: 'header.country', label: 'Country:', lines: 1 },
            { kind: 'text', id: 'header.event', label: 'Event:', lines: 1 },
            { kind: 'text', id: 'header.players', label: 'Players:', lines: 1 },
            { kind: 'heading', id: 'summary.title', title: 'SYSTEM SUMMARY', shaded: true },
            { kind: 'cells', id: 'summary.general', title: 'GENERAL APPROACH AND STYLE', lines: 8 },
            { kind: 'cells', id: 'summary.special-bids', title: 'SPECIAL BIDS THAT MAY REQUIRE DEFENCE', lines: 15 },
            { kind: 'cells', id: 'summary.forcing-pass', title: 'SPECIAL FORCING PASS SEQUENCES', lines: 3 },
            { kind: 'cells', id: 'summary.notes', title: "IMPORTANT NOTES THAT DON'T FIT ELSEWHERE", lines: 3 },
            { kind: 'text', id: 'summary.psychics', label: 'Psychics:', lines: 3 },
          ],
        },
      ],
    },
    {
      id: 'p2',
      columns: [
        {
          id: 'openings',
          width: 100,
          blocks: [
            {
              kind: 'table',
              id: 'openings',
              title: 'OPENING BID DESCRIPTIONS',
              rowHeader: { label: 'Opening', width: 5 },
              columns: [
                { id: 'artificial', label: 'Artificial', width: 2 },
                { id: 'min', label: 'Min.', width: 2 },
                { id: 'neg-dbl', label: 'Neg Dbl thru', width: 3 },
                { id: 'description', label: 'Description', width: 13 },
                { id: 'responses', label: 'Responses', width: 30 },
                { id: 'subsequent', label: 'Subsequent Auction', width: 27 },
                { id: 'passed-hand', label: 'Passed Hand Bidding', width: 18 },
              ],
              rows: [
                { id: '1C', label: '1C', lines: 2 },
                { id: '1D', label: '1D', lines: 2 },
                { id: '1H', label: '1H', lines: 3 },
                { id: '1S', label: '1S' },
                { id: '1NT', label: '1NT', lines: 4 },
                { id: '2C', label: '2C', lines: 2 },
                { id: '2D', label: '2D' },
                { id: '2H', label: '2H' },
                { id: '2S', label: '2S' },
                { id: '2NT', label: '2NT' },
                { id: '3C', label: '3C' },
                { id: '3NT', label: '3NT' },
                { id: '4C', label: '4C' },
                { id: '4NT', label: '4NT' },
                { id: '5D', label: '5D' },
                { id: '5H', label: '5H' },
              ],
            },
            { kind: 'cells', id: 'high-level', title: 'HIGH LEVEL BIDDING', lines: 9 },
          ],
        },
      ],
    },
  ],
}
