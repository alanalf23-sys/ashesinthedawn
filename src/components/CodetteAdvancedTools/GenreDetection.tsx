/**
 * Genre Detection Tab
 * Detects music genre from BPM, tracks, and project context
 */

import { useState, useEffect } from 'react';
import { Music, Loader, TrendingUp, Info } from 'lucide-react';
import {
  detectGenre,
  GenreDetectionResult,
  formatAPIError,
} from '../../services/codetteAdvancedApi';

interface GenreDetectionProps {
  bpm: number;
  tracks: Array<{ id: string; name: string; type: string }>;
  projectName: string;
}

export default function GenreDetection({ bpm, tracks, projectName }: GenreDetectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenreDetectionResult | null>(null);
  const [autoBpm, setAutoBpm] = useState(bpm);

  // Auto-detect on mount
  useEffect(() => {
    handleDetect();
  }, []); // Run once on mount

  const handleDetect = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await detectGenre(
        autoBpm,
        tracks.map((t) => ({ name: t.name, type: t.type })),
        projectName
      );
      setResult(data);
    } catch (err) {
      setError(formatAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.75) return 'text-green-400';
    if (confidence >= 0.5) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getConfidenceBarWidth = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Detection Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">BPM</label>
            <input
              type="number"
              value={autoBpm}
              onChange={(e) => setAutoBpm(Number(e.target.value))}
              min="40"
              max="300"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Project</label>
            <input
              type="text"
              value={projectName}
              disabled
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tracks</label>
            <input
              type="text"
              value={`${tracks.length} tracks`}
              disabled
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
        <button
          onClick={handleDetect}
          disabled={loading}
          className="mt-4 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <Music className="w-4 h-4" />
              Detect Genre
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-sm text-red-400">Error: {error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && result.success && (
        <div className="space-y-4">
          {/* Primary Genre */}
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg p-6 border border-purple-700/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                {result.genre}
              </h3>
              <span className={`text-lg font-semibold ${getConfidenceColor(result.confidence)}`}>
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full ${
                  result.confidence >= 0.75
                    ? 'bg-green-500'
                    : result.confidence >= 0.5
                    ? 'bg-yellow-500'
                    : 'bg-orange-500'
                }`}
                style={{ width: getConfidenceBarWidth(result.confidence) }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">BPM Range:</span>
                <span className="text-gray-200 font-medium">
                  {result.bpm_range[0]} - {result.bpm_range[1]} BPM
                </span>
              </div>
              {result.characteristics && result.characteristics.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400">Characteristics:</span>
                  <div className="flex flex-wrap gap-1">
                    {result.characteristics.map((char, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-purple-900/30 border border-purple-700/30 rounded text-xs text-purple-300"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Candidate Genres */}
          {result.candidates && result.candidates.length > 1 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">
                Other Possible Genres
              </h4>
              <div className="space-y-2">
                {result.candidates.slice(1).map((candidate, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-900 border border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-200">
                        {candidate.genre}
                      </span>
                      <span className={`text-sm ${getConfidenceColor(candidate.confidence)}`}>
                        {Math.round(candidate.confidence * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          candidate.confidence >= 0.75
                            ? 'bg-green-500'
                            : candidate.confidence >= 0.5
                            ? 'bg-yellow-500'
                            : 'bg-orange-500'
                        }`}
                        style={{ width: getConfidenceBarWidth(candidate.confidence) }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      BPM: {candidate.bpm_range[0]}-{candidate.bpm_range[1]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-300">
            <p className="font-semibold mb-1">How it works:</p>
            <p className="text-blue-400">
              Genre detection analyzes your project's BPM, track composition, and naming patterns
              to identify the most likely musical genre. Higher confidence scores indicate stronger
              genre indicators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
