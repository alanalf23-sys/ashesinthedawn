/**
 * Delay Sync Tab
 * Calculate tempo-synced delay times for rhythmic effects
 */

import { useState, useEffect } from 'react';
import { Clock, Loader, Copy, CheckCircle } from 'lucide-react';
import {
  calculateDelaySync,
  DelaySyncResult,
  formatAPIError,
} from '../../services/codetteAdvancedApi';

interface DelaySyncProps {
  bpm: number;
}

export default function DelaySync({ bpm: projectBpm }: DelaySyncProps) {
  const [bpm, setBpm] = useState(projectBpm);
  const [noteDivision, setNoteDivision] = useState<
    'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'dotted_quarter' | 'dotted_eighth' | 'triplet_quarter' | 'triplet_eighth'
  >('quarter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DelaySyncResult | null>(null);
  const [copied, setCopied] = useState(false);

  const noteDivisions = [
    { value: 'whole' as const, label: 'Whole Note (1/1)', icon: '??' },
    { value: 'half' as const, label: 'Half Note (1/2)', icon: '????' },
    { value: 'quarter' as const, label: 'Quarter Note (1/4)', icon: '?' },
    { value: 'eighth' as const, label: 'Eighth Note (1/8)', icon: '?' },
    { value: 'sixteenth' as const, label: '16th Note (1/16)', icon: '??????' },
    { value: 'dotted_quarter' as const, label: 'Dotted Quarter', icon: '?.' },
    { value: 'dotted_eighth' as const, label: 'Dotted Eighth', icon: '?.' },
    { value: 'triplet_quarter' as const, label: 'Quarter Triplet', icon: '?³' },
    { value: 'triplet_eighth' as const, label: 'Eighth Triplet', icon: '?³' },
  ];

  // Auto-calculate on mount and when values change
  useEffect(() => {
    handleCalculate();
  }, [bpm, noteDivision]);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const data = await calculateDelaySync(bpm, noteDivision);
      setResult(data);
    } catch (err) {
      setError(formatAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      const text = `BPM: ${result.bpm}\nNote Division: ${result.note_division}\nDelay Time: ${result.delay_ms}ms (${result.delay_seconds}s)`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Tempo & Note Division</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Project BPM</label>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              min="1"
              max="300"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Tempo: 1-300 BPM</p>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Note Division</label>
            <select
              value={noteDivision}
              onChange={(e) => setNoteDivision(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-purple-500"
            >
              {noteDivisions.map((div) => (
                <option key={div.value} value={div.value}>
                  {div.label} {div.icon}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-sm text-red-400">Error: {error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && result.success && !loading && (
        <div className="space-y-4">
          {/* Primary Result */}
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg p-6 border border-purple-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                Delay Time
              </h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs text-gray-300 transition"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>

            {/* Delay Time Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Milliseconds</p>
                <p className="text-3xl font-bold text-purple-300">{result.delay_ms} ms</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Seconds</p>
                <p className="text-3xl font-bold text-blue-300">{result.delay_seconds} s</p>
              </div>
            </div>

            {/* Beat Value */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Beat Value:</span>
                <span className="text-gray-200 font-medium">{result.beat_value}</span>
              </div>
            </div>
          </div>

          {/* Formula Explanation */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Calculation</h4>
            <div className="font-mono text-xs text-purple-300 bg-gray-800 p-3 rounded">
              {result.formula}
            </div>
          </div>

          {/* Use Case */}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">How to Use</h4>
            <p className="text-sm text-blue-300">{result.use_case}</p>
          </div>

          {/* Quick Reference Grid */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Quick Reference</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {noteDivisions.slice(0, 6).map((div) => {
                const divisionBpm = bpm;
                const divisionMap: Record<string, number> = {
                  whole: 4.0,
                  half: 2.0,
                  quarter: 1.0,
                  eighth: 0.5,
                  sixteenth: 0.25,
                  dotted_quarter: 1.5,
                };
                const beatValue = divisionMap[div.value] || 1;
                const delayMs = (60000 / divisionBpm) * beatValue;
                
                return (
                  <button
                    key={div.value}
                    onClick={() => setNoteDivision(div.value)}
                    className={`px-3 py-2 rounded text-left transition ${
                      noteDivision === div.value
                        ? 'bg-purple-900/40 border-2 border-purple-600 text-purple-300'
                        : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold">{div.icon} {div.value.replace('_', ' ')}</div>
                    <div className="text-xs mt-1">{Math.round(delayMs)}ms</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
        <p className="text-xs text-green-300">
          <span className="font-semibold">Pro Tip:</span> Use dotted and triplet divisions for
          interesting rhythmic patterns. Combine multiple delay times with different feedback
          settings for complex stereo delay effects.
        </p>
      </div>
    </div>
  );
}
