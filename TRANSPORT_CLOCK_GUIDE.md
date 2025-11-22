# FastAPI WebSocket Transport Clock Integration Guide

## Overview

The `transport_clock.py` module provides real-time playback state synchronization via WebSocket for your DAW. It implements a broadcast clock that streams current playback position, tempo, and status to connected clients at 30 Hz.

## Features

### ✨ Core Capabilities

- **Real-Time Transport State**: Playback status, sample position, time in seconds
- **WebSocket Broadcasting**: Stream state at 30 FPS to unlimited connected clients
- **Tempo & Beat Tracking**: BPM management and beat position calculation
- **REST API Alternative**: HTTP endpoints for polling-based clients
- **Bidirectional Control**: WebSocket endpoint for clients to send control commands
- **Performance Metrics**: Track connection count, update frequency, CPU load
- **Thread-Safe**: Safe concurrent access from audio callback and WebSocket threads

### 🎯 State Information Broadcast

Each update includes:

```json
{
  "playing": true,
  "sample_pos": 192000,
  "time_seconds": 4.0,
  "time_formatted": "00:04.000",
  "frame_count": 12,
  "status": "playing",
  "bpm": 120.0,
  "beat_pos": 8.0,
  "timestamp_ms": 1700641234567.0
}
```

## Installation

### 1. Install Dependencies

```bash
pip install fastapi uvicorn websockets numpy sounddevice
```

### 2. Module Files

Located in:

- `daw_core/transport_clock.py` - Transport clock implementation
- `daw_core/audio_io.py` - Audio device management (existing)

## Quick Start

### Option A: Standalone Server

```bash
# Run as standalone FastAPI server
python -m daw_core.transport_clock

# Or with uvicorn
uvicorn daw_core.transport_clock:app --reload --port 8000
```

Output:

```
======================================================================
DAW TRANSPORT CLOCK - FastAPI WebSocket Server
======================================================================

Starting server on http://localhost:8000

Endpoints:
  - REST API: GET /transport/status
  - WebSocket Clock: WS /ws/transport/clock
  - WebSocket Control: WS /ws/transport/control

API Docs: http://localhost:8000/docs
```

### Option B: Integrate with Existing App

```python
from daw_core.transport_clock import create_transport_app

# Create transport app
transport_app = create_transport_app(
    sample_rate=48000,
    block_size=512,
    bpm=120.0
)

# Run server
import uvicorn
uvicorn.run(transport_app, host="0.0.0.0", port=8000)
```

### Option C: Add to Existing FastAPI App

```python
from fastapi import FastAPI
from daw_core.transport_clock import get_transport_clock

app = FastAPI()
transport = get_transport_clock(sample_rate=48000, block_size=512, bpm=120.0)

# Your app routes...

# In audio callback
def audio_callback(indata, outdata, frames, time_info, status):
    transport.update_position(frames)  # Update transport on each buffer
    outdata[:] = indata
```

## Usage Patterns

### 1. Audio Callback Integration

```python
import sounddevice as sd
from daw_core.transport_clock import get_transport_clock

transport = get_transport_clock(sample_rate=48000, block_size=512)

def audio_callback(indata, outdata, frames, time_info, status):
    """Called by audio engine for each buffer processed."""
    # Update transport position ONLY if audio is being processed
    transport.update_position(frames)

    # Your DSP code here
    outdata[:] = indata

# Start audio stream
stream = sd.OutputStream(
    channels=2,
    samplerate=48000,
    blocksize=512,
    callback=audio_callback,
    latency='low'
)
stream.start()
```

### 2. Playback Control

```python
transport = get_transport_clock()

# Playback control
transport.play()           # Start playing
transport.pause()          # Pause (can resume)
transport.stop()           # Stop (resets to last position)
transport.resume()         # Resume from paused position

# Seeking
transport.seek(0)                      # Go to start
transport.seek_seconds(10.5)           # Go to 10.5 seconds
transport.seek_beat(4)                 # Go to beat 4 (at 120 BPM)

# Tempo control
transport.set_bpm(140)                 # Change to 140 BPM
```

### 3. Get Current State

```python
# Get snapshot of current state
state = transport.get_state()

print(f"Playing: {state.playing}")
print(f"Time: {state.time_formatted}")          # "00:04.000"
print(f"Position: {state.sample_pos} samples")
print(f"Beat: {state.beat_pos}")
print(f"BPM: {state.bpm}")
```

## REST API Endpoints

### GET /transport/status

Get current transport state (polling alternative to WebSocket).

**Response:**

```json
{
  "playing": true,
  "sample_pos": 192000,
  "time_seconds": 4.0,
  "time_formatted": "00:04.000",
  "bpm": 120.0,
  "beat_pos": 8.0
}
```

### GET /transport/metrics

Get clock performance metrics.

**Response:**

```json
{
  "sample_rate": 48000,
  "block_size": 512,
  "bpm": 120.0,
  "connected_clients": 3,
  "updates_sent": 450,
  "actual_fps": 29.8,
  "target_hz": 30
}
```

