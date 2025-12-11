#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix Invalid HTTP Requests Script
Automatically patches codette_server_unified.py to fix all invalid request issues
"""

import sys
import re
from pathlib import Path
from datetime import datetime

def backup_file(filepath):
    """Create a backup of the file before modifying"""
    backup_path = filepath.parent / f"{filepath.stem}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}{filepath.suffix}"
    content = filepath.read_text(encoding='utf-8')
    backup_path.write_text(content, encoding='utf-8')
    print(f"[BACKUP] Created backup: {backup_path.name}")
    return backup_path

def fix_missing_endpoints(content):
    """Add missing endpoints that returned 404"""
    fixes = []
    
    # Find where to insert new endpoints (after existing health check)
    health_check_pattern = r'(@app\.get\("/health"\).*?return \{[^}]+\})'
    
    missing_endpoints = """

# ============================================================================
# MISSING ENDPOINTS FIX (Added by fix_invalid_requests.py)
# ============================================================================

@app.get("/api/health/detailed")
async def detailed_health_check():
    \"\"\"Detailed health check with request statistics\"\"\"
    try:
        return {
            "status": "healthy",
            "service": "Codette AI Unified Server",
            "timestamp": get_timestamp(),
            "statistics": {
                "uptime_seconds": (datetime.now(timezone.utc) - server_start_time).total_seconds() if 'server_start_time' in globals() else 0,
                "requests_handled": getattr(app.state, 'request_count', 0)
            },
            "services": {
                "codette_available": codette_engine is not None,
                "openai_available": OPENAI_AVAILABLE if 'OPENAI_AVAILABLE' in globals() else False,
                "dsp_effects_available": DSP_EFFECTS_AVAILABLE if 'DSP_EFFECTS_AVAILABLE' in globals() else False
            }
        }
    except Exception as e:
        logger.error(f"Error in detailed health check: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": get_timestamp()
        }

@app.get("/metrics")
async def get_metrics():
    \"\"\"Get system metrics for monitoring\"\"\"
    try:
        # Get transport state if available
        transport_state = None
        if 'transport_manager' in globals() and transport_manager:
            try:
                state = transport_manager.get_state()
                transport_state = {
                    "playing": state.playing,
                    "time_seconds": state.time_seconds,
                    "bpm": state.bpm
                }
            except Exception:
                transport_state = {"error": "Transport manager unavailable"}
        
        return {
            "status": "ok",
            "timestamp": get_timestamp(),
            "transport": transport_state,
            "services": {
                "codette": codette_engine is not None,
                "dsp_effects": DSP_EFFECTS_AVAILABLE if 'DSP_EFFECTS_AVAILABLE' in globals() else False
            }
        }
    except Exception as e:
        logger.error(f"Error in metrics endpoint: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": get_timestamp()
        }

