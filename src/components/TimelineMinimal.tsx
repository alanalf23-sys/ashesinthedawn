import { useEffect, useState } from "react";

export default function TimelineMinimal() {
  const [time, setTime] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;

    const connect = () => {
      ws = new WebSocket("ws://localhost:8000/ws/transport/clock");

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setTime(data.time_seconds);
      };

      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const position = time * 10;

  return (
    <div className="relative h-32 bg-gray-900 overflow-hidden border-b border-gray-700">
      <div
        style={{ left: `${position}px` }}
        className="absolute top-0 bottom-0 w-0.5 bg-red-500"
      />
      <div className="absolute top-2 left-2 text-xs text-gray-400">
        {connected ? "🟢 Sync" : "🔴 Offline"}
      </div>
    </div>
  );
}
