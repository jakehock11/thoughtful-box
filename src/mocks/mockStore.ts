import type {
  Product,
  CreateProductData,
  UpdateProductData,
  Taxonomy,
  Persona,
  Feature,
  Dimension,
  DimensionValue,
  Entity,
  EntityType,
  CreateEntityData,
  UpdateEntityData,
  EntityFilters,
  Relationship,
  RelationshipWithEntity,
  CreateRelationshipData,
  ExportOptions,
  ExportPreview,
  ExportResult,
  ExportRecord,
  Settings,
  UpdateSettingsData,
} from '@/lib/types';

import {
  MOCK_PRODUCTS,
  MOCK_TAXONOMY,
  MOCK_ALL_ENTITIES,
  MOCK_RELATIONSHIPS,
  MOCK_SETTINGS,
} from './mockData';

// ============================================
// In-Memory Store State
// ============================================

let products = [...MOCK_PRODUCTS];
let taxonomy = { ...MOCK_TAXONOMY };
let entities = [...MOCK_ALL_ENTITIES];
let relationships = [...MOCK_RELATIONSHIPS];
let settings = { ...MOCK_SETTINGS };
let nextId = 1000;

function generateId(prefix: string): string {
  return `${prefix}_${nextId++}`;
}

function now(): string {
  return new Date().toISOString();
}

// ============================================
// Product Operations
// ============================================

export function getProducts(): Product[] {
  return products;
}

export function getProduct(id: string): Product | null {
  return products.find((p) => p.id === id) || null;
}

export function createProduct(data: CreateProductData): Product {
  const product: Product = {
    id: generateId('prod'),
    name: data.name,
    description: data.description || null,
    icon: data.icon || null,
    createdAt: now(),
    updatedAt: now(),
    lastActivityAt: now(),
  };
  products.push(product);
  return product;
}

export function updateProduct(id: string, data: UpdateProductData): Product {
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Product not found');
  products[index] = { ...products[index], ...data, updatedAt: now() };
  return products[index];
}

export function deleteProduct(id: string): void {
  products = products.filter((p) => p.id !== id);
  entities = entities.filter((e) => e.productId !== id);
}

// ============================================
// Taxonomy Operations
// ============================================

export function getTaxonomy(productId: string): Taxonomy {
  return {
    personas: taxonomy.personas.filter((p) => p.productId === productId),
    features: taxonomy.features.filter((f) => f.productId === productId),
    dimensions: taxonomy.dimensions.filter((d) => d.productId === productId),
  };
}

// Personas
export function createPersona(productId: string, name: string): Persona {
  const persona: Persona = {
    id: generateId('persona'),
    productId,
    name,
    isArchived: false,
    createdAt: now(),
    updatedAt: now(),
  };
  taxonomy.personas.push(persona);
  return persona;
}

export function updatePersona(id: string, data: { name?: string }): Persona {
  const index = taxonomy.personas.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Persona not found');
  taxonomy.personas[index] = { ...taxonomy.personas[index], ...data, updatedAt: now() };
  return taxonomy.personas[index];
}

export function archivePersona(id: string): void {
  const index = taxonomy.personas.findIndex((p) => p.id === id);
  if (index !== -1) taxonomy.personas[index].isArchived = true;
}

export function unarchivePersona(id: string): Persona {
  const index = taxonomy.personas.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Persona not found');
  taxonomy.personas[index].isArchived = false;
  return taxonomy.personas[index];
}

// Features (taxonomy)
export function createFeature(productId: string, name: string): Feature {
  const feature: Feature = {
    id: generateId('feat'),
    productId,
    name,
    isArchived: false,
    createdAt: now(),
    updatedAt: now(),
  };
  taxonomy.features.push(feature);
  return feature;
}

export function updateFeature(id: string, data: { name?: string }): Feature {
  const index = taxonomy.features.findIndex((f) => f.id === id);
  if (index === -1) throw new Error('Feature not found');
  taxonomy.features[index] = { ...taxonomy.features[index], ...data, updatedAt: now() };
  return taxonomy.features[index];
}

export function archiveFeature(id: string): void {
  const index = taxonomy.features.findIndex((f) => f.id === id);
  if (index !== -1) taxonomy.features[index].isArchived = true;
}

export function unarchiveFeature(id: string): Feature {
  const index = taxonomy.features.findIndex((f) => f.id === id);
  if (index === -1) throw new Error('Feature not found');
  taxonomy.features[index].isArchived = false;
  return taxonomy.features[index];
}

// Dimensions
export function createDimension(productId: string, name: string): Dimension {
  const dimension: Dimension = {
    id: generateId('dim'),
    productId,
    name,
    isArchived: false,
    createdAt: now(),
    updatedAt: now(),
    values: [],
  };
  taxonomy.dimensions.push(dimension);
  return dimension;
}

export function updateDimension(id: string, data: { name?: string }): Dimension {
  const index = taxonomy.dimensions.findIndex((d) => d.id === id);
  if (index === -1) throw new Error('Dimension not found');
  taxonomy.dimensions[index] = { ...taxonomy.dimensions[index], ...data, updatedAt: now() };
  return taxonomy.dimensions[index];
}

