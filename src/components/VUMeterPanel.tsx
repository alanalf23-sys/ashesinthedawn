/**
 * VU Meter Panel - Ready-to-use VU meter with audio engine integration
 * Enhanced with ITU-R BS.1770-4 LUFS metering
 * 
 * Usage:
 *   import { VUMeterPanel } from './components/VUMeterPanel';
 *   <VUMeterPanel responseMs={50} release={5} showLUFS={true} />
 */

import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { VUMeterGfx } from './VUMeterGfx';
import { useVUMeterData } from '../hooks/useVUMeterData';
import { useDAW } from '../contexts/DAWContext';
import { getMeteringEngine } from '../lib/meteringEngine';
import { Settings, Activity, Volume2 } from 'lucide-react';

interface VUMeterPanelProps {
  /** Track ID for track-specific metering (optional, defaults to selected track or master) */
  trackId?: string;
  /** Response time in milliseconds (1-300, default 50) */
  responseMs?: number;
  /** Release speed (1-10, default 5) */
  release?: number;
  /** CSS class name */
  className?: string;
  /** Show control sliders */
  showControls?: boolean;
  /** Compact mode (hide settings and labels) */
  compact?: boolean;
  /** Show LUFS metering (ITU-R BS.1770-4) */
  showLUFS?: boolean;
}

interface LoudnessMetrics {
  shortTermLUFS: number;
  integratedLUFS: number;
  truePeak: number;
  headroom: number;
  phaseCorrelation: number;
}

