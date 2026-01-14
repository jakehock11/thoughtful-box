# Product OS — Claude Code Guide

## Project Overview

Product OS is a **local-first desktop application** for capturing and connecting product reasoning: Problems → Hypotheses → Experiments → Decisions, supported by Artifacts.

**Stack:** Electron + React + TypeScript + SQLite + shadcn/ui + Tailwind

**Core constraint:** 100% offline. No internet required. Data lives on disk.

---

## Architecture

### Dual-Write Pattern
- **SQLite** is the working database (fast queries, relationships, search)
- **Markdown files** are generated on every entity save (portability, inspectability)
- Both live in the user's workspace folder
- SQLite is source of truth for the app; markdown is the human/AI-readable mirror

### Process Model
- **Main process** (Electron): SQLite access, file system operations, IPC handlers
- **Renderer process** (React): UI, state management, calls main via IPC

### Workspace Folder Structure
```
ProductOS_Workspace/
  data/
    product-os.sqlite
  products/
    <productId>/
      product.json
      taxonomy/
        personas.json
        features.json
        dimensions.json
      entities/
        captures/<id>.md
        problems/<id>.md
        hypotheses/<id>.md
        experiments/<id>.md
        decisions/<id>.md
        artifacts/<id>.md
      relationships.json
  exports/
    history.json
    runs/<exportId>/...
```

---

## Key Conventions

### IDs
- Use `nanoid` for all IDs
- Prefix by type: `prod_`, `prob_`, `hyp_`, `exp_`, `dec_`, `art_`, `cap_`, `pers_`, `feat_`, `dim_`, `dimval_`, `rel_`, `exp_`

### Timestamps
- All timestamps as ISO 8601 strings: `2026-01-10T15:04:00Z`
- Store in SQLite as TEXT
- Every entity has `created_at` and `updated_at`
- `updated_at` changes when: title, body, status, tags, or links change

### Entity Types
```typescript
type EntityType = 'capture' | 'problem' | 'hypothesis' | 'experiment' | 'decision' | 'artifact';
```

### Status Values
- Problem: `active` | `exploring` | `blocked` | `solved` | `archived`
- Hypothesis: `draft` | `active` | `invalidated` | `archived`
- Experiment: `planned` | `running` | `paused` | `complete` | `archived`
- Decision: (no status, but has `decision_type`: `reversible` | `irreversible`)
- Artifact: `draft` | `final` | `archived`
- Capture: (no status, but tracks `promoted_to_id` when promoted)

---

## Project Structure

```
product-os/
  electron/
    main.ts                 # Electron main process entry
    preload.ts              # Preload script for IPC bridge
    database/
      schema.sql            # SQLite schema
      db.ts                 # Database connection + migrations
      queries/
        products.ts         # Product CRUD
        entities.ts         # Entity CRUD
        taxonomy.ts         # Taxonomy CRUD
        relationships.ts    # Relationship CRUD
        exports.ts          # Export operations
    ipc/
      handlers.ts           # IPC handler registration
      products.ts           # Product IPC handlers
      entities.ts           # Entity IPC handlers
      taxonomy.ts           # Taxonomy IPC handlers
      relationships.ts      # Relationship IPC handlers
      exports.ts            # Export IPC handlers
      workspace.ts          # Workspace/settings IPC handlers
    markdown/
      writer.ts             # Markdown file generation
      templates.ts          # Frontmatter templates per entity type
    workspace/
      manager.ts            # Workspace folder operations
      settings.ts           # Settings persistence
  src/
    main.tsx                # React entry
    App.tsx                 # Root component with routing
    components/
      layout/
        Sidebar.tsx
        ProductSwitcher.tsx
        ContextPanel.tsx
      entities/
        EntityList.tsx      # Generic list component
        EntityDetail.tsx    # Generic detail/edit component
        ProblemForm.tsx
        HypothesisForm.tsx
        ExperimentForm.tsx
        DecisionForm.tsx
        ArtifactForm.tsx
        CaptureModal.tsx
      taxonomy/
        TaxonomyManager.tsx
        PersonaList.tsx
        FeatureList.tsx
        DimensionList.tsx
      timeline/
        Timeline.tsx
        TimelineItem.tsx
      exports/
        ExportPanel.tsx
        ExportHistory.tsx
      shared/
        StatusBadge.tsx
        TagPicker.tsx
        LinkPicker.tsx
        SearchInput.tsx
    hooks/
      useProducts.ts
      useEntities.ts
      useTaxonomy.ts
      useRelationships.ts
      useWorkspace.ts
    lib/
      ipc.ts                # IPC client wrapper
      types.ts              # Shared TypeScript types
      constants.ts          # Status values, entity types, etc.
    pages/
      Home.tsx
      ProductsHome.tsx
      Problems.tsx
      Hypotheses.tsx
      Experiments.tsx
      Decisions.tsx
      Artifacts.tsx
      Timeline.tsx
      Exports.tsx
      Settings.tsx
      TaxonomyPage.tsx
```

---

## IPC Contract

All IPC calls follow this pattern:

```typescript
// Renderer calls:
const result = await window.api.products.getAll();
const product = await window.api.products.create({ name: 'My Product' });

// Main process handles:
ipcMain.handle('products:getAll', async () => { ... });
ipcMain.handle('products:create', async (_, data) => { ... });
```

### IPC Channels

**Products**
- `products:getAll` → `Product[]`
- `products:getById(id)` → `Product | null`
- `products:create(data)` → `Product`
- `products:update(id, data)` → `Product`
- `products:delete(id)` → `void`

