# NEXT — 接下來怎麼做（給 AI 協作者與自己的交接手冊）

最後更新 2026-10-28。**完整順序在 [`ROADMAP.md`](ROADMAP.md)**（一批一個 PR）；這份只記「現在的位置」與工作方式。每完成一批就更新「現在的位置」；每個 AI session 開頭只需要讀 `CLAUDE.md` 和這一份。

## 1. 現在的位置

- **M0 手冊** ✅ 已上線（https://tku-bridge-book.vercel.app/）：22 個特約、搜尋、深層連結、線上編輯、AI 匯入、共用帳號、PWA。
- **2026-10-24 健檢與規劃完成**（PR #7）：總 PRD 拆成 11 個 epic、146 個 task、77 條 AC；ROADMAP 排成 Phase A–N；設計規格 `DESIGN-V2.md`、首頁視覺稿 `design/mockup-v2.html`、六種風格×四種版面與討論區展示頁 `design/pitch.html`。健檢結論在 `HEALTH-CHECK.md`。
- **A1 內容分片完成**（PR #8，牌桌 #60，2026-10-25）：manifest＋每個特約一個 chunk、打開才載入；線上內容改走 `GET /api/book/manifest` 與 `GET /api/book/content/:slug`；CI 有效能預算（`npm run budget`，首頁 JS 141／150 kB）與 Lighthouse（無障礙 ≥ 0.95）。新增特約後要跑 `npm run manifest`。**牌桌 #60 要先合併。**
- **B1 風格 token 完成**（PR #10，2026-10-25）：`createTheme(mode, textSize, style)`，「一般」＝現行值（測試鎖住）、「中國風」為第二組（e9-t15 前沒有入口）；Noto Serif TC 只在襯線風格時載入；`ui.tsx`、Tag、PendingNote 讀新 token；舊名 `radius`／`shadow`／`lantern`／`vermilion` 到 e9-t14 才移除。與 A2 同時進行。
- **A2 搜尋索引與 service worker v2 完成**（PR #11，2026-10-25）：建置時產生 `/search-index.json`（43 kB gzip），搜尋不再載入全部特約；線上改過的特約增量合併。service worker 預載首頁、索引、manifest，新版本出現時提示「重新整理」。制度集與制度卡的離線快取等 A6、D3。
- **自動部署重新打開**（2026-10-25）：PR #9 曾改為手動部署；現在合併到 `main` 就上線（橋譜 Vercel、牌桌 Deploy workflow），所以合併前 CI 要全綠。
- **A3、B0、D1、G4 同時完成**（2026-10-25，四個 subagent 各一個 worktree 平行做）：
  - **A3 內容欄位**（PR #15，牌桌 #78）：`Convention` 加 `kind`／`level`／`prerequisites`／`cardSlots`，22 張內建特約補種類與程度（標法與一覽在 `CONTENT_GUIDE.md` §2.1，程度標法使用者已確認（入門 < 進階 < 高階；PR #17 修正對抗不尋常2NT、防守信號）），卡片、側邊欄、搜尋結果顯示標籤，編輯器有欄位。前置特約內建先不填（留給 E4）；AI 匯入不判斷這三項。
  - **B0 改名**（PR #12，牌桌 #77）：網站名改為淡江橋館 · TKU BridgeHall、新標誌與圖示；service worker 快取名稱（`tku-bridge-book-v4`）刻意不改，以免清掉離線內容。
  - **D1 制度卡版型**（PR #13，依原始檔校正 PR #19）：`src/cards/` 的 `CardTemplate` 型別、WBF 卡、簡易卡單面與雙面。原始檔來自中華橋協（網址記在 PRD e3），放 `tmp/ctcba/`，不 commit。**國橋的 WBF 空白 .doc 是 2004 年的舊版卡，不是 2.19**，版型照空白 .doc 定稿；使用者決定改照 2.19（PR #24），範例 PDF 分不出印好或填寫的三處暫定照現狀（使用者接受，`pending` 已移除）。
  - **G4 牌例元件**（PR #14）：`lib/board.ts`（型別對應牌桌 `shared/board.ts`，牌桌沒有 `Deal` 型別，橋譜端先定義）與 `components/board/` 的 `DealDiagram`、`DealInput`、`AuctionInput`、`HandInput`，還沒有頁面使用；叫牌型別改名 `TableAuction`，叫牌盒用牌桌同色的 `callPass`／`callDouble`／`callRedouble` token（PR #17）。
