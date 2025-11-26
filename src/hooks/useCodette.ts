/**
 * useCodette Hook
 * React hook for real-time Codette AI integration with FastAPI backend
 * Connects to http://localhost:8000 for real-time analysis and suggestions
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface Suggestion {
  type: 'optimization' | 'effect' | 'routing' | 'creative' | 'warning';
  title: string;
  description: string;
  confidence: number;
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

const CODETTE_API_URL = import.meta.env.VITE_CODETTE_API_URL || 'http://localhost:8000';

export function useCodette(options?: UseCodetteOptions): UseCodetteReturn {
  const { 
    autoConnect = true, 
    apiUrl = CODETTE_API_URL,
    onError,
  } = options || {};

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<CodetteChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const messageHistoryRef = useRef<CodetteChatMessage[]>([]);

  // Check connection to Codette server
  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const connected = response.ok;
      setIsConnected(connected);
      if (!connected) {
        setError(new Error(`Server returned ${response.status}`));
      } else {
        setError(null);
      }
      return connected;
    } catch (err) {
      setIsConnected(false);
      const error = err instanceof Error ? err : new Error('Cannot connect to Codette server');
      setError(error);
      onError?.(error);
      return false;
    }
  }, [apiUrl, onError]);

  // Initialize connection on mount
  useEffect(() => {
    if (autoConnect) {
      checkConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  const sendMessage = useCallback(
    async (message: string): Promise<string | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const userMessage: CodetteChatMessage = {
          role: 'user',
          content: message,
          timestamp: Date.now(),
        };
        messageHistoryRef.current.push(userMessage);

        const response = await fetch(`${apiUrl}/codette/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            history: messageHistoryRef.current.slice(-10), // Last 10 messages
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.response || data.message || 'No response';

        const assistantMessage: CodetteChatMessage = {
          role: 'assistant',
          content: responseText,
          timestamp: Date.now(),
        };
        messageHistoryRef.current.push(assistantMessage);
        setChatHistory([...messageHistoryRef.current]);

        return responseText;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, onError]
  );

  const clearHistory = useCallback(() => {
    messageHistoryRef.current = [];
    setChatHistory([]);
  }, []);

  const analyzeAudio = useCallback(
    async (
      audioData: Float32Array | Uint8Array | number[],
      contentType: string = 'mixed'
    ): Promise<AnalysisResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Convert to array if needed
        const dataArray = Array.isArray(audioData)
          ? audioData
          : Array.from(audioData);

        const response = await fetch(`${apiUrl}/codette/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId: 'analysis',
            sampleRate: 44100,
            audioData: dataArray,
            contentType,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const result: AnalysisResult = {
          trackId: data.trackId,
          analysisType: contentType,
          score: data.analysis?.score || 0,
          findings: data.analysis?.findings || [],
          recommendations: data.analysis?.recommendations || [],
          reasoning: data.analysis?.reasoning || '',
          metrics: data.analysis?.metrics || {},
        };

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
    [apiUrl, onError]
  );

  const getSuggestions = useCallback(
    async (context: string = 'general'): Promise<Suggestion[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/codette/suggest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: { type: context },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const suggestionList: Suggestion[] = (data.suggestions || []).map(
          (s: Record<string, unknown>) => ({
            type: (s.type as string) || 'optimization',
            title: (s.title as string) || '',
            description: (s.description as string) || '',
            confidence: (s.confidence as number) || 0.5,
            source: (s.source as string) || 'training',
          })
        );

        setSuggestions(suggestionList);
        return suggestionList;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, onError]
  );

  const getMasteringAdvice = useCallback(async (): Promise<Suggestion[]> => {
    return getSuggestions('mastering');
  }, [getSuggestions]);

  const optimize = useCallback(
    async (
      audioData: Float32Array | Uint8Array | number[],
      optimizationType: string = 'general'
    ): Promise<Record<string, unknown> | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const dataArray = Array.isArray(audioData)
          ? audioData
          : Array.from(audioData);

        const response = await fetch(`${apiUrl}/codette/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'optimize',
            optimizationType,
            audioData: dataArray,
            sampleRate: 44100,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, onError]
  );

  const reconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await checkConnection();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [checkConnection, onError]);

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

  // Periodically check connection
  useEffect(() => {
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [checkConnection]);

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
