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

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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
        logger.info("✅ OpenAI client initialized (fallback enabled)")
        logger.info(f"   • Primary model: {OPENAI_FALLBACK_MODEL_PRIMARY[:60]}...")
        logger.info(f"   • Secondary model: {OPENAI_FALLBACK_MODEL_SECONDARY[:60]}...")
        logger.info(f"   • Assistant ID: {OPENAI_ASSISTANT_ID}")
    except ImportError:
        logger.warning("⚠️ OpenAI library not installed. Run: pip install openai")
    except Exception as e:
        logger.warning(f"⚠️ OpenAI client initialization failed: {e}")
else:
    if not OPENAI_API_KEY:
        logger.info("ℹ️  OpenAI fallback disabled: No API key provided")
    else:
        logger.info("ℹ️  OpenAI fallback disabled in configuration")

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
    logger.info("✅ DSP effects library loaded")
except ImportError as e:
    logger.warning(f"⚠️ DSP effects not available: {e}")

# Try to import Intelligent Mixing Suggestions
INTELLIGENT_MIXING_AVAILABLE = False
try:
    from intelligent_mixing import IntelligentMixingSuggestionGenerator
    INTELLIGENT_MIXING_AVAILABLE = True
    logger.info("✅ Intelligent Mixing Suggestions loaded")
except ImportError as e:
    logger.warning(f"⚠️ Intelligent Mixing not available: {e}")

# ============================================================================
# CODETTE IMPORT
# ============================================================================

# Add Codette directory to path
codette_path = Path(__file__).parent / "Codette"
if codette_path.exists():
    sys.path.insert(0, str(codette_path))
    logger.info(f"✅ Added Codette path: {codette_path}")
else:
    logger.error("❌ Codette directory not found")

# Import Codette capabilities (Quantum Consciousness)
CODETTE_CAPABILITIES_AVAILABLE = False
quantum_consciousness = None
try:
    from src.codette_capabilities import QuantumConsciousness
    CODETTE_CAPABILITIES_AVAILABLE = True
    logger.info("✅ Codette capabilities module loaded")
except ImportError as e:
    logger.info(f"ℹ️  Codette capabilities not available: {e}")

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
        logger.info("✅ Codette ENHANCED module (codette_enhanced.py) loaded - 9 perspectives")
    except Exception as e:
        logger.info(f"ℹ️  Enhanced Codette not available: {e}")
else:
    logger.info("ℹ️  Enhanced Codette not available: NumPy missing _core or not installed")

# Fallback to standard codette_new if enhanced engine was not loaded
if not CODETTE_CORE_AVAILABLE:
    try:
        from codette_new import Codette as CodetteCore
        CODETTE_CORE_AVAILABLE = True
        logger.info("✅ Codette core module (codette_new.py) loaded successfully")
    except ImportError as e2:
        logger.error(f"❌ Failed to import any Codette: {e2}")

# Import Codette Hybrid (combines advanced features)
CODETTE_HYBRID_AVAILABLE = False
CodetteHybrid = None
try:
    from codette_hybrid import CodetteHybrid
    CODETTE_HYBRID_AVAILABLE = True
    logger.info("✅ Codette Hybrid module loaded")
except ImportError as e:
    logger.info(f"ℹ️  Codette Hybrid not available: {e}")

# Initialize Quantum Consciousness
if CODETTE_CAPABILITIES_AVAILABLE:
    try:
        quantum_consciousness = QuantumConsciousness()
        logger.info("✅ Quantum Consciousness System initialized")
    except Exception as e:
        logger.warning(f"⚠️ Could not initialize Quantum Consciousness: {e}")

# Initialize Codette instance
if CODETTE_CORE_AVAILABLE:
    try:
        if CODETTE_ENHANCED:
            codette_core = CodetteEnhanced(user_name="CoreLogicStudio")
            logger.info("✅ Codette ENHANCED initialized successfully")
        else:
            codette_core = CodetteCore(user_name="CoreLogicStudio")
            logger.info("✅ Codette initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Codette: {e}")
        codette_core = None

# Initialize Codette Hybrid (preferred engine if available)
codette_hybrid = None
if CODETTE_HYBRID_AVAILABLE and CodetteHybrid:
    try:
        codette_hybrid = CodetteHybrid(user_name="CoreLogicStudio", use_ml_features=True)
        logger.info("✅ Codette Hybrid System initialized (ML mode)")
        logger.info("   • Defense modifiers: Active")
        logger.info("   • Vector search: Active")
        logger.info("   • Prompt engineering: Active")
        logger.info("   • Creative sentence generation: Active")
        logger.info("   • ML features: Enabled")
    except Exception as e:
        logger.warning(f"⚠️ Could not initialize Codette Hybrid: {e}")

