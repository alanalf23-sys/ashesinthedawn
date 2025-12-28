# ?? DEPENDENCY INSTALLATION SUMMARY

**CoreLogic Studio v7.0.0** - Complete Installation Documentation

---

## ?? What This Document Contains

? **Three installation guides created:**
1. `INSTALL_DEPENDENCIES.md` - Detailed guide with troubleshooting
2. `QUICK_INSTALL.md` - Copy-paste commands and quick reference
3. `install-dependencies.ps1` - Automated installation script

---

## ? FASTEST INSTALLATION (3 Steps)

### Step 1: Create Virtual Environment
```powershell
cd J:\ashesinthedawn
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 2: Install Python Packages
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Install Node Packages
```powershell
npm install --legacy-peer-deps
```

**Done!** ??

---

## ?? What Gets Installed

### Python (via pip)
- **39 packages** including:
  - FastAPI, Uvicorn, Pydantic
  - NumPy, SciPy, Pandas
  - PyTorch, Transformers, OpenAI
  - Testing, linting, type checking tools

### Node.js (via npm)
- **85+ packages** including:
  - React 18, TypeScript, Vite
  - TailwindCSS, PostCSS
  - Supabase, Lucide icons
  - ESLint, Prettier formatting

---

## ?? START SERVICES AFTER INSTALLING

```powershell
# Terminal 1: Python Backend
.\venv\Scripts\Activate.ps1
python codette_server_unified.py

# Terminal 2: React Frontend (new terminal)
npm run dev

# Then open: http://localhost:5173
```

---

## ?? DOCUMENTATION FILES

| File | Purpose |
|------|---------|
| `INSTALL_DEPENDENCIES.md` | Complete installation guide with all details |
| `QUICK_INSTALL.md` | Quick copy-paste commands for fast setup |
| `install-dependencies.ps1` | Automated installation script |
| `START_HERE.md` | Quick start guide (already existed) |
| `QUICK_START.md` | Developer workflow guide |
| `.github/copilot-instructions.md` | Architecture rules and patterns |

---

## ? VERIFICATION AFTER INSTALL

```powershell
# Check Python
python --version  # Should be 3.11+
pip list

# Check Node
node --version    # Should be 18+
npm list --depth=0

# Verify TypeScript
npm run typecheck

# Run tests (optional)
pytest Codette/tests/ -v
```

---

## ?? COMMON ISSUES & FIXES

| Issue | Fix |
|-------|-----|
| Virtual env not activating | `.\venv\Scripts\Activate.ps1` in same directory |
| `pip: command not found` | Use `python -m pip` instead |
| npm peer dependency warnings | Use `npm install --legacy-peer-deps` |
| Port 8000 in use | `netstat -ano \| findstr :8000` then `taskkill /PID xxx /F` |
| Cannot find modules | Run `npm cache clean --force` then `npm install` |

---

## ?? REQUIREMENTS FILES

### Python Requirements
**File:** `requirements.txt`
- 39 packages for backend, DSP, AI, testing
- Install with: `pip install -r requirements.txt`

### Node Requirements  
**File:** `package.json`
- 85+ packages for React frontend
- Install with: `npm install --legacy-peer-deps`

### Optional Codette Requirements
**File:** `Codette/requirements.txt`
- Advanced Codette AI features
- Install with: `pip install -r Codette/requirements.txt`

---

## ?? SYSTEM REQUIREMENTS

### Minimum
- Python 3.11+
- Node.js 18+
- 4 GB RAM
- 3 GB disk space

### Recommended
- Python 3.13+
- Node.js 20+
- 8+ GB RAM
- 5 GB disk space
- NVIDIA GPU (for ML features)

---

## ?? QUICK REFERENCE

```powershell
# Setup virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install everything
pip install -r requirements.txt
npm install --legacy-peer-deps

# Start backend
python codette_server_unified.py

# Start frontend (new terminal)
npm run dev

# Open in browser
# http://localhost:5173

# Stop services
# Press Ctrl+C in each terminal
```

---

## ?? Next Steps

1. ? **Choose installation method:**
   - Automated: `.\install-dependencies.ps1`
   - Manual: Follow `QUICK_INSTALL.md`
   - Detailed: Read `INSTALL_DEPENDENCIES.md`

2. ?? **Run installation**
   - Creates virtual environment
   - Installs 39 Python packages
   - Installs 85+ Node packages
   - Verifies everything

3. ?? **Start services**
   - Python backend on port 8000
   - React frontend on port 5173

4. ?? **Open application**
   - Visit http://localhost:5173

---

## ?? Pro Tips

? **Use `--legacy-peer-deps`** to avoid npm warnings
? **Keep `.venv` activated** during development
? **Run `npm run typecheck`** before committing code
? **Check `.env` file** for configuration
? **Run `start-all.ps1`** to start everything automatically

---

## ?? Support

- **Detailed Guide:** `INSTALL_DEPENDENCIES.md`
- **Quick Commands:** `QUICK_INSTALL.md`
- **Automated Script:** `install-dependencies.ps1`
- **Architecture:** `.github/copilot-instructions.md`
- **Quick Start:** `START_HERE.md`

---

**Status:** ? Complete dependency installation system ready  
**Created:** December 27, 2025  
**CoreLogic Studio:** v7.0.0  
**Total Setup Time:** 5-10 minutes (first time), 30 seconds (daily start)
