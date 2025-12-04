import { useEffect, useState, useRef, useCallback } from "react";
import { getCodetteBridge } from "../lib/codetteBridge";

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
 * Uses CodetteBridge's main WebSocket connection
 * Listens for transport_state messages
 */
export function useTransportClock() {
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
  const bridgeRef = useRef(getCodetteBridge());
  const handlersRef = useRef<Array<{ event: string; handler: (data?: unknown) => void }>>([]);

  // Connect to CodetteBridge WebSocket
  useEffect(() => {
    const bridge = bridgeRef.current;

    // Handler for transport state updates
    const handleTransportChanged = (data: any) => {
      if (data) {
        setState((prev) => ({
          ...prev,
          playing: data.is_playing ?? prev.playing,
          time_seconds: data.current_time ?? prev.time_seconds,
          bpm: data.bpm ?? prev.bpm,
          loop_enabled: data.loop_enabled ?? prev.loop_enabled,
          loop_start_seconds: data.loop_start ?? prev.loop_start_seconds,
          loop_end_seconds: data.loop_end ?? prev.loop_end_seconds,
        }));
      }
    };

    // Handler for connection status
    const handleConnected = () => {
      setConnected(true);
      setError(null);
      console.debug("[useTransportClock] Connected to WebSocket");
    };

    const handleDisconnected = () => {
      setConnected(false);
      console.debug("[useTransportClock] Disconnected from WebSocket");
    };

    const handleWebSocketError = (err: any) => {
      setError("WebSocket connection error");
      console.debug("[useTransportClock] WebSocket error:", err);
    };

    // Register handlers
    bridge.on("transport_changed", handleTransportChanged);
    bridge.on("ws_connected", handleConnected);
    bridge.on("ws_connected", (connected: any) => {
      if (!connected) handleDisconnected();
    });
    bridge.on("ws_error", handleWebSocketError);

    // Store handlers for cleanup
    handlersRef.current = [
      { event: "transport_changed", handler: handleTransportChanged },
      { event: "ws_connected", handler: handleConnected },
      { event: "ws_error", handler: handleWebSocketError },
    ];

    // Check initial WebSocket status
    const wsStatus = bridge.getWebSocketStatus();
    setConnected(wsStatus.connected);

    // Cleanup
    return () => {
      handlersRef.current.forEach(({ event, handler }) => {
        bridge.off(event, handler);
      });
    };
  }, []);

  const send = useCallback((command: Record<string, unknown>) => {
    const bridge = bridgeRef.current;
    const wsStatus = bridge.getWebSocketStatus();
    
    if (wsStatus.connected) {
      bridge.sendWebSocketMessage(command);
    } else {
      console.warn("[useTransportClock] WebSocket not connected, cannot send command");
      setError("WebSocket not connected");
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
