/**
 * useCodetteDAWIntegration Hook
 * Advanced integration between Codette AI and DAW operations
 * Allows Codette to control and analyze DAW state in real-time
 */

import { useCallback, useEffect, useRef } from 'react';
import { useCodette } from './useCodette';
import { useDAW } from '../contexts/DAWContext';
import type { CodetteSuggestion } from '../lib/codetteBridge';

export interface CodetteDAWIntegration {
  applySuggestion: (suggestion: CodetteSuggestion) => Promise<boolean>;
  getSuggestionsForCurrentState: () => Promise<CodetteSuggestion[]>;
  analyzeCurrentMix: () => Promise<Record<string, any> | null>;
  getMixingTips: () => Promise<string[]>;
  optimizeTrackRouting: (trackId: string) => Promise<boolean>;
  getEQSuggestions: (trackId: string) => Promise<CodetteSuggestion[]>;
  getCompressionSuggestions: (trackId: string) => Promise<CodetteSuggestion[]>;
  getReverbSuggestions: (trackId: string) => Promise<CodetteSuggestion[]>;
  getProductionChecklist: () => Promise<Array<{ task: string; completed: boolean; priority: 'high' | 'medium' | 'low' }>>;
  syncDAWStateWithCodette: () => Promise<boolean>;
  getGenreBasedSuggestions: (genre: string) => Promise<CodetteSuggestion[]>;
}

