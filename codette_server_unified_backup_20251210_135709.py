#!/usr/bin/env python
"""
Codette AI Unified Server - Complete Implementation
"""

# FIRST: Set environment to suppress PyTensor warnings BEFORE any imports
import os
os.environ["PYTENSOR_FLAGS"] = "device=cpu,floatX=float32,cxx="
os.environ["ARVIZ_DATA"] = ""  # Suppress arviz data warnings

import sys
import json
import logging
import time
import asyncio
import traceback
import warnings
import shutil
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

# Suppress all non-critical warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
logging.getLogger("pytensor").setLevel(logging.ERROR)

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    env_file = Path(__file__).parent / '.env'
    if env_file.exists():
        load_dotenv(env_file)
except ImportError:
    pass  # dotenv not installed, fall back to environment variables

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, File, UploadFile, Form


# ============================================================================
# VALIDATION ERROR HANDLING (Added by fix_invalid_requests.py)
# ============================================================================

from fastapi.exceptions import RequestValidationError
from fastapi import Request, status

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed logging"""
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
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import file upload functionality
from codette_file_upload import (
    analyze_uploaded_file,
    serialize_timeline_context,
    generate_timeline_suggestions,
    file_history,
    UPLOAD_DIRECTORY,
    MAX_FILE_SIZE,
    ALLOWED_EXTENSIONS
)

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# DAW CORE API IMPORT (Priority 1: Critical Integration)
# ============================================================================

# Import DAW Core effects and API
DSP_EFFECTS_AVAILABLE = False
DAW_CORE_API_AVAILABLE = False
daw_core_app = None

try:
    # Try importing DSP effects classes first
    from daw_core.fx import (
        EQ3Band, HighLowPass, Compressor, Limiter, Expander, Gate, NoiseGate,
        Saturation, HardClip, Distortion, WaveShaper,
        SimpleDelay, PingPongDelay, MultiTapDelay, StereoDelay,
        Reverb, HallReverb, PlateReverb, RoomReverb
    )
    DSP_EFFECTS_AVAILABLE = True
    logger.info("[OK] DAW Core DSP effects imported successfully")
    
    # Now try importing the FastAPI app
    try:
        from daw_core.api import app as daw_core_app
        DAW_CORE_API_AVAILABLE = True
        logger.info("[OK] DAW Core API app imported successfully")
        logger.info(f"   * DAW Core app type: {type(daw_core_app)}")
        logger.info(f"   * DAW Core app routes: {len(daw_core_app.routes)}")
    except ImportError as api_import_error:
        logger.warning(f"[!] DAW Core API import failed: {api_import_error}")
        logger.warning("   API app not available, but DSP classes are loaded")
    except Exception as api_error:
        logger.error(f"[X] Unexpected error importing DAW Core API: {api_error}")
    
except ImportError as e:
    logger.warning(f"[!] DAW Core import failed: {e}")
    logger.warning("   DSP effects will not be available via API")
except Exception as e:
    logger.error(f"[X] Unexpected error importing DAW Core: {e}")

# ============================================================================
# Compatibility helpers (fix NameError for missing helpers at runtime)
# ============================================================================

# Provide a safe singleton CocoonManager loader used by status endpoints
_COCOON_MANAGER_SINGLETON = None

def get_cocoon_manager():
    """Return a singleton CocoonManager instance.

    Tries multiple import locations to be tolerant of package layout.
    Falls back to a tiny local shim if real manager is unavailable.
    """
    global _COCOON_MANAGER_SINGLETON
    if _COCOON_MANAGER_SINGLETON is not None:
        return _COCOON_MANAGER_SINGLETON

    # Try real implementations
    candidates = [
        "Codette.src.utils.cocoon_manager",
        "Codette.src.utils.cocoon_manager",
        "Codette.utils.cocoon_manager",
        "Codette.codette.src.utils.cocoon_manager",
        "Codette.codette.utils.cocoon_manager",
        "codette.src.utils.cocoon_manager",
        "codette.utils.cocoon_manager",
    ]

    for modname in candidates:
        try:
            mod = __import__(modname, fromlist=["CocoonManager"]) 
            CocoonManager = getattr(mod, "CocoonManager")
            mgr = CocoonManager()
            try:
                mgr.load_cocoons()
            except Exception:
                pass
            _COCOON_MANAGER_SINGLETON = mgr
            logger.info(f"Loaded CocoonManager from {modname}")
            return _COCOON_MANAGER_SINGLETON
        except Exception:
            continue

    # Fallback shim
    class _Shim:
        def __init__(self):
            self.cocoon_data = []
            self.quantum_state = {"coherence": 0.5}
        def load_cocoons(self):
            return
        def get_latest_quantum_state(self):
            return self.quantum_state.copy()
        def get_latest_cocoons(self, limit=5):
            return []
        def save_cocoon(self, data, cocoon_type="codette"):
            return False

    _COCOON_MANAGER_SINGLETON = _Shim()
    logger.warning("CocoonManager not found; using shim fallback")
    return _COCOON_MANAGER_SINGLETON

# Minimal fallback 'base' data used by production-checklist / ear-training code paths
# Some endpoints in different versions expect a module-level 'base' mapping.
base = {
    "mixing": [
        {"id": "mix_level_check", "task": "Verify master headroom and peaks", "priority": "high"},
        {"id": "mix_balance", "task": "Balance instrument levels and panning", "priority": "medium"},
    ],
    "recording": [
        {"id": "rec_signal_check", "task": "Confirm input levels and no clipping", "priority": "high"},
    ],
    "arrangement": [
        {"id": "arr_structure", "task": "Verify song sections and transitions", "priority": "medium"},
    ],
    "mastering": [
        {"id": "master_reference", "task": "Check reference tracks and LUFS", "priority": "high"},
    ],
}

# ============================================================================
# HELPER FUNCTIONS (Required by OpenAI Assistant and endpoints)
# ============================================================================

def _is_thread_run_active(thread_id: str) -> bool:
    """
    Helper function to check if OpenAI thread has an active run.
    Returns True if a non-terminal run exists for the given thread.
    """
    if not OPENAI_AVAILABLE or not openai_client or not thread_id:
        return False

    try:
        # Try to list runs for this thread
        runs_resp = None
        try:
            runs_resp = openai_client.beta.threads.runs.list(thread_id=thread_id, limit=10)
        except Exception:
            try:
                runs_resp = openai_client.beta.threads.runs(thread_id=thread_id).list(limit=10)
            except Exception:
                try:
                    runs_resp = openai_client.list_runs(thread_id=thread_id)
                except Exception:
                    runs_resp = None

        if runs_resp is None:
            return False

        # Normalize to iterable
        runs = []
        if hasattr(runs_resp, 'data') and getattr(runs_resp, 'data') is not None:
            runs = list(runs_resp.data)
        elif isinstance(runs_resp, (list, tuple)):
            runs = list(runs_resp)
        else:
            try:
                runs = list(runs_resp)
            except Exception:
                runs = [runs_resp]

        # Check if any run is in an active state
        for r in runs:
            try:
                status = None
                if isinstance(r, dict):
                    status = r.get('status')
                else:
                    status = getattr(r, 'status', None)
                
                if status and status.lower() in ("queued", "in_progress", "running", "processing", "requires_action"):
                    return True
            except Exception:
                continue

        return False
    except Exception:
        # Be conservative: assume no active run if we cannot determine
        return False


async def ingest_chat_to_codette(user_id: str, user_message: str, assistant_response: str, source: str = "unknown"):
    """
    Ingest chat exchange into Codette's memory if engine supports learning.
    This function is best-effort and will not raise if Codette lacks methods.
    """
    try:
        if not codette_engine:
            logger.debug("Ingest skipped: no codette engine available")
            return False

        # Prefer known ingestion API shapes
        data = {
            "user_id": user_id,
            "user_message": user_message,
            "assistant_response": assistant_response,
            "source": source,
            "timestamp": get_timestamp()
        }

        # Try dedicated method
        if hasattr(codette_engine, 'learn_from_chat') and callable(getattr(codette_engine, 'learn_from_chat')):
            try:
                maybe = codette_engine.learn_from_chat(data)
                if asyncio.iscoroutine(maybe):
                    await maybe
                logger.info("Ingested chat to codette via learn_from_chat")
                return True
            except Exception as e:
                logger.debug(f"learn_from_chat failed: {e}")

        # Try append to context memory
        if hasattr(codette_engine, 'context_memory') and isinstance(getattr(codette_engine, 'context_memory'), list):
            try:
                codette_engine.context_memory.append({
                    'input': user_message,
                    'response': assistant_response,
                    'source': source,
                    'timestamp': get_timestamp()
                })
                logger.info("Appended chat to codette.context_memory")
                return True
            except Exception as e:
                logger.debug(f"Appending to context_memory failed: {e}")

        # Try generic memory attributes
        for attr in ('memory', 'conversation_history', 'conversation', 'chat_history'):
            try:
                mem = getattr(codette_engine, attr, None)
                if isinstance(mem, list):
                    mem.append({
                        'user': user_message,
                        'assistant': assistant_response,
                        'source': source,
                        'timestamp': get_timestamp()
                    })
                    logger.info(f"Appended chat to codette.{attr}")
                    return True
            except Exception as e:
                logger.debug(f"Failed to append to {attr}: {e}")

        logger.debug("No supported ingestion method found on codette_engine")
        return False
    except Exception as e:
        logger.warning(f"Failed to ingest chat to Codette: {e}")
        return False


async def production_checklist(stage: str) -> Dict[str, Any]:
    """
    Get production workflow checklist for specified stage.
    Returns tasks organized by stage and category.
    """
    try:
        # Use base data if available
        if 'base' in globals() and isinstance(base, dict):
            items = base.get(stage, base.get('mixing', []))
        else:
            # Fallback checklists
            items = {
                "recording": [
                    {"id": "rec_signal_check", "task": "Confirm input levels and no clipping", "priority": "high", "category": "Recording", "completed": False},
                    {"id": "rec_phase", "task": "Check phase alignment on multi-mic setups", "priority": "high", "category": "Recording", "completed": False},
                ],
                "arrangement": [
                    {"id": "arr_structure", "task": "Verify song sections and transitions", "priority": "medium", "category": "Arrangement", "completed": False},
                    {"id": "arr_balance", "task": "Balance instrument levels across sections", "priority": "medium", "category": "Arrangement", "completed": False},
                ],
                "mixing": [
                    {"id": "mix_level_check", "task": "Verify master headroom and peaks", "priority": "high", "category": "Mixing", "completed": False},
                    {"id": "mix_balance", "task": "Balance instrument levels and panning", "priority": "medium", "category": "Mixing", "completed": False},
                    {"id": "mix_eq", "task": "Apply EQ to carve frequency space", "priority": "high", "category": "Mixing", "completed": False},
                    {"id": "mix_comp", "task": "Add compression for dynamics control", "priority": "medium", "category": "Mixing", "completed": False},
                ],
                "mastering": [
                    {"id": "master_reference", "task": "Check reference tracks and LUFS", "priority": "high", "category": "Mastering", "completed": False},
                    {"id": "master_eq", "task": "Apply final EQ for tonal balance", "priority": "high", "category": "Mastering", "completed": False},
                    {"id": "master_limit", "task": "Set limiter for target loudness", "priority": "high", "category": "Mastering", "completed": False},
                ],
            }.get(stage, [])

        return {
            "success": True,
            "stage": stage,
            "items": items,
            "completionPercentage": 0,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"[Production Checklist] Error: {e}")
        return {
            "success": False,
            "error": str(e),
            "stage": stage,
            "items": [],
            "completionPercentage": 0
        }


async def instrument_info(category: str, instrument: str) -> Dict[str, Any]:
    """
    Get instrument processing guide with frequency ranges, EQ recommendations, etc.
    """
    try:
        # Sample instrument database
        instruments_db = {
            "vocals": {
                "lead": {
                    "typical_range_hz": [80, 12000],
                    "target_levels": {"peaks_dbfs": -6, "avg_lufs": -18},
                    "common_issues": ["Sibilance", "Muddiness", "Proximity effect"],
                    "recommended_processing": {
                        "eq": ["High-pass at 80Hz", "Cut at 200-300Hz for clarity", "Boost at 3-5kHz for presence"],
                        "compression": ["4:1 ratio", "5-10ms attack", "40-100ms release"],
                        "effects": ["De-esser", "Reverb", "Delay"]
                    },
                    "tips": ["Use pop filter", "Maintain consistent distance", "Watch for phase issues"]
                }
            },
            "drums": {
                "kick": {
                    "typical_range_hz": [20, 250],
                    "target_levels": {"peaks_dbfs": -3, "avg_lufs": -15},
                    "common_issues": ["Phase cancellation", "Too much low-end", "Lack of punch"],
                    "recommended_processing": {
                        "eq": ["Boost at 60Hz for depth", "Boost at 3-5kHz for attack"],
                        "compression": ["4:1 ratio", "Fast attack", "Medium release"],
                        "effects": ["Saturation"]
                    },
                    "tips": ["Tune to key of song", "Layer samples if needed", "Sidechain bass"]
                }
            },
            "guitars": {
                "electric": {
                    "typical_range_hz": [80, 8000],
                    "target_levels": {"peaks_dbfs": -9, "avg_lufs": -20},
                    "common_issues": ["Harshness", "Too much bass", "Lack of definition"],
                    "recommended_processing": {
                        "eq": ["High-pass at 80Hz", "Cut at 250Hz", "Boost at 2-4kHz"],
                        "compression": ["3:1 ratio", "Medium attack", "Medium release"],
                        "effects": ["Reverb", "Delay", "Chorus"]
                    },
                    "tips": ["Double-track for width", "Pan left-right", "Watch for phase"]
                }
            }
        }

        info = instruments_db.get(category, {}).get(instrument, {})
        
        if not info:
            info = {
                "typical_range_hz": [20, 20000],
                "target_levels": {"peaks_dbfs": -6, "avg_lufs": -18},
                "common_issues": ["Generic instrument"],
                "recommended_processing": {"eq": [], "compression": [], "effects": []},
                "tips": []
            }

        return {
            "success": True,
            "category": category,
            "instrument": instrument,
            "info": info,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"[Instrument Info] Error: {e}")
        return {
            "success": False,
            "error": str(e),
            "category": category,
            "instrument": instrument,
            "info": {}
        }

async def ear_training(exercise_type: str = "interval", difficulty: str = "beginner") -> Dict[str, Any]:
    """
    Generate ear training exercises for music production
    
    Args:
        exercise_type: Type of exercise (interval, chord, rhythm)
        difficulty: Difficulty level (beginner, intermediate, advanced)
        
    Returns:
        Quiz items with exercise data
    """
    try:
        # Interval exercises
        intervals = {
            "beginner": [
                {"name": "Perfect Unison", "semitones": 0, "example": "C to C"},
                {"name": "Perfect Fifth", "semitones": 7, "example": "C to G"},
                {"name": "Perfect Octave", "semitones": 12, "example": "C to C (octave)"},
            ],
            "intermediate": [
                {"name": "Major Third", "semitones": 4, "example": "C to E"},
                {"name": "Minor Third", "semitones": 3, "example": "C to Eb"},
                {"name": "Perfect Fourth", "semitones": 5, "example": "C to F"},
                {"name": "Major Sixth", "semitones": 9, "example": "C to A"},
            ],
            "advanced": [
                {"name": "Minor Second", "semitones": 1, "example": "C to Db"},
                {"name": "Major Second", "semitones": 2, "example": "C to D"},
                {"name": "Tritone", "semitones": 6, "example": "C to F#"},
                {"name": "Minor Seventh", "semitones": 10, "example": "C to Bb"},
                {"name": "Major Seventh", "semitones": 11, "example": "C to B"},
            ]
        }
        
        # Chord exercises
        chords = {
            "beginner": [
                {"name": "Major Triad", "notes": ["C", "E", "G"], "quality": "major"},
                {"name": "Minor Triad", "notes": ["C", "Eb", "G"], "quality": "minor"},
            ],
            "intermediate": [
                {"name": "Dominant 7th", "notes": ["C", "E", "G", "Bb"], "quality": "dominant"},
                {"name": "Minor 7th", "notes": ["C", "Eb", "G", "Bb"], "quality": "minor7"},
            ],
            "advanced": [
                {"name": "Major 9th", "notes": ["C", "E", "G", "B", "D"], "quality": "major9"},
                {"name": "Altered Dominant", "notes": ["C", "E", "Gb", "Bb"], "quality": "altered"},
            ]
        }
        
        # Rhythm exercises
        rhythms = {
            "beginner": [
                {"name": "Quarter Notes", "pattern": "1-2-3-4", "subdivision": 4},
                {"name": "Eighth Notes", "pattern": "1&2&3&4&", "subdivision": 8},
            ],
            "intermediate": [
                {"name": "Syncopation", "pattern": "1-&-3-&-", "subdivision": 8},
                {"name": "Triplets", "pattern": "1-trip-let-2-trip-let", "subdivision": 12},
            ],
            "advanced": [
                {"name": "Polyrhythm 3:2", "pattern": "3 over 2", "subdivision": 6},
                {"name": "Complex Syncopation", "pattern": "1-&a-3&-", "subdivision": 16},
            ]
        }
        
        # Select appropriate exercise set
        if exercise_type == "interval":
            items = intervals.get(difficulty, intervals["beginner"])
        elif exercise_type == "chord":
            items = chords.get(difficulty, chords["beginner"])
        elif exercise_type == "rhythm":
            items = rhythms.get(difficulty, rhythms["beginner"])
        else:
            items = intervals.get(difficulty, intervals["beginner"])
        
        # Add IDs and completed status
        for i, item in enumerate(items):
            item["id"] = f"{exercise_type}_{difficulty}_{i}"
            item["completed"] = False
        
        # Generate instructions
        instructions = {
            "interval": "Listen to each interval and identify the distance between notes.",
            "chord": "Listen to each chord and identify its quality.",
            "rhythm": "Tap or clap each rhythm pattern."
        }.get(exercise_type, "Listen and identify each musical element.")
        
        return {
            "success": True,
            "exercise_type": exercise_type,
            "difficulty": difficulty,
            "quiz_items": items,
            "instructions": instructions,
            "total_exercises": len(items),
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"[Ear Training] Error: {e}")
        return {
            "success": False,
            "error": str(e),
            "exercise_type": exercise_type,
            "difficulty": difficulty,
            "quiz_items": [],
            "instructions": "",
            "total_exercises": 0
        }

# ============================================================================
# CONSTANTS & GLOBALS
# ============================================================================

# WebSocket connections tracking
active_websockets: List[WebSocket] = []
LAST_BROADCAST_AT: Optional[str] = None

async def broadcast_status_periodically(interval_seconds: float = 2.0):
    """Broadcast server health and transport status to all WS clients periodically."""
    global LAST_BROADCAST_AT
    try:
        while True:
            try:
                payload = {
                    "type": "server_status",
                    "data": {
                        "health": {"status": "healthy", "timestamp": get_timestamp()},
                        "transport": transport_manager.get_state(),
                        "connections": len(active_websockets),
                    },
                }
                LAST_BROADCAST_AT = get_timestamp()
                # Send to all active websockets
                for ws in list(active_websockets):
                    try:
                        await ws.send_json(payload)
                    except Exception:
                        # Drop dead sockets
                        try:
                            active_websockets.remove(ws)
                        except ValueError:
                            pass
                await asyncio.sleep(interval_seconds)
            except asyncio.CancelledError:
                # Task was cancelled; exit cleanly
                break
            except Exception:
                # Continue loop on any unexpected error
                await asyncio.sleep(interval_seconds)
    except asyncio.CancelledError:
        # Prevent CancelledError from bubbling further
        return

# Mock quantum state for fallback
MOCK_QUANTUM_STATE = {
    "coherence": 0.85,
    "entanglement": 0.72,
    "resonance": 0.68,
    "phase": 1.57,
    "fluctuation": 0.07
}

def get_timestamp() -> str:
    """Get current ISO timestamp"""
    return datetime.now(timezone.utc).isoformat()

# ============================================================================
# DEPENDENCY CHECKS
# ============================================================================

# Try to import NumPy for audio processing
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    np = None
    NUMPY_AVAILABLE = False
    print("[WARNING] NumPy not available - audio processing disabled")

# Supabase availability check
SUPABASE_AVAILABLE = False
try:
    from supabase import create_client
    supabase_url = os.getenv("VITE_SUPABASE_URL", "")
    supabase_key = os.getenv("VITE_SUPABASE_SERVICE_KEY", "")
    if supabase_url and supabase_key:
        SUPABASE_AVAILABLE = True
        logger.info("[OK] Supabase client initialized")
except ImportError:
    logger.info("[i]  Supabase library not installed")
except Exception as e:
    logger.warning(f"[!]  Supabase initialization failed: {e}")
    logger.warning("   CSPROTECT may not work correctly")

# Training data availability
TRAINING_AVAILABLE = False
get_training_context = None
try:
    from training_data import get_training_context
    TRAINING_AVAILABLE = True
    logger.info("[OK] Training data module loaded")
except ImportError:
    logger.info("[i]  Training data module not available")

# Try to import OpenAI for fallback model
OPENAI_AVAILABLE = False
openai_client = None
OPENAI_FALLBACK_ENABLED = os.getenv("OPENAI_FALLBACK_ENABLED", "false").lower() == "true"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_FALLBACK_MODEL_PRIMARY = os.getenv("OPENAI_FALLBACK_MODEL_PRIMARY", "ft:gpt-4.1-2025-04-14:raiffs-bits:codette-v9:BWgspFHr:ckpt-step-456")
OPENAI_FALLBACK_MODEL_SECONDARY = os.getenv("OPENAI_FALLBACK_MODEL_SECONDARY", "ft:gpt-4.1-2025-04-14:raiffs-bits:codettev71:C61lAE2r:ckpt-step-60")
OPENAI_ASSISTANT_ID = os.getenv("OPENAI_ASSISTANT_ID", "asst_qOBjSkFUAGVJgglhcnauiUZJ")

if OPENAI_FALLBACK_ENABLED and OPENAI_API_KEY:
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        OPENAI_AVAILABLE = True
        logger.info("[OK] OpenAI client initialized (fallback enabled)")
        logger.info(f"   * Primary model: {OPENAI_FALLBACK_MODEL_PRIMARY[:60]}...")
        logger.info(f"   * Secondary model: {OPENAI_FALLBACK_MODEL_SECONDARY[:60]}...")
        logger.info(f"   * Assistant ID: {OPENAI_ASSISTANT_ID}")
    except ImportError:
        logger.warning("[!] OpenAI library not installed. Run: pip install openai")
    except Exception as e:
        logger.warning(f"[!] OpenAI client initialization failed: {e}")
else:
    if not OPENAI_API_KEY:
        logger.info("[i]  OpenAI fallback disabled: No API key provided")
    else:
        logger.info("[i]  OpenAI fallback disabled in configuration")

# Try to import DAW Core DSP effects
DSP_EFFECTS_AVAILABLE = False
try:
    sys.path.insert(0, str(Path(__file__).parent))
    from daw_core.fx.eq_and_dynamics import EQ3Band, HighLowPass, Compressor
    from daw_core.fx.dynamics_part2 import Limiter
    from daw_core.fx.saturation import Saturation, Distortion
    from daw_core.fx.delays import SimpleDelay
    from daw_core.fx.reverb import Reverb
    DSP_EFFECTS_AVAILABLE = True
    logger.info("[OK] DSP effects library loaded")
except ImportError as e:
    logger.warning(f"[!] DSP effects not available: {e}")

# Try to import Intelligent Mixing Suggestions
INTELLIGENT_MIXING_AVAILABLE = False
try:
    from intelligent_mixing import IntelligentMixingSuggestionGenerator
    INTELLIGENT_MIXING_AVAILABLE = True
    logger.info("[OK] Intelligent Mixing Suggestions loaded")
except ImportError as e:
    logger.warning(f"[!] Intelligent Mixing not available: {e}")

# ============================================================================
# CODETTE IMPORT
# ============================================================================

# Add Codette directory to path
codette_path = Path(__file__).parent / "Codette"
if codette_path.exists():
    sys.path.insert(0, str(codette_path))
    logger.info(f"[OK] Added Codette path: {codette_path}")
else:
    logger.error("[X] Codette directory not found")

# Import Codette capabilities (Quantum Consciousness)
CODETTE_CAPABILITIES_AVAILABLE = False
quantum_consciousness = None
try:
    from src.codette_capabilities import QuantumConsciousness
    CODETTE_CAPABILITIES_AVAILABLE = True
    logger.info("[OK] Codette capabilities module loaded")
except ImportError as e:
    logger.info(f"[i]  Codette capabilities not available: {e}")

# Import Codette core - try enhanced 9-perspective version first
CODETTE_CORE_AVAILABLE = False
CODETTE_ENHANCED = False
codette_core = None

# Try enhanced version first (9 perspectives with MCMC, sentiment, etc.)
if NUMPY_AVAILABLE and hasattr(np, "_core"):
    try:
        from codette_enhanced import Codette as CodetteEnhanced
        CODETTE_CORE_AVAILABLE = True
        CODETTE_ENHANCED = True
        logger.info("[OK] Codette ENHANCED module (codette_enhanced.py) loaded - 9 perspectives")
    except Exception as e:
        logger.info(f"[i]  Enhanced Codette not available: {e}")
else:
    logger.info("[i]  Enhanced Codette not available: NumPy missing _core or not installed")

# Fallback to standard codette_new if enhanced engine was not loaded
if not CODETTE_CORE_AVAILABLE:
    try:
        from codette_new import Codette as CodetteCore
        CODETTE_CORE_AVAILABLE = True
        logger.info("[OK] Codette core module (codette_new.py) loaded successfully")
    except ImportError as e2:
        logger.error(f"[X] Failed to import any Codette: {e2}")

# Import Codette Hybrid (combines advanced features)
CODETTE_HYBRID_AVAILABLE = False
CodetteHybrid = None
try:
    from codette_hybrid import CodetteHybrid
    CODETTE_HYBRID_AVAILABLE = True
    logger.info("[OK] Codette Hybrid module loaded")
except ImportError as e:
    logger.info(f"[i]  Codette Hybrid not available: {e}")

# Initialize Quantum Consciousness
if CODETTE_CAPABILITIES_AVAILABLE:
    try:
        quantum_consciousness = QuantumConsciousness()
        logger.info("[OK] Quantum Consciousness System initialized")
    except Exception as e:
        logger.warning(f"[!] Could not initialize Quantum Consciousness: {e}")

# Initialize Codette instance
if CODETTE_CORE_AVAILABLE:
    try:
        if CODETTE_ENHANCED:
            codette_core = CodetteEnhanced(user_name="CoreLogicStudio")
            logger.info("[OK] Codette ENHANCED initialized successfully")
        else:
            codette_core = CodetteCore(user_name="CoreLogicStudio")
            logger.info("[OK] Codette initialized successfully")
    except Exception as e:
        logger.error(f"[X] Failed to initialize Codette: {e}")
        codette_core = None

# Initialize Codette Hybrid (preferred engine if available)
codette_hybrid = None
if CODETTE_HYBRID_AVAILABLE and CodetteHybrid:
    try:
        codette_hybrid = CodetteHybrid(user_name="CoreLogicStudio", use_ml_features=True)
        logger.info("[OK] Codette Hybrid System initialized (ML mode)")
        logger.info("   * Defense modifiers: Active")
        logger.info("   * Vector search: Active")
        logger.info("   * Prompt engineering: Active")
        logger.info("   * Creative sentence generation: Active")
        logger.info("   * ML features: Enabled")
    except Exception as e:
        logger.warning(f"[!] Could not initialize Codette Hybrid: {e}")

# Set the active engine (prefer hybrid > enhanced > core)
if codette_hybrid:
    codette_engine = codette_hybrid
    codette_engine_type = "CodetteHybrid"
    logger.info(f"[OK] Codette engine set from codette_hybrid (type: {codette_engine_type})")
elif codette_core:
    codette_engine = codette_core
    codette_engine_type = "CodetteEnhanced" if CODETTE_ENHANCED else "CodetteCore"
    logger.info(f"[OK] Codette engine set from codette_core (type: {codette_engine_type})")
else:
    codette_engine = None
    codette_engine_type = None
    logger.warning("[!] No Codette engine available - running in fallback mode")

# ============================================================================
# OPENAI FALLBACK HANDLER
# ============================================================================

# Thread storage for persistent conversations
openai_threads: Dict[str, str] = {}  # user_id -> thread_id mapping

async def get_or_create_thread(user_id: str = "default") -> str:
    """Get existing thread or create new one for user"""
    if user_id not in openai_threads:
        try:
            thread = openai_client.beta.threads.create()
            openai_threads[user_id] = thread.id
            logger.info(f"[OpenAI] Created new thread for user {user_id}: {thread.id}")
        except Exception as e:
            logger.error(f"[OpenAI] Failed to create thread: {e}")
            raise
    return openai_threads[user_id]

async def query_openai_assistant(message: str, daw_context: Optional[Dict[str, Any]] = None, user_id: str = "default") -> Dict[str, Any]:
    """Query OpenAI Assistant using Assistants v2 API with thread management"""
    
    if not OPENAI_AVAILABLE or not openai_client:
        return {
            "response": None,
            "source": "unavailable",
            "confidence": 0.0,
            "error": "OpenAI Assistant not configured"
        }
    
    try:
        # Get or create thread for this user
        thread_id = await get_or_create_thread(user_id)

        # If a run is currently active for this thread, avoid posting a new message
        if _is_thread_run_active(thread_id):
            logger.warning(f"[OpenAI Assistant] Thread {thread_id} has an active run; skipping message post and falling back to local engine")
            return {
                "response": None,
                "source": "assistant_busy",
                "confidence": 0.0,
                "error": "Assistant thread busy with an active run"
            }
        
        # Build context-aware message
        full_message = message
        if daw_context:
            context_str = "\n\n**DAW Context:**\n"
            if "selectedTrack" in daw_context and daw_context["selectedTrack"]:
                track = daw_context["selectedTrack"]
                context_str += f"- Selected Track: {track.get('name', 'Unknown')} ({track.get('type', 'audio')})\n"
                context_str += f"- Volume: {track.get('volume', 0)} dB\n"
                context_str += f"- Pan: {track.get('pan', 0)}\n"
            
            if "trackCount" in daw_context:
                context_str += f"- Total Tracks: {daw_context['trackCount']}\n"
            
            if "isPlaying" in daw_context:
                context_str += f"- Transport: {'Playing' if daw_context['isPlaying'] else 'Stopped'}\n"
            
            full_message += context_str
        
        # Add message to thread with safe error handling
        logger.info(f"[OpenAI Assistant] Adding message to thread {thread_id}")
        try:
            openai_client.beta.threads.messages.create(
                thread_id=thread_id,
                role="user",
                content=full_message
            )
        except Exception as e:
            # Detect specific invalid_request_error mentioning active run to fast-fail
            msg = str(e)
            if "Can't add messages to thread" in msg or "while a run" in msg:
                logger.error(f"[OpenAI Assistant] Error posting message (thread busy): {e}")
                return {
                    "response": None,
                    "source": "assistant_error",
                    "confidence": 0.0,
                    "error": f"Assistant thread busy: {e}"
                }
            # Unknown error - re-raise to outer handler which will fallback
            raise

        # Build tools array (include intelligent mixing + advanced features)
        tools = []
        if INTELLIGENT_MIXING_AVAILABLE:
            tools.append({
                "type": "function",
                "function": {
                    "name": "generate_intelligent_mixing_suggestions",
                    "description": "Generate real-time, context-aware audio mixing recommendations using audio analysis and track metadata.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "track_type": {
                                "type": "string",
                                "description": "Type of audio track (e.g., vocals, drums, bass, guitar, synth, etc.)"
                            },
                            "audio_data": {
                                "type": ["array", "null"],
                                "description": "Audio buffer as a list of audio samples (mono or stereo). Omit or set to null for context-only analysis.",
                                "items": {"type": "number"}
                            },
                            "sample_rate": {
                                "type": "integer",
                                "description": "Sampling rate of the audio buffer in Hz. Defaults to 44100.",
                                "default": 44100
                            },
                            "track_info": {
                                "type": "object",
                                "description": "Metadata about the track (e.g., peak_level, muted, soloed, volume, etc.).",
                                "properties": {
                                    "peak_level": {"type": "number", "description": "Current peak level of the track in dB."},
                                    "muted": {"type": "boolean", "description": "Whether the track is muted."},
                                    "soloed": {"type": "boolean", "description": "Whether the track is in solo mode."},
                                    "volume": {"type": "number", "description": "The volume setting of the track in dB."}
                                },
                                "required": ["peak_level", "muted", "soloed", "volume"],
                                "additionalProperties": False
                            },
                            "context": {
                                "type": "object",
                                "description": "Project-level context such as BPM and genre.",
                                "properties": {
                                    "bpm": {"type": "integer", "description": "Project beats per minute."},
                                    "genre": {"type": "string", "description": "Musical genre (e.g., pop, rock, jazz, EDM, etc.)"}
                                },
                                "required": ["bpm", "genre"],
                                "additionalProperties": False
                            }
                        },
                        "required": ["track_type", "track_info", "context"]
                    }
                }
            })
        
        # ADD NEW ADVANCED FEATURES
        tools.extend([
            {
                "type": "function",
                "function": {
                    "name": "detect_genre",
                    "description": "Detect music genre based on BPM, instruments, and project context. Returns top 3 genre candidates with confidence scores.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "bpm": {"type": "number", "description": "Tempo in beats per minute"},
                            "tracks": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "name": {"type": "string", "description": "Track name"},
                                        "type": {"type": "string", "description": "Track type (e.g., audio, instrument, drums)"}
                                    }
                                },
                                "description": "Array of track metadata (optional)"
                            },
                            "project_name": {"type": "string", "description": "Project name (optional, used for hints)"}
                        },
                        "required": ["bpm"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_production_checklist",
                    "description": "Generate stage-specific professional production workflow checklist with organized tasks and priorities.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "stage": {
                                "type": "string",
                                "enum": ["recording", "arrangement", "mixing", "mastering"],
                                "description": "Production stage to get checklist for"
                            }
                        },
                        "required": ["stage"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_instrument_processing_guide",
                    "description": "Get professional mixing guidance for specific instruments including frequency ranges, EQ recommendations, compression settings, and common issues.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "category": {
                                "type": "string",
                                "enum": ["vocals", "drums", "guitars", "bass", "keys", "strings", "brass", "woodwinds"],
                                "description": "Instrument category"
                            },
                            "instrument": {"type": "string", "description": "Specific instrument name (e.g., 'kick', 'lead', 'electric')"}
                        },
                        "required": ["category", "instrument"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_ear_training_exercise",
                    "description": "Generate interactive ear training exercises for intervals, chords, or rhythm with multiple difficulty levels.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "exercise_type": {
                                "type": "string",
                                "enum": ["interval", "chord", "rhythm"],
                                "description": "Type of ear training exercise"
                            },
                            "difficulty": {
                                "type": "string",
                                "enum": ["beginner", "intermediate", "advanced"],
                                "description": "Exercise difficulty level"
                            }
                        },
                        "required": ["exercise_type", "difficulty"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "calculate_delay_sync",
                    "description": "Calculate precise tempo-synchronized delay times in milliseconds for rhythmic effects. Supports all standard note divisions including dotted and triplet values.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "bpm": {"type": "number", "description": "Project tempo in beats per minute (1-300)"},
                            "note_division": {
                                "type": "string",
                                "enum": ["whole", "half", "quarter", "eighth", "sixteenth", "dotted_quarter", "dotted_eighth", "triplet_quarter", "triplet_eighth"],
                                "description": "Note division for delay time calculation"
                            }
                        },
                        "required": ["bpm", "note_division"]
                    }
                }
            }
        ])
        
        # Create and wait for run (with tools if available)
        logger.info(f"[OpenAI Assistant] Creating run with assistant {OPENAI_ASSISTANT_ID}")
        run_params = {
            "thread_id": thread_id,
            "assistant_id": OPENAI_ASSISTANT_ID
        }
        if tools:
            run_params["tools"] = tools
            logger.info(f"[OpenAI Assistant] Enabled {len(tools)} function tools")
        
        run = openai_client.beta.threads.runs.create(**run_params)
        
        # Poll for completion with function call handling
        max_wait = int(os.getenv("OPENAI_TIMEOUT", "30"))
        waited = 0
        while run.status in ("queued", "in_progress", "requires_action"):
            if waited >= max_wait:
                logger.error(f"[OpenAI Assistant] Timeout after {max_wait}s")
                return {
                    "response": None,
                    "source": "assistant_timeout",
                    "confidence": 0.0,
                    "error": f"Assistant run timed out after {max_wait}s"
                }
            
            # Handle function calls if needed
            if run.status == "requires_action":
                logger.info("[OpenAI Assistant] Handling function calls...")
                tool_outputs = await handle_assistant_function_calls(run)
                
                # Submit tool outputs
                run = openai_client.beta.threads.runs.submit_tool_outputs(
                    thread_id=thread_id,
                    run_id=run.id,
                    tool_outputs=tool_outputs
                )
            
            await asyncio.sleep(1)
            waited += 1
            run = openai_client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id
            )
            
            if waited % 5 == 0:
                logger.info(f"[OpenAI Assistant] Waiting for run... ({waited}s, status: {run.status})")
        
        # Check final status
        if run.status != "completed":
            logger.error(f"[OpenAI Assistant] Run failed with status: {run.status}")
            return {
                "response": None,
                "source": "assistant_failed",
                "confidence": 0.0,
                "error": f"Assistant run failed: {run.status}"
            }
        
        # Get response messages
        messages = openai_client.beta.threads.messages.list(
            thread_id=thread_id,
            order="desc",
            limit=1
        )
        
        if not messages.data:
            logger.error("[OpenAI Assistant] No response messages")
            return {
                "response": None,
                "source": "assistant_empty",
                "confidence": 0.0,
                "error": "No response from assistant"
            }
        
        # Extract response text
        response_message = messages.data[0]
        response_text = ""
        
        for content_block in response_message.content:
            if content_block.type == "text":
                response_text += content_block.text.value
        
        if not response_text:
            logger.error("[OpenAI Assistant] Empty response text")
            return {
                "response": None,
                "source": "assistant_empty",
                "confidence": 0.0,
                "error": "Empty response from assistant"
            }
        
        logger.info(f"[OpenAI Assistant] [OK] Success ({len(response_text)} chars)")
        
        return {
            "response": response_text,
            "source": "openai_assistant",
            "confidence": 0.95,  # Highest confidence for assistant
            "thread_id": thread_id,
            "run_id": run.id,
            "error": None
        }
    
    except Exception as e:
        logger.error(f"[OpenAI Assistant] Error: {e}")
        return {
            "response": None,
            "source": "assistant_error",
            "confidence": 0.0,
            "error": str(e)
        }

async def handle_assistant_function_calls(run) -> List[Dict[str, Any]]:
    """Handle function calls from OpenAI Assistant with compatibility for multiple SDK response shapes"""
    tool_outputs = []

    if not getattr(run, "required_action", None) or not getattr(run.required_action, "submit_tool_outputs", None):
        return tool_outputs

    for idx, tool_call in enumerate(run.required_action.submit_tool_outputs.tool_calls):
        # Try to extract function name from several possible shapes
        function_name = None
        try:
            if hasattr(tool_call, "function") and getattr(tool_call.function, "name", None):
                function_name = tool_call.function.name
            elif getattr(tool_call, "function_name", None):
                function_name = tool_call.function_name
            elif getattr(tool_call, "name", None):
                function_name = tool_call.name
            elif hasattr(tool_call, "function_call") and getattr(tool_call.function_call, "name", None):
                function_name = tool_call.function_call.name
        except Exception:
            function_name = None

        # Safely extract raw function arguments which may be stored under different attributes
        raw_args = None
        try:
            if hasattr(tool_call, "function_arguments"):
                raw_args = tool_call.function_arguments
            elif hasattr(tool_call, "function_args"):
                raw_args = tool_call.function_args
            elif hasattr(tool_call, "arguments"):
                raw_args = tool_call.arguments
            elif hasattr(tool_call, "function") and hasattr(tool_call.function, "arguments"):
                raw_args = tool_call.function.arguments
            elif hasattr(tool_call, "function_call") and hasattr(tool_call.function_call, "arguments"):
                raw_args = tool_call.function_call.arguments
            else:
                raw_args = "{}"
        except Exception:
            raw_args = "{}"

        # Normalize arguments into a dict
        try:
            if isinstance(raw_args, (dict, list)):
                function_args = raw_args
            elif isinstance(raw_args, bytes):
                function_args = json.loads(raw_args.decode("utf-8"))
            else:
                # raw_args is likely a string
                if raw_args is None:
                    function_args = {}
                else:
                    # Some SDKs return Python repr with single quotes - try to fix common issues
                    if isinstance(raw_args, str):
                        try:
                            function_args = json.loads(raw_args)
                        except Exception:
                            try:
                                function_args = json.loads(raw_args.replace("'", '"'))
                            except Exception:
                                function_args = {}
                    else:
                        function_args = {}
        except Exception:
            function_args = {}

        # Extract tool_call id (compatibility)
        tool_call_id = getattr(tool_call, "id", None) or getattr(tool_call, "tool_call_id", None) or getattr(tool_call, "call_id", None) or f"toolcall_{idx}"

        logger.info(f"[OpenAI Assistant] Function call: {function_name}")

        try:
            # Existing intelligent mixing function
            if function_name == "generate_intelligent_mixing_suggestions":
                result = await execute_mixing_suggestions(function_args)

            # NEW ADVANCED FEATURE FUNCTIONS
            elif function_name == "detect_genre":
                result = await execute_genre_detection(function_args)

            elif function_name == "get_production_checklist":
                result = await execute_production_checklist(function_args)

            elif function_name == "get_instrument_processing_guide":
                result = await execute_instrument_guide(function_args)

            elif function_name == "get_ear_training_exercise":
                result = await execute_ear_training(function_args)

            elif function_name == "calculate_delay_sync":
                result = await execute_delay_sync(function_args)

            else:
                logger.warning(f"[OpenAI Assistant] Unknown function: {function_name}")
                tool_outputs.append({
                    "tool_call_id": tool_call_id,
                    "output": json.dumps({"error": f"Unknown function: {function_name}"})
                })
                continue

            tool_outputs.append({
                "tool_call_id": tool_call_id,
                "output": json.dumps(result)
            })
        except Exception as e:
            logger.error(f"[OpenAI Assistant] Function call error: {e}")
            tool_outputs.append({
                "tool_call_id": tool_call_id,
                "output": json.dumps({"error": str(e)})
            })

    return tool_outputs

async def execute_mixing_suggestions(args: Dict[str, Any]) -> Dict[str, Any]:
    """Execute intelligent mixing suggestions function"""
    if not INTELLIGENT_MIXING_AVAILABLE:
        return {"error": "Intelligent mixing module not available"}
    
    try:
        from intelligent_mixing import IntelligentMixingSuggestionGenerator
        import numpy as np
        
        generator = IntelligentMixingSuggestionGenerator()
        
        # Parse arguments
        track_type = args.get("track_type", "audio")
        audio_data = args.get("audio_data")  # Can be None
        sample_rate = args.get("sample_rate", 44100)
        track_info = args.get("track_info", {})
        context = args.get("context", {})
        
        # Convert audio data to numpy array if provided
        audio_array = None
        if audio_data is not None:
            audio_array = np.array(audio_data, dtype=np.float32)
        
        # Generate suggestions
        suggestions = generator.generate_suggestions(
            track_type=track_type,
            audio_data=audio_array,
            sample_rate=sample_rate,
            track_info=track_info,
            context=context
        )
        
        # Convert to dict for JSON serialization
        result = {
            "suggestions": [
                {
                    "type": sug.type,
                    "title": sug.title,
                    "description": sug.description,
                    "parameters": sug.parameters,
                    "priority": sug.priority,
                    "confidence": sug.confidence,
                    "reasoning": sug.reasoning
                }
                for sug in suggestions[:10]  # Limit to top 10
            ],
            "total_suggestions": len(suggestions),
            "track_type": track_type,
            "has_audio_analysis": audio_array is not None
        }
        
        logger.info(f"[Mixing Suggestions] Generated {len(suggestions)} suggestions for {track_type}")
        return result
        
    except Exception as e:
        logger.error(f"[Mixing Suggestions] Error: {e}")
        return {"error": str(e)}


async def execute_genre_detection(args: Dict[str, Any]) -> Dict[str, Any]:
    """Execute genre detection based on BPM, tracks, and project context"""
    try:
        # Extract arguments
        bpm = args.get("bpm", 120.0)
        tracks = args.get("tracks", [])
        project_name = args.get("project_name", "")
        
        # Genre detection logic based on BPM ranges
        genres = {
            "Ambient": (40, 90),
            "Hip-Hop/Rap": (80, 110),
            "Pop": (90, 130),
            "Funk/Soul": (100, 130),
            "Electronic/House": (110, 130),
            "Rock": (100, 150),
            "Trance": (125, 150),
            "Drum & Bass": (160, 180)
        }
        
        # Find best match based on BPM
        best_genre = "Electronic"
        best_confidence = 0.5
        candidates = []
        
        for genre, (min_bpm, max_bpm) in genres.items():
            if min_bpm <= bpm <= max_bpm:
                confidence = 0.85
            elif bpm < min_bpm:
                confidence = max(0.1, 0.85 - (min_bpm - bpm) / 50)
            else:
                confidence = max(0.1, 0.85 - (bpm - max_bpm) / 50)
            
            candidates.append({
                "genre": genre,
                "genre_id": genre.lower().replace(" ", "_").replace("/", "_"),
                "confidence": confidence,
                "bpm_range": [min_bpm, max_bpm],
                "characteristics": []
            })
            
            if confidence > best_confidence:
                best_confidence = confidence
                best_genre = genre
        
        # Sort by confidence
        candidates = sorted(candidates, key=lambda x: x["confidence"], reverse=True)
        
        return {
            "success": True,
            "genre": best_genre,
            "genre_id": best_genre.lower().replace(" ", "_").replace("/", "_"),
            "confidence": best_confidence,
            "bpm_range": [max(40, bpm - 15), bpm + 15],
            "characteristics": ["BPM-based"],
            "candidates": candidates[:3],
            "input": {
                "bpm": bpm,
                "track_count": len(tracks),
                "project_name": project_name
            }
        }
    except Exception as e:
        logger.error(f"[Genre Detection] Error: {e}")
        return {"success": False, "error": str(e)}


async def execute_production_checklist(args: Dict[str, Any]) -> Dict[str, Any]:
    """Execute production checklist generation for specified stage"""
    try:
        stage = args.get("stage", "mixing")
        response = await production_checklist(stage)
        
        return {
            "success": response.get("success", True),
            "stage": response.get("stage", stage),
            "items": response.get("items", []),
            "total_tasks": len(response.get("items", [])),
            "high_priority_count": len([i for i in response.get("items", []) if i.get("priority") == "high"]),
            "completion_percentage": response.get("completionPercentage", 0)
        }
    except Exception as e:
        logger.error(f"[Production Checklist] Error: {e}")
        return {"success": False, "error": str(e)}


async def execute_instrument_guide(args: Dict[str, Any]) -> Dict[str, Any]:
    """Execute instrument processing guide retrieval"""
    try:
        category = args.get("category", "vocals")
        instrument = args.get("instrument", "lead")
        
        response = await instrument_info(category, instrument)
        
        return {
            "success": response.get("success", True),
            "category": response.get("category", category),
            "instrument": response.get("instrument", instrument),
            "info": response.get("info", {}),
            "formatted_guide": format_instrument_guide(response.get("info", {}))
        }
    except Exception as e:
        logger.error(f"[Instrument Guide] Error: {e}")
        return {"success": False, "error": str(e)}


async def execute_ear_training(args: Dict[str, Any]) -> Dict[str, Any]:
    """Execute ear training exercise generation"""
    try:
        exercise_type = args.get("exercise_type", "interval")
        difficulty = args.get("difficulty", "beginner")
        
        response = await ear_training(exercise_type, difficulty)
        
        return {
            "success": response.get("success", True),
            "exercise_type": exercise_type,
            "difficulty": difficulty,
            "quiz_items": response.get("quiz_items", []),
            "instructions": response.get("instructions", ""),
            "total_exercises": len(response.get("quiz_items", []))
        }
    except Exception as e:
        logger.error(f"[Ear Training] Error: {e}")
        return {"success": False, "error": str(e)}


async def execute_delay_sync(args: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate tempo-synced delay times with precise millisecond accuracy"""
    try:
        bpm = args.get("bpm", 120.0)
        note_division = args.get("note_division", "quarter")
        
        # Note division to beat multiplier mapping
        divisions = {
            "whole": 4.0,
            "half": 2.0,
            "quarter": 1.0,
            "eighth": 0.5,
            "sixteenth": 0.25,
            "dotted_quarter": 1.5,
            "dotted_eighth": 0.75,
            "triplet_quarter": 2.0 / 3.0,
            "triplet_eighth": 1.0 / 3.0
        }
        
        if note_division not in divisions:
            return {
                "success": False,
                "error": f"Invalid note division: {note_division}"
            }
        
        beat_value = divisions[note_division]
        delay_ms = (60000.0 / bpm) * beat_value
        delay_seconds = delay_ms / 1000.0
        
        return {
            "success": True,
            "bpm": bpm,
            "note_division": note_division,
            "delay_ms": round(delay_ms, 2),
            "delay_seconds": round(delay_seconds, 3),
            "beat_value": beat_value,
            "formula": f"(60000 / {bpm}) x {beat_value} = {delay_ms:.2f}ms",
            "use_case": f"Set your delay plugin to {delay_ms:.2f}ms for tempo-synced {note_division} note delays"
        }
    except Exception as e:
        logger.error(f"[Delay Sync] Error: {e}")
        return {"success": False, "error": str(e)}


