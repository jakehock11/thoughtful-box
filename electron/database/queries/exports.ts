import path from 'path';
import fs from 'fs';
import { getDatabase } from '../db';
import { nanoid } from 'nanoid';
import { getWorkspacePath } from '../../workspace/manager';
import { generateMarkdown } from '../../markdown/templates';
import type { Entity, EntityType } from './entities';

// ============================================
// Type Definitions
// ============================================

export interface ExportOptions {
  productId: string | 'all';
  mode: 'full' | 'incremental';
  startDate?: string;
  includeLinkedContext: boolean;
}

export interface EntitySummary {
  id: string;
  type: EntityType;
  title: string;
  status: string | null;
  updatedAt: string;
}

export interface ExportCounts {
  total: number;
  byType: Record<EntityType, number>;
  newCount?: number;
  updatedCount?: number;
}

export interface ExportPreview {
  counts: ExportCounts;
  entities: EntitySummary[];
}

export interface ExportResult {
  id: string;
  outputPath: string;
  counts: ExportCounts;
  createdAt: string;
}

export interface ExportRecord {
  id: string;
  productId: string | null;
  mode: 'full' | 'incremental';
  scopeType: 'product' | 'all';
  startDate: string | null;
  endDate: string;
  counts: ExportCounts;
  outputPath: string | null;
  createdAt: string;
}

// Database row type
interface ExportRow {
  id: string;
  product_id: string | null;
  mode: string;
  scope_type: string;
  start_date: string | null;
  end_date: string;
  counts: string;
  output_path: string | null;
  created_at: string;
}

