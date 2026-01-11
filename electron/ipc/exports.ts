import { ipcMain, shell } from 'electron';
import {
  getExportPreview,
  executeExport,
  getExportHistory,
  clearExportHistory,
  generateCopySnapshot,
  type ExportOptions,
} from '../database/queries/exports';

export function registerExportHandlers(): void {
  // Get export preview (counts and entity list)
  ipcMain.handle('exports:getPreview', (_, options: ExportOptions) => {
    try {
      const preview = getExportPreview(options);
      return { success: true, data: preview };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Execute export (generate files and record in history)
  ipcMain.handle('exports:execute', (_, options: ExportOptions) => {
    try {
      const result = executeExport(options);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Get export history
  ipcMain.handle('exports:getHistory', (_, productId?: string) => {
    try {
      const history = getExportHistory(productId);
      return { success: true, data: history };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Clear export history
  ipcMain.handle('exports:clearHistory', (_, productId?: string) => {
    try {
      clearExportHistory(productId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Open export folder in file explorer
  ipcMain.handle('exports:openFolder', (_, folderPath: string) => {
    try {
      shell.openPath(folderPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Generate copy snapshot for clipboard
  ipcMain.handle('exports:copySnapshot', (_, productId: string) => {
    try {
      const snapshot = generateCopySnapshot(productId);
      return { success: true, data: snapshot };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
