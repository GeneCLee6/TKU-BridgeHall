# DESIGN — TKU BridgeBook · 淡江橋譜

所有數值都定義在 `src/styles/tokens.ts`，元件只透過 styled-components 的 theme 取用，不寫死色碼。

## 1. 設計原則

1. **內容優先**：叫牌表要清楚、好掃讀；裝飾退到後面。
2. **逐層揭露**：先看名稱與摘要，需要時再一層層展開（Swagger UI 的操作方式）。
3. **不只靠顏色**：花色、狀態都有符號或文字輔助。
4. **淡江藍為主色**，宮燈金與朱紅作點綴。

## 2. 色彩

本文描述的是預設風格「一般」。`tokens.ts` 有**風格**這個維度（`createTheme(mode, textSize, style)`）：每種風格是一組完整的 token（色彩、`shape` 圓角、`borders` 線、`shadows` 陰影、字體、「待確認」樣式），元件只讀 token、不判斷風格。「一般」的值就是下面這些，有測試鎖住（`tests/styles/tokens.test.ts`）。另一組「中國風」（宣紙、朱紅、青花、襯線標題、雙線框、印章式待確認）已在 token 裡，個人設定面板（e9-t15）做好之前沒有入口；其餘四種在 e9-t16。風格規格見 `docs/DESIGN-V2.md` §10.5，值以 `docs/design/pitch.html` 為準。

### 2.1 介面色（淺色／深色）

| Token | 淺色 | 深色 | 用途 |
| --- | --- | --- | --- |
| `bg` | `#f4f6fa` | `#0d1320` | 頁面背景 |
| `surface` | `#ffffff` | `#151d2c` | 卡片、頁首、側邊欄 |
| `surfaceAlt` | `#eef2f8` | `#1c2637` | 巢狀段落、叫牌過程表 |
| `border` | `#d5dce8` | `#2c3850` | 分隔線 |
| `text` | `#1a2233` | `#e6ebf3` | 內文 |
| `textMuted` | `#4f5a70` | `#a3afc4` | 次要文字（對比 ≥ 4.5:1） |
| `primary` | `#0f3d7a` | `#8db8ff` | 淡江藍：連結、主要強調、第一層段落左框 |
| `primaryStrong` | `#0a2b57` | `#b5d0ff` | 特約名稱 |
| `primarySoft` | `#e3ecf8` | `#1b2c4a` | 卡片標題列、選取狀態 |
| `lantern` | `#d9a330` | `#e7b850` | 宮燈金：巢狀段落左框、Logo 點綴 |
| `vermilion` | `#b8321f` | `#ff8a70` | 朱紅：Logo 點綴 |
| `focus` | `#2f6fd6` | `#8db8ff` | 鍵盤焦點框 |
| `pending*` | 米黃底、琥珀框 | 深褐底、金框 | 「待確認」標示 |
| `warning*` | 淡紅底、紅框 | 深紅底、紅框 | 原文 P.S. 等注意事項 |

### 2.2 花色

固定使用四色牌，不提供切換。

| 花色 | 淺色 | 深色 |
| --- | --- | --- |
| ♠ | `#1a2233` | `#e6ebf3` |
| ♥ | `#c8102e` | `#ff6b6b` |
| ♦ | `#b34700`（橘） | `#ffa04d`（橘） |
| ♣ | `#1b7a33`（綠） | `#5fd27a`（綠） |

列印時固定為紅（♥♦）與黑（♠♣）。

## 3. 字體

- 內文：**Noto Sans TC**（`@fontsource-variable/noto-sans-tc`，可變字重，依 unicode-range 分片載入），備援 PingFang TC、Microsoft JhengHei。
- 標題字體跟隨風格（`fonts.heading`）：「一般」與內文相同；「中國風」用 **Noto Serif TC** 600（`@fontsource/noto-serif-tc`，依 unicode-range 分片）。襯線字型只在選了需要它的風格時才載入（`styles/fonts.ts` 動態載入樣式表），「一般」不下載。
- 花色符號：優先使用 Segoe UI Symbol／Apple Symbols，避免部分 CJK 字型把 ♠♥ 畫成 emoji 或寬度不一。
- 字級：內文 16px、行高 1.7（中文需要較寬鬆的行距）；表格 15px；次要說明 13–14px；特約名稱 20px／700。以上是「中」字級的大小。
- 使用者可選字級「小／中／大」（頁首的切換鈕，手機在目錄抽屜）：根字級 87.5%／100%／112.5%，用 rem 的文字、表單元件與側邊欄寬度一起縮放。用百分比是為了保留瀏覽器本身的字級設定。
- 表單元件：桌機高 36px、字 15px，標籤 13px、提示 12px；手機至少 40px、字至少 16px（小於 16px 時 iOS 會在點進輸入框時放大畫面）。
- 叫品使用 `tabular-nums`，讓數字對齊。

## 4. 間距與形狀

