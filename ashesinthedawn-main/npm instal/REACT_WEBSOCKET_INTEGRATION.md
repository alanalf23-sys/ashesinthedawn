# React WebSocket Transport Integration Guide

**Complete guide for connecting React components to Python FastAPI transport clock**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
├─────────────────────────────────────────────────────────────┤
│  Components (TimelinePlayhead, TransportBar, etc.)           │
│       ↓                                                      │
│  useTransportClock hook (WebSocket)                         │
│  useTransportAPI hook (REST API)                            │
│       ↓ (ws://localhost:8000/ws/transport/clock)            │
│       ↓ (http://localhost:8000/transport/...)               │
├─────────────────────────────────────────────────────────────┤
│            Python FastAPI Transport Clock                    │
│  (daw_core/transport_clock.py)                              │
│       ↓                                                      │
│  Audio Callback (sounddevice)                               │
│  Updates position every 5-50ms based on sample rate         │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup Steps

### 1. Create Hooks Directory

```bash
mkdir -p src/hooks
```

### 2. Create useTransportClock Hook

File: `src/hooks/useTransportClock.ts` (already created)

```typescript
import { useTransportClock, useTransportAPI } from "../hooks/useTransportClock";

// In any component:
const { state, connected, error } = useTransportClock();
const api = useTransportAPI();
```

### 3. Use in Components

```typescript
export default function MyComponent() {
  const { state: transport, connected } = useTransportClock();

  return (
    <div>
      Time: {transport.time_seconds.toFixed(2)}s Status:{" "}
      {connected ? "Online" : "Offline"}
    </div>
  );
}
```

---

## Hook API Reference

### useTransportClock Hook

**Purpose**: Real-time WebSocket connection to transport clock

**Parameters**:

```typescript
useTransportClock(
  wsUrl?: string  // Default: 'ws://localhost:8000/ws/transport/clock'
)
```

**Returns**:

```typescript
{
  state: {
    playing: boolean;
    time_seconds: number;
    sample_pos: number;
    bpm: number;
    beat_pos: number;
  },
  connected: boolean;
  error: string | null;
  send: (command: Record<string, unknown>) => void;
}
```

**Features**:

- ✅ Automatic reconnection (up to 10 attempts)
- ✅ Exponential backoff (max 30 seconds)
- ✅ Error handling and logging
- ✅ Clean connection on unmount
- ✅ Smooth 30 Hz updates

**Example**:

```typescript
const { state, connected, error, send } = useTransportClock();

return (
  <div>
    <div className={connected ? "text-green-500" : "text-red-500"}>
      {connected ? "🔵 Connected" : "⚫ Disconnected"}
    </div>
    {error && <div className="text-red-500">{error}</div>}
    <div>Time: {state.time_seconds.toFixed(2)}s</div>
    <div>Tempo: {state.bpm} BPM</div>
  </div>
);
```

---

### useTransportAPI Hook

**Purpose**: REST API control for play, stop, seek, tempo

**Parameters**:

```typescript
useTransportAPI(
  baseUrl?: string  // Default: 'http://localhost:8000'
)
```

**Returns**:

```typescript
{
  play: () => Promise<any>;
  stop: () => Promise<any>;
  pause: () => Promise<any>;
  resume: () => Promise<any>;
  seek: (seconds: number) => Promise<any>;
  setTempo: (bpm: number) => Promise<any>;
  getStatus: () => Promise<any>;
  getMetrics: () => Promise<any>;
  error: string | null;
  loading: boolean;
}
```

**Example**:

```typescript
const api = useTransportAPI();

return (
  <div className="flex gap-2">
    <button onClick={() => api.play()}>Play</button>
    <button onClick={() => api.pause()}>Pause</button>
    <button onClick={() => api.seek(10)}>Seek to 10s</button>
    <input
      type="number"
      onChange={(e) => api.setTempo(Number(e.target.value))}
      placeholder="BPM"
    />
    {api.loading && <span>Loading...</span>}
    {api.error && <span className="text-red-500">{api.error}</span>}
  </div>
);
```

---

## Complete Component Examples

### Example 1: Simple Playhead

```typescript
import { useTransportClock } from "../hooks/useTransportClock";

export default function SimplePlayhead() {
  const { state } = useTransportClock();

  return (
    <div className="relative h-20 bg-panel">
      {/* Playhead position = time * pixels */}
      <div
        className="absolute top-0 bottom-0 w-px bg-blue-500"
        style={{ left: `${(state.time_seconds % 10) * 100}px` }}
      />
    </div>
  );
}
```

### Example 2: Transport Controls

```typescript
import { useTransportAPI, useTransportClock } from "../hooks/useTransportClock";

export default function TransportControls() {
  const api = useTransportAPI();
  const { state, connected } = useTransportClock();

  return (
    <div className="flex gap-2 p-4 bg-gray-900 rounded">
      <button
        onClick={() => api.play()}
        disabled={!connected}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        ▶ Play
      </button>
      <button
        onClick={() => api.pause()}
        disabled={!connected}
        className="px-4 py-2 bg-yellow-600 text-white rounded disabled:opacity-50"
      >
        ⏸ Pause
      </button>
      <button
        onClick={() => api.stop()}
        disabled={!connected}
        className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
      >
        ⏹ Stop
      </button>
      <input
        type="number"
        placeholder="Time (seconds)"
        onChange={(e) => api.seek(Number(e.target.value))}
        disabled={!connected}
        className="px-2 py-2 bg-gray-800 text-white rounded disabled:opacity-50"
      />
      <span className={connected ? "text-green-500" : "text-red-500"}>
        {connected ? "●" : "○"} {connected ? "Connected" : "Offline"}
      </span>
    </div>
  );
}
```

### Example 3: Timeline with Ruler and Beats

```typescript
import { useTransportClock, useTransportAPI } from "../hooks/useTransportClock";
import { useState } from "react";

export default function AdvancedTimeline() {
  const { state, connected } = useTransportClock();
  const api = useTransportAPI();
  const [zoom, setZoom] = useState(100);

  const pixelsPerSecond = zoom;
  const playheadX = state.time_seconds * pixelsPerSecond;

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-950 border-b border-gray-700 px-4 py-2 flex justify-between">
        <div className="text-sm text-gray-300">
          {formatTime(state.time_seconds)} @ {state.bpm} BPM
        </div>
        <div>
          <label className="text-xs text-gray-400 mr-2">Zoom:</label>
          <input
            type="range"
            min="50"
            max="400"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-32"
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 relative overflow-x-auto bg-gray-800">
        {/* Ruler */}
        <div className="absolute top-0 left-0 h-6 bg-gray-950 border-b border-gray-700">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute text-xs text-gray-500"
              style={{ left: `${i * pixelsPerSecond}px` }}
            >
              {i}s
            </div>
          ))}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-6 bottom-0 w-px bg-blue-500"
          style={{ left: `${playheadX}px` }}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full" />
        </div>

        {/* Beat marks */}
        <div className="absolute top-6 left-0 w-full h-full">
          {[...Array(100)].map((_, i) => {
            const beatsPerSec = state.bpm / 60;
            const x = (i / beatsPerSec) * pixelsPerSecond;
            return (
              <div
                key={`beat-${i}`}
                className={`absolute bg-gray-700 ${
                  i % 4 === 0 ? "h-4" : "h-2"
                }`}
                style={{
                  left: `${x}px`,
                  width: "1px",
                  top: i % 4 === 0 ? "0px" : "6px",
                }}
              />
            );
          })}
        </div>

        {/* Click to seek */}
        <div
          className="absolute top-6 left-0 right-0 bottom-0 cursor-pointer"
          onClick={(e) => {
            const rect = (
              e.currentTarget as HTMLDivElement
            ).getBoundingClientRect();
            const x = e.clientX - rect.left;
            api.seek(x / pixelsPerSecond);
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-gray-950 border-t border-gray-700 px-4 py-2 flex gap-2">
        <button
          onClick={() => api.play()}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          ▶
        </button>
        <button
          onClick={() => api.pause()}
          className="px-3 py-1 bg-yellow-600 text-white rounded"
        >
          ⏸
        </button>
        <button
          onClick={() => api.stop()}
          className="px-3 py-1 bg-red-600 text-white rounded"
        >
          ⏹
        </button>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
```

---

## Integration with DAWContext

### Sync Transport Clock with DAW State

```typescript
import { useDAW } from "../contexts/DAWContext";
import { useTransportClock, useTransportAPI } from "../hooks/useTransportClock";
import { useEffect } from "react";

export default function SyncedTransportComponent() {
  const { currentTime, togglePlay, isPlaying } = useDAW();
  const { state: transport, connected } = useTransportClock();
  const api = useTransportAPI();

  // Sync DAW time with transport clock
  useEffect(() => {
    // When transport updates, you can update DAW state
    // (if needed for other components)
    console.log(`Transport: ${transport.time_seconds}s, DAW: ${currentTime}s`);
  }, [transport.time_seconds, currentTime]);

  return (
    <div className="flex gap-2">
      <button
        onClick={() => {
          if (connected) {
            api.play();
          } else {
            togglePlay(); // Fallback to DAW
          }
        }}
      >
        Play
      </button>
      <div>
        {transport.playing ? "▶" : "⏹"} {transport.time_seconds.toFixed(2)}s
      </div>
    </div>
  );
}
```

---

## Debugging

### Enable Console Logging

Add to your component:

```typescript
useEffect(() => {
  console.log("Transport state:", state);
  console.log("Connected:", connected);
  console.log("Error:", error);
}, [state, connected, error]);
```

### Check WebSocket Connection

In browser DevTools:

```javascript
// Open browser console
const ws = new WebSocket("ws://localhost:8000/ws/transport/clock");
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

### Check REST API

```bash
# Terminal
curl http://localhost:8000/transport/status

# Response:
# {"ok": true, "status": "playing", "time": 12.5, ...}
```

---

## Performance Optimization

### 1. Memoize Expensive Calculations

```typescript
import { useMemo } from "react";

export default function OptimizedPlayhead() {
  const { state } = useTransportClock();

  const playheadX = useMemo(
    () => state.time_seconds * 100,
    [state.time_seconds]
  );

  return <div style={{ left: `${playheadX}px` }} />;
}
```

### 2. Throttle Updates

```typescript
import { useRef, useCallback } from "react";

export default function ThrottledPlayhead() {
  const { state } = useTransportClock();
  const lastUpdateRef = useRef(0);
  const [displayTime, setDisplayTime] = useState(0);

  const updateDisplay = useCallback(() => {
    const now = performance.now();
    if (now - lastUpdateRef.current > 50) {
      // Update max 20x/sec
      setDisplayTime(state.time_seconds);
      lastUpdateRef.current = now;
    }
  }, [state.time_seconds]);

  return <div>{displayTime.toFixed(2)}s</div>;
}
```

### 3. Use useMemo for Complex Renders

```typescript
const beatMarks = useMemo(() => {
  const beatsPerSec = state.bpm / 60;
  return [...Array(100)].map((_, i) => ({
    x: (i / beatsPerSec) * zoom,
    isBigBeat: i % 4 === 0,
  }));
}, [state.bpm, zoom]);
```

---

## Troubleshooting

| Problem                   | Cause                   | Solution                                                    |
| ------------------------- | ----------------------- | ----------------------------------------------------------- |
| WebSocket won't connect   | Backend not running     | `python daw_core/example_daw_engine.py`                     |
| Connection keeps dropping | Network issue           | Check firewall, try `localhost:8000`                        |
| No state updates          | WebSocket not receiving | Check Python `transport.broadcast_state()`                  |
| High CPU usage            | Too many renders        | Use `useMemo`, throttle updates                             |
| Playhead jumps            | State sync issue        | Check `transport.update_position(frames)` in audio callback |
| API calls fail            | Endpoint not found      | Check transport_clock.py routes                             |

---

## Files Reference

| File                                  | Purpose                          | Lines |
| ------------------------------------- | -------------------------------- | ----- |
| `src/hooks/useTransportClock.ts`      | React hooks for WebSocket + REST | 180+  |
| `src/components/TimelinePlayhead.tsx` | Complete timeline component      | 180+  |
| `daw_core/transport_clock.py`         | FastAPI server                   | 556   |
| `FASTAPI_SOUNDDEVICE_PATTERNS.md`     | Integration patterns guide       | 400+  |

---

## Next Steps

1. **Backend Setup**: Run `python daw_core/example_daw_engine.py`
2. **Test WebSocket**: Open browser console, create WebSocket to `ws://localhost:8000/ws/transport/clock`
3. **Add Components**: Import TimelinePlayhead or create custom components using hooks
4. **Sync with DAWContext**: Connect transport state to existing DAW state if needed
5. **Style as needed**: Customize with Tailwind utilities

---

## API Endpoints Reference

### REST Endpoints (via useTransportAPI)

```
POST /transport/play          → api.play()
POST /transport/stop          → api.stop()
POST /transport/pause         → api.pause()
POST /transport/resume        → api.resume()
POST /transport/seek?seconds=10 → api.seek(10)
POST /transport/tempo?bpm=120 → api.setTempo(120)
GET /transport/status         → api.getStatus()
GET /transport/metrics        → api.getMetrics()
```

### WebSocket Endpoints (via useTransportClock)

```
WS /ws/transport/clock    → Real-time state broadcast (30 Hz)
WS /ws/transport/control  → Command input
```

### Response Format

```typescript
// WebSocket message
{
  "playing": true,
  "time_seconds": 12.5,
  "sample_pos": 600000,
  "bpm": 120,
  "beat_pos": 1.2
}

// REST response
{
  "ok": true,
  "status": "playing",
  "time": 12.5,
  "beat": 1.2,
  "bpm": 120
}
```
