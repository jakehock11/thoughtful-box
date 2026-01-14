# Product OS — Development Workflow

## Overview

Product OS uses a hybrid development workflow with two AI tools:

- **Lovable** — Rapid UI prototyping in the browser
- **Claude Code** — Backend implementation, data layer, Electron integration

GitHub is the bridge between them. Both tools push/pull from the same repo.

## Repository

https://github.com/jakehock11/product-os

## Workflow

### For UI changes (Lovable first)
1. Write a prompt in Lovable describing the UI change
2. Lovable updates React components and pushes to GitHub
3. Pull changes in Claude Code
4. Wire up real data, add IPC methods, database changes
5. Test in Electron locally

### For backend/data changes (Claude Code only)
1. Write a prompt in Claude Code
2. Claude Code implements changes
3. If new API methods are added, also update mock layer
4. Push to GitHub
5. Lovable will have access on next sync

## Mock Layer (Browser Preview)

Since this is an Electron app, Lovable's browser preview can't run the real app (no Node.js, no SQLite, no IPC).

A mock layer enables preview:

| File | Purpose |
|------|---------|
| `src/mocks/mockData.ts` | Sample data for all entity types |
| `src/mocks/mockStore.ts` | Mock implementation of API interface |
| `src/lib/ipc.ts` | Exports real API (Electron) or mock API (browser) |

### How it works
- `src/lib/ipc.ts` checks if `window.api` exists
- Electron: uses real IPC → SQLite
- Browser: uses mock API → in-memory sample data

### Keeping mocks in sync
When adding new features:
1. Add real IPC method in `electron/preload.ts` and `electron/main.ts`
2. Add mock method in `src/mocks/mockStore.ts`
3. Add sample data in `src/mocks/mockData.ts` if needed

### Import pattern
Always import from the api provider, never use window.api directly:
```ts
// ✅ Correct
import { api } from '@/lib/ipc';
const data = await api.getProducts();

// ❌ Wrong - breaks browser preview
const data = await window.api.getProducts();
```

## Running the App

### Development (Electron)
```bash
npm run electron:dev
```
Uses real SQLite database, full Electron functionality.

### Browser Preview (Lovable)
Lovable runs the Vite dev server in a browser sandbox. Uses mock data. Shows "Preview Mode" indicator.

### Production Build
```bash
npm run electron:build
```

## Tool Responsibilities

| Aspect | Lovable | Claude Code |
|--------|---------|-------------|
| React components | ✅ Primary | Can modify |
| Styling (Tailwind) | ✅ Primary | Can modify |
| Page layouts | ✅ Primary | Can modify |
| IPC / Electron | ❌ | ✅ Primary |
| SQLite / Database | ❌ | ✅ Primary |
| Mock layer | Creates structure | Keeps in sync |
| Type definitions | Can create | ✅ Authoritative |
| CLAUDE.md | ❌ | ✅ Maintains |

## Conventions

- Commit after each logical change
- Push frequently (both tools auto-push)
- Pull before starting new work
