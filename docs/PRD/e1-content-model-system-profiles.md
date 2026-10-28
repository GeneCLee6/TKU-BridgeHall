---
title: E1 — 內容模型與制度集
date: 2026-10-24
status: planned
epic: E1
owner: GeneCLee6
milestones: [M1]
depends_on: []
---

## 背景

M0 的 `Convention` 只有一種身分：「社團的一份特約」，分類是寫死的 `CategoryId` 列舉（`notrump`、`suit-openings`、`signals`、`competitive`、`system`）。沒有「這是制度章節還是特約」「給誰看」「我們這對打不打」的概念。所有後面的功能（隊伍與搭檔 E2、制度卡 E3、分級 E4、練習 E6、機器人同步 E7）都要先有「制度集」這個資料結構。

## 目標

- `Convention` 多四個欄位：`kind`、`level`、`prerequisites`、`cardSlots`（制度卡位置，E3 用），都是選填，舊內容不用改就能通過測試。
- 分類從型別列舉改成資料（可線上新增），側邊欄與首頁依資料排。
- 新增 **制度集**（`SystemProfile`）：一個制度集繼承一個母制度集（社團預設沒有母），列出採用／不採用的特約、覆寫（段落或叫品列）、備忘。
- 制度集存在牌桌的 Worker（與 `BookEntry` 同一個 Durable Object），有版本與衝突處理，API 與既有 `/api/book/*` 風格一致。
- 讀者可以切換「現在用哪個制度集看」，覆寫處有標記，可與母制度集比較。

## 非目標

- 隊伍、搭檔的成員與權限：E2。
- 制度卡的欄位與輸出：E3（這裡只留 `cardSlots` 欄位）。
- 程度標籤的 UI 與入門版切換：E4（這裡只加 `level` 欄位）。

## 需求

### 功能

- **種類** `kind: 'system' | 'convention' | 'signal' | 'defense'`：制度章節（開叫體系）、特約、防守信號、對抗敵方特約的防禦。預設 `convention`。
- **程度** `level: 'basic' | 'intermediate' | 'advanced'`，特約層級與段落層級都可標；段落沒標就繼承特約。
- **前置** `prerequisites: string[]`（其他特約的 slug），給 E4 的學習路徑與「先讀這個」提示。
- **分類即資料**：`Category` 存在內容裡（內建一份、線上可增改），`Convention.category` 是字串。
- **制度集**：

  ```ts
  interface SystemProfile {
    id: string                 // 'club' 是社團預設，其餘隨機 id
    name: string               // 「社團預設」「A 隊」「小明＋小華」
    scope: 'club' | 'team' | 'partnership'
    parentId?: string          // 固定三層：club ← team ← partnership（partnership 也可直接繼承 club）
    adopted: Record<string, 'on' | 'off'>   // slug → 採用／不採用；沒列的跟母制度集
    overrides: Override[]      // 覆寫
    notes: Note[]              // 私人備忘，只給成員看
    version: number; updatedAt: number; updatedBy: string
  }
  type Override =
    | { kind: 'row'; slug: string; sectionId: string; blockIndex: number; rowIndex: number; meaning: string; note?: string }
    | { kind: 'section'; slug: string; sectionId: string; section: Section }   // 整段換掉
    | { kind: 'meta'; slug: string; summary?: string; tags?: string[] }
  interface Note { slug: string; sectionId?: string; text: string; by: string; at: number }
  ```

- **解析**（純函式 `resolveProfile(profiles, id, content) → Convention[]`）：從 `club` 往下套用每一層的 `adopted` 與 `overrides`，結果是一組「這個制度集看到的特約」，每個段落與叫品列帶 `origin: 'club' | 'team' | 'partnership'`，讓介面標記來源。
- **切換**：頁首的制度集選單；選擇記在帳號（登入）或 localStorage（未登入只能看 `club`）。
- **比較**：「與母制度集比較」列出所有覆寫與不採用的特約，點一條跳到該段。

### 非功能

- 解析必須是純函式、可測：`tests/lib/profiles.test.ts` 覆蓋三層繼承、覆寫衝突（子層勝）、不採用後子層再採用、覆寫指到不存在的列（略過並回報）。
- 制度集 JSON 上限 200 kB；覆寫數上限 500 條（超過就該另開特約）。
- 讀者未登入時不抓制度集 API（只有 `club`，走原本的 `/api/book/content`）。

## 設計方向

