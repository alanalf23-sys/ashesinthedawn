# ??? Project Navigation Guide

**Quick Reference for Finding Files and Documentation**

---

## ?? START HERE

```
???????????????????????????????????????
?   ?? GETTING STARTED               ?
?                                     ?
?   1. README_CORELOGIC.md           ?
?      ??> Project overview           ?
?                                     ?
?   2. QUICK_START.md                ?
?      ??> Get running in 5 minutes   ?
?                                     ?
?   3. docs/MASTER_INDEX.md          ?
?      ??> Complete documentation hub ?
???????????????????????????????????????
```

---

## ?? Folder Map

```
D:\HorizonCore\GitHub/
?
??? ?? Root Files (Essential)
?   ??? README_CORELOGIC.md       ? Start here!
?   ??? QUICK_START.md            ? Quick start guide
?   ??? BUILD_GUIDE.md            ? Build instructions
?   ??? CLEANUP_PLAN.md           ? Cleanup guide
?   ??? CLEANUP_COMPLETE.md       ? This session summary
?   ??? package.json              ? npm config
?   ??? vite.config.ts            ? Vite config (cache fixed)
?   ??? tsconfig.json             ? TypeScript config
?
??? ?? docs/ (PRIMARY DOCUMENTATION)
?   ??? MASTER_INDEX.md           ? Navigation hub ?
?   ??? DEVELOPMENT.md            ? Development guide
?   ??? INSTALLATION_GUIDE.md     ? Setup guide
?   ??? VU_METER_MASTER_INDEX.md  ? VU Meter docs
?   ??? CODETTE_INTEGRATION.md    ? Codette AI
?   ??? ... (30+ more organized docs)
?
??? ?? scripts/ (Automation)
?   ??? run-dev.bat               ? Start dev server (Windows)
?   ??? run-dev.ps1               ? Start dev server (PowerShell)
?   ??? cleanup-safe.ps1          ? Safe cleanup ?
?   ??? commit-vu-meter.ps1       ? VU Meter commit helper
?
??? ?? src/ (React/TypeScript Source)
?   ??? components/               ? UI components
?   ??? contexts/                 ? State management
?   ??? hooks/                    ? Custom React hooks
?   ??? lib/                      ? Utilities
?
??? ?? daw_core/ (Python DSP Backend)
?   ??? fx/                       ? 19 audio effects
?   ??? automation/               ? Automation framework
?   ??? README.md                 ? Backend docs
?
??? ?? Codette/ (Codette AI Engine)
?   ??? 200+ Python files         ? AI system
?   ??? docs/                     ? Codette docs
?
??? ?? public/ (Static Assets)
    ??? ... (images, fonts, etc.)
```

---

## ?? Find By Task

### "I want to start the app"
```
scripts/run-dev.bat
   ??> Right-click ? Run as administrator
```

### "I want to understand the project"
```
README_CORELOGIC.md
   ??> Complete project overview
```

### "I want to find documentation"
```
docs/MASTER_INDEX.md
   ??> Central documentation hub with all links
```

### "I want to clean up files"
```
scripts/cleanup-safe.ps1
   ??> Removes temporary files safely
```

### "I want to develop a feature"
```
docs/DEVELOPMENT.md
   ??> Development workflow and guidelines
```

### "I want to use VU Meters"
```
docs/VU_METER_MASTER_INDEX.md
   ??> Complete VU Meter documentation
```

### "I want to integrate Codette AI"
```
docs/CODETTE_INTEGRATION.md
   ??> Codette AI integration guide
```

### "I want to build for production"
```
BUILD_GUIDE.md
   ??> Production build instructions
```

---

## ?? Documentation Categories

### Getting Started
```
Root/
??? README_CORELOGIC.md
??? QUICK_START.md
??? BUILD_GUIDE.md
```

### Core Development
```
docs/
??? DEVELOPMENT.md
??? INSTALLATION_GUIDE.md
??? ARCHITECTURE.md
```

### Features
```
docs/
??? VU_METER_MASTER_INDEX.md
??? CODETTE_INTEGRATION.md
??? BACKEND_GUIDE.md
```

### Maintenance
```
Root/
??? CLEANUP_PLAN.md
??? CLEANUP_COMPLETE.md
??? .gitignore
```

---

## ?? Search Tips

