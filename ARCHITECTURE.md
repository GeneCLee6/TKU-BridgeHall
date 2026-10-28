# ARCHITECTURE — TKU BridgeHall · 淡江橋館

## 1. 總覽

靜態網站（Vercel）。內容是 TypeScript 資料檔，建置時打包進 bundle；社員在網站上的修改存在姊妹站**淡江牌桌**的 Worker，開頁面時疊在打包的內容上（§4.1）。帳號也是淡江牌桌的：`vercel.json` 把 `/api/*` 轉給它，所以 cookie 屬於本站（§4.2）。

```
瀏覽器 ──/api/*──► Vercel rewrite ──► 淡江牌桌 Worker（帳號、線上內容、版本、匯入）
   └──── 匯入上傳（一次性憑證，直接連 Worker）────┘
```

```
content/index.ts（登記）──npm run manifest──► content/manifest.ts ──► ContentContext ──► HandbookShell（HomePage／ConventionPage／BookPage）
content/conventions/*.ts ──► content/loaders.ts（每個特約一個 chunk，按需載入）──┘   ├─ Sidebar（目錄，只用 manifest）
                                                                                     ├─ ConventionCard × N（打開時載入內容）
                                                                                     │    └─ SectionAccordion（遞迴）
                                                                                     │         └─ BlockView → AuctionTable / ResponseTable / …
                                                                                     └─ lib/search.ts（Fuse＋/search-index.json；聚焦搜尋框時才下載）──► SearchBar
```

## 2. 資料夾結構

```
TKU-BridgeHall/
├─ public/                  logo.svg、logo-mark.svg、favicon.svg
├─ src/
│  ├─ components/editor/    線上編輯器的段落樹、表單、各種區塊、預覽、版本紀錄
│  ├─ content/
│  │  ├─ conventions/       每個特約一個檔案（lebensohl.ts、defense-vs-unusual-2nt.ts）
│  │  ├─ categories.ts      內建分類與顯示順序（線上改過時以線上為準，§4.5）
│  │  └─ index.ts           特約登記表
│  ├─ types/convention.ts   內容模型（唯一的 schema）
│  ├─ cards/                制度卡（E3）：types（CardTemplate）、slots（格子 id）、templates/（每個版型一個檔案，檔名＝id）、
│  │                        cardSlots（特約的格子對應）、fill（fillCard 填卡）；網站程式只能 lazy 載入
│  ├─ lib/                  calls（叫品解析）、sections（走訪、key、深層連結）、search、content（線上內容合併與檢查）、
│  │                        editing（編輯器的樹與文字轉換）、docText（讀 .doc/.docx）、importResult、sse、api（唯一有網路的模組）、
│  │                        profiles（制度集解析，E1）
│  ├─ state/                ExpansionContext（展開狀態）、PreferencesContext（個人設定）、AuthContext（帳號）、ContentContext（線上內容）、ProfileContext（讀者的制度集）
│  ├─ components/           展示元件
│  ├─ pages/                HandbookShell、HomePage、ConventionPage、BookPage、LoginPage、AccountPage、AdminPage、EditorPage、ImportPage、Frame（頁首與權限閘門）
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
  level?: Level         // 和特約不同時才標；沒標的跟上一層
  blocks?: Block[]
  children?: Section[]  // 可無限巢狀
}

type ConventionKind = 'system' | 'convention' | 'signal' | 'defense' // 制度章節／特約／信號／防禦
type Level = 'basic' | 'intermediate' | 'advanced'                   // 入門／進階／高階

interface Convention {
  slug: string; nameZh: string; nameEn: string; aliases?: string[]
  category: CategoryId
  kind?: ConventionKind      // 沒標當作 'convention'（lib/content.ts 的 conventionKind）
  level?: Level
  prerequisites?: string[]   // 先讀的特約 slug（E4 學習路徑）
  cardSlots?: string[]       // 制度卡位置：'<格子> [= 值] <- <出處>'（src/cards/cardSlots.ts、CONTENT_GUIDE.md §2.2）；不進 manifest
  tags: string[]; summary: string
  source: { title: string; note?: string }; updated: string
  sections: Section[]
}
```

設計重點：

- **叫品是結構化資料**，不是字串裡的表格。叫牌過程與答叫表因此能一致地繪製、搜尋與測試。
- **意義欄保留原文**，只把花色字母換成符號；點力等資訊不另拆欄位，避免轉錄時改寫原意。
- **`pending` 出現在任何層級**：段落、條列、叫品列都能掛「待確認」說明，`pendingNotes()` 會收集全部。
- **種類、程度、前置特約都是選填**（E1，CONTENT_GUIDE.md §2.1）：舊內容與線上內容不用改就能顯示；`conventionProblems` 只擋不認得的值。它們跟著 `ConventionMeta` 進 manifest（牌桌算的線上 manifest 原樣帶過），搜尋紀錄帶 `kind`、`level`（段落用自己或最近祖先的程度）給結果顯示標籤。AI 匯入不判斷這三項：匯入既有特約的新版時，編輯器沿用原本的值。
- **文字格式只支援兩種**：花色符號與 `**粗體**`（原文粗體）。刻意不支援 Markdown，降低內容維護出錯的機會。

### 3.1 制度集（`SystemProfile`，E1）

