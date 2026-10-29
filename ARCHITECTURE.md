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
│  ├─ types/convention.ts   內容模型（特約的 schema）；types/article.ts 叢書文章（E5，§3.2）
│  ├─ cards/                制度卡（E3）：types（CardTemplate）、slots（格子 id）、templates/（每個版型一個檔案，檔名＝id）、
│  │                        cardSlots（特約的格子對應）、fill（fillCard 填卡）、edits（補格）、docx（Word 輸出，`docx` 套件）、
│  │                        places（段落在卡上的位置）、bsc（棕標申報表）、load（讀制度集）、PrintStyle；網站程式只能 lazy 載入（placesContext 除外）
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
  | { kind: 'intro'; why?: string; when?: string; pitfalls?: string[] } // 導讀（e4-t04），社團撰寫

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
  brownSticker?: 'opening' | 'overcall'  // 棕標開叫／蓋叫（e3-t12）：制度卡頁多一張這個特約的申報表；牌桌 worker/book.ts 同名欄位
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
- **編輯頁**（`pages/ProfileEditorPage.tsx`，e1-t14，lazy；純函式在 `lib/profileEdit.ts`，字串 `pages/profileEditStrings.ts`）：讀 `profileWithAccess`，`access.edit` 為否時全部唯讀。編輯的對象是**母制度集解析後的特約**（社團版原文套上母層覆寫，但不濾掉母層不採用的），所以叫品列的位置和解析時一致；這一層換掉的段落，挑列時用換掉後的版本。採用是三選一（跟隨母制度集／採用／不採用）；叫品列的備註欄預設填原備註，不動就不送 `note`、清空送 `''`；「換成…」用編輯器的 `SectionForm`（`replacing` 隱藏搬移、新增、刪除與 id）。整份 `ProfileInput` 一次存，帶載入時的 `baseVersion`，409 時停用儲存、提示重新載入，不覆蓋別人的版本；超過 `PROFILE_LIMITS` 先擋。摘要／標籤覆寫沒有畫面，存檔時保留原有的。入口是管理頁的「制度集」面板（`components/admin/ProfilesPanel.tsx`）。
- **比較頁**（`pages/ProfileComparePage.tsx`，e1-t15，lazy；`lib/profileCompare.ts`，字串 `pages/profileCompareStrings.ts`）：載入全部特約與整條鏈，「原文」是母制度集解析後的樣子，只列這一層自己的改動（上層的改動在上層自己的比較頁）；不採用的特約上的覆寫仍列出並註明目前無作用；`problems` 中屬於這一層的（失效覆寫、備忘、採用）與鏈的問題都列出。「到該段」連 `/c/:slug/:sectionId`，那裡顯示的是讀者目前的制度集。
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

- 來源：制度集採用的特約的 `cardSlots`（不採用就不填；覆寫過的列與段落填覆寫後的文字），再疊上人工補格 `edits`（存在 `profile.cardEdits`，e3-t06）。每格帶 `sources`（特約、那一條 `cardSlots`、段落 id，給「§」連回）與 `origin`（覆寫或人工補格的那層；沒有就是橋譜原文）、`pending`（原文有待確認）。
- 濃縮：叫品表成 `叫品=意義`，一行的格子用「; 」相連、多行的格子一條一行。格子能放多少字由版型的 `printWidth`（pt）、`fontSize` 與欄寬估算（中日韓文與花色算兩個半形字）；放不下就從最長的那條起改成「名稱 [Note n]」（名稱也放不下就只寫 `[Note n]`），全文進 `notes`（附頁），編號照列印順序。還是放不下的格子標 `overflow`。
- 壞的對應不靜默消失：讀不懂、格子不存在、出處找不到、選項不存在、人工補格指到不存在的格子，都放進 `problems`。
- `ctcba-simple-2p` 的 `sameSlotsAs: 'ctcba-simple'`：寫給單面卡的 `cardSlots` 也填雙面卡。

**制度卡頁**（`/cards/:profileId/:templateId`，D3，lazy；`pages/CardPage.tsx`、字串 `pages/cardStrings.ts`）：讀制度集與上層（同比較頁），用 `cards/edits.ts` 的 `fillProfileCard` 填卡——人工補格 `SystemProfile.cardEdits`（格子 id → `ProfileCardEdit`，型別與牌桌 `shared/protocol.ts` 對拍）沿制度集繼承：社團→隊伍→搭檔，近的那層整格蓋過遠的，重設＝刪掉這層的補格；雙面簡易卡的補格存在單面卡的格子 id 下（兩張共用）。`cards/CardSheet.tsx` 照版型的點數寬度與字級畫卡（顏色只用 `tokens.ts` 的 `cardColors`，任何風格與深色模式都是白紙黑線），每格是按鈕（hover 顯示 Guide 說明、點了在右欄看來源與補格），右上「§」連回段落；隊伍／搭檔層的內容淡色底，列印改底線。存檔送整份制度集（`toInput` 帶著 `cardEdits`，所以制度集編輯器存檔也不會清掉補格）＋`baseVersion`，409 要重新載入；要 `access.edit` 且看得到備忘才能補。列印：`<style media="print">` 設 A4 橫式、每頁一張、附頁另起，`nUp` 的其他份只在列印時畫出；「下載 PDF」＝瀏覽器列印。連不到 Worker 時社團的卡用內建內容、唯讀。

**制度卡的輸出、版本與位置**（D4，`e3-t08`～`t11`）：
- **Word**（`cards/docx.ts`，只能動態 `import()`；`docx` 套件約 425 kB，獨立 chunk）：`cardDocument(template, card, { font, title, notesTitle })` 把版型重建成表格——欄寬、列高全用 twips 固定（`tblLayout fixed`，沒有 auto），每個版型頁一節（A4、邊界同列印），`nUp` 的版型並排 n 份，最後一節是補充說明。列高是 `EXACT`：卡面跟紙本一樣不會長高、不會跨頁，比格子長的字在 Word 會被截掉。字型 `CARD_FONTS`：Arial 或 Gill Sans MT（只給 WBF 卡選），中文微軟正黑體，勾選框用 Segoe UI Symbol。卡頁、版本頁的「下載 Word」都在瀏覽器產生（`pages/cardOutput.ts` 的 `makeDocx`）。
- **版本與分享**（`lib/cardApi.ts`，不進首頁；型別 `CardSnapshotMeta`／`CardSnapshot`／`CardSnapshotInput`／`CARD_SNAPSHOT_LIMITS` 在 `api.ts`，與牌桌對拍）：`GET /api/book/cards/:profileId` 列表；`POST` 發布（能編輯制度集的人；送 `FilledCard` 原樣＋Word 檔 base64）；`GET …/:templateId/:n[/docx]`；`PATCH …/:n { shared }`（有 `share` 的人）；`DELETE …/:n`。分享中的版本 Worker 在登入檢查之前就回。卡頁的「版本與分享」（`pages/CardOutputs.tsx` 的 `CardVersions`）有未存的補格時不給發布。版本頁用當下的版型畫快照的格子；版型後來改過、有對不上的格子時會提示以當時的 Word 檔為準。
- **段落旁的位置**（`cards/placesContext.tsx`、`cards/places.ts`、`cards/CardPlaces.tsx`）：特約頁用 `CardPlacesContext` 提供 `cardSlots` 與讀者的制度集 id，`SectionAccordion` 每段放 `SectionCardPlaces`；`mentions` 先用字串判斷有沒有 `<- 段落` 的引用，有才 lazy 載入版型算格子名稱。整本一頁、列印沒有 provider，不顯示。雙面簡易卡共用單面卡的格子，只列單面卡。
- **棕標申報表**（D5，`e3-t12`，`cards/bsc.ts`）：版型 `bsc-opening`、`bsc-overcall`（`CardTemplate.brownSticker`，A4 直式，照 CTCBA 的 WBF BSC .docx 格線）不是每個制度集都有的卡（`profileTemplates` 不含它們），而是制度集採用的特約裡每個標了 `Convention.brownSticker` 的一張：`/cards/:profileId/bsc-opening/:form`（`form`＝特約 slug），分頁接在三張卡後面。`fillProfileCard(template, resolution, own, form)` 先用 `formResolution` 把制度集縮成那一個特約（特約沒寫這張表的格子時補 `description <- *`），所以別的特約的位置不會進來。補格存在 `bsc-opening.<slug>.<格子>`（`editPrefix(template, form)`），兩個同類棕標特約不互相蓋。申報表沒有版本與分享（快照以 templateId 為鍵）；有 Systems Policy 的連結（中華橋協下載專區）。`text` 格可有 `suffix`（蓋叫表「at ___ vulnerability」）。段落旁的位置只在特約標了對應的棕標時列出表上的格子。全隊制度卡不印申報表。
- **入口**：`TeamBlocks.tsx` 的 `ProfileEntries` 多「制度卡」（`/cards/:id`）；隊伍頁多「印全隊制度卡」。`cards/load.ts` 的 `fetchCard` 是卡頁與全隊頁共用的讀取（制度集、上層、全部特約）。