# Set the active engine (prefer hybrid > enhanced > core)
if codette_hybrid:
    codette_engine = codette_hybrid
    codette_engine_type = "CodetteHybrid"
    logger.info(f"✅ Codette engine set from codette_hybrid (type: {codette_engine_type})")
elif codette_core:
    codette_engine = codette_core
    codette_engine_type = "CodetteEnhanced" if CODETTE_ENHANCED else "CodetteCore"
    logger.info(f"✅ Codette engine set from codette_core (type: {codette_engine_type})")
else:
    codette_engine = None
    codette_engine_type = None
    logger.warning("⚠️ No Codette engine available - running in fallback mode")

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
                    "description": "Calculate precise tempo-synced delay times in milliseconds for rhythmic effects. Supports all standard note divisions including dotted and triplet values.",
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
        
        logger.info(f"[OpenAI Assistant] ✅ Success ({len(response_text)} chars)")
        
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
        request = GenreDetectRequest(
            bpm=args.get("bpm", 120.0),
            tracks=args.get("tracks", []),
            project_name=args.get("project_name", "")
        )
        
        # Call existing genre detection logic
        response = await detect_genre(request)
        
        # Return JSON-serializable result
        return {
            "success": response.get("success", True),
            "genre": response.get("genre", "Unknown"),
            "genre_id": response.get("genre_id", "unknown"),
            "confidence": response.get("confidence", 0.0),
            "bpm_range": response.get("bpm_range", [80, 160]),
            "characteristics": response.get("characteristics", []),
            "candidates": response.get("candidates", [])[:3],  # Top 3
            "input": response.get("input", {})
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
            "formula": f"(60000 / {bpm}) × {beat_value} = {delay_ms:.2f}ms",
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
    logger.info("🚀 CODETTE AI UNIFIED SERVER - STARTUP")
    logger.info("======================================================================")
    logger.info("📡 Server Configuration:")
    logger.info("   • Version: 2.0.0")
    logger.info("   • Host: 0.0.0.0 (all interfaces)")
    logger.info(f"   • Port: {os.environ.get('PORT', 8000)}")
    logger.info("   • CORS: Enabled for 4 origins")
    logger.info("")
    
    # Codette AI Engine status
    logger.info("🤖 Codette AI Engine:")
    if codette_engine:
        logger.info("   ✅ Status: ACTIVE")
        logger.info(f"   • Engine: {codette_engine_type}")
        if codette_engine_type == "CodetteHybrid":
            logger.info("   • Mode: Hybrid (Defense + Vector + Prompt Engineering)")
        elif codette_engine_type == "CodetteEnhanced":
            logger.info("   • Perspectives: Neural, Logical, Creative, Ethical, Quantum, + 4 more")
        else:
            logger.info("   • Perspectives: Neural, Logical, Creative, Ethical, Quantum")
        logger.info("   • User: CoreLogicStudio")
        logger.info("   • Mode: Production-ready")
        logger.info("   • Method: respond() - returns multi-perspective analysis")
    else:
        logger.info("   ⚠️  Status: FALLBACK MODE")
        logger.info("   • Engine: Keyword-based responder")
        logger.info("   • Functionality: Limited to basic responses")
        logger.info("   • Recommendation: Install Codette package")
    
    # OpenAI Fallback status
    logger.info("")
    logger.info("🔄 OpenAI Fallback:")
    if OPENAI_AVAILABLE and OPENAI_FALLBACK_ENABLED:
        logger.info("   ✅ Status: ENABLED")
        
        # Assistant API status
        if OPENAI_ASSISTANT_ID:
            logger.info(f"   🤖 Assistant API: AVAILABLE")
            logger.info(f"      • Assistant ID: {OPENAI_ASSISTANT_ID}")
            logger.info(f"      • Version: {os.getenv('OPENAI_ASSISTANT_VERSION', 'v2')}")
            logger.info(f"      • Thread Management: Enabled")
            logger.info(f"      • Priority: Highest (tried first)")
            logger.info("")
        
        # Chat models status
        logger.info(f"   📋 Chat Models:")
        logger.info(f"      • Primary: {OPENAI_FALLBACK_MODEL_PRIMARY[:50]}...")
        logger.info(f"      • Secondary: {OPENAI_FALLBACK_MODEL_SECONDARY[:50]}...")
        logger.info(f"      • Base: gpt-4o-mini")
        logger.info("")
        
        # Fallback chain
        if OPENAI_ASSISTANT_ID:
            logger.info("   🔄 Response Priority Chain:")
            logger.info("      1. ⭐ OpenAI Assistant API (PRIMARY - Highest quality)")
            logger.info("      2. Local Codette (Fallback)")
            logger.info("      3. Keyword Fallback (Last resort)")
        else:
            logger.info("   🔄 Response Priority Chain:")
            logger.info("      1. ⭐ Fine-tuned Primary Model (PRIMARY)")
            logger.info("      2. Fine-tuned Secondary Model")
            logger.info("      3. Base Model (gpt-4o-mini)")
            logger.info("      4. Local Codette (Fallback)")
            logger.info("      5. Keyword Fallback (Last resort)")
    elif OPENAI_FALLBACK_ENABLED and not OPENAI_API_KEY:
        logger.info("   ⚠️  Status: DISABLED (No API Key)")
        logger.info("   • Add OPENAI_API_KEY to .env to enable")
    elif not OPENAI_FALLBACK_ENABLED:
        logger.info("   ℹ️  Status: DISABLED (Configuration)")
        logger.info("   • Set OPENAI_FALLBACK_ENABLED=true to enable")
    else:
        logger.info("   ❌ Status: NOT AVAILABLE")
        logger.info("   • OpenAI library not installed")
        logger.info("   • Run: pip install openai")
    logger.info("")
    
    # Database status
    logger.info("💾 Database:")
    if SUPABASE_AVAILABLE:
        logger.info("   ✅ Supabase: CONNECTED")
        logger.info(f"   • URL: {os.getenv('VITE_SUPABASE_URL', 'N/A')[:40]}...")
        logger.info("   • Key Type: Service Role (full access) 🔐")
    else:
        logger.info("   ⚠️  Supabase: NOT CONNECTED")
        logger.info("   • Running in local mode")
    logger.info("")
    
    # Dependencies status
    logger.info("📦 Dependencies:")
    deps = []
    deps.append("NumPy ✅" if NUMPY_AVAILABLE else "NumPy ❌")
    deps.append("Supabase ✅" if SUPABASE_AVAILABLE else "Supabase ❌")
    deps.append("OpenAI ✅" if OPENAI_AVAILABLE else "OpenAI ❌")
    deps.append("Mixing AI ✅" if INTELLIGENT_MIXING_AVAILABLE else "Mixing AI ❌")
    logger.info("   • " + " | ".join(deps))
    
    # Training data availability
    logger.info("📚 Training Data:")
    if TRAINING_AVAILABLE:
        logger.info("   ✅ Available")
        logger.info("   • Method: get_training_context()")
    else:
        logger.info("   ❌ Not available")
    
    # Quantum Consciousness status
    logger.info("🌌 Quantum Consciousness:")
    if CODETTE_CAPABILITIES_AVAILABLE and quantum_consciousness:
        logger.info("   ✅ Initialized")
    else:
        logger.info("   ❌ Not initialized or available")
    
    # Transport manager status
    logger.info("🚀 Transport Manager:")
    logger.info(f"   • Playing: {transport_manager.playing}")
    logger.info(f"   • Time: {transport_manager.time_seconds:.2f}s")
    logger.info(f"   • BPM: {transport_manager.bpm}")
    logger.info(f"   • Sample Rate: {transport_manager.sample_rate}")
    logger.info(f"   • Loop: {transport_manager.loop_enabled} ({transport_manager.loop_start:.2f}s to {transport_manager.loop_end:.2f}s)")
    
    logger.info("")
    logger.info("======================================================================")
    logger.info("✅ CODETTE AI UNIFIED SERVER IS READY")
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

logger.info("✅ FastAPI app configured")

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

class ChatResponse(BaseModel):
    response: str
    perspective: str
    confidence: Optional[float] = None
    timestamp: Optional[str] = None
    source: Optional[str] = None

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

class EffectProcessRequest(BaseModel):
    effect_type: str
    parameters: Dict[str, float]
    audio_data: List[float]
    sample_rate: Optional[int] = 44100

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
        logger.info("[Chat] 🎯 Trying OpenAI Assistant (primary)...")
        openai_result = await query_openai_assistant(request.message, request.daw_context)
        
        if openai_result["response"]:
            response = openai_result["response"]
            source = openai_result["source"]
            confidence = openai_result["confidence"]
            logger.info(f"[Chat] ✅ OpenAI Assistant successful ({source}, {len(response)} chars)")

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
            logger.warning(f"[Chat] ⚠️ OpenAI Assistant failed: {openai_result.get('error', 'Unknown error')}")
    
    # FALLBACK TO LOCAL CODETTE ENGINE
    if codette_engine and hasattr(codette_engine, 'respond'):
        logger.info("[Chat] 🔄 Falling back to local Codette engine...")
        try:
            if request.daw_context:
                response = codette_engine.respond(request.message, request.daw_context)
            else:
                response = codette_engine.respond(request.message)
            source = codette_engine_type or "codette"
            confidence = 0.85  # Slightly lower than OpenAI
            logger.info(f"[Chat] ✅ Local Codette response ({source}, {len(response)} chars)")

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
            logger.error(f"[Chat] ❌ Local Codette engine error: {e}")
    else:
        logger.warning("[Chat] ⚠️ No local Codette engine available")
    
    # LAST RESORT: BASIC KEYWORD FALLBACK
    logger.warning("[Chat] ⚠️ Using basic keyword fallback (all engines failed)")
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
            response += "3. Add presence boost at 3-5kHz\n"
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

# ============================================================================
# INTELLIGENT MIXING SUGGESTIONS ENDPOINT
# ============================================================================

class MixingSuggestionsRequest(BaseModel):
    track_type: str
    audio_data: Optional[List[float]] = None
    sample_rate: Optional[int] = 44100
    track_info: Dict[str, Any]
    context: Dict[str, Any]

@app.post("/codette/mixing-suggestions")
@app.post("/api/codette/mixing-suggestions")
async def get_mixing_suggestions(request: MixingSuggestionsRequest):
    """
    Generate intelligent mixing suggestions based on track type, audio data, and context
    
    This endpoint uses AI-powered audio analysis to provide:
    - EQ recommendations based on frequency analysis
    - Compression settings based on dynamics analysis
    - Track-specific mixing guidance
    - Context-aware suggestions based on genre and BPM
    """
    if not INTELLIGENT_MIXING_AVAILABLE:
        return {
            "success": False,
            "error": "Intelligent mixing module not available",
            "timestamp": get_timestamp()
        }
    
    try:
        result = await execute_mixing_suggestions({
            "track_type": request.track_type,
            "audio_data": request.audio_data,
            "sample_rate": request.sample_rate,
            "track_info": request.track_info,
            "context": request.context
        })
        
        return {
            "success": True,
            "data": result,
            "timestamp": get_timestamp()
        }
    except Exception as e:
        logger.error(f"[Mixing Suggestions] Error: {e}")
        return {
            "success": False,
            "error": str(e),
            "timestamp": get_timestamp()
        }

# ============================================================================
# TRAINING ENDPOINTS
# ============================================================================

@app.get("/api/training/context")
async def training_context():
    if TRAINING_AVAILABLE and get_training_context:
        return {"success": True, "data": get_training_context(), "timestamp": get_timestamp()}
    return {"success": False, "data": None, "message": "Training data not available"}

@app.get("/api/training/health")
async def training_health():
    return {"success": True, "training_available": TRAINING_AVAILABLE, "timestamp": get_timestamp()}

# ============================================================================
# EMBEDDINGS ENDPOINTS
# ============================================================================

@app.post("/codette/embeddings/store")
async def store_embedding(request: EmbeddingRequest):
    return {"success": True, "message_id": f"msg_{int(time.time())}", "timestamp": get_timestamp()}

@app.post("/codette/embeddings/search")
async def search_embeddings(request: EmbeddingRequest):
    return {"success": True, "similar_messages": [], "timestamp": get_timestamp()}

@app.get("/codette/embeddings/stats")
async def embedding_stats():
    return {"total_embeddings": 0, "model": "text-embedding-3-small", "timestamp": get_timestamp()}

@app.post("/api/upsert-embeddings")
async def upsert_embeddings(request: UpsertRequest):
    return {"success": True, "processed": len(request.rows), "updated": len(request.rows), "message": "Embeddings upserted"}

# ============================================================================
# CACHE ENDPOINTS
# ============================================================================

@app.get("/codette/cache/stats")
async def cache_stats():
    return {"total_entries": 0, "memory_usage_mb": 0, "hit_rate": 0, "miss_rate": 0, "eviction_rate": 0}

@app.get("/codette/cache/metrics")
async def cache_metrics():
    return {"stats": {"total_entries": 0}, "top_keys": [], "backend": "memory", "response_times": {}}

@app.get("/codette/cache/status")
async def cache_status():
    return {"backend": "memory", "connected": True}

@app.post("/codette/cache/clear")
async def cache_clear():
    return {"success": True, "message": "Cache cleared"}

# ============================================================================
# ANALYTICS
# ============================================================================

@app.get("/codette/analytics/dashboard")
async def analytics_dashboard():
    return {"total_queries": 0, "avg_response_time": 0, "popular_topics": [], "timestamp": get_timestamp()}

# ============================================================================
# ANALYSIS ENDPOINTS
# ============================================================================

@app.get("/api/analysis/ear-training")
async def ear_training(exercise_type: str = "interval", difficulty: str = "beginner"):
    """Generate ear training exercises for music production"""
    
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
    
    # Chord exercises / production checklist-like guidance (reused content)
    chords = {
        "beginner": [
            {"category": "Gain Staging", "task": "Set input gain to avoid clipping (peaks -12dB to -6dB)", "priority": "high"},
            {"category": "Mic Technique", "task": "Check proximity effect and sibilance", "priority": "medium"},
            {"category": "Phase", "task": "Verify phase on multi-mic sources", "priority": "high"},
        ],
        "intermediate": [
            {"category": "Frequency Space", "task": "Ensure instruments don't mask each other in 200-500Hz", "priority": "high"},
            {"category": "Rhythm", "task": "Tighten timing; quantize tastefully", "priority": "medium"},
            {"category": "Transitions", "task": "Add fills, risers, impacts for sections", "priority": "low"},
        ],
        "mixing": [
            {"category": "Levels", "task": "Balance faders, vocals forward, kick/bass foundation", "priority": "high"},
            {"category": "EQ", "task": "High-pass non-bass, tame 200-400Hz mud, add 2-5k presence", "priority": "high"},
            {"category": "Compression", "task": "Control dynamics; avoid pumping unless stylistic", "priority": "medium"},
            {"category": "Space", "task": "Use short room + plate/hall; pre-delay for clarity", "priority": "medium"},
            {"category": "Stereo", "task": "Pan for width; keep low-end mono", "priority": "medium"},
            {"category": "Headroom", "task": "Leave -6dBFS peak on master, -14 to -10 LUFS mix", "priority": "high"},
        ],
        "mastering": [
            {"category": "Prep", "task": "Receive mix with -6dB headroom, no limiter on master", "priority": "high"},
            {"category": "Tonal Balance", "task": "Broad EQ for target curve; fix harshness/resonance", "priority": "high"},
            {"category": "Dynamics", "task": "Gentle bus comp (1-2dB GR), multiband if needed", "priority": "medium"},
            {"category": "Loudness", "task": "Limiter to target: streaming ~ -14 LUFS, EDM up to -8 LUFS", "priority": "high"},
            {"category": "Translation", "task": "Check on speakers, headphones, phone, mono", "priority": "high"},
            {"category": "Delivery", "task": "Export 24-bit WAV, embedded metadata, 44.1k/48k as required", "priority": "medium"},
        ],
    }

    # Normalize inputs
    ex_type = (exercise_type or "interval").lower()
    diff = (difficulty or "beginner").lower()

    # Select items based on requested exercise type
    if ex_type == "interval":
        items = intervals.get(diff, intervals.get("beginner", []))[:]
    elif ex_type == "chord":
        items = chords.get(diff, chords.get("beginning", []))[:]
    else:
        # Fallback: provide a mixed checklist-like set
        items = chords.get(diff, chords.get("mixing", []))[:]

    # Mark all as incomplete by default and add ids
    for i, it in enumerate(items):
        # Ensure it's a dictionary
        if not isinstance(it, dict):
            continue
        it["completed"] = False
        it_id_prefix = ex_type if ex_type in ("interval", "chord") else "exercise"
        it["id"] = f"{it_id_prefix}-{i}"

    response_payload = {
        "success": True,
        "stage": ex_type,
        "items": items,
        "completionPercentage": 0,
        "timestamp": get_timestamp(),
    }

    return JSONResponse(content=response_payload, headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    })


