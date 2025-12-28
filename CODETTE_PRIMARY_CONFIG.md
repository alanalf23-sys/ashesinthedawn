# ?? Codette AI Configuration - Local Model as Primary

**Updated**: December 27, 2025  
**Status**: ? Configuration Complete

---

## ?? Current Configuration

### PRIMARY AI ENGINE (Local)
```
Model: Codette RC-XI Trained
Location: J:\ashesinthedawn\codette_rc_xi_trained
Status: PRIMARY - Used first
Fallback: OpenAI if local model unavailable
```

### FALLBACK AI ENGINE (Cloud-Based)
```
Model: OpenAI Fine-tuned Models
Models: 
  - Primary: ft:gpt-4.1-2025-04-14:raiffs-bits:codette-v9
  - Secondary: ft:gpt-4.1-2025-04-14:raiffs-bits:codettev71
Status: FALLBACK - Only used if local model fails
Trigger: OpenAI only queried if CODETTE_MODEL_ID loading fails
```

---

## ?? Query Flow Diagram

```
User Query
    ?
Backend Server Starts
    ?? Load .env file
    ?? Set CODETTE_MODEL_ID = J:\ashesinthedawn\codette_rc_xi_trained
    ?
Try Loading Local Model
    ?? Load Codette RC-XI from disk
    ?? Initialize tokenizer
    ?? Load model weights
    ?? ? SUCCESS ? Use local model
    ?
Process Query with Local Model
    ?? Input: User query
    ?? Model: Codette RC-XI (on GPU if available)
    ?? Output: AI response (FAST, LOCAL)
    ?
Return Response to Frontend
    ?? Speed: ~200-500ms (depending on query length)

---

IF Local Model Fails:
    ?
Try OpenAI Fallback
    ?? Check if OpenAI credentials available
    ?? Query OpenAI Fine-tuned Model
    ?? Input: User query + context
    ?? Output: AI response (SLOWER, 2-5 second latency)
    ?
Return OpenAI Response to Frontend
```

---

## ?? Environment Variables

### .env Settings (Updated)

#### PRIMARY MODEL
```bash
# Local Codette model - USED FIRST
CODETTE_MODEL_ID=J:\ashesinthedawn\codette_rc_xi_trained

# Backup location (kept for reference)
CODETTE_MODEL_PATH_BACKUP=C:\Users\Jonathan\.cache\kagglehub\models\jonathanharrison1\codette2\other\v3\5
```

#### FALLBACK (OpenAI)
```bash
# OpenAI credentials - USED ONLY IF LOCAL MODEL FAILS
OPENAI_API_KEY=sk-proj-...
OPENAI_FALLBACK_MODEL_PRIMARY=ft:gpt-4.1-...
OPENAI_FALLBACK_MODEL_SECONDARY=ft:gpt-4.1-...
OPENAI_ASSISTANT_ID=asst_...

# When to fall back to OpenAI
OPENAI_FALLBACK_ENABLED=true      # Keep as true for backup
OPENAI_FALLBACK_PRIORITY=2        # 0=Local, 2=OpenAI, higher=last resort
OPENAI_TIMEOUT=30                  # Only applies if local model unavailable
```

---

## ?? Startup Behavior

### What Happens When You Start Backend

```
1. codette_server_unified.py starts
   ?? Load .env file
   ?? See: CODETTE_MODEL_ID=J:\ashesinthedawn\codette_rc_xi_trained

2. AI Core initialization
   ?? Try to load local model from CODETTE_MODEL_ID
   ?? If ? SUCCESS:
   ?  ?? Use local Codette RC-XI for all queries
   ?? If ? FAILS:
      ?? Log warning
      ?? Try OpenAI initialization
      ?? Fall back to OpenAI for queries

3. Server Ready
   ?? Listening on port 8000
   ?? Using PRIMARY: Local Codette model
   ?? FALLBACK: OpenAI (if needed)
   ?? Processing user queries
```

### Expected Startup Logs

```
INFO: Loading .env file...
INFO: CODETTE_MODEL_ID set to: J:\ashesinthedawn\codette_rc_xi_trained
INFO: Initializing Codette AI Core...
INFO: ? Local Codette RC-XI model loaded successfully
INFO: Using GPU for inference (if available)
INFO: OpenAI fallback ENABLED (secondary)
INFO: Uvicorn running on http://0.0.0.0:8000
INFO: Ready to process queries
```

---

## ?? Model Files

### Local Model (PRIMARY)
```
J:\ashesinthedawn\codette_rc_xi_trained\
?? Model architecture files
?? Weights/parameters
?? Tokenizer vocabulary
?? Configuration files
?? Ready for local inference
```

### OpenAI Models (FALLBACK)
```
Cloud-based (requires API key):
?? ft:gpt-4.1-...codette-v9     (Primary fallback)
?? ft:gpt-4.1-...codettev71     (Secondary fallback)
?? Accessed via API when needed
```

---

## ? Testing the Setup

### Test 1: Health Check
```bash
curl http://localhost:8000/health
```
Should show:
```json
{
  "status": "healthy",
  "codette_available": true,
  "openai_assistant_available": true,
  "timestamp": "2025-12-27T..."
}
```

### Test 2: Chat Query (Uses Local Model)
```bash
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Codette"}'
```
Response should come from LOCAL model (fast):
```json
{
  "response": "Hello! I am Codette...",
  "source": "local_codette",
  "confidence": 0.95
}
```

