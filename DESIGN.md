# DESIGN — TKU BridgeHall · 淡江橋館

**這是現行樣式（介面 v2，E9 於 2026-10-28 全部上線）。** 所有數值都定義在 `src/styles/tokens.ts` 與 `src/styles/themes/`，元件只透過 styled-components 的 theme 取用，不寫死色碼。v2 的提案與決策過程在 `docs/DESIGN-V2.md`（已實作；尚未做的文章頁 E5、制度卡頁 E3、討論區 E11 仍以它為規格）。

## 1. 設計原則

1. **一本可以翻、可以印的橋譜**：一特約一頁，段落像書的節，不是一張張卡片；目錄在左、本頁在右、上一／下一特約在底。
2. **入口先於內容**：首頁回答「我讀哪一套制度」「新生從哪開始」「最近改了什麼」，再進內容。
3. **工具退後**：頁首只有 Logo、制度集、搜尋、網站導覽、帳號；其他收進「閱讀設定」與「個人設定」。
4. **內容優先、逐層揭露**：叫牌表要清楚、好掃讀；第一層段落預設展開，更深層需要時再展開。
5. **不只靠顏色**：花色、狀態、覆寫都有符號或文字輔助。
6. **外觀由讀者決定**：預設「一般」（淡江藍為主色，宮燈金與朱紅點綴）；另五種風格、四種版面、字體、字級、花色顏色、密度都在個人設定（§2.3）。
7. **寬螢幕要用上**（2026-10-30）：列表、磁貼、面板頁面放寬到 84rem；一長串面板的頁面左側有段落目錄；動作是有圖示的按鈕，不是一段裸文字連結。

## 2. 色彩與風格

風格（`StyleName`）是一組完整的 token：色彩、`shape` 圓角、`borders` 線、`shadows` 陰影、字體、行高、「待確認」樣式（`pendingBadge`）、章節編號樣式（`sectionNumbers`）。`createTheme(mode, textSize, style, { font, suitColors, density })` 回傳 theme；**元件只讀 token、不判斷風格**。「一般」在首頁 bundle 裡；另五種在 `styles/themes/` 各一個 lazy chunk，讀者選了才載入（`loadStyle`，`main.tsx` 先載入再渲染）。

### 2.1 「一般」的介面色（淺色／深色）

下列值有測試鎖住（`tests/styles/tokens.test.ts`），改了會失敗。

| Token | 淺色 | 深色 | 用途 |
| --- | --- | --- | --- |
| `bg` | `#f4f6fa` | `#0d1320` | 頁面背景 |
| `surface` | `#ffffff` | `#151d2c` | 面板、頁首、側邊欄、輸入框底 |
| `surfaceAlt` | `#eef2f8` | `#1c2637` | 叫牌過程表、選取底 |
| `border` | `#d5dce8` | `#2c3850` | 分隔線、表格細線 |
| `text` | `#1a2233` | `#e6ebf3` | 內文 |
| `textMuted` | `#4f5a70` | `#a3afc4` | 次要文字（對比 ≥ 4.5:1） |
| `primary` | `#0f3d7a` | `#8db8ff` | 淡江藍：連結、主要按鈕、主要強調 |
| `primaryStrong` | `#0a2b57` | `#b5d0ff` | 特約名稱 |
| `primarySoft` | `#e3ecf8` | `#1b2c4a` | 標題列、選取狀態 |
| `onPrimary` | `#ffffff` | `#0d1320` | 主要按鈕的字 |
| `accent` | `#d9a330` | `#e7b850` | 宮燈金：細線與小標記（標題下一道、Logo 屋簷），不做大面積 |
| `structure` | `#0f3d7a` | `#8db8ff` | 章節編號、段落左線、輸入框聚焦框 |
| `seal` | `#b8321f` | `#ff8a70` | 朱紅：危險文字、目前位置、通知數字 |
| `focus` | `#2f6fd6` | `#8db8ff` | 鍵盤焦點框 |
| `pendingBg`／`pendingBorder`／`pendingText` | 米黃底、琥珀框、深褐字 | 深褐底、金框、淡金字 | 「待確認」標示與數量 |
| `warningBg`／`warningBorder` | 淡紅底、紅框 | 深紅底、紅框 | 原文 P.S. 等注意事項 |
| `tagBg`／`tagBorder`／`tagText` | 同 `surfaceAlt`／`border`／`textMuted` | 同左 | 標籤 |
| `overlay` | `rgba(10, 20, 40, 0.45)` | `rgba(0, 0, 0, 0.6)` | 抽屜與彈出清單的遮罩 |
| `callPass` | `#2f9e44` | `#28863a` | 叫牌盒的 Pass 鍵（與淡江牌桌 `bidPass` 同色；深色加深一階，白字 ≥ 4.5:1；所有風格同值） |
| `callDouble` | `#d9372b` | `#d9372b` | 叫牌盒的 X 鍵（牌桌 `bidDouble`） |
| `callRedouble` | `#2b6fd6` | `#2b6fd6` | 叫牌盒的 XX 鍵（牌桌 `bidRedouble`） |
| `onCall` | `#ffffff` | `#ffffff` | 上面三個鍵的文字 |