- **A4 分類改為資料**（PR #20，牌桌 #81）：分類存在 Worker（`GET`／`PUT /api/book/categories`、版本衝突、使用中不可刪），內建分類仍是離線與未登入的預設；管理頁新增分類面板，`bookEdit` 權限即可進 `/admin` 管分類。
- **A5 制度集型別**（PR #18，牌桌 #80）：`SystemProfile` 在牌桌 `shared/protocol.ts` 與 `src/lib/api.ts` 各一份並有對拍測試；`lib/profiles.ts` 的 `resolveProfile` 處理繼承、覆寫、`origin` 與壞參照。覆寫的叫品列會拿掉原本的 `pending`（使用者確認）。
- **牌桌 Deploy workflow 的兩個 Cloudflare secret 已設好**：牌桌合併到 `main` 就部署 Worker。
- **A6 制度集儲存與角色**（PR #23，牌桌 #90）：Worker CRUD、版本衝突、上限、`club` 不可刪；權限集中在牌桌 `worker/roles.ts`。**角色規則（使用者 2026-10-25 決定）**：管理員管所有事（含帳號）；編輯者（`bookEdit`）管帳號以外的一切（內容、分類、制度集、`/admin` 非帳號面板）；位階名稱之後再改。AI 匯入、精選牌局仍是個別權限。
- **D2 填制度卡**（PR #24）：`src/cards/fill.ts` 的 `fillCard`；WBF 版型改照 2.19；內建 18 個特約共 90 條 `cardSlots` 對應，表在 `CONTENT_GUIDE.md` §2.2，使用者暫定核可（PR #26，有問題再改）；原文有疑義的格子留空，等制度編寫好再補；WBF 卡先填中文。`cardSlots` 不進 manifest，以免撐大首頁。
- **L3 備份與型別對拍**（PR #22，牌桌 #89 **未合併**）：牌桌每日備份 `book*`／`profile*`／`article*` 到 R2（保留 30 天）與還原 API；橋譜 CI 的「Table type parity」比對兩邊型別。上線前要人做：建 R2 bucket（`npx wrangler r2 bucket create tku-bridge-backups`）後才合併牌桌 #89；設 secret `TABLE_REPO_TOKEN`（牌桌 Contents 唯讀）；部署後照牌桌 `DEPLOY.md` §4.3 演練還原再勾 AC-10.5。
- **A7 讀者的制度集**（PR #30，牌桌 #121）：登入後頁首可切換制度集（有兩個以上才出現；手機在目錄抽屜），選擇存在帳號（`Me.bookProfile`），離線時暫存 localStorage；目錄、內容、列印、搜尋都跟著制度集；覆寫處有「隊伍覆寫」等文字標與色線，備忘顯示在特約或段落開頭。未登入不抓制度集 API。`lib/profiles.ts` 與選單都 lazy。
- **C2 隊伍與搭檔的模型與 API**（PR #29，牌桌 #122）：牌桌 `worker/teams.ts`（`ClubTeam`、`Partnership`，`/api/club/teams*`、`/api/club/pairs*`），隊伍建立時、搭檔接受時各開一個制度集；邀請、接受、婉拒、結束有通知（牌桌鈴鐺，連到橋譜 `/pairs/:id`，C4 做頁面）；一隊 8 人、每人 10 個搭檔（含等回覆）；隊長與編輯者管隊伍。橋譜只有 `api.club` 型別與呼叫，還沒有畫面。還沒處理：帳號刪除時的隊伍與搭檔。
- **K1 牌桌規則轉換**（PR #31，牌桌 #123，2026-10-26）：對照表與啟發式清單在 `docs/SYSTEM-SPEC.md`；`toSystemSpec` 正本在牌桌 `shared/systemSpec.ts`，橋譜 `src/lib/systemSpec.ts` 是逐字複本（`npm run parity` 比對）；22 個特約轉出 798 條規則、1015 列 unresolved（快照 `tests/lib/__snapshots__/systemSpec.test.ts.snap`）。啟發式只抽明寫的點力、張數、單張／void、平均牌型、迫叫、特約名。**使用者 2026-10-26 回答**：`---`／`--` 是 All pass（轉為 Pass，網站顯示成一條橫線）、「點」一律大牌點、「n張」沒講牌型就是 n 張以上（制度原文不改），已實作（PR #32，牌桌 #128）。下一步 K2（`system-spec` API、牌桌載入、差異報告頁）。
- **repo 重建為 `TKU-BridgeHall`**（2026-10-26）：repo 是公開的，舊 repo 歷史裡有社團的 Word 原檔，所以用 git filter-repo 把 `*.doc` 從每個 commit 挖掉、刪掉舊 repo、以新名稱重建（PR #1–#32 的頁面因此消失，commit 訊息裡的 PR 號保留）。原檔只存在本機 `C:淡江橋藝社制度原檔`。
- **C3 制度集成員制權限**（PR #3，牌桌 #132，2026-10-26）：規則在牌桌 `worker/roles.ts` 的 `profileAccess`：編輯者與管理員全部；隊伍制度集隊長能存、改可見範圍，隊長打開「隊員可編輯制度集」（`ClubTeam.membersEdit`）後隊員也能存，封存後唯讀；搭檔兩人現役時能存，結束後唯讀；成員才看得到備忘與版本紀錄；`visibility: 'members'` 只給成員讀，母制度集讀不到的人子制度集也讀不到。`GET /api/book/profiles/:id` 多回 `access`（`notes`／`edit`／`share`），新增 `GET /api/club/members`（id 與帳號名稱）。管理頁多「隊伍」面板（建立、換隊長、加減隊員、開關、封存、看搭檔）。
- **B2 頁首 v2 與拆頁**（PR #4，2026-10-26）：頁首只剩 Logo、制度集（只有社團時是不能點的膠囊，可選時是下拉）、搜尋、帳號；「閱讀設定」按鈕在每個閱讀頁頂端右側，面板 lazy（主題 跟隨系統／淺／深、字級、本頁展開收合、列印本頁／印整本、安裝 App）。路由：`/` 首頁（分類與特約連結，完整版是 B4）、`/c/:slug[/:sectionId]` 單一特約頁、`/book` 全書整本一頁；三頁共用版面路由 `HandbookShell`，特約頁與全書頁 lazy。入門版切換等 E4。**整本一頁現在在 `/book`**；預設版面的設定（e9-t15）之後由 `HandbookShell` 決定 `/c/:slug` 的殼。
- **G1 個人檔案、圖片上傳、頭像**（PR #8，牌桌 #167，2026-10-28）：個人檔案與頭像沿用牌桌 e1-t15／e1-t34（頭像 256×256、≤ 64 KB 存牌桌 `avatar:`，不放 R2；兩站讀同一張 `/api/avatar/:id?v=`）；`Avatar`（字首＋和牌桌同一套顏色）、`AvatarCropper`，「我的帳號」可上傳與改回預設；`ClubMember` 多回 `displayName`、`avatar`。圖片檔案在牌桌 `worker/files.ts`（R2 `bridgebook-files`、一次性憑證、每天 30 張、簽名短效網址 `/api/files/<key>?e=&s=`），橋譜 `lib/imageUpload.ts` 縮圖與上傳，還沒有頁面用。型別與呼叫在 `lib/account.ts`、介面文字在 `strings-account.ts`，都不進首頁。**要人做**：`npx wrangler r2 bucket create bridgebook-files`，再在牌桌開小 PR 把 `wrangler.jsonc` 的 `FILES` binding 取消註解（牌桌 DEPLOY.md §4.8）；之前圖片上傳一律回 503 `filesOff`，其他功能不受影響。
- **首頁 JS 148.8／150 kB**（B2 後；拆頁讓卡片程式離開首頁）：之後的功能一律 lazy，`strings.ts` 也算在首頁裡。
- **下一批**：A 期做完。B3（特約頁三欄、換皮、目錄 v2；前提 B2）；C3 已完成；C4（隊伍頁、搭檔頁）等 C1；D3 等 B3；G1 已完成，下一個 G2（我的帳號編輯檔案、他人檔案頁、`shared/forum.ts`）。
- **已拍板**（2026-10-24）：網站改名**淡江橋館 · TKU BridgeHall**，「橋譜」保留為制度區塊名；新標誌（屋簷＋拱門＋四花色）在 `design/logo/`，改名是 ROADMAP B0（`e9-t18`）。介面預設「一般」＝現行配色與圓角，另五種風格、四種版面、字體、字級、花色顏色、密度都放個人設定，不投票（E9，展示頁 `design/pitch.html`）；首頁保留第一版視覺稿的版面並加社團新聞與最新討論（`DESIGN-V2.md` §5.3）；制度卡以 WBF 卡為主力、內容寫進格子、輸出 .docx 與 PDF，簡易卡與棕標申報表也要能生成（E3）；**新增 E11 社群與討論**（頭像、板面、牌例友善的貼文與留言、通知、管理），先給社內測試，型別與 Worker 模組放牌桌 repo 以便日後搬到牌桌 E13（ROADMAP Phase G）。
- **等人決定的事**（不卡 A 期）：程度名稱（E4）、制度負責人（E8）、WBF 卡英文濃縮文字由誰定稿（E3）。見 `docs/PRD/00-prd.md` §14。

