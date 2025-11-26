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
    this.initHealthCheck();
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
