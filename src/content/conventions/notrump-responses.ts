import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 1NT的答叫 (Responses to 1NT)
 * Source: the club's Word file "1NT的答叫".
 * Transcribed verbatim; only bids and suit letters were rewritten with suit symbols (2D -> 2♦,
 * "C較好" -> "♣較好"). The source shows no opponents' calls, so their seats are left empty.
 */

const seats: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']

export const notrumpResponses: Convention = {
  slug: 'notrump-responses',
  nameZh: '1NT的答叫',
  nameEn: 'Responses to 1NT',
  aliases: ['1NT答叫', '開叫1NT', 'stayman', 'transfer', 'Texas transfer', 'gerber', '低花詢問'],
  category: 'notrump',
  kind: 'system',
  level: 'basic',
  tags: ['1NT', 'stayman', 'transfer', 'Texas transfer', 'gerber', '低花詢問'],
  summary: '開叫 1NT（15~17）後的答叫一覽、依目的選擇合約的方式，以及 2♣／2♦／2♥／2♠ 等後續。',
  source: { title: '1NT的答叫' },
  updated: '2026-10-21',
  sections: [
    {
      id: 'opening',
      title: '開叫1NT',
      summary: '15~17，3334、4432、5332 牌型。',
      blocks: [
        {
          kind: 'paragraph',
          text: '開叫1NT(15~17，3334、4432、5332牌型，5張花色只能是低花)',
        },
      ],
    },
    {
      id: 'responses',
      title: '開叫1NT之答叫',
      summary: '2♣ stayman、2♦／2♥ transfer、2♠ 低花詢問、4♣ gerber、4♦／4♥ Texas transfer。',
      blocks: [
        {
          kind: 'responses',
          auction: { seats, calls: ['1NT', '', '?'] },
          rows: [
            {
              call: '2C',
              meaning: 'stayman 詢問高花，9↑(至少一門4張高花及有邀請點或4441、3451、4351牌型之弱牌)',
            },
            { call: '2D', meaning: 'transfer 5張♥↑轉換，點力未知' },
            { call: '2H', meaning: 'transfer 5張♠↑轉換，點力未知' },
            { call: '2S', meaning: '詢問低花，點力未知，通常是爛牌(♣較好回答3♣，♦較好回答2NT)' },
            { call: '2NT', meaning: '8好點~10爛點，無4張↑高花，邀請3NT' },
            { call: '3C', meaning: '12點↑，6張♣↑或14點↑，5張♣↑，try slam' },
            { call: '3D', meaning: '同上' },
            { call: '3H', meaning: '同上' },
            { call: '3S', meaning: '同上' },
            { call: '3NT', meaning: '10~15 無4張↑高花，束叫' },
            { call: '4C', meaning: 'gerber 問A(回答4♦ - 0或4，4♥ - 1，4♠ - 2，4NT - 3)' },
            { call: '4D', meaning: 'Texas transfer 6張♥↑轉換，有成局力量' },
            { call: '4H', meaning: 'Texas transfer 6張♠↑轉換，有成局力量' },
            { call: '4S', meaning: '55↑低花，詢問低花，有成局力量(開叫人答叫方式同2♠)' },
            { call: '4NT', meaning: '15~16，無4張↑高花，邀請6NT' },
            { call: '5NT', meaning: '19~20，無4張↑高花，邀請7NT' },
          ],
        },
      ],
    },
    {
      id: 'contract-choice',
      title: '合約選擇方式',
      originalTitle: '開叫1NT後，合約選擇方式：',
      summary: '依目的（爛牌要打、邀請、成局、滿貫）查該用哪個叫品。',
      children: [
        {
          id: 'to-play-weak',
          title: '爛牌要打',
          blocks: [
            {
              kind: 'rules',
              items: [
                { text: '低花爛牌要打：2♠後之3線低花為束叫' },
                { text: '高花爛牌要打：2線轉換後pass' },
              ],
            },
          ],
        },
        {
          id: 'invitational',
          title: '邀請叫品',
          blocks: [
            {
              kind: 'rules',
              items: [
                { text: '低花邀請：2NT或2♠後之四線低花' },
                {
                  text: '高花邀請：',
                  children: [
                    { text: '4張：2♣後沒對到叫2NT，對到叫該花色3線' },
                    { text: '5張為二線轉換後叫2NT' },
                    { text: '6張為二線轉換後叫該花色3線' },
                    {
                      text: '5-4高花以上，2♣後同伴回答2♦再叫出二線5張高花（迫叫一圈，邀請點以上，若同伴回答高花則直接叫該花色三線邀請）',
                    },
                    { text: '5-5高花以上，2♦轉換2♥後再叫2♠（邀請不迫叫）' },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'game',
          title: '成局束叫',
          blocks: [
            {
              kind: 'rules',
              items: [
                { text: '低花束叫：3NT；2♠、4♠、1NT後之5線低花' },
                {
                  text: '高花束叫：',
                  children: [
                    { text: '4張：2♣後沒對到叫3NT，對到叫該花色4線' },
                    { text: '5張為二線轉換後叫3NT' },
                    { text: '6張為二線轉換後叫該花色4線' },
                    {
                      text: 'P.S.二線轉換後叫四線的牌是不能跳叫三線最好的牌，即1NT開叫者高限好牌還是可以try slam',
                    },
                    {
                      text: '5-4高花以上，2♣後同伴回答2♦再叫出二線5張高花（迫叫一圈，邀請點以上，若同伴回答高花則直接叫該花色成局）',
                    },
                    { text: '5-5高花以上，2♥轉換2♠後再叫3♥（迫叫成局以上）' },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'slam-try',
          title: '嘗試滿貫',
          blocks: [
            {
              kind: 'rules',
              items: [
                { text: '一門花色：跳叫3線' },
                {
                  text: '二門高花：',
                  children: [
                    { text: '5-4高花以上，2♣後再叫出5張高花（無論同伴回答什麼，都是迫叫成局以上）' },
                    {
                      text: '55以上，2♥轉換2♠後再叫3♥（迫叫成局以上）',
                      pending:
                        '與「成局束叫」的 5-5 高花叫法（2♥轉換2♠後再叫3♥）相同，如何區分只想成局與嘗試滿貫，請確認。',
                    },
                  ],
                },
                {
                  text: '一高一低二門：',
                  children: [
                    {
                      text: '5張高花＋4張低花以上（一高一低55以上也是用此叫法），2線轉換該高花後，再叫出3線低花，slam try（只有成局的點力，2線轉換後應該叫3NT）',
                    },
                    {
                      text: '5張低花以上＋4張高花，2♣後再叫出3線的5張低花，slam try（只有成局的點力，2♣後應該叫3NT或4線高花）',
                    },
                  ],
                },
                {
                  text: '二門低花：',
                  children: [
                    {
                      text: '54或55以上，先叫2♠詢問，之後叫3♥是5張♣＋4張♦的slam try，叫3♠是5張♦＋4張♣的slam try（55的話，一般會叫同伴回答的花色以先確認王牌，即2NT ＞ 3♠，3♣ ＞ 3♥）',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'continuations',
      title: '後續答叫說明',
      originalTitle: '後續答叫說明如下：',
      summary: '2♣、2♦、2♥、三線花色、2♠ 之後的開叫者回答與答叫者再叫。',
      children: [
        {
          id: 'after-2c',
          title: '一、1NT 2♣',
          blocks: [
            {
              kind: 'responses',
              auction: { seats, calls: ['1NT', '', '2C', '', '?'] },
              rows: [
                { call: '2D', meaning: '無4張高花' },
                { call: '2H', meaning: '有4張♥，不一定有4張♠' },
                { call: '2S', meaning: '有4張♠，一定沒有4張♥' },
              ],
            },
            { kind: 'paragraph', text: '◎答叫人之再叫原則如下：' },
            {
              kind: 'rules',
              ordered: true,
              items: [
                { text: '答叫人加叫三線高花為邀請高花成局，加叫四線高花為束叫。' },
                { text: '答叫再叫2NT為邀請3NT。' },
                {
                  text: '答叫人再叫新花為5張牌組及一門高花4張，高花為邀請點↑的牌（迫叫一圈），低花為try slam的牌(否則叫2NT邀請或3NT)',
                },
                { text: '1NT回答高花後，答叫人跳叫新花為splinter' },
              ],
            },
          ],
        },
        {
          id: 'after-2d',
          title: '二、1NT 2♦',
          blocks: [
            {
              kind: 'responses',
              auction: { seats, calls: ['1NT', '', '2D', '', '?'] },
              rows: [
                { call: '2H', meaning: '普通牌' },
                { call: '3H', meaning: '有4張♥（3張♥，5332高限），17點好牌(不平均牌，無廢點)' },
              ],
            },
            { kind: 'paragraph', text: '◎2♥後答叫人之再叫原則如下：' },
            {
              kind: 'rules',
              ordered: true,
              items: [
                { text: 'PASS表示低限牌力，無成局之希望。' },
                { text: '轉換後再叫2NT為5張♥之邀請，3NT為5張♥有成局點。' },
                { text: '轉換後再叫3♥為6張♥之邀請，4♥為6張♥有成局點。' },
                {
                  text: '答叫人再叫新花為5張♥及一門牌組，高花為55邀請點↑的牌（上面有說明），低花為4張try slam的牌(否則叫2NT邀請或3NT)。',
                  children: [{ text: '＊高花54用stayman，55用transfer。' }],
                },
                { text: '轉換後跳叫新花為splinter，6張牌組以上。' },
              ],
            },
          ],
        },
        {
          id: 'after-2h',
          title: '三、1NT後2♥',
          blocks: [{ kind: 'paragraph', text: '(後續答叫同1NT  2♦ )' }],
        },
        {
          id: 'after-three-level',
          title: '四、1NT後任何三線花色',
          blocks: [
            { kind: 'paragraph', text: '◎開叫人之再叫原則如下：' },
            {
              kind: 'rules',
              ordered: true,
              items: [
                { text: '叫3NT表示同伴牌組2張不FIT。' },
                { text: '加叫同伴花色表示低限(點力及牌型較差)。' },
                { text: '王牌FIT高限好牌時，從最低的控制叫起。' },
              ],
            },
          ],
        },
        {
          id: 'after-2s',
          title: '五、1NT 2♠ 之後',
          originalTitle: '五、1NT  2S後無論同伴叫2NT or 3C，答叫人再叫',
          blocks: [
            {
              kind: 'responses',
              caption: '1NT 2♠後無論同伴叫2NT or 3♣，答叫人再叫',
              rows: [
                { call: '3H', meaning: '14↑，5張♣↑，4張♦↑之好牌，try slam' },
                { call: '3S', meaning: '14↑，4張♣↑，5張♦↑之好牌，try slam' },
              ],
            },
            { kind: 'paragraph', text: '◎開叫人之再叫方式為' },
            {
              kind: 'rules',
              items: [
                { text: '3NT ---- 低花都不fit或高花點力浪費很多。' },
                { text: '4線低花 ---- fit所叫低花，且牌型點力為高限。' },
                { text: '5線低花 ---- fit所叫低花，唯牌型點力為低限。' },
              ],
            },
          ],
        },
        {
          id: 'extras',
          title: '其他補充叫品',
          blocks: [
            {
              kind: 'rules',
              ordered: true,
              items: [
                {
                  text: '2♣ stayman後，若同伴叫出其4張高花後，叫4NT為邀請6NT，若要對該高花用RKCB時，先使用splinter騙他，再叫4NT即可。',
                },
                {
                  text: '4NT（邀請6NT）後，開叫人接受邀請時，叫6線低花為該低花5張，叫5NT是請答叫人叫出4張的低花，即欲尋求44的6線低花合約。',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