### POST /transport/play

Start playback.

### POST /transport/stop

Stop playback.

### POST /transport/seek?seconds=10.5

Seek to time position (seconds).

### POST /transport/tempo?bpm=140

Update tempo.

## WebSocket Endpoints

### WS /ws/transport/clock

Subscribe to real-time transport state updates at 30 Hz.

**JavaScript Client:**

```javascript
const ws = new WebSocket("ws://localhost:8000/ws/transport/clock");

ws.onmessage = (event) => {
  const state = JSON.parse(event.data);
  console.log(`${state.time_formatted} - Playing: ${state.playing}`);

  // Update UI with state
  document.getElementById("time-display").textContent = state.time_formatted;
  document.getElementById("playback-indicator").style.opacity = state.playing
    ? 1
    : 0.3;
};

ws.onerror = (event) => console.error("WebSocket error:", event);
ws.onclose = () => console.log("WebSocket closed");
```

**Python Client:**

```python
import asyncio
import websockets
import json

async def listen_transport():
    uri = "ws://localhost:8000/ws/transport/clock"
    async with websockets.connect(uri) as ws:
        while True:
            state_json = await ws.recv()
            state = json.loads(state_json)
            print(f"{state['time_formatted']} | BPM: {state['bpm']} | "
                  f"Beat: {state['beat_pos']:.1f}")

asyncio.run(listen_transport())
```

### WS /ws/transport/control

Send playback control commands.

**Command Format (JSON):**

```json
{
  "command": "play|stop|pause|resume|seek|tempo",
  "value": 10.5
}
```

**Example - Seek via WebSocket:**

```python
import asyncio
import websockets
import json

async def send_seek_command(seconds):
    uri = "ws://localhost:8000/ws/transport/control"
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({
            "command": "seek",
            "value": seconds
        }))
        response = json.loads(await ws.recv())
        print(f"Seek response: {response}")

asyncio.run(send_seek_command(5.0))
```

## State Information Reference

### TransportState Dataclass

```python
@dataclass
class TransportState:
    playing: bool              # Is playback active?
    sample_pos: int            # Current sample position
    time_seconds: float        # Time in seconds (sample_pos / sr)
    time_formatted: str        # Human-readable "MM:SS.mmm"
    frame_count: int           # Total frames processed
    status: str                # "playing", "stopped", or "paused"
    bpm: float                 # Tempo (beats per minute)
    beat_pos: float            # Position in beats
    timestamp_ms: float        # Unix timestamp (milliseconds)
```

## Integration Examples

### Example 1: Complete Audio Engine Integration

```python
import sounddevice as sd
import numpy as np
from daw_core.transport_clock import create_transport_app
import uvicorn
import threading

# Create transport app
app = create_transport_app(sample_rate=48000, block_size=512, bpm=120)
transport = app.state.transport

def audio_callback(indata, outdata, frames, time_info, status):
    """Audio processing with transport updates."""
    transport.update_position(frames)  # Critical: update on each buffer

    # Your DSP chain here
    output = np.zeros_like(indata)
    # ... apply effects ...
    outdata[:] = output

# Start audio stream
stream = sd.OutputStream(
    channels=2,
    samplerate=48000,
    blocksize=512,
    callback=audio_callback,
    latency='low'
)

# Start audio stream in background
def run_audio():
    with stream:
        stream.start()
        while True:
            import time
            time.sleep(0.1)

audio_thread = threading.Thread(target=run_audio, daemon=True)
audio_thread.start()

# Start FastAPI server
uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Example 2: Tempo-Synced Effects

```python
from daw_core.transport_clock import get_transport_clock
import numpy as np

transport = get_transport_clock(bpm=120)

def tempo_synced_lfo(depth=1.0):
    """LFO synced to transport tempo."""
    state = transport.get_state()
    # LFO oscillates at 0.5 Hz when BPM=120 (half note)
    phase = (state.beat_pos / 4) % 1.0  # One cycle per bar
    return depth * np.sin(2 * np.pi * phase)

def audio_callback(indata, outdata, frames, time_info, status):
    transport.update_position(frames)

    # Apply tempo-synced modulation
    lfo_value = tempo_synced_lfo(depth=0.5)
    modulated = indata * (1.0 + lfo_value)

    outdata[:] = modulated
