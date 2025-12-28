# ?? INSTALL ALL DEPENDENCIES - Complete Instructions

## **Quick Copy-Paste Installation Commands**

Follow the commands below to install all Python (pip) and Node.js (npm) dependencies for CoreLogic Studio.

---

## **OPTION 1: Automated Installation (Recommended)**

### Windows PowerShell
```powershell
# Open PowerShell in J:\ashesinthedawn directory

# Run the automated setup script
.\install-dependencies.ps1
```

This script will:
- ? Check Python 3.11+ and Node 18+
- ? Create virtual environment
- ? Install all Python packages via pip
- ? Install all Node packages via npm
- ? Verify installations
- ? Run TypeScript type checking

---

## **OPTION 2: Manual Installation (Step-by-Step)**

### **Step 1: Setup Python Virtual Environment**

```powershell
# Windows PowerShell
cd J:\ashesinthedawn

# Create virtual environment
python -m venv venv

# Activate virtual environment (IMPORTANT!)
.\venv\Scripts\Activate.ps1

# You should see (venv) in your prompt
```

**Mac/Linux:**
```bash
cd ~/ashesinthedawn
python3 -m venv venv
source venv/bin/activate
```

### **Step 2: Install Python Packages (pip)**

```powershell
# Upgrade pip, setuptools, wheel first
python -m pip install --upgrade pip setuptools wheel

# Install all requirements
pip install -r requirements.txt

# OPTIONAL: Install Codette-specific requirements
pip install -r Codette/requirements.txt
```

**Verify Python installation:**
```powershell
pip list  # Shows all installed packages
pip show fastapi uvicorn pydantic numpy  # Check key packages
```

### **Step 3: Install Node.js Packages (npm)**

```powershell
# Clear npm cache (if you had issues before)
npm cache clean --force

# Install dependencies with legacy peer deps
npm install --legacy-peer-deps

# Alternative if above doesn't work
npm install --force
```

**Verify Node installation:**
```powershell
npm list --depth=0  # Shows all installed packages
npm list react vite typescript  # Check key packages
```

### **Step 4: Verify Everything**

```powershell
# TypeScript type checking
npm run typecheck

# Build verification
npm run build

# Should complete without major errors
```

---

## **OPTION 3: Complete Fresh Installation (Nuclear Option)**

If you have issues, completely remove and reinstall everything:

```powershell
# Remove old installations
Remove-Item -Recurse -Force venv
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Create fresh virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install all Python packages
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# Install all Node packages
npm cache clean --force
npm install --legacy-peer-deps
```

---

## **?? What Gets Installed**

### **Python Packages (39 total)**
Core packages installed via `pip install -r requirements.txt`:

```
? fastapi>=0.95                    # Web framework
? uvicorn[standard]>=0.21          # ASGI server
? pydantic>=2.6.0                  # Data validation
? numpy>=1.23                      # Numerical computing
? scipy>=1.9                       # Scientific computing
? pandas>=1.5                      # Data structures
? sounddevice>=0.4                 # Audio I/O
? soundfile>=0.12                  # WAV/FLAC files
? supabase>=1.0                    # Database client
? transformers>=4.30               # NLP models
? torch>=1.13                      # ML framework
? openai                           # OpenAI API
? pytest>=8.2                      # Testing framework
? black>=23.0                      # Code formatter
? mypy>=1.0                        # Type checker
... and 24 more packages
```

See `requirements.txt` for complete list with exact versions.

### **Node Packages (85+ total)**
Core packages installed via `npm install`:

```
? react@18.3.1                     # UI framework
? react-dom@18.3.1                 # DOM rendering
? vite@7.2.6                       # Build tool
? typescript@5.9.3                 # Type system
? tailwindcss@3.4.18               # CSS framework
? @supabase/supabase-js@2.86.0    # Database client
? lucide-react@0.344.0             # Icons
? eslint@9.39.1                    # Linter
? postcss@8.4.35                   # CSS processor
? autoprefixer@10.4.22             # CSS vendor prefixes
... and 75+ more packages
```

See `package.json` for complete list with exact versions.

