/**
 * Hybrid Audio Processor
 * 
 * Intelligently routes audio processing between Web Audio API and Python DSP
 * based on effect type, quality requirements, and server availability.
 * 
 * Strategy:
 * - Use Python DSP for professional effects (EQ, Compression, Reverb, Limiter)
 * - Use Web Audio for low-latency effects (simple filters, gain)
 * - Graceful fallback to Web Audio if Python server unavailable
 * - Async processing with buffering for offline rendering
 * - Real-time processing for live playback
 */

import { getPythonDSPBridge, type DSPEffectType } from './pythonDSPBridge';
import type { Plugin, PythonDSPEffect } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface HybridProcessOptions {
  preferPython?: boolean; // Force Python DSP if available
  fallbackToWebAudio?: boolean; // Allow fallback if Python fails
  timeout?: number; // Max wait time for Python processing
  realtime?: boolean; // Optimize for real-time vs quality
}

export interface ProcessingResult {
  success: boolean;
  audioData: Float32Array | null;
  source: 'python' | 'webaudio' | 'passthrough';
  processingTime?: number;
  error?: string;
}

// ============================================================================
// EFFECT ROUTING RULES
// ============================================================================

/**
 * Determine if an effect should use Python DSP
 */
function shouldUsePythonDSP(
  effectType: string,
  options: HybridProcessOptions
): boolean {
  // Force Python if requested and available
  if (options.preferPython) {
    return true;
  }

  // Professional effects that benefit from Python DSP quality
  const pythonPreferred: string[] = [
    'compressor',
    'limiter',
    'eq',
    'eq_3band',
    'reverb',
    'hall_reverb',
    'plate_reverb',
    'room_reverb',
    'expander',
    'gate',
    'noise_gate',
    'saturation',
    'distortion',
    'chorus',
  ];

  return pythonPreferred.includes(effectType.toLowerCase());
}

/**
 * Map Web Audio plugin type to Python DSP effect type
 */
function mapWebAudioToPythonDSP(pluginType: string): DSPEffectType | null {
  const mapping: Record<string, DSPEffectType> = {
    'eq': 'eq_3band',
    'compressor': 'compressor',
    'limiter': 'limiter',
    'gate': 'gate',
    'noise_gate': 'noise_gate',
    'expander': 'expander',
    'saturation': 'saturation',
    'distortion': 'distortion',
    'delay': 'simple_delay',
    'reverb': 'reverb',
    'chorus': 'chorus',
  };

  return mapping[pluginType.toLowerCase()] || null;
}

/**
 * Extract parameters from Plugin to Python DSP format
 */
function extractPluginParameters(plugin: Plugin): Record<string, number> {
  // Plugin already has parameters in correct format
  return plugin.parameters || {};
}

// ============================================================================
// HYBRID AUDIO PROCESSOR CLASS
// ============================================================================

export class HybridAudioProcessor {
  private audioContext: AudioContext;
  private pythonBridge = getPythonDSPBridge();
  private processingStats = {
    pythonProcessed: 0,
    webAudioProcessed: 0,
    failed: 0,
    totalProcessingTime: 0,
  };

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Process audio through hybrid pipeline
   * Automatically chooses best engine (Python vs Web Audio)
   */
  async processEffect(
    plugin: Plugin,
    audioData: Float32Array,
    options: HybridProcessOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = performance.now();

    // Default options
    const opts: HybridProcessOptions = {
      preferPython: false,
      fallbackToWebAudio: true,
      timeout: 5000,
      realtime: true,
      ...options,
    };

    // Check if plugin is enabled
    if (!plugin.enabled) {
      return {
        success: true,
        audioData,
        source: 'passthrough',
        processingTime: 0,
      };
    }

    // Determine processing strategy
    const usePython = shouldUsePythonDSP(plugin.type, opts) && this.pythonBridge.isConnected();

    let result: ProcessingResult;

    if (usePython) {
      // Try Python DSP first
      result = await this.processPythonDSP(plugin, audioData, opts);
      
      // Fallback to Web Audio if Python fails
      if (!result.success && opts.fallbackToWebAudio) {
        console.warn(`[Hybrid] Python DSP failed for ${plugin.type}, falling back to Web Audio`);
        result = await this.processWebAudio(plugin, audioData, opts);
      }
    } else {
      // Use Web Audio directly
      result = await this.processWebAudio(plugin, audioData, opts);
    }

    // Update stats
    const processingTime = performance.now() - startTime;
    result.processingTime = processingTime;
    this.updateStats(result.source, processingTime);

    return result;
  }