export function archiveDimension(id: string): void {
  const index = taxonomy.dimensions.findIndex((d) => d.id === id);
  if (index !== -1) taxonomy.dimensions[index].isArchived = true;
}

export function unarchiveDimension(id: string): Dimension {
  const index = taxonomy.dimensions.findIndex((d) => d.id === id);
  if (index === -1) throw new Error('Dimension not found');
  taxonomy.dimensions[index].isArchived = false;
  return taxonomy.dimensions[index];
}

// Dimension Values
export function createDimensionValue(dimensionId: string, name: string): DimensionValue {
  const dimIndex = taxonomy.dimensions.findIndex((d) => d.id === dimensionId);
  if (dimIndex === -1) throw new Error('Dimension not found');
  
  const value: DimensionValue = {
    id: generateId('dv'),
    dimensionId,
    name,
    isArchived: false,
    createdAt: now(),
    updatedAt: now(),
  };
  taxonomy.dimensions[dimIndex].values.push(value);
  return value;
}

export function updateDimensionValue(id: string, data: { name?: string }): DimensionValue {
  for (const dim of taxonomy.dimensions) {
    const valueIndex = dim.values.findIndex((v) => v.id === id);
    if (valueIndex !== -1) {
      dim.values[valueIndex] = { ...dim.values[valueIndex], ...data, updatedAt: now() };
      return dim.values[valueIndex];
    }
  }
  throw new Error('Dimension value not found');
}

export function archiveDimensionValue(id: string): void {
  for (const dim of taxonomy.dimensions) {
    const valueIndex = dim.values.findIndex((v) => v.id === id);
    if (valueIndex !== -1) {
      dim.values[valueIndex].isArchived = true;
      return;
    }
  }
}

export function unarchiveDimensionValue(id: string): DimensionValue {
  for (const dim of taxonomy.dimensions) {
    const valueIndex = dim.values.findIndex((v) => v.id === id);
    if (valueIndex !== -1) {
      dim.values[valueIndex].isArchived = false;
      return dim.values[valueIndex];
    }
  }
  throw new Error('Dimension value not found');
}

// ============================================
// Entity Operations
// ============================================

export function getEntities(productId: string, filters?: EntityFilters): Entity[] {
  let result = entities.filter((e) => e.productId === productId);
  
  if (filters?.type) {
    result = result.filter((e) => e.type === filters.type);
  }
  if (filters?.types && filters.types.length > 0) {
    result = result.filter((e) => filters.types!.includes(e.type));
  }
  if (filters?.status) {
    result = result.filter((e) => e.status === filters.status);
  }
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(
      (e) =>
        e.title.toLowerCase().includes(search) ||
        e.body.toLowerCase().includes(search)
    );
  }
  
  return result;
}

export function getEntity(id: string): Entity | null {
  return entities.find((e) => e.id === id) || null;
}

export function createEntity(data: CreateEntityData): Entity {
  const prefixMap: Record<EntityType, string> = {
    capture: 'cap',
    problem: 'prob',
    hypothesis: 'hyp',
    experiment: 'exp',
    decision: 'dec',
    artifact: 'art',
    feedback: 'fb',
    feature_request: 'req',
    feature: 'feature',
  };
  
  const entity: Entity = {
    id: generateId(prefixMap[data.type]),
    productId: data.productId,
    type: data.type,
    title: data.title || '',
    body: data.body || '',
    status: data.status || null,
    metadata: data.metadata || null,
    promotedToId: null,
    createdAt: now(),
    updatedAt: now(),
    personaIds: data.personaIds || [],
    featureIds: data.featureIds || [],
    dimensionValueIds: data.dimensionValueIds || [],
  };
  entities.unshift(entity);
  return entity;
}

export function updateEntity(id: string, data: UpdateEntityData): Entity {
  const index = entities.findIndex((e) => e.id === id);
  if (index === -1) throw new Error('Entity not found');
  
  entities[index] = {
    ...entities[index],
    ...(data.title !== undefined && { title: data.title }),
    ...(data.body !== undefined && { body: data.body }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.personaIds !== undefined && { personaIds: data.personaIds }),
    ...(data.featureIds !== undefined && { featureIds: data.featureIds }),
    ...(data.dimensionValueIds !== undefined && { dimensionValueIds: data.dimensionValueIds }),
    ...(data.metadata !== undefined && { metadata: { ...entities[index].metadata, ...data.metadata } }),
    updatedAt: now(),
  };
  return entities[index];
}

export function deleteEntity(id: string): void {
  entities = entities.filter((e) => e.id !== id);
  relationships = relationships.filter((r) => r.sourceId !== id && r.targetId !== id);
}

export function promoteEntity(captureId: string, targetType: EntityType): Entity {
  const capture = entities.find((e) => e.id === captureId);
  if (!capture) throw new Error('Capture not found');
  
  const newEntity = createEntity({
    productId: capture.productId,
    type: targetType,
    title: capture.title,
    body: capture.body,
    personaIds: capture.personaIds,
    featureIds: capture.featureIds,
    dimensionValueIds: capture.dimensionValueIds,
  });
  
  // Update original capture
  const captureIndex = entities.findIndex((e) => e.id === captureId);
  if (captureIndex !== -1) {
    entities[captureIndex].promotedToId = newEntity.id;
  }
  
  return newEntity;
}