e9-t14 移除了舊名：`lantern` → `accent`、`vermilion` → `seal`、`shadow` → `shadows.panel`、`radius.sm／md／lg／pill` → `shape.control／popover／panel／tag`（§4），值不變。

### 2.2 花色

| 花色 | 淺色 | 深色 |
| --- | --- | --- |
| ♠ | `#1a2233` | `#e6ebf3` |
| ♥ | `#c8102e` | `#ff6b6b` |
| ♦ | `#b34700`（橘） | `#ffa04d`（橘） |
| ♣ | `#1b7a33`（綠） | `#5fd27a`（綠） |

預設四色；個人設定「花色顏色」可改雙色（♦ 同 ♥、♣ 同 ♠，與牌桌「牌樣式」相同）。每種風格有自己的四色值。列印固定紅（♥♦）與黑（♠♣）。

### 2.3 六種風格與個人設定

`/settings`「個人設定」（e9-t15）存在 localStorage `tku-bridgebook:prefs`，未知值退回預設；之後會改記在帳號。

| 設定 | 選項（第一個是預設） |
| --- | --- |
| 風格 | 一般、中國風、圓潤、夜讀、四色、極簡 |
| 版面 | 整本一頁、三欄閱讀、專注單欄、卡片總覽（§6） |
| 明暗 | 跟隨系統、淺、深（夜讀在跟隨系統時一律深色） |
| 字體 | 跟隨風格、襯線標題、無襯線、系統字型（不下載網頁字型） |
| 字級 | 小、中、大、特大（根字級 87.5%／100%／112.5%／125%） |
| 花色顏色 | 四色、雙色 |
| 密度 | 舒適、緊湊（間距改 3px 基準、行高 −0.15） |

| 風格 | 特徵（值以 `docs/design/pitch.html` 為準，為了 AA 微調過幾個色） |
| --- | --- |
| 一般 | §2.1 的值；無襯線標題；面板 14px 圓角、1px 框、淡陰影；章節「§1」；膠囊式待確認 |
| 中國風 | 宣紙、墨、朱紅、青花、金；襯線標題；2px 圓角；章節「一、」；微旋轉的印章式待確認 |
| 圓潤 | 湖水青與芒果、奶油底；22px 圓角、無框、浮起陰影 |
| 夜讀 | 深色優先、琥珀；淺色版石墨＋琥珀 |
| 四色 | 純白／墨黑、2px 粗線、硬陰影、粗體標題 |
| 極簡 | 黑白灰、直角、細線、字小行緊 |

## 3. 字體

- 內文：**Noto Sans TC**（`@fontsource-variable/noto-sans-tc`，可變字重，依 unicode-range 分片），備援 PingFang TC、Microsoft JhengHei。
- 標題字體跟隨風格（`fonts.heading`）：「一般」與內文相同；中國風用 **Noto Serif TC** 600（`@fontsource/noto-serif-tc`，分片）。襯線字型只在標題是襯線時才載入（`styles/fonts.ts`）；「系統字型」什麼都不下載。
- 花色符號：優先 Segoe UI Symbol／Apple Symbols，避免 CJK 字型把 ♠♥ 畫成 emoji 或寬度不一。
- 字級（「中」）：內文 16px、行高 1.7（風格可改）；表格 15px；次要說明 13–14px；特約名（h1）2rem。根字級用百分比，保留瀏覽器本身的字級設定；rem 的文字、表單元件與側邊欄寬度一起縮放。
- 表單元件：桌機高 36px、字 15px，標籤 13px、提示 12px；手機至少 40px、字至少 16px（小於 16px 時 iOS 會放大畫面）。
- 叫品使用 `tabular-nums`。