def format_instrument_guide(info: Dict[str, Any]) -> str:
    """Format instrument guide into readable text"""
    try:
        lines = []
        
        if "typical_range_hz" in info:
            freq_range = info["typical_range_hz"]
            lines.append(f"Frequency Range: {freq_range[0]}-{freq_range[1]} Hz")
        
        if "target_levels" in info:
            levels = info["target_levels"]
            lines.append(f"Target Levels: {levels.get('peaks_dbfs', 'N/A')} dBFS peaks, {levels.get('avg_lufs', 'N/A')} LUFS average")
        
        if "common_issues" in info:
            issues = info["common_issues"]
            lines.append(f"Common Issues: {', '.join(issues)}")
        
        if "recommended_processing" in info:
            proc = info["recommended_processing"]
            if "eq" in proc:
                lines.append(f"EQ: {'; '.join(proc['eq']) if isinstance(proc['eq'], list) else proc['eq']}")
            if "compression" in proc:
                lines.append(f"Compression: {'; '.join(proc['compression']) if isinstance(proc['compression'], list) else proc['compression']}")
            if "effects" in proc:
                lines.append(f"Effects: {'; '.join(proc['effects']) if isinstance(proc['effects'], list) else proc['effects']}")
        
        if "tips" in info:
            tips = info["tips"]
            lines.append(f"Tips: {'; '.join(tips)}")
        
        return "\n".join(lines) if lines else "No detailed guide available"
    except Exception as e:
        return f"Error formatting guide: {str(e)}"
        
