import type { CardHelp, CardTemplate } from '../types.ts'

// WBF convention card, blank Word form as distributed by the CTCBA (WBF版空白制度卡.doc; the
// Gill Sans file has the same tables, only the font and the suit glyphs differ). Labels are
// copied from the .doc as printed, spelling included (PREEMTS, DEFENSE, Response); widths are
// the .doc's twips; every table row of the .doc is one printed line.
//
// The .doc has no version number (last printed 2004). WBFCard-2.19.pdf on the same download
// page is a filled sample of a later edition whose header reads Category/Country/Event/Players
// and whose titles differ slightly; this template follows the blank form, which is what the
// help texts (Guide to Completion of the WBF System Card, 2017) describe.
//
// Page 1 is one table of 43 rows: three columns of 5068, 5629 and 4819 twips with blank gutters
// of 203 and 184 between them. Page 2 is one table of 8 columns (16126 twips).

const guide = (page: number | string, text: string): CardHelp => ({
  text,
  source: `Guide to Completion of the WBF System Card (2017), p. ${page}`,
})

const P1 = 15903 // 5068 + 203 + 5629 + 184 + 4819
const MID = 5629 // grid columns 744 + 567 + 992 + 1135 + 566 + 1625
const P2 = 16126 // 959 + 725 + 842 + 843 + 2551 + 3969 + 3544 + 2693
const pct = (twips: number, of: number) => (twips / of) * 100

