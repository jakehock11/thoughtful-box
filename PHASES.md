# Product OS — Claude Code Build Phases

This document contains the prompts to give Claude Code for each build phase. Run them in order. Each phase builds on the previous.

---

## Before You Start

1. **Clone the Lovable prototype repo:**
   ```bash
   git clone https://github.com/jakehock11/product-os.git product-os
   cd product-os
   ```

2. **Copy CLAUDE.md and schema.sql into the repo root**

3. **Open the project in Claude Code:**
   ```bash
   claude
   ```

4. **Give Claude Code context on first run:**
   > Read CLAUDE.md and schema.sql to understand this project. This is a local-first desktop app we're building with Electron.

---

## Phase 0: Electron + SQLite Scaffold

### Prompt 0.1 — Add Electron to the Project

```
We need to add Electron to this existing Vite + React project. This will be a local-first desktop app.

Set up:
1. Install electron, electron-builder, and better-sqlite3 as dependencies
2. Create the electron/ folder structure as specified in CLAUDE.md
3. Create electron/main.ts as the Electron main process entry
4. Create electron/preload.ts to expose IPC methods to the renderer
5. Update vite.config.ts to work with Electron (use vite-plugin-electron or similar)
6. Update package.json with electron scripts: "electron:dev" and "electron:build"

The main process should:
- Create a BrowserWindow that loads the Vite dev server (in dev) or built files (in prod)
- Set up the preload script
- Handle the app lifecycle (ready, window-all-closed, activate)

Don't set up the database yet — just get Electron running with the existing React app.
```

### Prompt 0.2 — Add SQLite and Database Module

```
Now add SQLite to the Electron main process.

1. Create electron/database/db.ts:
   - Export a function to initialize the database
   - On init, read schema.sql and execute it
   - Use better-sqlite3 for synchronous SQLite access
   - The database file should be stored at a path we can configure (for now, use a default in the app's userData directory)

2. Create electron/database/schema.sql (copy from the schema.sql file in the repo)

3. Update electron/main.ts to initialize the database on app ready

4. Add a simple IPC handler to test: 'db:test' that returns { success: true, tables: [...] } with the list of tables

5. Test that we can call this from the renderer via window.api.db.test()

Make sure foreign keys are enabled (PRAGMA foreign_keys = ON).
```

### Prompt 0.3 — Workspace Folder Selection

```
Add workspace folder selection flow.

1. Create electron/workspace/manager.ts with functions:
   - selectWorkspaceFolder(): opens a native folder picker dialog, returns path or null
   - initializeWorkspace(folderPath): creates the folder structure if it doesn't exist
   - getWorkspacePath(): returns the currently configured workspace path from settings
   - isWorkspaceConfigured(): returns boolean

2. The workspace folder structure to create:
   ProductOS_Workspace/
     data/
       (this is where product-os.sqlite will live)
     products/
     exports/
       history.json
       runs/

3. Add IPC handlers:
   - workspace:select → calls selectWorkspaceFolder
   - workspace:initialize → calls initializeWorkspace
   - workspace:getPath → returns current path
   - workspace:isConfigured → returns boolean

4. When a workspace is selected and initialized, move the SQLite database to workspace/data/product-os.sqlite

5. Store the workspace path in the settings table so it persists across restarts.

6. On app start:
   - Check if workspace is configured
   - If yes, open database from workspace path
   - If no, the renderer should show a setup screen
```

---

## Phase 1: Core Data Layer

### Prompt 1.1 — Products CRUD

```
Implement Products CRUD operations.

1. Create electron/database/queries/products.ts with functions:
   - getAllProducts(): Product[]
   - getProductById(id: string): Product | null
   - createProduct(data: { name: string, description?: string, icon?: string }): Product
   - updateProduct(id: string, data: Partial<Product>): Product
   - deleteProduct(id: string): void

2. Create electron/ipc/products.ts with IPC handlers:
   - products:getAll
   - products:getById
   - products:create
   - products:update
   - products:delete

3. Use nanoid for ID generation with prefix: prod_xxx

4. On create/update, set timestamps appropriately:
   - created_at on create
   - updated_at on create and update
   - last_activity_at on create and update

5. On delete, cascade will handle related records (taxonomy, entities, etc.)

6. Register handlers in electron/ipc/handlers.ts
```

### Prompt 1.2 — Taxonomy CRUD

