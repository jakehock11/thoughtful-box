import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '@/lib/ipc';
import type {
  Relationship,
  RelationshipWithEntity,
  CreateRelationshipData,
} from '@/lib/types';

const RELATIONSHIPS_KEY = ['relationships'];
const ENTITIES_KEY = ['entities'];

// Get all relationships for an entity (both directions)
export function useRelationships(entityId: string | undefined) {
  return useQuery({
    queryKey: [...RELATIONSHIPS_KEY, entityId],
    queryFn: () => (entityId ? api.relationships.getForEntity(entityId) : []),
    enabled: !!entityId,
  });
}

// Get outgoing relationships only
export function useOutgoingRelationships(entityId: string | undefined) {
  return useQuery({
    queryKey: [...RELATIONSHIPS_KEY, entityId, 'outgoing'],
    queryFn: () => (entityId ? api.relationships.getOutgoing(entityId) : []),
    enabled: !!entityId,
  });
}

// Get incoming relationships only
export function useIncomingRelationships(entityId: string | undefined) {
  return useQuery({
    queryKey: [...RELATIONSHIPS_KEY, entityId, 'incoming'],
    queryFn: () => (entityId ? api.relationships.getIncoming(entityId) : []),
    enabled: !!entityId,
  });
}

// Get relationships grouped by direction
export function useRelationshipsGrouped(entityId: string | undefined) {
  const { data: relationships, ...rest } = useRelationships(entityId);

  const grouped = useMemo(() => {
    if (!relationships) return null;

    return {
      outgoing: relationships.filter((r) => r.direction === 'outgoing'),
      incoming: relationships.filter((r) => r.direction === 'incoming'),
    };
  }, [relationships]);

  return { data: grouped, relationships, ...rest };
}

// Create relationship mutation
export function useCreateRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRelationshipData) => api.relationships.create(data),
    onSuccess: (relationship) => {
      // Invalidate relationships for both source and target entities
      queryClient.invalidateQueries({
        queryKey: [...RELATIONSHIPS_KEY, relationship.sourceId],
      });
      queryClient.invalidateQueries({
        queryKey: [...RELATIONSHIPS_KEY, relationship.targetId],
      });
      // Also invalidate entity queries since markdown files are regenerated
      queryClient.invalidateQueries({ queryKey: ENTITIES_KEY });
    },
  });
}

// Delete relationship mutation
export function useDeleteRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      sourceEntityId,
      targetEntityId,
    }: {
      id: string;
      sourceEntityId: string;
      targetEntityId?: string;
    }) => api.relationships.delete(id, sourceEntityId),
    onSuccess: (_, variables) => {
      // Invalidate relationships for both entities
      queryClient.invalidateQueries({
        queryKey: [...RELATIONSHIPS_KEY, variables.sourceEntityId],
      });
      if (variables.targetEntityId) {
        queryClient.invalidateQueries({
          queryKey: [...RELATIONSHIPS_KEY, variables.targetEntityId],
        });
      }
      // Also invalidate entity queries since markdown files are regenerated
      queryClient.invalidateQueries({ queryKey: ENTITIES_KEY });
    },
  });
}

// Helper hook to get relationship counts for an entity
export function useRelationshipCounts(entityId: string | undefined) {
  const { data: relationships } = useRelationships(entityId);

  return useMemo(() => {
    if (!relationships) {
      return { total: 0, outgoing: 0, incoming: 0 };
    }

    return {
      total: relationships.length,
      outgoing: relationships.filter((r) => r.direction === 'outgoing').length,
      incoming: relationships.filter((r) => r.direction === 'incoming').length,
    };
  }, [relationships]);
}

// Re-export types for convenience
export type { Relationship, RelationshipWithEntity, CreateRelationshipData };