- 4px 基準：`space(n) = n × 4px`。卡片內距 16px，段落間距 8px，分類間距 40px。
- 圓角：`sm 6px`（按鈕、表格）、`md 10px`（段落）、`lg 14px`（卡片）、`pill`（標籤、搜尋框）。新元件與換過皮的元件改讀依角色命名的 `shape`（`control` 按鈕與輸入框、`panel` 面板、`tag`、`badge`、`note` 提示框）與 `shadows.panel`；`radius`、`shadow` 與色彩的 `lantern`、`vermilion`（改名 `accent`、`seal`）是舊名，e9-t14 移除。
- 版面：頁首 60px、側邊欄 19rem（「中」字級為 304px，放得下最長的特約名稱）、內容最寬 60rem（960px）；900px 以下切換為行動版。
- 表單：短欄位兩兩並排（名稱、網址代稱與分類），長文字（摘要、標籤、別名、段落摘要）獨佔一列並自動換行。欄位一律靠上對齊，旁邊有提示文字的欄位不會把同列的輸入框撐高。

## 5. 元件

| 元件 | 檔案 | 說明 |
| --- | --- | --- |
| ConventionCard | `components/ConventionCard.tsx` | 一個特約。收合時：中文名、英文名、摘要、標籤、待確認數量；展開後：本特約展開／收合、段落、來源。 |
| SectionAccordion | `components/SectionAccordion.tsx` | 遞迴的段落收合。第一層左框為淡江藍，更深層為宮燈金，背景交替。標題列含摘要與複製連結按鈕。 |
| AuctionTable | `components/AuctionTable.tsx` | 四欄叫牌過程（座位標題依原文，例如「開叫者／敵方／答叫者／敵方」），「?」以主色標示。 |
| ResponseTable（BidSequence） | `components/ResponseTable.tsx` | 「叫品／意義」表；意義下方可帶補充說明與待確認。 |
| CallLabel、Suit、RichText | `components/Suit.tsx` | 叫品與花色的唯一繪製方式；RichText 只解析花色符號與 `**粗體**`。 |
| Hand | `components/Hand.tsx` | 一手牌（♠♥♦♣ 四行），供未來的牌例使用。 |
| Tag | `components/Tag.tsx` | 膠囊形標籤。 |
| PendingNote | `components/PendingNote.tsx` | 「待確認」標記與說明。 |
| SearchBar | `components/SearchBar.tsx` | 頁首搜尋框，下拉結果為深層連結；Esc 清除。 |
| Sidebar（TOC） | `components/Sidebar.tsx` | 樹狀目錄，箭頭一律在左側、每層往內縮並有引導線。兩層下拉：分類（預設展開，顯示特約數量）→ 特約（點特約名稱展開，再點一次收起；箭頭只是狀態圖示、不能單獨點；預設收合，網址所在的特約自動展開）。目前位置高亮。行動版為抽屜。 |
| AppHeader | `components/AppHeader.tsx` | 桌機：Logo、搜尋、ViewActions。手機：只有選單按鈕、Logo 圖示、搜尋，不超出螢幕寬度。 |
| ViewActions | `components/ViewActions.tsx` | 全部展開／收合、主題、列印。桌機放頁首（圖示按鈕），手機放進選單抽屜頂端（含文字的列）。 |
| AccountMenu | `components/AccountMenu.tsx` | 頁首右端：未登入時是「登入」膠囊按鈕；登入後是名字＋選單（新增特約、匯入檔案、社團管理、我的帳號、登出，依權限顯示），有待審核申請時顯示朱紅數字。 |
| 表單元件 | `components/ui.tsx` | Button（一般／主要／危險／ghost）、Input、TextArea、Select、Field（標籤＋提示）、Panel、PasswordInput（右側眼睛按鈕切換顯示密碼）、ErrorText、Notice。 |
| 編輯器 | `components/editor/` | Outline（段落樹，手機為下拉選單）、MetaForm、SectionForm、BlockEditor（各區塊表單，左框宮燈金）、Preview（完整展開的卡片）、RevisionsPanel、SuitPalette（插入 ♠♥♦♣，不搶走輸入框焦點）。桌機版是剛好填滿視窗的工作區：段落樹、表單、預覽三欄上下緣對齊、各自捲動，整頁不捲動；手機版單欄隨頁面捲動。 |

## 6. 版面（Swagger 式）

```
┌──────────────────────── 頁首（sticky）────────────────────────┐
│ [宮燈] TKU BridgeBook 淡江橋譜   [ 搜尋 ……… ]   ⇕ ⇳ ♦♣ ☾ 🖶 │
├──────────────┬────────────────────────────────────────────────┤
│ 無王開叫後續 │ 無王開叫後續                                    │
│  雷本索特約  │ ┌ ▸ 雷本索特約  Lebensohl              🔗 ┐     │
│   ├ 遭自然…  │ │ 摘要……  [1NT] [插叫] … [2 項待確認]        │     │
│   └ 其他運用 │ └─────────────────────────────────────────┘     │
│ 競叫與防守   │ ┌ ▾ 對抗不尋常2NT …                     🔗 ┐     │
│  對抗不尋常… │ │  ┃ ▾ [原文已移除]          🔗 │     │
│              │ │  ┃   ┃ ▸ 開叫1♥時                        │     │
└──────────────┴────────────────────────────────────────────────┘
```

