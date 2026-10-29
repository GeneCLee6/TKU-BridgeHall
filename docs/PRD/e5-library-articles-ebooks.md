---
title: E5 — 橋藝叢書
date: 2026-10-24
status: in progress
epic: E5
owner: GeneCLee6
milestones: [M2]
depends_on: [E1, E9, E10]
---

## 背景

橋譜不只是制度：主打（做莊）、擠牌、投入、防守、社課講義、學長寫的心得，這些都還在群組裡傳 PDF。橋譜要成為社團的「叢書架」：文章可以線上寫（含牌例與叫牌過程），電子書可以上傳、分類、在站內讀。

## 目標

- 新內容型別 **文章**（`Article`）：標題、作者、系列、程度、區塊（沿用 `Block`，加 `heading`、`deal`（四家牌）、`play`（出牌序列）、`image`、`quote`）。
- **電子書**：上傳 PDF（之後 EPUB）到牌桌 Worker 的 R2；站內閱讀器；封面、作者、年代、授權。
- **系列**：主打、擠牌、防守、叫牌理論、社課講義、社史……可線上增改。
- **授權與可見範圍**：自撰／取得授權／僅社內；僅社內的只有登入社員可看；每本書必填。
- 搜尋含文章（E10 索引）；閱讀進度（登入）。

## 非目標

- 不做評論區（牌桌 E13 論壇之後可嵌入）。
- 不做付費內容。
- 不放未授權的商業書籍；違反授權欄位的上傳由幹部下架。

## 需求

### 功能

- `Article`：

  ```ts
  interface Article { slug: string; title: string; authors: string[]; series: string; level?: Level; summary: string; cover?: string; blocks: Block[]; published: string; updated: string; license: License }
  type Block = …既有… | { kind: 'heading'; level: 2 | 3; text: string } | { kind: 'deal'; deal: Deal; dealer?: Seat; vul?: Vul; caption?: string } | { kind: 'play'; contract: string; declarer: Seat; tricks: string[]; caption?: string } | { kind: 'image'; src: string; alt: string; caption?: string } | { kind: 'quote'; text: string; cite?: string }
  type License = 'own' | 'permitted' | 'members-only'
  ```

- `Ebook`：`{ id, title, authors, series, year?, license, fileKey (R2), pages?, cover?, size, uploadedBy }`；上傳走一次性憑證直傳 Worker（沿用匯入的 ticket 機制），上限 50 MB。
- 閱讀器：PDF 以 `pdf.js` 在站內顯示（UMD 版、lazy chunk）；記頁碼進度。
- 叢書頁 `/library`：依系列、程度、作者瀏覽；`/library/:slug` 文章頁；`/library/book/:id` 書頁。
- 文章線上編輯：沿用編輯器（`components/editor/`），加上新區塊的表單；`deal` 用四家牌輸入（與牌桌 E13 的四手牌編輯器共用元件）。
- AI 匯入可以把 Word／PDF 整理成文章（擴充 F15 的 schema 加 `article` 類型）。

### 非功能

- R2 用牌桌既有帳號（免費 10 GB）；超過時幹部收到提醒。
- `pdf.js` 只在書頁載入；首頁 bundle 不變大。
- 圖片上傳也走 R2，限制 2 MB、自動產縮圖。

## 設計方向

- 文章頁是「書頁」版面（`DESIGN-V2.md` §6）：寬 68 字、襯線標題、牌例置中；跟特約頁共用閱讀設定。
- 叢書頁像書架：系列為一列，封面（沒封面用系列色＋書名生成）。
- Worker：`article:<slug>`（內容分片與 `BookEntry` 同法）、`ebook:<id>`、R2 bucket `bridgebook-files`。

## 驗收條件