## 4. 間距、形狀、版面尺寸

- 4px 基準：`space(n) = n × 4px`（緊湊 3px）。
- 圓角依角色（`shape`）。「一般」：`control` 6px（按鈕、輸入框、表格）、`popover` 10px（選單、搜尋結果、浮動提示）、`panel` 14px（面板、卡片）、`tag` 與 `badge` 膠囊、`note` 6px（提示框）。
- 線（`borders.control`／`borders.panel`）只給寬度與樣式，元件自己加顏色；陰影 `shadows.panel`。
- 頁首 60px、手機底部工具列 56px、側邊欄 19rem；閱讀頁（特約）主欄最寬 70rem（正文 52rem＋本頁 15rem），列表與面板頁（首頁、叢書、詞彙、帳號、管理等 `PageMain` 頁）最寬 84rem（`layout.pageMax`）；`mobileBreakpoint` 900px（以下為手機）、`wideBreakpoint` 1100px（以上特約頁有右欄「本頁」）。
- 表單：短欄位兩兩並排，長文字獨佔一列；欄位一律靠上對齊。

## 5. 元件

| 元件 | 檔案 | 說明 |
| --- | --- | --- |
| AppHeader | `components/AppHeader.tsx` | 頁首：Logo（連結名稱是看得到的字＋「首頁」）、制度集（只有社團時是不能點的膠囊 `ProfilePill`，可選時是 `ProfileSwitch` 下拉；手機在目錄抽屜）、搜尋、網站導覽、帳號。 |
| SiteNav | `components/SiteNav.tsx` | 網站導覽：橋譜、叢書、學習、練習、討論區、隊伍；目前所在的一項 `aria-current` 並在頁首底線上畫 3px 主色條。≤ 1400px 只留字不留圖示；手機不顯示，改在帳號選單最上面。 |
| WithSectionNav | `components/SectionNav.tsx` | 一長串面板的頁面（我的帳號、社團管理）：左側 13rem 黏住的段落目錄，從每個面板的 `h2` 自動產生、標出正在讀的面板；手機只有面板。 |
| BackLink | `components/ui.tsx` | 「回到…」：左箭頭＋次要色字，取代「← 文字」的裸連結。 |
| HandbookShell | `pages/HandbookShell.tsx` | 閱讀頁（首頁、特約頁、`/book`）共用的殼：跳到主要內容、頁首、目錄、主欄；依「版面」決定有沒有目錄欄；手機有底部工具列與目錄抽屜（Esc 關閉，焦點回工具列）。 |
| HomePage、HomeBlocks | `pages/HomePage.tsx`、`HomeBlocks.tsx` | 兩欄：主欄「我的制度集」卡（未登入是社團預設＋登入提示）、「第一次來」三課、分類卡；右欄「最近更新」（E11 之前代替社團新聞）。區塊 lazy。 |
| CardOverview | `pages/CardOverview.tsx` | 「卡片總覽」版面的首頁：分類頁籤、特約磁貼（程度、待確認、覆寫數）、右側預覽；手機兩欄磁貼。 |
| ConventionPage | `pages/ConventionPage.tsx` | 書頁：麵包屑、h1 特約名、種類／程度／標籤／待確認、摘要、編號段落（第一層預設全開）、頁底來源與上一個／下一個特約；≥ 1100px 右欄「本頁」，較窄時收成正文上方的摺疊清單，手機是工具列叫出的彈出清單。 |
| BookPage、ConventionCard | `pages/BookPage.tsx`、`components/ConventionCard.tsx` | `/book` 全書整本一頁：每個特約一張可展開的卡片（M0 的樣子），可「印整本」。 |
| SectionAccordion | `components/SectionAccordion.tsx` | 遞迴段落。書節樣式：左線（`structure`）、無框；第一層前綴章節編號（`sectionNumbers`：§1／一、）；標題列含摘要、複製連結、收合箭頭；覆寫的段落左線換成覆寫色並有文字標。 |
| AuctionTable | `components/AuctionTable.tsx` | 四欄叫牌過程，`surfaceAlt` 淡底、無外框；「?」以主色標示。 |
| ResponseTable | `components/ResponseTable.tsx` | 「叫品／意義」細線表格（上下線、列間淡線，不做斑馬紋）；意義下方可帶補充說明與待確認。 |
| CallLabel、Suit、RichText | `components/Suit.tsx` | 叫品與花色的唯一繪製方式；RichText 只解析花色符號與 `**粗體**`。RichText 回傳多個節點，放進 flex 容器時要包一層 `span`，否則文字與花色會各成一欄。 |
| Hand、DealDiagram、DealInput、HandInput、AuctionInput | `components/Hand.tsx`、`components/board/` | 牌例元件（E11 用）：一手牌、四家牌（桌機十字、手機四行）、4×13 選牌面板、兩列式叫牌盒（Pass／X／XX 用 `call*` 填色）。型別在 `lib/board.ts`，與牌桌相容。 |
| Tag、KindLevel | `components/Tag.tsx`、`KindLevel.tsx` | 膠囊形標籤；種類與程度標籤。 |
| PendingNote | `components/PendingNote.tsx` | 「待確認」標記與說明；樣式由 `pendingBadge` 決定（一般是膠囊，中國風是印章）。目錄的待確認數量用同一組 `pending*` 色。 |
| SearchBar | `components/SearchBar.tsx` | 頁首搜尋框，下拉結果為深層連結；Esc 清除。 |
| Sidebar | `components/Sidebar.tsx` | 全書目錄：程度篩選（全部／入門／進階／高階）、分類（可收合，顯示特約數）→ 特約（目前頁面 ● 與 `seal` 字）；待確認群組與外部參考在最下。手機為底部抽屜。 |
| ReadingSettings | `components/ReadingSettingsButton.tsx`、`ReadingSettings.tsx` | 「閱讀設定」按鈕在閱讀頁頂端右側（手機在工具列），面板 lazy：主題、字級、更多顯示設定（連到 `/settings`）、本頁全部展開／收合、列印本頁／印整本、安裝 App。Esc、×、點外面關閉；Esc 與 × 把焦點還給按鈕。手機是底部面板。 |
| MobileToolbar | `components/MobileToolbar.tsx` | 手機（< 900px）底部工具列，lazy：目錄、本頁（特約頁）或我的、搜尋、閱讀設定，都有圖示。「討論」等 G6。 |
| DisplaySettings、SettingsPage | `components/DisplaySettings.tsx`、`pages/SettingsPage.tsx` | 個人設定（§2.3），也出現在「我的帳號 › 顯示」。 |
| PrintSheet | `components/PrintSheet.tsx` | 列印用的封面、目錄、頁眉（§7），lazy。 |
| AccountMenu | `components/AccountMenu.tsx` | 未登入是「登入」按鈕；登入後名字＋選單（依權限），待審核申請以 `seal` 數字標示。 |
| 表單元件 | `components/ui.tsx` | Button（一般／主要／危險／ghost；連結做成按鈕用 `as={Link}`，前面放 16px lucide 圖示）、Input、TextArea、Select、Field、Panel、PasswordInput、ErrorText、Notice。全部讀風格 token：輸入框 `surface` 底、聚焦框 `structure`、危險 `seal`；面板用風格的 `borders`、`shape`、`shadows`。 |
| DataTable | `components/DataTable.tsx` | 管理頁與牌桌報告的表格，與叫牌表同樣的細線；只在 lazy 頁面用。 |
| 編輯器 | `components/editor/` | Outline、MetaForm、SectionForm、BlockEditor、Preview、RevisionsPanel、SuitPalette。桌機三欄填滿視窗、各自捲動；手機單欄。 |

