# g-monitor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `g-monitor`, a CLI tool to impersonate Antigravity tools, discover GCP projects, and monitor internal/public quotas.

**Architecture:** Node.js CLI with `commander`. OAuth 2.0 PKCE flow for authentication. Hybrid API monitoring (Internal + Public).

**Tech Stack:**
*   Node.js (TypeScript)
*   `commander` (CLI)
*   `vitest` (Testing)
*   `conf` (Storage)
*   `cli-table3`, `chalk`, `ora` (UI)
*   Native `fetch` & `crypto`

---

### Task 1: Project Skeleton & Testing Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/index.ts`
- Create: `test/setup.ts`

**Step 1: Initialize project**

```bash
npm init -y
npm install typescript ts-node @types/node commander conf cli-table3 chalk ora open dotenv --save
npm install vitest @types/jest --save-dev
```

**Step 2: Configure TypeScript (`tsconfig.json`)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

**Step 3: Configure Vitest (`vitest.config.ts`)**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

**Step 4: Create Entry Point (`src/index.ts`)**

```typescript
#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('g-monitor')
  .description('Google Antigravity & Gemini Quota Monitor')
  .version('0.0.1');

program.parse(process.argv);
```

**Step 5: Add Scripts to `package.json`**

Update `scripts`:
```json
"scripts": {
  "build": "tsc",
  "start": "node dist/index.js",
  "test": "vitest run"
}
```

**Step 6: Verify**

Run: `npm test` (Should pass with no tests)
Run: `npm run build`

**Step 7: Commit**

```bash
git init
git add .
git commit -m "chore: project skeleton"
```

---

### Task 2: Configuration Storage

**Files:**
- Create: `src/store/config.ts`
- Create: `src/store/config.test.ts`

**Step 1: Write failing test**

`src/store/config.test.ts`:
```typescript
import { ConfigStore } from './config';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock conf
vi.mock('conf', () => {
  return {
    default: class {
      store: any = {};
      get(key: string) { return this.store[key]; }
      set(key: string, val: any) { this.store[key] = val; }
      clear() { this.store = {}; }
    }
  };
});

describe('ConfigStore', () => {
  it('should save and retrieve tokens', () => {
    const store = new ConfigStore();
    store.setTokens({ accessToken: 'acc', refreshToken: 'ref', expiresAt: 123 });
    expect(store.getTokens()).toEqual({ accessToken: 'acc', refreshToken: 'ref', expiresAt: 123 });
  });

  it('should save and retrieve project ID', () => {
    const store = new ConfigStore();
    store.setProjectId('my-project');
    expect(store.getProjectId()).toBe('my-project');
  });
});
```

**Step 2: Run test (Fail)**

Run: `npm test`

**Step 3: Implement ConfigStore**

`src/store/config.ts`:
```typescript
import Conf from 'conf';

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class ConfigStore {
  private store: Conf;

  constructor() {
    this.store = new Conf({ projectName: 'g-monitor' });
  }

  setTokens(tokens: Tokens) {
    this.store.set('tokens', tokens);
  }

  getTokens(): Tokens | undefined {
    return this.store.get('tokens') as Tokens | undefined;
  }

  setProjectId(projectId: string) {
    this.store.set('projectId', projectId);
  }

  getProjectId(): string | undefined {
    return this.store.get('projectId') as string | undefined;
  }
  
  clear() {
    this.store.clear();
  }
}

export const configStore = new ConfigStore();
```

**Step 4: Verify (Pass)**

Run: `npm test`

**Step 5: Commit**

```bash
git add src/store
git commit -m "feat: config storage"
```

---

### Task 3: Auth - PKCE Logic

**Files:**
- Create: `src/auth/pkce.ts`
- Create: `src/auth/pkce.test.ts`

**Step 1: Write failing test**

`src/auth/pkce.test.ts`:
```typescript
import { generatePKCE } from './pkce';
import { describe, it, expect } from 'vitest';

describe('PKCE', () => {
  it('should generate verifier and challenge', () => {
    const pkce = generatePKCE();
    expect(pkce.verifier).toHaveLength(43); // Base64URL length for 32 bytes is ~43
    expect(pkce.challenge).toBeDefined();
    expect(pkce.challenge).not.toBe(pkce.verifier);
  });
});
```

