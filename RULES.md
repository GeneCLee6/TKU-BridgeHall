# RULES — 工程慣例

## 1. 分層與職責

| 位置 | 職責 | 禁止 |
| --- | --- | --- |
| `src/content/` | 只有資料，符合 `types/convention.ts` | 任何 React 或 import 元件 |
| `src/lib/` | 純函式（叫品解析、走訪、搜尋） | React、DOM、狀態 |
| `src/state/` | 展開狀態與偏好設定 | 繪製內容 |
| `src/components/` | 展示與互動 | 直接 import 內容檔（內容由 props 傳入） |
| `src/pages/` | 組合：取內容、接路由、接狀態 | 樣式細節 |

- **開放封閉**：新增特約只改 `content/`；新增區塊種類才需要改 `types` 與 `BlockView`。
- **DRY**：顏色與間距只在 `styles/tokens.ts`；叫品與花色只透過 `CallLabel`／`Suit`／`RichText` 繪製；介面文字只在 `strings.ts`。
- **KISS**：不用狀態管理函式庫、不用 Markdown 解析器、不做執行期載入內容。

## 2. 程式風格

- TypeScript strict；不使用 `any`。
- Prettier 設定見 `.prettierrc.json`（無分號、單引號、尾逗號、寬 100）。
- 只用於樣式的 prop 加 `$` 前綴（`$depth`、`$open`），避免傳到 DOM。
- import 寫出 `.ts`／`.tsx` 副檔名。
- 程式碼、註解、commit、分支名稱使用英文；文件與介面使用繁體中文。

## 3. 測試

- 內容 schema 測試（`tests/content`）是新增特約的安全網，不得刪減。
- 純函式寫單元測試；互動行為以 Testing Library 依角色（role）與名稱查詢，不依賴 class 名稱。
- 提交前：`npm run lint && npm run build && npm test` 全部通過。

## 4. Commit 與分支

- Conventional Commits：`feat:`、`fix:`、`docs:`、`chore:`、`test:`、`refactor:`、`design:`，可加範圍，如 `feat(content): add Jacoby transfer`。
- 主旨用英文、祈使句、說明「做了什麼」。
- 功能在分支上開發，以 PR 合併到 `main`；內容修改需另一位幹部審核。
