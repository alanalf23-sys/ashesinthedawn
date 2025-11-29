/**
 * DSP Bridge - Frontend to Python Backend Communication
 * 
 * Provides REST API client for audio processing effects, automation, and metering
 * Connects React frontend to daw_core Python DSP engine
 * 
 * Endpoints:
 * - Effects: Process audio through 19 professional effects
 * - Automation: Generate curves, LFO, envelopes
 * - Metering: Level, spectrum, VU, correlation analysis
 * - Engine: Start/stop audio engine, configure parameters
 */

import { errorManager } from "./errorHandling";

// Backend configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8001";
const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000; // ms

// Global connection state
let connectionState = {
  connected: false,
  retries: 0,
  lastError: null as string | null,
};

/**
 * Initialize connection to backend with health check
 */
export async function initializeDSPBridge(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    if (!response.ok) throw new Error(`Health check failed: ${response.status}`);

    const data = await response.json();
    connectionState.connected = true;
    connectionState.retries = 0;
    connectionState.lastError = null;

    console.log("✓ DSP Bridge initialized", data);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    connectionState.lastError = message;
    console.error("✗ DSP Bridge initialization failed:", message);
    return false;
  }
}

/**
 * Retry connection with exponential backoff
 */
async function reconnectWithBackoff(): Promise<boolean> {
  if (connectionState.retries >= RECONNECT_ATTEMPTS) {
  errorManager.registerError({
      id: `dsp-connection-max-retries-${Date.now()}`,
      title: "DSP Connection Failed",
      message: `DSP backend unreachable after ${RECONNECT_ATTEMPTS} attempts`,
      severity: "error",
      timestamp: Date.now(),
      recoverable: true,
    });
    return false;
  }

  const delay = RECONNECT_DELAY * Math.pow(2, connectionState.retries);
  await new Promise((resolve) => setTimeout(resolve, delay));

  connectionState.retries++;
  return initializeDSPBridge();
}

/**
 * Safe fetch wrapper with error handling
 */
