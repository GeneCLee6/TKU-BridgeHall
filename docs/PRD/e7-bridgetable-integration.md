---
title: E7 — 與淡江牌桌整合
date: 2026-10-24
status: in progress
epic: E7
owner: GeneCLee6
milestones: [M2]
depends_on: [E1, E2]
---

## 背景

兩個網站已經共用帳號與後端（牌桌 Worker 的 `book.ts`）。牌桌那邊的機器人「制度即資料」（牌桌 E5：`SystemSpec` 規則檔），而且 PRD 已寫了 AC-5.9「橋譜同步」。橋譜這邊有制度集（E1）與結構化的叫品表。E7 讓兩邊真的接起來：橋譜是制度的來源，牌桌照它叫牌、Alert 連回橋譜。

## 目標

- 制度集 → 牌桌 `SystemSpec`：把 `responses` 區塊轉成規則（情境＋叫品＋意義），轉不出來的列列成報告給幹部補手牌條件。
- 差異報告：牌桌機器人現行規則 vs 橋譜內容，列出意義不一致的叫品。
- 牌桌 Alert 與叫牌盒提示帶 `bookRef`（slug + sectionId），點了開橋譜該段。
- 牌桌的牌局紀錄：叫牌過程每個叫品可點到橋譜（依該桌使用的制度集）。
- 兩站共用的顯示元件（`Suit`、`CallLabel`、`AuctionTable`、`DealDiagram`）抽成共用套件或複製時有對拍測試。

## 非目標

- 不在橋譜做機器人；不在橋譜打牌。
- 牌桌的推論引擎本身：牌桌 E5。

## 需求

### 功能

- `lib/systemSpec.ts`：`toSystemSpec(resolvedConventions, profile) → { rules: Rule[]; unresolved: Unresolved[] }`。`Rule` 的形狀以牌桌 `shared/robot/system` 為準；橋譜只填得出「叫牌過程 → 叫品 → 意義（文字）」，手牌條件（點力、張數）由解析意義文字的啟發式抽（例如「15-17」「5張♥」「迫叫」），抽不出的進 `unresolved`。
- Worker 端 `GET /api/book/system-spec?profileId=…`，牌桌機器人載入時可指定制度集 id（牌桌 `ClubConfig.systemProfileId`）。
- 差異報告頁 `/integrations/table`（幹部）：列出牌桌規則與橋譜不一致的叫品、`unresolved` 清單、最後同步時間。
- `bookRef`：牌桌 Alert 文字旁的小書圖示 → 橋譜 `/c/:slug/:sectionId?profile=<id>`；橋譜支援 `?profile=` 開指定制度集（有權限才生效）。
- 牌桌紀錄頁的叫牌過程：每個叫品 hover 顯示橋譜意義（來自同步的 `SystemSpec`），點了開橋譜。

### 非功能

- 同步是拉取（牌桌抓橋譜 API 或直接讀同一個 Durable Object），不推送；版本以制度集 `version` 為準。
- 轉換是純函式、有測試；每個內建特約的轉換結果列在測試快照，改內容時差異看得到。

## 設計方向

- 兩站同一個 Durable Object，`SystemSpec` 的生成放 Worker 端最省（牌桌直接呼叫），前端只做報告頁；轉換函式放 `shared/`（牌桌 repo）並由橋譜以型別對拍。
- 顯示元件共用：先不做 npm 套件，用「同一份檔案＋對拍測試」（兩邊各一份 `tests/shared-components.test.ts` 比對原始碼雜湊），M3 再抽套件。

## 驗收條件

- [x] AC-7.1 — `toSystemSpec` 純函式：內建 22 個特約可轉換，`unresolved` 清單正確；牌桌載入指定制度集後機器人叫牌有說明且來自橋譜文字。
- [x] AC-7.2 — 差異報告頁列出不一致與未解析的叫品；最後同步時間；可一鍵重新同步。
- [ ] AC-7.3 — 牌桌 Alert 與叫牌盒提示有 `bookRef`；橋譜支援 `?profile=` 開指定制度集。
- [ ] AC-7.4 — 牌桌紀錄頁叫牌過程 hover 顯示橋譜意義、點擊開橋譜段落。
- [ ] AC-7.5 — 共用顯示元件有對拍測試；兩邊畫出來的花色、叫品、四家牌一致。

## Task 拆分

**M2**

- [x] `e7-t01` 研究牌桌 `shared/robot/system` 的 `Rule` 形狀，寫轉換對照表（文件）與意義文字啟發式清單 · AC-7.1 · S — `docs/SYSTEM-SPEC.md`
- [x] `e7-t02` `toSystemSpec` 純函式（放牌桌 `shared/`，橋譜對拍）與測試快照 · AC-7.1 · M · ← e7-t01, e1-t08 — 牌桌 `shared/systemSpec.ts`（牌桌 #123），橋譜 `src/lib/systemSpec.ts` 逐字複本＋快照
- [x] `e7-t03` Worker `GET /api/book/system-spec`；牌桌 `ClubConfig.systemProfileId` 與載入（牌桌 task）· AC-7.1 · M · ← e7-t02 — 牌桌 #168：spec 在橋館轉好、`PUT` 同步存在牌桌（Worker 沒有內建特約、CPU 不夠）；TKB 叫品附橋館原文，叫牌仍照牌桌已驗證的規則
- [x] `e7-t04` 差異報告頁 `/integrations/table` · AC-7.2 · M · ← e7-t03 — PR #9：同步與最後同步時間、讀法不同／牌桌沒有規則／轉不出來的叫品
- [ ] `e7-t05` `bookRef`：牌桌 Alert／叫牌盒提示的書圖示；橋譜 `?profile=` 支援 · AC-7.3 · S · ← e7-t03
- [ ] `e7-t06` 牌桌紀錄頁的叫品意義 hover 與連結（牌桌 task）· AC-7.4 · S · ← e7-t03
- [ ] `e7-t07` 共用元件對拍測試（`Suit`、`CallLabel`、`AuctionTable`、`DealDiagram`）· AC-7.5 · S · ← e5-t02
- [ ] `e7-t08` 幹部補手牌條件的 UI：在 `unresolved` 清單直接填「點力／張數／迫叫」存回段落的 `rows[].conditions`（新增選填欄位）· AC-7.1 · M · ← e7-t04

## 風險與對策

- **意義文字轉手牌條件抽不準**：只抽明確模式（數字區間、「n 張」、「迫叫」「成局」），其餘進 `unresolved` 讓人填；機器人規則以牌桌已驗證的規則為後備。
- **兩個 repo 同步改**：每個 E7 的 PR 標題寫明牌桌對應 PR 號；`NEXT.md` 記兩邊版本。

## 未決問題

- [ ] **Q:** 牌桌機器人預設讀哪個制度集？`club`，還是坐下的真人搭檔的制度集？
      **A:** _(unanswered)_
