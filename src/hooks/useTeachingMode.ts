/**
 * useTeachingMode Hook
 * 
 * Manages teaching mode state and provides utilities for the learning system
 * - Toggle teaching mode on/off
 * - Track learning progress
 * - Manage codette teaching prompts
 * - Persist learning state to localStorage
 */

import { useState, useCallback, useEffect } from 'react';
import { TOOLTIP_LIBRARY } from '../components/TooltipProvider';

export interface LearningProgress {
  totalLearned: number;
  functionsLearned: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: number;
  totalTimeSpent: number; // in seconds
}

const DEFAULT_LEARNING_PROGRESS: LearningProgress = {
  totalLearned: 0,
  functionsLearned: [],
  skillLevel: 'beginner',
  lastUpdated: Date.now(),
  totalTimeSpent: 0,
};

export function useTeachingMode(initialEnabled = false) {
  const [teachingModeEnabled, setTeachingModeEnabled] = useState(initialEnabled);
  const [learningProgress, setLearningProgress] = useState<LearningProgress>(() => {
    // Load from localStorage if available
    try {
      const saved = localStorage.getItem('corelogic_learning_progress');
      return saved ? JSON.parse(saved) : DEFAULT_LEARNING_PROGRESS;
    } catch {
      return DEFAULT_LEARNING_PROGRESS;
    }
  });
  // Track session start for learning metrics
  // const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());

  // Save learning progress to localStorage
  const saveProgress = useCallback((progress: LearningProgress) => {
    try {
      localStorage.setItem('corelogic_learning_progress', JSON.stringify(progress));
    } catch (error) {
      console.warn('Failed to save learning progress:', error);
    }
  }, []);

  // Toggle teaching mode
  const toggleTeachingMode = useCallback(() => {
    setTeachingModeEnabled((prev) => !prev);
  }, []);

  // Enable teaching mode
  const enableTeachingMode = useCallback(() => {
    setTeachingModeEnabled(true);
  }, []);

  // Disable teaching mode
  const disableTeachingMode = useCallback(() => {
    setTeachingModeEnabled(false);
  }, []);

  // Mark function as learned
  const markFunctionLearned = useCallback(
    (functionName: string) => {
      setLearningProgress((prev) => {
        if (prev.functionsLearned.includes(functionName)) {
          return prev; // Already learned
        }

        const updated: LearningProgress = {
          ...prev,
          totalLearned: prev.totalLearned + 1,
          functionsLearned: [...prev.functionsLearned, functionName],
          lastUpdated: Date.now(),
        };

        // Update skill level based on number learned
        if (updated.totalLearned >= 50) {
          updated.skillLevel = 'advanced';
        } else if (updated.totalLearned >= 20) {
          updated.skillLevel = 'intermediate';
        }

        saveProgress(updated);
        return updated;
      });
    },
    [saveProgress]
  );

  // Mark multiple functions as learned
  const markFunctionsLearned = useCallback(
    (functionNames: string[]) => {
      functionNames.forEach((name) => markFunctionLearned(name));
    },
    [markFunctionLearned]
  );

  // Reset learning progress
  const resetProgress = useCallback(() => {
    setLearningProgress(DEFAULT_LEARNING_PROGRESS);
    saveProgress(DEFAULT_LEARNING_PROGRESS);
  }, [saveProgress]);

  // Get learning percentage
  const getLearningPercentage = useCallback(() => {
    const totalFunctions = Object.keys(TOOLTIP_LIBRARY).length;
    return Math.round((learningProgress.totalLearned / totalFunctions) * 100);
  }, [learningProgress.totalLearned]);

  // Update time spent
  useEffect(() => {
    if (!teachingModeEnabled) return;

    const interval = setInterval(() => {
      setLearningProgress((prev) => ({
        ...prev,
        totalTimeSpent: prev.totalTimeSpent + 1,
        lastUpdated: Date.now(),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [teachingModeEnabled]);

  // Periodically save progress
  useEffect(() => {
    const interval = setInterval(() => {
      saveProgress(learningProgress);
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [learningProgress, saveProgress]);

  return {
    teachingModeEnabled,
    toggleTeachingMode,
    enableTeachingMode,
    disableTeachingMode,
    learningProgress,
    markFunctionLearned,
    markFunctionsLearned,
    resetProgress,
    getLearningPercentage,
  };
}

/**
 * Hook to get tooltip content for a feature
 */
export function useTooltip(featureName: string) {
  const tooltip = TOOLTIP_LIBRARY[featureName];
  if (!tooltip) {
    console.warn(`Tooltip not found for feature: ${featureName}`);
    return null;
  }
  return tooltip;
}

/**
 * Hook to manage codette teaching interactions
 */
export function useCodetteTeaching() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const askCodette = useCallback(
    async (prompt: string, context?: Record<string, unknown>) => {
      setIsLoading(true);
      setError(null);
      try {
        // Call to Codette backend (via FastAPI)
        const response = await fetch('http://localhost:8000/codette/teach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, context }),
        });

        if (!response.ok) {
          throw new Error(`Codette API error: ${response.status}`);
        }

        const data = await response.json();
        setResponse(data.explanation || data.response);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Codette teaching error:', errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearResponse = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return {
    isLoading,
    response,
    error,
    askCodette,
    clearResponse,
  };
}

/**
 * Hook to format time for display
 */
export function useFormattedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export default useTeachingMode;
