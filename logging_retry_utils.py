#!/usr/bin/env python
"""
Enhanced Logging & Retry Utilities for CoreLogic Studio Server

Provides:
- Structured logging with file handlers and rotation
- Automatic retry decorator with exponential backoff
- Request/response logging middleware
- Dependency health checking with retries
- Performance tracking and metrics
"""

import sys
import time
import logging
import asyncio
import traceback
import functools
import json
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, TypeVar, Union
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

# Create logs directory if it doesn't exist
LOGS_DIR = Path(__file__).parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)

class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured logging output"""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record with timestamp, level, and context"""
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Color codes for console output
        colors = {
            logging.DEBUG: '\033[36m',      # Cyan
            logging.INFO: '\033[32m',       # Green
            logging.WARNING: '\033[33m',    # Yellow
            logging.ERROR: '\033[31m',      # Red
            logging.CRITICAL: '\033[35m',   # Magenta
        }
        reset_color = '\033[0m'
        
        # Determine if we should use colors (console handler)
        use_colors = isinstance(self.stream, type(sys.stdout))
        
        level_name = record.levelname
        if use_colors and record.levelno in colors:
            level_name = f"{colors[record.levelno]}{level_name}{reset_color}"
        
        # Format main message
        message = f"[{timestamp}] [{level_name}] {record.name}: {record.getMessage()}"
        
        # Add exception info if present
        if record.exc_info:
            message += f"\n{self.formatException(record.exc_info)}"
        
        return message


