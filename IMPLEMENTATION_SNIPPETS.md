# ?? Quick Implementation - Copy & Paste Code Snippets

**Time to implement**: ~10 minutes  
**Files to modify**: 1 (codette_server_unified.py)  
**Files to add**: 2 (already created)

---

## BEFORE YOU START

1. ? `.env` file updated with CODETTE_MODEL_ID
2. ? `codette_local_loader.py` created
3. ? `codette_integration.py` created
4. ? **Next**: Modify `codette_server_unified.py`

---

## MODIFICATION 1: Add Imports (Line ~60)

**Find this section:**
```python
# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    env_file = Path(__file__).parent / '.env'
    if env_file.exists():
        load_dotenv(env_file)
except ImportError:
    pass  # dotenv not installed, fall back to environment variables
```

**Add after it:**
```python
# ============================================================================
# LOCAL CODETTE MODEL INTEGRATION
# ============================================================================

from codette_local_loader import get_local_model, load_local_model, is_local_model_available
from codette_integration import get_integration, initialize_integration, query_codette

# Local model state
local_model_loader = None
CODETTE_LOCAL_AVAILABLE = False
```

---

## MODIFICATION 2: Load Local Model (After Line ~520)

**Find this section:**
```python
# Try to import OpenAI for fallback model
OPENAI_AVAILABLE = False
openai_client = None
OPENAI_FALLBACK_ENABLED = os.getenv("OPENAI_FALLBACK_ENABLED", "false").lower() == "true"
```

**Add BEFORE it:**
```python
# ============================================================================
# LOCAL CODETTE MODEL LOADING (Priority 1: BEFORE OpenAI)
# ============================================================================

CODETTE_LOCAL_AVAILABLE = False
local_model_loader = None

try:
    logger.info("[LocalModel] Initializing local Codette RC-XI model...")
    local_model_loader = get_local_model()
    
    if local_model_loader.load():
        CODETTE_LOCAL_AVAILABLE = True
        logger.info("[OK] Local Codette RC-XI model loaded successfully")
        logger.info(f"     Model: {local_model_loader.model_id}")
        logger.info(f"     Device: {local_model_loader.device}")
        logger.info(f"     Load time: {local_model_loader.load_time_ms}ms")
        if hasattr(local_model_loader.model, 'config'):
            num_params = sum(p.numel() for p in local_model_loader.model.parameters())
            logger.info(f"     Parameters: {num_params:,}")
    else:
        logger.warning("[!] Local Codette RC-XI model failed to load")
        logger.warning("    Will use OpenAI Assistant as fallback")
        
except Exception as e:
    logger.error(f"[X] Local model initialization error: {e}")
    CODETTE_LOCAL_AVAILABLE = False
```

---

## MODIFICATION 3: Initialize Integration (After OpenAI initialization)

**Find the end of OpenAI setup (around line ~560), and add:**

```python
# Initialize integration layer
try:
    logger.info("[Integration] Initializing Codette integration layer...")
    initialize_integration(
        openai_available=(OPENAI_AVAILABLE and OPENAI_FALLBACK_ENABLED),
        codette_engine=codette_engine
    )
    logger.info("[OK] Integration layer initialized")
except Exception as e:
    logger.warning(f"[!] Integration initialization failed: {e}")
```

---

## MODIFICATION 4: Replace Chat Endpoint (Around Line ~1400)

**Find:**
```python
@app.post("/codette/chat")
@app.post("/api/codette/chat")
async def codette_chat(request: ChatRequest):
    """Chat with Codette AI - OpenAI Assistant as primary..."""
```

**Replace entire function with:**