型別在牌桌 `shared/protocol.ts` 的「System profiles」區段，橋譜 `src/lib/api.ts` 逐欄同步（唯一差別：牌桌把整段覆寫的 `section` 存成 `Record<string, unknown>`，橋譜是 `Section`）。兩邊的 `profileTypes`／`system-profile-types` 測試用同一份欄位清單與範例對拍。

```ts
const CLUB_PROFILE_ID = 'club'                       // 社團預設：永遠存在、不可刪、所有制度集的根
type ProfileScope = 'club' | 'team' | 'partnership'
const PROFILE_LIMITS = { bytesMax: 200_000, overridesMax: 500 }

interface SystemProfile {
  id: string; name: string; scope: ProfileScope
  parentId?: string                                  // 沒給就繼承 club；club 的 parentId 不理會
  adopted: Record<string, 'on' | 'off'>              // 沒列的跟母制度集；全部沒列＝全採用
  overrides: ProfileOverride[]; notes: ProfileNote[]
  version: number; updatedAt: number; updatedBy: string
}
type ProfileOverride =
  | { kind: 'row'; slug; sectionId; blockIndex; rowIndex; meaning: string; note?: string } // note 有給就取代，'' 清掉
  | { kind: 'section'; slug; sectionId; section: Section }                                 // 整段換掉，id 固定為 sectionId
  | { kind: 'meta'; slug; summary?: string; tags?: string[] }
interface ProfileNote { slug: string; sectionId?: string; text: string; by: string; at: number }
```

**解析**（`lib/profiles.ts`，純函式，`tests/lib/profiles.test.ts`）：`resolveProfile(profiles, id, content)` 回傳 `{ profile, chain, conventions, notes, problems }`。

- **繼承鏈**：從 `club` 往下到選的制度集。清單裡沒有 `club` 時補一個空的；選的制度集不存在就退回 `club`（`missingProfile`）；母制度集不存在或繞回自己就停在那裡、直接接 `club`（`missingParent`、`cycle`）。不限定層數，team ← team 也能解析。
- **採用**：最深一層有列的說了算；`off` 的特約不出現在結果，它的覆寫與備忘保留不用（子層再 `on` 就生效），也不算錯。
- **覆寫**：由上往下套，子層勝。同一層內先整段、再叫品列、最後 meta，所以叫品列覆寫可以指向同一層換過的段落。叫品列覆寫換掉 `meaning`（`note` 照上面的規則），拿掉原本的 `pending`（那是原文的待確認，不適用於覆寫後的意義）。
- **`origin`**：被覆寫的部分帶 `origin`（覆寫它的那層的 `scope`）：叫品列、整段換掉的段落與它底下所有段落、改過摘要或標籤的特約。沒有 `origin` 就是橋譜本身的內容。結果型別 `ResolvedConvention` 仍可當 `Convention` 用。
- **空制度集等於原內容**：沒有覆寫時回傳的就是傳入的物件（同一個參照），所以每個內建特約在空制度集下 `toEqual` 也 `toBe` 原內容。只複製被改到的路徑，傳入的參數一律不改。
- **壞參照不靜默消失**：覆寫或備忘指到不存在的特約、段落、區塊或列（或那個區塊不是答叫表），略過並放進 `problems`（`brokenOverride`、`brokenNote`、`unknownAdoption`），給「與母制度集比較」頁列出失效的覆寫（e1-t15）。

**網站怎麼用**（A7：e1-t11、e1-t12、e1-t13、e1-t16）：
- `state/ProfileContext.tsx` 的 `ProfileProvider`（在 `ContentProvider` 裡面）：未登入只有 `club`，**不抓任何制度集 API**，手冊照原樣顯示。登入後抓 `GET /api/book/profiles` 的摘要清單；目前選擇是帳號的 `Me.bookProfile`（牌桌 `POST /api/account/preferences` 的 `bookProfile`，空字串＝`club`），存不進帳號時（離線）暫存在 localStorage（`tku-bridgebook:profile`，`{ user, id }`），下次載入再送一次、送成功就清掉。選的制度集已不存在時顯示 `club`。
- `lib/profiles.ts` 只在登入後才動態載入（首頁 JS 預算）；`loadProfileView` 先看摘要的數量，整條鏈什麼都沒改（全部 0）就不抓制度集本體、直接照原樣顯示，否則只抓鏈上的制度集，做出 `profileView`。`profileView` 套用和 `resolveProfile` 同一套規則，但一次一個特約（內容是分片載入的）：`plays`、`changes`、`convention`（套覆寫，依物件快取）、`meta`（目錄項目：摘要、標籤與被換掉的段落大綱；`outline` 代替段落套用同一組覆寫）、`notes`。
- `ProfiledContent` 只包住手冊頁（`App.tsx`），用同一個 `ContentContext` 提供制度集看到的內容：不採用的特約從目錄、`bySlug`、`load`、`loadAll`（列印）消失，其餘套覆寫。編輯器、管理頁仍讀社團版原文。`Content.changed(slug)` 對被覆寫的特約回傳含制度集版本的鍵，搜尋就改用載入後的內容建索引（與線上改過的特約同一條路）。
- 頁首選單 `components/ProfileSwitch.tsx`（lazy；有兩個以上制度集才出現）：桌機在頁首，手機在目錄抽屜；原生 `<select>` 依社團／隊伍／搭檔分組，`role="status"` 報讀「目前顯示…」；切換時內容區變淡（`aria-busy`，減少動態時不做過場），舊內容留到新的載好，載入失敗顯示提示並退回社團版。
- 覆寫標記 `components/ProfileMarks.tsx`：段落標題與特約名稱旁的「社團覆寫／隊伍覆寫／搭檔覆寫」，答叫表被覆寫的列在意義欄左側一條色線並加同一個文字標（顏色借 `structure`／`accent`／`seal`）；備忘（`notes`）在特約或段落開頭，只有登入讀得到制度集的人看得到，列印不印。

