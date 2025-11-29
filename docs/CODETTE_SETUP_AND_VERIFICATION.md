# Codette AI Integration - Complete Setup & Verification Guide

**Status**: ✅ Integration Complete & Fixed (November 28, 2025)  
**Last Update**: Post-fix verification documentation  
**Version**: 2.0

## Quick Summary

Codette AI is **fully integrated** with CoreLogic Studio DAW and is now **properly configured**. Two critical configuration issues have been fixed:

1. ✅ **codette_server.py**: Port corrected from 8000 → 8001
2. ✅ **codetteBridge.ts**: Endpoint updated to localhost:8001

The system now properly separates:
- **Port 8000**: DAW Core API (DSP processing)
- **Port 8001**: Codette AI Server (AI suggestions & analysis)

## Architecture Overview

### Dual-Server Architecture

```
┌─────────────────────────────────────────────────────────┐
│              React Frontend (Port 5173)                 │
│  ┌─────────────────┬──────────────────────┐             │
│  │  codetteBridge  │    dspBridge        │             │
│  └────────┬────────┴──────────┬───────────┘             │
└───────────┼─────────────────────┼──────────────────────┘
            │                     │
            ↓                     ↓
    ┌───────────────┐     ┌─────────────────┐
    │ Codette AI    │     │  DAW Core API   │
    │ Server        │     │  (DSP Effects)  │
    │ Port 8001     │     │  Port 8000      │
    │ ✅ FIXED      │     │  ✅ Working     │
    └───────────────┘     └─────────────────┘
```

### Component Integration

1. **Frontend Layer** (React TypeScript)
   - `codetteBridge.ts` (758 lines): REST client for Codette AI
   - `codetteAIDSP.ts` (407 lines): Orchestrates AI + DSP effects
   - `EffectControlsPanel.tsx`: UI for AI suggestions
   - `useEffectChain.ts`: React hook for effect management

2. **Codette AI Server** (Python FastAPI - Port 8001)
   - `codette_server.py` (2,420 lines): Main FastAPI application
   - `codette_training_data.py`: Training context & recommendations
   - `codette_analysis_module.py`: CodetteAnalyzer class
   - `Codette/actions/actions.py`: Action definitions
   - Supports 4 AI perspectives: neuralnets, newtonian, davinci, quantum

3. **DAW Core API** (Python FastAPI - Port 8000)
   - `daw_core/api.py`: DSP effect processing
   - 19 professional audio effects
   - Automation framework
   - Metering & analysis tools

## Port Configuration

### Verified Fixes

**File**: `codette_server.py` (Line 2380)
```python
# ✅ CORRECT
port = int(os.getenv("CODETTE_PORT", "8001"))
```

**File**: `src/lib/codetteBridge.ts` (Line 16)
```typescript
// ✅ CORRECT
const CODETTE_API_BASE = import.meta.env.VITE_CODETTE_API || "http://localhost:8001";
```

### Port Assignment

| Service | Port | Purpose |
|---------|------|---------|
| DAW Core API | 8000 | DSP effects, audio processing |
| Codette AI | 8001 | AI suggestions, audio analysis |
| React Frontend | 5173 | Web UI |

## Starting the Backend Services

### Option 1: Automated Launcher (Recommended)

```powershell
.\start_daw_backend.ps1
```

This PowerShell script now:
- ✅ Starts DAW Core API on port 8000
- ✅ Starts Codette AI Server on port 8001
- ✅ Monitors both processes
- ✅ Handles graceful shutdown on Ctrl+C
- ✅ Restarts failed servers automatically

**Output** (when successful):
```
====================================================================================
All servers running!
DAW Core API    : http://localhost:8000
Codette AI      : http://localhost:8001
API Docs        : http://localhost:8000/docs
====================================================================================
```

### Option 2: Manual Launch

**Terminal 1** - DAW Core API:
```powershell
python -m uvicorn daw_core.api:app --host 0.0.0.0 --port 8000 --log-level info
```

**Terminal 2** - Codette AI Server:
```powershell
python codette_server.py
# OR explicitly with uvicorn:
# python -m uvicorn codette_server:app --host 127.0.0.1 --port 8001
```

## Starting the Frontend

```bash
npm install                    # Install Node dependencies (one-time)
npm run dev                    # Start Vite dev server on port 5173
```

## Verification

### Quick Verification Script

```powershell
.\verify_codette_integration.ps1
```

This checks:
- ✅ Configuration files exist
- ✅ Port settings are correct (8001 for Codette)
- ✅ Frontend bridge configured correctly
- ✅ Both servers are running
- ✅ Endpoints are responding

### Manual Health Checks

**Check DAW Core API**:
```bash
curl http://localhost:8000/health
# Expected: {"status": "ok"}
```

**Check Codette AI Server**:
```bash
curl http://localhost:8001/health
# Expected: {"status": "ok"}
```

**View API Documentation**:
- DAW Core: http://localhost:8000/docs
- Codette AI: http://localhost:8001/docs

## Codette AI Features

### 4 AI Perspectives

1. **Neural Networks Perspective** (`neuralnets`)
   - Deep learning-based analysis
   - Complex pattern recognition
   - Optimal parameter combinations

2. **Newtonian Perspective** (`newtonian`)
   - Physics-based audio analysis
   - Mathematical signal processing
   - Frequency-domain optimization

