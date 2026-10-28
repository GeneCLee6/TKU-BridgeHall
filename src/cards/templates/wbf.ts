import type { CardHelp, CardTemplate } from '../types.ts'

// WBF Convention Card 2.19 (WBFCard-2.19.pdf on the CTCBA download page; the user chose this
// edition on 2026-10-25 over the undated blank Word form, WBF版空白制度卡.doc, last printed 2004).
// The PDF is the WBF Convention Card Editor's card filled in with Bridge World Standard, then eight
// pages of supplementary notes. Labels are copied from its text layer as printed, spelling and
// straight quotes included (DEFENCE, TAKE OUT, Partners Lead); widths and line counts are its
// grid lines, in points.
//
// The sample cannot tell a printed label from a filled-in word when both sit in the same cell, so:
// - "Reopen:" (last line of JUMP OVERCALLS) is kept as a label, as on the .doc and in the Guide
//   ("on the last line of this section"); "1-Suit:" and "2-Suit:" above it are taken as the
//   sample's own text.
// - "1NT Openings:" and "2 OVER 1 Responses" under GENERAL APPROACH AND STYLE are labels: the
//   Guide has them as sub-items there, and the sample's text after the second one clips it.
// - The opening column on page 2 is filled in by the sample (1C twice, no 3♦–3♠, "5D and 5C"), so
//   its labels are not printed in the PDF. The 24 rows are kept as the .doc's 24 openings, 1♣ to
//   5♠, one line each.
// - The tick columns' headers are clipped in the PDF; their text is the text layer's (Artific,
//   Min., Neg Dbl).
//
// Help texts are from the Guide to Completion of the WBF System Card (2017), which describes the
// earlier form; the cells 2.19 has and the Guide does not (Event) have none.
//
// Page 1 (A4 landscape, x 18.4–823.6, rows 12.16 pt) is three columns of 268.35, 268.55 and 268.3
// pt with no gutter. The defence column has 45 rows, the other two 44: the strip under them is
// unruled. Page 2 (x 18.4–823.9, rows 15.1 pt) is the opening table of 8 columns, then HIGH LEVEL
// BIDDING across the full width (in the .doc it was inset in the table's corner).

const guide = (page: number | string, text: string): CardHelp => ({
  text,
  source: `Guide to Completion of the WBF System Card (2017), p. ${page}`,
})

const P1 = 805.2 // 268.35 + 268.55 + 268.3
const MID = 268.55 // leads: 32.55 + 117.9 + 118.1; signals: 40.55 + 75.1 + 75.1 + 77.8
const P2 = 805.5 // 40.5 + 16.3 + 16.3 + 24.4 + 104.8 + 241.7 + 217.6 + 143.9
const pct = (points: number, of: number) => (points / of) * 100

