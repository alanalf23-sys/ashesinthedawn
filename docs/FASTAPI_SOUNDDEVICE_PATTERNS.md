# FastAPI + sounddevice Integration Guide

**Complete patterns for connecting FastAPI WebSocket with real-time audio**

---

## Quick Pattern Reference

### Pattern 1: Dict-Based State (Simple)

```python
# Minimal state management
transport = {
    "playing": False,
    "sample_pos": 0,
    "start_time": 0.0,
}

# Endpoints
@app.post("/transport/play")
async def play():
    transport["playing"] = True
    transport["start_time"] = time.time()
    return {"ok": True}

@app.post("/transport/stop")
async def stop():
    transport["playing"] = False
    return {"ok": True}
```

**Best for**: Learning, simple playback, single client

---

### Pattern 2: TransportClock (Full-Featured)

```python
# Rich state management with built-in features
from daw_core.transport_clock import get_transport_clock

transport = get_transport_clock(48000, 512, 120)

# Endpoints
@app.post("/transport/play")
async def play():
    transport.play()
    return {"status": "playing"}

@app.post("/transport/stop")
async def stop():
    transport.stop()
    return {"status": "stopped"}
```

**Best for**: Production DAW, multi-client, beat sync

---

## Audio Callback Integration

### Critical Pattern: Update Transport on Every Buffer

```python
def audio_callback(indata, outdata, frames, time_info, status):
    """Called by sounddevice for every audio buffer."""

    # STEP 1: Update transport position FIRST
    transport.update_position(frames)  # Dict: state["sample_pos"] += frames

    # STEP 2: Process audio
    # ... your DSP code ...

    # STEP 3: Output
    outdata[:] = processed_audio
```

### Timing Example

```
AudioCallback Timeline (48kHz, 256 samples ≈ 5.3ms):
├─ 0ms: sounddevice calls callback()
├─ 0.1ms: Update transport position
├─ 0.5ms: Process audio (DSP)
├─ 5.0ms: Output buffer filled
└─ 5.3ms: Return to sounddevice, next callback queued
```

---

## Correct Threading Model

### WRONG: Mixing asyncio + sounddevice incorrectly

```python
# ❌ DON'T DO THIS - will deadlock
with sd.Stream(callback=callback):
    asyncio.run(app())  # Blocks forever!
```

### CORRECT: Run them separately

```python
# ✓ DO THIS - sounddevice in thread, FastAPI in main
import threading

# Start audio in background
audio_thread = threading.Thread(
    target=lambda: sd.OutputStream(callback=callback),
    daemon=True
)
audio_thread.start()

# Run FastAPI in main thread
uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Or use IntegratedAudioEngine class

```python
engine = IntegratedAudioEngine()
engine.start_audio()  # Starts sounddevice in thread

# Then start FastAPI
uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## Complete Working Examples

### Example 1: Dict-Based (50 lines)

```python
from fastapi import FastAPI, WebSocket
import sounddevice as sd
import time

app = FastAPI()

# Simple state dict
transport = {
    "playing": False,
    "sample_pos": 0,
}

SAMPLE_RATE = 48000
BLOCK = 512

def audio_callback(indata, outdata, frames, time_info, status):
    if transport["playing"]:
        transport["sample_pos"] += frames
    outdata[:] = indata

@app.post("/play")
async def play():
    transport["playing"] = True
    return {"ok": True}

@app.post("/stop")
async def stop():
    transport["playing"] = False
    return {"ok": True}

@app.get("/status")
async def status():
    return {
        "playing": transport["playing"],
        "time": transport["sample_pos"] / SAMPLE_RATE,
    }

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    while True:
        await ws.send_json({
            "playing": transport["playing"],
            "time": transport["sample_pos"] / SAMPLE_RATE,
        })
        await asyncio.sleep(0.033)

if __name__ == "__main__":
    # Start audio
    with sd.OutputStream(callback=audio_callback):
        # Run FastAPI
        import uvicorn
        uvicorn.run(app, port=8000)
```

---

