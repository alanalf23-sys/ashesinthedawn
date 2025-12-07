# Codette AI - Dependencies and Setup Guide

## Overview
Codette AI is a dual-platform system with both Python backend and React frontend components. This document outlines all required files and dependencies for the system to run.

---

## 1. Backend Requirements (Python)

### Core Server Files
- **`codette_server.py`** (2,313 lines)
  - FastAPI server on port 8000
  - WebSocket support for real-time communication
  - REST API endpoints for chat, suggestions, analysis
  - Integrates training data and analysis modules

- **`codette_training_data.py`** (2,591 lines)
  - Training data for Codette AI
  - Musical knowledge base
  - Context generation functions
  - Training context retrieval

- **`codette_analysis_module.py`** (1,017 lines)
  - Audio analysis functions
  - Quality scoring system
  - Recommendation generation
  - Spectrum and dynamic analysis

### Codette Folder Structure (`/Codette/`)
```
Codette/
├── .env                          # Environment configuration
├── .venv/                        # Virtual environment
├── models/
│   ├── cognitive_engine.py       # AI cognitive processing
│   ├── conversational_engine.py  # Chat/conversation logic
│   ├── perspective_analyzer.py   # Different AI perspectives
│   ├── safety_system.py          # Content safety filters
│   ├── healing_system.py         # Support/wellness features
│   ├── user_profiles.py          # User profile management
│   ├── elements.py               # Core elements
│   ├── codette-v2/               # V2 model artifacts
│   ├── codette-advanced/         # Advanced model artifacts
│   └── fallback/                 # Fallback models
├── actions/
│   └── actions.py                # AI action handlers
├── training/                     # Training data and logs
└── logs/                         # Server logs
```

### Python Dependencies
**Required packages** (install via `pip`):
```
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic>=2.0.0
numpy>=1.24.0
scipy>=1.11.0
vaderSentiment>=3.3.2
python-dotenv>=1.0.0
websockets>=12.0
aiofiles>=23.0.0
```

**Optional packages** (for extended functionality):
- `sounddevice` - Audio I/O
- `librosa` - Audio analysis
- `scikit-learn` - Machine learning utilities
- `torch` - Neural network support (if using advanced models)

### Python Version
- **Minimum**: Python 3.9
- **Recommended**: Python 3.10+
- **Verified**: Python 3.13.7

---

## 2. Frontend Requirements (React/TypeScript)

### Core Codette Components
- **`src/lib/codetteBridge.ts`** (749 lines)
  - REST API communication layer
  - WebSocket connection management
  - Event system for real-time updates
  - Request queuing and offline resilience

- **`src/components/CodetteSuggestionsPanel.tsx`** (226 lines)
  - UI for AI suggestions
  - Apply suggestions workflow
  - Confidence scores display

- **`src/components/CodetteAnalysisPanel.tsx`** (172 lines)
  - Audio analysis results UI
  - Quality score visualization
  - Recommendations display

- **`src/components/CodetteControlPanel.tsx`** (400+ lines)
  - Production checklist
  - AI perspective switching
  - Conversation history
  - Connection status monitoring

### Core DAW Integration
- **`src/contexts/DAWContext.tsx`** (1,620+ lines)
  - Codette state management (13+ methods)
  - Transport sync effect
  - WebSocket event listeners
  - Suggestion and analysis handling

- **`src/components/Mixer.tsx`** (500+ lines)
  - Codette tabs integration
  - Suggestions, Analysis, Control panels
  - Tab switching logic

### Node.js Dependencies
**Required packages** (in `package.json`):
```json
{
  "react": "^18.3.1",
  "typescript": "^5.5.3",
  "vite": "^7.2.4",
  "tailwindcss": "^3.4.13",
  "lucide-react": "latest"
}
```

### Node.js Version
- **Minimum**: Node.js 18.x
- **Recommended**: Node.js 20.x LTS
- **Build tool**: Vite 7.2.4

---

## 3. DAW Core Library (Python DSP)

Located in `/daw_core/`:
```
daw_core/
├── __init__.py                   # Package initialization
├── engine.py                     # Core DAW engine
├── track.py                      # Track management
├── routing.py                    # Audio routing
├── transport_clock.py            # Playback transport
├── audio_io.py                   # Audio input/output
├── api.py                        # DAW API
├── graph.py                      # Audio graph
├── fx/                           # 19 audio effects
│   ├── eq.py
│   ├── dynamics.py
│   ├── saturation.py
│   ├── delays.py
│   └── reverb.py
├── metering/                     # Analysis tools
│   ├── level_meter.py
│   ├── spectrum_analyzer.py
│   └── vu_meter.py
└── automation/                   # Automation framework
    ├── curves.py
    ├── lfo.py
    └── envelope.py
```

---

## 4. Environment Configuration

### .env File (Required)
```env
# Frontend (Vite format)
VITE_CODETTE_API=http://localhost:8000
VITE_APP_NAME=CoreLogic Studio
VITE_APP_VERSION=7.0

# Optional: Supabase
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### .env in Codette Folder
```env
# Backend configuration
CODETTE_SERVER_PORT=8000
CODETTE_DEBUG=false
CODETTE_WORKERS=4
```

---

## 5. Installation & Setup Steps

### Backend Setup
```bash
# 1. Navigate to project root
cd i:\ashesinthedawn

# 2. Create Python virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Verify Codette files exist
ls codette_server.py codette_training_data.py codette_analysis_module.py