export const wbf: CardTemplate = {
  id: 'wbf',
  name: 'WBF Convention Card',
  nameZh: 'WBF 制度卡',
  version: '2.19',
  // The PDF was made by the WBF Convention Card Editor ("WBF CCE") on 2005-02-02
  year: 2005,
  publisher: 'World Bridge Federation',
  paper: 'A4-landscape',
  language: 'en',
  printWidth: 805.2,
  fontSize: 7,
  // Settled provisionally (user, 2026-10-25): the 2.19 sample PDF has no blank form, so a few labels
  // follow the blank .doc / the sample — revisit if a blank 2.19 turns up. Was: 版本照 2.19（使用者 2026-10-25 決定）。2.19 只有填好的範例 PDF，沒有空白表，以下幾處範例分不出是印好的字還是填的字，待拿到空白 2.19 確認：第 2 頁開叫欄的 24 列標籤（暫照空白 .doc 的 1♣～5♠）、勾選欄標題被截斷（Artific／Min.／Neg Dbl）、JUMP OVERCALLS 的「1-Suit:」「2-Suit:」（暫當範例自填）
  pages: [
    {
      id: 'p1',
      lineHeight: 12.16,
      columns: [
        {
          id: 'defence',
          width: pct(268.35, P1),
          blocks: [
            { kind: 'heading', id: 'defence.title', title: 'DEFENSIVE AND COMPETITIVE BIDDING', shaded: true },
            {
              kind: 'cells',
              id: 'defence.overcalls',
              title: 'OVERCALLS (Style; Responses; 1/2 Level; Reopening)',
              lines: 6,
              help: guide(
                11,
                "Describe your style, strength requirements, advancer's F or NF actions (raises, cuebids, new suits, jumps etc at different levels). Note any differences if the overcall is at 2-level or in the reopening (balancing) seat.",
              ),
            },
            {
              kind: 'cells',
              id: 'defence.1nt-overcall',
              title: '1NT OVERCALL (2ND/4TH Live; Responses; Reopening)',
              lines: 5,
              help: guide(
                11,
                'Specify strength for each situation, and continuations. If the overcall is artificial it should also be mentioned under "Special bids…". If your response structure is the same as it would be over a 1NT opening, enter "As over 1NT OPEN"; otherwise describe or add a NOTE. 2nd (or direct) position means (1x) 1NT; 4th position "live" means (1x) P (1y) 1NT; reopening position means (1x) P (P) 1NT. Mention if stoppers are promised.',
              ),
            },
            {
              kind: 'cells',
              id: 'defence.jump-overcalls',
              title: 'JUMP OVERCALLS (Style; Responses; Unusual NT)',
              lines: 3,
              help: guide(
                11,
                'Avoid terms like "weak", "strong" or "preemptive" as they seem to mean very different things depending on region or upbringing. Use an approximate hcp count. Indicate length and suit quality requirements if any. Describe agreements with or without comp on advancer\'s follow-ups; raises, new suit, jumps, 2NT, cuebids, Pass, and D/RD. If you use any kind of 2-suited overcalls, be specific about what suits you show, and provide details on card or supps about strength, style, and follow-ups.',
              ),
            },
            {
              kind: 'text',
              id: 'defence.jump-overcalls-reopen',
              label: 'Reopen:',
              lines: 1,
              help: guide(
                '11–12',
                'On the last line of this section, describe your jump overcall style and structure in the reopening position, noting any differences between the two/three-level or majors/minors.',
              ),
            },
            {
              kind: 'cells',
              id: 'defence.cue-bids',
              title: 'DIRECT and JUMP CUE BIDS (Style; Responses; Reopen)',
              lines: 4,
              help: guide(
                12,
                'Specify any exceptions over short suit openings AND in reopening position. If your reopening cuebid and jump to 2NT differ from the above, enter range and continuations.',
              ),
            },
            {
              kind: 'cells',
              id: 'defence.vs-nt',
              title: 'VS. NT (vs. Strong / Weak; Reopening; PH)',
              lines: 6,
              help: guide(
                12,
                'Describe your defences instead of mentioning an inventor or author or abbreviation. You may need a NOTE on your SUPPs to get everything across. What are the options for advancer?',
              ),
            },
            {
              kind: 'cells',
              id: 'defence.vs-preempts',
              title: 'VS. PREEMPTS ( Doubles; Cue-bids; Jumps; NT bids)',
              lines: 3,
              help: guide(12, 'Describe strength, shape, advances.'),
            },
            {
              kind: 'cells',
              id: 'defence.vs-strong',
              title: 'VS. ARTIFICIAL STRONG OPENINGS',
              lines: 4,
              help: guide(12, 'Style. Any ART bids and continuations. Advances over 2-suited or ambiguous overcalls?'),
            },
            {
              kind: 'cells',
              id: 'defence.vs-takeout-double',
              title: "OVER OPPONENTS' TAKE OUT DOUBLE",
              lines: 4,
              help: guide(
                12,
                "What is forcing or not? Advancer's new suit, jumps, cues, 1/2NT, RD (strength, forcing how far).",
              ),
            },
          ],
        },
        {
          id: 'leads',
          width: pct(MID, P1),
          blocks: [
            { kind: 'heading', id: 'leads.title', title: 'LEADS AND SIGNALS', shaded: true },
            {
              kind: 'table',
              id: 'leads.style',
              title: 'OPENING LEADS STYLE',
              rowHeader: { label: '', width: pct(32.55, MID) },
              columns: [
                { id: 'lead', label: 'Lead', width: pct(117.9, MID) },
                { id: 'partner', label: "In Partner's Suit", width: pct(118.1, MID) },
              ],
              rows: [
                { id: 'suit', label: 'Suit' },
                { id: 'nt', label: 'NT' },
                { id: 'subseq', label: 'Subseq' },
              ],
              help: guide(
                8,
                'Describe your agreements on opening leads against suit- and No Trump contracts, and on the "subseq" line what you do at later tricks if different. Are there distinctions when leading partner\'s suit? Use LEADS sub-section below to clarify further. Do NOT say "Standard" or "Normal".',
              ),
            },
            {
              kind: 'text',
              id: 'leads.other',
              label: 'Other:',
              lines: 2,
              help: guide(
                8,
                'The "others" section gives you some space for things like "Suit preference leads" (explain here or in supps how or when), "Through declarer 2nd or else 4th (if length seems important), except in suits bid by partner, then 1st or 3rd", "Thru declarer, Rusinow honour leads".',
              ),
            },
            {
              kind: 'table',
              id: 'leads.leads',
              title: 'LEADS',
              rowHeader: { label: 'Lead', width: pct(32.55, MID) },
              columns: [
                { id: 'suit', label: 'Vs. Suit', width: pct(117.9, MID) },
                { id: 'nt', label: 'Vs. NT', width: pct(118.1, MID) },
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
              help: guide(
                '8–9',
                'Use H for the ace, king, queen or jack, S for the small card that you lead; x for any small card; a slash, /, to separate alternatives. You might use some of the space to describe the SIGNAL expected from third hand on the lead of a particular honour.',
              ),
            },
            {
              kind: 'table',
              id: 'leads.signals',
              title: 'SIGNALS IN ORDER OF PRIORITY',
              rowHeader: { label: '', width: pct(40.55, MID) },
              columns: [
                { id: 'partner', label: 'Partners Lead', width: pct(75.1, MID) },
                { id: 'declarer', label: "Declarer's Lead", width: pct(75.1, MID) },
                { id: 'discard', label: 'Discarding', width: pct(77.8, MID) },
              ],
              // Printed "Suit:1st", "2nd", "3rd", then "NT:  1st", "2nd", "3rd"
              rows: [
                { id: 'suit-1', label: '1st', group: 'Suit:' },
                { id: 'suit-2', label: '2nd', group: 'Suit:' },
                { id: 'suit-3', label: '3rd', group: 'Suit:' },
                { id: 'nt-1', label: '1st', group: 'NT:' },
                { id: 'nt-2', label: '2nd', group: 'NT:' },
                { id: 'nt-3', label: '3rd', group: 'NT:' },
              ],
              help: guide(
                9,
                'For both suit and No Trump contracts, LINE 1 is for your "normal" first-choice signal in the three listed situations. If you play count as your first priority, enter for example Hi = Odd. Or if you wish - Lo = Even. LINE 2 and LINE 3 show your second and third choice meanings for a particular signal. If space admits describe partnership principles or conditions governing your choice. Otherwise refer to SUPPs.',
              ),
            },
            {
              kind: 'text',
              id: 'leads.signals-trumps',
              label: 'Signals (including Trumps):',
              lines: 3,
              help: guide(
                9,
                'Describe here if and how you may signal interest in other suits, how you liked the lead, if you want to ruff, or show the parity of your hand (perhaps a high trump to say that you hold one odd and three even suits). As elsewhere, avoid using "names" or expressions like "SMITH", "standard" or "reversed". If you do, clarify your interpretation.',
              ),
            },
            { kind: 'heading', id: 'doubles.title', title: 'DOUBLES', shaded: true },
            {
              kind: 'cells',
              id: 'doubles.takeout',
              title: 'TAKEOUT DOUBLES (Style; Responses; Reopening)',
              lines: 4,
              help: guide(
                10,
                "Try to explain your style and special agreements as clearly as possible. If you do NOT imply support for ALL unbid suits, mention that first. After your take-out double, how far is advancer's cuebid forcing. How far do you play Responsive Doubles when opponents raise or bid a new suit (if at all). What do they promise (strength, lengths)? Any ART negative responses?",
              ),
            },
            {
              kind: 'cells',
              id: 'doubles.special',
              title: 'SPECIAL, ARTIFICIAL AND COMPETITIVE DOUBLES/REDOUBLES',
              lines: 8,
              help: guide(
                10,
                'NEGATIVE DBLs have a column on the BACK OF THE CARD to indicate how high you play NEGATIVE DBLs, but no space for further explanations. Mention here or in a SUPP note what is expected at different levels in the form of suit lengths and hp. Doubles for leads or non-leads in own suit, partner\'s suit, dummy\'s first or later suits, unbid suits. Describe your agreements if any.',
              ),
            },
          ],
        },
        {
          id: 'summary',
          width: pct(268.3, P1),
          blocks: [
            // Four rows without inner rules, the title and the WBF logo in the middle
            { kind: 'banner', id: 'header.title', title: 'WBF Convention Card 2.19', lines: 4, shaded: true },
            // Category: to Players: have the label in a cell of their own (555.3–598.5 pt)
            {
              kind: 'text',
              id: 'header.category',
              label: 'Category:',
              lines: 1,
              help: guide(
                5,
                'Define your system category using the colour code designed by the WBF and described in the WBF Systems Policy. Use Yellow for a HIGHLY UNUSUAL system, Green for fairly straightforward NATURAL systems, Blue if you play an always-STRONG CLUB, but otherwise mainly natural system. For everything else, if you employ artificial methods or some unusual treatments, use Red. Any partnership using one or more "BROWN STICKER" conventions must indicate this alongside its system classification.',
              ),
            },
            {
              kind: 'text',
              id: 'header.country',
              label: 'Country:',
              lines: 1,
              // The Guide's NCBO line, which 2.19 calls Country
              help: guide(
                5,
                'Enter the name of your National Contract Bridge Organisation (which is also the name of your country, e.g. Brazil)',
              ),
            },
            // New in 2.19; the Guide has no text for it
            { kind: 'text', id: 'header.event', label: 'Event:', lines: 1 },
            {
              kind: 'text',
              id: 'header.players',
              label: 'Players:',
              lines: 1,
              help: guide(5, "Enter your own name and your partner's name. Underline the surname (family name) in each case."),
            },
            { kind: 'heading', id: 'summary.title', title: 'SYSTEM SUMMARY', shaded: true },
            {
              kind: 'cells',
              id: 'summary.general',
              title: 'GENERAL APPROACH AND STYLE',
              lines: 6,
              help: guide(
                5,
                'Be informative but concise; Note your tendencies to open, respond and compete on light or substandard hands. Four- vs five-card majors. Describe your pre-empting style, perhaps a general word about your two-bids. If you play a Strong Club system, explain your approach. Just provide an over-view.',
              ),
            },
            {
              kind: 'text',
              id: 'summary.1nt',
              label: '1NT Openings:',
              lines: 1,
              help: guide(
                5,
                'The true range, please (if you cheat by a point regularly, have your range reflect that); note positional and vulnerability variations if they exist.',
              ),
            },
            {
              kind: 'text',
              id: 'summary.2-over-1',
              label: '2 OVER 1 Responses',
              lines: 1,
              help: guide(
                5,
                '"FG/1M," or "FG/1M except direct rebid," or "promises rebid," and "1-2 F2NT" are the sorts of things you should aim for here.',
              ),
            },
            {
              kind: 'cells',
              id: 'summary.special-bids',
              title: 'SPECIAL BIDS THAT MAY REQUIRE DEFENCE',
              lines: 15,
              help: guide(
                6,
                'List here your unusual or unexpected first-round actions and competitive agreements after your side has opened. Start the section with opening bids and responses worthy of a pre-alert, continue with your special competitive actions that may require a defence. Only one treatment per line, but you may use more than one line per treatment. This section does NOT include doubles, No Trump defences, special defences to strong, artificial openings, special treatments by a passed hand, or slam zone tools.',
              ),
            },
            {
              kind: 'cells',
              id: 'summary.forcing-pass',
              title: 'SPECIAL FORCING PASS SEQUENCES',
              lines: 3,
              help: guide(
                6,
                'Include here forcing situations after overcalls of your strong artificial opening, as well as your agreements after 1x-(DBL)-RDBL, and after your 2/1, if you have rules after doubling their weak NT or a PRE opening raised. It is important to explain your rules to determine when a forcing pass situation exists in non-obvious competitive situations.',
              ),
            },
            {
              kind: 'cells',
              id: 'summary.notes',
              title: "IMPORTANT NOTES THAT DON'T FIT ELSEWHERE",
              lines: 3,
              help: guide(
                6,
                'This section is for alert-worthy parts of your system that you can\'t accommodate elsewhere. If you have partnership rules for resolving ambiguity in undiscussed situations, this is the place to mention them, "In unclear situations, we do not pass."',
              ),
            },
            {
              kind: 'text',
              id: 'summary.psychics',
              label: 'Psychics:',
              lines: 2,
              help: guide(
                7,
                'Psychic bids are permitted by the Laws of Contract Bridge, provided they are made randomly and any partnership understandings are revealed. Even where a "rarely" is true, more detail is expected. When you do psyche, what sort of hand would you have? Long suit? Short suit? Major? No Trump? Maximum strength? Defensive tricks possible?',
              ),
            },
          ],
        },
      ],
    },
    {
      id: 'p2',
      lineHeight: 15.1,
      columns: [
        {
          id: 'openings',
          width: 100,
          blocks: [
            {
              kind: 'table',
              id: 'openings',
              title: 'OPENING BID DESCRIPTIONS',
              rowHeader: {
                label: 'Opening',
                width: pct(40.5, P2),
                help: guide(
                  13,
                  '"All" openings are listed in this column. You may save space by combining, say all 5-openings if structure and continuations are the same.',
                ),
              },
              columns: [
                {
                  id: 'artificial',
                  label: 'Artific',
                  width: pct(16.3, P2),
                  help: guide(13, 'Tick to clarify that this opening does not show the suit, but is artificial.'),
                },
                {
                  id: 'min',
                  label: 'Min.',
                  width: pct(16.3, P2),
                  help: guide(
                    13,
                    'In the "Description" section you should add your priority order for openings with 3-3 in minors, or with 4-4 in any two.',
                  ),
                },
                {
                  id: 'neg-dbl',
                  label: 'Neg Dbl',
                  width: pct(24.4, P2),
                  help: guide(
                    13,
                    'Here is how high you use negative doubles. Clarify further what to expect from the doubler at different levels on the FRONT OF CARD, middle section, under DOUBLES. If needed refer to SUPPs',
                  ),
                },
                {
                  id: 'description',
                  label: 'Description',
                  width: pct(104.8, P2),
                  help: guide(
                    13,
                    'Your opponents want to know as much as possible about the opening bid itself (strength, unbalanced No Trump openings, canapé patterns etc). Strength range please. Do not say weak, pre, or L/T opening!! Your rules for opening with different four-fours or four-five in the minors. If you preempt, what is your style with regard to suit quality, outside strength, length in Major side suit?',
                  ),
                },
                {
                  id: 'responses',
                  label: 'Responses',
                  width: pct(241.7, P2),
                  help: guide(
                    13,
                    'Do you bid your suits up the line as responder? Does strength matter? How light can you be to respond to 1m? Or to 1M? Specify all conventional or ART responses and rebids. If you open or respond with an obstructive or MULTI-bid, it is essential that you describe all early auctions.',
                  ),
                },
                {
                  id: 'subsequent',
                  label: 'Subsequent Auction',
                  width: pct(217.6, P2),
                  help: guide(
                    13,
                    'Essentially, you should take the bidding through 2NT and through the first two rounds of bidding at any level wherever there are related special understandings. For CONSTRUCTIVE treatments, try to be as concise as possible; if you are embroiled in an artificial method, just summarise on the card and supply details in a SUPP SHEET.',
                  ),
                },
                {
                  id: 'passed-hand',
                  label: 'Passed Hand Bidding',
                  width: pct(143.9, P2),
                  help: guide(
                    14,
                    'If you treat a new suit response by a passed hand as forcing, mention it. Specify any changes in your agreements about a passed-hand. Include details on the following, if applicable: 2/1 by PH NF? "Fourth Suit" by PH; Art relays not on by PH; Jump shifts and raises by PH.',
                  ),
                },
              ],
              // 24 rows of one line (49.0–411.9 pt); labels as on the .doc, see the top of the file
              rows: [
                { id: '1C', label: '1♣' },
                { id: '1D', label: '1♦' },
                { id: '1H', label: '1♥' },
                { id: '1S', label: '1♠' },
                { id: '1NT', label: '1NT' },
                { id: '2C', label: '2♣' },
                { id: '2D', label: '2♦' },
                { id: '2H', label: '2♥' },
                { id: '2S', label: '2♠' },
                { id: '2NT', label: '2NT' },
                { id: '3C', label: '3♣' },
                { id: '3D', label: '3♦' },
                { id: '3H', label: '3♥' },
                { id: '3S', label: '3♠' },
                { id: '3NT', label: '3NT' },
                { id: '4C', label: '4♣' },
                { id: '4D', label: '4♦' },
                { id: '4H', label: '4♥' },
                { id: '4S', label: '4♠' },
                { id: '4NT', label: '4NT' },
                { id: '5C', label: '5♣' },
                { id: '5D', label: '5♦' },
                { id: '5H', label: '5♥' },
                { id: '5S', label: '5♠' },
              ],
              help: guide(
                13,
                'Some pairs will need more space for continued bidding, others for description. You can (in Word) modify column widths to allow for your needs.',
              ),
            },
            {
              kind: 'cells',
              id: 'high-level',
              title: 'HIGH LEVEL BIDDING',
              lines: 9,
              help: guide(
                14,
                'Simply listing Cue-bids is inadequate. Blackwood variations must be explained; you are ALWAYS safe by LISTING THE RESPONSES. For contested auctions, you should deal with "pass and pull" sequences here rather than in the SPECIAL FORCING PASS section. Indicate any agreements about showing or denying control of an enemy suit, and any "defensive" agreements for situations where your opponents are in a slam sequence.',
              ),
            },
          ],
        },
      ],
    },
  ],
}
