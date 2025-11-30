# CoreLogic Studio - Electron Quick Start

This guide gets you started with converting CoreLogic Studio to a standalone desktop app.

## Prerequisites

```bash
# Node.js 14+ and npm
node --version
npm --version

# Python 3.8+
python --version

# PyInstaller (for backend)
pip install pyinstaller
```

## Step 1: Install Electron Dependencies

```bash
npm install --save-dev electron electron-builder electron-squirrel-startup
npm install electron-store python-shell
```

Or use the provided setup script:
```bash
# Windows
npm install

# Mac
npm install
```

## Step 2: Set Up Electron Files

The following files are already created in `electron/`:
- `main.js` - Main process (backend + window management)
- `preload.js` - IPC bridge for security

No further action needed.

## Step 3: Build Backend Executable

```bash
# Windows
python build_backend.py --platform windows

# Mac
python build_backend.py --platform mac --verify
```

This creates: `dist/backend/codette-server.exe` or `codette-server`

**Note**: This takes 2-5 minutes (includes Python runtime). Output size: ~150-200 MB

## Step 4: Test in Development

### Terminal 1 - React Dev Server
```bash
npm run dev
# Vite will start on http://localhost:5173
```

### Terminal 2 - Electron App
```bash
npm run dev:electron
# This will:
# 1. Start the Python backend
# 2. Open the Electron window
# 3. Hot reload React changes
```

The app should open with:
- React UI loaded
- Backend running on port 8000
- Codette responding to requests

## Step 5: Build for Production

```bash
# Build React
npm run build

# Build Electron installer
npm run build:electron
```

This creates:
- **Windows**: `dist/CoreLogic Studio 7.0.0.msi` (installer)
- **Mac**: `dist/CoreLogic Studio-7.0.0.dmg` (disk image)

## Step 6: Test Installers

### Windows
1. Run `dist/CoreLogic Studio 7.0.0.msi`
2. Choose installation location
3. Create desktop shortcut
4. Launch from Start Menu

### Mac
1. Open `dist/CoreLogic Studio-7.0.0.dmg`
2. Drag app to Applications folder
3. Launch from Applications

## Troubleshooting

### Backend not starting in Electron
```bash
# Check if Python is in PATH
python --version

# Or specify Python path in electron/main.js
pythonPath = 'C:\\Python310\\python.exe';  // Windows
pythonPath = '/usr/local/bin/python3';      // Mac
```

### Port 8000 already in use
```bash
# Find process using port 8000
# Windows
netstat -ano | findstr :8000

# Mac
lsof -i :8000

# Kill process
taskkill /PID <PID> /F  # Windows
kill -9 <PID>           # Mac
```

### React not loading in Electron
1. Check console: `mainWindow.webContents.openDevTools()`
2. Verify Vite is running on port 5173
3. Check `vite.config.ts` has `base: './'`

### Installer won't run (Windows)
- Disable antivirus temporarily (may flag new executable)
- Check Windows Version requirement (Windows 10+)
- Ensure sufficient disk space (500 MB)

### Mac app won't start
- Check security: System Preferences → Security & Privacy
- May need to right-click and "Open" to bypass Gatekeeper
- For code signing, see STANDALONE_APP_CONVERSION_GUIDE.md

## Available npm Scripts

```bash
npm run dev                 # React dev server
npm run build              # Build React
npm run build:electron     # Build Electron app + installers
npm run start:electron     # Start Electron dev environment
npm run pack               # Create installers without signing
npm run dist               # Create signed installers
npm run lint               # ESLint check
npm run typecheck          # TypeScript check
npm run ci                 # Full CI check
```

## Project Structure

```
project/
├── electron/
│   ├── main.js           # Main process
│   └── preload.js        # IPC bridge
├── src/                  # React source
├── dist/                 # Built React app
├── build/                # PyInstaller build
├── build_backend.py      # Backend build script
├── package.json          # Node dependencies + Electron config
└── vite.config.ts        # Vite + Electron config
```

## Next Steps

1. **Test thoroughly**: Try all features in Electron version
2. **Add auto-update**: See STANDALONE_APP_CONVERSION_GUIDE.md
3. **Code signing**: Get Windows & Mac certificates
4. **Distribution**: Host installers or submit to stores
5. **Documentation**: Create user installation guide

## Useful Resources

- [Electron Guide](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)
- [PyInstaller Docs](https://pyinstaller.org/en/stable/)
- [Our Full Guide](STANDALONE_APP_CONVERSION_GUIDE.md)

## Support

For detailed information on:
- Code signing: See STANDALONE_APP_CONVERSION_GUIDE.md (Section: Build & Signing)
- Auto-updates: See section: Auto-Update System
- Alternative platforms: See section: Option 2 - Tauri

## Quick Checklist

- [ ] Electron dependencies installed
- [ ] Backend built successfully (150-200 MB)
- [ ] Dev environment works (Electron + React)
- [ ] Production build works (no npm dev needed)
- [ ] Installer runs on test machine
- [ ] All DAW features work in standalone app
- [ ] Backend health checks pass
- [ ] Ready for distribution

---

**Total time to standalone app**: ~2 hours (first time) | 30 mins (after)

**Installer size**: ~80-100 MB (compressed) | ~200-300 MB (installed)