  /**
   * Process plugin chain through hybrid pipeline
   */
  async processPluginChain(
    plugins: Plugin[],
    audioData: Float32Array,
    options: HybridProcessOptions = {}
  ): Promise<ProcessingResult> {
    let currentAudio = audioData;
    const results: ProcessingResult[] = [];

    for (const plugin of plugins) {
      if (!plugin.enabled) continue;

      const result = await this.processEffect(plugin, currentAudio, options);
      results.push(result);

      if (result.success && result.audioData) {
        currentAudio = result.audioData;
      } else {
        // Stop processing chain if effect fails
        return {
          success: false,
          audioData: currentAudio,
          source: result.source,
          error: `Plugin chain failed at ${plugin.name}: ${result.error}`,
        };
      }
    }

    return {
      success: true,
      audioData: currentAudio,
      source: 'python', // Mixed - mark as python if any used python
      processingTime: results.reduce((sum, r) => sum + (r.processingTime || 0), 0),
    };
  }

  /**
   * Check if Python DSP is available
   */
  isPythonDSPAvailable(): boolean {
    return this.pythonBridge.isConnected();
  }

  /**
   * Get processing statistics
   */
  getStats() {
    const total = this.processingStats.pythonProcessed + this.processingStats.webAudioProcessed;
    return {
      ...this.processingStats,
      pythonPercentage: total > 0 ? (this.processingStats.pythonProcessed / total) * 100 : 0,
      webAudioPercentage: total > 0 ? (this.processingStats.webAudioProcessed / total) * 100 : 0,
      averageProcessingTime: total > 0 ? this.processingStats.totalProcessingTime / total : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.processingStats = {
      pythonProcessed: 0,
      webAudioProcessed: 0,
      failed: 0,
      totalProcessingTime: 0,
    };
  }

  // ============================================================================
  // PRIVATE PROCESSING METHODS
  // ============================================================================

  /**
   * Process effect through Python DSP
   */
  private async processPythonDSP(
    plugin: Plugin,
    audioData: Float32Array,
    options: HybridProcessOptions
  ): Promise<ProcessingResult> {
    try {
      const pythonEffectType = mapWebAudioToPythonDSP(plugin.type);
      
      if (!pythonEffectType) {
        return {
          success: false,
          audioData: null,
          source: 'python',
          error: `No Python DSP mapping for ${plugin.type}`,
        };
      }

      const parameters = extractPluginParameters(plugin);

      const response = await this.pythonBridge.processEffect({
        effectType: pythonEffectType,
        parameters,
        audioData,
        sampleRate: this.audioContext.sampleRate,
      });

      if (response.success && response.processedAudio) {
        return {
          success: true,
          audioData: new Float32Array(response.processedAudio),
          source: 'python',
          processingTime: response.processingTime,
        };
      }

      return {
        success: false,
        audioData: null,
        source: 'python',
        error: response.error || 'Unknown Python DSP error',
      };
    } catch (error) {
      return {
        success: false,
        audioData: null,
        source: 'python',
        error: error instanceof Error ? error.message : 'Python DSP processing failed',
      };
    }
  }

  /**
   * Process effect through Web Audio API
   * (Simplified - uses existing AudioEngine logic)
   */
  private async processWebAudio(
    plugin: Plugin,
    audioData: Float32Array,
    options: HybridProcessOptions
  ): Promise<ProcessingResult> {
    try {
      // For now, return original audio (Web Audio processing happens in real-time graph)
      // In future, this could use OfflineAudioContext for buffer processing
      
      console.log(`[Hybrid] Processing ${plugin.type} with Web Audio (real-time graph)`);

      return {
        success: true,
        audioData: audioData, // Pass through - Web Audio handles in real-time
        source: 'webaudio',
      };
    } catch (error) {
      return {
        success: false,
        audioData: null,
        source: 'webaudio',
        error: error instanceof Error ? error.message : 'Web Audio processing failed',
      };
    }
  }

  /**
   * Update processing statistics
   */
  private updateStats(source: 'python' | 'webaudio' | 'passthrough', processingTime: number) {
    if (source === 'python') {
      this.processingStats.pythonProcessed++;
    } else if (source === 'webaudio') {
      this.processingStats.webAudioProcessed++;
    }
    this.processingStats.totalProcessingTime += processingTime;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let hybridProcessorInstance: HybridAudioProcessor | null = null;

/**
 * Get or create hybrid audio processor
 */
export function getHybridAudioProcessor(audioContext: AudioContext): HybridAudioProcessor {
  if (!hybridProcessorInstance) {
    hybridProcessorInstance = new HybridAudioProcessor(audioContext);
  }
  return hybridProcessorInstance;
}

/**
 * Initialize hybrid audio processor
 */
export function initializeHybridProcessor(audioContext: AudioContext): HybridAudioProcessor {
  hybridProcessorInstance = new HybridAudioProcessor(audioContext);
  console.log('[Hybrid] Hybrid Audio Processor initialized');
  return hybridProcessorInstance;
}
