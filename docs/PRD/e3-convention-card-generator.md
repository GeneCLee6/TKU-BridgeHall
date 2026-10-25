---
title: E3 — 制度卡產生器
date: 2026-10-24
status: planned
epic: E3
owner: GeneCLee6
milestones: [M1]
depends_on: [E1, E2]
---

## 背景

比賽要交制度卡（convention card）。現在每對搭檔自己填 Word 範本，內容和橋譜對不上、也沒人存檔。橋譜的叫品與意義已是結構化資料，制度集（E1）又記錄了每對搭檔的採用與覆寫，制度卡應該是「從制度集生成、內容寫進格子」而不是「再寫一次」。

**以中華民國橋藝協會下載專區「比賽工具 › 制度卡」為準**（<https://www.ctcba.org.tw/showpage.php?pg1=bfv94y50eg2j18xgypkj&pg2=ff7573p7wfgwdzd86lfg&lang=tw&infoid=49>；2026-10-24 核對，九個檔案；參考圖 `docs/design/ctcba-simple-card-reference.png`、`docs/design/wbf-card-reference-p1.png`、`-p2.png`）。原始檔不進 repo（`.gitignore` 排除 `*.doc`、`*.docx`、`tmp/`；PDF 也不要加），要核對時從上面的網址下載到 `tmp/ctcba/`；2026-10-25（D1b）版型已逐格對照原始檔：

| 檔案 | 是什麼 | 橋譜 |
| --- | --- | --- |
| WBF版空白制度卡.doc、(gillsans字型).doc | **WBF 制度卡**的 Word 空白表（主力）。兩頁橫式：第 1 頁三欄（Defensive and competitive bidding；Leads and signals＋Doubles；卡頭＋System summary），第 2 頁開叫表（OPENING／TICK IF ARTIFICIAL／MIN. NO. OF CARDS／NEG.DBL THRU／DESCRIPTION／RESPONSES／SUBSEQUENT ACTION／PASSED HAND BIDDING），HIGH LEVEL BIDDING 嵌在表格右下角（5♣ 列起）。檔案沒有版本號（最後列印 2004-03-12） | **生成**：填好內容輸出 `.docx`（照官方版面）與 PDF；字型版只是選項 |
| WBFCard-2.19.pdf | 較新版（2.19）WBF 卡的填寫範例（Bridge World Standard），後接 8 頁 Supplementary notes；卡頭是 Category／Country／Event／Players，部分標題與空白 .doc 不同 | **生成**：卡面＋補充說明頁一起輸出；卡上 `[Note n]` 對應附頁，附頁內容就是橋譜段落全文 |
| 2021-簡易制度卡(非橋士組用)-單面／雙面.pdf | 國橋簡易卡：橫式 A4 **勾選表**（開叫約定、競叫約定、對抗無王開叫、防禦約定；粗斜體＝預設、星號＝Alert、空格填點力與線位）。雙面版格子相同，一張 A4 並排印兩份、裁半：正面卡頭＋開叫約定，背面競叫、對抗無王、防禦約定 | **生成**：自動勾選、填空格 |
| WBF版BSC開叫申報表.docx、WBF版BSC蓋叫申報表.docx | 棕標特約（Brown Sticker Convention）的開叫／蓋叫申報表：Names、Event、Opening bid／Overcall、Shows、Detailed description、Responses and rebids、Competitive agreements、Proposed defence | **生成**：特約標記 `brownSticker` 時，從該特約的段落填表 |
| 2023WBFSystemsPolicy.pdf | WBF 制度政策（HUM、棕標的定義） | 參考：標記棕標時連到這份 |
| GuidetoCompletionWBFcc_2017.pdf | WBF 卡填寫指南（描述的就是空白 .doc 這一版：CATEGORY、NCBO、NAME OF PLAYER…） | 參考：每格的說明文字來源（hover 顯示）；WBF 版型每個填寫格的 `help` 摘自這份並註明頁碼 |

