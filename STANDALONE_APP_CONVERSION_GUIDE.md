# CoreLogic Studio - Standalone App Conversion Guide
## Converting to Windows & Mac Desktop Applications

**Date**: November 29, 2025  
**Version**: 7.0.0 → Standalone Desktop App  
**Current Status**: Web-based (Vite + FastAPI)  
**Target**: Native desktop apps (Windows .exe, Mac .app)

---

## Executive Summary

Current architecture is **web-based** (React frontend on port 5173, FastAPI backend on port 8000). Converting to standalone apps requires:

1. **Frontend bundling** - Package React app with Electron/Tauri
2. **Backend embedding** - Bundle Python backend with PyInstaller or similar
3. **Auto-update system** - Keep apps current on both platforms
4. **Code signing** - For distribution on Windows/Mac App Store

**Complexity**: Medium | **Timeline**: 2-4 weeks | **Effort**: 30-40 development days

---

## Current Architecture Analysis

### Frontend
- **Framework**: React 18 + TypeScript 5.5
- **Build tool**: Vite 7.2.4 (very fast, ~471 KB gzipped)
- **UI Library**: Tailwind CSS 3.4
- **Icons**: Lucide React
- **State**: React Context (DAWContext)
- **Size**: Production build ~200-300 KB

### Backend
- **Framework**: FastAPI with Uvicorn
- **Port**: 8000 (localhost only)
- **AI Engine**: Codette (custom Python)
- **DSP Library**: daw_core (Python)
- **Dependencies**: NumPy, SciPy, NLTK
- **Entry point**: `codette_server_unified.py`

### Database
- **Auth**: Supabase (optional in current setup)
- **Local storage**: Browser localStorage + file system
- **DAW projects**: JSON files

---

## Option 1: Electron (Recommended for Most Users)

### Advantages
✅ Most mature ecosystem  
✅ Native Windows & Mac support  
✅ Hot reload in development  
✅ Easy code signing  
✅ Large community support  
✅ Can bundle Python easily  

### Disadvantages
❌ Larger app size (~200-300 MB)  
❌ Higher memory usage  
❌ Slower startup (~2-3 seconds)  

### Implementation Steps

#### 1.1 Install Electron Dependencies
```bash
npm install --save-dev electron electron-builder electron-squirrel-startup
npm install electron-store  # For local config storage
npm install python-shell    # For spawning Python backend
```

#### 1.2 Update `package.json`
```json
{
  "main": "public/electron.js",
  "homepage": "./",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:electron": "npm run build && electron-builder",
    "start:electron": "electron .",
    "pack": "electron-builder --dir",
    "dist": "electron-builder"
  },
  "build": {
    "appId": "com.corelogic.studio",
    "productName": "CoreLogic Studio",
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "public/electron.js"
    ],
    "directories": {
      "buildResources": "assets"
    },
    "extraMetadata": {
      "main": "public/electron.js"
    },
    "win": {
      "target": [
        "msi",
        "nsis"
      ],
      "certificateFile": null,
      "certificatePassword": null
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "CoreLogic Studio"
    },
    "mac": {
      "target": [
        "dmg",
        "zip"
      ],
      "category": "public.app-category.music"
    },
    "dmg": {
      "contents": [
        {
          "x": 110,
          "y": 150,
          "type": "file"
        },
        {
          "x": 240,
          "y": 150,
          "type": "link",
          "path": "/Applications"
        }
      ]
    }
  }
}
```

#### 1.3 Create `public/electron.js` (Main Process)
```javascript
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const PythonShell = require('python-shell').PythonShell;

let mainWindow;
let pythonProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:5173' // Dev server
    : `file://${path.join(__dirname, '../dist/index.html')}`; // Production build

  mainWindow.loadURL(startUrl);
  mainWindow.on('closed', () => mainWindow = null);
}

function startPythonBackend() {
  if (isDev) {
    // Dev: Run Python from source
    pythonProcess = new PythonShell('codette_server_unified.py', {
      pythonPath: path.join(app.getAppPath(), 'python', 'python.exe'), // Windows
      scriptPath: app.getAppPath(),
    });
  } else {
    // Production: Use bundled PyInstaller executable
    const serverPath = path.join(
      process.resourcesPath,
      'backend',
      `codette-server${process.platform === 'win32' ? '.exe' : ''}`
    );
    
    const { spawn } = require('child_process');
    pythonProcess = spawn(serverPath);
  }

  pythonProcess.on('error', (error) => {
    console.error('Python backend error:', error);
  });
}