- Worker 端：`profile:<id>` 一筆一個制度集；`profilerev:<id>:<version>` 版本；清單 `GET /api/book/profiles`（依權限過濾），`GET /api/book/profiles/:id`，`PUT`（帶 `baseVersion`，衝突 409，與 `BookEntry` 同一套）。`club` 制度集由 `bookEdit` 改，其餘由 E2 的成員權限決定（E1 先只開 `bookEdit`）。
  - 實作（A6）：鍵加 `book:` 前綴（`book:profile:<id>`、`book:profilerev:<id>:<8 位數版本>`），內容分段存；新增是 `POST /api/book/profiles`（id 由伺服器產生），刪除 `DELETE /api/book/profiles/:id`（帶 `baseVersion`；`club` 403、還有子制度集 409）。清單只回摘要（`ProfileSummary`，含數量），內容要逐一 `GET`。層次固定：隊伍繼承 `club`，搭檔繼承 `club` 或隊伍，所以不會繞圈。E1 期間登入的社員都能讀全部制度集，寫入一律 `bookEdit`。上限另加制度集 100 個、名稱 40 字、每則備忘 2,000 字（`PROFILE_LIMITS`）。
- **權限**（使用者決定，2026-10-25）：管理員管所有事情，包括使用者帳號；編輯者（`bookEdit`）管帳號以外的所有東西，包括制度集、分類、隱藏特約與 `/admin` 裡所有非帳號的面板。詳見 `00-prd.md` §4。
- 型別放牌桌 `shared/protocol.ts`，橋譜 `lib/api.ts` 對拍（既有規則 9）。
- 前端：`ProfileContext` 在 `ContentContext` 之後，提供 `activeProfile`、`resolved`（解析後的特約）；所有讀內容的元件改讀 `resolved`。
- 覆寫標記：段落標題旁一個小標「搭檔覆寫」「隊伍覆寫」，叫品列的意義欄左側一條色線；標記有文字，不只靠顏色（`DESIGN-V2.md` §5）。

## 驗收條件

- [x] AC-1.1 — `kind`、`level`、`prerequisites` 可在 `.ts` 與線上編輯器設定；舊內容不改也通過 `tests/content`；卡片與目錄顯示種類與程度。
- [x] AC-1.2 — 分類是資料：內建分類檔＋線上可新增、改名、排序；側邊欄、首頁、編輯器的分類選單都讀同一份；刪分類時有特約在裡面會被擋。
- [x] AC-1.3 — `SystemProfile` 型別在 `shared/protocol.ts`，橋譜與牌桌的型別對拍測試通過；`club` 制度集永遠存在且不可刪。（解析時缺 `club` 會補一個空的；Worker 沒存過時回空的、版本 0，刪除回 403 `profileProtected`。）
- [x] AC-1.4 — `resolveProfile` 純函式：三層繼承、子層覆寫勝、不採用隱藏整個特約、覆寫指到不存在的列會回報；每個內建特約在空制度集下解析結果與原本完全相同。
- [x] AC-1.5 — API：列表、讀取、儲存（`baseVersion` 衝突 409）、版本列表與載入舊版；JSON 大小與覆寫數上限；未登入只拿得到 `club`。（Worker 與 `lib/api.ts` 的 client；編輯畫面是 `e1-t14`。）
- [x] AC-1.6 — 頁首可切換制度集；切換後目錄、內容、搜尋結果都跟著變；覆寫處有文字標記；選擇記在帳號或 localStorage。
- [x] AC-1.7 — 「與母制度集比較」列出不採用的特約與每條覆寫（原文 vs 覆寫後），點一條跳到該段。（`/profiles/:id/compare`；原文＝母制度集解析後的樣子，只列這一層自己的改動；失效的覆寫、備忘與採用也列出。）

## Task 拆分

