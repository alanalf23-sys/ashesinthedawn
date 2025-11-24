# GUI Features Implementation - Quick Start Guide

**Time to First Working Feature**: 30 minutes
**Prerequisites**: Backend running (`python -m uvicorn daw_core.api:app --reload --port 8000`)

---

## 🏃 30-Minute Quick Start

### Step 1: Create API Client (5 min)

Create `src/lib/apiClient.ts`:

```typescript
/**
 * API Client for CoreLogic Studio Backend
 * Handles all communication with Python DSP backend
 */

const API_BASE = "http://localhost:8000";

export const audioAPI = {
  // Get available effects
  async getEffects() {
    const response = await fetch(`${API_BASE}/effects`);
    if (!response.ok) throw new Error("Failed to fetch effects");
    return response.json();
  },

  // Process audio with effect
  async processEffect(
    effectType: string,
    params: Record<string, number>,
    audioData: number[]
  ) {
    const response = await fetch(`${API_BASE}/process/${effectType}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        effect_type: effectType,
        parameters: params,
        audio_data: audioData,
      }),
    });
    if (!response.ok)
      throw new Error(`Effect processing failed: ${effectType}`);
    return response.json();
  },

  // Get transport status
  async getTransportStatus() {
    const response = await fetch(`${API_BASE}/transport/status`);
    if (!response.ok) throw new Error("Failed to get transport status");
    return response.json();
  },

  // Control transport
  async transportControl(command: "play" | "stop" | "pause" | "resume") {
    const response = await fetch(`${API_BASE}/transport/${command}`, {
      method: "POST",
    });
    if (!response.ok) throw new Error(`Transport command failed: ${command}`);
    return response.json();
  },

  // Seek to time
  async seek(seconds: number) {
    const response = await fetch(`${API_BASE}/transport/seek`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seconds }),
    });
    if (!response.ok) throw new Error("Seek failed");
    return response.json();
  },

  // Set tempo
  async setTempo(bpm: number) {
    const response = await fetch(`${API_BASE}/transport/tempo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: bpm }),
    });
    if (!response.ok) throw new Error("Set tempo failed");
    return response.json();
  },
};
```

---

### Step 2: Create WebSocket Hook (5 min)

Create `src/lib/useTransportWebSocket.ts`:

```typescript
import { useEffect, useState, useCallback } from "react";

export interface TransportState {
  playing: boolean;
  sample_pos: number;
  time_seconds: number;
  time_formatted: string;
  bpm: number;
  beat_pos: number;
  levels?: Record<string, number>;
  peaks?: Record<string, number>;
}

export function useTransportWebSocket(enabled: boolean = true) {
  const [state, setState] = useState<TransportState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reconnect = useCallback(() => {
    if (!enabled) return;

    try {
      const ws = new WebSocket("ws://localhost:8000/ws/transport/clock");

      ws.onopen = () => {
        console.log("[WebSocket] Connected to transport clock");
        setConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as TransportState;
          setState(data);
        } catch (e) {
          console.error("[WebSocket] Failed to parse message:", e);
        }
      };

      ws.onerror = () => {
        setError("WebSocket connection error");
      };

      ws.onclose = () => {
        console.log("[WebSocket] Connection closed");
        setConnected(false);
        // Reconnect after 2 seconds
        setTimeout(reconnect, 2000);
      };

      return ws;
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, [enabled]);

  useEffect(() => {
    const ws = reconnect();
    return () => {
      if (ws) ws.close();
    };
  }, [reconnect, enabled]);

  return { state, connected, error };
}
```

---

### Step 3: Update AudioMeter Component (10 min)

Update `src/components/AudioMeter.tsx`:

```typescript
import { useTransportWebSocket } from "../lib/useTransportWebSocket";

export default function AudioMeter({ trackId }: { trackId: string }) {
  const { state } = useTransportWebSocket();
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState(-60);

  useEffect(() => {
    if (!state?.levels || !trackId) return;

    // Smooth the level (lerp for visual smoothness)
    const newLevel = state.levels[trackId] ?? 0;
    setLevel((prev) => prev * 0.7 + newLevel * 0.3);

    // Update peak
    if (newLevel > peak) {
      setPeak(newLevel);
      // Reset peak after 2 seconds
      const timeout = setTimeout(() => setPeak(-60), 2000);
      return () => clearTimeout(timeout);
    }
  }, [state?.levels, trackId]);

  const getMeterColor = (db: number) => {
    if (db > -3) return "bg-red-600";
    if (db > -8) return "bg-yellow-600";
    if (db > -20) return "bg-green-600";
    return "bg-green-800";
  };

  const dbToPercent = (db: number) => {
    // Convert -60dB to 0dB to 0-100%
    return Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
  };

  return (
    <div className="flex flex-col gap-1 p-2">
      <div className="text-xs text-gray-400">{level.toFixed(1)} dB</div>
      <div className="h-20 bg-gray-800 border border-gray-700 rounded relative overflow-hidden">
        <div
          className={`absolute bottom-0 w-full ${getMeterColor(
            level
          )} transition-all duration-75`}
          style={{ height: `${dbToPercent(level)}%` }}
        />
        {/* Peak indicator */}
        <div
          className="absolute w-full h-0.5 bg-red-400"
          style={{ bottom: `${dbToPercent(peak)}%` }}
        />
      </div>
    </div>
  );
}
```

---

### Step 4: Create Simple Effect Test (10 min)

Create `src/components/EffectTestPanel.tsx`:

```tsx
import { useState } from "react";
import { audioAPI } from "../lib/apiClient";
import { Sliders } from "lucide-react";

export default function EffectTestPanel() {
  const [selectedEffect, setSelectedEffect] = useState("eq_3band");
  const [params, setParams] = useState({ low: 0, mid: 0, high: 0 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const EFFECTS = [
    { id: "eq_3band", name: "3-Band EQ" },
    { id: "compressor", name: "Compressor" },
    { id: "reverb", name: "Reverb" },
    { id: "saturation", name: "Saturation" },
    { id: "delay", name: "Delay" },
  ];

  const handleTest = async () => {
    setLoading(true);
    try {
      // Create test audio (1 second sine wave)
      const sampleRate = 44100;
      const testAudio = new Float32Array(sampleRate);
      for (let i = 0; i < sampleRate; i++) {
        testAudio[i] = Math.sin((i / sampleRate) * 2 * Math.PI * 440) * 0.1;
      }

      const response = await audioAPI.processEffect(
        selectedEffect,
        params,
        Array.from(testAudio)
      );

      setResult(
        `✅ Effect processed successfully! Output: ${response.output_length} samples`
      );
    } catch (error) {
      setResult(`❌ Error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 border border-gray-700 rounded space-y-4">
      <div className="flex items-center gap-2">
        <Sliders size={20} className="text-blue-400" />
        <h3 className="font-semibold">Effect Test Panel</h3>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-gray-400">Select Effect</label>
        <select
          value={selectedEffect}
          onChange={(e) => setSelectedEffect(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        >
          {EFFECTS.map((effect) => (
            <option key={effect.id} value={effect.id}>
              {effect.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-gray-400">Parameters</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(params).map(([key, value]) => (
            <div key={key}>
              <label className="text-xs text-gray-500">{key}</label>
              <input
                type="range"
                min="-20"
                max="20"
                value={value}
                onChange={(e) =>
                  setParams({ ...params, [key]: parseFloat(e.target.value) })
                }
                className="w-full"
              />
              <span className="text-xs text-gray-400">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleTest}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded font-medium"
      >
        {loading ? "Processing..." : "Test Effect"}
      </button>

      {result && (
        <div className="text-sm p-2 bg-gray-700 rounded">{result}</div>
      )}
    </div>
  );
}
```

---

### Step 5: Add to Main App (5 min)

Update `src/App.tsx`:

```tsx
import EffectTestPanel from "./components/EffectTestPanel";

export default function App() {
  // ... existing code ...

  return (
    <DAWProvider>
      <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
        {/* ... existing layout ... */}

        {/* Add this in the bottom mixer section */}
        <div className="h-72 bg-gray-900 border-t border-gray-700 flex flex-col overflow-hidden">
          <div className="flex gap-4 p-4">
            <div className="flex-1">
              <Mixer />
            </div>
            <div className="w-64">
              <EffectTestPanel />
            </div>
          </div>
        </div>
      </div>
    </DAWProvider>
  );
}
```

---

## ✅ Verification Checklist

After implementing, verify:

- [ ] **Backend Running**: `http://localhost:8000/docs` opens FastAPI docs
- [ ] **API Client**: Can import `audioAPI` without errors
- [ ] **WebSocket Connected**: Check browser console for "Connected to transport clock"
- [ ] **Meters Working**: Meters show real data from WebSocket
- [ ] **Effect Test**: Can select effect and click "Test Effect" button
- [ ] **No TypeScript Errors**: `npm run typecheck` returns 0 errors
- [ ] **App Still Loads**: `npm run dev` starts without errors

---

## 🎯 Next Steps After This Works

1. **Add all 19 effects** to EffectTestPanel dropdown
2. **Wire effect chains** - apply multiple effects in sequence
3. **Add automation** - record and playback parameter changes
4. **Implement recording** - capture audio to waveform
5. **Add file I/O** - save/load projects

---

## 🐛 Troubleshooting

### "Backend connection refused"

- Make sure Python backend is running: `python -m uvicorn daw_core.api:app --reload --port 8000`

### "WebSocket connection error"

- Check backend is serving WebSocket on port 8000
- Check browser console for CORS errors

### "TypeScript errors"

- Run `npm run typecheck` to see all issues
- Add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` for window type issues

### "Effect processing returns error"

- Check Python backend logs for error details
- Verify audio data format matches expected shape

---

**Ready?** Start with Step 1! You'll have a working metering system in 30 minutes. 🚀