**Step 2: Run test (Fail)**

Run: `npm test`

**Step 3: Implement PKCE**

`src/auth/pkce.ts`:
```typescript
import { randomBytes, createHash } from 'crypto';

export interface PKCEPair {
  verifier: string;
  challenge: string;
}

function base64URLEncode(buffer: Buffer): string {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generatePKCE(): PKCEPair {
  const verifier = base64URLEncode(randomBytes(32));
  const challengeBuffer = createHash('sha256').update(verifier).digest();
  const challenge = base64URLEncode(challengeBuffer);
  
  return { verifier, challenge };
}
```

**Step 4: Verify (Pass)**

Run: `npm test`

**Step 5: Commit**

```bash
git add src/auth/pkce.ts src/auth/pkce.test.ts
git commit -m "feat: pkce generation"
```

---

### Task 4: Auth - URL Builder

**Files:**
- Create: `src/auth/url.ts`
- Create: `src/auth/url.test.ts`

**Step 1: Write failing test**

`src/auth/url.test.ts`:
```typescript
import { buildAuthUrl } from './url';
import { describe, it, expect } from 'vitest';

describe('Auth URL', () => {
  it('should build correct google oauth url', () => {
    const url = buildAuthUrl('challenge_123', 'http://localhost:0');
    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('client_id=1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com');
    expect(url).toContain('code_challenge=challenge_123');
    expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A0');
    expect(url).toContain('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcloud-platform');
  });
});
```

**Step 2: Run test (Fail)**

Run: `npm test`

**Step 3: Implement URL Builder**

`src/auth/url.ts`:
```typescript
const CLIENT_ID = '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com';
const SCOPES = [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/cclog',
    'https://www.googleapis.com/auth/experimentsandconfigs'
];

export function buildAuthUrl(challenge: string, redirectUri: string): string {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: SCOPES.join(' '),
        code_challenge: challenge,
        code_challenge_method: 'S256',
        access_type: 'offline',
        prompt: 'consent'
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
```

**Step 4: Verify (Pass)**

Run: `npm test`

**Step 5: Commit**

```bash
git add src/auth/url.ts src/auth/url.test.ts
git commit -m "feat: auth url builder"
```

---

### Task 5: Auth - Loopback Server

**Files:**
- Create: `src/auth/server.ts`
- Test: `src/auth/server.test.ts`

**Step 1: Write failing test**

`src/auth/server.test.ts`:
```typescript
import { startCallbackServer } from './server';
import { describe, it, expect } from 'vitest';
import http from 'http';

describe('Callback Server', () => {
  it('should start server and return port', async () => {
    const server = await startCallbackServer();
    expect(server.port).toBeGreaterThan(0);
    expect(server.close).toBeDefined();
    server.close();
  });
});
```

**Step 2: Run test (Fail)**

Run: `npm test`

**Step 3: Implement Server**

`src/auth/server.ts`:
```typescript
import http from 'http';
import { URL } from 'url';

export interface CallbackServer {
  port: number;
  waitForCode: () => Promise<string>;
  close: () => void;
}

export function startCallbackServer(): Promise<CallbackServer> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    let codePromise: Promise<string>;
    let resolveCode: (code: string) => void;
    let rejectCode: (err: Error) => void;

    codePromise = new Promise((res, rej) => {
      resolveCode = res;
      rejectCode = rej;
    });

    server.on('request', (req, res) => {
      const url = new URL(req.url || '', `http://localhost:${(server.address() as any).port}`);
      const code = url.searchParams.get('code');
      
      if (code) {
        res.end('Authentication successful! You can close this window.');
        resolveCode(code);
      } else {
        res.end('No code found.');
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as any).port;
      resolve({
        port,
        waitForCode: () => codePromise,
        close: () => server.close()
      });
    });
  });
}
```

**Step 4: Verify (Pass)**

Run: `npm test`

**Step 5: Commit**

```bash
git add src/auth/server.ts src/auth/server.test.ts
git commit -m "feat: loopback server"
```

---

### Task 6: Auth - Token Exchange

**Files:**
- Create: `src/auth/exchange.ts`
- Test: `src/auth/exchange.test.ts`

**Step 1: Write failing test**

`src/auth/exchange.test.ts`:
```typescript
import { exchangeCode } from './exchange';
import { describe, it, expect, vi } from 'vitest';

