import { getDatabase } from '../db';
import { nanoid } from 'nanoid';

// ============================================
// Type Definitions
// ============================================

export interface Persona {
  id: string;
  productId: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Feature {
  id: string;
  productId: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DimensionValue {
  id: string;
  dimensionId: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Dimension {
  id: string;
  productId: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  values: DimensionValue[];
}

export interface Taxonomy {
  personas: Persona[];
  features: Feature[];
  dimensions: Dimension[];
}

// Database row types (snake_case)
interface PersonaRow {
  id: string;
  product_id: string;
  name: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

interface FeatureRow {
  id: string;
  product_id: string;
  name: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

interface DimensionRow {
  id: string;
  product_id: string;
  name: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

interface DimensionValueRow {
  id: string;
  dimension_id: string;
  name: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// ID Generation
// ============================================

function generatePersonaId(): string {
  return `pers_${nanoid(12)}`;
}

function generateFeatureId(): string {
  return `feat_${nanoid(12)}`;
}

function generateDimensionId(): string {
  return `dim_${nanoid(12)}`;
}

function generateDimensionValueId(): string {
  return `dimval_${nanoid(12)}`;
}

// ============================================
// Row Converters
// ============================================

function rowToPersona(row: PersonaRow): Persona {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToFeature(row: FeatureRow): Feature {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToDimensionValue(row: DimensionValueRow): DimensionValue {
  return {
    id: row.id,
    dimensionId: row.dimension_id,
    name: row.name,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToDimension(row: DimensionRow, values: DimensionValue[]): Dimension {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    values,
  };
}

// ============================================
// Persona Functions
// ============================================

export function getPersonas(productId: string, includeArchived = false): Persona[] {
  const db = getDatabase();
  const query = includeArchived
    ? `SELECT * FROM personas WHERE product_id = ? ORDER BY name`
    : `SELECT * FROM personas WHERE product_id = ? AND is_archived = 0 ORDER BY name`;

  const rows = db.prepare(query).all(productId) as PersonaRow[];
  return rows.map(rowToPersona);
}

export function getPersonaById(id: string): Persona | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM personas WHERE id = ?').get(id) as PersonaRow | undefined;
  return row ? rowToPersona(row) : null;
}

export function createPersona(productId: string, name: string): Persona {
  const db = getDatabase();
  const id = generatePersonaId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO personas (id, product_id, name, is_archived, created_at, updated_at)
    VALUES (?, ?, ?, 0, ?, ?)
  `).run(id, productId, name, now, now);

  const persona = getPersonaById(id);
  if (!persona) throw new Error('Failed to create persona');
  return persona;
}

export function updatePersona(id: string, data: { name?: string }): Persona {
  const db = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  const result = db.prepare(`UPDATE personas SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  if (result.changes === 0) throw new Error(`Persona not found: ${id}`);

  const persona = getPersonaById(id);
  if (!persona) throw new Error('Failed to retrieve updated persona');
  return persona;
}

export function archivePersona(id: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  const result = db.prepare(`
    UPDATE personas SET is_archived = 1, updated_at = ? WHERE id = ?
  `).run(now, id);

  if (result.changes === 0) throw new Error(`Persona not found: ${id}`);
}

export function unarchivePersona(id: string): Persona {
  const db = getDatabase();
  const now = new Date().toISOString();

  const result = db.prepare(`
    UPDATE personas SET is_archived = 0, updated_at = ? WHERE id = ?
  `).run(now, id);

  if (result.changes === 0) throw new Error(`Persona not found: ${id}`);

  const persona = getPersonaById(id);
  if (!persona) throw new Error('Failed to retrieve unarchived persona');
  return persona;
}

// ============================================
// Feature Functions
// ============================================

export function getFeatures(productId: string, includeArchived = false): Feature[] {
  const db = getDatabase();
  const query = includeArchived
    ? `SELECT * FROM features WHERE product_id = ? ORDER BY name`
    : `SELECT * FROM features WHERE product_id = ? AND is_archived = 0 ORDER BY name`;

  const rows = db.prepare(query).all(productId) as FeatureRow[];
  return rows.map(rowToFeature);
}

export function getFeatureById(id: string): Feature | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM features WHERE id = ?').get(id) as FeatureRow | undefined;
  return row ? rowToFeature(row) : null;
}

export function createFeature(productId: string, name: string): Feature {
  const db = getDatabase();
  const id = generateFeatureId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO features (id, product_id, name, is_archived, created_at, updated_at)
    VALUES (?, ?, ?, 0, ?, ?)
  `).run(id, productId, name, now, now);

  const feature = getFeatureById(id);
  if (!feature) throw new Error('Failed to create feature');
  return feature;
}

export function updateFeature(id: string, data: { name?: string }): Feature {
  const db = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  const result = db.prepare(`UPDATE features SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  if (result.changes === 0) throw new Error(`Feature not found: ${id}`);

  const feature = getFeatureById(id);
  if (!feature) throw new Error('Failed to retrieve updated feature');
  return feature;
}

export function archiveFeature(id: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  const result = db.prepare(`
    UPDATE features SET is_archived = 1, updated_at = ? WHERE id = ?
  `).run(now, id);

  if (result.changes === 0) throw new Error(`Feature not found: ${id}`);
}

export function unarchiveFeature(id: string): Feature {
  const db = getDatabase();
  const now = new Date().toISOString();

  const result = db.prepare(`
    UPDATE features SET is_archived = 0, updated_at = ? WHERE id = ?
  `).run(now, id);

  if (result.changes === 0) throw new Error(`Feature not found: ${id}`);

  const feature = getFeatureById(id);
  if (!feature) throw new Error('Failed to retrieve unarchived feature');
  return feature;
}

// ============================================
// Dimension Functions
// ============================================

export function getDimensions(productId: string, includeArchived = false): Dimension[] {
  const db = getDatabase();
  const dimQuery = includeArchived
    ? `SELECT * FROM dimensions WHERE product_id = ? ORDER BY name`
    : `SELECT * FROM dimensions WHERE product_id = ? AND is_archived = 0 ORDER BY name`;

  const dimRows = db.prepare(dimQuery).all(productId) as DimensionRow[];

  return dimRows.map(dimRow => {
    const valueQuery = includeArchived
      ? `SELECT * FROM dimension_values WHERE dimension_id = ? ORDER BY name`
      : `SELECT * FROM dimension_values WHERE dimension_id = ? AND is_archived = 0 ORDER BY name`;

    const valueRows = db.prepare(valueQuery).all(dimRow.id) as DimensionValueRow[];
    const values = valueRows.map(rowToDimensionValue);

    return rowToDimension(dimRow, values);
  });
}

export function getDimensionById(id: string): Dimension | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM dimensions WHERE id = ?').get(id) as DimensionRow | undefined;
  if (!row) return null;

  const valueRows = db.prepare(
    'SELECT * FROM dimension_values WHERE dimension_id = ? ORDER BY name'
  ).all(id) as DimensionValueRow[];
  const values = valueRows.map(rowToDimensionValue);

  return rowToDimension(row, values);
}

export function createDimension(productId: string, name: string): Dimension {
  const db = getDatabase();
  const id = generateDimensionId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO dimensions (id, product_id, name, is_archived, created_at, updated_at)
    VALUES (?, ?, ?, 0, ?, ?)
  `).run(id, productId, name, now, now);

  const dimension = getDimensionById(id);
  if (!dimension) throw new Error('Failed to create dimension');
  return dimension;
}

export function updateDimension(id: string, data: { name?: string }): Dimension {
  const db = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  const result = db.prepare(`UPDATE dimensions SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  if (result.changes === 0) throw new Error(`Dimension not found: ${id}`);

  const dimension = getDimensionById(id);
  if (!dimension) throw new Error('Failed to retrieve updated dimension');
  return dimension;
}

export function archiveDimension(id: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  const result = db.prepare(`
    UPDATE dimensions SET is_archived = 1, updated_at = ? WHERE id = ?
  `).run(now, id);

  if (result.changes === 0) throw new Error(`Dimension not found: ${id}`);
}

export function unarchiveDimension(id: string): Dimension {
  const db = getDatabase();
  const now = new Date().toISOString();

  const result = db.prepare(`
    UPDATE dimensions SET is_archived = 0, updated_at = ? WHERE id = ?
  `).run(now, id);

  if (result.changes === 0) throw new Error(`Dimension not found: ${id}`);

  const dimension = getDimensionById(id);
  if (!dimension) throw new Error('Failed to retrieve unarchived dimension');
  return dimension;
}

// ============================================
// Dimension Value Functions
// ============================================

export function getDimensionValues(dimensionId: string, includeArchived = false): DimensionValue[] {
  const db = getDatabase();
  const query = includeArchived
    ? `SELECT * FROM dimension_values WHERE dimension_id = ? ORDER BY name`
    : `SELECT * FROM dimension_values WHERE dimension_id = ? AND is_archived = 0 ORDER BY name`;

  const rows = db.prepare(query).all(dimensionId) as DimensionValueRow[];
  return rows.map(rowToDimensionValue);
}

export function getDimensionValueById(id: string): DimensionValue | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM dimension_values WHERE id = ?').get(id) as DimensionValueRow | undefined;
  return row ? rowToDimensionValue(row) : null;
}

export function createDimensionValue(dimensionId: string, name: string): DimensionValue {
  const db = getDatabase();
  const id = generateDimensionValueId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO dimension_values (id, dimension_id, name, is_archived, created_at, updated_at)
    VALUES (?, ?, ?, 0, ?, ?)
  `).run(id, dimensionId, name, now, now);

  const value = getDimensionValueById(id);
  if (!value) throw new Error('Failed to create dimension value');
  return value;
}

export function updateDimensionValue(id: string, data: { name?: string }): DimensionValue {
  const db = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  const result = db.prepare(`UPDATE dimension_values SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  if (result.changes === 0) throw new Error(`Dimension value not found: ${id}`);

  const value = getDimensionValueById(id);
  if (!value) throw new Error('Failed to retrieve updated dimension value');
  return value;
}

export function archiveDimensionValue(id: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  const result = db.prepare(`
    UPDATE dimension_values SET is_archived = 1, updated_at = ? WHERE id = ?
  `).run(now, id);

  if (result.changes === 0) throw new Error(`Dimension value not found: ${id}`);
}

export function unarchiveDimensionValue(id: string): DimensionValue {
  const db = getDatabase();
  const now = new Date().toISOString();

  const result = db.prepare(`
    UPDATE dimension_values SET is_archived = 0, updated_at = ? WHERE id = ?
  `).run(now, id);

  if (result.changes === 0) throw new Error(`Dimension value not found: ${id}`);

  const value = getDimensionValueById(id);
  if (!value) throw new Error('Failed to retrieve unarchived dimension value');
  return value;
}

// ============================================
// Convenience Functions
// ============================================

// Get all taxonomy for a product
export function getTaxonomy(productId: string, includeArchived = false): Taxonomy {
  return {
    personas: getPersonas(productId, includeArchived),
    features: getFeatures(productId, includeArchived),
    dimensions: getDimensions(productId, includeArchived),
  };
}
