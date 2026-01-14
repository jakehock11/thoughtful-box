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
  IPCResult,
  WorkspaceSelectResult,
  WorkspacePathResult,
  WorkspaceConfiguredResult,
} from './types';

import { mockStore } from '@/mocks/mockStore';

// ============================================
// Environment Detection
// ============================================

// Detect if running in Electron (window.api exists) or browser (mock mode)
const isElectron = typeof window !== 'undefined' && typeof window.api !== 'undefined';

export const isMockMode = !isElectron;

// ============================================
// Error Handling
// ============================================

export class IPCError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IPCError';
  }
}

function unwrap<T>(result: IPCResult<T>): T {
  if (!result.success) {
    throw new IPCError(result.error || 'Unknown error');
  }
  return result.data as T;
}

function unwrapVoid(result: IPCResult): void {
  if (!result.success) {
    throw new IPCError(result.error || 'Unknown error');
  }
}

// ============================================
// API Wrapper
// ============================================

export const api = {
  // Workspace operations
  workspace: {
    select: async (): Promise<string | null> => {
      if (!isElectron) {
        console.log('[Mock] Workspace select - not available in preview');
        return null;
      }
      const result = await window.api.workspace.select() as WorkspaceSelectResult;
      if (!result.success) {
        throw new IPCError(result.error || 'Failed to select workspace');
      }
      return result.path;
    },

    initialize: async (folderPath: string): Promise<void> => {
      if (!isElectron) {
        console.log('[Mock] Workspace initialize - not available in preview');
        return;
      }
      const result = await window.api.workspace.initialize(folderPath) as IPCResult;
      unwrapVoid(result);
    },

    getPath: async (): Promise<string | null> => {
      if (!isElectron) {
        return '/mock/workspace';
      }
      const result = await window.api.workspace.getPath() as WorkspacePathResult;
      if (!result.success) {
        throw new IPCError(result.error || 'Failed to get workspace path');
      }
      return result.path;
    },

    isConfigured: async (): Promise<boolean> => {
      if (!isElectron) {
        return true; // Always configured in mock mode
      }
      const result = await window.api.workspace.isConfigured() as WorkspaceConfiguredResult;
      if (!result.success) {
        throw new IPCError(result.error || 'Failed to check workspace configuration');
      }
      return result.configured;
    },

    openFolder: async (): Promise<void> => {
      if (!isElectron) {
        console.log('[Mock] Open folder - not available in preview');
        return;
      }
      const result = await window.api.workspace.openFolder() as IPCResult;
      unwrapVoid(result);
    },
  },

  // Product operations
  products: {
    getAll: async (): Promise<Product[]> => {
      if (!isElectron) {
        return mockStore.getProducts();
      }
      const result = await window.api.products.getAll() as IPCResult<Product[]>;
      return unwrap(result);
    },

    getById: async (id: string): Promise<Product | null> => {
      if (!isElectron) {
        return mockStore.getProduct(id);
      }
      const result = await window.api.products.getById(id) as IPCResult<Product | null>;
      return unwrap(result);
    },

    create: async (data: CreateProductData): Promise<Product> => {
      if (!isElectron) {
        return mockStore.createProduct(data);
      }
      const result = await window.api.products.create(data) as IPCResult<Product>;
      return unwrap(result);
    },

    update: async (id: string, data: UpdateProductData): Promise<Product> => {
      if (!isElectron) {
        return mockStore.updateProduct(id, data);
      }
      const result = await window.api.products.update(id, data) as IPCResult<Product>;
      return unwrap(result);
    },

    delete: async (id: string): Promise<void> => {
      if (!isElectron) {
        mockStore.deleteProduct(id);
        return;
      }
      const result = await window.api.products.delete(id) as IPCResult;
      unwrapVoid(result);
    },

    openFolder: async (productId: string): Promise<void> => {
      if (!isElectron) {
        console.log('[Mock] Open product folder - not available in preview');
        return;
      }
      const result = await window.api.products.openFolder(productId) as IPCResult;
      unwrapVoid(result);
    },

    getFolderPath: async (productId: string): Promise<string | null> => {
      if (!isElectron) {
        return `/mock/workspace/products/${productId}`;
      }
      const result = await window.api.products.getFolderPath(productId) as IPCResult<string | null>;
      return unwrap(result);
    },
  },

  // Taxonomy operations
  taxonomy: {
    getAll: async (productId: string): Promise<Taxonomy> => {
      if (!isElectron) {
        return mockStore.getTaxonomy(productId);
      }
      const result = await window.api.taxonomy.getAll(productId) as IPCResult<Taxonomy>;
      return unwrap(result);
    },

    // Personas
    createPersona: async (productId: string, name: string): Promise<Persona> => {
      if (!isElectron) {
        return mockStore.createPersona(productId, name);
      }
      const result = await window.api.taxonomy.createPersona(productId, name) as IPCResult<Persona>;
      return unwrap(result);
    },

    updatePersona: async (id: string, data: { name?: string }): Promise<Persona> => {
      if (!isElectron) {
        return mockStore.updatePersona(id, data);
      }
      const result = await window.api.taxonomy.updatePersona(id, data) as IPCResult<Persona>;
      return unwrap(result);
    },

    archivePersona: async (id: string): Promise<void> => {
      if (!isElectron) {
        mockStore.archivePersona(id);
        return;
      }
      const result = await window.api.taxonomy.archivePersona(id) as IPCResult;
      unwrapVoid(result);
    },

    unarchivePersona: async (id: string): Promise<Persona> => {
      if (!isElectron) {
        return mockStore.unarchivePersona(id);
      }
      const result = await window.api.taxonomy.unarchivePersona(id) as IPCResult<Persona>;
      return unwrap(result);
    },

    // Features
    createFeature: async (productId: string, name: string): Promise<Feature> => {
      if (!isElectron) {
        return mockStore.createFeature(productId, name);
      }
      const result = await window.api.taxonomy.createFeature(productId, name) as IPCResult<Feature>;
      return unwrap(result);
    },

    updateFeature: async (id: string, data: { name?: string }): Promise<Feature> => {
      if (!isElectron) {
        return mockStore.updateFeature(id, data);
      }
      const result = await window.api.taxonomy.updateFeature(id, data) as IPCResult<Feature>;
      return unwrap(result);
    },

    archiveFeature: async (id: string): Promise<void> => {
      if (!isElectron) {
        mockStore.archiveFeature(id);
        return;
      }
      const result = await window.api.taxonomy.archiveFeature(id) as IPCResult;
      unwrapVoid(result);
    },

    unarchiveFeature: async (id: string): Promise<Feature> => {
      if (!isElectron) {
        return mockStore.unarchiveFeature(id);
      }
      const result = await window.api.taxonomy.unarchiveFeature(id) as IPCResult<Feature>;
      return unwrap(result);
    },

    // Dimensions
    createDimension: async (productId: string, name: string): Promise<Dimension> => {
      if (!isElectron) {
        return mockStore.createDimension(productId, name);
      }
      const result = await window.api.taxonomy.createDimension(productId, name) as IPCResult<Dimension>;
      return unwrap(result);
    },

    updateDimension: async (id: string, data: { name?: string }): Promise<Dimension> => {
      if (!isElectron) {
        return mockStore.updateDimension(id, data);
      }
      const result = await window.api.taxonomy.updateDimension(id, data) as IPCResult<Dimension>;
      return unwrap(result);
    },

    archiveDimension: async (id: string): Promise<void> => {
      if (!isElectron) {
        mockStore.archiveDimension(id);
        return;
      }
      const result = await window.api.taxonomy.archiveDimension(id) as IPCResult;
      unwrapVoid(result);
    },

    unarchiveDimension: async (id: string): Promise<Dimension> => {
      if (!isElectron) {
        return mockStore.unarchiveDimension(id);
      }
      const result = await window.api.taxonomy.unarchiveDimension(id) as IPCResult<Dimension>;
      return unwrap(result);
    },

    // Dimension Values
    createDimensionValue: async (dimensionId: string, name: string): Promise<DimensionValue> => {
      if (!isElectron) {
        return mockStore.createDimensionValue(dimensionId, name);
      }
      const result = await window.api.taxonomy.createDimensionValue(dimensionId, name) as IPCResult<DimensionValue>;
      return unwrap(result);
    },

    updateDimensionValue: async (id: string, data: { name?: string }): Promise<DimensionValue> => {
      if (!isElectron) {
        return mockStore.updateDimensionValue(id, data);
      }
      const result = await window.api.taxonomy.updateDimensionValue(id, data) as IPCResult<DimensionValue>;
      return unwrap(result);
    },

    archiveDimensionValue: async (id: string): Promise<void> => {
      if (!isElectron) {
        mockStore.archiveDimensionValue(id);
        return;
      }
      const result = await window.api.taxonomy.archiveDimensionValue(id) as IPCResult;
      unwrapVoid(result);
    },

    unarchiveDimensionValue: async (id: string): Promise<DimensionValue> => {
      if (!isElectron) {
        return mockStore.unarchiveDimensionValue(id);
      }
      const result = await window.api.taxonomy.unarchiveDimensionValue(id) as IPCResult<DimensionValue>;
      return unwrap(result);
    },
  },

  // Entity operations
  entities: {
    getAll: async (productId: string, filters?: EntityFilters): Promise<Entity[]> => {
      if (!isElectron) {
        return mockStore.getEntities(productId, filters);
      }
      const result = await window.api.entities.getAll(productId, filters) as IPCResult<Entity[]>;
      return unwrap(result);
    },

    getById: async (id: string): Promise<Entity | null> => {
      if (!isElectron) {
        return mockStore.getEntity(id);
      }
      const result = await window.api.entities.getById(id) as IPCResult<Entity | null>;
      return unwrap(result);
    },

    create: async (data: CreateEntityData): Promise<Entity> => {
      if (!isElectron) {
        return mockStore.createEntity(data);
      }
      const result = await window.api.entities.create(data) as IPCResult<Entity>;
      return unwrap(result);
    },

    update: async (id: string, data: UpdateEntityData): Promise<Entity> => {
      if (!isElectron) {
        return mockStore.updateEntity(id, data);
      }
      const result = await window.api.entities.update(id, data) as IPCResult<Entity>;
      return unwrap(result);
    },

    delete: async (id: string): Promise<void> => {
      if (!isElectron) {
        mockStore.deleteEntity(id);
        return;
      }
      const result = await window.api.entities.delete(id) as IPCResult;
      unwrapVoid(result);
    },

    promote: async (captureId: string, targetType: EntityType): Promise<Entity> => {
      if (!isElectron) {
        return mockStore.promoteEntity(captureId, targetType);
      }
      const result = await window.api.entities.promote(captureId, targetType) as IPCResult<Entity>;
      return unwrap(result);
    },

    openFolder: async (entityId: string): Promise<void> => {
      if (!isElectron) {
        console.log('[Mock] Open entity folder - not available in preview');
        return;
      }
      const result = await window.api.entities.openFolder(entityId) as IPCResult;
      unwrapVoid(result);
    },

    getFilePath: async (entityId: string): Promise<{ absolutePath: string; relativePath: string } | null> => {
      if (!isElectron) {
        return { absolutePath: `/mock/entities/${entityId}.md`, relativePath: `entities/${entityId}.md` };
      }
      const result = await window.api.entities.getFilePath(entityId) as IPCResult<{ absolutePath: string; relativePath: string } | null>;
      return unwrap(result);
    },
  },

  // Relationship operations
  relationships: {
    getForEntity: async (entityId: string): Promise<RelationshipWithEntity[]> => {
      if (!isElectron) {
        return mockStore.getRelationshipsForEntity(entityId);
      }
      const result = await window.api.relationships.getForEntity(entityId) as IPCResult<RelationshipWithEntity[]>;
      return unwrap(result);
    },

    getOutgoing: async (entityId: string): Promise<RelationshipWithEntity[]> => {
      if (!isElectron) {
        return mockStore.getOutgoingRelationships(entityId);
      }
      const result = await window.api.relationships.getOutgoing(entityId) as IPCResult<RelationshipWithEntity[]>;
      return unwrap(result);
    },

    getIncoming: async (entityId: string): Promise<RelationshipWithEntity[]> => {
      if (!isElectron) {
        return mockStore.getIncomingRelationships(entityId);
      }
      const result = await window.api.relationships.getIncoming(entityId) as IPCResult<RelationshipWithEntity[]>;
      return unwrap(result);
    },

    create: async (data: CreateRelationshipData): Promise<Relationship> => {
      if (!isElectron) {
        return mockStore.createRelationship(data);
      }
      const result = await window.api.relationships.create(data) as IPCResult<Relationship>;
      return unwrap(result);
    },

    delete: async (id: string, sourceEntityId?: string): Promise<void> => {
      if (!isElectron) {
        mockStore.deleteRelationship(id);
        return;
      }
      const result = await window.api.relationships.delete(id, sourceEntityId) as IPCResult;
      unwrapVoid(result);
    },
  },

  // Export operations
  exports: {
    getPreview: async (options: ExportOptions): Promise<ExportPreview> => {
      if (!isElectron) {
        return mockStore.getExportPreview(options);
      }
      const result = await window.api.exports.getPreview(options) as IPCResult<ExportPreview>;
      return unwrap(result);
    },

    execute: async (options: ExportOptions): Promise<ExportResult> => {
      if (!isElectron) {
        return mockStore.executeExport(options);
      }
      const result = await window.api.exports.execute(options) as IPCResult<ExportResult>;
      return unwrap(result);
    },

    getHistory: async (productId?: string): Promise<ExportRecord[]> => {
      if (!isElectron) {
        return mockStore.getExportHistory();
      }
      const result = await window.api.exports.getHistory(productId) as IPCResult<ExportRecord[]>;
      return unwrap(result);
    },

    clearHistory: async (productId?: string): Promise<void> => {
      if (!isElectron) {
        mockStore.clearExportHistory();
        return;
      }
      const result = await window.api.exports.clearHistory(productId) as IPCResult;
      unwrapVoid(result);
    },

    openFolder: async (folderPath: string): Promise<void> => {
      if (!isElectron) {
        console.log('[Mock] Open export folder - not available in preview');
        return;
      }
      const result = await window.api.exports.openFolder(folderPath) as IPCResult;
      unwrapVoid(result);
    },

    copySnapshot: async (productId: string): Promise<string> => {
      if (!isElectron) {
        return mockStore.copySnapshot(productId);
      }
      const result = await window.api.exports.copySnapshot(productId) as IPCResult<string>;
      return unwrap(result);
    },
  },

  // Settings operations
  settings: {
    get: async (): Promise<Settings> => {
      if (!isElectron) {
        return mockStore.getSettings();
      }
      const result = await window.api.settings.get() as IPCResult<Settings>;
      return unwrap(result);
    },

    update: async (data: UpdateSettingsData): Promise<Settings> => {
      if (!isElectron) {
        return mockStore.updateSettings(data);
      }
      const result = await window.api.settings.update(data) as IPCResult<Settings>;
      return unwrap(result);
    },

    changeWorkspace: async (): Promise<Settings | null> => {
      if (!isElectron) {
        console.log('[Mock] Change workspace - not available in preview');
        return null;
      }
      const result = await window.api.settings.changeWorkspace() as IPCResult<Settings | null>;
      return unwrap(result);
    },

    migrateWorkspace: async (): Promise<{ settings: Settings; backupPath: string; newPath: string } | null> => {
      if (!isElectron) {
        console.log('[Mock] Migrate workspace - not available in preview');
        return null;
      }
      const result = await window.api.settings.migrateWorkspace() as IPCResult<{ settings: Settings; backupPath: string; newPath: string } | null>;
      return unwrap(result);
    },

    openWorkspaceFolder: async (): Promise<void> => {
      if (!isElectron) {
        console.log('[Mock] Open workspace folder - not available in preview');
        return;
      }
      const result = await window.api.settings.openWorkspaceFolder() as IPCResult;
      unwrapVoid(result);
    },

    clearExportHistory: async (): Promise<void> => {
      if (!isElectron) {
        mockStore.clearExportHistory();
        return;
      }
      const result = await window.api.settings.clearExportHistory() as IPCResult;
      unwrapVoid(result);
    },

    clearAllData: async (): Promise<void> => {
      if (!isElectron) {
        console.log('[Mock] Clear all data - not available in preview');
        return;
      }
      const result = await window.api.settings.clearAllData() as IPCResult;
      unwrapVoid(result);
    },
  },
};