### By File Extension
```powershell
# Find all markdown docs
Get-ChildItem -Recurse -Filter "*.md" | Select-Object Name, Directory

# Find all scripts
Get-ChildItem scripts/ -Filter "*.ps1" | Select-Object Name

# Find all TypeScript components
Get-ChildItem src/components/ -Filter "*.tsx" | Select-Object Name
```

### By Content
```powershell
# Search for "VU Meter" in all docs
Get-ChildItem docs/ -Filter "*.md" | Select-String "VU Meter"

# Search for "Codette" in all files
Get-ChildItem -Recurse -Include "*.md","*.ts","*.tsx" | Select-String "Codette"
```

---

## ?? Quick Actions

### Start Development
```powershell
cd D:\HorizonCore\GitHub
.\scripts\run-dev.bat
```

### Clean Project
```powershell
cd D:\HorizonCore\GitHub
.\scripts\cleanup-safe.ps1
```

### Check Documentation
```powershell
code docs/MASTER_INDEX.md
```

### Run Type Check
```powershell
npm run typecheck
```

### Build Production
```powershell
npm run build
```

---

## ?? Documentation Hierarchy

```
Level 1: Project Overview
??? README_CORELOGIC.md

Level 2: Quick Guides
??? QUICK_START.md
??? BUILD_GUIDE.md
??? CLEANUP_PLAN.md

Level 3: Master Index
??? docs/MASTER_INDEX.md
    ?
    ??? Core Documentation
    ?   ??? DEVELOPMENT.md
    ?   ??? INSTALLATION_GUIDE.md
    ?   ??? ARCHITECTURE.md
    ?
    ??? Feature Documentation
    ?   ??? VU_METER_MASTER_INDEX.md
    ?   ??? CODETTE_INTEGRATION.md
    ?   ??? BACKEND_GUIDE.md
    ?
    ??? Specialized Guides
        ??? VU_METER_README.md
        ??? CODETTE_QUICK_START.md
        ??? ... (30+ more docs)
```

---

## ?? Visual Structure

```
CoreLogic Studio
??? ?? Frontend (React + TypeScript)
?   ??? ??? Mixer Component
?   ??? ?? VU Meters (JSFX conversion)
?   ??? ??? Timeline + Transport
?   ??? ??? Sidebar + Browser
?
??? ?? Backend (Python DSP)
?   ??? ?? 19 Audio Effects
?   ??? ?? Automation Framework
?   ??? ?? Metering Tools
?
??? ?? Codette AI
?   ??? ?? Chat Interface
?   ??? ?? Audio Analysis
?   ??? ?? Smart Suggestions
?
??? ?? Documentation
    ??? ?? Master Index
    ??? ?? Quick Start Guides
    ??? ?? Developer Docs
```

---

## ? Keyboard Shortcuts (Coming Soon)

Development server shortcuts will be documented once the dev server runs successfully.

---

## ?? External Links

- **GitHub**: https://github.com/alanalf23-sys/ashesinthedawn
- **Node.js**: https://nodejs.org/
- **React Docs**: https://react.dev/
- **Vite Docs**: https://vitejs.dev/

---

## ?? Pro Tips

### Bookmark These Files
1. `docs/MASTER_INDEX.md` - Everything you need
2. `QUICK_START.md` - Common commands
3. `scripts/run-dev.bat` - One-click start

### Use VS Code
```powershell
# Open project in VS Code
code D:\HorizonCore\GitHub

# Open specific doc
code docs/MASTER_INDEX.md
```

### Search Documentation
```powershell
# Open VS Code and press Ctrl+Shift+F
# Search across all files
```

---

## ? Current Status

| Component | Location | Status |
|-----------|----------|--------|
| **Documentation** | `docs/` | ? Organized |
| **Scripts** | `scripts/` | ? Ready |
| **Source Code** | `src/` | ? Clean |
| **Backend** | `daw_core/` | ? Ready |
| **Codette AI** | `Codette/` | ? Ready |
| **Build** | Root | ? Working |

---

**Need Help?**
? Start at `docs/MASTER_INDEX.md`

**Want to Start Coding?**
? Run `.\scripts\run-dev.bat`

**Need to Clean Up?**
? Run `.\scripts\cleanup-safe.ps1`

---

**This guide is your map - use it to navigate the project!** ???
