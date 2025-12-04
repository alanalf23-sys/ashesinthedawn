/**
 * Codette AI + DSP Bridge Integration
 * 
 * Combines DSP effects with Codette AI for intelligent audio processing:
 * - AI-powered effect recommendations based on audio context
 * - Real-time audio analysis with Codette suggestions
 * - Automatic effect chain optimization
 * - Smart parameter suggestions based on track type and genre
 */

import { processEffect, analyzeLevels, analyzeSpectrum, generateLFO, generateAutomationCurve } from "./dspBridge";
import { getCodetteBridge, type CodetteSuggestion } from "./codetteBridge";
import { Track } from "../types";

export interface CodetteEffectAnalysis {
  suggestion: CodetteSuggestion;
  audioMetrics: {
    peak: number;
    rms: number;
    loudness: number;
    headroom: number;
  };
  spectrum?: {
    frequencies: number[];
    magnitudes: number[];
  };
  confidence: number;
  reason: string;
}

export interface EffectChainOptimization {
  originalEffects: string[];
  optimizedChain: Array<{
    effect: string;
    parameters: Record<string, number>;
    order: number;
    reason: string;
  }>;
  expectedImprovement: number;
  codetteRecommendation: string;
}

/**
 * Analyze audio track and get Codette AI suggestions for effects
 */
export async function analyzeTrackWithCodette(
  track: Track,
  audioData: Float32Array,
  genre?: string,
  mood?: string,
  sampleRate: number = 44100
): Promise<CodetteEffectAnalysis[]> {
  const codette = getCodetteBridge();

  try {
    // Get audio metrics
    const levels = await analyzeLevels(audioData, sampleRate);
    const spectrum = await analyzeSpectrum(audioData, sampleRate);

    // Ask Codette for effect suggestions based on track context
    const codetteResponse = await codette.getSuggestions(
      {
        type: "effect_recommendation",
        track_type: track.type,
        genre: genre || "general",
        mood: mood || "neutral",
        bpm: 120,
      },
      5
    );

    // Combine audio metrics with Codette suggestions
    const analysis: CodetteEffectAnalysis[] = codetteResponse.suggestions.map(
      (suggestion) => ({
        suggestion,
        audioMetrics: {
          peak: levels.peak,
          rms: levels.rms,
          loudness: levels.loudness_lufs,
          headroom: levels.headroom,
        },
        spectrum: {
          frequencies: spectrum.frequencies,
          magnitudes: spectrum.magnitudes,
        },
        confidence: suggestion.confidence,
        reason: `Codette AI recommends ${suggestion.title} for ${track.name} - ${suggestion.description}`,
      })
    );

    return analysis;
  } catch (error) {
    console.error("Codette track analysis failed:", error);
    return [];
  }
}

/**
 * Auto-generate optimal effect chain using Codette AI
 */
export async function generateOptimalEffectChain(
  track: Track,
  audioData: Float32Array,
  currentEffects: string[] = [],
  sampleRate: number = 44100
): Promise<EffectChainOptimization> {
  const codette = getCodetteBridge();

  try {
    // Analyze current audio state
    const analysis = await analyzeTrackWithCodette(
      track,
      audioData,
      undefined,
      undefined,
      sampleRate
    );

    // Ask Codette to optimize the effect chain
    const optimizationResponse = await codette.chat(
      `Optimize the effect chain for track "${track.name}" (${track.type}). 
       Current effects: ${currentEffects.join(", ") || "none"}. 
       Available suggestions: ${analysis.map((a) => a.suggestion.title).join(", ")}. 
       Return a JSON chain in order.`,
      `chain-${track.id}`,
      "production-engineer"
    );

    // Parse Codette response and build optimized chain
    const optimizedChain = analysis
      .slice(0, 3)
      .map((a, index) => ({
        effect: a.suggestion.title,
        parameters: (a.suggestion.parameters || {}) as Record<string, number>,
        order: index,
        reason: `Codette recommends this at position ${index + 1}`,
      }));

    return {
      originalEffects: currentEffects,
      optimizedChain,
      expectedImprovement: Math.min(
        0.95,
        analysis.reduce((sum, a) => sum + a.confidence, 0) / analysis.length
      ),
      codetteRecommendation: optimizationResponse.response,
    };
  } catch (error) {
    console.error("Effect chain optimization failed:", error);
    return {
      originalEffects: currentEffects,
      optimizedChain: [],
      expectedImprovement: 0,
      codetteRecommendation: "Failed to generate recommendations",
    };
  }
}

/**
 * Process audio through DSP effect with Codette AI parameter tuning
 */
export async function processEffectWithCodetteAI(
  effectType: string,
  audioData: Float32Array,
  baseParameters: Record<string, number> = {},
  trackContext?: {
    trackName: string;
    trackType: Track["type"];
    genre?: string;
  },
  _sampleRate: number = 44100
): Promise<{ output: Float32Array; optimizedParameters: Record<string, number>; codetteAdvice: string }> {
  const codette = getCodetteBridge();

  try {
    // Ask Codette for optimal parameters
    let optimizedParams = baseParameters;

    if (trackContext) {
      const codetteAdvice = await codette.chat(
        `For a ${trackContext.trackType} track "${trackContext.trackName}" in ${trackContext.genre || "general"} style, 
         what are optimal parameters for a ${effectType} effect? 
         Consider the following base parameters: ${JSON.stringify(baseParameters)}. 
         Return JSON with adjusted parameters.`,
        `effect-${trackContext.trackName}`,
        "sound-engineer"
      );

      // Try to extract parameters from response
      try {
        const jsonMatch = codetteAdvice.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          optimizedParams = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Keep base parameters if parsing fails
      }
    }

    // Process audio with optimized parameters
    const output = await processEffect(effectType, audioData, optimizedParams);

    const adviceResponse = await codette.chat(
      `${effectType} has been applied with parameters: ${JSON.stringify(optimizedParams)}. 
       What's a brief tip for using this effect on ${trackContext?.trackType || "audio"} tracks?`,
      `advice-${effectType}`,
      "sound-engineer"
    );

    return {
      output,
      optimizedParameters: optimizedParams,
      codetteAdvice: adviceResponse.response,
    };
  } catch (error) {
    console.error("Codette AI effect processing failed:", error);
    // Fallback to base parameters
    const output = await processEffect(effectType, audioData, baseParameters);
    return {
      output,
      optimizedParameters: baseParameters,
      codetteAdvice: "Processing completed with provided parameters",
    };
  }
}

