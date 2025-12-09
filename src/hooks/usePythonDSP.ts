/**
 * React Hook for Python DSP Integration
 * 
 * Provides easy access to Python DSP Bridge state and functions
 * within React components.
 */

import { useState, useEffect, useCallback } from 'react';
import { getPythonDSPBridge, type TransportState, type DSPEffectDefinition } from '../lib/pythonDSPBridge';

export interface PythonDSPState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  transportState: TransportState | null;
  availableEffects: DSPEffectDefinition[];
}

export interface PythonDSPActions {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  getHealth: () => Promise<{ status: string; connected: boolean }>;
}

/**
 * Hook for Python DSP integration
 */
export function usePythonDSP(): [PythonDSPState, PythonDSPActions] {
  const bridge = getPythonDSPBridge();

  const [state, setState] = useState<PythonDSPState>({
    connected: false,
    connecting: false,
    error: null,
    transportState: null,
    availableEffects: [],
  });

  // Initialize on mount
  useEffect(() => {
    // Get initial connection state
    setState(prev => ({
      ...prev,
      connected: bridge.isConnected(),
      availableEffects: bridge.getAvailableEffects(),
    }));

    // Register connection state callback
    bridge.onConnectionStateChange((connected) => {
      setState(prev => ({
        ...prev,
        connected,
        connecting: false,
        error: connected ? null : prev.error,
      }));
    });

    // Register transport state callback
    bridge.onTransportStateUpdate((transport) => {
      setState(prev => ({
        ...prev,
        transportState: transport,
      }));
    });

    // Auto-connect if not connected
    if (!bridge.isConnected()) {
      connect();
    }
  }, []);

  // Connection actions
  const connect = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const success = await bridge.connect();
      
      if (success) {
        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
          availableEffects: bridge.getAvailableEffects(),
        }));
      } else {
        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
          error: 'Failed to connect to Python DSP server',
        }));
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection error';
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: errorMessage,
      }));
      return false;
    }
  }, [bridge]);

  const disconnect = useCallback(() => {
    bridge.disconnect();
    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      transportState: null,
    }));
  }, [bridge]);

  const getHealth = useCallback(async () => {
    return await bridge.getHealth();
  }, [bridge]);

  const actions: PythonDSPActions = {
    connect,
    disconnect,
    getHealth,
  };

  return [state, actions];
}

/**
 * Hook for Python DSP connection status only
 */
export function usePythonDSPConnection(): {
  connected: boolean;
  connecting: boolean;
  error: string | null;
} {
  const [state] = usePythonDSP();
  
  return {
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
  };
}

/**
 * Hook for available Python DSP effects
 */
export function usePythonDSPEffects(): DSPEffectDefinition[] {
  const [state] = usePythonDSP();
  return state.availableEffects;
}
