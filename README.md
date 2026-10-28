<p align="center">
  <img src="public/logo.svg" alt="TKU BridgeHall 淡江橋館" width="392" />
</p>

# TKU BridgeHall · 淡江橋館

**淡江橋藝社的制度與牌局：制度、特約與手冊。**

社團的叫牌制度與各項橋牌特約，過去散落在一份份 Word 檔裡，常常找不到、版本也對不上。淡江橋館把它們整理成一個網站：介面參考 Swagger UI，每個特約是一張可展開的卡片，裡面再分層收合各個段落與叫牌表，社員可以自己找到需要的特約、展開來複習，也能把某一段的連結直接貼給隊友。

目前收錄的特約：

| 特約 | 英文 | 來源文件 |
| --- | --- | --- |
| 雷本索特約 | Lebensohl | 雷本所特約（1NT遭插叫的答叫原則） |
| 對抗不尋常2NT | Defense vs. Unusual 2NT | 如何對抗弱跳叫2NT兩低 |
| 1NT的答叫 | Responses to 1NT | 1NT的答叫 |
| 1H 2H（淡江用） | After a Single Raise of Responder’s Major | 1H 2H(淡江用) |
| 開叫高花之滿貫詢問叫 | Jacoby 2NT | J2N |
| Bergen加叫（松濤版） | Bergen Raises | Bergen |
| 橋牌防守信號 | Defensive Signals | 橋牌防守信號 |
| 2D 開叫 | 2♦ Opening | 2D open(ppq20131029) |
| 開叫2NT及答叫 | 2NT Opening and Responses | 開叫2NT答叫(ppq終極版20130511) |
| 新低花迫叫 | New Minor Forcing | NMF |
| 好壞2NT（松濤版） | Good/Bad 2NT | 好壞2NT的約定叫品(松濤20160226) |
| 開叫高花之滿貫詢問叫（舊版） | Major Slam Ask (2011 version) | 1S 2NT舊版(doblue 20110719) |
| 回答性賭倍 | Responsive Double | Responsive dbl 回答性賭倍 |
| 制度總覽（舊講義）：總覽、1♣、1♦、1♥/1♠、1NT/2NT、2♣與阻塞叫、賭倍、競叫與技光、觀念與防禦 | TKU Natural System (2010 handbook) | 淡江大學-我們的制度(修訂版) |

舊講義是 2010 年 13 點開叫的版本；現行為 12 點開叫、1NT 15-17、2NT 20-21、2♣ 22+、1NT forcing、2/1 迫叫成局。網站上以「現行制度」標出差異，與特約衝突時以特約為準。

原始 Word 檔不放在 repo；檔名與特約的對照見 [`docs/README.md`](docs/README.md)。