@app.get("/api/analysis/frequency-quiz")
async def frequency_quiz(difficulty: str = "beginner"):
    """Generate frequency identification quiz"""
    import random
    
    frequency_bands = [
        {"name": "Sub Bass", "range": "20-60 Hz", "characteristic": "Rumble, felt vibration"},
        {"name": "Bass", "range": "60-250 Hz", "characteristic": "Warmth, punch"},
        {"name": "Low Mids", "range": "250-500 Hz", "characteristic": "Body, potential mud"},
        {"name": "Mids", "range": "500-2k Hz", "characteristic": "Clarity, presence"},
        {"name": "Upper Mids", "range": "2k-4k Hz", "characteristic": "Attack, definition"},
        {"name": "Presence", "range": "4k-6k Hz", "characteristic": "Edge, sibilance"},
        {"name": "Brilliance", "range": "6k-12k Hz", "characteristic": "Sparkle, air"},
        {"name": "Air", "range": "12k-20k Hz", "characteristic": "Shimmer, openness"},
    ]
    
    if difficulty == "beginner":
        quiz_bands = frequency_bands[:4]
    elif difficulty == "intermediate":
        quiz_bands = frequency_bands[:6]
    else:
        quiz_bands = frequency_bands
    
    return {
        "success": True,
        "difficulty": difficulty,
        "quiz_items": quiz_bands,
        "instructions": "Listen to the audio and identify which frequency band is being boosted",
        "timestamp": get_timestamp()
    }

