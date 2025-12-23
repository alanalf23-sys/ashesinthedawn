# ?? COMPLETE SOLUTION - File Upload & Timeline Integration

## ? What You Have Now

Your Codette server now has **3 fully functional file upload and timeline endpoints**:

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `POST /codette/upload` | Upload audio/MIDI/text files | ? Ready |
| `GET /codette/files/{user_id}` | Get user's file history | ? Ready |
| `POST /codette/timeline-context` | Analyze DAW timeline | ? Ready |

---

## ?? Troubleshooting Build Errors

### Error: "Cannot find module 'fraction.js'"

This is a common PostCSS/Tailwind dependency issue.

#### Quick Fix (Recommended)
```powershell
# Run the dependency fix script
.\fix-dependencies.ps1
```

#### Manual Fix
```powershell
# Clean everything
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Reinstall
npm install --legacy-peer-deps

# Verify
npm list fraction.js
```

#### If That Doesn't Work
```powershell
# Clear npm cache
npm cache clean --force

# Try fresh install
npm install --force
```

---

## ?? Quick Start (After Fix)

### First Time Setup
```powershell
# 1. Run complete setup (installs everything)
.\setup-first-time.ps1
```

### Daily Use
```powershell
# Start all services (Python + React)
.\start-all.ps1

# Then open: http://localhost:5173
```

### Stop Services
```powershell
# Stop all running services
.\stop-all.ps1
```

---

## ?? What Gets Installed

### Python Dependencies
- FastAPI (web server)
- Uvicorn (ASGI server)
- Pydantic (data validation)
- NumPy (audio processing)
- Supabase client
- OpenAI client
- DAW Core DSP effects

### Node Dependencies
- React 18 (UI framework)
- Vite (build tool)
- Tailwind CSS (styling)
- PostCSS (CSS processing)
- TypeScript (type safety)
- Lucide icons

---

## ?? Common Issues & Solutions

### Issue 1: "Cannot find module 'fraction.js'"
**Solution:** Run `.\fix-dependencies.ps1`

### Issue 2: Python server won't start
**Solution:**
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt --force-reinstall
```

### Issue 3: React build fails
**Solution:**
```powershell
npm cache clean --force
npm install --legacy-peer-deps
```

### Issue 4: Port 8000 already in use
**Solution:**
```powershell
# Find and kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Issue 5: Port 5173 already in use
**Solution:**
```powershell
# Find and kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

---

## ?? Test the Endpoints

Once server is running, test in another terminal:

```bash
# Test 1: Health check
curl http://localhost:8000/health

# Test 2: Upload a file
curl -X POST http://localhost:8000/codette/upload \
  -F "file=@test.wav" \
  -F "user_id=default"

# Test 3: Get user files
curl http://localhost:8000/codette/files/default

# Test 4: Analyze timeline
curl -X POST http://localhost:8000/codette/timeline-context \
  -H "Content-Type: application/json" \
  -d '{
    "tracks": [
      {"id": "1", "name": "Vocals", "type": "audio", "volume": -6}
    ],
    "transport": {"bpm": 120, "playing": false}
  }'
```

---

## ?? Server Logging

### Start with Uvicorn Logger
```powershell
# Activate Python environment
.\venv\Scripts\Activate.ps1

# Start with logging
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level info
```

### Log Levels
```powershell
# Debug (most verbose)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level debug

# Info (default)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level info

# Warning (less verbose)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level warning

# No access logs
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --no-access-log
```

---

## ? What Was Added to Server

### Three Endpoints
```python
POST /codette/upload              # File upload & analysis
GET /codette/files/{user_id}      # Get user's files
POST /codette/timeline-context    # Analyze timeline
```

### Seven Pydantic Models
```
FileAnalysisResult
FileUploadRequest
FileUploadResponse
TimelineTrack
TimelineTransport
TimelineContextRequest
TimelineContextResponse
```

### Features
? File validation (size, extension)  
? Audio file analysis (duration, channels, sample rate)  
? MIDI file analysis (tracks, events)  
? Text file analysis (preview, line count)  
? Per-user file history  
? Timeline serialization  
? Smart suggestions  
? Proper error handling  

---

## ?? Project Structure

```
ashesinthedawn/
??? venv/                       # Python virtual environment
??? node_modules/               # Node dependencies
??? src/                        # React source code
?   ??? components/            # UI components
?   ??? contexts/              # React contexts
?   ??? lib/                   # Utilities
?   ??? types/                 # TypeScript types
??? daw_core/                  # Python DSP engine
??? Codette/                   # AI engine
??? uploads/                   # Uploaded files
??? codette_server_unified.py  # Main server
??? start-all.ps1             # Start all services
??? setup-first-time.ps1      # First-time setup
??? fix-dependencies.ps1      # Fix node_modules
??? stop-all.ps1              # Stop services
```

---

## ?? Your Next 5 Minutes

1. **Fix dependencies** (2 min)
   ```powershell
   .\fix-dependencies.ps1
   ```

2. **Start all services** (1 min)
   ```powershell
   .\start-all.ps1
   ```

3. **Test health endpoint** (30 sec)
   ```bash
   curl http://localhost:8000/health
   ```

4. **Open browser** (30 sec)
   ```
   http://localhost:5173
   ```

5. **You're done!** ??

---

## ?? Pro Tips

### Monitor Server Logs
The start-all.ps1 script opens separate windows for Python and React servers.
- **Python window** - Shows DSP effects loading and API requests
- **React window** - Shows Vite build and HMR updates

### Development Workflow
```powershell
# Terminal 1: Python server with hot reload
.\venv\Scripts\Activate.ps1
uvicorn codette_server_unified:app --reload --log-level debug

# Terminal 2: React dev server
npm run dev

# Terminal 3: TypeScript checking
npm run typecheck -- --watch
```

### Clean Everything
```powershell
# Nuclear option - removes everything and reinstalls
Remove-Item -Recurse -Force venv, node_modules
.\setup-first-time.ps1
```

---

## ?? Related Documentation

- `QUICK_START.md` - Overall setup guide
- `FILE_UPLOAD_INTEGRATION_COMPLETE.md` - Complete feature guide
- `IMPLEMENTATION_STATUS.md` - Implementation details
- `.github/copilot-instructions.md` - Architecture rules

---

## ? FAQ

**Q: How long does setup take?**  
A: First time: 5-10 minutes. Daily starts: 10 seconds.

**Q: Can I use a different Python version?**  
A: Python 3.11+ recommended. 3.13.7 is tested.

**Q: Can I use a different Node version?**  
A: Node 18+ required. 20+ recommended.

**Q: Why do I need two servers?**  
A: Python handles DSP/AI, React handles UI. They communicate via API.

**Q: Can I deploy this?**  
A: Yes! Deploy Python to Railway/Render, React to Vercel/Netlify.

**Q: What if I just want to fix the build error?**  
A: Run `.\fix-dependencies.ps1` - takes 2 minutes.

---

## ?? Summary

You now have:

? **3 production-ready endpoints**  
? **7 type-safe Pydantic models**  
? **File upload with analysis**  
? **User file history tracking**  
? **DAW timeline integration**  
? **Smart suggestions engine**  
? **Dependency fix script**  
? **Complete startup automation**  

**Status: Ready to Use** ??

---

## ?? Ready?

```powershell
# 1. Fix dependencies (if needed)
.\fix-dependencies.ps1

# 2. Start all services
.\start-all.ps1

# 3. Open browser
# http://localhost:5173
```

---

*CoreLogic Studio v7.0.0*  
*Sovereign DAW Engine - Production Ready*  
*Updated with dependency troubleshooting - December 2025*
