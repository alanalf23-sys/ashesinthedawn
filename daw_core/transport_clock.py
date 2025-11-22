"""
FastAPI WebSocket Transport Clock for Real-Time DAW Synchronization

Provides real-time playback transport state and timing information to connected clients
via WebSocket. Enables synchronized UI updates, visualization, and multi-client coordination.

Transport State Tracking:
- Playback status (playing/stopped)
- Current sample position
- Time in seconds
- BPM and tempo information
- Frame count and timing precision

Usage:
    from daw_core.transport_clock import TransportClock, create_transport_app

    # Create FastAPI app with transport clock
    app = create_transport_app()

    # Or integrate with existing app
    transport = TransportClock(sample_rate=48000, block_size=512)
    transport.attach_to_app(app)

    # Update transport state from audio callback
    def audio_callback(indata, outdata, frames, time_info, status):
        transport.update_position(frames)
        outdata[:] = indata

    # Run server: uvicorn daw_core.transport_clock:app --reload
"""

import time
import asyncio
import logging
from typing import Dict, Optional, List
from dataclasses import dataclass, asdict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import threading

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    np = None

logger = logging.getLogger(__name__)


@dataclass
class TransportState:
    """Real-time transport state snapshot."""
    playing: bool
    sample_pos: int
    time_seconds: float
    time_formatted: str  # MM:SS.mmm format
    frame_count: int
    status: str  # "playing", "stopped", "paused"
    bpm: float  # beats per minute
    beat_pos: float  # position in beats
    timestamp_ms: float  # milliseconds since epoch
    loop_enabled: bool = False
    loop_start_seconds: float = 0.0
    loop_end_seconds: float = 0.0

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


