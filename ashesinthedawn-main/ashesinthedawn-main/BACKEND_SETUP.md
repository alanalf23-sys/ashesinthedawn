# 🤖 Codette AI Backend Setup Guide

**Version**: 1.0  
**Last Updated**: November 22, 2025  
**Status**: Complete Integration

---

## Quick Start (30 seconds)

### For Windows PowerShell:
```powershell
# Terminal 1: Start React frontend
npm run dev

# Terminal 2: Start Codette backend
.\start_codette_server.ps1
```

### For Bash/Mac/Linux:
```bash
# Terminal 1: Start React frontend
npm run dev

# Terminal 2: Start Codette backend
python codette_server.py
```

Then visit `http://localhost:5173` and look for the Codette button! 💬

---

## Prerequisites

### Required
- ✅ Python 3.10+ (download from [python.org](https://www.python.org/downloads/))
- ✅ Node.js 18+ (for frontend)
- ✅ CoreLogic Studio project (this repo)
- ✅ Codette folder with AI files (should be present)

### Optional
- Optional: Docker (for containerized deployment)
- Optional: Virtual environment (recommended for isolation)

---

## Installation Steps

### Step 1: Verify Python Installation

```powershell
# Check Python version
python --version

# Should output Python 3.10 or higher
```

If you don't have Python 3.10+:
- Download from [python.org](https://www.python.org/downloads/)
- **IMPORTANT**: Check "Add Python to PATH" during installation

---

### Step 2: Install Backend Dependencies

All dependencies are automatically installed by the startup script. Alternatively, install manually:

```powershell
# Option A: Let the script install (recommended)
.\start_codette_server.ps1

# Option B: Manual installation
pip install fastapi uvicorn pydantic vaderSentiment nltk numpy scipy pymc sympy arviz
```

**What each package does:**
| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework for the API server |
| `uvicorn` | ASGI server to run FastAPI |
| `pydantic` | Data validation and models |
| `vaderSentiment` | Sentiment analysis for Codette |
| `nltk` | Natural Language Toolkit for text processing |
| `numpy` | Numerical computing for audio analysis |
| `scipy` | Scientific computing tools |
| `pymc` | Probabilistic modeling for Quantum perspective |
| `sympy` | Symbolic mathematics for Newtonian logic |
| `arviz` | Posterior analysis and visualization |

---

### Step 3: Configure Environment Variables

Create or update `.env.local` in the project root:

```dotenv
# Frontend Configuration (already set)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Codette AI Integration
VITE_CODETTE_API_URL=http://localhost:8000
VITE_CODETTE_API_KEY=optional_api_key
VITE_CODETTE_ENABLED=true
```

**Explanation:**
- `VITE_CODETTE_API_URL` - Where the frontend connects to backend (don't change unless running on different machine)
- `VITE_CODETTE_API_KEY` - Optional API key for authentication (can leave blank)
- `VITE_CODETTE_ENABLED` - Set to `false` to disable Codette integration

---

## Starting the Servers

### Option 1: Automated Script (Recommended) 🚀

**Windows PowerShell:**
```powershell
# Start backend server with automatic dependency installation
.\start_codette_server.ps1

# With custom port
.\start_codette_server.ps1 -Port 8001

# Debug mode (verbose output)
.\start_codette_server.ps1 -Debug
```

**Features:**
- ✅ Automatic Python version check
- ✅ Automatic dependency installation
- ✅ Checks for Codette files
- ✅ Environment variable setup
- ✅ Detailed status output
- ✅ Error handling

---

### Option 2: Manual Startup

**Windows PowerShell:**
```powershell
python codette_server.py
```

**Mac/Linux Bash:**
```bash
python3 codette_server.py
```

**With environment variables:**
```powershell
$env:CODETTE_PORT="8000"
$env:CODETTE_HOST="127.0.0.1"
python codette_server.py
```

---

### Option 3: Virtual Environment (Recommended for Development)

**Create virtual environment:**
```powershell
# Windows
python -m venv venv
.\venv\Scripts\Activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

**Install dependencies in venv:**
```powershell
pip install -r Codette/requirements.txt
```

**Start server:**
```powershell
python codette_server.py
```

---

## Verifying the Connection

### 1. Check Backend Health

In browser, visit:
```
http://localhost:8000/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "Codette AI Server",
  "codette_available": true
}
```

### 2. Check API Documentation

Visit:
```
http://localhost:8000/docs
```

You'll see interactive Swagger UI with all endpoints!

### 3. Check Frontend Connection

Visit:
```
http://localhost:5173
```

Look for the Codette indicator in the UI:
- 🟢 Green dot = Connected
- 🔴 Red dot = Disconnected

### 4. Test Chat

Click the Codette button and try sending a message. You should get an AI response!

---

## Troubleshooting

### Problem: "Python not found"

**Solution:**
- Install Python from [python.org](https://www.python.org/downloads/)
- Make sure "Add Python to PATH" is checked
- Restart PowerShell after installation
- Try: `python --version`

---

### Problem: "ModuleNotFoundError: No module named 'fastapi'"

**Solution:**
```powershell
# Install missing packages
pip install fastapi uvicorn pydantic

# Or reinstall all at once
pip install -r Codette/requirements.txt
```

---

### Problem: "Address already in use" (Port 8000 in use)

**Solution:**
```powershell
# Start on different port
.\start_codette_server.ps1 -Port 8001

# Then update .env.local:
# VITE_CODETTE_API_URL=http://localhost:8001
```

**Find what's using port 8000:**
```powershell
netstat -ano | findstr :8000
# Then kill that process (get PID from output)
taskkill /PID <PID> /F
```

---

### Problem: "Codette backend not available"

This is normal on first run. The server might still be starting.

**Solution:**
1. Wait 5-10 seconds after server starts
2. Refresh browser page
3. Check that `VITE_CODETTE_API_URL` is correct
4. Check server is actually running (see console)
5. Visit `http://localhost:8000/health` to confirm

---

### Problem: Frontend shows "Offline" but server is running

**Solution:**
```powershell
# Check CORS is working
curl -X GET http://localhost:8000/health

# Should return JSON response

# If not, restart server and check logs
```

---

### Problem: "Permission denied" when running script

**Solution:**
```powershell
# Allow script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then run the script
.\start_codette_server.ps1
```

---

### Problem: Server crashes immediately

**Solution:**
1. Run in debug mode to see error:
   ```powershell
   .\start_codette_server.ps1 -Debug
   ```

2. Check Codette folder exists:
   ```powershell
   ls Codette/codette.py
   ```

3. Check Python can import Codette:
   ```powershell
   python -c "from Codette.codette import Codette; print('OK')"
   ```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│    React Frontend (http://localhost:5173)       │
│  ┌───────────────────────────────────────────┐  │
│  │  CodettePanel Component                   │  │
│  │  - Chat interface                         │  │
│  │  - Perspective selector                   │  │
│  └─────────────────┬───────────────────────┘  │
└────────────────────┼──────────────────────────┘
                     │ HTTP/REST
                     │ (useCodette hook)
┌────────────────────▼──────────────────────────┐
│   Codette FastAPI Server (localhost:8000)     │
│  ┌───────────────────────────────────────────┐  │
│  │  POST /codette/chat                       │  │
│  │  POST /codette/analyze                    │  │
│  │  POST /codette/suggest                    │  │
│  │  POST /codette/process                    │  │
│  │  GET  /health                             │  │
│  └─────────────────┬───────────────────────┘  │
└────────────────────┼──────────────────────────┘
                     │ Python
                     │
┌────────────────────▼──────────────────────────┐
│   Codette AI Python Engine                    │
│  ┌───────────────────────────────────────────┐  │
│  │  Neural Networks Perspective              │  │
│  │  Newtonian Logic Perspective              │  │
│  │  Da Vinci Synthesis Perspective           │  │
│  │  Quantum Perspective                      │  │
│  └───────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

---

## API Endpoints

All endpoints require the backend server to be running.

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "Codette AI Server",
  "codette_available": true
}
```

---

### Chat with AI
```http
POST /codette/chat
Content-Type: application/json

{
  "message": "How should I EQ a vocal?",
  "perspective": "neuralnets"
}
```

Response:
```json
{
  "response": "[NeuralNet] Pattern analysis suggests...",
  "perspective": "neuralnets",
  "confidence": 0.85
}
```

---

### Audio Analysis
```http
POST /codette/analyze
Content-Type: application/json

{
  "trackId": "track-1",
  "audioData": [0.1, 0.2, ...],
  "sampleRate": 44100
}
```

Response:
```json
{
  "trackId": "track-1",
  "analysis": {
    "frequency_content": "balanced",
    "dynamic_range": "good"
  },
  "status": "success"
}
```

---

### Get Suggestions
```http
POST /codette/suggest
Content-Type: application/json

{
  "context": {
    "trackType": "vocal",
    "problem": "too bright"
  }
}
```

---

## Environment Reference

| Variable | Default | Purpose |
|----------|---------|---------|
| `CODETTE_PORT` | `8000` | Server port |
| `CODETTE_HOST` | `127.0.0.1` | Server host |
| `PYTHONUNBUFFERED` | `1` | Unbuffered output (debugging) |

---

## Frontend Integration

The frontend automatically connects via the `useCodette()` hook:

```typescript
import { useCodette } from '@/hooks/useCodette';

export function MyComponent() {
  const { sendMessage, isConnected } = useCodette();
  
  if (!isConnected) {
    return <div>Codette is offline</div>;
  }
  
  return (
    <button onClick={() => sendMessage("Hello Codette")}>
      Ask Codette
    </button>
  );
}
```

---

## Production Deployment

For production, consider:

1. **Use proper ASGI server:**
   ```powershell
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker codette_server:app
   ```

2. **Set environment variables:**
   ```powershell
   $env:VITE_CODETTE_API_URL="https://api.example.com"
   $env:VITE_CODETTE_ENABLED="true"
   ```

3. **Run with SSL:**
   ```powershell
   uvicorn codette_server:app --ssl-keyfile=key.pem --ssl-certfile=cert.pem
   ```

4. **Use Docker:**
   See `DOCKER_DEPLOYMENT.md` (if present)

---

## Performance Tips

- **Response Caching:** The integration layer caches responses for repeated requests
- **Audio Sampling:** Large audio files are sampled before analysis for efficiency
- **Connection Pooling:** FastAPI reuses connections automatically
- **Async Processing:** All requests are async for non-blocking I/O

---

## Support

If you encounter issues:

1. **Check logs:** Run with `-Debug` flag:
   ```powershell
   .\start_codette_server.ps1 -Debug
   ```

2. **Verify health:** Visit `http://localhost:8000/health`

3. **Check .env.local:** Ensure `VITE_CODETTE_API_URL` is set correctly

4. **Check dependencies:**
   ```powershell
   python -c "import fastapi, uvicorn, pydantic; print('OK')"
   ```

5. **View API docs:** Visit `http://localhost:8000/docs` for interactive API documentation

---

## File Reference

| File | Purpose |
|------|---------|
| `codette_server.py` | Main FastAPI server |
| `start_codette_server.ps1` | Startup script (Windows) |
| `Codette/codette.py` | Main Codette AI class |
| `.env.local` | Environment configuration |
| `src/lib/codettePythonIntegration.ts` | Frontend HTTP client |
| `src/hooks/useCodette.ts` | React hook integration |
| `src/components/CodettePanel.tsx` | UI component |

---

## Quick Reference

**Start everything:**
```powershell
# Terminal 1
npm run dev

# Terminal 2
.\start_codette_server.ps1
```

**Access points:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

**Common commands:**
```powershell
# Check health
curl http://localhost:8000/health

# Stop server
Ctrl+C (in server terminal)

# View logs
$error | Select -Last 5
```

---

## 🎉 You're All Set!

Your Codette AI backend is ready to enhance CoreLogic Studio with intelligent audio analysis and suggestions!

**Next Steps:**
1. ✅ Install dependencies
2. ✅ Start backend server
3. ✅ Start frontend dev server
4. ✅ Click Codette button in UI
5. ✅ Start chatting with AI!

