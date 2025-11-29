import { useEffect, useState, useCallback } from "react";
import { Play, Square, RotateCcw } from "lucide-react";

const API_BASE = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/transport/clock";

interface TransportState {
  playing: boolean;
  time_seconds: number;
  sample_pos: number;
  bpm: number;
  beat_pos: number;
}

/**
 * TransportBarWebSocket - Simple WebSocket-based transport control
 *
 * Features:
 * - Real-time sync from Python backend
 * - Play/Stop/Rewind controls
 * - Keyboard shortcuts (Space for play/stop, R for rewind)
 * - Connection status indicator
 * - Auto-reconnection with exponential backoff
 */
export default function TransportBarWebSocket() {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<TransportState>({
    playing: false,
    time_seconds: 0,
    sample_pos: 0,
    bpm: 120,
    beat_pos: 0,
  });
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // WebSocket connection with auto-reconnect
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log("✓ Connected to transport clock");
          setConnected(true);
          setReconnectAttempts(0);
        };

        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            const newState: TransportState = {
              playing: data.playing ?? false,
              time_seconds: data.time_seconds ?? 0,
              sample_pos: data.sample_pos ?? 0,
              bpm: data.bpm ?? 120,
              beat_pos: data.beat_pos ?? 0,
            };
            setState(newState);
            setPlaying(newState.playing);
            setTime(newState.time_seconds);
          } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setConnected(false);
        };

        ws.onclose = () => {
          console.log("✗ Disconnected from transport clock");
          setConnected(false);
          ws = null;

          // Exponential backoff: 1s, 1.5s, 2.25s, etc., max 10s
          const delay = Math.min(
            1000 * Math.pow(1.5, reconnectAttempts),
            10000
          );
          reconnectTimeout = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, delay);
        };
      } catch (err) {
        console.error("Failed to create WebSocket:", err);
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 10000);
        reconnectTimeout = setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          connect();
        }, delay);
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, [reconnectAttempts]);

  // Toggle play/stop via REST API
  const togglePlay = useCallback(async () => {
    try {
      const endpoint = playing ? "stop" : "play";
      const response = await fetch(`${API_BASE}/transport/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      console.log(`Transport ${endpoint}:`, data);
    } catch (err) {
      console.error(`Failed to ${playing ? "stop" : "play"}:`, err);
    }
  }, [playing]);

  // Rewind to start via REST API
  const rewind = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/transport/stop`, { method: "POST" });
      await fetch(`${API_BASE}/transport/seek?seconds=0`, { method: "POST" });
      console.log("Rewound to start");
    } catch (err) {
      console.error("Failed to rewind:", err);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        rewind();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [playing, togglePlay, rewind]);

  // Format time as MM:SS.ms
  const minutes = Math.floor(time / 60);
  const seconds = (time % 60).toFixed(2);

  return (
    <div className="flex items-center justify-between gap-4 bg-gray-900 p-3 border-b border-gray-700 shadow-md">
      {/* Rewind & Play Controls */}
      <div className="flex gap-2">
        <button
          className="p-2 hover:bg-gray-800 rounded transition text-gray-400 hover:text-gray-200"
          onClick={rewind}
          title="Rewind to start (R)"
        >
          <RotateCcw size={18} />
        </button>

        <button
          className="p-2 hover:bg-gray-800 rounded transition"
          onClick={togglePlay}
          title={playing ? "Stop (Space)" : "Play (Space)"}
        >
          {playing ? (
            <Square size={18} className="text-red-500" />
          ) : (
            <Play size={18} className="text-green-500" />
          )}
        </button>
      </div>

      {/* Time Display */}
      <div className="font-mono text-gray-300 text-sm tabular-nums flex-1">
        {minutes}:{seconds.padStart(5, "0")}
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full transition ${
            connected ? "bg-green-500" : "bg-red-500"
          }`}
          title={connected ? "Synced with backend" : "Offline"}
        />
        <span className="text-xs text-gray-500">
          {connected ? "Sync" : "Offline"}
        </span>
      </div>

      {/* BPM Display */}
      <div className="font-mono text-gray-400 text-xs">
        {state.bpm.toFixed(1)} BPM
      </div>
    </div>
  );
}