## 目標

- **WBF 卡**是主力：從制度集把每一格寫滿（制度摘要、特殊叫品、開叫表每一列、防守與競叫、首攻與信號、賭倍、高階叫牌），補充說明頁自動帶橋譜段落。
- 另外三類也能生成：國橋簡易卡（單面／雙面，勾選＋空格）、棕標申報表（開叫／蓋叫）。
- 兩種輸出：**PDF**（列印或 Worker 端產生）與 **`.docx`**（照官方版面重建的 Word 範本填入內容，裁判要 Word 檔也交得出來）。
- 填不出來的格子留白讓人補；補的內容存回制度集（成為覆寫或 `cardEdits`），不另存一份。
- 卡上每一格可點回橋譜段落；段落旁顯示「在制度卡的位置」。
- 版本：每次「發布」存快照，比賽後可查那場用的是哪版；分享連結給對手或裁判。

## 非目標

- 不做 ACBL 卡；版型是資料，之後要加再加。
- 不做自由排版；格子固定照官方版面。
- 不自創社團格式。

## 需求

### 功能

- **版型即資料**：

  ```ts
  type CardTemplateId = 'wbf' | 'ctcba-simple' | 'ctcba-simple-2p' | 'bsc-opening' | 'bsc-overcall'
  interface CardTemplate { id: CardTemplateId; name: string; year: number; pages: CardPage[]; paper: 'A4-landscape' | 'A4-portrait' }
  interface CardPage { blocks: CardBlock[] }
  type CardBlock =
    | { kind: 'cells'; id: string; title: string; titleZh?: string; lines: number; help?: string }          // WBF 的文字格：OVERCALLS、GENERAL APPROACH…
    | { kind: 'table'; id: string; columns: string[]; rows: string[] }                                       // WBF 第 2 頁開叫表、Leads 表、Signals 矩陣
    | { kind: 'check'; id: string; label: string; alert?: boolean; default?: boolean; blank?: { label: string } }  // 簡易卡勾選格
    | { kind: 'choice'; id: string; label: string; options: string[] }
    | { kind: 'text'; id: string; label: string; lines: number }                                              // 簡易卡空格、BSC 表的段落
  ```

- **填入**：`fillCard(template, resolvedConventions, profile) → FilledCard`，純函式。來源有三種，寫在特約的 `cardSlots`（E1）：
  - `{ slot: 'wbf.summary.general', text: '…' }`：固定文字（可含制度集變數如 `{{1nt.range}}`）。
  - `{ slot: 'wbf.openings.1H.responses', from: { sectionId, blockIndex } }`：把某段的叫品表濃縮成一行（`call=meaning; …`），超過行數就寫 `[Note n]` 並把全文放補充說明頁。
  - `{ slot: 'ctcba-simple.notrump.stayman', check: true, blank: { from: … } }`：簡易卡的勾選與空格。
  - 制度集 `adopted: 'off'` ⇒ 該特約的 slot 全部不填／不勾；覆寫 ⇒ 用覆寫後的列。填入結果每一格帶 `origin`（club／team／partnership），預覽時覆寫格有淡色底。
- **人工補格**：每格可編輯、標記、重設；存 `profile.cardEdits[slotId]`。
- **輸出**：
  - PDF：`/cards/:profileId/:templateId` 列印樣式照官方版面（WBF 橫式兩頁＋附頁；簡易卡橫式一或兩頁；BSC 直式）；Worker 端 PDF 列為 M2 選項。
  - `.docx`：用 `docx` 套件在瀏覽器重建官方版面（表格、欄寬、字級對照原始 .doc），填入內容後下載；WBF 卡另可選 Gill Sans 字型版。
