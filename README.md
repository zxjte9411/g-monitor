# g-monitor

`g-monitor` 是一個專為開發者設計的 Google AI 模型配額監控 CLI 工具。它結合了 VS Code Cloud Code Assist 與 Gemini CLI 的特性，讓您能一鍵掌握所有 Google 內部模型（包含 Preview 版本）的配額狀態。

## 🎯 撰寫目的
在進行跨平台開發或測試 Gemini Preview 模型時，各個環境（如 VS Code、Cloud Shell、Gemini CLI）的配額往往是分開計算且重置時間不一的。開發者經常遇到「此環境配額已滿」卻不清楚何時恢復的情況。`g-monitor` 的誕生是為了打破資訊孤島，提供一個統一、透明且易讀的監控介面。

## 🚀 主要用途
- **全維度掃描 (Global Sweep)**：同時監控 Production (24h 重置) 與 Daily Sandbox (5h 重置) 兩大配額池。
- **身分偽裝 (Deep Impersonation)**：完美模擬官方身分以避開 Private API 403 報錯，並解鎖 `gemini-3-pro-preview` 等隱藏模型。
- **智慧名稱翻譯**：將深奧的內部 ID（如 `gemini-3-pro-high`）翻譯為直覺的名稱（如 `Gemini 3 Pro Preview (High)`）。
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

### 3. 查看狀態
顯示排序後的完整模型配額清單：
```bash
# 查看所有環境配額
bun run src/index.ts status

# 只看 Production (24h) 配額池
bun run src/index.ts status --prod

# 只看 Daily Sandbox (5h) 配額池
bun run src/index.ts status --daily
```

## 📋 輸出說明
- **Model Name (Pool)**：模型名稱與所屬配額池（Prod/Daily）。
- **Remaining %**：剩餘百分比（0% 顯示紅色，<10% 顯示黃色）。
- **Reset Time**：人類易讀的重置倒數（如 `(Resets in 2h 15m)`）。

---
*本專案採統一 LF 換行格式與 GPG 安全簽名提交。*
