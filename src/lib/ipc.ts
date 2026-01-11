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
  IPCResult,
  WorkspaceSelectResult,
  WorkspacePathResult,
  WorkspaceConfiguredResult,
} from './types';

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
      const result = await window.api.workspace.select() as WorkspaceSelectResult;
      if (!result.success) {
        throw new IPCError(result.error || 'Failed to select workspace');
      }
      return result.path;
    },

    initialize: async (folderPath: string): Promise<void> => {
      const result = await window.api.workspace.initialize(folderPath) as IPCResult;
      unwrapVoid(result);
    },

    getPath: async (): Promise<string | null> => {
      const result = await window.api.workspace.getPath() as WorkspacePathResult;
      if (!result.success) {
        throw new IPCError(result.error || 'Failed to get workspace path');
      }
      return result.path;
    },

    isConfigured: async (): Promise<boolean> => {
      const result = await window.api.workspace.isConfigured() as WorkspaceConfiguredResult;
      if (!result.success) {
        throw new IPCError(result.error || 'Failed to check workspace configuration');
      }
      return result.configured;
    },

    openFolder: async (): Promise<void> => {
      const result = await window.api.workspace.openFolder() as IPCResult;
      unwrapVoid(result);
    },
  },

  // Product operations
  products: {
    getAll: async (): Promise<Product[]> => {
      const result = await window.api.products.getAll() as IPCResult<Product[]>;
      return unwrap(result);
    },

    getById: async (id: string): Promise<Product | null> => {
      const result = await window.api.products.getById(id) as IPCResult<Product | null>;
      return unwrap(result);
    },

    create: async (data: CreateProductData): Promise<Product> => {
      const result = await window.api.products.create(data) as IPCResult<Product>;
      return unwrap(result);
    },

    update: async (id: string, data: UpdateProductData): Promise<Product> => {
      const result = await window.api.products.update(id, data) as IPCResult<Product>;
      return unwrap(result);
    },

    delete: async (id: string): Promise<void> => {
      const result = await window.api.products.delete(id) as IPCResult;
      unwrapVoid(result);
    },
  },

  // Taxonomy operations
  taxonomy: {
    getAll: async (productId: string): Promise<Taxonomy> => {
      const result = await window.api.taxonomy.getAll(productId) as IPCResult<Taxonomy>;
      return unwrap(result);
    },

    // Personas
    createPersona: async (productId: string, name: string): Promise<Persona> => {
      const result = await window.api.taxonomy.createPersona(productId, name) as IPCResult<Persona>;
      return unwrap(result);
    },

    updatePersona: async (id: string, data: { name?: string }): Promise<Persona> => {
      const result = await window.api.taxonomy.updatePersona(id, data) as IPCResult<Persona>;
      return unwrap(result);
    },

    archivePersona: async (id: string): Promise<void> => {
      const result = await window.api.taxonomy.archivePersona(id) as IPCResult;
      unwrapVoid(result);
    },

    // Features
    createFeature: async (productId: string, name: string): Promise<Feature> => {
      const result = await window.api.taxonomy.createFeature(productId, name) as IPCResult<Feature>;
      return unwrap(result);
    },

    updateFeature: async (id: string, data: { name?: string }): Promise<Feature> => {
      const result = await window.api.taxonomy.updateFeature(id, data) as IPCResult<Feature>;
      return unwrap(result);
    },

    archiveFeature: async (id: string): Promise<void> => {
      const result = await window.api.taxonomy.archiveFeature(id) as IPCResult;
      unwrapVoid(result);
    },

    // Dimensions
    createDimension: async (productId: string, name: string): Promise<Dimension> => {
      const result = await window.api.taxonomy.createDimension(productId, name) as IPCResult<Dimension>;
      return unwrap(result);
    },

    updateDimension: async (id: string, data: { name?: string }): Promise<Dimension> => {
      const result = await window.api.taxonomy.updateDimension(id, data) as IPCResult<Dimension>;
      return unwrap(result);
    },

    archiveDimension: async (id: string): Promise<void> => {
      const result = await window.api.taxonomy.archiveDimension(id) as IPCResult;
      unwrapVoid(result);
    },

    // Dimension Values
    createDimensionValue: async (dimensionId: string, name: string): Promise<DimensionValue> => {
      const result = await window.api.taxonomy.createDimensionValue(dimensionId, name) as IPCResult<DimensionValue>;
      return unwrap(result);
    },

    updateDimensionValue: async (id: string, data: { name?: string }): Promise<DimensionValue> => {
      const result = await window.api.taxonomy.updateDimensionValue(id, data) as IPCResult<DimensionValue>;
      return unwrap(result);
    },

    archiveDimensionValue: async (id: string): Promise<void> => {
      const result = await window.api.taxonomy.archiveDimensionValue(id) as IPCResult;
      unwrapVoid(result);
    },
  },

  // Entity operations
  entities: {
    getAll: async (productId: string, filters?: EntityFilters): Promise<Entity[]> => {
      const result = await window.api.entities.getAll(productId, filters) as IPCResult<Entity[]>;
      return unwrap(result);
    },

    getById: async (id: string): Promise<Entity | null> => {
      const result = await window.api.entities.getById(id) as IPCResult<Entity | null>;
      return unwrap(result);
    },

    create: async (data: CreateEntityData): Promise<Entity> => {
      const result = await window.api.entities.create(data) as IPCResult<Entity>;
      return unwrap(result);
    },

    update: async (id: string, data: UpdateEntityData): Promise<Entity> => {
      const result = await window.api.entities.update(id, data) as IPCResult<Entity>;
      return unwrap(result);
    },

    delete: async (id: string): Promise<void> => {
      const result = await window.api.entities.delete(id) as IPCResult;
      unwrapVoid(result);
    },

    promote: async (captureId: string, targetType: EntityType): Promise<Entity> => {
      const result = await window.api.entities.promote(captureId, targetType) as IPCResult<Entity>;
      return unwrap(result);
    },
  },

  // Relationship operations
  relationships: {
    getForEntity: async (entityId: string): Promise<RelationshipWithEntity[]> => {
      const result = await window.api.relationships.getForEntity(entityId) as IPCResult<RelationshipWithEntity[]>;
      return unwrap(result);
    },

    getOutgoing: async (entityId: string): Promise<RelationshipWithEntity[]> => {
      const result = await window.api.relationships.getOutgoing(entityId) as IPCResult<RelationshipWithEntity[]>;
      return unwrap(result);
    },

    getIncoming: async (entityId: string): Promise<RelationshipWithEntity[]> => {
      const result = await window.api.relationships.getIncoming(entityId) as IPCResult<RelationshipWithEntity[]>;
      return unwrap(result);
    },

    create: async (data: CreateRelationshipData): Promise<Relationship> => {
      const result = await window.api.relationships.create(data) as IPCResult<Relationship>;
      return unwrap(result);
    },

    delete: async (id: string, sourceEntityId?: string): Promise<void> => {
      const result = await window.api.relationships.delete(id, sourceEntityId) as IPCResult;
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
      };
      taxonomy: {
        getAll: (productId: string) => Promise<IPCResult<Taxonomy>>;
        createPersona: (productId: string, name: string) => Promise<IPCResult<Persona>>;
        updatePersona: (id: string, data: { name?: string }) => Promise<IPCResult<Persona>>;
        archivePersona: (id: string) => Promise<IPCResult>;
        createFeature: (productId: string, name: string) => Promise<IPCResult<Feature>>;
        updateFeature: (id: string, data: { name?: string }) => Promise<IPCResult<Feature>>;
        archiveFeature: (id: string) => Promise<IPCResult>;
        createDimension: (productId: string, name: string) => Promise<IPCResult<Dimension>>;
        updateDimension: (id: string, data: { name?: string }) => Promise<IPCResult<Dimension>>;
        archiveDimension: (id: string) => Promise<IPCResult>;
        createDimensionValue: (dimensionId: string, name: string) => Promise<IPCResult<DimensionValue>>;
        updateDimensionValue: (id: string, data: { name?: string }) => Promise<IPCResult<DimensionValue>>;
        archiveDimensionValue: (id: string) => Promise<IPCResult>;
      };
      entities: {
        getAll: (productId: string, filters?: EntityFilters) => Promise<IPCResult<Entity[]>>;
        getById: (id: string) => Promise<IPCResult<Entity | null>>;
        create: (data: CreateEntityData) => Promise<IPCResult<Entity>>;
        update: (id: string, data: UpdateEntityData) => Promise<IPCResult<Entity>>;
        delete: (id: string) => Promise<IPCResult>;
        promote: (captureId: string, targetType: EntityType) => Promise<IPCResult<Entity>>;
      };
      relationships: {
        getForEntity: (entityId: string) => Promise<IPCResult<RelationshipWithEntity[]>>;
        getOutgoing: (entityId: string) => Promise<IPCResult<RelationshipWithEntity[]>>;
        getIncoming: (entityId: string) => Promise<IPCResult<RelationshipWithEntity[]>>;
        create: (data: CreateRelationshipData) => Promise<IPCResult<Relationship>>;
        delete: (id: string, sourceEntityId?: string) => Promise<IPCResult>;
      };
    };
  }
}
