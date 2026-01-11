import { ipcMain } from 'electron';
import {
  getTaxonomy,
  getPersonas,
  createPersona,
  updatePersona,
  archivePersona,
  unarchivePersona,
  getFeatures,
  createFeature,
  updateFeature,
  archiveFeature,
  unarchiveFeature,
  getDimensions,
  createDimension,
  updateDimension,
  archiveDimension,
  unarchiveDimension,
  getDimensionValues,
  createDimensionValue,
  updateDimensionValue,
  archiveDimensionValue,
  unarchiveDimensionValue,
} from '../database/queries/taxonomy';

export function registerTaxonomyHandlers(): void {
  // Get all taxonomy for a product
  ipcMain.handle('taxonomy:getAll', (_, productId: string) => {
    try {
      const taxonomy = getTaxonomy(productId);
      return { success: true, data: taxonomy };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ============================================
  // Persona Handlers
  // ============================================

  ipcMain.handle('taxonomy:getPersonas', (_, productId: string) => {
    try {
      const personas = getPersonas(productId);
      return { success: true, data: personas };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:createPersona', (_, productId: string, name: string) => {
    try {
      const persona = createPersona(productId, name);
      return { success: true, data: persona };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:updatePersona', (_, id: string, data: { name?: string }) => {
    try {
      const persona = updatePersona(id, data);
      return { success: true, data: persona };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:archivePersona', (_, id: string) => {
    try {
      archivePersona(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:unarchivePersona', (_, id: string) => {
    try {
      const persona = unarchivePersona(id);
      return { success: true, data: persona };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ============================================
  // Feature Handlers
  // ============================================

  ipcMain.handle('taxonomy:getFeatures', (_, productId: string) => {
    try {
      const features = getFeatures(productId);
      return { success: true, data: features };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:createFeature', (_, productId: string, name: string) => {
    try {
      const feature = createFeature(productId, name);
      return { success: true, data: feature };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:updateFeature', (_, id: string, data: { name?: string }) => {
    try {
      const feature = updateFeature(id, data);
      return { success: true, data: feature };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:archiveFeature', (_, id: string) => {
    try {
      archiveFeature(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:unarchiveFeature', (_, id: string) => {
    try {
      const feature = unarchiveFeature(id);
      return { success: true, data: feature };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ============================================
  // Dimension Handlers
  // ============================================

  ipcMain.handle('taxonomy:getDimensions', (_, productId: string) => {
    try {
      const dimensions = getDimensions(productId);
      return { success: true, data: dimensions };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:createDimension', (_, productId: string, name: string) => {
    try {
      const dimension = createDimension(productId, name);
      return { success: true, data: dimension };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:updateDimension', (_, id: string, data: { name?: string }) => {
    try {
      const dimension = updateDimension(id, data);
      return { success: true, data: dimension };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:archiveDimension', (_, id: string) => {
    try {
      archiveDimension(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:unarchiveDimension', (_, id: string) => {
    try {
      const dimension = unarchiveDimension(id);
      return { success: true, data: dimension };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // ============================================
  // Dimension Value Handlers
  // ============================================

  ipcMain.handle('taxonomy:getDimensionValues', (_, dimensionId: string) => {
    try {
      const values = getDimensionValues(dimensionId);
      return { success: true, data: values };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:createDimensionValue', (_, dimensionId: string, name: string) => {
    try {
      const value = createDimensionValue(dimensionId, name);
      return { success: true, data: value };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:updateDimensionValue', (_, id: string, data: { name?: string }) => {
    try {
      const value = updateDimensionValue(id, data);
      return { success: true, data: value };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:archiveDimensionValue', (_, id: string) => {
    try {
      archiveDimensionValue(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle('taxonomy:unarchiveDimensionValue', (_, id: string) => {
    try {
      const value = unarchiveDimensionValue(id);
      return { success: true, data: value };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
