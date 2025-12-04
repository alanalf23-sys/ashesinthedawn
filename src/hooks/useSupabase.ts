/**
 * React Hooks for Supabase Database Operations
 * Provide reactive access to database tables with caching and error handling
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  ChatHistory,
  MusicKnowledge,
  UserFeedback,
  ChatMessage,
} from '../types/supabase';
import { chatHistoryOps, musicKnowledgeOps, feedbackOps } from '../lib/supabaseClient';

// ============================================================================
// CHAT HISTORY HOOK
// ============================================================================

export interface UseChatHistoryReturn {
  chatHistory: ChatHistory | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  addMessage: (message: ChatMessage) => Promise<void>;
  clearHistory: () => Promise<void>;
  isConnected: boolean;
}

export function useChatHistory(userId: string | null): UseChatHistoryReturn {
  const [chatHistory, setChatHistory] = useState<ChatHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Load chat history on mount
  useEffect(() => {
    if (!userId) return;

    const loadChatHistory = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: err } = await chatHistoryOps.getOrCreate(userId);
      if (err) {
        setError(err);
        setIsConnected(false);
      } else {
        setChatHistory(data);
        setIsConnected(true);
      }
      setIsLoading(false);
    };

    loadChatHistory();
  }, [userId]);

  const addMessage = useCallback(
    async (message: ChatMessage) => {
      if (!userId) return;

      setIsLoading(true);
      const { data, error: err } = await chatHistoryOps.addMessage(userId, message);
      if (err) {
        setError(err);
      } else if (data) {
        setChatHistory(data as ChatHistory);
      }
      setIsLoading(false);
    },
    [userId]
  );

  const clearHistory = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    const { data, error: err } = await chatHistoryOps.clear(userId);
    if (err) {
      setError(err);
    } else if (data) {
      setChatHistory(data as ChatHistory);
    }
    setIsLoading(false);
  }, [userId]);

  return {
    chatHistory,
    messages: chatHistory?.messages || [],
    isLoading,
    error,
    addMessage,
    clearHistory,
    isConnected,
  };
}

// ============================================================================
// MUSIC KNOWLEDGE HOOK
// ============================================================================

export interface UseMusicKnowledgeReturn {
  suggestions: MusicKnowledge[];
  isLoading: boolean;
  error: string | null;
  searchByText: (query: string) => Promise<void>;
  searchByCategory: (category: string) => Promise<void>;
  searchBySimilarity: (embedding: number[]) => Promise<void>;
  isConnected: boolean;
}

export function useMusicKnowledge(): UseMusicKnowledgeReturn {
  const [suggestions, setSuggestions] = useState<MusicKnowledge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const searchByText = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);

    const { data, error: err } = await musicKnowledgeOps.searchByText(query);
    if (err) {
      setError(err);
      setIsConnected(false);
    } else {
      setSuggestions((data as MusicKnowledge[]) || []);
      setIsConnected(true);
    }
    setIsLoading(false);
  }, []);

  const searchByCategory = useCallback(async (category: string) => {
    setIsLoading(true);
    setError(null);

    const { data, error: err } = await musicKnowledgeOps.getByCategory(category);
    if (err) {
      setError(err);
      setIsConnected(false);
    } else {
      setSuggestions((data as MusicKnowledge[]) || []);
      setIsConnected(true);
    }
    setIsLoading(false);
  }, []);

  const searchBySimilarity = useCallback(async (embedding: number[]) => {
    setIsLoading(true);
    setError(null);

    const { data, error: err } = await musicKnowledgeOps.searchBySimilarity(embedding);
    if (err) {
      setError(err);
      setIsConnected(false);
    } else {
      setSuggestions((data as MusicKnowledge[]) || []);
      setIsConnected(true);
    }
    setIsLoading(false);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    searchByText,
    searchByCategory,
    searchBySimilarity,
    isConnected,
  };
}

// ============================================================================
// USER FEEDBACK HOOK
// ============================================================================

export interface UseUserFeedbackReturn {
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  submitFeedback: (feedback: Omit<UserFeedback, 'id' | 'created_at'>) => Promise<void>;
  isConnected: boolean;
}

export function useUserFeedback(): UseUserFeedbackReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const submitFeedback = useCallback(
    async (feedback: Omit<UserFeedback, 'id' | 'created_at'>) => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      const { error: err } = await feedbackOps.submit(feedback);
      if (err) {
        setError(err);
        setIsConnected(false);
      } else {
        setSuccess(true);
        setIsConnected(true);
        setTimeout(() => setSuccess(false), 3000);
      }
      setIsSubmitting(false);
    },
    []
  );

  return {
    isSubmitting,
    error,
    success,
    submitFeedback,
    isConnected,
  };
}

// ============================================================================
// GENERIC SUPABASE TABLE HOOK
// ============================================================================

export interface UseSupabaseTableOptions {
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
  filter?: Record<string, unknown>;
}

export interface UseSupabaseTableReturn<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isConnected: boolean;
}

export function useSupabaseTable<T>(
  tableName: string,
  options?: UseSupabaseTableOptions
): UseSupabaseTableReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Note: This is a placeholder implementation
      // In production, create specific operation hooks for each table
      setData([]);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsConnected(false);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch, isConnected };
}

// ============================================================================
// BATCH OPERATIONS HOOK
// ============================================================================

export interface UseBatchOperationsReturn {
  batchInsert: <T,>(table: string, records: T[]) => Promise<void>;
  batchUpdate: <T,>(
    table: string,
    updates: Array<{ id: string; data: Partial<T> }>
  ) => Promise<void>;
  batchDelete: (table: string, ids: string[]) => Promise<void>;
  isProcessing: boolean;
  error: string | null;
}

export function useBatchOperations(): UseBatchOperationsReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const batchInsert = useCallback(async <T,>(table: string, records: T[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Call API endpoint for batch insert
      const response = await fetch('/api/supabase/batch/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, records }),
      });

      if (!response.ok) throw new Error('Batch insert failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch insert failed');
    }

    setIsProcessing(false);
  }, []);

  const batchUpdate = useCallback(
    async <T,>(table: string, updates: Array<{ id: string; data: Partial<T> }>) => {
      setIsProcessing(true);
      setError(null);

      try {
        const response = await fetch('/api/supabase/batch/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table, updates }),
        });

        if (!response.ok) throw new Error('Batch update failed');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Batch update failed');
      }

      setIsProcessing(false);
    },
    []
  );

  const batchDelete = useCallback(async (table: string, ids: string[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/supabase/batch/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, ids }),
      });

      if (!response.ok) throw new Error('Batch delete failed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch delete failed');
    }

    setIsProcessing(false);
  }, []);

  return { batchInsert, batchUpdate, batchDelete, isProcessing, error };
}

export default {
  useChatHistory,
  useMusicKnowledge,
  useUserFeedback,
  useSupabaseTable,
  useBatchOperations,
};
