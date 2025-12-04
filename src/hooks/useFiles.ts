import { useState, useCallback, useEffect } from 'react';
import {
  getUserFiles,
  createFile,
  deleteFile,
  getFileById,
  searchFiles,
  getFilesByType,
  type CodetteFile,
} from '../lib/database/fileService';

export interface UseFilesReturn {
  files: CodetteFile[];
  loading: boolean;
  error: string | null;
  loadFiles: (fileType?: string) => Promise<void>;
  uploadFile: (filename: string, storagePath: string, fileType: string) => Promise<CodetteFile | null>;
  removeFile: (fileId: string) => Promise<boolean>;
  getFile: (fileId: string) => Promise<CodetteFile | null>;
  searchForFiles: (searchTerm: string) => Promise<CodetteFile[]>;
  getFilesByCategory: (fileType: string) => Promise<CodetteFile[]>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing Codette files with authentication
 * Handles fetching, uploading, deleting, and searching user files
 */
export function useFiles(): UseFilesReturn {
  const [files, setFiles] = useState<CodetteFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async (fileType?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getUserFiles(fileType);

      if (result.success && result.data) {
        setFiles(result.data);
      } else {
        setError(result.error || 'Failed to load files');
        setFiles([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const uploadFile = useCallback(
    async (filename: string, storagePath: string, fileType: string) => {
      try {
        setLoading(true);
        setError(null);
        const result = await createFile(filename, storagePath, fileType);

        if (result.success && result.data) {
          setFiles((prev) => [result.data!, ...prev]);
          return result.data;
        } else {
          setError(result.error || 'Failed to upload file');
          return null;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const removeFile = useCallback(async (fileId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await deleteFile(fileId);

      if (result.success) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        return true;
      } else {
        setError(result.error || 'Failed to delete file');
        return false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFile = useCallback(async (fileId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getFileById(fileId);

      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to get file');
        return null;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchForFiles = useCallback(async (searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await searchFiles(searchTerm);

      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to search files');
        return [];
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getFilesByCategory = useCallback(async (fileType: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await getFilesByType(fileType);

      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to get files by type');
        return [];
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadFiles();
  }, [loadFiles]);

  return {
    files,
    loading,
    error,
    loadFiles,
    uploadFile,
    removeFile,
    getFile,
    searchForFiles,
    getFilesByCategory,
    refresh,
  };
}