## 6. 版面

「版面」是個人設定，由 `HandbookShell` 決定殼；手機一律單欄＋底部工具列。

| 版面 | 桌機 |
| --- | --- |
| 整本一頁（預設） | 目錄在左；特約頁 ≥ 1100px 時「本頁」在右。（名稱沿用規格；B2 拆頁後，整本一頁的書在 `/book`。） |
| 三欄閱讀 | 同上，但 900px 起就有右欄「本頁」 |
| 專注單欄 | 沒有目錄欄，正文置中（48rem） |
| 卡片總覽 | 首頁換成 `CardOverview`；沒有目錄欄 |

有目錄欄時，主欄（特約頁最寬 70rem，首頁、叢書、詞彙 84rem）在目錄以外的空間置中，寬螢幕左右留白一樣；沒有目錄欄時在整個視窗置中。頁首的帳號在最右端。特約頁右欄「本頁」只有段落清單捲動，閱讀設定面板（比右欄寬）不會被裁掉；桌機面板下方空間不夠時往上開，再不夠就在面板內捲動。

```
┌ 頁首（sticky）：[拱門] 淡江橋館 · [社團預設]  [ 搜尋 ……… ]  [登入] ┐
├────────────┬─────────────────────────────────────┬───────────────┤
│ 全書目錄   │ 全書目錄 › 花色開叫後續 › 特約        │ 本頁          │
│ 全部 入門… │ 開叫高花之滿貫詢問叫                  │ §1 前言       │
│ ▾ 無王開叫 │ Jacoby 2NT [特約][高階][11 項待確認]  │ §2 此詢問叫…  │
│   1NT的答叫│ ──────────── accent ────────────     │ §3 開叫1♠時…  │
│ ▾ 花色開叫 │ 摘要……                               │ [閱讀設定]    │
│  ●開叫高花…│ ┃ §1 前言                        ▾ 🔗 │               │
│            │ ┃   叫品  意義 ……                     │               │
│            │ ← 上一個 新低花迫叫    下一個 → …     │               │
└────────────┴─────────────────────────────────────┴───────────────┘
```