global.fetch = vi.fn();

describe('Token Exchange', () => {
  it('should exchange code for tokens', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'acc', refresh_token: 'ref', expires_in: 3600 })
    });

    const tokens = await exchangeCode('code_123', 'verifier_123', 'http://localhost:1234');
    expect(tokens.accessToken).toBe('acc');
    expect(tokens.refreshToken).toBe('ref');
  });
});
```

**Step 2: Run test (Fail)**

Run: `npm test`

**Step 3: Implement Exchange**

`src/auth/exchange.ts`:
```typescript
const CLIENT_ID = '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export async function exchangeCode(code: string, verifier: string, redirectUri: string) {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: verifier
    });

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
    
    const data = await res.json();
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000
    };
}
```

**Step 4: Verify (Pass)**

Run: `npm test`

**Step 5: Commit**

```bash
git add src/auth/exchange.ts src/auth/exchange.test.ts
git commit -m "feat: token exchange"
```

---

### Task 7: Login Command Integration

**Files:**
- Modify: `src/index.ts`
- Create: `src/commands/login.ts`

**Step 1: Implement Login Command**

`src/commands/login.ts`:
```typescript
import { Command } from 'commander';
import open from 'open';
import ora from 'ora';
import { generatePKCE } from '../auth/pkce';
import { buildAuthUrl } from '../auth/url';
import { startCallbackServer } from '../auth/server';
import { exchangeCode } from '../auth/exchange';
import { configStore } from '../store/config';

export const loginCommand = new Command('login')
  .description('Authenticate with Google')
  .option('--manual', 'Use manual copy-paste flow')
  .action(async (options) => {
    const spinner = ora('Initializing auth flow...').start();
    try {
      const { verifier, challenge } = generatePKCE();
      let redirectUri = 'urn:ietf:wg:oauth:2.0:oob';
      let code: string = '';

      if (!options.manual) {
        const server = await startCallbackServer();
        redirectUri = `http://127.0.0.1:${server.port}`;
        const url = buildAuthUrl(challenge, redirectUri);
        spinner.info(`Opening browser: ${url}`);
        await open(url);
        spinner.text = 'Waiting for callback...';
        code = await server.waitForCode();
        server.close();
      } else {
        const url = buildAuthUrl(challenge, redirectUri);
        spinner.info(`Open this URL: ${url}`);
        // Here we would implement readline to get code, but for MVP keep simple
        console.log('Manual mode not fully implemented in this step.');
        return;
      }

      spinner.text = 'Exchanging token...';
      const tokens = await exchangeCode(code, verifier, redirectUri);
      configStore.setTokens(tokens);
      spinner.succeed('Authentication successful!');
    } catch (err: any) {
      spinner.fail(`Auth failed: ${err.message}`);
    }
  });
```

**Step 2: Register in index.ts**

Modify `src/index.ts`:
```typescript
import { loginCommand } from './commands/login';
// ...
program.addCommand(loginCommand);
// ...
```

**Step 3: Test Manual**

Run: `npm run build && node dist/index.js login`

**Step 4: Commit**

```bash
git add src/commands/login.ts src/index.ts
git commit -m "feat: login command"
```

---

### Task 8: Internal API Client (Impersonator)

**Files:**
- Create: `src/api/internal.ts`
- Test: `src/api/internal.test.ts`

**Step 1: Write test**

`src/api/internal.test.ts`:
```typescript
import { InternalClient } from './internal';
import { describe, it, expect, vi } from 'vitest';

global.fetch = vi.fn();

