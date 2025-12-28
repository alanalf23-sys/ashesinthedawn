# ? SERVER STARTUP GUIDE - Proper Integration & Running

**Status**: Ready to start with integrated local Codette model  
**Prerequisites**: All files created ?  
**Next**: Follow these steps to integrate and start  

---

## ?? QUICK STATUS CHECK

Run this to verify everything is ready:

```bash
python HELPER_INTEGRATION.py
```

This will:
- ? Check all files exist
- ? Verify .env configuration
- ? Show where to make modifications
- ? List quick start steps

---

## ?? STEP 1: APPLY MODIFICATIONS (10 minutes)

### Option A: Manual (Recommended for Control)
1. Open `QUICK_START_10MIN.md`
2. Follow 5 simple steps
3. Copy & paste code snippets
4. Save file

### Option B: Automated (If available)
```bash
python apply_modifications.py  # (if available)
```

---

## ? STEP 2: VERIFY MODIFICATIONS

### Check 1: Verify imports were added
```bash
grep "from codette_local_loader import" codette_server_unified.py
# Should output: from codette_local_loader import get_local_model...
```

### Check 2: Verify model loading section exists
```bash
grep "CODETTE_LOCAL_AVAILABLE = False" codette_server_unified.py
# Should output: CODETTE_LOCAL_AVAILABLE = False
```

### Check 3: Verify chat endpoint updated
```bash
grep "local_model_loader.generate" codette_server_unified.py
# Should output the generation call
```

---

## ?? STEP 3: START THE SERVER

### Standard Start
```bash
python codette_server_unified.py
```

### With Explicit Port
```bash
python codette_server_unified.py --port 8000
```

### With Output Logging
```bash
python codette_server_unified.py 2>&1 | tee server.log
```

### In Background (Linux/Mac)
```bash
python codette_server_unified.py &
```

### In Background (Windows PowerShell)
```powershell
Start-Process python -ArgumentList "codette_server_unified.py"
```

---

## ?? EXPECTED STARTUP OUTPUT

### Model Loading Phase (First 2-3 seconds)
```
[LocalModel] Initializing local Codette RC-XI model...
[LocalModel] Loading tokenizer...
[LocalModel] Loading model weights...
[OK] Codette RC-XI loaded successfully
     Model: codette_rc_xi_trained
     Device: cuda (or cpu)
     Load time: 2345ms
[OK] Integration layer initialized
```

### Server Ready Phase (After model loads)
```
[OK] FastAPI app configured
[OK] CODETTE AI UNIFIED SERVER - STARTUP
======================================
 Codette AI Engine: [OK] Status: ACTIVE
 Local Codette RC-XI: [OK] Status: LOADED & READY
 DAW Core DSP: [OK] Status: INTEGRATED
 OpenAI Fallback: [OK] Status: ENABLED
======================================
[OK] CODETTE AI UNIFIED SERVER IS READY
```

---

## ?? STEP 4: TEST THE INTEGRATION

### Test 1: Check Server Health
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "codette_available": true,
  "dsp_available": true
}
```

### Test 2: Check Model Status
```bash
curl http://localhost:8000/codette/model-status
```

Expected response shows:
```json
{
  "local_model": {
    "available": true,
    "priority": 1
  },
  "codette_engine": {
    "available": true,
    "priority": 2
  },
  ...
}
```

### Test 3: Test Chat Endpoint
```bash
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is gain staging?"}'
```

Expected:
- Response time: **<500ms** (from local model!)
- Source: **"local_codette_rc_xi"**
- Response: Natural language answer about gain staging

---

## ?? TROUBLESHOOTING

### Problem: "ModuleNotFoundError: No module named 'codette_local_loader'"

**Cause**: Files not in correct location  
**Solution**:
```bash
# Check files are in project root
ls codette_local_loader.py codette_integration.py

# If missing, create them again (use provided code)
```

### Problem: "Model path not found"

**Cause**: CODETTE_MODEL_ID doesn't point to valid directory  
**Solution**:
```bash
# Check path in .env
echo $CODETTE_MODEL_ID

