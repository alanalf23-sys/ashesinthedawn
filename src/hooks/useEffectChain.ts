/**
 * useEffectChain - Custom React hook for managing audio effects
 * 
 * Provides easy integration of effect chain processing with:
 * - Effect parameter management
 * - Real-time audio processing via DSP bridge
 * - Wet/dry mixing control
 * - Effect enable/bypass toggling
 * - Automatic cleanup and resource management
 */

import { useState, useCallback, useRef, useEffect as useReactEffect } from 'react';
import { initializeDSPBridge } from '../lib/dspBridge';

/**
 * Effect configuration state
 */
export interface EffectState {
  effectId: string;
  effectType: string;
  enabled: boolean;
  bypass: boolean;
  wetDry: number; // 0-100
  parameters: Record<string, string | number | boolean>;
}

/**
 * Hook options
 */
export interface UseEffectChainOptions {
  trackId: string;
  onEffectProcessed?: (output: Float32Array) => void;
  onError?: (error: Error) => void;
  autoCleanup?: boolean;
}

/**
 * Hook return value
 */
export interface UseEffectChainReturn {
  effects: EffectState[];
  addEffect: (effectType: string) => Promise<void>;
  removeEffect: (effectId: string) => Promise<void>;
  updateEffectParameter: (effectId: string, paramName: string, value: unknown) => Promise<void>;
  toggleEffect: (effectId: string, enabled: boolean) => Promise<void>;
  setWetDry: (effectId: string, wetDry: number) => Promise<void>;
  processAudio: (audio: Float32Array, sampleRate: number) => Promise<Float32Array>;
  savePreset: (name: string) => Promise<void>;
  loadPreset: (name: string) => Promise<void>;
  isProcessing: boolean;
  error: Error | null;
}

/**
 * useEffectChain - React hook for effect chain management
 */
