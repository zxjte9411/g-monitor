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

## 🛠️ 安裝與使用 (Installation)

### 方式 A：使用 npx (免安裝，推薦)
如果您只想快速查看狀態，無需安裝任何東西：
```bash
npx @zxjte9411/g-monitor status --tui
```

### 方式 B：全域安裝 (NPM)
如果您想長期使用：
```bash
npm install -g @zxjte9411/g-monitor

# 登入驗證 (只需一次)
g-monitor login

# 啟動 TUI 儀表板
g-monitor status --tui
```

### 方式 C：本地開發 (Bun)
如果您想貢獻程式碼或修改功能：
```bash
git clone https://github.com/zxjte9411/g-monitor.git
cd g-monitor
bun install
bun run build
bun run src/index.ts status --tui
```

## 🎮 操作指南

### 1. 登入 (Login)
```bash
g-monitor login
```
*登入後會自動識別您的 Email 並將其設為活躍帳號。*

### 2. 多帳號管理 (Multi-Account)
```bash
# 列出所有已登入帳號
g-monitor account list

# 切換到特定帳號
g-monitor account use user@example.com

# 移除帳號
g-monitor account rm user@example.com
```

### 3. TUI 儀表板 (Dashboard)
啟動即時更新的監控介面：
```bash
g-monitor status --tui
```
**快捷鍵：**
- `R`: 立即刷新 (Refresh)
- `S`: 切換帳號 (Switch Account)
- `F`: 切換過濾器 (Filter: All/Prod/Daily)
- `G`: 切換分組排序模式 (Group: Name/Pool/Status)
- `V`: 切換顯示模式 (View: Bar/Percent)
- `↑ / ↓`: 捲動列表
- `Q`: 退出程式 (Quit)

## 📋 輸出說明
- **Model Name (Pool)**：模型名稱與所屬配額池（如 `[Prod/Antigravity]`）。
- **Remaining %**：剩餘百分比（0% 顯示紅色，<10% 顯示黃色）。支援 Bar 模式顯示進度條。
- **Reset Time**：人類易讀的重置倒數（如 `(Resets in 2h 15m)`）。

