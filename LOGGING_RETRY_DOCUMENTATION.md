# CoreLogic Studio Server - Logging & Retry Enhancement

## Overview

This package provides **production-grade logging and automatic retry functionality** for the CoreLogic Studio server. It's designed to improve reliability, debuggability, and performance tracking.

## What's Included

### 1. **logging_retry_utils.py**
Core utilities module with:
- Structured logging configuration
- Automatic retry decorator with exponential backoff
- Request/response logging
- Performance metrics tracking
- Dependency health checks

### 2. **codette_server_enhanced.py**
Drop-in enhanced server that demonstrates:
- How to use the logging utilities
- Integration with FastAPI
- Retry-protected endpoints
- Performance tracking middleware
- WebSocket logging

### 3. **SERVER_INTEGRATION_GUIDE.md**
Complete integration instructions for adding these features to your existing server.

## Quick Start

### Installation

1. **Place the utility files in your project root:**
   ```
   J:\ashesinthedawn\
   ??? logging_retry_utils.py          (NEW)
   ??? codette_server_enhanced.py       (NEW - optional reference)
   ??? SERVER_INTEGRATION_GUIDE.md      (NEW)
   ??? codette_server_unified.py        (existing)
   ??? ...
   ```

2. **No additional dependencies needed!**
   All utilities use Python standard library only.

### Basic Usage

```python
from logging_retry_utils import setup_logging, retry

# Setup logging (once at startup)
setup_logging(log_level="INFO")

# Add retry to any function
@retry(max_attempts=3, initial_delay=0.5)
async def my_endpoint():
    return "Success!"
```

## Features

### 1. Structured Logging

**Automatic file logging with rotation:**
```
logs/
??? codette_server.log           (main log, 10MB max)
??? codette_server.log.1         (backup)
??? codette_server.log.2         (backup)
??? codette_server_errors.log    (errors only)
??? codette_server_perf.log      (performance metrics)
```

**Colorized console output:**
```
[2025-01-22T15:30:45.123456+00:00] [INFO] __main__: Server started
[2025-01-22T15:30:46.234567+00:00] [WARNING] codette_chat: Retry attempt 1/3
[2025-01-22T15:30:47.345678+00:00] [ERROR] effect_processing: Processing failed
```

### 2. Automatic Retry Decorator

**Exponential backoff with jitter:**
```python
@retry(
    max_attempts=3,
    initial_delay=0.5,      # First retry: 0.5s
    max_delay=30.0,         # Cap at 30s
    exponential_base=2.0,   # 0.5s ? 1.0s ? 2.0s
    jitter=True,            # Add randomness ±10%
    timeout=30.0            # Overall timeout
)
async def my_api_call():
    # Automatically retries on any exception
    return await api.call()
```

**Selective retry (only specific exceptions):**
```python
@retry(
    max_attempts=3,
    exceptions=(ConnectionError, TimeoutError),  # Don't retry on ValueError
)
async def network_call():
    pass
```

### 3. Performance Tracking

**Automatic timing of functions:**
```python
with perf_tracker.track_time("process_effect"):
    # Code here is timed
    result = process_effect()

# Get statistics
stats = perf_tracker.get_stats("process_effect")
# ? {'count': 5, 'min': 15.2, 'avg': 18.5, 'max': 22.1, 'total': 92.5}
```

**Automatic logging on shutdown:**
```
========================================================
PERFORMANCE STATISTICS
========================================================
chat_processing                  | Count:   3 | Avg:  245.3ms | Min:  201.2ms | Max:  312.5ms
effect_compressor                | Count:  10 | Avg:   52.1ms | Min:   45.3ms | Max:   68.2ms
effect_reverb                    | Count:   5 | Avg:  125.7ms | Min:  110.2ms | Max:  156.3ms
```

### 4. Request/Response Logging

```python
# Automatically logs:
# [REQ] GET /api/effects/list | Content-Type: application/json | Body: None
# [RES] ? GET /api/effects/list -> 200 | Duration: 2.3ms | Size: 1024 bytes
# [ERR] POST /codette/chat | ConnectionError | Duration: 5000.0ms
```

### 5. Dependency Health Checks

```python
# Check if services are healthy
is_healthy = await health_checker.check_async(
    "OpenAI",
    check_openai_health,
    max_attempts=3,
    timeout=5.0
)

# Get full health report
report = health_checker.get_report()
# ? {
#     'timestamp': '2025-01-22T15:30:45.123456+00:00',
#     'total_dependencies': 3,
#     'healthy': 3,
#     'unhealthy': 0,
#     'status': 'healthy',
#     'results': {...}
# }
```