- **棕標**：`Convention.brownSticker?: 'opening' | 'overcall'`，標記後制度卡頁多一張對應申報表，欄位從該特約的段落（開叫／蓋叫、意義、答叫、競叫、建議防禦）帶入。
- **分享與版本**：`/cards/:profileId/:templateId/v/:n` 唯讀連結（可關）；快照含填入結果與 `.docx`／PDF。
- **連回**：每格右上角「§」連回來源段落（列印隱藏）；段落旁顯示「WBF 卡 · VS NT」這類位置標。

### 非功能

- `fillCard` 有測試：同制度集兩次結果一致；空制度集（社團預設）填出的 WBF 卡與簡易卡由幹部對照現行手寫卡各確認一次。
- 列印：Chrome、Safari、Edge 三者不跑版；黑白；深色模式下列印仍黑白。
- `.docx` 用 Word 與 LibreOffice 開啟版面一致（寬度以 twips 固定，不用自動欄寬）。
- `docx` 套件只在制度卡頁 lazy 載入。

## 設計方向

- 版型檔 `src/cards/templates/{wbf,ctcba-simple,ctcba-simple-2p,bsc-opening,bsc-overcall}.ts`，各自記年份；`src/cards/fill.ts` 填入；`src/cards/docx.ts` 輸出 Word；列印樣式 `src/cards/print.css`。
- 制度卡頁不套網站風格（`DESIGN-V2.md` §5.10）：白紙黑格線，字級與欄寬照官方檔。
- 每格的 `help` 文字取自 Guide to Completion 2017，hover 顯示。

## 驗收條件

- [ ] AC-3.1 — 版型即資料：WBF、簡易單面、簡易雙面、BSC 開叫、BSC 蓋叫五個版型檔；新增版型只加檔案；每格有 `id`、種類、說明。
      （D1b：WBF 與簡易卡兩版已對照原始檔，WBF 每個填寫格有 Guide 2017 的說明；簡易卡官方沒有說明文字，所以不填。BSC 兩版待 `e3-t12`，到時才勾。）
- [ ] AC-3.2 — 填入：`fillCard` 純函式有測試；內建特約透過 `cardSlots` 寫滿 WBF 卡的制度摘要、特殊叫品、開叫表、防守與競叫、首攻與信號、賭倍；長內容自動轉 `[Note n]` 與附頁；不採用不填、覆寫填覆寫值；社團預設制度集的結果由幹部確認。
- [ ] AC-3.3 — 人工補格：每格可編輯、標記、重設；存回制度集。
- [ ] AC-3.4 — PDF：五種版型 A4 列印在三個瀏覽器不跑版，與官方檔的格線、欄寬、字級一致；黑白。
- [ ] AC-3.5 — `.docx`：WBF 卡（含 Gill Sans 版）、BSC 表可下載 Word 檔，Word 與 LibreOffice 開啟版面一致。
- [ ] AC-3.6 — 連回：卡上每格連回段落；段落旁顯示在哪張卡的哪一格。
- [ ] AC-3.7 — 版本與分享：發布快照、列表、開舊版；唯讀連結可關。
- [ ] AC-3.8 — 棕標：特約可標 `brownSticker`，制度卡頁多一張申報表並自動填入；連到 Systems Policy 說明。

## Task 拆分

**M1**