內容逐字轉錄自原始文件；原文有疑義之處在網站上以「待確認」標示，清單見 [`CONTENT_GUIDE.md`](CONTENT_GUIDE.md#目前的待確認清單)。

## 帳號、線上編輯與匯入

- **帳號與淡江牌桌共用**：在任一邊註冊（需要邀請碼，管理員核准後才能登入），兩個網站都用同一組帳號登入。登入頁可以顯示／隱藏密碼，也能用「忘記密碼」以帳號＋邀請碼重設。閱讀橋譜不需要登入。
- **權限**：管理員在「社團管理」核准申請，並開給社員「線上編輯」或「匯入檔案」權限。
- **線上編輯**：有權限的人在卡片上按鉛筆就能修改，或新增特約；有即時預覽、版本紀錄、還原與衝突提醒。
- **匯入檔案**：把 .doc／.docx／.pdf 交給 AI（Claude），照網站格式整理出標題、子標題與各段內容並歸到合適的分類，在編輯器確認後發布。

使用說明見 [`CONTENT_GUIDE.md`](CONTENT_GUIDE.md) 第 6 節，架構見 `ARCHITECTURE.md` §4.1–4.4。

## 文件

| 文件 | 內容 |
| --- | --- |
| [`docs/PRD/`](docs/PRD/README.md) | 產品需求：總 PRD、10 個 epic 與 task；[`docs/ROADMAP.md`](docs/ROADMAP.md) 批次順序；[`docs/NEXT.md`](docs/NEXT.md) 現在的位置 |
| [`docs/HEALTH-CHECK.md`](docs/HEALTH-CHECK.md) | 2026-10-24 專案健檢與產品建議 |
| [`docs/DESIGN-V2.md`](docs/DESIGN-V2.md) | 介面 v2 規格（已實作，現行樣式見 `DESIGN.md`）；視覺稿 [`docs/design/mockup-v2.html`](docs/design/mockup-v2.html) |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | 資料夾結構、資料模型、路由、狀態、建置與部署 |
| [`DESIGN.md`](DESIGN.md) | 設計系統：色彩、字體、元件、版面、無障礙、Logo |
| [`CONTENT_GUIDE.md`](CONTENT_GUIDE.md) | 幹部新增特約的逐步說明 |
| [`RULES.md`](RULES.md) | 工程慣例與 commit 格式 |
| [`CLAUDE.md`](CLAUDE.md) | 給 AI 協作者的專案說明 |

## 技術

- React 19 + TypeScript（strict）+ Vite
- styled-components 6（主題、淺色/深色，花色固定四色牌）
- `@radix-ui/react-accordion`：無樣式、符合 WAI-ARIA 的收合元件
- `fuse.js`：特約名稱、標籤、叫品與內文的模糊搜尋
- `react-router-dom`：每個特約與段落的深層連結
- Vitest + Testing Library；oxlint

選擇理由見 `ARCHITECTURE.md` §5。

## 開始使用

需要 Node.js 22。

```bash
npm install
npm run dev        # http://localhost:5174
```

登入、編輯、匯入要有後端：在 `TKU-BridgeTable` 執行 `npm run dev`（http://localhost:5173），本站的 `/api` 會自動轉過去；後端在別的網址時設 `TABLE_URL`（例如 `TABLE_URL=http://localhost:5377 npm run dev`）。只看內容不需要後端。

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 開發伺服器（熱更新），預設 http://localhost:5174 |
| `npm run build` | 型別檢查並建置到 `dist/` |
| `npm run preview` | 預覽建置結果，預設 http://localhost:4173 |
| `npm run typecheck` | 只做型別檢查 |
| `npm run lint` | oxlint |
| `npm test` | 執行一次全部測試 |

## 新增一個特約

1. 在 `src/content/conventions/` 新增 `<slug>.ts`，匯出一個符合 `Convention` 型別的物件。
2. 在 `src/content/index.ts` 的 `conventions` 陣列登記它。
3. `npm test`：測試會檢查 slug 與段落 id 是否唯一、必填欄位、叫品格式與花色符號。

完整步驟、欄位說明與範本見 [`CONTENT_GUIDE.md`](CONTENT_GUIDE.md)。不需要修改任何元件。

## 手機 App

網站可以安裝成手機 App（PWA），之後從主畫面圖示全螢幕開啟，沒有網路也能看已讀過的內容：

- **iPhone／iPad**：用 Safari 開啟網站 → 下方「分享」→「加入主畫面」。
- **Android**：用 Chrome 開啟網站 → 右上角「⋮」→「安裝應用程式」或「加到主畫面」。
- 網站頁首（手機版在選單裡）也有「安裝 App」按鈕：瀏覽器支援時直接安裝，否則顯示上面的步驟。

## Logo

| 檔案 | 用途 |
| --- | --- |
| `public/logo.svg` | 完整標誌：屋簷與拱門＋TKU 字標＋「淡江橋館 BridgeHall」 |
| `public/logo-mark.svg` | 只有屋簷與拱門圖形 |
| `public/favicon.svg` | 網站圖示（深藍圓角底＋拱門） |
| `public/icon-192.png`、`icon-512.png`、`icon-maskable-512.png`、`apple-touch-icon.png` | 手機 App 圖示 |

淡江橋館用「拱門」，姊妹站淡江牌桌（TKU BridgeTable）用「宮燈」，兩個 App 在手機主畫面上一眼就能分辨。

設計概念與使用規範見 `DESIGN.md` §8。標誌為原創圖形，未使用淡江大學校徽或任何註冊商標。
