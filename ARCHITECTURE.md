# ARCHITECTURE — TKU BridgeBook · 淡江橋譜

## 1. 總覽

靜態網站（Vercel）。內容是 TypeScript 資料檔，建置時打包進 bundle；社員在網站上的修改存在姊妹站**淡江牌桌**的 Worker，開頁面時疊在打包的內容上（§4.1）。帳號也是淡江牌桌的：`vercel.json` 把 `/api/*` 轉給它，所以 cookie 屬於本站（§4.2）。

```
瀏覽器 ──/api/*──► Vercel rewrite ──► 淡江牌桌 Worker（帳號、線上內容、版本、匯入）
   └──── 匯入上傳（一次性憑證，直接連 Worker）────┘
```

```
content/index.ts（登記）──npm run manifest──► content/manifest.ts ──► ContentContext ──► HandbookPage
content/conventions/*.ts ──► content/loaders.ts（每個特約一個 chunk，按需載入）──┘   ├─ Sidebar（目錄，只用 manifest）
                                                                                     ├─ ConventionCard × N（打開時載入內容）
                                                                                     │    └─ SectionAccordion（遞迴）
                                                                                     │         └─ BlockView → AuctionTable / ResponseTable / …
                                                                                     └─ lib/search.ts（Fuse；聚焦搜尋框時才下載）──► SearchBar
```

## 2. 資料夾結構