### Example 2: Full Integration (IntegratedAudioEngine)

```python
from daw_core.integration_patterns import (
    IntegratedAudioEngine,
    create_simple_transport_app
)
import uvicorn

# Create app and engine
app, transport = create_simple_transport_app(48000, 512)
engine = IntegratedAudioEngine(48000, 512)

# Start audio
engine.start_audio()

# Run FastAPI
uvicorn.run(app, host="0.0.0.0", port=8000)

# Cleanup
engine.stop_audio()
```

---

## API Endpoint Patterns

### Play Command with Error Handling

```python
@app.post("/transport/play")
async def play():
    """Start playback - with proper error handling."""
    try:
        if not transport["playing"]:
            transport["playing"] = True
            transport["start_time"] = time.time()
            logger.info("▶️  Playback started")

        return {
            "ok": True,
            "status": "playing",
            "time": transport["sample_pos"] / SAMPLE_RATE,
        }
    except Exception as e:
        logger.error(f"Play error: {e}")
        return {"ok": False, "error": str(e)}, 500
```

### Stop Command with State Validation

```python
@app.post("/transport/stop")
async def stop():
    """Stop playback - with proper state transition."""
    try:
        if transport["playing"]:
            transport["playing"] = False
            logger.info("⏹️  Playback stopped")

        return {
            "ok": True,
            "status": "stopped",
            "time": transport["sample_pos"] / SAMPLE_RATE,
        }
    except Exception as e:
        logger.error(f"Stop error: {e}")
        return {"ok": False, "error": str(e)}, 500
```

### Seek Command with Bounds Checking

```python
@app.post("/transport/seek")
async def seek(seconds: float):
    """Seek to time position - with validation."""
    try:
        # Validate input
        if seconds < 0:
            return {"ok": False, "error": "Time cannot be negative"}, 400

        # Convert to samples
        samples = int(seconds * SAMPLE_RATE)
        transport["sample_pos"] = samples

        # Reset timing if playing
        if transport["playing"]:
            transport["start_time"] = time.time()

        logger.info(f"↪️  Seek to {seconds}s ({samples} samples)")

        return {
            "ok": True,
            "time": transport["sample_pos"] / SAMPLE_RATE,
        }
    except ValueError:
        return {"ok": False, "error": "Invalid time value"}, 400
    except Exception as e:
        logger.error(f"Seek error: {e}")
        return {"ok": False, "error": str(e)}, 500
```

---

## WebSocket Broadcast Patterns

### Pattern 1: Simple Loop (Dict-Based)

```python
@app.websocket("/ws/transport")
async def websocket_transport(ws: WebSocket):
    """Broadcast transport state every 33ms (30 Hz)."""
    await ws.accept()

    try:
        while True:
            # Send state
            await ws.send_json({
                "playing": transport["playing"],
                "sample_pos": transport["sample_pos"],
                "time": transport["sample_pos"] / SAMPLE_RATE,
            })

            # 33ms = 30 Hz (smooth UI updates)
            await asyncio.sleep(0.033)
    except WebSocketDisconnect:
        logger.info("Client disconnected")
```

### Pattern 2: Built-In Broadcast (TransportClock)

```python
@app.websocket("/ws/transport")
async def websocket_transport(ws: WebSocket):
    """Use TransportClock's built-in broadcast."""
    await transport.register_client(ws)

    try:
        while True:
            data = await ws.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        await transport.unregister_client(ws)
```

---

## Performance Tips

### 1. Keep Audio Callback Fast

```python
# ❌ SLOW - blocking operations in callback
def audio_callback(indata, outdata, frames, time_info, status):
    time.sleep(0.001)  # NEVER DO THIS!
    result = requests.get("http://api.example.com/effect")  # NEVER!

# ✓ FAST - only non-blocking operations
def audio_callback(indata, outdata, frames, time_info, status):
    transport["sample_pos"] += frames  # ✓ Fast
    outdata[:] = indata * 0.8  # ✓ Fast
```

### 2. Use Context Manager for Stream