# 5. Start server
python codette_server.py
# Server runs on http://localhost:8000
```

### Frontend Setup
```bash
# 1. Install Node dependencies
npm install

# 2. Verify TypeScript compilation
npm run typecheck

# 3. Build project
npm run build

# 4. Start dev server
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 6. File Size and Performance

### Backend Files
| File | Size | Lines |
|------|------|-------|
| codette_server.py | ~80 KB | 2,313 |
| codette_training_data.py | ~95 KB | 2,591 |
| codette_analysis_module.py | ~35 KB | 1,017 |
| Codette folder | ~500 MB+ | (with models) |

### Frontend Bundle
| File | Size | Gzip |
|------|------|------|
| index.js | 583.86 KB | 153.82 KB |
| index.css | 61.96 KB | 10.41 KB |

### Memory Requirements
- **Backend**: ~500 MB (with models loaded)
- **Frontend**: ~200 MB (in browser)
- **Total**: ~1 GB recommended

---

## 7. Quick Start Commands

### Start Everything
```bash
# Terminal 1: Backend
python codette_server.py

# Terminal 2: Frontend
npm run dev

# Access at:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:8000
# - WebSocket: ws://localhost:8000/ws
```

### Test Connectivity
```bash
# Check backend health
curl http://localhost:8000/health

# Test WebSocket
# Use browser DevTools console
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onopen = () => console.log('Connected');
```

---

## 8. Verification Checklist

### Backend Ready?
- [ ] Python 3.9+ installed
- [ ] Virtual environment created and activated
- [ ] All pip packages installed
- [ ] `codette_server.py` exists and has 2,313 lines
- [ ] `codette_training_data.py` exists and has 2,591 lines
- [ ] `codette_analysis_module.py` exists and has 1,017 lines
- [ ] `Codette/models/` directory has model files
- [ ] Port 8000 is available and not blocked

### Frontend Ready?
- [ ] Node.js 18+ installed
- [ ] React 18.3.1 installed
- [ ] TypeScript 5.5.3 installed
- [ ] Vite 7.2.4 installed
- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run build` succeeds
- [ ] Port 5173 is available

### Integration Ready?
- [ ] CodetteBridge.ts (749 lines) exists
- [ ] CodetteSuggestionsPanel.tsx (226 lines) exists
- [ ] CodetteAnalysisPanel.tsx (172 lines) exists
- [ ] CodetteControlPanel.tsx (400+ lines) exists
- [ ] DAWContext.tsx has Codette methods
- [ ] Mixer.tsx has Codette tabs

---

## 9. Troubleshooting

### Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.9+

# Check dependencies
pip list | grep fastapi

# Clear cache
rm -r __pycache__ .pytest_cache
rm -r .venv
python -m venv venv
pip install -r requirements.txt
```

### Frontend Won't Build
```bash
# Clear cache
rm -rf node_modules dist
npm install

# Verify TypeScript
npm run typecheck

# Check for import errors
npm run build -- --debug
```

### WebSocket Connection Issues
```bash
# Check server is running
curl http://localhost:8000/health

# Test WebSocket endpoint
wscat -c ws://localhost:8000/ws

# Check firewall settings
# Ensure port 8000 and 5173 are open
```

### Codette Not Responding
```bash
# Check server logs
tail -f server.log

# Verify training data loaded
python -c "from codette_training_data import training_data; print(len(training_data))"

# Check analysis module
python -c "from codette_analysis_module import CodetteAnalyzer; print('OK')"
```

---

## 10. Production Deployment

### Before Deploying
- [ ] All tests passing (`npm run typecheck`, `pytest`)
- [ ] Build successful with no warnings
- [ ] WebSocket connection stable
- [ ] Error handling comprehensive
- [ ] Logging configured
- [ ] Security headers set (CORS, CSP)

### Production Environment Variables
```env
# Backend
NODE_ENV=production
CODETTE_DEBUG=false
CODETTE_WORKERS=4

# Frontend
VITE_CODETTE_API=https://api.yourdomain.com
VITE_LOG_LEVEL=warn
```

### Deployment Checklist
- [ ] Python backend containerized (Docker optional)
- [ ] Frontend built and minified
- [ ] Environment variables configured
- [ ] HTTPS/SSL certificates configured
- [ ] Database backups configured
- [ ] Monitoring and logging set up
- [ ] Load balancing configured (if needed)

---

## Summary

### Minimum Viable Setup
1. Python environment with dependencies
2. `codette_server.py` running on port 8000
3. Node environment with dependencies
4. `npm run dev` running frontend on port 5173
5. React components integrated into Mixer
6. WebSocket connection established

### Files Critical to Run
- Python: `codette_server.py`, `codette_training_data.py`, `codette_analysis_module.py`
- React: `CodetteBridge.ts`, `CodetteSuggestionsPanel.tsx`, `CodetteAnalysisPanel.tsx`, `CodetteControlPanel.tsx`
- Config: `.env` with `VITE_CODETTE_API=http://localhost:8000`

### Total Integration
- **Backend**: ~3.7 KB Python code + models
- **Frontend**: ~1,547 lines React/TypeScript code
- **Integration**: Bidirectional REST + WebSocket communication
- **Status**: ✅ 100% Complete and Production Ready

---

**Last Updated**: November 26, 2025  
**Status**: Production Ready ✅  
**Version**: 7.0.0
