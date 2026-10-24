---
title: E6 — 練習與測驗
date: 2026-10-24
status: planned
epic: E6
owner: GeneCLee6
milestones: [M2]
depends_on: [E1]
---

## 背景

橋譜的 `responses` 區塊本來就是「叫牌過程 → 叫品 → 意義」，天生是題目。舊 PRD 的 v0.4「測驗模式」要做的就是這件事，而且題目的格式若與牌桌的叫牌題庫（牌桌 E5 AC-5.8 的棘輪）一致，橋譜出的題可以直接餵給機器人評測。

## 目標

- 從制度集的 `responses` 自動生成兩種題：**意義題**（這個叫牌過程下 2♦ 是什麼意思？四選一）與**叫品題**（給一手牌與叫牌過程，該叫什麼？）。
- 依制度集、特約、程度抽題；答完顯示原文段落（深層連結）。
- 錯題本、成績、連續答對；登入後記錄。
- 題目格式與牌桌 `shared/robot` 的題庫一致，可匯出。
- 幹部可修題、停用壞題、手動出題（含牌例）。

## 非目標

- 不做打牌練習（牌桌 E10）。
- 不做排行榜（牌桌 E9 的積分之後再接）。

## 需求

### 功能

- 題目模型（與牌桌對齊）：

  ```ts
  interface Quiz {
    id: string; kind: 'meaning' | 'call'; profileId: string; slug: string; sectionId: string
    auction: Auction; call?: Call; hand?: Hand
    answer: string; choices?: string[]     // meaning：choices 是 4 個意義；call：answer 是叫品
    level: Level; source: 'auto' | 'manual'; disabled?: boolean; note?: string
  }
  ```

- 自動出題：`generateQuizzes(resolvedConventions) → Quiz[]`；意義題的干擾選項取同一表的其他列（不足時取同特約其他表）；叫品題只在 `hand` 區塊或 `note` 有牌例時生成（M2 先做意義題為主）。
- 練習頁 `/practice`：選制度集（預設目前的）、特約（多選）、程度、題數；答題介面（手機優先）；答完顯示段落與「去讀原文」。
- 錯題本 `/practice/mistakes`：答錯的題、再練一次；成績頁：答題數、正確率、依特約的弱點。
- 匯出：`GET /api/book/quizzes?profileId=club&format=table` 回牌桌題庫格式（JSON）；牌桌 CI 可抓。
- 修題：幹部在題目上按「這題有問題」→ 停用或改答案（存成 `manual` 覆寫 `auto`）。

### 非功能

- 自動出題在瀏覽器做（純函式），不打 API；每次練習即時生成並快取。
- 成績只存摘要（每題一列：題 id、對錯、時間），每人上限 5,000 列。

## 設計方向

- 題目生成是純函式、有測試；題目 id 由 `slug/sectionId/blockIndex/rowIndex` 決定，同一題跨裝置一致。
- 答題介面用卡片翻面的感覺（`DESIGN-V2.md`），叫牌過程用既有 `AuctionTable`。
- 牌桌端的題庫格式以牌桌 `e5-t23` 定稿為準，這裡做轉換層 `lib/quizExport.ts`。

## 驗收條件

- [ ] AC-6.1 — `Quiz` 型別與牌桌題庫格式有轉換層與對拍測試。
- [ ] AC-6.2 — 自動出題：每個內建特約的 `responses` 都能生成意義題；干擾項不重複、不等於答案；壞資料（空意義）跳過並回報。
- [ ] AC-6.3 — 練習頁：依制度集／特約／程度／題數抽題；答題、即時回饋、顯示原文段落；手機可用。
- [ ] AC-6.4 — 錯題本與成績（登入）：答錯重練、正確率、依特約弱點。
- [ ] AC-6.5 — 匯出 API 給牌桌；牌桌匯入後棘輪可跑（與牌桌 `e5` 一起驗）。
- [ ] AC-6.6 — 幹部可停用、修答案、手動出題（含牌例）。

## Task 拆分

**M2**

- [ ] `e6-t01` `Quiz` 型別、`lib/quiz.ts` `generateQuizzes`（意義題）、測試（全部內建特約）· AC-6.1、AC-6.2 · M · ← e1-t08
- [ ] `e6-t02` 練習頁 `/practice`：設定（制度集、特約、程度、題數）與答題流程 · AC-6.3 · M · ← e6-t01
- [ ] `e6-t03` 答題結果：原文段落預覽、深層連結、下一題；手機版 · AC-6.3 · S · ← e6-t02
- [ ] `e6-t04` Worker：成績紀錄 `quizlog:<userId>:<time>`、上限、API · AC-6.4 · S
- [ ] `e6-t05` 錯題本與成績頁（正確率、依特約弱點）· AC-6.4 · M · ← e6-t04
- [ ] `e6-t06` 題目覆寫：停用、改答案、手動出題（含 `hand`）；存 `quizfix:<id>` · AC-6.6 · M · ← e6-t01
- [ ] `e6-t07` 叫品題生成（有牌例的段落）· AC-6.2 · M · ← e6-t01
- [ ] `e6-t08` 匯出 API（牌桌題庫格式）與轉換層測試；牌桌端對接（牌桌 `e5` task）· AC-6.5 · S · ← e6-t01
- [ ] `e6-t09` 首頁與特約頁的「練這個特約」入口 · AC-6.3 · S · ← e6-t02, e9-t08

## 風險與對策

- **自動題品質差**（意義太長、選項明顯）：干擾項取同表、長度相近；幹部停用壞題；統計每題答對率，太高或太低的標出來。
- **題庫格式牌桌還沒定**：先做橋譜自己的格式，轉換層獨立；牌桌定稿後只改轉換層。

## 未決問題

- [ ] **Q:** 要不要做「每日 5 題」推播（接牌桌通知）？
      **A:** _(unanswered)_
