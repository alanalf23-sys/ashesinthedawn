#!/usr/bin/env python
"""
Enhanced Codette Server with Logging and Retry - Integration Guide

This file shows how to integrate the logging_retry_utils into the existing
codette_server_unified.py server. Use this as a reference for the modifications.

Key changes:
1. Replace logging.basicConfig with setup_logging()
2. Add @retry decorators to critical endpoints
3. Add request/response logging middleware
4. Integrate dependency health checks
5. Track performance metrics

Usage:
    See integration examples below and apply to codette_server_unified.py
"""

# ============================================================================
# INTEGRATION EXAMPLES
# ============================================================================

"""
### 1. SETUP LOGGING AT TOP OF SERVER ###

Replace the current logging.basicConfig() with:

from logging_retry_utils import setup_logging, perf_tracker, request_logger, health_checker, retry

# Setup structured logging
root_logger = setup_logging(
    log_level="INFO",
    log_file="logs/codette_server.log",
    max_bytes=10 * 1024 * 1024,  # 10 MB per file
    backup_count=5  # Keep 5 backups
)
logger = logging.getLogger(__name__)
logger.info("[OK] Structured logging initialized")


### 2. ADD REQUEST/RESPONSE LOGGING MIDDLEWARE ###

from fastapi import Request, Response
from time import time

@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Log incoming request
    request_logger.log_request(
        method=request.method,
        path=request.url.path,
        headers=dict(request.headers),
    )
    
    # Track execution time
    start_time = time()
    try:
        response = await call_next(request)
        duration = (time() - start_time) * 1000  # ms
        
        # Log successful response
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


### 3. ADD @retry DECORATOR TO CRITICAL ENDPOINTS ###

# Example: Chat endpoint with retry
@app.post("/codette/chat")
@retry(
    max_attempts=3,
    initial_delay=0.5,
    exceptions=(ConnectionError, TimeoutError, Exception),
    logger_name="codette_chat"
)
async def codette_chat(request: ChatRequest):
    \"\"\"Chat with Codette AI - with automatic retry on failure\"\"\"
    # ... existing implementation ...
    pass


# Example: Effect processing with retry
@app.post("/api/effects/process")
@retry(
    max_attempts=3,
    initial_delay=0.5,
    timeout=30.0,
    exceptions=(ConnectionError, TimeoutError),
)
async def process_effect_unified(request: EffectProcessRequest):
    \"\"\"Process audio effect with retry on transient failures\"\"\"
    # ... existing implementation ...
    pass


# Example: DAW Core integration with retry
@app.post("/daw/process/eq/highpass")
@retry(
    max_attempts=3,
    initial_delay=0.5,
    exceptions=(Exception,),
)
async def daw_highpass(audio_data: List[float], cutoff: float = 100):
    \"\"\"Highpass filter with automatic retry\"\"\"
    # ... existing implementation ...
    pass


### 4. TRACK PERFORMANCE METRICS ###

# In critical functions, use perf_tracker:

async def route_effect_to_daw_core(effect_type, parameters, audio_data, sample_rate):
    with perf_tracker.track_time(f"effect_{effect_type}"):
        # ... effect processing code ...
        pass
    
    # Get performance stats
    stats = perf_tracker.get_stats(f"effect_{effect_type}")
    if stats:
        logger.debug(f"Effect {effect_type} stats: {stats}")


### 5. HEALTH CHECKS ON STARTUP ###

# In the lifespan function:

async def lifespan(app: FastAPI):
    # ... existing startup code ...
    
    # Check dependencies
    logger.info("[OK] Starting dependency health checks...")
    
    # Check OpenAI (if enabled)
    if OPENAI_AVAILABLE:
        is_healthy = await health_checker.check_async(
            "OpenAI",
            check_openai_health,
            max_attempts=3,
            timeout=5.0
        )
    
    # Check DAW Core (if available)
    if DAW_CORE_API_AVAILABLE:
        is_healthy = await health_checker.check_async(
            "DAW Core",
            check_daw_core_health,
            max_attempts=3,
            timeout=5.0
        )
    
    # Check Supabase (if available)
    if SUPABASE_AVAILABLE:
        is_healthy = await health_checker.check_async(
            "Supabase",
            check_supabase_health,
            max_attempts=3,
            timeout=5.0
        )
    
    # Log health report
    health_report = health_checker.get_report()
    logger.info(f"[HEALTH] Report: {health_report['healthy']}/{health_report['total_dependencies']} healthy")
    
    try:
        yield
    finally:
        # Log performance stats on shutdown
        perf_tracker.log_stats()
        logger.info("Shutdown complete")


### 6. ADD HEALTH CHECK FUNCTIONS ###

async def check_openai_health():
    \"\"\"Check if OpenAI API is accessible\"\"\"
    try:
        if not OPENAI_AVAILABLE or not openai_client:
            return False
        
        # Try to list threads (light API call)
        openai_client.beta.threads.create()
        return True
    except Exception:
        return False


async def check_daw_core_health():
    \"\"\"Check if DAW Core API is responding\"\"\"
    try:
        if not DAW_CORE_API_AVAILABLE:
            return False
        
        # Try a simple effect list call
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"http://localhost:{os.environ.get('PORT', 8000)}/api/effects/list",
                timeout=5.0
            )
            return response.status_code == 200
    except Exception:
        return False


async def check_supabase_health():
    \"\"\"Check if Supabase is accessible\"\"\"
    try:
        if not SUPABASE_AVAILABLE:
            return False
        
        # Try a simple query
        # (implementation depends on Supabase client)
        return True
    except Exception:
        return False


### 7. CREATE ENDPOINT THAT RETURNS HEALTH REPORT ###

@app.get("/api/health/detailed")
async def get_detailed_health():
    \"\"\"Get detailed health status with performance metrics\"\"\"
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "health": health_checker.get_report(),
        "performance_metrics": {
            name: perf_tracker.get_stats(name)
            for name in perf_tracker.metrics.keys()
        }
    }


### 8. LOG ROTATION AND ARCHIVAL ###

# Logs are automatically rotated when they exceed 10MB
# Old logs are archived in logs/ directory

# View logs:
#   - Main: logs/codette_server.log
#   - Errors: logs/codette_server_errors.log
#   - Performance: logs/codette_server_perf.log
#   - Backups: logs/codette_server.log.1, .log.2, etc.


### 9. RETRY CUSTOMIZATION ###

# Adjust retry behavior for different endpoints:

# Conservative: Few retries, fast timeout
@retry(max_attempts=2, initial_delay=0.2, timeout=10.0)
async def fast_endpoint():
    pass

# Aggressive: Many retries, longer timeout (for long operations)
@retry(max_attempts=5, initial_delay=1.0, max_delay=30.0, timeout=120.0)
async def long_operation():
    pass

# Selective: Only retry on specific exceptions
@retry(
    max_attempts=3,
    exceptions=(ConnectionError, TimeoutError),  # Don't retry on ValueError, etc.
)
async def selective_retry():
    pass


### 10. MANUAL RETRY USAGE ###

# For more control, use retry_async() function:

from logging_retry_utils import retry_async

# In an endpoint
async def my_endpoint():
    result = await retry_async(
        my_async_function,
        arg1, arg2,
        max_attempts=3,
        initial_delay=0.5,
        keyword_arg=value
    )
    return result

"""