## Integration Examples

### Example 1: Add Retry to Chat Endpoint

```python
from logging_retry_utils import retry

@app.post("/codette/chat")
@retry(
    max_attempts=3,
    initial_delay=0.5,
    exceptions=(ConnectionError, TimeoutError),
)
async def codette_chat(request: ChatRequest):
    # This endpoint will automatically retry on connection/timeout errors
    response = await openai_client.chat.completions.create(...)
    return response
```

### Example 2: Track Effect Processing Performance

```python
@app.post("/api/effects/process")
@retry(max_attempts=3, initial_delay=0.5)
async def process_effect_unified(request: EffectProcessRequest):
    with perf_tracker.track_time(f"effect_{request.effect_type}"):
        # Effect processing code
        result = await route_effect_to_daw_core(...)
        
        # Get stats
        stats = perf_tracker.get_stats(f"effect_{request.effect_type}")
        logger.info(f"Effect {request.effect_type} took {stats['avg']:.1f}ms average")
        
        return result
```

### Example 3: Health Checks on Startup

```python
async def check_openai_health():
    try:
        if not openai_client:
            return False
        # Light API call to verify
        openai_client.beta.threads.create()
        return True
    except Exception:
        return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Check dependencies on startup
    is_healthy = await health_checker.check_async(
        "OpenAI",
        check_openai_health,
        max_attempts=3,
        timeout=5.0
    )
    
    report = health_checker.get_report()
    logger.info(f"Health check: {report['healthy']}/{report['total_dependencies']} services healthy")
    
    try:
        yield
    finally:
        # Log stats on shutdown
        perf_tracker.log_stats()
```

## Configuration

### Logging Levels

```python
setup_logging(log_level="DEBUG")    # Verbose
setup_logging(log_level="INFO")     # Normal (default)
setup_logging(log_level="WARNING")  # Errors + warnings
setup_logging(log_level="ERROR")    # Errors only
```

### Retry Configuration

```python
# Conservative: Fast timeout, few retries
@retry(max_attempts=2, initial_delay=0.2, timeout=10.0)
async def fast_endpoint():
    pass

# Aggressive: Long timeout, many retries
@retry(max_attempts=5, initial_delay=1.0, max_delay=30.0, timeout=120.0)
async def long_operation():
    pass

# Custom backoff
@retry(
    max_attempts=4,
    initial_delay=0.1,
    exponential_base=3.0,    # Faster backoff: 0.1s ? 0.3s ? 0.9s
    backoff_factor=1.5,      # Multiply by 1.5 each time
    jitter=True
)
async def custom_backoff():
    pass
```

### Log File Rotation

```python
setup_logging(
    log_file="logs/my_server.log",
    max_bytes=10 * 1024 * 1024,  # 10 MB per file
    backup_count=5                 # Keep 5 backups
)
```

## Monitoring & Debugging

### View Logs in Real-Time

```bash
# Main log
tail -f logs/codette_server.log

# Errors only
tail -f logs/codette_server_errors.log

# Performance metrics
tail -f logs/codette_server_perf.log
```

### Get Health Report

```python
# Via API endpoint
GET /api/health/detailed
# Returns:
# {
#   "timestamp": "2025-01-22T15:30:45.123456+00:00",
#   "health": {
#     "timestamp": "...",
#     "total_dependencies": 3,
#     "healthy": 3,
#     "unhealthy": 0,
#     "status": "healthy",
#     "results": {...}
#   },
#   "performance_metrics": {
#     "chat_processing": {"count": 5, "avg": 245.3, ...},
#     "effect_processing": {"count": 10, "avg": 52.1, ...}
#   }
# }
```

### Analyze Performance

```python
# In your code
stats = perf_tracker.get_stats("chat_processing")
print(f"Chat processing:")
print(f"  - Count: {stats['count']}")
print(f"  - Average: {stats['avg']:.1f}ms")
print(f"  - Min: {stats['min']:.1f}ms")
print(f"  - Max: {stats['max']:.1f}ms")
```

## Best Practices

### 1. Choose Appropriate Retry Strategies

```python
# For network calls: retry on connection errors
@retry(
    max_attempts=3,
    exceptions=(ConnectionError, TimeoutError, HTTPError)
)
async def external_api_call():
    pass

# For database: retry on transient failures
@retry(
    max_attempts=3,
    exceptions=(DBConnectionError, DBTimeoutError)
)
async def database_query():
    pass

# For CPU-bound: no retry (won't help)
@retry(max_attempts=1)  # Or don't use @retry
def cpu_intensive():
    pass
```