**儲存與 API**（牌桌 `worker/profiles.ts`，e1-t09／e1-t10；橋譜的 client 在 `lib/api.ts` 的 `api.book.profiles` 等）：

| 呼叫 | 路由 | 權限 |
| --- | --- | --- |
| `profiles()` | `GET /api/book/profiles` → `ProfileSummary[]`（不含內容，只有 `counts`；`club` 在前） | 社員，只列看得到的（下面成員權限）；未登入只回 `club` |
| `profile(id)`、`profileWithAccess(id)` | `GET /api/book/profiles/:id` → `{ profile, access }`（`access`：`notes`、`edit`、`share`，自己能做什麼） | 看得到的社員（看不到 403 `noPermission`）；未登入只能讀 `club`，且不含 `notes` |
| `createProfile(input, note?)` | `POST /api/book/profiles`，id 由 Worker 產生 | bookEdit |
| `saveProfile(id, input, baseVersion, note?)` | `PUT /api/book/profiles/:id`；`baseVersion` 不符 409 `profileConflict` | 能編輯的人（下面） |
| `deleteProfile(id, baseVersion)` | `DELETE /api/book/profiles/:id`；`club` 403 `profileProtected`，有子制度集 409 `profileInUse` | bookEdit |
| `profileRevisions(id)`、`profileRevision(id, version)` | `GET /api/book/profiles/:id/revisions[/:version]` | bookEdit；隊伍或搭檔的成員 |

- `ProfileInput` 只有可編輯的欄位（`name`、`scope`、`parentId`、`visibility`、`adopted`、`overrides`、`notes`）；id、版本、`updatedAt`、`updatedBy`（使用者 id）由 Worker 填。`club` 沒存過時是空的、版本 0，第一次存 `baseVersion` 給 0。
- 層次：隊伍繼承 `club`，搭檔繼承 `club` 或隊伍；不給 `parentId` 就是 `club`。有搭檔繼承的隊伍不能刪，也不能改成搭檔。
- 上限 `PROFILE_LIMITS`（兩邊一致）：JSON 200,000 bytes（UTF-8，413 `contentTooLarge`）、覆寫 500 條、`club` 以外 100 個、名稱 40 字、每則備忘 2,000 字。Worker 只檢查形狀（整段覆寫的段落用跟特約一樣的檢查），覆寫指到的段落或列不存在由 `resolveProfile` 回報。
- **成員權限**（e2-t04、e2-t10，AC-2.3；C3，牌桌 `worker/roles.ts` 的 `profileAccess`，Worker 每次都查，前端只決定顯示）：編輯者（`bookEdit`）與管理員什麼都能做。`club`：社員都能讀、看備忘，只有編輯者能存。隊伍的：隊長能存、改可見範圍；隊長打開 `ClubTeam.membersEdit`（「隊員可編輯制度集」）後隊員也能存，但不能改可見範圍；封存後唯讀。搭檔的：兩人都能存、改可見範圍，結束後唯讀。成員才看得到備忘與版本紀錄。`visibility: 'members'` 的只有成員（與編輯者）讀得到，母制度集讀不到時子制度集也讀不到；不是成員的人看到的 `notes` 是空的、`counts.notes` 是 0。編輯者以外的人存檔時不能改 `scope`、`parentId`。沒有隊伍或搭檔擁有的制度集（編輯者手動建的）只有編輯者能改。未登入的讀者照 PRD 不抓這支 API（只有 `club`）。

**隊伍與搭檔**（E2，`api.club`；型別 `ClubTeam`、`Partnership`、`TEAM_LIMITS` 對應牌桌 `shared/protocol.ts`，`parity/table-types.ts` 檢查，路由 `tests/lib/teamApi.test.ts`）：

| 呼叫 | 路由 | 誰能用 |
| --- | --- | --- |
| `members()` | `GET /api/club/members` → `ClubMember[]`（id 與帳號名稱，依名稱）；選隊員、邀搭檔用 | 社員 |
| `teams()`、`team(id)` | `GET /api/club/teams[/:id]`；單一隊伍連同它現役的搭檔 `{ team, pairs }` | 社員 |
| `createTeam(input)` | `POST /api/club/teams`；同時開隊伍的制度集（繼承 `club`） | bookEdit |
| `updateTeam(id, patch)` | `PATCH /api/club/teams/:id`：改名、換隊長、開放隊員編輯制度集（`membersEdit`）、封存（封存後只能取消封存） | 隊長／bookEdit |
| `addMember`、`removeMember` | `POST /api/club/teams/:id/members`、`DELETE …/members/:userId` | 隊長／bookEdit；本人可退出（隊長不行） |
| `pairs()`、`pair(id)` | `GET /api/club/pairs[/:id]`；`pairs()` 是自己的（含已結束） | 社員 |
| `invite({ partnerId, teamId? })` | `POST /api/club/pairs`，通知對方 | 社員 |
| `accept`、`decline`、`end` | `POST /api/club/pairs/:id/accept|decline|end`；接受時開搭檔的制度集（繼承隊伍或 `club`），結束後制度集保留 | 受邀者；`end` 兩人之一 |

