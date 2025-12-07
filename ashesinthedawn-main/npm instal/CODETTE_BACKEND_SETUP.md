# Codette Backend Setup Guide

## Architecture Overview

CoreLogic Studio DAW now has **full bidirectional communication** with the Codette AI backend:

```
┌─────────────────────────────────────────────────────────┐
│         CoreLogic Studio (React Frontend)               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  AIPanel Component                                │  │
│  │  - Session Analysis                              │  │
│  │  - Mixing Intelligence                           │  │
│  │  - Routing Suggestions                           │  │
│  │  - Gain Staging Advice                           │  │
│  └───────────────────────────────────────────────────┘  │
│                        ↓                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Codette Bridge Service (HTTP Client)            │  │
│  │  - Real-time backend health checks               │  │
│  │  - Automatic retry logic (3 attempts)            │  │
│  │  - Analysis result caching                       │  │
│  │  - Timeout handling (10s default)                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
              HTTP/REST Communication
        ↓                                    ↓
    ┌───────────────────────────────────────────┐
    │  Codette Python Backend                  │
    │  Location: I:\Codette                   │
    │  ┌─────────────────────────────────────┐ │
    │  │ Flask Server (Port 5000)            │ │
    │  │ - /api/health - Backend health      │ │
    │  │ - /api/analyze/session - Session    │ │
    │  │ - /api/analyze/mixing - Mixing      │ │
    │  │ - /api/analyze/routing - Routing    │ │
    │  │ - /api/analyze/mastering - Master   │ │
    │  │ - /api/analyze/creative - Creative  │ │
    │  │ - /api/analyze/gain-staging - Gain  │ │
    │  │ - /api/analyze/stream - Real-time   │ │
    │  └─────────────────────────────────────┘ │
    │  ┌─────────────────────────────────────┐ │
    │  │ AI Core Engine                      │ │
    │  │ - codette.py (main AI)              │ │
    │  │ - ai_core_system.py (core logic)    │ │
    │  │ - codette_kernel.py (kernel ops)    │ │
    │  └─────────────────────────────────────┘ │
    └───────────────────────────────────────────┘
```

## Frontend Configuration

### Environment Variables (.env.local)

```env
# Codette Backend Connection
REACT_APP_AI_ENABLED=true
REACT_APP_CODETTE_BACKEND=http://localhost:5000
REACT_APP_CODETTE_TIMEOUT=10000
REACT_APP_CODETTE_RETRIES=3

# Feature Flags
REACT_APP_AI_SESSION_ANALYSIS=true
REACT_APP_AI_MIXING_SUGGESTIONS=true
REACT_APP_AI_ROUTING_SUGGESTIONS=true
REACT_APP_AI_GAIN_STAGING=true
REACT_APP_AI_REAL_TIME_ANALYSIS=true
```

### Starting the Frontend

```bash
cd i:\Packages\Codette\ashesinthedawn
npm run dev
# Opens on http://localhost:5173
```

## Backend Setup & Startup

### Prerequisites

- Python 3.8+
- Flask (`pip install flask`)
- Codette AI system (I:\Codette folder)

### Starting the Flask Backend

```bash
# Navigate to Codette folder
cd I:\Codette

# Activate virtual environment (if using one)
# .venv\Scripts\activate.ps1  (PowerShell)
# .venv\Scripts\activate  (Command Prompt)

# Start Flask server
python run_server.py
# Server will run on http://localhost:5000
```

## API Endpoints

### Health Check
```bash
GET http://localhost:5000/api/health
Response: { "success": true, "status": "healthy" }
```

### Session Analysis
```bash
POST http://localhost:5000/api/analyze/session
Body: {
  "trackCount": 5,
  "totalDuration": 120,
  "sampleRate": 48000,
  "trackMetrics": [
    {
      "trackId": "track-1",
      "name": "Kick",
      "type": "audio",
      "level": -12,
      "peak": -10,
      "plugins": ["EQ", "Compressor"]
    }
  ],
  "masterLevel": -6,
  "masterPeak": -3,
  "hasClipping": false
}
Response: {
  "id": "analysis-123",
  "type": "session",
  "prediction": "Session has good gain staging...",
  "confidence": 0.95,
  "actionItems": [...]
}
```

### Mixing Intelligence
```bash
POST http://localhost:5000/api/analyze/mixing
Body: {
  "trackType": "audio",
  "metrics": {
    "level": -12,
    "peak": -10,
    "plugins": ["EQ", "Compressor"]
  }
}
```

### Routing Suggestions
```bash
POST http://localhost:5000/api/analyze/routing
Body: {
  "trackCount": 5,
  "trackTypes": ["audio", "audio", "instrument", "aux", "master"],
  "hasAux": true
}
```

### Gain Staging Advice
```bash
POST http://localhost:5000/api/analyze/gain-staging
Body: {
  "tracks": [
    { "id": "track-1", "level": -12, "peak": -10 },
    { "id": "track-2", "level": -18, "peak": -15 }
  ]
}
```

