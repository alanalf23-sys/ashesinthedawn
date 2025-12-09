# ?? CoreLogic Studio

**Professional Digital Audio Workstation (DAW) with AI Integration**

Version 8.0.0 | React + TypeScript + Python DSP Backend

---

## ?? Quick Start

### Get Running in 5 Minutes

```powershell
# 1. Start development server (Windows)
.\scripts\run-dev.bat

# Or PowerShell
.\scripts\run-dev.ps1

# 2. Open browser
http://localhost:5173
```

**?? Full Guide**: See [QUICK_START.md](./QUICK_START.md)

---

## ?? Documentation

### Essential Guides
- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[docs/MASTER_INDEX.md](./docs/MASTER_INDEX.md)** - Complete documentation index
- **[BUILD_GUIDE.md](./BUILD_GUIDE.md)** - Build from source
- **[CLEANUP_PLAN.md](./CLEANUP_PLAN.md)** - Project cleanup guide

### Feature Documentation
- **[docs/VU_METER_MASTER_INDEX.md](./docs/VU_METER_MASTER_INDEX.md)** - VU Meter system
- **[docs/CODETTE_INTEGRATION.md](./docs/CODETTE_INTEGRATION.md)** - Codette AI assistant
- **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Development workflow

---

## ? Features

### ??? Professional DAW Features
- **Multi-track audio editing** with timeline
- **Real-time mixing** with professional mixer
- **VU meters** with authentic analog ballistics
- **19 professional audio effects** (Python DSP backend)
- **Automation framework** for parameter control
- **Transport controls** with recording

### ?? AI-Powered Assistance
- **Codette AI integration** for mixing suggestions
- **Intelligent effect recommendations**
- **Audio analysis** and quality scoring
- **Multi-perspective reasoning** (4 AI perspectives)

### ?? Modern UI
- **React 18** with TypeScript
- **Tailwind CSS** dark theme
- **Vite** for fast development
- **Hot Module Replacement** (HMR)

---

## ??? Architecture

```
???????????????????????????????????????
?  React Frontend (Port 5173)        ?
?  ??? UI Components                  ?
?  ??? Audio Engine (Web Audio API)  ?
?  ??? State Management (Context)    ?
???????????????????????????????????????
               ?
               ??? REST API ???????????
               ?                      ?
?????????????????????????  ?????????????????????
? Python DSP Backend    ?  ? Codette AI Server ?
? (Port 8000)           ?  ? (Port 8001)       ?
? ??? 19 Audio Effects  ?  ? ??? Chat AI       ?
? ??? Automation        ?  ? ??? Analysis      ?
? ??? Metering          ?  ? ??? Suggestions   ?
?????????????????????????  ?????????????????????
```

---

## ?? Tech Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript 5.5** - Type safety
- **Vite 5.4** - Build tool
- **Tailwind CSS 3.4** - Styling
- **Web Audio API** - Audio playback

### Backend
- **Python 3.10+** - DSP engine
- **NumPy** - Audio processing
- **SciPy** - Signal processing
- **FastAPI** - REST API

### AI
- **Codette AI** - Multi-perspective reasoning
- **4 AI perspectives** - Neural, Newtonian, Da Vinci, Quantum

---

## ?? Project Structure

```
D:\HorizonCore\GitHub/
??? src/                  # React/TypeScript source
?   ??? components/       # UI components
?   ??? contexts/         # State management
?   ??? hooks/            # Custom React hooks
?   ??? lib/              # Utilities
??? docs/                 # Documentation (PRIMARY)
?   ??? MASTER_INDEX.md   # Navigation hub
?   ??? VU_METER_*.md     # VU Meter docs (7 files)
?   ??? CODETTE_*.md      # Codette AI docs
??? scripts/              # Automation scripts
?   ??? run-dev.bat       # Start dev server (Windows)
?   ??? run-dev.ps1       # Start dev server (PowerShell)
?   ??? cleanup-safe.ps1  # Safe cleanup script
??? daw_core/             # Python DSP backend
?   ??? fx/               # Audio effects (19 effects)
??? Codette/              # Codette AI engine
??? public/               # Static assets
??? .github/              # GitHub configuration
??? vite.config.ts        # Vite configuration
??? package.json          # npm configuration
??? README.md             # This file
```