### 3.2 文章（`Article`，E5 J1：`src/types/article.ts`、`lib/articles.ts`）

```ts
type ArticleBlock = Block                                   // 特約的區塊全部可用
  | { kind: 'heading'; level: 2 | 3; text: string }          // 文章沒有段落樹，用小標題分段
  | { kind: 'quote'; text: string; cite?: string }
  | { kind: 'image'; src: string; alt: string; caption?: string } // src 是上傳檔案的 key
interface Article { slug; title; authors: string[]; series; level?; summary; cover?; blocks: ArticleBlock[]; published; updated; license: 'own' | 'permitted' | 'members-only' }
```

- **只有文章用的區塊不進 `Block`**：特約的編輯器、制度卡、AI 匯入、牌桌 `checkSections` 都不用認得它們。`BlockView` 收 `ArticleBlock`，三種新區塊在同一個 switch。`deal`、`play` 是 J2（e5-t02、e5-t03）。
- **內建沒有文章**：文章只存在牌桌（`worker/articles.ts`，`article:entry:<slug>`、`article:rev:<slug>:<id>`、`article:version`，內容分段在 `bookpart:`，每日備份涵蓋），repo 裡不放文章內容，測試用假資料。`articleProblems`（＝牌桌 `checkArticle`）在載入時再檢查一次；區塊檢查共用 `lib/content.ts` 的 `blockProblems`，整理共用 `tidyBlock`／`emptyBlock`。`articleText` 給 e5-t13 的搜尋。
- **圖片與封面存檔案 key，不存網址**（e5-t12）：key 是 G1 上傳回的 `article/<24 hex>.<ext>`（`isPictureKey`，不收縮圖 key 與外部網址；`uploadArticlePicture`）。牌桌每次讀文章順便簽好網址放在回應的 `files`，頁面用 `ArticleFilesContext` 提供，`image` 區塊查不到網址（R2 bucket 還沒建，牌桌 `filesOff` 時 `files` 是空的）就顯示替代文字框，文章照常讀。上傳遇到 503 `filesOff` 用 `filesOff(error)` 判斷。
- **API**（`api.book.articles`／`article`／`saveArticle`／`hideArticle`／`articleRevisions`／`articleRevision`）：讀要登入（2026-10-29 起全站要登入，牌桌也一樣；`members-only` 因此和其他授權沒有差別），隱藏的只有 bookEdit 看得到；發布、隱藏是 bookReview（`baseVersion` 不符 409 `articleConflict`），版本是 bookEdit。**目前只有已發布路徑**（同特約沒有草稿時的直接發布）；文章的草稿與送審（AC-5.2「送審走 E8」）跟文章編輯器 e5-t07 一起做。審計動作多 `article:publish`、`article:hide`。
- **叢書頁與文章頁**（e5-t05，`pages/LibraryPage.tsx`、`pages/ArticlePage.tsx`，字串 `libraryStrings.ts`）：每次打開都向牌桌讀（沒有快取，文章少）；登入狀態改變時重讀。書架依系列順序、每個書架新的在前，系列不在清單裡的文章放最後的「其他」，不會消失。沒有封面時用系列的顏色（`styles/avatarColors.ts` 的十色，依系列 id 固定）＋書名生成封面。
- **系列**（e5-t06，`lib/series.ts`、`components/admin/SeriesPanel.tsx`，在管理頁）：與分類同法（§4.5），整份一次存 `PUT /api/book/series`（bookEdit，`libraryApi.saveSeries`；409 `seriesConflict`、`seriesInUse`），存在牌桌 `article:series`，隨 `GET /api/book/articles` 的 `series` 一起回來。**沒存過時用內建系列**（`BUILTIN_SERIES`：主打、擠牌、防守、叫牌理論、社課講義、社史，PRD 列的六個），存過以線上為準。還有文章的系列不能刪：牌桌只檢查它存過的系列，內建的由管理頁依看得到的文章檢查。審計動作 `article:series`。
- **搜尋含文章**（e5-t13）：文章只在線上，不進建置時的 `search-index.json`。搜尋框第一次聚焦時另外抓 `GET /api/book/articles?text=1`（`libraryApi.loadArticleRecords`，lazy），牌桌回每篇的摘要與區塊文字（`searchText`，每篇最多 2 萬字；讀者看不到的文章不會有），`lib/search.ts` 的 `articleRecords` 每篇建一筆紀錄（`slug` 前綴 `library/`、`path` 是文章頁），跟特約的紀錄一起給 Fuse。叢書頁的搜尋框用同一份紀錄、只搜文章。抓不到時搜尋照常、只是沒有文章。`lib/articles.ts` 的 `articleText` 目前沒有用在搜尋（牌桌算好送來，省得下載全部內容）。

### 3.3 電子書（E5 J5：`src/lib/ebooks.ts`、`pages/EbookPages.tsx`、`components/PdfReader.tsx`）

- **型別**是牌桌 `shared/ebooks.ts` 的逐字複本（`Ebook`、`EbookInput`、`EbookList`、`EbookResponse`、`FileUsage`、上限；`parity/table-types.ts` 與 `tests/lib/tableParity.test.ts` 對拍）。呼叫（`ebookApi`）也放在 `lib/ebooks.ts`，不進 `api.ts`，首頁不帶。
- **上傳**：`POST /api/book/ebooks/ticket { size }`（bookReview）拿一次性憑證，`PUT` PDF（XHR，有進度），再 `POST /api/book/ebooks` 存資料；改資料是 `PUT /api/book/ebooks/:id`，下架 `DELETE`（PDF 一起刪）。PDF ≤ 50 MB、Worker 看檔頭 `%PDF-`。授權（`own`／`permitted`／`members-only`，同文章）預設「經授權轉載」（`permitted`）、可改成「社團自撰」；「僅社員可看」在全站要登入後沒有意義（2026-10-29），表單只在那本書本來就是它時才列出（`offeredLicenses`），型別與牌桌的檢查不變；封面沿用 G1 的圖片上傳（`uploadArticlePicture`，purpose `article`）。
- **直連 Worker**：PDF 的上傳與閱讀都用 `workerUrl(path)`（正式站是 `TABLE_SITE` 開頭，開發時走 Vite 的 `/api` proxy），不經 Vercel 的 `/api` 轉址；上傳路由與簽名網址的回應都有 CORS。
- **可見範圍**（e5-t11, AC-5.6）：原本未登入時不給 `members-only` 的書；2026-10-29 起全站要登入（§4.2），牌桌的電子書 API 也要登入，所以每位社員都看得到所有上架的書。PDF 的簽名網址 15 分鐘失效。
- **閱讀器**（e5-t10, AC-5.5）：pdf.js（`pdfjs-dist`）一次畫一頁到 canvas，寬度貼齊容器（手機可用）× 縮放、依 `devicePixelRatio` 畫清楚；上一頁／下一頁（按鈕、方向鍵、左右滑）、輸入頁碼、全螢幕（Fullscreen API，沒有時改成蓋滿畫面的 fixed 層，例如 iPhone）。worker 是打包出的 `pdf.worker.min.mjs`；中文 PDF 沒嵌字型時要的 CMap、標準字型、影像解碼 wasm 從 jsDelivr 的同版本 `pdfjs-dist` 抓（PDF 需要時才抓）。`onPage` 留給閱讀進度（e5-t14）。
- **用量提醒**（e5-t15）：牌桌記 `file:usage`，越過 8 GB 通知每位管理員一次（牌桌的通知，連到 `/library/book`），超過 10 GB 拒絕上傳；編輯者在列表看到用量。
- **R2 bucket 還沒建時**（`filesOff`）：列表照讀、沒有封面，書頁說檔案讀不到，上傳說空間還沒開通。

