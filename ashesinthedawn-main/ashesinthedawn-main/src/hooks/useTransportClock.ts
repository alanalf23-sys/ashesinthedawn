import { useEffect, useState, useRef, useCallback } from "react";

interface TransportState {
  playing: boolean;
  time_seconds: number;
  sample_pos: number;
  bpm: number;
  beat_pos: number;
  loop_enabled?: boolean;
  loop_start_seconds?: number;
  loop_end_seconds?: number;
}

/**
 * Hook for connecting to WebSocket transport clock
 * Handles connection lifecycle, reconnection, and state updates
 */
export function useTransportClock(
  wsUrl: string = "ws://localhost:8000/ws/transport/clock"
) {
  const [state, setState] = useState<TransportState>({
    playing: false,
    time_seconds: 0,
    sample_pos: 0,
    bpm: 120,
    beat_pos: 0,
    loop_enabled: false,
    loop_start_seconds: 0,
    loop_end_seconds: 10,
  });

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  // Connect to WebSocket
  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("✓ Connected to transport clock");
          setConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setState({
              playing: data.playing ?? false,
              time_seconds: data.time_seconds ?? 0,
              sample_pos: data.sample_pos ?? 0,
              bpm: data.bpm ?? 120,
              beat_pos: data.beat_pos ?? 0,
            });
          } catch (err) {
            console.error("Failed to parse transport message:", err);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setError("Connection error");
        };

        ws.onclose = () => {
          console.log("✗ Disconnected from transport clock");
          setConnected(false);
          wsRef.current = null;

          // Attempt reconnection
          if (reconnectAttemptsRef.current < 10) {
            const delay = Math.min(
              1000 * Math.pow(1.5, reconnectAttemptsRef.current),
              30000
            );
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++;
              console.log(
                `Reconnecting... (attempt ${reconnectAttemptsRef.current})`
              );
              connect();
            }, delay);
          } else {
            setError("Failed to connect after 10 attempts");
          }
        };

        wsRef.current = ws;
      } catch (err) {
        console.error("Failed to create WebSocket:", err);
        setError(String(err));
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsUrl]);

  const send = useCallback((command: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command));
    } else {
      console.warn("WebSocket not connected, cannot send command");
    }
  }, []);

  return {
    state,
    connected,
    error,
    send,
  };
}

/**
 * Hook for REST API control (play, stop, seek, etc.)
 */
export function useTransportAPI(baseUrl: string = "http://localhost:8000") {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(
    async (
      endpoint: string,
      method: string = "POST",
      data?: Record<string, unknown>
    ) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${baseUrl}${endpoint}`, {
          method,
          headers: { "Content-Type": "application/json" },
          body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  return {
    play: () => request("/transport/play"),
    stop: () => request("/transport/stop"),
    pause: () => request("/transport/pause"),
    resume: () => request("/transport/resume"),
    seek: (seconds: number) => request(`/transport/seek?seconds=${seconds}`),
    setTempo: (bpm: number) => request(`/transport/tempo?bpm=${bpm}`),
    getStatus: () => request("/transport/status", "GET"),
    getMetrics: () => request("/transport/metrics", "GET"),
    error,
    loading,
  };
}
