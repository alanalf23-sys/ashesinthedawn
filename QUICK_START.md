# 🚀 CoreLogic Studio - Quick Start Guide

## ⚡ Super Fast Start

```powershell
# First time only
.\setup-first-time.ps1

# Daily use
.\start-all.ps1

# Open browser
http://localhost:5173
```

---

## 🚨 Build Error? Start Here!

### Got "Cannot find module 'fraction.js'"?

```powershell
# Run this - fixes in 2 minutes
.\fix-dependencies.ps1
```

### Want to check your system?

```powershell
# Comprehensive health check
.\diagnostics.ps1
```

**See:** `BUILD_ERROR_FIX.md` for complete troubleshooting guide

---

## 📚 Documentation Quick Links

| Document | Purpose |
|----------|---------|
| **QUICKSTART_CARD.md** | 1-page cheat sheet |
| **START_HERE.md** | Main guide + troubleshooting |
| **COMMAND_REFERENCE.md** | All commands explained |
| **BUILD_ERROR_FIX.md** | Fix build/dependency issues |
| **This file** | Original quick start |

---

## 🎯 What We've Built

**Complete Python DSP Integration:**
- ✅ 19 Professional Audio Effects
- ✅ WebSocket Communication
- ✅ Hybrid Processing System
- ✅ Beautiful UI Controls
- ✅ Automatic Fallback
- ✅ Real-time Statistics
- ✅ Automated Setup Scripts
- ✅ Diagnostic Tools

---

## 📁 Essential Commands

### Start/Stop
```powershell
.\start-all.ps1          # Start Python + React servers
.\stop-all.ps1           # Stop all servers
```

### Setup/Fix
```powershell
.\setup-first-time.ps1   # First-time setup (run once)
.\fix-dependencies.ps1   # Fix Node dependencies
.\diagnostics.ps1        # Check system health
```

### Manual Control
```powershell
# Python server with logging
.\venv\Scripts\Activate.ps1
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level info

# React dev server
npm run dev
```

---

## 🔥 First Time Startup

### Step 1: Run Setup
```powershell
.\setup-first-time.ps1
```

**This will:**
- Create Python virtual environment
- Install Python dependencies (3-5 minutes)
- Install Node dependencies (2-3 minutes)
- Verify installation

### Step 2: Check System
```powershell
.\diagnostics.ps1
```

**You should see:**
- ✅ All green checkmarks
- ✅ All dependencies installed
- ✅ Ports available

### Step 3: Start Servers
```powershell
.\start-all.ps1
```

**What you'll see:**
- 2 new terminal windows open
- **Purple window**: Python DSP Server (Port 8000)
- **Cyan window**: React Frontend (Port 5173)

### Step 4: Wait for Startup
**Python Server** (30-60 seconds):
```
✅ DSP effects library loaded
✅ Codette AI Unified Server is READY
INFO: Uvicorn running on http://0.0.0.0:8000
```

**React Frontend** (10-20 seconds):
```
VITE ready in xxx ms
➜ Local:   http://localhost:5173/
```

### Step 5: Open Browser
```
http://localhost:5173
```

### Step 6: Enable Python DSP
1. Look at **top-right corner**
2. See **Python DSP button** with status dot
3. **Click** to enable (turns purple with pulse)

---

## 🐛 Troubleshooting

### Build Errors

**Error: Cannot find module 'fraction.js'**
```powershell
.\fix-dependencies.ps1
```

**Error: PostCSS plugin failed**
```powershell
.\fix-dependencies.ps1
```

**Error: Vite build failed**
```powershell
npm cache clean --force
npm install --legacy-peer-deps
```

### Server Won't Start

**Port 8000 already in use**
```powershell
.\stop-all.ps1
# Or manually:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Port 5173 already in use**
```powershell
.\stop-all.ps1
# Or manually:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Python not found**
```powershell
# Install Python 3.11 or higher
# Then run:
.\setup-first-time.ps1
```

**Node not found**
```powershell
# Install Node.js 18 or higher
# Then run:
.\setup-first-time.ps1
```

### Python DSP Not Connecting

**Check Python server window:**
- Should say "Uvicorn running on http://0.0.0.0:8000"
- Should show "✅ DSP effects library loaded"

**Check browser console (F12):**
- Look for WebSocket errors
- Should see "[PythonDSP] Connected to Python DSP server"

**Test connection:**
```powershell
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

---

## 🎨 UI Features

### Top Bar
```
┌─────────────────────────────────────────────┐
│ [Transport Controls] ... [🐍 Python DSP ●] │
└─────────────────────────────────────────────┘
```
**Colors:**
- 🟢 **Green dot** = Server online
- 🟣 **Purple glow** = DSP active
- 🔴 **Red dot** = Server offline

### Plugin Rack
```
┌─────────────────────────────┐
│ Inserts (2)            [+]  │
├─────────────────────────────┤
│ WEB AUDIO EFFECTS           │
│ 🎚️ Parametric EQ           │
│ ⚙️ Compressor               │
│ ... (7 total)               │
├─────────────────────────────┤
│ PYTHON DSP EFFECTS [Pro]    │
│ 🐍 3-Band EQ                │
│ 🐍 Compressor               │
│ 🐍 Reverb                   │
│ ... (19 total)              │
└─────────────────────────────┘
```

---

## 🧪 Testing Your Setup

### Quick Test Sequence
```powershell
# 1. Check system health
.\diagnostics.ps1