- 上限 `TEAM_LIMITS`：一隊 8 人（409 `teamFull`）、每人等回覆加現役的搭檔 10 個（409 `pairLimit`）、隊名 40 字；同兩人同隊伍不能重複（409 `pairExists`）。邀請到接受之前 `profileId` 是空字串。
- 搭檔通知（`pairInvited` 等）在牌桌的鈴鐺，連到這裡的 `/pairs/:id`（C4 做頁面）。
- 管理頁的「隊伍」面板（`components/admin/TeamsPanel.tsx`，e2-t07，在 lazy 的管理頁裡）：編輯者看全部隊伍，建立隊伍、換隊長、加減隊員、開關「隊員可編輯制度集」、封存，展開看各隊現役搭檔。隊長自己的隊伍頁是 C4。

**填制度卡**（`src/cards/fill.ts`，純函式，`tests/cards/fill.test.ts`）：`fillCard(template, resolveProfile(...) 的結果, edits?)` 回傳 `{ cells, notes, problems }`。

- 來源：制度集採用的特約的 `cardSlots`（不採用就不填；覆寫過的列與段落填覆寫後的文字），再疊上人工補格 `edits`（之後存 `profile.cardEdits`，e3-t06）。每格帶 `sources`（特約、那一條 `cardSlots`、段落 id，給「§」連回）與 `origin`（覆寫或人工補格的那層；沒有就是橋譜原文）、`pending`（原文有待確認）。
- 濃縮：叫品表成 `叫品=意義`，一行的格子用「; 」相連、多行的格子一條一行。格子能放多少字由版型的 `printWidth`（pt）、`fontSize` 與欄寬估算（中日韓文與花色算兩個半形字）；放不下就從最長的那條起改成「名稱 [Note n]」（名稱也放不下就只寫 `[Note n]`），全文進 `notes`（附頁），編號照列印順序。還是放不下的格子標 `overflow`。
- 壞的對應不靜默消失：讀不懂、格子不存在、出處找不到、選項不存在、人工補格指到不存在的格子，都放進 `problems`。
- `ctcba-simple-2p` 的 `sameSlotsAs: 'ctcba-simple'`：寫給單面卡的 `cardSlots` 也填雙面卡。

## 4. 路由、狀態與內容載入

**路由**（`react-router-dom`，BrowserRouter）

| 路徑 | 行為 |
| --- | --- |
| `/` | 首頁 `HomePage`：簡介、「看全書目錄」、各分類的特約連結；不載入任何特約內容（完整首頁是 e9-t08） |
| `/book` | 全書目錄 `BookPage`：整本一頁，全部特約皆收合（拆頁前的手冊）；閱讀設定的「印整本」先載入全部再列印 |
| `/c/:slug` | 特約頁 `ConventionPage`：只有這個特約，展開並捲動到它；上方有回全書目錄的位置列 |
| `/c/:slug/:sectionId` | 同上，再展開該段落的所有祖先段落，捲動並聚焦到段落標題；`?pending=k` 跳到該段的第 k 個待確認 |
| `/login` | 登入、註冊、忘記密碼；`?next=` 登入後回到原頁 |
| `/account` | 我的帳號：權限、頭像、顯示（個人設定）、修改密碼 |
| `/settings` | 個人設定（e9-t15，lazy）：風格、版面、明暗、字體、字級、花色顏色、密度 |
| `/admin` | 社團管理（bookEdit）：帳號面板（待審核的申請、橋譜權限、重設密碼、邀請碼與人數上限）只給管理員；其他面板（分類、隊伍）編輯者也看得到（§4.2） |
| `/edit/:slug`、`/new` | 線上編輯器（bookEdit）；`?draft=<id>&n=<i>` 打開匯入草稿的第 i 個特約 |
| `/import` | 匯入檔案（bookImport） |
| `/integrations/table` | 牌桌整合（bookEdit）：同步制度集到牌桌機器人、差異報告（§4.7） |
| 其他 | 顯示首頁並提示；找不到的 slug 也是首頁加提示，找不到的段落在特約頁提示 |

管理、編輯、匯入三頁用 `React.lazy` 分開打包，讀者不會下載。

**閱讀頁拆頁**（e9-t04，2026-10-26）：`/`、`/book`、`/c/*` 是同一個版面路由 `HandbookShell`（`pages/HandbookShell.tsx`，包在 `ProfiledContent` 裡）的子路由：頁首、目錄、主欄留在畫面上，換頁時目錄的展開狀態不會重設，頁面本身在 `<Outlet>`。`ConventionPage`、`BookPage` 用 `React.lazy` 載入，所以卡片、段落、叫牌表的程式不在首頁的 bundle 裡。每頁頂端的 `PageBar` 放位置列與「閱讀設定」按鈕，頁面以 props 告訴面板能不能展開、收合、列印。個人設定的「版面」（e9-t15）由這一層與頁面決定：整本一頁（預設）＝目錄在左、≥ 1100px 特約頁有右欄「本頁」；三欄閱讀＝900px 起就有右欄；專注單欄＝桌機不顯示目錄、主欄置中；卡片總覽＝桌機不顯示目錄，首頁 `/` 換成 lazy 的 `CardOverview`（分類頁籤、磁貼、右側預覽）。手機一律單欄＋底部工具列。

**狀態**

