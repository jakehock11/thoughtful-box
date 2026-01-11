import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '@/lib/ipc';
import type {
  Taxonomy,
  Persona,
  Feature,
  Dimension,
  DimensionValue,
} from '@/lib/types';

const TAXONOMY_KEY = ['taxonomy'];

// Get full taxonomy for a product
export function useTaxonomy(productId: string | undefined) {
  return useQuery({
    queryKey: [...TAXONOMY_KEY, productId],
    queryFn: () => (productId ? api.taxonomy.getAll(productId) : null),
    enabled: !!productId,
  });
}

// Get only active (non-archived) taxonomy items
export function useActiveTaxonomy(productId: string | undefined) {
  const { data: taxonomy, ...rest } = useTaxonomy(productId);

  const activeTaxonomy = useMemo(() => {
    if (!taxonomy) return null;

    return {
      personas: taxonomy.personas.filter((p) => !p.isArchived),
      features: taxonomy.features.filter((f) => !f.isArchived),
      dimensions: taxonomy.dimensions
        .filter((d) => !d.isArchived)
        .map((d) => ({
          ...d,
          values: d.values.filter((v) => !v.isArchived),
        })),
    };
  }, [taxonomy]);

  return { data: activeTaxonomy, fullTaxonomy: taxonomy, ...rest };
}

// ============================================
// Persona Mutations
// ============================================

export function useCreatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, name }: { productId: string; name: string }) =>
      api.taxonomy.createPersona(productId, name),
    onSuccess: (persona) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, persona.productId] });
    },
  });
}

export function useUpdatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, productId }: { id: string; data: { name?: string }; productId: string }) =>
      api.taxonomy.updatePersona(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, variables.productId] });
    },
  });
}

export function useArchivePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      api.taxonomy.archivePersona(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, variables.productId] });
    },
  });
}

export function useUnarchivePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      api.taxonomy.unarchivePersona(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, variables.productId] });
    },
  });
}

// ============================================
// Feature Mutations
// ============================================

export function useCreateFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, name }: { productId: string; name: string }) =>
      api.taxonomy.createFeature(productId, name),
    onSuccess: (feature) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, feature.productId] });
    },
  });
}

export function useUpdateFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, productId }: { id: string; data: { name?: string }; productId: string }) =>
      api.taxonomy.updateFeature(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, variables.productId] });
    },
  });
}

export function useArchiveFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      api.taxonomy.archiveFeature(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, variables.productId] });
    },
  });
}

export function useUnarchiveFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      api.taxonomy.unarchiveFeature(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, variables.productId] });
    },
  });
}

// ============================================
// Dimension Mutations
// ============================================

export function useCreateDimension() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, name }: { productId: string; name: string }) =>
      api.taxonomy.createDimension(productId, name),
    onSuccess: (dimension) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, dimension.productId] });
    },
  });
}

export function useUpdateDimension() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, productId }: { id: string; data: { name?: string }; productId: string }) =>
      api.taxonomy.updateDimension(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, variables.productId] });
    },
  });
}

export function useArchiveDimension() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      api.taxonomy.archiveDimension(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, variables.productId] });
    },
  });
}

export function useUnarchiveDimension() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      api.taxonomy.unarchiveDimension(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, variables.productId] });
    },
  });
}

// ============================================
// Dimension Value Mutations
// ============================================

export function useCreateDimensionValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dimensionId,
      name,
      productId,
    }: {
      dimensionId: string;
      name: string;
      productId: string;
    }) => api.taxonomy.createDimensionValue(dimensionId, name),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, variables.productId] });
    },
  });
}

export function useUpdateDimensionValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      productId,
    }: {
      id: string;
      data: { name?: string };
      productId: string;
    }) => api.taxonomy.updateDimensionValue(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, variables.productId] });
    },
  });
}

export function useArchiveDimensionValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      api.taxonomy.archiveDimensionValue(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, variables.productId] });
    },
  });
}

export function useUnarchiveDimensionValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      api.taxonomy.unarchiveDimensionValue(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TAXONOMY_KEY, variables.productId] });
    },
  });
}

// Re-export types for convenience
export type { Taxonomy, Persona, Feature, Dimension, DimensionValue };
