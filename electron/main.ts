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

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

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

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    // Try common dev server ports
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:8080';
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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
