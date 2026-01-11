// ============================================
// Entity Types
// ============================================

export type EntityType = 'capture' | 'problem' | 'hypothesis' | 'experiment' | 'decision' | 'artifact';

// Status values per entity type
export type ProblemStatus = 'active' | 'exploring' | 'blocked' | 'solved' | 'archived';
export type HypothesisStatus = 'draft' | 'active' | 'invalidated' | 'archived';
export type ExperimentStatus = 'planned' | 'running' | 'paused' | 'complete' | 'archived';
export type ArtifactStatus = 'draft' | 'final' | 'archived';
export type DecisionType = 'reversible' | 'irreversible';
export type ExperimentOutcome = 'validated' | 'invalidated' | 'inconclusive';

// ============================================
// Product
// ============================================

export interface Product {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  icon?: string;
}

// ============================================
// Taxonomy
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

// ============================================
// Entity
// ============================================

export interface EntityMetadata {
  // Hypothesis
  confidence?: number;
  // Experiment
  startDate?: string;
  endDate?: string;
  outcome?: ExperimentOutcome;
  metrics?: string[];
  // Decision
  decisionType?: DecisionType;
  decidedAt?: string;
  // Artifact
  artifactType?: string;
  source?: string;
}

export interface Entity {
  id: string;
  productId: string;
  type: EntityType;
  title: string;
  body: string;
  status: string | null;
  metadata: EntityMetadata | null;
  promotedToId: string | null;
  createdAt: string;
  updatedAt: string;
  personaIds: string[];
  featureIds: string[];
  dimensionValueIds: string[];
}

export interface CreateEntityData {
  productId: string;
  type: EntityType;
  title?: string;
  body?: string;
  status?: string;
  personaIds?: string[];
  featureIds?: string[];
  dimensionValueIds?: string[];
  metadata?: EntityMetadata;
}

export interface UpdateEntityData {
  title?: string;
  body?: string;
  status?: string;
  personaIds?: string[];
  featureIds?: string[];
  dimensionValueIds?: string[];
  metadata?: EntityMetadata;
}

export interface EntityFilters {
  type?: EntityType;
  status?: string;
  search?: string;
}

// ============================================
// Relationships
// ============================================

export interface Relationship {
  id: string;
  productId: string;
  sourceId: string;
  targetId: string;
  relationshipType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedEntity {
  id: string;
  type: EntityType;
  title: string;
  status: string | null;
}

export interface RelationshipWithEntity extends Relationship {
  linkedEntity: LinkedEntity;
  direction: 'outgoing' | 'incoming';
}

export interface CreateRelationshipData {
  sourceId: string;
  targetId: string;
  relationshipType?: string;
  productId: string;
}

// ============================================
// Exports
// ============================================

export type ExportMode = 'full' | 'incremental';
export type ExportScopeType = 'product' | 'all';

export interface ExportCounts {
  total: number;
  byType: Record<EntityType, number>;
  newCount: number;
  updatedCount: number;
}

export interface ExportRecord {
  id: string;
  productId: string | null;
  mode: ExportMode;
  scopeType: ExportScopeType;
  startDate: string | null;
  endDate: string;
  counts: ExportCounts;
  outputPath: string | null;
  createdAt: string;
}

export interface ExportOptions {
  mode: ExportMode;
  scopeType: ExportScopeType;
  productId?: string;
  startDate?: string;
  endDate?: string;
  includeLinkedContext?: boolean;
}

export interface ExportPreview {
  entities: Entity[];
  counts: ExportCounts;
}

export interface ExportResult {
  record: ExportRecord;
  outputPath: string;
}

// ============================================
// Settings
// ============================================

export interface Settings {
  id: number;
  workspacePath: string | null;
  lastProductId: string | null;
  restoreLastContext: boolean;
  defaultExportMode: ExportMode;
  defaultIncrementalRange: 'since_last_export' | 'last_7_days' | 'last_30_days' | 'custom';
  includeLinkedContext: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsData {
  lastProductId?: string | null;
  restoreLastContext?: boolean;
  defaultExportMode?: ExportMode;
  defaultIncrementalRange?: string;
  includeLinkedContext?: boolean;
}

// ============================================
// IPC Result Type
// ============================================

export interface IPCResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

// ============================================
// Workspace Types
// ============================================

export interface WorkspaceSelectResult {
  success: boolean;
  path: string | null;
  error?: string;
}

export interface WorkspacePathResult {
  success: boolean;
  path: string | null;
  error?: string;
}

export interface WorkspaceConfiguredResult {
  success: boolean;
  configured: boolean;
  error?: string;
}