- [ ] AC-5.1 — `Article` 型別與新區塊；`tests/content` 驗證；文章頁渲染全部區塊種類。
- [ ] AC-5.2 — 文章線上編輯（新增、改、版本、送審走 E8）；AI 匯入可產文章草稿。
- [ ] AC-5.3 — `deal` 與 `play` 區塊：四家牌輸入與顯示（與牌桌共用元件）、出牌序列逐墩顯示。
- [ ] AC-5.4 — 電子書上傳到 R2（憑證直傳、50 MB、必填授權）；封面、作者、年代。
- [ ] AC-5.5 — 站內 PDF 閱讀器（lazy 載入）、頁碼、全螢幕、手機可用。
- [ ] AC-5.6 — 授權與可見：`members-only` 未登入看不到連結也打不開檔案（Worker 簽名 URL 短效）。
- [x] AC-5.7 — 系列可線上增改；叢書頁依系列／程度／作者瀏覽；搜尋含文章標題與內文。
- [ ] AC-5.8 — 閱讀進度（文章讀到哪段、書讀到哪頁）記在帳號；我的帳號顯示「繼續閱讀」。

## Task 拆分

**M2**

- [x] `e5-t01` `Article` 型別、`heading`／`quote`／`image` 區塊、`BlockView`、內容測試 · AC-5.1 · M
- [ ] `e5-t02` `deal` 區塊接 E11 的 `DealDiagram`／`DealInput`（`e11-t11`）；文章用的 caption 與版面 · AC-5.3 · S · ← e11-t11
- [ ] `e5-t03` `play` 區塊：出牌序列顯示（逐墩、可展開）· AC-5.3 · M · ← e5-t02
- [x] `e5-t04` Worker：`article:` 儲存、版本、API（與 `BookEntry` 同法）；R2 bucket 與簽名 URL 沿用 E11 `e11-t02` · AC-5.2、AC-5.6 · M · ← e11-t02
- [x] `e5-t05` 文章頁 `/library/:slug` 與叢書頁 `/library`（書架版面、系列、篩選）· AC-5.7 · M · ← e5-t01, e9-t09
- [x] `e5-t06` 系列資料模型與線上管理 · AC-5.7 · S · ← e5-t04
- [ ] `e5-t07` 文章編輯器：沿用 `components/editor/`，新區塊表單；四家牌輸入元件 · AC-5.2 · M · ← e5-t01, e5-t02
- [ ] `e5-t08` AI 匯入支援文章（擴充 `worker/importer.ts` schema、`importResult.ts`）· AC-5.2 · M · ← e5-t07
- [ ] `e5-t09` 電子書上傳（憑證直傳、授權必填、封面、大小限制）與書頁 · AC-5.4 · M · ← e5-t04
- [ ] `e5-t10` PDF 閱讀器（`pdf.js` lazy chunk、頁碼、全螢幕、手機）· AC-5.5 · M · ← e5-t09
- [ ] `e5-t11` 可見範圍：`members-only` 的列表過濾與檔案保護 · AC-5.6 · S · ← e5-t09
- [x] `e5-t12` `image` 區塊與封面接 E11 的圖片上傳（`e11-t02`）· AC-5.1 · S · ← e11-t02
- [x] `e5-t13` 搜尋索引加文章（E10 `e10-t04`）；叢書頁搜尋框 · AC-5.7 · S · ← e10-t04
- [ ] `e5-t14` 閱讀進度（段落／頁碼）與「繼續閱讀」· AC-5.8 · S · ← e5-t05, e5-t10
- [ ] `e5-t15` R2 用量提醒（接近 8 GB 通知幹部）· AC-5.4 · S · ← e5-t09

## 風險與對策

- **版權**：授權欄位必填、僅社內預設、幹部可下架；`README.md` 寫明不放未授權書籍。
- **PDF 太大**：50 MB 上限；建議幹部先壓縮；之後評估 EPUB。

## 未決問題

- [ ] **Q:** 是否允許「僅社內」的掃描講義？（法務風險由社團決定）
      **A:** _(unanswered)_
- [ ] **Q:** 文章要不要有留言？（若要，接牌桌 E13）
      **A:** _(unanswered)_
