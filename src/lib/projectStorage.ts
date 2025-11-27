/**
 * Project Storage Utility
 * Handles localStorage persistence for DAW projects
 * Saves project state automatically and restores on page load
 */

import { Project } from '../types';

const STORAGE_KEY = 'corelogic_current_project';
const AUTO_SAVE_INTERVAL = 5000; // Auto-save every 5 seconds
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

interface StorageMetadata {
  version: number;
  lastSaved: string;
  size: number;
}

/**
 * Save project to localStorage
 */
export function saveProjectToStorage(project: Project | null): boolean {
  if (!project) {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  }

  try {
    const data = JSON.stringify(project);
    
    // Check storage size
    if (data.length > MAX_STORAGE_SIZE) {
      console.warn('[ProjectStorage] Project too large for storage, skipping save');
      return false;
    }

    // Save with metadata
    const storageData = {
      project,
      metadata: {
        version: 1,
        lastSaved: new Date().toISOString(),
        size: data.length,
      } as StorageMetadata,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    console.log('[ProjectStorage] Project saved to localStorage');
    return true;
  } catch (error) {
    console.error('[ProjectStorage] Failed to save project:', error);
    
    // Handle QuotaExceededError
    if (error instanceof DOMException && error.code === 22) {
      console.warn('[ProjectStorage] Storage quota exceeded');
    }
    
    return false;
  }
}

/**
 * Load project from localStorage
 */
export function loadProjectFromStorage(): Project | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
      console.debug('[ProjectStorage] No saved project found');
      return null;
    }

    const { project, metadata } = JSON.parse(stored);
    
    // Validate project structure
    if (!project || !project.id || !Array.isArray(project.tracks)) {
      console.warn('[ProjectStorage] Invalid project structure in storage');
      return null;
    }

    console.log('[ProjectStorage] Project restored from localStorage:', {
      name: project.name,
      trackCount: project.tracks.length,
      saved: metadata.lastSaved,
    });

    return project;
  } catch (error) {
    console.error('[ProjectStorage] Failed to load project from storage:', error);
    return null;
  }
}

/**
 * Clear saved project from storage
 */
export function clearProjectStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[ProjectStorage] Cleared saved project');
  } catch (error) {
    console.error('[ProjectStorage] Failed to clear storage:', error);
  }
}

/**
 * Check if there's a saved project
 */
export function hasSavedProject(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    console.error('[ProjectStorage] Failed to check for saved project:', error);
    return false;
  }
}

/**
 * Get storage info
 */
export function getStorageInfo(): { hasSaved: boolean; size: number; lastSaved: string | null } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
      return { hasSaved: false, size: 0, lastSaved: null };
    }

    const { metadata } = JSON.parse(stored);
    
    return {
      hasSaved: true,
      size: metadata.size,
      lastSaved: metadata.lastSaved,
    };
  } catch (error) {
    console.error('[ProjectStorage] Failed to get storage info:', error);
    return { hasSaved: false, size: 0, lastSaved: null };
  }
}

/**
 * Create an auto-save interval hook
 * Returns cleanup function
 */
export function createAutoSaveInterval(
  project: Project | null,
  onSave?: (success: boolean) => void
): () => void {
  const interval = setInterval(() => {
    if (!project) return;
    
    const success = saveProjectToStorage(project);
    onSave?.(success);
  }, AUTO_SAVE_INTERVAL);

  return () => clearInterval(interval);
}
