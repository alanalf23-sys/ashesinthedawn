"""
FastAPI + sounddevice Integration Pattern - Best Practices

This module demonstrates the correct way to integrate FastAPI WebSocket transport
with sounddevice audio streams, including:
- Proper state management (dict vs TransportClock)
- Correct asyncio + sounddevice threading
- Error handling for audio callbacks
- Transport state transitions (play → stop → seek)
- WebSocket broadcast during audio playback
"""

import time
import threading
import asyncio
import logging
from typing import Dict

try:
    from fastapi import FastAPI, WebSocket, WebSocketDisconnect
    from fastapi.middleware.cors import CORSMiddleware
except ImportError:
    raise ImportError("FastAPI required: pip install fastapi uvicorn")

try:
    import uvicorn
except ImportError:
    uvicorn = None

try:
    import sounddevice as sd
except ImportError:
    sd = None

logger = logging.getLogger(__name__)


# ============================================================================
# PATTERN 1: Simple Dict-Based State (Your Original Pattern)
# ============================================================================

class SimpleTransportDict:
    """
    Basic transport state using dict.
    Use this for simple applications with single playback engine.
    """

    def __init__(self, sample_rate=48000, block_size=512):
        self.SAMPLE_RATE = sample_rate
        self.BLOCK = block_size

        # State dictionary
        self.state: Dict = {
            "playing": False,
            "sample_pos": 0,
            "start_time": 0.0,
        }

    def play(self):
        """Start playback - called from FastAPI endpoint."""
        if not self.state["playing"]:
            self.state["playing"] = True
            self.state["start_time"] = time.time()
            logger.info("▶️  Playback started")

    def stop(self):
        """Stop playback - called from FastAPI endpoint."""
        if self.state["playing"]:
            self.state["playing"] = False
            logger.info("⏹️  Playback stopped")

    def update_position(self, frames):
        """Update position from audio callback - called on every buffer."""
        if self.state["playing"]:
            self.state["sample_pos"] += frames

    def get_time_seconds(self):
        """Convert sample position to seconds."""
        return self.state["sample_pos"] / self.SAMPLE_RATE


# ============================================================================
# PATTERN 2: FastAPI Endpoints with State Management
# ============================================================================

def create_simple_transport_app(sample_rate=48000, block_size=512):
    """
    Create FastAPI app with transport endpoints using dict state.

    This shows the pattern from your code request, with improvements:
    - Proper error handling
    - State validation
    - Response codes
    - Logging
    """

    app = FastAPI(title="Transport Control with Dict State")

    # CORS for local development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Shared state
    transport = SimpleTransportDict(sample_rate, block_size)

    # Store in app state for access in endpoints
    app.state.transport = transport

    # ========== REST Endpoints with Proper State Management ==========

    @app.post("/transport/play")
    async def play():
        """Start playback."""
        try:
            transport.play()
            return {
                "ok": True,
                "status": "playing",
                "time": transport.get_time_seconds(),
            }
        except Exception as e:
            logger.error(f"Play error: {e}")
            return {"ok": False, "error": str(e)}, 500

    @app.post("/transport/stop")
    async def stop():
        """Stop playback."""
        try:
            transport.stop()
            return {
                "ok": True,
                "status": "stopped",
                "time": transport.get_time_seconds(),
            }
        except Exception as e:
            logger.error(f"Stop error: {e}")
            return {"ok": False, "error": str(e)}, 500

    @app.post("/transport/seek")
    async def seek(seconds: float):
        """Seek to time position."""
        try:
            samples = int(seconds * sample_rate)
            transport.state["sample_pos"] = max(0, samples)

            # Reset playback if playing (prevents clicks)
            if transport.state["playing"]:
                transport.state["start_time"] = time.time()

            logger.info(f"Seek to {seconds}s ({samples} samples)")
            return {
                "ok": True,
                "time": transport.get_time_seconds(),
            }
        except Exception as e:
            logger.error(f"Seek error: {e}")
            return {"ok": False, "error": str(e)}, 500

    @app.get("/transport/status")
    async def get_status():
        """Get current transport state."""
        return {
            "playing": transport.state["playing"],
            "sample_pos": transport.state["sample_pos"],
            "time_seconds": transport.get_time_seconds(),
            "sample_rate": sample_rate,
            "block_size": block_size,
        }

    @app.websocket("/ws/transport")
    async def websocket_transport(ws: WebSocket):
        """WebSocket endpoint for real-time state updates."""
        await ws.accept()
        logger.info("WebSocket client connected")

        try:
            while True:
                # Broadcast state every 33ms (30 Hz)
                await asyncio.sleep(0.033)

                state = {
                    "playing": transport.state["playing"],
                    "sample_pos": transport.state["sample_pos"],
                    "time": transport.get_time_seconds(),
                }

                await ws.send_json(state)

        except WebSocketDisconnect:
            logger.info("WebSocket client disconnected")
        except Exception as e:
            logger.error(f"WebSocket error: {e}")

    @app.get("/")
    async def root():
        """API info."""
        return {
            "name": "Transport Control with Dict State",
            "endpoints": {
                "play": "POST /transport/play",
                "stop": "POST /transport/stop",
                "seek": "POST /transport/seek?seconds=10.5",
                "status": "GET /transport/status",
                "websocket": "WS /ws/transport",
                "docs": "/docs",
            }
        }

    return app, transport


