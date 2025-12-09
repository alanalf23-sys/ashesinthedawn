/**
 * Python DSP Bridge - WebSocket Client for Python DSP Core Integration
 * 
 * Connects CoreLogic Studio frontend to the Python DSP server for:
 * - Professional audio effect processing (19 effects)
 * - Real-time parameter synchronization
 * - Transport clock synchronization
 * - Audio buffer serialization
 * 
 * Architecture:
 * React → AudioEngine → PythonDSPBridge → WebSocket → Python Server → DSP Effects
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PythonDSPConfig {
  serverUrl: string;
  reconnectInterval: number;
  heartbeatInterval: number;
  timeout: number;
}

export interface DSPEffectParameter {
  name: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
}

export interface DSPEffectRequest {
  effectType: string;
  parameters: Record<string, number>;
  audioData: Float32Array | number[];
  sampleRate: number;
  requestId?: string;
}

export interface DSPEffectResponse {
  success: boolean;
  processedAudio?: Float32Array | number[];
  effectType: string;
  processingTime?: number;
  error?: string;
  requestId?: string;
}

export interface TransportState {
  playing: boolean;
  time_seconds: number;
  bpm: number;
  sample_pos: number;
  beat_pos: number;
  loop_enabled: boolean;
  loop_start_seconds: number;
  loop_end_seconds: number;
}

export type DSPEffectType =
  | "eq_3band"
  | "highpass"
  | "lowpass"
  | "compressor"
  | "limiter"
  | "expander"
  | "gate"
  | "noise_gate"
  | "saturation"
  | "hardclip"
  | "distortion"
  | "waveshaper"
  | "simple_delay"
  | "pingpong_delay"
  | "multitap_delay"
  | "stereo_delay"
  | "reverb"
  | "hall_reverb"
  | "plate_reverb"
  | "room_reverb"
  | "chorus";

export interface DSPEffectDefinition {
  id: DSPEffectType;
  name: string;
  category: "eq" | "dynamics" | "saturation" | "delay" | "reverb" | "modulation";
  parameters: DSPEffectParameter[];
  description: string;
}

// ============================================================================
// PYTHON DSP BRIDGE CLASS
// ============================================================================

export class PythonDSPBridge {
  private ws: WebSocket | null = null;
  private config: PythonDSPConfig;
  private connected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private requestCallbacks: Map<string, (response: any) => void> = new Map();
  private transportState: TransportState | null = null;
  private onTransportUpdate: ((state: TransportState) => void) | null = null;
  private onConnectionChange: ((connected: boolean) => void) | null = null;
  
  constructor(config?: Partial<PythonDSPConfig>) {
    this.config = {
      serverUrl: config?.serverUrl || "ws://localhost:8000/ws",
      reconnectInterval: config?.reconnectInterval || 5000,
      heartbeatInterval: config?.heartbeatInterval || 30000,
      timeout: config?.timeout || 10000,
    };
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Connect to Python DSP server
   */
  public async connect(): Promise<boolean> {
    if (this.ws && this.connected) {
      console.log("[PythonDSP] Already connected");
      return true;
    }

    try {
      console.log(`[PythonDSP] Connecting to ${this.config.serverUrl}...`);
      
      this.ws = new WebSocket(this.config.serverUrl);

      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error("WebSocket not initialized"));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout"));
          this.ws?.close();
        }, this.config.timeout);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.connected = true;
          console.log("[PythonDSP] ✅ Connected to Python DSP server");
          this.startHeartbeat();
          this.onConnectionChange?.(true);
          resolve(true);
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error("[PythonDSP] WebSocket error:", error);
          this.connected = false;
          this.onConnectionChange?.(false);
          reject(error);
        };

        this.ws.onclose = () => {
          clearTimeout(timeout);
          console.log("[PythonDSP] Connection closed");
          this.connected = false;
          this.onConnectionChange?.(false);
          this.scheduleReconnect();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      });
    } catch (error) {
      console.error("[PythonDSP] Connection failed:", error);
      this.connected = false;
      this.onConnectionChange?.(false);
      this.scheduleReconnect();
      return false;
    }
  }

  /**
   * Disconnect from server
   */
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.onConnectionChange?.(false);
    console.log("[PythonDSP] Disconnected");
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    console.log(`[PythonDSP] Reconnecting in ${this.config.reconnectInterval}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(console.error);
    }, this.config.reconnectInterval);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) return;
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: "ping" });
      }
    }, this.config.heartbeatInterval);
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      const { type, data: payload } = message;

      switch (type) {
        case "connected":
          console.log("[PythonDSP] Handshake received");
          break;

        case "pong":
          // Heartbeat response
          break;

        case "server_status":
          if (payload?.transport) {
            this.transportState = payload.transport;
            this.onTransportUpdate?.(payload.transport);
          }
          break;

        case "effect_response":
          this.handleEffectResponse(payload);
          break;

        case "error":
          console.error("[PythonDSP] Server error:", payload);
          break;

        default:
          console.log("[PythonDSP] Unknown message type:", type);
      }
    } catch (error) {
      console.error("[PythonDSP] Failed to parse message:", error);
    }
  }

  /**
   * Handle DSP effect processing response
   */
  private handleEffectResponse(payload: any): void {
    const { requestId } = payload;
    if (requestId && this.requestCallbacks.has(requestId)) {
      const callback = this.requestCallbacks.get(requestId);
      callback?.(payload);
      this.requestCallbacks.delete(requestId);
    }
  }

  /**
   * Send message to server
   */
  private send(message: any): void {
    if (!this.isConnected()) {
      console.warn("[PythonDSP] Cannot send - not connected");
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
    } catch (error) {
      console.error("[PythonDSP] Failed to send message:", error);
    }
  }

  // ============================================================================
  // DSP EFFECT PROCESSING
  // ============================================================================

  /**
   * Process audio through Python DSP effect
   */
  public async processEffect(request: DSPEffectRequest): Promise<DSPEffectResponse> {
    if (!this.isConnected()) {
      return {
        success: false,
        effectType: request.effectType,
        error: "Not connected to Python DSP server",
      };
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeout = setTimeout(() => {
        this.requestCallbacks.delete(requestId);
        reject(new Error("Request timeout"));
      }, this.config.timeout);

      // Register callback
      this.requestCallbacks.set(requestId, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });

      // Send request
      this.send({
        type: "process_effect",
        data: {
          requestId,
          effectType: request.effectType,
          parameters: request.parameters,
          audioData: Array.from(request.audioData), // Convert Float32Array to regular array
          sampleRate: request.sampleRate,
        },
      });
    });
  }

  /**
   * Get available DSP effects list
   */
  public getAvailableEffects(): DSPEffectDefinition[] {
    return [
      {
        id: "eq_3band",
        name: "3-Band EQ",
        category: "eq",
        description: "Professional 3-band parametric EQ with shelving",
        parameters: [
          { name: "low_gain", value: 0, min: -24, max: 24, unit: "dB" },
          { name: "low_freq", value: 100, min: 20, max: 500, unit: "Hz" },
          { name: "mid_gain", value: 0, min: -24, max: 24, unit: "dB" },
          { name: "mid_freq", value: 1000, min: 200, max: 8000, unit: "Hz" },
          { name: "mid_q", value: 1.0, min: 0.1, max: 10, unit: "Q" },
          { name: "high_gain", value: 0, min: -24, max: 24, unit: "dB" },
          { name: "high_freq", value: 8000, min: 2000, max: 20000, unit: "Hz" },
        ],
      },
      {
        id: "compressor",
        name: "Compressor",
        category: "dynamics",
        description: "VCA-style compressor with lookahead and soft knee",
        parameters: [
          { name: "threshold", value: -20, min: -60, max: 0, unit: "dB" },
          { name: "ratio", value: 4, min: 1, max: 20, unit: ":1" },
          { name: "attack", value: 5, min: 0.1, max: 100, unit: "ms" },
          { name: "release", value: 50, min: 10, max: 1000, unit: "ms" },
          { name: "knee", value: 6, min: 0, max: 12, unit: "dB" },
          { name: "makeup_gain", value: 0, min: 0, max: 24, unit: "dB" },
        ],
      },
      {
        id: "reverb",
        name: "Reverb",
        category: "reverb",
        description: "High-quality algorithmic reverb",
        parameters: [
          { name: "room_size", value: 0.5, min: 0, max: 1, unit: "" },
          { name: "decay_time", value: 1.5, min: 0.1, max: 10, unit: "s" },
          { name: "pre_delay", value: 0, min: 0, max: 100, unit: "ms" },
          { name: "damping", value: 0.5, min: 0, max: 1, unit: "" },
          { name: "mix", value: 0.3, min: 0, max: 1, unit: "%" },
        ],
      },
      {
        id: "simple_delay",
        name: "Delay",
        category: "delay",
        description: "Simple delay effect with feedback",
        parameters: [
          { name: "delay_time", value: 0.5, min: 0.01, max: 2, unit: "s" },
          { name: "feedback", value: 0.3, min: 0, max: 0.95, unit: "" },
          { name: "mix", value: 0.3, min: 0, max: 1, unit: "%" },
        ],
      },
      {
        id: "saturation",
        name: "Saturation",
        category: "saturation",
        description: "Analog-style soft saturation",
        parameters: [
          { name: "drive", value: 1, min: 1, max: 20, unit: "dB" },
          { name: "mix", value: 1, min: 0, max: 1, unit: "%" },
        ],
      },
    ];
  }

  // ============================================================================
  // TRANSPORT SYNC
  // ============================================================================

  /**
   * Get current transport state
   */
  public getTransportState(): TransportState | null {
    return this.transportState;
  }

  /**
   * Register transport update callback
   */
  public onTransportStateUpdate(callback: (state: TransportState) => void): void {
    this.onTransportUpdate = callback;
  }

  /**
   * Register connection change callback
   */
  public onConnectionStateChange(callback: (connected: boolean) => void): void {
    this.onConnectionChange = callback;
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * Get server health status
   */
  public async getHealth(): Promise<{ status: string; connected: boolean }> {
    if (!this.isConnected()) {
      return { status: "disconnected", connected: false };
    }

    try {
      // Use REST API for health check
      const response = await fetch(`${this.config.serverUrl.replace("ws://", "http://").replace("/ws", "")}/health`);
      const data = await response.json();
      return { status: data.status, connected: this.connected };
    } catch (error) {
      console.error("[PythonDSP] Health check failed:", error);
      return { status: "error", connected: this.connected };
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let bridgeInstance: PythonDSPBridge | null = null;

/**
 * Get or create Python DSP Bridge singleton
 */
export function getPythonDSPBridge(config?: Partial<PythonDSPConfig>): PythonDSPBridge {
  if (!bridgeInstance) {
    bridgeInstance = new PythonDSPBridge(config);
  }
  return bridgeInstance;
}

/**
 * Initialize Python DSP Bridge and auto-connect
 */
export async function initializePythonDSP(config?: Partial<PythonDSPConfig>): Promise<boolean> {
  const bridge = getPythonDSPBridge(config);
  try {
    const connected = await bridge.connect();
    if (connected) {
      console.log("[PythonDSP] ✅ Python DSP Bridge initialized successfully");
    }
    return connected;
  } catch (error) {
    console.error("[PythonDSP] Failed to initialize:", error);
    return false;
  }
}

/**
 * Disconnect Python DSP Bridge
 */
export function disconnectPythonDSP(): void {
  if (bridgeInstance) {
    bridgeInstance.disconnect();
    bridgeInstance = null;
  }
}
