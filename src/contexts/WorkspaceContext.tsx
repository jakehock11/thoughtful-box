import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '@/lib/ipc';

interface WorkspaceContextValue {
  isConfigured: boolean;
  isLoading: boolean;
  workspacePath: string | null;
  error: string | null;
  selectWorkspace: () => Promise<string | null>;
  initializeWorkspace: (path: string) => Promise<void>;
  openWorkspaceFolder: () => Promise<void>;
  refresh: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const configured = await api.workspace.isConfigured();
      setIsConfigured(configured);

      if (configured) {
        const path = await api.workspace.getPath();
        setWorkspacePath(path);
      } else {
        setWorkspacePath(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check workspace');
      setIsConfigured(false);
      setWorkspacePath(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectWorkspace = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      const path = await api.workspace.select();
      return path;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select workspace');
      return null;
    }
  }, []);

  const initializeWorkspace = useCallback(async (path: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      await api.workspace.initialize(path);
      setIsConfigured(true);
      setWorkspacePath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize workspace');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openWorkspaceFolder = useCallback(async (): Promise<void> => {
    try {
      await api.workspace.openFolder();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open workspace folder');
    }
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        isConfigured,
        isLoading,
        workspacePath,
        error,
        selectWorkspace,
        initializeWorkspace,
        openWorkspaceFolder,
        refresh,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}