# ============================================================================
# PATTERN 3: Correct sounddevice + FastAPI Integration
# ============================================================================

class IntegratedAudioEngine:
    """
    Demonstrates correct integration of:
    - sounddevice (audio I/O in background thread)
    - FastAPI (WebSocket server in asyncio loop)
    - Shared state (dict or TransportClock)
    """

    def __init__(self, sample_rate=48000, block_size=512):
        self.sample_rate = sample_rate
        self.block_size = block_size

        # State
        self.transport = SimpleTransportDict(sample_rate, block_size)

        # Audio stream (not started yet)
        self.stream = None
        self.is_running = False

    def audio_callback(self, indata, outdata, frames, time_info, status):
        """
        Called by sounddevice for every audio buffer.
        IMPORTANT: Keep this fast! No blocking operations!

        Args:
            indata: Input audio buffer
            outdata: Output audio buffer to fill
            frames: Number of frames in buffer
            time_info: Timing information
            status: Status flags
        """
        if status:
            logger.warning(f"Audio callback status: {status}")

        try:
            # CRITICAL: Update transport position FIRST
            self.transport.update_position(frames)

            # Apply simple passthrough with gain
            # In real app, apply DSP effects here
            outdata[:] = indata * 0.8

        except Exception as e:
            logger.error(f"Audio callback error: {e}")
            outdata.fill(0)  # Output silence on error

    def start_audio(self):
        """Start audio stream."""
        logger.info("Starting audio stream...")

        if sd is None:
            logger.error("sounddevice not installed: pip install sounddevice")
            self.is_running = False
            return

        try:
            self.stream = sd.OutputStream(
                channels=2,
                samplerate=self.sample_rate,
                blocksize=self.block_size,
                callback=self.audio_callback,
                latency='low'
            )
            self.stream.start()
            self.is_running = True
            logger.info(f"✓ Audio started (latency: {self.stream.latency}s)")

        except Exception as e:
            logger.error(f"Failed to start audio: {e}")
            self.is_running = False

    def stop_audio(self):
        """Stop audio stream."""
        if self.stream:
            self.stream.stop()
            self.stream.close()
            self.is_running = False
            logger.info("Audio stopped")


# ============================================================================
# PATTERN 4: Correct Threading Model
# ============================================================================

