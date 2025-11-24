import { useState } from 'react';
import { Gauge, AlertCircle, Zap } from 'lucide-react';
import { useDAW } from '../contexts/DAWContext';

export default function SpectrumVisualizerPanel() {
  const { cpuUsage, buses } = useDAW();
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);

  // Mock frequency data for visualization
  const mockFrequencies = Array.from({ length: 32 }, (_, i) => {
    const frequency = 20 * Math.pow(2, (i / 32) * Math.log2(20000 / 20));
    const magnitude = Math.random() * 0.8 + (Math.sin(i / 10) * 0.2);
    return { frequency, magnitude };
  });

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="w-4 h-4 text-cyan-500" />
          <h2 className="text-sm font-semibold text-gray-100">Spectrum & Analysis</h2>
        </div>
        <p className="text-xs text-gray-500">Real-time frequency analysis</p>
      </div>

      {/* Spectrum Visualizer */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Frequency Display */}
        <div className="bg-gray-800 rounded p-3 mb-4">
          <p className="text-xs font-semibold text-gray-400 mb-3">Frequency Spectrum</p>
          <div className="flex items-end justify-between h-24 gap-0.5 bg-gray-900 p-2 rounded">
            {mockFrequencies.map((freq, idx) => (
              <div
                key={idx}
                className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t"
                style={{
                  height: `${freq.magnitude * 100}%`,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>20 Hz</span>
            <span>10 kHz</span>
            <span>20 kHz</span>
          </div>
        </div>

        {/* Frequency Bands */}
        <div className="bg-gray-800 rounded p-3">
          <p className="text-xs font-semibold text-gray-400 mb-3">Frequency Bands</p>
          <div className="space-y-2">
            {[
              { name: 'Bass', range: '20-250 Hz', color: 'bg-orange-500' },
              { name: 'Mids', range: '250 Hz-2 kHz', color: 'bg-green-500' },
              { name: 'Treble', range: '2-20 kHz', color: 'bg-blue-500' },
            ].map(band => (
              <div key={band.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">{band.name}</span>
                  <span className="text-gray-500">{band.range}</span>
                </div>
                <div className="h-2 bg-gray-900 rounded overflow-hidden">
                  <div
                    className={`h-full ${band.color}`}
                    style={{ width: `${Math.random() * 80 + 20}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="border-t border-gray-700 bg-gray-800 p-3">
        <button
          onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
          className="w-full flex items-center justify-between mb-2 hover:bg-gray-700 p-2 rounded transition-colors"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-semibold text-gray-400">System Metrics</span>
          </div>
          <span className={`transform transition-transform ${showDetailedMetrics ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        <div className={showDetailedMetrics ? 'block' : 'hidden'}>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">CPU Usage</span>
              <span className="text-gray-300 font-medium">{cpuUsage.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-gray-900 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-yellow-500"
                style={{ width: `${Math.min(cpuUsage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs pt-1">
              <span className="text-gray-400">Buses</span>
              <span className="text-gray-300 font-medium">{buses.length}</span>
            </div>
            {cpuUsage > 80 && (
              <div className="flex items-center gap-1 mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
                <AlertCircle className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-yellow-600">High CPU usage</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