```python
# Good - automatic cleanup
with sd.OutputStream(callback=audio_callback) as stream:
    stream.start()
    # ... do something ...
    stream.stop()

# Better - explicit control
stream = sd.OutputStream(callback=audio_callback)
stream.start()
try:
    # ... do something ...
finally:
    stream.stop()
    stream.close()
```

### 3. Monitor Callback Performance

```python
import time

callback_times = []

def audio_callback(indata, outdata, frames, time_info, status):
    start = time.perf_counter()

    # ... do processing ...
    transport["sample_pos"] += frames
    outdata[:] = indata

    elapsed = (time.perf_counter() - start) * 1000
    callback_times.append(elapsed)

    # Log if too slow
    if elapsed > 5.0:  # More than 5ms for 256 samples @ 48kHz
        logger.warning(f"Slow callback: {elapsed:.2f}ms")

# Print statistics
print(f"Avg callback: {np.mean(callback_times):.2f}ms")
print(f"Max callback: {np.max(callback_times):.2f}ms")
```

---

## Debugging Checklist

| Issue                | Cause                 | Solution                                        |
| -------------------- | --------------------- | ----------------------------------------------- |
| No audio             | Callback not called   | Check device index, check BLOCK size            |
| Stuttering/clicks    | Callback too slow     | Profile with time.perf_counter()                |
| No WebSocket updates | Transport not updated | Check `transport.update_position()` in callback |
| Connection refused   | Server not running    | Check port 8000, check firewall                 |
| Dict state stale     | Not thread-safe       | Add thread.Lock() if needed                     |
| High CPU load        | Too much DSP          | Reduce BLOCK size or DSP complexity             |

---

## Migration Path: Dict → TransportClock

### Step 1: Keep Dict, Add TransportClock

```python
from daw_core.transport_clock import get_transport_clock

# Keep existing dict endpoints
transport_dict = {...}

# Add TransportClock alongside
transport_clock = get_transport_clock()

# Update audio callback to use both
def audio_callback(indata, outdata, frames, time_info, status):
    transport_dict["sample_pos"] += frames
    transport_clock.update_position(frames)  # Sync
    outdata[:] = indata
```

### Step 2: Use TransportClock in New Endpoints

```python
@app.post("/transport/play")
async def play():
    # Old dict version
    transport_dict["playing"] = True

    # New TransportClock version
    transport_clock.play()

    return {"ok": True}
```

### Step 3: Remove Dict Endpoints

```python
# Delete old endpoints, keep only TransportClock
@app.post("/transport/play")
async def play():
    transport_clock.play()
    return {"status": "playing"}
```

---

## Complete Reference Files

| File                               | Purpose             | Lines |
| ---------------------------------- | ------------------- | ----- |
| `daw_core/integration_patterns.py` | Both patterns       | 400+  |
| `daw_core/transport_clock.py`      | Full TransportClock | 556   |
| `daw_core/example_daw_engine.py`   | Integration example | 330   |
| `test_transport_clock.py`          | Test suite          | 200+  |

---

## Usage: Run Examples

### Run Simple Dict-Based Example

```bash
python daw_core/integration_patterns.py run
```

### Run Full TransportClock Example

```bash
python daw_core/example_daw_engine.py
```

### Run Tests

```bash
python test_transport_clock.py 1  # Basic connectivity
python test_transport_clock.py 3  # Multi-client
```

---

## Key Takeaways

✅ **Update transport position in audio callback** - Every buffer!
✅ **Use error handling in endpoints** - Try/except with logging
✅ **Keep audio callback fast** - No blocking operations
✅ **Separate audio thread from FastAPI thread** - No asyncio.run() in stream context
✅ **Validate endpoint inputs** - Bounds check, type check
✅ **Monitor performance** - Use perf_counter() for profiling

---

## Related Documentation

- **TRANSPORT_CLOCK_GUIDE.md** - Full TransportClock reference
- **AUDIO_DEVICE_SETTINGS_GUIDE.md** - Audio device configuration
- **daw_core/transport_clock.py** - Source code with docstrings
