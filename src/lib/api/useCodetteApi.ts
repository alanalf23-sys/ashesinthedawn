/**
 * Codette API React Hooks
 * Custom hooks for frontend integration with Codette Server
 * Includes error handling, loading states, and automatic retries
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { getApiClient } from './codetteApiClient';
import type {
  ChatRequest,
  ChatResponse,
  AudioAnalysisRequest,
  AudioAnalysisResponse,
  SuggestionRequest,
  SuggestionResponse,
  TransportState,
  AudioDevice,
  VSTPlugin,
  CloudSyncRequest,
  CollaborationOperation,
} from './codetteApiClient';

// ============================================================================
// TYPES
// ============================================================================

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  retry: () => Promise<void>;
}

export interface UseApiOptions {
  onError?: (error: ApiError) => void;
  onSuccess?: (data: any) => void;
  retries?: number;
  timeout?: number;
}

// ============================================================================
// GENERIC API HOOK
// ============================================================================

export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const isMountedRef = useRef(true);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      if (isMountedRef.current) {
        setData(result);
        options.onSuccess?.(result);
      }
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : 'Unknown error',
        code: 'API_ERROR',
        details: err instanceof Error ? { stack: err.stack } : {},
      };

      if (isMountedRef.current) {
        setError(apiError);
        options.onError?.(apiError);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiCall, options]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    retry: execute,
  };
}

// ============================================================================
// CHAT HOOK
// ============================================================================

export function useCodetteChat() {
  const [responses, setResponses] = useState<ChatResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const client = getApiClient();

  const sendMessage = useCallback(
    async (request: ChatRequest): Promise<ChatResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await client.chat(request);
        setResponses(prev => [...prev, response]);
        return response;
      } catch (err) {
        const apiError: ApiError = {
          message: err instanceof Error ? err.message : 'Chat failed',
          code: 'CHAT_ERROR',
        };
        setError(apiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const clearHistory = useCallback(() => {
    setResponses([]);
  }, []);

  return {
    responses,
    loading,
    error,
    sendMessage,
    clearHistory,
  };
}

// ============================================================================
// AUDIO ANALYSIS HOOK
// ============================================================================

export function useAudioAnalysis() {
  const [analysis, setAnalysis] = useState<AudioAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const client = getApiClient();

  const analyze = useCallback(
    async (request: AudioAnalysisRequest): Promise<AudioAnalysisResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.analyzeAudio(request);
        setAnalysis(result);
        return result;
      } catch (err) {
        const apiError: ApiError = {
          message: err instanceof Error ? err.message : 'Analysis failed',
          code: 'ANALYSIS_ERROR',
        };
        setError(apiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  return {
    analysis,
    loading,
    error,
    analyze,
  };
}

// ============================================================================
// SUGGESTIONS HOOK
// ============================================================================

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState<SuggestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const client = getApiClient();

  const getSuggestions = useCallback(
    async (request: SuggestionRequest): Promise<SuggestionResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await client.getSuggestions(request);
        setSuggestions(result);
        return result;
      } catch (err) {
        const apiError: ApiError = {
          message: err instanceof Error ? err.message : 'Failed to get suggestions',
          code: 'SUGGESTIONS_ERROR',
        };
        setError(apiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  return {
    suggestions,
    loading,
    error,
    getSuggestions,
  };
}

// ============================================================================
// TRANSPORT HOOK
// ============================================================================

export function useTransport() {
  const [state, setState] = useState<TransportState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const client = getApiClient();

  const play = useCallback(async () => {
    console.warn('[useTransport] Transport control via REST is not supported; use CodetteBridge WebSocket for realtime control');
    try {
      const status = await client.getCodetteStatus();
      setState(status.transport ?? status);
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'Play (status) failed', code: 'TRANSPORT_ERROR' });
    }
  }, [client]);

  const stop = useCallback(async () => {
    console.warn('[useTransport] Transport control via REST is not supported; use CodetteBridge WebSocket for realtime control');
    try {
      const status = await client.getCodetteStatus();
      setState(status.transport ?? status);
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'Stop (status) failed', code: 'TRANSPORT_ERROR' });
    }
  }, [client]);

  const pause = useCallback(async () => {
    console.warn('[useTransport] Transport control via REST is not supported; use CodetteBridge WebSocket for realtime control');
    try {
      const status = await client.getCodetteStatus();
      setState(status.transport ?? status);
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'Pause (status) failed', code: 'TRANSPORT_ERROR' });
    }
  }, [client]);

  const resume = useCallback(async () => {
    console.warn('[useTransport] Transport control via REST is not supported; use CodetteBridge WebSocket for realtime control');
    try {
      const status = await client.getCodetteStatus();
      setState(status.transport ?? status);
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'Resume (status) failed', code: 'TRANSPORT_ERROR' });
    }
  }, [client]);

  const seek = useCallback(async (seconds: number) => {
    console.warn('[useTransport] Use CodetteBridge.transportSeek for realtime seek via WebSocket');
    try {
      const status = await client.getCodetteStatus();
      setState(status.transport ?? status);
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'Seek (status) failed', code: 'TRANSPORT_ERROR' });
    }
  }, [client]);

  const setTempo = useCallback(async (bpm: number) => {
    console.warn('[useTransport] Use CodetteBridge.setTempo for realtime tempo control via WebSocket');
    try {
      const status = await client.getCodetteStatus();
      setState(status.transport ?? status);
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'Tempo change (status) failed', code: 'TRANSPORT_ERROR' });
    }
  }, [client]);

  const setLoop = useCallback(async (enabled: boolean, start: number = 0, end: number = 10) => {
    console.warn('[useTransport] Use CodetteBridge.setLoop for realtime loop control via WebSocket');
    try {
      const status = await client.getCodetteStatus();
      setState(status.transport ?? status);
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'Loop (status) failed', code: 'TRANSPORT_ERROR' });
    }
  }, [client]);

  const getStatus = useCallback(async () => {
    setLoading(true);
    try {
      const status = await client.getCodetteStatus();
      setState(status.transport ?? status);
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'Status update failed', code: 'TRANSPORT_ERROR' });
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    state,
    loading,
    error,
    play,
    stop,
    pause,
    resume,
    seek,
    setTempo,
    setLoop,
    getStatus,
  };
}

// ============================================================================
// AUDIO DEVICES HOOK
// ============================================================================

export function useAudioDevices() {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const client = getApiClient();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const deviceList = await client.getAudioDevices();
      setDevices(deviceList);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to fetch devices',
        code: 'AUDIO_DEVICE_ERROR',
      });
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    devices,
    loading,
    error,
    refresh,
  };
}

// ============================================================================
// VST PLUGINS HOOK
// ============================================================================

export function useVSTPlugins() {
  const [plugins, setPlugins] = useState<VSTPlugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const client = getApiClient();

  const listPlugins = useCallback(async () => {
    setLoading(true);
    try {
      const pluginList = await client.listVSTPlugins();
      setPlugins(pluginList);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to list plugins',
        code: 'VST_ERROR',
      });
    } finally {
      setLoading(false);
    }
  }, [client]);

  const loadPlugin = useCallback(
    async (path: string, name: string): Promise<VSTPlugin | null> => {
      try {
        const plugin = await client.loadVSTPlugin(path, name);
        setPlugins(prev => [...prev, plugin]);
        return plugin;
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to load plugin',
          code: 'VST_ERROR',
        });
        return null;
      }
    },
    [client]
  );

  const setParameter = useCallback(
    async (pluginId: string, parameterId: string, value: number) => {
      try {
        await client.setVSTParameter(pluginId, parameterId, value);
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to set parameter',
          code: 'VST_ERROR',
        });
      }
    },
    [client]
  );

  useEffect(() => {
    listPlugins();
  }, [listPlugins]);

  return {
    plugins,
    loading,
    error,
    listPlugins,
    loadPlugin,
    setParameter,
  };
}

// ============================================================================
// CLOUD SYNC HOOK
// ============================================================================

export function useCloudSync() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const client = getApiClient();

  const listProjects = useCallback(async () => {
    setLoading(true);
    try {
      const projectList = await client.listCloudProjects();
      setProjects(projectList);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to list projects',
        code: 'CLOUD_SYNC_ERROR',
      });
    } finally {
      setLoading(false);
    }
  }, [client]);

  const saveProject = useCallback(
    async (request: CloudSyncRequest) => {
      try {
        const result = await client.saveProjectToCloud(request);
        return result;
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to save project',
          code: 'CLOUD_SYNC_ERROR',
        });
        return null;
      }
    },
    [client]
  );

  const loadProject = useCallback(
    async (projectId: string, deviceId: string) => {
      try {
        const project = await client.loadProjectFromCloud(projectId, deviceId);
        return project;
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to load project',
          code: 'CLOUD_SYNC_ERROR',
        });
        return null;
      }
    },
    [client]
  );

  useEffect(() => {
    listProjects();
  }, [listProjects]);

  return {
    projects,
    loading,
    error,
    listProjects,
    saveProject,
    loadProject,
  };
}

// ============================================================================
// COLLABORATION HOOK
// ============================================================================

export function useCollaboration(projectId: string) {
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const client = getApiClient();

  const joinSession = useCallback(
    async (userId: string, userName: string) => {
      setLoading(true);
      try {
        const session = await client.joinCollaborationSession(projectId, userId, userName);
        setUsers(session.users);
        return session;
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to join session',
          code: 'COLLABORATION_ERROR',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client, projectId]
  );

  const submitOperation = useCallback(
    async (operation: CollaborationOperation) => {
      try {
        const result = await client.submitCollaborationOperation(operation);
        return result;
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : 'Failed to submit operation',
          code: 'COLLABORATION_ERROR',
        });
        return null;
      }
    },
    [client]
  );

  const getSession = useCallback(async () => {
    try {
      const session = await client.getCollaborationSession(projectId);
      setUsers(session.users);
      return session;
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to get session',
        code: 'COLLABORATION_ERROR',
      });
      return null;
    }
  }, [client, projectId]);

  return {
    users,
    loading,
    error,
    joinSession,
    submitOperation,
    getSession,
  };
}

// ============================================================================
// CACHE HOOK
// ============================================================================

export function useCacheStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const client = getApiClient();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const cacheStats = await client.getCacheStats();
      setStats(cacheStats);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to get cache stats',
        code: 'CACHE_ERROR',
      });
    } finally {
      setLoading(false);
    }
  }, [client]);

  const clear = useCallback(async () => {
    try {
      await client.clearCache();
      setStats(null);
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to clear cache',
        code: 'CACHE_ERROR',
      });
    }
  }, [client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    stats,
    loading,
    error,
    refresh,
    clear,
  };
}

export default {
  useApi,
  useCodetteChat,
  useAudioAnalysis,
  useSuggestions,
  useTransport,
  useAudioDevices,
  useVSTPlugins,
  useCloudSync,
  useCollaboration,
  useCacheStats,
};
