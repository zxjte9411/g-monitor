# Distinguish Duplicate Models by Identity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Distinguish between duplicate models in the same environment by adding the identity (VSCode vs CLI) to the pool name in both CLI and TUI.

**Architecture:**
1.  Enhance `InternalClient.sweepQuotas` to ensure `identity` is correctly associated with results.
2.  Update `status.ts` and `App.tsx` to include `identity` in the unique key for model mapping.
3.  Map `antigravity` to `VSCode` and `gemini-cli` to `CLI` for display.
4.  Update display strings to show both environment and identity (e.g., `(Prod/VSCode)`).

**Tech Stack:** TypeScript, React (Ink), Commander.js.

### Task 1: Update CLI status command

**Files:**
- Modify: `D:/g-monitor/src/commands/status.ts`

**Step 1: Update unique key and display name mapping**

```typescript
<<<<
                    const uniqueKey = `${id}|${source}`;
                    
                    let displayName = existing?.displayName || id;
                    if (id === 'gemini-3-pro-high') displayName = 'Gemini 3 Pro (High)';
                    if (id === 'gemini-3-pro-low') displayName = 'Gemini 3 Pro (Low)';
                    if (id === 'gemini-3-flash') displayName = 'Gemini 3 Flash';

                    modelMap.set(uniqueKey, {
                        id,
                        displayName: `${displayName} ${chalk.dim(`(${source})`)}`,
                        remainingFraction: bucket.remainingFraction,
                        resetTime: bucket.resetTime
                    });
====
                    const identity = (res as any).identity;
                    const identityDisplay = identity === 'antigravity' ? 'VSCode' : 'CLI';
                    const uniqueKey = `${id}|${source}|${identity}`;
                    
                    let displayName = existing?.displayName || id;
                    if (id === 'gemini-3-pro-high') displayName = 'Gemini 3 Pro (High)';
                    if (id === 'gemini-3-pro-low') displayName = 'Gemini 3 Pro (Low)';
                    if (id === 'gemini-3-flash') displayName = 'Gemini 3 Flash';

                    modelMap.set(uniqueKey, {
                        id,
                        displayName: `${displayName} ${chalk.dim(`(${source}/${identityDisplay})`)}`,
                        remainingFraction: bucket.remainingFraction,
                        resetTime: bucket.resetTime
                    });
>>>>
```

**Step 2: Verify with manual run (if possible) or code review**

Since I cannot easily run this against live APIs without real tokens, I will rely on code correctness and verification of types.

**Step 3: Commit**

```bash
git add src/commands/status.ts
git commit -m "feat(cli): distinguish quota pools by identity (VSCode vs CLI)"
```

### Task 2: Update TUI App

**Files:**
- Modify: `D:/g-monitor/src/ui/App.tsx`

**Step 1: Update `transformData` to include identity in unique key and display name**

```typescript
<<<<
                    quotaItems.push({
                        name: displayName,
                        remaining: Math.round(bucket.remainingFraction * 100),
                        limit: 100,
                        resetTime: bucket.resetTime,
                        source: res.source
                    });
====
                    const identityDisplay = res.identity === 'antigravity' ? 'VSCode' : 'CLI';
                    quotaItems.push({
                        name: `${displayName} (${res.source}/${identityDisplay})`,
                        remaining: Math.round(bucket.remainingFraction * 100),
                        limit: 100,
                        resetTime: bucket.resetTime,
                        source: res.source
                    });
>>>>
```

**Step 2: Commit**

```bash
git add src/ui/App.tsx
git commit -m "feat(ui): distinguish quota pools by identity (VSCode vs CLI)"
```

### Task 3: Final Verification

**Step 1: Build the project to ensure no type errors**

Run: `npm run build`
Expected: Success

**Step 2: Commit any build fixes if needed**