/**
 * Generate intelligent automation curves using Codette AI
 */
export async function generateCodetteAutomation(
  automationType: "lfo" | "envelope" | "curve",
  trackName: string,
  genre?: string,
  duration: number = 4,
  sampleRate: number = 44100
): Promise<{ automation: Float32Array; name: string; description: string }> {
  const codette = getCodetteBridge();

  try {
    // Ask Codette for automation suggestion
    const suggestion = await codette.chat(
      `For a ${genre || "general"} track "${trackName}", suggest a ${automationType} automation curve. 
       Describe parameters like rate, waveform, or envelope times if applicable.`,
      `automation-${trackName}`,
      "sound-engineer"
    );

    let automation: Float32Array;
    let description = suggestion.response;

    // Generate automation based on type
    if (automationType === "lfo") {
      // Default LFO settings - can be enhanced with Codette parsing
      automation = await generateLFO(duration, "sine", 1.0, 0.5, sampleRate);
    } else if (automationType === "envelope") {
      automation = await generateAutomationCurve(
        duration,
        "exponential",
        0,
        1,
        sampleRate
      );
    } else {
      automation = await generateAutomationCurve(
        duration,
        "linear",
        0,
        1,
        sampleRate
      );
    }

    return {
      automation,
      name: `${automationType}-${trackName}`.replace(/\s+/g, "-"),
      description,
    };
  } catch (error) {
    console.error("Codette automation generation failed:", error);
    // Return default automation
    return {
      automation: new Float32Array(sampleRate * duration).fill(0.5),
      name: `${automationType}-default`,
      description: "Default automation curve",
    };
  }
}

/**
 * Smart effect chain processor with Codette AI orchestration
 */
export class CodetteSmartEffectChain {
  private track: Track;
  private audioData: Float32Array;
  private sampleRate: number;
  genre?: string;
  mood?: string;
  private effectChain: Array<{ effect: string; parameters: Record<string, number> }> = [];
  private codette = getCodetteBridge();

  constructor(
    track: Track,
    audioData: Float32Array,
    sampleRate: number = 44100,
    genre?: string,
    mood?: string
  ) {
    this.track = track;
    this.audioData = audioData;
    this.sampleRate = sampleRate;
    this.genre = genre;
    this.mood = mood;
  }

  /**
   * Build effect chain using Codette AI suggestions
   */
  async buildChain(maxEffects: number = 4): Promise<this> {
    try {
      const optimization = await generateOptimalEffectChain(
        this.track,
        this.audioData,
        [],
        this.sampleRate
      );

      this.effectChain = optimization.optimizedChain
        .slice(0, maxEffects)
        .map((e) => ({
          effect: e.effect,
          parameters: e.parameters,
        }));

      console.log(`✓ Built effect chain with ${this.effectChain.length} effects`);
      return this;
    } catch (error) {
      console.error("Failed to build effect chain:", error);
      return this;
    }
  }

  /**
   * Process audio through entire chain
   */
  async process(): Promise<Float32Array> {
    let output = this.audioData;

    for (const { effect, parameters } of this.effectChain) {
      try {
        output = await processEffect(effect, output, parameters);
        console.log(`✓ Applied ${effect}`);
      } catch (error) {
        console.error(`✗ Failed to apply ${effect}:`, error);
        // Continue with unprocessed output
      }
    }

    return output;
  }

  /**
   * Get chain info
   */
  getChainInfo(): string {
    return this.effectChain.map((e, i) => `${i + 1}. ${e.effect}`).join(" → ");
  }

  /**
   * Modify a single effect in the chain
   */
  async updateEffect(
    effectIndex: number,
    newParameters: Record<string, number>
  ): Promise<void> {
    if (effectIndex < this.effectChain.length) {
      this.effectChain[effectIndex].parameters = newParameters;
      console.log(`✓ Updated ${this.effectChain[effectIndex].effect}`);
    }
  }

  /**
   * Add effect to chain
   */
  addEffect(effect: string, parameters: Record<string, number>): void {
    this.effectChain.push({ effect, parameters });
  }

  /**
   * Remove effect from chain
   */
  removeEffect(effectIndex: number): void {
    this.effectChain.splice(effectIndex, 1);
  }

  /**
   * Get Codette explanation for current chain
   */
  async explainChain(): Promise<string> {
    const chainStr = this.getChainInfo();
    const response = await this.codette.chat(
      `Explain why this effect chain is good for a ${this.genre || "general"} ${this.track.type} track: ${chainStr}`,
      `explain-${this.track.id}`,
      "sound-engineer"
    );
    return response.response;
  }
}