- `ExpansionContext`：一個 `Set<string>` 記錄所有打開的項目（特約 key 為 `slug`，段落為 `slug/sectionId`）。每一層 Radix Accordion 以 `openAmong(keys)` 取得 value、以 `setLevel(keys, open)` 回寫。全部展開／收合與深層連結因此能控制不屬於它們的收合元件。
- `PreferencesContext`：個人設定（e9-t15）——主題（跟隨系統／淺／深，`themeChoice`；`mode` 是實際生效的淺或深，跟隨時監聽 `prefers-color-scheme`，夜讀風格跟隨時一律深色；舊版存的 `mode` 讀成固定選擇）、風格、版面、字體、字級（小／中／大／特大，`GlobalStyle` 依此設定根字級）、花色顏色（四色／雙色）、密度（舒適／緊湊），存在 localStorage `tku-bridgebook:prefs`（失敗時忽略；`readStoredPrefs` 逐欄檢查，未知值退回預設）。還沒存帳號（要牌桌 API 加欄位）。風格 token 除了「一般」都在 `styles/themes/` 各自一個 chunk，`loadStyle()` 選到才下載，沒載到前顯示「一般」；`main.tsx` 在第一次渲染前先載入存好的風格。
- `useMediaQuery(mobileQuery)`：決定制度集下拉放在頁首（桌機）或目錄抽屜（手機），同一時間只渲染一組。
- 不使用狀態管理函式庫；兩個 Context 就夠了。

**內容載入**（2026-10 起，E10 分片）：
- `content/manifest.ts` 是 `npm run manifest`（`scripts/build-manifest.ts`）產生的清單：每個特約除了內容以外的全部欄位，加上段落大綱（`outline`：id、標題、子段落）與待確認清單（`pending`），型別 `ConventionMeta`。目錄、收合的卡片、深層連結、全部展開都只用它。`tests/content/manifest.test.ts` 確認它和 `content/index.ts` 一致。
- `content/loaders.ts` 用 `import.meta.glob` 把每個 `conventions/<slug>.ts` 打成獨立 chunk，`loadBundled(slug)` 按需下載。檔名必須等於 slug。
- `content/index.ts` 仍然靜態 import 全部特約，但**只給測試與 manifest 腳本用**；網站程式不能 import 它（否則全部內容會回到首頁的 bundle，效能預算會擋下來）。`categories`、`references` 直接從各自的檔案 import。
- 卡片第一次打開時用 `useConvention(slug)` 載入內容；載入中顯示「載入中…」，失敗顯示重試。深層連結會先打開路徑，等內容到了再捲動。
- 搜尋：聚焦搜尋框時下載 Fuse 與建置時產生的搜尋索引 `/search-index.json`（`state/useSearch.ts`），不必載入任何特約內容就是全文搜尋。線上改過或新增的特約不用索引裡的紀錄：先用 manifest 的段落標題，再載入那幾個特約的內容補上全文（`lib/search.ts` 的 `mergeIndex`，維持目錄順序，結果與用全部內容建的相同）。索引抓不到（離線又沒快取）時退回舊做法：載入全部內容在瀏覽器建紀錄。列印按鈕先載入全部再列印（直接按 Ctrl+P 只印出已載入的特約）。
- 線上的修改見 §4.1。

### 4.1 線上修改的內容（`ContentContext`、`lib/content.ts`）

- 每個特約在伺服器最多一筆「線上版本」（`BookEntry`）：取代同 slug 的內建特約、新增一個特約，或 `convention: null` 隱藏它。
- 開頁面時先顯示內建 manifest（或這台裝置上次看到的線上 manifest，存在 localStorage），再抓 `GET /api/book/manifest`（每筆線上版本不含內容，`meta` 是牌桌 Worker 算好的 `ConventionMeta`，隱藏的為 `null`；`categories` 是線上的分類，見 §4.5；`ETag`）。`mergeManifest` 依內建順序替換，新增的排在後面（依建立時間）；抓不到就維持現狀並顯示離線提示。
- 線上改過的特約，打開時抓 `GET /api/book/content/:slug`（`ETag`；沒有線上版本回 404），用 `onlineConvention`（`conventionProblems`）檢查形狀，壞掉的略過並列入提示，不會讓頁面掛掉。載入的內容以 `slug@版本` 存在 `ContentContext`，線上版本更新後自然換新。
- 舊的 `GET /api/book/content`（整本一次）牌桌仍保留給舊版前端，這裡已不使用。Service worker 對這兩支 API 走「先網路、離線用快取」，其他 `/api` 一律不快取。
- 這兩支 API 的型別在 `lib/api.ts`（`BookManifest`、`BookEntrySummary`），對應牌桌 `worker/book.ts`；`pending` 的走訪順序必須和 `lib/sections.ts` 的 `pendingNotes` 一致。
- **線上版本優先**：某個特約在網站上改過之後，再改它的 `.ts` 檔不會顯示出來，要在編輯器的版本紀錄按「還原為網站內建的版本」，或把線上內容寫回 `.ts` 檔後再還原。`BookEntry.bundledUpdated` 記著第一次線上修改時內建版本的 `updated` 日期。

### 4.2 帳號與權限（`AuthContext`、`lib/api.ts`）

帳號在淡江牌桌（`TKU-BridgeTable` ARCHITECTURE.md §5.2）：註冊送出申請、管理員核准；忘記密碼用帳號＋邀請碼重設（管理員除外）。`Me.permissions`：`bookEdit`（線上編輯）、`bookImport`（匯入檔案），管理員兩者都有。閱讀不需要登入。`api.ts` 的型別要和牌桌的 `shared/protocol.ts`、`worker/book.ts` 一致。