```
Implement Taxonomy CRUD operations for personas, features, and dimensions.

1. Create electron/database/queries/taxonomy.ts with functions:
   - getPersonas(productId): Persona[]
   - createPersona(productId, name): Persona
   - updatePersona(id, data): Persona
   - archivePersona(id): void
   
   - getFeatures(productId): Feature[]
   - createFeature(productId, name): Feature
   - updateFeature(id, data): Feature
   - archiveFeature(id): void
   
   - getDimensions(productId): Dimension[] (include values)
   - createDimension(productId, name): Dimension
   - updateDimension(id, data): Dimension
   - archiveDimension(id): void
   
   - getDimensionValues(dimensionId): DimensionValue[]
   - createDimensionValue(dimensionId, name): DimensionValue
   - updateDimensionValue(id, data): DimensionValue
   - archiveDimensionValue(id): void

2. Create electron/ipc/taxonomy.ts with corresponding IPC handlers

3. ID prefixes:
   - Persona: pers_xxx
   - Feature: feat_xxx
   - Dimension: dim_xxx
   - DimensionValue: dimval_xxx

4. Archive sets is_archived = 1 (don't delete, so historical entities keep their tags)

5. When fetching taxonomy, by default exclude archived items. Add optional includeArchived parameter.
```

### Prompt 1.3 — Entities CRUD

```
Implement Entities CRUD operations.

1. Create electron/database/queries/entities.ts with functions:
   - getEntities(productId, filters?: { type?, status?, search? }): Entity[]
   - getEntityById(id): Entity | null (include tags and links)
   - createEntity(data): Entity
   - updateEntity(id, data): Entity
   - deleteEntity(id): void
   - promoteCapture(captureId, targetType): Entity

2. When creating/updating entities, also handle the taxonomy junction tables:
   - entity_personas
   - entity_features  
   - entity_dimension_values
   
   Accept arrays: personaIds, featureIds, dimensionValueIds

3. The search filter should do LIKE on title and body

4. promoteCapture should:
   - Create new entity of targetType
   - Copy title, body, and context tags from capture
   - Set capture's promoted_to_id to the new entity's id
   - Return the new entity

5. ID prefixes by type:
   - capture: cap_xxx
   - problem: prob_xxx
   - hypothesis: hyp_xxx
   - experiment: exp_xxx
   - decision: dec_xxx
   - artifact: art_xxx

6. Create electron/ipc/entities.ts with IPC handlers

7. On every create/update, also trigger markdown file generation (we'll implement that next)
```

### Prompt 1.4 — Markdown File Generation

```
Implement markdown file generation that runs on every entity save.

1. Create electron/markdown/writer.ts with functions:
   - writeEntityMarkdown(entity: Entity, workspace: string): void
   - deleteEntityMarkdown(entity: Entity, workspace: string): void
   - getMarkdownPath(entity: Entity, workspace: string): string

2. Create electron/markdown/templates.ts with frontmatter generation per entity type

3. Markdown file location:
   workspace/products/<productId>/entities/<type>s/<id>.md
   
   Example: workspace/products/prod_abc/entities/problems/prob_123.md

4. Frontmatter format (see CLAUDE.md for full spec):
   - Include id, type, title, status, created_at, updated_at
   - Include resolved context names (not just IDs) for human readability
   - Include links with target_id, type, and relationship

5. To resolve names, query the taxonomy tables when generating frontmatter

6. Body content goes after the frontmatter separator

7. Ensure the directory exists before writing (create if needed)

8. Call writeEntityMarkdown from createEntity and updateEntity
9. Call deleteEntityMarkdown from deleteEntity
```

### Prompt 1.5 — Relationships CRUD

```
Implement Relationships CRUD.

1. Create electron/database/queries/relationships.ts with functions:
   - getRelationshipsForEntity(entityId): Relationship[] (both directions)
   - getOutgoingRelationships(entityId): Relationship[]
   - getIncomingRelationships(entityId): Relationship[]
   - createRelationship(data: { sourceId, targetId, relationshipType?, productId }): Relationship
   - deleteRelationship(id): void

2. Create electron/ipc/relationships.ts with IPC handlers

3. ID prefix: rel_xxx

4. When fetching relationships, also include basic info about the linked entity (id, type, title, status) for display

5. Update the entity markdown generation to include links in the frontmatter
```

---

## Phase 2: Wire Up React UI

### Prompt 2.1 — IPC Client and Types

```
Create the renderer-side IPC client and TypeScript types.

1. Create src/lib/types.ts with all the TypeScript interfaces:
   - Product
   - Persona, Feature, Dimension, DimensionValue
   - Entity (with type discriminator)
   - Relationship
   - ExportRecord
   - Settings
   - And any DTOs for create/update operations

2. Create src/lib/ipc.ts that wraps window.api calls with proper typing:
   
   export const api = {
     products: {
       getAll: () => window.api.products.getAll() as Promise<Product[]>,
       // etc.
     },
     entities: { ... },
     taxonomy: { ... },
     relationships: { ... },
     workspace: { ... },
   }

3. Update electron/preload.ts to expose all the IPC methods we've built so far
```

### Prompt 2.2 — React Hooks for Data

