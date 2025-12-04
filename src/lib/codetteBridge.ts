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
  private listeners: Map<string, Set<(data?: unknown) => void>> = new Map();

  // Reconnection settings
  private maxReconnectAttempts: number = 10;
  private baseReconnectDelay: number = 1000; // 1 second
  private maxReconnectDelay: number = 30000; // 30 seconds
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    try {
      this.initHealthCheck();
      // Initialize WebSocket connection asynchronously
      this.initializeWebSocket().catch((_err) => {
        console.debug("[CodetteBridge] WebSocket initialization failed:", _err);
      });
    } catch (_err) {
      console.error("[CodetteBridge] Constructor error:", _err);
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
      this.healthCheck().catch((_err) => {
        console.debug("[CodetteBridge] Health check failed:", _err.message);
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
    } catch (error) {
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
      } catch (error) {
        this.connectionState.isReconnecting = false;
        console.warn("[CodetteBridge] Reconnection attempt failed:", error);
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
    appliedParameters: Record<string, unknown>;
  }> {
    const requestData = {
      action: "apply_suggestion",
      track_id: trackId,
      suggestion_id: suggestion.id,
      parameters: suggestion.parameters,
    };

    const result = await this.makeRequest(
      "chat",
      "/codette/suggest",
      requestData
    );
    return result as unknown as {
      success: boolean;
      trackId: string;
      appliedParameters: Record<string, unknown>;
    };
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

    const result = await this.makeRequest(
      "chat",
      "/codette/chat",
      requestData
    );
    return result as unknown as CodetteTransportState;
  }

  /**
   * Control transport: Stop
   */
  async transportStop(): Promise<CodetteTransportState> {
    const requestData = {
      action: "transport_stop",
    };

    const result = await this.makeRequest(
      "chat",
      "/codette/chat",
      requestData
    );
    return result as unknown as CodetteTransportState;
  }

  /**
   * Control transport: Seek to position
   */
  async transportSeek(timeSeconds: number): Promise<CodetteTransportState> {
    const requestData = {
      action: "transport_seek",
      time: timeSeconds,
    };

    const result = await this.makeRequest(
      "chat",
      "/codette/chat",
      requestData
    );
    return result as unknown as CodetteTransportState;
  }

  /**
   * Set tempo/BPM
   */
  async setTempo(bpm: number): Promise<CodetteTransportState> {
    const requestData = {
      action: "set_tempo",
      bpm: bpm,
    };

    const result = await this.makeRequest(
      "chat",
      "/codette/chat",
      requestData
    );
    return result as unknown as CodetteTransportState;
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

    const result = await this.makeRequest(
      "chat",
      "/codette/chat",
      requestData
    );
    return result as unknown as CodetteTransportState;
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

    const result = await this.makeRequest("chat", "/codette/chat", requestData);
    return result as unknown as {
      items: Array<{
        category: string;
        task: string;
        completed: boolean;
        priority: "high" | "medium" | "low";
      }>;
      completionPercentage: number;
    };
  }

  /**
   * Get Codette context JSON from Supabase RPC function
   * Retrieves intelligent context for prompt processing
   * 
   * @param inputPrompt - The input prompt/query text
   * @param optionallyFilename - Optional filename filter (nullable)
   * @returns Promise with context data including snippets, files, and chat history
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

      console.debug("[CodetteBridge] Calling get_codette_context_json RPC:", {
        input_prompt: inputPrompt,
        optionally_filename: optionallyFilename,
      });

      // Call Supabase RPC function with exact parameter names
      const result = await supabase.rpc("get_codette_context_json", {
        input_prompt: inputPrompt,
        optionally_filename: optionallyFilename || null,
      });

      if (result.error) {
        console.error("[CodetteBridge] RPC call error:", result.error);
        return { snippets: [], file: null, chat_history: [] };
      }

      const data = result.data;
      console.debug("[CodetteBridge] RPC response:", {
        snippets_count: data?.snippets?.length || 0,
        has_file: !!data?.file,
        history_count: data?.chat_history?.length || 0,
      });

      // Normalize response
      return {
        snippets: data?.snippets || [],
        file: data?.file || null,
        chat_history: data?.chat_history || [],
      };
    } catch (error) {
      console.error("[CodetteBridge] Failed to get Codette context:", error);
      // Return empty context on failure
      return { snippets: [], file: null, chat_history: [] };
    }
  }

  /**
   * Enhanced chat with Codette context from Supabase
   * Combines local context retrieval with chat processing
   */
  async chatWithContext(
    message: string,
    conversationId: string,
    perspective?: string
  ): Promise<CodetteChatResponse> {
    try {
      // First, get context from Supabase
      const context = await this.getCodetteContextJson(message, null);
      
      console.debug("[CodetteBridge] Chat context retrieved:", {
        snippets: context.snippets.length,
        hasFile: !!context.file,
      });

      // Build enhanced request with context
      const request: CodetteChatRequest = {
        user_message: message,
        conversation_id: conversationId,
        perspective: perspective || "general",
        context: JSON.stringify({
          source_snippets: context.snippets,
          file_context: context.file,
          chat_history: context.chat_history,
        }),
      };

      // Send to Codette with enriched context
      return this.makeRequest<CodetteChatResponse>(
        "chat",
        "/codette/chat",
        request
      );
    } catch (error) {
      console.error("[CodetteBridge] Chat with context failed:", error);
      // Fall back to regular chat
      return this.chat(message, conversationId, perspective);
    }
  }

  /**
   * Core request handler with error handling, retries, and reconnection
   */
  private async makeRequest<T = Record<string, unknown>>(
    method: "chat" | "suggest" | "analyze" | "process",
    endpoint: string,
    data: unknown,
    retryCount: number = 0
  ): Promise<T> {
    const requestId = `${method}-${Date.now()}-${Math.random()}`;
    const maxRetries = 3;

    try {
      // Check connection first, with retry
      if (!this.connectionState.connected) {
        const healthy = await this.healthCheck();
        if (!healthy && retryCount === 0) {
          // Attempt one immediate reconnect
          console.debug("[CodetteBridge] Connection check failed, attempting reconnect...");
          await this.attemptReconnect();
          
          // Wait a bit for reconnection attempt to start
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      const response = await fetch(`${CODETTE_API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        // Retry on 5xx errors (server error)
        if (response.status >= 500 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.debug(
            `[CodetteBridge] Server error (${response.status}), retry ${retryCount + 1}/${maxRetries} after ${delay}ms`
          );
          
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.makeRequest(method, endpoint, data, retryCount + 1);
        }

        // Queue request for later retry
        this.queueRequest(requestId, method, data);

        throw new Error(
          `Codette API error: ${response.status} ${response.statusText}`
        );
      }

      const result: T = await response.json();
      
      // Mark connection as healthy
      if (!this.connectionState.connected) {
        this.connectionState.connected = true;
        this.emit("connected", { restored: true });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Only queue if it's a network error, not a timeout
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("ERR_CONNECTION_REFUSED")
      ) {
        // Queue request for retry
        this.queueRequest(requestId, method, data);
        
        // Trigger reconnection attempt
        if (!this.connectionState.isReconnecting) {
          this.attemptReconnect().catch((_err) =>
            console.warn("[CodetteBridge] Reconnect attempt error:", _err)
          );
        }
      }

      this.connectionState.connected = false;
      this.emit("disconnected");

      console.error(
        `[CodetteBridge] ${method} request failed (retry: ${retryCount}/${maxRetries}):`,
        errorMessage
      );
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
   * Initialize WebSocket connection for real-time updates with enhanced reconnection
   */
  initializeWebSocket(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const wsUrl = (CODETTE_API_BASE.replace("http", "ws")) + "/ws";
        console.debug("[CodetteBridge] 🔌 Connecting to WebSocket:", wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.debug("[CodetteBridge] ✅ WebSocket connected successfully");
          this.wsConnected = true;
          this.wsReconnectAttempts = 0;
          this.emit("ws_connected", true);
          this.emit("ws_ready", { status: "connected" });
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as {
              type: string;
              data?: unknown;
            };
            
            // Enhanced logging with structured data
            const dataKeys = message.data && typeof message.data === 'object' 
              ? Object.keys(message.data as Record<string, unknown>).slice(0, 5) 
              : 'N/A';
            const logData = {
              type: message.type,
              hasData: !!message.data,
              dataType: typeof message.data,
              timestamp: new Date().toISOString(),
              dataKeys: dataKeys
            };
            console.debug("[CodetteBridge] WebSocket message received:", logData);

            // Emit events based on message type
            if (message.type === "transport_state") {
              console.debug("[CodetteBridge] → transport_changed event emitted");
              this.emit("transport_changed", message.data);
            } else if (message.type === "suggestion") {
              const suggestionArray = Array.isArray(message.data) ? message.data : [];
              console.debug("[CodetteBridge] → suggestion_received event emitted", { count: suggestionArray.length });
              this.emit("suggestion_received", message.data);
            } else if (message.type === "analysis_complete") {
              console.debug("[CodetteBridge] → analysis_complete event emitted");
              this.emit("analysis_complete", message.data);
            } else if (message.type === "state_update") {
              const stateKeys = message.data && typeof message.data === 'object'
                ? Object.keys(message.data as Record<string, unknown>)
                : [];
              console.debug("[CodetteBridge] → state_update event emitted", { keys: stateKeys });
              this.emit("state_update", message.data);
            } else if (message.type === "error") {
              console.warn("[CodetteBridge] → ws_error event emitted", message.data);
              this.emit("ws_error", message.data);
            } else {
              console.debug("[CodetteBridge] Unknown message type:", message.type);
            }
          } catch (error) {
            const dataPreview = event.data instanceof ArrayBuffer
              ? `ArrayBuffer(${event.data.byteLength})`
              : typeof event.data === 'string'
              ? event.data.substring(0, 100)
              : String(event.data);
            console.error("[CodetteBridge] Failed to parse WebSocket message:", error, { rawData: dataPreview });
          }
        };

        this.ws.onerror = (_error) => {
          console.error("[CodetteBridge] ❌ WebSocket error:", _error);
          this.wsConnected = false;
          this.emit("ws_error", _error);
        };

        this.ws.onclose = () => {
          console.debug("[CodetteBridge] WebSocket disconnected (attempt " + (this.wsReconnectAttempts + 1) + "/" + this.maxWsReconnectAttempts + ")");
          this.wsConnected = false;
          this.emit("ws_connected", false);

          // Attempt reconnection with exponential backoff
          if (this.wsReconnectAttempts < this.maxWsReconnectAttempts) {
            this.wsReconnectAttempts++;
            const delay = Math.min(
              this.wsReconnectDelay * Math.pow(2, this.wsReconnectAttempts - 1),
              30000 // Max 30 seconds
            );
            console.debug(
              `[CodetteBridge] 🔄 WebSocket reconnecting in ${delay}ms (attempt ${this.wsReconnectAttempts}/${this.maxWsReconnectAttempts})`
            );
            setTimeout(() => this.initializeWebSocket(), delay);
          } else {
            console.warn(
              `[CodetteBridge] ❌ WebSocket max reconnection attempts (${this.maxWsReconnectAttempts}) reached`
            );
            this.emit("ws_max_retries", {
              attempts: this.maxWsReconnectAttempts,
            });
          }
        };

        // Timeout if connection takes too long
        setTimeout(() => {
          if (!this.wsConnected && this.ws) {
            console.warn("[CodetteBridge] ⏱️ WebSocket connection timeout after 5s");
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
   * Force WebSocket reconnection
   */
  async forceWebSocketReconnect(): Promise<boolean> {
    console.debug("[CodetteBridge] 🔄 Force WebSocket reconnect initiated");
    this.wsReconnectAttempts = 0;
    
    if (this.ws) {
      this.ws.close();
    }
    
    return this.initializeWebSocket();
  }

  /**
   * Send message over WebSocket
   */
  sendWebSocketMessage(message: Record<string, unknown>): boolean {
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
   * Close WebSocket connection and cleanup
   */
  closeWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.wsConnected = false;
    }
  }

  /**
   * Get WebSocket connection status with details
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
   * Cleanup and destroy the bridge (for page unload)
   */
  destroy(): void {
    console.debug("[CodetteBridge] Destroying bridge instance");
    
    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    // Close WebSocket
    this.closeWebSocket();
    
    // Clear listeners
    this.listeners.clear();
    
    // Clear queue
    this.requestQueue.clear();
  }

  /**
   * Event emitter system
   */
  on(event: string, callback: (data?: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data?: unknown) => void): void {
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