## 2. 建議順序（為什麼這樣排）

| # | 做什麼 | Phase | 為什麼排這裡 |
| --- | --- | --- | --- |
| 1 | 內容分片與搜尋索引 | A1–A2 | 整本一頁已經 3.2 萬個節點；叢書、制度集進來前一定要拆，而且換皮（E9）要拆頁，先拆資料再拆畫面 |
| 2 | 內容欄位與制度集模型 | A3–A7 | 制度集是隊伍、制度卡、練習、機器人同步的共同地基；先把資料與 API 做對，UI 只做切換與標記 |
| 3 | 介面 v2 | B1–B6 | 使用者最有感；集中一條線做完，避免兩套樣式並存 |
| 4 | 制度集編輯、隊伍與搭檔 | C1–C4 | 有了新介面再做編輯 UI，不用做兩次 |
| 5 | 制度卡 | D1–D4 | 社團最直接的「產出」；D1 版型檔不依賴任何人，可提早 |
| 6 | 送審與待確認 | F1–F4 | 內容開始多人改之前要有審核；44 項待確認要有人認領 |
| 7 | 討論區 | G1–G8 | 社團最常用的功能；型別與後端放牌桌 repo，將來搬家只搬 UI；可與 C、D、F 平行 |
| 8 | M2：分級 → 練習 → 叢書 → 牌桌整合 → 寫回與維運 | H–L | 新生社課最急；練習與叢書互不依賴；牌桌整合看牌桌 E5 進度 |

