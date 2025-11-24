/**
 * useCodette Hook
 * React hook for easy Codette AI integration in components
 */

import { useState, useCallback, useEffect } from 'react';
import {
  getCodettePythonIntegration,
  type CodetteChatMessage,
} from '../lib/codettePythonIntegration';

export interface UseCodetteOptions {
  autoConnect?: boolean;
  onError?: (error: Error) => void;
}

export interface UseCodetteReturn {
  // State
  isConnected: boolean;
  isLoading: boolean;
  chatHistory: CodetteChatMessage[];
  error: Error | null;

  // Chat Methods
  sendMessage: (message: string, perspective?: string) => Promise<CodetteChatMessage | null>;
  clearHistory: () => void;

  // Analysis Methods
  analyzeAudio: (
    trackId: string,
    audioData: number[],
    sampleRate?: number
  ) => Promise<Record<string, unknown>>;
  getSuggestions: (context: Record<string, unknown>) => Promise<Record<string, unknown>>;
  getMasteringAdvice: (tracks: Record<string, unknown>[]) => Promise<Record<string, unknown>>;
  optimize: (context: Record<string, unknown>) => Promise<Record<string, unknown>>;

  // Connection Methods
  reconnect: () => Promise<void>;
}

export function useCodette(options?: UseCodetteOptions): UseCodetteReturn {
  const { autoConnect = true, onError } = options || {};

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<CodetteChatMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const codette = getCodettePythonIntegration();

  // Initialize connection
  useEffect(() => {
    if (autoConnect) {
      const checkConnection = async () => {
        try {
          const connected = codette.isBackendConnected();
          setIsConnected(connected);
          if (!connected) {
            await codette.reconnect();
            setIsConnected(codette.isBackendConnected());
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          onError?.(error);
        }
      };

      checkConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  const sendMessage = useCallback(
    async (message: string, perspective?: string): Promise<CodetteChatMessage | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await codette.chat(message, perspective);
        setChatHistory(codette.getChatHistory());
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
    [codette, onError]
  );

  const clearHistory = useCallback(() => {
    codette.clearChatHistory();
    setChatHistory([]);
  }, [codette]);

  const analyzeAudio = useCallback(
    async (
      trackId: string,
      audioData: number[],
      sampleRate?: number
    ): Promise<Record<string, unknown>> => {
      setIsLoading(true);
      setError(null);

      try {
        return await codette.analyzeAudioWithAI(trackId, audioData, sampleRate);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return {};
      } finally {
        setIsLoading(false);
      }
    },
    [codette, onError]
  );

  const getSuggestions = useCallback(
    async (context: Record<string, unknown>): Promise<Record<string, unknown>> => {
      setIsLoading(true);
      setError(null);

      try {
        return await codette.getSuggestions(context);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return {};
      } finally {
        setIsLoading(false);
      }
    },
    [codette, onError]
  );

  const getMasteringAdvice = useCallback(
    async (tracks: Record<string, unknown>[]): Promise<Record<string, unknown>> => {
      setIsLoading(true);
      setError(null);

      try {
        return await codette.getMasteringAdvice(tracks);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return {};
      } finally {
        setIsLoading(false);
      }
    },
    [codette, onError]
  );

  const optimize = useCallback(
    async (context: Record<string, unknown>): Promise<Record<string, unknown>> => {
      setIsLoading(true);
      setError(null);

      try {
        return await codette.optimize(context);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
        return {};
      } finally {
        setIsLoading(false);
      }
    },
    [codette, onError]
  );

  const reconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await codette.reconnect();
      setIsConnected(codette.isBackendConnected());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [codette, onError]);

  return {
    isConnected,
    isLoading,
    chatHistory,
    error,
    sendMessage,
    clearHistory,
    analyzeAudio,
    getSuggestions,
    getMasteringAdvice,
    optimize,
    reconnect,
  };
}

export default useCodette;