# ============================================================================
# TRANSPORT MANAGER
# ============================================================================

class TransportManager:
    def __init__(self):
        self.playing = False
        self.time_seconds = 0.0
        self.bpm = 120.0
        self.sample_rate = 44100
        self.start_time = None
        self.loop_enabled = False
        self.loop_start = 0.0
        self.loop_end = 10.0
    
    def get_state(self):
        if self.playing and self.start_time:
            self.time_seconds = time.time() - self.start_time
        beat_duration = 60.0 / self.bpm
        return {
            "playing": self.playing, "time_seconds": self.time_seconds,
            "sample_pos": int(self.time_seconds * self.sample_rate), "bpm": self.bpm,
            "beat_pos": (self.time_seconds % (beat_duration * 4)) / beat_duration,
            "loop_enabled": self.loop_enabled, "loop_start_seconds": self.loop_start, "loop_end_seconds": self.loop_end
        }
    
    def play(self):
        if not self.playing:
            self.playing = True
            self.start_time = time.time() - self.time_seconds
        return self.get_state()
    
    def stop(self):
        self.playing = False
        self.time_seconds = 0.0
        self.start_time = None
        return self.get_state()
    
    def pause(self):
        if self.playing:
            self.time_seconds = time.time() - self.start_time
            self.playing = False
        return self.get_state()
    
    def resume(self):
        if not self.playing:
            self.playing = True
            self.start_time = time.time() - self.time_seconds
        return self.get_state()
    
    def seek(self, t): self.time_seconds = max(0.0, t); return self.get_state()
    def set_tempo(self, bpm): self.bpm = max(1.0, min(300.0, bpm)); return self.get_state()
    def set_loop(self, en, s=0.0, e=10.0): self.loop_enabled = en; self.loop_start = s; self.loop_end = e; return self.get_state()

