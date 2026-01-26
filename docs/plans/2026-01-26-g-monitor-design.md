# g-monitor Design Document

## 1. Overview
`g-monitor` is a standalone CLI tool designed to impersonate Google's internal "Antigravity" tools (like VS Code Cloud Assist) to authenticate, discover Google Cloud Projects, and monitor both internal Antigravity quotas and public Gemini/Vertex AI quotas.

## 2. Architecture

### 2.1 Tech Stack
*   **Language:** Node.js (TypeScript)
*   **CLI Framework:** `commander`
*   **HTTP Client:** Native `fetch` (for granular header control)
*   **UI:** `chalk` (colors), `cli-table3` (tables), `ora` (spinners)
*   **Storage:** `conf` (encrypted config storage)

### 2.2 Directory Structure
```
src/
├── index.ts          # Entry point
├── auth/
│   ├── pkce.ts       # PKCE challenge generation
│   ├── server.ts     # Local loopback server
│   └── flow.ts       # Main auth logic (Impersonation)
├── api/
│   ├── client.ts     # Base HTTP client with headers
│   ├── internal.ts   # Antigravity APIs (v1internal)
│   └── public.ts     # GCP Service Usage / Vertex AI APIs
├── store/
│   └── config.ts     # Token & Project ID storage
└── ui/
    └── display.ts    # Formatting helpers
```

## 3. Authentication (Impersonation)

### 3.1 Headers
To successfully call internal APIs, all requests to `googleapis.com` will include:
*   `X-Goog-Api-Client: google-cloud-sdk vscode_cloudshelleditor/0.1`
*   `User-Agent: antigravity`

### 3.2 Flow
1.  **Initiation:** Generate PKCE verifier/challenge.
2.  **Authorization:** Open `accounts.google.com` URL with `cloud-platform` scope.
3.  **Callback Handling (Dual Mode):**
    *   **Loopback:** Attempt to listen on `localhost:0`. If callback received, close server.
    *   **Manual (Headless):** If loopback fails or `--manual` flag set, prompt user to paste code from browser.
4.  **Exchange:** Swap Code for Access/Refresh Tokens.

## 4. Project Discovery
After authentication:
1.  Call `POST /v1internal:loadCodeAssist`.
2.  Extract `cloudaicompanionProject` ID.
3.  **Fallback:** If no project found, iterate `allowedTiers` and call `onboardUser` to provision a project.
4.  Save `projectId` to config.

## 5. Monitoring (Hybrid Approach)

### 5.1 Internal Antigravity Quota
*   **Endpoint:** `POST /v1internal:fetchAvailableModels`
*   **Data:** Returns list of models (e.g., `gemini-pro`, `claude-3-sonnet`) with `quotaInfo` (remaining limits).

### 5.2 Public Gemini/Vertex Quota
*   **Endpoint:** `GET https://serviceusage.googleapis.com/v1/projects/{projectId}/services/aiplatform.googleapis.com/consumerQuotaMetrics`
*   **Data:** Returns standard GCP quotas (RPM, TPM) for Vertex AI.

### 5.3 UI Presentation
Display a unified table:
| Source | Model / Metric | Limit | Used | Remaining | Reset Time |
|--------|---------------|-------|------|-----------|------------|
| Code Assist | gemini-pro | 50 | 10 | 40 | 14:00 |
| Vertex AI | RPM | 60 | 5 | 55 | N/A |

## 6. Implementation Plan
1.  **Setup:** Initialize `package.json`, TS config, linting.
2.  **Auth:** Implement PKCE, Loopback/Manual flow, and Token Storage.
3.  **API Core:** Implement `InternalClient` with header injection.
4.  **Discovery:** Implement `loadCodeAssist` logic.
5.  **Monitoring:** Implement `fetchAvailableModels` and Service Usage fetcher.
6.  **UI:** Build the CLI table view.