def setup_logging(
    log_level: Union[str, int] = logging.INFO,
    log_file: Optional[str] = None,
    max_bytes: int = 10 * 1024 * 1024,  # 10 MB
    backup_count: int = 5,
) -> logging.Logger:
    """
    Configure structured logging with file and console handlers
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Path to log file (default: logs/codette_server.log)
        max_bytes: Max size of log file before rotation
        backup_count: Number of backup log files to keep
        
    Returns:
        Configured root logger
    """
    if isinstance(log_level, str):
        log_level = getattr(logging, log_level.upper())
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)  # Capture all levels, filters apply per handler
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create formatters
    detailed_formatter = StructuredFormatter()
    
    # Console handler (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(console_handler)
    
    # File handler (rotating)
    if log_file is None:
        log_file = LOGS_DIR / "codette_server.log"
    else:
        log_file = Path(log_file)
    
    log_file.parent.mkdir(parents=True, exist_ok=True)
    
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=max_bytes,
        backupCount=backup_count
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(file_handler)
    
    # Error log file (ERROR and above)
    error_log_file = log_file.parent / "codette_server_errors.log"
    error_handler = RotatingFileHandler(
        error_log_file,
        maxBytes=max_bytes,
        backupCount=backup_count
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(error_handler)
    
    # Performance log file (for timing metrics)
    perf_log_file = log_file.parent / "codette_server_perf.log"
    perf_handler = RotatingFileHandler(
        perf_log_file,
        maxBytes=max_bytes,
        backupCount=backup_count
    )
    perf_handler.setLevel(logging.DEBUG)
    perf_handler.setFormatter(detailed_formatter)
    perf_logger = logging.getLogger("performance")
    perf_logger.addHandler(perf_handler)
    perf_logger.setLevel(logging.DEBUG)
    
    return root_logger


# ============================================================================
# RETRY DECORATOR & UTILITIES
# ============================================================================

T = TypeVar('T')

class RetryConfig:
    """Configuration for retry behavior"""
    
    def __init__(
        self,
        max_attempts: int = 3,
        initial_delay: float = 0.5,
        max_delay: float = 30.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
        backoff_factor: float = 1.0,
        timeout: Optional[float] = None,
    ):
        """
        Initialize retry configuration
        
        Args:
            max_attempts: Maximum number of retry attempts
            initial_delay: Initial delay in seconds
            max_delay: Maximum delay between retries
            exponential_base: Base for exponential backoff
            jitter: Add random jitter to delays
            backoff_factor: Multiply delay by this factor each retry
            timeout: Overall timeout for all attempts (seconds)
        """
        self.max_attempts = max_attempts
        self.initial_delay = initial_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
        self.backoff_factor = backoff_factor
        self.timeout = timeout
    
    def get_delay(self, attempt: int) -> float:
        """Calculate delay for given attempt number"""
        import random
        
        # Exponential backoff: delay = initial_delay * (base ^ attempt) * factor
        delay = self.initial_delay * (self.exponential_base ** attempt) * self.backoff_factor
        delay = min(delay, self.max_delay)
        
        # Add jitter if enabled
        if self.jitter:
            jitter_amount = delay * 0.1  # ±10% jitter
            delay += random.uniform(-jitter_amount, jitter_amount)
        
        return max(0.1, delay)  # Minimum 0.1s delay


def retry(
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
) -> Callable:
    """
    Decorator for automatic retry with exponential backoff
    
    Usage:
        @retry(max_attempts=3, initial_delay=0.5)
        async def my_function():
            return await some_api_call()
        
        @retry(max_attempts=5, exceptions=(ConnectionError, TimeoutError))
        def sync_function():
            return requests.get(url)
    
    Args:
        max_attempts: Maximum retry attempts
        initial_delay: Initial delay between retries
        max_delay: Maximum delay between retries
        exponential_base: Base for exponential backoff
        jitter: Add randomness to delays
        backoff_factor: Multiply delay by this factor
        timeout: Overall timeout for all attempts
        exceptions: Tuple of exceptions to catch and retry on
        logger_name: Logger name for logging
        on_retry: Optional callback called on retry
        
    Returns:
        Decorated function with retry capability
    """
    retry_config = RetryConfig(
        max_attempts=max_attempts,
        initial_delay=initial_delay,
        max_delay=max_delay,
        exponential_base=exponential_base,
        jitter=jitter,
        backoff_factor=backoff_factor,
        timeout=timeout,
    )
    
    def decorator(func: Callable) -> Callable:
        logger = logging.getLogger(logger_name)
        is_async = asyncio.iscoroutinefunction(func)
        
        if is_async:
            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs) -> Any:
                """Async retry wrapper"""
                start_time = time.time()
                last_exception = None
                
                for attempt in range(retry_config.max_attempts):
                    try:
                        # Check timeout
                        if retry_config.timeout:
                            elapsed = time.time() - start_time
                            if elapsed > retry_config.timeout:
                                logger.error(
                                    f"[TIMEOUT] {func.__name__} exceeded timeout "
                                    f"({elapsed:.1f}s > {retry_config.timeout}s)"
                                )
                                raise TimeoutError(
                                    f"Function timeout after {elapsed:.1f}s"
                                )
                        
                        # Attempt function call
                        logger.debug(f"[RETRY] {func.__name__} attempt {attempt + 1}/{retry_config.max_attempts}")
                        result = await func(*args, **kwargs)
                        
                        if attempt > 0:
                            logger.info(f"[SUCCESS] {func.__name__} succeeded on attempt {attempt + 1}")
                        
                        return result
                    
                    except exceptions as e:
                        last_exception = e
                        
                        if attempt < retry_config.max_attempts - 1:
                            delay = retry_config.get_delay(attempt)
                            logger.warning(
                                f"[RETRY] {func.__name__} failed (attempt {attempt + 1}): {type(e).__name__}: {str(e)[:100]} "
                                f"| Retrying in {delay:.2f}s..."
                            )
                            
                            # Call on_retry callback if provided
                            if on_retry:
                                try:
                                    if asyncio.iscoroutinefunction(on_retry):
                                        await on_retry(func.__name__, attempt + 1, e)
                                    else:
                                        on_retry(func.__name__, attempt + 1, e)
                                except Exception as cb_error:
                                    logger.warning(f"on_retry callback failed: {cb_error}")
                            
                            # Sleep before retry
                            await asyncio.sleep(delay)
                        else:
                            logger.error(
                                f"[FAILED] {func.__name__} failed after {retry_config.max_attempts} attempts: "
                                f"{type(e).__name__}: {str(e)}"
                            )
                
                # All retries exhausted
                if last_exception:
                    raise last_exception
                raise RuntimeError(f"{func.__name__} failed with no exception")
            
            return async_wrapper
        else:
            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs) -> Any:
                """Sync retry wrapper"""
                start_time = time.time()
                last_exception = None
                
                for attempt in range(retry_config.max_attempts):
                    try:
                        # Check timeout
                        if retry_config.timeout:
                            elapsed = time.time() - start_time
                            if elapsed > retry_config.timeout:
                                logger.error(
                                    f"[TIMEOUT] {func.__name__} exceeded timeout "
                                    f"({elapsed:.1f}s > {retry_config.timeout}s)"
                                )
                                raise TimeoutError(
                                    f"Function timeout after {elapsed:.1f}s"
                                )
                        
                        # Attempt function call
                        logger.debug(f"[RETRY] {func.__name__} attempt {attempt + 1}/{retry_config.max_attempts}")
                        result = func(*args, **kwargs)
                        
                        if attempt > 0:
                            logger.info(f"[SUCCESS] {func.__name__} succeeded on attempt {attempt + 1}")
                        
                        return result
                    
                    except exceptions as e:
                        last_exception = e
                        
                        if attempt < retry_config.max_attempts - 1:
                            delay = retry_config.get_delay(attempt)
                            logger.warning(
                                f"[RETRY] {func.__name__} failed (attempt {attempt + 1}): {type(e).__name__}: {str(e)[:100]} "
                                f"| Retrying in {delay:.2f}s..."
                            )
                            
                            # Call on_retry callback if provided
                            if on_retry:
                                try:
                                    on_retry(func.__name__, attempt + 1, e)
                                except Exception as cb_error:
                                    logger.warning(f"on_retry callback failed: {cb_error}")
                            
                            # Sleep before retry
                            time.sleep(delay)
                        else:
                            logger.error(
                                f"[FAILED] {func.__name__} failed after {retry_config.max_attempts} attempts: "
                                f"{type(e).__name__}: {str(e)}"
                            )
                
                # All retries exhausted
                if last_exception:
                    raise last_exception
                raise RuntimeError(f"{func.__name__} failed with no exception")
            
            return sync_wrapper
    
    return decorator


