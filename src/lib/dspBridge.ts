/**
 * DSP Bridge - Frontend to Python Backend Communication
 * 
 * Provides REST API client for audio processing effects, automation, and metering
 * Connects React frontend to daw_core Python DSP engine
 * 
 * Endpoints:
 * - Effects: Process audio through 19 professional effects via unified endpoint
 * - Automation: Generate curves, LFO, envelopes
 * - Metering: Level, spectrum, VU, correlation analysis
 * - Engine: Start/stop audio engine, configure parameters
 */

import { errorManager } from "./errorHandling";

// Backend configuration
const BACKEND_URL = import.meta.env.VITE_CODETTE_API || "http://localhost:8000";
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
// EFFECT TYPE NORMALIZATION (Priority 3)
// ============================================================================

/**
 * Frontend effect name to backend effect type mapping
 * Ensures compatibility between UI names and backend EFFECT_TYPE_MAP
 */
export const FRONTEND_TO_BACKEND_EFFECT_MAP: Record<string, string> = {
  // EQ Effects
  'high-pass': 'highpass',
  'highpass': 'highpass',
  'high_pass': 'highpass',
  'low-pass': 'lowpass',
  'lowpass': 'lowpass',
  'low_pass': 'lowpass',
  'eq-3-band': '3band',
  '3band': '3band',
  'eq3band': '3band',
  'parametric': '3band',
  
  // Dynamics
  'compressor': 'compressor',
  'limiter': 'limiter',
  'expander': 'expander',
  'gate': 'gate',
  'noisegate': 'gate',
  'noise-gate': 'gate',
  'noise_gate': 'gate',
  
  // Saturation
  'saturation': 'saturation',
  'distortion': 'distortion',
  'waveshaper': 'waveshaper',
  'wave-shaper': 'waveshaper',
  'wave_shaper': 'waveshaper',
  'hardclip': 'hardclip',
  'hard-clip': 'hardclip',
  'hard_clip': 'hardclip',
  
  // Delays
  'delay': 'delay',
  'simple-delay': 'delay',
  'simple_delay': 'delay',
  'pingpong': 'pingpong',
  'ping-pong': 'pingpong',
  'ping_pong': 'pingpong',
  'pingpong-delay': 'pingpong',
  'pingpong_delay': 'pingpong',
  'multitap': 'multitap',
  'multi-tap': 'multitap',
  'multi_tap': 'multitap',
  'multitap-delay': 'multitap',
  'multitap_delay': 'multitap',
  'stereo-delay': 'stereo_delay',
  'stereo_delay': 'stereo_delay',
  
  // Reverb
  'reverb': 'reverb',
  'freeverb': 'reverb',
  'hall': 'hall',
  'hall-reverb': 'hall',
  'hall_reverb': 'hall',
  'plate': 'plate',
  'plate-reverb': 'plate',
  'plate_reverb': 'plate',
  'room': 'room',
  'room-reverb': 'room',
  'room_reverb': 'room',
};

/**
 * Normalize effect type name for backend compatibility
 * Handles case variations, separators, and aliases
 * 
 * @param effectType - Frontend effect type name
 * @returns Backend-compatible effect type
 * @throws Error if effect type is unknown
 */
export function normalizeEffectType(effectType: string): string {
  // Normalize to lowercase and replace separators
  const normalized = effectType.toLowerCase().trim().replace(/\s+/g, '-');
  
  // Look up in mapping
  const backendType = FRONTEND_TO_BACKEND_EFFECT_MAP[normalized];
  
  if (!backendType) {
    const availableTypes = Object.keys(FRONTEND_TO_BACKEND_EFFECT_MAP)
      .filter((key, index, self) => self.indexOf(key) === index)
      .join(', ');
    
    throw new Error(
      `Unknown effect type: "${effectType}". ` +
      `Available types: ${availableTypes}`
    );
  }
  
  return backendType;
}

/**
 * Validate effect type exists
 * 
 * @param effectType - Effect type to validate
 * @returns True if valid, false otherwise
 */
export function isValidEffectType(effectType: string): boolean {
  try {
    normalizeEffectType(effectType);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all supported effect types (frontend names)
 * 
 * @returns Array of supported effect type names
 */
export function getSupportedEffectTypes(): string[] {
  const unique = new Set(Object.values(FRONTEND_TO_BACKEND_EFFECT_MAP));
  return Array.from(unique).sort();
}

// ============================================================================
// EFFECT PROCESSING (UPDATED TO USE UNIFIED ENDPOINT)
// ============================================================================

export interface EffectProcessRequest {
  effect_type: string;
  parameters: Record<string, number>;
  audio_data: number[];
  sample_rate?: number;
}

export interface EffectProcessResponse {
  status: "success" | "error";
  effect: string;
  parameters: Record<string, number>;
  output: number[];
  length: number;
  sample_rate: number;
  timestamp: string;
}

/**
 * Process audio through a specific effect using UNIFIED endpoint
 * @param effectType - Effect name (e.g., 'compressor', 'highpass', 'reverb')
 * @param audioData - Input audio samples
 * @param parameters - Effect-specific parameters
 * @param sampleRate - Sample rate in Hz (default: 44100)
 * @returns Processed audio samples
 */
export async function processEffect(
  effectType: string,
  audioData: Float32Array,
  parameters: Record<string, number>,
  sampleRate: number = 44100
): Promise<Float32Array> {
  // Normalize effect type to backend-compatible name
  const normalizedType = normalizeEffectType(effectType);
  
  const request: EffectProcessRequest = {
    effect_type: normalizedType,
    parameters,
    audio_data: Array.from(audioData),
    sample_rate: sampleRate,
  };

  // Use unified endpoint for ALL effects
  const response = await safeFetch<EffectProcessResponse>("/api/effects/process", {
    method: "POST",
    body: JSON.stringify(request),
  });

  return new Float32Array(response.output);
}

/**
 * Process audio through effect chain (serial processing)
 * @param audioData - Input audio samples
 * @param effectChain - Array of effects to apply in sequence
 * @param sampleRate - Sample rate in Hz
 * @returns Processed audio samples
 */
export async function processEffectChain(
  audioData: Float32Array,
  effectChain: Array<{ type: string; parameters: Record<string, number> }>,
  sampleRate: number = 44100
): Promise<Float32Array> {
  let output = audioData;

  for (const effect of effectChain) {
    try {
      // Normalize effect type before processing
      output = await processEffect(effect.type, output, effect.parameters, sampleRate);
    } catch (error) {
      console.error(`Failed to process ${effect.type}:`, error);
      // Continue with previous output on error
    }
  }

  return output;
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
