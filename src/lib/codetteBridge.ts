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
import { supabase } from "./supabase";

// Configuration - FIXED: use VITE_CODETTE_API with port 8000
const CODETTE_API_BASE = import.meta.env.VITE_CODETTE_API || "http://localhost:8000";

// Callback type for event listeners - EXPORTED
export type EventCallback = (data?: unknown) => void;

// Types
export interface CodetteChatRequest {
  message: string;
  perspective?: string;
  daw_context?: Record<string, unknown>;
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
  parameters: Record<string, unknown>;
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
  results: Record<string, unknown>;
  recommendations: string[];
  quality_score: number;
}

export interface CodetteProcessRequest {
  id: string;
  type: "chat" | "suggest" | "analyze" | "sync";
  payload: Record<string, unknown>;
}

export interface CodetteProcessResponse {
  id: string;
  type: string;
  data: Record<string, unknown>;
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
  data: unknown;
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
  private listeners: Map<string, Set<EventCallback>> = new Map();

  // Reconnection settings
  private maxReconnectAttempts: number = 10;
  private baseReconnectDelay: number = 1000; // 1 second
  private maxReconnectDelay: number = 30000; // 30 seconds
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

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
    // Clear existing interval if any
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.healthCheck().catch((err) => {
        console.debug("[CodetteBridge] Health check failed:", err instanceof Error ? err.message : String(err));
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Check backend health with retry logic
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${CODETTE_API_BASE}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        this.connectionState.connected = true;
        
        // Reset reconnect count on successful connection
        if (this.connectionState.reconnectCount > 0) {
          console.debug(
            `[CodetteBridge] ✅ Reconnected after ${this.connectionState.reconnectCount} attempts`
          );
          this.connectionState.reconnectCount = 0;
        }
        
        this.emit("connected", data);
        
        // Process queued requests on reconnect
        if (this.requestQueue.size > 0) {
          console.debug(
            `[CodetteBridge] Processing ${this.requestQueue.size} queued requests`
          );
          this.processQueuedRequests().catch((err) =>
            console.warn("[CodetteBridge] Queue processing error:", err)
          );
        }
        
        return true;
      }
    } catch {
      this.connectionState.connected = false;
      this.emit("disconnected");
      
      // Attempt reconnection if not already reconnecting
      if (!this.connectionState.isReconnecting) {
        this.attemptReconnect();
      }
    }

