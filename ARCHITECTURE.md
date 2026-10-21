# ARCHITECTURE — TKU BridgeBook · 淡江橋譜

## 1. 總覽

純前端的靜態網站。內容是 TypeScript 資料檔，建置時打包進 bundle；沒有後端、資料庫或 API。

```
content/*.ts ──► content/index.ts（登記）──► HandbookPage
                                      │            ├─ Sidebar（目錄）
                                      │            ├─ ConventionCard × N
                                      │            │    └─ SectionAccordion（遞迴）
                                      │            │         └─ BlockView → AuctionTable / ResponseTable / …
                                      └─► lib/search.ts（Fuse 索引）──► SearchBar
```

## 2. 資料夾結構

```
TKU-BridgeBook/
├─ public/                  logo.svg、logo-mark.svg、favicon.svg
├─ src/
│  ├─ content/
│  │  ├─ conventions/       每個特約一個檔案（lebensohl.ts、defense-vs-unusual-2nt.ts）
│  │  ├─ categories.ts      分類與顯示順序
│  │  └─ index.ts           特約登記表
│  ├─ types/convention.ts   內容模型（唯一的 schema）
│  ├─ lib/                  純函式：calls（叫品解析）、sections（走訪、key、深層連結）、search
│  ├─ state/                ExpansionContext（展開狀態）、PreferencesContext（主題、四色牌）
│  ├─ components/           展示元件
│  ├─ pages/HandbookPage.tsx
│  ├─ styles/               tokens、GlobalStyle、styled-components 型別
│  ├─ strings.ts            所有介面文字
│  ├─ App.tsx、main.tsx
├─ tests/                   content／lib／presentation 三層測試
├─ .github/workflows/ci.yml lint → build → test
└─ *.md                     文件（README、PRD、DESIGN、ARCHITECTURE、CONTENT_GUIDE、RULES、CLAUDE）
```

## 3. 資料模型

完整定義在 `src/types/convention.ts`：

```ts
type Call = string // '1NT' '2D' 'X' 'XX' 'P' '?' '---' ''（ASCII，繪製時轉成 ♦ 等符號）

interface Auction { seats: [string, string, string, string]; calls: (Call | { call: Call; note?: string })[] }
interface ResponseRow { call: Call; meaning: string; note?: string; pending?: string }
interface RuleItem { text: string; pending?: string; children?: RuleItem[] }

type Block =
  | { kind: 'paragraph'; text: string; pending?: string }
  | { kind: 'rules'; items: RuleItem[]; ordered?: boolean }
  | { kind: 'responses'; auction?: Auction; caption?: string; rows: ResponseRow[] }
  | { kind: 'note'; tone: 'info' | 'warning'; text: string }
  | { kind: 'hand'; label?: string; hand: Hand }

interface Section {
  id: string            // 在特約內唯一，用於 /c/:slug/:sectionId
  title: string
  originalTitle?: string // 原文標題（與 title 不同時）
  summary?: string
  pending?: string
  blocks?: Block[]
  children?: Section[]  // 可無限巢狀
}

interface Convention {
  slug: string; nameZh: string; nameEn: string; aliases?: string[]
  category: CategoryId; tags: string[]; summary: string
  source: { title: string; note?: string }; updated: string
  sections: Section[]
}
```

設計重點：

- **叫品是結構化資料**，不是字串裡的表格。叫牌過程與答叫表因此能一致地繪製、搜尋與測試。
- **意義欄保留原文**，只把花色字母換成符號；點力等資訊不另拆欄位，避免轉錄時改寫原意。
- **`pending` 出現在任何層級**：段落、條列、叫品列都能掛「待確認」說明，`pendingNotes()` 會收集全部。
- **文字格式只支援兩種**：花色符號與 `**粗體**`（原文粗體）。刻意不支援 Markdown，降低內容維護出錯的機會。

## 4. 路由、狀態與內容載入

**路由**（`react-router-dom`，BrowserRouter）

| 路徑 | 行為 |
| --- | --- |
| `/` | 全部特約，皆收合 |
| `/c/:slug` | 展開該特約並捲動到卡片 |
| `/c/:slug/:sectionId` | 展開特約與該段落的所有祖先段落，捲動並聚焦到段落標題 |
| 其他 | 顯示首頁；找不到的 slug／段落顯示提示 |

整本手冊永遠在同一頁（Swagger 式），路由只決定「要打開哪裡」。

**狀態**

