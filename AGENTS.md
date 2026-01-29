# Agentic Development Guide for g-monitor

This repository contains the `g-monitor` CLI tool, built with TypeScript, React (Ink), and Bun.
Follow these guidelines to ensure consistency and correctness when working on this codebase.

## 使用語言
- **一律使用繁體中文台灣用語回復使用者**

## 1. Project Structure & Environment

- **Runtime**: Node.js >= 18 (using `bun` as package manager and runner).
- **Language**: TypeScript (ES2022, NodeNext modules).
- **Framework**: React 19 + Ink (for CLI TUI).
- **Dependencies**: Managed via `package.json` and `bun.lock`.

### Key Directories
- `src/`: Source code.
  - `src/commands/`: CLI command implementations (Commander.js).
  - `src/ui/`: Ink/React components for the TUI.
  - `src/api/`, `src/auth/`, `src/store/`: Core logic modules.
- `test/`: Test files (mirrors `src/` structure).
- `dist/`: Compiled JavaScript output.

## 2. Build & Test Commands

Use `bun` for all lifecycle scripts.

### Build
Compile TypeScript to JavaScript (`dist/`).
```bash
bun run build
```
*Note: This runs `tsc`. Ensure no type errors exist before committing.*

### Run in Development
Run the CLI entry point directly without building.
```bash
bun run start -- [args]
# Example:
bun run start -- status --tui
```

### Testing
This project uses **Vitest**.

**Run all tests:**
```bash
bun test
```

**Run a specific test file:**
```bash
bun test test/utils/jwt.test.ts
```

**Run tests matching a name pattern:**
```bash
bun test -t "JWT Utils"
```

**Watch mode (default in Vitest if not CI):**
```bash
bun test --watch
```

## 3. Code Style & Conventions

### TypeScript & Modules
- **Strict Mode**: Enabled. No implicit `any`.
- **Module Resolution**: `NodeNext`.
- **Import Extensions**: **CRITICAL**: You MUST use `.js` extensions for relative imports of local files.
  ```typescript
  // CORRECT
  import { configStore } from '../store/config.js';
  
  // INCORRECT (Will fail at runtime/compile time)
  import { configStore } from '../store/config';
  ```
- **External Imports**: Do not use extensions for node modules (e.g., `import React from 'react';`).

### Formatting
- **Indentation**: 4 spaces.
- **Quotes**: Single quotes (`'`) preferred for code; Double quotes for JSON/Output text if needed.
- **Semicolons**: Always use semicolons.

### Naming Conventions
- **Files**:
  - Regular TS files: `camelCase.ts` (e.g., `status.ts`, `jwt.test.ts`).
  - React Components: `PascalCase.tsx` (e.g., `App.tsx`, `QuotaTable.tsx`).
- **Classes/Interfaces**: `PascalCase` (e.g., `InternalClient`, `ModelInfo`).
- **Variables/Functions**: `camelCase`.
- **Constants**: `UPPER_CASE` for global/configuration constants.

### React / Ink (TUI)
- Use **Functional Components** with Hooks (`useState`, `useEffect`, etc.).
- Avoid class components.
- Use `Box` and `Text` from `ink` for layout and styling.
- Handle terminal resizing if necessary (see `useStdout` in `App.tsx`).

### Error Handling
- Use `try/catch` blocks for async operations.
- For CLI commands, catch errors and print user-friendly messages using `chalk`.
- Do not let raw stack traces leak to the user unless `--debug` is passed.
- Example:
  ```typescript
  try {
      await doSomething();
  } catch (err: any) {
      console.error(chalk.red(`Operation failed: ${err.message}`));
      if (options.debug) console.error(err);
  }
  ```

## 4. Testing Guidelines

- **Location**: Place tests in `test/` directory, mirroring the source path.
- **Naming**: `filename.test.ts`.
- **Tooling**: Use `vitest` globals (`describe`, `it`, `expect`).
- **Mocking**: Use `vi.mock()` for external dependencies if unit testing isolated logic.
- **Scope**:
  - **Unit Tests**: For utils, helpers, and pure logic (`test/utils/`).
  - **Integration Tests**: For commands and API interactions (mocking the network layer).

## 5. Agent Instructions

When acting as an AI agent on this codebase:

1.  **Verify Imports**: Always double-check that you added `.js` extensions to local imports.
2.  **Check Types**: After writing code, if possible, run `bun run build` to verify type safety.
3.  **Run Tests**: If modifying logic, run the relevant test file to ensure no regressions.
4.  **UI Changes**: If modifying `src/ui/`, ensure the component structure remains valid for Ink (no HTML tags like `<div>`, use `<Box>`).
5.  **Dependencies**: If adding a new dependency, use `bun add`.

## 6. Known Patterns

- **Config Store**: Configuration is handled via `conf` singleton in `src/store/config.ts`.
- **Auth**: Tokens are stored in the config. Auto-refresh logic exists in commands.
- **Command Structure**: `commander` is used. Each command is in its own file exporting a `Command` instance.

---
*Generated for AI coding agents.*
