/**
 * Electron Main Process
 * Handles window creation, backend spawning, and native integrations
 */

const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let pythonProcess;

// Constants
const APP_NAME = 'CoreLogic Studio';
const BACKEND_PORT = 8000;
const BACKEND_READY_TIMEOUT = 10000; // 10 seconds
const MAX_BACKEND_RETRIES = 3;

/**
 * Check if backend is ready
 */
async function checkBackendHealth() {
  try {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/health`, {
      method: 'GET',
      timeout: 2000,
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for backend to be ready with retries
 */
async function waitForBackend(retries = MAX_BACKEND_RETRIES) {
  for (let i = 0; i < retries; i++) {
    if (await checkBackendHealth()) {
      console.log('✅ Backend is ready');
      return true;
    }
    console.log(`⏳ Waiting for backend... (attempt ${i + 1}/${retries})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.error('❌ Backend failed to start');
  return false;
}

/**
 * Start Python backend process
 */
function startPythonBackend() {
  return new Promise((resolve, reject) => {
    try {
      let pythonPath;
      let scriptPath;

      if (isDev) {
        // Development: use system Python
        pythonPath = 'python';
        scriptPath = path.join(app.getAppPath(), '..', 'codette_server_unified.py');
      } else {
        // Production: use bundled PyInstaller executable
        if (process.platform === 'win32') {
          pythonPath = path.join(process.resourcesPath, 'backend', 'codette-server.exe');
        } else {
          pythonPath = path.join(process.resourcesPath, 'backend', 'codette-server');
        }
        scriptPath = null; // Executable doesn't need script path
      }

      const args = scriptPath ? [scriptPath] : [];
      const options = {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      };

      console.log(`🚀 Starting backend: ${pythonPath}`);
      pythonProcess = spawn(pythonPath, args, options);

      pythonProcess.stdout.on('data', (data) => {
        console.log(`[Backend] ${data.toString().trim()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`[Backend Error] ${data.toString().trim()}`);
      });

      pythonProcess.on('error', (error) => {
        console.error('❌ Failed to start backend:', error);
        reject(error);
      });

      pythonProcess.on('exit', (code, signal) => {
        console.log(`🛑 Backend exited with code ${code}, signal ${signal}`);
      });

      // Give backend a moment to start
      setTimeout(() => resolve(true), 500);
    } catch (error) {
      console.error('❌ Error starting backend:', error);
      reject(error);
    }
  });
}

/**
 * Create application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  // Load app
  const startUrl = isDev
    ? 'http://localhost:5173' // Vite dev server
    : `file://${path.join(__dirname, '../dist/index.html')}`; // Production build

  console.log(`📱 Loading URL: ${startUrl}`);
  mainWindow.loadURL(startUrl);

  // Open dev tools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window events
  mainWindow.webContents.on('crashed', () => {
    dialog.showErrorBox('Application Error', 'The application has crashed. It will now close.');
    app.quit();
  });
}

/**
 * App lifecycle
 */
app.on('ready', async () => {
  console.log('🚀 CoreLogic Studio starting...');

  try {
    // Start backend
    await startPythonBackend();

    // Wait for backend to be ready
    const backendReady = await waitForBackend();
    if (!backendReady) {
      throw new Error('Backend failed to start');
    }

    // Create window
    createWindow();
    setupMenu();
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    dialog.showErrorBox(
      'Startup Error',
      `Failed to start ${APP_NAME}: ${error.message}`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep app active until user quits explicitly
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // Kill Python backend
  if (pythonProcess) {
    console.log('🛑 Stopping backend...');
    try {
      if (process.platform === 'win32') {
        require('child_process').exec(`taskkill /PID ${pythonProcess.pid} /T /F`);
      } else {
        process.kill(-pythonProcess.pid);
      }
    } catch (error) {
      console.error('Error stopping backend:', error);
    }
  }
});

/**
 * Setup application menu
 */
function setupMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: `About ${APP_NAME}`,
              message: `${APP_NAME} v${app.getVersion()}`,
              detail: 'Professional Audio Workstation for Windows and Mac',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * IPC Handlers
 */

ipcMain.handle('backend:health', async () => {
  return await checkBackendHealth();
});

ipcMain.handle('app:version', () => {
  return app.getVersion();
});

ipcMain.handle('app:name', () => {
  return APP_NAME;
});

ipcMain.handle('file:open', async (event, options) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result.canceled ? null : result.filePaths;
});

ipcMain.handle('file:save', async (event, options) => {
  if (!mainWindow) return null;
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('dialog:error', async (event, title, message) => {
  if (!mainWindow) return;
  await dialog.showErrorBox(title, message);
});

ipcMain.handle('dialog:info', async (event, title, message) => {
  if (!mainWindow) return;
  await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title,
    message,
  });
});