## 4. 路由、狀態與內容載入

**路由**（`react-router-dom`，BrowserRouter）

| 路徑 | 行為 |
| --- | --- |
| `/` | 首頁 `HomePage`：簡介、「看全書目錄」、各分類的特約連結；不載入任何特約內容（完整首頁是 e9-t08） |
| `/book` | 全書目錄 `BookPage`：整本一頁，全部特約皆收合（拆頁前的手冊）；閱讀設定的「印整本」先載入全部再列印 |
| `/c/:slug` | 特約頁 `ConventionPage`：只有這個特約，展開並捲動到它；上方有回全書目錄的位置列 |
| `/c/:slug/:sectionId` | 同上，再展開該段落的所有祖先段落，捲動並聚焦到段落標題；`?pending=k` 跳到該段的第 k 個待確認 |
| `/library` | 叢書（E5 e5-t05，lazy，在 `HandbookShell` 裡）：依系列分書架、封面；依系列、程度、作者篩選（`?series=`、`?level=`、`?author=`）；叢書頁搜尋框（e5-t13）。§3.2 |
| `/library/:slug` | 文章頁：書頁版面（約 68 字寬、襯線標題）、全部區塊、作者、程度、日期、授權；看不到的（下架）顯示「找不到」與回叢書的連結。與 `/library` 同一個 lazy chunk（`Library`），首頁只多一條路由 |
| `/practice` | 練習（E6，lazy，包在 `ProfiledContent`）：依制度集、特約、程度、題數抽意義題，答完顯示原文叫牌表與深層連結；`?c=<slug>` 只選這個特約（「練這個特約」）。題目由 `lib/quiz.ts` 的 `generateQuizzes` 在瀏覽器從解析後的內容產生，只用原文逐字，`pending` 不出題；套上幹部的修題，答完存成績（§4.8）。`?wrong=1` 只練錯題 |
| `/practice/scores` | 成績與錯題本（E6 e6-t05，lazy，包在 `ProfiledContent`）：總答對率、各特約答對率、錯題本、最近的練習、清除 |
| `/practice/fixes` | 修題（E6 e6-t06，bookEdit，lazy，包在 `ProfiledContent`）：停用、改正解或選項、手動出題；`?id=<題目 id>` 開一題 |
| `/learn` | 學習路徑列表（E4 e4-t09，lazy）|
| `/learn/:pathId` | 路徑頁（lazy，包在 `ProfiledContent`）：課次、登入後的完成進度與百分比、bookEdit 看得到「編輯路徑」 |
| `/learn/:pathId/:lessonId` | 課次頁（lazy，包在 `ProfiledContent`）：目標、閱讀（特約或段落的深層連結；制度集不採用的特約顯示說明）、題目數（e4-t10 前只顯示數量）、自我檢核、標記完成、上一課／下一課 |
| `/learn/:pathId/edit` | 路徑編輯（E4 e4-t12，bookEdit，lazy，不包 `ProfiledContent`：閱讀從社團版選）|
| `/login` | 登入、註冊、忘記密碼；`?next=` 登入後回到原頁。**未登入時唯一看得到的頁面**：其他路由都導來這裡（§4.2「全站要登入」） |
| `/account` | 我的帳號：權限、頭像、顯示（個人設定）、修改密碼 |
| `/settings` | 個人設定（e9-t15，lazy）：風格、版面、明暗、字體、字級、花色顏色、密度 |
| `/admin` | 社團管理（bookEdit）：帳號面板（待審核的申請、橋譜權限、重設密碼、邀請碼與人數上限）只給管理員；其他面板（草稿與送審、分類、隊伍、制度集、審計紀錄）編輯者也看得到（§4.2、§4.3.1） |
| `/review`、`/review/:slug` | 審核（bookEdit 看、bookReview 發布或退回）：草稿清單、草稿與已發布版本的段落差異（§4.3.1，e8-t04） |
| `/edit/:slug`、`/new` | 線上編輯器（bookEdit）；`?draft=<id>&n=<i>` 打開匯入草稿的第 i 個特約；`?rev=<id>` 打開版本紀錄並標出那一版（審計紀錄的連結） |
| `/import` | 匯入檔案（bookImport） |
| `/integrations/table` | 牌桌整合（bookEdit）：同步制度集到牌桌機器人、差異報告（§4.7） |
| `/profiles/:id/edit` | 編輯制度集（e1-t14，社員；沒有 `access.edit` 唯讀）：採用、叫品改寫、段落替換、備忘（§3.1） |
| `/profiles/:id/compare` | 與母制度集比較（e1-t15，社員）：這一層的採用、覆寫（原文 vs 覆寫後）、失效的覆寫 |
| `/teams` | 隊伍列表（e2-t05，社員）：隊長、人數，自己的隊伍在前，已封存另列 |
| `/cards/:profileId/:templateId` | 制度卡（E3，lazy）：見 §4 的「制度卡頁」；`?cell=<格子 id>` 打開時選好那一格（段落旁的位置連結用） |
| `/cards/:profileId/bsc-opening/:form`、`bsc-overcall/:form` | 棕標申報表（e3-t12，lazy）：`form` 是標了棕標的特約 slug；制度集沒採用或沒標時顯示說明 |
| `/cards/:profileId/:templateId/v/:n` | 制度卡的第 n 版（e3-t09，lazy）：發布時的卡，唯讀；讀得到制度集的人，或分享中時任何社員（2026-10-29 起全站要登入，分享連結也要先登入；牌桌這支 API 仍不用登入） |
| `/teams/:id/cards[/:templateId]` | 全隊制度卡（e3-t11，社員，lazy）：每對搭檔的卡接著畫，一次列印 |
| `/teams/:id` | 隊伍頁（e2-t05，社員）：隊員、隊伍制度集入口（讀制度、比較、有 `access.edit` 時編輯）、各搭檔相對隊伍的覆寫／不採用／另採用數 |
| `/u/:id` | 社員檔案頁（e11-t04，社員）：頭像、顯示名稱與帳號名稱、自評程度、常用制度、自我介紹、隊伍（含封存）與現役搭檔；自己的頁連到我的帳號（§4.6） |
| `/pairs/:id` | 搭檔頁（e2-t06，社員）：兩人、所屬隊伍、接受／婉拒／收回／結束、這對的制度摘要與入口、從隊伍或另一對搭檔複製採用與覆寫（e2-t09，在瀏覽器組好 `ProfileInput` 用 `saveProfile` 存，備忘不複製；Worker 不需改動）。我的帳號的「我的隊伍與搭檔」列自己的隊伍、搭檔、邀請並可邀請搭檔 |
| `/library/book` | 電子書（E5 e5-t09、e5-t11、e5-t15，lazy）：依系列列出上架的書（封面、作者、年代、授權）。bookReview 有上傳表單（PDF ≤ 50 MB、授權預設「經授權轉載」），編輯者看得到檔案空間用量，超過 8 GB 顯示警告。見 §3.3 |
| `/library/book/:id` | 一本電子書（lazy）：資料、授權說明、站內 PDF 閱讀器（`components/PdfReader.tsx`，再 lazy 一層，pdf.js 只在這裡載入）；bookReview 可修改資料、換 PDF、下架。找不到時是 404，頁面說找不到 |
| 其他 | 顯示首頁並提示；找不到的 slug 也是首頁加提示，找不到的段落在特約頁提示 |