收合指示使用 ▸（旋轉 90° 表示展開）。

## 7. 淺色／深色、無障礙、列印

- **主題與字級**：主題預設跟隨系統 `prefers-color-scheme`，可手動切換；字級預設「中」。兩者都記在 localStorage（無法存取時照常運作）。
- **鍵盤**：Radix Accordion 提供 Enter／Space 切換、上下鍵在同層標題間移動、Home／End。所有按鈕有可見焦點框（3px）。另有「跳到主要內容」連結。
- **ARIA**：觸發器有 `aria-expanded`／`aria-controls`；標題層級 h1（頁面）→ h2（分類、特約）→ h3–h6（段落）。搜尋框有 `role="search"` 與隱藏標籤；複製連結結果以 `role="status"` 告知。
- **花色**：符號形狀本身即可區分；`Suit` 以 `role="img"` 與中文 `aria-label`（黑桃、紅心、方塊、梅花）讓螢幕閱讀器念出。
- **對比**：所有文字色在對應背景上達 WCAG AA（4.5:1）。
- **動態**：尊重 `prefers-reduced-motion`。
- **列印**：所有段落展開；隱藏頁首、側邊欄與按鈕；表格避免跨頁斷開。

## 8. Logo

### 8.1 概念

一眼看出「這是社團的制度書」，而且跟姊妹站**淡江牌桌**分得開：

- **翻開的橋譜**：主圖形是一本翻開的書，代表社團的制度與特約手冊。
- **四種花色**：左頁 ♠ ♥、右頁 ♦ ♣，用網站的四色牌配色。
- **紅色書籤**：從書脊垂下一條紅色書籤，呼應淡江宮燈的流蘇。
- **TKU 字標**：完整標誌中，書本右側是一塊深藍底、白色粗體「TKU」的字標，下緣一道宮燈金細線；旁邊接「BridgeBook」，第二行為「淡江橋譜」與「♠♥♦♣ 橋藝社制度手冊」。

### 8.2 與淡江牌桌的區分（2026-10-22 與牌桌協調）

| | 淡江橋譜 | 淡江牌桌 |
| --- | --- | --- |
| 圖形 | 翻開的書＋四色花色 | 宮燈＋黑桃，流蘇為 ♥ ♦ ♣ |
| App 圖示底色 | 淡江藍 `#0f3d7a` | 米色 `#fbf6ea` |
| 主畫面名稱 | 淡江橋譜 | 淡江牌桌 |

兩者共用淡江藍、宮燈金、紅色，看得出是同一個社團；輪廓與底色不同，手機主畫面上不會混淆。**宮燈是淡江牌桌的標誌，橋譜不再使用。**

### 8.3 色彩

| 部位 | 色碼 |
| --- | --- |
| 封面、書頁邊緣 | 宮燈金 `#f2b84b` |
| 書頁 | 米白 `#fff8e6` |
| ♠、App 圖示底、TKU 字標底 | 淡江藍 `#0f3d7a` |
| ♥、書籤 | 紅 `#c8102e` |
| ♦ | 橘 `#d35400` |
| ♣ | 綠 `#1b7a33` |

### 8.4 檔案與使用

| 檔案 | 說明 |
| --- | --- |
| `public/logo.svg` | 完整標誌（392×96）。系統為深色模式時，字樣自動改為淺色。 |
| `public/logo-mark.svg` | 只有書本圖形（64×64），透明背景。 |
| `public/favicon.svg` | 深藍圓角方底＋書本。 |
| `public/icon-192.png`、`icon-512.png` | App 圖示：深藍滿版底，書本佔 84%。 |
| `public/icon-maskable-512.png` | Android 自適應圖示：書本縮到 64%，落在安全區內，裁成圓形也完整。 |
| `public/apple-touch-icon.png` | iPhone 主畫面圖示（180×180）。 |
| `src/components/Logo.tsx` | 頁首使用的內嵌版本。顏色固定：米白書頁與金色封面在淺色、深色頁首都清楚。 |

- 最小尺寸：完整標誌寬 160px 以上；更小時改用圖形標誌或 favicon。
- 周圍留白至少為書本高度的四分之一。
- 不要改變比例、替換顏色、加陰影，或與學校校徽並列成組合標誌。
- 字樣使用系統字型繪製；正式印刷前請先轉外框。
- 本標誌為原創圖形，未使用淡江大學校徽或任何註冊商標。