```python
@app.post("/codette/chat")
@app.post("/api/codette/chat")
async def codette_chat(request: ChatRequest):
    """Chat with Codette AI - Local Model PRIMARY, OpenAI FALLBACK"""
    response = "I'm Codette. How can I help with your production?"
    source = "fallback"
    confidence = 0.5
    
    logger.info(f"[Chat] Message: {request.message[:50]}...")
    
    # TRY 1: LOCAL CODETTE RC-XI MODEL (PRIMARY)
    if CODETTE_LOCAL_AVAILABLE and local_model_loader and local_model_loader.is_available():
        logger.info("[Chat] Trying local model (priority 1)...")
        try:
            prompt = request.message
            if request.daw_context:
                prompt += "\n\n[DAW Context]"
                if request.daw_context.get('selectedTrack'):
                    track = request.daw_context['selectedTrack']
                    prompt += f"\nTrack: {track.get('name')} ({track.get('type')})"
                if request.daw_context.get('trackCount'):
                    prompt += f"\nTracks: {request.daw_context['trackCount']}"
            
            response = local_model_loader.generate(prompt, max_length=300, temperature=0.7)
            source = "local_codette_rc_xi"
            confidence = 0.95
            logger.info(f"[Chat] [OK] Local model ({len(response)} chars)")
            
            return {
                "response": response,
                "perspective": request.perspective,
                "confidence": confidence,
                "timestamp": get_timestamp(),
                "source": source
            }
        except Exception as e:
            logger.error(f"[Chat] Local model error: {e}")
    
    # TRY 2: LOCAL CODETTE ENGINE (FALLBACK 1)
    if codette_engine and hasattr(codette_engine, 'respond'):
        logger.info("[Chat] Trying Codette engine (priority 2)...")
        try:
            if request.daw_context:
                response = codette_engine.respond(request.message, request.daw_context)
            else:
                response = codette_engine.respond(request.message)
            source = codette_engine_type or "codette"
            confidence = 0.85
            logger.info(f"[Chat] [OK] Codette engine ({len(response)} chars)")
            
            return {
                "response": response,
                "perspective": request.perspective,
                "confidence": confidence,
                "timestamp": get_timestamp(),
                "source": source
            }
        except Exception as e:
            logger.error(f"[Chat] Codette engine error: {e}")
    
    # TRY 3: OPENAI ASSISTANT (FALLBACK 2)
    if OPENAI_AVAILABLE and OPENAI_FALLBACK_ENABLED:
        logger.info("[Chat] Trying OpenAI (priority 3)...")
        openai_result = await query_openai_assistant(request.message, request.daw_context)
        
        if openai_result["response"]:
            response = openai_result["response"]
            source = openai_result["source"]
            confidence = openai_result["confidence"]
            logger.info(f"[Chat] [OK] OpenAI ({len(response)} chars)")
            
            return {
                "response": response,
                "perspective": request.perspective,
                "confidence": confidence,
                "timestamp": get_timestamp(),
                "source": source
            }
    
    # FALLBACK: KEYWORD
    logger.warning("[Chat] Using keyword fallback")
    response = generate_basic_fallback_response(request.message)
    
    return {
        "response": response,
        "perspective": request.perspective,
        "confidence": 0.5,
        "timestamp": get_timestamp(),
        "source": "fallback_keyword"
    }
```

---

## MODIFICATION 5: Add Model Status Endpoint

**Find the `/codette/status` endpoint (around line ~1300) and add this AFTER it:**

```python
@app.get("/codette/model-status")
@app.get("/api/codette/model-status")
async def codette_model_status():
    """Get status of all Codette models"""
    
    local_info = {}
    if CODETTE_LOCAL_AVAILABLE and local_model_loader:
        local_info = local_model_loader.get_info()
    
    return {
        "local_model": {
            "available": CODETTE_LOCAL_AVAILABLE,
            "info": local_info,
            "priority": 1
        },
        "codette_engine": {
            "available": codette_engine is not None,
            "type": codette_engine_type if codette_engine else None,
            "priority": 2
        },
        "openai_assistant": {
            "available": OPENAI_AVAILABLE and OPENAI_FALLBACK_ENABLED,
            "assistant_id": OPENAI_ASSISTANT_ID if OPENAI_AVAILABLE else None,
            "priority": 3
        },
        "priority_chain": [
            "Local Codette RC-XI (PRIMARY)",
            "Local Codette Engine",
            "OpenAI Assistant",
            "Keyword Fallback"
        ],
        "timestamp": get_timestamp()
    }
```

---

## MODIFICATION 6: Update Startup Banner (Optional but Recommended)

**Find `_log_startup_banner()` function (around line ~850)**

**Find this line:**
```python
    # Codette core - try enhanced 9-perspective version first
```

**Add BEFORE it:**
```python
    # Local Codette RC-XI Model status
    logger.info("")
    logger.info(" Local Codette RC-XI Model:")
    if CODETTE_LOCAL_AVAILABLE and local_model_loader and local_model_loader.is_available():
        logger.info("   [OK] Status: LOADED & READY (PRIMARY)")
        logger.info(f"   * Model: {local_model_loader.model_id}")
        logger.info(f"   * Device: {local_model_loader.device}")
        logger.info(f"   * Load time: {local_model_loader.load_time_ms}ms")
        logger.info("   * Priority: HIGHEST")
    else:
        logger.info("   [X] Status: NOT AVAILABLE")
        logger.info("   * Using fallback engines")
```

---

## COMPLETE! ??

Your server now has:
- ? Local Codette RC-XI as PRIMARY AI engine
- ? 3-layer fallback (Codette engine ? OpenAI ? Keyword)
- ? Model status endpoint
- ? Proper startup logging
- ? Fast responses (200-500ms from local model)

---

## Testing

### 1. Start Server
```bash
python codette_server_unified.py
```

### 2. Check Local Model Loaded
```bash
curl http://localhost:8000/codette/model-status
```

### 3. Test Chat
```bash
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is gain staging?"}'
```

Should respond in **<500ms** with `"source": "local_codette_rc_xi"`

---

## Expected Output

```
[OK] Loading local Codette RC-XI model...
[OK] Local Codette RC-XI model loaded successfully
     Model: codette_rc_xi_trained
     Device: cuda
     Load time: 2345ms
     Parameters: 1,234,567,890
[OK] Integration layer initialized
...
[OK] CODETTE AI UNIFIED SERVER IS READY
```

---

## You're Done! ??

Local Codette model is now your PRIMARY AI engine!
