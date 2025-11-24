/**
 * AudioMonitor Component - Real-time audio level display and I/O monitoring
 * Shows input levels, latency, and audio I/O status
 */

import { useEffect, useState } from 'react';
import { useDAW } from '../contexts/DAWContext';
import { Gauge, AlertCircle, Zap } from 'lucide-react';

export default function AudioMonitor() {
  const {
    inputLevel,
    latencyMs,
    bufferUnderruns,
    bufferOverruns,
    isAudioIOActive,
    audioIOError,
    selectedInputDevice,
  } = useDAW();

  const [peakLevel, setPeakLevel] = useState(0);
  const [rmsLevel, setRmsLevel] = useState(0);

  // Track peak level
  useEffect(() => {
    if (inputLevel > peakLevel) {
      setPeakLevel(inputLevel);
    } else {
      // Slowly decay peak indicator
      setPeakLevel(prev => Math.max(inputLevel, prev - 0.01));
    }

    // RMS is a smoothed average
    setRmsLevel(prev => prev * 0.95 + inputLevel * 0.05);
  }, [inputLevel, peakLevel]);

  // Calculate health status
  const getHealthStatus = (): 'excellent' | 'good' | 'fair' | 'poor' => {
    const xrunCount = bufferUnderruns + bufferOverruns;

    if (xrunCount > 2 || latencyMs > 15) {
      return 'fair';
    }
    if (xrunCount > 0 || latencyMs > 10) {
      return 'good';
    }
    return 'excellent';
  };

  // Calculate health color
  const getHealthColor = (): string => {
    const status = getHealthStatus();
    switch (status) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-blue-500';
      case 'fair':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
    }
  };

  // Calculate meter gradient
  const getMeterGradient = (level: number): string => {
    if (level < 0.5) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (level < 0.8) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  if (!isAudioIOActive) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-900 border-l border-gray-700">
        <div className="text-center">
          <Gauge className="w-6 h-6 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Audio I/O Inactive</p>
          {selectedInputDevice && (
            <p className="text-xs text-gray-500 mt-1">{selectedInputDevice.label}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 border-l border-gray-700 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-gray-100">Audio Monitor</span>
        </div>
      </div>

      {/* Error Display */}
      {audioIOError && (
        <div className="flex gap-2 p-3 bg-red-900/20 border border-red-700/30 rounded text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-300">{audioIOError}</span>
        </div>
      )}

      {/* Input Level Meter */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-medium text-gray-300">Input Level</label>
          <span className="text-xs text-gray-400">
            {(inputLevel * 100).toFixed(0)}%
          </span>
        </div>

        {/* Meter Background */}
        <div className="h-6 bg-gray-800 rounded border border-gray-700 overflow-hidden flex items-center">
          {/* RMS Indicator */}
          <div
            className={`h-full transition-all ${getMeterGradient(rmsLevel)}`}
            style={{ width: `${rmsLevel * 100}%` }}
          />

          {/* Peak Indicator */}
          <div
            className="absolute h-6 w-0.5 bg-white/80 transition-all"
            style={{ left: `${(peakLevel * 100) * (292 / 100)}px` }} // Adjust for container width
          />

          {/* Clipping Indicator */}
          {inputLevel > 0.95 && (
            <div className="absolute inset-0 animate-pulse bg-red-500/20" />
          )}
        </div>

        {/* Meter Labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>-∞</span>
          <span>-12dB</span>
          <span>0dB</span>
        </div>
      </div>

      {/* Latency Display */}
      <div className="bg-gray-800 rounded p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-300">Latency</span>
          <span className={`text-sm font-mono ${latencyMs > 10 ? 'text-yellow-400' : 'text-gray-300'}`}>
            {latencyMs.toFixed(1)}ms
          </span>
        </div>

        {/* Latency Bar */}
        <div className="h-1 bg-gray-700 rounded overflow-hidden">
          <div
            className={`h-full transition-all ${
              latencyMs > 15
                ? 'bg-red-500'
                : latencyMs > 10
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((latencyMs / 30) * 100, 100)}%` }}
          />
        </div>

        <p className="text-xs text-gray-500">Target: &lt;10ms</p>
      </div>

      {/* Health Status */}
      <div className="flex items-center gap-2 p-3 bg-gray-800 rounded">
        <Zap className={`w-4 h-4 ${getHealthColor()}`} />
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-300 capitalize">
            {getHealthStatus()} Health
          </p>
        </div>
      </div>

      {/* Xrun Counter */}
      {(bufferUnderruns > 0 || bufferOverruns > 0) && (
        <div className="flex gap-2 text-xs p-2 bg-yellow-900/20 border border-yellow-700/30 rounded">
          <div className="flex-1">
            <p className="text-yellow-300">
              Underruns: {bufferUnderruns} | Overruns: {bufferOverruns}
            </p>
          </div>
        </div>
      )}

      {/* Device Info */}
      <div className="text-xs p-2 bg-gray-800 rounded text-gray-400 space-y-1">
        <p className="truncate">
          <span className="text-gray-500">Device: </span>
          {selectedInputDevice?.label || 'Unknown'}
        </p>
        <p>
          <span className="text-gray-500">Sample Rate: </span>
          48 kHz
        </p>
        <p>
          <span className="text-gray-500">Buffer: </span>
          8192 samples (~170ms)
        </p>
      </div>
    </div>
  );
}
