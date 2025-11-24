# TransportBar WebSocket Integration Guide

## Your Simple Version vs. Production Version

### What You Showed (Simple)

```tsx
import { useEffect, useState } from "react";
import { Play, Stop, RotateCcw } from "lucide-react";

export default function TransportBar() {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/clock");  // ❌ Wrong endpoint
    ws.onmessage = e => {
      const data = JSON.parse(e.data);
      setPlaying(data.playing);
      setTime(data.time_seconds);
    };
    return () => ws.close();
  }, []);
```

**Issues:**

1. ❌ WebSocket URL is `ws://localhost:8000/clock` - should be `ws://localhost:8000/ws/transport/clock`
2. ❌ Fetch paths assume relative URLs - need `http://localhost:8000/transport/play`
3. ❌ No error handling if backend unavailable
4. ❌ No auto-reconnection logic
5. ❌ No connection status indicator
6. ⚠️ WebSocket recreated on every render

---

## Production-Ready Version (TransportBarWebSocket.tsx)

### Key Improvements

#### 1. **Correct Endpoints**

```tsx
const API_BASE = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/transport/clock";

// Correct fetch call
const response = await fetch(`${API_BASE}/transport/${endpoint}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
});
```

#### 2. **Auto-Reconnection with Exponential Backoff**

```tsx
// Exponential backoff: 1s → 1.5s → 2.25s → ... → max 10s
const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 10000);
reconnectTimeout = setTimeout(() => {
  setReconnectAttempts((prev) => prev + 1);
  connect();
}, delay);
```

#### 3. **Connection Status Display**

```tsx
<div
  className={`w-2 h-2 rounded-full transition ${
    connected ? "bg-green-500" : "bg-red-500"
  }`}
  title={connected ? "Synced with backend" : "Offline"}
/>
<span className="text-xs text-gray-500">
  {connected ? "Sync" : "Offline"}
</span>
```

#### 4. **Full State Management**

```tsx
interface TransportState {
  playing: boolean;
  time_seconds: number;
  sample_pos: number;
  bpm: number;
  beat_pos: number;
}
```

#### 5. **Error Handling**

```tsx
ws.onerror = (error) => {
  console.error("WebSocket error:", error);
  setConnected(false);
};

ws.onclose = () => {
  console.log("✗ Disconnected from transport clock");
  setConnected(false);
  // Attempt reconnection...
};
```

---

## Usage

### Option 1: Use the Production Version

```tsx
// App.tsx
import TransportBarWebSocket from "./components/TransportBarWebSocket";

export default function App() {
  return (
    <div>
      <TransportBarWebSocket />
      {/* Rest of app */}
    </div>
  );
}
```

### Option 2: Fix Your Simple Version

Replace these lines in your component:

```tsx
// ❌ BEFORE
const ws = new WebSocket("ws://localhost:8000/clock");
await fetch(`/transport/${playing ? "stop" : "play"}`, { method: "POST" });

// ✅ AFTER
const WS_URL = "ws://localhost:8000/ws/transport/clock";
const API_BASE = "http://localhost:8000";

const ws = new WebSocket(WS_URL);
const response = await fetch(
  `${API_BASE}/transport/${playing ? "stop" : "play"}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }
);
```

---

## Backend Endpoints Reference

### REST Endpoints (HTTP POST)

```
POST /transport/play              # Start playback
POST /transport/stop              # Stop playback
POST /transport/pause             # Pause (keep position)
POST /transport/resume            # Resume from pause
POST /transport/seek?seconds=10   # Seek to position (in seconds)
POST /transport/tempo?bpm=120     # Set BPM
```

### WebSocket Endpoints

```
WS /ws/transport/clock     # Broadcast endpoint (listen only)
                           # Sends: {playing, time_seconds, sample_pos, bpm, beat_pos}
                           # Rate: 30 Hz (every ~33ms)

WS /ws/transport/control   # Control endpoint (can send commands)
                           # Send: {command: "play"|"stop"|"seek", value?: number}
```

### REST Status Endpoints (HTTP GET)

```
GET /transport/status      # Get current state
GET /transport/metrics     # Get performance metrics
GET /                      # API documentation
```

---

## Testing

### Start Backend

```bash
python daw_core/example_daw_engine.py
# or
python daw_core/transport_clock.py
```

### Check Endpoints

```bash
# HTTP endpoint test
curl http://localhost:8000/transport/status

# WebSocket test (in browser console)
const ws = new WebSocket("ws://localhost:8000/ws/transport/clock");
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

### Browser Console

You should see:

```
✓ Connected to transport clock
WebSocket message: {playing: false, time_seconds: 0, ...}
```

---

## Comparison Table

| Feature                     | Your Version | Production Version |
| --------------------------- | ------------ | ------------------ |
| Correct WebSocket URL       | ❌           | ✅                 |
| Correct REST endpoints      | ❌           | ✅                 |
| Error handling              | ❌           | ✅                 |
| Auto-reconnection           | ❌           | ✅                 |
| Exponential backoff         | ❌           | ✅                 |
| Connection status indicator | ❌           | ✅                 |
| Full state management       | ⚠️ Partial   | ✅                 |
| TypeScript types            | ⚠️ Minimal   | ✅                 |
| Keyboard shortcuts          | ✅           | ✅                 |
| BPM display                 | ❌           | ✅                 |
| Comments                    | ❌           | ✅                 |

---

## Quick Migration Path

If you want to keep your simple version and just fix it:

```tsx
import { useEffect, useState } from "react";
import { Play, Stop, RotateCcw } from "lucide-react";

const API_BASE = "http://localhost:8000"; // ADD THIS
const WS_URL = "ws://localhost:8000/ws/transport/clock"; // FIX THIS

export default function TransportBar() {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const ws = new WebSocket(WS_URL); // USE CORRECTED URL
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setPlaying(data.playing);
      setTime(data.time_seconds);
    };
    return () => ws.close();
  }, []);

  async function togglePlay() {
    await fetch(`${API_BASE}/transport/${playing ? "stop" : "play"}`, {
      // FIX THIS
      method: "POST",
    });
  }

  async function rewind() {
    await fetch(`${API_BASE}/transport/stop`, { method: "POST" }); // FIX THIS
    await fetch(`${API_BASE}/transport/seek?seconds=0`, { method: "POST" }); // FIX THIS
  }

  // ... rest unchanged
}
```

---

## File Locations

| File                                       | Purpose                             |
| ------------------------------------------ | ----------------------------------- |
| `src/components/TransportBarWebSocket.tsx` | ✨ Production-ready component (NEW) |
| `src/components/TransportBar.tsx`          | Existing prop-based version         |
| `src/hooks/useTransportClock.ts`           | Hook version (if you prefer hooks)  |
| `daw_core/transport_clock.py`              | Python backend providing endpoints  |
| `daw_core/example_daw_engine.py`           | Example implementation with audio   |

---

## Next Steps

1. **Choose your version:**

   - Simple + fixed = Update URLs in your component
   - Production-ready = Use `TransportBarWebSocket.tsx`
   - Hook-based = Use `useTransportClock` hook in existing component

2. **Test:**

   ```bash
   python daw_core/example_daw_engine.py
   npm run dev
   # Visit http://localhost:5173
   ```

3. **Verify:**

   - ✅ Green "Sync" indicator appears
   - ✅ Click play/stop - backend responds
   - ✅ Time updates smoothly (30 Hz)
   - ✅ Keyboard shortcuts work (Space, R)

4. **Deploy:**
   - Update `API_BASE` and `WS_URL` for production domain
   - Test with multiple tabs (should all sync)
   - Monitor latency in browser DevTools Network tab
