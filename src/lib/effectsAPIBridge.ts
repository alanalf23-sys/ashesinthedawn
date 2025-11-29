/**
 * Effects API Bridge - Connects React UI to Python DSP Effects
 * 
 * This module provides a unified interface to call Python DSP effects
 * from the React frontend via the FastAPI backend.
 * 
 * Architecture:
 * React Component → effectsAPIBridge → Fetch API → FastAPI Server → Python DSP Effects
 */

import { Plugin } from '../types';

/**
 * Effect Processing Request
 * Audio data is encoded as base64 to transmit via JSON
 */
interface EffectProcessRequest {
  audioData: number[];
  sampleRate: number;
  effectType: string;
  parameters: Record<string, number>;
  stereoChannels?: number;
}

/**
 * Effect Processing Response
 * Returns processed audio as base64
 */
interface EffectProcessResponse {
  audioData: number[];
  success: boolean;
  error?: string;
  processingTime: number;
}

/**
 * Available Effects List from Backend
 */
interface EffectInfo {
  id: string;
  name: string;
  category: string;
  parameters: Record<string, { min: number; max: number; default: number }>;
}

/**
 * Effects API Bridge Class
 * Handles all communication with the Python DSP backend
 */
class EffectsAPIBridge {
  private apiBaseUrl: string = 'http://localhost:8000';
  private effectsCache: Map<string, EffectInfo> = new Map();
  private isInitialized = false;

  /**
   * Initialize the bridge and fetch available effects from backend
   */
  async initialize(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/daw/effects/list`);
      if (!response.ok) {
        console.warn('Effects API bridge: Backend not available yet (will retry on demand)');
        return false;
      }

      const effects: EffectInfo[] = await response.json();
      effects.forEach(effect => {
        this.effectsCache.set(effect.id, effect);
      });

      this.isInitialized = true;
      console.log(`[Effects API] Initialized with ${effects.length} effects`);
      return true;
    } catch (error) {
      console.warn('[Effects API] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Get list of available effects from the Python backend
   */
  async getAvailableEffects(): Promise<EffectInfo[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/daw/effects/list`);
      if (!response.ok) throw new Error('Failed to fetch effects list');

      const effects: EffectInfo[] = await response.json();
      effects.forEach(effect => {
        this.effectsCache.set(effect.id, effect);
      });

