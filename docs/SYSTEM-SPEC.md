# 橋譜 → 牌桌機器人規則：轉換對照表與意義文字啟發式（E7 · e7-t01、e7-t02）

最後更新 2026-10-26。對應 PRD [`e7-bridgetable-integration.md`](PRD/e7-bridgetable-integration.md) 的 AC-7.1。

## 1. 程式在哪裡

| 檔案 | 說明 |
| --- | --- |
| 牌桌 `shared/systemSpec.ts` | **正本**。`toSystemSpec(conventions, profile)`、`readMeaning`、`auctionPatterns`、`expandCall` |
| 橋譜 `src/lib/systemSpec.ts` | 逐字複本；`npm run parity`（`tests/lib/tableParity.test.ts`）比對兩份原始碼，不同就失敗。兩邊一起改 |
| 牌桌 `tests/engine/system-spec.test.ts` | 每條啟發式的單元測試；型別檢查 `SpecShows` 可指派給機器人的 `Spec`、名稱都在 `CONVENTIONS` 裡、`SPEC_ANY` 等於 `ANY`、產生的 `after` 通過 `patternProblem` |
| 橋譜 `tests/lib/systemSpec.test.ts` | 22 個內建特約（`club` 制度集、內建內容）的轉換快照：每條規則、每列 `unresolved` 各一行；改內容或改啟發式時 PR 的快照差異就是審查清單 |

檔案不 import 任何東西，所以同一份原始碼在兩個 repo 都能編譯。只有 lazy 的牌桌整合頁（`/integrations/table`，e7-t04）import 它（不進首頁 bundle）：轉換在瀏覽器做、結果同步到牌桌（e7-t03，ARCHITECTURE.md §4.6）。

## 2. 牌桌的規則形狀（`shared/robot/system/spec.ts`，2026-10-25 版）

- `System { id, books, firstFit?, emergency? }`：一套制度是 `Book` 的清單。
- `Book { after?, only?, rules, more?, bookSlugs? }`：`after` 是叫牌過程樣式，從開叫起算，我方叫品照寫、敵方加括號：`'1N (P)'` 是同伴開 1NT、右手 pass；`''` 是還沒人開叫；`*`、`(*)`、`(+)` 是萬用。樣式由叫牌者往回數：最後一個是右手敵方，倒數第二個是同伴（`context.ts` 的 `fitsPattern`）。
- `Rule { call, shows?, needs?, when? }`：`call` 是叫品（`'1N'`、`'2S'`、`'P'`、`'X'`、`'XX'`，也可以是函式）；`shows` 是這個叫品表示什麼；`needs` 是手牌要什麼（預設等於 `shows`）；`when` 是其他條件（函式）。
- `Spec`：`name`（特約名，`CONVENTIONS`）、`hcp`、`tp`、`len`（每門花色張數）、`quality`、`stop`、`balanced`（只有 4333、4432、5332）、`controls`、`keycards`、`trumpQueen`、`trump`、`forcing`（`oneRound`／`game`）、`artificial`、`notes`。範圍是 `[下限, 上限]`，上限 `ANY`（40）是沒有上限。
- 變動頻率：`spec.ts`、`rules.ts`、`combine.ts` 10/24–10/25 共 10 次 commit，但近 5 次只加了 `CONVENTIONS`／`NOTES` 的名字與選填的 `Book.bookSlugs`，`Rule`、`Spec` 的欄位沒變；沒有進行中的重構或 open PR，所以判斷夠穩定、e7-t02 照做。

`toSystemSpec` 的輸出要能經 API 傳給牌桌（e7-t03），所以用 JSON 能表示的子集：沒有函式、`after` 一律是陣列。

## 3. 轉換對照表