手機：頁首只剩 Logo、搜尋、帳號；底部工具列 56px；目錄與閱讀設定是底部抽屜，本頁是中間彈出清單；正文左右 16px，表格可橫向捲動，觸控目標 ≥ 44px。

## 7. 淺色／深色、無障礙、列印、回歸測試

- **主題**：預設跟隨系統 `prefers-color-scheme`，可在閱讀設定或個人設定切換；設定記在 localStorage（無法存取時照常運作）。
- **鍵盤**：第一個 Tab 是「跳到主要內容」；Radix Accordion 提供 Enter／Space、上下鍵、Home／End；所有可聚焦元件有可見焦點框；面板與抽屜 Esc 關閉並把焦點還給開啟的按鈕。
- **ARIA**：觸發器有 `aria-expanded`／`aria-controls`；標題層級 h1（頁面）→ h2 → h3–h6；搜尋框 `role="search"`；複製連結結果以 `role="status"` 告知。連結的名稱要包含看得到的字（WCAG 2.5.3），不要用意思不同的 `aria-label` 蓋掉；裝飾用的箭頭加 `aria-hidden`。
- **花色**：`Suit` 以 `role="img"` 與中文 `aria-label`（黑桃、紅心、方塊、梅花）念出。
- **對比**：每種風格、淺深色的文字色在對應背景上達 WCAG AA（4.5:1）；token 由 `tests/styles/tokens.test.ts` 檢查，實際頁面由 axe 檢查。
- **動態**：尊重 `prefers-reduced-motion`。
- **列印**（e9-t10）：A4 書頁；所有段落展開；隱藏頁首、目錄、右欄與按鈕；任何風格都印成黑白（花色紅黑），標題字體跟隨風格；表格避免跨頁。特約頁頁眉「淡江橋館 · 特約名」、頁尾頁碼。`/book` 的「印整本」：封面（社團、淡江橋館、橋譜、制度集、日期）＋目錄＋每個特約從新的一頁開始、頁眉是該特約名。頁眉頁碼靠 CSS 頁邊框（Chrome 131 以上）。
- **回歸測試**（e9-t12、e9-t13；CI 的 `browser` job，本機 `npm run test:browser`）：`tests/browser/visual.spec.ts` 以 Playwright 截圖比對首頁、特約頁、`/book`、個人設定（一般 × 桌機／手機 × 淺／深）、另五種風格的特約頁（淺／深）與手機首頁、其他三種版面、手機工具列的抽屜與面板；`tests/browser/a11y.spec.ts` 以 axe（WCAG 2.1 A／AA）檢查同樣的頁面與六種風格的首頁、特約頁，另有鍵盤巡覽測試。Lighthouse（`lighthouserc.json`）在首頁、特約頁、個人設定擋無障礙 ≥ 0.95。改了外觀要更新基準圖，做法寫在 `playwright.config.ts`。

## 8. Logo

### 8.1 概念

