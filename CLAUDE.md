# CLAUDE.md — TKU BridgeHall · 淡江橋館

給 Claude Code 的專案說明。開始工作前先讀 `RULES.md` 與 `ARCHITECTURE.md`。

## 這是什麼

淡江橋藝社的制度與特約手冊網站（2026-10-24 由「淡江橋譜 · TKU BridgeBook」改名；「橋譜」現在是館內制度區塊的名字，`/book` 路由不改；GitHub repo 2026-10-26 重建為 `GeneCLee6/TKU-BridgeHall`，本機資料夾 2026-10-28 改為 `C:\dev\TKU-BridgeHall`；npm 套件名 `tku-bridgehall`；localStorage key 仍是 `tku-bridgebook:*`，刻意不改以免清掉讀者設定）。React 19 + TypeScript（strict）+ styled-components + Vite，靜態網站（Vercel）。介面參考 Swagger UI：每個特約是可收合的卡片，內含多層可收合段落。帳號、特約內容（內建與線上編輯的，2026-10-29 起只給登入的社員）與 AI 匯入的後端是姊妹站淡江牌桌的 Worker（`C:\dev\TKU-BridgeTable`），`vercel.json` 把 `/api/*` 轉過去（ARCHITECTURE.md §4.1–4.4）。

## 先讀

| 情境 | 讀 |
| --- | --- |
| 新增或修改特約內容 | `CONTENT_GUIDE.md` |
| 改介面、顏色、元件 | `DESIGN.md` |
| 改資料模型、路由、搜尋、線上內容、帳號、編輯器、匯入 | `ARCHITECTURE.md` |
| 產品範圍與 Roadmap | `docs/PRD/00-prd.md`（總 PRD）、`docs/PRD/e*.md`（epic 與 task）、`docs/ROADMAP.md`（批次順序）、`docs/NEXT.md`（現在的位置與開工規則） |
| 介面 v2 的決策過程、還沒做的頁面（文章、制度卡、討論區）| `docs/DESIGN-V2.md` 與視覺稿 `docs/design/mockup-v2.html`（E9 已上線，現行樣式以 `DESIGN.md` 為準） |
| 改了外觀（截圖會變）| `playwright.config.ts` 開頭：更新 `tests/browser/__screenshots__` 基準圖的做法 |

## 硬性規則

1. **內容正確性第一。** 特約內容逐字轉錄自社團的 Word 檔。不得依一般橋牌知識補充、刪減或修正叫品意義、點力範圍或例子。有疑義時保留原文、加 `pending`（網站顯示「待確認」），並更新 private 內容 repo 的 `PENDING.md`。
2. **原始 Word 檔與轉檔輸出不得 commit。**（`.gitignore` 已排除 `*.doc`、`*.docx`、`*.htm`、`tmp/`。）原檔只存在本機 `C:淡江橋藝社制度原檔`；repo 是公開的（2026-10-29 曾改 private，2026-10-30 使用者改回公開），舊歷史裡的 .doc 已清掉，仍不要再放回來。**特約原文也不得 commit 到這個公開 repo**（2026-10-30）：22 個內建特約在 private repo `GeneCLee6/TKU-BridgeHall-content`，clone 到 gitignore 的 `src/content-private/`（CONTENT_GUIDE.md §0）；測試、文件、截圖都用 `tests/fixtures/` 的虛構特約，不要引用真的原文（private repo 的 `tests/leaks.test.ts` 會擋）。
3. **特約內容不進網站的靜態檔**（L0，2026-10-29）：內建特約存在淡江牌桌的 Worker，只給登入的社員；`npm run budget` 擋 `dist/` 裡的特約文字。新增特約：幹部用線上編輯器或 AI 匯入（成為線上版本）；要加成內建特約，在 private 內容 repo（`src/content-private/`）新增 `conventions/<slug>.ts`（檔名＝slug）、在它的 `index.ts` 登記、在那個 repo 開 PR，再在這裡 `npm run seed-builtin`（預演）→ `-- --apply`（寫入並逐字比對）。不改元件。網站程式不要 import `src/content-private/*`（只給測試與腳本用，腳本經 `scripts/content-source.ts` 讀，見 ARCHITECTURE.md §4）；牌桌 repo 是公開的，內容也不放那裡。
4. **顏色只來自 `styles/tokens.ts`**，介面文字只來自 `strings.ts`。
5. **牌桌是真相、線上版本優先**：改了 private repo 的 `.ts` 檔要 `npm run seed-builtin -- --apply` 才會上線；網站上改過的特約，連 seed 之後也不會顯示（線上版本蓋過內建，ARCHITECTURE.md §4.1）。改內容前先確認那個特約沒有線上版本，或在編輯器還原為內建版本。線上的內容每天由 workflow「Content backup」匯出到 private 內容 repo 的 `content-backup` 分支（`npm run export-content`，CONTENT_GUIDE.md §6.5）；匯出的檔案不要 commit 到這個公開 repo。
6. **只用於樣式的 prop 加 `$` 前綴。**
7. **不要直接推送到 `main`，也不要 force-push。** 功能走分支＋PR。合併一律用 `gh pr merge <號> --squash --delete-branch`，遠端與本地分支一起刪；分支在 worktree 裡的話先 `git worktree remove` 再刪分支。GitHub 已開「合併後自動刪除分支」，但關掉不合併的 PR 不會自動刪，要手動 `git push origin --delete <分支>`。
8. **合併到 `main` 就會自動上線**（Vercel 部署橋譜；牌桌 `main` 也會自動部署 Worker）。所以 PR 要 CI 全綠、看過預覽站才合併；牽涉牌桌 API 的變更，牌桌 PR 先合併並部署完成，再合併橋譜（ARCHITECTURE.md §7）。不要另外手動部署，除非使用者要求。
9. 程式碼、註解、commit、**PR 標題**用英文（標題不能有中文，PR 本文可以用繁中）；文件與介面用繁體中文（台灣用語）。
10. **與淡江牌桌的介面要一起改**：`src/lib/api.ts` 的型別對應牌桌的 `shared/protocol.ts`、`worker/book.ts`、`worker/articles.ts`（文章）；`src/lib/importResult.ts` 對應牌桌 `worker/importer.ts` 的扁平 schema。

