import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/ipc';
import type {
  Entity,
  EntityType,
  CreateEntityData,
  UpdateEntityData,
  EntityFilters,
} from '@/lib/types';

const ENTITIES_KEY = ['entities'];

// Get all entities for a product with optional filters
export function useEntities(productId: string | undefined, filters?: EntityFilters) {
  return useQuery({
    queryKey: [...ENTITIES_KEY, productId, filters],
    queryFn: () => (productId ? api.entities.getAll(productId, filters) : []),
    enabled: !!productId,
  });
}

// Get entities by type
export function useEntitiesByType(productId: string | undefined, type: EntityType) {
  return useEntities(productId, { type });
}

// Get a single entity by ID
export function useEntity(id: string | undefined) {
  return useQuery({
    queryKey: [...ENTITIES_KEY, 'single', id],
    queryFn: () => (id ? api.entities.getById(id) : null),
    enabled: !!id,
  });
}

// Create entity mutation
export function useCreateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEntityData) => api.entities.create(data),
    onSuccess: (entity) => {
      queryClient.invalidateQueries({ queryKey: ENTITIES_KEY });
    },
  });
}

// Update entity mutation
export function useUpdateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEntityData }) =>
      api.entities.update(id, data),
    onSuccess: (entity) => {
      queryClient.invalidateQueries({ queryKey: ENTITIES_KEY });
      queryClient.invalidateQueries({ queryKey: [...ENTITIES_KEY, 'single', entity.id] });
    },
  });
}

// Delete entity mutation
export function useDeleteEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.entities.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTITIES_KEY });
    },
  });
}

// Promote capture to another entity type
export function usePromoteCapture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ captureId, targetType }: { captureId: string; targetType: EntityType }) =>
      api.entities.promote(captureId, targetType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTITIES_KEY });
    },
  });
}

// Hook with built-in filter state management
export function useEntitiesWithFilters(productId: string | undefined) {
  const [filters, setFilters] = useState<EntityFilters>({});

  const query = useEntities(productId, filters);

  const setTypeFilter = useCallback((type: EntityType | undefined) => {
    setFilters((prev) => ({ ...prev, type }));
  }, []);

  const setStatusFilter = useCallback((status: string | undefined) => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  const setSearchFilter = useCallback((search: string | undefined) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    ...query,
    filters,
    setFilters,
    setTypeFilter,
    setStatusFilter,
    setSearchFilter,
    clearFilters,
  };
}

// Filter helper for client-side filtering
export function filterEntitiesByType<T extends Entity>(
  entities: Entity[] | undefined,
  type: EntityType
): T[] {
  if (!entities) return [];
  return entities.filter((e) => e.type === type) as T[];
}

// Group entities by type
export function useEntitiesGroupedByType(productId: string | undefined) {
  const { data: entities, ...rest } = useEntities(productId);

  const grouped = useMemo(() => {
    if (!entities) return null;

    return {
      captures: entities.filter((e) => e.type === 'capture'),
      problems: entities.filter((e) => e.type === 'problem'),
      hypotheses: entities.filter((e) => e.type === 'hypothesis'),
      experiments: entities.filter((e) => e.type === 'experiment'),
      decisions: entities.filter((e) => e.type === 'decision'),
      artifacts: entities.filter((e) => e.type === 'artifact'),
    };
  }, [entities]);

  return { data: grouped, entities, ...rest };
}

// Re-export types for convenience
export type { Entity, EntityType, CreateEntityData, UpdateEntityData, EntityFilters };
