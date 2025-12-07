# ?? CoreLogic Studio - Master Documentation Index

**Last Updated**: December 7, 2024  
**Status**: ? Cleaned and Organized  
**Version**: 8.0.0

---

## ?? START HERE

### For New Users
1. **QUICK_START.md** (root) - Get running in 5 minutes
2. **docs/INSTALLATION_GUIDE.md** - Complete setup instructions  
3. **BUILD_GUIDE.md** (root) - Building from source

### For Developers
1. **docs/DEVELOPMENT.md** - Development workflow
2. **.github/copilot-instructions.md** - AI assistant guidelines
3. **docs/ARCHITECTURE.md** - System architecture

---

## ?? Documentation Structure

### `/docs` - Main Documentation
**Primary documentation folder - use this for all references**

| Category | Key Files | Purpose |
|----------|-----------|---------|
| **Getting Started** | INSTALLATION_GUIDE.md | Initial setup |
| **Core Features** | DEVELOPMENT.md | Development docs |
| **VU Meters** | VU_METER_MASTER_INDEX.md | VU Meter integration hub |
| **Codette AI** | CODETTE_INTEGRATION.md | AI assistant documentation |
| **Backend** | BACKEND_GUIDE.md | Backend and DSP guides |

### `/scripts` - Automation Scripts

| Script | Purpose | How to Run |
|--------|---------|------------|
| `run-dev.bat` | Start dev server (Windows) | Right-click ? Run as admin |
| `run-dev.ps1` | Start dev server (PowerShell) | `.\scripts\run-dev.ps1` |
| `commit-vu-meter.ps1` | Commit VU Meter files | Already committed ? |

---

## ??? Folder Structure

### ? Active Folders (Use These)
| Folder | Purpose |
|--------|---------|
| `src/` | React/TypeScript source code |
| `docs/` | **Primary documentation** (use this) |
| `scripts/` | Automation scripts |
| `.github/` | GitHub configuration |
| `daw_core/` | Python DSP backend |
| `Codette/` | Codette AI engine |

### ?? Folders to Clean Up
| Folder | Issue | Action Needed |
|--------|-------|---------------|
| `doc/` | Duplicate of `docs/` | ? Remove |
| `ashesinthedawn-main/` | Old project copy | ? Remove |
| `npm instal/` | Typo folder | ? Remove |

---

## ?? Essential Files

### Root Directory
```
??? README.md              # Project overview
??? QUICK_START.md         # Quick start guide
??? BUILD_GUIDE.md         # Build instructions
??? package.json           # npm configuration
??? vite.config.ts         # Vite config (cacheDir fixed)
??? tsconfig.json          # TypeScript config
```

### Documentation
```
docs/
??? MASTER_INDEX.md        # THIS FILE - Navigation hub
??? DEVELOPMENT.md         # Development guide
??? INSTALLATION_GUIDE.md  # Setup guide
??? VU_METER_MASTER_INDEX.md  # VU Meter docs
??? CODETTE_INTEGRATION.md    # Codette AI guide
```

### Scripts
```
scripts/
??? run-dev.bat            # Windows dev server launcher
??? run-dev.ps1            # PowerShell dev server launcher
??? commit-vu-meter.ps1    # VU Meter commit helper
```

---

## ?? Finding Documentation

### By Topic

**Getting Started**
- `QUICK_START.md` (root)
- `docs/INSTALLATION_GUIDE.md`
- `BUILD_GUIDE.md` (root)

**VU Meters**
- `docs/VU_METER_README.md`
- `docs/VU_METER_INTEGRATION_COMPLETE.md`
- `docs/VU_METER_MASTER_INDEX.md` (navigation hub)

**Codette AI**
- `docs/CODETTE_QUICK_START.md`
- `docs/CODETTE_INTEGRATION.md`

**Development**
- `docs/DEVELOPMENT.md`
- `.github/copilot-instructions.md`

**Backend**
- `docs/BACKEND_GUIDE.md`
- `daw_core/README.md`

### By Task

| Task | File/Script |
|------|-------------|
| **Start dev server** | `scripts/run-dev.bat` |
| **Understand architecture** | `docs/DEVELOPMENT.md` |
| **Integrate Codette** | `docs/CODETTE_INTEGRATION.md` |
| **VU Meter setup** | `docs/VU_METER_README.md` |
| **Backend setup** | `docs/BACKEND_GUIDE.md` |

---

## ?? Cleanup Status

### ? Completed
- Created master index (this file)
- Identified 214+ duplicate files
- Documented folder structure
- Created cleanup plan

### ?? Pending
- Remove `doc/` folder
- Remove `ashesinthedawn-main/` folder
- Remove `npm instal/` folder
- Consolidate duplicate QUICK_START files
- Update .gitignore

---

## ?? Statistics

| Metric | Count |
|--------|-------|
| **Active docs** | ~35 files |
| **Duplicate docs** | 214+ files |
| **Scripts** | 3 files |
| **Core folders** | 6 folders |
| **Cleanup needed** | 3 folders |

---

## ?? Quick Links

- [Project README](../README.md)
- [Quick Start](../QUICK_START.md)
- [VU Meter Docs](./VU_METER_MASTER_INDEX.md)
- [Codette Integration](./CODETTE_INTEGRATION.md)
- [Development Guide](./DEVELOPMENT.md)

---

**Status**: ? **INDEX CREATED - CLEANUP IN PROGRESS**  
**Next Step**: Remove duplicate folders and consolidate files

