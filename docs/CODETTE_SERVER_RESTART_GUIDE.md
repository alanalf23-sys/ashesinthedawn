# Codette AI - Server Restart & Testing Guide

## ?? Quick Restart (MUST DO THIS NOW!)

### Step 1: Stop Current Server
Open PowerShell/Terminal and run:
```powershell
taskkill /F /IM python.exe
```

### Step 2: Start Fresh Server
```powershell
cd I:\ashesinthedawn
python codette_server_unified.py
```

**Wait for this message**: 
```
? SERVER READY - Codette AI is listening
```

---

## ?? Testing the Fix

### Test 1: Health Check
Open browser or use curl:
```bash
curl http://localhost:8000/health
```

**Expected Output**:
```json
{
  "status": "healthy",
  "service": "Codette AI Unified Server",
  "codette_available": true,
  "timestamp": "..."
}
```

---

### Test 2: DAW-Specific Query (THE KEY TEST!)
```bash
curl -X POST http://localhost:8000/api/codette/query ^
  -H "Content-Type: application/json" ^
  -d "{\"query\":\"how can I improve my bass mixing?\",\"perspectives\":[\"neural_network\",\"davinci_synthesis\"]}"
```

**BEFORE FIX** (what you were seeing):
```json
{
  "perspectives": {
    "neural_network": "Processing query...",
    "davinci_synthesis": "Synthesizing insights..."
  }
}
```

**AFTER FIX** (what you should see now):
```json
{
  "perspectives": {
    "neural_network": "[DAW Expert] Low-end mastery: Keep sub-bass (20-60Hz) mono, boost kick fundamental at 50-100Hz, use sidechain compression between kick and bass...",
    "davinci_synthesis": "[DAW Expert] Low-end mastery: Keep sub-bass (20-60Hz) mono, boost kick fundamental at 50-100Hz..."
  }
}
```

---

### Test 3: Server Logs Check

**BEFORE** - You were seeing:
```
2025-12-03 21:16:09,378 - root - INFO - CoreLogicStudio: Sentiment analysis: {'neg': 0.0, 'neu': 1.0, 'pos': 0.0, 'compound': 0.0}
```

**AFTER** - You should see:
```
2025-12-03 21:20:00,123 - codette_server_unified - INFO - Multi-perspective query: how can I improve bass... with 2 perspectives
[DAW Expert] Low-end mastery: Keep sub-bass (20-60Hz) mono...
```

---

## ?? Verification Steps

### 1. Check Server Status
```bash
curl http://localhost:8000/api/codette/status
```

### 2. Check if Codette is Responding (not just echoing)
In your React app:
1. Open Codette panel
2. Type: **"how do I improve my vocal mix?"**
3. **Expected response**: 
   - ? "Vocal mixing: De-ess at 6-8kHz, compress with 3:1 to 6:1 ratio..."
   - ? NOT: "Sentiment analysis: {'neg': 0.0, 'neu': 1.0...}"

### 3. Test Non-DAW Query
Type: **"what is the meaning of life?"**
**Expected response**:
```
[Neural] Through dynamic observation, the pattern transforms seamlessly in the consciousness
[Logical] Logical analysis shows that current conditions implies strategic adaptation.
```

---

## ?? If Still Not Working

### Check 1: Is the New Code Loaded?
In server startup logs, you should see:
```
? Codette AI engine initialized successfully (codette_new.Codette)
```

### Check 2: Python Cache Clearing
Sometimes Python caches the old module. Force clear:
```powershell
# Stop server
taskkill /F /IM python.exe

# Clear Python cache
Remove-Item -Recurse -Force __pycache__
Remove-Item -Recurse -Force Codette\__pycache__

# Restart server
python codette_server_unified.py
```

### Check 3: Verify Code Changes
Open `Codette\codette_new.py` and confirm line ~475 contains:
```python
# Check if this is a DAW-related query
daw_keywords = ['mix', 'eq', 'compress', 'track', 'audio', 'bass', 'vocal', 'drum', 'frequency', 
               'gain', 'reverb', 'delay', 'master', 'pan', 'stereo', 'plugin', 'daw', 'recording',
               'sound', 'volume', 'level', 'effect', 'processing']
is_daw_query = any(keyword in prompt.lower() for keyword in daw_keywords)
```

---

## ? Success Indicators

1. **Server logs show**: "[DAW Expert]" in responses
2. **React app receives**: Actual mixing advice, not sentiment analysis
3. **Queries about bass/vocals/mixing**: Get specific technical guidance
4. **Non-DAW queries**: Still get multi-perspective responses

---

## ?? What Was Fixed

### Before (codette_new.py - OLD)
```python
def respond(self, prompt):
    sentiment = self.analyze_sentiment(prompt)
    key_concepts = self.extract_key_concepts(prompt)
    # ... just sentiment analysis, no DAW intelligence
```

### After (codette_new.py - NEW)
```python
def respond(self, prompt):
    sentiment = self.analyze_sentiment(prompt)
    key_concepts = self.extract_key_concepts(prompt)
    
    # ? NEW: Detect DAW queries
    daw_keywords = ['mix', 'eq', 'compress', ...]
    is_daw_query = any(keyword in prompt.lower() for keyword in daw_keywords)
    
    if is_daw_query:
        # ? NEW: Use DAW-specific response
        daw_response = self._generate_daw_specific_response(prompt, key_concepts)
        responses.append(f"[DAW Expert] {daw_response}")
```

---

## ?? Notes

- The fix adds **keyword detection** to identify audio engineering queries
- DAW queries now get **prioritized [DAW Expert] responses**
- Non-DAW queries still work with multi-perspective analysis
- **Must restart server** for changes to take effect (Python doesn't hot-reload)

---

**Status**: ? Code updated, waiting for server restart to verify
**Next Step**: Restart server and test with "how do I improve my bass mixing?" query

---

**Created**: 2025-12-03
**File**: docs/CODETTE_SERVER_RESTART_GUIDE.md