---

## **?? Troubleshooting**

### **Issue 1: "Python command not found"**
```powershell
# Make sure Python is in PATH
# Option A: Use full path
C:\Users\YourUser\AppData\Local\Programs\Python\Python313\python.exe -m venv venv

# Option B: Reinstall Python and check "Add Python to PATH" during installation
# Option C: Check Python installation
py --version  # Alternative Python launcher
```

### **Issue 2: "Virtual environment not activating"**
```powershell
# Make sure you're in the right directory
cd J:\ashesinthedawn

# Check if venv exists
dir venv

# Activate it
.\venv\Scripts\Activate.ps1

# You should see (venv) in your prompt like this:
# (venv) PS J:\ashesinthedawn>
```

### **Issue 3: "npm ERR! code ERESOLVE"**
```powershell
# Use legacy peer dependencies
npm install --legacy-peer-deps

# Or force installation
npm install --force
```

### **Issue 4: "Cannot find module 'fraction.js'"**
```powershell
# Clean everything and reinstall
npm cache clean --force
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install --legacy-peer-deps
```

### **Issue 5: "Port 8000 already in use"**
```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace 12345 with actual PID)
taskkill /PID 12345 /F

# Or use a different port
uvicorn codette_server_unified:app --port 8001
```

---

## **? Verification Checklist**

After installation, verify everything works:

```powershell
# ========== PYTHON VERIFICATION ==========

# Check Python version (should be 3.11+)
python --version

# Check virtual environment is active (should show (venv))
# Look at your PowerShell prompt

# Check pip version
pip --version

# List all installed Python packages
pip list

# Verify key packages
pip show fastapi
pip show uvicorn
pip show pydantic
pip show numpy

# Test Python imports
python -c "import fastapi, uvicorn, pydantic, numpy; print('? Python OK')"


# ========== NODE VERIFICATION ==========

# Check Node version (should be 18+)
node --version

# Check npm version
npm --version

# List all installed npm packages
npm list --depth=0

# Verify key packages
npm list react
npm list vite
npm list typescript

# Test TypeScript compilation
npm run typecheck

# Test build process
npm run build
```

---

## **?? Starting Services After Installation**

### **Start Backend (Python)**
```powershell
# Make sure venv is activated
.\venv\Scripts\Activate.ps1

# Start Codette server
python codette_server_unified.py

# You should see:
# INFO: Started server process [12345]
# INFO: Application startup complete.
```

### **Start Frontend (React) - In New Terminal**
```powershell
# Make sure you're in J:\ashesinthedawn

# Start dev server
npm run dev

# You should see:
#   VITE v7.2.6  ready in XXX ms
#   ?  Local:   http://localhost:5173/
```

### **Start Everything at Once**
```powershell
# Run automation script
.\start-all.ps1

# This opens two terminal windows automatically
```

---

## **?? Next Steps**

1. ? **Install dependencies** (this guide)
2. ?? **Start services** (see above)
3. ?? **Open browser** ? http://localhost:5173
4. ?? **Read START_HERE.md** for quick start
5. ??? **Read .github/copilot-instructions.md** for architecture

---

## **?? Support Resources**

- **Python Issues:** See `requirements.txt` comments
- **Node Issues:** See `package.json` for package versions
- **Build Errors:** Run `npm run typecheck` to check TypeScript
- **Runtime Errors:** Check browser console (F12) and backend logs
- **Architecture:** Read `.github/copilot-instructions.md`

---

## **?? Saving Disk Space**

If you need to save disk space, you can remove some optional packages:

```powershell
# These are OPTIONAL (only needed for advanced features):
pip uninstall torch transformers qiskit pymc pytensor arviz

# Core packages you NEED:
# - fastapi, uvicorn, pydantic, numpy, sounddevice, soundfile, supabase, openai
```

---

**Status:** ? All dependencies documented and ready to install  
**Last Updated:** December 27, 2025  
**Version:** CoreLogic Studio 7.0.0  
**Total Disk Space Needed:** ~3-4 GB (Python) + ~500 MB (Node)