```
TKU-BridgeBook/
├─ public/                  logo.svg、logo-mark.svg、favicon.svg
├─ src/
│  ├─ components/editor/    線上編輯器的段落樹、表單、各種區塊、預覽、版本紀錄
│  ├─ content/
│  │  ├─ conventions/       每個特約一個檔案（lebensohl.ts、defense-vs-unusual-2nt.ts）
│  │  ├─ categories.ts      分類與顯示順序
│  │  └─ index.ts           特約登記表
│  ├─ types/convention.ts   內容模型（唯一的 schema）
│  ├─ lib/                  calls（叫品解析）、sections（走訪、key、深層連結）、search、content（線上內容合併與檢查）、
│  │                        editing（編輯器的樹與文字轉換）、docText（讀 .doc/.docx）、importResult、sse、api（唯一有網路的模組）
│  ├─ state/                ExpansionContext（展開狀態）、PreferencesContext（主題）、AuthContext（帳號）、ContentContext（線上內容）
│  ├─ components/           展示元件
│  ├─ pages/                HandbookPage、LoginPage、AccountPage、AdminPage、EditorPage、ImportPage、Frame（頁首與權限閘門）
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
| `/login` | 登入、註冊、忘記密碼；`?next=` 登入後回到原頁 |
| `/account` | 我的帳號：權限、修改密碼 |
| `/admin` | 社團管理（管理員）：待審核的申請、橋譜權限、重設密碼、邀請碼與人數上限 |
| `/edit/:slug`、`/new` | 線上編輯器（bookEdit）；`?draft=<id>&n=<i>` 打開匯入草稿的第 i 個特約 |
| `/import` | 匯入檔案（bookImport） |
| 其他 | 顯示首頁；找不到的 slug／段落顯示提示 |

管理、編輯、匯入三頁用 `React.lazy` 分開打包，讀者不會下載。

整本手冊永遠在同一頁（Swagger 式），路由只決定「要打開哪裡」。

**狀態**

- `ExpansionContext`：一個 `Set<string>` 記錄所有打開的項目（特約 key 為 `slug`，段落為 `slug/sectionId`）。每一層 Radix Accordion 以 `openAmong(keys)` 取得 value、以 `setLevel(keys, open)` 回寫。全部展開／收合與深層連結因此能控制不屬於它們的收合元件。
- `PreferencesContext`：主題（淺／深）與字級（小／中／大，`GlobalStyle` 依此設定根字級），存在 localStorage（失敗時忽略）。花色固定四色牌。
- `useMediaQuery(mobileQuery)`：決定 ViewActions 放在頁首（桌機）或選單抽屜（手機），同一時間只渲染一組。
- 不使用狀態管理函式庫；兩個 Context 就夠了。

**內容載入**（2026-10 起，E10 分片）：
- `content/manifest.ts` 是 `npm run manifest`（`scripts/build-manifest.ts`）產生的清單：每個特約除了內容以外的全部欄位，加上段落大綱（`outline`：id、標題、子段落）與待確認清單（`pending`），型別 `ConventionMeta`。目錄、收合的卡片、深層連結、全部展開都只用它。`tests/content/manifest.test.ts` 確認它和 `content/index.ts` 一致。
- `content/loaders.ts` 用 `import.meta.glob` 把每個 `conventions/<slug>.ts` 打成獨立 chunk，`loadBundled(slug)` 按需下載。檔名必須等於 slug。
- `content/index.ts` 仍然靜態 import 全部特約，但**只給測試與 manifest 腳本用**；網站程式不能 import 它（否則全部內容會回到首頁的 bundle，效能預算會擋下來）。`categories`、`references` 直接從各自的檔案 import。
- 卡片第一次打開時用 `useConvention(slug)` 載入內容；載入中顯示「載入中…」，失敗顯示重試。深層連結會先打開路徑，等內容到了再捲動。
- 搜尋：內容還沒載入的特約先用 manifest 的名稱、標籤、摘要與段落標題；聚焦搜尋框時下載 Fuse 與全部內容，之後就是全文搜尋（A2 改為預建索引）。列印按鈕先載入全部再列印（直接按 Ctrl+P 只印出已載入的特約）。
- 線上的修改見 §4.1。

### 4.1 線上修改的內容（`ContentContext`、`lib/content.ts`）

- 每個特約在伺服器最多一筆「線上版本」（`BookEntry`）：取代同 slug 的內建特約、新增一個特約，或 `convention: null` 隱藏它。
- 開頁面時先顯示內建 manifest（或這台裝置上次看到的線上 manifest，存在 localStorage），再抓 `GET /api/book/manifest`（每筆線上版本不含內容，`meta` 是牌桌 Worker 算好的 `ConventionMeta`，隱藏的為 `null`；`ETag`）。`mergeManifest` 依內建順序替換，新增的排在後面（依建立時間）；抓不到就維持現狀並顯示離線提示。
- 線上改過的特約，打開時抓 `GET /api/book/content/:slug`（`ETag`；沒有線上版本回 404），用 `onlineConvention`（`conventionProblems`）檢查形狀，壞掉的略過並列入提示，不會讓頁面掛掉。載入的內容以 `slug@版本` 存在 `ContentContext`，線上版本更新後自然換新。
- 舊的 `GET /api/book/content`（整本一次）牌桌仍保留給舊版前端，這裡已不使用。Service worker 對這兩支 API 走「先網路、離線用快取」，其他 `/api` 一律不快取。
- 這兩支 API 的型別在 `lib/api.ts`（`BookManifest`、`BookEntrySummary`），對應牌桌 `worker/book.ts`；`pending` 的走訪順序必須和 `lib/sections.ts` 的 `pendingNotes` 一致。
- **線上版本優先**：某個特約在網站上改過之後，再改它的 `.ts` 檔不會顯示出來，要在編輯器的版本紀錄按「還原為網站內建的版本」，或把線上內容寫回 `.ts` 檔後再還原。`BookEntry.bundledUpdated` 記著第一次線上修改時內建版本的 `updated` 日期。

### 4.2 帳號與權限（`AuthContext`、`lib/api.ts`）

帳號在淡江牌桌（`TKU-BridgeTable` ARCHITECTURE.md §5.2）：註冊送出申請、管理員核准；忘記密碼用帳號＋邀請碼重設（管理員除外）。`Me.permissions`：`bookEdit`（線上編輯）、`bookImport`（匯入檔案），管理員兩者都有。閱讀不需要登入。`api.ts` 的型別要和牌桌的 `shared/protocol.ts`、`worker/book.ts` 一致。

### 4.3 線上編輯器（`pages/EditorPage.tsx`、`components/editor/`、`lib/editing.ts`）

- 左邊段落樹、中間表單、右邊預覽（寬螢幕；窄螢幕用切換）。預覽用自己的 `ExpansionProvider`，全部展開。
- 條列以縮排文字編輯（`rulesToText`／`textToRules`，行尾〔待確認：…〕），叫牌過程是四欄格子（`2C（註記）`），叫品表可整批貼上「2H=P/C」。這些轉換對所有內建特約都能來回不變（`tests/lib/editing.test.ts`）。
- 儲存前 `tidyConvention` 去掉空欄位與空區塊，`conventionProblems` 擋下格式錯誤，`conventionWarnings` 提醒（看不懂的叫品、沒換成符號的花色字母）。
- 儲存帶 `baseVersion`（開始編輯時的版本），別人先存了會得到 409，可以載入對方的版本或覆蓋（對方的版本留在版本紀錄）。未儲存的修改存在這台裝置的 localStorage，離開前會提醒。

### 4.4 匯入檔案（`pages/ImportPage.tsx`、`lib/docText.ts`、`lib/sse.ts`、`lib/importResult.ts`）

1. 在瀏覽器讀檔：`.doc` 用 `cfb` 讀 OLE 檔，再照 piece table 取出文字（粗體 `**…**`、表格 `| … |`、Symbol 字型的花色換成 ♠♥♦♣）；`.docx` 解 XML（標題 `#`、條列 `-`）；PDF 原檔上傳。
2. 跟 `/api/book/import/ticket` 拿一次性憑證，把檔案或文字、目前的特約目錄、分類、補充說明以 multipart 直接傳給 Worker（Vercel 轉發最多等 120 秒，長文件要好幾分鐘）。
3. Worker 原封不動回傳 Claude 的 SSE 串流；`sse.ts` 收集文字（refusal fallback 時會有第二個文字區塊，照樣接起來）。
4. 回覆是扁平的 JSON（段落用 `parentId`、條列用 `level`），`importResult.ts` 組回 `Convention`，存成伺服器上的草稿，再到編輯器檢查、儲存。**schema 定義在牌桌的 `worker/importer.ts`，兩邊要一起改。**`tests/lib/importResult.test.ts` 把每個內建特約轉成扁平格式再還原，結果必須完全相同。

