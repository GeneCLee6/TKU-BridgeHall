<p align="center">
  <img src="public/logo.svg" alt="TKU BridgeBook 淡江橋譜" width="392" />
</p>

# TKU BridgeBook · 淡江橋譜

**淡江橋藝社制度與特約手冊。**

社團的叫牌制度與各項橋牌特約，過去散落在一份份 Word 檔裡，常常找不到、版本也對不上。淡江橋譜把它們整理成一個網站：介面參考 Swagger UI，每個特約是一張可展開的卡片，裡面再分層收合各個段落與叫牌表，社員可以自己找到需要的特約、展開來複習，也能把某一段的連結直接貼給隊友。

目前收錄兩個特約：

| 特約 | 英文 | 來源文件 |
| --- | --- | --- |
| 雷本索特約 | Lebensohl | 雷本所特約（1NT遭插叫的答叫原則） |
| 對抗不尋常2NT | Defense vs. Unusual 2NT | 如何對抗弱跳叫2NT兩低 |
| 1NT的答叫 | Responses to 1NT | 1NT的答叫 |
| 1H 2H（淡江用） | After a Single Raise of Responder’s Major | 1H 2H(淡江用) |

內容逐字轉錄自原始文件；原文有疑義之處在網站上以「待確認」標示，清單見 [`CONTENT_GUIDE.md`](CONTENT_GUIDE.md#目前的待確認清單)。

## 文件

| 文件 | 內容 |
| --- | --- |
| [`PRD.md`](PRD.md) | 產品需求：背景、目標、使用者故事、功能需求、MVP 與 Roadmap |
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
npm run dev        # http://localhost:5173
```

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 開發伺服器（熱更新），預設 http://localhost:5173 |
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

## Logo

| 檔案 | 用途 |
| --- | --- |
| `public/logo.svg` | 完整標誌：宮燈＋TKU 字標＋「TKU BridgeBook · 淡江橋譜」 |
| `public/logo-mark.svg` | 只有宮燈圖形 |
| `public/favicon.svg` | 網站圖示（深藍底、簡化宮燈與黑桃） |

設計概念與使用規範見 `DESIGN.md` §8。標誌為原創圖形，未使用淡江大學校徽或任何註冊商標。