管理、編輯、匯入三頁用 `React.lazy` 分開打包，讀者不會下載。

**閱讀頁拆頁**（e9-t04，2026-10-26）：`/`、`/book`、`/c/*` 是同一個版面路由 `HandbookShell`（`pages/HandbookShell.tsx`，包在 `ProfiledContent` 裡）的子路由：頁首、目錄、主欄留在畫面上，換頁時目錄的展開狀態不會重設，頁面本身在 `<Outlet>`。`ConventionPage`、`BookPage` 用 `React.lazy` 載入，所以卡片、段落、叫牌表的程式不在首頁的 bundle 裡。每頁頂端的 `PageBar` 放位置列與「閱讀設定」按鈕，頁面以 props 告訴面板能不能展開、收合、列印。個人設定的「版面」（e9-t15）由這一層與頁面決定：整本一頁（預設）＝目錄在左、≥ 1100px 特約頁有右欄「本頁」；三欄閱讀＝900px 起就有右欄；專注單欄＝桌機不顯示目錄、主欄置中；卡片總覽＝桌機不顯示目錄，首頁 `/` 換成 lazy 的 `CardOverview`（分類頁籤、磁貼、右側預覽）。手機一律單欄＋底部工具列。

**狀態**

- `ExpansionContext`：一個 `Set<string>` 記錄所有打開的項目（特約 key 為 `slug`，段落為 `slug/sectionId`）。每一層 Radix Accordion 以 `openAmong(keys)` 取得 value、以 `setLevel(keys, open)` 回寫。全部展開／收合與深層連結因此能控制不屬於它們的收合元件。
- `PreferencesContext`：個人設定（e9-t15）——主題（跟隨系統／淺／深，`themeChoice`；`mode` 是實際生效的淺或深，跟隨時監聽 `prefers-color-scheme`，夜讀風格跟隨時一律深色；舊版存的 `mode` 讀成固定選擇）、風格、版面、字體、字級（小／中／大／特大，`GlobalStyle` 依此設定根字級）、花色顏色（四色／雙色）、密度（舒適／緊湊）、閱讀版本 `reading`（完整版／入門版，e4-t02：入門版由 `lib/levels.ts` 決定隱藏哪些段落，`SectionAccordion` 用 `hidden` 屬性藏起來並顯示「還有 n 段」，列印同樣；連到被藏的段落時整頁改顯示全部）、`newcomerAsked`（「你是新生嗎？」問過沒，e4-t03：問這台裝置的第一次訪客（全站要登入之前只問未登入的，2026-10-29 起問社員），提示 `NewcomerPrompt` lazy；在這之前就存過設定的人視為問過；「全部恢復預設」不重設它），存在 localStorage `tku-bridgebook:prefs`（失敗時忽略；`readStoredPrefs` 逐欄檢查，未知值退回預設）。還沒存帳號（要牌桌 API 加欄位）。風格 token 除了「一般」都在 `styles/themes/` 各自一個 chunk，`loadStyle()` 選到才下載，沒載到前顯示「一般」；`main.tsx` 在第一次渲染前先載入存好的風格。
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

- 每個特約在伺服器最多一筆「線上版本」（`BookEntry`）：取代同 slug 的內建特約、新增一個特約，或 `convention: null` 隱藏它。`BookEntry` 一律是**已發布**的（E8 之前存的沒有 `status`，也是已發布）；草稿另外存（`BookDraft`，§4.3.1），manifest 與內容 API 永遠不含草稿，所以讀者只看得到已發布的。
- 開頁面時先顯示內建 manifest（或這台裝置上次看到的線上 manifest，存在 localStorage），再抓 `GET /api/book/manifest`（每筆線上版本不含內容，`meta` 是牌桌 Worker 算好的 `ConventionMeta`，隱藏的為 `null`；`categories` 是線上的分類，見 §4.5；`ETag`）。`mergeManifest` 依內建順序替換，新增的排在後面（依建立時間）；抓不到就維持現狀並顯示離線提示。
- 線上改過的特約，打開時抓 `GET /api/book/content/:slug`（`ETag`；沒有線上版本回 404），用 `onlineConvention`（`conventionProblems`）檢查形狀，壞掉的略過並列入提示，不會讓頁面掛掉。載入的內容以 `slug@版本` 存在 `ContentContext`，線上版本更新後自然換新。
- 舊的 `GET /api/book/content`（整本一次）牌桌仍保留給舊版前端，這裡已不使用。Service worker 對這兩支 API 走「先網路、離線用快取」，其他 `/api` 一律不快取。
- 這兩支 API 的型別在 `lib/api.ts`（`BookManifest`、`BookEntrySummary`），對應牌桌 `worker/book.ts`；`pending` 的走訪順序必須和 `lib/sections.ts` 的 `pendingNotes` 一致。
- **線上版本優先**：某個特約在網站上改過之後，再改它的 `.ts` 檔不會顯示出來，要在編輯器的版本紀錄按「還原為網站內建的版本」，或把線上內容寫回 `.ts` 檔後再還原。`BookEntry.bundledUpdated` 記著第一次線上修改時內建版本的 `updated` 日期。

### 4.2 帳號與權限（`AuthContext`、`lib/api.ts`）

帳號在淡江牌桌（`TKU-BridgeTable` ARCHITECTURE.md §5.2）：註冊送出申請、管理員核准；忘記密碼用帳號＋邀請碼重設（管理員除外）。`Me.permissions`：`bookEdit`（線上編輯：草稿、送審）、`bookReview`（審核發布，e8-t01）、`bookImport`（匯入檔案），管理員全部都有。審核者一定也是編輯者：牌桌存權限時自動補上 `bookEdit`，管理頁勾「審核發布」會一起勾「線上編輯」、取消「線上編輯」會一起取消「審核發布」。`api.ts` 的型別要和牌桌的 `shared/protocol.ts`、`worker/book.ts` 一致。

**全站要登入**（使用者決定，2026-10-29）：
- `App.tsx` 的 `SignedIn` 是所有路由（`/login` 除外）的版面路由：未登入就 `<Navigate>` 到 `/login?next=<原網址>`（`/` 不帶 `next`），登入後 `LoginPage` 依 `next` 回去（只收站內路徑）。`ContentProvider`、`ProfileProvider`、`ExpansionProvider` 在 `SignedIn` 裡面，所以未登入時不會向牌桌抓任何內容；登出時它們卸載，狀態一起清掉。
- `AuthContext` 把最後一次登入的 `Me` 存在 localStorage `tku-bridgebook:me`：開頁面時先用它畫（不必等 `/api/me`），`/api/me` 回 401 才算登出；連不到牌桌（離線、5xx）時沿用它，所以 PWA 離線照樣能讀。登出時清掉。頁面回到前景（`visibilitychange`）會重抓 `/api/me`，內容相同時保留同一個物件，不會重畫。
- 牌桌那邊（牌桌 PR，2026-10-29）：橋館的讀取 API（manifest、content、分類、名詞、修題、學習路徑、文章、電子書、制度集）都要登入；只剩健康檢查、錯誤回報、登入／註冊／登出／忘記密碼、簽名網址的檔案、分享中的制度卡版本不用登入。
- **擋不住的**：repo 是公開的，內建特約的內容在 repo 與打包後的靜態檔（`/assets/*.js` 的特約 chunk）、搜尋索引 `/search-index.json` 裡，知道網址就抓得到；介面的門檻只擋一般瀏覽。要真的保護內建內容得把它搬到牌桌（改 repo 為 private 也不夠，Vercel 的靜態檔仍公開），需要使用者決定。Service worker 快取過的 manifest 與內容在登出後仍留在那台裝置的快取。
- 已經沒有作用、但還留著的未登入分支（無害，之後整理）：首頁社團預設制度卡的登入提示、學習路徑「登入後可以記錄」、練習「成績只存在這台裝置」、制度卡頁與版本頁的登入提示、手機工具列「我的」未登入時連到登入頁。「你是新生嗎？」（e4-t03）改成問這台裝置第一次來的社員。