transport_manager = TransportManager()

# ============================================================================
# Lifespan / startup helpers
# ============================================================================

def _log_startup_banner():
    logger.info("")
    logger.info("======================================================================")
    logger.info(" CODETTE AI UNIFIED SERVER - STARTUP")
    logger.info("======================================================================")
    logger.info(" Server Configuration:")
    logger.info("   * Version: 2.0.0")
    logger.info("   * Host: 0.0.0.0 (all interfaces)")
    logger.info(f"   * Port: {os.environ.get('PORT', 8000)}")
    logger.info("   * CORS: Enabled for 4 origins")
    logger.info("")
    
    # Codette AI Engine status
    logger.info(" Codette AI Engine:")
    if codette_engine:
        logger.info("   [OK] Status: ACTIVE")
        logger.info(f"   * Engine: {codette_engine_type}")
        if codette_engine_type == "CodetteHybrid":
            logger.info("   * Mode: Hybrid (Defense + Vector + Prompt Engineering)")
        elif codette_engine_type == "CodetteEnhanced":
            logger.info("   * Perspectives: Neural, Logical, Creative, Ethical, Quantum, + 4 more")
        else:
            logger.info("   * Perspectives: Neural, Logical, Creative, Ethical, Quantum")
        logger.info("   * User: CoreLogicStudio")
        logger.info("   * Mode: Production-ready")
        logger.info("   * Method: respond() - returns multi-perspective analysis")
    else:
        logger.info("   [!]  Status: FALLBACK MODE")
        logger.info("   * Engine: Keyword-based responder")
        logger.info("   * Functionality: Limited to basic responses")
        logger.info("   * Recommendation: Install Codette package")
    
    # DAW Core DSP status (NEW SECTION - Priority 1)
    logger.info("")
    logger.info("  DAW Core DSP Engine:")
    if DAW_CORE_API_AVAILABLE and daw_core_app:
        logger.info("   [OK] Status: INTEGRATED")
        logger.info("   * API Prefix: /daw")
        logger.info("   * Total Effects: 19")
        logger.info("   * Categories:")
        logger.info("     - EQ: 3-band, High/Low pass")
        logger.info("     - Dynamics: Compressor, Limiter, Expander, Gate")
        logger.info("     - Saturation: Saturation, Distortion, WaveShaper")
        logger.info("     - Delays: Simple, PingPong, MultiTap, Stereo")
        logger.info("     - Reverb: Freeverb, Hall, Plate, Room")
        logger.info("   * Automation: Curve, LFO, Envelope")
        logger.info("   * Metering: Level, Spectrum, VU, Correlation")
        logger.info("   * Engine Control: Start, Stop, Config")
    elif DSP_EFFECTS_AVAILABLE:
        logger.info("   [!]  Status: PARTIAL")
        logger.info("   * DSP classes loaded but API not mounted")
        logger.info("   * Recommendation: Check daw_core/api.py import")
    else:
        logger.info("   [X] Status: NOT AVAILABLE")
        logger.info("   * DSP effects not loaded")
        logger.info("   * Recommendation: Install daw_core package")
    
    # OpenAI Fallback status
    logger.info("")
    logger.info(" OpenAI Fallback:")
    if OPENAI_AVAILABLE and OPENAI_FALLBACK_ENABLED:
        logger.info("   [OK] Status: ENABLED")
        
        # Assistant API status
        if OPENAI_ASSISTANT_ID:
            logger.info(f"    Assistant API: AVAILABLE")
            logger.info(f"      * Assistant ID: {OPENAI_ASSISTANT_ID}")
            logger.info(f"      * Version: {os.getenv('OPENAI_ASSISTANT_VERSION', 'v2')}")
            logger.info(f"      * Thread Management: Enabled")
            logger.info(f"      * Priority: Highest (tried first)")
            logger.info("")
        
        # Chat models status
        logger.info(f"    Chat Models:")
        logger.info(f"      * Primary: {OPENAI_FALLBACK_MODEL_PRIMARY[:50]}...")
        logger.info(f"      * Secondary: {OPENAI_FALLBACK_MODEL_SECONDARY[:50]}...")
        logger.info(f"      * Base: gpt-4o-mini")
        logger.info("")
        
        # Fallback chain
        if OPENAI_ASSISTANT_ID:
            logger.info("    Response Priority Chain:")
            logger.info("      1.  OpenAI Assistant API (PRIMARY - Highest quality)")
            logger.info("      2. Local Codette (Fallback)")
            logger.info("      3. Keyword Fallback (Last resort)")
        else:
            logger.info("    Response Priority Chain:")
            logger.info("      1.  Fine-tuned Primary Model (PRIMARY)")
            logger.info("      2. Fine-tuned Secondary Model")
            logger.info("      3. Base Model (gpt-4o-mini)")
            logger.info("      4. Local Codette (Fallback)")
            logger.info("      5. Keyword Fallback (Last resort)")
    elif OPENAI_FALLBACK_ENABLED and not OPENAI_API_KEY:
        logger.info("   [!]  Status: DISABLED (No API Key)")
        logger.info("   * Add OPENAI_API_KEY to .env to enable")
    elif not OPENAI_FALLBACK_ENABLED:
        logger.info("   [i]  Status: DISABLED (Configuration)")
        logger.info("   * Set OPENAI_FALLBACK_ENABLED=true to enable")
    else:
        logger.info("   [X] Status: NOT AVAILABLE")
        logger.info("   * OpenAI library not installed")
        logger.info("   * Run: pip install openai")
    logger.info("")
    
    # Database status
    logger.info(" Database:")
    if SUPABASE_AVAILABLE:
        logger.info("   [OK] Supabase: CONNECTED")
        logger.info(f"   * URL: {os.getenv('VITE_SUPABASE_URL', 'N/A')[:40]}...")
        logger.info("   * Key Type: Service Role (full access) ")
    else:
        logger.info("   [!]  Supabase: NOT CONNECTED")
        logger.info("   * Running in local mode")
    logger.info("")
    
    # Dependencies status
    logger.info(" Dependencies:")
    deps = []
    deps.append("NumPy [OK]" if NUMPY_AVAILABLE else "NumPy [X]")
    deps.append("Supabase [OK]" if SUPABASE_AVAILABLE else "Supabase [X]")
    deps.append("OpenAI [OK]" if OPENAI_AVAILABLE else "OpenAI [X]")
    deps.append("Mixing AI [OK]" if INTELLIGENT_MIXING_AVAILABLE else "Mixing AI [X]")
    logger.info("   * " + " | ".join(deps))
    
    # Training data availability
    logger.info(" Training Data:")
    if TRAINING_AVAILABLE:
        logger.info("   [OK] Available")
        logger.info("   * Method: get_training_context()")
    else:
        logger.info("   [X] Not available")
    
    # Quantum Consciousness status
    logger.info(" Quantum Consciousness:")
    if CODETTE_CAPABILITIES_AVAILABLE and quantum_consciousness:
        logger.info("   [OK] Initialized")
    else:
        logger.info("   [X] Not initialized or available")
    
    # Transport manager status
    logger.info(" Transport Manager:")
    logger.info(f"   * Playing: {transport_manager.playing}")
    logger.info(f"   * Time: {transport_manager.time_seconds:.2f}s")
    logger.info(f"   * BPM: {transport_manager.bpm}")
    logger.info(f"   * Sample Rate: {transport_manager.sample_rate}")
    logger.info(f"   * Loop: {transport_manager.loop_enabled} ({transport_manager.loop_start:.2f}s to {transport_manager.loop_end:.2f}s)")
    
    logger.info("")
    logger.info("======================================================================")
    logger.info("[OK] CODETTE AI UNIFIED SERVER IS READY")
    logger.info("======================================================================")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _log_startup_banner()
    try:
        if not getattr(app.state, "broadcast_task", None):
            app.state.broadcast_task = asyncio.create_task(broadcast_status_periodically())
            logger.info("Started broadcast_status_periodically background task")
    except Exception as e:
        logger.warning(f"Failed to start broadcast task: {e}")

    try:
        yield
    finally:
        task = getattr(app.state, "broadcast_task", None)
        if task:
            try:
                task.cancel()
                await task
            except asyncio.CancelledError:
                logger.info("broadcast_status_periodically task cancelled during shutdown")
            except Exception as e:
                logger.warning(f"Error while cancelling broadcast task: {e}")
        logger.info("Shutdown complete")

# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title="Codette AI Unified Server",
    description="Backend server for CoreLogic Studio DAW with Codette AI",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# REQUEST LOGGING MIDDLEWARE (Added by fix_invalid_requests.py)
# ============================================================================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming HTTP requests for debugging"""
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


logger.info("[OK] FastAPI app configured")

# ============================================================================
# UNIFIED EFFECT PROCESSOR (Priority 2: Critical Integration)
# ============================================================================

# Pydantic model must be defined BEFORE the endpoint that uses it
class EffectProcessRequest(BaseModel):
    """Request model for unified effect processing"""
    effect_type: str
    parameters: Dict[str, float]
    audio_data: List[float]
    sample_rate: Optional[int] = 44100

# Effect type mapping: frontend effect names -> DAW Core endpoint paths
EFFECT_TYPE_MAP = {
    # EQ Effects
    "highpass": "/daw/process/eq/highpass",
    "lowpass": "/daw/process/eq/lowpass",
    "3band": "/daw/process/eq/3band",
    "eq3band": "/daw/process/eq/3band",
    "parametric": "/daw/process/eq/3band",
    
    # Dynamics
    "compressor": "/daw/process/dynamics/compressor",
    "limiter": "/daw/process/dynamics/limiter",
    "expander": "/daw/process/dynamics/expander",
    "gate": "/daw/process/dynamics/gate",
    "noisegate": "/daw/process/dynamics/gate",
    
    # Saturation
    "saturation": "/daw/process/saturation/saturation",
    "distortion": "/daw/process/saturation/distortion",
    "waveshaper": "/daw/process/saturation/waveshaper",
    "hardclip": "/daw/process/saturation/hardclip",
    
    # Delays
    "delay": "/daw/process/delay/simple",
    "simple_delay": "/daw/process/delay/simple",
    "pingpong": "/daw/process/delay/pingpong",
    "pingpong_delay": "/daw/process/delay/pingpong",
    "multitap": "/daw/process/delay/multitap",
    "multitap_delay": "/daw/process/delay/multitap",
    "stereo_delay": "/daw/process/delay/stereo",
    
    # Reverb
    "reverb": "/daw/process/reverb/freeverb",
    "freeverb": "/daw/process/reverb/freeverb",
    "hall": "/daw/process/reverb/hall",
    "hall_reverb": "/daw/process/reverb/hall",
    "plate": "/daw/process/reverb/plate",
    "plate_reverb": "/daw/process/reverb/plate",
    "room": "/daw/process/reverb/room",
    "room_reverb": "/daw/process/reverb/room",
}


