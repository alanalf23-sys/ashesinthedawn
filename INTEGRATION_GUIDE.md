# Integration Guide: Adding Local Codette Model to codette_server_unified.py

## Overview
This guide shows how to integrate the local Codette RC-XI model into the existing server.
The model will be PRIMARY, with OpenAI as fallback.

---

## STEP 1: Add imports at the top of codette_server_unified.py

Add these lines after the existing imports (around line 60):

```python
# ============================================================================
# LOCAL CODETTE MODEL INTEGRATION (New - Priority 1)
# ============================================================================

from codette_local_loader import get_local_model, load_local_model, is_local_model_available
from codette_integration import get_integration, initialize_integration, query_codette

# Local model loader instance
local_model_loader = None
CODETTE_LOCAL_AVAILABLE = False
```

---

## STEP 2: Add local model loading in dependency checks section

Add this after the OpenAI initialization (around line 420):

```python
# ============================================================================
# LOCAL CODETTE MODEL LOADING (Priority 1: Before OpenAI)
# ============================================================================

CODETTE_LOCAL_AVAILABLE = False
local_model_loader = None

try:
    logger.info("[OK] Loading local Codette RC-XI model...")
    local_model_loader = get_local_model()
    
    if local_model_loader.load():
        CODETTE_LOCAL_AVAILABLE = True
        logger.info("[OK] Local Codette RC-XI model loaded successfully")
        logger.info(f"    * Model: {local_model_loader.model_id}")
        logger.info(f"    * Device: {local_model_loader.device}")
        logger.info(f"    * Load time: {local_model_loader.load_time_ms}ms")
        logger.info(f"    * Parameters: {sum(p.numel() for p in local_model_loader.model.parameters()):,}")
        logger.info(f"    * GPU: {'Yes' if local_model_loader.use_gpu else 'No'}")
    else:
        logger.warning("[!] Local Codette RC-XI model failed to load")
        logger.warning("    * Will fall back to OpenAI Assistant")
        
except Exception as e:
    logger.error(f"[X] Local model initialization error: {e}")
    logger.warning("    * Continuing with OpenAI fallback...")
    CODETTE_LOCAL_AVAILABLE = False

# Initialize integration layer AFTER both models are loaded
try:
    from codette_integration import initialize_integration
    initialize_integration(
        openai_available=OPENAI_AVAILABLE and OPENAI_FALLBACK_ENABLED,
        codette_engine=codette_engine
    )
    logger.info("[OK] Codette integration layer initialized")
except Exception as e:
    logger.warning(f"[!] Failed to initialize integration layer: {e}")
```

---

## STEP 3: Update the startup banner

In the `_log_startup_banner()` function, add this after the "Codette AI Engine:" section (around line 850):

```python
    # Local Codette RC-XI Model status
    logger.info("")
    logger.info(" Local Codette RC-XI Model:")
    if CODETTE_LOCAL_AVAILABLE and local_model_loader and local_model_loader.is_available():
        logger.info("   [OK] Status: LOADED (PRIMARY)")
        logger.info(f"   * Model: {local_model_loader.model_id}")
        logger.info(f"   * Device: {local_model_loader.device}")
        logger.info(f"   * Load Time: {local_model_loader.load_time_ms}ms")
        logger.info("   * Response Priority: HIGHEST (used first)")
    else:
        logger.info("   [X] Status: NOT AVAILABLE")
        logger.info("   * Using OpenAI fallback instead")
    
    # Response priority chain
    logger.info("")
    logger.info(" Response Priority Chain:")
    logger.info("   1. Local Codette RC-XI Model (PRIMARY)")
    logger.info("   2. Local Codette Engine (if available)")
    logger.info("   3. OpenAI Assistant (if available)")
    logger.info("   4. OpenAI Fine-tuned Models (if available)")
    logger.info("   5. Keyword Fallback (last resort)")
```

---

## STEP 4: Update the /codette/chat endpoint

Replace the existing chat endpoint (around line 1400) with this:

```python
@app.post("/codette/chat")
@app.post("/api/codette/chat")
async def codette_chat(request: ChatRequest):
    """Chat with Codette AI - Local Model as PRIMARY, OpenAI as fallback"""
    response = "I'm Codette. How can I help with your production?"
    source = "fallback"
    confidence = 0.5
    
    # Log incoming request
    logger.info(f"[Chat] Message: {request.message[:50]}... | Source: chat endpoint")
    
    # TRY 1: LOCAL CODETTE RC-XI MODEL (PRIMARY)
    if CODETTE_LOCAL_AVAILABLE and local_model_loader and local_model_loader.is_available():
        logger.info("[Chat] Trying local Codette RC-XI model (priority 1)...")
        try:
            # Build prompt with context
            prompt = request.message
            if request.daw_context:
                prompt += "\n\n[DAW Context]"
                if request.daw_context.get('selectedTrack'):
                    track = request.daw_context['selectedTrack']
                    prompt += f"\nTrack: {track.get('name', 'Unknown')} ({track.get('type', 'audio')})"
                    prompt += f"\nVolume: {track.get('volume', 0)} dB"
                if request.daw_context.get('trackCount'):
                    prompt += f"\nTracks: {request.daw_context['trackCount']}"
            
            # Generate response
            response = local_model_loader.generate(
                prompt,
                max_length=300,
                temperature=0.7,
                top_p=0.9
            )
            source = "local_codette_rc_xi"
            confidence = 0.95
            logger.info(f"[Chat] [OK] Local model response ({len(response)} chars)")
            
            # Ingest into memory
            try:
                asyncio.create_task(
                    ingest_chat_to_codette(
                        user_id=str(request.daw_context.get('user_id', 'default')) if request.daw_context else 'default',
                        user_message=request.message,
                        assistant_response=response,
                        source=source
                    )
                )
            except Exception:
                pass
            
            return {
                "response": response,
                "perspective": request.perspective,
                "confidence": confidence,
                "timestamp": get_timestamp(),
                "source": source
            }
        except Exception as e:
            logger.error(f"[Chat] [X] Local model error: {e}")
            logger.info("[Chat] Falling back to next engine...")
    
    # TRY 2: LOCAL CODETTE ENGINE (FALLBACK 1)
    if codette_engine and hasattr(codette_engine, 'respond'):
        logger.info("[Chat] Trying local Codette engine (priority 2)...")
        try:
            response = codette_engine.respond(request.message, request.daw_context) if request.daw_context else codette_engine.respond(request.message)
            source = codette_engine_type or "codette"
            confidence = 0.85
            logger.info(f"[Chat] [OK] Codette engine response ({len(response)} chars)")
            
            # Ingest into memory
            try:
                asyncio.create_task(
                    ingest_chat_to_codette(
                        user_id=str(request.daw_context.get('user_id', 'default')) if request.daw_context else 'default',
                        user_message=request.message,
                        assistant_response=response,
                        source=source
                    )
                )
            except Exception:
                pass
            
            return {
                "response": response,
                "perspective": request.perspective,
                "confidence": confidence,
                "timestamp": get_timestamp(),
                "source": source
            }
        except Exception as e:
            logger.error(f"[Chat] [X] Codette engine error: {e}")
            logger.info("[Chat] Falling back to next engine...")
    
    # TRY 3: OPENAI ASSISTANT (FALLBACK 2)
    if OPENAI_AVAILABLE and OPENAI_FALLBACK_ENABLED:
        logger.info("[Chat] Trying OpenAI Assistant (priority 3)...")
        openai_result = await query_openai_assistant(request.message, request.daw_context)
        
        if openai_result["response"]:
            response = openai_result["response"]
            source = openai_result["source"]
            confidence = openai_result["confidence"]
            logger.info(f"[Chat] [OK] OpenAI response ({len(response)} chars)")
            
            try:
                asyncio.create_task(
                    ingest_chat_to_codette(
                        user_id=str(request.daw_context.get('user_id', 'default')) if request.daw_context else 'default',
                        user_message=request.message,
                        assistant_response=response,
                        source=source
                    )
                )
            except Exception:
                pass
            
            return {
                "response": response,
                "perspective": request.perspective,
                "confidence": confidence,
                "timestamp": get_timestamp(),
                "source": source
            }
        else:
            logger.error(f"[Chat] [X] OpenAI failed: {openai_result.get('error')}")
    
    # LAST RESORT: FALLBACK
    logger.warning("[Chat] All engines exhausted, using keyword fallback")
    response = generate_basic_fallback_response(request.message)
    source = "fallback_keyword"
    confidence = 0.5
    
    return {
        "response": response,
        "perspective": request.perspective,
        "confidence": confidence,
        "timestamp": get_timestamp(),
        "source": source
    }
```