@app.post("/api/analysis/detect-genre")
async def detect_genre(request: GenreDetectRequest):
    """Detect music genre based on project characteristics (BPM, tracks, instruments)"""
    
    bpm = request.bpm or 120.0
    tracks = request.tracks or []
    project_name = request.project_name or ""
    
    # Genre database with BPM ranges and characteristics
    genre_db = {
        "electronic": {
            "name": "Electronic/EDM",
            "bpm_range": (120, 150),
            "instruments": ["synth", "bass", "drums", "pad", "lead"],
            "characteristics": ["synthesizers", "drum machines", "heavy bass", "build-ups", "drops"]
        },
        "house": {
            "name": "House",
            "bpm_range": (118, 130),
            "instruments": ["synth", "bass", "drums", "vocals"],
            "characteristics": ["four-on-the-floor", "synthesizers", "soulful vocals"]
        },
        "techno": {
            "name": "Techno",
            "bpm_range": (125, 150),
            "instruments": ["synth", "drums", "bass"],
            "characteristics": ["repetitive beats", "industrial sounds", "minimal melodies"]
        },
        "hip-hop": {
            "name": "Hip-Hop/Rap",
            "bpm_range": (80, 115),
            "instruments": ["drums", "bass", "vocals", "sample", "808"],
            "characteristics": ["vocal-dominant", "808 bass", "sample-based", "trap hi-hats"]
        },
        "rock": {
            "name": "Rock",
            "bpm_range": (100, 140),
            "instruments": ["guitar", "bass", "drums", "vocals"],
            "characteristics": ["guitars", "live drums", "bass", "distortion"]
        },
        "pop": {
            "name": "Pop",
            "bpm_range": (100, 130),
            "instruments": ["vocals", "synth", "drums", "bass", "piano"],
            "characteristics": ["catchy melodies", "verse-chorus structure", "polished production"]
        },
        "jazz": {
            "name": "Jazz",
            "bpm_range": (80, 180),
            "instruments": ["piano", "bass", "drums", "horns", "saxophone"],
            "characteristics": ["improvisation", "swing feel", "complex harmonies"]
        },
        "classical": {
            "name": "Classical",
            "bpm_range": (40, 180),
            "instruments": ["strings", "piano", "orchestra", "violin", "cello"],
            "characteristics": ["orchestral", "dynamic range", "acoustic instruments"]
        },
        "ambient": {
            "name": "Ambient",
            "bpm_range": (60, 100),
            "instruments": ["synth", "pad", "texture", "drone"],
            "characteristics": ["atmospheric", "textural", "slow evolution", "minimal rhythm"]
        },
        "metal": {
            "name": "Metal",
            "bpm_range": (100, 200),
            "instruments": ["guitar", "bass", "drums", "vocals"],
            "characteristics": ["heavy distortion", "double bass drums", "aggressive"]
        },
        "r&b": {
            "name": "R&B/Soul",
            "bpm_range": (60, 100),
            "instruments": ["vocals", "bass", "drums", "keys", "synth"],
            "characteristics": ["smooth vocals", "groove-based", "emotional"]
        },
        "country": {
            "name": "Country",
            "bpm_range": (90, 140),
            "instruments": ["guitar", "vocals", "bass", "fiddle", "banjo"],
            "characteristics": ["acoustic guitars", "storytelling", "twangy"]
        },
        "reggae": {
            "name": "Reggae",
            "bpm_range": (60, 90),
            "instruments": ["guitar", "bass", "drums", "keys", "vocals"],
            "characteristics": ["offbeat rhythm", "heavy bass", "laid-back feel"]
        },
        "drum_and_bass": {
            "name": "Drum & Bass",
            "bpm_range": (160, 180),
            "instruments": ["drums", "bass", "synth", "pad"],
            "characteristics": ["fast breakbeats", "heavy sub-bass", "rolling drums"]
        }
    }
    
    scores = {}
    
    # Calculate score for each genre
    for genre_id, genre_info in genre_db.items():
        score = 0.0
        max_score = 100.0
        
        # BPM score (40% weight)
        bpm_min, bpm_max = genre_info["bpm_range"]
        if bpm_min <= bpm <= bpm_max:
            # Perfect match - closer to center = higher score
            center = (bpm_min + bpm_max) / 2
            distance = abs(bpm - center) / ((bpm_max - bpm_min) / 2)
            score += 40 * (1 - distance * 0.5)  # Max 40, min 20 if in range
        else:
            # Outside range - penalize based on distance
            if bpm < bpm_min:
                distance = (bpm_min - bpm) / 20
            else:
                distance = (bpm - bpm_max) / 20
            score += max(0, 20 - distance * 10)  # Some partial credit
        
        # Track/instrument matching (40% weight)
        if tracks:
            track_names = [t.get("name", "").lower() for t in tracks]
            track_types = [t.get("type", "").lower() for t in tracks]
            all_track_info = " ".join(track_names + track_types)
            
            matches = 0
            for instrument in genre_info["instruments"]:
                if instrument.lower() in all_track_info:
                    matches += 1
            
            if genre_info["instruments"]:
                instrument_score = (matches / len(genre_info["instruments"])) * 40
                score += instrument_score
        else:
            # No tracks provided - give neutral score
            score += 20
        
        # Project name hint (20% weight)
        if project_name:
            name_lower = project_name.lower()
            if genre_info["name"].lower() in name_lower or genre_id in name_lower:
                score += 20
            else:
                # Check for characteristic keywords
                for char in genre_info["characteristics"]:
                    if char.lower() in name_lower:
                        score += 5
                        break
        else:
            score += 10  # Neutral
    
    # Sort by score and get top matches
    sorted_genres = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    
    # Build response - handle empty scores case
    if not sorted_genres:
        # Fallback if no scores calculated
        return {
            "success": False,
            "error": "Unable to detect genre",
            "genre": "Unknown",
            "confidence": 0.0,
            "timestamp": get_timestamp()
        }
    
    best_genre_id = sorted_genres[0][0]
    best_score = sorted_genres[0][1]
    best_genre = genre_db[best_genre_id]
    
    # Get top 3 candidates
    candidates = []
    for genre_id, score in sorted_genres[:3]:
        genre = genre_db[genre_id]
        candidates.append({
            "genre": genre["name"],
            "genre_id": genre_id,
            "confidence": round(score / 100, 2),
            "bpm_range": list(genre["bpm_range"]),
            "characteristics": genre["characteristics"]
        })
    
    return {
        "success": True,
        "genre": best_genre["name"],
        "genre_id": best_genre_id,
        "confidence": round(best_score / 100, 2),
        "bpm_range": list(best_genre["bpm_range"]),
        "characteristics": best_genre["characteristics"],
        "candidates": candidates,
        "input": {
            "bpm": bpm,
            "track_count": len(tracks),
            "project_name": project_name
        },
        "timestamp": get_timestamp()
    }

