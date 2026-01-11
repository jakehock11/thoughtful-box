import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database | null = null;

// Get the default database path (in app's userData directory)
function getDefaultDbPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'product-os.sqlite');
}

// Initialize the database
export function initializeDatabase(dbPath?: string): Database.Database {
  const targetPath = dbPath || getDefaultDbPath();

  // Ensure the directory exists
  const dbDir = path.dirname(targetPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create/open the database
  db = new Database(targetPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Run schema if tables don't exist
  const tablesExist = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='products'"
  ).get();

  if (!tablesExist) {
    runSchema(db);
  } else {
    // Run migrations for existing databases
    migrateSettingsTable(db);
  }

  return db;
}

// Run the schema SQL file
function runSchema(database: Database.Database): void {
  // Read schema.sql from the same directory
  const schemaPath = path.join(__dirname, 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Execute the schema (better-sqlite3 handles multi-statement SQL)
  database.exec(schema);
}

// Migrate settings table for existing databases (Phase 6 migration)
function migrateSettingsTable(database: Database.Database): void {
  // Check if settings table exists
  const settingsExists = database.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='settings'"
  ).get();

  if (!settingsExists) {
    // Settings table doesn't exist - create it with full schema
    database.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        workspace_path TEXT,
        last_product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
        restore_last_context INTEGER DEFAULT 1,
        default_export_mode TEXT DEFAULT 'incremental',
        default_incremental_range TEXT DEFAULT 'since_last_export',
        include_linked_context INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    return;
  }

  // Check which columns exist
  const columns = database.prepare("PRAGMA table_info(settings)").all() as { name: string }[];
  const columnNames = new Set(columns.map(c => c.name));

  // Define columns to add if missing (Phase 6 additions)
  const newColumns = [
    { name: 'last_product_id', sql: 'ALTER TABLE settings ADD COLUMN last_product_id TEXT REFERENCES products(id) ON DELETE SET NULL' },
    { name: 'restore_last_context', sql: 'ALTER TABLE settings ADD COLUMN restore_last_context INTEGER DEFAULT 1' },
    { name: 'default_export_mode', sql: "ALTER TABLE settings ADD COLUMN default_export_mode TEXT DEFAULT 'incremental'" },
    { name: 'default_incremental_range', sql: "ALTER TABLE settings ADD COLUMN default_incremental_range TEXT DEFAULT 'since_last_export'" },
    { name: 'include_linked_context', sql: 'ALTER TABLE settings ADD COLUMN include_linked_context INTEGER DEFAULT 1' },
  ];

  for (const col of newColumns) {
    if (!columnNames.has(col.name)) {
      try {
        database.exec(col.sql);
      } catch (e) {
        // Column might already exist or other error - log and continue
        console.error(`Migration: Failed to add column ${col.name}:`, e);
      }
    }
  }
}

// Get the database instance
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Close the database connection
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Get list of tables (for testing)
export function getTables(): string[] {
  const database = getDatabase();
  const tables = database
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all() as { name: string }[];
  return tables.map(t => t.name);
}

// Check if database is initialized
export function isDatabaseInitialized(): boolean {
  return db !== null;
}
