// ============================================
// Entity Types
// ============================================

export type EntityType = 
  | 'capture' 
  | 'problem' 
  | 'hypothesis' 
  | 'experiment' 
  | 'decision' 
  | 'artifact'
  | 'feedback'
  | 'feature_request'
  | 'feature';

// Status values per entity type
export type ProblemStatus = 'active' | 'exploring' | 'blocked' | 'solved' | 'archived';
export type HypothesisStatus = 'draft' | 'active' | 'invalidated' | 'archived';
export type ExperimentStatus = 'planned' | 'running' | 'paused' | 'complete' | 'archived';
export type ArtifactStatus = 'draft' | 'final' | 'archived';
export type DecisionType = 'reversible' | 'irreversible';
export type ExperimentOutcome = 'validated' | 'invalidated' | 'inconclusive';

// New entity status types
export type FeedbackType = 'praise' | 'complaint' | 'bug' | 'suggestion' | 'question';
export type FeedbackStatus = 'new' | 'reviewed' | 'actioned' | 'archived';
export type FeatureRequestStatus = 'new' | 'considering' | 'planned' | 'in_progress' | 'shipped' | 'declined';
export type FeatureRequestPriority = 'low' | 'medium' | 'high' | 'critical';
export type FeatureStatus = 'building' | 'shipped' | 'monitoring' | 'stable' | 'deprecated';
export type FeatureHealth = 'healthy' | 'needs_attention' | 'underperforming';

// Feature check-in for tracking health over time
export interface FeatureCheckIn {
  id: string;
  date: string;
  health: FeatureHealth;
  notes: string;
}

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
  sourceUrl?: string;
  // Feedback
  feedbackType?: FeedbackType;
  // Feature Request
  priority?: FeatureRequestPriority;
  declinedReason?: string;
  // Feature
  health?: FeatureHealth;
  shippedAt?: string;
  checkIns?: FeatureCheckIn[];
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
  types?: EntityType[];
  status?: string;
  search?: string;
}

// ============================================
// Relationships
// ============================================

export type RelationshipType = 'supports' | 'tests' | 'informs' | 'evidence' | 'relates_to';

export const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: 'relates_to', label: 'Relates to' },
  { value: 'supports', label: 'Supports' },
  { value: 'tests', label: 'Tests' },
  { value: 'informs', label: 'Informs' },
  { value: 'evidence', label: 'Evidence for' },
];

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

export interface ExportOptions {
  productId: string | 'all';
  mode: ExportMode;
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
  mode: ExportMode;
  scopeType: ExportScopeType;
  startDate: string | null;
  endDate: string;
  counts: ExportCounts;
  outputPath: string | null;
  createdAt: string;
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

// ============================================
// Bucket Types (for navigation)
// ============================================

export type BucketType = 'inbox' | 'thinking' | 'work' | 'evidence';

export const BUCKET_ENTITY_TYPES: Record<BucketType, EntityType[]> = {
  inbox: ['capture', 'feedback', 'feature_request'],
  thinking: ['problem', 'hypothesis'],
  work: ['experiment', 'decision', 'feature'],
  evidence: ['artifact'],
};