interface EntityRow {
  id: string;
  product_id: string;
  type: string;
  title: string;
  body: string;
  status: string | null;
  metadata: string | null;
  promoted_to_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// ID Generation
// ============================================

function generateExportId(): string {
  return `exp_${nanoid(12)}`;
}

// ============================================
// Row Converters
// ============================================

function rowToExportRecord(row: ExportRow): ExportRecord {
  return {
    id: row.id,
    productId: row.product_id,
    mode: row.mode as 'full' | 'incremental',
    scopeType: row.scope_type as 'product' | 'all',
    startDate: row.start_date,
    endDate: row.end_date,
    counts: JSON.parse(row.counts) as ExportCounts,
    outputPath: row.output_path,
    createdAt: row.created_at,
  };
}

function rowToEntitySummary(row: EntityRow): EntitySummary {
  return {
    id: row.id,
    type: row.type as EntityType,
    title: row.title,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function rowToEntity(row: EntityRow, personaIds: string[], featureIds: string[], dimensionValueIds: string[]): Entity {
  return {
    id: row.id,
    productId: row.product_id,
    type: row.type as EntityType,
    title: row.title,
    body: row.body,
    status: row.status,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    promotedToId: row.promoted_to_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    personaIds,
    featureIds,
    dimensionValueIds,
  };
}

// ============================================
// Query Functions
// ============================================

function getEntityContextIds(entityId: string): {
  personaIds: string[];
  featureIds: string[];
  dimensionValueIds: string[];
} {
  const db = getDatabase();

  const personaRows = db.prepare(
    'SELECT persona_id FROM entity_personas WHERE entity_id = ?'
  ).all(entityId) as { persona_id: string }[];

  const featureRows = db.prepare(
    'SELECT feature_id FROM entity_features WHERE entity_id = ?'
  ).all(entityId) as { feature_id: string }[];

  const dimValueRows = db.prepare(
    'SELECT dimension_value_id FROM entity_dimension_values WHERE entity_id = ?'
  ).all(entityId) as { dimension_value_id: string }[];

  return {
    personaIds: personaRows.map(r => r.persona_id),
    featureIds: featureRows.map(r => r.feature_id),
    dimensionValueIds: dimValueRows.map(r => r.dimension_value_id),
  };
}

// ============================================
// Export Preview
// ============================================

export function getExportPreview(options: ExportOptions): ExportPreview {
  const db = getDatabase();

  let query = 'SELECT * FROM entities WHERE 1=1';
  const params: (string | number)[] = [];

  // Product filter
  if (options.productId !== 'all') {
    query += ' AND product_id = ?';
    params.push(options.productId);
  }

  // Date filter for incremental
  if (options.mode === 'incremental' && options.startDate) {
    query += ' AND (created_at >= ? OR updated_at >= ?)';
    params.push(options.startDate, options.startDate);
  }

  query += ' ORDER BY updated_at DESC';

  const rows = db.prepare(query).all(...params) as EntityRow[];

  // Build counts
  const byType: Record<EntityType, number> = {
    capture: 0,
    problem: 0,
    hypothesis: 0,
    experiment: 0,
    decision: 0,
    artifact: 0,
  };

  const entities: EntitySummary[] = rows.map(row => {
    byType[row.type as EntityType]++;
    return rowToEntitySummary(row);
  });

  // If includeLinkedContext is true, we need to find linked entities
  if (options.mode === 'incremental' && options.includeLinkedContext) {
    const includedIds = new Set(entities.map(e => e.id));
    const additionalEntities: EntitySummary[] = [];

    // Get relationships where any of our entities is the source
    const entityIds = Array.from(includedIds);
    if (entityIds.length > 0) {
      const placeholders = entityIds.map(() => '?').join(',');
      const relRows = db.prepare(`
        SELECT DISTINCT e.* FROM entities e
        JOIN relationships r ON e.id = r.target_id
        WHERE r.source_id IN (${placeholders})
      `).all(...entityIds) as EntityRow[];

      for (const row of relRows) {
        if (!includedIds.has(row.id)) {
          byType[row.type as EntityType]++;
          additionalEntities.push(rowToEntitySummary(row));
          includedIds.add(row.id);
        }
      }
    }

    entities.push(...additionalEntities);
  }

  return {
    counts: {
      total: entities.length,
      byType,
    },
    entities,
  };
}

// ============================================
// Execute Export
// ============================================

export function executeExport(options: ExportOptions): ExportResult {
  const db = getDatabase();
  const workspacePath = getWorkspacePath();

  if (!workspacePath) {
    throw new Error('Workspace not configured');
  }

  const exportId = generateExportId();
  const now = new Date().toISOString();

  // Get preview to determine entities to export
  const preview = getExportPreview(options);

  // Create export directory
  const exportDir = path.join(workspacePath, 'exports', 'runs', exportId);
  fs.mkdirSync(exportDir, { recursive: true });

  // Create subdirectories for each entity type
  const typeToFolder: Record<EntityType, string> = {
    capture: 'captures',
    problem: 'problems',
    hypothesis: 'hypotheses',
    experiment: 'experiments',
    decision: 'decisions',
    artifact: 'artifacts',
  };

  // Get full entity data and write markdown files
  const entityIds = preview.entities.map(e => e.id);
  const fullEntities: Entity[] = [];

  for (const entityId of entityIds) {
    const row = db.prepare('SELECT * FROM entities WHERE id = ?').get(entityId) as EntityRow | undefined;
    if (!row) continue;

    const context = getEntityContextIds(entityId);
    const entity = rowToEntity(row, context.personaIds, context.featureIds, context.dimensionValueIds);
    fullEntities.push(entity);

    // Create type folder if needed
    const typeFolder = path.join(exportDir, typeToFolder[entity.type]);
    if (!fs.existsSync(typeFolder)) {
      fs.mkdirSync(typeFolder, { recursive: true });
    }

    // Generate markdown and write
    const markdown = generateMarkdown(entity);
    const filename = sanitizeFilename(entity.title || 'untitled') + `-${entity.id.slice(0, 8)}.md`;
    fs.writeFileSync(path.join(typeFolder, filename), markdown, 'utf-8');
  }

  // Generate manifest.json
  const manifest = {
    exportId,
    exportedAt: now,
    mode: options.mode,
    productId: options.productId,
    startDate: options.startDate || null,
    counts: preview.counts,
    files: fullEntities.map(e => ({
      id: e.id,
      type: e.type,
      title: e.title,
      path: `${typeToFolder[e.type]}/${sanitizeFilename(e.title || 'untitled')}-${e.id.slice(0, 8)}.md`,
    })),
  };

  fs.writeFileSync(
    path.join(exportDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  // Generate snapshot.md
  const snapshot = generateSnapshotMarkdown(fullEntities, preview.counts, options);
  fs.writeFileSync(path.join(exportDir, 'snapshot.md'), snapshot, 'utf-8');

  // Record export in database
  const scopeType = options.productId === 'all' ? 'all' : 'product';

  db.prepare(`
    INSERT INTO exports (id, product_id, mode, scope_type, start_date, end_date, counts, output_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    exportId,
    options.productId === 'all' ? null : options.productId,
    options.mode,
    scopeType,
    options.startDate || null,
    now,
    JSON.stringify(preview.counts),
    exportDir,
    now
  );

  return {
    id: exportId,
    outputPath: exportDir,
    counts: preview.counts,
    createdAt: now,
  };
}

// ============================================
// Export History
// ============================================

export function getExportHistory(productId?: string): ExportRecord[] {
  const db = getDatabase();

  let query = 'SELECT * FROM exports';
  const params: string[] = [];

  if (productId) {
    query += ' WHERE product_id = ? OR product_id IS NULL';
    params.push(productId);
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params) as ExportRow[];
  return rows.map(rowToExportRecord);
}

export function clearExportHistory(productId?: string): void {
  const db = getDatabase();

  if (productId) {
    db.prepare('DELETE FROM exports WHERE product_id = ?').run(productId);
  } else {
    db.prepare('DELETE FROM exports').run();
  }
}

// ============================================
// Copy Snapshot
// ============================================

export function generateCopySnapshot(productId: string): string {
  const db = getDatabase();
  const lines: string[] = [];
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Get product name
  const product = db.prepare('SELECT name FROM products WHERE id = ?').get(productId) as { name: string } | undefined;
  const productName = product?.name || 'Product';

  lines.push(`# ${productName} - Current State`);
  lines.push(`_Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}_`);
  lines.push('');

  // Active Problems (status = 'active' or 'exploring')
  const activeProblems = db.prepare(`
    SELECT id, title, status, body, created_at, updated_at
    FROM entities
    WHERE product_id = ? AND type = 'problem' AND status IN ('active', 'exploring')
    ORDER BY updated_at DESC
  `).all(productId) as EntityRow[];

  if (activeProblems.length > 0) {
    lines.push('## Active Problems');
    lines.push('');
    for (const problem of activeProblems) {
      const updated = new Date(problem.updated_at).toLocaleDateString();
      lines.push(`- **${problem.title || 'Untitled'}** (${problem.status}) - updated ${updated}`);
    }
    lines.push('');
  }

  // Running Experiments (status = 'running' or 'planned')
  const runningExperiments = db.prepare(`
    SELECT id, title, status, body, metadata, created_at, updated_at
    FROM entities
    WHERE product_id = ? AND type = 'experiment' AND status IN ('running', 'planned')
    ORDER BY updated_at DESC
  `).all(productId) as EntityRow[];

  if (runningExperiments.length > 0) {
    lines.push('## Running Experiments');
    lines.push('');
    for (const exp of runningExperiments) {
      const updated = new Date(exp.updated_at).toLocaleDateString();
      let expLine = `- **${exp.title || 'Untitled'}** (${exp.status}) - updated ${updated}`;

      // Check for start/end dates in metadata
      if (exp.metadata) {
        try {
          const meta = JSON.parse(exp.metadata);
          if (meta.startDate) {
            expLine += ` | Started: ${new Date(meta.startDate).toLocaleDateString()}`;
          }
          if (meta.endDate) {
            expLine += ` | Ends: ${new Date(meta.endDate).toLocaleDateString()}`;
          }
        } catch {
          // Ignore JSON parse errors
        }
      }
      lines.push(expLine);
    }
    lines.push('');
  }

  // Recent Decisions (last 14 days)
  const recentDecisions = db.prepare(`
    SELECT id, title, status, body, metadata, created_at, updated_at
    FROM entities
    WHERE product_id = ? AND type = 'decision' AND created_at >= ?
    ORDER BY created_at DESC
  `).all(productId, fourteenDaysAgo) as EntityRow[];

  if (recentDecisions.length > 0) {
    lines.push('## Recent Decisions (Last 14 Days)');
    lines.push('');
    for (const decision of recentDecisions) {
      const created = new Date(decision.created_at).toLocaleDateString();
      let decLine = `- **${decision.title || 'Untitled'}** - ${created}`;

      // Check for decision type in metadata
      if (decision.metadata) {
        try {
          const meta = JSON.parse(decision.metadata);
          if (meta.decisionType) {
            decLine += ` (${meta.decisionType})`;
          }
        } catch {
          // Ignore JSON parse errors
        }
      }
      lines.push(decLine);
    }
    lines.push('');
  }

  // Open Questions - extract from entity bodies looking for question marks
  const entitiesWithQuestions = db.prepare(`
    SELECT id, type, title, body
    FROM entities
    WHERE product_id = ? AND body LIKE '%?%'
    ORDER BY updated_at DESC
    LIMIT 50
  `).all(productId) as EntityRow[];

  const questions: { type: string; title: string; question: string }[] = [];

  for (const entity of entitiesWithQuestions) {
    if (!entity.body) continue;

    // Extract sentences ending with question marks
    // Simple regex to find questions (sentences ending with ?)
    const questionMatches = entity.body.match(/[^.!?\n]*\?/g);
    if (questionMatches) {
      for (const q of questionMatches.slice(0, 3)) { // Max 3 questions per entity
        const cleanQuestion = q
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\s+/g, ' ')    // Normalize whitespace
          .trim();

        if (cleanQuestion.length > 10 && cleanQuestion.length < 300) {
          questions.push({
            type: entity.type,
            title: entity.title || 'Untitled',
            question: cleanQuestion,
          });
        }
      }
    }
  }

  if (questions.length > 0) {
    lines.push('## Open Questions');
    lines.push('');
    // Deduplicate and limit
    const uniqueQuestions = questions
      .filter((q, i, arr) => arr.findIndex(x => x.question === q.question) === i)
      .slice(0, 10);

    for (const q of uniqueQuestions) {
      lines.push(`- ${q.question}`);
      lines.push(`  _From: ${q.title} (${q.type})_`);
    }
    lines.push('');
  }

  // Summary stats
  const stats = db.prepare(`
    SELECT type, COUNT(*) as count
    FROM entities
    WHERE product_id = ?
    GROUP BY type
  `).all(productId) as { type: string; count: number }[];

  if (stats.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('**Quick Stats:**');
    const statParts = stats.map(s => `${s.count} ${s.type}s`);
    lines.push(statParts.join(' | '));
  }

  return lines.join('\n');
}

// ============================================
// Helper Functions
// ============================================

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'untitled';
}

function generateSnapshotMarkdown(
  entities: Entity[],
  counts: ExportCounts,
  options: ExportOptions
): string {
  const lines: string[] = [];

  lines.push('# Export Snapshot');
  lines.push('');
  lines.push(`**Exported:** ${new Date().toISOString()}`);
  lines.push(`**Mode:** ${options.mode}`);
  if (options.mode === 'incremental' && options.startDate) {
    lines.push(`**Since:** ${options.startDate}`);
  }
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`**Total Items:** ${counts.total}`);
  lines.push('');

  const typeLabels: Record<EntityType, string> = {
    capture: 'Captures',
    problem: 'Problems',
    hypothesis: 'Hypotheses',
    experiment: 'Experiments',
    decision: 'Decisions',
    artifact: 'Artifacts',
  };

  for (const [type, count] of Object.entries(counts.byType)) {
    if (count > 0) {
      lines.push(`- **${typeLabels[type as EntityType]}:** ${count}`);
    }
  }
  lines.push('');

  lines.push('## Recent Activity');
  lines.push('');

  const recent = [...entities]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 20);

  for (const e of recent) {
    const date = new Date(e.updatedAt).toLocaleDateString();
    lines.push(`- [${e.type}] ${e.title || 'Untitled'} (${date})`);
  }

  return lines.join('\n');
}
