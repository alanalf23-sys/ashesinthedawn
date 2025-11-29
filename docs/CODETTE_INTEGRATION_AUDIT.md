# Codette AI Integration Audit

**Date**: November 28, 2025  
**Status**: ⚠️ PARTIALLY INTEGRATED - NEEDS FIX

---

## Current State

### Codette AI Files Found

| File | Location | Purpose | Status |
|------|----------|---------|--------|
| **codette_server.py** | Root | FastAPI server (2,420 lines) | ✅ Complete |
| **codette_training_data.py** | Root | Training data + context | ✅ Complete |
| **codette_analysis_module.py** | Root | Audio analysis module | ✅ Complete |
| **Codette/actions/actions.py** | Codette/actions | Action definitions | ✅ Present |
| **run_codette.py** | Root | Legacy runner | ✅ Present |
| **codette_daw_v***.py** | Root | DAW integration versions | ✅ Present (4 versions) |

### Configuration Issues Found

#### ❌ Issue 1: codette_server.py Defaults to Port 8000
**File**: `codette_server.py`, line ~2380
```python
port = int(os.getenv("CODETTE_PORT", "8000"))  # ← WRONG! Should be 8001
```

**Impact**: 
- Both DAW Core API and Codette Server try to use same port (8000)
- Collision causes one server to fail
- Codette server never actually starts

#### ❌ Issue 2: start_daw_backend.ps1 Only Launches DAW API
**File**: `start_daw_backend.ps1`
- Line 154-197: Only launches DAW Core API on port 8000
- Never launches Codette server on port 8001
- Script mentions "Codette AI Server" but doesn't execute it

#### ❌ Issue 3: codetteBridge.ts Points to Wrong Port
**File**: `src/lib/codetteBridge.ts`, line 16
```typescript
const CODETTE_API_BASE = import.meta.env.VITE_CODETTE_API || "http://localhost:8000";
// Should be: "http://localhost:8001"
```

**Impact**:
- Frontend tries to connect Codette API to DSP backend port
- Codette endpoints not available
- No AI recommendations work

---

## How It Should Work

### Architecture (Correct)
```
Frontend (React/TS)
    ↓
codetteBridge.ts (localhost:8001) ← Should connect HERE
    ↓
Codette AI Server (port 8001) ← Needs to run HERE
    - FastAPI with Codette engine
    - /codette/chat endpoint
    - /codette/suggest endpoint
    - /codette/analyze endpoint

DSP Backend (separate)
    ↓
dspBridge.ts (localhost:8000)
    ↓
DAW Core API (port 8000)
    - /effect/process endpoints
    - /automation endpoints
    - /metering endpoints
```

---

## Current Architecture (Broken)
```
Frontend tries:
    localhost:8001 → Not running!
    localhost:8000 → Wrong server (DSP API instead)
    
Only DSP API runs on 8000
Codette server doesn't run at all
```

---

## Codette Server Endpoints

The **codette_server.py** provides these FastAPI endpoints:

### Chat Endpoints
- `POST /codette/chat` - Chat with Codette AI
- `GET /health` - Server health check
- `GET /docs` - Swagger API docs
- `GET /openapi.json` - OpenAPI schema

### Suggestion Endpoints
- `POST /codette/suggest` - Get effect suggestions
- `POST /codette/analyze` - Analyze audio characteristics

### DAW Control Endpoints
- `POST /codette/daw/execute` - Execute DAW actions
- `POST /codette/daw/apply-suggestion` - Apply Codette suggestions
- `POST /codette/daw/status` - Get DAW status

### Transport Endpoints
- `POST /codette/transport/play` - Transport play
- `POST /codette/transport/stop` - Transport stop
- `GET /codette/transport/state` - Get transport state

---

## What Codette Provides

The `codette_server.py` integrates:

1. **BroaderPerspectiveEngine** (from Codette folder)
   - neuralnets perspective (ML-based analysis)
   - newtonian perspective (classical music theory)
   - davinci perspective (creative suggestions)
   - quantum perspective (experimental approaches)

2. **Audio Analysis** (codette_analysis_module.py)
   - Session analysis
   - Audio metric computation
   - Confidence scoring

3. **Training Data** (codette_training_data.py)
   - Musical context
   - Effect recommendations
   - Parameter suggestions

---

## Solution Required

### Fix 1: Update codette_server.py Default Port
```python
# Line ~2380 - CHANGE FROM:
port = int(os.getenv("CODETTE_PORT", "8000"))

# TO:
port = int(os.getenv("CODETTE_PORT", "8001"))
```

### Fix 2: Update start_daw_backend.ps1 to Launch Both
- Add Codette server launch (port 8001)
- Run both servers concurrently
- Add health checks for both ports

### Fix 3: Update codetteBridge.ts Port
```typescript
// Line 16 - CHANGE FROM:
const CODETTE_API_BASE = import.meta.env.VITE_CODETTE_API || "http://localhost:8000";

// TO:
const CODETTE_API_BASE = import.meta.env.VITE_CODETTE_API || "http://localhost:8001";
```

### Fix 4: Add Environment Variable
- `.env`: `VITE_CODETTE_API_URL=http://localhost:8001`

---

## Manual Startup (Until Fixed)

### Terminal 1: DAW Core API
```bash
python -m uvicorn daw_core.api:app --host 127.0.0.1 --port 8000
```

### Terminal 2: Codette AI Server
```bash
python codette_server.py
# Or manually:
python -m uvicorn codette_server:app --host 127.0.0.1 --port 8001
```

---

## Verification

After fixes, verify:

```bash
# Check DAW API
curl http://localhost:8000/health

# Check Codette Server
curl http://localhost:8001/health

# Check Frontend Connection
# Browser console: 
import { getCodetteBridge } from './lib/codetteBridge';
const bridge = getCodetteBridge();
await bridge.healthCheck();  // Should return true
```

---

## Summary

| Component | Current | Should Be | Status |
|-----------|---------|-----------|--------|
| codette_server.py Port | 8000 | 8001 | ❌ Wrong |
| Launcher Script | DAW only | Both servers | ❌ Incomplete |
| Frontend Config | 8000 | 8001 | ❌ Wrong |
| Codette Endpoints | Defined ✓ | Available | ❌ Not running |

**Overall Status**: 🔴 **BROKEN - Codette server never launches, frontend can't connect**

---

## Recommendation

I can fix all 3 issues in ~5 minutes:
1. Update codette_server.py default port to 8001
2. Update start_daw_backend.ps1 to launch both servers
3. Update codetteBridge.ts to use port 8001

Should I proceed with these fixes?