**角色**（使用者決定，2026-10-25；名稱暫時沿用）：**管理員**什麼都能管，包括使用者帳號；**編輯者**（有 `bookEdit`）能管帳號以外的所有東西。

| 功能 | 社員 | 編輯者 | 管理員 |
| --- | --- | --- | --- |
| 閱讀；登入後讀制度集 | ✓ | ✓ | ✓ |
| 編輯、還原特約，版本紀錄 | | ✓ | ✓ |
| 隱藏特約（原本只限管理員） | | ✓ | ✓ |
| 分類、制度集（新增、儲存、刪除、版本） | | ✓ | ✓ |
| 自己隊伍或搭檔的制度集（儲存、版本；成員權限見 §3.1「成員權限」，e2-t04） | 隊長；隊員要隊長開放；搭檔兩人 | ✓ | ✓ |
| `/admin` 的非帳號面板（「分類」「隊伍」） | | ✓ | ✓ |
| 關閉卡住的牌桌（牌桌 API；牌桌管理頁畫面仍只給管理員） | | ✓ | ✓ |
| 帳號：申請核准、新增／刪除、重設密碼、管理員身分、權限、社團設定（人數上限、邀請碼） | | | ✓ |
| AI 匯入（`bookImport`） | 個別勾選 | 個別勾選 | ✓ |

- 牌桌的 `worker/roles.ts` 決定每條 API 要什麼（`bookRouteNeed`、`adminRouteNeed`），`tests/worker/roles.test.ts` 逐條列出。
- 橋譜：`/admin` 給 `bookEdit` 進（`Gate need="bookEdit"`）。帳號面板（申請、社員、社團設定、到牌桌管理頁的連結）只有管理員看得到，也只有管理員才會呼叫 `/api/admin/*`；其他面板編輯者都看得到。帳號選單的「社團管理」對編輯者也顯示。編輯器的「從橋譜隱藏這個特約」編輯者也有。
- **新增管理功能時**：不是帳號相關的，就開給編輯者（Worker 用 `bookEdit`、`/admin` 放在帳號面板外面）。

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

**搜尋**：`lib/search.ts` 為每個特約與每個段落各建一筆紀錄（名稱、別名、標籤、叫品、內文），以 Fuse.js 搜尋（`ignoreLocation`、threshold 0.3）。內建特約的紀錄在建置時算好：`scripts/search-index.ts` 產生 `{ version, records }`，`vite.config.ts` 的 `searchIndex` plugin 在 build 時寫進 `dist/search-index.json`、dev server 則每次請求用目前內容現算，所以索引不會過期、也不 commit。之後的文章與名詞加成同一份 records 即可。所有文字與查詢都先經過 `toAsciiSuits`，因此「2♦」與「2D」結果相同。

**列印**：Accordion Content 一律 `forceMount`，關閉時以 CSS（`[data-state='closed']`）隱藏；列印樣式覆寫成全部顯示。列印 v2（e9-t10）在 `components/PrintSheet.tsx`，只有特約頁與全書目錄掛上（都是 lazy，不進首頁）：一段 `<style media="print">`（不經 styled-components，因為它的 CSS 解析器不保留 `@page` 裡的 `@top-left` 頁邊框）設 A4、頁尾頁碼、黑白（顏色來自 `tokens.ts` 的 `printColors`），特約頁加頁眉。印整本時每個特約是一個具名頁面（`@page c0 { @top-left { content: "淡江橋館 · 名稱" } }`，以 `[id="c-<slug>"]` 指定），分類標題併入它的第一個特約；封面與目錄是 `hidden` 的區塊（螢幕與報讀器都看不到），列印時以 `[data-print-only]` 顯示，所在的 `front` 頁不印頁碼。

### 4.5 分類（`lib/categories.ts`、`components/admin/CategoriesPanel.tsx`）

- 分類是資料：`Category { id, label, description, order }`，`id` 小寫英數與連字號、建立後不變（特約的 `category` 指向它），`CategoryId` 因此是 `string`。內建的一份在 `content/categories.ts`，離線、未登入、牌桌沒回應、或從沒在線上改過時就用它。
- 線上的一份存在牌桌 Worker（每個分類一筆 `book:category:<id>`），跟著 `GET /api/book/manifest` 的 `categories` 一起來，所以 localStorage 的 manifest 快取與 service worker 的「先網路、離線用快取」都涵蓋它；空清單或沒有這個欄位（舊 Worker）＝用內建的。
- `ContentContext` 用 `resolveCategories` 算出 `categories`：有線上清單就照它的 `order`，沒有就用內建；線上清單沒列、但還有特約在裡面的內建分類（例如線上改過之後才在 repo 加的）接在最後，特約不會從目錄消失。驗證特約時接受線上與內建兩份的 id（`knownCategoryIds`）。側邊欄、首頁、編輯器的分類選單、匯入送給 AI 的分類都讀這一份。
- 管理：`/admin` 的「分類」面板（bookEdit；跟著管理頁 lazy 載入，不進首頁 bundle）。改名、上下移、新增（代號自動產生 `c-<時間>`）、刪除，按「儲存分類」一次 `PUT /api/book/categories` `{ categories, baseVersion }` 整份取代。有特約（目前目錄裡的，含內建；隱藏的不算）的分類刪除鈕停用；Worker 另外擋還有線上特約的分類（409 `categoryInUse`），因為它只知道線上的特約。別人先存了回 409 `categoryConflict`，按「重新載入」拿對方的版本。存檔後重抓 manifest。
- 型別 `BookCategory`、`BookCategories` 在 `lib/api.ts`，對應牌桌 `worker/book.ts`；上限（20 個、名稱 40 字、說明 200 字）兩邊一致。

