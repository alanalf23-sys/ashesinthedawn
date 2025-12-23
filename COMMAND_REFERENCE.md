# ?? CoreLogic Studio - Command Reference

## ?? Quick Commands

### First Time Setup
```powershell
.\setup-first-time.ps1    # Run ONCE - installs everything
```

### Daily Use
```powershell
.\start-all.ps1           # Start Python + React servers
.\stop-all.ps1            # Stop all servers
```

### Fix Issues
```powershell
.\fix-dependencies.ps1    # Fix "Cannot find module" errors
```

---

## ?? Manual Commands

### Python Server
```powershell
# Activate environment
.\venv\Scripts\Activate.ps1

# Start with uvicorn (basic)
python codette_server_unified.py

# Start with uvicorn (advanced logging)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level info

# Start with auto-reload (development)
uvicorn codette_server_unified:app --reload --log-level debug
```

### React Frontend
```powershell
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## ?? Troubleshooting Commands

### Fix Node Dependencies
```powershell
# Clean everything
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Reinstall
npm install --legacy-peer-deps
```

### Fix Python Dependencies
```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Reinstall
pip install -r requirements.txt --force-reinstall
```

### Clear All Caches
```powershell
# npm cache
npm cache clean --force

# pip cache
pip cache purge

# Remove build artifacts
Remove-Item -Recurse -Force dist, node_modules\.vite
```

### Kill Stuck Processes
```powershell
# Find process on port 8000 (Python)
netstat -ano | findstr :8000

# Kill it (replace <PID>)
taskkill /PID <PID> /F

# Find process on port 5173 (React)
netstat -ano | findstr :5173

# Kill it
taskkill /PID <PID> /F
```

---

## ?? Testing Commands

### Health Checks
```powershell
# Test Python server
curl http://localhost:8000/health

# Test React server
curl http://localhost:5173
```

### API Testing
```powershell
# Codette status
curl http://localhost:8000/codette/status

# Upload file
curl -X POST http://localhost:8000/codette/upload -F "file=@test.wav" -F "user_id=test"

# Get files
curl http://localhost:8000/codette/files/test

# Chat with Codette
curl -X POST http://localhost:8000/codette/chat -H "Content-Type: application/json" -d "{\"message\": \"Hello Codette\"}"
```

---

## ?? Uvicorn Logging Options

```powershell
# Debug level (most verbose)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level debug

# Info level (default, recommended)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level info

# Warning level (less verbose)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level warning

# Error level (minimal)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level error

# Disable access logs (cleaner output)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --no-access-log

# Auto-reload on code changes
uvicorn codette_server_unified:app --reload

# Custom workers (production)
uvicorn codette_server_unified:app --workers 4
```

---

## ?? Diagnostic Commands

### Check Versions
```powershell
# Python version
python --version

# Node version
node --version

# npm version
npm --version

# Check if venv is active
python -c "import sys; print('venv active' if hasattr(sys, 'real_prefix') else 'not in venv')"
```

### Check Dependencies
```powershell
# List Python packages
pip list

# Check specific package
pip show fastapi

# List Node packages
npm list --depth=0

# Check for missing peer deps
npm list
```

### Verify Installation
```powershell
# Test Python imports
python -c "from pydantic import BaseModel; print('Pydantic OK')"
python -c "import fastapi; print('FastAPI OK')"
python -c "import numpy; print('NumPy OK')"

# Test Node modules
npm list fraction.js
npm list tailwindcss
npm list react
```

---

## ?? Common Workflows

### Fresh Start (Clean Everything)
```powershell
# 1. Stop all services
.\stop-all.ps1

# 2. Remove everything
Remove-Item -Recurse -Force venv, node_modules, dist, uploads

# 3. Reinstall
.\setup-first-time.ps1

# 4. Start
.\start-all.ps1
```

### Quick Fix (Dependencies Only)
```powershell
# 1. Run fix script
.\fix-dependencies.ps1

# 2. Restart
.\stop-all.ps1
.\start-all.ps1
```

### Development Mode
```powershell
# Terminal 1: Python with auto-reload
.\venv\Scripts\Activate.ps1
uvicorn codette_server_unified:app --reload --log-level debug

# Terminal 2: React dev server
npm run dev

# Terminal 3: Type checking
npm run typecheck -- --watch
```

### Production Build
```powershell
# 1. Build React
npm run build

# 2. Start Python server
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --workers 4

# 3. Serve React build
npm run preview
```

---

## ?? File Locations

```
Configuration Files:
??? package.json          # Node dependencies
??? requirements.txt      # Python dependencies
??? vite.config.ts       # Vite configuration
??? tsconfig.json        # TypeScript config
??? tailwind.config.js   # Tailwind config
??? postcss.config.js    # PostCSS config

Server Files:
??? codette_server_unified.py  # Main server
??? daw_core/                  # DSP engine
??? Codette/                   # AI engine

Build Output:
??? dist/                 # React production build
??? node_modules/         # Node packages
??? venv/                 # Python environment
??? uploads/              # User uploads

Scripts:
??? start-all.ps1        # Start everything
??? stop-all.ps1         # Stop everything
??? setup-first-time.ps1 # First-time setup
??? fix-dependencies.ps1 # Fix deps
```

---

## ?? URLs

```
React Dev Server:       http://localhost:5173
Python API Server:      http://localhost:8000
API Documentation:      http://localhost:8000/docs
Health Check:           http://localhost:8000/health
Codette Status:         http://localhost:8000/codette/status
```

---

## ?? Pro Tips

1. **Always activate venv** before running Python commands
2. **Use --legacy-peer-deps** if npm install fails
3. **Check logs** in separate terminal windows
4. **Clear caches** if dependencies seem corrupted
5. **Use uvicorn --reload** during development
6. **Check ports** if services won't start
7. **Read error messages** - they usually tell you what's wrong

---

## ?? Emergency Commands

```powershell
# Everything is broken - nuclear reset
Remove-Item -Recurse -Force venv, node_modules
.\setup-first-time.ps1

# Server won't stop - force kill
Get-Process | Where-Object {$_.ProcessName -like "*python*"} | Stop-Process -Force
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# Ports are stuck
netstat -ano | findstr :8000
netstat -ano | findstr :5173
# Then: taskkill /PID <PID> /F
```

---

*Quick reference for CoreLogic Studio v7.0.0*  
*Keep this handy for fast troubleshooting!*
