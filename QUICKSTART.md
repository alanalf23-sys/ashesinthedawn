# Quick Start Guide - Logging & Retry for CoreLogic Studio Server

## ?? Get Started in 5 Minutes

### Step 1: Copy Files to Project Root
```
J:\ashesinthedawn\
??? logging_retry_utils.py          ? Copy this
??? codette_server_enhanced.py       ? Reference implementation
??? codette_server_unified.py        ? Your existing server
??? logs/                            ? Auto-created
```

### Step 2: Update Your Server (codette_server_unified.py)

Add these imports at the **very top** (before FastAPI):

```python
# Add after dotenv imports, before FastAPI import
from logging_retry_utils import (
    setup_logging,
    retry,
    perf_tracker,
    request_logger,
    health_checker,
)

# Replace the current logging.basicConfig() with:
root_logger = setup_logging(
    log_level=os.getenv("LOG_LEVEL", "INFO"),
    log_file="logs/codette_server.log",
)
logger = logging.getLogger(__name__)
logger.info("[OK] Structured logging initialized")
```

### Step 3: Add Retry to Critical Endpoints

Wrap these endpoints with `@retry`:

```python
# Chat endpoint - add decorator
@app.post("/codette/chat")
@app.post("/api/codette/chat")
@retry(
    max_attempts=3,
    initial_delay=0.5,
    exceptions=(ConnectionError, TimeoutError),
    logger_name="codette_chat"
)
async def codette_chat(request: ChatRequest):
    """Chat with Codette AI - with automatic retry on failure"""
    # ... existing code ...
    pass

# Effect processing - add decorator
@app.post("/api/effects/process")
@retry(
    max_attempts=3,
    initial_delay=0.5,
    timeout=30.0,
    exceptions=(ConnectionError, TimeoutError),
)
async def process_effect_unified(request: EffectProcessRequest):
    """Process audio effect with retry on transient failures"""
    # ... existing code ...
    pass
```

### Step 4: Add Request Logging Middleware

Add this **before** the CORS middleware:

```python
from fastapi import Request
from time import time

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests and responses"""
    start_time = time()
    
    request_logger.log_request(
        method=request.method,
        path=request.url.path,
        headers=dict(request.headers),
    )
    
    try:
        response = await call_next(request)
        duration = (time() - start_time) * 1000
        
        request_logger.log_response(
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration,
        )
        
        return response
    
    except Exception as e:
        duration = (time() - start_time) * 1000
        request_logger.log_error(
            method=request.method,
            path=request.url.path,
            error=e,
            duration_ms=duration,
        )
        raise

logger.info("[OK] Request logging middleware added")
```

### Step 5: Add Performance Tracking

Wrap critical functions:

```python
async def route_effect_to_daw_core(...):
    """Route effect processing with performance tracking"""
    with perf_tracker.track_time(f"effect_{effect_type}"):
        # ... existing effect processing code ...
        result = await process_effect(...)
        
        # Get stats (optional)
        stats = perf_tracker.get_stats(f"effect_{effect_type}")
        logger.debug(f"Effect {effect_type} took {stats['avg']:.1f}ms on average")
        
        return result
```

### Step 6: Test It!

```bash
# Terminal 1: Start the server
python codette_server_unified.py

# Terminal 2: Make a test request
curl -X POST http://localhost:8000/codette/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I mix vocals?"}'

# Terminal 3: Watch the logs
tail -f logs/codette_server.log
tail -f logs/codette_server_errors.log
tail -f logs/codette_server_perf.log
```

## ?? What You Get

### Structured Logging Output
```
[2025-01-22T15:30:45.123456+00:00] [INFO] __main__: [OK] Structured logging initialized
[2025-01-22T15:30:46.234567+00:00] [INFO] http_requests: [REQ] POST /codette/chat | Content-Type: application/json
[2025-01-22T15:30:47.345678+00:00] [WARNING] codette_chat: [RETRY] codette_chat failed (attempt 1): ConnectionError | Retrying in 0.50s...
[2025-01-22T15:30:47.845679+00:00] [INFO] codette_chat: [SUCCESS] codette_chat succeeded on attempt 2
[2025-01-22T15:30:48.456780+00:00] [INFO] http_requests: [RES] ? POST /codette/chat -> 200 | Duration: 1210.1ms
[2025-01-22T15:30:48.567890+00:00] [DEBUG] performance: [PERF] chat_processing completed in 1200.5ms
```

### Performance Metrics
```
Performance statistics collected automatically:
- chat_processing: 5 calls, avg 245.3ms, min 201.2ms, max 312.5ms
- effect_compressor: 10 calls, avg 52.1ms, min 45.3ms, max 68.2ms
- effect_reverb: 8 calls, avg 125.7ms, min 110.2ms, max 156.3ms
```

### Log Files Created
```
logs/
??? codette_server.log           (All logs, auto-rotates at 10MB)
??? codette_server.log.1         (Backup)
??? codette_server_errors.log    (Errors only)
??? codette_server_perf.log      (Performance metrics)
```

## ?? Common Patterns