export function useCodetteDAWIntegration(): CodetteDAWIntegration {
  const { getSuggestions, addEffect, setTrackLevel } = useCodette({ autoConnect: true });
  const {
    selectedTrack,
    updateTrack,
  } = useDAW();

  const lastSyncRef = useRef<number>(0);

  const applySuggestion = useCallback(
    async (suggestion: CodetteSuggestion): Promise<boolean> => {
      if (!selectedTrack) return false;

      try {
        switch (suggestion.type) {
          case 'effect': {
            const effectType = suggestion.parameters.effectType || suggestion.title;
            await addEffect(selectedTrack.id, effectType, suggestion.title);
            return true;
          }

          case 'parameter': {
            const { paramName, value } = suggestion.parameters;
            if (paramName && value !== undefined) {
              const levelType = paramName as 'volume' | 'pan' | 'input_gain' | 'stereo_width';
              await setTrackLevel(selectedTrack.id, levelType, value);
              return true;
            }
            return false;
          }

          case 'automation': {
            const { parameterName: _parameterName, timePosition: _timePosition, value: _value } = suggestion.parameters;
            // This would need a DAW context method
            return false;
          }

          case 'routing': {
            const { destination } = suggestion.parameters;
            updateTrack(selectedTrack.id, { routing: destination });
            return true;
          }

          case 'mixing': {
            const { adjustments } = suggestion.parameters;
            if (adjustments) {
              updateTrack(selectedTrack.id, adjustments);
              return true;
            }
            return false;
          }

          default: {
            // Exhaustiveness check - all cases should be handled above
            const _ensure: never = suggestion.type;
            return Boolean(_ensure);
          }
        }
      } catch (err) {
        console.error('[useCodetteDAWIntegration] Failed to apply suggestion:', err);
        return false;
      }
    },
    [selectedTrack, addEffect, setTrackLevel, updateTrack]
  );

  const getSuggestionsForCurrentState = useCallback(async () => {
    try {
      const response = await getSuggestions('daw_state');
      return response as unknown as CodetteSuggestion[];
    } catch (err) {
      console.error('[useCodetteDAWIntegration] Failed to get suggestions:', err);
      return [];
    }
  }, [getSuggestions]);

  const analyzeCurrentMix = useCallback(async () => {
    try {
      const response = await getSuggestions('analysis');
      return response as unknown as Record<string, any>;
    } catch (err) {
      console.error('[useCodetteDAWIntegration] Failed to analyze mix:', err);
      return null;
    }
  }, [getSuggestions]);

  const getMixingTips = useCallback(async (): Promise<string[]> => {
    try {
      const suggestions = await getSuggestionsForCurrentState();
      return suggestions.map((s) => s.description);
    } catch (err) {
      console.error('[useCodetteDAWIntegration] Failed to get tips:', err);
      return [];
    }
  }, [getSuggestionsForCurrentState]);

  const optimizeTrackRouting = useCallback(
    async (_trackId: string): Promise<boolean> => {
      try {
        const suggestions = await getSuggestions('routing');
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          const routingSuggestion = suggestions[0] as unknown as CodetteSuggestion;
          return applySuggestion(routingSuggestion);
        }
        return false;
      } catch (err) {
        console.error('[useCodetteDAWIntegration] Failed to optimize routing:', err);
        return false;
      }
    },
    [getSuggestions, applySuggestion]
  );

  const getEQSuggestions = useCallback(
    async (_trackId: string): Promise<CodetteSuggestion[]> => {
      try {
        const suggestions = await getSuggestions('eq');
        return (suggestions as unknown as CodetteSuggestion[]).filter((s) =>
          s.category?.toLowerCase().includes('eq')
        );
      } catch (err) {
        console.error('[useCodetteDAWIntegration] Failed to get EQ suggestions:', err);
        return [];
      }
    },
    [getSuggestions]
  );

  const getCompressionSuggestions = useCallback(
    async (_trackId: string): Promise<CodetteSuggestion[]> => {
      try {
        const suggestions = await getSuggestions('compression');
        return (suggestions as unknown as CodetteSuggestion[]).filter((s) =>
          s.category?.toLowerCase().includes('compression')
        );
      } catch (err) {
        console.error('[useCodetteDAWIntegration] Failed to get compression suggestions:', err);
        return [];
      }
    },
    [getSuggestions]
  );

  const getReverbSuggestions = useCallback(
    async (_trackId: string): Promise<CodetteSuggestion[]> => {
      try {
        const suggestions = await getSuggestions('reverb');
        return (suggestions as unknown as CodetteSuggestion[]).filter((s) =>
          s.category?.toLowerCase().includes('reverb')
        );
      } catch (err) {
        console.error('[useCodetteDAWIntegration] Failed to get reverb suggestions:', err);
        return [];
      }
    },
    [getSuggestions]
  );

  const getProductionChecklist = useCallback(
    async (): Promise<
      Array<{ task: string; completed: boolean; priority: 'high' | 'medium' | 'low' }>
    > => {
      try {
        const result = await getSuggestions('checklist');
        if (Array.isArray(result)) {
          return result.map((item: any) => ({
            task: item.title || item.description || 'Unknown task',
            completed: item.parameters?.completed ?? false,
            priority: item.parameters?.priority ?? 'medium',
          }));
        }
        return [];
      } catch (err) {
        console.error('[useCodetteDAWIntegration] Failed to get checklist:', err);
        return [];
      }
    },
    [getSuggestions]
  );

  const syncDAWStateWithCodette = useCallback(async (): Promise<boolean> => {
    // Throttle syncs to once per 5 seconds
    const now = Date.now();
    if (now - lastSyncRef.current < 5000) {
      return true;
    }
    lastSyncRef.current = now;

    try {
      // In a real implementation, this would send DAW state to Codette
      // For now, we'll just verify we can get suggestions
      await getSuggestionsForCurrentState();
      return true;
    } catch (err) {
      console.error('[useCodetteDAWIntegration] Failed to sync state:', err);
      return false;
    }
  }, [getSuggestionsForCurrentState]);

  const getGenreBasedSuggestions = useCallback(
    async (genre: string): Promise<CodetteSuggestion[]> => {
      try {
        const suggestions = await getSuggestions(genre.toLowerCase());
        return suggestions as unknown as CodetteSuggestion[];
      } catch (err) {
        console.error('[useCodetteDAWIntegration] Failed to get genre suggestions:', err);
        return [];
      }
    },
    [getSuggestions]
  );

  // Auto-sync DAW state periodically
  useEffect(() => {
    const syncInterval = setInterval(() => {
      syncDAWStateWithCodette().catch((err) => {
        console.debug('[useCodetteDAWIntegration] Auto-sync failed:', err);
      });
    }, 10000); // Every 10 seconds

    return () => clearInterval(syncInterval);
  }, [syncDAWStateWithCodette]);

  return {
    applySuggestion,
    getSuggestionsForCurrentState,
    analyzeCurrentMix,
    getMixingTips,
    optimizeTrackRouting,
    getEQSuggestions,
    getCompressionSuggestions,
    getReverbSuggestions,
    getProductionChecklist,
    syncDAWStateWithCodette,
    getGenreBasedSuggestions,
  };
}

export default useCodetteDAWIntegration;