**角色**（使用者決定，2026-10-25；名稱暫時沿用）：**管理員**什麼都能管，包括使用者帳號；**編輯者**（有 `bookEdit`）能管帳號以外的所有東西，**但發布特約要審核者**（有 `bookReview`，E8 e8-t01，2026-10-28 起）。

| 功能 | 社員 | 編輯者 | 管理員 |
| --- | --- | --- | --- |
| 閱讀（全站要登入）、讀制度集 | ✓ | ✓ | ✓ |
| 編輯特約：存草稿、送審、捨棄草稿，版本紀錄、審計紀錄 | | ✓ | ✓ |
| 發布特約（從草稿或直接發布）、退回草稿、隱藏、還原為內建（`bookReview`） | | 審核者 | ✓ |
| 分類、制度集（新增、儲存、刪除、版本） | | ✓ | ✓ |
| 自己隊伍或搭檔的制度集（儲存、版本；成員權限見 §3.1「成員權限」，e2-t04） | 隊長；隊員要隊長開放；搭檔兩人 | ✓ | ✓ |
| `/admin` 的非帳號面板（「分類」「隊伍」） | | ✓ | ✓ |
| 關閉卡住的牌桌（牌桌 API；牌桌管理頁畫面仍只給管理員） | | ✓ | ✓ |
| 帳號：申請核准、新增／刪除、重設密碼、管理員身分、權限、社團設定（人數上限、邀請碼） | | | ✓ |
| AI 匯入（`bookImport`） | 個別勾選 | 個別勾選 | ✓ |

- 牌桌的 `worker/roles.ts` 決定每條 API 要什麼（`bookRouteNeed`、`adminRouteNeed`），`tests/worker/roles.test.ts` 逐條列出。
- 橋譜：`/admin` 給 `bookEdit` 進（`Gate need="bookEdit"`）。帳號面板（申請、社員、社團設定、到牌桌管理頁的連結）只有管理員看得到，也只有管理員才會呼叫 `/api/admin/*`；其他面板編輯者都看得到。帳號選單的「社團管理」對編輯者也顯示。編輯器的「直接發布」「退回」、版本紀錄的「從橋譜隱藏這個特約」「還原為網站內建的版本」只給審核者。
- **新增管理功能時**：不是帳號相關的，就開給編輯者（Worker 用 `bookEdit`、`/admin` 放在帳號面板外面）。

### 4.3 線上編輯器（`pages/EditorPage.tsx`、`components/editor/`、`lib/editing.ts`）

- 左邊段落樹、中間表單、右邊預覽（寬螢幕；窄螢幕用切換）。預覽用自己的 `ExpansionProvider`，全部展開。
- 條列以縮排文字編輯（`rulesToText`／`textToRules`，行尾〔待確認：…〕），叫牌過程是四欄格子（`2C（註記）`），叫品表可整批貼上「2H=P/C」。這些轉換對所有內建特約都能來回不變（`tests/lib/editing.test.ts`）。
- 儲存前 `tidyConvention` 去掉空欄位與空區塊，`conventionProblems` 擋下格式錯誤，`conventionWarnings` 提醒（看不懂的叫品、沒換成符號的花色字母）。
- 儲存帶 `baseVersion`（開始編輯時已發布的版本），別人先發布了會得到 409，可以載入對方的版本或覆蓋（對方的版本留在版本紀錄）。未儲存的修改存在這台裝置的 localStorage，離開前會提醒。

#### 4.3.1 草稿、送審與審計紀錄（E8 e8-t01、e8-t02、e8-t09；牌桌 `worker/book.ts`、`worker/audit.ts`）

- **狀態機**：每個特約最多一份草稿（`BookDraft`，牌桌 `book:wip:<slug>`，編輯者共用）：`draft` →（送審）`in-review` →（審核者發布）成為新的 `BookEntry` 版本；審核者退回時回到 `draft`，附理由（`reviewNote`，再送審時清掉）。送審中的草稿再存一次（不送審）就撤回成 `draft`。
- **編輯器**按鈕：「儲存草稿」「送審」（所有編輯者）；審核者多「直接發布」（有送審中的草稿時叫「發布」）。打開 `/edit/:slug` 時先抓 `GET /api/book/conventions/:slug/draft`，有草稿就編草稿（只有草稿、還沒發布過的新特約也能打開）。草稿的存檔帶 `draftRevision`（草稿的第幾次儲存），別人先存了回 409 `bookDraftConflict`，按「重新載入」接著對方的改；第一次存草稿也檢查 `baseVersion`。從草稿發布時帶 `draftRevision`，草稿用掉，送審者記在版本上（`reviewRequestedBy`、`reviewedBy`）。草稿起點比目前已發布的舊時，編輯器提醒「發布草稿會取代它」。送審中時審核者看得到「退回理由」欄與「退回」鈕；草稿可以「捨棄」。
- **管理頁**：「草稿與送審」面板（`GET /api/book/reviews`，送審中的在前，連到審核頁 `/review/:slug`），「審計紀錄」面板（`GET /api/book/audit`，最近 200 筆：存草稿、送審、退回、捨棄、發布、隱藏、還原、改分類、制度集新增／儲存／刪除；發布類連到編輯器 `?rev=<版本 id>`）。
- **審核頁**（e8-t04，`pages/ReviewPage.tsx`，lazy，bookEdit 才進得去）：`/review` 列全部草稿（送審中、編輯中兩組，含編輯者的說明與退回理由）；`/review/:slug` 是那份草稿和讀者現在看到的版本（線上版本，沒有就內建版本，新特約則全部算新增）的差異、編輯者的說明，審核者在下面「發布」（`PUT /api/book/conventions/:slug` 帶 `draftRevision`，發布說明空白時牌桌用草稿的說明）或「退回」（附理由，送審中才有）。單欄，手機可用。不包 `ProfiledContent`，看的是社團版原文。發布、退回的通知等 F4（e8-t10）。
- **差異**（e8-t03，`lib/diff.ts` 的 `diffConventions(舊, 新)`）：特約欄位逐欄比；段落以 `id` 對齊（不管在樹的哪裡），搬到別的上層記「上層段落」、同層換順序記「順序」（不在最長同序列裡的才算）；段落內每個區塊拆成「行」（段落文字、條列每一條、叫品表每一列的意義／附註／待確認／牌力條件、表格標題、叫牌過程、牌例、導讀各項、待確認），行用最長共同子序列對齊，叫品列以 `call`（同表第 n 個同叫品）對齊，其他行在同一個空檔裡同種類的配成「修改」，其餘是新增或刪除。只回傳不同的行；`inlineDiff` 再標出一行裡改了哪幾個字（超過 250,000 字元平方就整行標）。畫面是 `components/DiffView.tsx`（上下排、刪去的畫線、新增的加底色，螢幕報讀唸「原本／改成」），審核頁與編輯器共用。
- **版本比較**（e8-t05）：編輯器「版本紀錄」每個儲存的版本多「與這版比較」，比較框取代表單（寬螢幕連預覽一起），「比較對象」可選編輯中的內容或任一其他版本，舊的一律在前（`components/editor/ComparePanel.tsx`）。舊版本只檢查形狀，不檢查分類是否還在。
- 呼叫在 `lib/reviewApi.ts`、文字在 `pages/reviewStrings.ts`（差異與審核頁的在 `diffText`），只有編輯器、審核頁與管理頁（都 lazy）import，不進首頁；型別在 `lib/api.ts`，`parity/table-types.ts` 對拍。
- **還沒做**：隊伍與搭檔制度集照舊直接儲存；`club` 制度集也還是編輯者直接儲存（PRD 目標要走送審，之後再排）。差異、審核頁、通知是 F2、F4。