@app.post("/transport/play")
async def transport_play():
    \"\"\"Start playback\"\"\"
    try:
        if 'transport_manager' not in globals() or not transport_manager:
            raise HTTPException(status_code=503, detail="Transport manager not initialized")
        
        state = transport_manager.play()
        return {
            "status": "success",
            "message": "Playback started",
            "state": {
                "playing": state.playing,
                "time_seconds": state.time_seconds,
                "bpm": state.bpm
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in transport play: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transport/stop")
async def transport_stop():
    \"\"\"Stop playback\"\"\"
    try:
        if 'transport_manager' not in globals() or not transport_manager:
            raise HTTPException(status_code=503, detail="Transport manager not initialized")
        
        state = transport_manager.stop()
        return {
            "status": "success",
            "message": "Playback stopped",
            "state": {
                "playing": state.playing,
                "time_seconds": state.time_seconds,
                "bpm": state.bpm
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in transport stop: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transport/pause")
async def transport_pause():
    \"\"\"Pause playback\"\"\"
    try:
        if 'transport_manager' not in globals() or not transport_manager:
            raise HTTPException(status_code=503, detail="Transport manager not initialized")
        
        state = transport_manager.pause()
        return {
            "status": "success",
            "message": "Playback paused",
            "state": {
                "playing": state.playing,
                "time_seconds": state.time_seconds,
                "bpm": state.bpm
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in transport pause: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transport/status")
async def transport_status():
    \"\"\"Get transport status\"\"\"
    try:
        if 'transport_manager' not in globals() or not transport_manager:
            # Return default state if transport manager not available
            return {
                "status": "ok",
                "playing": False,
                "time_seconds": 0.0,
                "bpm": 120.0,
                "message": "Transport manager not initialized"
            }
        
        state = transport_manager.get_state()
        return {
            "status": "ok",
            "playing": state.playing,
            "time_seconds": state.time_seconds,
            "sample_pos": state.sample_pos,
            "bpm": state.bpm,
            "beat_pos": state.beat_pos,
            "loop_enabled": state.loop_enabled,
            "loop_start_seconds": state.loop_start_seconds,
            "loop_end_seconds": state.loop_end_seconds
        }
    except Exception as e:
        logger.error(f"Error in transport status: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": get_timestamp()
        }

# ============================================================================
# END MISSING ENDPOINTS FIX
# ============================================================================
"""
    
    # Find a good insertion point (after health check)
    if re.search(health_check_pattern, content, re.DOTALL):
        # Insert after health check
        content = re.sub(
            r'(@app\.get\("/health"\).*?return \{[^}]+\}\s*)',
            r'\1' + missing_endpoints,
            content,
            count=1,
            flags=re.DOTALL
        )
        fixes.append("Added 7 missing endpoints: /api/health/detailed, /metrics, /transport/play, /transport/stop, /transport/pause, /transport/status")
    else:
        print("[WARNING] Could not find health check endpoint to insert after")
    
    return content, fixes

def fix_validation_errors(content):
    """Add better validation error handling"""
    fixes = []
    
    # Check if validation handler already exists
    if "RequestValidationError" not in content:
        validation_handler = """

# ============================================================================
# VALIDATION ERROR HANDLING (Added by fix_invalid_requests.py)
# ============================================================================

from fastapi.exceptions import RequestValidationError
from fastapi import Request, status

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    \"\"\"Handle validation errors with detailed logging\"\"\"
    errors = exc.errors()
    logger.error(f"Validation Error on {request.method} {request.url.path}")
    logger.error(f"Errors: {errors}")
    
    # Try to get request body for debugging
    try:
        body = await request.body()
        if body:
            logger.error(f"Request Body: {body.decode('utf-8')[:500]}")
    except Exception:
        logger.error("Could not read request body")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error - check required fields",
            "errors": errors,
            "message": "Please provide all required fields in correct format",
            "example": {
                "/codette/chat": {"message": "string (required)"},
                "/codette/suggest": {"context": {"type": "string"}, "limit": "integer (optional)"}
            }
        }
    )

# ============================================================================
# END VALIDATION ERROR HANDLING
# ============================================================================
"""
        # Insert after imports
        import_pattern = r'(from fastapi import FastAPI[^\n]*\n)'
        if re.search(import_pattern, content):
            content = re.sub(
                import_pattern,
                r'\1' + validation_handler,
                content,
                count=1
            )
            fixes.append("Added validation error handler with detailed logging")
        else:
            print("[WARNING] Could not find FastAPI import to insert validation handler")
    
    return content, fixes

def fix_method_errors(content):
    """Ensure endpoints have correct HTTP methods"""
    fixes = []
    
    # Check if /codette/chat allows GET (it shouldn't)
    chat_pattern = r'@app\.(get|post)\("/codette/chat"\)'
    matches = list(re.finditer(chat_pattern, content))
    
    if any(m.group(1) == 'get' for m in matches):
        # Remove GET endpoint for /codette/chat if it exists
        content = re.sub(
            r'@app\.get\("/codette/chat"\)[^\n]*\n.*?(?=@app\.|$)',
            '',
            content,
            flags=re.DOTALL
        )
        fixes.append("Removed incorrect GET endpoint for /codette/chat")
    
    return content, fixes

def add_startup_initialization(content):
    """Add server startup time tracking"""
    fixes = []
    
    if "server_start_time" not in content:
        startup_code = """

# ============================================================================
# SERVER INITIALIZATION (Added by fix_invalid_requests.py)
# ============================================================================

# Track server start time for uptime metrics
server_start_time = datetime.now(timezone.utc)

@app.on_event("startup")
async def startup_event():
    \"\"\"Initialize server state on startup\"\"\"
    global server_start_time
    server_start_time = datetime.now(timezone.utc)
    app.state.request_count = 0
    logger.info(f"Server started at {server_start_time}")
    logger.info("Initializing transport manager...")
    
    # Initialize transport manager if not already done
    if 'transport_manager' not in globals():
        globals()['transport_manager'] = TransportManager()
        logger.info("Transport manager initialized")

# ============================================================================
# END SERVER INITIALIZATION
# ============================================================================
"""
        # Insert before main execution block
        main_pattern = r'(if __name__ == "__main__":)'
        if re.search(main_pattern, content):
            content = re.sub(
                main_pattern,
                startup_code + r'\n\1',
                content,
                count=1
            )
            fixes.append("Added server startup initialization")
        else:
            print("[WARNING] Could not find main block to add startup code")
    
    return content, fixes

def add_request_logging(content):
    """Add request logging middleware"""
    fixes = []
    
    if "@app.middleware" not in content or "log_requests" not in content:
        middleware_code = """

# ============================================================================
# REQUEST LOGGING MIDDLEWARE (Added by fix_invalid_requests.py)
# ============================================================================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    \"\"\"Log all incoming HTTP requests for debugging\"\"\"
    # Increment request counter
    if hasattr(app.state, 'request_count'):
        app.state.request_count += 1
    
    # Log request
    logger.info(f"-> {request.method} {request.url.path}")
    
    # Check Content-Type for POST/PUT/PATCH
    if request.method in ["POST", "PUT", "PATCH"]:
        content_type = request.headers.get("content-type", "")
        if "application/json" not in content_type.lower():
            logger.warning(f"Invalid Content-Type: {content_type} (expected application/json)")
    
    try:
        response = await call_next(request)
        
        # Log response
        if response.status_code >= 400:
            logger.error(f"<- {response.status_code} - Request failed")
        else:
            logger.info(f"<- {response.status_code} - OK")
        
        return response
    except Exception as e:
        logger.error(f"Exception in request: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error": str(e)}
        )

# ============================================================================
# END REQUEST LOGGING MIDDLEWARE
# ============================================================================
"""
        # Insert after CORS middleware
        cors_pattern = r'(app\.add_middleware\(\s*CORSMiddleware[^)]+\))'
        if re.search(cors_pattern, content, re.DOTALL):
            content = re.sub(
                cors_pattern,
                r'\1' + middleware_code,
                content,
                count=1,
                flags=re.DOTALL
            )
            fixes.append("Added request logging middleware")
        else:
            print("[WARNING] Could not find CORS middleware to insert after")
    
    return content, fixes

def add_transport_manager_class(content):
    """Add TransportManager class if missing"""
    fixes = []
    
    if "class TransportManager" not in content:
        transport_class = """

# ============================================================================
# TRANSPORT MANAGER CLASS (Added by fix_invalid_requests.py)
# ============================================================================

class TransportManager:
    \"\"\"Manages playback transport state\"\"\"
    def __init__(self):
        self.playing = False
        self.time_seconds = 0.0
        self.sample_pos = 0
        self.bpm = 120.0
        self.sample_rate = 44100
        self.start_time = None
        self.loop_enabled = False
        self.loop_start_seconds = 0.0
        self.loop_end_seconds = 10.0
        self.beat_pos = 0.0
    
    def get_state(self):
        \"\"\"Get current transport state\"\"\"
        if self.playing and self.start_time:
            import time
            elapsed = time.time() - self.start_time
            self.time_seconds = elapsed
            self.sample_pos = int(self.time_seconds * self.sample_rate)
        
        # Calculate beat position
        beat_duration = 60.0 / self.bpm
        self.beat_pos = (self.time_seconds % (beat_duration * 4)) / beat_duration
        
        from pydantic import BaseModel
        
        class TransportState(BaseModel):
            playing: bool
            time_seconds: float
            sample_pos: int
            bpm: float
            beat_pos: float
            loop_enabled: bool
            loop_start_seconds: float
            loop_end_seconds: float
        
        return TransportState(
            playing=self.playing,
            time_seconds=self.time_seconds,
            sample_pos=self.sample_pos,
            bpm=self.bpm,
            beat_pos=self.beat_pos,
            loop_enabled=self.loop_enabled,
            loop_start_seconds=self.loop_start_seconds,
            loop_end_seconds=self.loop_end_seconds
        )
    
    def play(self):
        \"\"\"Start playback\"\"\"
        if not self.playing:
            import time
            self.playing = True
            self.start_time = time.time() - self.time_seconds
        return self.get_state()
    
    def stop(self):
        \"\"\"Stop playback and reset\"\"\"
        self.playing = False
        self.time_seconds = 0.0
        self.sample_pos = 0
        self.start_time = None
        return self.get_state()
    
    def pause(self):
        \"\"\"Pause playback\"\"\"
        if self.playing:
            import time
            self.time_seconds = time.time() - self.start_time
            self.playing = False
        return self.get_state()

# Initialize transport manager
transport_manager = TransportManager()

# ============================================================================
# END TRANSPORT MANAGER CLASS
# ============================================================================
"""
        # Insert before app initialization
        app_pattern = r'(app = FastAPI\()'
        if re.search(app_pattern, content):
            content = re.sub(
                app_pattern,
                transport_class + r'\n\1',
                content,
                count=1
            )
            fixes.append("Added TransportManager class")
        else:
            print("[WARNING] Could not find FastAPI app initialization")
    
    return content, fixes

def main():
    print("="*70)
    print("FIX INVALID HTTP REQUESTS")
    print("="*70)
    print("\nThis script will patch codette_server_unified.py to fix:")
    print("  - Missing endpoints (404 errors)")
    print("  - Validation errors (422 errors)")
    print("  - Method errors (405 errors)")
    print("  - Add request logging")
    print("="*70)
    
    # Find the server file
    server_file = Path("codette_server_unified.py")
    if not server_file.exists():
        print(f"\n[ERROR] File not found: {server_file}")
        print("Make sure you're in the project root directory")
        sys.exit(1)
    
    print(f"\n[INFO] Found server file: {server_file}")
    
    # Create backup
    backup_path = backup_file(server_file)
    
    # Read current content
    print("\n[INFO] Reading current content...")
    content = server_file.read_text(encoding='utf-8')
    original_lines = len(content.splitlines())
    
    all_fixes = []
    
    # Apply fixes
    print("\n[INFO] Applying fixes...")
    
    print("  1. Adding TransportManager class...")
    content, fixes = add_transport_manager_class(content)
    all_fixes.extend(fixes)
    
    print("  2. Adding missing endpoints...")
    content, fixes = fix_missing_endpoints(content)
    all_fixes.extend(fixes)
    
    print("  3. Adding validation error handling...")
    content, fixes = fix_validation_errors(content)
    all_fixes.extend(fixes)
    
    print("  4. Fixing method errors...")
    content, fixes = fix_method_errors(content)
    all_fixes.extend(fixes)
    
    print("  5. Adding startup initialization...")
    content, fixes = add_startup_initialization(content)
    all_fixes.extend(fixes)
    
    print("  6. Adding request logging middleware...")
    content, fixes = add_request_logging(content)
    all_fixes.extend(fixes)
    
    # Write updated content
    print("\n[INFO] Writing updated file...")
    server_file.write_text(content, encoding='utf-8')
    
    new_lines = len(content.splitlines())
    
    # Summary
    print("\n" + "="*70)
    print("FIX SUMMARY")
    print("="*70)
    print(f"\nOriginal file: {original_lines} lines")
    print(f"Updated file:  {new_lines} lines")
    print(f"Added lines:   {new_lines - original_lines}")
    print(f"\nBackup saved:  {backup_path.name}")
    
    print("\n[FIXES APPLIED]")
    for i, fix in enumerate(all_fixes, 1):
        print(f"  {i}. {fix}")
    
    print("\n" + "="*70)
    print("NEXT STEPS")
    print("="*70)
    print("\n1. Start the server:")
    print("   python codette_server_unified.py")
    print("\n2. Run the test script:")
    print("   python test_endpoints.py")
    print("\n3. Check for remaining errors")
    print("\nIf issues persist, check server logs for detailed error messages")
    print("="*70)
    
    print(f"\n[SUCCESS] Patched {len(all_fixes)} issues in codette_server_unified.py")

if __name__ == "__main__":
    main()