- [x] `e3-t01` `CardTemplate` 型別與 WBF 版型檔（第 1 頁三欄、第 2 頁開叫表與高階叫牌；逐格對照 `docs/design/wbf-card-reference-p1/p2.png` 與原始 .doc 的欄寬）· AC-3.1 · #13；D1b 依空白 .doc 定稿欄寬、行數、標題，並加 Guide 2017 說明
- [x] `e3-t02` 簡易卡版型檔（單面、雙面；對照 `ctcba-simple-card-reference.png`）· AC-3.1 · #13；D1b 依兩份 PDF 定稿欄寬與雙面版的正反面
- [ ] `e3-t03` `fill.ts`：三種來源、濃縮規則、`[Note n]` 與附頁、`origin`；`tests/cards/fill.test.ts` · AC-3.2 · M · ← e3-t01, e1-t08
- [ ] `e3-t04` 內建特約補 `cardSlots`（WBF 與簡易卡兩套）：1NT／2NT 答叫、Lebensohl、J2N、Bergen、NMF、2♦、弱二、各種賭倍、對抗不尋常 2NT、好壞 2NT、防守信號、制度總覽的開叫表；幹部對照手寫卡 · AC-3.2 · M · ← e3-t03
- [ ] `e3-t05` `/cards/:profileId/:templateId` 預覽頁：版型切換、格子渲染（含覆寫底色）、hover 說明、來源連結 · AC-3.6 · M · ← e3-t03
- [ ] `e3-t06` 人工補格（inline 編輯、標記、重設）；存 `profile.cardEdits` · AC-3.3 · S · ← e3-t05
- [ ] `e3-t07` 列印樣式：WBF 橫式兩頁＋附頁、簡易卡橫式、黑白；三瀏覽器檢查；「下載 PDF」走列印 · AC-3.4 · M · ← e3-t05
- [ ] `e3-t08` `.docx` 輸出（`docx` 套件、lazy chunk）：WBF 卡（含 Gill Sans 版）；Word／LibreOffice 對照 · AC-3.5 · M · ← e3-t05
- [ ] `e3-t09` 版本快照（含輸出檔）、分享連結（可關）· AC-3.7 · S · ← e3-t05
- [ ] `e3-t10` 段落旁「在制度卡的位置」標示 · AC-3.6 · S · ← e3-t04
- [ ] `e3-t11` 搭檔頁與隊伍頁的「制度卡」入口；隊伍一鍵印全隊 · AC-3.4 · S · ← e3-t05, e2-t05
- [ ] `e3-t12` 棕標：`brownSticker` 欄位、BSC 開叫／蓋叫版型檔、自動填入、`.docx` 輸出、連到 Systems Policy · AC-3.8、AC-3.1、AC-3.5 · M · ← e3-t08

**M2 · 選項**

- [ ] `e3-t13` Worker 端產 PDF（評估 Cloudflare Browser Rendering 免費額度；不夠就維持瀏覽器列印）· AC-3.4 · M

## 風險與對策

- **官方表格改版**：版型是資料檔，改版只改檔案；版型檔記年份（WBF 空白 .doc 2004、簡易卡 2021）。
- **WBF 的格子一行寫不下**：濃縮規則（`call=meaning;` 分號相連、常用縮寫表 NF／F1／GF／INV／PRE）＋ 超過就 `[Note n]` 進附頁；幹部可手動改。
- **`.docx` 版面跑掉**：欄寬固定 twips、字級固定，對照原始 .doc 的表格結構重建；不直接改原始 .doc 二進位。
- **英文**：WBF 卡格子用英文（裁判與對手看），來源段落是中文；`cardSlots` 的固定文字由幹部寫英文，叫品表濃縮時中文意義保留並加常用英文縮寫。
- **PDF 字體**：瀏覽器列印用系統字型；若要 Worker 產 PDF 需內嵌 Noto Sans TC 子集。

## 未決問題

- [x] **Q:** 社團簡式卡的欄位？
      **A:** 不自創，直接照中華民國橋藝協會的「2021 簡易制度卡（非橋士組用）」單面與雙面版（2026-10-24）。
- [x] **Q:** 哪一張卡是主力？
      **A:** WBF 版空白制度卡（2026-10-24）；簡易卡與棕標申報表也要能生成。
- [ ] **Q:** WBF 卡英文格子的濃縮文字由誰定稿（幹部寫固定英文，還是先機器濃縮再改）？
      **A:** _(unanswered)_
- [ ] **Q:** WBF 卡要照哪一版？國橋的空白 .doc（無版本號，卡頭 CATEGORY／NCBO／PLAYERS）與同頁的 WBFCard-2.19.pdf（卡頭 Category／Country／Event／Players）不同；版型目前照空白 .doc（`wbf.ts` 的 `pending`）。
      **A:** _(unanswered)_