```
Create React hooks that manage state and IPC calls.

1. Create src/hooks/useProducts.ts:
   - products state
   - currentProduct state (selected product)
   - loading state
   - create, update, delete methods
   - selectProduct method

2. Create src/hooks/useEntities.ts:
   - entities state (filtered by current product and optional type)
   - loading state
   - filters state (type, status, search)
   - create, update, delete, promote methods
   - setFilters method

3. Create src/hooks/useTaxonomy.ts:
   - personas, features, dimensions state
   - CRUD methods for each

4. Create src/hooks/useRelationships.ts:
   - For a given entity, fetch and manage its relationships

5. Create src/hooks/useWorkspace.ts:
   - isConfigured state
   - workspacePath state
   - selectWorkspace, initializeWorkspace methods

6. These hooks should work with the existing React context or create contexts as needed for global state (current product, workspace status).
```

### Prompt 2.3 — Connect Products UI

```
Connect the Products functionality to the existing UI.

Looking at the current UI:
- There's a product switcher in the sidebar (SI, ML buttons)
- There should be a Products Home page

1. Replace any mock/hardcoded product data with the useProducts hook
2. Wire up the product switcher to actually switch products
3. Create or update the Products Home page to:
   - List all products as cards
   - "Create Product" button that opens a modal/form
   - Edit/delete options per product

4. Store the currently selected product in React context so it's accessible everywhere

5. When no product exists, show an empty state prompting to create one
```

### Prompt 2.4 — Connect Entity List Pages

```
Connect the entity list pages (Problems, Hypotheses, Experiments, Decisions, Artifacts) to real data.

For each entity list page:
1. Replace mock data with useEntities hook
2. Wire up the search input to filter entities
3. Wire up status tabs to filter by status
4. Wire up the "New [Entity]" button to create via IPC
5. Clicking an entity should navigate to its detail page

The list should refresh when:
- Current product changes
- An entity is created/updated/deleted
- Filters change

Use the existing UI components — just swap out the data source.
```

### Prompt 2.5 — Connect Entity Detail Pages

```
Connect the entity detail/edit pages to real data.

For each entity type's detail page:
1. Fetch the entity by ID on mount
2. Wire up form fields to entity data
3. Implement save functionality:
   - Save button calls updateEntity via IPC
   - Show loading state while saving
   - Show success/error feedback (toast)
4. Implement delete functionality:
   - Confirm dialog
   - Delete via IPC
   - Navigate back to list page
5. Wire up the tag pickers (persona, feature, dimension) to taxonomy data
6. Show linked entities section (we'll make it editable in Phase 3)

Auto-save can be a stretch goal — for now, explicit save is fine.
```

### Prompt 2.6 — Quick Capture Modal

```
Connect the Quick Capture modal to real data.

1. Quick Capture button in sidebar opens a modal
2. Modal has:
   - Text area for content
   - Optional context tag pickers
   - Save button
3. On save:
   - Create a capture entity via IPC
   - Derive title from first line (or first N characters) of content
   - Close modal
   - Show success toast
4. Add keyboard shortcut: Cmd/Ctrl+N opens Quick Capture

5. On the Home page, show recent captures
6. Each capture should have a "Promote to..." dropdown that calls promoteCapture
```

---

## Phase 3: Relationships + Timeline

### Prompt 3.1 — Link Picker Component

```
Create a reusable LinkPicker component for adding relationships.

1. Create src/components/shared/LinkPicker.tsx:
   - "Link to..." button opens a searchable dropdown/modal
   - Search across all entities in the current product
   - Filter by entity type (optional)
   - Select an entity to link
   - Optionally select relationship type (supports, tests, informs, evidence, relates_to)
   - On confirm, calls createRelationship via IPC

2. Show search results with: type icon, title, status badge

3. Exclude already-linked entities from results
```

### Prompt 3.2 — Display and Manage Links on Detail Pages

```
Update entity detail pages to display and manage relationships.

1. Fetch relationships for the entity using useRelationships hook

2. Display linked entities grouped by:
   - Outgoing links (this entity → others)
   - Incoming links (others → this entity)
   Or group by relationship type

3. Each linked entity shows: type icon, title, status badge, relationship type

4. Click a linked entity to navigate to it

5. Add "unlink" button (X icon) to remove a relationship

6. Add the LinkPicker component to create new links
```

### Prompt 3.3 — Timeline Page

```
Connect the Timeline page to real data.

1. Fetch entities for the current product, sorted by updated_at descending

2. Wire up the type filter chips (Problem, Hypothesis, Experiment, Decision, Artifact, Capture)

3. Each timeline item shows:
   - Type icon + badge
   - Title
   - Status badge (if applicable)
   - Relative timestamp ("2 hours ago")

4. Click an item to navigate to its detail page

5. Apply context filters if they're set in the global context panel

6. Consider grouping by date (Today, Yesterday, This Week, etc.) for better scanning
```

---

