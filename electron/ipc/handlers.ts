import { registerWorkspaceHandlers } from './workspace';
import { registerProductHandlers } from './products';
import { registerTaxonomyHandlers } from './taxonomy';
import { registerEntityHandlers } from './entities';
import { registerRelationshipHandlers } from './relationships';
import { registerExportHandlers } from './exports';

// Register all IPC handlers
export function registerAllHandlers(): void {
  registerWorkspaceHandlers();
  registerProductHandlers();
  registerTaxonomyHandlers();
  registerEntityHandlers();
  registerRelationshipHandlers();
  registerExportHandlers();

  // Future handlers will be registered here:
  // registerSettingsHandlers();
}