export function useEffectChain({
  trackId,
  onEffectProcessed,
  onError,
  autoCleanup = true,
}: UseEffectChainOptions): UseEffectChainReturn {
  // State
  const [effects, setEffects] = useState<EffectState[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // References
  const dspBridgeRef = useRef<any>(null);

  /**
   * Initialize DSP bridge on mount
   */
  useReactEffect(() => {
    const initBridge = async () => {
      try {
        dspBridgeRef.current = await initializeDSPBridge();
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to initialize DSP bridge');
        setError(e);
        onError?.(e);
      }
    };

    initBridge();

    // Cleanup on unmount
    return () => {
      if (autoCleanup) {
        dspBridgeRef.current = null;
      }
    };
  }, [trackId, onError, autoCleanup]);

  /**
   * Add effect to chain
   */
  const addEffect = useCallback(
    async (effectType: string) => {
      try {
        setIsProcessing(true);
        setError(null);

        const effectId = `effect-${Date.now()}-${Math.random()}`;
        const newEffect: EffectState = {
          effectId,
          effectType,
          enabled: true,
          bypass: false,
          wetDry: 100,
          parameters: {},
        };

        // Update state
        setEffects(prev => [...prev, newEffect]);
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to add effect');
        setError(e);
        onError?.(e);
      } finally {
        setIsProcessing(false);
      }
    },
    [onError]
  );

  /**
   * Remove effect from chain
   */
  const removeEffect = useCallback(
    async (effectId: string) => {
      try {
        setIsProcessing(true);
        setError(null);

        // Update state
        setEffects(prev => prev.filter(e => e.effectId !== effectId));
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to remove effect');
        setError(e);
        onError?.(e);
      } finally {
        setIsProcessing(false);
      }
    },
    [onError]
  );

  /**
   * Update effect parameter
   */
  const updateEffectParameter = useCallback(
    async (effectId: string, paramName: string, value: unknown) => {
      if (!dspBridgeRef.current) return;

      try {
        setIsProcessing(true);
        setError(null);

        // Get effect type
        const effect = effects.find(e => e.effectId === effectId);
        if (!effect) throw new Error(`Effect ${effectId} not found`);

        // Update via DSP bridge
        await dspBridgeRef.current.processEffect(effect.effectType, new Float32Array([]), {
          [paramName]: value,
        });

        // Update local state
        const valueAsValidType: string | number | boolean =
          typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
            ? value
            : String(value);

        setEffects(prev =>
          prev.map(e =>
            e.effectId === effectId
              ? {
                  ...e,
                  parameters: {
                    ...e.parameters,
                    [paramName]: valueAsValidType,
                  },
                }
              : e
          )
        );
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to update parameter');
        setError(e);
        onError?.(e);
      } finally {
        setIsProcessing(false);
      }
    },
    [effects, onError]
  );

  /**
   * Toggle effect on/off
   */
  const toggleEffect = useCallback(
    async (effectId: string, enabled: boolean) => {
      try {
        setIsProcessing(true);
        setError(null);

        // Update state
        setEffects(prev =>
          prev.map(e =>
            e.effectId === effectId
              ? {
                  ...e,
                  enabled,
                  bypass: !enabled,
                }
              : e
          )
        );
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to toggle effect');
        setError(e);
        onError?.(e);
      } finally {
        setIsProcessing(false);
      }
    },
    [onError]
  );

  /**
   * Set wet/dry mix
   */
  const setWetDry = useCallback(
    async (effectId: string, wetDry: number) => {
      try {
        setIsProcessing(true);
        setError(null);

        // Update state
        setEffects(prev =>
          prev.map(e =>
            e.effectId === effectId
              ? {
                  ...e,
                  wetDry,
                }
              : e
          )
        );
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to set wet/dry');
        setError(e);
        onError?.(e);
      } finally {
        setIsProcessing(false);
      }
    },
    [onError]
  );

  /**
   * Process audio through effect chain
   */
  const processAudio = useCallback(
    async (audio: Float32Array, _sampleRate: number): Promise<Float32Array> => {
      try {
        setIsProcessing(true);
        setError(null);

        if (!dspBridgeRef.current) return audio;

        // Process through DSP bridge
        for (const effect of effects) {
          if (!effect.enabled) continue;

          const processed = await dspBridgeRef.current.processEffect(
            effect.effectType,
            audio,
            effect.parameters
          );

          if (processed) {
            // Apply wet/dry mix
            const wetAmount = effect.wetDry / 100;
            const dryAmount = 1 - wetAmount;

            for (let i = 0; i < audio.length; i++) {
              audio[i] = audio[i] * dryAmount + processed[i] * wetAmount;
            }
          }
        }

        // Call callback
        onEffectProcessed?.(audio);

        return audio;
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to process audio');
        setError(e);
        onError?.(e);
        return audio;
      } finally {
        setIsProcessing(false);
      }
    },
    [effects, onEffectProcessed, onError]
  );

  /**
   * Save effect chain preset (placeholder)
   */
  const savePreset = useCallback(
    async (name: string) => {
      try {
        setIsProcessing(true);
        setError(null);

        // Save to localStorage
        localStorage.setItem(
          `effect-preset-${trackId}-${name}`,
          JSON.stringify(effects)
        );
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to save preset');
        setError(e);
        onError?.(e);
      } finally {
        setIsProcessing(false);
      }
    },
    [trackId, effects, onError]
  );

  /**
   * Load effect chain preset (placeholder)
   */
  const loadPreset = useCallback(
    async (name: string) => {
      try {
        setIsProcessing(true);
        setError(null);

        // Load from localStorage
        const stored = localStorage.getItem(`effect-preset-${trackId}-${name}`);
        if (stored) {
          const preset = JSON.parse(stored) as EffectState[];
          setEffects(preset);
        }
      } catch (err) {
        const e = err instanceof Error ? err : new Error('Failed to load preset');
        setError(e);
        onError?.(e);
      } finally {
        setIsProcessing(false);
      }
    },
    [trackId, onError]
  );

  return {
    effects,
    addEffect,
    removeEffect,
    updateEffectParameter,
    toggleEffect,
    setWetDry,
    processAudio,
    savePreset,
    loadPreset,
    isProcessing,
    error,
  };
}

/**
 * Hook for managing a single effect
 */
export function useSingleEffect(effectId: string, effectType: string) {
  const [parameters, setParameters] = useState<Record<string, string | number | boolean>>({});
  const [enabled, setEnabled] = useState(true);
  const [wetDry, setWetDryValue] = useState(100);

  return {
    effectId,
    effectType,
    parameters,
    setParameters,
    enabled,
    setEnabled,
    wetDry,
    setWetDry: setWetDryValue,
  };
}