# ============================================================================
# MIX CREATION (Agent-driven) - Create mix from selected tracks
# ============================================================================


@app.post("/api/mixes/create_from_tracks")
@app.post("/codette/mixes/create_from_tracks")
async def create_mix_from_tracks(request: MixCreateRequest):
    """Create new mix variants from provided track buffers.

    This endpoint delegates to the real Codette engine if available. It
    performs safe fallbacks when engine or project data are missing.
    """
    try:
        # Lazy import to avoid hard dependency on real engine at module load
        try:
            from codette_real_engine import get_real_codette_engine
        except Exception:
            get_real_codette_engine = None

        if get_real_codette_engine:
            engine = get_real_codette_engine()
            # Engine method is async - call and return result
            try:
                result = await engine.create_mix_from_tracks(request.track_identifiers, project_path=request.project_path, options=request.options)
                return {"success": True, "data": result, "timestamp": get_timestamp()}
            except Exception as e:
                logger.error(f"Mix creation failed: {e}")
                return {"success": False, "error": str(e), "timestamp": get_timestamp()}

        # Fallback: minimal offline behavior (simulate variants)
        variants = [
            {"id": "fallback_safe", "name": "Safe Blend", "description": "Fallback safe blend", "actions": []},
            {"id": "fallback_creative", "name": "Creative Wash", "description": "Fallback creative variant", "actions": []}
        ]

        return {"success": True, "data": {"mix_id": f"mix_fallback_{int(time.time())}", "variants": variants, "source_tracks": request.track_identifiers}, "timestamp": get_timestamp()}

    except Exception as e:
        logger.error(f"Unexpected error in create_mix_from_tracks: {e}")
        return {"success": False, "error": str(e), "timestamp": get_timestamp()}

