import type { Auction, Convention } from '../../types/convention.ts'

/**
 * Responsive double (回答性賭倍)
 * Source: docs/回答性賭倍(Responsive dbl).doc, written from the text the club provided on 2026-10-21.
 * Transcribed verbatim; only bids and suit letters were rewritten with suit symbols (2S -> 2♠,
 * Dbl/x -> X). Auctions naming an unspecified minor (1m, 3m) stay as text, since the auction
 * diagram only draws real calls.
 */

/** The defenders' view: the opponents open, partner doubles for take-out, you are fourth */
const defence: Auction['seats'] = ['敵方', '同伴', '敵方', '你']
const opening: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']

export const responsiveDouble: Convention = {
  slug: 'responsive-double',
  nameZh: '回答性賭倍',
  nameEn: 'Responsive Double',
  aliases: ['Responsive dbl', 'Responsive X', '回答性加倍', 'responsive'],
  category: 'competitive',
  kind: 'convention',
  level: 'intermediate',
  tags: ['賭倍', 'T/O', '競叫', '2NT 選低花'],
  summary:
    '敵方開叫、同伴 T/O、右手敵方加叫後的 X（通常 6-11 點）：同伴的再叫、2NT 選低花，以及開叫者的回答性賭倍。',
  source: { title: 'Responsive dbl 回答性賭倍' },
  updated: '2026-10-21',
  sections: [
    {
      id: 'principles',
      title: '重點原則',
      summary: '敵方開叫、同伴 T/O、右手敵方加叫後的 X；通常 6-11 點。',
      blocks: [
        { kind: 'paragraph', text: '（通常為6-11點大牌點 再多則必須cue bid 敵方牌組）' },
        {
          kind: 'paragraph',
          text: '**回答性賭倍都是敵方開叫 同伴T/O後 而你的右手敵方對他的同伴開叫花色作出支持配合後。**',
        },
        { kind: 'paragraph', text: '先看看以下的 牌例' },
        {
          kind: 'rules',
          items: [
            { text: '1♣ －X－2♣ －X' },
            { text: '1♣ －X－3♣ －X' },
            { text: '1♦ －X－2♦ －X' },
            { text: '1♦ －X－3♦ －X' },
            { text: '1♥ －X－2♥ －X' },
            { text: '1♥ －X－3♥ －X' },
            { text: '1♠ －X－2♠ －X' },
            { text: '1♠ －X－3♠ －X' },
          ],
        },
        { kind: 'paragraph', text: '用到幾線我建議一開始先用到3♠' },
      ],
      children: [
        {
          id: 'strength',
          title: '點力需求',
          blocks: [
            { kind: 'paragraph', text: '點力需求要考慮身價有利不利或者一樣' },
            {
              kind: 'paragraph',
              text: '低花要考慮的比較多 如果是以競叫來說會更簡單些 就找合約打',
            },
            {
              kind: 'paragraph',
              text: '敵方反序 我們本身更難有game 。',
              pending: '「敵方反序」的意思待確認（是否指身價不利或其他情況）。',
            },
          ],
        },
      ],
    },
    {
      id: 'advancer-rebids',
      title: '同伴（T/O的人）對回答性賭倍的第二輪再叫',
      originalTitle: '同伴(T/O的人）對 回答性賭倍第二輪再叫方式',
      summary: '有適合牌組時低限叫牌；跳叫邀請；cue bid 迫叫成局。',
      blocks: [
        {
          kind: 'rules',
          items: [
            { text: '同伴有適合的牌組時通常作出低限叫牌' },
            { text: '跳叫則有額外力量並邀請' },
            { text: 'Cue bid仍然視為迫叫成局的唯一叫品。' },
          ],
        },
        {
          kind: 'paragraph',
          text: '一般說來，回答性賭倍的叫牌過程的最後決定權應該在你手上。因為同伴已經通過T/O表示他的強度。又通過再叫表明他的選擇，你對兩手牌已相當清楚了。',
        },
      ],
    },
    {
      id: 'minor-opening',
      title: '牌例：1m (X) 2m (X)',
      summary: '第四家可能兩門高花都有長度，希望找到 4-4 而不是 4-3 的高花配合。',
      blocks: [
        { kind: 'rules', items: [{ text: '1m－(X)－2m－(X)' }] },
        {
          kind: 'paragraph',
          text: '這裡第四家可能在兩門高花上都有長度，希望找到44、而不是43的高花配合。',
        },
        { kind: 'paragraph', text: '同時他也有可能持一門高花＋另一門低花。' },
        { kind: 'paragraph', text: '如果能發現高花配合，當然很愉悅' },
        {
          kind: 'paragraph',
          text: '反過來說，如果同伴叫到你另外一門高花，你可以將同伴的2♥（假設如此）改叫2♠，',
        },
        {
          kind: 'rules',
          items: [
            { text: '1m－(X)－2m－(X)' },
            { text: 'Pass — 2♥ — Pass — 2♠（4張♠＋另一門低花）' },
          ],
        },
        {
          kind: 'paragraph',
          text: '並讓同伴看是也有四張♠ 派斯打2♠或者是再改正44或54配合的另一門低花。',
        },
      ],
    },
    {
      id: 'major-opening',
      title: '高花牌例',
      originalTitle: '先以高花牌例講講',
      summary: '第四家通常持兩門低花；T/O 的人叫最省空間的 4 張以上新花色；2NT 為選低花。',
      blocks: [
        {
          kind: 'paragraph',
          text: 'T/O的人假定同伴（第四家）在另一門高花沒有4張，但是有一定的大牌實力。通常，第四家的回答性加倍應該持兩門低花牌組',
        },
        {
          kind: 'paragraph',
          text: 'T/O的人後續再叫，應該再叫最省空間的的4張以上新花色。',
        },
        {
          kind: 'paragraph',
          text: '另外需要約定任何一方的2NT叫品究竟是自然，還是尋求低花配合的選擇叫。（我比較偏好打選擇叫）',
        },
      ],
      children: [
        {
          id: 'two-nt-choice',
          title: '2NT 選低花',
          originalTitle: '例如',
          blocks: [
            {
              kind: 'responses',
              auction: {
                seats: defence,
                calls: ['1H', 'X', '2H', 'X', 'P', '2S', 'P', { call: '2NT', note: '選低花' }],
              },
              rows: [{ call: '2NT', meaning: '選低花' }],
            },
            {
              kind: 'responses',
              auction: {
                seats: defence,
                calls: ['1S', 'X', '2S', 'X', 'P', { call: '2NT', note: '選低花' }],
              },
              rows: [{ call: '2NT', meaning: '選低花' }],
            },
          ],
        },
        {
          id: 'three-spades-example',
          title: '牌例：1♥ (X) 2♥ ?',
          summary: '只有 3 張♠ 的競叫牌：用 X 讓同伴選擇。',
          blocks: [
            {
              kind: 'paragraph',
              text: '如果你拿類似這手牌：',
            },
            {
              kind: 'hand',
              hand: { spades: 'Axx', hearts: 'xx', diamonds: 'Qxxx', clubs: 'Qxxx' },
            },
            {
              kind: 'paragraph',
              text: '應該是想參與競叫，以哪一門花色參與競叫又沒辦法保證。如果隨便猜一門低花，猜錯的可能性很大，而合約已上3線。如果你只想在2線上叫牌，又只能叫出3張的2♠，',
            },
            {
              kind: 'paragraph',
              text: '這裡用回答性賭倍就能解決 讓同伴去作出選擇，哪怕他可能叫出♠。',
            },
            {
              kind: 'paragraph',
              text: '他應該要有邏輯且合理地假設，如果你有4張♠的話，你一定會直接叫出2♠。因此，你可能只有3張♠，如果他要選擇♠的話，他需要持有5張或非常好的4張♠。',
            },
            {
              kind: 'note',
              tone: 'info',
              text: '（這裡同樣可以解決前面5143 五張爛高花要T/O 還是蓋叫1♠的小問題）',
            },
          ],
        },
        {
          id: 'follow-up',
          title: '後續延伸：1♥ (X) 2♥ (X) P 2♠ P ?',
          originalTitle: '後續延伸',
          blocks: [
            {
              kind: 'responses',
              auction: { seats: defence, calls: ['1H', 'X', '2H', 'X', 'P', '2S', 'P', '?'] },
              rows: [
                {
                  call: 'P',
                  meaning:
                    '如上描述的牌 有3張♠：你可能就選擇派斯打 同伴也早已知道你是三張（四張你會直接叫2♠）',
                },
                {
                  call: '2NT',
                  meaning: '此時你是2344 之類的低花：照約定叫出2NT 以讓同伴選擇低花並找到8張來打',
                },
              ],
            },
            { kind: 'paragraph', text: '還有其他延伸應用 有機會再看看' },
          ],
        },
        {
          id: 'three-hearts',
          title: '另一常見牌例：1♠ (X) 2♠ (X) P 3m P 3♥',
          originalTitle: '另一常見牌例',
          summary: '經由回答性賭倍再叫 3♥ 是競叫；直接叫 3♥ 是邀請。',
          blocks: [
            {
              kind: 'rules',
              items: [{ text: '1♠－(X)－2♠－(X)' }, { text: 'Pass－(3m)－Pass－(3♥)' }],
            },
            {
              kind: 'paragraph',
              text: '這邊可以約定 透過回答性賭倍出來的再叫3♥是邀請 還是僅競叫，也可以反過來用，跟以下叫牌做區分',
            },
            {
              kind: 'responses',
              auction: { seats: defence, calls: ['1S', 'X', '2S', '3H'] },
              rows: [{ call: '3H', meaning: '邀請（好牌 不願被塞住）' }],
            },
            {
              kind: 'paragraph',
              text: '我是比較傾向 直接叫3♥是邀請（好牌 不願被塞住），然後透過回答性 X再3♥是競叫',
            },
          ],
        },
      ],
    },
    {
      id: 'opener-double',
      title: '開叫者的回答性賭倍',
      originalTitle: '下面這些也是回答性賭倍',
      summary: '開叫者回應 negative X 的 X：表示一手不錯的牌與另兩門的支持。',
      blocks: [
        {
          kind: 'rules',
          items: [{ text: '1m－（1♠）－X－（2♠）－X' }],
        },
        {
          kind: 'paragraph',
          text: '這裡是開叫者做回答性賭倍 回應negative X',
        },
        {
          kind: 'paragraph',
          text: '開叫者用X表示自己持有一手不錯的牌，3張♥，並且對另一門低花也有一定的支持。',
        },
        { kind: 'paragraph', text: '例如2344 2353 2335 1345 1354' },
        {
          kind: 'responses',
          auction: { seats: opening, calls: ['1H', '1S', 'X', '2S', 'X'] },
          rows: [{ call: 'X', meaning: '開叫者最常見的牌為2533或1633 且有一些額外力量' }],
        },
        {
          kind: 'responses',
          auction: { seats: opening, calls: ['1S', '2C', 'X', '3C', 'X'] },
          rows: [{ call: 'X', meaning: '開叫方作回答性賭倍的最理想標準的牌型是5341' }],
        },
      ],
    },
    {
      id: 'minors-example',
      title: '牌例延伸：1♥ (X) 2♥ ?',
      originalTitle: '牌例延伸',
      summary: '♠ 已被叫走，這裡的回答性賭倍主要是強調低花。',
      blocks: [
        { kind: 'hand', hand: { spades: 'Kx', hearts: 'xxx', diamonds: 'Qxxx', clubs: 'AJxx' } },
        { kind: 'paragraph', text: '敵方開叫並支持高花' },
        {
          kind: 'paragraph',
          text: '♠已被叫走 你只剩另一門♥可叫。',
          pending:
            '敵方叫的是 1♥－2♥，疑應為「♥已被叫走 你只剩另一門♠可叫」，下一句「若有♥牌組」同樣待確認。',
        },
        { kind: 'paragraph', text: '若有♥牌組 就在覺得適合的任何線位叫出。' },
        { kind: 'paragraph', text: '所以這邊回答性賭倍主要是強調低花。' },
        {
          kind: 'paragraph',
          text: '這裡同伴對你的回答性賭倍很可能叫♠ 因為你有三張的機會很大。',
        },
        {
          kind: 'paragraph',
          text: '但是你後續可以使用前面講的約定可轉至2NT（以表示選擇低花）',
        },
        {
          kind: 'responses',
          auction: {
            seats: defence,
            calls: ['1H', 'X', '2H', 'X', 'P', '2S', 'P', { call: '2NT', note: '選低花' }],
          },
          rows: [{ call: '2NT', meaning: '選低花' }],
        },
      ],
    },
  ],
}