# ============================================================================
# QUICK REFERENCE
# ============================================================================

QUICK_REFERENCE = """
LOGGING & RETRY UTILITIES - QUICK REFERENCE
=============================================

1. IMPORTS:
   from logging_retry_utils import (
       setup_logging,
       retry,
       retry_async,
       perf_tracker,
       request_logger,
       health_checker,
       DependencyHealthCheck,
       PerformanceTracker,
   )

2. SETUP:
   # Call once at startup
   root_logger = setup_logging(log_level="INFO")

3. DECORATORS:
   @retry(max_attempts=3, initial_delay=0.5)
   async def my_function():
       pass

4. TRACKING:
   with perf_tracker.track_time("operation_name"):
       # ... code ...
       pass

5. LOGGING:
   request_logger.log_request("GET", "/api/endpoint")
   request_logger.log_response("GET", "/api/endpoint", 200, 15.5)

6. HEALTH CHECKS:
   is_healthy = await health_checker.check_async("Service", check_func)
   report = health_checker.get_report()

LOG FILES CREATED:
   - logs/codette_server.log          (Main log)
   - logs/codette_server_errors.log   (Errors only)
   - logs/codette_server_perf.log     (Performance metrics)

Each file automatically rotates when it reaches 10MB (5 backups kept).

FEATURES:
   ? Structured logging with timestamps
   ? Automatic retry with exponential backoff & jitter
   ? Request/response tracking
   ? Performance metrics collection
   ? Dependency health checks
   ? File rotation and archival
   ? Colorized console output
   ? Async and sync support
"""

print(QUICK_REFERENCE)