# Or verify path exists
dir J:\ashesinthedawn\codette_rc_xi_trained
# Should show files like config.json, pytorch_model.bin, etc.
```

**Fallback**: Server will use OpenAI automatically if path invalid

### Problem: "CUDA out of memory"

**Cause**: GPU memory insufficient  
**Solution**:
```python
# In codette_local_loader.py, modify load():
torch_dtype=torch.float32  # Instead of float16 (uses more memory but safer)
device_map="cpu"  # Force CPU instead of GPU
```

### Problem: Server takes 10+ seconds to start

**Cause**: Model loading from disk (normal first time)  
**Expected**: First load 2-3 seconds, cached loads <100ms  
**Solution**: Let it finish, then subsequent starts will be faster

### Problem: "KeyboardInterrupt" on startup

**Cause**: User pressed Ctrl+C during startup  
**Solution**:
```bash
# This is normal - server was interrupted
# Just restart it:
python codette_server_unified.py
```

### Problem: Port already in use (8000)

**Cause**: Another process using port 8000  
**Solution**:
```bash
# Use different port
PORT=8001 python codette_server_unified.py

# Or find/kill the process
# Windows:
netstat -ano | find ":8000"
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :8000
kill -9 <PID>
```

---

## ?? VERIFICATION CHECKLIST

After server starts, verify:

- [ ] Server logs show "Local Codette RC-XI loaded successfully"
- [ ] Health endpoint returns `"status": "healthy"`
- [ ] Model-status endpoint shows local_model.available = true
- [ ] Chat endpoint responds in <500ms
- [ ] Chat endpoint returns source = "local_codette_rc_xi"
- [ ] WebSocket connection works (port 8000)

All checks passing = **? INTEGRATION SUCCESSFUL**

---

## ?? RESTART & SHUTDOWN

### Graceful Shutdown
```bash
# Press Ctrl+C in terminal where server is running
# Wait for "Shutdown complete" message
```

### Force Shutdown (if frozen)
```bash
# Windows: Find process and kill
taskkill /F /IM python.exe

# Linux/Mac: Kill by port
fuser -k 8000/tcp
```

### Restart Server
```bash
python codette_server_unified.py
# Server will:
# 1. Load local model from cache (fast)
# 2. Start HTTP server
# 3. Enable WebSocket
# 4. Ready for requests
```

---

## ?? PERFORMANCE EXPECTATIONS

After integration, you should see:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **First Request** | 2-5s | 200-500ms | 5-25x faster |
| **Typical Response** | 2-5s | 200-500ms | 5-25x faster |
| **API Cost** | ~$0.01/query | $0 | **100% savings** |
| **Model Latency** | Remote API | Local RAM | Offline capable |

---

## ?? SUCCESS INDICATORS

? Server started  
? "CODETTE AI UNIFIED SERVER IS READY" message  
? Health check passes  
? Model status shows local_model available  
? Chat responses <500ms  

**You're done!** Local Codette RC-XI is now your PRIMARY AI engine! ??

---

## ?? HELPFUL COMMANDS

```bash
# Run with timestamps
python -u codette_server_unified.py

# Save logs to file
python codette_server_unified.py > server.log 2>&1 &

# Monitor in real-time
tail -f server.log

# Check if port is available
netstat -an | grep 8000

# Kill previous server instances
pkill -f "codette_server_unified"

# Test with Python
python -c "
import requests
r = requests.post('http://localhost:8000/codette/chat', 
    json={'message': 'Hello'})
print(r.json())
"
```

---

## ? FINAL NOTES

1. **First startup** will take 2-3 seconds (model loading)
2. **Subsequent startups** will be faster (cached)
3. **Local model** is PRIMARY - fastest responses
4. **Fallback chain** ensures always has answer
5. **GPU optional** - works on CPU too (slower)
6. **No API calls** needed - runs completely offline!

---

**Ready?** Start the server now with:

```bash
python codette_server_unified.py
```

**Questions?** Check QUICK_START_10MIN.md for step-by-step integration!

---

**Status**: ? READY TO LAUNCH  
**Difficulty**: Easy (pre-built, just integrate)  
**Time**: 10 min integration + server startup  
**Benefit**: 10-20x faster, free, local control  

Let's go! ??