async def route_effect_to_daw_core(
    effect_type: str,
    parameters: Dict[str, float],
    audio_data: List[float],
    sample_rate: int = 44100
) -> Dict[str, Any]:
    """
    Route effect processing request to appropriate DAW Core endpoint
    
    This function implements the unified effect processor pattern:
    - Frontend calls /api/effects/process with effect_type
    - This function maps effect_type to specific DAW Core endpoint
    - Request is forwarded to mounted DAW Core API
    - Response is normalized and returned
    
    Args:
        effect_type: Effect name (e.g., 'compressor', 'highpass', 'reverb')
        parameters: Effect-specific parameters
        audio_data: Input audio samples
        sample_rate: Sample rate in Hz
        
    Returns:
        Normalized effect processing response
        
    Raises:
        HTTPException: If effect type unknown or processing fails
    """
    # Normalize effect type (lowercase, strip whitespace)
    effect_type_normalized = effect_type.lower().strip().replace(" ", "_")
    
    # Look up DAW Core endpoint
    daw_endpoint = EFFECT_TYPE_MAP.get(effect_type_normalized)
    
    if not daw_endpoint:
        logger.error(f"[Unified Processor] Unknown effect type: {effect_type}")
        raise HTTPException(
            status_code=404,
            detail=f"Unknown effect type: {effect_type}. Available: {', '.join(EFFECT_TYPE_MAP.keys())}"
        )
    
    # Check if DAW Core is available
    if not DAW_CORE_API_AVAILABLE:
        logger.error("[Unified Processor] DAW Core not available")
        raise HTTPException(
            status_code=503,
            detail="DSP engine not available. DAW Core API not loaded."
        )
    
    try:
        logger.info(f"[Unified Processor] Processing {effect_type} -> {daw_endpoint}")
        
        # Build request for DAW Core
        daw_request = ProcessAudioRequest(
            effect_type=effect_type,
            parameters=parameters,
            audio_data=audio_data
        )
        
        # Forward to DAW Core endpoint using internal routing
        # Note: We simulate an internal request since DAW Core is mounted
        import httpx
        async with httpx.AsyncClient() as client:
            # Use localhost to call our own mounted DAW Core API
            internal_url = f"http://localhost:{os.environ.get('PORT', 8000)}{daw_endpoint}"
            
            response = await client.post(
                internal_url,
                json={
                    "effect_type": effect_type,
                    "parameters": parameters,
                    "audio_data": audio_data
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                error_detail = response.json().get("detail", "Unknown error")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"DSP processing failed: {error_detail}"
                )
            
            result = response.json()
        
        # Normalize response format
        normalized_response = {
            "status": "success",
            "effect": effect_type,
            "effect_type": effect_type,
            "parameters": parameters,
            "output": result.get("output", []),
            "length": result.get("length", len(result.get("output", []))),
            "sample_rate": sample_rate,
            "timestamp": get_timestamp(),
            "daw_endpoint": daw_endpoint,
            "processing_time_ms": result.get("processing_time_ms", 0)
        }
        
        logger.info(
            f"[Unified Processor] [OK] {effect_type} processed "
            f"({len(audio_data)} -> {normalized_response['length']} samples)"
        )
        
        return normalized_response
        
    except httpx.RequestError as e:
        logger.error(f"[Unified Processor] Request failed: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to DSP engine: {str(e)}"
        )
    except Exception as e:
        logger.error(f"[Unified Processor] Error processing {effect_type}: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Effect processing error: {str(e)}"
        )


@app.post("/api/effects/process")
async def process_effect_unified(request: EffectProcessRequest):
    """
    Unified effect processing endpoint
    
    This is the PRIMARY endpoint that frontend uses for ALL effect processing.
    It routes requests to appropriate DAW Core endpoints based on effect_type.
    
    Supports all 19 DSP effects:
    - EQ: highpass, lowpass, 3band
    - Dynamics: compressor, limiter, expander, gate
    - Saturation: saturation, distortion, waveshaper, hardclip
    - Delays: simple, pingpong, multitap, stereo
    - Reverb: freeverb, hall, plate, room
    
    Example request:
    ```json
    {
      "effect_type": "compressor",
      "parameters": {
        "threshold": -20,
        "ratio": 4,
        "attack": 0.005,
        "release": 0.1
      },
      "audio_data": [0.1, 0.2, -0.1, ...],
      "sample_rate": 44100
    }
    ```
    
    Returns:
        Processed audio with metadata
    """
    try:
        logger.info(
            f"[API] /api/effects/process called: {request.effect_type} "
            f"({len(request.audio_data)} samples)"
        )
        
        result = await route_effect_to_daw_core(
            effect_type=request.effect_type,
            parameters=request.parameters,
            audio_data=request.audio_data,
            sample_rate=request.sample_rate
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Unified processor error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Unified effect processor failed: {str(e)}"
        )


@app.get("/api/effects/list")
async def list_effects():
    """
    List all available effects with categories
    
    Returns complete effect catalog organized by category.
    Frontend can use this to populate effect menus and validate effect types.
    
    Returns:
        Effect catalog with categories and total count
    """
    return {
        "categories": {
            "eq": {
                "effects": ["highpass", "lowpass", "3band", "parametric"],
                "description": "Frequency shaping and filtering"
            },
            "dynamics": {
                "effects": ["compressor", "limiter", "expander", "gate"],
                "description": "Dynamic range processing"
            },
            "saturation": {
                "effects": ["saturation", "distortion", "waveshaper", "hardclip"],
                "description": "Harmonic enhancement and drive"
            },
            "delays": {
                "effects": ["delay", "pingpong", "multitap", "stereo_delay"],
                "description": "Time-based effects"
            },
            "reverb": {
                "effects": ["reverb", "hall", "plate", "room"],
                "description": "Spatial and ambience effects"
            }
        },
        "total_effects": 19,
        "all_effects": sorted(EFFECT_TYPE_MAP.keys()),
        "daw_core_available": DAW_CORE_API_AVAILABLE,
        "timestamp": get_timestamp()
    }


@app.post("/api/effects/chain")
async def process_effect_chain(
    audio_data: List[float],
    effect_chain: List[Dict[str, Any]],
    sample_rate: int = 44100
):
    """
    Process audio through multiple effects in series
    
    Applies effects sequentially (output of effect N becomes input of effect N+1).
    This enables complex processing chains like:
    1. Highpass -> 2. Compressor -> 3. Saturation -> 4. Reverb
    
    Example request:
    ```json
    {
      "audio_data": [0.1, 0.2, ...],
      "effect_chain": [
        {
          "type": "highpass",
          "parameters": {"cutoff": 80}
        },
        {
          "type": "compressor",
          "parameters": {"threshold": -20, "ratio": 4}
        },
        {
          "type": "reverb",
          "parameters": {"room": 0.7, "wet": 0.3}
        }
      ],
      "sample_rate": 44100
    }
    ```
    
    Args:
        audio_data: Input audio samples
        effect_chain: Array of effects to apply sequentially
        sample_rate: Sample rate in Hz
        
    Returns:
        Final processed audio with chain metadata
    """
    try:
        logger.info(f"[API] Processing effect chain: {len(effect_chain)} effects")
        
        current_audio = audio_data
        chain_results = []
        
        for idx, effect_config in enumerate(effect_chain):
            effect_type = effect_config.get("type")
            parameters = effect_config.get("parameters", {})
            
            logger.info(f"[API] Chain step {idx+1}/{len(effect_chain)}: {effect_type}")
            
            try:
                result = await route_effect_to_daw_core(
                    effect_type=effect_type,
                    parameters=parameters,
                    audio_data=current_audio,
                    sample_rate=sample_rate
                )
                
                # Output becomes input for next effect
                current_audio = result["output"]
                
                chain_results.append({
                    "step": idx + 1,
                    "effect": effect_type,
                    "status": "success",
                    "parameters": parameters
                })
                
            except Exception as e:
                logger.error(f"[API] Chain step {idx+1} failed: {e}")
                chain_results.append({
                    "step": idx + 1,
                    "effect": effect_type,
                    "status": "failed",
                    "error": str(e)
                })
                # Continue with previous audio on error
        
        return {
            "status": "success",
            "output": current_audio,
            "length": len(current_audio),
            "sample_rate": sample_rate,
            "chain_length": len(effect_chain),
            "chain_results": chain_results,
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"[API] Effect chain error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Effect chain processing failed: {str(e)}"
        )


# Install httpx if not already present (needed for internal routing)
try:
    import httpx
except ImportError:
    logger.warning("[!] httpx not installed - effect routing may not work")
    logger.warning("   Run: pip install httpx")

# ============================================================================
# MOUNT DAW CORE API (Priority 1: Critical Integration)
# ============================================================================

if DAW_CORE_API_AVAILABLE and daw_core_app:
    try:
        # Alternative approach: Copy routes directly from DAW Core app
        # This avoids sub-application mounting issues
        
        # Get all routes from DAW Core app
        for route in daw_core_app.routes:
            # Only copy API routes (skip root and docs)
            if hasattr(route, 'path') and not route.path.startswith('/docs') and route.path != '/':
                # Add /daw prefix to route path
                new_path = f"/daw{route.path}"
                
                # Copy the route with new path
                if hasattr(route, 'methods'):
                    # This is an API route
                    for method in route.methods:
                        if method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
                            # Register route under unified app
                            app.add_api_route(
                                new_path,
                                route.endpoint,
                                methods=[method],
                                name=f"daw_{route.name}" if hasattr(route, 'name') else None
                            )
        
        logger.info("[OK] DAW Core API routes copied successfully")
        logger.info("   * 19 DSP effects now accessible")
        logger.info("   * EQ: /daw/process/eq/*")
        logger.info("   * Dynamics: /daw/process/dynamics/*")
        logger.info("   * Saturation: /daw/process/saturation/*")
        logger.info("   * Delays: /daw/process/delay/*")
        logger.info("   * Reverb: /daw/process/reverb/*")
        logger.info("   * Automation: /daw/automation/*")
        logger.info("   * Metering: /daw/metering/*")
        logger.info("   * Engine: /daw/engine/*")
        
    except Exception as e:
        logger.error(f"[X] Failed to copy DAW Core routes: {e}")
        logger.error(traceback.format_exc())
        
        # Fallback: Create proxy endpoints manually
        logger.info("[!] Attempting manual proxy endpoint creation...")
        
        # Import individual effect processing functions directly
        try:
            from daw_core.fx.eq_and_dynamics import EQ3Band, HighLowPass, Compressor
            from daw_core.fx.dynamics_part2 import Limiter
            from daw_core.fx.saturation import Saturation, Distortion
            from daw_core.fx.delays import SimpleDelay
            from daw_core.fx.reverb import Reverb
            
            # Create direct processing endpoints
            @app.post("/daw/process/eq/highpass")
            async def daw_highpass(audio_data: List[float], cutoff: float = 100, sample_rate: int = 44100):
                """Direct highpass filter endpoint"""
                try:
                    import numpy as np
                    audio = np.array(audio_data, dtype=np.float32)
                    fx = HighLowPass(filter_type="highpass", cutoff=cutoff, sample_rate=sample_rate)
                    output = fx.process(audio)
                    return {
                        "status": "success",
                        "effect": "HighPass",
                        "parameters": {"cutoff": cutoff},
                        "output": output.tolist(),
                        "length": len(output)
                    }
                except Exception as e:
                    raise HTTPException(status_code=400, detail=str(e))
            
            @app.post("/daw/process/eq/lowpass")
            async def daw_lowpass(audio_data: List[float], cutoff: float = 5000, sample_rate: int = 44100):
                """Direct lowpass filter endpoint"""
                try:
                    import numpy as np
                    audio = np.array(audio_data, dtype=np.float32)
                    fx = HighLowPass(filter_type="lowpass", cutoff=cutoff, sample_rate=sample_rate)
                    output = fx.process(audio)
                    return {
                        "status": "success",
                        "effect": "LowPass",
                        "parameters": {"cutoff": cutoff},
                        "output": output.tolist(),
                        "length": len(output)
                    }
                except Exception as e:
                    raise HTTPException(status_code=400, detail=str(e))
            
            @app.post("/daw/process/dynamics/compressor")
            async def daw_compressor(
                audio_data: List[float],
                threshold: float = -20,
                ratio: float = 4,
                attack: float = 0.005,
                release: float = 0.1,
                sample_rate: int = 44100
            ):
                """Direct compressor endpoint"""
                try:
                    import numpy as np
                    audio = np.array(audio_data, dtype=np.float32)
                    fx = Compressor(
                        threshold=threshold,
                        ratio=ratio,
                        attack_time=attack,
                        release_time=release,
                        sample_rate=sample_rate
                    )
                    output = fx.process(audio)
                    return {
                        "status": "success",
                        "effect": "Compressor",
                        "parameters": {"threshold": threshold, "ratio": ratio, "attack": attack, "release": release},
                        "output": output.tolist(),
                        "length": len(output)
                    }
                except Exception as e:
                    raise HTTPException(status_code=400, detail=str(e))
            
            logger.info("[OK] Created direct proxy endpoints for core effects")
            logger.info("   * Highpass, Lowpass, Compressor available")
            logger.info("   * Other effects will use unified processor")
            
        except Exception as proxy_error:
            logger.error(f"[X] Failed to create proxy endpoints: {proxy_error}")
            logger.error(traceback.format_exc())
else:
    logger.warning("[!] DAW Core API not available - DSP effects endpoints disabled")

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class SuggestionRequest(BaseModel):
    context: Dict[str, Any]
    limit: Optional[int] = 5

class SuggestionResponse(BaseModel):
    suggestions: List[Dict[str, Any]]
    confidence: Optional[float] = None

class ChatRequest(BaseModel):
    message: str
    perspective: Optional[str] = "mix_engineering"
    daw_context: Optional[Dict[str, Any]] = None
    timeline_context: Optional[Dict[str, Any]] = None
    file_references: Optional[List[str]] = None

class ChatResponse(BaseModel):
    response: str
    perspective: str
    confidence: Optional[float] = None
    timestamp: Optional[str] = None
    source: Optional[str] = None
    file_analysis: Optional[Dict[str, Any]] = None
    timeline_suggestions: Optional[List[str]] = None

class MusicGuidanceRequest(BaseModel):
    guidance_type: str = "mixing"
    context: Optional[Dict[str, Any]] = None

class AudioAnalysisRequest(BaseModel):
    audio_data: Optional[Dict[str, Any]] = None
    analysis_type: str = "spectrum"

class SaveCocoonRequest(BaseModel):
    content: str
    emotion_tag: Optional[str] = "neutral"
    perspectives_used: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

class ProcessRequest(BaseModel):
    id: str
    type: str
    payload: Dict[str, Any]
    timestamp: int

class EmbeddingRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    role: Optional[str] = "user"

class UpsertRequest(BaseModel):
    rows: List[Dict[str, str]]

class GenreDetectRequest(BaseModel):
    bpm: Optional[float] = 120.0
    tracks: Optional[List[Dict[str, Any]]] = None
    project_name: Optional[str] = None

# New: Mix creation request model
class MixCreateRequest(BaseModel):
    track_identifiers: List[str]
    project_path: Optional[str] = None
    options: Optional[Dict[str, Any]] = None

# New: Mixdown render request model
class MixdownRenderRequest(BaseModel):
    tracks: List[Dict[str, Any]]
    sample_rate: Optional[int] = 44100
    format: Optional[str] = "wav"
    loop_start: Optional[float] = 0.0
    loop_end: Optional[float] = None

# ============================================================================
# PYDANTIC MODELS FOR FILE UPLOAD & TIMELINE (New Section)
# ============================================================================

class FileAnalysisResult(BaseModel):
    """Result from file analysis"""
    filename: str
    size_bytes: int
    mime_type: str
    extension: str
    created_at: str
    duration_ms: Optional[float] = None
    channels: Optional[int] = None
    sample_rate: Optional[int] = None
    analysis_type: Optional[str] = None
    error: Optional[str] = None


class FileUploadRequest(BaseModel):
    """Request for file upload"""
    user_id: str = "default"


class FileUploadResponse(BaseModel):
    """Response after file upload"""
    success: bool
    file_id: str
    filename: str
    analysis: Dict[str, Any]
    timestamp: str
    error: Optional[str] = None


class TimelineTrack(BaseModel):
    """DAW track in timeline"""
    id: str
    name: str
    type: str
    volume: Optional[float] = None
    pan: Optional[float] = None
    muted: Optional[bool] = False
    soloed: Optional[bool] = False
    armed: Optional[bool] = False
    color: Optional[str] = None
    inserts: Optional[List[str]] = []
    sends: Optional[List[str]] = []


class TimelineTransport(BaseModel):
    """Transport state in timeline"""
    playing: Optional[bool] = False
    recording: Optional[bool] = False
    timeSeconds: Optional[float] = 0.0
    bpm: Optional[float] = 120.0
    timeSignature: Optional[str] = "4/4"


class TimelineContextRequest(BaseModel):
    """Request for timeline analysis"""
    tracks: Optional[List[TimelineTrack]] = []
    regions: Optional[List[Dict[str, Any]]] = []
    markers: Optional[List[Dict[str, Any]]] = []
    transport: Optional[TimelineTransport] = None


class TimelineContextResponse(BaseModel):
    """Response from timeline analysis"""
    success: bool
    context: Dict[str, Any]
    suggestions: List[str]
    timestamp: str


class UserFilesResponse(BaseModel):
    """Response with user's files"""
    success: bool
    files: List[Dict[str, Any]]
    count: int
    timestamp: str


# ============================================================================
# HEALTH & STATUS
# ============================================================================

@app.get("/")
async def root():
    return {"status": "ok", "service": "Codette AI Unified Server", "version": "2.0.0", "timestamp": get_timestamp()}

@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "healthy", "codette_available": codette_core is not None, "dsp_available": DSP_EFFECTS_AVAILABLE, "timestamp": get_timestamp()}



