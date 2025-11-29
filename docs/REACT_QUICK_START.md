# Quick Start: React + WebSocket Transport

**Get your first playhead running in 5 minutes**

---

## Step 1: Start Backend (1 minute)

```bash
# Terminal 1
cd c:\Users\Alan\Documents\GitHub\ashesinthedawn
python daw_core/example_daw_engine.py
```

Expected output:

```
INFO:     Started server process [xxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Step 2: Use the Hook (already done!)

Files are created:

- ✅ `src/hooks/useTransportClock.ts` - Both hooks ready
- ✅ `src/components/TimelinePlayhead.tsx` - Full component ready

---

## Step 3: Add Component to App

Open `src/App.tsx` and add TimelinePlayhead:

```tsx
import TimelinePlayhead from "./components/TimelinePlayhead";

export default function App() {
  return (
    <div className="flex flex-col h-screen">
      {/* Your existing UI */}
      <TopBar />

      {/* Add the new playhead component */}
      <TimelinePlayhead />

      {/* Rest of your UI */}
      <TrackList />
      <Mixer />
    </div>
  );
}
```

---

## Step 4: Run Frontend (1 minute)

```bash
# Terminal 2
cd c:\Users\Alan\Documents\GitHub\ashesinthedawn
npm run dev
```

Expected output:

```
VITE v5.4.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

## Step 5: Test It

1. Open http://localhost:5173
2. You should see the TimelinePlayhead component with:
   - Green "Sync" indicator (connected ✓)
   - Time display
   - Play/Stop/Pause buttons
   - Ruler with seconds
   - Smooth blue playhead

Click "Play" and watch the playhead move! ▶️

---

## Minimal Example (10 lines)

If you just want a simple playhead, add this to any component:

```tsx
import { useTransportClock } from "../hooks/useTransportClock";

export default function SimplePlayhead() {
  const { state } = useTransportClock();

  return (
    <div className="h-20 bg-gray-900 relative">
      {/* Playhead moves as time changes */}
      <div
        className="absolute top-0 bottom-0 w-px bg-blue-500"
        style={{ left: `${state.time_seconds * 100}px` }}
      />
    </div>
  );
}
```

---

## With Controls (20 lines)

Add play/pause buttons:

```tsx
import { useTransportClock, useTransportAPI } from "../hooks/useTransportClock";

export default function PlayheadWithControls() {
  const { state, connected } = useTransportClock();
  const api = useTransportAPI();

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Status */}
      <div className={connected ? "text-green-500" : "text-red-500"}>
        {connected ? "🟢 Connected" : "🔴 Disconnected"}
      </div>

      {/* Playhead */}
      <div className="h-20 bg-gray-900 relative">
        <div
          className="absolute top-0 bottom-0 w-px bg-blue-500"
          style={{ left: `${state.time_seconds * 100}px` }}
        />
      </div>

      {/* Time display */}
      <div className="text-gray-300 text-sm">
        {state.time_seconds.toFixed(2)}s @ {state.bpm} BPM
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => api.play()}
          className="px-3 py-1 bg-blue-600 rounded"
        >
          ▶
        </button>
        <button
          onClick={() => api.pause()}
          className="px-3 py-1 bg-yellow-600 rounded"
        >
          ⏸
        </button>
        <button
          onClick={() => api.stop()}
          className="px-3 py-1 bg-red-600 rounded"
        >
          ⏹
        </button>
      </div>
    </div>
  );
}
```

---

## Verify Backend is Running

```bash
# In another terminal, test the endpoint
curl http://localhost:8000/transport/status

# Response:
# {"ok":true,"status":"playing","time":1.234,"beat":0.123,"bpm":120}
```

---

## Verify WebSocket is Working

In browser DevTools console:

```javascript
const ws = new WebSocket("ws://localhost:8000/ws/transport/clock");

ws.onmessage = (e) => {
  console.log("Got message:", JSON.parse(e.data));
};

ws.onopen = () => console.log("Connected!");
ws.onerror = (e) => console.error("Error:", e);
```

You should see messages like:

```javascript
{playing: true, time_seconds: 2.5, sample_pos: 120000, bpm: 120, beat_pos: 0.8}
{playing: true, time_seconds: 2.53, sample_pos: 120576, bpm: 120, beat_pos: 0.81}
...
```

---

## Common Issues

### "Connection refused"

- Backend not running
- Solution: `python daw_core/example_daw_engine.py`

### "Disconnected" indicator

- Browser can't reach backend
- Solution: Check firewall, ensure port 8000 is open

### Playhead doesn't move

- WebSocket connected but not receiving updates
- Solution: Check browser console for errors, verify backend is playing

### Slow updates

- Network latency
- Solution: Try `localhost` instead of `127.0.0.1`

---

## Architecture

```
Browser (React)          Server (Python)
    ↓                         ↑
TimelinePlayhead ━━━━━━━━ transport_clock.py
    ↓                         ↑
useTransportClock()         30 Hz broadcast
    │ WebSocket              │
    └─────────────────────────┘

REST API:
API buttons ━━━━━━━━ /transport/play, stop, seek
    │ HTTP POST              │
    └─────────────────────────┘
```

---

## Next Steps

1. ✅ Backend running (example_daw_engine.py)
2. ✅ Hooks created (useTransportClock.ts)
3. ✅ Component created (TimelinePlayhead.tsx)
4. 📝 Add to your App.tsx
5. 📝 Test in browser
6. 📝 Style to match your UI
7. 📝 Add to other components (Mixer, TrackList, etc.)

---

## File Checklist

- ✅ `src/hooks/useTransportClock.ts` - Created
- ✅ `src/components/TimelinePlayhead.tsx` - Created
- ✅ `daw_core/transport_clock.py` - Already exists
- ✅ `daw_core/example_daw_engine.py` - Already exists
- 📝 Update `src/App.tsx` to import TimelinePlayhead

---

## Connect to Existing Timeline

If you want to integrate with your existing Timeline component:

```tsx
// In Timeline.tsx
import { useTransportClock } from "../hooks/useTransportClock";

export default function Timeline() {
  // OLD: const { tracks, currentTime, ... } = useDAW();

  // NEW: Use WebSocket for real-time updates
  const { state: transport } = useTransportClock();
  const { tracks, getAudioDuration, seek, getWaveformData } = useDAW();

  // Use transport.time_seconds instead of currentTime
  const currentTime = transport.time_seconds;

  // Rest of component stays the same...
}
```

---

## Troubleshooting Checklist

- [ ] Backend running: `python daw_core/example_daw_engine.py`
- [ ] Frontend running: `npm run dev`
- [ ] TimelinePlayhead imported in App.tsx
- [ ] Browser console shows no errors
- [ ] Green "Sync" indicator visible
- [ ] Clicking "Play" makes playhead move
- [ ] Clicking timeline seeks to position
- [ ] Tempo slider adjusts BPM

---

## Reference Commands

```bash
# Start backend
python daw_core/example_daw_engine.py

# Start frontend (in another terminal)
npm run dev

# Test REST API
curl http://localhost:8000/transport/status
curl -X POST http://localhost:8000/transport/play
curl -X POST "http://localhost:8000/transport/seek?seconds=5"

# Run tests
python test_transport_clock.py
```

---

That's it! You now have a real-time connected transport playhead. 🎉

See `REACT_WEBSOCKET_INTEGRATION.md` for advanced usage and `FASTAPI_SOUNDDEVICE_PATTERNS.md` for backend details.