export function VUMeterPanel({
  trackId: propTrackId,
  responseMs: initialResponseMs = 50,
  release: initialRelease = 5,
  className = '',
  showControls = true,
  compact = false,
  showLUFS = false,
}: VUMeterPanelProps): JSX.Element {
  const { selectedTrack, isPlaying } = useDAW();
  
  // Use prop trackId if provided, otherwise use selected track, or null for master
  const effectiveTrackId = propTrackId || selectedTrack?.id;
  const trackName = effectiveTrackId 
    ? (selectedTrack?.name || `Track ${effectiveTrackId}`)
    : 'Master';
  
  const { leftLevel, rightLevel, leftPeak, rightPeak } = useVUMeterData(effectiveTrackId);
  const [responseMs, setResponseMs] = useState(initialResponseMs);
  const [release, setRelease] = useState(initialRelease);
  const [showSettings, setShowSettings] = useState(false);
  const [loudnessMetrics, setLoudnessMetrics] = useState(null as LoudnessMetrics | null);

  // Subscribe to metering engine updates if LUFS display is enabled
  useEffect(() => {
    if (!showLUFS) return;

    const meteringEngine = getMeteringEngine();
    const unsubscribe = meteringEngine.onMeteringUpdate((data) => {
      setLoudnessMetrics({
        shortTermLUFS: data.metrics.shortTermLUFS,
        integratedLUFS: data.metrics.integratedLUFS,
        truePeak: data.metrics.truePeak,
        headroom: data.metrics.headroom,
        phaseCorrelation: data.metrics.phaseCorrelation,
      });
    });

    return unsubscribe;
  }, [showLUFS]);

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isPlaying ? 'text-green-500 animate-pulse' : 'text-gray-500'}`} />
          {!compact && (
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-gray-300">VU Meter</h3>
              <span className="text-xs text-gray-500">{trackName}</span>
            </div>
          )}
        </div>
        {showControls && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Settings Panel */}
      {showControls && showSettings && !compact && (
        <div className="mb-3 p-3 bg-gray-800 rounded border border-gray-700 space-y-3">
          <div>
            <label 
              htmlFor="response-ms-slider"
              className="flex items-center justify-between text-xs text-gray-400 mb-1"
            >
              <span>Response (ms)</span>
              <span className="font-mono">{responseMs}</span>
            </label>
            <input
              id="response-ms-slider"
              type="range"
              min="1"
              max="300"
              value={responseMs}
              onChange={(e) => setResponseMs(Number(e.target.value))}
              title={`VU meter response time: ${responseMs}ms`}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label 
              htmlFor="release-slider"
              className="flex items-center justify-between text-xs text-gray-400 mb-1"
            >
              <span>Release (Slow/Fast)</span>
              <span className="font-mono">{release.toFixed(1)}</span>
            </label>
            <input
              id="release-slider"
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={release}
              onChange={(e) => setRelease(Number(e.target.value))}
              title={`Needle release speed: ${release.toFixed(1)}`}
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
      {!compact && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-800 rounded p-2 border border-gray-700">
              <span className="text-gray-500">L Peak:</span>
              <span className="ml-2 text-green-400 font-mono">
                {(leftPeak * 100).toFixed(1)}%
              </span>
            </div>
            <div className="bg-gray-800 rounded p-2 border border-gray-700">
              <span className="text-gray-500">R Peak:</span>
              <span className="ml-2 text-green-400 font-mono">
                {(rightPeak * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* LUFS Metering (ITU-R BS.1770-4) */}
          {showLUFS && loudnessMetrics && (
            <div className="mt-3 p-3 bg-slate-800 rounded border border-slate-700 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-semibold text-cyan-400">Loudness Metering</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Short-term LUFS */}
                <div className="bg-slate-900 rounded p-2 border border-slate-600">
                  <span className="text-slate-400 block">Short-Term</span>
                  <span className={`font-mono font-semibold ${
                    loudnessMetrics.shortTermLUFS > -23 ? 'text-red-400' :
                    loudnessMetrics.shortTermLUFS > -25 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {loudnessMetrics.shortTermLUFS.toFixed(1)} LUFS
                  </span>
                </div>
                
                {/* Integrated LUFS */}
                <div className="bg-slate-900 rounded p-2 border border-slate-600">
                  <span className="text-slate-400 block">Integrated</span>
                  <span className={`font-mono font-semibold ${
                    loudnessMetrics.integratedLUFS > -23 ? 'text-red-400' :
                    loudnessMetrics.integratedLUFS > -25 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {loudnessMetrics.integratedLUFS.toFixed(1)} LUFS
                  </span>
                </div>
                
                {/* True Peak */}
                <div className="bg-slate-900 rounded p-2 border border-slate-600">
                  <span className="text-slate-400 block">True Peak</span>
                  <span className={`font-mono font-semibold ${
                    loudnessMetrics.truePeak > -1 ? 'text-red-400' :
                    loudnessMetrics.truePeak > -3 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {loudnessMetrics.truePeak.toFixed(2)} dBFS
                  </span>
                </div>
                
                {/* Headroom */}
                <div className="bg-slate-900 rounded p-2 border border-slate-600">
                  <span className="text-slate-400 block">Headroom</span>
                  <span className={`font-mono font-semibold ${
                    loudnessMetrics.headroom < 3 ? 'text-red-400' :
                    loudnessMetrics.headroom < 6 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {loudnessMetrics.headroom.toFixed(2)} dB
                  </span>
                </div>
              </div>
              
              {/* Phase Correlation (Stereo only) */}
              <div className="mt-2 pt-2 border-t border-slate-600">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">Phase Correlation:</span>
                  <span className={`font-mono font-semibold ${
                    loudnessMetrics.phaseCorrelation > 0.9 ? 'text-green-400' :
                    loudnessMetrics.phaseCorrelation > 0.7 ? 'text-yellow-400' :
                    'text-orange-400'
                  }`}>
                    {loudnessMetrics.phaseCorrelation.toFixed(2)}
                  </span>
                </div>
                {/* Phase correlation meter bar */}
                <div className="w-full h-2 bg-slate-900 rounded border border-slate-600 overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      loudnessMetrics.phaseCorrelation > 0.9 ? 'bg-green-500 w-full' :
                      loudnessMetrics.phaseCorrelation > 0.7 ? 'bg-yellow-500 w-4/5' :
                      loudnessMetrics.phaseCorrelation > 0.5 ? 'bg-orange-500 w-3/4' :
                      loudnessMetrics.phaseCorrelation > 0 ? 'bg-orange-500 w-1/2' :
                      'bg-red-500 w-1/4'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Attribution */}
          <div className="mt-2 text-xs text-gray-600 text-center">
            Based on VU Meter by Liteon (GPL)
          </div>
        </>
      )}
    </div>
  );
}

export default VUMeterPanel;
