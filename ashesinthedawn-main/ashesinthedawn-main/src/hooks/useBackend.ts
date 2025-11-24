/**
 * Custom hook for backend integration
 * Provides easy access to DSP backend functionality in React components
 */

import { useCallback, useEffect, useState } from "react";
import { getBackendClient } from "../lib/backendClient";
import { getCodnetteAI } from "../lib/codnetteAI";
import type { EffectResponse, MeteringResponse } from "../lib/backendClient";
import type { CodetteSuggestion, AudioProfile } from "../lib/codnetteAI";

export interface UseBackendOptions {
  autoConnect?: boolean;
}

export function useBackend(options: UseBackendOptions = {}) {
  const { autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backend = getBackendClient();
  const codette = getCodnetteAI();

  const checkConnection = useCallback(async () => {
    try {
      const available = await backend.isAvailable();
      setIsConnected(available);
      if (!available) {
        setError("Backend DSP engine not available");
      }
    } catch (err) {
      setError(`Connection check failed: ${String(err)}`);
      setIsConnected(false);
    }
  }, [backend]);

  // Check connection on mount
  useEffect(() => {
    if (autoConnect) {
      checkConnection();
    }
  }, [autoConnect, checkConnection]);

  // Effect processing
  const processEQ = useCallback(
    async (
      audioData: number[],
      type: "highpass" | "lowpass" | "3band",
      parameters: Record<string, number>
    ): Promise<EffectResponse | null> => {
      if (!isConnected) {
        setError("Backend not connected");
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const result = await backend.processEQ(audioData, type, parameters);
        return result;
      } catch (err) {
        setError(`EQ processing failed: ${String(err)}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, backend]
  );

  const processCompressor = useCallback(
    async (
      audioData: number[],
      parameters: Record<string, number>
    ): Promise<EffectResponse | null> => {
      if (!isConnected) {
        setError("Backend not connected");
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const result = await backend.processCompressor(audioData, parameters);
        return result;
      } catch (err) {
        setError(`Compressor processing failed: ${String(err)}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, backend]
  );

  const processReverb = useCallback(
    async (
      audioData: number[],
      parameters: Record<string, number>
    ): Promise<EffectResponse | null> => {
      if (!isConnected) {
        setError("Backend not connected");
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const result = await backend.processReverb(audioData, parameters);
        return result;
      } catch (err) {
        setError(`Reverb processing failed: ${String(err)}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, backend]
  );

  // Metering functions
  const analyzeLevel = useCallback(
    async (
      audioData: number[],
      sampleRate?: number
    ): Promise<MeteringResponse | null> => {
      if (!isConnected) {
        setError("Backend not connected");
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const result = await backend.analyzeLevel(audioData, sampleRate);
        return result;
      } catch (err) {
        setError(`Level analysis failed: ${String(err)}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, backend]
  );

  const analyzeSpectrum = useCallback(
    async (
      audioData: number[],
      sampleRate?: number
    ): Promise<MeteringResponse | null> => {
      if (!isConnected) {
        setError("Backend not connected");
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);
        const result = await backend.analyzeSpectrum(audioData, sampleRate);
        return result;
      } catch (err) {
        setError(`Spectrum analysis failed: ${String(err)}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, backend]
  );

  // AI integration
  const getAudioSuggestions = useCallback(
    async (trackId: string, audioData: number[]): Promise<CodetteSuggestion[]> => {
      try {
        setIsLoading(true);
        setError(null);
        const profile = await codette.analyzeAudio(trackId, audioData);
        // Return simplified suggestions based on profile
        const suggestions: CodetteSuggestion[] = [];
        
        if (profile.peakLevel > -3) {
          suggestions.push({
            id: `${trackId}-gain`,
            type: "optimization",
            title: "Reduce Gain",
            description: "Peaks are too high - reduce input gain",
            impact: "high",
            confidence: 0.95,
          });
        }

        return suggestions;
      } catch (err) {
        setError(`AI analysis failed: ${String(err)}`);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [codette]
  );

  const getAudioProfile = useCallback(
    async (trackId: string, audioData: number[]): Promise<AudioProfile | null> => {
      try {
        setIsLoading(true);
        setError(null);
        const profile = await codette.analyzeAudio(trackId, audioData);
        return profile;
      } catch (err) {
        setError(`Profile analysis failed: ${String(err)}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [codette]
  );

  return {
    isConnected,
    isLoading,
    error,
    checkConnection,
    // Effects
    processEQ,
    processCompressor,
    processReverb,
    // Metering
    analyzeLevel,
    analyzeSpectrum,
    // AI
    getAudioSuggestions,
    getAudioProfile,
  };
}