### 4.4 匯入檔案（`pages/ImportPage.tsx`、`lib/docText.ts`、`lib/sse.ts`、`lib/importResult.ts`）

1. 在瀏覽器讀檔：`.doc` 用 `cfb` 讀 OLE 檔，再照 piece table 取出文字（粗體 `**…**`、表格 `| … |`、Symbol 字型的花色換成 ♠♥♦♣）；`.docx` 解 XML（標題 `#`、條列 `-`）；PDF 原檔上傳。
2. 跟 `/api/book/import/ticket` 拿一次性憑證，把檔案或文字、目前的特約目錄、分類、補充說明以 multipart 直接傳給 Worker（Vercel 轉發最多等 120 秒，長文件要好幾分鐘）。
3. Worker 原封不動回傳 Claude 的 SSE 串流；`sse.ts` 收集文字（refusal fallback 時會有第二個文字區塊，照樣接起來）。
4. 回覆是扁平的 JSON（段落用 `parentId`、條列用 `level`），`importResult.ts` 組回 `Convention`，存成伺服器上的草稿，再到編輯器檢查、儲存。**schema 定義在牌桌的 `worker/importer.ts`，兩邊要一起改。**`tests/lib/importResult.test.ts` 把每個內建特約轉成扁平格式再還原，結果必須完全相同。

**搜尋**：`lib/search.ts` 為每個特約與每個段落各建一筆紀錄（名稱、別名、標籤、叫品、內文），以 Fuse.js 搜尋（`ignoreLocation`、threshold 0.3）。內建特約的紀錄在建置時算好：`scripts/search-index.ts` 產生 `{ version, records }`，`vite.config.ts` 的 `searchIndex` plugin 在 build 時寫進 `dist/search-index.json`、dev server 則每次請求用目前內容現算，所以索引不會過期、也不 commit。文章的紀錄不在這份索引裡，搜尋框另外向牌桌抓（§3.2「搜尋含文章」）；之後的名詞加成同一份 records 即可。所有文字與查詢都先經過 `toAsciiSuits`，因此「2♦」與「2D」結果相同。

**列印**：Accordion Content 一律 `forceMount`，關閉時以 CSS（`[data-state='closed']`）隱藏；列印樣式覆寫成全部顯示。列印 v2（e9-t10）在 `components/PrintSheet.tsx`，只有特約頁與全書目錄掛上（都是 lazy，不進首頁）：一段 `<style media="print">`（不經 styled-components，因為它的 CSS 解析器不保留 `@page` 裡的 `@top-left` 頁邊框）設 A4、頁尾頁碼、黑白（顏色來自 `tokens.ts` 的 `printColors`），特約頁加頁眉。印整本時每個特約是一個具名頁面（`@page c0 { @top-left { content: "淡江橋館 · 名稱" } }`，以 `[id="c-<slug>"]` 指定），分類標題併入它的第一個特約；封面與目錄是 `hidden` 的區塊（螢幕與報讀器都看不到），列印時以 `[data-print-only]` 顯示，所在的 `front` 頁不印頁碼。

### 4.5 分類（`lib/categories.ts`、`components/admin/CategoriesPanel.tsx`）

- 分類是資料：`Category { id, label, description, order }`，`id` 小寫英數與連字號、建立後不變（特約的 `category` 指向它），`CategoryId` 因此是 `string`。內建的一份在 `content/categories.ts`，離線、未登入、牌桌沒回應、或從沒在線上改過時就用它。
- 線上的一份存在牌桌 Worker（每個分類一筆 `book:category:<id>`），跟著 `GET /api/book/manifest` 的 `categories` 一起來，所以 localStorage 的 manifest 快取與 service worker 的「先網路、離線用快取」都涵蓋它；空清單或沒有這個欄位（舊 Worker）＝用內建的。
- `ContentContext` 用 `resolveCategories` 算出 `categories`：有線上清單就照它的 `order`，沒有就用內建；線上清單沒列、但還有特約在裡面的內建分類（例如線上改過之後才在 repo 加的）接在最後，特約不會從目錄消失。驗證特約時接受線上與內建兩份的 id（`knownCategoryIds`）。側邊欄、首頁、編輯器的分類選單、匯入送給 AI 的分類都讀這一份。
- 管理：`/admin` 的「分類」面板（bookEdit；跟著管理頁 lazy 載入，不進首頁 bundle）。改名、上下移、新增（代號自動產生 `c-<時間>`）、刪除，按「儲存分類」一次 `PUT /api/book/categories` `{ categories, baseVersion }` 整份取代。有特約（目前目錄裡的，含內建；隱藏的不算）的分類刪除鈕停用；Worker 另外擋還有線上特約的分類（409 `categoryInUse`），因為它只知道線上的特約。別人先存了回 409 `categoryConflict`，按「重新載入」拿對方的版本。存檔後重抓 manifest。
- 型別 `BookCategory`、`BookCategories` 在 `lib/api.ts`，對應牌桌 `worker/book.ts`；上限（20 個、名稱 40 字、說明 200 字）兩邊一致。

### 4.5.1 名詞解釋（`src/glossary/`、`state/glossaryContext.ts`，E4 e4-t05～t07）

- 資料：`Term { term, aliases, definition, see? }`（`types/glossary.ts`）。內建一份在 `content/glossary.ts`（**空的，等幹部寫**；名詞解釋是社團的說法，不可依一般橋牌知識補）；線上一份存牌桌（`book:glossary`＋`bookpart:glossary:<i>`，`worker/glossary.ts`）。`GET /api/book/glossary` 不用登入，version 0＝沒在線上改過、用內建；存過就整份取代內建（`resolveGlossary`，即使刪到空）。`PUT /api/book/glossary` `{ terms, baseVersion }`（bookEdit）整份取代，別人先存回 409 `glossaryConflict`。上限 500 條、名詞 40 字、解釋 1000 字，名詞與別名不分大小寫不重複，兩邊一致（`glossary/drafts.ts`）。
- 偵測：`compileGlossary` 把全部名詞與別名編成一個正規表達式（長的優先、不分大小寫；開頭或結尾是英數的名詞前後不能接英數＝完整詞，中文名詞沒有詞界）。`RichText` 有 `glossary` 時向 `GlossaryContext` 要標記函式，一個 `RichText`（一段、一條、一格）裡每個名詞只標第一次（別名算同一個）。**只包一層按鈕，文字原樣**（測試檢查切開再接回等於原文）。`BlockView` 的段落、附註、導讀、條列與 `ResponseTable` 的意義、附註有開；標題、摘要、目錄、搜尋結果沒開（避免按鈕包在按鈕裡）。
- `GlossaryProvider` 只包特約頁與全書頁（lazy chunk）；`RichText` 只多讀一個 context（首頁 bundle 只多 `glossaryContext.ts`）。名詞表一次造訪抓一次（`useGlossary` 模組層快取，編輯器存檔後 `rememberGlossary` 更新）。沒有名詞時不提供 context，內文與之前完全一樣。
- 浮動解釋（`TermMark`）：點線底線的 `<button aria-expanded aria-haspopup="dialog">`，點按、Enter、Space 開；Esc 或點外面關，焦點回名詞；靠右時往左移避免撐出橫向捲動；列印隱藏、底線拿掉。框內的解釋不再標名詞。
- 頁面：`/glossary`（在 `HandbookShell` 裡，可篩選名詞、別名、解釋；每條錨點 `termAnchor`），`/glossary/edit`（`Frame`＋`Gate bookEdit`，整份編輯、別名逗號分隔、相關特約選單）。字串在 `glossary/strings.ts`（不進首頁）。審計 `book:glossary` 連到名詞頁。

