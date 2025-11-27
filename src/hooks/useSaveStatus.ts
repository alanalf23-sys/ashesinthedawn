import { useEffect, useState } from 'react';
import { useDAW } from '../contexts/DAWContext';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseSaveStatusOptions {
  showDuration?: number; // How long to show "Saved" state (ms)
}

/**
 * Hook to track auto-save status of the current project
 * Shows: "Saving...", "Saved ✓", or error state
 */
export function useSaveStatus(options: UseSaveStatusOptions = {}) {
  const { showDuration = 2000 } = options;
  const { currentProject } = useDAW();
  
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detect when project changes to know when auto-save is happening
  useEffect(() => {
    if (!currentProject) {
      setStatus('idle');
      return;
    }

    // Show "Saving..." immediately when we detect a change
    setStatus('saving');
    setErrorMessage(null);

    // Simulate save completion after a short delay
    // In real implementation, this would be triggered by the auto-save mechanism
    const timer = setTimeout(() => {
      setStatus('saved');
      setLastSaveTime(Date.now());
      
      // Auto-hide "Saved" status after showDuration
      const hideTimer = setTimeout(() => {
        setStatus('idle');
      }, showDuration);
      
      return () => clearTimeout(hideTimer);
    }, 300); // 300ms simulated save time

    return () => clearTimeout(timer);
  }, [currentProject, showDuration]);

  return {
    status,
    lastSaveTime,
    errorMessage,
    isSaving: status === 'saving',
    isSaved: status === 'saved',
    isError: status === 'error',
  };
}