app.on('ready', () => {
  startPythonBackend();
  // Wait for backend to start
  setTimeout(() => createWindow(), 1000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
  if (pythonProcess) pythonProcess.kill();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// Handle backend communication
ipcMain.handle('backend:ready', () => true);
ipcMain.handle('backend:health', async () => {
  try {
    const response = await fetch('http://localhost:8000/health');
    return response.ok;
  } catch (e) {
    return false;
  }
});
```

#### 1.4 Create `public/preload.js` (IPC Bridge)
```javascript
const { contextBridge, ipcMain } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  backendReady: () => ipcMain.invoke('backend:ready'),
  backendHealth: () => ipcMain.invoke('backend:health'),
});
```

#### 1.5 Update Vite Config for Electron
```typescript
export default defineConfig({
  base: './', // Relative paths for electron
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

#### 1.6 Build & Package
```bash
# Development
npm run dev              # Terminal 1: React dev server
npm start:electron      # Terminal 2: Electron app

# Production
npm run build:electron  # Creates Windows MSI, Mac DMG

# Output locations:
# Windows: dist/CoreLogic Studio 7.0.0.msi
# Mac: dist/CoreLogic Studio-7.0.0.dmg
```

---

## Option 2: Tauri (Alternative - Lighter Weight)

### Advantages
✅ Smaller app size (~50-100 MB vs 200+ MB)  
✅ Better native integration  
✅ Faster startup  
✅ Built-in WebView  

### Disadvantages
❌ Smaller community  
❌ Less mature  
❌ Different build system  

### Basic Setup
```bash
npm install --save-dev tauri
cargo install tauri-cli

tauri init -t vite
tauri build
```

---

## Backend Distribution Options

### Option A: PyInstaller (Simplest)
```bash
pip install pyinstaller

pyinstaller --onefile \
  --add-data "codette_training_data.py:." \
  --add-data "daw_core:daw_core" \
  --hidden-import=numpy \
  --hidden-import=scipy \
  --hidden-import=nltk \
  codette_server_unified.py

# Outputs: dist/codette_server_unified.exe (Windows) or .app (Mac)
# Size: ~150-200 MB (includes Python runtime)
```

### Option B: PyOxidizer (Smaller, More Complex)
- Produces even smaller binaries (~80-100 MB)
- More difficult setup
- Better performance

### Option C: Docker (For server distribution)
- Package backend as Docker image
- User must have Docker installed
- Best for cloud deployment

**Recommendation**: Use PyInstaller for simplicity, embed in Electron resources.

---

## Step-by-Step Implementation Plan

### Phase 1: Prepare Frontend (1-2 days)
- [ ] Update Vite config to support Electron/Tauri
- [ ] Add environment detection (isDev, isElectron)
- [ ] Update API URLs (localhost:8000 in app)
- [ ] Test production build locally
- [ ] Remove Supabase dependency (or make optional)

### Phase 2: Embed Backend (3-4 days)
- [ ] Create PyInstaller build script
- [ ] Test bundled Python backend
- [ ] Add startup detection/retry logic
- [ ] Implement graceful shutdown
- [ ] Create health check endpoint

### Phase 3: Electron Setup (2-3 days)
- [ ] Install Electron dependencies
- [ ] Create main process (electron.js)
- [ ] Create preload bridge (preload.js)
- [ ] Update package.json build config
- [ ] Test dev environment

### Phase 4: Build & Signing (2-3 days)
- [ ] Windows code signing (get certificate or use self-sign)
- [ ] Mac code signing (requires Apple Developer account)
- [ ] Create installer (NSIS for Windows, DMG for Mac)
- [ ] Test installers on clean machines

### Phase 5: Auto-Update (1-2 days)
- [ ] Add electron-updater
- [ ] Set up GitHub releases
- [ ] Create delta updates
- [ ] Test update workflow

### Phase 6: Distribution (1 day)
- [ ] Create installer packages
- [ ] Set up download server
- [ ] Document installation process
- [ ] Create system requirements

---

## Estimated File Sizes

| Component | Size | Notes |
|-----------|------|-------|
| React build (dist/) | ~150 KB | Minified, gzipped |
| Python backend (PyInstaller) | ~150-200 MB | Includes Python runtime |
| Electron runtime | ~50-80 MB | Native modules per platform |
| **Total Windows .exe** | ~200-300 MB | Installer ~80-100 MB |
| **Total Mac .app** | ~250-350 MB | DMG ~90-120 MB |

---

## Code Changes Required

### 1. Frontend URL Detection
```typescript
// src/lib/config.ts
const API_URL = 
  process.env.NODE_ENV === 'production' && window.electron
    ? 'http://localhost:8000'  // Standalone app
    : import.meta.env.VITE_CODETTE_API || 'http://localhost:8000';
```

### 2. Startup Initialization
```typescript
// src/hooks/useElectron.ts
export function useElectronStartup() {
  useEffect(() => {
    if (!window.electron) return;
    
    // Check backend health
    window.electron.backendHealth()
      .then(healthy => {
        if (!healthy) {
          console.warn('Backend not ready, retrying...');
          setTimeout(() => location.reload(), 2000);
        }
      });
  }, []);
}
```

### 3. Backend Error Handling
```python
# codette_server_unified.py - Add electron detection
import os
IS_ELECTRON = os.getenv('ELECTRON_APP') == '1'

if IS_ELECTRON:
    # Don't daemonize, don't print to file, write to stderr for console
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        stream=sys.stderr
    )
```

---

## System Requirements

### Windows
- OS: Windows 10+ (x64)
- RAM: 4 GB minimum, 8 GB recommended
- Disk: 500 MB free space
- No additional dependencies (Python bundled)

### Mac
- OS: macOS 10.13+
- Architecture: Intel or Apple Silicon (M1+)
- RAM: 4 GB minimum, 8 GB recommended
- Disk: 500 MB free space
- Xcode Command Line Tools (for code signing)

---

## Development Workflow

### Without Standalone App (Current)
```bash
# Terminal 1
npm run dev          # React on port 5173

# Terminal 2
python codette_server_unified.py  # Backend on port 8000
```

### With Standalone App (After Implementation)
```bash
# Terminal 1
npm run dev          # React on port 5173

# Terminal 2
npm run dev:electron # Electron wrapper (auto-starts backend)

# Or for production:
npm run build:electron
dist/CoreLogic\ Studio.app  # Mac
dist/CoreLogic\ Studio.exe  # Windows (after install)
```

---

## Distribution Channels

### Option 1: Direct Download (Simplest)
- Host .exe and .dmg on website
- ~200-300 MB downloads per user
- Manual updates

### Option 2: GitHub Releases (Free)
- Automated builds via GitHub Actions
- Delta updates supported
- ~5 GB storage included

### Option 3: Windows Store / Mac App Store
- Better discoverability
- Automated updates
- Requires code signing certificates
- ~$20-100 one-time fees

### Option 4: Homebrew (Mac Only)
```bash
brew install corelogic-studio
brew upgrade corelogic-studio
```

### Option 5: Chocolatey (Windows Only)
```cmd
choco install corelogic-studio
choco upgrade corelogic-studio
```

---

## Alternative: Web App Wrapper

If desktop app is too complex, alternatives:

### 1. Progressive Web App (PWA)
- **Effort**: 1-2 days
- **Size**: Same as web (~1-2 MB)
- **Pros**: Works offline, installable from browser
- **Cons**: Limited file access, no native features

### 2. Capacitor (Mobile + Desktop)
- **Effort**: 1-2 weeks
- **Size**: ~100-150 MB
- **Pros**: Single codebase for iOS, Android, Windows, Mac
- **Cons**: Requires different build tools per platform

### 3. NW.js (Node.js based alternative to Electron)
- **Effort**: Similar to Electron
- **Size**: Similar to Electron (~200+ MB)
- **Pros**: Simpler API, smaller community

---

## Checklist for Going Standalone

- [ ] **Backend**: PyInstaller bundle created and tested
- [ ] **Frontend**: Build optimized for electron (base: './')
- [ ] **IPC**: Electron preload bridge implemented
- [ ] **Health checks**: Backend startup detection
- [ ] **Error handling**: Graceful failure modes
- [ ] **Code signing**: Windows & Mac certificates obtained
- [ ] **Installers**: NSIS (Windows), DMG (Mac) tested
- [ ] **Auto-update**: electron-updater configured
- [ ] **Testing**: Tested on clean Windows 10+ and Mac 10.13+
- [ ] **Documentation**: Installation guide created
- [ ] **CI/CD**: GitHub Actions for automated builds
- [ ] **Distribution**: Download server / store setup

---

## Resources & Tools

### Electron
- Official: https://www.electronjs.org
- Docs: https://www.electronjs.org/docs
- Boilerplate: https://github.com/electron-react-boilerplate/electron-react-boilerplate

### PyInstaller
- Official: https://pyinstaller.org
- Docs: https://pyinstaller.org/en/stable/

### Code Signing
- **Windows**: Get certificate from $100-300/year vendors
- **Mac**: Apple Developer Program ($99/year)

### Utilities
- electron-builder: https://www.electron.build
- electron-updater: https://www.electron.build/auto-update
- code-signing tools for CI/CD

---

## Next Steps

1. **Decide on architecture**: Electron vs Tauri vs PWA
2. **Set budget**: Time and certificate costs
3. **Pick backend distribution**: PyInstaller vs Docker
4. **Plan distribution**: Direct, GitHub, Store, Homebrew
5. **Create implementation roadmap**: Break into milestones

For questions or guidance on specific steps, refer to the Electron documentation and this guide's implementation sections.

---

## Summary

| Aspect | Complexity | Timeline | Cost |
|--------|-----------|----------|------|
| Electron setup | Medium | 2-4 weeks | $0 |
| Code signing (Windows) | Low | 1 day | $100-300 |
| Code signing (Mac) | Low | 1 day | $99/year |
| Backend bundling | Medium | 3-4 days | $0 |
| Auto-update system | Medium | 1-2 days | $0 |
| **Total** | **Medium** | **4-6 weeks** | **$200-400** |

**Bottom line**: Convert to standalone app in **1-1.5 months** with basic implementation, or **2+ months** with full distribution channels and auto-update support.