// ============================================
// Relationship Operations
// ============================================

export function getRelationshipsForEntity(entityId: string): RelationshipWithEntity[] {
  const result: RelationshipWithEntity[] = [];
  
  for (const rel of relationships) {
    if (rel.sourceId === entityId) {
      const target = entities.find((e) => e.id === rel.targetId);
      if (target) {
        result.push({
          ...rel,
          linkedEntity: {
            id: target.id,
            type: target.type,
            title: target.title,
            status: target.status,
          },
          direction: 'outgoing',
        });
      }
    } else if (rel.targetId === entityId) {
      const source = entities.find((e) => e.id === rel.sourceId);
      if (source) {
        result.push({
          ...rel,
          linkedEntity: {
            id: source.id,
            type: source.type,
            title: source.title,
            status: source.status,
          },
          direction: 'incoming',
        });
      }
    }
  }
  
  return result;
}

export function getOutgoingRelationships(entityId: string): RelationshipWithEntity[] {
  return getRelationshipsForEntity(entityId).filter((r) => r.direction === 'outgoing');
}

export function getIncomingRelationships(entityId: string): RelationshipWithEntity[] {
  return getRelationshipsForEntity(entityId).filter((r) => r.direction === 'incoming');
}

export function createRelationship(data: CreateRelationshipData): Relationship {
  const relationship: Relationship = {
    id: generateId('rel'),
    productId: data.productId,
    sourceId: data.sourceId,
    targetId: data.targetId,
    relationshipType: data.relationshipType || 'relates_to',
    createdAt: now(),
    updatedAt: now(),
  };
  relationships.push(relationship);
  return relationship;
}

export function deleteRelationship(id: string): void {
  relationships = relationships.filter((r) => r.id !== id);
}

// ============================================
// Export Operations
// ============================================

export function getExportPreview(options: ExportOptions): ExportPreview {
  let exportEntities = options.productId === 'all'
    ? entities
    : entities.filter((e) => e.productId === options.productId);
  
  if (options.mode === 'incremental' && options.startDate) {
    exportEntities = exportEntities.filter(
      (e) => new Date(e.updatedAt) >= new Date(options.startDate!)
    );
  }
  
  const byType: Record<string, number> = {};
  for (const e of exportEntities) {
    byType[e.type] = (byType[e.type] || 0) + 1;
  }
  
  return {
    counts: {
      total: exportEntities.length,
      byType: byType as any,
    },
    entities: exportEntities.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      status: e.status,
      updatedAt: e.updatedAt,
    })),
  };
}

export function executeExport(options: ExportOptions): ExportResult {
  const preview = getExportPreview(options);
  return {
    id: generateId('export'),
    outputPath: '/mock/exports/export-' + Date.now() + '.zip',
    counts: preview.counts,
    createdAt: now(),
  };
}

export function getExportHistory(): ExportRecord[] {
  return [];
}

export function clearExportHistory(): void {
  // No-op in mock
}

export function copySnapshot(productId: string): string {
  const productEntities = entities.filter((e) => e.productId === productId);
  const product = products.find((p) => p.id === productId);
  
  let markdown = `# ${product?.name || 'Product'} Snapshot\n\n`;
  markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
  markdown += `## Entities (${productEntities.length})\n\n`;
  
  for (const e of productEntities) {
    markdown += `### ${e.title || 'Untitled'} (${e.type})\n`;
    markdown += `${e.body}\n\n`;
  }
  
  return markdown;
}

// ============================================
// Settings Operations
// ============================================

export function getSettings(): Settings {
  return settings;
}

export function updateSettings(data: UpdateSettingsData): Settings {
  settings = { 
    ...settings, 
    ...data, 
    updatedAt: now(),
    defaultIncrementalRange: (data.defaultIncrementalRange as Settings['defaultIncrementalRange']) ?? settings.defaultIncrementalRange,
  };
  return settings;
}

// ============================================
// Mock Store Export
// ============================================

export const mockStore = {
  // Products
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  
  // Taxonomy
  getTaxonomy,
  createPersona,
  updatePersona,
  archivePersona,
  unarchivePersona,
  createFeature,
  updateFeature,
  archiveFeature,
  unarchiveFeature,
  createDimension,
  updateDimension,
  archiveDimension,
  unarchiveDimension,
  createDimensionValue,
  updateDimensionValue,
  archiveDimensionValue,
  unarchiveDimensionValue,
  
  // Entities
  getEntities,
  getEntity,
  createEntity,
  updateEntity,
  deleteEntity,
  promoteEntity,
  
  // Relationships
  getRelationshipsForEntity,
  getOutgoingRelationships,
  getIncomingRelationships,
  createRelationship,
  deleteRelationship,
  
  // Exports
  getExportPreview,
  executeExport,
  getExportHistory,
  clearExportHistory,
  copySnapshot,
  
  // Settings
  getSettings,
  updateSettings,
};
