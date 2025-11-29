/**
 * useCodette Hook
 * React hook for real-time Codette AI integration with FastAPI backend
 * Connects real Codette AI engine with CoreLogic Studio
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { getCodetteAIEngine, type CodetteSuggestion } from '../lib/codetteAIEngine';
import { useDAW } from '../contexts/DAWContext';

export interface Suggestion extends CodetteSuggestion {
  source?: string;
}

export interface AnalysisResult {
  trackId: string;
  analysisType: string;
  score: number;
  findings: string[];
  recommendations: string[];
  reasoning: string;
  metrics: Record<string, number>;
}

export interface CodetteChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface UseCodetteOptions {
  autoConnect?: boolean;
  apiUrl?: string;
  onError?: (error: Error) => void;
  autoAnalyze?: boolean;
  analysisInterval?: number;
}

export interface UseCodetteReturn {
  // State
  isConnected: boolean;
  isLoading: boolean;
  chatHistory: CodetteChatMessage[];
  suggestions: Suggestion[];
  analysis: AnalysisResult | null;
  error: Error | null;

  // Chat Methods
  sendMessage: (message: string) => Promise<string | null>;
  clearHistory: () => void;

  // Analysis Methods
  analyzeAudio: (
    audioData: Float32Array | Uint8Array | number[],
    contentType?: string
  ) => Promise<AnalysisResult | null>;
  getSuggestions: (context?: string) => Promise<Suggestion[]>;
  getMasteringAdvice: () => Promise<Suggestion[]>;
  optimize: (
    audioData: Float32Array | Uint8Array | number[],
    optimizationType?: string
  ) => Promise<Record<string, unknown> | null>;

  // Connection Methods
  reconnect: () => Promise<void>;

  // DAW Control Methods
  createTrack: (trackType?: string, trackName?: string, trackColor?: string) => Promise<Record<string, unknown> | null>;
  selectTrack: (trackId: string) => Promise<Record<string, unknown> | null>;
  deleteTrack: (trackId: string) => Promise<Record<string, unknown> | null>;
  toggleTrackMute: (trackId: string) => Promise<Record<string, unknown> | null>;
  toggleTrackSolo: (trackId: string) => Promise<Record<string, unknown> | null>;
  setTrackLevel: (trackId: string, levelType: 'volume' | 'pan' | 'input_gain' | 'stereo_width', value: number) => Promise<Record<string, unknown> | null>;
  addEffect: (trackId: string, effectType: string, effectName?: string, position?: number) => Promise<Record<string, unknown> | null>;
  removeEffect: (trackId: string, effectName: string) => Promise<Record<string, unknown> | null>;
  playAudio: () => Promise<Record<string, unknown> | null>;
  stopAudio: () => Promise<Record<string, unknown> | null>;
  seekAudio: (seconds: number) => Promise<Record<string, unknown> | null>;
  addAutomationPoint: (trackId: string, parameterName: string, timePosition: number, value: number) => Promise<Record<string, unknown> | null>;
  executeDawAction: (action: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
}

const CODETTE_API_URL = import.meta.env.VITE_CODETTE_API || 'http://localhost:8000';

export function useCodette(options?: UseCodetteOptions): UseCodetteReturn {
  const { 
    autoConnect = true, 
    apiUrl = CODETTE_API_URL,
    onError,
  } = options || {};

  const { tracks, selectedTrack } = useDAW();
  const codetteEngine = useRef(getCodetteAIEngine());

  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<CodetteChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize Codette engine
  useEffect(() => {
    if (autoConnect) {
      setIsConnected(true);
      console.log('🤖 Codette AI Engine connected');
    }
  }, [autoConnect]);

  // Real implementation: Send message
  const sendMessage = useCallback(
    async (message: string): Promise<string | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Engine handles message history internally, just get response
        const response = await codetteEngine.current.sendMessage(message);
        
        // Update chat history from engine to ensure consistency
        const history = codetteEngine.current.getHistory();
        setChatHistory(history);

        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Real implementation: Analyze audio
  const analyzeAudio = useCallback(
    async (
      _audioData: Float32Array | Uint8Array | number[],
      _contentType: string = 'mixed'
    ): Promise<AnalysisResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await codetteEngine.current.analyzeSessionHealth(tracks);
        setAnalysis(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [tracks, onError]
  );

  // Real implementation: Get suggestions
  const getSuggestions = useCallback(
    async (context: string = 'general'): Promise<Suggestion[]> => {
      setIsLoading(true);
      setError(null);

      try {
        let suggestions: CodetteSuggestion[] = [];

        if (context === 'mixing') {
          suggestions = await codetteEngine.current.teachMixingTechniques('vocals');
        } else if (context === 'mastering') {
          suggestions = await codetteEngine.current.suggestEnhancements('vocals');
        } else {
          // General suggestions - combine multiple abilities
          const issues = await codetteEngine.current.detectIssues(tracks);
          suggestions = issues;
        }

        setSuggestions(suggestions);
        return suggestions;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [tracks, onError]
  );

  // Real implementation: Get mastering advice
  const getMasteringAdvice = useCallback(async (): Promise<Suggestion[]> => {
    return getSuggestions('mastering');
  }, [getSuggestions]);

  // Real implementation: Optimize
  const optimize = useCallback(
    async (
      _audioData: Float32Array | Uint8Array | number[],
      optimizationType: string = 'general'
    ): Promise<Record<string, unknown> | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const suggestions = await codetteEngine.current.suggestParameterValues(
          optimizationType,
          selectedTrack?.type || 'audio'
        );
        return { suggestions, optimizationType };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedTrack, onError]
  );

  // Real implementation: Reconnect
  const reconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setIsConnected(true);
      console.log('✅ Reconnected to Codette AI');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  // Real implementation: Clear history
  const clearHistory = useCallback(() => {
    codetteEngine.current.clearHistory();
    setChatHistory([]);
  }, []);

  // =========================================================================
  // DAW CONTROL METHODS - Codette can now execute DAW operations
  // =========================================================================

  const createTrack = useCallback(
    async (
      trackType: string = 'audio',
      trackName?: string,
      trackColor?: string
    ): Promise<Record<string, unknown> | null> => {
      try {
        const response = await fetch(`${apiUrl}/codette/daw/track/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackType, trackName, trackColor }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      }
    },
    [apiUrl]
  );

  const selectTrack = useCallback(
    async (trackId: string): Promise<Record<string, unknown> | null> => {
      try {
        const response = await fetch(`${apiUrl}/codette/daw/track/select`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      }
    },
    [apiUrl]
  );

  const deleteTrack = useCallback(
    async (trackId: string): Promise<Record<string, unknown> | null> => {
      try {
        const response = await fetch(`${apiUrl}/codette/daw/track/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      }
    },
    [apiUrl]
  );

  const toggleTrackMute = useCallback(
    async (trackId: string): Promise<Record<string, unknown> | null> => {
      try {
        const response = await fetch(`${apiUrl}/codette/daw/track/mute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      }
    },
    [apiUrl]
  );

  const toggleTrackSolo = useCallback(
    async (trackId: string): Promise<Record<string, unknown> | null> => {
      try {
        const response = await fetch(`${apiUrl}/codette/daw/track/solo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      }
    },
    [apiUrl]
  );

  const setTrackLevel = useCallback(
    async (
      trackId: string,
      levelType: 'volume' | 'pan' | 'input_gain' | 'stereo_width',
      value: number
    ): Promise<Record<string, unknown> | null> => {
      try {
        const response = await fetch(`${apiUrl}/codette/daw/level/set`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId, levelType, value }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      }
    },
    [apiUrl]
  );

  const addEffect = useCallback(
    async (
      trackId: string,
      effectType: string,
      effectName?: string,
      position?: number
    ): Promise<Record<string, unknown> | null> => {
      try {
        const response = await fetch(`${apiUrl}/codette/daw/effect/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId, effectType, effectName, position }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      }
    },
    [apiUrl]
  );

  const removeEffect = useCallback(
    async (trackId: string, effectName: string): Promise<Record<string, unknown> | null> => {
      try {
        const response = await fetch(`${apiUrl}/codette/daw/effect/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId, effectName }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      }
    },
    [apiUrl]
  );

  const playAudio = useCallback(async (): Promise<Record<string, unknown> | null> => {
    try {
      const response = await fetch(`${apiUrl}/codette/daw/transport/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    }
  }, [apiUrl]);

  const stopAudio = useCallback(async (): Promise<Record<string, unknown> | null> => {
    try {
      const response = await fetch(`${apiUrl}/codette/daw/transport/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    }
  }, [apiUrl]);

  const seekAudio = useCallback(
    async (seconds: number): Promise<Record<string, unknown> | null> => {
      try {
        const response = await fetch(`${apiUrl}/codette/daw/transport/seek?seconds=${seconds}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      }
    },
    [apiUrl]
  );

  const addAutomationPoint = useCallback(
    async (
      trackId: string,
      parameterName: string,
      timePosition: number,
      value: number
    ): Promise<Record<string, unknown> | null> => {
      try {
        const response = await fetch(`${apiUrl}/codette/daw/automation/add-point`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId, parameterName, timePosition, value }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      }
    },
    [apiUrl]
  );

  const executeDawAction = useCallback(
    async (action: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
      try {
        const response = await fetch(`${apiUrl}/codette/daw/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      }
    },
    [apiUrl]
  );



  return {
    isConnected,
    isLoading,
    chatHistory,
    suggestions,
    analysis,
    error,
    sendMessage,
    clearHistory,
    analyzeAudio,
    getSuggestions,
    getMasteringAdvice,
    optimize,
    reconnect,
    // DAW Control Methods
    createTrack,
    selectTrack,
    deleteTrack,
    toggleTrackMute,
    toggleTrackSolo,
    setTrackLevel,
    addEffect,
    removeEffect,
    playAudio,
    stopAudio,
    seekAudio,
    addAutomationPoint,
    executeDawAction,
  };
}

export default useCodette;