      return effects;
    } catch (error) {
      console.error('[Effects API] Failed to get available effects:', error);
      return [];
    }
  }

  /**
   * Get details for a specific effect
   */
  async getEffectDetails(effectId: string): Promise<EffectInfo | null> {
    try {
      // Check cache first
      if (this.effectsCache.has(effectId)) {
        return this.effectsCache.get(effectId) || null;
      }

      const response = await fetch(`${this.apiBaseUrl}/daw/effects/${effectId}`);
      if (!response.ok) throw new Error(`Effect ${effectId} not found`);

      const effect: EffectInfo = await response.json();
      this.effectsCache.set(effectId, effect);

      return effect;
    } catch (error) {
      console.error(`[Effects API] Failed to get effect details for ${effectId}:`, error);
      return null;
    }
  }

  /**
   * Process audio through a single effect
   * 
   * @param audioData - Audio samples (mono or stereo as flat array)
   * @param sampleRate - Sample rate in Hz (44100, 48000, etc.)
   * @param effectPlugin - Plugin configuration with type and parameters
   * @param stereoChannels - Number of channels (1 for mono, 2 for stereo)
   * @returns Processed audio samples
   */
  async processAudioThroughEffect(
    audioData: number[],
    sampleRate: number,
    effectPlugin: Plugin,
    stereoChannels: number = 2
  ): Promise<number[] | null> {
    try {
      if (!audioData || audioData.length === 0) {
        console.warn('[Effects API] Empty audio data provided');
        return audioData;
      }

      const request: EffectProcessRequest = {
        audioData,
        sampleRate,
        effectType: effectPlugin.type,
        parameters: effectPlugin.parameters,
        stereoChannels,
      };

      const response = await fetch(`${this.apiBaseUrl}/daw/effects/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Effect processing failed: ${error}`);
      }

      const result: EffectProcessResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown error processing effect');
      }

      console.log(`[Effects API] ${effectPlugin.name} processed in ${result.processingTime}ms`);
      return result.audioData;
    } catch (error) {
      console.error('[Effects API] Error processing audio through effect:', error);
      // Return original audio on error (graceful degradation)
      return audioData;
    }
  }

  /**
   * Process audio through a chain of effects
   * Each effect's output becomes the next effect's input
   * 
   * @param audioData - Initial audio samples
   * @param sampleRate - Sample rate
   * @param effectChain - Array of plugins to apply in order
   * @param stereoChannels - Number of channels
   * @returns Final processed audio
   */
  async processAudioThroughEffectChain(
    audioData: number[],
    sampleRate: number,
    effectChain: Plugin[],
    stereoChannels: number = 2
  ): Promise<number[]> {
    let processedAudio = audioData;

    // Apply each effect in sequence
    for (const effect of effectChain) {
      if (!effect.enabled) {
        console.log(`[Effects API] Skipping disabled effect: ${effect.name}`);
        continue;
      }

      const result = await this.processAudioThroughEffect(
        processedAudio,
        sampleRate,
        effect,
        stereoChannels
      );

      if (result) {
        processedAudio = result;
      }
    }

    return processedAudio;
  }

  /**
   * Get effect preset for a specific category
   * E.g., get "Vocal Chain" preset
   */
  async getEffectPreset(category: string, presetName: string): Promise<Plugin[] | null> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/daw/effects/presets/${category}/${presetName}`
      );
      if (!response.ok) throw new Error('Preset not found');

      const plugins: Plugin[] = await response.json();
      return plugins;
    } catch (error) {
      console.error('[Effects API] Failed to get preset:', error);
      return null;
    }
  }

  /**
   * Validate effect parameters
   * Ensures parameters are within valid ranges
   */
  async validateEffectParameters(
    effectType: string,
    parameters: Record<string, number>
  ): Promise<boolean> {
    try {
      const effect = await this.getEffectDetails(effectType);
      if (!effect) return false;

      // Check that all parameters are within valid ranges
      for (const [param, value] of Object.entries(parameters)) {
        const paramDef = effect.parameters[param];
        if (!paramDef) {
          console.warn(`[Effects API] Unknown parameter: ${param}`);
          continue;
        }

        if (value < paramDef.min || value > paramDef.max) {
          console.warn(
            `[Effects API] Parameter ${param} out of range: ${value} (${paramDef.min}-${paramDef.max})`
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[Effects API] Parameter validation error:', error);
      return false;
    }
  }

  /**
   * Test connection to the effects API
   */
  async testConnection(): Promise<{ connected: boolean; version?: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      if (response.ok) {
        return { connected: true };
      }
      return { connected: false };
    } catch {
      return { connected: false };
    }
  }

  /**
   * Set API base URL (useful for different deployments)
   */
  setApiBaseUrl(url: string): void {
    this.apiBaseUrl = url;
    console.log(`[Effects API] Base URL set to: ${url}`);
  }

  /**
   * Check if API is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const effectsAPI = new EffectsAPIBridge();

/**
 * Hook helper to use effects API in React components
 */
export function useEffectsAPI() {
  return {
    processAudio: (
      audio: number[],
      sampleRate: number,
      effect: Plugin,
      channels?: number
    ) => effectsAPI.processAudioThroughEffect(audio, sampleRate, effect, channels),
    processChain: (
      audio: number[],
      sampleRate: number,
      chain: Plugin[],
      channels?: number
    ) => effectsAPI.processAudioThroughEffectChain(audio, sampleRate, chain, channels),
    getEffects: () => effectsAPI.getAvailableEffects(),
    getEffect: (id: string) => effectsAPI.getEffectDetails(id),
    isReady: () => effectsAPI.isReady(),
  };
}

export default effectsAPI;