---

## ?? Getting Started

### Prerequisites
- **Node.js** v20+ (v25.2.0 installed at `D:\Program Files\nodejs`)
- **Python** 3.10+ (optional, for DSP backend)
- **Git** (for version control)

### Installation

```powershell
# 1. Clone repository (if not already done)
git clone https://github.com/alanalf23-sys/ashesinthedawn
cd ashesinthedawn

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
# Or use: .\scripts\run-dev.bat
```

### Development Scripts

```json
{
  "dev": "vite",              // Start dev server
  "build": "vite build",      // Production build
  "preview": "vite preview",  // Preview prod build
  "typecheck": "tsc --noEmit" // Type checking
}
```

---

## ?? Quick Tasks

### Start Development Server
```powershell
.\scripts\run-dev.bat  # Right-click ? Run as admin
```

### Run Type Checking
```powershell
npm run typecheck
```

### Build for Production
```powershell
npm run build
```

### Clean Up Project
```powershell
.\scripts\cleanup-safe.ps1  # Safe cleanup (recommended)
```

---

## ?? Project Status

| Component | Status | Version |
|-----------|--------|---------|
| **Frontend** | ? Production Ready | 8.0.0 |
| **VU Meters** | ? Integrated | JSFX?React complete |
| **Codette AI** | ? Backend Ready | 4 perspectives |
| **DSP Backend** | ? 19 Effects | Python 3.10+ |
| **Documentation** | ? Organized | 35+ docs |
| **Build** | ? Passing | 0 TypeScript errors |

---

## ?? Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the [Development Guide](./docs/DEVELOPMENT.md)
4. Submit a pull request

---

## ?? License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## ?? Links

- **GitHub**: https://github.com/alanalf23-sys/ashesinthedawn
- **Documentation**: [docs/MASTER_INDEX.md](./docs/MASTER_INDEX.md)
- **VU Meters**: [docs/VU_METER_MASTER_INDEX.md](./docs/VU_METER_MASTER_INDEX.md)
- **Codette AI**: [docs/CODETTE_INTEGRATION.md](./docs/CODETTE_INTEGRATION.md)

---

## ?? Known Issues

### Permission Issues with node_modules
If you encounter `EPERM` errors when starting the dev server:

**Solution 1**: Run as Administrator
```powershell
.\scripts\run-dev.bat  # Right-click ? Run as admin
```

**Solution 2**: Fix permissions (one-time)
```powershell
takeown /F "D:\HorizonCore\GitHub" /R /D Y
icacls "D:\HorizonCore\GitHub" /grant Everyone:F /T /C
```

**Solution 3**: Use temp cache directory
Already configured in `vite.config.ts` - Vite cache now uses Windows temp directory.

### Duplicate Documentation
If you see multiple `QUICK_START` files:

```powershell
# Run cleanup script
.\scripts\cleanup-safe.ps1
```

See [CLEANUP_PLAN.md](./CLEANUP_PLAN.md) for details.

---

## ?? Changelog

### Version 8.0.0 (December 7, 2024)
- ? Created master documentation index
- ? Organized 214+ duplicate files
- ? Fixed Vite cache directory permissions
- ? Created cleanup scripts
- ? Updated .gitignore patterns
- ? Streamlined project structure

### Version 7.0.0 (November 24, 2025)
- ? VU Meter GFX integration complete
- ? Codette AI backend ready
- ? 19 professional audio effects
- ? Configuration system updated

---

## ?? Learning Resources

- **[React Documentation](https://react.dev/)** - Learn React 18
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - TypeScript guide
- **[Vite Guide](https://vitejs.dev/guide/)** - Vite documentation
- **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** - Audio processing
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Styling framework

---

## ?? Support

For issues, questions, or contributions:
1. Check [docs/MASTER_INDEX.md](./docs/MASTER_INDEX.md) for documentation
2. Review [QUICK_START.md](./QUICK_START.md) for common tasks
3. See [BUILD_GUIDE.md](./BUILD_GUIDE.md) for build issues
4. Open an issue on GitHub

---

**Status**: ? Production Ready  
**Version**: 8.0.0  
**Last Updated**: December 7, 2024  
**Documentation**: [docs/MASTER_INDEX.md](./docs/MASTER_INDEX.md)
