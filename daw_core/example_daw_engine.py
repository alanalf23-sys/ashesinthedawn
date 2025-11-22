"""
Complete DAW Audio Engine with Transport Clock Integration

Demonstrates real-world integration of:
- sounddevice for audio I/O
- FastAPI transport clock for playback sync
- WebSocket clients receiving real-time updates
- DSP effects with performance timing

Run this script and connect a WebSocket client:
    from daw_core.transport_clock import get_transport_clock
    import asyncio, websockets, json

    async def listen():
        async with websockets.connect('ws://localhost:8000/ws/transport/clock') as ws:
            while True:
                state = json.loads(await ws.recv())
                print(f"{state['time_formatted']} - BPM: {state['bpm']}")

    asyncio.run(listen())
"""

import sounddevice as sd
import numpy as np
import threading
import time
import logging
from daw_core.transport_clock import create_transport_app, get_transport_clock
from daw_core.audio_io import AudioDeviceManager, DSPPerformanceTimer

try:
    import uvicorn
except ImportError:
    uvicorn = None

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DAWAudioEngine:
    """
    Complete DAW audio engine with transport synchronization.

    Integrates:
    - Audio device management (Scarlett, ASIO, default)
    - Real-time transport clock (playback state sync)
    - DSP effect chain with performance monitoring
    - WebSocket clients for UI sync
    """

    def __init__(self, sample_rate=48000, block_size=512, bpm=120):
        """Initialize DAW audio engine."""
        self.sample_rate = sample_rate
        self.block_size = block_size
        self.bpm = bpm

        # Audio device
        self.device_manager = AudioDeviceManager(safe_only=True)

        # Transport clock
        self.transport = get_transport_clock(sample_rate, block_size, bpm)

        # Audio stream
        self.stream = None
        self.is_running = False

        # DSP metrics
        self.dsp_times = {}
        self.effect_chain = ["Input", "Compressor", "EQ", "Reverb", "Output"]

        logger.info(f"DAW Engine initialized: {sample_rate}Hz, {block_size} samples, {bpm} BPM")

    def setup_audio_device(self, device_name=None):
        """
        Setup audio device (try Scarlett, fallback to default).

        Args:
            device_name: Specific device name (optional)
        """
        # Device priority
        device_options = device_name or ['Scarlett 2i4 USB', 'Line 6 Helix', 'Focusrite']

        for name in (device_options if isinstance(device_options, list) else [device_options]):
            logger.info(f"Attempting to use: {name}")
            device = self.device_manager.get_device_by_name(name)

            if device:
                config = self.device_manager.get_recommended_config(name)
                if self.device_manager.configure_device(name, config):
                    logger.info(f"✓ Audio device configured: {device.name}")
                    logger.info(f"  Sample Rate: {config.sample_rate}Hz")
                    logger.info(f"  Block Size: {config.block_size} samples")
                    logger.info(f"  Bit Depth: {config.bit_depth}-bit")
                    return device

        # Fallback to default
        default = self.device_manager.get_default_device()
        if default:
            logger.info(f"⚠️  Falling back to default device: {default.name}")
            return default

        logger.warning("⚠️  No audio device found")
        return None

    def audio_callback(self, indata, outdata, frames, time_info, status):
        """
        Real-time audio callback called for each buffer.

        THIS IS CRITICAL - minimize processing here!
        """
        try:
            # FIRST: Update transport position
            self.transport.update_position(frames)

            # Get current transport state for timing reference
            state = self.transport.get_state()

            # SECOND: Process audio with DSP effects
            # For demo, we'll just pass through with gain
            audio_data = indata.copy()

            # Simulate DSP chain (in real scenario, measure actual effects)
            with DSPPerformanceTimer("Effect Chain", self.sample_rate,
                                    self.block_size, indata.shape[1]) as timer:
                # Simple gain reduction based on playback position
                # (example: dynamics effect response)
                gain = 0.8 + 0.2 * np.sin(2 * np.pi * state.beat_pos / 4)
                audio_data = audio_data * gain

            # Track performance
            self.dsp_times["Effect Chain"] = timer.elapsed_ms

            # Output
            outdata[:] = audio_data

        except Exception as e:
            logger.error(f"Audio callback error: {e}")
            outdata.fill(0)

    def start(self, device_name=None):
        """Start audio engine."""
        logger.info("Starting audio engine...")

        # Setup device
        device = self.setup_audio_device(device_name)
        if not device:
            logger.error("Failed to setup audio device")
            return False

        try:
            # Create audio stream
            self.stream = sd.OutputStream(
                device=device.index,
                channels=2,
                samplerate=self.sample_rate,
                blocksize=self.block_size,
                callback=self.audio_callback,
                latency='low'
            )

            # Start streaming
            self.stream.start()
            self.is_running = True

            logger.info("✓ Audio engine started")
            logger.info(f"  Latency: {self.stream.latency[0]*1000:.2f}ms (input), "
                       f"{self.stream.latency[1]*1000:.2f}ms (output)")

            return True

        except Exception as e:
            logger.error(f"Failed to start audio engine: {e}")
            return False

    def stop(self):
        """Stop audio engine."""
        if self.stream:
            self.transport.stop()
            self.stream.stop()
            self.stream.close()
            self.is_running = False
            logger.info("Audio engine stopped")

    def get_status(self):
        """Get engine status for API."""
        state = self.transport.get_state()
        metrics = self.transport.get_metrics()

        return {
            "running": self.is_running,
            "transport": state.to_dict(),
            "metrics": metrics,
            "dsp_performance": self.dsp_times,
        }


