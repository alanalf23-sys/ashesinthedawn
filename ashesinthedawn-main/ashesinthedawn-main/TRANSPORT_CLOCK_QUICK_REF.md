# FastAPI WebSocket Transport Clock - Quick Reference

## What It Does

Real-time playback state synchronization for your DAW. Broadcasts current playback position, tempo, and status via WebSocket to unlimited connected clients at 30 Hz.

## Key Features

✅ **30 Hz Real-Time Updates** - Playback state, position, tempo, beat position
✅ **WebSocket Broadcast** - Stream to unlimited clients simultaneously
✅ **REST API** - HTTP polling alternative for status/control
✅ **Bi-directional Control** - Clients can send play/stop/seek commands
✅ **Thread-Safe** - Safe concurrent access from audio + WebSocket threads
✅ **Performance Metrics** - Monitor client connections and update frequency

## Installation

```bash
pip install fastapi uvicorn websockets numpy sounddevice
```

## Quick Start

### 1. Run Standalone Server

```bash
python -m daw_core.transport_clock
```

Server runs on `http://localhost:8000`

### 2. Integrate with Audio Engine

```python
from daw_core.transport_clock import get_transport_clock
import sounddevice as sd

transport = get_transport_clock(sample_rate=48000, block_size=512)

def audio_callback(indata, outdata, frames, time_info, status):
    transport.update_position(frames)  # Critical!
    outdata[:] = indata

sd.OutputStream(callback=audio_callback).start()
```

### 3. Connect WebSocket Client

```javascript
const ws = new WebSocket("ws://localhost:8000/ws/transport/clock");
ws.onmessage = (event) => {
  const state = JSON.parse(event.data);
  console.log(`${state.time_formatted} - Playing: ${state.playing}`);
};
```

## Core API

### TransportClock Methods

```python
transport.play()                    # Start playback
transport.stop()                    # Stop playback
transport.pause() / resume()        # Pause/resume
transport.seek(0)                   # Go to sample 0
transport.seek_seconds(10.5)        # Go to 10.5 seconds
transport.seek_beat(4)              # Go to beat 4
transport.set_bpm(140)              # Change tempo
transport.update_position(frames)   # Update from audio callback
transport.get_state()               # Get current state snapshot
transport.get_metrics()             # Get performance metrics
```

## Real-Time State Broadcast

Each WebSocket client receives this every 33ms:

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

## REST API Endpoints

| Endpoint                       | Method | Purpose                     |
| ------------------------------ | ------ | --------------------------- |
| `/transport/status`            | GET    | Get current state (polling) |
| `/transport/metrics`           | GET    | Performance metrics         |
| `/transport/play`              | POST   | Start playback              |
| `/transport/stop`              | POST   | Stop playback               |
| `/transport/pause`             | POST   | Pause playback              |
| `/transport/resume`            | POST   | Resume from pause           |
| `/transport/seek?seconds=10.5` | POST   | Seek to time                |
| `/transport/tempo?bpm=120`     | POST   | Change BPM                  |

## WebSocket Endpoints

| URL                                        | Purpose                         |
| ------------------------------------------ | ------------------------------- |
| `ws://localhost:8000/ws/transport/clock`   | Receive state updates (one-way) |
| `ws://localhost:8000/ws/transport/control` | Send control commands (one-way) |

## Complete Integration Example

```python
import sounddevice as sd
import numpy as np
from daw_core.transport_clock import create_transport_app
import uvicorn
import threading

# Create transport app
app = create_transport_app(48000, 512, 120)
transport = app.state.transport

def audio_callback(indata, outdata, frames, time_info, status):
    transport.update_position(frames)  # Update on every buffer

    # Your DSP effects here
    outdata[:] = indata * 0.8  # Simple gain for demo

# Start audio
stream = sd.OutputStream(callback=audio_callback)
stream.start()

# Start API server
uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Performance

- **CPU Impact**: <1ms per 30 updates (negligible)
- **WebSocket Latency**: 1-5ms local network
- **Scalability**: 100+ concurrent clients per server
- **Update Rate**: 30 Hz (33ms) - configurable

## Files

| File                             | Purpose                         |
| -------------------------------- | ------------------------------- |
| `daw_core/transport_clock.py`    | Main implementation (550 lines) |
| `daw_core/example_daw_engine.py` | Complete integration example    |
| `TRANSPORT_CLOCK_GUIDE.md`       | Full documentation              |

## Common Tasks

### Get Current Time

```python
state = transport.get_state()
print(f"Time: {state.time_formatted}")  # "00:04.523"
print(f"Beat: {state.beat_pos:.1f}")
print(f"BPM: {state.bpm}")
```

### Seek to Position

```python
transport.seek_seconds(10.5)      # Seek to 10.5 seconds
transport.seek_beat(16)            # Seek to beat 16
```

### Monitor Connected Clients

```python
metrics = transport.get_metrics()
print(f"Clients: {metrics['connected_clients']}")
print(f"Update Rate: {metrics['actual_fps']:.1f} Hz")
```

### Create Tempo-Synced LFO

```python
state = transport.get_state()
# LFO completes one cycle per bar (4 beats)
phase = (state.beat_pos / 4) % 1.0
lfo = np.sin(2 * np.pi * phase)
```

## Troubleshooting

**No WebSocket updates?**

- Verify `transport.update_position(frames)` is called in audio callback
- Check `GET /transport/metrics` shows increasing updates

**Connection refused?**

- Ensure server is running: `http://localhost:8000/docs`
- Use correct URL: `ws://` not `http://` for WebSocket

**High CPU usage?**

- Reduce update frequency: `TransportClock(update_hz=15)` instead of 30
- Check for client disconnection issues

## API Documentation

Interactive Swagger UI: `http://localhost:8000/docs`

## Related Documentation

- **TRANSPORT_CLOCK_GUIDE.md** - Full reference with advanced examples
- **AUDIO_DEVICE_SETTINGS_GUIDE.md** - Audio device configuration
- **daw_core/transport_clock.py** - Source code with inline docs