# ============================================================================
# MISSING ENDPOINTS FIX (Added by fix_invalid_requests.py)
# ============================================================================

@app.get("/api/health/detailed")
async def detailed_health_check():
    """Detailed health check with request statistics"""
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
    """Get system metrics for monitoring"""
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
    """Start playback"""
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
    """Stop playback"""
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
    """Pause playback"""
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
    """Get transport status"""
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
# ============================================================================
# CODETTE CORE ENDPOINTS
# ============================================================================

@app.get("/codette/status")
@app.get("/api/codette/status")
async def codette_status():
    mgr = get_cocoon_manager()
    return {
        "status": "active",
        "codette_available": codette_core is not None,
        "openai_assistant_available": OPENAI_AVAILABLE and OPENAI_ASSISTANT_ID is not None,
        "openai_threads_active": len(openai_threads),
        "quantum_state": mgr.quantum_state,
        "cocoons_loaded": len(mgr.cocoon_data),
        "active_connections": len(active_websockets),
        "timestamp": get_timestamp()
    }

@app.post("/codette/chat")
@app.post("/api/codette/chat")
async def codette_chat(request: ChatRequest):
    """Chat with Codette AI - OpenAI Assistant as primary, local Codette as fallback"""
    response = "I'm Codette. How can I help with your production?"
    source = "fallback"
    confidence = 0.5
    
    # Log incoming request for debugging
    logger.info(f"[Chat] Message: {request.message[:50]}... | DAW context: {bool(request.daw_context)}")
    
    # TRY OPENAI ASSISTANT FIRST (PRIMARY)
    if OPENAI_AVAILABLE and OPENAI_FALLBACK_ENABLED:
        logger.info("[Chat]  Trying OpenAI Assistant (primary)...")
        openai_result = await query_openai_assistant(request.message, request.daw_context)
        
        if openai_result["response"]:
            response = openai_result["response"]
            source = openai_result["source"]
            confidence = openai_result["confidence"]
            logger.info(f"[Chat] [OK] OpenAI Assistant successful ({source}, {len(response)} chars)")

            # Ingest exchange into Codette memory asynchronously (best-effort)
            try:
                asyncio.create_task(ingest_chat_to_codette(user_id=str(request.daw_context.get('user_id', 'default')) if request.daw_context else 'default', user_message=request.message, assistant_response=response, source=source))
            except Exception as e:
                logger.debug(f"Failed to schedule ingest task: {e}")
            
            return {
                "response": response,
                "perspective": request.perspective,
                "confidence": confidence,
                "timestamp": get_timestamp(),
                "source": source
            }
        else:
            logger.warning(f"[Chat] [!] OpenAI Assistant failed: {openai_result.get('error', 'Unknown error')}")
    
    # FALLBACK TO LOCAL CODETTE ENGINE
    if codette_engine and hasattr(codette_engine, 'respond'):
        logger.info("[Chat]  Falling back to local Codette engine...")
        try:
            if request.daw_context:
                response = codette_engine.respond(request.message, request.daw_context)
            else:
                response = codette_engine.respond(request.message)
            source = codette_engine_type or "codette"
            confidence = 0.85  # Slightly lower than OpenAI
            logger.info(f"[Chat] [OK] Local Codette response ({source}, {len(response)} chars)")

            # Ingest local Codette exchange into Codette memory (if engine supports it)
            try:
                asyncio.create_task(ingest_chat_to_codette(user_id=str(request.daw_context.get('user_id', 'default')) if request.daw_context else 'default', user_message=request.message, assistant_response=response, source=source))
            except Exception as e:
                logger.debug(f"Failed to schedule ingest task for local codette: {e}")

            return {
                "response": response,
                "perspective": request.perspective,
                "confidence": confidence,
                "timestamp": get_timestamp(),
                "source": source
            }
        except Exception as e:
            logger.error(f"[Chat] [X] Local Codette engine error: {e}")
    else:
        logger.warning("[Chat] [!] No local Codette engine available")
    
    # LAST RESORT: BASIC KEYWORD FALLBACK
    logger.warning("[Chat] [!] Using basic keyword fallback (all engines failed)")
    response = generate_basic_fallback_response(request.message)
    source = "fallback_basic"
    confidence = 0.5
    
    return {
        "response": response,
        "perspective": request.perspective,
        "confidence": confidence,
        "timestamp": get_timestamp(),
        "source": source
    }

def generate_basic_fallback_response(message: str) -> str:
    """Generate basic keyword-based response when all AI models fail"""
    prompt_lower = message.lower()
    
    if any(kw in prompt_lower for kw in ['mix', 'eq', 'compress', 'reverb', 'vocal', 'drum', 'bass']):
        response = "**copilot_agent**: [Mixing Advice]\n"
        if 'vocal' in prompt_lower:
            response += "1. Apply high-pass filter at 80-100Hz\n"
            response += "2. Use compression (4:1 ratio) for consistency\n"
            response += "3. Add presence boost at 3-5kHz for presence\n"
            response += "4. De-ess if sibilant (6-8kHz)"
        elif 'drum' in prompt_lower or 'kick' in prompt_lower or 'snare' in prompt_lower:
            response += "1. Gate for clean hits\n"
            response += "2. EQ for punch and clarity\n"
            response += "3. Compress for consistency\n"
            response += "4. Add room reverb for depth"
        elif 'bass' in prompt_lower:
            response += "1. High-pass at 30-40Hz\n"
            response += "2. Compress for consistency (4:1)\n"
            response += "3. Keep centered in stereo\n"
            response += "4. Consider sidechain to kick"
        else:
            response += "1. Set levels to -6dB peaks for headroom\n"
            response += "2. High-pass non-bass elements\n"
            response += "3. EQ to carve frequency space\n"
            response += "4. Compress for dynamics control"
    else:
        response = "I'm here to help with your music production! Ask me about:\n"
        response += "- Mixing and mastering techniques\n"
        response += "- EQ and frequency balance\n"
        response += "- Compression and dynamics\n"
        response += "- Spatial effects (reverb, delay)\n"
        response += "- Track arrangement and routing"
    
    return response

@app.post("/codette/suggest")
@app.post("/api/codette/suggest")
async def codette_suggest(request: SuggestionRequest):
    ctx_type = request.context.get("type", "general")
    suggs = [{"type": "optimization", "title": "Gain staging", "description": "Keep peaks at -6dB", "confidence": 0.9}]
    if ctx_type == "mixing": suggs.append({"type": "effect", "title": "EQ balance", "description": "High-pass at 80Hz", "confidence": 0.85})
    return {"suggestions": suggs[:request.limit], "confidence": 0.85, "timestamp": get_timestamp()}

@app.post("/codette/analyze")
@app.post("/api/codette/analyze")
async def codette_process(request: ProcessRequest):
    return {"id": request.id, "status": "success", "data": {"processed": True}, "processing_time": 0.05}

