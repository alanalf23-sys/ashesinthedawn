# ? CoreLogic Studio - Quick Start Card

## ?? TL;DR

```powershell
# First time only
.\setup-first-time.ps1

# Every time
.\start-all.ps1

# Open browser
http://localhost:5173
```

---

## ?? Got Build Errors?

```powershell
# Fix dependencies
.\fix-dependencies.ps1

# Check system
.\diagnostics.ps1

# Try again
.\start-all.ps1
```

---

## ?? Common Commands

| Task | Command |
|------|---------|
| **First Setup** | `.\setup-first-time.ps1` |
| **Start All** | `.\start-all.ps1` |
| **Stop All** | `.\stop-all.ps1` |
| **Fix Deps** | `.\fix-dependencies.ps1` |
| **Diagnostics** | `.\diagnostics.ps1` |

---

## ?? URLs

| Service | URL |
|---------|-----|
| **React UI** | http://localhost:5173 |
| **Python API** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |
| **Health** | http://localhost:8000/health |

---

## ?? Error Quick Fixes

| Error | Fix |
|-------|-----|
| `Cannot find module 'fraction.js'` | `.\fix-dependencies.ps1` |
| `Port 8000 in use` | `.\stop-all.ps1` |
| `Python not found` | Install Python 3.11+ |
| `Node not found` | Install Node.js 18+ |
| `venv not found` | `.\setup-first-time.ps1` |

---

## ?? Manual Fixes

### Fix Node Dependencies
```powershell
Remove-Item -Recurse -Force node_modules
npm install --legacy-peer-deps
```

### Fix Python Dependencies
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt --force-reinstall
```

### Kill Stuck Process
```powershell
# Python server (port 8000)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# React server (port 5173)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## ?? Uvicorn Logging

```powershell
# Activate Python env
.\venv\Scripts\Activate.ps1

# Start with logging
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level info

# Debug mode
uvicorn codette_server_unified:app --reload --log-level debug
```

---

## ?? Test Your Setup

```powershell
# 1. Check system
.\diagnostics.ps1

# 2. Start servers
.\start-all.ps1

# 3. Test health
curl http://localhost:8000/health

# 4. Open browser
start http://localhost:5173
```

---

## ?? Documentation Files

| File | Purpose |
|------|---------|
| `START_HERE.md` | Main guide + troubleshooting |
| `COMMAND_REFERENCE.md` | All commands |
| `BUILD_ERROR_FIX.md` | Fix build errors |
| `QUICK_START.md` | Original quick start |

---

## ?? Emergency Reset

```powershell
# CAUTION: Deletes everything and reinstalls
Remove-Item -Recurse -Force venv, node_modules
.\setup-first-time.ps1
```

---

## ? Success Checklist

After setup, verify:

- [ ] ? Diagnostics pass: `.\diagnostics.ps1`
- [ ] ? React loads: http://localhost:5173
- [ ] ? API works: http://localhost:8000/health
- [ ] ? No errors in server windows

---

## ?? Pro Tips

1. Always run `.\diagnostics.ps1` before starting
2. Keep server windows open to see logs
3. Use `--legacy-peer-deps` if npm install fails
4. Check ports with `netstat -ano | findstr :PORT`
5. Read error messages - they tell you what's wrong!

---

## ?? Workflow

### Development
```powershell
# Terminal 1
.\venv\Scripts\Activate.ps1
uvicorn codette_server_unified:app --reload

# Terminal 2
npm run dev
```

### Production
```powershell
npm run build
uvicorn codette_server_unified:app --workers 4
```

---

## ?? Need Help?

1. Run diagnostics: `.\diagnostics.ps1`
2. Check `START_HERE.md` troubleshooting section
3. Look up command in `COMMAND_REFERENCE.md`
4. Check server logs in terminal windows

---

**CoreLogic Studio v7.0.0**  
*Sovereign DAW Engine - Ready to Rock! ??*