def run_integrated_server():
    """
    CORRECT way to run FastAPI + sounddevice together.

    Important notes:
    1. sounddevice runs in its own thread (managed by sounddevice)
    2. FastAPI/uvicorn runs in main thread
    3. Shared state protected by GIL in Python
    4. No asyncio.run() needed for sounddevice
    """

    # Create app and engine
    app, transport = create_simple_transport_app(48000, 512)
    engine = IntegratedAudioEngine(48000, 512)

    # Store engine reference
    app.state.engine = engine

    # Start audio stream BEFORE starting FastAPI
    print("\n" + "="*70)
    print("STARTING INTEGRATED AUDIO ENGINE + FASTAPI SERVER")
    print("="*70 + "\n")

    engine.start_audio()

    # Simulate playback commands
    def simulate_playback():
        """Simulate user actions."""
        time.sleep(2)
        print("\n→ Sending PLAY command...")
        engine.transport.play()

        time.sleep(5)
        print("→ Sending SEEK command (10 seconds)...")
        engine.transport.state["sample_pos"] = int(10 * engine.sample_rate)

        time.sleep(3)
        print("→ Sending STOP command...")
        engine.transport.stop()

    # Start simulation in background thread
    sim_thread = threading.Thread(target=simulate_playback, daemon=True)
    sim_thread.start()

    # Print status
    def print_status():
        """Monitor state changes."""
        while engine.is_running:
            state = engine.transport.state
            if state["playing"]:
                print(f"▶️  Time: {state['sample_pos'] / engine.sample_rate:.2f}s", end='\r')
            time.sleep(0.1)

    status_thread = threading.Thread(target=print_status, daemon=True)
    status_thread.start()

    # Run FastAPI server
    if uvicorn:
        print("Starting FastAPI server on http://localhost:8000")
        print("WebSocket: ws://localhost:8000/ws/transport")
        print("API Docs: http://localhost:8000/docs\n")

        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    else:
        print("uvicorn not installed, skipping server")

    # Cleanup
    engine.stop_audio()


# ============================================================================
# PATTERN 5: Comparison - Dict vs TransportClock
# ============================================================================

COMPARISON = """
PATTERN COMPARISON: Dict-Based vs TransportClock

┌─────────────────────┬──────────────────────────┬──────────────────────────┐
│ Aspect              │ Dict-Based (Simple)      │ TransportClock (Full)    │
├─────────────────────┼──────────────────────────┼──────────────────────────┤
│ Complexity          │ ⭐ Very simple           │ ⭐⭐⭐⭐⭐ Feature-rich  │
│ State Fields        │ 3-5 fields               │ 11+ fields               │
│ Beat Position       │ Manual calculation       │ Built-in                 │
│ Tempo Changes       │ Not supported            │ Supported                │
│ Broadcast Rate      │ Manual (websocket loop)  │ Automatic (30 Hz)        │
│ Client Management   │ Manual                   │ Automatic                │
│ Performance Metrics │ None                     │ Built-in                 │
│ Error Handling      │ Basic                    │ Comprehensive            │
│ Thread Safety       │ Manual locks needed      │ Built-in locking         │
│ Lines of Code       │ ~50                      │ ~200                     │
├─────────────────────┼──────────────────────────┼──────────────────────────┤
│ Best For            │ Simple playback only     │ Full DAW                 │
│ Example Use Case    │ Demo/learning            │ Production DAW           │
└─────────────────────┴──────────────────────────┴──────────────────────────┘

USE DICT-BASED IF:
✓ Simple playback control needed
✓ Single client/no networking
✓ Learning FastAPI + sounddevice
✓ Minimal dependencies

USE TRANSPORTCLOCK IF:
✓ Multiple clients need sync
✓ Beat-based automation needed
✓ Tempo changes required
✓ Performance monitoring needed
✓ Production DAW application
"""


if __name__ == "__main__":
    import sys

    print(COMPARISON)

    if len(sys.argv) > 1 and sys.argv[1] == "run":
        # Start integrated server
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        run_integrated_server()
    else:
        print("\nUsage:")
        print("  python daw_core/integration_patterns.py run")
        print("\nOr import patterns:")
        print("  from daw_core.integration_patterns import SimpleTransportDict")
        print("  from daw_core.integration_patterns import create_simple_transport_app")
        print("  from daw_core.integration_patterns import IntegratedAudioEngine")