export const wbf: CardTemplate = {
  id: 'wbf',
  name: 'W B F CONVENTION CARD',
  nameZh: 'WBF 制度卡',
  year: 2004,
  publisher: 'World Bridge Federation',
  paper: 'A4-landscape',
  pending:
    '版面已依國橋的空白 .doc 定稿；待確認的是版本：空白 .doc 沒有版本號（year 取檔案的最後列印日 2004-03-12），同頁的 WBFCard-2.19.pdf 是較新版的填寫範例，卡頭是 Category／Country／Event／Players、部分標題不同。比賽要交哪一版待幹部確認',
  pages: [
    {
      id: 'p1',
      gaps: [pct(203, P1), pct(184, P1)],
      columns: [
        {
          id: 'defence',
          width: pct(5068, P1),
          blocks: [
            { kind: 'heading', id: 'defence.title', title: 'DEFENSIVE AND COMPETITIVE BIDDING', shaded: true },
            {
              kind: 'cells',
              id: 'defence.overcalls',
              title: 'OVERCALLS (Style: Responses: 1 / 2  Level; Reopening)',
              lines: 6,
              help: guide(
                11,
                "Describe your style, strength requirements, advancer's F or NF actions (raises, cuebids, new suits, jumps etc at different levels). Note any differences if the overcall is at 2-level or in the reopening (balancing) seat.",
              ),
            },
            {
              kind: 'cells',
              id: 'defence.1nt-overcall',
              title: '1NT OVERCALL (2nd/4th Live; Responses; Reopening)',
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
              title: 'DIRECT & JUMP CUE BIDS (Style; Response; Reopen)',
              lines: 4,
              help: guide(
                12,
                'Specify any exceptions over short suit openings AND in reopening position. If your reopening cuebid and jump to 2NT differ from the above, enter range and continuations.',
              ),
            },
            {
              kind: 'cells',
              id: 'defence.vs-nt',
              title: 'VS. NT (vs. Strong/Weak; Reopening;PH)',
              lines: 6,
              help: guide(
                12,
                'Describe your defences instead of mentioning an inventor or author or abbreviation. You may need a NOTE on your SUPPs to get everything across. What are the options for advancer?',
              ),
            },
            {
              kind: 'cells',
              id: 'defence.vs-preempts',
              title: 'VS.PREEMTS (Doubles; Cue-bids; Jumps; NT Bids)',
              lines: 3,
              help: guide(12, 'Describe strength, shape, advances.'),
            },
            {
              kind: 'cells',
              id: 'defence.vs-strong',
              title: 'VS. ARTIFICIAL STRONG OPENINGS- i.e. 1♣ or 2♣',
              lines: 3,
              help: guide(12, 'Style. Any ART bids and continuations. Advances over 2-suited or ambiguous overcalls?'),
            },
            {
              kind: 'cells',
              id: 'defence.vs-takeout-double',
              title: 'OVER OPPONENTS’ TAKEOUT DOUBLE',
              lines: 3,
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
              rowHeader: { label: '', width: pct(1311, MID) },
              columns: [
                { id: 'lead', label: 'Lead', width: pct(2127, MID) },
                { id: 'partner', label: 'In Partner’s Suit', width: pct(2191, MID) },
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
              rowHeader: { label: 'Lead', width: pct(1311, MID) },
              columns: [
                { id: 'suit', label: 'Vs. Suit', width: pct(2127, MID) },
                { id: 'nt', label: 'Vs. NT', width: pct(2191, MID) },
              ],
              rows: [
                { id: 'ace', label: 'Ace' },
                { id: 'king', label: 'King' },
                { id: 'queen', label: 'Queen' },
                { id: 'jack', label: 'Jack' },
                { id: '10', label: '10' },
                { id: '9', label: '9' },
                { id: 'hi-x', label: 'Hi-X' },
                { id: 'lo-x', label: 'Lo-X' },
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
              rowHeader: { label: '', width: pct(744, MID) },
              columns: [
                { id: 'partner', label: 'Partner’s Lead', width: pct(1559, MID) },
                { id: 'declarer', label: 'Declarer’s Lead', width: pct(1701, MID) },
                { id: 'discard', label: 'Discarding', width: pct(1625, MID) },
              ],
              // The .doc prints the numbers right-aligned and the group label on the middle line
              rows: [
                { id: 'suit-1', label: '1', group: 'Suit' },
                { id: 'suit-2', label: '2', group: 'Suit' },
                { id: 'suit-3', label: '3', group: 'Suit' },
                { id: 'nt-1', label: '1', group: 'NT' },
                { id: 'nt-2', label: '2', group: 'NT' },
                { id: 'nt-3', label: '3', group: 'NT' },
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
            { kind: 'heading', id: 'doubles.title', title: 'DOUBLES', shaded: true, lines: 2 },
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
              title: 'SPECIAL, ARTIFICIAL & COMPETITIVE DBLS/RDLS',
              lines: 6,
              help: guide(
                10,
                'NEGATIVE DBLs have a column on the BACK OF THE CARD to indicate how high you play NEGATIVE DBLs, but no space for further explanations. Mention here or in a SUPP note what is expected at different levels in the form of suit lengths and hp. Doubles for leads or non-leads in own suit, partner\'s suit, dummy\'s first or later suits, unbid suits. Describe your agreements if any.',
              ),
            },
          ],
        },
        {
          id: 'summary',
          width: pct(4819, P1),
          blocks: [
            // Title row, then a blank row inside the same box
            { kind: 'banner', id: 'header.title', title: 'W B F CONVENTION CARD', lines: 2, shaded: true },
            {
              kind: 'text',
              id: 'header.category',
              label: 'CATEGORY:',
              lines: 1,
              help: guide(
                5,
                'Define your system category using the colour code designed by the WBF and described in the WBF Systems Policy. Use Yellow for a HIGHLY UNUSUAL system, Green for fairly straightforward NATURAL systems, Blue if you play an always-STRONG CLUB, but otherwise mainly natural system. For everything else, if you employ artificial methods or some unusual treatments, use Red. Any partnership using one or more "BROWN STICKER" conventions must indicate this alongside its system classification.',
              ),
            },
            {
              kind: 'text',
              id: 'header.ncbo',
              label: 'NCBO:',
              lines: 1,
              help: guide(
                5,
                'Enter the name of your National Contract Bridge Organisation (which is also the name of your country, e.g. Brazil)',
              ),
            },
            // PLAYERS: and the three blank rows under it, up to SYSTEM SUMMARY
            {
              kind: 'text',
              id: 'header.players',
              label: 'PLAYERS:',
              lines: 4,
              help: guide(5, "Enter your own name and your partner's name. Underline the surname (family name) in each case."),
            },
            { kind: 'heading', id: 'summary.title', title: 'SYSTEM SUMMARY', shaded: true, lines: 2 },
            {
              kind: 'cells',
              id: 'summary.general',
              title: 'GENERAL APPROACH AND STYLE',
              lines: 8,
              help: guide(
                5,
                'Be informative but concise; Note your tendencies to open, respond and compete on light or substandard hands. Four- vs five-card majors. Describe your pre-empting style, perhaps a general word about your two-bids. If you play a Strong Club system, explain your approach. Just provide an over-view. 1NT Opening: the true range, please; note positional and vulnerability variations if they exist. 2 over 1 response: "FG/1M," or "FG/1M except direct rebid," or "promises rebid," are the sorts of things you should aim for here.',
              ),
            },
            {
              kind: 'cells',
              id: 'summary.special-bids',
              title: 'SPECIAL BIDS THAT MAY REQUIRE DEFENSE',
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
              title: 'IMPORTANT NOTES',
              lines: 2,
              help: guide(
                6,
                'This section is for alert-worthy parts of your system that you can\'t accommodate elsewhere. If you have partnership rules for resolving ambiguity in undiscussed situations, this is the place to mention them, "In unclear situations, we do not pass."',
              ),
            },
            {
              kind: 'text',
              id: 'summary.psychics',
              label: 'PSYCHICS:',
              lines: 1,
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
      columns: [
        {
          id: 'openings',
          width: 100,
          blocks: [
            // Two header rows: OPENING and the three tick columns span both (printed sideways);
            // DESCRIPTION to PASSED HAND BIDDING sit under an empty shaded row
            {
              kind: 'table',
              id: 'openings',
              rowHeader: {
                label: 'OPENING',
                width: pct(959, P2),
                help: guide(
                  13,
                  '"All" openings are listed in this column. You may save space by combining, say all 5-openings if structure and continuations are the same.',
                ),
              },
              columns: [
                {
                  id: 'artificial',
                  label: 'TICK IF ARTIFICIAL',
                  width: pct(725, P2),
                  help: guide(13, 'Tick to clarify that this opening does not show the suit, but is artificial.'),
                },
                {
                  id: 'min',
                  label: 'MIN. NO. OF CARDS',
                  width: pct(842, P2),
                  help: guide(
                    13,
                    'In the "Description" section you should add your priority order for openings with 3-3 in minors, or with 4-4 in any two.',
                  ),
                },
                {
                  id: 'neg-dbl',
                  label: 'NEG.DBL THRU',
                  width: pct(843, P2),
                  help: guide(
                    13,
                    'Here is how high you use negative doubles. Clarify further what to expect from the doubler at different levels on the FRONT OF CARD, middle section, under DOUBLES. If needed refer to SUPPs',
                  ),
                },
                {
                  id: 'description',
                  label: 'DESCRIPTION',
                  width: pct(2551, P2),
                  help: guide(
                    13,
                    'Your opponents want to know as much as possible about the opening bid itself (strength, unbalanced No Trump openings, canapé patterns etc). Strength range please. Do not say weak, pre, or L/T opening!! Your rules for opening with different four-fours or four-five in the minors. If you preempt, what is your style with regard to suit quality, outside strength, length in Major side suit?',
                  ),
                },
                {
                  id: 'responses',
                  label: 'RESPONSES',
                  width: pct(3969, P2),
                  help: guide(
                    13,
                    'Do you bid your suits up the line as responder? Does strength matter? How light can you be to respond to 1m? Or to 1M? Specify all conventional or ART responses and rebids. If you open or respond with an obstructive or MULTI-bid, it is essential that you describe all early auctions.',
                  ),
                },
                {
                  id: 'subsequent',
                  label: 'SUBSEQUENT ACTION',
                  width: pct(3544, P2),
                  help: guide(
                    13,
                    'Essentially, you should take the bidding through 2NT and through the first two rounds of bidding at any level wherever there are related special understandings. For CONSTRUCTIVE treatments, try to be as concise as possible; if you are embroiled in an artificial method, just summarise on the card and supply details in a SUPP SHEET.',
                  ),
                },
                {
                  id: 'passed-hand',
                  label: 'PASSED HAND BIDDING',
                  width: pct(2693, P2),
                  help: guide(
                    14,
                    'If you treat a new suit response by a passed hand as forcing, mention it. Specify any changes in your agreements about a passed-hand. Include details on the following, if applicable: 2/1 by PH NF? "Fourth Suit" by PH; Art relays not on by PH; Jump shifts and raises by PH.',
                  ),
                },
              ],
              // A label row starts each opening; the unlabelled rows under it belong to it (in
              // the label column some boxes hold several openings, e.g. 1♥ with 1♠ and 4♦ to 4NT;
              // the labels decide). The .doc
              // types 1NT as "INT". The three thin filler rows under 5♠ (95, 95 and 244 twips high)
              // are below one printed line and are left out.
              rows: [
                { id: '1C', label: '1♣', lines: 2 },
                { id: '1D', label: '1♦', lines: 2 },
                { id: '1H', label: '1♥', lines: 2 },
                { id: '1S', label: '1♠' },
                { id: '1NT', label: '1NT', lines: 2 },
                { id: '2C', label: '2♣', lines: 2 },
                { id: '2D', label: '2♦', lines: 2 },
                { id: '2H', label: '2♥', lines: 2 },
                { id: '2S', label: '2♠', lines: 2 },
                { id: '2NT', label: '2NT', lines: 2 },
                { id: '3C', label: '3♣' },
                { id: '3D', label: '3♦' },
                { id: '3H', label: '3♥' },
                { id: '3S', label: '3♠', lines: 2 },
                { id: '3NT', label: '3NT', lines: 2 },
                { id: '4C', label: '4♣' },
                { id: '4D', label: '4♦' },
                { id: '4H', label: '4♥' },
                { id: '4S', label: '4♠' },
                { id: '4NT', label: '4NT' },
                { id: '5C', label: '5♣' },
                { id: '5D', label: '5♦' },
                { id: '5H', label: '5♥' },
                { id: '5S', label: '5♠', lines: 2 },
              ],
              inset: {
                fromRow: '5C',
                columns: ['subsequent', 'passed-hand'],
                block: {
                  kind: 'cells',
                  id: 'high-level',
                  title: 'HIGH LEVEL BIDDING',
                  lines: 4,
                  help: guide(
                    14,
                    'Simply listing Cue-bids is inadequate. Blackwood variations must be explained; you are ALWAYS safe by LISTING THE RESPONSES. For contested auctions, you should deal with "pass and pull" sequences here rather than in the SPECIAL FORCING PASS section. Indicate any agreements about showing or denying control of an enemy suit, and any "defensive" agreements for situations where your opponents are in a slam sequence.',
                  ),
                },
              },
              help: guide(
                13,
                'Some pairs will need more space for continued bidding, others for description. You can (in Word) modify column widths to allow for your needs.',
              ),
            },
          ],
        },
      ],
    },
  ],
}
