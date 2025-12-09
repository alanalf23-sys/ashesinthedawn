# ?? Dependency Installation Guide
**CoreLogic Studio v7.0**

## Quick Install (Windows)

### Option 1: PowerShell Script (Recommended)
```powershell
cd D:\HorizonCore\GitHub
.\install-dependencies.ps1
```

### Option 2: Batch File
```cmd
cd D:\HorizonCore\GitHub
install-dependencies.bat
```

### Option 3: Manual Installation

#### Frontend Dependencies (Node.js)
```powershell
cd D:\HorizonCore\GitHub
npm install
```

#### Backend Dependencies (Python)
```powershell
pip install fastapi uvicorn pydantic numpy scipy
```

---

## Prerequisites

### 1. Install Node.js (if not installed)
- **Download**: https://nodejs.org/en/download/
- **Version**: LTS (v20.x recommended)
- **Important**: Restart terminal after installation

**Verify installation:**
```powershell
node --version  # Should show v18+ or v20+
npm --version   # Should show v9+ or v10+
```

### 2. Install Python (if not installed)
- **Download**: https://www.python.org/downloads/
- **Version**: 3.10 or higher
- **Important**: ? Check "Add Python to PATH" during installation
- **Important**: Restart terminal after installation

**Verify installation:**
```powershell
python --version  # Should show Python 3.10+
pip --version     # Should show pip 23+
```

---

## What Gets Installed

### Frontend (Node.js - 174 packages)

**Production Dependencies:**
- `@supabase/supabase-js@^2.86.0` - Database client
- `lucide-react@^0.344.0` - Icon library (VU meter icons)
- `react@^18.3.1` - React core
- `react-dom@^18.3.1` - React DOM

**Development Dependencies:**
- `vite@^7.2.6` - Build tool & dev server
- `typescript@^5.5.3` - TypeScript compiler
- `tailwindcss@^3.4.18` - CSS framework
- `eslint@^9.39.1` - Code linting
- `@vitejs/plugin-react@^4.7.0` - Vite React plugin
- `autoprefixer@^10.4.22` - CSS autoprefixer
- `postcss@^8.4.35` - CSS processor
- And 7 more...

### Backend (Python - 5 packages)

- `fastapi` - Modern web framework for building APIs
- `uvicorn` - ASGI server for FastAPI
- `pydantic` - Data validation using Python type annotations
- `numpy` - Numerical computing (audio processing)
- `scipy` - Scientific computing (filters, FFT)

---

## Troubleshooting

### "npm is not recognized"
**Problem**: Node.js not in PATH

**Solution**:
1. Download Node.js from https://nodejs.org/
2. Run installer (LTS version)
3. **Restart VS Code** and terminal
4. Verify: `node --version`

### "python is not recognized"
**Problem**: Python not in PATH

**Solution**:
1. Download Python from https://www.python.org/downloads/
2. Run installer
3. ? **Check "Add Python to PATH"**
4. **Restart VS Code** and terminal
5. Verify: `python --version` or `py --version`

### "npm install" fails with EACCES error
**Problem**: Permission issues

**Solution 1 - Run as Administrator:**
1. Right-click PowerShell
2. "Run as Administrator"
3. Navigate to project: `cd D:\HorizonCore\GitHub`
4. Run: `npm install`

**Solution 2 - Clear cache:**
```powershell
npm cache clean --force
npm install
```

### "pip install" fails
**Problem**: Network or permission issues

**Solution 1 - Upgrade pip:**
```powershell
python -m pip install --upgrade pip
pip install fastapi uvicorn pydantic numpy scipy
```

**Solution 2 - Use virtual environment:**
```powershell
cd D:\HorizonCore\GitHub
python -m venv venv
.\venv\Scripts\activate
pip install fastapi uvicorn pydantic numpy scipy
```

### Installation is very slow
**Problem**: Network speed or npm registry

**Solution - Use faster registry:**
```powershell
npm config set registry https://registry.npmjs.org/
npm install
```

---

## Verification

After installation completes, verify everything works:

### 1. Check Node Packages
```powershell
npm list --depth=0
```
**Expected**: List of 18 packages with no errors

### 2. Check Python Packages
```powershell
pip list | findstr "fastapi uvicorn numpy scipy pydantic"
```
**Expected**: All 5 packages listed with version numbers

### 3. Run Type Check (Frontend)
```powershell
npm run typecheck
```
**Expected**: `0 errors` (takes ~5 seconds)

### 4. Test Build (Frontend)
```powershell
npm run build
```
**Expected**: Build completes successfully (~5 seconds)

### 5. Start Dev Server (Frontend)
```powershell
npm run dev
```
**Expected**: Vite server starts on `http://localhost:5173`

### 6. Start Backend Server (Python)
```powershell
python run_server.py
```
**Expected**: Codette server starts on `http://localhost:8001`

---

## Installation Checklist

- [ ] Node.js installed (v18+ or v20+)
- [ ] npm available in terminal (`npm --version`)
- [ ] Python installed (3.10+)
- [ ] pip available in terminal (`pip --version`)
- [ ] Run installation script or manual install
- [ ] `npm list --depth=0` shows 18 packages
- [ ] `pip list` shows fastapi, uvicorn, numpy, scipy, pydantic
- [ ] `npm run typecheck` shows 0 errors
- [ ] `npm run dev` starts without errors
- [ ] `python run_server.py` starts without errors
- [ ] Both servers running simultaneously in separate terminals

---

## Post-Installation

### Start Development Servers

**Terminal 1 - Backend:**
```powershell
cd D:\HorizonCore\GitHub
python run_server.py
```
**Output**: `INFO: Uvicorn running on http://0.0.0.0:8001`

**Terminal 2 - Frontend:**
```powershell
cd D:\HorizonCore\GitHub
npm run dev
```
**Output**: `? Local: http://localhost:5173/`

**Browser**: Open `http://localhost:5173`

---

## Quick Reference

| Task | Command |
|------|---------|
| Install all dependencies | `.\install-dependencies.ps1` |
| Install frontend only | `npm install` |
| Install backend only | `pip install fastapi uvicorn pydantic numpy scipy` |
| Clear npm cache | `npm cache clean --force` |
| Update pip | `python -m pip install --upgrade pip` |
| Check Node version | `node --version` |
| Check Python version | `python --version` |
| List installed npm packages | `npm list --depth=0` |
| List installed Python packages | `pip list` |

---

## Support

If installation fails after following this guide:

1. **Check VS Code terminal** for specific error messages
2. **Take note** of which step failed (Node.js, npm, Python, pip)
3. **Verify** prerequisites are installed correctly
4. **Restart** VS Code and terminal after installing Node/Python
5. **Try manual installation** commands if scripts fail

---

**Installation Date**: November 30, 2025
**CoreLogic Studio Version**: 7.0.0
**Node.js Required**: v18+ or v20+
**Python Required**: 3.10+
