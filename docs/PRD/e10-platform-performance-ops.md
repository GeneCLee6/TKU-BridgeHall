---
title: E10 — 平台、效能與維運
date: 2026-10-24
status: planned
epic: E10
owner: GeneCLee6
milestones: [M1, M2, M3]
depends_on: []
---

## 背景

M0 把 22 個特約全部打包進一個 bundle、整本放在一頁（3.2 萬個 DOM 節點，展開全部 1.6 秒）。制度集、叢書、文章、題庫進來後這條路走不下去。另外：搜尋是前端 Fuse 全文；離線只快取看過的頁；沒有錯誤回報與使用分析；備份靠人；多社團完全沒有預留。

## 目標

- **內容分片**：每個特約一個 chunk（或 JSON），路由層級載入；目錄與搜尋用預建的輕量索引。
- **搜尋索引**：建置時產生索引檔（特約、段落、文章、名詞），前端只載索引；之後可換成 Worker 端搜尋。
- **離線**：我的制度集、已讀特約、制度卡離線可看；更新提示。
- **錯誤與分析**：前端錯誤回報（Sentry 免費方案或自建 `POST /api/book/errors`）；匿名使用分析（頁面、搜尋詞、制度集切換）。
- **備份**：Durable Object 內容每日匯出到 R2（牌桌 E11 共用）。
- **多社團預留**：資料 key 與 API 加 `clubId`（預設 `tku`），不做 UI。

## 非目標

- 不換框架、不換樣式庫。
- 不做 SSR（內容需登入看制度集，SEO 不是目標）。

## 需求

### 功能

- 分片：`src/content/index.ts` 改為 `manifest`（slug、名稱、分類、標籤、程度、摘要、段落標題樹）＋ `loaders`（`() => import('./conventions/x.ts')`）；線上內容同樣分片（`GET /api/book/content/:slug`，`ETag`）。
- 索引：`scripts/build-search-index.ts` 產 `public/search-index.json`（Fuse 可直接載入的格式）；線上內容的增量在前端合併。
- 離線：service worker 快取策略改為「索引＋manifest 預載、特約按需快取、制度集與制度卡快取」；新版本提示「重新整理」。
- 錯誤回報：`window.onerror`／React error boundary → API；管理頁可看最近 100 筆。
- 分析：事件 `page`、`search`、`profile-switch`、`quiz-answer`，不含個資；管理頁簡單圖表（每週活躍、熱門特約）。
- 備份：牌桌 Worker 排程每日匯出 `book*`、`profile*`、`article*` 到 R2，保留 30 天。
- `clubId`：所有 Worker key 前綴改 `club:tku:`；API 由帳號決定 `clubId`。

### 非功能

- 首頁 JS gzip ≤ 150 kB；特約頁額外 ≤ 30 kB；搜尋索引 ≤ 300 kB（gzip）。2026-10-29（L0）起 `dist/` 不得含特約內容，搜尋索引改由牌桌給（不在靜態檔裡）。
- 分片後 `tests/content` 仍能一次驗證全部特約（測試直接 import 全部）。

## 設計方向

- 先分片再換皮（E9 依賴 `e10-t01`），避免換皮時還在搬整頁。
- 分析與錯誤回報存牌桌 Durable Object 的 SQLite（已有 `Sql` 介面），不引入第三方。

## 驗收條件

- [x] AC-10.1 — 分片：manifest ＋按需載入；首頁不下載任何特約內容；線上內容按 slug 取；效能預算達標。
- [x] AC-10.2 — 搜尋索引建置時產生、前端載入；結果與 M0 相同（既有搜尋測試通過）；文章與名詞可加入索引。
- [ ] AC-10.3 — 離線：manifest、索引、看過的特約、我的制度集與制度卡離線可開；新版本提示。（A2 完成 manifest、索引、看過的特約與新版本提示；制度集與制度卡等 A6、D3 有 API 後補上）
- [ ] AC-10.4 — 錯誤回報與匿名分析進管理頁；不含個資；可關閉。
- [ ] AC-10.5 — 每日備份到 R2、保留 30 天、可還原（文件化步驟並演練一次）。（e10-t08 已完成程式與文件；建立 R2 bucket、部署後的還原演練還沒做）
- [ ] AC-10.6 — `clubId` 進 key 與 API；單社團行為不變；測試覆蓋。
- [x] AC-10.7 — 內建特約只給社員（使用者 2026-10-29 決定）：網站的靜態檔（`dist/`）不含任何特約內容（CI 擋）；manifest、內容與搜尋索引都由牌桌 Worker 給登入的社員；寫入牌桌的內容與 `src/content` 逐字相同（`seed-builtin --verify`）；離線快取在登出時清掉；首頁 JS 至少留 10 kB 餘裕。

