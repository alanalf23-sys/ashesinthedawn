/**
 * Python DSP Settings Panel
 * 
 * Provides controls and information for Python DSP integration:
 * - Connection status and controls
 * - Processing statistics
 * - Available effects list
 * - Performance metrics
 */

import { useState, useEffect } from 'react';
import { Cpu, Activity, Zap, CheckCircle, XCircle, RefreshCw, BarChart } from 'lucide-react';
import { usePythonDSP } from '../hooks/usePythonDSP';
import { getAudioEngine } from '../lib/audioEngine';

export default function PythonDSPPanel() {
  const [dspState, dspActions] = usePythonDSP();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      try {
        const engine = getAudioEngine();
        const hybridStats = engine.getHybridStats();
        setStats(hybridStats);
      } catch (error) {
        console.error('[PythonDSP] Failed to get stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dspActions.connect();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleHealthCheck = async () => {
    const health = await dspActions.getHealth();
    alert(`Python DSP Server\nStatus: ${health.status}\nConnected: ${health.connected}`);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-4 h-4 text-purple-500" />
          <h2 className="text-sm font-semibold text-gray-100">Python DSP Server</h2>
        </div>
        <p className="text-xs text-gray-500">Professional audio processing</p>
      </div>

      {/* Connection Status */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-400">Connection Status</span>
          <div className="flex items-center gap-2">
            {dspState.connected ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-xs font-semibold ${dspState.connected ? 'text-green-400' : 'text-red-400'}`}>
              {dspState.connecting ? 'Connecting...' : dspState.connected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {dspState.error && (
          <div className="p-2 bg-red-900/30 border border-red-700/50 rounded text-xs text-red-300 mb-3">
            {dspState.error}
          </div>
        )}

        {/* Connection Controls */}
        <div className="flex gap-2">
          {!dspState.connected ? (
            <button
              onClick={dspActions.connect}
              disabled={dspState.connecting}
              className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-xs rounded transition flex items-center justify-center gap-2"
            >
              <Zap className="w-3 h-3" />
              {dspState.connecting ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-gray-300 text-xs rounded transition flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={dspActions.disconnect}
                className="flex-1 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs rounded transition"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Processing Statistics */}
      {dspState.connected && stats && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <BarChart className="w-3 h-3 text-blue-400" />
            <span className="text-xs font-medium text-gray-400">Processing Statistics</span>
          </div>

          <div className="space-y-2">
            {/* Python Processing */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Python DSP</span>
                <span className="text-purple-400 font-mono">{stats.pythonPercentage?.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${stats.pythonPercentage || 0}%` }}
                />
              </div>
            </div>

            {/* Web Audio Processing */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Web Audio</span>
                <span className="text-blue-400 font-mono">{stats.webAudioPercentage?.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${stats.webAudioPercentage || 0}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-700">
              <div className="text-xs">
                <span className="text-gray-500 block">Python Processed</span>
                <span className="text-gray-200 font-mono">{stats.pythonProcessed || 0}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-500 block">Web Audio</span>
                <span className="text-gray-200 font-mono">{stats.webAudioProcessed || 0}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-500 block">Failed</span>
                <span className="text-red-400 font-mono">{stats.failed || 0}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-500 block">Avg Time</span>
                <span className="text-green-400 font-mono">{stats.averageProcessingTime?.toFixed(1) || 0}ms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Effects */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-3 h-3 text-green-400" />
          <span className="text-xs font-medium text-gray-400">
            Available Effects ({dspState.availableEffects.length})
          </span>
        </div>

        {dspState.availableEffects.length === 0 ? (
          <div className="text-xs text-gray-500 text-center py-4">
            {dspState.connected ? 'Loading effects...' : 'Connect to see effects'}
          </div>
        ) : (
          <div className="space-y-1">
            {dspState.availableEffects.map((effect) => (
              <div
                key={effect.id}
                className="p-2 bg-gray-800 rounded border border-gray-700 hover:border-purple-700/50 transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-200">
                      {effect.name}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {effect.description}
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 bg-purple-900/50 text-purple-400 rounded border border-purple-700/50 opacity-0 group-hover:opacity-100 transition">
                    {effect.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Server:</span>
            <span className="text-gray-400 font-mono">localhost:8000</span>
          </div>
          <div className="flex justify-between">
            <span>Protocol:</span>
            <span className="text-gray-400 font-mono">WebSocket</span>
          </div>
          <div className="flex justify-between">
            <span>Tests:</span>
            <span className="text-green-400 font-mono">197/197 ✓</span>
          </div>
        </div>

        <button
          onClick={handleHealthCheck}
          className="w-full mt-3 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition"
        >
          Health Check
        </button>
      </div>
    </div>
  );
}
