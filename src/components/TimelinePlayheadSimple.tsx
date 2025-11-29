import { useEffect, useState } from "react";

/**
 * TimelinePlayheadSimple - Minimal WebSocket-based playhead
 *
 * Simple version that matches basic use case:
 * - Connect to WebSocket for time_seconds
 * - Animate playhead position
 * - Use 10px per second for scaling
 */
export default function TimelinePlayheadSimple() {
  const [time, setTime] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        // ✅ CORRECT endpoint
        ws = new WebSocket("ws://localhost:8000/ws/transport/clock");

        ws.onopen = () => {
          console.log("✓ Connected to transport clock");
          setConnected(true);
        };

        ws.onmessage = (e) => {
          const data = JSON.parse(e.data);
          setTime(data.time_seconds);
        };

        ws.onerror = () => {
          console.error("WebSocket error");
          setConnected(false);
        };

        ws.onclose = () => {
          console.log("✗ Disconnected from transport clock");
          setConnected(false);
          ws = null;
          // Reconnect after 2 seconds
          reconnectTimeout = setTimeout(connect, 2000);
        };
      } catch (err) {
        console.error("Failed to connect:", err);
        reconnectTimeout = setTimeout(connect, 2000);
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Convert seconds → pixels (10px per second)
  const position = time * 10;

  return (
    <div className="relative h-32 bg-gray-900 overflow-hidden border-b border-gray-700">
      {/* Playhead indicator */}
      <div
        style={{ left: `${position}px` }}
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 transition-all duration-[30ms] ease-linear"
      />

      {/* Connection status */}
      <div className="absolute top-2 left-2 flex items-center gap-2 text-xs">
        <div
          className={`w-2 h-2 rounded-full ${
            connected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-gray-400">{connected ? "Sync" : "Offline"}</span>
      </div>

      {/* Time display */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 font-mono text-sm text-gray-300">
        {Math.floor(time / 60)}:{(time % 60).toFixed(2).padStart(5, "0")}
      </div>
    </div>
  );
}
