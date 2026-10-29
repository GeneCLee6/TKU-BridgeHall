# NEXT — 接下來怎麼做（給 AI 協作者與自己的交接手冊）

最後更新 2026-10-29（D5 後）。**完整順序在 [`ROADMAP.md`](ROADMAP.md)**（一批一個 PR）；這份只記「現在的位置」與工作方式。每完成一批就更新「現在的位置」；每個 AI session 開頭只需要讀 `CLAUDE.md` 和這一份。

## 1. 現在的位置

- **M0 手冊** ✅ 已上線（https://tku-bridge-hall.vercel.app/；2026-10-28 前是 tku-bridge-book.vercel.app，舊 Vercel 專案與舊 repo 已刪）：22 個特約、搜尋、深層連結、線上編輯、AI 匯入、共用帳號、PWA。
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
- **K1 牌桌規則轉換**（PR #31，牌桌 #123，2026-10-26）：對照表與啟發式清單在 `docs/SYSTEM-SPEC.md`；`toSystemSpec` 正本在牌桌 `shared/systemSpec.ts`，橋譜 `src/lib/systemSpec.ts` 是逐字複本（`npm run parity` 比對）；22 個特約轉出 798 條規則、1015 列 unresolved（快照 `tests/lib/__snapshots__/systemSpec.test.ts.snap`）。啟發式只抽明寫的點力、張數、單張／void、平均牌型、迫叫、特約名。**使用者 2026-10-26 回答**：`---`／`--` 是 All pass（轉為 Pass，網站顯示成一條橫線）、「點」一律大牌點、「n張」沒講牌型就是 n 張以上（制度原文不改），已實作（PR #32，牌桌 #128）。K2 已完成（見下）；下一步 K3（前提 J2）、K4（幹部補手牌條件）。
- **repo 重建為 `TKU-BridgeHall`**（2026-10-26）：repo 是公開的，舊 repo 歷史裡有社團的 Word 原檔，所以用 git filter-repo 把 `*.doc` 從每個 commit 挖掉、刪掉舊 repo、以新名稱重建（PR #1–#32 的頁面因此消失，commit 訊息裡的 PR 號保留）。原檔只存在本機 `C:淡江橋藝社制度原檔`。
- **C3 制度集成員制權限**（PR #3，牌桌 #132，2026-10-26）：規則在牌桌 `worker/roles.ts` 的 `profileAccess`：編輯者與管理員全部；隊伍制度集隊長能存、改可見範圍，隊長打開「隊員可編輯制度集」（`ClubTeam.membersEdit`）後隊員也能存，封存後唯讀；搭檔兩人現役時能存，結束後唯讀；成員才看得到備忘與版本紀錄；`visibility: 'members'` 只給成員讀，母制度集讀不到的人子制度集也讀不到。`GET /api/book/profiles/:id` 多回 `access`（`notes`／`edit`／`share`），新增 `GET /api/club/members`（id 與帳號名稱）。管理頁多「隊伍」面板（建立、換隊長、加減隊員、開關、封存、看搭檔）。
- **B2 頁首 v2 與拆頁**（PR #4，2026-10-26）：頁首只剩 Logo、制度集（只有社團時是不能點的膠囊，可選時是下拉）、搜尋、帳號；「閱讀設定」按鈕在每個閱讀頁頂端右側，面板 lazy（主題 跟隨系統／淺／深、字級、本頁展開收合、列印本頁／印整本、安裝 App）。路由：`/` 首頁（分類與特約連結，完整版是 B4）、`/c/:slug[/:sectionId]` 單一特約頁、`/book` 全書整本一頁；三頁共用版面路由 `HandbookShell`，特約頁與全書頁 lazy。入門版切換等 E4。**整本一頁現在在 `/book`**；預設版面的設定（e9-t15）之後由 `HandbookShell` 決定 `/c/:slug` 的殼。
- **G1 個人檔案、圖片上傳、頭像**（PR #8，牌桌 #167，2026-10-28）：個人檔案與頭像沿用牌桌 e1-t15／e1-t34（頭像 256×256、≤ 64 KB 存牌桌 `avatar:`，不放 R2；兩站讀同一張 `/api/avatar/:id?v=`）；`Avatar`（字首＋和牌桌同一套顏色）、`AvatarCropper`，「我的帳號」可上傳與改回預設；`ClubMember` 多回 `displayName`、`avatar`。圖片檔案在牌桌 `worker/files.ts`（R2 `bridgebook-files`、一次性憑證、每天 30 張、簽名短效網址 `/api/files/<key>?e=&s=`），橋譜 `lib/imageUpload.ts` 縮圖與上傳，還沒有頁面用。型別與呼叫在 `lib/account.ts`、介面文字在 `strings-account.ts`，都不進首頁。**要人做**：`npx wrangler r2 bucket create bridgebook-files`，再在牌桌開小 PR 把 `wrangler.jsonc` 的 `FILES` binding 取消註解（牌桌 DEPLOY.md §4.8）；之前圖片上傳一律回 503 `filesOff`，其他功能不受影響。
- **K2 制度集同步到牌桌與差異報告**（PR #9，牌桌 #168，2026-10-28）：`/integrations/table`（bookEdit，lazy，管理頁有連結）選制度集，在瀏覽器用 `toSystemSpec` 轉好，「重新同步到牌桌」存到牌桌（`PUT /api/book/system-spec/:id`；Worker 沒有內建特約、轉換超過免費方案 CPU，所以不在 Worker 轉）。TKB 用淡江制度時**叫牌仍照牌桌已驗證的規則**，叫出的叫品在 `SYSTEM_PROFILE_ID`（預設 `club`）同步過的規則裡有同一叫牌過程＋同一叫品時，說明附上橋館原文（牌桌 `AuctionCall.book`）。報告頁分批問牌桌規則（`POST /api/book/robot-meanings`），列出讀法不同、牌桌沒有規則、轉不出來的叫品。**上線後要人做**：在報告頁按一次「重新同步到牌桌」（`club`），之後內容改了要再按。頁面文字放 `pages/tableReportStrings.ts`、呼叫放 `lib/tableSync.ts`，不進首頁。
- **K4 幹部補手牌條件**（PR #17，牌桌 #171，2026-10-28）：叫品列新增選填 `conditions`（`hcp`／`len`／`forcing`，型別 `SpecConditions`），是給機器人的結構化補充，**不改原文、網站不顯示、內建特約不填**（測試鎖住）。報告頁「轉不出來的叫品」裡叫牌過程與叫品讀得出來的三類（列出幾種牌、括號裡有手牌條件、讀不到點力張數）每列有「補條件」，另有「幹部補過手牌條件的叫品」面板可改或清除；存檔走線上內容（`PUT /api/book/conventions/:slug`，所以該特約會有線上版本，規則 5），寫在社團版同段落、同叫品、同文字、同叫牌過程的列；制度集覆寫過文字的列（`changeRow` 會丟掉條件）目前沒有補的畫面。`toSystemSpec` 把有條件的列轉成 `filled: true` 的規則（`shows` 就是條件），牌桌 Worker 存檔時用 `conditionsProblem` 檢查。快照不變（798 條規則／1015 列）。補完要再按「重新同步到牌桌」；機器人要不要照這些規則叫牌仍待議（`SYSTEM-SPEC.md` §7）。
- **B3 特約頁三欄、換皮、目錄 v2**（PR #7，2026-10-28）：`/c/:slug` 是書頁：麵包屑（全書目錄 › 分類 › 種類）、襯線標題、種類／程度／標籤／待確認、摘要、編號段落（第一層預設全開）、頁底來源與上一個／下一個特約；≥ 1100px 右欄「本頁」（段落深層連結＋閱讀設定），更窄時收成正文上方的摺疊清單。段落是書節（左線、無框），叫牌表細線、叫牌過程淡底；覆寫的段落左線換成覆寫色。章節編號樣式是 token `sectionNumbers`（一般 §1、中國風 一、）。目錄只列分類與特約（段落移到「本頁」），有程度篩選，待確認與外部參考在最下。**特約頁新字串放 `src/pageStrings.ts`**（只有 lazy 閱讀頁 import），不進首頁。「一般」風格配色圓角不變，但段落已不是卡片框——若要「一般」保留卡片框，用 token 切（等使用者看過再說）。
- **B5 列印 v2、其他頁換皮**（PR #11，2026-10-28）：特約頁與全書目錄掛 `components/PrintSheet.tsx`（lazy）：A4 書頁、黑白（花色紅黑）、頁尾頁碼、特約頁頁眉「淡江橋館 · 特約名」；「印整本」印封面（社團、制度集、日期）＋目錄＋每個特約一頁起、頁眉是該特約名（具名 `@page`）。頁眉頁碼靠 CSS 頁邊框，Chrome 131 以上才有。登入、帳號、管理、編輯器、匯入、牌桌報告頁全部讀風格 token（`borders`／`shape`／`shadows`，輸入框 `surface` 底、聚焦 `structure`、危險 `seal`），表格共用 `components/DataTable.tsx`；這些頁的頁首字級鈕換成「閱讀設定」按鈕。
- **B4 首頁 v2 與手機工具列**（PR #12，2026-10-28）：首頁兩欄——主欄「我的制度集」卡（未登入是社團預設＋登入提示）、「第一次來」三課（`pages/HomeBlocks.tsx` 的 `FIRST_STEPS`，暫定總覽 → 1NT的答叫 → 防守信號，**待社團確認**）、分類卡；右欄「最近更新」（E11 前代替社團新聞）。這些區塊 lazy，字串在 `pageStrings.ts`。手機（< 900px）有 lazy 的底部工具列：目錄（底部抽屜）、本頁（特約頁，中間彈出清單）或我的、搜尋、閱讀設定（面板變成底部面板）；頁首不再有漢堡鈕，頁面上的閱讀設定按鈕在手機隱藏，工具列用 window 事件（`lib/toolbar.ts`）叫頁面開面板。「討論」與社團新聞、最新討論等 G6。
- **B6 個人設定、六組風格、卡片總覽**（PR #13，2026-10-28）：`/settings`「個人設定」（lazy；閱讀設定有「更多顯示設定」連結，我的帳號有「顯示」區塊）可選風格（一般／中國風／圓潤／夜讀／四色／極簡）、版面（整本一頁／三欄閱讀／專注單欄／卡片總覽）、明暗、字體（跟隨風格／襯線標題／無襯線／系統字型）、字級（多了特大）、花色顏色（四色／雙色）、密度（舒適／緊湊）。存 localStorage `tku-bridgebook:prefs`，未知值退回預設；**還沒存帳號**（要牌桌 `POST /api/account/preferences` 加欄位，另開牌桌 PR）。非預設風格在 `styles/themes/` 各一個 lazy chunk，`main.tsx` 先載入再渲染；值照 `pitch.html`，為了 AA 微調了幾個色。版面「整本一頁」（預設）＝現在的樣子不變——**注意**：規格的「整本一頁」原意是 M0 那種整本卡片，B2 拆頁後預設已是首頁＋特約頁，這裡沿用現況，`/book` 仍是整本一頁；三欄閱讀＝900px 起就有右欄、專注單欄＝無目錄置中、卡片總覽＝首頁換成 `pages/CardOverview.tsx`（分類頁籤、磁貼含待確認與覆寫數、右側預覽，手機兩欄）。視覺回歸截圖併入 B7。
- **B7 視覺回歸、無障礙回歸、移除舊 token**（PR #14，2026-10-28）——**Phase B 完成，新介面上線。** CI 多一個 `browser` job（Playwright 容器，`npm run test:browser`，設定在 `playwright.config.ts`）：`tests/browser/visual.spec.ts` 37 張截圖（首頁、特約頁、`/book`、個人設定 × 桌機／手機 × 淺／深；另五種風格的特約頁淺深與手機首頁；三欄、專注、卡片總覽版面；手機工具列的抽屜與面板），基準圖在 `tests/browser/__screenshots__`，**只能由 CI（Linux 容器）產生**，改了外觀就下載失敗 job 的 `browser` artifact 換上；`tests/browser/a11y.spec.ts` 用 axe（WCAG 2.1 A／AA）掃同樣的頁面與六種風格，加鍵盤巡覽；Lighthouse 加 `/settings`。axe 抓到並修好：Logo 與上一個／下一個連結的名稱和看得到的字不符（WCAG 2.5.3）、目錄「待確認」數量白字琥珀底只有 2.5:1（改成和待確認標籤同色——**「一般」唯一的外觀變動**）、手機目錄抽屜 Esc 關不掉、「本頁」清單的段落標題有花色時被拆成好幾欄。舊名 `radius`／`shadow`／`lantern`／`vermilion` 移除（`radius.md` 的 10px 改名 `shape.popover`，值不變、測試鎖住）；`DESIGN.md` 改寫為 v2 現行樣式，`DESIGN-V2.md` 標註為已實作。
- **C1 制度集編輯與比較**（PR #15，2026-10-28；兩個 subagent 各一個 worktree 平行做）：`/profiles/:id/edit`（e1-t14）採用三選一、叫品列「改成…」、段落「換成…」（沿用編輯器的 `SectionForm`）、備忘，整份帶 `baseVersion` 存，409 時要重新載入；沒有 `access.edit` 唯讀。`/profiles/:id/compare`（e1-t15，AC-1.7）列這一層的採用、覆寫（原文＝母制度集解析後 vs 覆寫後）、失效的覆寫，「到該段」連特約頁。入口是管理頁新的「制度集」面板；頁首的制度集選單還沒有「編輯」連結（會進首頁 JS），C4 的隊伍頁、搭檔頁再加入口。摘要／標籤覆寫、改母制度集、可見範圍、新增刪除制度集都還沒有畫面。**E1 全部完成。**
- **C4 隊伍頁、搭檔頁、複製制度集**（PR #16，2026-10-28；牌桌不需改動）：`/teams` 隊伍列表、`/teams/:id` 隊伍頁（隊員與隊長、隊伍制度集入口、各搭檔相對隊伍的覆寫／不採用／另採用數，連搭檔頁與比較頁）、`/pairs/:id` 搭檔頁（兩人、所屬隊伍、接受／婉拒／收回／結束、這對的制度摘要）；制度集入口是共用的 `ProfileEntries`（讀制度＝切換到該制度集回首頁、與母制度集比較、有 `access.edit` 才有編輯），補上 C1 說的入口。我的帳號多「我的隊伍與搭檔」（自己的隊伍、搭檔與邀請，邀請搭檔可選共同所屬的隊伍）；帳號選單多「隊伍與搭檔」。**複製（e2-t09）**：搭檔制度集接受時才建立，所以放在搭檔頁——剛組成時說明可直接從隊伍開始，或選看得到的隊伍／搭檔制度集複製採用與覆寫（備忘不複製），瀏覽器組好用 `saveProfile` 存。頁面 lazy，字串在 `pages/teamStrings.ts`，純函式在 `lib/teams.ts`。**制度卡入口等 D4**（`e3-t11`）；「建議統一」是 F4。
- **I1 練習（意義題）**（PR #18，2026-10-28）：`lib/quiz.ts` 的 `generateQuizzes` 從讀者制度集解析後的內容出意義題（叫牌過程＋叫品 → 四選一的意義），題目、答案、干擾項全部是原文逐字（干擾項取同表其他列，不足取同特約其他表）；`pending` 的列與 `pending` 段落裡的列、意義空白或只有「同上」的列不出題也不當干擾項，`skipped` 回報原因。內建 19 個有叫牌表的特約共 1638 題，測試逐題對回原文。`/practice`（lazy，包在 `ProfiledContent`）選制度集、特約、程度、題數，答完顯示原文叫牌表、「去讀原文」深層連結、下一題，結束頁列答錯的題；入口是首頁「我的制度集」卡的「練習叫牌」與特約頁的「練這個特約」（`/practice?c=<slug>`）。字串在 `pages/practiceStrings.ts`。成績、錯題本、修題是 I2。
- **D3 制度卡預覽、補格、列印**（PR #19，牌桌 #170，2026-10-28）：`/cards/:profileId/:templateId`（lazy，入口在制度集比較頁「看制度卡」）照版型的點數寬度畫 WBF、簡易卡單面、雙面（白紙黑線，任何風格都一樣，顏色是 `tokens.ts` 的 `cardColors`）；版型頁籤、制度集選單；hover 顯示 Guide 說明，點格子在右欄看說明、來源（連回段落）與補格；每格右上「§」連回段落；隊伍／搭檔層的內容淡色底（列印改底線）；填入問題與放不下的格子列在上方。人工補格存 `SystemProfile.cardEdits`（牌桌 `shared/protocol.ts` 新增 `ProfileCardEdit`、`PROFILE_LIMITS.cardEditsMax`），沿制度集繼承，雙面簡易卡與單面共用；`toInput` 帶著補格，制度集編輯器存檔不會清掉。列印／「下載 PDF」走瀏覽器列印：A4 橫式、每張一頁、附頁另起、雙面卡一頁並排兩份。**要人做**：Safari、Firefox 列印與實際印出對照官方檔的格線（AC-3.4 未勾）；WBF 附頁很長（社團預設約 30 頁，濃縮規則是 D2 的），要不要縮短等幹部看過再說。版型的列高只有 WBF 量過（`cards/types.ts` 的 `CardPage.lineHeight`），簡易卡暫用 1.5 倍字級。
- **F1 送審狀態機、`bookReview`、審計紀錄**（PR #21，牌桌 #173，2026-10-28）：新權限 `bookReview`（「審核發布」；審核者一定也是編輯者，牌桌存權限時補 `bookEdit`，管理頁兩個勾選連動）。**發布特約、退回、隱藏、還原改為審核者的**；編輯者只能「儲存草稿」「送審」。每個特約一份共用草稿（牌桌 `book:wip:<slug>`，`draft → in-review → published`，退回回 `draft` 附理由），讀者的 manifest／內容 API 不含草稿；**舊的線上內容（沒有 `status`）視為已發布**，不搬資料。編輯器打開時先抓草稿、帶 `draftRevision` 防同時修改；審核者有「直接發布」／「發布」「退回」。管理頁多「草稿與送審」（F2 的 `/review` 之後取代）與「審計紀錄」（最近 200 筆，發布類連到 `/edit/:slug?rev=<id>` 標出那一版；牌桌 `audit:<時間>-<id>`，含分類與制度集的變更）。呼叫在 `lib/reviewApi.ts`、文字在 `pages/reviewStrings.ts`（都不進首頁）。**要人做**：管理員在社團管理給制度負責人勾「審核發布」——在那之前只有管理員能發布（PRD e8 未決問題「誰是第一個 `bookReview`」）。還沒做：`club` 制度集仍由編輯者直接存（PRD 目標要送審，之後排）。
- **G2 個人檔案頁與討論區型別**（PR #22，牌桌 #174，2026-10-28）：「我的帳號 › 個人檔案」可改顯示名稱、自評程度、常用制度、自我介紹（每次存整份）；`/u/:id` 社員檔案頁（lazy，**只有登入社員看得到**——保守預設，要公開給誰再說）：頭像、名字、程度、制度、介紹、隊伍（含封存）與現役搭檔，隊伍頁、搭檔頁的社員名字連過來；最近貼文等 G3。牌桌新增 `GET /api/club/members/:id/teams`；牌桌名牌與社員分頁改用顯示名稱，牌桌頁的名牌從大廳補上傳的頭像（之前一直是預設頭像）——**AC-11.1 完成**。論壇型別在牌桌 `shared/forum.ts`，橋館複本 `lib/forum.ts`（逐型別對拍），內建四板 `news`／`deals`／`systems`／`chat`；`hand` 區塊是 `cards: Card[]`，貼文不放特約的叫品表。字串在 `strings-account.ts`。
- **H1 導讀、程度標籤、入門版、新生提示**（PR #20，牌桌 #172，2026-10-28）：區塊種類 `intro`（導讀：`why`／`when`／`pitfalls`，社團撰寫、不進制度卡、AI 匯入不產生，牌桌 `checkSections` 接受）有顯示與編輯器表單，**內建特約都還沒有導讀，要幹部寫**。段落 `level` 和上一層不同時標題旁顯示程度標籤。偏好 `reading`（完整版／入門版，閱讀設定的「版本」）：入門版用 `lib/levels.ts` 算出進階、高階段落（沒標跟上一層）並以 `hidden` 隱藏，原處「還有 n 段」＋「這頁顯示全部」，深層連到被藏的段落時整頁顯示，列印照模式。**內建特約沒有段落層級的 `level`，所以進階、高階特約在入門版只剩摘要**；要新生看的段落請幹部標 `level: 'basic'`。「你是新生嗎？」（`NewcomerPrompt`，lazy）只問未登入的第一次訪客，答過或關掉記在 `newcomerAsked`，舊讀者（之前存過設定）不問。字串在 `pageStrings.ts`。
- **H3 學習路徑**（PR #29，牌桌 #181，2026-10-29）：`/learn`、路徑頁、課次頁（目標、閱讀＝特約或段落連結、題目數、自我檢核、上一課／下一課）、路徑編輯 `/learn/:pathId/edit`（bookEdit，存在牌桌 `book:path:<id>`，可還原為內建）。進度只記登入社員（`pathprogress:<userId>:<pathId>`），路徑頁百分比、我的帳號「學習進度」。首頁「第一次來」改為「從零開始」前三課＋「看全部 8 課」。**內建「從零開始」只排了 8 個入門特約的順序，課次標題＝特約名稱，目標與檢核空白，要幹部線上寫**（CONTENT_GUIDE §6.4）；順序也待確認。題目連結是 I3 的 `e4-t10`。全部 lazy，首頁 JS 148.60（F2、J3、J5 合併後量，H3 本身約 +0.13，只有路由）。
- **G3 論壇 Worker**（PR #24，牌桌 #177，2026-10-28）：牌桌 `worker/forum.ts`：SQLite 五張表（`forum_boards`、`forum_posts`、`forum_comments`、`forum_reactions`、`forum_reports`）、內建四板、板面 CRUD（管理員）、貼文 CRUD、分頁（置頂在上、一頁 20）、置頂與鎖定、留言（巢狀一層）、反應（五種、每人每則一種）、`@` 提到（存在 `mentions`）、每人每分鐘 5 則的速率限制、`GET /api/forum/latest`（首頁兩區塊）。橋館只加型別與 lazy 的 `lib/forumApi.ts`，畫面是 G5／G6。**保守預設**：幹部暫時＝管理員（`forumModerate` 等 G7）、討論區只給登入社員、審計與檢舉 API 留給 G7、SQL 表不在每日備份、刪帳號不刪貼文。
- **I2 成績、錯題本、修題**（PR #25，牌桌 #176，2026-10-28）：練完一次存成績——登入存帳號（牌桌 `quizlog:<userId>:<時間>-<id>`，每人最新 100 次，`/api/book/quiz/rounds`），未登入只存這台瀏覽器（`tku-bridgebook:quizRounds`），兩邊不合併。`/practice/scores`：總答對率、各特約答對率（弱的在前）、錯題本（最後一次答錯的題）、最近的練習、清除；練習頁「出題範圍」可選只練錯題（`?wrong=1`）。`/practice/fixes`（bookEdit）：停用、改正解或選項、手動出題（意義題或附牌的叫品題，只在出題時的制度集出現），存牌桌 `book:quizfix:<id>`（每日備份）；自動題的修正記著修正時的原文（`basis`），**原文改了就不套用**，修題頁標「目前不套用」要幹部重新確認。修題頁不建議任何內容（硬性規則 1）。型別在 `lib/quizRecords.ts`（牌桌 `shared/quiz.ts`），頁面與字串都 lazy。
- **J1 文章模型與儲存**（PR #23，牌桌 #178，2026-10-28）：`Article` 型別（`types/article.ts`）與只有文章用的 `heading`／`quote`／`image` 區塊（不進特約的 `Block`），`BlockView` 會畫；`lib/articles.ts` 檢查、整理、搜尋文字。牌桌 `worker/articles.ts` 存 `article:entry:<slug>`＋版本（與 `BookEntry` 同法、每日備份涵蓋），API `GET /api/book/articles[/:slug]`（不用登入；`members-only` 要登入、隱藏的只給編輯者）、發布／隱藏（bookReview）、版本（bookEdit）。圖片與封面存 G1 上傳的檔案 key，牌桌讀取時簽好網址放 `files`，**R2 還沒建（`filesOff`）時文章照讀、圖片顯示替代文字**。只有已發布路徑；文章草稿與送審等 e5-t07 編輯器。**沒有寫任何文章內容**；文章頁、叢書頁是 J3。AC-5.1 的「文章頁渲染全部區塊」等 J3 才勾。
- **D4 制度卡 Word、版本與分享、段落旁位置、隊伍入口**（PR #26，牌桌 #179，2026-10-28）：**Word**（`e3-t08`）：`cards/docx.ts` 用 `docx` 套件（lazy chunk，約 425 kB 未壓縮，只在按「下載 Word」或發布時載入）把版型重建成固定欄寬、固定列高的表格（twips），每頁一節、補充說明接在後面；WBF 卡可選 Gill Sans（Gill Sans MT），中文用微軟正黑體。列高固定所以卡面不會跨頁，比格子長的字在 Word 會被截掉（卡頁的「放不下」清單照舊）。**版本與分享**（`e3-t09`）：卡頁多「版本與分享」：能編輯制度集的人「發布這一版」（存當時填好的卡＋Word 檔到牌桌 `book:cardsnap:*`），列表看各版、開舊版 `/cards/:profileId/:templateId/v/:n`（唯讀、可列印、下載當時的 Word 檔）；有 `share` 的人（編輯者、隊長、現役搭檔）可開關分享，分享中的版本不用登入就能看，關掉就失效；刪制度集時版本一起刪；審計多 `card:publish`／`card:delete`。API 在 `lib/cardApi.ts`（不進首頁）。**段落旁位置**（`e3-t10`）：特約頁每個被 `cardSlots` 引用的段落（與整個特約 `*`）顯示「在制度卡的位置：WBF 卡 · …」，連到讀者制度集的那張卡並選好那一格（`?cell=`）；版型是 lazy chunk，只在有引用時載入。**入口**（`e3-t11`）：隊伍頁、搭檔頁的制度集入口多「制度卡」，隊伍頁多「印全隊制度卡」（`/teams/:id/cards/:templateId`，每對搭檔的卡接著印，看不到的制度集只計數）。**要人做**：用 LibreOffice 開 Word 檔對照版面、實際印一次（AC-3.5 未勾）；WBF 附頁長度照舊等幹部看。
- **D5 棕標申報表**（PR #27，牌桌 #180，2026-10-29，`e3-t12`）：特約多選填欄位 `brownSticker`（`opening`／`overcall`，編輯器「棕標」，牌桌 `checkConvention` 也檢查）；制度集採用的特約裡每個標了的，制度卡頁多一個分頁「棕標開叫申報表 · 特約名」（`/cards/:profileId/bsc-opening/:slug`），版型 `bsc-opening`／`bsc-overcall` 照中華橋協下載的 WBF BSC .docx（A4 直式、9530 twips 寬的表格）。表只由那個特約自己的 `cardSlots` 填（格子 id 在 `CONTENT_GUIDE.md` §2.2），沒寫就把整個特約放進 Detailed Description、接附頁；補格存 `bsc-opening.<slug>.<格子>`；可下載 Word、列印；連到中華橋協下載專區的 Systems Policy。申報表沒有版本與分享、全隊制度卡不印。**內建特約都沒有標**（測試鎖住）：哪些算棕標要幹部依 Systems Policy 判斷後在編輯器標，再補 `bsc-*` 的 `cardSlots`。**要人做**：牌桌 #180 先合併部署；用 Word／LibreOffice 開申報表看一次。
- **F2 段落 diff、審核頁、版本比較**（PR #28，2026-10-29，牌桌不需改動）：`lib/diff.ts` 的 `diffConventions` 以段落 `id` 對齊、段落內拆成行（叫品列以 `call` 對齊），只回傳新增／刪除／修改的行，`inlineDiff` 標出改了哪幾個字；畫面 `components/DiffView.tsx`。`/review`（lazy）列草稿，`/review/:slug` 是草稿對讀者現在看到的版本的差異，審核者發布或退回；管理頁「草稿與送審」改連過來。編輯器版本紀錄每版多「與這版比較」（對編輯中的內容或任一其他版本）。**「通知編輯者」移到 F4**（`e8-t10` 建 `book:*` 通知種類時一起做）。字串在 `reviewStrings.ts` 的 `diffText`。
- **J5 電子書**（PR #32，牌桌 #184，2026-10-29）：`/library/book` 依系列列出電子書、`/library/book/:id` 書頁與站內 PDF 閱讀器（pdf.js，只在書頁 lazy 載入；頁碼、縮放、全螢幕、手機滑動換頁）。審核者上傳 PDF（一次性憑證直傳 Worker、≤ 50 MB、授權必選無預設、封面沿用 G1 圖片上傳）、改資料、換檔、下架。`members-only` 未登入時列表沒有、單本 404，PDF 簽名網址 15 分鐘失效（AC-5.6）。牌桌記 R2 用量，超過 8 GB 通知管理員、超過 10 GB 拒絕上傳。**沿用 `bridgebook-files`，bucket 還沒建（牌桌 DEPLOY.md §4.8）前上傳回 503、書頁讀不到檔案**。叢書頁 `/library` 的介紹連到電子書。首頁 JS 只多約 0.06 kB（兩條 lazy 路由；與 F2、J3 合併後 148.4 kB）。
- **首頁 JS 148.6／150 kB**（H3 後 148.6（含 F2、J3、J5）：H3 四條 lazy 路由；D5 後 148.1：編輯器的棕標欄位文字與檢查；D4 後 147.8：兩條 lazy 路由；J1 後 147.6，`api.ts` 多文章的呼叫；I2 後 147.5，多兩條 lazy 路由；H1 後 147.4，偏好多兩欄與新生提示的判斷；G2 後，多一條 lazy 路由；D3、F1 後 147.0：F1 的呼叫與文字都 lazy、首頁不變；D3 兩條路由與 `cardColors`；I1 後 146.6；C4 後 146.5、帳號選單多一項；B7 後 146.1、B6 後 146.0、B4 後 145.2、B3 後 149.2、B5 後 149.0）：`vite.config.ts` 的 rolldown `codeSplitting` group（`tags: ['$initial']`）把首頁靜態載入的模組合成一個 chunk——原本被切成 12 塊，lazy 模組多 import 一個共用模組就會再多切一塊、多幾百 bytes。之後的功能仍一律 lazy，`strings.ts` 也算在首頁裡；lazy 頁的字串放各自的字串模組（`pageStrings.ts`、`strings-account.ts`、`tableReportStrings.ts`）。
- **J3 叢書頁、文章頁、系列、搜尋含文章**（PR #30，牌桌 #183，2026-10-29）：`/library` 依系列分書架（沒封面用系列色＋書名生成）、系列／程度／作者篩選與叢書頁搜尋框；`/library/:slug` 書頁版面、全部現有區塊（`deal`／`play` 等 J2）。兩頁同一個 lazy chunk（`pages/LibraryPage.tsx` 的 `Library`），字串在 `libraryStrings.ts`、呼叫在 `lib/libraryApi.ts`。系列沒存過用內建六個（`lib/series.ts`，PRD 列的主打、擠牌、防守、叫牌理論、社課講義、社史），管理頁「叢書系列」整份存 `PUT /api/book/series`（牌桌 `article:series`）。搜尋框聚焦時另抓 `GET /api/book/articles?text=1`（牌桌算好每篇的文字），文章不進建置時的索引。首頁「我的制度集」卡多「叢書」按鈕。首頁 JS 148.27 kB（+0.22）。AC-5.7 勾；AC-5.1 等 J2。
- **下一批**（前提都已滿足，可平行開）：L2 錯誤回報與分析（B6，若決定做）、H2 名詞解釋（H1）、I3 叫品題與課次連題目（I2、H3 已完成）。之後：G5（發文框、貼文卡，G3、G4 已完成）起依序；K3 等 J2。
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
| 測試、CI、PWA、無障礙 | 良好 | 維持；B7 加了視覺回歸與 axe（CI `browser` job） |

## 5. 不做或延後的

- **Markdown 編輯器**：維持結構化區塊；文章需要的區塊（標題、牌例、圖）在 E5 加。
- **評論區**：等牌桌 E13 論壇做好再嵌入。
- **AI 問答（問制度）**：有 RAG 價值但要成本控管，M3 再評估。
- **多語**：介面只做繁體中文；內容的英文術語保留。
- **再生一份架構文件**：`ARCHITECTURE.md` 是唯一來源，E1／E10 做完時更新它，不另開。