## Task 拆分

**M1 · 分片與索引**

- [x] `e10-t01` 內容 manifest 與 lazy loaders；`ContentContext` 改為按 slug 載入；`tests/content` 仍驗全部 · AC-10.1 · #8
- [x] `e10-t02` 線上內容分片 API `GET /api/book/content/:slug`（`ETag`）與清單 API `GET /api/book/manifest`；前端合併 · AC-10.1 · #8（牌桌 #60）
- [x] `e10-t03` 效能預算檢查進 CI（bundle size、Lighthouse 特約頁）· AC-10.1 · #8
- [x] `e10-t04` 搜尋索引建置腳本與前端載入；線上內容增量合併；既有搜尋測試遷移 · AC-10.2 · M · ← e10-t01 · #11
- [x] `e10-t05` service worker 策略 v2（manifest／索引預載、按需快取、制度集與制度卡、更新提示）· AC-10.3 · M · ← e10-t04 · #11

**M1 · 內容保護（L0，使用者 2026-10-29 決定）**

- [x] `e10-t12` 內建特約搬到牌桌 Worker：`book:builtin:*` 存放、manifest 帶 `builtin`、`GET /api/book/builtin/:slug` 與搜尋索引 API、`PUT /api/book/builtin`（預設預演、不動線上版本、種子權杖）；橋館改讀 API，`npm run seed-builtin`（預演／`--apply`／`--verify` 逐字比對）；`npm run budget` 擋 `dist/` 裡的特約內容；拿掉內建 manifest、特約 chunk 與 `/search-index.json` · AC-10.7 · L · #44（牌桌 #194）
- [x] `e10-t13` 離線與登出：service worker 對 `/api/book/builtin/*`、`/api/book/search-index` 網路優先、離線用快取；登出（或 `/api/me` 回 401）清掉快取的 API 回應與 localStorage 的 manifest · AC-10.3、AC-10.7 · S · ← e10-t12 · #44
- [x] `e10-t14` 首頁 JS 瘦身：目錄（含 Radix accordion）lazy 載入、跟頁面一起開始下載；`strings.ts` 拆出編輯器、匯入、分類、隊伍、牌例盒的文字（各自的 `*Strings.ts`）· AC-10.1、AC-10.7 · S · #44

**M2 · 維運**

- [ ] `e10-t06` 錯誤回報 API 與 error boundary；管理頁清單 · AC-10.4 · S
- [ ] `e10-t07` 匿名分析事件與管理頁圖表；關閉開關 · AC-10.4 · M
- [x] `e10-t08` 每日備份到 R2（牌桌 Worker 排程）、保留策略、還原文件與演練 · AC-10.5 · #22，牌桌 #89（牌桌 PR 等 R2 bucket 建好才合併；程式、測試與文件完成；還原演練要真實環境，待部署後由人執行，清單在牌桌 `DEPLOY.md` §4.3，做完才勾 AC-10.5；2026-10-30 起備份也含討論區的五張 SQL 表 `forum_*`，格式第 3 版，還原一起還原）
- [x] `e10-t09` `lib/api.ts` 與 `shared/protocol.ts` 型別對拍測試自動化（CI 從牌桌 repo 抓 `protocol.ts` 比對）· AC-10.1 · #22（workflow「Table type parity」、`npm run parity`；需要 secret `TABLE_REPO_TOKEN`）

**M3 · 多社團預留**

- [ ] `e10-t10` Worker key 加 `club:<clubId>:` 前綴與遷移；API 由帳號決定 `clubId` · AC-10.6 · M
- [ ] `e10-t11` 前端 `clubId` 透傳與單社團回歸測試 · AC-10.6 · S · ← e10-t10

## 風險與對策

- **分片後「全部展開」與「印整本」變慢**：`/book` 印整本時才載全部，顯示進度；平常不提供整本展開。
- **索引與線上內容不同步**：索引只含內建內容，線上差異在前端增量合併；M2 若線上內容多再搬到 Worker 端搜尋。
- **內建內容與索引不同步**（L0）：兩者由同一次 `seed-builtin` 一起寫入，`--verify` 兩樣都比對。
- **還原舊備份清掉內建特約**（L0）：備份範圍含 `book`，還原 2026-10-29 前的備份後要重跑 `npm run seed-builtin -- --apply`（牌桌 DEPLOY.md §4.9）。

## 未決問題

- [ ] **Q:** 分析要不要做？社團規模小，可能只要錯誤回報。
      **A:** _(unanswered)_
