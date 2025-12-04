import { useState, useCallback, useEffect } from 'react';
import {
  getOrCreateDefaultPermissions,
  updatePermission,
  logActivity,
  getActivityLogs,
  getControlSettings,
  updateControlSettings,
  clearActivityLogs,
  checkPermission,
  type PermissionLevel,
  type ActivityLog,
  type CodetteControlState,
} from '../lib/database/codetteControlService';

export interface UseCodetteControlReturn {
  // Permissions
  permissions: Record<string, PermissionLevel>;
  setPermission: (actionType: string, level: PermissionLevel) => Promise<boolean>;
  checkAction: (actionType: string) => { allowed: boolean; requiresApproval: boolean };

  // Activity
  activityLogs: ActivityLog[];
  activityLoading: boolean;
  activityError: string | null;
  addActivity: (source: 'codette' | 'user' | 'system', action: string, details?: Record<string, unknown>) => Promise<boolean>;
  refreshActivity: () => Promise<void>;

  // Settings
  settings: CodetteControlState;
  settingsLoading: boolean;
  settingsError: string | null;
  updateSettings: (updates: Partial<CodetteControlState>) => Promise<boolean>;

  // Admin
  clearLogs: () => Promise<boolean>;

  // General
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing Codette Control Center state
 * Handles permissions, activity logging, and settings
 */
export function useCodetteControl(userId: string): UseCodetteControlReturn {
  // Permissions state
  const [permissions, setPermissionsState] = useState<Record<string, PermissionLevel>>({});
  const [permLoading, setPermLoading] = useState(true);
  const [permError, setPermError] = useState<string | null>(null);

  // Activity state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  // Settings state
  const [settings, setSettingsState] = useState<CodetteControlState>({
    enabled: true,
    logActivity: true,
    autoRender: false,
    includeInBackups: true,
    clearHistoryOnClose: false,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    try {
      setPermLoading(true);
      setPermError(null);
      const result = await getOrCreateDefaultPermissions(userId);

      if (result.success && result.data) {
        setPermissionsState(result.data);
      } else {
        setPermError(result.error || 'Failed to load permissions');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setPermError(msg);
    } finally {
      setPermLoading(false);
    }
  }, [userId]);

  const loadActivity = useCallback(async () => {
    try {
      setActivityLoading(true);
      setActivityError(null);
      const result = await getActivityLogs(userId, 50);

      if (result.success && result.data) {
        setActivityLogs(result.data);
      } else {
        setActivityError(result.error || 'Failed to load activity');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setActivityError(msg);
    } finally {
      setActivityLoading(false);
    }
  }, [userId]);

  const loadSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      setSettingsError(null);
      const result = await getControlSettings(userId);

      if (result.success && result.data) {
        setSettingsState(result.data);
      } else {
        setSettingsError(result.error || 'Failed to load settings');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSettingsError(msg);
    } finally {
      setSettingsLoading(false);
    }
  }, [userId]);

  // Load permissions on mount
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Load activity on mount
  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const setPermission = useCallback(
    async (actionType: string, level: PermissionLevel) => {
      try {
        const result = await updatePermission(userId, actionType, level);

        if (result.success) {
          setPermissionsState((prev) => ({
            ...prev,
            [actionType]: level,
          }));
          return true;
        } else {
          setPermError(result.error || 'Failed to update permission');
          return false;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setPermError(msg);
        return false;
      }
    },
    [userId]
  );

  const checkAction = useCallback(
    (actionType: string) => {
      return checkPermission(actionType, permissions);
    },
    [permissions]
  );

  const addActivity = useCallback(
    async (source: 'codette' | 'user' | 'system', action: string, details?: Record<string, unknown>) => {
      try {
        setActivityError(null);

        // Log to database
        const result = await logActivity(userId, source, action, 'completed', details);

        if (result.success) {
          // Add to local state
          if (result.data) {
            setActivityLogs((prev) => [result.data!, ...prev.slice(0, 49)]);
          }
          return true;
        } else {
          setActivityError(result.error || 'Failed to log activity');
          return false;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setActivityError(msg);
        return false;
      }
    },
    [userId]
  );

  const refreshActivity = useCallback(async () => {
    await loadActivity();
  }, [loadActivity]);

  const updateSettings = useCallback(
    async (updates: Partial<CodetteControlState>) => {
      try {
        setSettingsError(null);
        const result = await updateControlSettings(userId, updates);

        if (result.success) {
          setSettingsState((prev) => ({
            ...prev,
            ...updates,
          }));
          return true;
        } else {
          setSettingsError(result.error || 'Failed to update settings');
          return false;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setSettingsError(msg);
        return false;
      }
    },
    [userId]
  );

  const clearLogs = useCallback(async () => {
    try {
      const result = await clearActivityLogs(userId);

      if (result.success) {
        setActivityLogs([]);
        return true;
      } else {
        setActivityError(result.error || 'Failed to clear logs');
        return false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setActivityError(msg);
      return false;
    }
  }, [userId]);

  return {
    // Permissions
    permissions,
    setPermission,
    checkAction,

    // Activity
    activityLogs,
    activityLoading,
    activityError,
    addActivity,
    refreshActivity,

    // Settings
    settings,
    settingsLoading,
    settingsError,
    updateSettings,

    // Admin
    clearLogs,

    // General
    loading: permLoading || settingsLoading,
    error: permError || settingsError || activityError,
  };
}