# ============================================================================
# CLOUD SYNC (STUBS)
# ============================================================================

@app.post("/api/cloud-sync/save")
async def cloud_sync_save(project_id: str, device_id: str):
    return {"success": True, "project_id": project_id}

@app.get("/api/cloud-sync/load/{project_id}")
async def cloud_sync_load(project_id: str, device_id: str = ""):
    return {"project_id": project_id, "data": {}}

@app.get("/api/cloud-sync/list")
async def cloud_sync_list():
    return []

# ============================================================================
# DEVICE ENDPOINTS (STUBS)
# ============================================================================

@app.post("/api/devices/register")
async def register_device(device_name: str, device_type: str = "desktop", platform: str = "windows"):
    return {"device_id": f"dev_{int(time.time())}"}

@app.get("/api/devices/{user_id}")
async def list_devices(user_id: str):
    return []

@app.post("/api/devices/sync-settings")
async def sync_settings(user_id: str):
    return {"success": True}

# ============================================================================
# COLLABORATION (STUBS)
# ============================================================================

@app.post("/api/collaboration/join")
async def join_collaboration(project_id: str, user_id: str, user_name: str):
    return {"session_id": f"sess_{int(time.time())}", "users": [user_name]}

@app.post("/api/collaboration/operation")
async def collaboration_operation():
    return {"success": True, "version": 1}