3. **Da Vinci Perspective** (`davinci`)
   - Artistic/creative recommendations
   - Balanced, holistic approach
   - Aesthetic quality optimization

4. **Quantum Perspective** (`quantum`)
   - Probabilistic analysis
   - Multi-state signal evaluation
   - Alternative effect chains

### Available Endpoints

**Chat Interface**:
```
POST /codette/chat
Body: {"message": "...", "perspective": "davinci"}
Returns: {"response": "..."}
```

**Audio Suggestions**:
```
POST /codette/suggest
Body: {"trackData": [...], "effectType": "EQ"}
Returns: {"suggestions": [...], "perspective": "neuralnets"}
```

**Audio Analysis**:
```
POST /codette/analyze
Body: {"audio": [...], "sampleRate": 44100}
Returns: {"analysis": {...}, "recommendations": [...]}
```

**Effect Chain Execution**:
```
POST /codette/daw/execute
Body: {"trackId": "...", "effectChain": [...]}
Returns: {"result": {...}, "status": "success"}
```

**Transport Control**:
```
POST /codette/transport/play
POST /codette/transport/stop
POST /codette/transport/record
```

## Troubleshooting

### Servers Not Starting

**Symptom**: Connection refused on localhost:8001

**Check**:
1. Is port 8001 available?
   ```powershell
   netstat -ano | findstr :8001
   ```

2. Are Python dependencies installed?
   ```powershell
   pip install fastapi uvicorn numpy scipy
   ```

3. Is Python in PATH?
   ```powershell
   python --version
   ```

**Fix**: Run the verification script
```powershell
.\verify_codette_integration.ps1 -CheckServers $true
```

### Frontend Can't Connect to Codette

**Symptom**: Codette AI features don't load in browser

**Check**:
1. Verify Codette server is running on port 8001
2. Check browser console for CORS errors
3. Verify `codetteBridge.ts` has correct endpoint

**Fix**:
```typescript
// Verify in codetteBridge.ts line 16:
const CODETTE_API_BASE = import.meta.env.VITE_CODETTE_API || "http://localhost:8001";
```

### Port Already in Use

**Symptom**: "Address already in use" error

**Solution**: Change port via environment variable
```powershell
# For DAW Core API
$env:DAW_CORE_PORT = "8002"
python -m uvicorn daw_core.api:app --port 8002

# For Codette AI
$env:CODETTE_PORT = "8002"
python codette_server.py
```

Then update frontend bridge accordingly.

## Integration Points

### From React Components

```typescript
// Import the bridge
import { codetteBridge } from '../lib/codetteBridge';

// Get AI suggestions
const suggestions = await codetteBridge.getSuggestions({
  trackData: audioBuffer,
  effectType: 'EQ',
  perspective: 'davinci'
});

// Chat with Codette
const response = await codetteBridge.chat({
  message: 'Suggest an effect chain for warm vocals',
  perspective: 'newtonian'
});

// Analyze audio
const analysis = await codetteBridge.analyzeAudio({
  audio: audioBuffer,
  sampleRate: 44100
});
```

### From DSP Processing

```typescript
// In codetteAIDSP.ts
const optimalChain = await generateOptimalEffectChain(
  trackId,
  targetGenre: 'pop',
  perspective: 'davinci'
);

// Apply AI-tuned parameters
const result = await processEffectWithCodetteAI(
  trackId,
  effectId,
  inputSignal,
  perspective: 'neuralnets'
);
```

## Configuration Files Modified

| File | Change | Reason |
|------|--------|--------|
| `codette_server.py` (L2380) | Port 8000 → 8001 | Avoid conflict with DAW API |
| `codetteBridge.ts` (L16) | localhost:8000 → localhost:8001 | Connect to correct server |
| `start_daw_backend.ps1` | Added Codette launch | Enable both servers to run |

## Full Integration Checklist

- ✅ Codette server file exists (2,420 lines)
- ✅ Port configured correctly (8001)
- ✅ Frontend bridge updated (codetteBridge.ts)
- ✅ Launcher script updated (both servers)
- ✅ Training data available (codette_training_data.py)
- ✅ Analysis module ready (codette_analysis_module.py)
- ✅ Actions framework configured (Codette/actions/actions.py)
- ✅ 4 AI perspectives available (neuralnets, newtonian, davinci, quantum)
- ✅ 12+ API endpoints defined
- ✅ CORS configured for React frontend
- ✅ All TypeScript compiled (0 errors)

## Next Steps

1. **Verify Setup**:
   ```powershell
   .\verify_codette_integration.ps1
   ```

2. **Start Backend Services**:
   ```powershell
   .\start_daw_backend.ps1
   ```

3. **Start Frontend**:
   ```bash
   npm run dev
   ```

4. **Access Application**:
   - Navigate to: http://localhost:5173
   - Check browser console for connection status
   - Test Codette AI features in UI

5. **Monitor Servers**:
   - DAW API Docs: http://localhost:8000/docs
   - Codette Docs: http://localhost:8001/docs

## Support Documentation

For more details, see:
- `CODETTE_INTEGRATION_AUDIT.md` - Complete technical audit
- `daw_core/` - Python DSP backend
- `src/lib/` - Frontend integration code
- `codette_server.py` - Codette AI server implementation