## 3. 怎麼跑最省 token

Token 吃掉的是**對話上下文**，不是程式碼。原則：**一個 session 做一批，做完就結束**。

**開工指令範本**（貼給 Claude 就能跑；建議 Opus、effort medium）：

```
讀 CLAUDE.md、docs/NEXT.md、docs/ROADMAP.md。做 ROADMAP 第 <批次號> 批。
規則：
1. 用 worktree 開分支，分支名帶第一個 task 編號。
2. 讀檔只讀需要的段落；搜尋與大範圍檢視交給 subagent，只把結論帶回來。
3. 每個 task 做完跑 npm run lint && npm run build && npm test，只看最後 5 行。
4. 這一批的 task 合成一個 PR（標題列出全部編號），PR 本文寫對應的 AC 與檢查方式；在 PRD 勾選、更新進度表；在 ROADMAP 勾選這一批並寫 PR 號；更新 docs/NEXT.md 的「現在的位置」。
5. PR 開成 ready（不是 draft），CI 綠了就直接合併（`gh pr merge <號> --squash --delete-branch`，worktree 先移除；有衝突自己解），合併後回報並結束，不要接著做下一項。只有需要人決定的事（視覺稿核准、內容取捨、範圍）才停下來等。合併就會上線。
```

其他：
- **effort 用 medium**。照規格寫型別、純函式與測試不需要更高；只有設計決策（新 epic、資料模型、E9 的 tokens）開 high。
- **Phase B（介面 v2）開工前先讀 `DESIGN-V2.md` 全文與視覺稿一次**，之後每批只讀對應元件那一節。
- **不要在一個 session 做超過一批。** 上下文會自動壓縮，壓縮後品質下降，不如重開。
- **subagent 只用來搜尋和讀大檔**，不要用來寫程式碼。
- **牽涉牌桌的批**先在 `C:\dev\TKU-BridgeTable` 開 PR；兩邊 `protocol.ts` 型別一致才合併。

## 4. 健檢結論摘要（2026-10-24，完整版見 `HEALTH-CHECK.md`）

| 項目 | 狀態 | 處理 |
| --- | --- | --- |
| 整本一頁、全部打包 | 3.2 萬節點、展開 1.6 秒 | A1–A2 分片；B2 拆頁 |
| 只有一套制度、分類寫死 | 做不了隊伍與搭檔 | A3–A7 制度集 |
| 線上版本與 `.ts` 兩個真相 | 容易改錯地方 | F 送審、K1 寫回 Git 後線上為唯一真相 |
| 44 項待確認沒負責人 | — | F3 面板 |
| 介面像工具、沒有首頁、頁首擠 | 配色與圓角保留為預設 | B 全線：首頁、個人設定、風格維度 |
| 討論散在 FB 與 LINE | — | G 全線（E11） |
| 後端全在牌桌 Worker | 可接受（社團規模） | 型別對拍自動化（K3）；多社團時再拆 |
| 測試、CI、PWA、無障礙 | 良好 | 維持；B6 加視覺回歸 |

## 5. 不做或延後的

- **Markdown 編輯器**：維持結構化區塊；文章需要的區塊（標題、牌例、圖）在 E5 加。
- **評論區**：等牌桌 E13 論壇做好再嵌入。
- **AI 問答（問制度）**：有 RAG 價值但要成本控管，M3 再評估。
- **多語**：介面只做繁體中文；內容的英文術語保留。
- **再生一份架構文件**：`ARCHITECTURE.md` 是唯一來源，E1／E10 做完時更新它，不另開。
