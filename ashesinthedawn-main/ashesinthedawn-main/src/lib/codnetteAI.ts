/**
 * Codette AI Integration
 * Provides intelligent audio processing recommendations and automation
 */

import { getBackendClient } from "./backendClient";
import { Track, Plugin } from "../types";

export interface CodetteSuggestion {
  id: string;
  type: "effect" | "automation" | "routing" | "optimization";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  plugin?: Plugin;
  automation?: {
    type: string;
    parameters: Record<string, number>;
  };
  confidence: number;
}

export interface AudioProfile {
  peakLevel: number;
  rmsLevel: number;
  frequencyContent: "bass_heavy" | "mid_focused" | "bright" | "balanced";
  dynamicRange: number;
  contentType: "vocal" | "music" | "dialogue" | "mixed";
  stereoCorrelation: number;
}

class CodnetteAI {
  private backendClient = getBackendClient();
  private profileCache: Map<string, AudioProfile> = new Map();
  private suggestionHistory: CodetteSuggestion[] = [];

  /**
   * Analyze audio and build profile
   */
  async analyzeAudio(
    trackId: string,
    audioData: number[],
    sampleRate: number = 44100
  ): Promise<AudioProfile> {
    try {
      // Check cache first
      if (this.profileCache.has(trackId)) {
        return this.profileCache.get(trackId)!;
      }

      // Get metering data from backend
      const levelData = (await this.backendClient.analyzeLevel(
        audioData,
        sampleRate
      )) as Record<string, unknown>;
      const spectrumData = (await this.backendClient.analyzeSpectrum(
        audioData,
        sampleRate
      )) as Record<string, unknown>;
      const correlationData = (await this.backendClient.analyzeCorrelation(
        audioData,
        sampleRate
      )) as Record<string, unknown>;

      // Build profile from data
      const profile = this.buildAudioProfile(
        levelData,
        spectrumData,
        correlationData
      );

      // Cache result
      this.profileCache.set(trackId, profile);

      return profile;
    } catch (error) {
      console.error("Audio analysis failed:", error);
      // Return default profile on error
      return {
        peakLevel: -12,
        rmsLevel: -18,
        frequencyContent: "balanced",
        dynamicRange: 12,
        contentType: "mixed",
        stereoCorrelation: 0.5,
      };
    }
  }

  /**
   * Build audio profile from metering data
   */
  private buildAudioProfile(
    levelData: Record<string, unknown>,
    _spectrumData: Record<string, unknown>,
    correlationData: Record<string, unknown>
  ): AudioProfile {
    const peak = (levelData.peak as number) || -12;
    const rms = (levelData.rms as number) || -18;
    const correlation = (correlationData.correlation as number) || 0.5;

    // Determine frequency content from spectrum
    const frequencyContent: "bass_heavy" | "mid_focused" | "bright" | "balanced" =
      "balanced";

    // Determine content type based on characteristics
    const dynamicRange = Math.abs(peak - rms);
    let contentType: "vocal" | "music" | "dialogue" | "mixed" = "mixed";

    if (dynamicRange < 6) {
      contentType = "dialogue";
    } else if (dynamicRange > 12) {
      contentType = "music";
    }

    return {
      peakLevel: peak,
      rmsLevel: rms,
      frequencyContent,
      dynamicRange,
      contentType,
      stereoCorrelation: correlation,
    };
  }