### 4.6 個人檔案、頭像與圖片檔案（`lib/account.ts`、`components/Avatar.tsx`、`lib/imageUpload.ts`，E11 G1、G2）

- **都在牌桌 Worker**，兩站共用。個人檔案是 `Me.profile`（`displayName`、`level`、`system`、`bio`，`PATCH /api/account/profile`），牌桌 e1-t15 已做好，橋譜只加型別與呼叫。「我的帳號 › 個人檔案」（G2，e11-t04）每次存整份（空白或不填就清掉那一項）。
- **他人檔案頁 `/u/:id`**（e11-t04）：`GET /api/members/:id`（牌桌的 `MemberProfile`，橋館不顯示其中的 `recent` 牌局）＋`GET /api/club/members/:id/teams`（那位社員所在的隊伍含封存、現役搭檔；邀請中與已結束的不列）。**只有登入社員看得到**（和隊伍頁、搭檔頁一樣；M1 討論區也只給社員）。隊伍頁、搭檔頁的社員名字連到這裡；最近貼文等 G3。
- **牌桌名牌**（e11-t19，牌桌 #174）：牌桌大廳的社員與座位帶 `displayName`，牌桌頁從大廳補上頭像與顯示名稱，所以兩站顯示同一個名字與頭像。
- **頭像**：`Me.avatar`／`ClubMember.avatar` 是版本號，圖片在 `GET /api/avatar/:id?v=<版本>`（牌桌 `avatar:<id>`，瀏覽器裁好的 256×256、≤ 64 KB）。PRD 原寫 512×512 放 R2；牌桌已有這一套（e1-t34），兩站讀同一張，所以沿用。沒有圖片就用字首＋由 id 決定的顏色（`lib/avatar.ts`，和牌桌同一套 FNV 雜湊與十個顏色 `styles/avatarColors.ts`），同一個人在兩站顏色相同。`Avatar` 是裝飾（`aria-hidden`），名字一定在旁邊。「我的帳號」可上傳（`AvatarCropper` 就地裁切）或改回預設。**用到的地方**：頁首帳號選單（24 px，顯示名稱優先於帳號名稱；`Avatar` 在選單裡 lazy，首頁 JS 預算）、我的帳號、社員檔案頁、隊伍頁與搭檔頁的社員（`MemberChip`）、隊伍列表的隊長。**同步**：兩站讀同一個 `avatar:<id>`（牌桌 `worker/service.ts`），版本號隨上傳改變，網址的 `?v=` 跟著變，所以不會讀到舊圖；橋館在頁面回到前景時重抓 `/api/me`（§4.2），在牌桌換了頭像，切回橋館就會更新。`GET /api/club/members` 多回 `displayName`、`avatar`，給之後的討論區與隊伍頁畫別人的頭像。
- **圖片檔案**（貼文與文章用）：R2 bucket `bridgebook-files`（牌桌 `worker/files.ts`，ARCHITECTURE.md §5.14）。`uploadImage(file, purpose)` 在瀏覽器縮到長邊 2048 px（≤ 2 MB）與 480 px 縮圖（≤ 256 KB），拿一次性憑證（`POST /api/files/ticket`，每人每天 30 張）、`PUT` 原圖與縮圖；顯示用簽名短效網址 `/api/files/<key>?e=&s=`（一小時，不用登入），過期用 `POST /api/files/urls` 重簽。**bucket 還沒建時**牌桌回 503 `filesOff`（牌桌 DEPLOY.md §4.8）。
- **文章的圖片**（E5 e5-t12）：見 §3.2。
- **不進首頁**：這些型別與呼叫在 `lib/account.ts`，不在 `api.ts`；介面文字在 `strings-account.ts`，不在 `strings.ts`（首頁 JS 預算只剩 1 kB 左右）；只有 lazy 的頁面 import 它們。型別對拍在 `parity/table-types.ts`（牌桌 `shared/profile.ts`、`avatar.ts`、`files.ts`）。
- **討論區型別**（e11-t05）：`lib/forum.ts` 是牌桌 `shared/forum.ts` 的複本（`Board`、`Post`、`PostBlock`、`CommentBlock`、`Comment`、`Reaction`、`Report`、內建四板、`FORUM_LIMITS`），每個型別 `Same` 對拍、常數在 `tests/lib/tableParity.test.ts` 比值；要改先改牌桌。牌與叫牌用 `lib/board.ts` 的型別；`hand` 區塊是 `cards: Card[]`（`HandInput` 的格式），特約的叫品表（`responses`）不放進貼文，引用特約用 `ref`。

- **討論區 API**（e11-t06、e11-t07，G3）：後端是牌桌 `worker/forum.ts`（SQLite 五張表 `forum_*`，牌桌 ARCHITECTURE.md 的「論壇 Worker」與 API 表），全部路由只給登入社員。橋館的呼叫在 `lib/forumApi.ts`（`forumApi.boards`／`boardPage`／`latest`／`post`／`createPost`／`comment`／`react`…），只有討論區的 lazy 頁面 import，首頁的兩個區塊（e11-t16）用 `import()`。請求與回應型別（`BoardInput`、`PostInput`、`CommentInput`、`BoardPage`、`PostThread`、`ForumLatest`）與 `Post.mentions`／`Comment.mentions` 也在 `lib/forum.ts`、一起對拍。規則（牌桌端檢查）：公告板只有幹部發文（`forumModerate` 在 e11-t09 之前是管理員）、置頂與鎖定是幹部的、作者才能編輯、作者或幹部能刪；留言巢狀一層；反應每人每則一種；發文加留言每人每分鐘 5 則（429 `slowDown`）。

### 4.7 牌桌整合（`pages/TableReportPage.tsx`、`lib/specReport.ts`、`lib/tableSync.ts`，E7 e7-t03 e7-t04）

- `/integrations/table`（bookEdit，lazy；管理頁有連結）：選一個制度集，頁面用社團版內容（內建＋線上，不經過 `ProfiledContent`）與該制度集的繼承鏈（`summaryChain`＋`resolveProfile`）算出套用後的特約，再用 `toSystemSpec`（`lib/systemSpec.ts`，牌桌 `shared/systemSpec.ts` 的逐字複本，`docs/SYSTEM-SPEC.md`）轉成規則。
- **同步**：「重新同步到牌桌」把轉好的 `SystemSpec` 整份送 `PUT /api/book/system-spec/:profileId`，牌桌存起來；`GET /api/book/system-spec?profileId=` 回最後同步的那份、時間與同步者，頁面比對現在轉出來的是否相同（「內容在同步之後改過」）。轉換在瀏覽器做，因為內建特約只在橋館的 bundle，且 22 個特約的轉換超過 Worker 免費方案一次請求的 CPU。
- **牌桌載入**：TKB 用淡江制度時，叫牌仍照牌桌已驗證的規則；叫出的叫品若在牌桌設定的制度集（`SYSTEM_PROFILE_ID`，預設 `club`）有同一叫牌過程、同一叫品的規則，叫品說明附上那列的原文（牌桌 `AuctionCall.book`，牌桌 ROBOT.md「橋館的文字跟著叫品」）。
- **差異報告**：每個叫牌過程（`meaningQueries`）分批問 `POST /api/book/robot-meanings`（一次 10 個，`SYSTEM_SPEC_LIMITS`），`compareSpec` 列出牌桌規則讀法不同（只比原文寫到的點力、張數、平均、迫叫、特約名；開放上限一律視為相同）與牌桌沒有規則的叫品；`unresolvedByReason` 依原因列出轉不出來的列。頁面不改任何制度原文。
- **補手牌條件**（e7-t08，`lib/handConditions.ts`、`pages/HandConditionsForm.tsx`）：叫牌過程與叫品讀得出來、意義讀不出來的列可「補條件」（點力、張數、迫叫），存成社團版那一列的 `ResponseRow.conditions`（`findRows` 以段落、叫品、文字、叫牌過程找列），走 §4.1 的 `PUT /api/book/conventions/:slug`（`baseVersion`、`bundledUpdated`）；存好 `reload` 後重新轉換，牌桌回答過的叫牌過程記在頁面裡不重問。`toSystemSpec` 把有條件的列轉成 `filled` 規則（`docs/SYSTEM-SPEC.md` §8）。`tidyConvention` 保留 `conditions`，所以編輯器存檔不會弄丟。
- 型別（`SyncedSystemSpec`、`SystemSpecStatus`、`RobotMeaningsQuery`、`RobotShows` …）在 `lib/api.ts`，呼叫與上限在 `lib/tableSync.ts`、頁面文字在 `pages/tableReportStrings.ts`（都不進首頁 bundle）；對拍在 `parity/table-types.ts`。

