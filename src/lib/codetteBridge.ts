/**
 * CodetteBridge: Frontend-Backend Communication Layer
 * Bridges React DAWContext with Python Codette AI engine
 * 
 * Features:
 * - REST API for immediate responses
 * - WebSocket for real-time updates (future)
 * - Automatic reconnection handling
 * - Request queuing for offline resilience
 * - Full TypeScript typing
 */

import { Track } from "../types";

// Configuration
const CODETTE_API_BASE = import.meta.env.VITE_CODETTE_API || "http://localhost:8000";

// Types
export interface CodetteChatRequest {
  user_message: string;
  conversation_id: string;
  context?: string;
  perspective?: string;
}

export interface CodetteChatResponse {
  response: string;
  confidence: number;
  source: string;
  context_type?: string;
}

export interface CodetteSuggestionRequest {
  context: {
    type: string;
    mood?: string;
    genre?: string;
    bpm?: number;
    track_type?: string;
  };
  limit?: number;
}

export interface CodetteSuggestion {
  id: string;
  type: "effect" | "parameter" | "automation" | "routing" | "mixing";
  title: string;
  description: string;
  parameters: Record<string, any>;
  confidence: number;
  category: string;
}

export interface CodetteSuggestionResponse {
  suggestions: CodetteSuggestion[];
  context: string;
  timestamp: number;
}

export interface CodetteAnalysisRequest {
  audio_data?: {
    duration: number;
    sample_rate: number;
    peak_level?: number;
    rms_level?: number;
  };
  analysis_type: "spectrum" | "dynamic" | "loudness" | "quality";
  track_data?: {
    track_id: string;
    track_name: string;
    track_type: string;
  };
}

export interface CodetteAnalysisResponse {
  analysis_type: string;
  results: Record<string, any>;
  recommendations: string[];
  quality_score: number;
}

export interface CodetteProcessRequest {
  id: string;
  type: "chat" | "suggest" | "analyze" | "sync";
  payload: Record<string, any>;
}

export interface CodetteProcessResponse {
  id: string;
  type: string;
  data: Record<string, any>;
  status: "success" | "error";
  message?: string;
}

export interface CodetteTransportState {
  is_playing: boolean;
  current_time: number;
  bpm: number;
  time_signature: [number, number];
  loop_enabled: boolean;
  loop_start: number;
  loop_end: number;
}

// Connection state
interface ConnectionState {
  connected: boolean;
  lastConnectAttempt: number;
  reconnectCount: number;
  isReconnecting: boolean;
}

// Request queue for offline resilience
interface QueuedRequest {
  id: string;
  method: "chat" | "suggest" | "analyze" | "process";
  data: any;
  timestamp: number;
  retries: number;
}

class CodetteBridge {
  private connectionState: ConnectionState = {
    connected: false,
    lastConnectAttempt: 0,
    reconnectCount: 0,
    isReconnecting: false,
  };