## Phase 4: Taxonomy Management

### Prompt 4.1 — Taxonomy Management Page

```
Connect the Manage Context / Taxonomy page to real data.

Looking at the existing UI, there are sections for:
- Personas (with Add button)
- Feature Areas (with Add button)  
- Custom Dimensions (with Add Value, edit, delete)

1. Fetch taxonomy data using useTaxonomy hook

2. Wire up "Add" buttons to create new items via IPC

3. Each item should be:
   - Editable (click to edit name inline, or edit icon)
   - Archivable (archive icon, with confirmation)

4. For dimensions:
   - Show dimension name with edit/delete
   - Show values under each dimension
   - "Add Value" button to add dimension values

5. Archived items should be hidden by default, with optional "Show archived" toggle

6. Changes should reflect immediately in tag pickers across the app
```

---

## Phase 5: Exports

### Prompt 5.1 — Export Preview and Execution

```
Implement the export functionality.

1. Create electron/database/queries/exports.ts with functions:
   - getExportPreview(options): { counts: { total, byType }, entities: EntitySummary[] }
   - executeExport(options): ExportResult
   - getExportHistory(): ExportRecord[]
   - clearExportHistory(): void

2. Export options:
   - mode: 'full' | 'incremental'
   - productId (or 'all')
   - startDate (for incremental)
   - includeLinkedContext: boolean

3. Export execution should:
   - Query entities matching the criteria
   - Generate a folder: exports/runs/<exportId>/
   - Copy relevant markdown files into the export folder
   - Generate manifest.json with metadata
   - Generate snapshot.md (concatenated summary)
   - Record in exports table

4. Create electron/ipc/exports.ts with IPC handlers

5. Wire up the Exports page UI:
   - Mode selection (full/incremental)
   - Incremental options (scope, date range)
   - Preview section shows counts
   - "Download Export" button executes and opens the folder
   - Export History shows past exports
```

### Prompt 5.2 — Copy Snapshot Feature

```
Add "Copy Snapshot" functionality.

1. Generate a single markdown string that summarizes:
   - Active Problems
   - Running Experiments
   - Recent Decisions (last 14 days)
   - Open questions (from entity bodies if present)

2. Format it nicely for pasting into an AI chat:
   - Clear headers
   - Bullet points for items
   - Include status and dates

3. Copy to clipboard on button click

4. Show success toast
```

---

## Phase 6: Settings + Polish

### Prompt 6.1 — Settings Page

```
Wire up the Settings page.

1. Create electron/ipc/settings.ts with handlers:
   - settings:get
   - settings:update

2. Settings to persist:
   - workspacePath (display only, change via folder picker)
   - restoreLastContext (boolean)
   - defaultExportMode ('full' | 'incremental')
   - defaultIncrementalRange ('since_last_export' | 'last_7_days' | 'last_30_days')
   - includeLinkedContextDefault (boolean)

3. Wire up the Settings page form fields to read/write settings

4. "Change workspace" should trigger the folder picker flow

5. "Open workspace folder" should open the folder in the system file explorer

6. Danger Zone:
   - Clear export history (calls clearExportHistory)
   - Clear all data (deletes all products/entities, with scary confirmation)
```

### Prompt 6.2 — Global Search

```
Implement global search (Cmd/Ctrl+K).

1. Create a command palette component that opens on Cmd/Ctrl+K

2. Search across:
   - Entity titles and bodies
   - Product names

3. Show results grouped by type

4. Arrow keys to navigate, Enter to select, Escape to close

5. Selecting a result navigates to that entity's detail page

6. Keep it simple — full-text search can be a future improvement
```

### Prompt 6.3 — Error Handling and Loading States

```
Add proper error handling and loading states throughout the app.

1. Create a toast notification system (or use existing shadcn toast)

2. Every IPC call should:
   - Show loading state in the UI where appropriate
   - Show error toast on failure
   - Show success toast on create/update/delete operations

3. Handle edge cases:
   - Workspace folder deleted/moved
   - Database corruption (show error, offer to reset)
   - Entity not found (show 404-like state)

4. Add error boundaries to catch React errors gracefully
```

---

## Testing Checklist

After all phases, manually verify:

- [ ] Can select/create workspace folder on first run
- [ ] Can create a product
- [ ] Can switch between products
- [ ] Can add personas, features, dimensions
- [ ] Can create each entity type
- [ ] Can edit and save entities
- [ ] Can delete entities
- [ ] Markdown files are generated correctly
- [ ] Can create and remove links between entities
- [ ] Timeline shows entities chronologically
- [ ] Quick Capture works, promotion works
- [ ] Search finds entities
- [ ] Full export generates correct folder
- [ ] Incremental export only includes recent items
- [ ] Settings persist across restarts
- [ ] App works offline (disable network and test)
- [ ] Data survives app restart
