/**
 * VU Meter Panel - Ready-to-use VU meter with audio engine integration
 * 
 * Usage:
 *   import { VUMeterPanel } from './components/VUMeterPanel';
 *   <VUMeterPanel responseMs={50} release={5} />
 */

import { useState } from 'react';
import { VUMeterGfx } from './VUMeterGfx';
import { useVUMeterData } from '../hooks/useVUMeterData';
import { Settings2 } from 'lucide-react';

interface VUMeterPanelProps {
  /** Track ID for track-specific metering (optional) */
  trackId?: string;
  /** Response time in milliseconds (1-300, default 50) */
  responseMs?: number;
  /** Release speed (1-10, default 5) */
  release?: number;
  /** CSS class name */
  className?: string;
  /** Show control sliders */
  showControls?: boolean;
}

export function VUMeterPanel({
  trackId,
  responseMs: initialResponseMs = 50,
  release: initialRelease = 5,
  className = '',
  showControls = true,
}: VUMeterPanelProps): JSX.Element {
  const { leftLevel, rightLevel } = useVUMeterData(trackId);
  const [responseMs, setResponseMs] = useState(initialResponseMs);
  const [release, setRelease] = useState(initialRelease);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300">VU Meter</h3>
        {showControls && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Settings"
          >
            <Settings2 className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Settings Panel */}
      {showControls && showSettings && (
        <div className="mb-3 p-3 bg-gray-800 rounded border border-gray-700 space-y-3">
          <div>
            <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Response (ms)</span>
              <span className="font-mono">{responseMs}</span>
            </label>
            <input
              type="range"
              min="1"
              max="300"
              value={responseMs}
              onChange={(e) => setResponseMs(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Release (Slow/Fast)</span>
              <span className="font-mono">{release.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={release}
              onChange={(e) => setRelease(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}
      
      {/* VU Meter Canvas */}
      <VUMeterGfx
        leftLevel={leftLevel}
        rightLevel={rightLevel}
        responseMs={responseMs}
        release={release}
        width={425}
        height={520}
      />
      
      {/* Level Readout */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-800 rounded p-2 border border-gray-700">
          <span className="text-gray-500">L Peak:</span>
          <span className="ml-2 text-green-400 font-mono">
            {(leftLevel * 100).toFixed(1)}%
          </span>
        </div>
        <div className="bg-gray-800 rounded p-2 border border-gray-700">
          <span className="text-gray-500">R Peak:</span>
          <span className="ml-2 text-green-400 font-mono">
            {(rightLevel * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Attribution */}
      <div className="mt-2 text-xs text-gray-600 text-center">
        Based on VU Meter by Liteon (GPL)
      </div>
    </div>
  );
}

export default VUMeterPanel;