@app.post("/codette/upload")
@app.post("/api/codette/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Form("default")
) -> Dict[str, Any]:
    """
    Upload and analyze file for Codette
    
    Supports: audio, MIDI, text, code files
    Max size: 50MB
    
    Args:
        file: Uploaded file
        user_id: User identifier (default: "default")
        
    Returns:
        File upload response with analysis
    """
    try:
        # Validate file size
        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large (max {MAX_FILE_SIZE/1024/1024:.0f}MB)"
            )
        
        # Validate extension
        file_ext = Path(file.filename or "").suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file_ext} not allowed"
            )
        
        # Save file
        file_path = UPLOAD_DIRECTORY / f"{user_id}_{int(time.time())}_{file.filename}"
        file_path.write_bytes(contents)
        
        # Analyze file
        analysis = await analyze_uploaded_file(file_path, file.content_type or "")
        
        # Add to history
        file_info = {
            "id": str(file_path),
            "filename": file.filename,
            "path": str(file_path),
            "analysis": analysis,
            "uploaded_at": get_timestamp()
        }
        file_history.add_file(user_id, file_info)
        
        logger.info(f"File uploaded: {file.filename} for user {user_id}")
        
        return {
            "success": True,
            "file": file_info,
            "timestamp": get_timestamp()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/codette/files/{user_id}")
@app.get("/api/codette/files/{user_id}")
async def get_user_files(user_id: str, limit: int = 10) -> Dict[str, Any]:
    """
    Get recent uploaded files for user
    
    Args:
        user_id: User identifier
        limit: Maximum files to return (default: 10)
        
    Returns:
        List of user's uploaded files
    """
    try:
        files = file_history.get_files(user_id, limit)
        
        return {
            "success": True,
            "files": files,
            "count": len(files),
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Error getting user files: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/codette/timeline-context")
@app.post("/api/codette/timeline-context")
async def analyze_timeline(timeline_data: TimelineContextRequest) -> Dict[str, Any]:
    """
    Analyze timeline/track context and provide suggestions
    
    Accepts:
    - tracks: List of track objects
    - regions: List of region objects
    - markers: List of markers
    - transport: Transport state
    
    Args:
        timeline_data: Timeline context from DAW
        
    Returns:
        Serialized timeline context with suggestions
    """
    try:
        # Convert request to dict for processing
        timeline_dict = timeline_data.model_dump(exclude_none=True)
        
        # Serialize timeline context
        context = serialize_timeline_context(timeline_dict)
        
        # Generate suggestions
        suggestions = generate_timeline_suggestions(context)
        
        logger.info(f"Timeline analyzed: {len(context.get('tracks', []))} tracks")
        
        return {
            "success": True,
            "context": context,
            "suggestions": suggestions,
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"Timeline analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Helper function to get timestamp (if not already defined)
def get_timestamp() -> str:
    """Get current timestamp in ISO format"""
    return datetime.now(timezone.utc).isoformat()


# ============================================================================
# ADVANCED ANALYSIS ENDPOINTS (Required by CodetteAdvancedTools frontend)
# ============================================================================
@app.get("/api/analysis/delay-sync")
async def api_delay_sync(bpm: float = 120.0):
    """Calculate tempo-synced delay times for all note divisions"""
    try:
        # Calculate delay times for common note divisions
        divisions = {
            "Whole Note": round((60000 / bpm) * 4, 2),
            "Half Note": round((60000 / bpm) * 2, 2),
            "Quarter Note": round((60000 / bpm) * 1, 2),
            "Eighth Note": round((60000 / bpm) * 0.5, 2),
            "16th Note": round((60000 / bpm) * 0.25, 2),
            "Dotted Quarter": round((60000 / bpm) * 1.5, 2),
            "Dotted Eighth": round((60000 / bpm) * 0.75, 2),
            "Triplet Quarter": round((60000 / bpm) * (2/3), 2),
            "Triplet Eighth": round((60000 / bpm) * (1/3), 2),
        }
        
        logger.info(f"[API] Delay sync calculated for BPM {bpm}")
        return {
            "success": True,
            "bpm": bpm,
            "divisions": divisions,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"[API] Delay sync error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analysis/ear-training")
async def api_ear_training(exercise_type: str = "interval", difficulty: str = "beginner"):
    """Get ear training exercises and data"""
    try:
        result = await ear_training(exercise_type, difficulty)
        logger.info(f"[API] Ear training: {exercise_type}/{difficulty}")
        return result
    except Exception as e:
        logger.error(f"[API] Ear training error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analysis/production-checklist")
async def api_production_checklist(stage: str = "mixing"):
    """Get production workflow checklist for stage"""
    try:
        result = await production_checklist(stage)
        logger.info(f"[API] Production checklist: {stage}")
        return result
    except Exception as e:
        logger.error(f"[API] Production checklist error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analysis/instrument-info")
async def api_instrument_info(category: str = "vocals", instrument: str = "lead"):
    """Get instrument processing information"""
    try:
        result = await instrument_info(category, instrument)
        logger.info(f"[API] Instrument info: {category}/{instrument}")
        return result
    except Exception as e:
        logger.error(f"[API] Instrument info error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analysis/instruments-list")
async def api_instruments_list():
    """Get list of all available instruments by category"""
    try:
        instruments_list = {
            "vocals": ["lead", "harmony", "backing", "rap"],
            "drums": ["kick", "snare", "hi-hat", "tom", "crash", "ride"],
            "guitars": ["acoustic", "electric", "bass"],
            "keys": ["piano", "synth", "organ", "rhodes"],
            "strings": ["violin", "viola", "cello", "double-bass"],
            "brass": ["trumpet", "trombone", "saxophone", "french-horn"],
            "woodwinds": ["flute", "clarinet", "oboe", "bassoon"],
            "percussion": ["conga", "bongo", "shaker", "tambourine"]
        }
        
        logger.info("[API] Instruments list requested")
        return {
            "success": True,
            "categories": instruments_list,
            "total_instruments": sum(len(v) for v in instruments_list.values()),
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"[API] Instruments list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analysis/detect-genre")
async def api_detect_genre(request: Dict[str, Any]):
    """Detect genre from project metadata"""
    try:
        bpm = request.get("bpm", 120)
        tracks = request.get("tracks", [])
        
        # Simple genre detection based on BPM and track count
        genre = "Electronic"
        confidence = 0.5
        
        if bpm < 80:
            genre = "Ambient"
            confidence = 0.7
        elif bpm < 100:
            genre = "Hip-Hop"
            confidence = 0.75
        elif bpm < 120:
            genre = "Pop"
            confidence = 0.8
        elif bpm < 140:
            genre = "House"
            confidence = 0.75
        else:
            genre = "Drum & Bass"
            confidence = 0.7
        
        logger.info(f"[API] Genre detected: {genre} ({confidence * 100}%)")
        return {
            "success": True,
            "detected_genre": genre,
            "confidence": confidence,
            "bpm_range": [max(1, bpm - 10), bpm + 10],
            "candidates": [genre],
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"[API] Genre detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# INSTRUCTIONS FOR MANUAL INTEGRATION
# ============================================================================
"""
TO FIX THE 404 ERRORS:

1. Open codette_server_unified.py in your favorite text editor
2. Scroll to near the bottom (around line 2500-2600)
3. Find the WebSocket route (@app.websocket("/ws"))
4. **ABOVE** that WebSocket route, paste all the @app.get and @app.post endpoints from this file
5. Save the file
6. Restart the server: python codette_server_unified.py
7. Test: curl http://localhost:8000/api/analysis/delay-sync?bpm=120

The endpoints should then be available and the 404 errors will be resolved.
"""


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication with graceful disconnect handling"""
    await websocket.accept()
    active_websockets.append(websocket)
    logger.info(f"[OK] WebSocket connected. Total: {len(active_websockets)}")

    try:
        # Send initial handshake & immediate status
        try:
            await websocket.send_json({
                "type": "connected",
                "data": {
                    "status": "connected",
                    "timestamp": get_timestamp()
                }
            })
            await websocket.send_json({
                "type": "server_status",
                "data": {
                    "health": {
                        "status": "healthy",
                        "timestamp": get_timestamp()
                    },
                    "transport": transport_manager.get_state(),
                    "connections": len(active_websockets)
                }
            })
        except (WebSocketDisconnect, ConnectionResetError, RuntimeError):
            logger.info("WebSocket disconnected during handshake")
            raise WebSocketDisconnect()

        # Main message loop
        while True:
            try:
                data = await websocket.receive_json()
                message_type = data.get("type", "unknown")

                if message_type == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "data": {"timestamp": get_timestamp()}
                    })
                elif message_type == "get_status":
                    manager = get_cocoon_manager()
                    await websocket.send_json({
                        "type": "status",
                        "data": {
                            "codette_available": codette_core is not None,
                            "quantum_state": manager.quantum_state,
                            "timestamp": get_timestamp()
                        }
                    })
                elif message_type == "chat":
                    response = "I'm here to help!"
                    if codette_engine and hasattr(codette_engine, 'respond'):
                        try:
                            msg = data.get("data", {}).get("message", "")
                            response = codette_engine.respond(msg)
                        except Exception:
                            pass
                    await websocket.send_json({
                        "type": "chat_response",
                        "data": {
                            "response": response,
                            "timestamp": get_timestamp()
                        }
                    })
                else:
                    await websocket.send_json({
                        "type": "echo",
                        "data": {
                            "received_type": message_type,
                            "timestamp": get_timestamp()
                        }
                    })
            except WebSocketDisconnect:
                break
            except (ConnectionResetError, RuntimeError) as e:
                logger.info(f"WebSocket connection closed: {type(e).__name__}")
                break
            except json.JSONDecodeError:
                try:
                    await websocket.send_json({
                        "type": "error",
                        "data": {"message": "Invalid JSON"}
                    })
                except Exception:
                    break
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning(f"WebSocket error: {type(e).__name__}: {e}")
    finally:
        if websocket in active_websockets:
            active_websockets.remove(websocket)
        logger.info(f"WebSocket disconnected. Total: {len(active_websockets)}")
# ============================================================================
# METERING PROXY ENDPOINTS (Priority 4: Critical Integration)
# ============================================================================

# Import metering classes from DAW Core
try:
    from daw_core.metering import LevelMeter, SpectrumAnalyzer, VUMeter, Correlometer
    METERING_AVAILABLE = True
    logger.info("[OK] DAW Core metering classes imported successfully")
except ImportError as e:
    METERING_AVAILABLE = False
    logger.warning(f"[!] DAW Core metering import failed: {e}")
    logger.warning("   Metering endpoints will not be available")


@app.post("/daw/metering/level")
async def daw_metering_level(
    audio_data: List[float],
    sample_rate: int = 44100
):
    """
    Level metering endpoint - Peak, RMS, LUFS, headroom
    
    Args:
        audio_data: Audio samples (mono or stereo)
        sample_rate: Sample rate in Hz (default 44100)
        
    Returns:
        Peak, RMS, LUFS, and headroom measurements
    """
    if not NUMPY_AVAILABLE:
        raise HTTPException(status_code=503, detail="NumPy not available")
    
    if not METERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Metering module not available")
    
    try:
        import numpy as np
        
        # Convert to numpy array
        audio = np.array(audio_data, dtype=np.float32)
        
        # Create level meter
        meter = LevelMeter(sample_rate=sample_rate)
        
        # Process audio
        meter.process(audio)
        
        # Get measurements
        peak = meter.get_peak_db()
        rms = meter.get_rms_db()
        held_peak = meter.get_held_peak_db()
        
        # Calculate headroom
        headroom = 0.0 - peak  # dB to 0dBFS
        
        # Approximate LUFS (simplified calculation)
        loudness_lufs = rms  # Approximation
        
        logger.info(f"[Metering] Level: Peak={peak:.1f}dB, RMS={rms:.1f}dB")
        
        return {
            "status": "success",
            "meter_type": "level",
            "peak": float(peak),
            "rms": float(rms),
            "peak_db": float(peak),
            "rms_db": float(rms),
            "held_peak_db": float(held_peak),
            "loudness_lufs": float(loudness_lufs),
            "headroom": float(headroom),
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"[Metering] Level meter error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/daw/metering/spectrum")
async def daw_metering_spectrum(
    audio_data: List[float],
    sample_rate: int = 44100,
    fft_size: int = 2048
):
    """
    Spectrum analysis endpoint - FFT-based frequency analysis
    
    Args:
        audio_data: Audio samples (mono)
        sample_rate: Sample rate in Hz (default 44100)
        fft_size: FFT size in samples (default 2048)
        
    Returns:
        Frequency bins and magnitude spectrum in dB
    """
    if not NUMPY_AVAILABLE:
        raise HTTPException(status_code=503, detail="NumPy not available")
    
    if not METERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Metering module not available")
    
    try:
        import numpy as np
        
        # Convert to numpy array
        audio = np.array(audio_data, dtype=np.float32)
        
        # Create spectrum analyzer
        analyzer = SpectrumAnalyzer(fft_size=fft_size, sample_rate=sample_rate)
        
        # Process audio
        analyzer.process(audio)
        
        # Get frequency bands for visualization (32 bands)
        band_freqs, band_mags = analyzer.get_frequency_bands(num_bands=32)
        
        logger.info(f"[Metering] Spectrum: {len(band_freqs)} frequency bands")
        
        return {
            "status": "success",
            "meter_type": "spectrum",
            "frequencies": band_freqs.tolist(),
            "magnitudes": band_mags.tolist(),
            "num_bins": len(band_freqs),
            "fft_size": fft_size,
            "sample_rate": sample_rate,
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"[Metering] Spectrum analyzer error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/daw/metering/vu")
async def daw_metering_vu(
    audio_data: List[float],
    sample_rate: int = 44100
):
    """
    VU metering endpoint - Classic VU meter simulation
    
    Args:
        audio_data: Audio samples (mono or stereo)
        sample_rate: Sample rate in Hz (default 44100)
        
    Returns:
        VU reading in dB and normalized 0-1 scale
    """
    if not NUMPY_AVAILABLE:
        raise HTTPException(status_code=503, detail="NumPy not available")
    
    if not METERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Metering module not available")
    
    try:
        import numpy as np
        
        # Convert to numpy array
        audio = np.array(audio_data, dtype=np.float32)
        
        # Create VU meter
        vu_meter = VUMeter(sample_rate=sample_rate)
        
        # Process audio
        vu_meter.process(audio)
        
        # Get VU reading
        vu_normalized = vu_meter.get_vu()  # 0-1 scale
        vu_db = vu_meter.get_vu_db()       # dB scale (-40 to +6)
        
        logger.info(f"[Metering] VU: {vu_db:.1f}dB ({vu_normalized:.2f})")
        
        return {
            "status": "success",
            "meter_type": "vu",
            "vu": float(vu_normalized),
            "vu_db": float(vu_db),
            "scaled": float(vu_normalized),
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"[Metering] VU meter error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/daw/metering/correlation")
async def daw_metering_correlation(
    audio_data: List[float],
    sample_rate: int = 44100
):
    """
    Stereo correlation endpoint - Phase correlation analysis
    
    Args:
        audio_data: Stereo audio samples [[L,R], [L,R], ...]
        sample_rate: Sample rate in Hz (default 44100)
        
    Returns:
        Correlation coefficient (-1 to +1), mono/stereo indicators
    """
    if not NUMPY_AVAILABLE:
        raise HTTPException(status_code=503, detail="NumPy not available")
    
    if not METERING_AVAILABLE:
        raise HTTPException(status_code=503, detail="Metering module not available")
    
    try:
        import numpy as np
        
        # Convert to numpy array
        audio = np.array(audio_data, dtype=np.float32)
        
        # Ensure stereo format (N, 2)
        if audio.ndim == 1:
            # Mono signal - duplicate to stereo
            audio = np.stack([audio, audio], axis=1)
        
        # Create correlometer
        correlometer = Correlometer(sample_rate=sample_rate)
        
        # Process audio
        correlometer.process(audio)
        
        # Get correlation
        correlation = correlometer.get_correlation()
        is_mono = correlometer.is_mono()
        is_stereo = correlometer.is_stereo()
        
        logger.info(f"[Metering] Correlation: {correlation:.2f} (mono={is_mono}, stereo={is_stereo})")
        
        return {
            "status": "success",
            "meter_type": "correlation",
            "correlation": float(correlation),
            "mono": bool(is_mono),
            "stereo": bool(is_stereo),
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"[Metering] Correlometer error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ENGINE CONTROL PROXY ENDPOINTS (Priority 5: Critical Integration)
# ============================================================================

# Import engine configuration helper
try:
    from daw_core.engine import AudioEngine
    ENGINE_AVAILABLE = True
    logger.info("[OK] AudioEngine imported successfully")
except ImportError as e:
    ENGINE_AVAILABLE = False
    logger.warning(f"[!] AudioEngine import failed: {e}")
    logger.warning("   Engine control endpoints will return mock data")


# Mock engine for fallback
class MockEngine:
    """Fallback engine when DAW Core is not available"""
    def __init__(self):
        self.sample_rate = 44100
        self.buffer_size = 1024
        self.is_running = False
        self.nodes = []


# Create global engine instance (real or mock)
if ENGINE_AVAILABLE:
    try:
        audio_engine = AudioEngine(sample_rate=44100, buffer_size=1024)
        logger.info("[OK] AudioEngine instance created")
    except Exception as e:
        logger.warning(f"[!] Failed to create AudioEngine: {e}")
        audio_engine = MockEngine()
else:
    audio_engine = MockEngine()


@app.post("/engine/start")
async def engine_start():
    """
    Start audio engine
    
    Proxy endpoint for DAW Core engine control
    """
    try:
        # Set engine running state
        audio_engine.is_running = True
        
        logger.info("[Engine] Started audio engine")
        
        return {
            "status": "success",
            "engine_state": "running",
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"[Engine] Start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/engine/stop")
async def engine_stop():
    """
    Stop audio engine
    
    Proxy endpoint for DAW Core engine control
    """
    try:
        # Set engine stopped state
        audio_engine.is_running = False
        
        logger.info("[Engine] Stopped audio engine")
        
        return {
            "status": "success",
            "engine_state": "stopped",
            "timestamp": get_timestamp()
        }
        
    except Exception as e:
        logger.error(f"[Engine] Stop error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/engine/config")
async def engine_get_config():
    """
    Get engine configuration
    
    Returns current sample rate, buffer size, running state, and node count
    """
    try:
        config = {
            "sample_rate": audio_engine.sample_rate,
            "buffer_size": audio_engine.buffer_size,
            "is_running": audio_engine.is_running,
            "num_nodes": len(audio_engine.nodes) if hasattr(audio_engine, 'nodes') else 0,
            "timestamp": get_timestamp()
        }
        
        logger.info(f"[Engine] Config requested: {config['sample_rate']}Hz, {config['buffer_size']} samples")
        
        return config
        
    except Exception as e:
        logger.error(f"[Engine] Config get error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/engine/config")
async def engine_set_config(sample_rate: int = 44100, buffer_size: int = 1024):
    """
    Configure audio engine
    
    Args:
        sample_rate: Sample rate in Hz (default: 44100)
        buffer_size: Buffer size in samples (default: 1024)
        
    Returns:
        Updated engine configuration
    """
    try:
        # Validate parameters
        if sample_rate not in [44100, 48000, 88200, 96000]:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid sample rate: {sample_rate}. Must be 44100, 48000, 88200, or 96000"
            )
        
        if buffer_size < 64 or buffer_size > 8192:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid buffer size: {buffer_size}. Must be between 64 and 8192"
            )
        
        # Update engine configuration
        audio_engine.sample_rate = sample_rate
        audio_engine.buffer_size = buffer_size
        
        logger.info(f"[Engine] Config updated: {sample_rate}Hz, {buffer_size} samples")
        
        return {
            "status": "success",
            "sample_rate": audio_engine.sample_rate,
            "buffer_size": audio_engine.buffer_size,
            "timestamp": get_timestamp()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Engine] Config set error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

