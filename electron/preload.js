/**
 * Electron Preload Script
 * Exposes secure IPC bridge to renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Backend health check
  backendHealth: () => ipcRenderer.invoke('backend:health'),

  // App info
  appVersion: () => ipcRenderer.invoke('app:version'),
  appName: () => ipcRenderer.invoke('app:name'),

  // File operations
  openFile: (options) => ipcRenderer.invoke('file:open', options),
  saveFile: (options) => ipcRenderer.invoke('file:save', options),

  // Dialogs
  showError: (title, message) => ipcRenderer.invoke('dialog:error', title, message),
  showInfo: (title, message) => ipcRenderer.invoke('dialog:info', title, message),

  // Process info
  isDev: process.env.NODE_ENV === 'development',
  platform: process.platform,
  arch: process.arch,
});

// Prevent navigation to external sites
window.addEventListener('will-navigate', (event) => {
  const url = new URL(event.url);
  if (url.origin !== 'http://localhost') {
    event.preventDefault();
  }
});