# 2. Start servers
.\start-all.ps1

# 3. Test Python API
curl http://localhost:8000/health

# 4. Test Codette status
curl http://localhost:8000/codette/status

# 5. Open browser
start http://localhost:5173
```

### Full Test
1. **System Check**: `.\diagnostics.ps1` - All ✅
2. **Start**: `.\start-all.ps1` - Both windows open
3. **API Test**: `curl http://localhost:8000/health` - Returns healthy
4. **UI Test**: Open http://localhost:5173 - Page loads
5. **DSP Test**: Click Python DSP button - Green dot appears
6. **Effect Test**: Add 🐍 effect - Badge shows up

---

## 💡 Pro Tips

### Performance
- **Python DSP** for critical effects (EQ, Compression, Reverb)
- **Web Audio** for simple effects (Gain, Filters)
- **Hybrid mode** automatically chooses best engine

### Workflow
1. Start with Web Audio effects (always available)
2. Enable Python DSP when ready for quality
3. Switch effects to Python versions for final mix
4. Monitor stats to optimize performance

### Development
```powershell
# Terminal 1: Python with auto-reload
.\venv\Scripts\Activate.ps1
uvicorn codette_server_unified:app --reload --log-level debug

# Terminal 2: React with type checking
npm run dev

# Terminal 3: Watch types
npm run typecheck -- --watch
```

---

## 📊 Uvicorn Logging

```powershell
# Activate Python environment
.\venv\Scripts\Activate.ps1

# Info level (recommended)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level info

# Debug level (verbose)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --log-level debug

# No access logs (cleaner)
uvicorn codette_server_unified:app --host 0.0.0.0 --port 8000 --no-access-log

# Auto-reload (development)
uvicorn codette_server_unified:app --reload
```

**See:** `COMMAND_REFERENCE.md` for all logging options

---

## 🎯 Common Workflows

### Daily Development
```powershell
# Morning
.\diagnostics.ps1      # Check health
.\start-all.ps1       # Start servers

# Evening
.\stop-all.ps1        # Stop servers
```

### After Git Pull
```powershell
# Update dependencies
.\fix-dependencies.ps1
pip install -r requirements.txt

# Restart
.\start-all.ps1
```

### Fresh Start
```powershell
# Nuclear option
Remove-Item -Recurse -Force venv, node_modules
.\setup-first-time.ps1
```

---

## 📞 Need Help?

### Check These First
1. **Diagnostics**: `.\diagnostics.ps1`
2. **Build Errors**: `BUILD_ERROR_FIX.md`
3. **Commands**: `COMMAND_REFERENCE.md`
4. **Main Guide**: `START_HERE.md`

### Common Questions

**Q: How long does first setup take?**  
A: 5-10 minutes (depends on internet speed)

**Q: Do I need to run setup every time?**  
A: No, only once. Daily use: `.\start-all.ps1`

**Q: What if dependencies break?**  
A: Run `.\fix-dependencies.ps1` (takes 2 minutes)

**Q: Can I use Python DSP separately?**  
A: Yes, it's optional. Web Audio works standalone.

**Q: How do I update the code?**  
A: `git pull`, then `.\fix-dependencies.ps1`

---

## ✅ Success Checklist

After setup, you should have:

- ✅ Python 3.11+ installed
- ✅ Node.js 18+ installed
- ✅ Virtual environment created
- ✅ Python dependencies installed
- ✅ Node dependencies installed
- ✅ Both servers start successfully
- ✅ http://localhost:5173 loads
- ✅ http://localhost:8000/health returns healthy
- ✅ Python DSP button shows green dot
- ✅ Can add effects to tracks

---

## 🎉 You're All Set!

### Your New Scripts
```
✅ setup-first-time.ps1   - Complete setup
✅ start-all.ps1          - Start servers
✅ stop-all.ps1           - Stop servers
✅ fix-dependencies.ps1   - Fix Node deps
✅ diagnostics.ps1        - System check
```

### Your Documentation
```
✅ QUICKSTART_CARD.md     - 1-page cheat sheet
✅ START_HERE.md          - Main guide
✅ COMMAND_REFERENCE.md   - All commands
✅ BUILD_ERROR_FIX.md     - Troubleshooting
✅ QUICK_START.md         - This file
```

---

## 🚀 Ready?

```powershell
# Check system
.\diagnostics.ps1

# Start everything
.\start-all.ps1

# Open browser
start http://localhost:5173
```

**🎵 Happy music making with CoreLogic Studio!**

---

*CoreLogic Studio v7.0.0*  
*Sovereign DAW Engine - Production Ready*  
*Complete with automated setup and diagnostics*