  private requestQueue: Map<string, QueuedRequest> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    try {
      this.initHealthCheck();
      // Initialize WebSocket connection asynchronously
      this.initializeWebSocket().catch((err) => {
        console.debug("[CodetteBridge] WebSocket initialization failed:", err);
      });
    } catch (err) {
      console.error("[CodetteBridge] Constructor error:", err);
      // Continue with degraded functionality
    }
  }

  /**
   * Initialize periodic health checks
   */
  private initHealthCheck(): void {
    setInterval(() => {
      this.healthCheck().catch((err) => {
        console.debug("[CodetteBridge] Health check failed:", err.message);
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Check backend health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${CODETTE_API_BASE}/health`, {
        method: "GET",
      });

      if (response.ok) {
        await response.json();
        this.connectionState.connected = true;
        this.emit("connected");
        return true;
      }
    } catch (error) {
      this.connectionState.connected = false;
      this.emit("disconnected");
    }

    return false;
  }

  /**
   * Send chat request to Codette
   */
  async chat(
    message: string,
    conversationId: string,
    perspective?: string
  ): Promise<CodetteChatResponse> {
    const request: CodetteChatRequest = {
      user_message: message,
      conversation_id: conversationId,
      perspective: perspective || "general",
    };

    return this.makeRequest<CodetteChatResponse>(
      "chat",
      "/codette/chat",
      request
    );
  }

  /**
   * Get Codette suggestions for current context
   */
  async getSuggestions(
    context: CodetteSuggestionRequest["context"],
    limit: number = 5
  ): Promise<CodetteSuggestionResponse> {
    const request: CodetteSuggestionRequest = {
      context,
      limit,
    };

    return this.makeRequest<CodetteSuggestionResponse>(
      "suggest",
      "/codette/suggest",
      request
    );
  }

  /**
   * Analyze audio from selected track
   */
  async analyzeAudio(
    audioData: CodetteAnalysisRequest["audio_data"],
    analysisType: "spectrum" | "dynamic" | "loudness" | "quality" = "spectrum"
  ): Promise<CodetteAnalysisResponse> {
    const request: CodetteAnalysisRequest = {
      audio_data: audioData,
      analysis_type: analysisType,
    };

    return this.makeRequest<CodetteAnalysisResponse>(
      "analyze",
      "/codette/analyze",
      request
    );
  }

  /**
   * Apply a Codette suggestion to a track
   */
  async applySuggestion(
    trackId: string,
    suggestion: CodetteSuggestion
  ): Promise<{
    success: boolean;
    trackId: string;
    appliedParameters: Record<string, any>;
  }> {
    const requestData = {
      action: "apply_suggestion",
      track_id: trackId,
      suggestion_id: suggestion.id,
      parameters: suggestion.parameters,
    };

    return this.makeRequest(
      "chat",
      "/codette/suggest",
      requestData
    );
  }

  /**
   * Sync current DAW state with Codette
   */
  async syncState(
    tracks: Track[],
    currentTime: number,
    isPlaying: boolean,
    bpm: number
  ): Promise<{ synced: boolean; timestamp: number }> {
    const request: CodetteProcessRequest = {
      id: `sync-${Date.now()}`,
      type: "sync",
      payload: {
        action: "sync_state",
        current_time: currentTime,
        is_playing: isPlaying,
        bpm: bpm,
        track_count: tracks.length,
        active_tracks: tracks.filter((t) => !t.muted).length,
      },
    };

    return this.makeRequest(
      "process",
      "/codette/process",
      request
    );
  }

  /**
   * Get transport state from Codette backend
   */
  async getTransportState(): Promise<CodetteTransportState> {
    try {
      const response = await fetch(`${CODETTE_API_BASE}/codette/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get transport state: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        is_playing: data.is_playing ?? false,
        current_time: data.current_time ?? 0,
        bpm: data.bpm ?? 120,
        time_signature: data.time_signature ?? [4, 4],
        loop_enabled: data.loop_enabled ?? false,
        loop_start: data.loop_start ?? 0,
        loop_end: data.loop_end ?? 10,
      };
    } catch (error) {
      console.error("[CodetteBridge] Failed to get transport state:", error);
      // Return default state on error
      return {
        is_playing: false,
        current_time: 0,
        bpm: 120,
        time_signature: [4, 4],
        loop_enabled: false,
        loop_start: 0,
        loop_end: 10,
      };
    }
  }

  /**
   * Control transport: Play
   */
  async transportPlay(): Promise<CodetteTransportState> {
    const requestData = {
      action: "transport_play",
    };

    return this.makeRequest(
      "chat",
      "/codette/chat",
      requestData
    ) as any;
  }

  /**
   * Control transport: Stop
   */
  async transportStop(): Promise<CodetteTransportState> {
    const requestData = {
      action: "transport_stop",
    };

    return this.makeRequest(
      "chat",
      "/codette/chat",
      requestData
    ) as any;
  }

  /**
   * Control transport: Seek to position
   */
  async transportSeek(timeSeconds: number): Promise<CodetteTransportState> {
    const requestData = {
      action: "transport_seek",
      time: timeSeconds,
    };

    return this.makeRequest(
      "chat",
      "/codette/chat",
      requestData
    ) as any;
  }

  /**
   * Set tempo/BPM
   */
  async setTempo(bpm: number): Promise<CodetteTransportState> {
    const requestData = {
      action: "set_tempo",
      bpm: bpm,
    };

    return this.makeRequest(
      "chat",
      "/codette/chat",
      requestData
    ) as any;
  }

  /**
   * Enable/disable loop
   */
  async setLoop(
    enabled: boolean,
    startTime: number = 0,
    endTime: number = 10
  ): Promise<CodetteTransportState> {
    const requestData = {
      action: "set_loop",
      enabled: enabled,
      loop_start: startTime,
      loop_end: endTime,
    };

    return this.makeRequest(
      "chat",
      "/codette/chat",
      requestData
    ) as any;
  }

  /**
   * Get production checklist from Codette
   */
  async getProductionChecklist(
    projectState: Record<string, any>
  ): Promise<{
    items: Array<{
      category: string;
      task: string;
      completed: boolean;
      priority: "high" | "medium" | "low";
    }>;
    completionPercentage: number;
  }> {
    const requestData = {
      action: "get_checklist",
      project_state: projectState,
    };

    return this.makeRequest("chat", "/codette/chat", requestData) as any;
  }

  /**
   * Core request handler with error handling and queuing
   */
  private async makeRequest<T = any>(
    method: "chat" | "suggest" | "analyze" | "process",
    endpoint: string,
    data: any
  ): Promise<T> {
    const requestId = `${method}-${Date.now()}-${Math.random()}`;

    try {
      // Check connection first
      if (!this.connectionState.connected) {
        await this.healthCheck();
      }

      const response = await fetch(`${CODETTE_API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Queue request for retry
        this.queueRequest(requestId, method, data);

        throw new Error(
          `Codette API error: ${response.status} ${response.statusText}`
        );
      }

      const result: T = await response.json();
      this.connectionState.connected = true;
      this.emit("connected");

      return result;
    } catch (error) {
      this.connectionState.connected = false;
      this.emit("disconnected");

      // Queue failed request
      this.queueRequest(requestId, method, data);

      console.error(`[CodetteBridge] ${method} request failed:`, error);
      throw error;
    }
  }

  /**
   * Queue a request for later retry
   */
  private queueRequest(
    id: string,
    method: "chat" | "suggest" | "analyze" | "process",
    data: any
  ): void {
    this.requestQueue.set(id, {
      id,
      method,
      data,
      timestamp: Date.now(),
      retries: 0,
    });

    // Emit queue update
    this.emit("queue_updated", {
      queueSize: this.requestQueue.size,
    });
  }

  /**
   * Process queued requests when connection restored
   */
  async processQueuedRequests(): Promise<void> {
    if (this.requestQueue.size === 0) {
      return;
    }

    const requests = Array.from(this.requestQueue.values());

    for (const req of requests) {
      try {
        // Retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, req.retries), 30000);
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Get endpoint based on method
        let endpoint = "";
        switch (req.method) {
          case "chat":
            endpoint = "/codette/chat";
            break;
          case "suggest":
            endpoint = "/codette/suggest";
            break;
          case "analyze":
            endpoint = "/codette/analyze";
            break;
          case "process":
            endpoint = "/codette/process";
            break;
        }

        await this.makeRequest(req.method, endpoint, req.data);
        this.requestQueue.delete(req.id);
      } catch (error) {
        req.retries++;

        // Give up after 5 retries
        if (req.retries >= 5) {
          this.requestQueue.delete(req.id);
          this.emit("request_failed", {
            requestId: req.id,
            error: String(error),
          });
        }
      }
    }
  }

  /**
   * WebSocket connection reference
   */
  private ws: WebSocket | null = null;
  private wsConnected: boolean = false;
  private wsReconnectAttempts: number = 0;
  private maxWsReconnectAttempts: number = 5;
  private wsReconnectDelay: number = 1000;

  /**
   * Initialize WebSocket connection for real-time updates
   */
  initializeWebSocket(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const wsUrl = (CODETTE_API_BASE.replace("http", "ws")) + "/ws";
        console.debug("[CodetteBridge] Connecting to WebSocket:", wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.debug("[CodetteBridge] WebSocket connected");
          this.wsConnected = true;
          this.wsReconnectAttempts = 0;
          this.emit("ws_connected", true);
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.debug("[CodetteBridge] WebSocket message:", message);

            // Emit events based on message type
            if (message.type === "transport_state") {
              this.emit("transport_changed", message.data);
            } else if (message.type === "suggestion") {
              this.emit("suggestion_received", message.data);
            } else if (message.type === "analysis_complete") {
              this.emit("analysis_complete", message.data);
            } else if (message.type === "state_update") {
              this.emit("state_update", message.data);
            } else if (message.type === "error") {
              this.emit("ws_error", message.data);
            }
          } catch (error) {
            console.error("[CodetteBridge] Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("[CodetteBridge] WebSocket error:", error);
          this.emit("ws_error", error);
        };

        this.ws.onclose = () => {
          console.debug("[CodetteBridge] WebSocket disconnected");
          this.wsConnected = false;
          this.emit("ws_connected", false);

          // Attempt reconnection
          if (this.wsReconnectAttempts < this.maxWsReconnectAttempts) {
            this.wsReconnectAttempts++;
            const delay =
              this.wsReconnectDelay * Math.pow(2, this.wsReconnectAttempts - 1);
            console.debug(
              `[CodetteBridge] WebSocket reconnecting in ${delay}ms (attempt ${this.wsReconnectAttempts})`
            );
            setTimeout(() => this.initializeWebSocket(), delay);
          }
        };

        // Timeout if connection takes too long
        setTimeout(() => {
          if (!this.wsConnected) {
            console.warn("[CodetteBridge] WebSocket connection timeout");
            this.ws?.close();
            resolve(false);
          }
        }, 5000);
      } catch (error) {
        console.error("[CodetteBridge] Failed to initialize WebSocket:", error);
        resolve(false);
      }
    });
  }

  /**
   * Send message over WebSocket
   */
  sendWebSocketMessage(message: Record<string, any>): boolean {
    if (!this.ws || !this.wsConnected) {
      console.debug(
        "[CodetteBridge] WebSocket not connected, falling back to REST"
      );
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("[CodetteBridge] Failed to send WebSocket message:", error);
      return false;
    }
  }

  /**
   * Close WebSocket connection
   */
  closeWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.wsConnected = false;
    }
  }

  /**
   * Get WebSocket connection status
   */
  getWebSocketStatus(): {
    connected: boolean;
    reconnectAttempts: number;
  } {
    return {
      connected: this.wsConnected,
      reconnectAttempts: this.wsReconnectAttempts,
    };
  }

  /**
   * Event emitter system
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[CodetteBridge] Event handler error for ${event}:`, error);
      }
    });
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueSize: number;
    oldestRequest?: number;
  } {
    return {
      queueSize: this.requestQueue.size,
      oldestRequest:
        this.requestQueue.size > 0
          ? Math.min(
              ...Array.from(this.requestQueue.values()).map((r) => r.timestamp)
            )
          : undefined,
    };
  }
}

// Singleton instance
let bridgeInstance: CodetteBridge | null = null;

/**
 * Get or create CodetteBridge instance
 */
export function getCodetteBridge(): CodetteBridge {
  if (!bridgeInstance) {
    bridgeInstance = new CodetteBridge();
  }
  return bridgeInstance;
}

export default CodetteBridge;