格式見 [`README.md`](README.md#task-格式)。

**M1 · 內容欄位與分類**

- [x] `e1-t01` `Convention` 加 `kind`、`level`、`prerequisites`、`cardSlots?`（選填）；`tests/content` 加驗證（前置 slug 存在、程度值合法）· AC-1.1 · #15（牌桌 #78）
- [x] `e1-t02` 內建特約補 `kind` 與 `level`（22 張：`system-*` 為 `system`；Lebensohl、Bergen、J2N 等依內容標）；標法寫進 `CONTENT_GUIDE.md` · AC-1.1 · #15
- [x] `e1-t03` 卡片標題列、側邊欄、搜尋結果顯示種類與程度標籤（文字＋小圖示）· AC-1.1 · #15
- [x] `e1-t04` 編輯器 `MetaForm` 加種類、程度、前置特約（多選）欄位 · AC-1.1 · #15
- [x] `e1-t05` 分類改為資料：`Category` 加 `order`；Worker 存 `category:<id>`；`GET/PUT /api/book/categories`；內建分類為預設值 · AC-1.2 · #20（牌桌 #81）
- [x] `e1-t06` 分類管理 UI（編輯者）：新增、改名、排序、刪除（有特約時擋）；編輯器分類選單讀同一份 · AC-1.2 · #20

**M1 · 制度集**

- [x] `e1-t07` `SystemProfile`、`Override`、`Note` 型別進 `shared/protocol.ts`；橋譜 `lib/api.ts` 對應；型別對拍測試 · AC-1.3 · #18（牌桌 #80）
- [x] `e1-t08` `lib/profiles.ts`：`resolveProfile` 與 `origin` 標記；`tests/lib/profiles.test.ts`（繼承、覆寫、不採用、壞參照、空制度集等同原內容）· AC-1.4 · #18
- [x] `e1-t09` Worker：`profile:` 儲存、版本、`baseVersion` 衝突、大小與數量上限、`club` 保護；`GET/PUT /api/book/profiles[/:id]`、`/revisions` · AC-1.5 · #23（牌桌 #90）
- [x] `e1-t10` 權限：`club` 由 `bookEdit` 改；其他制度集暫時也 `bookEdit`（E2 接手改成成員權限）；未登入只回 `club` · AC-1.5 · #23；同時落實角色規則（下方「權限」）
- [x] `e1-t11` 前端 `ProfileContext`：載入清單、目前選擇（帳號偏好或 localStorage）、`resolved`；`HandbookPage`、`Sidebar`、搜尋改讀 `resolved` · AC-1.6 · M · ← e1-t08, e1-t09 · #30（實作：`ProfiledContent` 以同一個 `ContentContext` 提供制度集看到的內容，元件不用改讀別的；localStorage 只暫存存不進帳號的選擇）
- [x] `e1-t12` 頁首制度集選單（桌機下拉、手機進目錄抽屜）；切換動畫與可及性 · AC-1.6 · S · ← e1-t11 · #30（動畫只做切換時內容區變淡；頁首 v2 在 B2 重做）
- [x] `e1-t13` 覆寫標記元件：段落標題旁的來源標、叫品列的來源線、備忘區塊（只有成員看到）· AC-1.6 · S · ← e1-t11 · #30（E1 期間登入的社員都能讀全部制度集，所以「成員」暫時＝登入的社員，E2 接手）
- [x] `e1-t14` 制度集編輯 UI（第一版）：採用／不採用開關（特約列表）、對某一叫品列「改成…」、對某段「換成…」（開段落編輯器）、備忘；儲存帶 `baseVersion` · AC-1.5、AC-1.6 · M · ← e1-t11 · #15（`/profiles/:id/edit`；管理頁「制度集」面板有入口；摘要／標籤覆寫、改母制度集與可見範圍、新增刪除制度集還沒有畫面）
- [x] `e1-t15` 「與母制度集比較」頁：覆寫與不採用清單、原文 vs 覆寫後、跳轉 · AC-1.7 · S · ← e1-t11 · #15
- [x] `e1-t16` 帳號偏好 `profilePreference` 存在牌桌（`PATCH /api/account/preferences`），跨裝置一致 · AC-1.6 · S · ← e1-t11 · #30（牌桌 #121；沿用既有的 `POST /api/account/preferences`，欄位名 `bookProfile`，因為牌桌的 `profile` 是個人檔案）

## 風險與對策

- **覆寫指到的列被社團版改掉或刪掉**：覆寫用 `sectionId + blockIndex + rowIndex` 定位；解析時找不到就回報到比較頁「失效的覆寫」，不靜默消失。E8 的變更通知再提醒成員。
- **三層固定不夠用**（例如「大專盃隊」與「平常練習隊」）：先固定三層；不夠時 `parentId` 允許 team ← team，解析函式本來就是遞迴。

## 未決問題

- [ ] **Q:** 「不採用」一個特約時，制度卡上那一格顯示什麼？空白，還是母制度集的內容加刪除線？（E3）
      **A:** _(unanswered)_
- [ ] **Q:** 備忘要不要支援 `@` 提到搭檔並通知？（E8 通知）
      **A:** _(unanswered)_