# ============================================================================
# ASYNC RETRY UTILITIES
# ============================================================================

async def retry_async(
    func: Callable,
    *args,
    max_attempts: int = 3,
    initial_delay: float = 0.5,
    exceptions: tuple = (Exception,),
    **kwargs
) -> Any:
    """
    Execute async function with retries (functional approach)
    
    Args:
        func: Async function to call
        *args: Positional arguments
        max_attempts: Maximum retry attempts
        initial_delay: Initial delay between retries
        exceptions: Tuple of exceptions to catch
        **kwargs: Keyword arguments
        
    Returns:
        Function result
    """
    logger = logging.getLogger(__name__)
    delay = initial_delay
    
    for attempt in range(max_attempts):
        try:
            return await func(*args, **kwargs)
        except exceptions as e:
            if attempt < max_attempts - 1:
                logger.warning(f"Attempt {attempt + 1} failed, retrying in {delay:.2f}s: {e}")
                await asyncio.sleep(delay)
                delay *= 2.0
            else:
                logger.error(f"All {max_attempts} attempts failed: {e}")
                raise


# ============================================================================
# REQUEST/RESPONSE LOGGING
# ============================================================================

class RequestLogger:
    """Utility for structured request/response logging"""
    
    def __init__(self, logger_name: str = "http_requests"):
        self.logger = logging.getLogger(logger_name)
    
    def log_request(
        self,
        method: str,
        path: str,
        headers: Optional[Dict] = None,
        body: Optional[Any] = None,
    ):
        """Log incoming request"""
        self.logger.info(
            f"[REQ] {method} {path} "
            f"| Content-Type: {headers.get('content-type', 'N/A') if headers else 'N/A'} "
            f"| Body: {str(body)[:100] if body else 'None'}"
        )
    
    def log_response(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
        response_size: int = 0,
    ):
        """Log outgoing response"""
        status_emoji = "?" if 200 <= status_code < 300 else "?" if status_code >= 400 else "?"
        self.logger.info(
            f"[RES] {status_emoji} {method} {path} -> {status_code} "
            f"| Duration: {duration_ms:.1f}ms "
            f"| Size: {response_size} bytes"
        )
    
    def log_error(
        self,
        method: str,
        path: str,
        error: Exception,
        duration_ms: float,
    ):
        """Log request error"""
        self.logger.error(
            f"[ERR] {method} {path} "
            f"| {type(error).__name__}: {str(error)[:100]} "
            f"| Duration: {duration_ms:.1f}ms"
        )


# ============================================================================
# PERFORMANCE TRACKING
# ============================================================================

