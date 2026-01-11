import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/ipc';
import type { ExportOptions, ExportPreview, ExportResult, ExportRecord } from '@/lib/types';

// Query key factory
const EXPORTS_KEY = ['exports'] as const;
const EXPORT_PREVIEW_KEY = ['exports', 'preview'] as const;

// ============================================
// Export History Query
// ============================================

export function useExportHistory(productId?: string) {
  return useQuery({
    queryKey: [...EXPORTS_KEY, 'history', productId],
    queryFn: () => api.exports.getHistory(productId),
  });
}

// ============================================
// Export Preview Query
// ============================================

export function useExportPreview(options: ExportOptions | null) {
  return useQuery({
    queryKey: [...EXPORT_PREVIEW_KEY, options],
    queryFn: () => api.exports.getPreview(options!),
    enabled: !!options,
  });
}

// ============================================
// Export Mutations
// ============================================

export function useExecuteExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: ExportOptions) => api.exports.execute(options),
    onSuccess: (_, variables) => {
      // Invalidate history to refresh the list
      queryClient.invalidateQueries({ queryKey: [...EXPORTS_KEY, 'history'] });
    },
  });
}

export function useClearExportHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId?: string) => api.exports.clearHistory(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...EXPORTS_KEY, 'history'] });
    },
  });
}

export function useOpenExportFolder() {
  return useMutation({
    mutationFn: (folderPath: string) => api.exports.openFolder(folderPath),
  });
}

export function useCopySnapshot() {
  return useMutation({
    mutationFn: (productId: string) => api.exports.copySnapshot(productId),
  });
}

// Re-export types for convenience
export type { ExportOptions, ExportPreview, ExportResult, ExportRecord };
