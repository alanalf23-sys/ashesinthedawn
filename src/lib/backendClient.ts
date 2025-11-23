/**
 * Backend Client - Communicates with Python DSP backend (FastAPI)
 * Handles audio effect processing, automation, metering, and AI recommendations
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

// ============================================================================
// TYPES
// ============================================================================

export interface EffectResponse {
  status: string;
  effect: string;
  parameters: Record<string, number>;
  output: number[];
  length: number;
}

export interface AutomationResponse {
  status: string;
  automation_type: string;
  values: number[];
  [key: string]: unknown;
}

export interface MeteringResponse {
  status: string;
  meter_type: string;
  [key: string]: unknown;
}

export interface EngineConfig {
  sample_rate: number;
  buffer_size: number;
  is_running: boolean;
  num_nodes: number;
}

export interface AIRecommendation {
  effect_type: string;
  parameters: Record<string, number>;
  reason: string;
  confidence: number;
}

// ============================================================================
// BACKEND CLIENT CLASS
// ============================================================================

class BackendClient {
  private baseUrl: string;
  private isConnected: boolean = false;

  constructor(baseUrl: string = BACKEND_URL) {
    this.baseUrl = baseUrl;
    this.verifyConnection();
  }

  /**
   * Verify connection to backend
   */
  private async verifyConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      this.isConnected = response.ok;
      if (this.isConnected) {
        console.log("✓ Connected to backend DSP engine");
      }
      return this.isConnected;
    } catch (error) {
      console.warn("✗ Backend connection failed:", error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Check if backend is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isConnected) {
      return await this.verifyConnection();
    }
    return true;
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error("Health check failed:", error);
      return { status: "unavailable", error: String(error) };
    }
  }

  /**
   * List available effects
   */
  async listEffects(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/effects`);
      return await response.json();
    } catch (error) {
      console.error("Failed to list effects:", error);
      return { error: String(error) };
    }
  }

  /**
   * List available automation types
   */
  async listAutomationTypes(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/automation-types`);
      return await response.json();
    } catch (error) {
      console.error("Failed to list automation types:", error);
      return { error: String(error) };
    }
  }

  /**
   * List available metering types
   */
  async listMeteringTypes(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/metering-types`);
      return await response.json();
    } catch (error) {
      console.error("Failed to list metering types:", error);
      return { error: String(error) };
    }
  }

  // ============================================================================
  // EFFECT PROCESSING
  // ============================================================================

  /**
   * Process audio with EQ effect
   */
  async processEQ(
    audioData: number[],
    type: "highpass" | "lowpass" | "3band",
    parameters: Record<string, number>
  ): Promise<EffectResponse> {
    const endpoint =
      type === "3band"
        ? "/process/eq/3band"
        : `/process/eq/${type}`;

    return this.processAudio(endpoint, {
      effect_type: `eq_${type}`,
      parameters,
      audio_data: audioData,
    });
  }

  /**
   * Process audio with compressor
   */
  async processCompressor(
    audioData: number[],
    parameters: Record<string, number>
  ): Promise<EffectResponse> {
    return this.processAudio("/process/dynamics/compressor", {
      effect_type: "compressor",
      parameters,
      audio_data: audioData,
    });
  }

  /**
   * Process audio with limiter
   */
  async processLimiter(
    audioData: number[],
    parameters: Record<string, number>
  ): Promise<EffectResponse> {
    return this.processAudio("/process/dynamics/limiter", {
      effect_type: "limiter",
      parameters,
      audio_data: audioData,
    });
  }

  /**
   * Process audio with saturation
   */
  async processSaturation(
    audioData: number[],
    parameters: Record<string, number>
  ): Promise<EffectResponse> {
    return this.processAudio("/process/saturation/saturation", {
      effect_type: "saturation",
      parameters,
      audio_data: audioData,
    });
  }

  /**
   * Process audio with distortion
   */
  async processDistortion(
    audioData: number[],
    parameters: Record<string, number>
  ): Promise<EffectResponse> {
    return this.processAudio("/process/saturation/distortion", {
      effect_type: "distortion",
      parameters,
      audio_data: audioData,
    });
  }

  /**
   * Process audio with delay
   */
  async processDelay(
    audioData: number[],
    parameters: Record<string, number>
  ): Promise<EffectResponse> {
    return this.processAudio("/process/delay/simple", {
      effect_type: "delay",
      parameters,
      audio_data: audioData,
    });
  }

  /**
   * Process audio with reverb
   */
  async processReverb(
    audioData: number[],
    parameters: Record<string, number>
  ): Promise<EffectResponse> {
    return this.processAudio("/process/reverb/freeverb", {
      effect_type: "reverb",
      parameters,
      audio_data: audioData,
    });
  }

  /**
   * Generic audio processing
   */
  private async processAudio(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<EffectResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Audio processing failed at ${endpoint}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // AUTOMATION
  // ============================================================================

  /**
   * Create automation curve
   */
  async createAutomationCurve(
    curveType: string,
    startValue: number,
    endValue: number,
    duration: number,
    sampleRate: number = 44100
  ): Promise<AutomationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/automation/curve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          automation_type: "curve",
          parameters: {
            curve_type: curveType,
            start_value: startValue,
            end_value: endValue,
          },
          duration,
          sample_rate: sampleRate,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Automation curve creation failed:", error);
      throw error;
    }
  }

  /**
   * Create LFO modulation
   */
  async createLFO(
    waveform: string,
    rate: number,
    amount: number,
    duration: number,
    sampleRate: number = 44100
  ): Promise<AutomationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/automation/lfo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          automation_type: "lfo",
          parameters: { waveform, rate, amount },
          duration,
          sample_rate: sampleRate,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("LFO creation failed:", error);
      throw error;
    }
  }

  /**
   * Create ADSR envelope
   */
  async createEnvelope(
    attack: number,
    decay: number,
    sustain: number,
    release: number,
    duration: number,
    sampleRate: number = 44100
  ): Promise<AutomationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/automation/envelope`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          automation_type: "envelope",
          parameters: { attack, decay, sustain, release },
          duration,
          sample_rate: sampleRate,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Envelope creation failed:", error);
      throw error;
    }
  }

  // ============================================================================
  // METERING
  // ============================================================================

  /**
   * Analyze audio levels
   */
  async analyzeLevel(
    audioData: number[],
    sampleRate: number = 44100
  ): Promise<MeteringResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/metering/level`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meter_type: "level",
          audio_data: audioData,
          sample_rate: sampleRate,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Level analysis failed:", error);
      throw error;
    }
  }

  /**
   * Analyze frequency spectrum
   */
  async analyzeSpectrum(
    audioData: number[],
    sampleRate: number = 44100
  ): Promise<MeteringResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/metering/spectrum`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meter_type: "spectrum",
          audio_data: audioData,
          sample_rate: sampleRate,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Spectrum analysis failed:", error);
      throw error;
    }
  }

  /**
   * Analyze VU meter
   */
  async analyzeVU(
    audioData: number[],
    sampleRate: number = 44100
  ): Promise<MeteringResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/metering/vu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meter_type: "vu",
          audio_data: audioData,
          sample_rate: sampleRate,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("VU analysis failed:", error);
      throw error;
    }
  }

  /**
   * Analyze stereo correlation
   */
  async analyzeCorrelation(
    audioData: number[],
    sampleRate: number = 44100
  ): Promise<MeteringResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/metering/correlation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meter_type: "correlation",
          audio_data: audioData,
          sample_rate: sampleRate,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Correlation analysis failed:", error);
      throw error;
    }
  }

  // ============================================================================
  // ENGINE CONTROL
  // ============================================================================

  /**
   * Start audio engine
   */
  async startEngine(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/engine/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Engine start failed:", error);
      throw error;
    }
  }

  /**
   * Stop audio engine
   */
  async stopEngine(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(`${this.baseUrl}/engine/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Engine stop failed:", error);
      throw error;
    }
  }

  /**
   * Get engine configuration
   */
  async getEngineConfig(): Promise<EngineConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/engine/config`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Engine config retrieval failed:", error);
      throw error;
    }
  }

  /**
   * Set engine configuration
   */
  async setEngineConfig(
    sampleRate: number,
    bufferSize: number
  ): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/engine/config?sample_rate=${sampleRate}&buffer_size=${bufferSize}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Engine config update failed:", error);
      throw error;
    }
  }

  // ============================================================================
  // AI RECOMMENDATIONS (Placeholder - implement with Codette)
  // ============================================================================

  /**
   * Get AI recommendations for audio processing
   * Integrates with Codette AI for intelligent suggestions
   */
  async getAIRecommendations(
    audioProfile: {
      peakLevel: number;
      rmsLevel: number;
      frequency: "low" | "mid" | "high" | "mixed";
      contentType: "vocal" | "music" | "mixed";
    }
  ): Promise<AIRecommendation[]> {
    try {
      // This will integrate with Codette AI
      // For now, return intelligent defaults based on audio profile
      const recommendations: AIRecommendation[] = [];

      // Compressor recommendation if peaks are high
      if (audioProfile.peakLevel > -6) {
        recommendations.push({
          effect_type: "compressor",
          parameters: {
            threshold: Math.max(-24, audioProfile.peakLevel - 12),
            ratio: audioProfile.contentType === "vocal" ? 4 : 3,
            attack: 0.005,
            release: 0.1,
          },
          reason: "High peak levels detected - compression recommended",
          confidence: 0.9,
        });
      }

      // EQ recommendation based on frequency content
      if (audioProfile.frequency === "low") {
        recommendations.push({
          effect_type: "eq",
          parameters: {
            high_gain: 3,
            mid_gain: 0,
            low_gain: -2,
          },
          reason: "Bass-heavy content detected - EQ boost recommended",
          confidence: 0.85,
        });
      }

      // Saturation for dynamic range
      if (
        audioProfile.contentType === "vocal" &&
        audioProfile.rmsLevel < -20
      ) {
        recommendations.push({
          effect_type: "saturation",
          parameters: {
            drive: 1.5,
            tone: 0.5,
          },
          reason: "Vocal content with low RMS - saturation for presence",
          confidence: 0.75,
        });
      }

      return recommendations;
    } catch (error) {
      console.error("AI recommendations failed:", error);
      return [];
    }
  }

  /**
   * Analyze audio with Codette AI for mastering suggestions
   */
  async analyzeMasteringProfile(audioData: number[]): Promise<Record<string, unknown>> {
    try {
      // Get metering data
      const levelData = await this.analyzeLevel(audioData);
      const spectrumData = await this.analyzeSpectrum(audioData);

      // Integration point for Codette AI
      // Send data to AI model for mastering analysis
      const levelRecord = levelData as Record<string, unknown>;
      return {
        status: "analyzed",
        level_data: levelData,
        spectrum_data: spectrumData,
        ai_profile: {
          loudness: (levelRecord.loudness_lufs as number) || 0,
          headroom: (levelRecord.headroom as number) || 0,
          frequency_balance: "pending_ai_analysis",
        },
      };
    } catch (error) {
      console.error("Mastering profile analysis failed:", error);
      return { error: String(error) };
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let clientInstance: BackendClient | null = null;

/**
 * Get or create backend client instance
 */
export function getBackendClient(): BackendClient {
  if (!clientInstance) {
    clientInstance = new BackendClient();
  }
  return clientInstance;
}

export default BackendClient;
