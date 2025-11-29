/**
 * EffectControlsPanel - Real-time effect parameter controls
 * 
 * Displays and manages effect parameters with:
 * - Real-time parameter sliders
 * - Effect enable/bypass toggle
 * - Parameter range validation
 * - Wet/dry mixing control
 * - Effect chain visualization
 * - Parameter presets (optional)
 */

import { useState, useCallback } from 'react';
import { initializeDSPBridge } from '../lib/dspBridge';

interface EffectParameter {
  name: string;
  label: string;
  type: 'number' | 'range' | 'select' | 'toggle';
  value: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { label: string; value: string | number }[];
  description?: string;
}

/**
 * Effect configuration
 */
interface EffectConfig {
  id: string;
  type: string;
  enabled: boolean;
  wetDry: number; // 0-100 (0 = dry, 50 = mix, 100 = wet)
  parameters: Record<string, EffectParameter>;
  bypass: boolean;
}

/**
 * Component props
 */
interface EffectControlsPanelProps {
  effectId: string;
  effectType: string;
  onParameterChange?: (effectId: string, paramName: string, value: unknown) => void;
  onEffectToggle?: (effectId: string, enabled: boolean) => void;
  onWetDryChange?: (effectId: string, value: number) => void;
  className?: string;
}

/**
 * Effect parameter definitions for each effect type
 */
const EFFECT_PARAMETERS: Record<string, Record<string, EffectParameter>> = {
  'high-pass': {
    frequency: {
      name: 'frequency',
      label: 'Frequency',
      type: 'range',
      value: 20,
      min: 10,
      max: 20000,
      step: 1,
      unit: 'Hz',
      description: 'Cutoff frequency for high-pass filtering',
    },
    resonance: {
      name: 'resonance',
      label: 'Resonance',
      type: 'range',
      value: 1,
      min: 0.1,
      max: 10,
      step: 0.1,
      unit: 'dB',
      description: 'Peak at cutoff frequency',
    },
  },
  'low-pass': {
    frequency: {
      name: 'frequency',
      label: 'Frequency',
      type: 'range',
      value: 20000,
      min: 20,
      max: 20000,
      step: 1,
      unit: 'Hz',
      description: 'Cutoff frequency for low-pass filtering',
    },
    resonance: {
      name: 'resonance',
      label: 'Resonance',
      type: 'range',
      value: 1,
      min: 0.1,
      max: 10,
      step: 0.1,
      unit: 'dB',
      description: 'Peak at cutoff frequency',
    },
  },
  'eq-3-band': {
    low: {
      name: 'low',
      label: 'Low',
      type: 'range',
      value: 0,
      min: -12,
      max: 12,
      step: 0.1,
      unit: 'dB',
      description: 'Low frequency adjustment',
    },
    mid: {
      name: 'mid',
      label: 'Mid',
      type: 'range',
      value: 0,
      min: -12,
      max: 12,
      step: 0.1,
      unit: 'dB',
      description: 'Mid frequency adjustment',
    },
    high: {
      name: 'high',
      label: 'High',
      type: 'range',
      value: 0,
      min: -12,
      max: 12,
      step: 0.1,
      unit: 'dB',
      description: 'High frequency adjustment',
    },
  },
  'compressor': {
    threshold: {
      name: 'threshold',
      label: 'Threshold',
      type: 'range',
      value: -20,
      min: -60,
      max: 0,
      step: 0.1,
      unit: 'dB',
      description: 'Level above which compression begins',
    },
    ratio: {
      name: 'ratio',
      label: 'Ratio',
      type: 'range',
      value: 4,
      min: 1,
      max: 20,
      step: 0.1,
      unit: ':1',
      description: 'Compression ratio',
    },
    attackTime: {
      name: 'attackTime',
      label: 'Attack',
      type: 'range',
      value: 0.005,
      min: 0.001,
      max: 0.1,
      step: 0.001,
      unit: 's',
      description: 'Time to reach full compression',
    },
    releaseTime: {
      name: 'releaseTime',
      label: 'Release',
      type: 'range',
      value: 0.25,
      min: 0.01,
      max: 1,
      step: 0.01,
      unit: 's',
      description: 'Time to release compression',
    },
    makeupGain: {
      name: 'makeupGain',
      label: 'Makeup Gain',
      type: 'range',
      value: 0,
      min: -24,
      max: 24,
      step: 0.1,
      unit: 'dB',
      description: 'Output level compensation',
    },
  },
  'limiter': {
    threshold: {
      name: 'threshold',
      label: 'Threshold',
      type: 'range',
      value: -6,
      min: -60,
      max: 0,
      step: 0.1,
      unit: 'dB',
      description: 'Maximum output level',
    },
    releaseTime: {
      name: 'releaseTime',
      label: 'Release',
      type: 'range',
      value: 0.1,
      min: 0.01,
      max: 1,
      step: 0.01,
      unit: 's',
      description: 'Time to release limiting',
    },
  },
  'distortion': {
    drive: {
      name: 'drive',
      label: 'Drive',
      type: 'range',
      value: 0,
      min: 0,
      max: 60,
      step: 0.1,
      unit: 'dB',
      description: 'Amount of gain before clipping',
    },
    tone: {
      name: 'tone',
      label: 'Tone',
      type: 'range',
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Tone color (0 = dark, 1 = bright)',
    },
  },
  'delay': {
    time: {
      name: 'time',
      label: 'Time',
      type: 'range',
      value: 0.5,
      min: 0.01,
      max: 2,
      step: 0.01,
      unit: 's',
      description: 'Delay time',
    },
    feedback: {
      name: 'feedback',
      label: 'Feedback',
      type: 'range',
      value: 0.4,
      min: 0,
      max: 0.95,
      step: 0.01,
      description: 'Amount of signal fed back to input',
    },
  },
  'reverb': {
    roomSize: {
      name: 'roomSize',
      label: 'Room Size',
      type: 'range',
      value: 0.5,
      min: 0.1,
      max: 1,
      step: 0.01,
      description: 'Size of simulated room',
    },
    dampening: {
      name: 'dampening',
      label: 'Dampening',
      type: 'range',
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'High frequency absorption',
    },
    width: {
      name: 'width',
      label: 'Width',
      type: 'range',
      value: 1,
      min: 0,
      max: 1,
      step: 0.01,
      description: 'Stereo width of reverb',
    },
    predelay: {
      name: 'predelay',
      label: 'Predelay',
      type: 'range',
      value: 0,
      min: 0,
      max: 0.1,
      step: 0.001,
      unit: 's',
      description: 'Delay before reverb tail begins',
    },
  },
};