class TransportClock:
    """
    Real-time transport clock for DAW synchronization via WebSocket.

    Manages playback state, position tracking, and synchronized distribution
    to all connected clients at 30 FPS (33ms updates).
    """

    def __init__(self, sample_rate: int = 48000, block_size: int = 512,
                 bpm: float = 120.0, update_hz: int = 30):
        """
        Initialize transport clock.

        Args:
            sample_rate: Audio sample rate (Hz)
            block_size: Audio buffer size (samples)
            bpm: Beats per minute (default 120)
            update_hz: WebSocket update frequency (30 fps default)
        """
        self.sample_rate = sample_rate
        self.block_size = block_size
        self.bpm = bpm
        self.update_hz = update_hz
        self.update_interval = 1.0 / update_hz

        # Transport state
        self._playing = False
        self._sample_pos = 0
        self._start_time = 0.0
        self._paused_sample_pos = 0

        # Loop state
        self._loop_enabled = False
        self._loop_start_pos = 0  # samples
        self._loop_end_pos = int(10 * sample_rate)  # default 10 seconds

        # Clients
        self._clients: List[WebSocket] = []
        self._client_lock = threading.Lock()

        # Metrics
        self._frame_count = 0
        self._last_update_time = time.time()
        self._update_count = 0

    @property
    def playing(self) -> bool:
        """Get playback state."""
        return self._playing

    @property
    def sample_pos(self) -> int:
        """Get current sample position."""
        return self._sample_pos

    @property
    def time_seconds(self) -> float:
        """Get current time in seconds."""
        return self._sample_pos / self.sample_rate

    @property
    def beat_pos(self) -> float:
        """Get current position in beats."""
        seconds_per_beat = 60.0 / self.bpm
        return self.time_seconds / seconds_per_beat

    def play(self):
        """Start playback."""
        if not self._playing:
            self._playing = True
            self._start_time = time.time() - (self._sample_pos / self.sample_rate)
            logger.info(f"Transport playing from {self._sample_pos} samples "
                       f"({self.time_seconds:.2f}s)")

    def stop(self):
        """Stop playback."""
        if self._playing:
            self._playing = False
            self._paused_sample_pos = self._sample_pos
            logger.info(f"Transport stopped at {self._sample_pos} samples "
                       f"({self.time_seconds:.2f}s)")

    def pause(self):
        """Pause playback (can resume from same position)."""
        self.stop()

    def resume(self):
        """Resume from paused position."""
        self.play()

    def seek(self, sample_pos: int):
        """
        Seek to absolute sample position.

        Args:
            sample_pos: Target sample position
        """
        self._sample_pos = max(0, sample_pos)
        self._paused_sample_pos = self._sample_pos

        if self._playing:
            self._start_time = time.time() - (self._sample_pos / self.sample_rate)

        logger.info(f"Transport seek to {self._sample_pos} samples ({self.time_seconds:.2f}s)")

    def seek_seconds(self, seconds: float):
        """Seek to time position in seconds."""
        sample_pos = int(seconds * self.sample_rate)
        self.seek(sample_pos)

    def seek_beat(self, beat: float):
        """Seek to beat position."""
        seconds = beat * (60.0 / self.bpm)
        self.seek_seconds(seconds)

    def set_bpm(self, bpm: float):
        """Update tempo (BPM)."""
        self.bpm = max(20.0, min(300.0, bpm))  # Clamp 20-300 BPM
        logger.info(f"Transport BPM set to {self.bpm}")

    def set_loop(self, start_seconds: float, end_seconds: float, enabled: bool = True):
        """
        Set loop region and enable/disable.

        Args:
            start_seconds: Loop start time in seconds
            end_seconds: Loop end time in seconds
            enabled: Whether to enable the loop
        """
        self._loop_start_pos = int(start_seconds * self.sample_rate)
        self._loop_end_pos = int(end_seconds * self.sample_rate)
        self._loop_enabled = enabled
        logger.info(f"Loop set: {start_seconds:.2f}s - {end_seconds:.2f}s, enabled={enabled}")

    def disable_loop(self):
        """Disable loop playback."""
        self._loop_enabled = False
        logger.info("Loop disabled")

    def enable_loop(self):
        """Enable loop playback."""
        self._loop_enabled = True
        logger.info("Loop enabled")

    def update_position(self, frame_count: int):
        """
        Update playback position from audio callback.
        Called from audio engine for each buffer processed.

        Args:
            frame_count: Number of frames processed in this buffer
        """
        if self._playing:
            self._sample_pos += frame_count
            self._frame_count += 1

            # Handle loop
            if self._loop_enabled and self._sample_pos >= self._loop_end_pos:
                self._sample_pos = self._loop_start_pos
                self._start_time = time.time() - (self._sample_pos / self.sample_rate)
                logger.debug(f"Loop: jumped to {self._sample_pos} samples ({self.time_seconds:.2f}s)")

    def get_state(self) -> TransportState:
        """Get current transport state snapshot."""
        time_seconds = self.time_seconds

        # Format time as MM:SS.mmm
        minutes = int(time_seconds // 60)
        seconds = time_seconds % 60
        time_formatted = f"{minutes:02d}:{seconds:06.3f}"

        return TransportState(
            playing=self._playing,
            sample_pos=self._sample_pos,
            time_seconds=time_seconds,
            time_formatted=time_formatted,
            frame_count=self._frame_count,
            status="playing" if self._playing else "stopped",
            bpm=self.bpm,
            beat_pos=self.beat_pos,
            timestamp_ms=time.time() * 1000,
            loop_enabled=self._loop_enabled,
            loop_start_seconds=self._loop_start_pos / self.sample_rate,
            loop_end_seconds=self._loop_end_pos / self.sample_rate
        )

    async def register_client(self, ws: WebSocket):
        """Register new WebSocket client."""
        await ws.accept()
        with self._client_lock:
            self._clients.append(ws)
        logger.info(f"Transport client connected (total: {len(self._clients)})")

    async def unregister_client(self, ws: WebSocket):
        """Unregister disconnected client."""
        with self._client_lock:
            if ws in self._clients:
                self._clients.remove(ws)
        logger.info(f"Transport client disconnected (total: {len(self._clients)})")

    async def broadcast_state(self):
        """Broadcast transport state to all connected clients."""
        state = self.get_state()
        state_dict = state.to_dict()

        disconnected = []

        with self._client_lock:
            clients_copy = self._clients.copy()

        for client in clients_copy:
            try:
                await client.send_json(state_dict)
                self._update_count += 1
            except Exception as e:
                logger.warning(f"Error sending to client: {e}")
                disconnected.append(client)

        # Remove disconnected clients
        for client in disconnected:
            await self.unregister_client(client)

    async def clock_loop(self):
        """
        Main transport clock loop that broadcasts state at configured Hz.
        Run this in a background task.
        """
        logger.info(f"Transport clock started ({self.update_hz} Hz)")

        try:
            while True:
                await self.broadcast_state()
                await asyncio.sleep(self.update_interval)
        except asyncio.CancelledError:
            logger.info("Transport clock stopped")
            raise

    def get_metrics(self) -> Dict:
        """Get clock performance metrics."""
        elapsed = time.time() - self._last_update_time
        if elapsed > 0:
            fps = self._update_count / elapsed
        else:
            fps = 0

        return {
            'sample_rate': self.sample_rate,
            'block_size': self.block_size,
            'bpm': self.bpm,
            'playing': self._playing,
            'sample_pos': self._sample_pos,
            'frame_count': self._frame_count,
            'connected_clients': len(self._clients),
            'updates_sent': self._update_count,
            'actual_fps': fps,
            'target_hz': self.update_hz,
        }


class TransportClockManager:
    """
    Manages global transport clock instance and FastAPI integration.
    Simplifies setup and provides convenience methods.
    """

    _instance: Optional[TransportClock] = None
    _lock = threading.Lock()

    @classmethod
    def get_instance(cls, sample_rate: int = 48000, block_size: int = 512,
                     bpm: float = 120.0) -> TransportClock:
        """Get or create singleton transport clock instance."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = TransportClock(sample_rate, block_size, bpm)
                    logger.info("Created TransportClock singleton")
        return cls._instance

    @classmethod
    def reset(cls):
        """Reset singleton instance (for testing)."""
        cls._instance = None


# Global transport clock instance
_transport_clock: Optional[TransportClock] = None
_clock_task: Optional[asyncio.Task] = None


def get_transport_clock(sample_rate: int = 48000, block_size: int = 512,
                       bpm: float = 120.0) -> TransportClock:
    """Get or create global transport clock."""
    global _transport_clock
    if _transport_clock is None:
        _transport_clock = TransportClock(sample_rate, block_size, bpm)
    return _transport_clock


def create_transport_app(sample_rate: int = 48000, block_size: int = 512,
                        bpm: float = 120.0, title: str = "DAW Transport Clock") -> FastAPI:
    """
    Create FastAPI app with transport clock WebSocket endpoints.

    Args:
        sample_rate: Audio sample rate (Hz)
        block_size: Audio buffer size (samples)
        bpm: Initial tempo (beats per minute)
        title: API title

    Returns:
        FastAPI application instance
    """
    app = FastAPI(title=title)

    # Enable CORS for local development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Initialize transport clock
    transport = get_transport_clock(sample_rate, block_size, bpm)

    # Store reference in app state
    app.state.transport = transport

    @app.on_event("startup")
    async def startup_event():
        """Start transport clock broadcast task on app startup."""
        global _clock_task
        if _clock_task is None or _clock_task.done():
            _clock_task = asyncio.create_task(transport.clock_loop())
            logger.info("Transport clock broadcast task started")

    @app.on_event("shutdown")
    async def shutdown_event():
        """Stop transport clock on app shutdown."""
        global _clock_task
        if _clock_task:
            _clock_task.cancel()
            try:
                await _clock_task
            except asyncio.CancelledError:
                pass
            _clock_task = None
            logger.info("Transport clock shutdown complete")

    @app.get("/transport/status")
    async def get_transport_status():
        """Get current transport state (HTTP poll alternative)."""
        return transport.get_state().to_dict()

    @app.get("/transport/metrics")
    async def get_transport_metrics():
        """Get transport clock performance metrics."""
        return transport.get_metrics()

    @app.post("/transport/play")
    async def play():
        """Start playback."""
        transport.play()
        return {"status": "playing"}

    @app.post("/transport/stop")
    async def stop():
        """Stop playback."""
        transport.stop()
        return {"status": "stopped"}

    @app.post("/transport/pause")
    async def pause():
        """Pause playback."""
        transport.pause()
        return {"status": "paused"}

    @app.post("/transport/resume")
    async def resume():
        """Resume from paused position."""
        transport.resume()
        return {"status": "playing"}

    @app.post("/transport/seek")
    async def seek(seconds: float):
        """Seek to time position (seconds)."""
        transport.seek_seconds(seconds)
        return {"time_seconds": transport.time_seconds}

    @app.post("/transport/tempo")
    async def set_tempo(bpm: float):
        """Update tempo (BPM)."""
        transport.set_bpm(bpm)
        return {"bpm": transport.bpm}

    @app.post("/transport/rewind")
    async def rewind():
        """Rewind to start (0 seconds)."""
        transport.seek_seconds(0)
        return {"time_seconds": 0, "sample_pos": 0}

    @app.post("/transport/loop")
    async def set_loop(start: float, end: float, enabled: bool = True):
        """
        Set loop region in seconds.

        Args:
            start: Loop start time (seconds)
            end: Loop end time (seconds)
            enabled: Whether to enable loop (default True)
        """
        transport.set_loop(start, end, enabled)
        return {
            "loop_start": start,
            "loop_end": end,
            "loop_enabled": enabled,
        }

    @app.post("/transport/loop/disable")
    async def disable_loop():
        """Disable loop playback."""
        transport.disable_loop()
        return {"loop_enabled": False}

    @app.post("/transport/loop/enable")
    async def enable_loop():
        """Enable loop playback."""
        transport.enable_loop()
        return {"loop_enabled": True}

    @app.websocket("/ws/transport/clock")
    async def websocket_transport_clock(ws: WebSocket):
        """
        WebSocket endpoint for real-time transport state.

        Connects client to transport clock stream.
        Receives transport state updates at 30 Hz (33ms interval).

        Usage (JavaScript):
            const ws = new WebSocket('ws://localhost:8000/ws/transport/clock');
            ws.onmessage = (event) => {
                const state = JSON.parse(event.data);
                console.log(`Playing: ${state.playing}, Time: ${state.time_formatted}`);
            };
        """
        await transport.register_client(ws)

        try:
            # Keep connection alive
            while True:
                # Client can send commands if needed
                data = await ws.receive_text()
                logger.debug(f"Received from client: {data}")
        except WebSocketDisconnect:
            await transport.unregister_client(ws)
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            await transport.unregister_client(ws)

    @app.websocket("/ws/transport/control")
    async def websocket_transport_control(ws: WebSocket):
        """
        WebSocket endpoint for sending transport control commands.

        Allows clients to control playback (play/stop/seek).
        """
        await ws.accept()

        try:
            while True:
                data = await ws.receive_json()
                command = data.get('command')
                value = data.get('value')

                if command == 'play':
                    transport.play()
                elif command == 'stop':
                    transport.stop()
                elif command == 'pause':
                    transport.pause()
                elif command == 'resume':
                    transport.resume()
                elif command == 'seek':
                    transport.seek_seconds(value)
                elif command == 'tempo':
                    transport.set_bpm(value)
                else:
                    logger.warning(f"Unknown command: {command}")

                await ws.send_json({"success": True, "command": command})
        except WebSocketDisconnect:
            pass
        except Exception as e:
            logger.error(f"Control WebSocket error: {e}")

    @app.get("/")
    async def root():
        """API info and endpoint documentation."""
        return {
            "name": title,
            "endpoints": {
                "transport_status": "GET /transport/status",
                "transport_metrics": "GET /transport/metrics",
                "play": "POST /transport/play",
                "stop": "POST /transport/stop",
                "pause": "POST /transport/pause",
                "resume": "POST /transport/resume",
                "seek": "POST /transport/seek?seconds=10.5",
                "tempo": "POST /transport/tempo?bpm=120",
                "websocket_clock": "WS /ws/transport/clock",
                "websocket_control": "WS /ws/transport/control",
            },
            "docs": "/docs",
        }

    return app


# Default app for running directly
app = create_transport_app()


if __name__ == "__main__":
    import uvicorn

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    print("\n" + "="*70)
    print("DAW TRANSPORT CLOCK - FastAPI WebSocket Server")
    print("="*70)
    print("\nStarting server on http://localhost:8000")
    print("\nEndpoints:")
    print("  - REST API: GET /transport/status")
    print("  - WebSocket Clock: WS /ws/transport/clock")
    print("  - WebSocket Control: WS /ws/transport/control")
    print("\nAPI Docs: http://localhost:8000/docs")
    print("\nExample Python Client:")
    print("""
    import asyncio
    import websockets
    import json

    async def listen():
        async with websockets.connect('ws://localhost:8000/ws/transport/clock') as ws:
            while True:
                state = json.loads(await ws.recv())
                print(f"{state['time_formatted']} - Playing: {state['playing']}")

    asyncio.run(listen())
    """)
    print("="*70 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