### 4.6 個人檔案、頭像與圖片檔案（`lib/account.ts`、`components/Avatar.tsx`、`lib/imageUpload.ts`，E11 G1）

- **都在牌桌 Worker**，兩站共用。個人檔案是 `Me.profile`（`displayName`、`level`、`system`、`bio`，`PATCH /api/account/profile`），牌桌 e1-t15 已做好，橋譜只加型別與呼叫；編輯畫面是 G2（e11-t04）。
- **頭像**：`Me.avatar`／`ClubMember.avatar` 是版本號，圖片在 `GET /api/avatar/:id?v=<版本>`（牌桌 `avatar:<id>`，瀏覽器裁好的 256×256、≤ 64 KB）。PRD 原寫 512×512 放 R2；牌桌已有這一套（e1-t34），兩站讀同一張，所以沿用。沒有圖片就用字首＋由 id 決定的顏色（`lib/avatar.ts`，和牌桌同一套 FNV 雜湊與十個顏色 `styles/avatarColors.ts`），同一個人在兩站顏色相同。`Avatar` 是裝飾（`aria-hidden`），名字一定在旁邊。「我的帳號」可上傳（`AvatarCropper` 就地裁切）或改回預設。`GET /api/club/members` 多回 `displayName`、`avatar`，給之後的討論區與隊伍頁畫別人的頭像。
- **圖片檔案**（貼文與文章用）：R2 bucket `bridgebook-files`（牌桌 `worker/files.ts`，ARCHITECTURE.md §5.14）。`uploadImage(file, purpose)` 在瀏覽器縮到長邊 2048 px（≤ 2 MB）與 480 px 縮圖（≤ 256 KB），拿一次性憑證（`POST /api/files/ticket`，每人每天 30 張）、`PUT` 原圖與縮圖；顯示用簽名短效網址 `/api/files/<key>?e=&s=`（一小時，不用登入），過期用 `POST /api/files/urls` 重簽。**bucket 還沒建時**牌桌回 503 `filesOff`（牌桌 DEPLOY.md §4.8）。
- **不進首頁**：這些型別與呼叫在 `lib/account.ts`，不在 `api.ts`；介面文字在 `strings-account.ts`，不在 `strings.ts`（首頁 JS 預算只剩 1 kB 左右）；只有 lazy 的頁面 import 它們。型別對拍在 `parity/table-types.ts`（牌桌 `shared/profile.ts`、`avatar.ts`、`files.ts`）。

### 4.7 牌桌整合（`pages/TableReportPage.tsx`、`lib/specReport.ts`、`lib/tableSync.ts`，E7 e7-t03 e7-t04）

- `/integrations/table`（bookEdit，lazy；管理頁有連結）：選一個制度集，頁面用社團版內容（內建＋線上，不經過 `ProfiledContent`）與該制度集的繼承鏈（`summaryChain`＋`resolveProfile`）算出套用後的特約，再用 `toSystemSpec`（`lib/systemSpec.ts`，牌桌 `shared/systemSpec.ts` 的逐字複本，`docs/SYSTEM-SPEC.md`）轉成規則。
- **同步**：「重新同步到牌桌」把轉好的 `SystemSpec` 整份送 `PUT /api/book/system-spec/:profileId`，牌桌存起來；`GET /api/book/system-spec?profileId=` 回最後同步的那份、時間與同步者，頁面比對現在轉出來的是否相同（「內容在同步之後改過」）。轉換在瀏覽器做，因為內建特約只在橋館的 bundle，且 22 個特約的轉換超過 Worker 免費方案一次請求的 CPU。
- **牌桌載入**：TKB 用淡江制度時，叫牌仍照牌桌已驗證的規則；叫出的叫品若在牌桌設定的制度集（`SYSTEM_PROFILE_ID`，預設 `club`）有同一叫牌過程、同一叫品的規則，叫品說明附上那列的原文（牌桌 `AuctionCall.book`，牌桌 ROBOT.md「橋館的文字跟著叫品」）。
- **差異報告**：每個叫牌過程（`meaningQueries`）分批問 `POST /api/book/robot-meanings`（一次 10 個，`SYSTEM_SPEC_LIMITS`），`compareSpec` 列出牌桌規則讀法不同（只比原文寫到的點力、張數、平均、迫叫、特約名；開放上限一律視為相同）與牌桌沒有規則的叫品；`unresolvedByReason` 依原因列出轉不出來的列。頁面只呈現轉換結果，不改任何內容。
- 型別（`SyncedSystemSpec`、`SystemSpecStatus`、`RobotMeaningsQuery`、`RobotShows` …）在 `lib/api.ts`，呼叫與上限在 `lib/tableSync.ts`、頁面文字在 `pages/tableReportStrings.ts`（都不進首頁 bundle）；對拍在 `parity/table-types.ts`。

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
  - `tests/lib`：叫品格式化、搜尋結果（經由索引，並比對與全部內容的結果相同）、service worker（`sw.test.ts`，在假的 worker scope 執行 `public/sw.js`）與新版本提示。
  - `tests/presentation`：卡片展開、深層連結開啟路徑、全部展開／收合、待確認顯示。