    return false;
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private async attemptReconnect(): Promise<void> {
    if (this.connectionState.isReconnecting) {
      return;
    }

    if (this.connectionState.reconnectCount >= this.maxReconnectAttempts) {
      console.error(
        `[CodetteBridge] ❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached`
      );
      this.emit("max_reconnect_attempts_reached", {
        attempts: this.maxReconnectAttempts,
      });
      return;
    }

    this.connectionState.isReconnecting = true;
    this.connectionState.reconnectCount++;

    // Calculate exponential backoff delay
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.connectionState.reconnectCount - 1),
      this.maxReconnectDelay
    );

    console.debug(
      `[CodetteBridge] 🔄 Reconnection attempt ${this.connectionState.reconnectCount}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    // Clear existing timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(async () => {
      try {
        this.connectionState.lastConnectAttempt = Date.now();
        
        // Try health check
        const healthy = await this.healthCheck();
        
        if (healthy) {
          this.connectionState.isReconnecting = false;
          console.debug("[CodetteBridge] ✅ Reconnection successful");
          this.emit("reconnected", {
            attempts: this.connectionState.reconnectCount,
          });
        } else {
          // Continue attempting to reconnect
          this.connectionState.isReconnecting = false;
          await this.attemptReconnect();
        }
      } catch {
        this.connectionState.isReconnecting = false;
        console.warn("[CodetteBridge] Reconnection attempt failed");
        // Continue attempting to reconnect
        await this.attemptReconnect();
      }
    }, delay);
  }

  /**
   * Manually force reconnection
   */
  async forceReconnect(): Promise<boolean> {
    console.debug("[CodetteBridge] 🔄 Force reconnect initiated");
    this.connectionState.reconnectCount = 0;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    return this.healthCheck();
  }

  /**
   * Get connection status with details
   */
  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    isReconnecting: boolean;
    lastAttempt: number;
    timeSinceLastAttempt: number;
  } {
    const now = Date.now();
    return {
      connected: this.connectionState.connected,
      reconnectAttempts: this.connectionState.reconnectCount,
      isReconnecting: this.connectionState.isReconnecting,
      lastAttempt: this.connectionState.lastConnectAttempt,
      timeSinceLastAttempt: now - this.connectionState.lastConnectAttempt,
    };
  }

  /**
   * Send chat request to Codette
   */
  async chat(
    message: string,
    conversationId: string,
    perspective?: string,
    dawContext?: Record<string, unknown>
  ): Promise<CodetteChatResponse> {
    // Use 'message' to match server's ChatRequest model
    const request = {
      message: message,
      perspective: perspective || "mix_engineering",
      daw_context: dawContext || null,
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
    appliedParameters: Record<string, unknown>;
  }> {
    const requestData = {
      action: "apply_suggestion",
      track_id: trackId,
      suggestion_id: suggestion.id,
      parameters: suggestion.parameters,
    };

    return this.makeRequest(
      "process",
      "/codette/process",
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
      // Server exposes /ws/status REST endpoint with transport data
      const response = await fetch(`${CODETTE_API_BASE}/ws/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Failed to get transport state: ${response.statusText}`);
      }

      const data = await response.json();
      const transport = data.transport || data;

      return {
        is_playing: transport.playing ?? false,
        current_time: transport.time_seconds ?? 0,
        bpm: transport.bpm ?? 120,
        time_signature: [4, 4],
        loop_enabled: transport.loop_enabled ?? false,
        loop_start: transport.loop_start_seconds ?? 0,
        loop_end: transport.loop_end_seconds ?? 10,
      };
    } catch (error) {
      console.error("[CodetteBridge] Failed to get transport state:", error);
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
   * Backend does not expose REST endpoints for transport control in current release.
   * Prefer WebSocket control if available; fallback to local simulated state.
   */
  async transportPlay(): Promise<CodetteTransportState> {
    try {
      if (this.ws && this.wsConnected) {
        this.sendWebSocketMessage({ type: 'transport', data: { command: 'play' } });
      }
    } catch (e) {
      console.debug('[CodetteBridge] WS transport play send failed', e);
    }

    const state = await this.getTransportState();
    // Simulate play state
    state.is_playing = true;
    return state;
  }

  /**
   * Control transport: Stop
   */
  async transportStop(): Promise<CodetteTransportState> {
    try {
      if (this.ws && this.wsConnected) {
        this.sendWebSocketMessage({ type: 'transport', data: { command: 'stop' } });
      }
    } catch (e) {
      console.debug('[CodetteBridge] WS transport stop send failed', e);
    }

    const state = await this.getTransportState();
    state.is_playing = false;
    state.current_time = 0;
    return state;
  }

  /**
   * Control transport: Seek to position
   */
  async transportSeek(timeSeconds: number): Promise<CodetteTransportState> {
    try {
      if (this.ws && this.wsConnected) {
        this.sendWebSocketMessage({ type: 'transport', data: { command: 'seek', position: timeSeconds } });
      }
    } catch (e) {
      console.debug('[CodetteBridge] WS transport seek send failed', e);
    }

    const state = await this.getTransportState();
    state.current_time = timeSeconds;
    return state;
  }

  /**
   * Set tempo/BPM
   */
  async setTempo(bpm: number): Promise<CodetteTransportState> {
    try {
      if (this.ws && this.wsConnected) {
        this.sendWebSocketMessage({ type: 'transport', data: { command: 'set_tempo', bpm } });
      }
    } catch (e) {
      console.debug('[CodetteBridge] WS setTempo send failed', e);
    }

    const state = await this.getTransportState();
    state.bpm = bpm;
    return state;
  }

  /**
   * Enable/disable loop
   */
  async setLoop(
    enabled: boolean,
    startTime: number = 0,
    endTime: number = 10
  ): Promise<CodetteTransportState> {
    try {
      if (this.ws && this.wsConnected) {
        this.sendWebSocketMessage({ type: 'transport', data: { command: 'set_loop', enabled, startTime, endTime } });
      }
    } catch (e) {
      console.debug('[CodetteBridge] WS setLoop send failed', e);
    }

    const state = await this.getTransportState();
    state.loop_enabled = enabled;
    state.loop_start = startTime;
    state.loop_end = endTime;
    return state;
  }

  /**
   * Get production checklist from Codette
   */
  async getProductionChecklist(
    projectState: Record<string, unknown>
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

    return this.makeRequest("chat", "/codette/chat", requestData);
  }

  /**
   * Get Codette context JSON from Supabase RPC function
   */
  async getCodetteContextJson(
    inputPrompt: string,
    optionallyFilename?: string | null
  ): Promise<{
    snippets: Array<{ filename: string; snippet: string }>;
    file: { id: string; filename: string; file_type: string; storage_path: string; uploaded_at: string } | null;
    chat_history: Array<{ id: string; user_id: string; messages: Record<string, string>; updated_at: string }>;
  }> {
    try {
      if (!supabase) {
        console.warn("[CodetteBridge] Supabase not initialized, skipping RPC call");
        return { snippets: [], file: null, chat_history: [] };
      }

      const result = await supabase.rpc("get_codette_context_json", {
        input_prompt: inputPrompt,
        optionally_filename: optionallyFilename || null,
      });

      if (result.error) {
        console.error("[CodetteBridge] RPC call error:", result.error);
        return { snippets: [], file: null, chat_history: [] };
      }

      const data = result.data;
      return {
        snippets: data?.snippets || [],
        file: data?.file || null,
        chat_history: data?.chat_history || [],
      };
    } catch (error) {
      console.error("[CodetteBridge] Failed to get Codette context:", error);
      return { snippets: [], file: null, chat_history: [] };
    }
  }

  /**
   * Enhanced chat with Codette context from Supabase
   */
  async chatWithContext(
    message: string,
    conversationId: string,
    perspective?: string,
    dawContext?: Record<string, unknown>
  ): Promise<CodetteChatResponse> {
    try {
      const context = await this.getCodetteContextJson(message, null);
      
      // Build the daw_context with Supabase context merged
      const enrichedContext = {
        ...dawContext,
        source_snippets: context.snippets,
        file_context: context.file,
        chat_history: context.chat_history,
      };

      // Use 'message' to match server's ChatRequest model
      const request = {
        message: message,
        perspective: perspective || "mix_engineering",
        daw_context: enrichedContext,
      };

      return this.makeRequest<CodetteChatResponse>(
        "chat",
        "/codette/chat",
        request
      );
    } catch (error) {
      console.error("[CodetteBridge] Chat with context failed:", error);
      return this.chat(message, conversationId, perspective, dawContext);
    }
  }

  /**
   * Core request handler with error handling, retries, and reconnection
   */
  private async makeRequest<T = unknown>(
    method: "chat" | "suggest" | "analyze" | "process",
    endpoint: string,
    data: unknown,
    retryCount: number = 0
  ): Promise<T> {
    const requestId = `${method}-${Date.now()}-${Math.random()}`;
    const maxRetries = 3;

    try {
      if (!this.connectionState.connected) {
        const healthy = await this.healthCheck();
        if (!healthy && retryCount === 0) {
          await this.attemptReconnect();
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      const response = await fetch(`${CODETTE_API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        if (response.status >= 500 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.makeRequest(method, endpoint, data, retryCount + 1);
        }

        this.queueRequest(requestId, method, data);
        throw new Error(`Codette API error: ${response.status} ${response.statusText}`);
      }

      const result: T = await response.json();
      
      if (!this.connectionState.connected) {
        this.connectionState.connected = true;
        this.emit("connected", { restored: true });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("ERR_CONNECTION_REFUSED")) {
        this.queueRequest(requestId, method, data);
        
        if (!this.connectionState.isReconnecting) {
          this.attemptReconnect().catch(() => {});
        }
      }

      this.connectionState.connected = false;
      this.emit("disconnected");

      console.error(`[CodetteBridge] ${method} request failed:`, errorMessage);
      throw error;
    }
  }

  /**
   * Queue a request for later retry
   */
  private queueRequest(
    id: string,
    method: "chat" | "suggest" | "analyze" | "process",
    data: unknown
  ): void {
    this.requestQueue.set(id, {
      id,
      method,
      data,
      timestamp: Date.now(),
      retries: 0,
    });

    this.emit("queue_updated", { queueSize: this.requestQueue.size });
  }

  /**
   * Process queued requests when connection restored
   */
  async processQueuedRequests(): Promise<void> {
    if (this.requestQueue.size === 0) return;

    const requests = Array.from(this.requestQueue.values());

    for (const req of requests) {
      try {
        const delay = Math.min(1000 * Math.pow(2, req.retries), 30000);
        await new Promise((resolve) => setTimeout(resolve, delay));

        let endpoint = "";
        switch (req.method) {
          case "chat": endpoint = "/codette/chat"; break;
          case "suggest": endpoint = "/codette/suggest"; break;
          case "analyze": endpoint = "/codette/analyze"; break;
          case "process": endpoint = "/codette/process"; break;
        }

        await this.makeRequest(req.method, endpoint, req.data);
        this.requestQueue.delete(req.id);
      } catch {
        req.retries++;
        if (req.retries >= 5) {
          this.requestQueue.delete(req.id);
          this.emit("request_failed", { requestId: req.id });
        }
      }
    }
  }

  // WebSocket properties
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
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.wsConnected = true;
          this.wsReconnectAttempts = 0;
          this.connectionState.connected = true;
          this.connectionState.isReconnecting = false;
          this.emit("ws_connected", true);
          this.emit("connected", { ws: true });
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const type = message.type;
            const data = message.data;
            if (type === "transport_state") {
              this.emit("transport_changed", data);
            } else if (type === "suggestion") {
              this.emit("suggestion_received", data);
            } else if (type === "analysis_complete") {
              this.emit("analysis_complete", data);
            } else if (type === "state_update") {
              this.emit("state_update", data);
            } else if (type === "server_status") {
              // periodic server status broadcast
              console.debug("[CodetteBridge] server_status", data);
              this.emit("server_status", data);
              this.connectionState.connected = true;
            } else if (type === "connected") {
              // initial handshake
              console.debug("[CodetteBridge] ws connected handshake", data);
              this.emit("ws_handshake", data);
              this.connectionState.connected = true;
            } else if (type === "error") {
              this.emit("ws_error", data);
            } else {
              this.emit("ws_message", message);
            }
          } catch {
            console.error("[CodetteBridge] Failed to parse WebSocket message");
          }
        };

        this.ws.onerror = (error) => {
          this.wsConnected = false;
          this.connectionState.connected = false;
          this.emit("ws_error", error);
        };

        this.ws.onclose = () => {
          this.wsConnected = false;
          this.connectionState.connected = false;
          this.emit("ws_connected", false);
          this.emit("disconnected");

          if (this.wsReconnectAttempts < this.maxWsReconnectAttempts) {
            this.wsReconnectAttempts++;
            const delay = Math.min(this.wsReconnectDelay * Math.pow(2, this.wsReconnectAttempts - 1), 30000);
            setTimeout(() => this.initializeWebSocket(), delay);
          }
        };

        setTimeout(() => {
          if (!this.wsConnected && this.ws) {
            this.ws?.close();
            resolve(false);
          }
        }, 5000);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Force WebSocket reconnection
   */
  async forceWebSocketReconnect(): Promise<boolean> {
    this.wsReconnectAttempts = 0;
    if (this.ws) this.ws.close();
    return this.initializeWebSocket();
  }

  /**
   * Send message over WebSocket
   */
  sendWebSocketMessage(message: Record<string, unknown>): boolean {
    if (!this.ws || !this.wsConnected) return false;
    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch {
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
    maxAttempts: number;
    url: string;
  } {
    return {
      connected: this.wsConnected,
      reconnectAttempts: this.wsReconnectAttempts,
      maxAttempts: this.maxWsReconnectAttempts,
      url: (CODETTE_API_BASE.replace("http", "ws")) + "/ws",
    };
  }

  /**
   * Cleanup and destroy the bridge
   */
  destroy(): void {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.closeWebSocket();
    this.listeners.clear();
    this.requestQueue.clear();
  }

  /**
   * Event emitter system
   */
  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data?: unknown): void {
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
  getQueueStatus(): { queueSize: number; oldestRequest?: number } {
    return {
      queueSize: this.requestQueue.size,
      oldestRequest: this.requestQueue.size > 0
        ? Math.min(...Array.from(this.requestQueue.values()).map((r) => r.timestamp))
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