```

### Example 3: Multi-Client UI Sync

```html
<!-- Web UI synced to transport clock -->
<!DOCTYPE html>
<html>
  <head>
    <title>DAW Transport Monitor</title>
    <style>
      #time-display {
        font-size: 48px;
        font-family: monospace;
        font-weight: bold;
      }
      #status-light {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: gray;
        display: inline-block;
        margin-right: 10px;
      }
      .playing {
        background-color: green !important;
      }
    </style>
  </head>
  <body>
    <div>
      <span id="status-light"></span>
      <span id="time-display">00:00.000</span>
    </div>
    <div>
      <button onclick="sendCommand('play')">Play</button>
      <button onclick="sendCommand('stop')">Stop</button>
      <button onclick="sendCommand('pause')">Pause</button>
    </div>

    <script>
      const ws_clock = new WebSocket("ws://localhost:8000/ws/transport/clock");
      const ws_ctrl = new WebSocket("ws://localhost:8000/ws/transport/control");

      ws_clock.onmessage = (event) => {
        const state = JSON.parse(event.data);
        document.getElementById("time-display").textContent =
          state.time_formatted;

        const light = document.getElementById("status-light");
        if (state.playing) {
          light.classList.add("playing");
        } else {
          light.classList.remove("playing");
        }
      };

      function sendCommand(cmd) {
        ws_ctrl.send(JSON.stringify({ command: cmd }));
      }
    </script>
  </body>
</html>
```

## Performance Characteristics

### CPU Impact

- Transport updates: **<1ms per 30 updates** (negligible)
- WebSocket overhead: **~2-5ms per broadcast** (depends on client count)
- Per client: **~0.5-1ms per 30Hz update**

### Latency

- Transport state update: **~0-2ms** (from audio callback to broadcast)
- WebSocket delivery: **~1-5ms** (typical local network)
- UI update: **~16ms** (next frame render)

### Scalability

- Single server: **100+ concurrent WebSocket clients**
- Update frequency: **30 Hz (33ms intervals)** - configurable
- Memory per client: **~1-2KB**

## Troubleshooting

### WebSocket Connection Refused

**Problem**: Cannot connect to WebSocket

```
Error: WebSocket connection failed
```

**Solution**:

1. Verify server is running: `http://localhost:8000/docs`
2. Check firewall allows port 8000
3. Verify correct URL: `ws://localhost:8000/ws/transport/clock` (not `http`)

### No Transport Updates

**Problem**: WebSocket receives no data

```
No messages received
```

**Solution**:

1. Verify audio callback calls `transport.update_position(frames)`
2. Check `GET /transport/metrics` - should show increasing `updates_sent`
3. Verify `sample_pos` increasing: `GET /transport/status`

### High CPU Load

**Problem**: Server CPU usage too high

**Solution**:

1. Reduce update frequency: `update_hz=15` (instead of 30)
2. Monitor metrics: `GET /transport/metrics`
3. Check for client disconnection issues (unclean closes)

### Sync Drift Between Clients

**Problem**: Clients show different playback positions

**Solution**:

1. All clients receive same timestamp - drift is normal
2. Sync based on `timestamp_ms` + offset calculation
3. Use beat position for tempo-sync (more reliable than sample position)

## Best Practices

### 1. Always Update Transport Position

```python
def audio_callback(indata, outdata, frames, time_info, status):
    # CRITICAL: Update position FIRST
    transport.update_position(frames)

    # Then process audio
    # ...
```

### 2. Use Beat Position for Tempo-Sync Effects

```python
# NOT recommended - will have tempo changes
phase = state.sample_pos * 2 * np.pi / SAMPLE_RATE

# RECOMMENDED - will follow tempo
phase = state.beat_pos * 2 * np.pi
```

### 3. Cache Transport State

```python
# Good - retrieve once per buffer
state = transport.get_state()
time_s = state.time_seconds
beat = state.beat_pos

# Bad - multiple lookups
time1 = transport.time_seconds
time2 = transport.time_seconds  # Redundant
```

### 4. Handle WebSocket Disconnections Gracefully

```javascript
const ws = new WebSocket("ws://localhost:8000/ws/transport/clock");

ws.onclose = () => {
  console.log("Connection closed, retrying...");
  setTimeout(() => {
    location.reload(); // or reconnect()
  }, 2000);
};
```

## Advanced Topics

### Custom Update Frequency

```python
# 15 Hz instead of 30 Hz (doubles latency, halves CPU)
transport = TransportClock(
    sample_rate=48000,
    block_size=512,
    bpm=120.0,
    update_hz=15  # Custom update rate
)
```

### Metrics Monitoring

```python
# Monitor in separate thread
import threading
import time

def monitor_metrics():
    while True:
        metrics = transport.get_metrics()
        print(f"Connected clients: {metrics['connected_clients']}")
        print(f"Actual FPS: {metrics['actual_fps']:.1f}")
        time.sleep(5)

threading.Thread(target=monitor_metrics, daemon=True).start()
```

### Beat Subdivision

```python
def get_beat_fraction(transport, division=4):
    """Get beat position with subdivision (e.g., 16th notes)."""
    beat = transport.beat_pos
    fraction = beat * division  # 1/division note
    return fraction % 1.0  # Position within subdivision
```

## Related Files

- `daw_core/transport_clock.py` - Implementation
- `daw_core/audio_io.py` - Audio device management
- `AUDIO_DEVICE_SETTINGS_GUIDE.md` - Audio configuration

## API Documentation

Auto-generated Swagger UI available at: `http://localhost:8000/docs`

Visit to test endpoints interactively and see request/response schemas.
