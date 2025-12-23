/**
 * React Hooks for File System Integration
 * 
 * Provides TypeScript-first hooks for:
 * - File system operations (list, rename, delete, properties)
 * - Favorites and recents management
 * - Batch file import
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  modified: string;
  extension: string;
  isFavorite: boolean;
}

export interface FolderInfo {
  path: string;
  name: string;
  modifiedTime: string;
  fileCount: number;
  isFavorite: boolean;
}

export interface FileProperties {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  sizeFormatted: string;
  created: string;
  modified: string;
  extension: string;
  isFavorite: boolean;
  isReadOnly: boolean;
  itemCount?: number;
}

// ============================================================================
// FILE SYSTEM HOOK
// ============================================================================

/**
 * useFileSystem - Manage file system operations
 * 
 * Provides methods to:
 * - List files and folders
 * - Rename files
 * - Delete files
 * - Get file properties
 * - Toggle favorites
 * 
 * @param baseUrl Backend API base URL (default: http://localhost:8000)
 * @returns File system operations object
 */
export function useFileSystem(baseUrl: string = 'http://localhost:8000') {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const listFiles = useCallback(
    async (path: string = ''): Promise<FileItem[]> => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${baseUrl}/api/files/list?path=${encodeURIComponent(path)}`
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        setFiles(data.files);
        setCurrentPath(data.currentPath);
        return data.files;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to list files';
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  const renameFile = useCallback(
    async (oldPath: string, newName: string): Promise<boolean> => {
      try {
        setError(null);
        const response = await fetch(
          `${baseUrl}/api/files/rename?oldPath=${encodeURIComponent(oldPath)}&newName=${encodeURIComponent(newName)}`,
          { method: 'POST' }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        // Refresh current directory
        if (currentPath) {
          await listFiles(currentPath);
        }
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to rename';
        setError(message);
        return false;
      }
    },
    [baseUrl, currentPath, listFiles]
  );

  const deleteFile = useCallback(
    async (path: string): Promise<boolean> => {
      try {
        setError(null);
        const response = await fetch(
          `${baseUrl}/api/files/${encodeURIComponent(path)}`,
          { method: 'DELETE' }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        // Refresh current directory
        if (currentPath) {
          await listFiles(currentPath);
        }
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete';
        setError(message);
        return false;
      }
    },
    [baseUrl, currentPath, listFiles]
  );

  const getProperties = useCallback(
    async (path: string): Promise<FileProperties | null> => {
      try {
        setError(null);
        const response = await fetch(
          `${baseUrl}/api/files/properties?path=${encodeURIComponent(path)}`
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get properties';
        setError(message);
        return null;
      }
    },
    [baseUrl]
  );

  const toggleFavorite = useCallback(
    async (path: string): Promise<boolean> => {
      try {
        setError(null);
        const response = await fetch(
          `${baseUrl}/api/files/favorite?path=${encodeURIComponent(path)}`,
          { method: 'POST' }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        // Update files list
        setFiles(prev =>
          prev.map(f => ({
            ...f,
            isFavorite: f.path === path ? data.isFavorite : f.isFavorite
          }))
        );
        
        return data.isFavorite;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to toggle favorite';
        setError(message);
        return false;
      }
    },
    [baseUrl]
  );

  return {
    files,
    currentPath,
    loading,
    error,
    listFiles,
    renameFile,
    deleteFile,
    getProperties,
    toggleFavorite
  };
}

// ============================================================================
// FAVORITES & RECENTS HOOK
// ============================================================================

/**
 * useFavoritesAndRecents - Manage favorite and recently accessed folders
 * 
 * Provides methods to:
 * - Get favorite folders
 * - Get recently accessed folders
 * - Integration with FileSystem hook for toggling
 * 
 * @param baseUrl Backend API base URL
 * @returns Favorites/recents management object
 */
export function useFavoritesAndRecents(baseUrl: string = 'http://localhost:8000') {
  const [favorites, setFavorites] = useState<FolderInfo[]>([]);
  const [recents, setRecents] = useState<FolderInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${baseUrl}/api/folders/favorites`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setFavorites(data.folders);
      return data.folders;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load favorites';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  const getRecents = useCallback(
    async (limit: number = 10) => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${baseUrl}/api/folders/recents?limit=${limit}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        setRecents(data.folders);
        return data.folders;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load recents';
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  // Load favorites and recents on mount
  useEffect(() => {
    getFavorites();
    getRecents();
  }, [getFavorites, getRecents]);

  return {
    favorites,
    recents,
    loading,
    error,
    getFavorites,
    getRecents
  };
}

// ============================================================================
// BATCH IMPORT HOOK
// ============================================================================

/**
 * useBatchImport - Handle batch file import operations
 * 
 * Provides methods for:
 * - Multi-select file handling
 * - Drag-and-drop batching
 * - Batch import to DAW
 * 
 * @param baseUrl Backend API base URL
 * @returns Batch import operations object
 */
export function useBatchImport(baseUrl: string = 'http://localhost:8000') {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const toggleFileSelection = useCallback((filePath: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  }, []);

  const selectMultiple = useCallback((files: string[], modifiers: { shift?: boolean; ctrl?: boolean }) => {
    if (modifiers.ctrl) {
      // Ctrl+Click: toggle selection
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        files.forEach(f => {
          if (newSet.has(f)) {
            newSet.delete(f);
          } else {
            newSet.add(f);
          }
        });
        return newSet;
      });
    } else if (modifiers.shift) {
      // Shift+Click: range selection (requires context)
      setSelectedFiles(new Set(files));
    } else {
      // Regular click: select single
      setSelectedFiles(new Set([files[files.length - 1]]));
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  const importFiles = useCallback(
    async (
      files: string[],
      targetTrackId?: string,
      insertMode: 'replace' | 'append' = 'append'
    ): Promise<{ imported: string[]; failed: string[] }> => {
      try {
        setImporting(true);
        setError(null);
        setImportProgress({ current: 0, total: files.length });

        const response = await fetch(`${baseUrl}/api/batch/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files,
            targetTrackId,
            insertMode
          })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        setImportProgress({ current: result.count, total: files.length });
        
        // Clear selection on success
        clearSelection();
        
        return { imported: result.imported, failed: result.failed };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Import failed';
        setError(message);
        return { imported: [], failed: files };
      } finally {
        setImporting(false);
      }
    },
    [baseUrl, clearSelection]
  );

  const importSelected = useCallback(
    async (targetTrackId?: string): Promise<{ imported: string[]; failed: string[] }> => {
      return importFiles(Array.from(selectedFiles), targetTrackId);
    },
    [selectedFiles, importFiles]
  );

  return {
    selectedFiles: Array.from(selectedFiles),
    selectedCount: selectedFiles.size,
    importing,
    importProgress,
    error,
    toggleFileSelection,
    selectMultiple,
    clearSelection,
    importFiles,
    importSelected,
    isFileSelected: (path: string) => selectedFiles.has(path)
  };
}

// ============================================================================
// MULTI-SELECT WITH RANGE SUPPORT
// ============================================================================

/**
 * useMultiSelectWithRange - Advanced multi-select with shift-click range selection
 * 
 * @param items List of items to select from
 * @param getItemKey Function to get unique key for item
 * @returns Multi-select state and handlers
 */
export function useMultiSelectWithRange<T>(
  items: T[],
  getItemKey: (item: T) => string
) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastSelectedKey, setLastSelectedKey] = useState<string | null>(null);

  const itemKeys = items.map(getItemKey);

  const handleSelect = useCallback(
    (item: T, modifiers: { shift?: boolean; ctrl?: boolean } = {}) => {
      const key = getItemKey(item);

      if (modifiers.shift && lastSelectedKey) {
        // Range selection
        const lastIndex = itemKeys.indexOf(lastSelectedKey);
        const currentIndex = itemKeys.indexOf(key);
        const [start, end] = lastIndex < currentIndex ? [lastIndex, currentIndex] : [currentIndex, lastIndex];

        const newSelected = new Set(selected);
        for (let i = start; i <= end; i++) {
          newSelected.add(itemKeys[i]);
        }
        setSelected(newSelected);
      } else if (modifiers.ctrl) {
        // Toggle selection
        const newSelected = new Set(selected);
        if (newSelected.has(key)) {
          newSelected.delete(key);
        } else {
          newSelected.add(key);
        }
        setSelected(newSelected);
      } else {
        // Single selection
        setSelected(new Set([key]));
      }

      setLastSelectedKey(key);
    },
    [selected, lastSelectedKey, itemKeys, getItemKey]
  );

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    setLastSelectedKey(null);
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(itemKeys));
    setLastSelectedKey(itemKeys[itemKeys.length - 1]);
  }, [itemKeys]);

  return {
    selected: Array.from(selected),
    selectedSet: selected,
    selectedCount: selected.size,
    isSelected: (item: T) => selected.has(getItemKey(item)),
    handleSelect,
    clearSelection,
    selectAll
  };
}