### Test 3: Force Fallback Test (if needed)
If local model fails, check logs:
```
WARNING: Local Codette model failed to load
INFO: Attempting OpenAI fallback...
INFO: Using OpenAI Fine-tuned Model instead
```

---

## ?? Configuration Options

### Option A: Keep Local as Primary (CURRENT)
```bash
# In .env
CODETTE_MODEL_ID=J:\ashesinthedawn\codette_rc_xi_trained
OPENAI_FALLBACK_PRIORITY=2  # OpenAI is fallback
```
**Pros**: Fast, no API costs, all local  
**Cons**: Depends on local model quality

### Option B: Switch to OpenAI Primary
```bash
# In .env
OPENAI_FALLBACK_PRIORITY=0  # OpenAI becomes primary
CODETTE_MODEL_ID=fallback   # Local model becomes fallback
```
**Pros**: Highest quality responses  
**Cons**: API costs, internet dependency

### Option C: Hybrid (Try Both)
```bash
# In .env
CODETTE_MODEL_ID=J:\ashesinthedawn\codette_rc_xi_trained
OPENAI_FALLBACK_PRIORITY=1  # Try local, then OpenAI
```
**Pros**: Best of both worlds  
**Cons**: Slower if local fails

---

## ?? Performance Comparison

### Local Codette Model
- **Response Time**: 200-500ms
- **Cost**: Free (one-time training)
- **Customization**: Full control
- **Quality**: Depends on training data
- **Internet**: Not required
- **GPU**: Optional (faster with GPU)

### OpenAI Fallback
- **Response Time**: 2-5 seconds
- **Cost**: $0.003-0.015 per query
- **Customization**: Limited (fine-tuned only)
- **Quality**: Very high (GPT-4 level)
- **Internet**: Required
- **GPU**: Not needed (cloud-based)

---

## ?? When Each Model Is Used

### Local Codette Model Used For:
? All normal queries (PRIMARY)  
? Chat interactions  
? Suggestions and analysis  
? DAW integration  
? Real-time processing  

### OpenAI Model Used For:
?? If local model fails to load  
?? If local model crashes  
?? If internet available and configured  
?? As explicit fallback (if configured)  

---

## ?? Security Notes

### Local Model
- ? No API keys exposed
- ? All data stays local
- ? No cloud dependencies
- ? Full control over model

### OpenAI Fallback
- ? API key secured in .env
- ? .env file in .gitignore (not committed)
- ? Only used if explicitly needed
- ?? Requires internet connection
- ?? Minimal data sent to OpenAI

---

## ?? Monitoring

### Check Which Model is Active

```bash
# View logs while running
# Look for either:
# ? "Using local Codette RC-XI model"
# OR
# ?? "Falling back to OpenAI Fine-tuned model"
```

### Monitor Response Quality

```bash
# In browser or Terminal:
# Compare response quality between:
# 1. Local model responses
# 2. OpenAI fallback responses (if triggered)
```

---

## ?? Troubleshooting

### Issue: Local Model Not Loading
```
Error: Model not found at J:\ashesinthedawn\codette_rc_xi_trained
Fix: 
  1. Verify path exists: dir J:\ashesinthedawn\codette_rc_xi_trained
  2. Check file permissions
  3. If missing, rebuild/retrain model
  4. System will fall back to OpenAI automatically
```

### Issue: OpenAI Fallback Failing
```
Error: OpenAI API key invalid or quota exceeded
Fix:
  1. Check API key in .env is correct
  2. Verify API quota at https://platform.openai.com
  3. Local model becomes sole fallback
  4. Check server logs for details
```

### Issue: Slow Responses
```
Symptom: Taking 2-5 seconds per query
Cause: Likely using OpenAI fallback (slow API)
Fix:
  1. Check logs: grep "openai" server.log
  2. Verify local model loaded: curl /health
  3. If using OpenAI, consider keeping local model active
  4. For GPU, verify CUDA is installed: nvidia-smi
```

---

## ?? Related Files

| File | Purpose |
|------|---------|
| `.env` | **Main config** - Model paths and API keys |
| `codette_server_unified.py` | **Backend server** - Loads .env and initializes models |
| `src/lib/dspBridge.ts` | **Frontend bridge** - Communicates with backend |
| `J:\ashesinthedawn\codette_rc_xi_trained\` | **Local model** - Primary AI engine |
| `.gitignore` | **Security** - Keeps .env and credentials safe |

---

## ? Summary

**Current Setup**:
- ?? **PRIMARY**: Local Codette RC-XI Model (fast, free, local)
- ?? **FALLBACK**: OpenAI Fine-tuned Models (high quality, paid, cloud)
- ?? **Flow**: Try local first ? Fall back to OpenAI if needed
- ? **Status**: Ready for production use

**Benefits**:
- Fast responses (local model)
- Low cost (no API calls for normal use)
- Automatic failover to high-quality OpenAI if needed
- Full control and customization
- No internet dependency for primary model

**Next Steps**:
1. Start backend: `python codette_server_unified.py`
2. Start frontend: `npm run dev`
3. Test queries at http://localhost:5173
4. Monitor logs to confirm local model is being used

---

**Configuration Updated**: December 27, 2025  
**Status**: ? Ready to Use