### Pattern 1: Retry Network Calls
```python
@app.post("/api/external-service")
@retry(
    max_attempts=3,
    initial_delay=0.5,
    exceptions=(ConnectionError, TimeoutError, HTTPError),
)
async def call_external_service():
    result = await httpx.get("https://api.example.com/data")
    return result
```

### Pattern 2: Track Long Operations
```python
@app.post("/api/long-operation")
async def long_operation():
    with perf_tracker.track_time("long_operation"):
        # This operation is timed automatically
        await asyncio.sleep(5)
        return {"status": "done"}
    
    # Performance stats available immediately:
    stats = perf_tracker.get_stats("long_operation")
```

### Pattern 3: Selective Retry
```python
@app.post("/api/data")
@retry(
    max_attempts=3,
    # Only retry on network errors, not on validation errors
    exceptions=(ConnectionError, TimeoutError, DBError),
)
async def process_data(request: Request):
    # Won't retry on ValueError, KeyError, etc.
    pass
```

### Pattern 4: Health Check
```python
@app.get("/api/health/detailed")
async def health_detailed():
    """Full health report with performance stats"""
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "healthy",
        "health_checks": health_checker.get_report(),
        "performance_metrics": {
            name: perf_tracker.get_stats(name)
            for name in perf_tracker.metrics.keys()
        }
    }
```

## ?? Monitoring

### View Live Logs
```bash
# All logs with colors
tail -f logs/codette_server.log | grep -E "INFO|WARNING|ERROR"

# Errors only
tail -f logs/codette_server_errors.log

# Performance metrics
tail -f logs/codette_server_perf.log

# Specific component (e.g., chat)
tail -f logs/codette_server.log | grep "codette_chat"

# Retries only
tail -f logs/codette_server.log | grep "RETRY"
```

### Query Performance Stats
```python
# In a monitoring endpoint
@app.get("/api/stats")
async def get_stats():
    stats = {}
    for operation in perf_tracker.metrics.keys():
        stats[operation] = perf_tracker.get_stats(operation)
    
    return {
        "timestamp": get_timestamp(),
        "operations": stats,
        "summary": {
            "total_operations_tracked": len(stats),
            "slowest": max(
                ((k, v['avg']) for k, v in stats.items()),
                key=lambda x: x[1]
            )[0] if stats else None
        }
    }
```

## ?? Configuration

### Environment Variables
```bash
# .env file
LOG_LEVEL=DEBUG              # DEBUG, INFO, WARNING, ERROR
PORT=8000
OPENAI_FALLBACK_ENABLED=true
# ... other vars ...
```

### Adjust Retry Behavior
```python
# Conservative: Fast timeout, few retries (good for HTTP)
@retry(max_attempts=2, initial_delay=0.2, timeout=10.0)

# Aggressive: Long timeout, many retries (good for DSP)
@retry(max_attempts=5, initial_delay=1.0, timeout=120.0)

# Custom backoff: Faster multiplier
@retry(max_attempts=4, exponential_base=3.0)
```

## ?? Troubleshooting

### Logs Not Appearing
```python
# Check log level
setup_logging(log_level="DEBUG")  # More verbose

# Check logs directory exists
import os
os.makedirs("logs", exist_ok=True)

# Check permissions
ls -la logs/
```

### Retry Not Working
```python
# Make sure decorator is applied correctly
@retry(max_attempts=3)  # ? Correct
async def my_function():
    pass

@retry  # ? Wrong - missing parentheses
async def my_function():
    pass

# Verify exception type
@retry(exceptions=(ConnectionError, TimeoutError))  # Specific
@retry()  # All exceptions
```

### Performance Metrics Empty
```python
# Make sure you're using the context manager
with perf_tracker.track_time("operation"):
    # Code here
    pass

# Verify tracker is initialized
from logging_retry_utils import perf_tracker
print(perf_tracker.metrics)  # Should show collected operations
```

## ?? Next Steps

1. **Read Full Documentation**: `LOGGING_RETRY_DOCUMENTATION.md`
2. **See Integration Guide**: `SERVER_INTEGRATION_GUIDE.md`
3. **Reference Implementation**: `codette_server_enhanced.py`
4. **Source Code**: `logging_retry_utils.py`

## ? Checklist

- [ ] Copy `logging_retry_utils.py` to project root
- [ ] Add imports to `codette_server_unified.py`
- [ ] Replace `logging.basicConfig()` with `setup_logging()`
- [ ] Add `@retry` to critical endpoints
- [ ] Add request logging middleware
- [ ] Add performance tracking to DSP calls
- [ ] Test with `curl` or Postman
- [ ] View logs in `logs/` directory
- [ ] Check health endpoint at `/api/health/detailed`
- [ ] Monitor performance with `tail -f logs/codette_server_perf.log`

## ?? You're Done!

Your server now has:
- ? Structured logging with file rotation
- ? Automatic retry with exponential backoff
- ? Request/response tracking
- ? Performance metrics collection
- ? Health checks
- ? Beautiful console output with colors

**Start the server and check the logs!**

```bash
python codette_server_unified.py
# Check logs in terminal:
tail -f logs/codette_server.log
```

---

**Questions?** See `LOGGING_RETRY_DOCUMENTATION.md` for complete API reference.