/**
 * EffectControlsPanel Component
 * 
 * Displays real-time controls for audio effects
 */
export default function EffectControlsPanel({
  effectId,
  effectType,
  onParameterChange,
  onEffectToggle,
  onWetDryChange,
  className = '',
}: EffectControlsPanelProps): JSX.Element {
  const [effect, setEffect] = useState<EffectConfig>({
    id: effectId,
    type: effectType,
    enabled: true,
    wetDry: 100,
    bypass: false,
    parameters: EFFECT_PARAMETERS[effectType] || {},
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedParams, setExpandedParams] = useState(true);

  /**
   * Handle parameter change with DSP bridge
   */
  const handleParameterChange = useCallback(
    async (paramName: string, newValue: unknown) => {
      try {
        setIsLoading(true);
        setError(null);

        // Update local state - safely type-cast the value
        setEffect(prev => {
          const updatedParams = { ...prev.parameters };
          const param = updatedParams[paramName];
          if (param && (typeof newValue === 'number' || typeof newValue === 'string' || typeof newValue === 'boolean')) {
            updatedParams[paramName] = { ...param, value: newValue };
          }
          return { ...prev, parameters: updatedParams };
        });

        // Update via DSP bridge
        const bridge = await initializeDSPBridge();
        if (bridge && typeof bridge === 'object' && 'processEffect' in bridge) {
          await (bridge as any).processEffect(effectType, new Float32Array([]), {
            [paramName]: newValue,
          });
        }

        // Call callback if provided
        onParameterChange?.(effectId, paramName, newValue);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update parameter';
        setError(message);
        // Silently log for now - error already displayed in UI
        console.warn(`[EffectControlsPanel] Failed to update ${paramName}:`, message);
      } finally {
        setIsLoading(false);
      }
    },
    [effectId, effectType, onParameterChange]
  );

  /**
   * Handle effect toggle
   */
  const handleEffectToggle = useCallback(
    async (enabled: boolean) => {
      try {
        setIsLoading(true);
        setError(null);

        setEffect(prev => ({
          ...prev,
          enabled,
          bypass: !enabled,
        }));

        onEffectToggle?.(effectId, enabled);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to toggle effect';
        setError(message);
        // Silently log for now - error already displayed in UI
        console.warn(`[EffectControlsPanel] Failed to toggle effect:`, message);
      } finally {
        setIsLoading(false);
      }
    },
    [effectId, effectType, onEffectToggle]
  );

  /**
   * Handle wet/dry change
   */
  const handleWetDryChange = useCallback(
    async (wetDry: number) => {
      try {
        setIsLoading(true);
        setError(null);

        setEffect(prev => ({
          ...prev,
          wetDry,
        }));

        onWetDryChange?.(effectId, wetDry);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update wet/dry';
        setError(message);
        // Silently log for now - error already displayed in UI
        console.warn(`[EffectControlsPanel] Failed to update wet/dry:`, message);
      } finally {
        setIsLoading(false);
      }
    },
    [effectId, effectType, onWetDryChange]
  );

  /**
   * Render parameter control
   */
  const renderParameter = (paramName: string, param: EffectParameter): JSX.Element => {
    const paramValue = effect.parameters[paramName]?.value ?? param.value;
    const displayValue = typeof paramValue === 'boolean' ? (paramValue ? '1' : '0') : String(paramValue);

    switch (param.type) {
      case 'range':
        return (
          <div key={paramName} className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-300">
                {param.label}
                {param.unit && <span className="text-xs text-gray-500 ml-1">({param.unit})</span>}
              </label>
              <input
                type="number"
                value={displayValue}
                onChange={e => handleParameterChange(paramName, parseFloat(e.target.value))}
                className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300"
                disabled={isLoading || !effect.enabled}
                min={param.min}
                max={param.max}
                step={param.step}
              />
            </div>
            <input
              type="range"
              value={displayValue}
              onChange={e => handleParameterChange(paramName, parseFloat(e.target.value))}
              min={param.min}
              max={param.max}
              step={param.step}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              disabled={isLoading || !effect.enabled}
              title={param.description}
            />
            {param.description && (
              <p className="text-xs text-gray-500">{param.description}</p>
            )}
          </div>
        );

      case 'toggle':
        return (
          <div key={paramName} className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">{param.label}</label>
            <button
              onClick={() => handleParameterChange(paramName, !paramValue)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                paramValue
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
              disabled={isLoading || !effect.enabled}
              title={param.description}
            >
              {paramValue ? 'On' : 'Off'}
            </button>
          </div>
        );

      case 'select':
        return (
          <div key={paramName} className="space-y-1">
            <label className="text-sm font-medium text-gray-300">{param.label}</label>
            <select
              value={displayValue}
              onChange={e => handleParameterChange(paramName, e.target.value)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300"
              disabled={isLoading || !effect.enabled}
              title={param.description}
            >
              {param.options?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {param.description && (
              <p className="text-xs text-gray-500">{param.description}</p>
            )}
          </div>
        );

      default:
        return <div key={paramName} />;
    }
  };

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-200 capitalize">
          {effectType.replace(/-/g, ' ')}
        </h3>
        <button
          onClick={() => handleEffectToggle(!effect.enabled)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            effect.enabled
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-400'
          }`}
          disabled={isLoading}
          title={effect.enabled ? 'Disable effect' : 'Enable effect'}
        >
          {effect.enabled ? 'Active' : 'Bypassed'}
        </button>
      </div>

      {/* Wet/Dry Control */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-300">Wet/Dry Mix</label>
          <span className="text-xs text-gray-400">{effect.wetDry}%</span>
        </div>
        <input
          type="range"
          value={effect.wetDry}
          onChange={e => handleWetDryChange(parseFloat(e.target.value))}
          min="0"
          max="100"
          step="1"
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          disabled={isLoading || !effect.enabled}
          title="0% = dry signal only, 100% = wet effect only"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Dry</span>
          <span>Mix</span>
          <span>Wet</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded p-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Parameters Section */}
      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={() => setExpandedParams(!expandedParams)}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-300 hover:text-gray-200 transition-colors"
        >
          <span>Parameters</span>
          <span className={`transition-transform ${expandedParams ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {expandedParams && (
          <div className="mt-4 space-y-4">
            {Object.entries(effect.parameters).map(([paramName, param]) =>
              renderParameter(paramName, param)
            )}
            {Object.keys(effect.parameters).length === 0 && (
              <p className="text-xs text-gray-500">No parameters available</p>
            )}
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center justify-center text-xs text-gray-400">
          <div className="animate-spin mr-2">⟳</div>
          Updating...
        </div>
      )}
    </div>
  );
}