@app.get("/api/collaboration/session/{project_id}")
async def get_collaboration_session(project_id: str):
    return {"users": [], "operations": []}

# ============================================================================
# VST ENDPOINTS (STUBS)
# ============================================================================

@app.post("/api/vst/load")
async def load_vst(plugin_path: str, plugin_name: str):
    return {"id": f"vst_{int(time.time())}", "name": plugin_name, "path": plugin_path, "parameters": []}

@app.get("/api/vst/list")
async def list_vst():
    return []

@app.post("/api/vst/parameter")
async def set_vst_parameter(plugin_id: str, parameter_id: str, value: float):
    return {"success": True}

# ============================================================================
# AUDIO I/O (STUBS)
# ============================================================================

@app.get("/api/audio/devices")
async def get_audio_devices():
    return [{"id": "default", "name": "Default Output", "kind": "audiooutput"}]

@app.post("/api/audio/measure-latency")
async def measure_latency():
    return {"latency_ms": 10, "stability": 0.95}

@app.get("/api/audio/settings")
async def get_audio_settings():
    return {"sample_rate": 44100, "buffer_size": 512, "bit_depth": 24}

# ============================================================================
# WEBSOCKET
# ============================================================================

@app.get("/ws/status")
async def websocket_status():
    """Return WebSocket server status for REST polling fallback."""
    return {
        "connected_clients": len(active_websockets),
        "last_broadcast_at": LAST_BROADCAST_AT,
        "transport": transport_manager.get_state(),
        "timestamp": get_timestamp(),
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication with graceful disconnect handling"""
    await websocket.accept()
    active_websockets.append(websocket)
    logger.info(f"✅ WebSocket connected. Total: {len(active_websockets)}")

    try:
        # Send initial handshake & immediate status
        try:
            await websocket.send_json({"type": "connected", "data": {"status": "connected", "timestamp": get_timestamp()}})
            await websocket.send_json({"type": "server_status", "data": {"health": {"status": "healthy", "timestamp": get_timestamp()}, "transport": transport_manager.get_state(), "connections": len(active_websockets)}})
        except (WebSocketDisconnect, ConnectionResetError, RuntimeError):
            # Client disconnected before handshake completed
            logger.info("WebSocket disconnected during handshake")
            raise WebSocketDisconnect()

        # Main message loop
        while True:
            try:
                data = await websocket.receive_json()
                message_type = data.get("type", "unknown")

                if message_type == "ping":
                    await websocket.send_json({"type": "pong", "data": {"timestamp": get_timestamp()}})
                elif message_type == "get_status":
                    manager = get_cocoon_manager()
                    await websocket.send_json({"type": "status", "data": {"codette_available": codette_core is not None, "quantum_state": manager.quantum_state, "timestamp": get_timestamp()}})
                elif message_type == "chat":
                    response = "I'm here to help!"
                    if codette_engine and hasattr(codette_engine, 'respond'):
                        try:
                            response = codette_engine.respond(data.get("data", {}).get("message", ""))
                        except Exception:
                            pass
                    await websocket.send_json({"type": "chat_response", "data": {"response": response, "timestamp": get_timestamp()}})
                else:
                    await websocket.send_json({"type": "echo", "data": {"received_type": message_type, "timestamp": get_timestamp()}})
            except WebSocketDisconnect:
                break
            except (ConnectionResetError, RuntimeError) as e:
                # Connection closed unexpectedly
                logger.info(f"WebSocket connection closed: {type(e).__name__}")
                break
            except json.JSONDecodeError:
                try:
                    await websocket.send_json({"type": "error", "data": {"message": "Invalid JSON"}})
                except:
                    # Can't send error, connection is dead
                    break
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning(f"WebSocket error: {type(e).__name__}: {e}")
    finally:
        # Clean up connection
        if websocket in active_websockets:
            active_websockets.remove(websocket)
        logger.info(f"WebSocket disconnected. Total: {len(active_websockets)}")

# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or use default
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    # Start the server
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        access_log=True
    )