# CONTENT_GUIDE — 新增與維護特約

給幹部的逐步說明。不需要懂 React，只要會編輯文字檔、跑幾個指令。

## 0. 準備

1. 安裝 Node.js 22 與 Git。
2. 取得專案：`git clone https://github.com/GeneCLee6/TKU-BridgeBook.git`，進入資料夾後 `npm install`。
3. `npm run dev`，瀏覽器打開 http://localhost:5173 ，邊改邊看。

## 1. 轉錄原則（最重要）

- **逐字轉錄**：叫品、意義、點力範圍、例子、用字都照原文。不要依自己的橋牌知識補充、刪減或「修正」。
- **只做兩種轉換**：
  - 叫品寫成 ASCII（`2D`、`1NT`、`X`、`P`），網站會自動顯示為 2♦、1NT、X、Pass。
  - 意義文字中的花色字母改成符號：`H不fit` → `♥不fit`、`迫叫至3H` → `迫叫至3♥`。注意 `問A` 的 A 是 A 牌，不是花色，不要改。
- **原文粗體**用 `**…**` 包起來。
- **有疑義就標「待確認」**：保留原文，在同一列加上 `pending: '說明…'`，並把它加到本文件最後的清單。
- 原文的標題若被改寫成較清楚的網站標題，把原文標題放在 `originalTitle`。

## 2. 建立檔案

在 `src/content/conventions/` 新增 `<slug>.ts`。slug 用小寫英文與連字號，例如 `jacoby-transfer`。範本：

```ts
import type { Auction, Convention } from '../../types/convention.ts'

const seats: Auction['seats'] = ['開叫者', '敵方', '答叫者', '敵方']

export const jacobyTransfer: Convention = {
  slug: 'jacoby-transfer',
  nameZh: '（原文的中文名稱）',
  nameEn: 'Jacoby Transfer',
  aliases: ['其他常用叫法'],
  category: 'notrump',            // 見 src/content/categories.ts
  tags: ['1NT', '轉換'],
  summary: '一句話摘要，顯示在收合的卡片上。',
  source: { title: '原始 Word 檔名' },
  updated: '2026-10-21',          // 最後一次對照原文的日期
  sections: [
    {
      id: 'rules',                // 小寫英文＋連字號，在本特約內唯一
      title: '答叫原則',
      blocks: [
        { kind: 'paragraph', text: '原文的說明段落。' },
        {
          kind: 'rules',
          ordered: true,
          items: [{ text: '第一條。' }, { text: '第二條。', children: [{ text: '子項目。' }] }],
        },
      ],
    },
    {
      id: 'example',
      title: '例：1NT (P) ?',
      blocks: [
        {
          kind: 'responses',
          auction: { seats, calls: ['1NT', 'P', '?'] },
          rows: [
            { call: '2D', meaning: '轉換♥' },
            { call: '2H', meaning: '轉換♠', pending: '原文此處……，請確認。' },
          ],
        },
      ],
      children: [/* 子段落，同樣的格式，可以再巢狀 */],
    },
  ],
}
```

## 3. 各種內容區塊

| `kind` | 用途 | 欄位 |
| --- | --- | --- |
| `paragraph` | 一段說明文字 | `text`、`pending?` |
| `rules` | 條列（`ordered: true` 為 1. 2. 3.） | `items[]`：`text`、`pending?`、`children?` |
| `responses` | 叫牌過程＋叫品表 | `auction?`、`caption?`、`rows[]`：`call`、`meaning`、`note?`、`pending?` |
| `note` | 注意事項（原文的 P.S.） | `tone: 'info' \| 'warning'`、`text` |
| `hand` | 一手牌 | `hand: { spades, hearts, diamonds, clubs }`、`label?` |

**叫牌過程 `auction`**：`seats` 是四個座位標題，依原文順序；`calls` 由左到右、一行四格依序填入。空格用 `''`，原文的 `---` 照寫 `'---'`，要決定的叫品寫 `'?'`。叫品要加註時寫成 `{ call: '2C', note: '一門未知牌組' }`。

例：原文

```
答叫者  敵方  開叫者  敵方
                1H    2NT
 3C     ---     ？
```

寫成 `calls: ['', '', '1H', '2NT', '3C', '---', '?']`。

## 4. 登記與檢查

1. 在 `src/content/index.ts` import 新檔，加進 `conventions` 陣列（順序即顯示順序）。
2. 需要新分類時，先在 `src/types/convention.ts` 的 `CategoryId` 加一個值，再到 `src/content/categories.ts` 加上名稱與說明。
3. 執行：

   ```bash
   npm test          # 內容 schema 測試：slug／id 唯一、必填欄位、叫品格式、花色符號
   npm run lint
   npm run build
   ```

   「records the known 待確認 items」這個測試記錄了每個特約的待確認數量；新增或解決待確認項目時，一併更新測試中的數字。
4. 在瀏覽器逐段對照原文再檢查一次，特別是點力範圍與花色。
5. 開分支、commit（格式見 `RULES.md`）、發 PR，請另一位幹部審核內容。

## 5. 解決「待確認」

確認後：修改 `meaning`（或 `text`）為正確內容、刪除 `pending`、更新 `updated` 日期，並從下方清單移除該項，在 PR 說明中記下是誰確認的。

## 目前的待確認清單

### 雷本索特約（`lebensohl`）

| 位置 | 原文 | 問題 |
| --- | --- | --- |
| 遭自然牌組插叫 › 答叫原則 | 「(即Lebensohl雷本索特約)」；檔名「雷本所特約」 | 譯名不一致，網站暫用原文「雷本索」。 |
| 其他運用 | 「- 敵方弱二開叫，同伴迫伴賭倍後。」「- 開叫者二線倒叫後。」 | 原文只列出情境，沒有說明叫品意義，待補充。 |

### 對抗不尋常2NT（`defense-vs-unusual-2nt`）

| 位置 | 原文 | 問題 |
| --- | --- | --- |
| 我方使用：Unusually 2NT | 「Unusually 2NT對抗特約」 | 原文寫 Unusually（一般寫 Unusual）；網站英文名暫用 Unusual 2NT，內文照錄。 |
| 如何對抗敵方Unusually 2NT | 「開高花（1H、1S）被差叫2NT（兩低）時」 | 「差叫」疑為「插叫」。 |
| 開叫1♥時 › 答叫者首輪 › 3♥ | 「3張H，8-10點或4張H，6-8點（也就是6-9裡的好牌）。」 | 點力範圍與括號說明不一致。 |
| 開叫1♠時 › 答叫者首輪 › X | 「X – 平均牌型，H不fit，至少有邀請點↑，建議處罰敵方的合約。」 | 開叫為 1♠，疑應為「S不fit」（與 1♥ 段落同一句相同，可能是複製未改）。 |
| 開叫1♠時 › 答叫者首輪 › 3♠ | 「3張S，8-10點或4張S，6-8點（也就是6-9裡的好牌）。」 | 同 1♥ 的 3♥，點力範圍與括號說明不一致。 |
| 開叫1♠時 › 1♠ (2NT) 3♣ (—) 3♦ ? › 3NT | 「3NT – 12-15，雙低花都有1.5-2檔（通常是身價不利，否則趨向於X 2NT，並沿路追殺敵方合約）」 | 與答叫者首輪直接叫 3NT 的說明完全相同；此時答叫者已先叫 3♣，意義是否相同待確認。 |
| 開叫1♠時 › 1♠ (2NT) 3♣ (—) 3♦ ? › 4♦ | 「4D – H fit，C短，好牌」 | 與 4C 同樣寫「C短」，疑應為「D短」。 |
