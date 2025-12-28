# ?? Complete Dependency Installation Guide

## CoreLogic Studio v7.0.0
**Status:** Complete installation instructions for Python (pip) and Node.js (npm)

---

## ? Quick Install (Recommended)

### One-Command Installation (Windows PowerShell)
```powershell
# Full setup: Python + Node dependencies
.\setup-first-time.ps1
```

### One-Command Installation (macOS/Linux)
```bash
# Full setup: Python + Node dependencies
./setup-first-time.sh
```

---

## ?? Manual Installation (Step-by-Step)

### Step 1: Python Dependencies

#### 1a. Create Virtual Environment
```powershell
# Windows
python -m venv venv
.\venv\Scripts\Activate.ps1

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 1b. Install Python Packages
```powershell
# Upgrade pip first
python -m pip install --upgrade pip setuptools wheel

# Install from requirements.txt
pip install -r requirements.txt

# Verify installation
pip list
```

#### 1c. Install Codette-Specific Dependencies (Optional)
```powershell
# If you have Codette requirements
pip install -r Codette/requirements.txt
```

### Step 2: Node.js Dependencies

#### 2a. Install npm Packages
```powershell
# Standard installation
npm install

# If you get peer dependency warnings, use legacy mode
npm install --legacy-peer-deps

# Or force installation
npm install --force
```

#### 2b. Fix Tailwind/PostCSS Issues (If Needed)
```powershell
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall with legacy peer deps
npm install --legacy-peer-deps
```

---

## ?? What Gets Installed

### Python Packages (39 total)
| Package | Version | Purpose |
|---------|---------|---------|
| **fastapi** | ^0.104 | Web framework |
| **uvicorn** | ^0.24 | ASGI server |
| **pydantic** | ^2.5 | Data validation |
| **numpy** | ^1.24 | Numerical computing |
| **scipy** | ^1.12 | Scientific computing |
| **librosa** | ^0.10 | Audio processing |
| **soundfile** | ^0.12 | WAV/FLAC I/O |
| **python-multipart** | ^0.0.6 | File uploads |
| **aiofiles** | ^23.2 | Async file operations |
| **supabase** | ^2.4 | Supabase client |
| **python-dotenv** | ^1.0 | Environment config |
| **openai** | ^1.3 | OpenAI API |
| **transformers** | ^4.35 | HuggingFace models |
| **torch** | ^2.1 | PyTorch (ML) |
| **tensorboard** | ^2.15 | ML monitoring |
| **pytest** | ^7.4 | Testing framework |
| **black** | ^23.12 | Code formatter |
| **flake8** | ^6.1 | Linter |
| **mypy** | ^1.7 | Type checker |

**See `requirements.txt` for complete list with exact versions**

### Node Packages (85 total)
| Package | Version | Purpose |
|---------|---------|---------|
| **react** | ^18.3.1 | UI framework |
| **react-dom** | ^18.3.1 | DOM rendering |
| **vite** | ^7.2.6 | Build tool |
| **typescript** | ^5.9.3 | Type system |
| **tailwindcss** | ^3.4.18 | CSS framework |
| **postcss** | ^8.4.35 | CSS processor |
| **autoprefixer** | ^10.4.22 | CSS vendor prefixes |
| **eslint** | ^9.39.1 | Linter |
| **lucide-react** | ^0.344.0 | Icons |
| **@supabase/supabase-js** | ^2.86.0 | Supabase JS client |

**See `package.json` for complete list with exact versions**

---

## ? Verification Checklist

### Verify Python Installation
```powershell
# Check Python version
python --version

# Check pip packages
pip list

# Verify key packages
pip show fastapi uvicorn pydantic numpy

# Run health check
python -c "import fastapi, uvicorn, pydantic, numpy; print('? All Python packages OK')"
```

### Verify Node Installation
```powershell
# Check Node version
node --version

# Check npm version
npm --version

# Check installed packages
npm list --depth=0

# Run build verification
npm run build

# Run type check
npm run typecheck
```

---

## ?? Start Services After Installation

### Start Python Backend
```powershell
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start Codette server
python codette_server_unified.py

# Or with uvicorn directly
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --reload
```

### Start React Frontend
```powershell
# In new terminal
npm run dev

# App opens at: http://localhost:5173
```

### Start All Services (Automated)
```powershell
# One-command startup
.\start-all.ps1
```

---

## ?? Troubleshooting

### Issue: "pip: command not found"
**Solution:**
```powershell
# Make sure Python is in PATH
python -m pip --version

# Or use full path
C:\Python3XX\Scripts\pip.exe install -r requirements.txt
```

### Issue: "npm ERR! code ERESOLVE"
**Solution:**
```powershell
npm install --legacy-peer-deps
# Or
npm install --force
```

### Issue: "Cannot find module 'fraction.js'"
**Solution:**
```powershell
npm cache clean --force
Remove-Item -Recurse -Force node_modules
npm install --legacy-peer-deps
```

### Issue: "Port 8000 already in use"
**Solution:**
```powershell
# Find process on port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID 12345 /F

# Or use different port
uvicorn codette_server_unified:app --port 8001
```

### Issue: "Virtual environment not activating"
**Solution:**
```powershell
# Recreate virtual environment
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## ?? System Requirements

### Minimum
- **Python:** 3.11+
- **Node:** 18+
- **RAM:** 4GB
- **Disk:** 2GB free space

### Recommended
- **Python:** 3.13+
- **Node:** 20+
- **RAM:** 8GB+
- **Disk:** 5GB free space
- **GPU:** NVIDIA (for ML features)

---

## ?? Installation Verification

### Full System Check
```powershell
# Run this script to verify everything
.\verify-installation.ps1

# Expected output:
# ? Python: 3.13.0
# ? Node: 20.10.0
# ? npm: 10.2.3
# ? venv: Active
# ? FastAPI: 0.104.1
# ? React: 18.3.1
# ? All dependencies installed
```

---

## ?? Next Steps

1. **Verify Installation:**
   ```powershell
   npm run typecheck
   python -m pytest Codette/tests/ -v
   ```

2. **Start Development:**
   ```powershell
   .\start-all.ps1
   ```

3. **Open Application:**
   ```
   http://localhost:5173
   ```

4. **Check Backend:**
   ```
   http://localhost:8000/docs
   ```

---

## ?? Need Help?

- **Python Issues:** See `requirements.txt` comments
- **Node Issues:** See `package.json` for versions
- **Build Errors:** Run `npm run typecheck` for TypeScript errors
- **Runtime Errors:** Check `.github/copilot-instructions.md`

---

## ?? Environment Variables

After installation, ensure `.env` is configured:

```env
# Backend
VITE_CODETTE_API=http://localhost:8000
VITE_DAW_API=http://localhost:8000

# Frontend
VITE_REACT_PORT=5173

# OpenAI (Optional)
OPENAI_API_KEY=sk-proj-...

# Supabase (Optional)
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

---

**Status:** ? All dependencies documented  
**Last Updated:** December 27, 2025  
**Version:** CoreLogic Studio 7.0.0