describe('InternalClient', () => {
  it('should inject headers', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, json: () => ({}) });
    const client = new InternalClient('fake_token');
    await client.loadCodeAssist();
    
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('v1internal:loadCodeAssist'),
        expect.objectContaining({
            headers: expect.objectContaining({
                'X-Goog-Api-Client': 'google-cloud-sdk vscode_cloudshelleditor/0.1',
                'User-Agent': 'antigravity',
                'Authorization': 'Bearer fake_token'
            })
        })
    );
  });
});
```

**Step 2: Run test (Fail)**

Run: `npm test`

**Step 3: Implement Client**

`src/api/internal.ts`:
```typescript
export class InternalClient {
    private baseUrl = 'https://cloudcode-pa.googleapis.com';
    
    constructor(private accessToken: string) {}

    private async request(path: string, body: any = {}) {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'X-Goog-Api-Client': 'google-cloud-sdk vscode_cloudshelleditor/0.1',
                'User-Agent': 'antigravity'
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`Internal API failed: ${res.status} ${await res.text()}`);
        return res.json();
    }

    async loadCodeAssist() {
        return this.request('/v1internal:loadCodeAssist', {
            metadata: { ideType: 'ANTIGRAVITY', pluginType: 'GEMINI' }
        });
    }

    async fetchAvailableModels(projectId?: string) {
        return this.request('/v1internal:fetchAvailableModels', projectId ? { project: projectId } : {});
    }
}
```

**Step 4: Verify (Pass)**

Run: `npm test`

**Step 5: Commit**

```bash
git add src/api/internal.ts src/api/internal.test.ts
git commit -m "feat: internal api client"
```

---

### Task 9: Project Discovery

**Files:**
- Modify: `src/commands/login.ts`

**Step 1: Add Discovery Logic to Login**

Update `src/commands/login.ts` to use `InternalClient` after auth:
```typescript
// ... imports
import { InternalClient } from '../api/internal';

// ... inside action
const client = new InternalClient(tokens.accessToken);
spinner.text = 'Discovering project...';
const data = await client.loadCodeAssist();
const projectId = (data as any).cloudaicompanionProject?.id;

if (projectId) {
    configStore.setProjectId(projectId);
    spinner.succeed(`Connected to project: ${projectId}`);
} else {
    spinner.warn('No Code Assist project found.');
}
```

**Step 2: Verify**

Check syntax only (manual test required for logic).

**Step 3: Commit**

```bash
git add src/commands/login.ts
git commit -m "feat: project discovery"
```

---

### Task 10: Monitoring Logic & UI

**Files:**
- Create: `src/commands/status.ts`
- Modify: `src/index.ts`

**Step 1: Implement Status Command**

`src/commands/status.ts`:
```typescript
import { Command } from 'commander';
import { InternalClient } from '../api/internal';
import { configStore } from '../store/config';
import Table from 'cli-table3';
import ora from 'ora';

export const statusCommand = new Command('status')
    .description('Show quota status')
    .action(async () => {
        const tokens = configStore.getTokens();
        const projectId = configStore.getProjectId();

        if (!tokens) {
            console.error('Not logged in.');
            return;
        }

        const spinner = ora('Fetching quotas...').start();
        try {
            const client = new InternalClient(tokens.accessToken);
            const internalData: any = await client.fetchAvailableModels(projectId);
            
            spinner.stop();

            const table = new Table({
                head: ['Model', 'Remaining %', 'Reset Time'],
                style: { head: ['cyan'] }
            });

            const models = internalData.models || {};
            for (const key in models) {
                const m = models[key];
                const quota = m.quotaInfo || {};
                const remain = quota.remainingFraction 
                    ? `${(quota.remainingFraction * 100).toFixed(0)}%` 
                    : 'N/A';
                const reset = quota.resetTime || 'N/A';
                table.push([m.displayName || key, remain, reset]);
            }

            console.log(table.toString());
        } catch (err: any) {
            spinner.fail(`Failed: ${err.message}`);
        }
    });
```

**Step 2: Register Status Command**

Modify `src/index.ts` to add `statusCommand`.

**Step 3: Commit**

```bash
git add src/commands/status.ts src/index.ts
git commit -m "feat: status command"
```