**Entities**
- `entities:getAll(productId, filters?)` → `Entity[]`
- `entities:getById(id)` → `Entity | null`
- `entities:create(data)` → `Entity`
- `entities:update(id, data)` → `Entity`
- `entities:delete(id)` → `void`
- `entities:promote(captureId, targetType)` → `Entity`

**Taxonomy**
- `taxonomy:getAll(productId)` → `Taxonomy`
- `taxonomy:createPersona(productId, name)` → `Persona`
- `taxonomy:createFeature(productId, name)` → `Feature`
- `taxonomy:createDimension(productId, name)` → `Dimension`
- `taxonomy:createDimensionValue(dimensionId, name)` → `DimensionValue`
- `taxonomy:update(type, id, data)` → `TaxonomyItem`
- `taxonomy:archive(type, id)` → `void`

**Relationships**
- `relationships:getForEntity(entityId)` → `Relationship[]`
- `relationships:create(data)` → `Relationship`
- `relationships:delete(id)` → `void`

**Workspace**
- `workspace:selectFolder()` → `string | null` (opens folder picker)
- `workspace:getSettings()` → `Settings`
- `workspace:updateSettings(data)` → `Settings`
- `workspace:initialize(folderPath)` → `void`

**Exports**
- `exports:preview(options)` → `ExportPreview`
- `exports:execute(options)` → `ExportResult`
- `exports:getHistory()` → `ExportRecord[]`
- `exports:clearHistory()` → `void`

---

## SQLite Schema

See `electron/database/schema.sql` for the full schema. Key points:

- Single `entities` table with `type` column (not separate tables per entity type)
- `metadata` column as JSON for type-specific fields
- Junction tables for entity-taxonomy relationships
- Relationships stored in `relationships` table with `source_id`, `target_id`, `relationship_type`
- All timestamps as TEXT (ISO 8601)
- Foreign keys with CASCADE delete

---

## Markdown Generation

On every entity save, generate/update the corresponding markdown file.

### Frontmatter Format
```yaml
---
id: prob_abc123
type: problem
title: "Parents don't claim players after invites"
status: active
created_at: "2026-01-10T14:12:00Z"
updated_at: "2026-01-10T15:04:00Z"
context:
  personas: ["Livestreamer", "Player Manager"]
  features: ["Clips", "Notifications"]
  dimensions:
    Sport: ["Baseball", "Volleyball"]
links:
  - target_id: hyp_xyz789
    type: hypothesis
    relationship: supports
---

Body content here...
```

**Important:** Frontmatter includes resolved names (not just IDs) for human readability. The `links` section includes the target entity type for context.

---

## State Management

Use React hooks that wrap IPC calls:

```typescript
// Example: useEntities hook
function useEntities(productId: string, type?: EntityType) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.api.entities.getAll(productId, { type })
      .then(setEntities)
      .finally(() => setLoading(false));
  }, [productId, type]);

  const create = async (data: CreateEntityData) => {
    const entity = await window.api.entities.create(data);
    setEntities(prev => [entity, ...prev]);
    return entity;
  };

  // ... update, delete methods

  return { entities, loading, create, update, delete };
}
```

---

## UI Patterns

### Entity List Pages
- Search input (filters by title + body)
- Status filter tabs (All + status values for that type)
- "+ New [Type]" button
- List items show: title, status badge, updated timestamp
- Click item → navigate to detail page

### Entity Detail Pages
- Title field (auto-focus on new)
- Status dropdown
- Body editor (rich text or markdown)
- Context tags section (persona, feature, dimension pickers)
- Links section (shows linked entities, "Link to..." button)
- Delete button (with confirmation)
- Auto-save indicator + explicit Save button

### Quick Capture Modal
- Triggered by sidebar button or Cmd/Ctrl+N
- Single text area (title derived from first line)
- Optional context tags
- Save → creates capture entity
- After save, option to "Promote to..." or close

---

## Error Handling

- All IPC handlers should try/catch and return structured errors
- Renderer should show toast notifications for errors
- Database operations should use transactions where appropriate
- File system errors (workspace folder missing, permissions) should show clear messages

---

## Testing Approach (v1)

- Manual testing is fine for v1
- Focus on: CRUD operations work, markdown files generate correctly, data survives app restart
- Edge cases to verify: empty states, special characters in titles, large body content

---

## What NOT to Build (v1)

- Cloud sync
- Multi-user / collaboration
- Live LLM integration
- Complex onboarding flows
- Keyboard shortcuts beyond Cmd/Ctrl+K (search) and Cmd/Ctrl+N (capture)
- Full-text search in SQLite (basic LIKE queries are fine)
- File attachments for artifacts (just notes/links for now)

---

## Mock Layer (Browser Preview)

The app has a mock API layer that enables browser preview (for Lovable). Located in:

- `src/mocks/mockData.ts` - Sample data for all entity types
- `src/mocks/mockStore.ts` - Mock implementation of API interface
- `src/lib/ipc.ts` - Conditionally exports real or mock API

### Rules

1. **DO NOT delete** the mocks folder or ipc.ts mock integration
2. **When adding new API methods**: add to both real IPC (electron/preload.ts, electron/main.ts) AND mockStore.ts
3. **When adding new entity types**: add sample data to mockData.ts
4. **Always import from `@/lib/ipc`**, never use `window.api` directly in React components
5. **Keep mock data realistic** - use SidelineHD context (sports livestreaming)

### Import Pattern
```ts
// ✅ Correct
import { api } from '@/lib/ipc';
const data = await api.getProducts();

// ❌ Wrong - breaks browser preview
const data = await window.api.getProducts();
```