  /**
   * Get intelligent suggestions for a track
   */
  async getSuggestions(
    track: Track,
    audioData: number[]
  ): Promise<CodetteSuggestion[]> {
    try {
      const profile = await this.analyzeAudio(track.id, audioData);
      const suggestions: CodetteSuggestion[] = [];

      // Suggestion 1: Gain optimization
      if (profile.peakLevel > -3) {
        suggestions.push({
          id: `gain-${track.id}`,
          type: "optimization",
          title: "Gain Optimization",
          description:
            "Reduce input gain to prevent clipping and improve headroom",
          impact: "high",
          confidence: 0.95,
        });
      } else if (profile.peakLevel < -20) {
        suggestions.push({
          id: `gain-boost-${track.id}`,
          type: "optimization",
          title: "Gain Boost",
          description:
            "Increase input gain to utilize more of available dynamic range",
          impact: "high",
          confidence: 0.9,
        });
      }

      // Suggestion 2: Compression for dynamics
      if (profile.dynamicRange > 15) {
        suggestions.push({
          id: `compress-${track.id}`,
          type: "effect",
          title: "Dynamic Range Compression",
          description:
            "High dynamic range detected - compression will improve consistency",
          impact: "high",
          plugin: {
            id: `comp-${track.id}`,
            name: "Compressor",
            type: "compressor",
            enabled: true,
            parameters: {
              threshold: profile.peakLevel - 10,
              ratio: profile.contentType === "vocal" ? 4 : 3,
              attack: 0.005,
              release: 0.1,
            },
          },
          confidence: 0.88,
        });
      }

      // Suggestion 3: EQ for frequency balance
      if (profile.frequencyContent === "bass_heavy") {
        suggestions.push({
          id: `eq-bass-${track.id}`,
          type: "effect",
          title: "Bass Reduction",
          description: "Bass-heavy content detected - gentle EQ reduction",
          impact: "medium",
          plugin: {
            id: `eq-${track.id}`,
            name: "EQ 3-Band",
            type: "eq",
            enabled: true,
            parameters: {
              low_gain: -3,
              mid_gain: 0,
              high_gain: 1,
            },
          },
          confidence: 0.82,
        });
      }

      // Suggestion 4: Saturation for presence
      if (
        profile.contentType === "vocal" &&
        profile.rmsLevel < -20
      ) {
        suggestions.push({
          id: `saturation-${track.id}`,
          type: "effect",
          title: "Presence Enhancement",
          description:
            "Subtle saturation can add presence and warmth to quiet vocals",
          impact: "low",
          plugin: {
            id: `sat-${track.id}`,
            name: "Saturation",
            type: "saturation",
            enabled: true,
            parameters: {
              drive: 1.2,
              tone: 0.5,
            },
          },
          confidence: 0.75,
        });
      }

      // Suggestion 5: Stereo width adjustment
      if (profile.stereoCorrelation > 0.95) {
        suggestions.push({
          id: `stereo-${track.id}`,
          type: "routing",
          title: "Stereo Width",
          description: "Mono signal detected - can be duplicated to stereo",
          impact: "low",
          confidence: 0.8,
        });
      }

      // Sort by confidence and impact
      suggestions.sort(
        (a, b) => b.confidence * (b.impact === "high" ? 1.5 : 1) - a.confidence * (a.impact === "high" ? 1.5 : 1)
      );

      // Store in history
      this.suggestionHistory.push(...suggestions);

      return suggestions;
    } catch (error) {
      console.error("Suggestion generation failed:", error);
      return [];
    }
  }

  /**
   * Get mastering recommendations for entire project
   */
  async getMasteringRecommendations(
    tracks: Track[],
    audioDataMap: Map<string, number[]>
  ): Promise<Record<string, unknown>> {
    try {
      const recommendations: Record<string, unknown> = {
        overall_loudness: "pending",
        loudness_target: "-14 LUFS",
        dynamic_range: "analyzing",
        frequency_balance: "analyzing",
        plugins_recommended: [],
      };

      // Analyze each track
      for (const track of tracks) {
        const audioData = audioDataMap.get(track.id);
        if (audioData) {
          void this.analyzeAudio(track.id, audioData);
          // Add track-specific mastering recommendations
        }
      }

      return recommendations;
    } catch (error) {
      console.error("Mastering recommendations failed:", error);
      return { error: String(error) };
    }
  }

  /**
   * Suggest mix bus effects
   */
  async suggestMixBusEffects(
    masterAudioData: number[]
  ): Promise<Plugin[]> {
    try {
      const profile = await this.analyzeAudio("master", masterAudioData);
      const plugins: Plugin[] = [];

      // Master bus compressor for glue
      plugins.push({
        id: "master-comp",
        name: "Compressor",
        type: "compressor",
        enabled: true,
        parameters: {
          threshold: -18,
          ratio: 2,
          attack: 0.03,
          release: 0.2,
        },
      });

      // Master bus limiter for safety
      plugins.push({
        id: "master-limit",
        name: "Limiter",
        type: "gate",
        enabled: true,
        parameters: {
          threshold: -1,
          attack: 0.001,
          release: 0.05,
        },
      });

      // EQ if needed
      if (profile.frequencyContent !== "balanced") {
        plugins.push({
          id: "master-eq",
          name: "EQ 3-Band",
          type: "eq",
          enabled: true,
          parameters: {
            low_gain: 0,
            mid_gain: 0,
            high_gain: 0,
          },
        });
      }

      return plugins;
    } catch (error) {
      console.error("Mix bus effect suggestion failed:", error);
      return [];
    }
  }

  /**
   * Get automation suggestions
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async suggestAutomation(_track: Track): Promise<Record<string, unknown>> {
    return {
      suggested_parameters: ["volume", "pan", "filter_cutoff"],
      automations: [
        {
          parameter: "volume",
          type: "envelope",
          description: "Volume fade-out at end",
        },
      ],
    };
  }

  /**
   * Clear cache for fresh analysis
   */
  clearCache(): void {
    this.profileCache.clear();
  }

  /**
   * Get suggestion history
   */
  getSuggestionHistory(): CodetteSuggestion[] {
    return [...this.suggestionHistory];
  }
}

// Singleton instance
let codnetteInstance: CodnetteAI | null = null;

/**
 * Get or create Codette AI instance
 */
export function getCodnetteAI(): CodnetteAI {
  if (!codnetteInstance) {
    codnetteInstance = new CodnetteAI();
  }
  return codnetteInstance;
}

export default CodnetteAI;