**搜尋**：`lib/search.ts` 為每個特約與每個段落各建一筆紀錄（名稱、別名、標籤、叫品、內文），以 Fuse.js 搜尋（`ignoreLocation`、threshold 0.3）。所有文字與查詢都先經過 `toAsciiSuits`，因此「2♦」與「2D」結果相同。

**列印**：Accordion Content 一律 `forceMount`，關閉時以 CSS（`[data-state='closed']`）隱藏；列印樣式覆寫成全部顯示。

## 5. UI 函式庫選擇

| 函式庫 | 理由 |
| --- | --- |
| styled-components | 專案要求；與作者其他專案（CareerMate-FE）一致；theme 讓淺／深色只是換一組 token。 |
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
- **手機 App（PWA）**：`public/manifest.webmanifest`（名稱「淡江橋譜」、全螢幕、圖示）、`public/sw.js`（service worker：頁面優先走網路、離線時用快取；`/assets/` 檔名含雜湊，走快取）、`src/lib/pwa.ts`（只在正式版註冊 service worker，保留瀏覽器的安裝邀請給「安裝 App」按鈕）。`vercel.json` 讓 `sw.js` 不被快取，新版本會立刻生效。改 `sw.js` 的快取策略時，記得把 `CACHE` 名稱加版號。
- **CI**：GitHub Actions（`.github/workflows/ci.yml`）：`npm ci` → lint → typecheck → test → build → 效能預算（`npm run budget`）；另一個 job 跑 Lighthouse（見 §6.5）。
- **部署計畫**：任何靜態主機皆可。部署平台是 Vercel（連接 GitHub，但 `main` 不自動部署，見 §7）。因為使用 BrowserRouter，主機需設定 SPA fallback（所有路徑回傳 `index.html`）：Cloudflare Pages 預設即支援；Vercel 用專案根目錄的 `vercel.json` rewrites（已加入，部署平台選定 Vercel）。若改用 GitHub Pages，可換成 HashRouter 或加 `404.html` 轉址。

## 6.5 效能

內容全部預先渲染（forceMount，收合時用 CSS 隱藏），所以展開／收合只是改狀態，不需要重新載入內容。為了讓「全部展開」在特約變多時仍然很快：

- `BlockView`、`RichText` 用 `React.memo`：內容是靜態資料，展開／收合時不會重新渲染段落與表格，只更新折疊狀態。
- 特約卡片使用 `content-visibility: auto`：畫面外的卡片延後排版與繪製，捲到時才處理。
- 全部展開／收合包在 `startTransition`：按鈕立刻有反應，畫面不會卡住。

2026-10-21 實測（7 個特約、約 130 個小節）：第一次全部展開從 0.5～2.1 秒降到 0.1～0.23 秒。