def run_complete_daw():
    """
    Run complete DAW with audio engine and FastAPI server.

    This example:
    1. Creates audio engine with transport clock
    2. Starts FastAPI WebSocket server
    3. Streams real-time playback state to connected clients
    4. Provides REST API for control
    """

    print("\n" + "="*70)
    print("DAW AUDIO ENGINE WITH TRANSPORT CLOCK")
    print("="*70)

    # Initialize audio engine
    engine = DAWAudioEngine(sample_rate=48000, block_size=512, bpm=120)

    # Start audio (use default or preferred device)
    if not engine.start():
        print("Failed to start audio engine")
        return

    # Create FastAPI app
    app = create_transport_app(
        sample_rate=48000,
        block_size=512,
        bpm=120
    )

    # Store engine reference
    app.state.engine = engine

    # Add engine status endpoint
    @app.get("/engine/status")
    async def get_engine_status():
        """Get complete engine status."""
        return engine.get_status()

    # Add control endpoints that interact with engine
    @app.post("/transport/start-playback")
    async def start_playback():
        """Start playback from beginning."""
        engine.transport.seek(0)
        engine.transport.play()
        return {"status": "playing"}

    @app.post("/transport/stop-playback")
    async def stop_playback():
        """Stop playback."""
        engine.transport.stop()
        return {"status": "stopped"}

    # Start FastAPI in background thread
    def run_server():
        logger.info("Starting FastAPI server on http://localhost:8000")
        if uvicorn:
            uvicorn.run(
                app,
                host="0.0.0.0",
                port=8000,
                log_level="info"
            )
        else:
            logger.error("uvicorn not installed")

    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Keep engine running
    print("\nServer running on http://localhost:8000")
    print("WebSocket: ws://localhost:8000/ws/transport/clock")
    print("API Docs: http://localhost:8000/docs")
    print("\nPress Ctrl+C to exit...\n")

    try:
        # Simulate playback commands
        time.sleep(2)
        print("Starting playback...")
        engine.transport.play()

        # Run for 30 seconds
        for i in range(30):
            time.sleep(1)
            state = engine.transport.get_state()
            metrics = engine.transport.get_metrics()
            print(f"[{state.time_formatted}] "
                  f"BPM: {state.bpm:.1f} | "
                  f"Beat: {state.beat_pos:.1f} | "
                  f"Clients: {metrics['connected_clients']}")

        print("\nStopping playback...")
        engine.transport.stop()

    except KeyboardInterrupt:
        print("\n\nShutdown...")

    finally:
        engine.stop()


if __name__ == "__main__":
    run_complete_daw()