- `ExpansionContext`：一個 `Set<string>` 記錄所有打開的項目（特約 key 為 `slug`，段落為 `slug/sectionId`）。每一層 Radix Accordion 以 `openAmong(keys)` 取得 value、以 `setLevel(keys, open)` 回寫。全部展開／收合與深層連結因此能控制不屬於它們的收合元件。
- `PreferencesContext`：主題（淺／深）與四色牌，存在 localStorage（失敗時忽略）。
- 不使用狀態管理函式庫；兩個 Context 就夠了。

**內容載入**：所有特約在 `content/index.ts` 靜態 import，打包進 bundle。內容量很小（兩個特約約 15 kB 原始碼），不需要分割或動態載入。特約數量成長到數十個時，可改成 `import.meta.glob` 自動登記並依特約 lazy load。

**搜尋**：`lib/search.ts` 為每個特約與每個段落各建一筆紀錄（名稱、別名、標籤、叫品、內文），以 Fuse.js 搜尋（`ignoreLocation`、threshold 0.3）。所有文字與查詢都先經過 `toAsciiSuits`，因此「2♦」與「2D」結果相同。

**列印**：Accordion Content 一律 `forceMount`，關閉時以 CSS（`[data-state='closed']`）隱藏；列印樣式覆寫成全部顯示。

## 5. UI 函式庫選擇

| 函式庫 | 理由 |
| --- | --- |
| styled-components | 專案要求；與作者其他專案（CareerMate-FE）一致；theme 讓淺／深色與四色牌只是換一組 token。 |
| @radix-ui/react-accordion | 無樣式（headless），完全用 styled-components 上樣式；內建 WAI-ARIA Accordion 鍵盤行為與 `aria-expanded`/`aria-controls`；支援受控模式與 `forceMount`（列印需要）。 |
| fuse.js | 小型、無相依的模糊搜尋，適合靜態內容；支援加權欄位。 |
| react-router-dom | 深層連結；與作者其他專案一致。 |
| lucide-react | 作者其他專案使用的圖示庫，可 tree-shake。 |
| @fontsource-variable/noto-sans-tc | 自帶 Noto Sans TC，不依賴外部 CDN；依 unicode-range 分片按需下載。 |

刻意不用 MUI、Chakra 等元件庫：它們自帶 emotion 樣式系統，會與 styled-components 互相衝突，也讓 bundle 變大。

## 6. 建置、測試與部署

- **建置**：Vite 8。`npm run build` = `tsc -b`（型別檢查）＋ `vite build`，輸出到 `dist/`。
- **Lint**：oxlint（react、typescript、oxc 規則），與 WearCast 相同設定。
- **測試**：Vitest + Testing Library（jsdom）。
  - `tests/content`：內容 schema——slug 與段落 id 唯一且 URL 安全、必填欄位、叫品可解析、意義欄沒有殘留花色字母、待確認數量。
  - `tests/lib`：叫品格式化、搜尋結果。
  - `tests/presentation`：卡片展開、深層連結開啟路徑、全部展開／收合、待確認顯示。
- **CI**：GitHub Actions（`.github/workflows/ci.yml`）：`npm ci` → lint → build → test。
- **部署計畫**：任何靜態主機皆可。建議 Vercel 或 Cloudflare Pages 連接 GitHub，自動部署 `main`。因為使用 BrowserRouter，主機需設定 SPA fallback（所有路徑回傳 `index.html`）：Cloudflare Pages 預設即支援；Vercel 用專案根目錄的 `vercel.json` rewrites（已加入，部署平台選定 Vercel）。若改用 GitHub Pages，可換成 HashRouter 或加 `404.html` 轉址。

## 7. CI/CD

```
push / PR ──► GitHub Actions「CI」：lint → typecheck → test → build
          └─► Vercel Git integration：main → 正式站；PR → 預覽網址（PR 留言會附上）
                 └─ 部署成功回報 commit status「Vercel」
                       └─► GitHub Actions「Production smoke test」（只在 main）
                             1. 等正式站 <meta name="app-version"> 等於這次 commit SHA
                             2. 檢查首頁、深層連結、logo/favicon、所有 /assets 檔案回 200
```

- 正式站：https://tku-bridge-book.vercel.app/
- `app-version` 由 `vite.config.ts` 的 `appVersion` plugin 寫入，取自 Vercel 的 `VERCEL_GIT_COMMIT_SHA`；本機 build 為 `local`。
- 手動跑部署檢查：GitHub → Actions → Production smoke test → Run workflow。
- Dependabot 每月開一個合併的依賴更新 PR（npm 與 GitHub Actions），CI 綠燈且預覽站正常再合併。
- 限制：私有 repo 在 GitHub 免費方案無法設定 branch protection，所以 CI 失敗不會擋住 Vercel 部署；請以「開 PR → CI 綠燈 → 看預覽站 → 合併」的流程更新內容。