class PerformanceTracker:
    """Track function execution time and metrics"""
    
    def __init__(self, logger_name: str = "performance"):
        self.logger = logging.getLogger(logger_name)
        self.metrics: Dict[str, List[float]] = {}
    
    def track_time(self, operation: str):
        """Context manager for timing operations"""
        class TimingContext:
            def __init__(self, tracker, op_name):
                self.tracker = tracker
                self.op_name = op_name
                self.start_time = None
            
            def __enter__(self):
                self.start_time = time.time()
                return self
            
            def __exit__(self, exc_type, exc_val, exc_tb):
                elapsed = (time.time() - self.start_time) * 1000  # Convert to ms
                
                if self.op_name not in self.tracker.metrics:
                    self.tracker.metrics[self.op_name] = []
                
                self.tracker.metrics[self.op_name].append(elapsed)
                
                if exc_type:
                    self.tracker.logger.warning(
                        f"[PERF] {self.op_name} failed in {elapsed:.1f}ms (exception: {exc_type.__name__})"
                    )
                else:
                    self.tracker.logger.debug(f"[PERF] {self.op_name} completed in {elapsed:.1f}ms")
        
        return TimingContext(self, operation)
    
    def get_stats(self, operation: str) -> Dict[str, float]:
        """Get timing statistics for operation"""
        if operation not in self.metrics or not self.metrics[operation]:
            return {}
        
        times = self.metrics[operation]
        return {
            "count": len(times),
            "min": min(times),
            "max": max(times),
            "avg": sum(times) / len(times),
            "total": sum(times),
        }
    
    def log_stats(self):
        """Log all collected statistics"""
        if not self.metrics:
            self.logger.info("No metrics collected")
            return
        
        self.logger.info("=" * 60)
        self.logger.info("PERFORMANCE STATISTICS")
        self.logger.info("=" * 60)
        
        for operation in sorted(self.metrics.keys()):
            stats = self.get_stats(operation)
            self.logger.info(
                f"{operation:40} | "
                f"Count: {stats['count']:3d} | "
                f"Avg: {stats['avg']:7.1f}ms | "
                f"Min: {stats['min']:7.1f}ms | "
                f"Max: {stats['max']:7.1f}ms"
            )


# ============================================================================
# DEPENDENCY HEALTH CHECK
# ============================================================================

class DependencyHealthCheck:
    """Check health of external dependencies with retries"""
    
    def __init__(self):
        self.logger = logging.getLogger("health_check")
        self.results: Dict[str, Dict[str, Any]] = {}
    
    async def check_async(
        self,
        name: str,
        check_func: Callable,
        *args,
        max_attempts: int = 3,
        timeout: float = 5.0,
        **kwargs
    ) -> bool:
        """
        Check async dependency with retries
        
        Args:
            name: Dependency name
            check_func: Async function that returns True if healthy
            *args: Function arguments
            max_attempts: Number of retry attempts
            timeout: Timeout per attempt in seconds
            **kwargs: Keyword arguments
            
        Returns:
            True if healthy, False otherwise
        """
        for attempt in range(max_attempts):
            try:
                self.logger.info(f"[HEALTH] Checking {name} (attempt {attempt + 1}/{max_attempts})...")
                
                # Set timeout for check
                result = await asyncio.wait_for(
                    check_func(*args, **kwargs),
                    timeout=timeout
                )
                
                if result:
                    self.logger.info(f"[HEALTH] {name}: OK")
                    self.results[name] = {"status": "healthy", "checked_at": datetime.now(timezone.utc).isoformat()}
                    return True
                else:
                    raise RuntimeError(f"{name} check returned False")
            
            except asyncio.TimeoutError:
                self.logger.warning(f"[HEALTH] {name} check timed out (attempt {attempt + 1})")
            except Exception as e:
                self.logger.warning(f"[HEALTH] {name} check failed (attempt {attempt + 1}): {e}")
            
            if attempt < max_attempts - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        self.logger.error(f"[HEALTH] {name}: FAILED (all attempts exhausted)")
        self.results[name] = {"status": "unhealthy", "checked_at": datetime.now(timezone.utc).isoformat()}
        return False
    
    def get_report(self) -> Dict[str, Any]:
        """Get health check report"""
        healthy_count = sum(1 for r in self.results.values() if r.get("status") == "healthy")
        total_count = len(self.results)
        
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_dependencies": total_count,
            "healthy": healthy_count,
            "unhealthy": total_count - healthy_count,
            "results": self.results,
            "status": "healthy" if healthy_count == total_count else "degraded" if healthy_count > 0 else "unhealthy",
        }


# ============================================================================
# INITIALIZATION
# ============================================================================

# Create global instances
perf_tracker = PerformanceTracker()
request_logger = RequestLogger()
health_checker = DependencyHealthCheck()

if __name__ == "__main__":
    # Setup logging for testing
    setup_logging(log_level=logging.DEBUG)
    logger = logging.getLogger(__name__)
    
    logger.info("Logging and retry utilities loaded successfully")
    
    # Test retry decorator
    @retry(max_attempts=3, initial_delay=0.5)
    async def test_retry_async():
        logger.info("Testing async retry...")
        return "Success!"
    
    # Test sync retry
    @retry(max_attempts=2, initial_delay=0.1)
    def test_retry_sync():
        logger.info("Testing sync retry...")
        return "Success!"
    
    logger.info("Test completed")