### Real-time Streaming Analysis
```bash
POST http://localhost:5000/api/analyze/stream
Body: { session_context }
Response: Server-sent events (SSE) stream
```

## Frontend Integration Layer

### Codette Bridge Service (`src/lib/codetteBridgeService.ts`)

**Purpose**: HTTP client for communicating with Codette Python backend

**Key Methods**:

```typescript
// Check if backend is running
isConnected(): boolean

// Full session analysis
async analyzeSession(context): Promise<CodettePrediction>

// Get mixing suggestions for a track type
async getMixingIntelligence(trackType, metrics): Promise<CodettePrediction>

// Get routing recommendations
async getRoutingIntelligence(context): Promise<CodettePrediction>

// Get mastering recommendations
async getMasteringIntelligence(levels): Promise<CodettePrediction>

// Get creative suggestions
async getCreativeIntelligence(context): Promise<CodettePrediction>

// Get gain staging advice
async getGainStagingAdvice(tracks): Promise<CodettePrediction>

// Stream real-time analysis
async *streamAnalysis(context): AsyncGenerator<CodettePrediction>
```

**Features**:
- Automatic retry logic (configurable, default 3 attempts)
- Request timeout handling (configurable, default 10s)
- Backend health checking (every 5s from UI)
- Analysis result caching
- Error handling with fallback to local processing

### AIPanel Component (`src/components/AIPanel.tsx`)

**Purpose**: UI for AI analysis and suggestions

**Features**:
- Four analysis tabs: Health, Mixing, Routing, Full Analysis
- Real-time backend connection status
- Confidence scoring on recommendations
- Actionable suggestion badges
- Automatic fallback to local AI when backend offline
- Load spinners during analysis

## Troubleshooting

### Backend Not Found
```
⚠️ Codette Backend unavailable, will use local processing
```
- Verify Flask server is running: `python run_server.py`
- Check REACT_APP_CODETTE_BACKEND in .env.local
- Ensure firewall allows localhost:5000

### Timeout Errors
- Increase REACT_APP_CODETTE_TIMEOUT (milliseconds)
- Check Codette backend performance
- Verify network connectivity

### Analysis Failures
- Check backend logs for errors
- Verify session context is valid
- Try smaller/simpler session first

### Connection Drops
- Backend auto-reconnects (retry logic)
- Check backend health: `curl http://localhost:5000/api/health`
- Restart Flask if needed

## Production Deployment

### Flask Backend (Production)
```bash
# Using Gunicorn for production
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run_server:app

# Or using Waitress
pip install waitress
waitress-serve --port=5000 run_server:app
```

### React Frontend (Production Build)
```bash
cd i:\Packages\Codette\ashesinthedawn
npm run build
# Output in dist/ folder
# Serve with any static HTTP server
npx serve dist
```

### Docker Deployment (Optional)
```dockerfile
# Backend Dockerfile
FROM python:3.9
WORKDIR /app
COPY I:\Codette .
RUN pip install -r requirements.txt
CMD ["python", "run_server.py"]

# Build: docker build -t codette-backend .
# Run: docker run -p 5000:5000 codette-backend
```

## Monitoring

### Frontend Monitoring
- Open DevTools (F12)
- Check Network tab for `/api/` requests
- Check Console for Codette logs (🌉, 🤖, 📡 prefixes)

### Backend Monitoring
- Check Flask console output
- Add logging: `python -u run_server.py`
- Monitor CPU/memory with Process Monitor

## Data Flow Example

### User clicks "Full Analysis" button:

1. **Frontend (AIPanel)**
   - Collects DAW state (tracks, volumes, plugins)
   - Constructs session context object
   - Shows loading spinner

2. **Bridge Service**
   - Creates HTTP POST to `/api/analyze/session`
   - Includes timeout and retry logic
   - Caches result for same context

3. **Backend (Flask)**
   - Receives session context
   - Calls Codette AI engine
   - Analyzes tracks, levels, routing
   - Returns structured prediction

4. **Frontend (AIPanel)**
   - Receives prediction
   - Displays in result card
   - Shows confidence score
   - Marks as actionable if recommendations exist

## Performance Tips

1. **Batch Analysis**: Analyze whole session rather than individual tracks
2. **Caching**: Same analysis requests return instant results
3. **Streaming**: Use `/api/analyze/stream` for long analyses
4. **Retries**: Configured to balance speed vs reliability
5. **Local Fallback**: Works offline with local AI (aiService.ts)

## Next Steps

1. Verify backend is running: `python I:\Codette\run_server.py`
2. Start frontend: `npm run dev`
3. Click ⚡ icon in sidebar to open AI panel
4. Switch to different analysis tabs to test
5. Monitor Console for 🌉 (bridge) and 📡 (API) messages
6. Check backend response in Network tab (DevTools)