網站名稱是**淡江橋館 · TKU BridgeHall**（2026-10-24 改名，原淡江橋譜）。「館」收著橋譜、叢書，也是聚會討論的地方；「橋譜」保留為館內制度區塊的名字。標誌是一座館：

- **屋簷**：宮燈金的一道弧線，呼應淡江校園與牌桌的燈。
- **拱門**：屋簷下一道淡江藍的拱門，門檻那一橫就是「橋」。
- **四種花色**：門內 ♠ ♥ 上排、♦ ♣ 下排，用網站的四色牌配色。
- 線條 4／64 單位（App 圖示 4.5）、圓頭；幾何簡單到 24px 仍看得出屋簷與拱門。
- **TKU 字標**：完整標誌中，圖形右側是一塊深藍底、白色粗體「TKU」的字標，下緣一道宮燈金細線；旁邊接「淡江橋館」，第二行為「BridgeHall」與「♠♥♦♣ 橋藝社的制度與牌局」。

### 8.2 與淡江牌桌的區分

| | 淡江橋館 | 淡江牌桌 |
| --- | --- | --- |
| 圖形 | 屋簷＋拱門＋四色花色 | 宮燈＋黑桃，流蘇為 ♥ ♦ ♣ |
| App 圖示底色 | 淡江藍 `#0f3d7a` | 米色 `#fbf6ea` |
| 主畫面名稱 | 淡江橋館 | 淡江牌桌 |

兩者共用淡江藍、宮燈金、紅色，看得出是同一個社團；輪廓與底色不同，手機主畫面上不會混淆。**宮燈是淡江牌桌的標誌；舊橋譜的書本停用。**

### 8.3 色彩

| 部位 | 淺色 | 深色 | App 圖示（藍底） |
| --- | --- | --- | --- |
| 屋簷 | 宮燈金 `#d9a330` | `#e7b850` | `#f2b84b` |
| 拱門、門檻、TKU 字標底 | 淡江藍 `#0f3d7a` | `#8db8ff` | 米白 `#fff8e6` |
| ♠ | `#1a2233` | `#e6ebf3` | `#fff8e6` |
| ♥ | `#c8102e` | `#ff6b6b` | `#ff6b6b` |
| ♦ | `#b34700` | `#ffa04d` | `#ffa04d` |
| ♣ | `#1b7a33` | `#5fd27a` | `#5fd27a` |

淺色與深色就是 `styles/tokens.ts` 的 `accent`、`primary` 與四色牌。

### 8.4 檔案與使用

原稿在 `docs/design/logo/`（附 `.preview.png`），`public/` 是複本。

| 檔案 | 說明 |
| --- | --- |
| `public/logo.svg` | 完整標誌（392×96）。系統為深色模式時，圖形與字樣自動改為深色配色。 |
| `public/logo-mark.svg` | 只有圖形（64×64），透明背景，深色模式自動換色。 |
| `public/favicon.svg` | 淡江藍圓角方底（`rx` 14/64）＋米白拱門、金屋簷、亮色花色；圖形佔 87.5%。 |
| `public/icon-192.png`、`icon-512.png` | App 圖示，由 `favicon.svg` 輸出。 |
| `public/icon-maskable-512.png` | Android 自適應圖示，由 `docs/design/logo/icon-maskable.svg` 輸出：滿版藍底，圖形縮到 64%，裁成圓形也完整。 |
| `public/apple-touch-icon.png` | iPhone 主畫面圖示（180×180），由 `favicon.svg` 去掉圓角（滿版方底，iOS 自己裁圓角）輸出。 |
| `src/components/Logo.tsx` | 頁首與登入頁使用的內嵌版本。顏色取自主題（`accent`、`primary`、四色牌），跟著網站的淺色／深色切換。 |

PNG 用 `npx @resvg/resvg-js-cli --fit-width <寬> <svg> <png>` 重新輸出（不加進 `package.json`）。

- 最小尺寸：完整標誌寬 160px 以上；更小時改用圖形標誌或 favicon。
- 周圍留白至少為圖形高度的四分之一。
- 不要改變比例、替換顏色、加陰影，或與學校校徽並列成組合標誌。
- 字樣使用系統字型繪製；正式印刷前請先轉外框。
- 本標誌為原創圖形，未使用淡江大學校徽或任何註冊商標。