async function safeFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    if (!connectionState.connected) {
      const connected = await reconnectWithBackoff();
      if (!connected) {
        throw new Error("DSP backend not available");
      }
    }

    const url = `${BACKEND_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    connectionState.connected = false;

    errorManager.registerError({
      id: `dsp-fetch-error-${Date.now()}`,
      title: "DSP Request Failed",
      message: `DSP request failed: ${message}`,
      severity: "error",
      timestamp: Date.now(),
      recoverable: true,
    });

    throw error;
  }
}

// ============================================================================
// EFFECT PROCESSING
// ============================================================================

export interface EffectProcessRequest {
  effect_type: string;
  parameters: Record<string, number>;
  audio_data: number[];
}

export interface EffectProcessResponse {
  status: "success" | "error";
  effect: string;
  parameters: Record<string, number>;
  output: number[];
  length: number;
}

/**
 * Process audio through a specific effect
 */
export async function processEffect(
  effectType: string,
  audioData: Float32Array,
  parameters: Record<string, number>
): Promise<Float32Array> {
  const request: EffectProcessRequest = {
    effect_type: effectType,
    parameters,
    audio_data: Array.from(audioData),
  };

  const endpoint = getEffectEndpoint(effectType);
  const response = await safeFetch<EffectProcessResponse>(endpoint, {
    method: "POST",
    body: JSON.stringify(request),
  });

  return new Float32Array(response.output);
}

/**
 * Map effect names to API endpoints
 */
function getEffectEndpoint(effectType: string): string {
  const effectMap: Record<string, string> = {
    // EQ effects
    "highpass": "/process/eq/highpass",
    "lowpass": "/process/eq/lowpass",
    "peaking": "/process/eq/peaking",
    "3band-eq": "/process/eq/3band",

    // Dynamics
    "compressor": "/process/dynamics/compressor",
    "limiter": "/process/dynamics/limiter",
    "expander": "/process/dynamics/expander",
    "gate": "/process/dynamics/gate",

    // Saturation
    "saturation": "/process/saturation/saturation",
    "distortion": "/process/saturation/distortion",
    "wave-shaper": "/process/saturation/waveshaper",

    // Delays
    "simple-delay": "/process/delay/simple",
    "ping-pong": "/process/delay/pingpong",
    "multi-tap": "/process/delay/multitap",
    "stereo-delay": "/process/delay/stereo",

    // Reverb
    "freeverb": "/process/reverb/freeverb",
    "hall": "/process/reverb/hall",
    "plate": "/process/reverb/plate",
    "room": "/process/reverb/room",
  };

  const endpoint = effectMap[effectType.toLowerCase()];
  if (!endpoint) {
    throw new Error(`Unknown effect type: ${effectType}`);
  }

  return endpoint;
}

// ============================================================================
// AUTOMATION
// ============================================================================

export interface AutomationRequest {
  automation_type: string;
  parameters: Record<string, number | string>;
  duration: number;
  sample_rate: number;
}

export interface AutomationResponse {
  status: "success" | "error";
  automation_type: string;
  duration: number;
  values: number[];
  [key: string]: unknown;
}

/**
 * Generate automation curve
 */
export async function generateAutomationCurve(
  duration: number,
  curveType: "linear" | "exponential" | "logarithmic" = "linear",
  startValue: number = 0,
  endValue: number = 1,
  sampleRate: number = 44100
): Promise<Float32Array> {
  const request: AutomationRequest = {
    automation_type: "curve",
    parameters: {
      curve_type: curveType,
      start_value: startValue,
      end_value: endValue,
    },
    duration,
    sample_rate: sampleRate,
  };

  const response = await safeFetch<AutomationResponse>("/automation/curve", {
    method: "POST",
    body: JSON.stringify(request),
  });

  return new Float32Array(response.values);
}

/**
 * Generate LFO modulation
 */
export async function generateLFO(
  duration: number,
  waveform: "sine" | "triangle" | "square" | "sawtooth" = "sine",
  rate: number = 1.0,
  amount: number = 1.0,
  sampleRate: number = 44100
): Promise<Float32Array> {
  const request: AutomationRequest = {
    automation_type: "lfo",
    parameters: {
      waveform,
      rate,
      amount,
    },
    duration,
    sample_rate: sampleRate,
  };

  const response = await safeFetch<AutomationResponse>("/automation/lfo", {
    method: "POST",
    body: JSON.stringify(request),
  });

  return new Float32Array(response.values);
}

/**
 * Generate ADSR envelope
 */
export async function generateEnvelope(
  duration: number,
  attack: number = 0.1,
  decay: number = 0.2,
  sustain: number = 0.7,
  release: number = 0.3,
  sampleRate: number = 44100
): Promise<Float32Array> {
  const request: AutomationRequest = {
    automation_type: "envelope",
    parameters: {
      attack,
      decay,
      sustain,
      release,
    },
    duration,
    sample_rate: sampleRate,
  };

  const response = await safeFetch<AutomationResponse>("/automation/envelope", {
    method: "POST",
    body: JSON.stringify(request),
  });

  return new Float32Array(response.values);
}

// ============================================================================
// METERING
// ============================================================================

export interface MeteringRequest {
  meter_type: string;
  audio_data: number[];
  sample_rate: number;
}

export interface LevelMeterResponse {
  status: "success" | "error";
  meter_type: "level";
  peak: number;
  rms: number;
  loudness_lufs: number;
  headroom: number;
}

export interface SpectrumAnalyzerResponse {
  status: "success" | "error";
  meter_type: "spectrum";
  frequencies: number[];
  magnitudes: number[];
  num_bins: number;
}

export interface VUMeterResponse {
  status: "success" | "error";
  meter_type: "vu";
  vu_db: number;
  scaled: number;
}

export interface CorrelometerResponse {
  status: "success" | "error";
  meter_type: "correlation";
  correlation: number;
  mono: boolean;
  stereo: boolean;
}

/**
 * Analyze audio levels
 */
export async function analyzeLevels(
  audioData: Float32Array,
  sampleRate: number = 44100
): Promise<LevelMeterResponse> {
  const request: MeteringRequest = {
    meter_type: "level",
    audio_data: Array.from(audioData),
    sample_rate: sampleRate,
  };

  return safeFetch<LevelMeterResponse>("/metering/level", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Analyze frequency spectrum
 */
export async function analyzeSpectrum(
  audioData: Float32Array,
  sampleRate: number = 44100
): Promise<SpectrumAnalyzerResponse> {
  const request: MeteringRequest = {
    meter_type: "spectrum",
    audio_data: Array.from(audioData),
    sample_rate: sampleRate,
  };

  return safeFetch<SpectrumAnalyzerResponse>("/metering/spectrum", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Analyze VU meter
 */
export async function analyzeVU(
  audioData: Float32Array,
  sampleRate: number = 44100
): Promise<VUMeterResponse> {
  const request: MeteringRequest = {
    meter_type: "vu",
    audio_data: Array.from(audioData),
    sample_rate: sampleRate,
  };

  return safeFetch<VUMeterResponse>("/metering/vu", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Analyze stereo correlation
 */
export async function analyzeCorrelation(
  audioData: Float32Array,
  sampleRate: number = 44100
): Promise<CorrelometerResponse> {
  const request: MeteringRequest = {
    meter_type: "correlation",
    audio_data: Array.from(audioData),
    sample_rate: sampleRate,
  };

  return safeFetch<CorrelometerResponse>("/metering/correlation", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// ============================================================================
// ENGINE CONTROL
// ============================================================================

export interface EngineConfig {
  sample_rate: number;
  buffer_size: number;
  is_running: boolean;
  num_nodes: number;
}

/**
 * Get backend engine configuration
 */
export async function getEngineConfig(): Promise<EngineConfig> {
  return safeFetch<EngineConfig>("/engine/config");
}

/**
 * Start the backend audio engine
 */
export async function startEngine(): Promise<{ status: string; engine_state: string }> {
  return safeFetch("/engine/start", { method: "POST" });
}

/**
 * Stop the backend audio engine
 */
export async function stopEngine(): Promise<{ status: string; engine_state: string }> {
  return safeFetch("/engine/stop", { method: "POST" });
}

/**
 * List available effects
 */
export async function listAvailableEffects(): Promise<Record<string, string[]>> {
  return safeFetch("/effects");
}

/**
 * Get connection status
 */
export function getConnectionStatus(): {
  connected: boolean;
  lastError: string | null;
  retries: number;
} {
  return { ...connectionState };
}

/**
 * Reset connection state (for debugging)
 */
export function resetConnection(): void {
  connectionState = {
    connected: false,
    retries: 0,
    lastError: null,
  };
}