// ============================================
// Type Declaration for window.api
// ============================================

declare global {
  interface Window {
    api: {
      ping: () => Promise<string>;
      db: {
        test: () => Promise<{ success: boolean; tables?: string[]; error?: string }>;
      };
      workspace: {
        select: () => Promise<WorkspaceSelectResult>;
        initialize: (folderPath: string) => Promise<IPCResult>;
        getPath: () => Promise<WorkspacePathResult>;
        isConfigured: () => Promise<WorkspaceConfiguredResult>;
        openFolder: () => Promise<IPCResult>;
      };
      products: {
        getAll: () => Promise<IPCResult<Product[]>>;
        getById: (id: string) => Promise<IPCResult<Product | null>>;
        create: (data: CreateProductData) => Promise<IPCResult<Product>>;
        update: (id: string, data: UpdateProductData) => Promise<IPCResult<Product>>;
        delete: (id: string) => Promise<IPCResult>;
        openFolder: (productId: string) => Promise<IPCResult>;
        getFolderPath: (productId: string) => Promise<IPCResult<string | null>>;
      };
      taxonomy: {
        getAll: (productId: string) => Promise<IPCResult<Taxonomy>>;
        createPersona: (productId: string, name: string) => Promise<IPCResult<Persona>>;
        updatePersona: (id: string, data: { name?: string }) => Promise<IPCResult<Persona>>;
        archivePersona: (id: string) => Promise<IPCResult>;
        unarchivePersona: (id: string) => Promise<IPCResult<Persona>>;
        createFeature: (productId: string, name: string) => Promise<IPCResult<Feature>>;
        updateFeature: (id: string, data: { name?: string }) => Promise<IPCResult<Feature>>;
        archiveFeature: (id: string) => Promise<IPCResult>;
        unarchiveFeature: (id: string) => Promise<IPCResult<Feature>>;
        createDimension: (productId: string, name: string) => Promise<IPCResult<Dimension>>;
        updateDimension: (id: string, data: { name?: string }) => Promise<IPCResult<Dimension>>;
        archiveDimension: (id: string) => Promise<IPCResult>;
        unarchiveDimension: (id: string) => Promise<IPCResult<Dimension>>;
        createDimensionValue: (dimensionId: string, name: string) => Promise<IPCResult<DimensionValue>>;
        updateDimensionValue: (id: string, data: { name?: string }) => Promise<IPCResult<DimensionValue>>;
        archiveDimensionValue: (id: string) => Promise<IPCResult>;
        unarchiveDimensionValue: (id: string) => Promise<IPCResult<DimensionValue>>;
      };
      entities: {
        getAll: (productId: string, filters?: EntityFilters) => Promise<IPCResult<Entity[]>>;
        getById: (id: string) => Promise<IPCResult<Entity | null>>;
        create: (data: CreateEntityData) => Promise<IPCResult<Entity>>;
        update: (id: string, data: UpdateEntityData) => Promise<IPCResult<Entity>>;
        delete: (id: string) => Promise<IPCResult>;
        promote: (captureId: string, targetType: EntityType) => Promise<IPCResult<Entity>>;
        openFolder: (entityId: string) => Promise<IPCResult>;
        getFilePath: (entityId: string) => Promise<IPCResult<{ absolutePath: string; relativePath: string } | null>>;
      };
      relationships: {
        getForEntity: (entityId: string) => Promise<IPCResult<RelationshipWithEntity[]>>;
        getOutgoing: (entityId: string) => Promise<IPCResult<RelationshipWithEntity[]>>;
        getIncoming: (entityId: string) => Promise<IPCResult<RelationshipWithEntity[]>>;
        create: (data: CreateRelationshipData) => Promise<IPCResult<Relationship>>;
        delete: (id: string, sourceEntityId?: string) => Promise<IPCResult>;
      };
      exports: {
        getPreview: (options: ExportOptions) => Promise<IPCResult<ExportPreview>>;
        execute: (options: ExportOptions) => Promise<IPCResult<ExportResult>>;
        getHistory: (productId?: string) => Promise<IPCResult<ExportRecord[]>>;
        clearHistory: (productId?: string) => Promise<IPCResult>;
        openFolder: (folderPath: string) => Promise<IPCResult>;
        copySnapshot: (productId: string) => Promise<IPCResult<string>>;
      };
      settings: {
        get: () => Promise<IPCResult<Settings>>;
        update: (data: UpdateSettingsData) => Promise<IPCResult<Settings>>;
        changeWorkspace: () => Promise<IPCResult<Settings | null>>;
        migrateWorkspace: () => Promise<IPCResult<{ settings: Settings; backupPath: string; newPath: string } | null>>;
        openWorkspaceFolder: () => Promise<IPCResult>;
        clearExportHistory: () => Promise<IPCResult>;
        clearAllData: () => Promise<IPCResult>;
      };
    };
  }
}
