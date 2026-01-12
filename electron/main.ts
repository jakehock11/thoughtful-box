import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { closeDatabase, getTables } from './database/db';
import { initializeWithWorkspace } from './workspace/manager';
import { registerAllHandlers } from './ipc/handlers';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Test IPC handler
ipcMain.handle('ping', () => 'pong');

// Database test IPC handler
ipcMain.handle('db:test', () => {
  try {
    const tables = getTables();
    return { success: true, tables };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false, // Don't show until ready
  });

  // Determine environment at runtime (not module load time)
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
  
  console.log('Environment:', {
    isPackaged: app.isPackaged,
    NODE_ENV: process.env.NODE_ENV,
    isDev: isDev
  });

  // Load the app based on environment
  if (isDev) {
    // electron:dev - Load from Vite dev server
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:8080';
    console.log('Loading dev server:', devServerUrl);
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else if (app.isPackaged) {
    // electron:build - Packaged app, use app.getAppPath() for reliable path resolution
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    console.log('Loading packaged app:', indexPath);
    mainWindow.loadFile(indexPath);
  } else {
    // electron:preview - Built files, not packaged
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    console.log('Loading preview:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  // Show window when ready to avoid flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle handlers
app.on('ready', () => {
  // Register all IPC handlers
  registerAllHandlers();

  // Initialize with workspace awareness
  // This will use saved workspace path if available, otherwise default location
  try {
    const workspaceReady = initializeWithWorkspace();
    if (workspaceReady) {
      console.log('Database initialized with workspace');
    } else {
      console.log('Database initialized (no workspace configured yet)');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }

  createWindow();
});

app.on('window-all-closed', () => {
  // On macOS, apps typically stay open until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