### 2. Set Appropriate Timeouts

```python
# Fast endpoints: short timeout
@retry(max_attempts=3, timeout=10.0)
async def quick_endpoint():
    pass

# Long operations: long timeout
@retry(max_attempts=3, timeout=120.0)
async def long_operation():
    pass
```

### 3. Monitor Performance

```python
# Regularly check performance metrics
@app.get("/api/metrics")
async def get_metrics():
    return {
        "performance": {
            name: perf_tracker.get_stats(name)
            for name in perf_tracker.metrics.keys()
        }
    }
```

### 4. Use Structured Logging

```python
# Good: Structured, searchable
logger.info(f"[Chat] Processing message: {message[:50]}... | User: {user_id}")

# Avoid: Free-form text
logger.info("processing a message")

# Use context in logs
logger.info(f"[Effect] Type: {effect_type} | Params: {params} | Duration: {duration:.1f}ms")
```

## Troubleshooting

### Logs Not Appearing

1. Check log level:
   ```python
   setup_logging(log_level="DEBUG")  # More verbose
   ```

2. Check log file permissions:
   ```bash
   ls -la logs/
   ```

3. Check for log directory:
   ```bash
   mkdir -p logs
   ```

### Retry Loop Not Working

1. Verify decorator syntax:
   ```python
   @retry(max_attempts=3)  # Correct
   @retry  # Missing parentheses - won't work
   ```

2. Check exception type:
   ```python
   @retry(exceptions=(ConnectionError,))  # Explicit exceptions
   @retry()  # Catches all exceptions
   ```

3. Increase timeout if needed:
   ```python
   @retry(max_attempts=3, timeout=60.0)  # 60 second total timeout
   ```

### Performance Metrics Not Collected

1. Use context manager:
   ```python
   with perf_tracker.track_time("operation"):
       # Code to track
       pass
   ```

2. Check tracker is initialized:
   ```python
   from logging_retry_utils import perf_tracker
   
   # Should be a PerformanceTracker instance
   print(type(perf_tracker))
   ```

## API Reference

### setup_logging()

```python
setup_logging(
    log_level: Union[str, int] = logging.INFO,
    log_file: Optional[str] = None,
    max_bytes: int = 10 * 1024 * 1024,
    backup_count: int = 5,
) -> logging.Logger
```

### @retry

```python
@retry(
    max_attempts: int = 3,
    initial_delay: float = 0.5,
    max_delay: float = 30.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    backoff_factor: float = 1.0,
    timeout: Optional[float] = None,
    exceptions: tuple = (Exception,),
    logger_name: str = __name__,
    on_retry: Optional[Callable] = None,
) -> Callable
```

### retry_async()

```python
await retry_async(
    func: Callable,
    *args,
    max_attempts: int = 3,
    initial_delay: float = 0.5,
    exceptions: tuple = (Exception,),
    **kwargs
) -> Any
```

### perf_tracker

```python
perf_tracker.track_time(operation: str)          # Context manager
perf_tracker.get_stats(operation: str)           # Get timing stats
perf_tracker.log_stats()                         # Log all stats
```

### request_logger

```python
request_logger.log_request(method, path, headers, body)
request_logger.log_response(method, path, status_code, duration_ms)
request_logger.log_error(method, path, error, duration_ms)
```

### health_checker

```python
await health_checker.check_async(name, check_func, *args, max_attempts, timeout, **kwargs)
health_checker.get_report()
```

## Examples

### Complete Server Setup

```python
from logging_retry_utils import setup_logging, retry, perf_tracker
from fastapi import FastAPI

# Setup
root_logger = setup_logging(log_level="INFO")
logger = logging.getLogger(__name__)

app = FastAPI()

# Endpoint with retry and tracking
@app.post("/api/process")
@retry(max_attempts=3, initial_delay=0.5)
async def process(request: Request):
    with perf_tracker.track_time("process"):
        result = await do_work(request)
        return result

# Health check endpoint
@app.get("/api/metrics")
async def metrics():
    return {
        "performance": {
            name: perf_tracker.get_stats(name)
            for name in perf_tracker.metrics
        }
    }
```

## Support & Documentation

- **Integration**: See `SERVER_INTEGRATION_GUIDE.md`
- **Examples**: See `codette_server_enhanced.py`
- **Source**: `logging_retry_utils.py`

## License

Same as CoreLogic Studio (MIT)

---

**Happy logging! ??**
