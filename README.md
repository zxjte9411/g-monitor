# g-monitor

`g-monitor` 是一個專為開發者設計的 Google AI 模型配額監控 CLI 工具。它結合了 VS Code Cloud Code Assist 與 Gemini CLI 的特性，讓您能一鍵掌握所有 Google 內部模型（包含 Preview 版本）的配額狀態。

## 🎯 撰寫目的
在進行跨平台開發或測試 Gemini Preview 模型時，各個環境（如 VS Code、Cloud Shell、Gemini CLI）的配額往往是分開計算且重置時間不一的。開發者經常遇到「此環境配額已滿」卻不清楚何時恢復的情況。`g-monitor` 的誕生是為了打破資訊孤島，提供一個統一、透明且易讀的監控介面。

## 🚀 主要用途
- **全維度掃描 (Global Sweep)**：同時監控 Production (24h 重置) 與 Daily Sandbox (5h 重置) 兩大配額池，並區分不同身分（Antigravity / CLI）的配額。
- **互動式儀表板 (TUI Dashboard)**：提供即時更新、支援鍵盤操作的終端機介面，可快速切換排序與分組模式。
- **多帳號管理 (Multi-Account)**：支援同時登入個人與工作帳號，並可一鍵快速切換。
- **身分偽裝 (Deep Impersonation)**：完美模擬官方身分以避開 Private API 403 報錯，並解鎖 `gemini-3-pro-preview` 等隱藏模型。
- **智慧名稱翻譯**：將深奧的內部 ID（如 `gemini-3-pro-high`）翻譯為直覺的名稱（如 `Gemini 3 Pro (High)`）。
- **自動 Session 續期**：內建 OAuth 2.0 Token 自動刷新機制，登入一次後即可長期使用。

## 🛠️ 使用方法

### 1. 安裝與環境準備
確保您的環境已安裝 [Bun](https://bun.com)。

```bash
cd D:/g-monitor
bun install
bun run build
```

### 2. 登入驗證
使用 Google 帳號進行授權並自動偵測 GCP 專案：
```bash
bun run src/index.ts login
```
*登入後會自動識別您的 Email 並將其設為活躍帳號。*

### 3. 多帳號管理
```bash
# 列出所有已登入帳號
bun run src/index.ts account list

# 切換到特定帳號
bun run src/index.ts account use user@example.com

# 移除帳號
bun run src/index.ts account rm user@example.com
```

### 4. 查看狀態 (CLI 模式)
顯示排序後的完整模型配額清單：
```bash
# 查看當前活躍帳號的所有環境配額
bun run src/index.ts status

# 一次查看所有登入帳號的配額 (Global View)
bun run src/index.ts status --all

# 只看 Production (24h) 配額池
bun run src/index.ts status --prod

# 只看 Daily Sandbox (5h) 配額池
bun run src/index.ts status --daily
```

### 5. 互動式儀表板 (TUI 模式)
啟動即時更新的監控介面：
```bash
bun run src/index.ts status --tui
```
**TUI 快捷鍵：**
- `R`: 立即刷新 (Refresh)
- `S`: 切換帳號 (Switch Account)
- `F`: 切換過濾器 (Filter: All/Prod/Daily)
- `G`: 切換分組排序模式 (Group: Name/Pool/Status)
- `↑ / ↓`: 捲動列表
- `Q`: 退出程式 (Quit)

## 📋 輸出說明
- **Model Name (Pool)**：模型名稱與所屬配額池（如 `[Prod/Antigravity]`）。
- **Remaining %**：剩餘百分比（0% 顯示紅色，<10% 顯示黃色）。
- **Reset Time**：人類易讀的重置倒數（如 `(Resets in 2h 15m)`）。

---
*本專案採統一 LF 換行格式與 GPG 安全簽名提交。*