## 已知陷阱

- **Radix Accordion 的 `forceMount` 不會隱藏關閉的內容。** 關閉時的隱藏靠 `GlobalStyle` 的 `[data-accordion-content][data-state='closed']`；列印樣式再全部顯示。新增收合元件時記得加 `data-accordion-content`。
- **測試用 `getByRole('button', { name })` 找觸發器時，用 `^` 錨定開頭**，否則會同時配到「複製連結：…」按鈕。
- **花色在無障礙名稱中是中文**（`Suit` 的 `aria-label`），例如「開叫1♠時」的名稱是「開叫1黑桃時」。
- **效能預算在 CI 擋**（`npm run budget`，`scripts/check-budget.mjs`）：首頁 JS gzip ≤ 150 kB（2026-10-29 約 123 kB；字串放各頁自己的 `*Strings.ts`，不要再塞進 `strings.ts`）、`dist/` 不得含任何特約文字。新功能的大頁面或函式庫用 `React.lazy`／動態 `import()`。
- **「待確認」數量寫在測試裡**：真特約的在 private repo 的 `tests/content/conventions.test.ts`，虛構特約的在這裡的同名檔；新增或解決時要同步更新。
- **兩組測試**：`tests/` 用虛構特約（Vitest 專案 `public`）；有 `src/content-private/` 時 `npm test` 多跑專案 `content`（private repo 的 `tests/`，讀真特約，`tests/fixtures/builtin.ts` 依 `BOOK_CONTENT=private` 切換）。CI 用 secret `CONTENT_REPO_KEY` checkout，沒有就跳過並在 log 說明；這個 repo 的 log 是公開的，CI 的真內容步驟只印檔名、測試名稱與數量。
- **`cfb` 是 CommonJS**：Node 只給 default export，打包工具給具名 export，用 `docText.ts` 開頭的寫法取得。
- **捲動框裡的 `.visually-hidden` 要有定位的祖先。** 它是 `position: absolute`；沒有定位祖先時會跑出 `overflow: auto` 的框，把整頁撐長（編輯器的預覽曾因此在下方多出幾千 px 空白）。捲動框加 `position: relative`。
- **手冊頁讀的是制度集套用後的內容**：`ProfiledContent`（`App.tsx`）只包手冊頁，裡面的 `useContent()` 已濾掉不採用的特約並套好覆寫；編輯器、管理頁在它外面，讀社團版原文。新頁面要顯示讀者的制度集就包一層 `ProfiledContent`（ARCHITECTURE.md §3.1）。
- **視覺回歸的基準圖只能在 Linux 的 Playwright 容器產生**（CI 的 `browser` job）：本機（Windows）截的圖字型不同，不要 commit。改了外觀就從失敗的 CI 下載 `browser` artifact 換上新基準圖（`playwright.config.ts` 開頭有指令）。
- **元件測試裡 fetch 會失敗**：`tests/setup.ts` 以社員登入，`ContentContext` 抓不到 API 時用內建內容——那是 `tests/setup.ts` 把 `state/builtinSource.ts` 換成 `tests/fixtures/` 的虛構特約（專案 `content` 換成真特約；網站本身沒有內建內容，L0）；Playwright 的 `tests/browser/fixtures.ts` 也照樣以虛構特約回 manifest、內建特約與搜尋索引。要測登入或線上內容，用 `vi.stubGlobal('fetch', …)`（見 `tests/presentation/accounts.test.tsx`）。

## 指令

```bash
npm run dev        # http://localhost:5174（牌桌是 5173）；/api 轉給 TABLE_URL（預設 http://localhost:5173，也就是本機的淡江牌桌）
npm run build      # tsc -b + vite build
npm run lint       # oxlint
npm test           # vitest run
npm run seed-builtin  # 內建特約（src/content-private/）寫到牌桌：預設預演；-- --apply 寫入並比對；-- --verify 只比對（權杖在 .env.seed）
# 真內容：git clone https://github.com/GeneCLee6/TKU-BridgeHall-content.git src/content-private（要有權限；沒有時 seed／quiz-bank 報錯、budget 的特約文字檢查與真內容測試跳過）
npm run export-content  # 牌桌上讀者讀到的全部特約匯出到 tmp/content-export/（唯讀權杖 BOOK_EXPORT_TOKEN，在 .env.seed）
npm run test:browser  # Playwright：截圖比對＋axe＋鍵盤（本機可加 PW_CHANNEL=msedge 用已安裝的 Edge）
npm run preview    # http://localhost:4173
```