2026-10-22 加入舊講義（9 張卡片）後，DOM 由約 2.1 萬增為 3.2 萬個節點。同一台電腦、分頁在前景、等到所有卡片狀態改完為止：未加講義 展開 0.31～0.45 秒／收合 0.09～0.14 秒；加講義後 第一次展開 1.6 秒、之後約 0.6 秒，收合 0.2～0.4 秒。（量測時分頁若在背景，Chrome 會把 requestAnimationFrame 節流到約每秒一次，用「等兩個畫面」量會誤得到約 2 秒，要用 MessageChannel 輪詢狀態。）

### 效能預算（e10-t03，AC-10.1）

`npm run build` 之後跑 `npm run budget`（`scripts/check-budget.mjs`），印出一張表，超出預算時結束碼為 1（`npm run budget -- --no-fail` 只報告）。大小一律是 gzip（level 9）。

| 項目 | 預算 | 怎麼算 |
| --- | --- | --- |
| 首頁初始 JS | ≤ 150 kB | `index.html` 的入口 chunk 加上它靜態 import 的所有 chunk（遞移），以及 `dist/index.html` 裡的 script／modulepreload |
| 首頁不下載特約 | 0 | 首頁的 chunk 圖裡不能有來自 `src/content/conventions/` 的模組；且每個特約檔都要有自己的 chunk（沒拆出來就代表被打包進首頁） |
| 特約頁額外 JS | 每個 ≤ 30 kB | 特約 chunk 加上它靜態 import、首頁還沒有的共用 chunk |
| 搜尋索引 | ≤ 300 kB | `dist/search-index.json`；檔案不存在時略過 |
| CSS | 只報告 | 首頁 CSS 與全部 CSS |

模組與 chunk 的對應來自 Vite 的 build manifest（`vite.config.ts` 的 `build.manifest: true`，輸出 `dist/.vite/manifest.json`），以 manifest 的 `src` 是否以 `src/content/conventions/` 開頭辨認特約 chunk。

**Lighthouse**：CI 的 `lighthouse` job 重新 build，用 `vite preview` 起站，以 Lighthouse CI（`npx @lhci/cli`，設定在 `lighthouserc.json`）量 `/` 與 `/c/jacoby-2nt`，各跑 3 次取中位數。無障礙 < 0.95 會讓 job 失敗；效能 < 0.9、最佳做法 < 0.9 只警告——CI 機器的模擬節流分數浮動大，硬擋會常誤報，效能改由上面的 bundle 預算把關。報告上傳為 artifact `lighthouse-reports`（不上傳到公開的 temporary storage）。本機可跑 `npm run build && npx @lhci/cli@0.15.1 autorun`（需要 Chrome）。

## 7. CI/CD

```
push / PR ──► GitHub Actions「CI」：lint → typecheck → test → build → budget
          │                         └─ lighthouse job（/、/c/jacoby-2nt）
          └─► Vercel Git integration：PR → 預覽網址（PR 留言會附上）；main 不自動部署
手動部署 main ──► 正式站
                 └─ 部署成功回報 commit status「Vercel」
                       └─► GitHub Actions「Production smoke test」（只在 main）
                             1. 等正式站 <meta name="app-version"> 等於這次 commit SHA
                             2. 檢查首頁、深層連結、logo/favicon、所有 /assets 檔案回 200
```

- 正式站：https://tku-bridge-book.vercel.app/
- **正式站只手動部署。** 社員已經在用正式站，所以 `vercel.json` 的 `git.deploymentEnabled.main: false` 關掉 `main` 的自動部署；合併 PR 不會上線，PR 的預覽網址照常產生。要上線時：Vercel → 專案 → Deployments → Create Deployment，填 `main`（或要上線的 commit），部署到 Production；或在本機 `npx vercel --prod`（第一次要 `vercel login`、`vercel link`）。上線後跑一次 Production smoke test（下面）。牽涉牌桌 API 的變更，先確認牌桌已部署。
- `app-version` 由 `vite.config.ts` 的 `appVersion` plugin 寫入，取自 Vercel 的 `VERCEL_GIT_COMMIT_SHA`；本機 build 為 `local`。
- 手動跑部署檢查：GitHub → Actions → Production smoke test → Run workflow。
- Dependabot 每月開一個合併的依賴更新 PR（npm 與 GitHub Actions），CI 綠燈且預覽站正常再合併。
- 限制：私有 repo 在 GitHub 免費方案無法設定 branch protection，所以 CI 失敗不會擋住合併；請以「開 PR → CI 綠燈 → 看預覽站 → 合併 → 手動部署」的流程更新內容。
