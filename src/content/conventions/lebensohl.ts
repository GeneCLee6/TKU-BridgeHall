import type { Auction, Convention } from '../../types/convention.ts'

/**
 * 雷本索特約 (Lebensohl)
 * Source: the club's Word file "雷本所特約" (title inside the file: 1NT遭插叫的答叫原則).
 * Transcribed verbatim; only bids were rewritten with suit symbols (2D -> 2♦).
 * Bold in the source is kept as **bold**.
 */

const seats: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']

export const lebensohl: Convention = {
  slug: 'lebensohl',
  nameZh: '雷本索特約',
  nameEn: 'Lebensohl',
  aliases: ['雷本所', '雷本索', '1NT遭插叫的答叫原則', 'Lebensohl'],
  category: 'notrump',
  tags: ['1NT', '插叫', '2NT 迫叫 3♣', 'stayman', '擋張'],
  summary: '同伴開叫 1NT 遭敵方插叫時的答叫原則：二線不迫叫、三線 GF、2NT 迫叫 3♣ 後續。',
  source: {
    title: '雷本所特約（文件標題：1NT遭插叫的答叫原則）',
    note: '原文寫作「雷本索」；檔名寫作「雷本所」。',
  },
  updated: '2026-10-21',
  sections: [
    {
      id: 'natural',
      title: '遭自然牌組插叫',
      originalTitle: '1NT遭插叫的答叫原則',
      summary: '二線新花不迫叫、三線新花 GF、2NT 迫叫 3♣、X 為處罰。',
      children: [
        {
          id: 'natural-rules',
          title: '答叫原則',
          blocks: [
            {
              kind: 'paragraph',
              text: '以下為同伴開叫1NT遭自然牌組插叫的答叫原則：(即Lebensohl雷本索特約)',
              pending:
                '特約中文譯名：原文寫作「雷本索」，社內檔名寫作「雷本所」。網站暫以原文「雷本索」為準，請幹部確認統一譯名。',
            },
            {
              kind: 'rules',
              ordered: true,
              items: [
                { text: '二線新花為5張+不迫叫，5~8 HCP。' },
                { text: '三線新花為5張+GF，10+ HCP。' },
                { text: '三線加叫敵方牌組為stayman，敵叫花色無擋。' },
                { text: '直接叫3NT為有成局點束叫，無高花，**敵叫花色無擋**。' },
                {
                  text: '2NT為人為性叫品，迫叫3♣，後續答叫原則',
                  children: [
                    { text: 'pass束叫。' },
                    { text: '3線新花：低於敵方花色為束叫，高於敵方花色為邀請' },
                    { text: '3線敵方牌組：stayman，敵叫花色有擋。' },
                    { text: '3NT：有成局點，無高花，敵叫花色有擋。' },
                  ],
                },
                { text: 'X為處罰。' },
                { text: '4線叫品同原先叫品。' },
              ],
            },
            {
              kind: 'note',
              tone: 'warning',
              text: 'P.S.此答叫僅用於插叫自然牌組時，若插叫為人為特約時則不適用，須另行約定。',
            },
          ],
        },
        {
          id: 'natural-example-2d',
          title: '例：1NT (2♦) ?',
          blocks: [
            {
              kind: 'responses',
              caption: '例如：',
              auction: { seats, calls: ['1NT', '2D', '?'] },
              rows: [
                { call: 'P', meaning: '什麼都沒有' },
                { call: 'X', meaning: '處罰' },
                { call: '2H', meaning: '5張+不迫叫，5~8 HCP。' },
                { call: '2S', meaning: '5張+不迫叫，5~8 HCP。' },
                { call: '2NT', meaning: '迫叫3♣' },
                { call: '3C', meaning: '5張+GF，10+ HCP。' },
                { call: '3D', meaning: 'stayman，♦沒擋。' },
                { call: '3H', meaning: '5張+GF，10+ HCP。' },
                { call: '3S', meaning: '5張+GF，10+ HCP。' },
                { call: '3NT', meaning: '有成局點，無高花，敵叫花色沒擋。' },
                { call: '4C', meaning: '問A' },
                { call: '4D', meaning: '轉換♥' },
                { call: '4H', meaning: '轉換♠' },
              ],
            },
          ],
        },
        {
          id: 'natural-example-2nt',
          title: '例：1NT (2♦) 2NT，開叫者叫 3♣ 之後',
          blocks: [
            {
              kind: 'responses',
              auction: { seats, calls: ['1NT', '2D', '2NT', '', '3C', '---', '?'] },
              rows: [
                { call: 'P', meaning: 'to play' },
                { call: '3D', meaning: 'stayman，♦有擋。' },
                { call: '3H', meaning: '5張邀請' },
                { call: '3S', meaning: '5張邀請' },
                { call: '3NT', meaning: '成局點，♦有擋，無高花' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'artificial',
      title: '遭非自然牌組插叫',
      originalTitle: '※ 非自然牌組插叫時',
      summary: '大部份原則同 Lebensohl，X 與巧叫的意義不同。',
      children: [
        {
          id: 'artificial-rules',
          title: '例外原則',
          blocks: [
            { kind: 'paragraph', text: '非自然牌組插叫時，大部份原則同Lebensohl，除了以下：' },
            {
              kind: 'rules',
              ordered: true,
              items: [
                { text: 'X為敵方所叫非自然叫品之花色為牌組5張↑，點力至少為5點↑' },
                {
                  text: '若敵方插叫表示兩高或是兩低時，則巧叫敵方二線花色為該花色有擋，巧叫三線敵方花色為詢問擋張',
                },
                { text: '答叫者先pass，待敵方叫出真正牌組後，原則同Lebensohl。' },
              ],
            },
          ],
        },
        {
          id: 'artificial-example-2c',
          title: '例：1NT (2♣ 一門未知牌組) ?',
          blocks: [
            {
              kind: 'responses',
              auction: { seats, calls: ['1NT', { call: '2C', note: '一門未知牌組' }, '?'] },
              rows: [
                { call: 'P', meaning: '可能什麼都沒有或是等敵方叫牌後再決定' },
                { call: 'X', meaning: '5張♣↑，5點↑。' },
                { call: '2D', meaning: '5張+不迫叫，5~8 HCP。' },
                { call: '2H', meaning: '5張+不迫叫，5~8 HCP。' },
                { call: '2S', meaning: '5張+不迫叫，5~8 HCP。' },
                { call: '2NT', meaning: '迫叫3♣' },
                { call: '3C', meaning: '5張+GF，10+ HCP。' },
                { call: '3D', meaning: '5張+GF，10+ HCP。' },
                { call: '3H', meaning: '5張+GF，10+ HCP。' },
                { call: '3S', meaning: '5張+GF，10+ HCP。' },
                { call: '3NT', meaning: 'to play。' },
                { call: '4C', meaning: '問A' },
                { call: '4D', meaning: '轉換♥' },
                { call: '4H', meaning: '轉換♠' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'other-uses',
      title: '其他運用',
      originalTitle: '※ Lebensohl特約的其他運用：',
      summary: '敵方弱二開叫後、開叫者二線倒叫後。',
      pending: '原文僅列出適用情境，未說明各情境下的叫品意義，請幹部補充。',
      blocks: [
        {
          kind: 'rules',
          items: [{ text: '敵方弱二開叫，同伴迫伴賭倍後。' }, { text: '開叫者二線倒叫後。' }],
        },
      ],
    },
  ],
}
