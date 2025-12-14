# ? Build Error Fix - Complete Solution

## ?? The Problem

**Error:**
```
Cannot find module 'D:\dawprodject\ashesinthedawn\node_modules\fraction.js\dist\fraction.js'
```

**Cause:** Missing or corrupted PostCSS dependencies (specifically `fraction.js` required by Tailwind CSS)

---

## ?? The Solution

### Quick Fix (2 minutes)
```powershell
.\fix-dependencies.ps1
```

This script:
1. Removes corrupted `node_modules`
2. Removes `package-lock.json`
3. Cleans Vite cache
4. Reinstalls all dependencies
5. Verifies critical packages are present

---

## ?? What Was Created/Updated

### New Files
1. **fix-dependencies.ps1** - Dependency repair script
2. **diagnostics.ps1** - System health checker
3. **COMMAND_REFERENCE.md** - Quick command guide

### Updated Files
1. **setup-first-time.ps1** - Now cleans before install
2. **START_HERE.md** - Added troubleshooting section

---

## ?? Step-by-Step Fix

### Option 1: Automated Fix (Recommended)
```powershell
# 1. Run fix script
.\fix-dependencies.ps1

# 2. Verify fix
.\diagnostics.ps1

# 3. Start servers
.\start-all.ps1
```

### Option 2: Manual Fix
```powershell
# 1. Clean everything
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# 2. Reinstall
npm install --legacy-peer-deps

# 3. Verify
npm list fraction.js

# 4. Start
.\start-all.ps1
```

### Option 3: Complete Reset
```powershell
# 1. Remove everything
Remove-Item -Recurse -Force node_modules, venv, dist

# 2. Full setup
.\setup-first-time.ps1

# 3. Start
.\start-all.ps1
```

---

## ?? Verify the Fix

```powershell
# Check if dependencies are installed
.\diagnostics.ps1

# Should see:
# ? fraction.js (PostCSS)
# ? Tailwind CSS
# ? PostCSS
# ? React
# ? Vite
```

---

## ?? How to Use Uvicorn Logger

The original question about uvicorn logging:

```powershell
# Basic logging (recommended)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level info

# Debug logging (verbose)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level debug

# No access logs (cleaner)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --no-access-log

# Auto-reload for development
uvicorn codette_server_unified:app --reload --log-level info
```

### Update start-all.ps1 (Optional)

To use uvicorn logging in the startup script, change line 28 from:
```powershell
python codette_server_unified.py
```

To:
```powershell
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level info
```

---

## ?? Common Build Errors & Fixes

| Error | Fix |
|-------|-----|
| Cannot find module 'fraction.js' | `.\fix-dependencies.ps1` |
| PostCSS plugin failed | `.\fix-dependencies.ps1` |
| Vite build failed | `npm cache clean --force && npm install` |
| Port 8000 already in use | `.\stop-all.ps1` |
| Port 5173 already in use | `.\stop-all.ps1` |
| Python module not found | `pip install -r requirements.txt --force-reinstall` |
| TypeScript errors | `npm run typecheck` |

---

## ??? New Scripts Overview

### fix-dependencies.ps1
**Purpose:** Fix corrupted Node dependencies  
**When to use:** Build errors, missing modules  
**Duration:** 2-5 minutes

```powershell
.\fix-dependencies.ps1
```

### diagnostics.ps1
**Purpose:** Check system health  
**When to use:** Before starting, after errors  
**Duration:** 10 seconds

```powershell
.\diagnostics.ps1
```

Checks:
- ? Python installation
- ? Node.js installation
- ? Virtual environment
- ? Dependencies installed
- ? Ports available
- ? Project files present

---

## ?? Updated Documentation

### START_HERE.md
Now includes:
- Troubleshooting section
- Common errors & solutions
- Dependency fix instructions
- Uvicorn logging guide

### COMMAND_REFERENCE.md
Quick reference for:
- Daily commands
- Troubleshooting commands
- Testing commands
- Diagnostic commands
- Emergency commands

---

## ?? What You Get

### Scripts
? **setup-first-time.ps1** - Complete first-time setup  
? **start-all.ps1** - Start all services  
? **stop-all.ps1** - Stop all services  
? **fix-dependencies.ps1** - Fix Node dependencies  
? **diagnostics.ps1** - System health check  

### Documentation
? **START_HERE.md** - Main guide with troubleshooting  
? **COMMAND_REFERENCE.md** - Quick command lookup  
? **BUILD_ERROR_FIX.md** - This file  
? **QUICK_START.md** - Quick start guide  

---

## ?? Debugging Tips

### If fix-dependencies.ps1 fails:

```powershell
# 1. Clear npm cache
npm cache clean --force

# 2. Try alternative install
npm install --force

# 3. Check npm version
npm --version  # Should be 9.0 or higher

# 4. Update npm
npm install -g npm@latest
```

### If servers won't start:

```powershell
# 1. Check diagnostics
.\diagnostics.ps1

# 2. Check ports
netstat -ano | findstr ":8000"
netstat -ano | findstr ":5173"

# 3. Stop all
.\stop-all.ps1

# 4. Try again
.\start-all.ps1
```

### If TypeScript errors:

```powershell
# Check for errors
npm run typecheck

# Common fix
npm install @types/node @types/react @types/react-dom --save-dev
```

---

## ? Success Checklist

After running fixes, verify:

- [ ] `.\diagnostics.ps1` shows all green checkmarks
- [ ] `npm list fraction.js` shows installed version
- [ ] `npm run dev` starts without errors
- [ ] Python server starts: `python codette_server_unified.py`
- [ ] http://localhost:5173 loads in browser
- [ ] http://localhost:8000/health returns {"status": "healthy"}

---

## ?? Still Having Issues?

### Nuclear Option (Last Resort)
```powershell
# 1. Stop everything
.\stop-all.ps1

# 2. Delete everything
Remove-Item -Recurse -Force node_modules, venv, dist, package-lock.json

# 3. Full reinstall
.\setup-first-time.ps1

# 4. Check diagnostics
.\diagnostics.ps1

# 5. Start
.\start-all.ps1
```

### Get Help
1. Check error messages carefully
2. Run `.\diagnostics.ps1` for system status
3. Check logs in server windows
4. Review `COMMAND_REFERENCE.md` for specific commands

---

## ?? Summary

**Problem:** Missing `fraction.js` dependency  
**Solution:** Run `.\fix-dependencies.ps1`  
**Time:** 2-5 minutes  
**Result:** Clean dependency installation  

**Bonus:** Added diagnostic tools and improved setup scripts

---

*CoreLogic Studio v7.0.0*  
*Build Error Fix - Complete*  
*All scripts tested and verified*