### 4.8 練習：成績與修題（`lib/quizRecords.ts`、`pages/practiceData.ts`，E6 e6-t04～t06）

- 型別對應牌桌 `shared/quiz.ts`（`QuizRound`、`QuizFix` …、`QUIZ_LIMITS`），對拍在 `parity/table-types.ts`；呼叫在 `quizApi`。頁面文字在 `pages/practiceStrings.ts`（lazy，不進首頁 bundle）。
- **成績**：練完一次 `roundOf` 轉成 `{ profileId, answers: { id, slug, right }[] }`。登入 → `POST /api/book/quiz/rounds`（牌桌 `quizlog:<userId>:<時間>-<id>`，每人最新 100 次）；未登入 → localStorage `tku-bridgebook:quizRounds`（同樣上限，讀寫都 try/catch）。兩邊不合併，登入後只看帳號的。`useQuizRounds` 依登入狀態選一邊。
- **錯題本與統計**：`quizStats(rounds)` 純函式：總數、各特約（答對率低的在前）、錯題（每題最後一次的答案是錯的）。錯題 id 在目前制度集已不出題時，成績頁顯示「已不在目前的制度集」。
- **修題**：`GET /api/book/quiz/fixes`（不需登入）→ `applyFixes(made, fixes, conventions, profileId)`：自動題的修正只在 `basis`（叫品、正解，比較時忽略空白與句尾句號）與現在產生的題目相同時套用（停用、換正解——在選項裡取代原正解——或整組選項）；手動題只加進同一個制度集、且段落還在的。不套用的回在 `stale`，修題頁標出。`PUT`／`DELETE /api/book/quiz/fixes` 要 bookEdit，牌桌只檢查形狀（`worker/quiz.ts`），存在 `book:quizfix:<id>`（每日備份）。
- 題目的 `kind: 'call'`（手動的叫品題）在練習頁顯示牌（`Hand`）與「你叫什麼？」，選項是叫品。自動的叫品題是 e6-t07。

### 4.9 學習路徑（`lib/learning.ts`、`content/paths.ts`，E4 e4-t08、t09、t11、t12）

- 型別對應牌桌 `shared/learning.ts`（`LearningPath`、`Lesson`、`PathProgress` …、`LEARNING_LIMITS`），對拍在 `parity/table-types.ts`；呼叫在 `learningApi`。頁面在 `pages/LearnPages.tsx`、`pages/LearnEditorPage.tsx`，文字在 `pages/learnStrings.ts`（都 lazy，不進首頁 bundle）。
- **內建路徑**：`content/paths.ts` 的「從零開始」（`from-zero`）只是手冊既有入門特約的排列，課次標題＝特約名稱，`goal`、`checklist` 空白，留給幹部線上寫（CLAUDE.md 規則 1）；課次頁對空白的目標與檢核顯示「幹部還沒寫」。
- **線上版本**：`GET /api/book/paths`（不需登入，牌桌 `book:path:<id>`，每日備份）→ `mergePaths`：線上版本取代同 id 的內建路徑，只有線上的路徑排在後面。一次頁面載入只抓一次（`useLearningPaths`，抓不到就用內建）。`PUT`／`DELETE /api/book/paths` 要 bookEdit（審計 `path:save`／`path:reset`）；`DELETE` 回到內建版本。牌桌只檢查形狀。
- **進度**：只有登入的社員記（AC-4.6）：`GET`／`PUT /api/book/paths/progress`（`{ pathId, lessonId, done }`），牌桌 `pathprogress:<userId>:<pathId>`，刪帳號一起刪。`usePathProgress` 標記時先顯示、失敗就退回。`pathProgress` 只算還在路徑裡的課次。我的帳號有「學習進度」。
- **首頁**：「第一次來」（`HomeBlocks.tsx` 的 `FirstSteps`，lazy）顯示「從零開始」的前三課（連到課次頁）與「看全部 n 課」。

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
  - **元件測試預設已登入**（2026-10-29，全站要登入）：`tests/setup.ts` 每個測試先在 localStorage 放一位社員（`READER`）並 stub `fetch`：`/api/me` 回那位社員、其他請求失敗（頁面退回內建內容）。要測未登入，`localStorage.removeItem('tku-bridgebook:me')` 並讓 `/api/me` 回 401；自己 stub `fetch` 的測試要回 `/api/me`。Playwright 的 `tests/browser/fixtures.ts` 同樣以社員開頁，`open(…, signedOut = true)` 看登入頁。
- **手機 App（PWA）**：`public/manifest.webmanifest`（名稱「淡江橋館」、全螢幕、圖示）、`public/sw.js`（service worker：頁面優先走網路、離線時用快取；`/assets/` 檔名含雜湊，走快取）、`src/lib/pwa.ts`（只在正式版註冊 service worker，保留瀏覽器的安裝邀請給「安裝 App」按鈕）。`vercel.json` 讓 `sw.js` 不被快取。v2 策略（e10-t05）：安裝時存下 app shell、首頁的建置檔（從 `index.html` 解析）、搜尋索引與線上 manifest，所以看過一次之後離線也能開、能搜；特約 chunk 看過才快取；線上內容與搜尋索引網路優先、離線用快取。`vite.config.ts` 的 `stampServiceWorker` 把建置雜湊寫進 `dist/sw.js`，每次建置都是新的 worker：新版本在背景裝好後等待，頁面顯示「有新版本可以使用」（`UpdatePrompt`、`lib/pwa.ts` 的 `watchForUpdates`／`useUpdate`），按「重新整理」才接手並重新載入；頁面回到前景時會檢查更新。快取名稱跨版本不變（`tku-bridge-book-v4`），看過的特約更新後仍可離線看；只有快取格式改變時才把 `CACHE` 加版號。制度集與制度卡的 API 出現後（A6、D3）加進網路優先的清單。全站要登入後（2026-10-29），安裝時預存的線上 manifest 在未登入時會拿到 401，略過不存（安裝不受影響）；離線時靠 `tku-bridgebook:me` 知道是誰（§4.2）。
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

**Lighthouse**：CI 的 `lighthouse` job 重新 build，用 `vite preview` 起站，以 Lighthouse CI（`npx @lhci/cli`，設定在 `lighthouserc.json`）量 `/login` 與 `/c/jacoby-2nt`（2026-10-29 起全站要登入；`vite preview` 沒有牌桌，所以兩頁都是未登入看到的登入頁，後者含導向。登入後的頁面由上面的 bundle 預算與 Playwright 的 axe 把關），各跑 3 次取中位數。無障礙 < 0.95 會讓 job 失敗；效能 < 0.9、最佳做法 < 0.9 只警告——CI 機器的模擬節流分數浮動大，硬擋會常誤報，效能改由上面的 bundle 預算把關。報告上傳為 artifact `lighthouse-reports`（不上傳到公開的 temporary storage）。本機可跑 `npm run build && npx @lhci/cli@0.15.1 autorun`（需要 Chrome）。

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
