import { contextBridge, ipcRenderer } from 'electron';

// Type definitions for IPC responses
interface IPCResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

interface SelectResult {
  success: boolean;
  path: string | null;
  error?: string;
}

interface PathResult {
  success: boolean;
  path: string | null;
  error?: string;
}

interface ConfiguredResult {
  success: boolean;
  configured: boolean;
  error?: string;
}

interface DbTestResult {
  success: boolean;
  tables?: string[];
  error?: string;
}

// Product types
interface Product {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

interface CreateProductData {
  name: string;
  description?: string;
  icon?: string;
}

interface UpdateProductData {
  name?: string;
  description?: string;
  icon?: string;
}

// Taxonomy types
interface Persona {
  id: string;
  productId: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Feature {
  id: string;
  productId: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DimensionValue {
  id: string;
  dimensionId: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Dimension {
  id: string;
  productId: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  values: DimensionValue[];
}

interface Taxonomy {
  personas: Persona[];
  features: Feature[];
  dimensions: Dimension[];
}

// Entity types
type EntityType = 'capture' | 'problem' | 'hypothesis' | 'experiment' | 'decision' | 'artifact';

interface Entity {
  id: string;
  productId: string;
  type: EntityType;
  title: string;
  body: string;
  status: string | null;
  metadata: Record<string, unknown> | null;
  promotedToId: string | null;
  createdAt: string;
  updatedAt: string;
  personaIds: string[];
  featureIds: string[];
  dimensionValueIds: string[];
}

interface CreateEntityData {
  productId: string;
  type: EntityType;
  title?: string;
  body?: string;
  status?: string;
  personaIds?: string[];
  featureIds?: string[];
  dimensionValueIds?: string[];
  metadata?: Record<string, unknown>;
}

interface UpdateEntityData {
  title?: string;
  body?: string;
  status?: string;
  personaIds?: string[];
  featureIds?: string[];
  dimensionValueIds?: string[];
  metadata?: Record<string, unknown>;
}

interface EntityFilters {
  type?: EntityType;
  status?: string;
  search?: string;
}

// Relationship types
interface Relationship {
  id: string;
  productId: string;
  sourceId: string;
  targetId: string;
  relationshipType: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RelationshipWithEntity extends Relationship {
  linkedEntity: {
    id: string;
    type: EntityType;
    title: string;
    status: string | null;
  };
  direction: 'outgoing' | 'incoming';
}

interface CreateRelationshipData {
  sourceId: string;
  targetId: string;
  relationshipType?: string;
  productId: string;
}

// Expose protected methods to the renderer process
const api = {
  // Test method to verify IPC is working
  ping: () => ipcRenderer.invoke('ping'),

  // Database namespace
  db: {
    test: () => ipcRenderer.invoke('db:test') as Promise<DbTestResult>,
  },

  // Workspace namespace
  workspace: {
    select: () => ipcRenderer.invoke('workspace:select') as Promise<SelectResult>,
    initialize: (folderPath: string) =>
      ipcRenderer.invoke('workspace:initialize', folderPath) as Promise<IPCResult>,
    getPath: () => ipcRenderer.invoke('workspace:getPath') as Promise<PathResult>,
    isConfigured: () => ipcRenderer.invoke('workspace:isConfigured') as Promise<ConfiguredResult>,
    openFolder: () => ipcRenderer.invoke('workspace:openFolder') as Promise<IPCResult>,
  },

  // Products namespace
  products: {
    getAll: () =>
      ipcRenderer.invoke('products:getAll') as Promise<IPCResult<Product[]>>,
    getById: (id: string) =>
      ipcRenderer.invoke('products:getById', id) as Promise<IPCResult<Product | null>>,
    create: (data: CreateProductData) =>
      ipcRenderer.invoke('products:create', data) as Promise<IPCResult<Product>>,
    update: (id: string, data: UpdateProductData) =>
      ipcRenderer.invoke('products:update', id, data) as Promise<IPCResult<Product>>,
    delete: (id: string) =>
      ipcRenderer.invoke('products:delete', id) as Promise<IPCResult>,
  },

  // Taxonomy namespace
  taxonomy: {
    getAll: (productId: string) =>
      ipcRenderer.invoke('taxonomy:getAll', productId) as Promise<IPCResult<Taxonomy>>,

    // Personas
    createPersona: (productId: string, name: string) =>
      ipcRenderer.invoke('taxonomy:createPersona', productId, name) as Promise<IPCResult<Persona>>,
    updatePersona: (id: string, data: { name?: string }) =>
      ipcRenderer.invoke('taxonomy:updatePersona', id, data) as Promise<IPCResult<Persona>>,
    archivePersona: (id: string) =>
      ipcRenderer.invoke('taxonomy:archivePersona', id) as Promise<IPCResult>,
    unarchivePersona: (id: string) =>
      ipcRenderer.invoke('taxonomy:unarchivePersona', id) as Promise<IPCResult<Persona>>,

    // Features
    createFeature: (productId: string, name: string) =>
      ipcRenderer.invoke('taxonomy:createFeature', productId, name) as Promise<IPCResult<Feature>>,
    updateFeature: (id: string, data: { name?: string }) =>
      ipcRenderer.invoke('taxonomy:updateFeature', id, data) as Promise<IPCResult<Feature>>,
    archiveFeature: (id: string) =>
      ipcRenderer.invoke('taxonomy:archiveFeature', id) as Promise<IPCResult>,
    unarchiveFeature: (id: string) =>
      ipcRenderer.invoke('taxonomy:unarchiveFeature', id) as Promise<IPCResult<Feature>>,

    // Dimensions
    createDimension: (productId: string, name: string) =>
      ipcRenderer.invoke('taxonomy:createDimension', productId, name) as Promise<IPCResult<Dimension>>,
    updateDimension: (id: string, data: { name?: string }) =>
      ipcRenderer.invoke('taxonomy:updateDimension', id, data) as Promise<IPCResult<Dimension>>,
    archiveDimension: (id: string) =>
      ipcRenderer.invoke('taxonomy:archiveDimension', id) as Promise<IPCResult>,
    unarchiveDimension: (id: string) =>
      ipcRenderer.invoke('taxonomy:unarchiveDimension', id) as Promise<IPCResult<Dimension>>,

    // Dimension Values
    createDimensionValue: (dimensionId: string, name: string) =>
      ipcRenderer.invoke('taxonomy:createDimensionValue', dimensionId, name) as Promise<IPCResult<DimensionValue>>,
    updateDimensionValue: (id: string, data: { name?: string }) =>
      ipcRenderer.invoke('taxonomy:updateDimensionValue', id, data) as Promise<IPCResult<DimensionValue>>,
    archiveDimensionValue: (id: string) =>
      ipcRenderer.invoke('taxonomy:archiveDimensionValue', id) as Promise<IPCResult>,
    unarchiveDimensionValue: (id: string) =>
      ipcRenderer.invoke('taxonomy:unarchiveDimensionValue', id) as Promise<IPCResult<DimensionValue>>,
  },

  // Entities namespace
  entities: {
    getAll: (productId: string, filters?: EntityFilters) =>
      ipcRenderer.invoke('entities:getAll', productId, filters) as Promise<IPCResult<Entity[]>>,
    getById: (id: string) =>
      ipcRenderer.invoke('entities:getById', id) as Promise<IPCResult<Entity | null>>,
    create: (data: CreateEntityData) =>
      ipcRenderer.invoke('entities:create', data) as Promise<IPCResult<Entity>>,
    update: (id: string, data: UpdateEntityData) =>
      ipcRenderer.invoke('entities:update', id, data) as Promise<IPCResult<Entity>>,
    delete: (id: string) =>
      ipcRenderer.invoke('entities:delete', id) as Promise<IPCResult>,
    promote: (captureId: string, targetType: EntityType) =>
      ipcRenderer.invoke('entities:promote', captureId, targetType) as Promise<IPCResult<Entity>>,
  },

  // Relationships namespace
  relationships: {
    getForEntity: (entityId: string) =>
      ipcRenderer.invoke('relationships:getForEntity', entityId) as Promise<IPCResult<RelationshipWithEntity[]>>,
    getOutgoing: (entityId: string) =>
      ipcRenderer.invoke('relationships:getOutgoing', entityId) as Promise<IPCResult<RelationshipWithEntity[]>>,
    getIncoming: (entityId: string) =>
      ipcRenderer.invoke('relationships:getIncoming', entityId) as Promise<IPCResult<RelationshipWithEntity[]>>,
    create: (data: CreateRelationshipData) =>
      ipcRenderer.invoke('relationships:create', data) as Promise<IPCResult<Relationship>>,
    delete: (id: string, sourceEntityId?: string) =>
      ipcRenderer.invoke('relationships:delete', id, sourceEntityId) as Promise<IPCResult>,
  },

  // Placeholders for future namespaces (will be implemented in later phases)
  // exports: { ... },
  // settings: { ... },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', api);

// Type declaration for the exposed API
export type ElectronAPI = typeof api;