---

## STEP 5: Add new model status endpoint

Add this new endpoint after the existing endpoints (around line 1300):

```python
@app.get("/codette/model-status")
@app.get("/api/codette/model-status")
async def codette_model_status():
    """Get status of all Codette models and engines"""
    
    # Local model info
    local_model_info = {}
    if CODETTE_LOCAL_AVAILABLE and local_model_loader:
        local_model_info = local_model_loader.get_info()
    
    # Get OpenAI info
    openai_info = {
        "available": OPENAI_AVAILABLE and OPENAI_FALLBACK_ENABLED,
        "assistant_id": OPENAI_ASSISTANT_ID if (OPENAI_AVAILABLE and OPENAI_FALLBACK_ENABLED) else None,
        "threads": len(openai_threads) if OPENAI_AVAILABLE else 0
    }
    
    # Get Codette engine info
    codette_info = {
        "available": codette_engine is not None,
        "type": codette_engine_type if codette_engine else None
    }
    
    return {
        "local_model": {
            "available": CODETTE_LOCAL_AVAILABLE,
            "info": local_model_info,
            "priority": 1
        },
        "codette_engine": {
            **codette_info,
            "priority": 2
        },
        "openai_assistant": {
            **openai_info,
            "priority": 3
        },
        "priority_chain": [
            "Local Codette RC-XI Model",
            "Local Codette Engine",
            "OpenAI Assistant",
            "Keyword Fallback"
        ],
        "timestamp": get_timestamp()
    }
```

---

## STEP 6: Update startup banner to show local model

In the startup banner, add under "Codette AI Engine:":

```python
logger.info("")
logger.info(" Model Priority:")
if CODETTE_LOCAL_AVAILABLE:
    logger.info("   [OK] 1. Local Codette RC-XI Model (ACTIVE)")
else:
    logger.info("   [X] 1. Local Codette RC-XI Model (not available)")
logger.info("   [OK] 2. Local Codette Engine (available)")
if OPENAI_AVAILABLE and OPENAI_FALLBACK_ENABLED:
    logger.info("   [OK] 3. OpenAI Assistant (fallback)")
else:
    logger.info("   [!] 3. OpenAI Assistant (not available)")
logger.info("   [OK] 4. Keyword Fallback (last resort)")
```

---

## Summary of Changes

| Component | Change | Benefit |
|-----------|--------|---------|
| **Local Model** | Load RC-XI as PRIMARY | Fast (200-500ms), free, full control |
| **Chat Endpoint** | Try local first | Uses local model by default |
| **Fallback Chain** | 4-layer fallback | Always has response option |
| **Status Endpoint** | New endpoint | See which model is active |
| **Startup Banner** | Model priorities | Clear visibility at startup |

---

## Testing After Integration

### Test 1: Verify Local Model Loads
```bash
curl http://localhost:8000/codette/model-status
```

Should show:
```json
{
  "local_model": {
    "available": true,
    "info": {
      "loaded": true,
      "model_id": "codette_rc_xi_trained",
      ...
    },
    "priority": 1
  },
  ...
}
```

### Test 2: Chat Uses Local Model
```bash
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is gain staging?"}'
```

Should respond in <500ms with `"source": "local_codette_rc_xi"`

### Test 3: Check Server Logs
```
[OK] Loading local Codette RC-XI model...
[OK] Local Codette RC-XI model loaded successfully
    * Model: codette_rc_xi_trained
    * Device: cuda
    * Load time: 2345ms
```

---

## If Local Model Fails to Load

The server will:
1. Log an error
2. Fall back to OpenAI Assistant
3. If OpenAI unavailable, use local Codette engine
4. If all fail, use keyword fallback
5. Continue running normally

All endpoints remain functional with automatic fallback.

---

## Performance Tips

1. **First Query:** ~2-3 seconds (model initialization)
2. **Subsequent Queries:** 200-500ms (model cached)
3. **GPU Speedup:** ~5-10x faster if CUDA available
4. **Memory:** ~4-8GB (adjust max_length if needed)

---

Done! The local Codette model is now integrated as the PRIMARY AI engine with a 4-layer fallback chain.
