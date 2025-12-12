# CoreLogic Studio - Startup Guide

## 🔧 First-Time Setup

**⚠️ IMPORTANT: Run this ONCE before your first startup!**

### Automatic Setup (Recommended)
```powershell
.\setup-first-time.ps1
```
This will automatically:
- Create/verify virtual environment
- Upgrade pip
- Install all Python dependencies
- Install all Node.js dependencies

### Manual Setup
```powershell
# 1. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 2. Upgrade pip
python -m pip install --upgrade pip

# 3. Install all Python dependencies
pip install -r requirements.txt

# 4. Install Node.js dependencies
npm install
```

**Expected output:**
```
✅ Virtual environment created
✅ pip upgraded
✅ Python dependencies installed
✅ Node.js dependencies installed
```

**⏱️ Installation time:** 3-5 minutes (depending on internet speed)

---

## 🚀 Quick Start

### Option 1: Automatic Startup (Recommended)
```powershell
.\start-all.ps1
```
This will start both Python DSP Server and React Frontend in separate windows.

### Option 2: Manual Startup

#### 1. Start Python DSP Server
```powershell
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start server
python codette_server_unified.py
```

Expected output:
```
✅ DSP effects library loaded
✅ CODETTE AI UNIFIED SERVER IS READY
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### 2. Start React Frontend (in new terminal)
```powershell
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## 🔍 Check Service Status
```powershell
.\check-status.ps1
```

Expected output when running:
```
🐍 Python DSP Server (Port 8000): ✅ ONLINE
⚡ React Frontend (Port 5173): ✅ ONLINE
🔌 WebSocket (Port 8000/ws): ✅ REACHABLE
```

## 🛑 Stop All Services
```powershell
.\stop-all.ps1
```

## 📌 Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| **Python DSP** | http://localhost:8000 | Audio processing server |
| **Health Check** | http://localhost:8000/health | Server status |
| **WebSocket** | ws://localhost:8000/ws | Real-time communication |
| **React Frontend** | http://localhost:5173 | CoreLogic Studio UI |

## 🐍 Python DSP Features

When the Python server starts, you'll see:
```
✅ DSP effects library loaded
✅ Codette capabilities module loaded
✅ Transport Manager initialized
```

**Available Effects (19 total):**
- **EQ:** 3-Band Parametric, High/Low Pass
- **Dynamics:** Compressor, Limiter, Expander, Gate, Noise Gate
- **Saturation:** Saturation, Hard Clip, Distortion, WaveShaper
- **Delay:** Simple, Ping-Pong, Multi-Tap, Stereo
- **Reverb:** Hall, Plate, Room, Generic
- **Modulation:** Chorus

**Test Results:** ✅ 197/197 tests passing

## 🎨 Using Python DSP in the UI

### 1. Check Connection Status
Look at the **top bar** in CoreLogic Studio:
- 🟢 **Green dot + purple button** = Python DSP online
- 🔴 **Red dot + gray button** = Python DSP offline

### 2. Enable Python DSP
Click the **Python DSP button** in the top bar:
- Button turns purple with pulse animation
- Shows "🐍 Python DSP" text

### 3. Add Python Effects
1. Select a track in the **Mixer**
2. Click **+** in the **PluginRack**
3. Scroll to **"PYTHON DSP EFFECTS"** section
4. Click any Python effect (e.g., **🐍 Compressor**)
5. Effect appears with **🐍 Python** badge

### 4. View Statistics
Hover over the Python DSP button to see:
- Connection status
- Effect count (19 available)
- Quality level (Professional)
- Processing stats

## 🔧 Troubleshooting

### ModuleNotFoundError (pydantic, fastapi, etc.)
**This is the most common issue!**

```powershell
# Activate venv and install dependencies
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```
**Root cause:** Dependencies not installed in virtual environment.
**Solution:** Run the First-Time Setup section above.

### Python Server Won't Start
```powershell
# Check if port 8000 is in use
netstat -ano | findstr :8000

# If in use, kill the process
Stop-Process -Id <PID> -Force

# Reinstall dependencies if needed
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Frontend Won't Start
```powershell
# Check if port 5173 is in use
netstat -ano | findstr :5173

# If in use, kill the process
Stop-Process -Id <PID> -Force

# Reinstall dependencies
npm install

# Clear cache
npm run dev -- --force
```

### Virtual Environment Issues
```powershell
# Recreate venv
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Python DSP Not Connecting
1. Check if Python server is running (port 8000)
2. Check browser console for errors
3. Verify WebSocket URL in browser: `ws://localhost:8000/ws`
4. Try refreshing the frontend page

## 📊 Performance Tips

### Python Server
- **CPU Usage:** ~5-10% idle, up to 30% during processing
- **Memory:** ~200-400 MB
- **Latency:** ~10-50ms per effect

### React Frontend
- **Initial Load:** 2-3 seconds
- **Hot Reload:** <1 second
- **Memory:** ~100-200 MB

## 🎯 Development Workflow

### Typical Session
```powershell
# 1. Start servers
.\start-all.ps1

# 2. Wait 5-10 seconds for startup
Start-Sleep -Seconds 10

# 3. Check status
.\check-status.ps1

# 4. Open browser
Start-Process "http://localhost:5173"

# 5. Work on your project...

# 6. Stop when done
.\stop-all.ps1
```

### Hot Reload
- **Frontend:** Changes auto-reload (Vite HMR)
- **Python Server:** Restart required for code changes

### Testing Python DSP
```powershell
# In browser console
const bridge = getPythonDSPBridge();
await bridge.connect();
console.log('Connected:', bridge.isConnected());
bridge.getAvailableEffects();
```

## 📝 Notes

- **Python 3.13.7** required
- **Node.js 18+** required
- **Windows PowerShell** for scripts
- **CORS enabled** for localhost:5173

## 🆘 Getting Help

If you encounter issues:
1. Check `.\check-status.ps1` output
2. Review Python server logs
3. Check browser console (F12)
4. Verify ports 8000 and 5173 are free

## 🎉 You're Ready!

Run `.\start-all.ps1` and start making music with professional Python DSP effects!