- **手機 App（PWA）**：`public/manifest.webmanifest`（名稱「淡江橋館」、全螢幕、圖示）、`public/sw.js`（service worker：頁面優先走網路、離線時用快取；`/assets/` 檔名含雜湊，走快取）、`src/lib/pwa.ts`（只在正式版註冊 service worker，保留瀏覽器的安裝邀請給「安裝 App」按鈕）。`vercel.json` 讓 `sw.js` 不被快取。v2 策略（e10-t05）：安裝時存下 app shell、首頁的建置檔（從 `index.html` 解析）、搜尋索引與線上 manifest，所以看過一次之後離線也能開、能搜；特約 chunk 看過才快取；線上內容與搜尋索引網路優先、離線用快取。`vite.config.ts` 的 `stampServiceWorker` 把建置雜湊寫進 `dist/sw.js`，每次建置都是新的 worker：新版本在背景裝好後等待，頁面顯示「有新版本可以使用」（`UpdatePrompt`、`lib/pwa.ts` 的 `watchForUpdates`／`useUpdate`），按「重新整理」才接手並重新載入；頁面回到前景時會檢查更新。快取名稱跨版本不變（`tku-bridge-book-v4`），看過的特約更新後仍可離線看；只有快取格式改變時才把 `CACHE` 加版號。制度集與制度卡的 API 出現後（A6、D3）加進網路優先的清單。
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
          └─► Vercel Git integration：PR → 預覽網址（PR 留言會附上）；main → 正式站
合併到 main ──► 正式站（自動）
                 └─ 部署成功回報 commit status「Vercel」
                       └─► GitHub Actions「Production smoke test」（只在 main）
                             1. 等正式站 <meta name="app-version"> 等於這次 commit SHA
                             2. 檢查首頁、深層連結、logo/favicon、所有 /assets 檔案回 200
```

- 正式站：https://tku-bridge-hall.vercel.app/
- **合併到 `main` 就自動部署正式站**（2026-10-25 起；之前 PR #9 曾關掉）。所以合併前要 CI 全綠、看過預覽站。要暫停自動上線，在 `vercel.json` 加回 `"git": { "deploymentEnabled": { "main": false } }`。牽涉牌桌 API 的變更：牌桌 PR 先合併，等牌桌的 Deploy workflow 完成，再合併橋譜。上線後 Production smoke test 會自動跑（下面）。
- `app-version` 由 `vite.config.ts` 的 `appVersion` plugin 寫入，取自 Vercel 的 `VERCEL_GIT_COMMIT_SHA`；本機 build 為 `local`。
- 手動跑部署檢查：GitHub → Actions → Production smoke test → Run workflow。
- Dependabot 每月開一個合併的依賴更新 PR（npm 與 GitHub Actions），CI 綠燈且預覽站正常再合併。
- **與淡江牌桌的型別對拍**（e10-t09，CLAUDE.md 第 10 條）：workflow「Table type parity」（`.github/workflows/table-parity.yml`，每次 push、PR、每天台灣 06:00，也可以手動指定牌桌的分支）把牌桌 `main` checkout 到 `.table/`，跑 `npm run parity`（`scripts/check-table-parity.mjs`）：
  1. 用 `@table/*` 指向牌桌，型別檢查 `parity/table-types.ts`。`lib/api.ts` 對應牌桌 `shared/protocol.ts`、`worker/book.ts` 的每個型別在這裡各有一行：`Same`（兩邊完全相同）或 `Reads`（牌桌送來的資料可以當成橋譜的型別讀，而且橋譜沒有牌桌沒有的欄位）；刻意的差異（橋譜只認得 `book*` 權限、`convention` 是 `unknown`、制度集被取代的段落是 `Section`）寫在該行旁邊。只算這個檔的錯誤；牌桌自己的檔由牌桌 CI 檢查。
  2. 跑 `tests/lib/tableParity.test.ts`，比對共用的常數（`LIMITS`、`PERMISSIONS`、制度集常數）；平常的 `npm test` 沒有 `TABLE_DIR` 時整組略過。
  - 牌桌是 private repo，要在橋譜 repo 設 secret **`TABLE_REPO_TOKEN`**（fine-grained token，只給 `GeneCLee6/TKU-BridgeTable` 的 Contents: Read）；沒設時 job 以 notice 略過，不會失敗。本機：`npm run parity` 依序找 `$TABLE_DIR`、`.table/`、`../TKU-BridgeTable`，都沒有就略過。
  - 兩邊一起改的 PR：牌桌先合併，橋譜的 parity 才會綠；也可以 Actions → Table type parity → Run workflow，填牌桌的分支。lib/api.ts 新增對應牌桌的型別時，在 `parity/table-types.ts` 加一行。
- **備份**：牌桌 Worker 每天把橋譜的線上內容（`book*`、`profile*`、`article*`）備份到 R2、保留 30 天（e10-t08）；啟用、還原步驟與演練見牌桌的 [`DEPLOY.md` §4.3](https://github.com/GeneCLee6/TKU-BridgeTable/blob/main/DEPLOY.md#43-每日備份與還原淡江橋譜-e10-t08)。
- 限制：私有 repo 在 GitHub 免費方案無法設定 branch protection，所以 CI 失敗不會擋住合併；請以「開 PR → CI 綠燈 → 看預覽站 → 合併 → 手動部署」的流程更新內容。