| 橋譜 | 牌桌 | 說明 |
| --- | --- | --- |
| `Convention.slug` + `Section.id` | `SpecRule.ref` | 之後的 `bookRef`（e7-t05）；牌桌 `Book.bookSlugs` 記的就是 slug |
| `responses.auction.calls` | `SpecRule.after`（= `Book.after`） | 規則見 §4 |
| `ResponseRow.call` | `SpecRule.call`（= `Rule.call`） | `1NT`→`1N`、`PASS`→`P`；`1D/H/S` 拆成三條規則（`splitCall` 同樣的寫法） |
| `ResponseRow.meaning` | `SpecRule.text` ＋ `SpecRule.shows`（= `Rule.shows`） | 文字**逐字**保留當說明；`shows` 只放啟發式（§5）讀得出來的 |
| `ResponseRow.note` | `SpecRule.note` | 逐字保留，啟發式不讀 |
| `ResponseRow.pending`、`Section.pending` | `unresolved`（`pending`） | 待確認的內容不給機器人 |
| 意義讀剩的文字 | `SpecRule.unparsed` | 讓 e7-t04 報告看得到哪些條件沒進規則 |
| `paragraph`、`rules`、`note`、`hand` 區塊 | 不轉 | 只有叫品表有「叫品 → 意義」 |
| 制度集 `id`、`version` | `SystemSpec.profileId`、`version` | 同步以制度集版本為準 |

牌桌欄位**不填**：`needs`（等於 `shows`）、`when`、`tp`、`quality`、`stop`、`controls`、`keycards`、`trumpQueen`、`trump`、`artificial`、`notes`、`Book.only`、`Book.more`、`System.firstFit`。這些要人補（e7-t08）或由 e7-t03 載入時決定。

## 4. 叫牌過程 → `after`

1. 找唯一的 `?`。沒有 `?`（例子用的完整叫牌）或不只一個 → `noQuestion`。`?` 後面還有叫品 → `auctionCell`。
2. 從 `?` 往回數，隔一格是我方（照寫），其餘是敵方（加括號）。座位標題（開叫者／答叫者／你／同伴）不用，位置就決定了。
3. 開叫前的空格與 pass 略過（牌桌的樣式從開叫起算）。
4. 開叫之後，**敵方位置的空格當 pass**：`1NT、空、?` → `1N (P)`。我方位置的空格 → `auctionCell`。
5. 叫品上的註記（`3D{詢問}`）不影響樣式；空格帶註記（`{2X}`、`{4X（回答）}`）→ `auctionCell`。
6. 一格多個叫品（`1C/D`）→ 每種組合一個樣式。
7. 原文的 `---`、`--` 是 **Pass**（社團寫法，pass 不另外寫；使用者 2026-10-26 確認）：照 pass 處理，開叫前的略過。網站的叫牌過程把它畫成一條橫線，特約 `.ts` 原文照舊寫 `'---'`。

## 5. 意義文字啟發式清單

原則：**只抽原文明白寫出的條件，不補、不改**（CLAUDE.md 規則 1）。整列先檢查（§5.1），再把文字切成子句（`，,；;。、`、全形空白、換行），每個子句先過濾（§5.2），剩下的才套樣式（§5.3）。同一個欄位讀到兩個不同的值，兩個都不取。

### 5.1 整列不讀（進 `unresolved`）

| 情形 | 原因碼 | 例 |
| --- | --- | --- |
| 編號列出幾種牌 | `alternatives` | 「1.短門♣，12-21　2.5張♠ + 4張♣…」 |
| 括號外有「或」／or（選項可能跨子句） | `alternatives` | 「5張♥，10-12或6張♥↑，8-10」 |
| 括號裡有手牌條件（`n張`、四位數牌型、點、數字範圍、或／or、↑↓+） | `bracketed` | 「3張♠，8-10(4張♠的4333，8-10)」 |
| 讀不到任何點力、張數或牌型（只有特約名或迫叫也算） | `noConditions` | 「RKCB」「♣ fit，爛牌」 |
| 叫品不是叫品 | `call` | `?`、`---` |

### 5.2 子句不讀

括號裡的字一律不讀（留在 `unparsed`）。子句含以下任一字就整句不讀：

- 指別人：開叫、答叫、同伴、敵方、對方、敵叫
- 條件與選擇：如、若、時、則、或、or、之後、以後、後續、再叫
- 不確定：可能、通常、一定（含「不一定」）
- 否定與排除：沒有、無、不、非、否、除、避免、但、反、半
- 要求：須、需、要求
- 不是大牌點的計數：牌值、控制、墩、關鍵、LTC

### 5.3 樣式

