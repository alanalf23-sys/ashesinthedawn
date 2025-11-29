# ⚡ QUICK START GUIDE - CORELOGIC STUDIO + CODETTE AI

## 🚀 LAUNCH IN 3 STEPS

### **Step 1: Start Everything**
Double-click this file:
```
i:\ashesinthedawn\start_all.bat
```

Wait ~10 seconds for servers to start...

### **Step 2: Open DAW**
Browser automatically opens to:
```
http://localhost:5173
```

If not, open it manually in your browser.

### **Step 3: Use Codette AI**
- Create/load audio tracks
- Adjust mixer settings
- Click **"Codette Suggestions"** tab to see AI recommendations
- AI analyzes your mix and suggests improvements

---

## 🎮 KEYBOARD SHORTCUTS

| Action | Shortcut |
|--------|----------|
| Play/Pause | `Spacebar` |
| Stop | `Enter` |
| Select Track | `Click on track` |
| Delete Track | `Select + Delete` |
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Y` |

---

## 🔗 USEFUL LINKS

| Service | URL | Purpose |
|---------|-----|---------|
| DAW Frontend | http://localhost:5173 | Main UI |
| Codette API | http://localhost:8001/health | Health check |
| API Docs | http://localhost:8001/docs | Interactive API |
| Alt Docs | http://localhost:8001/redoc | Alternative docs |

---

## 🆘 TROUBLESHOOTING

### **Browser shows blank page**
1. Wait 10-15 seconds
2. Refresh browser (F5)
3. Check console (F12) for errors

### **Can't connect to Codette**
```powershell
# Check if Codette is running
curl http://localhost:8001/health

# If failed, restart Codette
# (close Terminal 1, run: python codette_server_production.py)
```

### **"Port already in use" error**
Ports 5173 or 8001 are busy:
```powershell
# Kill the process
taskkill /F /IM python.exe

# Or use different ports (edit start_all.bat)
```

### **"npm: command not found"**
Install Node.js from https://nodejs.org/

### **React slow/freezing**
Try hard refresh: `Ctrl+Shift+R` (or Cmd+Shift+R on Mac)

---

## 📊 WHAT'S HAPPENING

```
When you click "Codette Suggestions":

1. DAW sends context: { type: "mixing", bpm: 120, ... }
2. React → REST API (http://localhost:8001/suggestions)
3. Codette AI generates 5 suggestions
4. Results display in Mixer panel
5. Click to apply suggestion to track
```

---

## 💻 MANUAL STARTUP (2 Terminals)

**Terminal 1** - Codette AI Server:
```powershell
cd i:\ashesinthedawn
python codette_server_production.py
```

**Terminal 2** - React Frontend:
```powershell
cd i:\ashesinthedawn
npm run dev
```

Then open: http://localhost:5173

---

## 🧪 TEST THE INTEGRATION

```powershell
cd i:\ashesinthedawn
python test_integration.py
```

Expected output:
```
✅ PASS    health
✅ PASS    chat
✅ PASS    suggestions
✅ PASS    analyze
✅ PASS    sync

Result: 5/5 tests passed (100%)
🎉 ALL TESTS PASSED!
```

---

## 📁 IMPORTANT FILES

| File | Purpose |
|------|---------|
| `start_all.bat` | ⭐ One-click startup |
| `codette_server_production.py` | Codette AI server |
| `test_integration.py` | Test suite |
| `CODETTE_SETUP_COMPLETE.md` | Full documentation |
| `CODETTE_FIX_SUMMARY.md` | What was fixed |

---

## 🎯 FEATURES

### **DAW**
- ✅ Multi-track recording/playback
- ✅ Audio effects (EQ, compression, etc.)
- ✅ Real-time mixer
- ✅ Transport controls
- ✅ Volume/pan automation

### **Codette AI**
- ✅ Mixing suggestions
- ✅ Audio analysis
- ✅ Mastering guidance
- ✅ Real-time chat
- ✅ Context-aware recommendations

### **Integration**
- ✅ REST API
- ✅ WebSocket (future)
- ✅ Auto-sync
- ✅ Type-safe (TypeScript + Python)

---

## 💡 TIPS

1. **Start fresh**: Restart servers if UI gets weird
2. **Check console**: Press F12 to see browser errors
3. **Test API**: Use `/docs` to manually test endpoints
4. **Monitor logs**: Watch Terminal 1 for Codette requests
5. **Keep tools open**: Both servers need to keep running

---

## 🆘 NEED HELP?

### **Error in Terminal 1** (Codette)
- Check that Python 3.10+ is installed
- Run: `pip install fastapi uvicorn`

### **Error in Terminal 2** (React)
- Check that Node.js is installed
- Run: `npm install` in ashesinthedawn folder

### **Connection refused**
- Make sure both servers are running
- Check firewall settings
- Verify ports 5173 and 8001 are free

---

## 🎉 YOU'RE READY!

Your AI-powered Digital Audio Workstation is ready to use!

**Start with**: `start_all.bat`

Then enjoy producing music with Codette AI assistance! 🎵

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: November 28, 2025
