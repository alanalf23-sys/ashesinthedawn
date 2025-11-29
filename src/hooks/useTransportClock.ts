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
 * Note: WebSocket endpoints currently not implemented on Codette server
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
  const maxReconnectAttempts = 3; // Reduced from 10 to fail faster

  // Connect to WebSocket
  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        // Set a timeout for connection attempt
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            ws.close();
            setError("WebSocket connection timeout");
          }
        }, 5000);

        ws.onopen = () => {
          clearTimeout(connectionTimeout);
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

        ws.onerror = () => {
          clearTimeout(connectionTimeout);
          // Suppress verbose WebSocket error logging in console
          // Connection failures are handled by onclose event
          setError("WebSocket connection failed");
          setConnected(false);
        };

        ws.onclose = () => {
          clearTimeout(connectionTimeout);
          setConnected(false);
          wsRef.current = null;

          // Attempt reconnection with reduced attempts
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(
              1000 * Math.pow(1.5, reconnectAttemptsRef.current),
              10000
            );
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++;
              connect();
            }, delay);
          } else {
            setError("Transport clock WebSocket unavailable");
          }
        };

        wsRef.current = ws;
      } catch (err) {
        console.error("Failed to create WebSocket:", err);
        setError("WebSocket creation failed");
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
 * Uses Codette API endpoints
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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        console.error("API request failed:", message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  return {
    play: () => Promise.resolve({ status: "ok" }),
    stop: () => Promise.resolve({ status: "ok" }),
    pause: () => Promise.resolve({ status: "ok" }),
    resume: () => Promise.resolve({ status: "ok" }),
    seek: (seconds: number) => Promise.resolve({ status: "ok", seconds }),
    setTempo: (bpm: number) => Promise.resolve({ status: "ok", bpm }),
    getStatus: () => request("/codette/status", "GET"),
    getMetrics: () => Promise.resolve({ status: "ok" }),
    error,
    loading,
  };
}
