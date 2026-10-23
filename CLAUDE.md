# CLAUDE.md — TKU BridgeBook · 淡江橋譜

給 Claude Code 的專案說明。開始工作前先讀 `RULES.md` 與 `ARCHITECTURE.md`。

## 這是什麼

淡江橋藝社的制度與特約手冊網站。React 19 + TypeScript（strict）+ styled-components + Vite，靜態網站（Vercel）。介面參考 Swagger UI：每個特約是可收合的卡片，內含多層可收合段落。帳號、線上編輯的內容與 AI 匯入的後端是姊妹站淡江牌桌的 Worker（`C:\dev\TKU-BridgeTable`），`vercel.json` 把 `/api/*` 轉過去（ARCHITECTURE.md §4.1–4.4）。

## 先讀

| 情境 | 讀 |
| --- | --- |
| 新增或修改特約內容 | `CONTENT_GUIDE.md` |
| 改介面、顏色、元件 | `DESIGN.md` |
| 改資料模型、路由、搜尋、線上內容、帳號、編輯器、匯入 | `ARCHITECTURE.md` |
| 產品範圍與 Roadmap | `PRD.md` |

## 硬性規則

1. **內容正確性第一。** 特約內容逐字轉錄自社團的 Word 檔。不得依一般橋牌知識補充、刪減或修正叫品意義、點力範圍或例子。有疑義時保留原文、加 `pending`（網站顯示「待確認」），並更新 `CONTENT_GUIDE.md` 的清單。
2. **原始 Word 檔與轉檔輸出不得 commit。**（`.gitignore` 已排除 `*.doc`、`*.docx`、`*.htm`、`tmp/`。）
3. **新增特約不改元件**：只新增 `src/content/conventions/<slug>.ts` 並在 `src/content/index.ts` 登記。
4. **顏色只來自 `styles/tokens.ts`**，介面文字只來自 `strings.ts`。
5. **線上版本優先**：網站上改過的特約，改 `.ts` 檔不會顯示（ARCHITECTURE.md §4.1）。改內容前先確認那個特約沒有線上版本，或在編輯器還原為內建版本。
6. **只用於樣式的 prop 加 `$` 前綴。**
7. **不要直接推送到 `main`，也不要 force-push。** 功能走分支＋PR。
8. 程式碼、註解、commit 用英文；文件與介面用繁體中文（台灣用語）。
9. **與淡江牌桌的介面要一起改**：`src/lib/api.ts` 的型別對應牌桌的 `shared/protocol.ts`、`worker/book.ts`；`src/lib/importResult.ts` 對應牌桌 `worker/importer.ts` 的扁平 schema。

## 已知陷阱

- **Radix Accordion 的 `forceMount` 不會隱藏關閉的內容。** 關閉時的隱藏靠 `GlobalStyle` 的 `[data-accordion-content][data-state='closed']`；列印樣式再全部顯示。新增收合元件時記得加 `data-accordion-content`。
- **測試用 `getByRole('button', { name })` 找觸發器時，用 `^` 錨定開頭**，否則會同時配到「複製連結：…」按鈕。
- **花色在無障礙名稱中是中文**（`Suit` 的 `aria-label`），例如「開叫1♠時」的名稱是「開叫1黑桃時」。
- **「待確認」數量寫在測試裡**（`tests/content/conventions.test.ts`），新增或解決時要同步更新。
- **`cfb` 是 CommonJS**：Node 只給 default export，打包工具給具名 export，用 `docText.ts` 開頭的寫法取得。
- **捲動框裡的 `.visually-hidden` 要有定位的祖先。** 它是 `position: absolute`；沒有定位祖先時會跑出 `overflow: auto` 的框，把整頁撐長（編輯器的預覽曾因此在下方多出幾千 px 空白）。捲動框加 `position: relative`。
- **元件測試裡 fetch 會失敗**：`AuthContext`、`ContentContext` 抓不到 API 時退回「未登入、內建內容」；要測登入或線上內容，用 `vi.stubGlobal('fetch', …)`（見 `tests/presentation/accounts.test.tsx`）。

## 指令

```bash
npm run dev        # http://localhost:5174；/api 轉給 TABLE_URL（預設 http://localhost:5173，也就是本機的淡江牌桌）
npm run build      # tsc -b + vite build
npm run lint       # oxlint
npm test           # vitest run
npm run preview    # http://localhost:4173
```