| 欄位 | 樣式 | 例 → 結果 | 不取 |
| --- | --- | --- | --- |
| `len` | `n張` (`↑`/`+`/`以上`) 花色 (`↑`/`+`/`以上`) | 5張♥、6張↑♦、5張♣↑ → [5,ANY]、[6,ANY]、[5,ANY]；意義寫了牌型（5431）或「剛好／恰好／正好 n張」才是 [n,n] | `4張↑♦/♥`（哪個叫品配哪門？）、`1張♣↓`、`4~5張♥`、`2-3張` |
| `len` | `n+` 花色 | 4+♠、6+的紅心 → [4,ANY]、[6,ANY] | |
| `len` | 單張＋花色、花色＋單張 | 單張♦、♦單張 → [1,1] | 「短♠」「短門」（沒說幾張） |
| `len` | void／缺門＋花色 | ♠ void → [0,0] | 「一門void」（沒說哪門） |
| `hcp` | `a-b`、`a~b`（可帶 點／HCP），`a < b ≤ 37` | 15-17、13-15 點、5~8 HCP | `5-4`、`4-4`、`5-3-3-2`、`5-5低花`、`11-14↑`、`1.5-2檔` |
| `hcp` | `n` (點/HCP) `↑`／`+`／`以上` | 14↑、12+↑、10點以上、19+ HCP → [n,ANY] | `4+♠`（是張數）、`55↑低花`（大於 37） |
| `hcp` | `n` (點/HCP) `↓`／`以下` | 9點↓、6↓ → [0,n] | |
| `balanced` | 平均牌型 | → true | 文字裡出現 4333、4432、5332 以外的牌型時不取（社團的「平均」含 6322，牌桌的 `balanced` 不含） |
| `forcing` | 迫叫成局、成局迫叫、GF、game forcing | → `game` | NGF |
| `forcing` | 迫叫一圈、一圈迫叫、F一圈、單獨的「迫叫」 | → `oneRound` | 不迫叫、迫叫至3♥ |
| `name` | Stayman、Texas、Gerber、Splinter、Lebensohl、Michaels、Drury、RKCB、EKB、Blackwood、負性賭倍、回答性賭倍 | → 牌桌 `CONVENTIONS` 的名字 | 否定 Stayman |

**「點」一律當大牌點（`hcp`）**，不用牌桌的 `tp`（使用者 2026-10-26 確認）。**「n張」沒有特別講牌型的都是 n 張以上**，只有下限（同日確認；制度原文不改，人讀得懂）；明講剛好或寫了牌型的才是剛好 n 張。單張、void 是明講的張數，照舊是 [1,1]、[0,0]。只有點力、張數、牌型算「手牌條件」；只讀到特約名或迫叫的列進 `noConditions`，`shows` 帶著讀到的部分給人補。

## 6. 內建特約的轉換結果（2026-10-26）

22 個特約、383 個叫品表、1734 列：**798 條規則**（719 列，多叫品的列拆開），**1015 列 unresolved**：

| 原因 | 列數 |
| --- | --- |
| `noConditions` | 735 |
| `alternatives` | 132 |
| `bracketed` | 90 |
| `pending` | 37 |
| `auctionCell` | 13（空格帶註記：`{2X}` 11、`{4X（回答）}` 2） |
| `noQuestion` | 6 |
| `noAuction` | 2 |

`---` 當 Pass 之後，原本進 `auctionCell` 的 137 列裡 42 列轉成規則，其餘因意義文字本身進其他原因。規則中 578 條有 `unparsed`（意義裡還有沒讀進規則的字，例如「束叫」「邀請」「♦短」）。完整清單在 `tests/lib/__snapshots__/systemSpec.test.ts.snap`。

## 7. 已決定與待決定

使用者 2026-10-26 決定：

- 叫牌過程裡的 `---`、`--` 是 Pass（§4 第 7 點）。
- 「點」一律是大牌點（§5.3）。
- 「n張」沒講牌型就是 n 張以上（§5.3）。

待決定：

- ~~機器人用這些規則時的順序、`needs` 與後備規則由 e7-t03 決定~~ e7-t03（2026-10-28）：**機器人不照這些規則叫牌**，叫牌仍是牌桌已驗證的 `tku/` 規則；同步的規則只用來給機器人的叫品附上橋館原文（同一叫牌過程、同一叫品；兩列文字不同時都不附），以及差異報告頁比對兩邊讀法。要讓機器人照橋館規則叫，等幹部補完手牌條件（e7-t08）再議。
